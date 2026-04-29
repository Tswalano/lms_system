// Shared in-memory store + types for the Performance Review module.
// Dummy data only – resets on full page refresh.

export type RatingValue = 1 | 2 | 3 | 4 | 5 | null;

export const RATING_LABELS: Record<Exclude<RatingValue, null>, string> = {
    1: "Needs Improvement",
    2: "Basic",
    3: "Meets Expectations",
    4: "Exceeds Expectations",
    5: "Exceptional",
};

export const RATING_TONES: Record<Exclude<RatingValue, null>, string> = {
    1: "bg-red-500 text-white border-red-500",
    2: "bg-orange-500 text-white border-orange-500",
    3: "bg-amber-500 text-white border-amber-500",
    4: "bg-emerald-500 text-white border-emerald-500",
    5: "bg-violet-600 text-white border-violet-600",
};

export const RATING_TEXT_TONES: Record<Exclude<RatingValue, null>, string> = {
    1: "text-red-600 dark:text-red-400",
    2: "text-orange-600 dark:text-orange-400",
    3: "text-amber-600 dark:text-amber-400",
    4: "text-emerald-600 dark:text-emerald-400",
    5: "text-violet-600 dark:text-violet-400",
};

export const WEIGHTS = {
    manager: 50,
    peer: 30,
    self: 20,
};

export const REVIEW_PERIODS = ["2025 Cycle", "2026 Cycle"] as const;
export type ReviewPeriod = typeof REVIEW_PERIODS[number];

export interface SubCategory {
    id: string;
    name: string;
    description?: string;
    weight: number; // percent
}

export interface Category {
    id: string;
    name: string;
    subs: SubCategory[];
}

export const MANAGER_CATEGORIES: Category[] = [
    {
        id: "tech",
        name: "Technical Competence",
        subs: [
            { id: "delivery", name: "Task Delivery on Time", description: "% of tasks delivered on time", weight: 10 },
            { id: "quality", name: "Quality of Work (Rework Required)", description: "Fewer reworks = higher score", weight: 10 },
            { id: "innovation", name: "Problem Solving / Innovation", description: "Manager / peer feedback", weight: 10 },
        ],
    },
    {
        id: "delivery",
        name: "Delivery & Reliability",
        subs: [
            { id: "depend", name: "Dependability", description: "Meets deadlines reliably", weight: 10 },
            { id: "ownership", name: "Ownership & Accountability", description: "Takes initiative end-to-end", weight: 10 },
        ],
    },
    {
        id: "growth",
        name: "Growth & Collaboration",
        subs: [
            { id: "learn", name: "Continuous Learning", description: "New tools / certifications", weight: 10 },
            { id: "collab", name: "Cross-team Collaboration", description: "Works well across teams", weight: 10 },
        ],
    },
];

export interface PeerQuestion {
    id: string;
    category: string;
    question: string;
}

export const PEER_QUESTIONS: PeerQuestion[] = [
    { id: "comm", category: "Communication Effectiveness", question: "Do they communicate clearly and effectively during projects and with multiple stakeholders?" },
    { id: "client", category: "Client Alignment", question: "Do they suggest solutions aligned to the client's needs?" },
    { id: "deliver", category: "Reliability and Delivery", question: "Do they deliver tasks reliably and within agreed timelines?" },
    { id: "support", category: "Collaboration and Support", question: "Do they help troubleshoot or unblock team members when needed?" },
    { id: "infra", category: "Contribution to Infrastructure", question: "Do they contribute to infrastructure improvements (e.g. Terraform, CI/CD)?" },
];

export interface SelfQuestion {
    id: string;
    title: string;
    prompt: string;
    hint?: string;
}

export const SELF_QUESTIONS: SelfQuestion[] = [
    { id: "tech", title: "Technical Contribution", prompt: "Identify your most impactful technical contribution this period and provide a measurable outcome.", hint: "e.g. Reduced downtime by X%, Improved efficiency by Y hours/week" },
    { id: "lead", title: "Leadership in Projects", prompt: "List a project where you led or played a key role.", hint: "e.g. Delivered X weeks early, Saved Y costs, Improved performance by Z%" },
    { id: "learn", title: "Learning and Application", prompt: "What new tools or processes did you learn this period and how many times did you apply them in projects?" },
];

// ---------------- Store ----------------

export interface Employee {
    id: string;
    name: string;
    role: string;
    initials: string;
    manager: string;
}

export interface PeerReviewSubmission {
    reviewerId: string;
    ratings: Record<string, RatingValue>; // by question id
    feedback: Record<string, string>;
    notes: Record<string, string>;
    submitted: boolean;
    // Manager override of peer ratings (keyed by question id). Original ratings remain visible.
    overrides?: Record<string, RatingValue>;
    overrideNote?: string;
}

export interface SelfReviewSubmission {
    ratings: Record<string, RatingValue>;
    examples: Record<string, string>;
    feedback: Record<string, string>;
    metric: Record<string, string>;
    nextLearn: string;
    nextSupport: string;
    submitted: boolean;
    overrides?: Record<string, RatingValue>;
    overrideNote?: string;
}

export interface ManagerReviewSubmission {
    ratings: Record<string, RatingValue>; // by sub id
    notes: Record<string, string>;
    submitted: boolean;
}

export interface ReviewCycle {
    employeeId: string;
    period: ReviewPeriod;
    nominatedPeerIds: string[]; // 3 peer reviewers nominated by manager
    managerReview: ManagerReviewSubmission;
    selfReview: SelfReviewSubmission;
    peerReviews: PeerReviewSubmission[];
}

export const EMPLOYEES: Employee[] = [
    { id: "u1", name: "Glen Mogane", role: "Senior Cloud & DevOps Engineer", initials: "GM", manager: "Prenishni" },
    { id: "u2", name: "Jino Patel", role: "Backend Engineer", initials: "JP", manager: "Prenishni" },
    { id: "u3", name: "Sarah Chen", role: "Frontend Engineer", initials: "SC", manager: "Prenishni" },
    { id: "u4", name: "Marcus Reid", role: "Cloud Engineer", initials: "MR", manager: "Prenishni" },
    { id: "u5", name: "Aisha Khan", role: "QA Engineer", initials: "AK", manager: "Prenishni" },
    { id: "u6", name: "Diego Alvarez", role: "DevOps Engineer", initials: "DA", manager: "Prenishni" },
];

// "Currently logged in" employee for the Employee view.
export const CURRENT_EMPLOYEE_ID = "u1";

const blankManager = (): ManagerReviewSubmission => ({ ratings: {}, notes: {}, submitted: false });
const blankSelf = (): SelfReviewSubmission => ({ ratings: {}, examples: {}, feedback: {}, metric: {}, nextLearn: "", nextSupport: "", submitted: false });

const makeCycle = (employeeId: string, period: ReviewPeriod, peers: string[] = [], managerSubmitted = false): ReviewCycle => ({
    employeeId,
    period,
    nominatedPeerIds: peers,
    managerReview: managerSubmitted
        ? { ratings: Object.fromEntries(MANAGER_CATEGORIES.flatMap((c) => c.subs).map((s) => [s.id, 4 as RatingValue])), notes: {}, submitted: true }
        : blankManager(),
    selfReview: blankSelf(),
    peerReviews: peers.map((p) => ({ reviewerId: p, ratings: {}, feedback: {}, notes: {}, submitted: false })),
});

// Build a submitted peer review with given ratings per peer question id.
const seedPeer = (reviewerId: string, ratings: number[], feedback: string): PeerReviewSubmission => ({
    reviewerId,
    ratings: Object.fromEntries(PEER_QUESTIONS.map((q, i) => [q.id, (ratings[i] ?? 4) as RatingValue])),
    feedback: Object.fromEntries(PEER_QUESTIONS.map((q) => [q.id, feedback])),
    notes: {},
    submitted: true,
});

const seedSelf = (ratings: number[], submitted = true): SelfReviewSubmission => ({
    ratings: Object.fromEntries(SELF_QUESTIONS.map((q, i) => [q.id, (ratings[i] ?? 4) as RatingValue])),
    examples: Object.fromEntries(SELF_QUESTIONS.map((q) => [q.id, "Led migration to Terraform modules and reduced deploy time by 35%."])),
    feedback: Object.fromEntries(SELF_QUESTIONS.map((q) => [q.id, "Positive feedback from manager and platform team."])),
    metric: Object.fromEntries(SELF_QUESTIONS.map((q) => [q.id, "35% faster deployments, 2 outages avoided."])),
    nextLearn: "Deepen Kubernetes operator development and earn CKA certification.",
    nextSupport: "Dedicated learning time and access to a sandbox cluster.",
    submitted,
});

// Pre-seeded cycles. The current employee (u1) has manager nominated peers AND submitted manager review,
// so they can see their assignments + start their self-review. u1 also has all peer + self reviews submitted
// so the manager can view aggregated submissions and final scores immediately.
const u1Cycle: ReviewCycle = {
    employeeId: "u1",
    period: "2026 Cycle",
    nominatedPeerIds: ["u2", "u3", "u4"],
    managerReview: {
        ratings: Object.fromEntries(MANAGER_CATEGORIES.flatMap((c) => c.subs).map((s) => [s.id, 4 as RatingValue])),
        notes: { delivery: "Consistently ships ahead of schedule.", quality: "Low rework rate this quarter." },
        submitted: true,
    },
    selfReview: seedSelf([5, 4, 4]),
    peerReviews: [
        seedPeer("u2", [4, 5, 5, 4, 5], "Glen is incredibly reliable and a strong communicator across teams."),
        seedPeer("u3", [5, 4, 5, 5, 4], "Always willing to unblock others and shares knowledge generously."),
        seedPeer("u4", [4, 4, 5, 5, 5], "Sets the bar for infrastructure quality on the team."),
    ],
};

const u1Cycle2025: ReviewCycle = {
    employeeId: "u1",
    period: "2025 Cycle",
    nominatedPeerIds: ["u2", "u3", "u5"],
    managerReview: {
        ratings: {
            delivery: 5,
            quality: 4,
            innovation: 4,
            depend: 4,
            ownership: 5,
            learn: 4,
            collab: 5,
        },
        notes: {
            delivery: "Exceeded planned deliverables in the 2025 cycle.",
            collab: "Strong cross-functional communication with QA and platform teams.",
        },
        submitted: true,
    },
    selfReview: seedSelf([4, 4, 5]),
    peerReviews: [
        seedPeer("u2", [5, 4, 4, 5, 4], "Strong technical partner with dependable delivery habits."),
        seedPeer("u3", [4, 4, 5, 4, 4], "Helpful collaborator who consistently improved delivery quality."),
        seedPeer("u5", [4, 5, 4, 4, 5], "Good client awareness and strong support across the team."),
    ],
};

const seed: ReviewCycle[] = [
    u1Cycle2025,
    {
        ...makeCycle("u2", "2025 Cycle", ["u1", "u5", "u6"], true),
        selfReview: seedSelf([4, 3, 4]),
        peerReviews: [
            seedPeer("u1", [4, 4, 4, 4, 3], "Steady engineering output with room to grow technical influence."),
            seedPeer("u5", [4, 4, 4, 4, 4], "Solid back-end ownership during delivery."),
            seedPeer("u6", [3, 4, 4, 4, 3], "Reliable execution and pragmatic problem solving."),
        ],
    },
    {
        ...makeCycle("u3", "2025 Cycle", ["u1", "u2", "u4"], true),
        selfReview: seedSelf([4, 4, 4]),
    },
    makeCycle("u4", "2025 Cycle", ["u1", "u2"], true),
    makeCycle("u5", "2025 Cycle", [], false),
    makeCycle("u6", "2025 Cycle", [], false),
    u1Cycle,
    makeCycle("u2", "2026 Cycle", ["u1", "u5", "u6"], true), // u1 will see they need to review Jino
    makeCycle("u3", "2026 Cycle", [], false),
    makeCycle("u4", "2026 Cycle", ["u1", "u2"], true), // u1 also needs to review Marcus
    makeCycle("u5", "2026 Cycle", [], false),
    makeCycle("u6", "2026 Cycle", [], false),
];

// Singleton store + tiny pub/sub
let cycles: ReviewCycle[] = seed;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const performanceStore = {
    getAll: (period?: ReviewPeriod) => period ? cycles.filter((c) => c.period === period) : cycles,
    get: (employeeId: string, period?: ReviewPeriod) => cycles.find((c) => c.employeeId === employeeId && (!period || c.period === period)),
    subscribe: (fn: () => void) => {
        listeners.add(fn);
        return () => { listeners.delete(fn); };
    },
    update: (employeeId: string, period: ReviewPeriod, updater: (c: ReviewCycle) => ReviewCycle) => {
        cycles = cycles.map((c) => (c.employeeId === employeeId && c.period === period ? updater(c) : c));
        emit();
    },
};

import { useEffect, useState } from "react";
export function usePerformanceCycles(period?: ReviewPeriod) {
    const [, force] = useState(0);
    useEffect(() => performanceStore.subscribe(() => force((n) => n + 1)), []);
    return performanceStore.getAll(period);
}
export function usePerformanceCycle(employeeId: string, period?: ReviewPeriod) {
    const [, force] = useState(0);
    useEffect(() => performanceStore.subscribe(() => force((n) => n + 1)), []);
    return performanceStore.get(employeeId, period);
}

// ---- Score calculations ----
export function avgOf(ratings: Record<string, RatingValue>): number | null {
    const vals = Object.values(ratings).filter((v): v is Exclude<RatingValue, null> => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function managerScore(c: ReviewCycle): number | null {
    const avg = avgOf(c.managerReview.ratings);
    return avg == null ? null : (avg / 5) * 100;
}
// Returns the effective ratings for a submission, applying any manager overrides.
export function effectiveRatings<T extends { ratings: Record<string, RatingValue>; overrides?: Record<string, RatingValue> }>(
    s: T
): Record<string, RatingValue> {
    if (!s.overrides) return s.ratings;
    const out: Record<string, RatingValue> = { ...s.ratings };
    for (const [k, v] of Object.entries(s.overrides)) {
        if (v != null) out[k] = v;
    }
    return out;
}

export function selfScore(c: ReviewCycle): number | null {
    const avg = avgOf(effectiveRatings(c.selfReview));
    return avg == null ? null : (avg / 5) * 100;
}
export function peerScore(c: ReviewCycle): number | null {
    const submitted = c.peerReviews.filter((p) => p.submitted);
    if (!submitted.length) return null;
    const perReviewer = submitted
        .map((p) => avgOf(effectiveRatings(p)))
        .filter((v): v is number => v != null);
    if (!perReviewer.length) return null;
    return (perReviewer.reduce((a, b) => a + b, 0) / perReviewer.length / 5) * 100;
}
export function finalScore(c: ReviewCycle): number | null {
    const m = managerScore(c);
    const p = peerScore(c);
    const s = selfScore(c);
    if (m == null && p == null && s == null) return null;
    let total = 0;
    let weight = 0;
    if (m != null) { total += m * WEIGHTS.manager; weight += WEIGHTS.manager; }
    if (p != null) { total += p * WEIGHTS.peer; weight += WEIGHTS.peer; }
    if (s != null) { total += s * WEIGHTS.self; weight += WEIGHTS.self; }
    return weight ? total / weight : null;
}

export function completion(c: ReviewCycle): number {
    const totalSubs = MANAGER_CATEGORIES.flatMap((cat) => cat.subs).length;
    const managerDone = Object.values(c.managerReview.ratings).filter((v) => v != null).length / totalSubs;
    const selfDone = Object.values(c.selfReview.ratings).filter((v) => v != null).length / SELF_QUESTIONS.length;
    const peerDone = c.peerReviews.length
        ? c.peerReviews.filter((p) => p.submitted).length / c.peerReviews.length
        : 0;
    return Math.round(((managerDone + selfDone + peerDone) / 3) * 100);
}
