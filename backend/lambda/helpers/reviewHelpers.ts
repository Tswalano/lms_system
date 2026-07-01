import type { PrismaClient, review_questions } from '../../lib/generated/prisma';

/**
 * Returns only reviews where the linked employee is still active.
 * Applied at the API layer because the employee.isActive check cannot
 * be pushed into a Prisma `where` clause across a relation without a join.
 */
export function filterActiveEmployeeReviews<T extends { employee: { isActive?: boolean | null } | null }>(
    reviews: T[]
): T[] {
    return reviews.filter((r) => r.employee?.isActive !== false);
}

type ReviewQuestionType = 'self_review' | 'peer_review' | 'manager_appraisal' | 'next_steps';

export interface EffectiveQuestionOptions {
    employeeIds: string[];
    cycleId?: string | null;
    reviewTypes: ReviewQuestionType[];
    /**
     * When set (manager appraisals), the fallback keeps the exact-match filter the
     * endpoints used before question sets existed; curated sets also admit questions
     * with a NULL targetRole so new custom questions are not silently dropped.
     */
    targetRole?: string | null;
}

/**
 * Resolves the question list each employee should answer.
 *
 * Resolution order per employee:
 *   1. cycle-specific question-set assignment
 *   2. global question-set assignment (cycleId NULL)
 *   3. default question set (isDefault = true)
 *   4. all active questions of the requested reviewTypes (pre-question-set behavior)
 *
 * A resolved set that contains no questions for the requested reviewTypes falls
 * through to the next step so an incomplete set cannot blank out a review form.
 * With no rows in the question-set tables this returns exactly what the previous
 * global queries returned, which keeps existing cycles backward compatible.
 */
export async function getEffectiveQuestions(
    prisma: PrismaClient,
    { employeeIds, cycleId, reviewTypes, targetRole }: EffectiveQuestionOptions
): Promise<Map<string, review_questions[]>> {
    const questionFilter = {
        isActive: true,
        reviewType: { in: reviewTypes },
        ...(targetRole ? { OR: [{ targetRole }, { targetRole: null }] } : {}),
    };

    const [assignments, defaultSet, fallbackQuestions] = await Promise.all([
        employeeIds.length
            ? prisma.employee_question_set_assignments.findMany({
                  where: {
                      employeeId: { in: employeeIds },
                      OR: [...(cycleId ? [{ cycleId }] : []), { cycleId: null }],
                      set: { isActive: true },
                  },
                  select: { employeeId: true, questionSetId: true, cycleId: true },
              })
            : Promise.resolve([]),
        prisma.question_sets.findFirst({
            where: { isDefault: true, isActive: true },
            select: { id: true },
        }),
        prisma.review_questions.findMany({
            where: {
                isActive: true,
                reviewType: { in: reviewTypes },
                ...(targetRole ? { targetRole } : {}),
            },
            orderBy: { displayOrder: 'asc' },
        }),
    ]);

    const setIds = new Set(assignments.map((a) => a.questionSetId));
    if (defaultSet) setIds.add(defaultSet.id);

    const memberships = setIds.size
        ? await prisma.question_set_questions.findMany({
              where: { questionSetId: { in: [...setIds] }, question: questionFilter },
              include: { question: true },
              orderBy: { displayOrder: 'asc' },
          })
        : [];

    const questionsBySet = new Map<string, review_questions[]>();
    for (const m of memberships) {
        const list = questionsBySet.get(m.questionSetId) ?? [];
        list.push(m.question);
        questionsBySet.set(m.questionSetId, list);
    }

    const defaultSetQuestions = defaultSet ? questionsBySet.get(defaultSet.id) ?? [] : [];
    const globalFallback = defaultSetQuestions.length ? defaultSetQuestions : fallbackQuestions;

    const result = new Map<string, review_questions[]>();
    for (const employeeId of employeeIds) {
        const cycleAssignment = cycleId
            ? assignments.find((a) => a.employeeId === employeeId && a.cycleId === cycleId)
            : undefined;
        const globalAssignment = assignments.find((a) => a.employeeId === employeeId && a.cycleId === null);

        let questions: review_questions[] = [];
        for (const assignment of [cycleAssignment, globalAssignment]) {
            if (!assignment) continue;
            const setQuestions = questionsBySet.get(assignment.questionSetId) ?? [];
            if (setQuestions.length) {
                questions = setQuestions;
                break;
            }
        }
        result.set(employeeId, questions.length ? questions : globalFallback);
    }
    return result;
}
