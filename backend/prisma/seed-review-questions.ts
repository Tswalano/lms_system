import { PrismaClient } from '../lib/generated/prisma';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface QuestionSeed {
    category: string;
    subcategory?: string;
    questionText: string;
    guidanceText?: string;
    questionType: 'text' | 'rating' | 'nomination';
    phase: 'self' | 'peer' | 'nomination';
    reviewType: 'self_review' | 'peer_review' | 'manager_appraisal' | 'next_steps';
    targetRole?: 'employee' | 'manager';
    weight?: number;
    displayOrder: number;
}

const managerAppraisalQuestions: QuestionSeed[] = [
    // Technical Competence — for individual contributors (employees)
    {
        category: 'Technical Competence',
        subcategory: 'Task Delivery on Time',
        questionText: 'Rate the engineer\'s ability to deliver tasks on time.',
        guidanceText: 'Consider percentage of tasks delivered within agreed timelines. 1 = Frequently late, 5 = Consistently early/on time.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 1,
    },
    {
        category: 'Technical Competence',
        subcategory: 'Quality of Work (Rework Required)',
        questionText: 'Rate the quality of the engineer\'s deliverables.',
        guidanceText: 'Fewer reworks = higher score. Consider bug rate, PR review feedback, and production incidents caused.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 2,
    },
    {
        category: 'Technical Competence',
        subcategory: 'Problem Solving / Innovation',
        questionText: 'Rate the engineer\'s ability to solve problems and innovate.',
        guidanceText: 'Based on manager and peer feedback. Did they propose new approaches, identify root causes quickly, or improve existing solutions?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 3,
    },
    // Delivery & Reliability — for individual contributors
    {
        category: 'Delivery & Reliability',
        subcategory: 'Dependability',
        questionText: 'Rate the engineer\'s dependability and reliability.',
        guidanceText: 'Does the engineer consistently meet deadlines and follow through on commitments without needing constant follow-up?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 4,
    },
    {
        category: 'Delivery & Reliability',
        subcategory: 'Ownership & Accountability',
        questionText: 'Rate the engineer\'s ownership and accountability.',
        guidanceText: 'Does the engineer take end-to-end ownership of features/tasks, raise blockers early, and take responsibility for outcomes?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 5,
    },
    // Growth & Collaboration — for individual contributors
    {
        category: 'Growth & Collaboration',
        subcategory: 'Continuous Learning',
        questionText: 'Rate the engineer\'s commitment to continuous learning.',
        guidanceText: 'Consider new tools, certifications, internal tech talks, self-study, or process improvements initiated.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 6,
    },
    {
        category: 'Growth & Collaboration',
        subcategory: 'Cross-team Collaboration',
        questionText: 'Rate the engineer\'s cross-team collaboration.',
        guidanceText: 'How well do they work with QA, product, and other engineering teams? Do they communicate blockers clearly and contribute to team success?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'employee' as const,
        weight: 10.0,
        displayOrder: 7,
    },
];

// Questions used when appraising a manager or admin
const managerRoleAppraisalQuestions: QuestionSeed[] = [
    {
        category: 'Strategic Leadership',
        subcategory: 'Vision & Goal Setting',
        questionText: 'Rate their ability to set a clear vision and measurable goals for the team.',
        guidanceText: 'Do they translate business priorities into actionable team objectives? Are goals communicated clearly and tracked?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 1,
    },
    {
        category: 'Strategic Leadership',
        subcategory: 'Decision Making',
        questionText: 'Rate their ability to make timely and sound decisions under pressure.',
        guidanceText: 'Consider how they handle ambiguity, escalate appropriately, and take accountability for outcomes of decisions made.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 2,
    },
    {
        category: 'Team Development',
        subcategory: 'Coaching & Mentoring',
        questionText: 'Rate how effectively they develop and grow team members.',
        guidanceText: 'Do they provide actionable feedback, create development opportunities, and actively unblock their team?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 3,
    },
    {
        category: 'Team Development',
        subcategory: 'Retention & Engagement',
        questionText: 'Rate their ability to maintain team morale, engagement, and retention.',
        guidanceText: 'Consider team attrition signals, engagement levels, and whether they address team concerns proactively.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 10.0,
        displayOrder: 4,
    },
    {
        category: 'Delivery & Accountability',
        subcategory: 'Team Output',
        questionText: 'Rate how consistently the team delivers commitments under their leadership.',
        guidanceText: 'Look at sprint/milestone delivery rates, quality of output, and how they manage scope changes and blockers.',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 5,
    },
    {
        category: 'Stakeholder Management',
        subcategory: 'Communication & Alignment',
        questionText: 'Rate their effectiveness in managing stakeholder relationships and cross-functional alignment.',
        guidanceText: 'Do they communicate team progress clearly, manage expectations, and build trust with stakeholders across the business?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 6,
    },
    {
        category: 'Culture & Collaboration',
        subcategory: 'Team Culture',
        questionText: 'Rate how effectively they foster a positive, inclusive, and collaborative team culture.',
        guidanceText: 'Do they model the values, encourage psychological safety, and promote knowledge sharing within and across teams?',
        questionType: 'rating' as const,
        phase: 'self' as const,
        reviewType: 'manager_appraisal' as const,
        targetRole: 'manager' as const,
        weight: 15.0,
        displayOrder: 7,
    },
];

const peerReviewQuestions: QuestionSeed[] = [
    {
        category: 'Communication Effectiveness',
        questionText: 'Do they communicate clearly and effectively during projects and with multiple stakeholders?',
        guidanceText: 'Consider how clearly they communicate blockers, status updates, and technical decisions to both technical and non-technical stakeholders.',
        questionType: 'rating' as const,
        phase: 'peer' as const,
        reviewType: 'peer_review' as const,
        displayOrder: 1,
    },
    {
        category: 'Client Alignment',
        questionText: 'Do they suggest solutions aligned to the client\'s needs?',
        guidanceText: 'Do they understand client priorities and tailor their technical solutions accordingly?',
        questionType: 'rating' as const,
        phase: 'peer' as const,
        reviewType: 'peer_review' as const,
        displayOrder: 2,
    },
    {
        category: 'Reliability and Delivery',
        questionText: 'Do they deliver tasks reliably and within agreed timelines?',
        guidanceText: 'Based on your direct experience working with them — do they follow through on commitments made to the team?',
        questionType: 'rating' as const,
        phase: 'peer' as const,
        reviewType: 'peer_review' as const,
        displayOrder: 3,
    },
    {
        category: 'Collaboration and Support',
        questionText: 'Do they help troubleshoot or unblock team members when needed?',
        guidanceText: 'Do they make themselves available to help others, share knowledge, and contribute to the team\'s overall progress?',
        questionType: 'rating' as const,
        phase: 'peer' as const,
        reviewType: 'peer_review' as const,
        displayOrder: 4,
    },
    {
        category: 'Contribution to Infrastructure',
        questionText: 'Do they contribute to infrastructure improvements (e.g. Terraform, CI/CD)?',
        guidanceText: 'Look for proactive contributions to DevOps tooling, automation, monitoring, or platform reliability.',
        questionType: 'rating' as const,
        phase: 'peer' as const,
        reviewType: 'peer_review' as const,
        displayOrder: 5,
    },
];

const selfReviewQuestions: QuestionSeed[] = [
    {
        category: 'Technical Contribution',
        questionText: 'Identify your most impactful technical contribution this period and provide a measurable outcome.',
        guidanceText: 'e.g. Reduced downtime by X%, Improved efficiency by Y hours/week, Delivered Z feature ahead of schedule.',
        questionType: 'text' as const,
        phase: 'self' as const,
        reviewType: 'self_review' as const,
        displayOrder: 1,
    },
    {
        category: 'Leadership in Projects',
        questionText: 'List a project where you led or played a key role.',
        guidanceText: 'e.g. Delivered X weeks early, Saved Y costs, Improved performance by Z%, Led a team of N engineers.',
        questionType: 'text' as const,
        phase: 'self' as const,
        reviewType: 'self_review' as const,
        displayOrder: 2,
    },
    {
        category: 'Learning and Application',
        questionText: 'What new tools or processes did you learn this period and how many times did you apply them in projects?',
        guidanceText: 'Include certifications, internal courses, self-study, and real-world application count.',
        questionType: 'text' as const,
        phase: 'self' as const,
        reviewType: 'self_review' as const,
        displayOrder: 3,
    },
];

const nextStepsQuestions: QuestionSeed[] = [
    {
        category: 'Next Steps',
        questionText: 'What do you want to learn or achieve in the next quarter?',
        guidanceText: 'Be specific — name the skill, certification, or project goal you are targeting.',
        questionType: 'text' as const,
        phase: 'nomination' as const,
        reviewType: 'next_steps' as const,
        displayOrder: 1,
    },
    {
        category: 'Next Steps',
        questionText: 'What kind of support or resources would help you be more effective?',
        guidanceText: 'e.g. dedicated learning time, access to sandbox environments, mentoring, reduced sprint load.',
        questionType: 'text' as const,
        phase: 'nomination' as const,
        reviewType: 'next_steps' as const,
        displayOrder: 2,
    },
];

async function main() {
    console.log('Seeding review questions...');

    const allQuestions = [
        ...managerAppraisalQuestions,
        ...managerRoleAppraisalQuestions,
        ...peerReviewQuestions,
        ...selfReviewQuestions,
        ...nextStepsQuestions,
    ];

    for (const q of allQuestions) {
        const stableId = crypto
            .createHash('md5')
            .update(`${q.category}|${q.subcategory ?? ''}|${q.questionText}|${q.reviewType}`)
            .digest('hex')
            .slice(0, 36);

        await prisma.review_questions.upsert({
            where: { id: stableId },
            update: {
                subcategory: q.subcategory ?? null,
                questionText: q.questionText,
                guidanceText: q.guidanceText ?? null,
                targetRole: q.targetRole ?? null,
                weight: q.weight ?? null,
                isActive: true,
            },
            create: {
                id: stableId,
                category: q.category,
                subcategory: q.subcategory ?? null,
                questionText: q.questionText,
                guidanceText: q.guidanceText ?? null,
                questionType: q.questionType,
                phase: q.phase,
                reviewType: q.reviewType,
                targetRole: q.targetRole ?? null,
                weight: q.weight ?? null,
                displayOrder: q.displayOrder,
                isActive: true,
            },
        });
        console.log(`  ✔ ${q.reviewType} | ${q.category}${q.subcategory ? ` / ${q.subcategory}` : ''}`);
    }

    console.log(`\nDone — seeded ${allQuestions.length} review questions.`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
