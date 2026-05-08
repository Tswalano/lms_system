import { useState, useRef, useEffect } from "react";
import { TrendingUp, TrendingDown, Lock, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import RatingScale from "@/components/RatingScale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WEIGHTS, RATING_LABELS, RATING_TEXT_TONES, type RatingValue } from "@/lib/performanceReview";
import {
    usePerformanceCycles,
    useMyPerformanceReview,
    useMyPeerAssignments,
    usePerformanceSubmissions,
    useSaveResponse,
    useSubmitReview,
    type ReviewQuestion,
    type SubmissionsApi,
} from "@/hooks/usePerformanceReview";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, CheckCircle2, ClipboardList, Loader2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const EMPLOYEE_GRADIENTS = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-purple-500",
    "from-pink-500 to-rose-500",
    "from-cyan-500 to-blue-500",
    "from-teal-500 to-green-500",
];

const getEmployeeGradient = (id: string) => {
    const hash = id.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    return EMPLOYEE_GRADIENTS[Math.abs(hash) % EMPLOYEE_GRADIENTS.length];
};

const shellCardClass = "rounded-3xl border border-gray-200/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95";
const appTextareaClass = "rounded-2xl border-gray-200 bg-white/95 shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500";
const appPrimaryButtonClass = "rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";
const appOutlineButtonClass = "rounded-2xl border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";

const PerformanceReviewEmployeePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");

    const { data: allCycles = [] } = usePerformanceCycles();
    const cycles = allCycles;
    const activeCycleId = selectedCycleId || cycles.find((c) => c.status === "active")?.id || cycles[0]?.id || "";
    const selectedCycle = cycles.find((c) => c.id === activeCycleId);
    const isClosed = selectedCycle?.status === "closed";

    const { data: myReviews, isLoading: reviewsLoading } = useMyPerformanceReview(activeCycleId || undefined);
    const { data: peerAssignments = [] } = useMyPeerAssignments(activeCycleId || undefined);
    const { data: submissions } = usePerformanceSubmissions(user?.id, activeCycleId || undefined);

    const saveResponse = useSaveResponse();
    const submitReview = useSubmitReview();

    const selfReview = myReviews?.selfReview ?? null;
    const selfSubmitted = selfReview?.status === "submitted" || selfReview?.status === "employee_completed";

    // Collect latest values from child components; populated via onUpdate callbacks
    const selfResponsesRef = useRef<Record<string, { rating: RatingValue | null; text: string }>>({});
    const nextStepsTextRef = useRef<Record<string, string>>({});
    const selfResponsesInitialized = useRef(false);

    useEffect(() => {
        if (selfReview && !selfResponsesInitialized.current) {
            selfReview.selfQuestions.forEach((q) => {
                selfResponsesRef.current[q.id] = {
                    rating: (q.response?.ratingResponse as RatingValue) ?? null,
                    text: q.response?.textResponse ?? "",
                };
            });
            selfReview.nextStepsQuestions.forEach((q) => {
                nextStepsTextRef.current[q.id] = q.response?.textResponse ?? "";
            });
            selfResponsesInitialized.current = true;
        }
    }, [selfReview]);

    const handleSubmitSelfReview = async () => {
        if (!selfReview?.id) return;
        try {
            await Promise.all([
                ...selfReview.selfQuestions.map((q) => {
                    const resp = selfResponsesRef.current[q.id] ?? { rating: null, text: "" };
                    return saveResponse.mutateAsync({ reviewId: selfReview.id, questionId: q.id, ratingResponse: resp.rating, textResponse: resp.text });
                }),
                ...selfReview.nextStepsQuestions.map((q) =>
                    saveResponse.mutateAsync({ reviewId: selfReview.id, questionId: q.id, textResponse: nextStepsTextRef.current[q.id] ?? "" })
                ),
            ]);
            await submitReview.mutateAsync(selfReview.id);
            toast.success("Self-review submitted successfully");
        } catch {
            toast.error("Failed to submit self-review");
        }
    };

    const pendingPeerCount = peerAssignments.filter((a) => a.status !== "completed").length;

    if (reviewsLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading your review…</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">My Performance Review</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {user?.firstName} {user?.lastName ?? user?.email} · {selectedCycle?.name ?? "Performance Review"}
                                {isClosed && (
                                    <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                                        <Lock className="w-3 h-3" /> Cycle closed
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 items-end">
                        {cycles.length > 1 && (
                            <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
                                <SelectTrigger className="h-9 w-[200px] rounded-lg border-gray-200 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-800/90 text-sm">
                                    <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {cycles.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {submissions && (
                            <div className="flex items-center gap-3 flex-wrap">
                                <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={submissions.scores.managerScore} />
                                <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={submissions.scores.peerScore} />
                                <ScorePill label={`Self ${WEIGHTS.self}%`} value={submissions.scores.selfScore} />
                                <ScorePill label="Final Score" value={submissions.scores.finalScore} highlight />
                            </div>
                        )}
                    </div>
                </div>

                {isClosed ? (
                    <ClosedCycleSummary submissions={submissions ?? null} cycleName={selectedCycle?.name ?? ""} />
                ) : !selfReview ? (
                    <NoActiveCycleState />
                ) : (
                    <Tabs defaultValue="self">
                        <TabsList className="rounded-2xl border border-gray-200/80 bg-white/95 p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/95">
                            <TabsTrigger value="self" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                                Self-Review
                            </TabsTrigger>
                            <TabsTrigger value="peers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                                Reviews to complete
                                {pendingPeerCount > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                                        {pendingPeerCount}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="next" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                                Next Steps
                            </TabsTrigger>
                        </TabsList>

                        {/* SELF REVIEW */}
                        <TabsContent value="self" className="space-y-4 mt-4">
                            <div className={cn(shellCardClass, "overflow-hidden")}>
                                <div className="border-b border-gray-200/70 p-4 lg:p-5 dark:border-slate-700/70">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Self-Assessment</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rate your own performance and provide supporting evidence</p>
                                </div>
                                <div className="divide-y divide-gray-200/70 dark:divide-slate-700/70">
                                    {selfReview.selfQuestions.map((q) => (
                                        <SelfQuestionRow
                                            key={q.id}
                                            question={q}
                                            disabled={selfSubmitted}
                                            onUpdate={(rating, text) => { selfResponsesRef.current[q.id] = { rating, text }; }}
                                        />
                                    ))}
                                </div>
                                <div className="border-t border-gray-200/70 p-5 flex justify-end gap-2 dark:border-slate-700/70">
                                    <Button
                                        variant="outline"
                                        className={appOutlineButtonClass}
                                        onClick={() => navigate("/")}
                                    >
                                        Save & close
                                    </Button>
                                    <Button
                                        disabled={selfSubmitted || submitReview.isPending}
                                        className={appPrimaryButtonClass}
                                        onClick={handleSubmitSelfReview}
                                    >
                                        {selfSubmitted ? "Submitted" : submitReview.isPending ? "Submitting…" : "Submit self-review"}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* PEER REVIEWS ASSIGNED TO ME */}
                        <TabsContent value="peers" className="mt-4">
                            {peerAssignments.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-900/90">
                                    <div className="p-10 text-center">
                                        <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                        <p className="font-semibold text-gray-700 dark:text-gray-300">No peer reviews assigned yet</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            Once a cycle is activated and you're assigned as a peer reviewer, they'll appear here.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className={cn(shellCardClass, "overflow-hidden")}>
                                    <div className="border-b border-gray-200/70 p-4 lg:p-5 dark:border-slate-700/70">
                                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Assigned Peer Reviews</h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                            {peerAssignments.length} colleague{peerAssignments.length !== 1 ? "s" : ""} to review
                                        </p>
                                    </div>
                                    <div className="divide-y divide-gray-200/70 dark:divide-slate-700/70">
                                        {peerAssignments.map((assignment) => {
                                            const gradient = getEmployeeGradient(assignment.reviewee.id);
                                            const initials = getInitials(assignment.reviewee.name);
                                            const completed = assignment.status === "completed";
                                            const inProgress = assignment.status === "in_progress";
                                            return (
                                                <div key={assignment.assignmentId} className="p-5 flex items-center gap-4">
                                                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-sm`}>
                                                        {initials}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{assignment.reviewee.name}</h3>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{assignment.reviewee.role}</p>
                                                        <div className="mt-2">
                                                            <Progress
                                                                value={completed ? 100 : inProgress ? 50 : 0}
                                                                className="h-1.5 flex-1 max-w-[200px]"
                                                            />
                                                        </div>
                                                    </div>
                                                    {completed && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
                                                            <CheckCircle2 className="w-3 h-3" /> Submitted
                                                        </span>
                                                    )}
                                                    <Button
                                                        onClick={() => navigate(`/performance-review/peer/${assignment.assignmentId}`)}
                                                        className={cn(appPrimaryButtonClass, "flex-shrink-0")}
                                                    >
                                                        {completed ? "View" : inProgress ? "Continue" : "Start"}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* NEXT STEPS */}
                        <TabsContent value="next" className="mt-4 space-y-4">
                            <div className={cn(shellCardClass, "overflow-hidden")}>
                                <div className="border-b border-gray-200/70 p-4 lg:p-5 dark:border-slate-700/70">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Next Steps & Development Goals</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Set your intentions for the next quarter</p>
                                </div>
                                <div className="p-5 space-y-5">
                                    {selfReview.nextStepsQuestions.length > 0 ? (
                                        selfReview.nextStepsQuestions.map((q) => (
                                            <NextStepsTextarea
                                                key={q.id}
                                                question={q}
                                                disabled={selfSubmitted}
                                                onUpdate={(text) => { nextStepsTextRef.current[q.id] = text; }}
                                            />
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            Next steps questions will appear once your self-review is available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                )}
            </div>
        </div>
    );
};

const SelfQuestionRow = ({
    question,
    disabled,
    onUpdate,
}: {
    question: ReviewQuestion;
    disabled: boolean;
    onUpdate: (rating: RatingValue | null, text: string) => void;
}) => {
    // Local state for text so rating clicks don't wipe unsaved text
    const [localText, setLocalText] = useState(question.response?.textResponse ?? "");
    const [localRating, setLocalRating] = useState<RatingValue | null>((question.response?.ratingResponse as RatingValue) ?? null);
    const hasSyncedRef = useRef(false);

    // Only sync from props on initial mount, not on every re-render
    useEffect(() => {
        if (!hasSyncedRef.current) {
            setLocalText(question.response?.textResponse ?? "");
            setLocalRating((question.response?.ratingResponse as RatingValue) ?? null);
            hasSyncedRef.current = true;
        }
    }, [question.response?.textResponse, question.response?.ratingResponse]);

    return (
        <div className="p-5">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{question.category}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{question.questionText}</p>
                    {question.guidanceText && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">{question.guidanceText}</p>
                    )}
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Impact Score</p>
                    <RatingScale
                        size="sm"
                        disabled={disabled}
                        value={localRating}
                        onChange={(v) => {
                            setLocalRating(v);
                            onUpdate(v, localText);
                        }}
                    />
                </div>
            </div>
            <Textarea
                disabled={disabled}
                placeholder="Describe your contribution, feedback received, and any measurable outcomes…"
                value={localText}
                onChange={(e) => {
                    setLocalText(e.target.value);
                    onUpdate(localRating, e.target.value);
                }}
                className={cn(
                    "rounded-2xl border-gray-200 bg-white/95 shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500",
                    "min-h-[96px] text-sm"
                )}
            />
        </div>
    );
};

const NextStepsTextarea = ({
    question,
    disabled,
    onUpdate,
}: {
    question: ReviewQuestion;
    disabled: boolean;
    onUpdate: (text: string) => void;
}) => {
    const [localText, setLocalText] = useState(question.response?.textResponse ?? "");
    const hasSyncedRef = useRef(false);

    useEffect(() => {
        if (!hasSyncedRef.current) {
            setLocalText(question.response?.textResponse ?? "");
            hasSyncedRef.current = true;
        }
    }, [question.response?.textResponse]);

    return (
        <div className="space-y-2">
            <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold block">
                {question.questionText}
            </label>
            <Textarea
                disabled={disabled}
                placeholder={question.guidanceText ?? "Describe your goals…"}
                value={localText}
                onChange={(e) => {
                    setLocalText(e.target.value);
                    onUpdate(e.target.value);
                }}
                className={cn(appTextareaClass, "min-h-[140px]")}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// NoActiveCycleState — ghost cards behind a frosted message, à la Documents page
// ─────────────────────────────────────────────────────────────────────────────

const GHOST_CARDS = [
    { title: "Technical Contribution", desc: "Rate your most impactful technical work this period", accent: "border-l-blue-500", icon: "bg-blue-500" },
    { title: "Leadership in Projects", desc: "Describe a project where you led or played a key role", accent: "border-l-purple-500", icon: "bg-purple-500" },
    { title: "Learning & Application", desc: "New tools or processes you applied in projects", accent: "border-l-cyan-500", icon: "bg-cyan-500" },
    { title: "Peer Review — Colleague A", desc: "Review a colleague's performance this cycle", accent: "border-l-indigo-500", icon: "bg-indigo-500" },
    { title: "Next Steps & Goals", desc: "Set your development intentions for the next quarter", accent: "border-l-emerald-500", icon: "bg-emerald-500" },
    { title: "Collaboration & Communication", desc: "How effectively did you work across teams?", accent: "border-l-rose-500", icon: "bg-rose-500" },
];

const NoActiveCycleState = () => (
    <div className="relative rounded-3xl overflow-hidden">
        {/* Ghost cards — blurred, dimmed backdrop */}
        <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1 pointer-events-none select-none"
            style={{ filter: "blur(3px)", opacity: 0.35 }}
            aria-hidden
        >
            {GHOST_CARDS.map((card) => (
                <div
                    key={card.title}
                    className={`bg-white dark:bg-slate-800 rounded-xl border border-l-4 ${card.accent} border-gray-200 dark:border-slate-700 p-4`}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 ${card.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <ClipboardList className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{card.title}</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{card.desc}</p>
                    <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                        <div className={`h-full rounded-full ${card.icon} opacity-30`} style={{ width: "60%" }} />
                    </div>
                </div>
            ))}
        </div>

        {/* Frosted glass overlay + message */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 dark:bg-slate-900/70 backdrop-blur-[2px] rounded-3xl px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center mb-4 shadow-sm">
                <AlertCircle className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No active review cycle</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                Your questionnaire will appear here once a review cycle is activated and you are enrolled.
            </p>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// ClosedCycleSummary — shown when the selected cycle is closed
// ─────────────────────────────────────────────────────────────────────────────

interface CategoryStat {
    category: string;
    avgRating: number;
    source: "manager" | "peer" | "self";
}

function buildCategoryStats(submissions: SubmissionsApi): CategoryStat[] {
    const map: Record<string, { sum: number; count: number; source: "manager" | "peer" | "self" }> = {};

    const add = (category: string, rating: number | null, source: "manager" | "peer" | "self") => {
        if (rating == null) return;
        if (!map[category]) map[category] = { sum: 0, count: 0, source };
        map[category].sum += rating;
        map[category].count += 1;
    };

    submissions.managerReview?.responses.forEach((r) => add(r.question.category, r.ratingResponse, "manager"));
    submissions.selfReview?.responses.forEach((r) => add(r.question.category, r.ratingResponse, "self"));
    submissions.peerAssignments.forEach((pa) =>
        pa.review?.responses.forEach((r) => add(r.question.category, r.overrideRating ?? r.ratingResponse, "peer"))
    );

    return Object.entries(map)
        .map(([category, { sum, count, source }]) => ({ category, avgRating: sum / count, source }))
        .sort((a, b) => b.avgRating - a.avgRating);
}

const ratingBarColor = (avg: number) => {
    if (avg >= 4.5) return "bg-violet-500";
    if (avg >= 3.5) return "bg-emerald-500";
    if (avg >= 2.5) return "bg-amber-500";
    if (avg >= 1.5) return "bg-orange-500";
    return "bg-red-500";
};

const ClosedCycleSummary = ({ submissions, cycleName }: { submissions: SubmissionsApi | null; cycleName: string }) => {
    if (!submissions) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">Cycle closed</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                    Results for <strong>{cycleName}</strong> are not yet available. Check back after the admin publishes scores.
                </p>
            </div>
        );
    }

    const { scores } = submissions;
    const stats = buildCategoryStats(submissions);
    const strengths = stats.filter((s) => s.avgRating >= 3.5);
    const improvements = stats.filter((s) => s.avgRating < 3);

    return (
        <div className="space-y-5">
            {/* Score summary */}
            <div className={cn(shellCardClass, "p-5")}>
                <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
                        Final Scores · {cycleName}
                    </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: `Manager (${WEIGHTS.manager}%)`, value: scores.managerScore },
                        { label: `Peer (${WEIGHTS.peer}%)`, value: scores.peerScore },
                        { label: `Self (${WEIGHTS.self}%)`, value: scores.selfScore },
                        { label: "Final Score", value: scores.finalScore, highlight: true },
                    ].map(({ label, value, highlight }) => (
                        <div key={label} className={cn(
                            "rounded-2xl border p-3 text-center",
                            highlight
                                ? "border-blue-200 bg-blue-50/80 dark:border-blue-700 dark:bg-blue-900/20"
                                : "border-gray-200 bg-gray-50/80 dark:border-slate-700 dark:bg-slate-800/60"
                        )}>
                            <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                            <p className={cn(
                                "text-2xl font-bold",
                                value == null
                                    ? "text-gray-300 dark:text-slate-600"
                                    : highlight
                                        ? "text-blue-700 dark:text-blue-300"
                                        : "text-emerald-700 dark:text-emerald-300"
                            )}>
                                {value == null ? "—" : value.toFixed(1)}
                            </p>
                            {value != null && (
                                <p className={cn("text-[11px] mt-0.5", RATING_TEXT_TONES[Math.round(value) as 1 | 2 | 3 | 4 | 5] ?? "text-gray-500")}>
                                    {RATING_LABELS[Math.round(value) as 1 | 2 | 3 | 4 | 5] ?? ""}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Category breakdown */}
            {stats.length > 0 && (
                <div className={cn(shellCardClass, "overflow-hidden")}>
                    <div className="border-b border-gray-200/70 p-4 dark:border-slate-700/70">
                        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Performance by Category</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Average ratings across all reviewers</p>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {stats.map(({ category, avgRating }) => (
                            <div key={category} className="flex items-center gap-3 px-5 py-3">
                                <span className="text-sm text-gray-700 dark:text-gray-300 w-44 flex-shrink-0 truncate">{category}</span>
                                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", ratingBarColor(avgRating))}
                                        style={{ width: `${(avgRating / 5) * 100}%` }}
                                    />
                                </div>
                                <span className={cn("text-xs font-semibold w-6 text-right", RATING_TEXT_TONES[Math.round(avgRating) as 1 | 2 | 3 | 4 | 5])}>
                                    {avgRating.toFixed(1)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-5">
                {/* Strengths */}
                {strengths.length > 0 && (
                    <div className={cn(shellCardClass, "overflow-hidden")}>
                        <div className="border-b border-gray-200/70 p-4 dark:border-slate-700/70 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Strengths</h2>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                            {strengths.map(({ category, avgRating }) => (
                                <li key={category} className="flex items-center justify-between px-5 py-3 gap-2">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20", RATING_TEXT_TONES[Math.round(avgRating) as 1 | 2 | 3 | 4 | 5])}>
                                        {avgRating.toFixed(1)} · {RATING_LABELS[Math.round(avgRating) as 1 | 2 | 3 | 4 | 5] ?? ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Areas to improve */}
                {improvements.length > 0 && (
                    <div className={cn(shellCardClass, "overflow-hidden")}>
                        <div className="border-b border-gray-200/70 p-4 dark:border-slate-700/70 flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-orange-500" />
                            <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Areas to Improve</h2>
                        </div>
                        <ul className="divide-y divide-gray-100 dark:divide-slate-800">
                            {improvements.map(({ category, avgRating }) => (
                                <li key={category} className="flex items-center justify-between px-5 py-3 gap-2">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{category}</span>
                                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-900/20", RATING_TEXT_TONES[Math.round(avgRating) as 1 | 2 | 3 | 4 | 5])}>
                                        {avgRating.toFixed(1)} · {RATING_LABELS[Math.round(avgRating) as 1 | 2 | 3 | 4 | 5] ?? ""}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {improvements.length === 0 && strengths.length > 0 && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/20 px-5 py-4 text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    All categories rated at <strong>Meets Expectations</strong> or above — no flagged areas to improve.
                </div>
            )}
        </div>
    );
};

const ScorePill = ({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) => (
    <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <span className={cn(
            "rounded-xl border px-3 py-1.5 text-sm font-semibold shadow-sm",
            value == null
                ? "border-gray-200 dark:border-slate-700 text-gray-400 bg-gray-50/90 dark:bg-slate-800/90"
                : highlight
                    ? "border-blue-300 bg-blue-50/90 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-emerald-200 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
        )}>
            {value == null ? "—" : value.toFixed(1)}
        </span>
    </div>
);

export default PerformanceReviewEmployeePage;