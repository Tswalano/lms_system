import { PrismaClient } from '../lib/generated/prisma';

const prisma = new PrismaClient();

/**
 * Wipes the review question bank (review_questions, question_sets,
 * question_set_questions, employee_question_set_assignments) so it can be
 * reseeded from scratch via `seed-review-questions.ts`.
 *
 * review_responses have a non-cascading FK to review_questions, so any
 * response ever recorded against a question must be deleted first — this
 * means running this script erases all self/peer/manager answers across
 * every review cycle, not just the question definitions. review_cycles and
 * performance_reviews themselves are left in place (now with no responses).
 * If you also want a clean slate for cycles/reviews, run the reset queries
 * in FEATURE_GUIDE.md §4 as well.
 *
 * Usage:
 *   npx ts-node -r dotenv/config prisma/clear-review-questions.ts          # dry run — reports counts only
 *   npx ts-node -r dotenv/config prisma/clear-review-questions.ts --yes    # actually deletes
 */
async function main() {
    const confirmed = process.argv.includes('--yes');

    const [responseCount, questionCount, setCount, assignmentCount] = await Promise.all([
        prisma.review_responses.count(),
        prisma.review_questions.count(),
        prisma.question_sets.count(),
        prisma.employee_question_set_assignments.count(),
    ]);

    console.log('This will permanently delete:');
    console.log(`  - ${responseCount} review response(s) — across ALL cycles (self/peer/manager answers)`);
    console.log(`  - ${questionCount} review question(s)`);
    console.log(`  - ${setCount} question set(s)`);
    console.log(`  - ${assignmentCount} employee question-set assignment(s)`);
    console.log('');
    console.log('review_cycles and performance_reviews are NOT deleted — they will remain,');
    console.log('just with their responses removed. See FEATURE_GUIDE.md §4 for the queries to');
    console.log('reset cycles/reviews too if you want a fully clean slate.');
    console.log('');

    if (!confirmed) {
        console.log('Dry run — no changes made. Re-run with --yes to actually delete.');
        return;
    }

    console.log('Deleting...');

    // Must run first: review_responses.question has no onDelete cascade,
    // so review_questions cannot be deleted while responses reference it.
    await prisma.review_responses.deleteMany({});

    // Cascades away question_set_questions automatically (FK onDelete: Cascade).
    await prisma.review_questions.deleteMany({});

    // Cascades away any remaining question_set_questions and all
    // employee_question_set_assignments automatically.
    await prisma.question_sets.deleteMany({});

    console.log('Done. Review questions and question sets are fully cleared.');
    console.log('Reseed with: npx ts-node -r dotenv/config prisma/seed-review-questions.ts');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
