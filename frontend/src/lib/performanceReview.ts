// Display constants and types for the Performance Review module.

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
