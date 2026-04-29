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
    if (peerAvg != null)    { total += (peerAvg / 5) * 100 * WEIGHTS.peer;       weight += WEIGHTS.peer; }
    if (selfAvg != null)    { total += (selfAvg / 5) * 100 * WEIGHTS.self;        weight += WEIGHTS.self; }
    return weight > 0 ? total / weight : null;
}

function avg(nums: number[]): number | null {
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function isAdmin(c: Context): boolean {
    const token = getDecodedToken(c);
    return token?.['custom:role'] === 'admin';
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
        if (!isAdmin(c)) return c.json({ success: false, message: 'Forbidden' }, 403);
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
        if (!isAdmin(c)) return c.json({ success: false, message: 'Forbidden' }, 403);
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

        return c.json({ success: true, message: `Cycle activated. ${assignments.length} peer assignments created.` });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to activate cycle' }, 500);
    }
});

// POST /performance/cycles/:id/close
app.post('/cycles/:id/close', async (c: Context): Promise<Response> => {
    try {
        if (!isAdmin(c)) return c.json({ success: false, message: 'Forbidden' }, 403);
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

        const selfReview = await prisma.performance_reviews.findFirst({
            where: {
                employeeId: userId,
                reviewType: 'self_review',
                ...(cycleId ? { cycleId } : {}),
            },
            include: {
                responses: { include: { question: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        const peerAssignments = await prisma.peer_review_assignments.findMany({
            where: {
                reviewerId: userId,
                ...(cycleId ? { cycleId } : {}),
            },
            include: {
                reviewee: { select: { id: true, firstName: true, lastName: true, jobTitle: true } },
                cycle: { select: { id: true, name: true } },
            },
        });

        return c.json({
            success: true,
            data: {
                selfReview,
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
                cycle: { select: { id: true, name: true } },
                performanceReview: { include: { responses: true } },
            },
        });

        if (!assignment) return c.json({ success: false, message: 'Assignment not found' }, 404);
        if (assignment.reviewerId !== userId) return c.json({ success: false, message: 'Access denied' }, 403);

        const questions = await prisma.review_questions.findMany({
            where: { reviewType: 'peer_review', isActive: true },
            orderBy: { displayOrder: 'asc' },
        });

        return c.json({
            success: true,
            data: {
                assignmentId: assignment.id,
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
                responses: assignment.performanceReview?.responses ?? [],
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

        // Verify the review belongs to this user
        const review = await prisma.performance_reviews.findUnique({ where: { id: data.reviewId } });
        if (!review) return c.json({ success: false, message: 'Review not found' }, 404);
        if (review.employeeId !== userId) return c.json({ success: false, message: 'Access denied' }, 403);

        const response = await prisma.review_responses.upsert({
            where: { performanceReviewId_questionId: { performanceReviewId: data.reviewId, questionId: data.questionId } },
            update: {
                ratingResponse: data.ratingResponse ?? null,
                textResponse: data.textResponse ?? null,
                nominationResponse: data.nominationResponse ?? null,
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
        if (review.employeeId !== userId) return c.json({ success: false, message: 'Access denied' }, 403);

        await prisma.performance_reviews.update({
            where: { id: reviewId },
            data: {
                status: 'employee_completed',
                employeeCompletedAt: new Date(),
            },
        });

        // If this is a peer review, mark the assignment as completed
        if (review.reviewType === 'peer_review' && review.revieweeId) {
            await prisma.peer_review_assignments.updateMany({
                where: {
                    performanceReviewId: reviewId,
                    reviewerId: userId,
                },
                data: { status: 'completed', completedAt: new Date() },
            });
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
        if (!isAdmin(c)) return c.json({ success: false, message: 'Forbidden' }, 403);
        const cycleId = c.req.query('cycleId');

        const employees = await prisma.users.findMany({
            where: { isActive: true },
            select: { id: true, firstName: true, lastName: true, jobTitle: true },
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
                employee: { id: emp.id, name: `${emp.firstName ?? ''} ${emp.lastName ?? ''}`.trim(), role: emp.jobTitle ?? '' },
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

export { app as performanceRoutes };
