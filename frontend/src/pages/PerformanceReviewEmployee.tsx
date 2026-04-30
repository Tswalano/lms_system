import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingScale from "@/components/RatingScale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    SELF_QUESTIONS,
    WEIGHTS,
    type RatingValue,
} from "@/lib/performanceReview";
import {
    usePerformanceCycles,
    useMyPerformanceReview,
    useMyPeerAssignments,
    usePerformanceSubmissions,
    useSaveResponse,
    useSubmitReview,
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

const PerformanceReviewEmployee = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");

    const { data: cycles = [] } = usePerformanceCycles();
    const activeCycleId = selectedCycleId || cycles.find((c) => c.status === "active")?.id || cycles[0]?.id || "";

    const { data: myReviews, isLoading: reviewsLoading } = useMyPerformanceReview(activeCycleId || undefined);
    const { data: peerAssignments = [] } = useMyPeerAssignments(activeCycleId || undefined);
    const { data: submissions } = usePerformanceSubmissions(user?.id, activeCycleId || undefined);

    const saveResponse = useSaveResponse();
    const submitReview = useSubmitReview();

    const selfReview = myReviews?.selfReview ?? null;
    const selfSubmitted = selfReview?.status === "submitted";

    // Zip API responses with SELF_QUESTIONS definitions by index
    const selfResponses = useMemo(() => selfReview?.responses ?? [], [selfReview]);
    const nextStepsResponses = useMemo(() => selfResponses.slice(SELF_QUESTIONS.length), [selfResponses]);

    const getResponse = useCallback(
        (idx: number) => selfResponses[idx] ?? null,
        [selfResponses]
    );

    const handleRatingChange = (idx: number, v: RatingValue) => {
        const resp = getResponse(idx);
        if (!selfReview?.id || !resp) return;
        saveResponse.mutate({
            reviewId: selfReview.id,
            questionId: resp.questionId,
            ratingResponse: v,
        });
    };

    const handleTextChange = (idx: number, text: string) => {
        const resp = getResponse(idx);
        if (!selfReview?.id || !resp) return;
        saveResponse.mutate({
            reviewId: selfReview.id,
            questionId: resp.questionId,
            textResponse: text,
        });
    };

    const handleNextStepsChange = (idx: number, text: string) => {
        const resp = nextStepsResponses[idx];
        if (!selfReview?.id || !resp) return;
        saveResponse.mutate({
            reviewId: selfReview.id,
            questionId: resp.questionId,
            textResponse: text,
        });
    };

    const handleSubmitSelfReview = async () => {
        if (!selfReview?.id) return;
        try {
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
                            <p className="text-gray-600 dark:text-gray-400">{user?.firstName} {user?.lastName ?? user?.email} - {cycles.find((c) => c.id === activeCycleId)?.name ?? 'Performance Review'} </p>
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

                {!selfReview ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                            <AlertCircle className="w-7 h-7 text-amber-500" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">No active review cycle</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Your questionnaire will appear here once a review cycle is activated and you are enrolled.
                        </p>
                    </div>
                ) : (

                    <Tabs defaultValue="self">
                        <TabsList className="rounded-2xl border border-gray-200/80 bg-white/95 p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/95">
                            <TabsTrigger value="self" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Self-Review</TabsTrigger>
                            <TabsTrigger value="peers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                                Reviews to complete
                                {pendingPeerCount > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                                        {pendingPeerCount}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="next" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Next Steps</TabsTrigger>
                        </TabsList>

                        {/* SELF REVIEW */}
                        <TabsContent value="self" className="space-y-4 mt-4">
                            <div className={cn(shellCardClass, "overflow-hidden")}>
                                <div className="border-b border-gray-200/70 p-4 lg:p-5 dark:border-slate-700/70">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Self-Assessment</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rate your own performance and provide supporting evidence</p>
                                </div>
                                <div className="divide-y divide-gray-200/70 dark:divide-slate-700/70">
                                    {SELF_QUESTIONS.map((q, idx) => {
                                        const resp = getResponse(idx);
                                        return (
                                            <div key={q.id} className="p-5">
                                                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{q.title}</h3>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{q.prompt}</p>
                                                        {q.hint && <p className="text-xs text-gray-400 dark:text-gray-500 italic mt-1">{q.hint}</p>}
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Impact Score</p>
                                                        <RatingScale
                                                            size="sm"
                                                            disabled={selfSubmitted || !selfReview}
                                                            value={(resp?.ratingResponse as RatingValue) ?? null}
                                                            onChange={(v) => handleRatingChange(idx, v)}
                                                        />
                                                    </div>
                                                </div>
                                                <Textarea
                                                    disabled={selfSubmitted || !selfReview}
                                                    placeholder="Describe your contribution, feedback received, and any measurable outcomes…"
                                                    value={resp?.textResponse ?? ""}
                                                    onChange={(e) => handleTextChange(idx, e.target.value)}
                                                    className={cn(appTextareaClass, "min-h-[96px] text-sm")}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="border-t border-gray-200/70 p-5 flex justify-end gap-2 dark:border-slate-700/70">
                                    <Button
                                        variant="outline"
                                        disabled={!selfReview}
                                        className={appOutlineButtonClass}
                                        onClick={() => navigate("/")}
                                    >
                                        Save & close
                                    </Button>
                                    <Button
                                        disabled={selfSubmitted || !selfReview || submitReview.isPending}
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
                                    {nextStepsResponses.length > 0 ? (
                                        nextStepsResponses.map((resp, idx) => (
                                            <div key={resp.questionId} className="space-y-2">
                                                <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold block">
                                                    {idx === 0
                                                        ? "What do you want to learn or achieve in the next quarter?"
                                                        : "What kind of support or resources would help you be more effective?"}
                                                </label>
                                                <Textarea
                                                    disabled={selfSubmitted || !selfReview}
                                                    placeholder={idx === 0
                                                        ? "Describe your learning goals and targets for the next quarter…"
                                                        : "Describe the tools, mentorship, training or other support you need…"}
                                                    value={resp.textResponse ?? ""}
                                                    onChange={(e) => handleNextStepsChange(idx, e.target.value)}
                                                    className={cn(appTextareaClass, "min-h-[140px]")}
                                                />
                                            </div>
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

export default PerformanceReviewEmployee;
