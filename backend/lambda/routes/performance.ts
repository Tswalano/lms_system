import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from 'hono';
import { getUserId, getDecodedToken } from '../middleware/auth';
import { PrismaClient } from '../../lib/generated/prisma';

const app = new Hono();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const WEIGHTS = { manager: 50, peer: 30, self: 20 };

function weightedScore(
    managerAvg: number | null,
    peerAvg: number | null,
    selfAvg: number | null,
): number | null {
    let total = 0, weight = 0;
    if (managerAvg != null) { total += (managerAvg / 5) * 100 * WEIGHTS.manager; weight += WEIGHTS.manager; }
    if (peerAvg != null) { total += (peerAvg / 5) * 100 * WEIGHTS.peer; weight += WEIGHTS.peer; }
    if (selfAvg != null) { total += (selfAvg / 5) * 100 * WEIGHTS.self; weight += WEIGHTS.self; }
    return weight > 0 ? total / weight : null;
}

function avg(nums: number[]): number | null {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function isAdmin(c: Context): Promise<boolean> {
    const token = getDecodedToken(c);
    if (token?.['custom:role'] === 'admin') return true;
    // Fall back to DB role in case the accessToken was sent instead of idToken
    // (accessToken does not carry custom Cognito attributes)
    try {
        const userId = token?.['custom:userId'];
        if (!userId) return false;
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { role: true } });
        return user?.role === 'admin';
    } catch {
        return false;
    }
}

// Admins and managers share the same permissions for review management
async function isAdminOrManager(c: Context): Promise<boolean> {
    const token = getDecodedToken(c);
    const tokenRole = token?.['custom:role'];
    if (tokenRole === 'admin' || tokenRole === 'manager') return true;
    try {
        const userId = token?.['custom:userId'];
        if (!userId) return false;
        const user = await prisma.users.findUnique({ where: { id: userId }, select: { role: true } });
        return user?.role === 'admin' || user?.role === 'manager';
    } catch {
        return false;
    }
}

// ─────────────────────────────────────────────
// Notification helper
// ─────────────────────────────────────────────

async function notify(notifications: {
    recipientId: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    relatedId?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
}[]) {
    if (!notifications.length) return;
    try {
        await prisma.notifications.createMany({
            data: notifications.map((n) => ({
                recipientId: n.recipientId,
                type: 'action_required' as const,
                category: 'performance_reviews' as const,
                title: n.title,
                message: n.message,
                actionUrl: n.actionUrl ?? '/performance-review',
                actionText: n.actionText ?? 'View',
                relatedId: n.relatedId ?? null,
                relatedType: 'performance_review',
                priority: (n.priority ?? 'normal') as 'low' | 'normal' | 'high' | 'urgent',
                isRead: false,
                isArchived: false,
            })),
            skipDuplicates: false,
        });
    } catch (err) {
        console.error('[notify] Failed to create notifications:', err);
    }
}

// ─────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────

const createCycleSchema = z.object({
    name: z.string().min(1).max(100),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const saveResponseSchema = z.object({
    reviewId: z.string(),
    questionId: z.string(),
    ratingResponse: z.number().int().min(1).max(5).nullable().optional(),
    textResponse: z.string().nullable().optional(),
    nominationResponse: z.string().nullable().optional(),
    reviewerType: z.enum(['self', 'peer', 'manager']).optional(),
});

const overrideSchema = z.object({
    cycleId: z.string(),
    peerOverrides: z.array(z.object({
        reviewerId: z.string(),
        questionId: z.string(),
        value: z.number().int().min(1).max(5).nullable(),
        overrideNote: z.string().optional(),
    })).optional(),
    selfOverrides: z.array(z.object({
        questionId: z.string(),
        value: z.number().int().min(1).max(5).nullable(),
    })).optional(),
    selfOverrideNote: z.string().optional(),
});

// ─────────────────────────────────────────────
// CYCLE MANAGEMENT (admin)
// ─────────────────────────────────────────────

// POST /performance/cycles
app.post('/cycles', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) {
            return c.json({ success: false, message: "Forbidden" }, 403);
        }
        const userId = getUserId(c);
        const body = await c.req.json();
        const data = createCycleSchema.parse(body);

        const cycle = await prisma.review_cycles.create({
            data: {
                name: data.name,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                createdById: userId,
            },
        });

        return c.json({ success: true, data: cycle }, 201);
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to create cycle' }, 500);
    }
});

// GET /performance/cycles
app.get('/cycles', async (c: Context): Promise<Response> => {
    try {
        const cycles = await prisma.review_cycles.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                assignments: { select: { revieweeId: true, status: true } },
                reviews: { select: { employeeId: true, reviewType: true, status: true, overallRating: true } },
            },
        });

        const result = cycles.map((cycle) => {
            const uniqueEmployees = new Set(cycle.assignments.map((a) => a.revieweeId));
            const submittedManagerReviews = cycle.reviews.filter(
                (r) => r.reviewType === 'manager_appraisal' && r.status === 'final_review_complete'
            );
            const nominatedCount = new Set(
                cycle.assignments.filter((a) => a.status !== 'pending').map((a) => a.revieweeId)
            ).size;

            const ratingVals = submittedManagerReviews
                .map((r) => r.overallRating ? Number(r.overallRating) : null)
                .filter((v): v is number => v != null);
            const avgScore = ratingVals.length ? ratingVals.reduce((a, b) => a + b, 0) / ratingVals.length : null;

            return {
                id: cycle.id,
                name: cycle.name,
                startDate: cycle.startDate,
                endDate: cycle.endDate,
                status: cycle.status,
                createdAt: cycle.createdAt,
                employeeCount: uniqueEmployees.size,
                nominatedCount,
                submittedCount: submittedManagerReviews.length,
                avgFinalScore: avgScore,
            };
        });

        return c.json({ success: true, data: result });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch cycles' }, 500);
    }
});

// POST /performance/cycles/:id/activate
app.post('/cycles/:id/activate', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) {
            return c.json({ success: false, message: "Forbidden" }, 403);
        }
        const cycleId = c.req.param('id') as string;

        const cycle = await prisma.review_cycles.findUnique({ where: { id: cycleId } });
        if (!cycle) return c.json({ success: false, message: 'Cycle not found' }, 404);
        if (cycle.status !== 'draft') return c.json({ success: false, message: 'Only draft cycles can be activated' }, 400);

        const employees = await prisma.users.findMany({
            where: { isActive: true },
            select: { id: true, managerId: true },
        });

        const assignments: { cycleId: string; revieweeId: string; reviewerId: string }[] = [];

        for (const emp of employees) {
            const candidates = employees.filter(
                (e) => e.id !== emp.id && e.id !== emp.managerId
            );
            const peers = shuffleArray(candidates).slice(0, Math.min(3, candidates.length));
            for (const peer of peers) {
                assignments.push({ cycleId, revieweeId: emp.id as string, reviewerId: peer.id as string });
            }
        }

        await prisma.$transaction([
            prisma.review_cycles.update({ where: { id: cycleId }, data: { status: 'active' } }),
            prisma.peer_review_assignments.createMany({ data: assignments, skipDuplicates: true }),
        ]);

        // ── Create performance_review records ──────────────────────────────────
        const adminId = getUserId(c);

        const [selfQs, nextStepsQs] = await Promise.all([
            prisma.review_questions.findMany({
                where: { reviewType: 'self_review', isActive: true },
                orderBy: { displayOrder: 'asc' },
                select: { id: true },
            }),
            prisma.review_questions.findMany({
                where: { reviewType: 'next_steps', isActive: true },
                orderBy: { displayOrder: 'asc' },
                select: { id: true },
            }),
        ]);

        for (const emp of employees) {
            const empId = emp.id as string;
            const managerId = emp.managerId ?? adminId;

            // Self-review + pre-created response stubs so the employee page can save immediately
            let selfReview: { id: string } | null = null;
            try {
                selfReview = await prisma.performance_reviews.create({
                    data: { employeeId: empId, managerId, cycleId, reviewPeriod: cycle.name, reviewType: 'self_review' },
                    select: { id: true },
                });
            } catch { /* skip if already exists */ }

            if (selfReview) {
                await prisma.review_responses.createMany({
                    data: [...selfQs, ...nextStepsQs].map((q) => ({
                        performanceReviewId: selfReview!.id,
                        questionId: q.id,
                        employeeId: empId,
                        reviewerType: 'self' as const,
                    })),
                    skipDuplicates: true,
                });
            }

            // Manager appraisal — always create, using adminId as fallback manager
            try {
                await prisma.performance_reviews.create({
                    data: {
                        employeeId: empId,
                        managerId,
                        cycleId,
                        reviewPeriod: cycle.name,
                        reviewType: 'manager_appraisal',
                    },
                });
            } catch { /* skip if already exists */ }
        }

        // Fetch the assignments that were just created so we have their DB ids
        const dbAssignments = await prisma.peer_review_assignments.findMany({
            where: { cycleId },
            select: { id: true, revieweeId: true, reviewerId: true },
        });

        // Create peer_review records and link them back to their assignments
        for (const asgn of dbAssignments) {
            const reviewer = employees.find((e) => e.id === asgn.reviewerId);
            const reviewerManagerId = reviewer?.managerId ?? adminId;

            let peerReview: { id: string } | null = null;
            try {
                peerReview = await prisma.performance_reviews.create({
                    data: {
                        employeeId: asgn.reviewerId,
                        revieweeId: asgn.revieweeId,
                        managerId: reviewerManagerId,
                        cycleId,
                        reviewPeriod: cycle.name,
                        reviewType: 'peer_review',
                    },
                    select: { id: true },
                });
            } catch { /* skip if already exists */ }

            if (peerReview) {
                await prisma.peer_review_assignments.update({
                    where: { id: asgn.id },
                    data: { performanceReviewId: peerReview.id },
                });
            }
        }
        // ── End create performance_review records ──────────────────────────────

        // Notify all employees that their self-review is open (fire-and-forget)
        void notify(employees.map((emp) => ({
            recipientId: emp.id as string,
            title: `Review cycle "${cycle.name}" is now open`,
            message: `Your self-review for the ${cycle.name} cycle is now open. Please complete it before the cycle closes.`,
            actionUrl: '/performance-review',
            actionText: 'Start self-review',
            relatedId: cycleId,
            priority: 'high' as const,
        })));

        // Notify each peer reviewer once (deduplicated by reviewer)
        const reviewerIds = [...new Set(assignments.map((a) => a.reviewerId))];
        void notify(reviewerIds.map((reviewerId) => ({
            recipientId: reviewerId,
            title: `You have peer reviews to complete for "${cycle.name}"`,
            message: `You have been assigned peer reviews to complete for the ${cycle.name} cycle. Please complete them before the cycle closes.`,
            actionUrl: '/performance-review',
            actionText: 'View peer reviews',
            relatedId: cycleId,
            priority: 'normal' as const,
        })));

        return c.json({ success: true, message: `Cycle activated. ${assignments.length} peer assignments created.` });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to activate cycle' }, 500);
    }
});

// POST /performance/cycles/:id/sync  — idempotent: creates missing performance_review records for an active cycle
app.post('/cycles/:id/sync', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) {
            return c.json({ success: false, message: 'Forbidden' }, 403);
        }
        const cycleId = c.req.param('id') as string;
        const adminId = getUserId(c);

        const cycle = await prisma.review_cycles.findUnique({ where: { id: cycleId } });
        if (!cycle) return c.json({ success: false, message: 'Cycle not found' }, 404);
        if (cycle.status === 'closed') return c.json({ success: false, message: 'Cannot sync a closed cycle' }, 400);

        const [employees, selfQs, nextStepsQs, managerQs] = await Promise.all([
            prisma.users.findMany({ where: { isActive: true }, select: { id: true, managerId: true } }),
            prisma.review_questions.findMany({ where: { reviewType: 'self_review', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
            prisma.review_questions.findMany({ where: { reviewType: 'next_steps', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
            prisma.review_questions.findMany({ where: { reviewType: 'manager_appraisal', isActive: true }, orderBy: { displayOrder: 'asc' }, select: { id: true } }),
        ]);

        let created = { selfReviews: 0, managerAppraisals: 0, peerReviews: 0 };

        for (const emp of employees) {
            const empId = emp.id as string;
            const managerId = emp.managerId ?? adminId;

            // Self-review + response stubs
            let selfReview: { id: string } | null = null;
            try {
                selfReview = await prisma.performance_reviews.create({
                    data: { employeeId: empId, managerId, cycleId, reviewPeriod: cycle.name, reviewType: 'self_review' },
                    select: { id: true },
                });
                created.selfReviews++;
            } catch { /* already exists — fetch it to ensure stubs are created */
                selfReview = await prisma.performance_reviews.findFirst({
                    where: { employeeId: empId, reviewType: 'self_review', cycleId },
                    select: { id: true },
                });
            }

            if (selfReview) {
                await prisma.review_responses.createMany({
                    data: [...selfQs, ...nextStepsQs].map((q) => ({
                        performanceReviewId: selfReview!.id,
                        questionId: q.id,
                        employeeId: empId,
                        reviewerType: 'self' as const,
                    })),
                    skipDuplicates: true,
                });
            }

            // Manager appraisal — always create, using adminId as fallback manager
            try {
                const managerAppraisal = await prisma.performance_reviews.create({
                    data: { employeeId: empId, managerId, cycleId, reviewPeriod: cycle.name, reviewType: 'manager_appraisal' },
                    select: { id: true },
                });
                await prisma.review_responses.createMany({
                    data: managerQs.map((q) => ({
                        performanceReviewId: managerAppraisal.id,
                        questionId: q.id,
                        employeeId: empId,
                        reviewerType: 'manager' as const,
                    })),
                    skipDuplicates: true,
                });
                created.managerAppraisals++;
            } catch { /* already exists */ }
        }

        // Peer reviews — create missing records and link assignments
        const dbAssignments = await prisma.peer_review_assignments.findMany({
            where: { cycleId },
            select: { id: true, revieweeId: true, reviewerId: true, performanceReviewId: true },
        });

        for (const asgn of dbAssignments) {
            if (asgn.performanceReviewId) continue; // already linked

            const reviewer = employees.find((e) => e.id === asgn.reviewerId);
            const reviewerManagerId = reviewer?.managerId ?? adminId;

            let peerReview: { id: string } | null = null;
            try {
                peerReview = await prisma.performance_reviews.create({
                    data: {
                        employeeId: asgn.reviewerId,
                        revieweeId: asgn.revieweeId,
                        managerId: reviewerManagerId,
                        cycleId,
                        reviewPeriod: cycle.name,
                        reviewType: 'peer_review',
                    },
                    select: { id: true },
                });
                created.peerReviews++;
            } catch {
                peerReview = await prisma.performance_reviews.findFirst({
                    where: { employeeId: asgn.reviewerId, revieweeId: asgn.revieweeId, reviewType: 'peer_review', cycleId },
                    select: { id: true },
                });
            }

            if (peerReview) {
                await prisma.peer_review_assignments.update({
                    where: { id: asgn.id },
                    data: { performanceReviewId: peerReview.id },
                });
            }
        }

        return c.json({
            success: true,
            message: `Sync complete. Created: ${created.selfReviews} self-reviews, ${created.managerAppraisals} manager appraisals, ${created.peerReviews} peer reviews.`,
            data: created,
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to sync cycle' }, 500);
    }
});

// POST /performance/cycles/:id/close
app.post('/cycles/:id/close', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) {
            return c.json({ success: false, message: "Forbidden" }, 403);
        }
        const cycleId = c.req.param('id');

        await prisma.review_cycles.update({
            where: { id: cycleId },
            data: { status: 'closed' },
        });

        return c.json({ success: true, message: 'Cycle closed.' });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to close cycle' }, 500);
    }
});

// ─────────────────────────────────────────────
// EMPLOYEE ENDPOINTS
// ─────────────────────────────────────────────

// GET /performance/my-reviews?cycleId=
app.get('/my-reviews', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const cycleId = c.req.query('cycleId');

        const [selfReview, selfQuestions, nextStepsQuestions, peerAssignments] = await Promise.all([
            prisma.performance_reviews.findFirst({
                where: { employeeId: userId, reviewType: 'self_review', ...(cycleId ? { cycleId } : {}) },
                include: { responses: true },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.review_questions.findMany({
                where: { reviewType: 'self_review', isActive: true },
                orderBy: { displayOrder: 'asc' },
            }),
            prisma.review_questions.findMany({
                where: { reviewType: 'next_steps', isActive: true },
                orderBy: { displayOrder: 'asc' },
            }),
            prisma.peer_review_assignments.findMany({
                where: { reviewerId: userId, ...(cycleId ? { cycleId } : {}) },
                include: {
                    reviewee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                    cycle: { select: { id: true, name: true } },
                },
            }),
        ]);

        type ReviewResponse = NonNullable<typeof selfReview>['responses'][number];
        const buildQuestion = (q: typeof selfQuestions[number], responses: ReviewResponse[]) => {
            const resp = responses?.find((r) => r.questionId === q.id) ?? null;
            return {
                id: q.id,
                category: q.category,
                questionText: q.questionText,
                guidanceText: q.guidanceText,
                response: resp ? { ratingResponse: resp.ratingResponse, textResponse: resp.textResponse } : null,
            };
        };

        return c.json({
            success: true,
            data: {
                selfReview: selfReview
                    ? {
                          id: selfReview.id,
                          status: selfReview.status,
                          selfQuestions: selfQuestions.map((q) => buildQuestion(q, selfReview.responses)),
                          nextStepsQuestions: nextStepsQuestions.map((q) => buildQuestion(q, selfReview.responses)),
                      }
                    : null,
                peerAssignments: peerAssignments.map((a) => ({
                    assignmentId: a.id,
                    cycleId: a.cycleId,
                    cycleName: a.cycle.name,
                    status: a.status,
                    reviewee: {
                        id: a.reviewee.id,
                        name: `${a.reviewee.firstName ?? ''} ${a.reviewee.lastName ?? ''}`.trim(),
                        role: a.reviewee.jobTitle ?? '',
                    },
                })),
            },
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch reviews' }, 500);
    }
});

// GET /performance/my-peer-assignments?cycleId=
app.get('/my-peer-assignments', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const cycleId = c.req.query('cycleId');

        const assignments = await prisma.peer_review_assignments.findMany({
            where: { reviewerId: userId, ...(cycleId ? { cycleId } : {}) },
            include: {
                reviewee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                cycle: { select: { id: true, name: true } },
            },
            orderBy: { assignedAt: 'desc' },
        });

        return c.json({
            success: true,
            data: assignments.map((a) => ({
                assignmentId: a.id,
                cycleId: a.cycleId,
                cycleName: a.cycle.name,
                status: a.status,
                reviewee: {
                    id: a.reviewee.id,
                    name: `${a.reviewee.firstName ?? ''} ${a.reviewee.lastName ?? ''}`.trim(),
                    role: a.reviewee.jobTitle ?? '',
                },
            })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch peer assignments' }, 500);
    }
});

// GET /performance/peer-review/:assignmentId
app.get('/peer-review/:assignmentId', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const assignmentId = c.req.param('assignmentId');

        const assignment = await prisma.peer_review_assignments.findUnique({
            where: { id: assignmentId },
            include: {
                reviewee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                reviewer: { select: { managerId: true } },
                cycle: { select: { id: true, name: true } },
                performanceReview: { include: { responses: true } },
            },
        });

        if (!assignment) return c.json({ success: false, message: 'Assignment not found' }, 404);
        if (assignment.reviewerId !== userId) return c.json({ success: false, message: 'Access denied' }, 403);

        // Auto-create the peer review record if it hasn't been linked yet
        let reviewId: string | null = assignment.performanceReview?.id ?? null;
        let responses: NonNullable<typeof assignment.performanceReview>['responses'] = assignment.performanceReview?.responses ?? [];
        if (!reviewId && assignment.cycleId) {
            const created = await prisma.performance_reviews.create({
                data: {
                    employeeId: assignment.reviewerId,
                    revieweeId: assignment.revieweeId,
                    managerId: assignment.reviewer?.managerId ?? userId,
                    cycleId: assignment.cycleId,
                    reviewPeriod: assignment.cycle.name,
                    reviewType: 'peer_review',
                    status: 'peer_reviews_in_progress',
                },
                select: { id: true },
            });
            await prisma.peer_review_assignments.update({
                where: { id: assignment.id },
                data: { performanceReviewId: created.id, status: 'in_progress' },
            });
            reviewId = created.id;
            responses = [];
        }

        const questions = await prisma.review_questions.findMany({
            where: { reviewType: 'peer_review', isActive: true },
            orderBy: { displayOrder: 'asc' },
        });

        return c.json({
            success: true,
            data: {
                assignmentId: assignment.id,
                reviewId,
                status: assignment.status,
                reviewee: {
                    id: assignment.reviewee.id,
                    name: `${assignment.reviewee.firstName ?? ''} ${assignment.reviewee.lastName ?? ''}`.trim(),
                    role: assignment.reviewee.jobTitle ?? '',
                },
                cycle: { id: assignment.cycle.id, name: assignment.cycle.name },
                questions: questions.map((q) => ({
                    id: q.id,
                    category: q.category,
                    questionText: q.questionText,
                    guidanceText: q.guidanceText,
                })),
                responses,
            },
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch peer review' }, 500);
    }
});

// POST /performance/responses  — upsert a self or peer review response
app.post('/responses', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const body = await c.req.json();
        const data = saveResponseSchema.parse(body);

        // Verify the user is allowed to write responses for this review
        const review = await prisma.performance_reviews.findUnique({ where: { id: data.reviewId } });
        if (!review) return c.json({ success: false, message: 'Review not found' }, 404);
        const admin = await isAdmin(c);
        const canWrite =
            review.employeeId === userId ||
            (review.reviewType === 'manager_appraisal' && review.managerId === userId) ||
            (review.reviewType === 'manager_appraisal' && admin);
        if (!canWrite) return c.json({ success: false, message: 'Access denied' }, 403);

        const response = await prisma.review_responses.upsert({
            where: { performanceReviewId_questionId: { performanceReviewId: data.reviewId, questionId: data.questionId } },
            update: {
                // Only overwrite a field if it was explicitly included in the payload;
                // undefined means "leave unchanged" in Prisma update.
                ...(data.ratingResponse !== undefined && { ratingResponse: data.ratingResponse }),
                ...(data.textResponse !== undefined && { textResponse: data.textResponse }),
                ...(data.nominationResponse !== undefined && { nominationResponse: data.nominationResponse }),
                updatedAt: new Date(),
            },
            create: {
                performanceReviewId: data.reviewId,
                questionId: data.questionId,
                employeeId: userId,
                reviewerType: data.reviewerType ?? 'self',
                ratingResponse: data.ratingResponse ?? null,
                textResponse: data.textResponse ?? null,
                nominationResponse: data.nominationResponse ?? null,
            },
        });

        // Bump review to in_progress
        if (review.status === 'not_started') {
            await prisma.performance_reviews.update({
                where: { id: data.reviewId },
                data: { status: 'employee_in_progress' },
            });
        }

        return c.json({ success: true, data: response });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to save response' }, 500);
    }
});

// POST /performance/reviews/:id/submit
app.post('/reviews/:id/submit', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const reviewId = c.req.param('id');

        const review = await prisma.performance_reviews.findUnique({ where: { id: reviewId } });
        if (!review) return c.json({ success: false, message: 'Review not found' }, 404);
        const admin = await isAdmin(c);
        const canSubmit =
            review.employeeId === userId ||
            (review.reviewType === 'manager_appraisal' && review.managerId === userId) ||
            (review.reviewType === 'manager_appraisal' && admin);
        if (!canSubmit) return c.json({ success: false, message: 'Access denied' }, 403);

        const completedStatus = review.reviewType === 'manager_appraisal'
            ? 'final_review_complete'
            : 'employee_completed';

        await prisma.performance_reviews.update({
            where: { id: reviewId },
            data: {
                status: completedStatus,
                ...(review.reviewType === 'manager_appraisal'
                    ? { managerReviewCompletedAt: new Date() }
                    : { employeeCompletedAt: new Date() }),
            },
        });

        // If this is a peer review, mark the assignment as completed
        if (review.reviewType === 'peer_review' && review.revieweeId) {
            await prisma.peer_review_assignments.updateMany({
                where: { performanceReviewId: reviewId, reviewerId: userId },
                data: { status: 'completed', completedAt: new Date() },
            });

            // Check if all peer reviews for this reviewee+cycle are now done
            if (review.cycleId) {
                const [total, completed] = await Promise.all([
                    prisma.peer_review_assignments.count({
                        where: { revieweeId: review.revieweeId, cycleId: review.cycleId },
                    }),
                    prisma.peer_review_assignments.count({
                        where: { revieweeId: review.revieweeId, cycleId: review.cycleId, status: 'completed' },
                    }),
                ]);
                if (total > 0 && completed >= total) {
                    const [reviewee, cycle] = await Promise.all([
                        prisma.users.findUnique({ where: { id: review.revieweeId }, select: { firstName: true, lastName: true, managerId: true } }),
                        prisma.review_cycles.findUnique({ where: { id: review.cycleId }, select: { name: true } }),
                    ]);
                    if (reviewee?.managerId && cycle) {
                        const name = `${reviewee.firstName ?? ''} ${reviewee.lastName ?? ''}`.trim();
                        void notify([{
                            recipientId: reviewee.managerId,
                            title: `All peer reviews for ${name} are complete`,
                            message: `All ${total} peer reviews for ${name} in the "${cycle.name}" cycle have been submitted. You can now complete the manager appraisal.`,
                            actionUrl: `/performance-review-admin`,
                            actionText: 'View appraisals',
                            relatedId: review.revieweeId,
                            priority: 'high' as const,
                        }]);
                    }
                }
            }
        }

        // If this is a manager appraisal, notify the employee
        if (review.reviewType === 'manager_appraisal') {
            const cycle = review.cycleId
                ? await prisma.review_cycles.findUnique({ where: { id: review.cycleId }, select: { name: true } })
                : null;
            void notify([{
                recipientId: review.employeeId,
                title: 'Your manager appraisal has been completed',
                message: cycle
                    ? `Your manager has completed your appraisal for the "${cycle.name}" cycle.`
                    : 'Your manager has completed your appraisal.',
                actionUrl: '/performance-review',
                actionText: 'View review',
                relatedId: reviewId,
                priority: 'normal' as const,
            }]);
        }

        return c.json({ success: true, message: 'Review submitted.' });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to submit review' }, 500);
    }
});

// ─────────────────────────────────────────────
// MANAGER / ADMIN — SUBMISSIONS
// ─────────────────────────────────────────────

// GET /performance/submissions/:employeeId?cycleId=
app.get('/submissions/:employeeId', async (c: Context): Promise<Response> => {
    try {
        const employeeId = c.req.param('employeeId');
        const cycleId = c.req.query('cycleId');

        const employee = await prisma.users.findUnique({
            where: { id: employeeId },
            select: { id: true, firstName: true, lastName: true, jobTitle: true },
        });
        if (!employee) return c.json({ success: false, message: 'Employee not found' }, 404);

        const cycleFilter = cycleId ? { cycleId } : {};

        // Manager appraisal
        const managerReview = await prisma.performance_reviews.findFirst({
            where: { employeeId, reviewType: 'manager_appraisal', ...cycleFilter },
            include: { responses: { include: { question: true } } },
        });

        // Self review
        const selfReview = await prisma.performance_reviews.findFirst({
            where: { employeeId, reviewType: 'self_review', ...cycleFilter },
            include: { responses: { include: { question: true } } },
        });

        // Peer reviews
        const assignments = await prisma.peer_review_assignments.findMany({
            where: { revieweeId: employeeId, ...(cycleId ? { cycleId } : {}) },
            include: {
                reviewer: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                performanceReview: { include: { responses: { include: { question: true } } } },
            },
        });

        // Score calculations
        const managerRatings = managerReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? [];
        const managerAvg = avg(managerRatings);

        const submittedPeerReviews = assignments.filter((a) => a.status === 'completed' && a.performanceReview);
        const peerAverages = submittedPeerReviews.map((a) => {
            const vals = a.performanceReview!.responses.map((r) => r.overrideRating ?? r.ratingResponse).filter((v): v is number => v != null);
            return avg(vals);
        }).filter((v): v is number => v != null);
        const peerAvg = avg(peerAverages);

        const selfRatings = selfReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? [];
        const selfAvg = avg(selfRatings);

        const finalScore = weightedScore(managerAvg, peerAvg, selfAvg);

        return c.json({
            success: true,
            data: {
                employee: {
                    id: employee.id,
                    name: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim(),
                    role: employee.jobTitle ?? '',
                },
                managerReview,
                selfReview,
                peerAssignments: assignments.map((a) => ({
                    assignmentId: a.id,
                    status: a.status,
                    reviewer: {
                        id: a.reviewer.id,
                        name: `${a.reviewer.firstName ?? ''} ${a.reviewer.lastName ?? ''}`.trim(),
                        role: a.reviewer.jobTitle ?? '',
                    },
                    review: a.performanceReview,
                })),
                scores: {
                    managerScore: managerAvg != null ? (managerAvg / 5) * 100 : null,
                    peerScore: peerAvg != null ? (peerAvg / 5) * 100 : null,
                    selfScore: selfAvg != null ? (selfAvg / 5) * 100 : null,
                    finalScore,
                },
            },
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch submissions' }, 500);
    }
});

// POST /performance/submissions/:employeeId/override
app.post('/submissions/:employeeId/override', async (c: Context): Promise<Response> => {
    try {
        const employeeId = c.req.param('employeeId');
        const body = await c.req.json();
        const data = overrideSchema.parse(body);

        const ops: Promise<unknown>[] = [];

        // Peer overrides — write to review_responses.overrideRating
        if (data.peerOverrides?.length) {
            for (const o of data.peerOverrides) {
                ops.push(
                    prisma.review_responses.updateMany({
                        where: {
                            performanceReview: { employeeId, cycleId: data.cycleId, reviewType: 'peer_review' },
                            questionId: o.questionId,
                        },
                        data: { overrideRating: o.value, overrideNote: o.overrideNote ?? null },
                    })
                );
            }
        }

        // Self overrides
        if (data.selfOverrides?.length) {
            for (const o of data.selfOverrides) {
                ops.push(
                    prisma.review_responses.updateMany({
                        where: {
                            performanceReview: { employeeId, cycleId: data.cycleId, reviewType: 'self_review' },
                            questionId: o.questionId,
                        },
                        data: { overrideRating: o.value },
                    })
                );
            }
        }

        if (data.selfOverrideNote !== undefined) {
            ops.push(
                prisma.performance_reviews.updateMany({
                    where: { employeeId, cycleId: data.cycleId, reviewType: 'self_review' },
                    data: { finalSummary: data.selfOverrideNote },
                })
            );
        }

        await Promise.all(ops);

        return c.json({ success: true, message: 'Overrides saved.' });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to save overrides' }, 500);
    }
});

// GET /performance/admin/summary?cycleId=
app.get('/admin/summary', async (c: Context): Promise<Response> => {
    try {

        if (!(await isAdminOrManager(c))) {
            return c.json({ success: false, message: "Forbidden" }, 403);
        }

        const cycleId = c.req.query('cycleId');

        const employees = await prisma.users.findMany({
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true, jobTitle: true, role: true },
        });

        const results = await Promise.all(employees.map(async (emp) => {
            const [managerReview, selfReview, assignments] = await Promise.all([
                prisma.performance_reviews.findFirst({
                    where: { employeeId: emp.id, reviewType: 'manager_appraisal', ...(cycleId ? { cycleId } : {}) },
                    include: { responses: { select: { ratingResponse: true, overrideRating: true } } },
                }),
                prisma.performance_reviews.findFirst({
                    where: { employeeId: emp.id, reviewType: 'self_review', ...(cycleId ? { cycleId } : {}) },
                    include: { responses: { select: { ratingResponse: true, overrideRating: true } } },
                }),
                prisma.peer_review_assignments.findMany({
                    where: { revieweeId: emp.id, status: 'completed', ...(cycleId ? { cycleId } : {}) },
                    include: { performanceReview: { include: { responses: { select: { ratingResponse: true, overrideRating: true } } } } },
                }),
            ]);

            const mAvg = avg(managerReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? []);
            const sAvg = avg(selfReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? []);
            const pAverages = assignments
                .filter((a) => a.performanceReview)
                .map((a) => avg(a.performanceReview!.responses.map((r) => r.overrideRating ?? r.ratingResponse).filter((v): v is number => v != null)))
                .filter((v): v is number => v != null);
            const pAvg = avg(pAverages);

            return {
                employee: { id: emp.id, name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(), role: emp.jobTitle ?? '', systemRole: emp.role ?? 'employee' },
                managerReviewId: managerReview?.id ?? null,
                managerId: managerReview?.managerId ?? null,
                managerScore: mAvg != null ? (mAvg / 5) * 100 : null,
                peerScore: pAvg != null ? (pAvg / 5) * 100 : null,
                selfScore: sAvg != null ? (sAvg / 5) * 100 : null,
                finalScore: weightedScore(mAvg, pAvg, sAvg),
                nominatedPeers: assignments.length,
                reviewStatus: managerReview?.status ?? 'not_started',
            };
        }));

        return c.json({ success: true, data: results });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch admin summary' }, 500);
    }
});

// ─────────────────────────────────────────────
// MANAGER APPRAISAL ENDPOINTS
// ─────────────────────────────────────────────

// GET /performance/manager-reviews?cycleId=   — list appraisals the current user must write (admin sees all)
app.get('/manager-reviews', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const cycleId = c.req.query('cycleId');
        const admin = await isAdmin(c);

        // Admin can write appraisals for all employees; regular managers see only their own
        const where = admin
            ? { reviewType: 'manager_appraisal' as const, ...(cycleId ? { cycleId } : {}) }
            : { managerId: userId, reviewType: 'manager_appraisal' as const, ...(cycleId ? { cycleId } : {}) };

        const reviews = await prisma.performance_reviews.findMany({
            where,
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                cycle: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return c.json({
            success: true,
            data: reviews.map((r) => ({
                reviewId: r.id,
                status: r.status,
                cycleId: r.cycleId,
                cycleName: r.cycle?.name ?? '',
                employee: {
                    id: r.employee.id,
                    name: `${r.employee.firstName ?? ''} ${r.employee.lastName ?? ''}`.trim(),
                    role: r.employee.jobTitle ?? '',
                },
            })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch manager reviews' }, 500);
    }
});

// GET /performance/manager-review/:reviewId   — detail view for filling in a manager appraisal
app.get('/manager-review/:reviewId', async (c: Context): Promise<Response> => {
    try {
        const userId = getUserId(c);
        const reviewId = c.req.param('reviewId');

        const review = await prisma.performance_reviews.findUnique({
            where: { id: reviewId },
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, role: true } },
                cycle: { select: { id: true, name: true } },
                responses: true,
            },
        });

        if (!review) return c.json({ success: false, message: 'Review not found' }, 404);
        if (review.managerId !== userId && !(await isAdminOrManager(c))) return c.json({ success: false, message: 'Access denied' }, 403);
        if (review.employeeId === userId) return c.json({ success: false, message: 'You cannot write your own appraisal' }, 403);

        // Serve the appropriate question set based on the reviewee's system role
        const revieweeIsManager = ['admin', 'manager'].includes(review.employee.role ?? '');
        const questions = await prisma.review_questions.findMany({
            where: {
                reviewType: 'manager_appraisal',
                isActive: true,
                targetRole: revieweeIsManager ? 'manager' : 'employee',
            },
            orderBy: { displayOrder: 'asc' },
        });

        return c.json({
            success: true,
            data: {
                reviewId: review.id,
                status: review.status,
                cycle: { id: review.cycle?.id ?? '', name: review.cycle?.name ?? '' },
                employee: {
                    id: review.employee.id,
                    name: `${review.employee.firstName ?? ''} ${review.employee.lastName ?? ''}`.trim(),
                    role: review.employee.jobTitle ?? '',
                },
                questions: questions.map((q) => {
                    const resp = review.responses.find((r) => r.questionId === q.id);
                    return {
                        id: q.id,
                        category: q.category,
                        subcategory: q.subcategory,
                        questionText: q.questionText,
                        guidanceText: q.guidanceText,
                        response: resp ? { ratingResponse: resp.ratingResponse, textResponse: resp.textResponse } : null,
                    };
                }),
            },
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch manager appraisal' }, 500);
    }
});

// ─────────────────────────────────────────────
// CYCLE EXPORT  (admin / manager)
// ─────────────────────────────────────────────

// GET /performance/cycles/:id/export  — full scoring + feedback for a closed cycle
app.get('/cycles/:id/export', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdminOrManager(c))) return c.json({ success: false, message: 'Forbidden' }, 403);

        const cycleId = c.req.param('id');
        const cycle = await prisma.review_cycles.findUnique({ where: { id: cycleId } });
        if (!cycle) return c.json({ success: false, message: 'Cycle not found' }, 404);

        const employees = await prisma.users.findMany({
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true, jobTitle: true },
        });

        const rows = await Promise.all(employees.map(async (emp) => {
            const [managerReview, selfReview, peerAssignments] = await Promise.all([
                prisma.performance_reviews.findFirst({
                    where: { employeeId: emp.id, reviewType: 'manager_appraisal', cycleId },
                    include: {
                        responses: {
                            include: { question: { select: { category: true, subcategory: true } } },
                        },
                    },
                }),
                prisma.performance_reviews.findFirst({
                    where: { employeeId: emp.id, reviewType: 'self_review', cycleId },
                    include: {
                        responses: {
                            include: { question: { select: { category: true, questionText: true } } },
                        },
                    },
                }),
                prisma.peer_review_assignments.findMany({
                    where: { revieweeId: emp.id, status: 'completed', cycleId },
                    include: {
                        reviewer: { select: { firstName: true, lastName: true } },
                        performanceReview: {
                            include: {
                                responses: {
                                    include: { question: { select: { category: true } } },
                                },
                            },
                        },
                    },
                }),
            ]);

            const mRatings = managerReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? [];
            const sRatings = selfReview?.responses.map((r) => r.ratingResponse).filter((v): v is number => v != null) ?? [];
            const pAverages = peerAssignments
                .filter((a) => a.performanceReview)
                .map((a) => {
                    const vals = a.performanceReview!.responses.map((r) => r.overrideRating ?? r.ratingResponse).filter((v): v is number => v != null);
                    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                })
                .filter((v): v is number => v != null);

            const mAvg = mRatings.length ? mRatings.reduce((a, b) => a + b, 0) / mRatings.length : null;
            const sAvg = sRatings.length ? sRatings.reduce((a, b) => a + b, 0) / sRatings.length : null;
            const pAvg = pAverages.length ? pAverages.reduce((a, b) => a + b, 0) / pAverages.length : null;

            // Manager appraisal detail rows (one per response)
            const managerFeedback = (managerReview?.responses ?? []).map((r) => ({
                category: r.question.category,
                subcategory: r.question.subcategory ?? '',
                rating: r.ratingResponse,
                notes: r.textResponse ?? '',
            }));

            // Self-review text responses
            const selfFeedback = (selfReview?.responses ?? []).map((r) => ({
                category: r.question.category,
                questionText: r.question.questionText,
                response: r.textResponse ?? '',
            }));

            // Peer feedback (anonymised — no reviewer name in export)
            const peerFeedback = peerAssignments.flatMap((a) =>
                (a.performanceReview?.responses ?? []).map((r) => ({
                    reviewerName: `${a.reviewer.firstName ?? ''} ${a.reviewer.lastName ?? ''}`.trim(),
                    category: r.question.category,
                    rating: r.overrideRating ?? r.ratingResponse,
                }))
            );

            return {
                employeeName: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(),
                jobTitle: emp.jobTitle ?? '',
                managerScore: mAvg != null ? parseFloat(((mAvg / 5) * 100).toFixed(1)) : null,
                peerScore: pAvg != null ? parseFloat(((pAvg / 5) * 100).toFixed(1)) : null,
                selfScore: sAvg != null ? parseFloat(((sAvg / 5) * 100).toFixed(1)) : null,
                finalScore: weightedScore(mAvg, pAvg, sAvg),
                managerFeedback,
                selfFeedback,
                peerFeedback,
            };
        }));

        return c.json({
            success: true,
            data: {
                cycle: { id: cycle.id, name: cycle.name, startDate: cycle.startDate, endDate: cycle.endDate },
                employees: rows,
            },
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch export data' }, 500);
    }
});

// ─────────────────────────────────────────────
// PEER NOMINATIONS (admin)
// ─────────────────────────────────────────────

// GET /performance/nominations/:employeeId?cycleId=
app.get('/nominations/:employeeId', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdminOrManager(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const employeeId = c.req.param('employeeId');
        const cycleId = c.req.query('cycleId');

        const assignments = await prisma.peer_review_assignments.findMany({
            where: { revieweeId: employeeId, ...(cycleId ? { cycleId } : {}) },
            select: { id: true, reviewerId: true, status: true, performanceReviewId: true },
        });

        return c.json({
            success: true,
            data: assignments.map((a) => ({
                assignmentId: a.id,
                reviewerId: a.reviewerId,
                status: a.status,
                canRemove: a.status === 'pending' && !a.performanceReviewId,
            })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch nominations' }, 500);
    }
});

// PUT /performance/nominations/:employeeId  — replace peer assignments for an employee
app.put('/nominations/:employeeId', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdminOrManager(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const employeeId = c.req.param('employeeId') as string;
        const body = await c.req.json();
        const { cycleId, peerIds } = body as { cycleId: string; peerIds: string[] };

        if (!cycleId || !Array.isArray(peerIds)) {
            return c.json({ success: false, message: 'cycleId and peerIds are required' }, 400);
        }

        const cycle = await prisma.review_cycles.findUnique({ where: { id: cycleId } });
        if (!cycle) return c.json({ success: false, message: 'Cycle not found' }, 404);
        if (cycle.status === 'closed') return c.json({ success: false, message: 'Cannot modify a closed cycle' }, 400);

        const adminId = getUserId(c);

        const existing = await prisma.peer_review_assignments.findMany({
            where: { revieweeId: employeeId, cycleId },
            select: { id: true, reviewerId: true, status: true, performanceReviewId: true },
        });

        const existingIdSet = new Set(existing.map((a) => a.reviewerId));
        const newIdSet = new Set(peerIds);

        // Remove pending assignments not in the new set
        const toRemoveIds = existing
            .filter((a) => !newIdSet.has(a.reviewerId) && a.status === 'pending' && !a.performanceReviewId)
            .map((a) => a.id);
        if (toRemoveIds.length) {
            await prisma.peer_review_assignments.deleteMany({ where: { id: { in: toRemoveIds } } });
        }

        // Add new peers
        const toAdd = peerIds.filter((id) => !existingIdSet.has(id));
        if (toAdd.length) {
            await prisma.peer_review_assignments.createMany({
                data: toAdd.map((reviewerId) => ({ cycleId, revieweeId: employeeId, reviewerId })),
                skipDuplicates: true,
            });

            // For active cycles, create peer_review records and link them
            if (cycle.status === 'active') {
                const reviewerEmps = await prisma.users.findMany({
                    where: { isActive: true, id: { in: toAdd } },
                    select: { id: true, managerId: true },
                });

                for (const reviewer of reviewerEmps) {
                    const reviewerManagerId = reviewer.managerId ?? adminId;
                    let peerReview: { id: string } | null = null;
                    try {
                        peerReview = await prisma.performance_reviews.create({
                            data: {
                                employeeId: reviewer.id,
                                revieweeId: employeeId,
                                managerId: reviewerManagerId,
                                cycleId,
                                reviewPeriod: cycle.name,
                                reviewType: 'peer_review',
                            },
                            select: { id: true },
                        });
                    } catch {
                        peerReview = await prisma.performance_reviews.findFirst({
                            where: { employeeId: reviewer.id, revieweeId: employeeId, reviewType: 'peer_review', cycleId },
                            select: { id: true },
                        });
                    }
                    if (peerReview) {
                        await prisma.peer_review_assignments.updateMany({
                            where: { cycleId, revieweeId: employeeId, reviewerId: reviewer.id },
                            data: { performanceReviewId: peerReview.id },
                        });
                    }
                }
            }
        }

        return c.json({ success: true, message: 'Nominations updated.' });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to update nominations' }, 500);
    }
});

export { app as performanceRoutes };
