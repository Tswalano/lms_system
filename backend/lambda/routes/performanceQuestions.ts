import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from 'hono';
import { getUserId, getDecodedToken } from '../middleware/auth';
import { PrismaClient } from '../../lib/generated/prisma';

const app = new Hono();
const prisma = new PrismaClient();

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

// ─────────────────────────────────────────────
// Validation schemas
// ─────────────────────────────────────────────

const questionBaseSchema = z.object({
    category: z.string().min(1).max(100),
    subcategory: z.string().max(100).nullable().optional(),
    questionText: z.string().min(1),
    guidanceText: z.string().nullable().optional(),
    questionType: z.enum(['text', 'rating', 'nomination']),
    phase: z.enum(['self', 'peer', 'nomination']),
    reviewType: z.enum(['self_review', 'peer_review', 'manager_appraisal', 'next_steps']),
    targetRole: z.string().max(50).nullable().optional(),
    weight: z.number().nullable().optional(),
    displayOrder: z.number().int().optional(),
});

const questionUpdateSchema = questionBaseSchema.partial().extend({
    isActive: z.boolean().optional(),
});

const reorderSchema = z.object({
    orders: z.array(z.object({ id: z.string(), displayOrder: z.number().int() })).min(1),
});

const questionSetSchema = z.object({
    name: z.string().min(1).max(150),
    description: z.string().nullable().optional(),
    isDefault: z.boolean().optional(),
});

const setMembersSchema = z.object({
    questionIds: z.array(z.string()),
});

const setAssignmentSchema = z.object({
    cycleId: z.string().nullable().optional(),
    questionSetId: z.string().nullable(),
});

// ─────────────────────────────────────────────
// QUESTION CRUD (admin)
// ─────────────────────────────────────────────

// GET /performance/questions?reviewType=&includeInactive=
app.get('/questions', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const reviewType = c.req.query('reviewType');
        const includeInactive = c.req.query('includeInactive') === 'true';

        const questions = await prisma.review_questions.findMany({
            where: {
                ...(reviewType ? { reviewType: reviewType as 'self_review' | 'peer_review' | 'manager_appraisal' | 'next_steps' } : {}),
                ...(includeInactive ? {} : { isActive: true }),
            },
            include: { _count: { select: { responses: true, setLinks: true } } },
            orderBy: [{ reviewType: 'asc' }, { displayOrder: 'asc' }],
        });

        return c.json({
            success: true,
            data: questions.map((q) => ({
                ...q,
                weight: q.weight != null ? Number(q.weight) : null,
                responseCount: q._count.responses,
                setCount: q._count.setLinks,
            })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch questions' }, 500);
    }
});

// POST /performance/questions
app.post('/questions', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const data = questionBaseSchema.parse(await c.req.json());

        let displayOrder = data.displayOrder;
        if (displayOrder === undefined) {
            const last = await prisma.review_questions.findFirst({
                where: { reviewType: data.reviewType },
                orderBy: { displayOrder: 'desc' },
                select: { displayOrder: true },
            });
            displayOrder = (last?.displayOrder ?? 0) + 1;
        }

        const question = await prisma.review_questions.create({
            data: {
                category: data.category,
                subcategory: data.subcategory ?? null,
                questionText: data.questionText,
                guidanceText: data.guidanceText ?? null,
                questionType: data.questionType,
                phase: data.phase,
                reviewType: data.reviewType,
                targetRole: data.targetRole ?? null,
                weight: data.weight ?? null,
                displayOrder,
            },
        });

        return c.json({ success: true, data: question }, 201);
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to create question' }, 500);
    }
});

// POST /performance/questions/reorder
app.post('/questions/reorder', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const { orders } = reorderSchema.parse(await c.req.json());

        await prisma.$transaction(
            orders.map((o) =>
                prisma.review_questions.update({ where: { id: o.id }, data: { displayOrder: o.displayOrder } })
            )
        );

        return c.json({ success: true, message: 'Questions reordered.' });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to reorder questions' }, 500);
    }
});

// PUT /performance/questions/:id
app.put('/questions/:id', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const id = c.req.param('id');
        const data = questionUpdateSchema.parse(await c.req.json());

        const existing = await prisma.review_questions.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return c.json({ success: false, message: 'Question not found' }, 404);

        const question = await prisma.review_questions.update({
            where: { id },
            data: {
                ...(data.category !== undefined && { category: data.category }),
                ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
                ...(data.questionText !== undefined && { questionText: data.questionText }),
                ...(data.guidanceText !== undefined && { guidanceText: data.guidanceText }),
                ...(data.questionType !== undefined && { questionType: data.questionType }),
                ...(data.phase !== undefined && { phase: data.phase }),
                ...(data.reviewType !== undefined && { reviewType: data.reviewType }),
                ...(data.targetRole !== undefined && { targetRole: data.targetRole }),
                ...(data.weight !== undefined && { weight: data.weight }),
                ...(data.displayOrder !== undefined && { displayOrder: data.displayOrder }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        return c.json({ success: true, data: question });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to update question' }, 500);
    }
});

// DELETE /performance/questions/:id — soft-delete when responses exist, hard delete otherwise
app.delete('/questions/:id', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const id = c.req.param('id');

        const existing = await prisma.review_questions.findUnique({
            where: { id },
            select: { id: true, _count: { select: { responses: true } } },
        });
        if (!existing) return c.json({ success: false, message: 'Question not found' }, 404);

        if (existing._count.responses > 0) {
            await prisma.review_questions.update({ where: { id }, data: { isActive: false } });
            return c.json({
                success: true,
                data: { softDeleted: true },
                message: 'Question has recorded responses and was deactivated instead of deleted.',
            });
        }

        await prisma.review_questions.delete({ where: { id } });
        return c.json({ success: true, data: { softDeleted: false }, message: 'Question deleted.' });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to delete question' }, 500);
    }
});

// ─────────────────────────────────────────────
// QUESTION SETS (admin)
// ─────────────────────────────────────────────

// GET /performance/question-sets
app.get('/question-sets', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);

        const sets = await prisma.question_sets.findMany({
            where: { isActive: true },
            include: {
                _count: { select: { questions: true, assignments: true } },
                questions: {
                    select: { questionId: true, displayOrder: true },
                    orderBy: { displayOrder: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return c.json({
            success: true,
            data: sets.map((s) => ({
                id: s.id,
                name: s.name,
                description: s.description,
                isDefault: s.isDefault,
                createdAt: s.createdAt,
                questionCount: s._count.questions,
                assignmentCount: s._count.assignments,
                questionIds: s.questions.map((q) => q.questionId),
            })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch question sets' }, 500);
    }
});

// POST /performance/question-sets
app.post('/question-sets', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const data = questionSetSchema.parse(await c.req.json());
        const userId = getUserId(c);

        const set = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                await tx.question_sets.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
            }
            return tx.question_sets.create({
                data: {
                    name: data.name,
                    description: data.description ?? null,
                    isDefault: data.isDefault ?? false,
                    createdById: userId,
                },
            });
        });

        return c.json({ success: true, data: set }, 201);
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to create question set' }, 500);
    }
});

// PUT /performance/question-sets/:id
app.put('/question-sets/:id', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const id = c.req.param('id');
        const data = questionSetSchema.partial().parse(await c.req.json());

        const existing = await prisma.question_sets.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return c.json({ success: false, message: 'Question set not found' }, 404);

        const set = await prisma.$transaction(async (tx) => {
            if (data.isDefault) {
                await tx.question_sets.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
            }
            return tx.question_sets.update({
                where: { id },
                data: {
                    ...(data.name !== undefined && { name: data.name }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
                    updatedAt: new Date(),
                },
            });
        });

        return c.json({ success: true, data: set });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to update question set' }, 500);
    }
});

// DELETE /performance/question-sets/:id
app.delete('/question-sets/:id', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const id = c.req.param('id');

        const existing = await prisma.question_sets.findUnique({
            where: { id },
            select: { id: true, _count: { select: { assignments: true } } },
        });
        if (!existing) return c.json({ success: false, message: 'Question set not found' }, 404);
        if (existing._count.assignments > 0) {
            return c.json({
                success: false,
                message: 'This set is assigned to one or more employees. Unassign it before deleting.',
            }, 409);
        }

        await prisma.question_sets.delete({ where: { id } });
        return c.json({ success: true, message: 'Question set deleted.' });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to delete question set' }, 500);
    }
});

// PUT /performance/question-sets/:id/questions — replace membership in array order
app.put('/question-sets/:id/questions', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const id = c.req.param('id') as string;
        const { questionIds } = setMembersSchema.parse(await c.req.json());

        const existing = await prisma.question_sets.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return c.json({ success: false, message: 'Question set not found' }, 404);

        if (questionIds.length) {
            const found = await prisma.review_questions.findMany({
                where: { id: { in: questionIds } },
                select: { id: true },
            });
            const foundIds = new Set(found.map((q) => q.id));
            const missing = questionIds.filter((qid) => !foundIds.has(qid));
            if (missing.length) {
                return c.json({ success: false, message: 'One or more questions do not exist', data: { missing } }, 400);
            }
        }

        await prisma.$transaction([
            prisma.question_set_questions.deleteMany({ where: { questionSetId: id } }),
            prisma.question_set_questions.createMany({
                data: questionIds.map((questionId, index) => ({
                    questionSetId: id,
                    questionId,
                    displayOrder: index,
                })),
                skipDuplicates: true,
            }),
        ]);

        return c.json({
            success: true,
            message: 'Question set membership updated. Run cycle sync to apply the change to active cycles.',
        });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to update question set membership' }, 500);
    }
});

// ─────────────────────────────────────────────
// EMPLOYEE QUESTION-SET ASSIGNMENTS (admin)
// ─────────────────────────────────────────────

// GET /performance/question-set-assignments?cycleId=
app.get('/question-set-assignments', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const cycleId = c.req.query('cycleId');

        const assignments = await prisma.employee_question_set_assignments.findMany({
            where: cycleId ? { OR: [{ cycleId }, { cycleId: null }] } : {},
            include: {
                employee: { select: { id: true, firstName: true, lastName: true, jobTitle: true, isActive: true } },
                set: { select: { id: true, name: true } },
                cycle: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return c.json({
            success: true,
            data: assignments
                .filter((a) => a.employee.isActive !== false)
                .map((a) => ({
                    id: a.id,
                    employee: {
                        id: a.employee.id,
                        name: `${a.employee.firstName ?? ''} ${a.employee.lastName ?? ''}`.trim(),
                        role: a.employee.jobTitle ?? '',
                    },
                    questionSet: { id: a.set.id, name: a.set.name },
                    cycle: a.cycle ? { id: a.cycle.id, name: a.cycle.name } : null,
                    createdAt: a.createdAt,
                })),
        });
    } catch (e) {
        console.error(e);
        return c.json({ success: false, message: 'Failed to fetch question set assignments' }, 500);
    }
});

// PUT /performance/question-set-assignments/:employeeId — upsert or unassign (questionSetId: null)
app.put('/question-set-assignments/:employeeId', async (c: Context): Promise<Response> => {
    try {
        if (!(await isAdmin(c))) return c.json({ success: false, message: 'Forbidden' }, 403);
        const employeeId = c.req.param('employeeId') as string;
        const data = setAssignmentSchema.parse(await c.req.json());
        const cycleId = data.cycleId ?? null;
        const adminId = getUserId(c);

        const employee = await prisma.users.findUnique({ where: { id: employeeId }, select: { id: true, isActive: true } });
        if (!employee || employee.isActive === false) {
            return c.json({ success: false, message: 'Employee not found or inactive' }, 404);
        }

        // The (employeeId, cycleId) unique key allows multiple NULL cycleIds in MySQL,
        // so global assignments are matched with findFirst instead of a compound-key upsert.
        const existing = await prisma.employee_question_set_assignments.findFirst({
            where: { employeeId, cycleId },
            select: { id: true },
        });

        if (data.questionSetId === null) {
            if (existing) {
                await prisma.employee_question_set_assignments.delete({ where: { id: existing.id } });
            }
            return c.json({ success: true, message: 'Question set unassigned.' });
        }

        const set = await prisma.question_sets.findUnique({
            where: { id: data.questionSetId },
            select: { id: true, isActive: true },
        });
        if (!set || !set.isActive) return c.json({ success: false, message: 'Question set not found' }, 404);

        if (cycleId) {
            const cycle = await prisma.review_cycles.findUnique({ where: { id: cycleId }, select: { id: true, status: true } });
            if (!cycle) return c.json({ success: false, message: 'Cycle not found' }, 404);
            if (cycle.status === 'closed') return c.json({ success: false, message: 'Cannot modify a closed cycle' }, 400);
        }

        const assignment = existing
            ? await prisma.employee_question_set_assignments.update({
                  where: { id: existing.id },
                  data: { questionSetId: data.questionSetId, assignedById: adminId },
              })
            : await prisma.employee_question_set_assignments.create({
                  data: { employeeId, questionSetId: data.questionSetId, cycleId, assignedById: adminId },
              });

        return c.json({
            success: true,
            data: assignment,
            message: 'Question set assigned. Run cycle sync to apply the change to active cycles.',
        });
    } catch (e) {
        if (e instanceof z.ZodError) return c.json({ success: false, message: 'Validation error', errors: e.errors }, 400);
        console.error(e);
        return c.json({ success: false, message: 'Failed to assign question set' }, 500);
    }
});

export { app as performanceQuestionRoutes };
