import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingScale from "@/components/RatingScale";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
    CURRENT_EMPLOYEE_ID,
    EMPLOYEES,
    PEER_QUESTIONS,
    SELF_QUESTIONS,
    type ReviewPeriod,
    WEIGHTS,
    finalScore,
    managerScore,
    peerScore,
    performanceStore,
    selfScore,
    usePerformanceCycles,
} from "@/lib/performanceReview";
import { AlertCircle, CheckCircle2, ClipboardList, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const [selectedPeriod] = useState<ReviewPeriod>("2026 Cycle");
    const cycles = usePerformanceCycles(selectedPeriod);
    const me = EMPLOYEES.find((e) => e.id === CURRENT_EMPLOYEE_ID)!;
    const myCycle = cycles.find((c) => c.employeeId === CURRENT_EMPLOYEE_ID)!;
    const managerSubmitted = myCycle.managerReview.submitted;

    const assignedReviews = useMemo(
        () => cycles.filter((c) => c.nominatedPeerIds.includes(CURRENT_EMPLOYEE_ID) && c.managerReview.submitted),
        [cycles]
    );

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
                            <p className="text-gray-600 dark:text-gray-400">{me.name} · {me.role}</p>
                        </div>
                    </div>

                    {/* Score Pills */}
                    <div className="flex flex-col gap-3">
                        <p className="text-gray-600 dark:text-gray-400">My Overall Score</p>
                        <div className="flex items-center gap-3 flex-wrap">
                            <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={managerScore(myCycle)} />
                            <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={peerScore(myCycle)} />
                            <ScorePill label={`Self ${WEIGHTS.self}%`} value={selfScore(myCycle)} />
                            <ScorePill label="Final Score" value={finalScore(myCycle)} highlight />
                        </div>
                    </div>
                </div>

                {/* Manager not submitted banner */}
                {!managerSubmitted && (
                    <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-800 border-l-4 border-l-amber-400 dark:border-l-amber-500 p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-amber-900 dark:text-amber-200">Waiting on your manager</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                                Your self-review and peer assignments will unlock once your manager submits the appraisal and nominates peers.
                            </p>
                        </div>
                    </div>
                )}

                <Tabs defaultValue="self">
                    <TabsList className="rounded-2xl border border-gray-200/80 bg-white/95 p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/95">
                        <TabsTrigger value="self" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Self-Review</TabsTrigger>
                        <TabsTrigger value="peers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                            Reviews to complete
                            {assignedReviews.length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500 text-white">
                                    {assignedReviews.length}
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
                                {SELF_QUESTIONS.map((q) => (
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
                                                    disabled={!managerSubmitted}
                                                    value={myCycle.selfReview.ratings[q.id] ?? null}
                                                    onChange={(v) => performanceStore.update(CURRENT_EMPLOYEE_ID, myCycle.period, (c) => ({
                                                        ...c,
                                                        selfReview: { ...c.selfReview, ratings: { ...c.selfReview.ratings, [q.id]: v } },
                                                    }))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(["feedback", "metric"] as const).map((field) => (
                                                <div key={field}>
                                                    <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-medium block mb-1">
                                                        {field === "feedback" ? "Engineer / Manager Feedback" : "Metric"}
                                                    </label>
                                                    <Textarea
                                                        disabled={!managerSubmitted}
                                                        placeholder={field === "feedback" ? "Feedback received…" : "Quantifiable metric…"}
                                                        value={myCycle.selfReview[field][q.id] ?? ""}
                                                        onChange={(e) => performanceStore.update(CURRENT_EMPLOYEE_ID, myCycle.period, (c) => ({
                                                            ...c,
                                                            selfReview: { ...c.selfReview, [field]: { ...c.selfReview[field], [q.id]: e.target.value } },
                                                        }))}
                                                        className={cn(appTextareaClass, "min-h-[96px] text-sm")}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200/70 p-5 flex justify-end gap-2 dark:border-slate-700/70">
                                <Button
                                    variant="outline"
                                    disabled={!managerSubmitted}
                                    className={appOutlineButtonClass}
                                    onClick={() => navigate("/")}
                                >
                                    Save & close
                                </Button>
                                <Button
                                    disabled={!managerSubmitted}
                                    className={appPrimaryButtonClass}
                                    onClick={() => performanceStore.update(CURRENT_EMPLOYEE_ID, myCycle.period, (c) => ({
                                        ...c,
                                        selfReview: { ...c.selfReview, submitted: true },
                                    }))}
                                >
                                    Submit self-review
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* PEER REVIEWS ASSIGNED TO ME */}
                    <TabsContent value="peers" className="mt-4">
                        {assignedReviews.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-gray-300 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-900/90">
                                <div className="p-10 text-center">
                                    <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="font-semibold text-gray-700 dark:text-gray-300">No peer reviews assigned yet</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Once a manager nominates you and submits their appraisal for a colleague, you'll see them here.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className={cn(shellCardClass, "overflow-hidden")}>
                                <div className="border-b border-gray-200/70 p-4 lg:p-5 dark:border-slate-700/70">
                                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Assigned Peer Reviews</h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{assignedReviews.length} colleague{assignedReviews.length !== 1 ? "s" : ""} to review</p>
                                </div>
                                <div className="divide-y divide-gray-200/70 dark:divide-slate-700/70">
                                    {assignedReviews.map((c) => {
                                        const emp = EMPLOYEES.find((e) => e.id === c.employeeId)!;
                                        const mine = c.peerReviews.find((p) => p.reviewerId === CURRENT_EMPLOYEE_ID)!;
                                        const answered = Object.values(mine.ratings).filter((v) => v != null).length;
                                        const pct = Math.round((answered / PEER_QUESTIONS.length) * 100);
                                        const gradient = getEmployeeGradient(emp.id);
                                        return (
                                            <div key={c.employeeId} className="p-5 flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-sm`}>
                                                    {emp.initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{emp.name}</h3>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
                                                    <div className="mt-2 flex items-center gap-3">
                                                        <Progress value={pct} className="h-1.5 flex-1 max-w-[200px]" />
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">{answered}/{PEER_QUESTIONS.length} answered</span>
                                                    </div>
                                                </div>
                                                {mine.submitted && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 flex-shrink-0">
                                                        <CheckCircle2 className="w-3 h-3" /> Submitted
                                                    </span>
                                                )}
                                                <Button
                                                    onClick={() => navigate(`/performance-review/peer/${c.employeeId}?period=${encodeURIComponent(selectedPeriod)}`)}
                                                    className={cn(appPrimaryButtonClass, "flex-shrink-0")}
                                                >
                                                    {mine.submitted ? "View" : answered ? "Continue" : "Start"}
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
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold block">
                                        What do you want to learn or achieve in the next quarter?
                                    </label>
                                    <Textarea
                                        disabled={!managerSubmitted}
                                        placeholder="Describe your learning goals and targets for the next quarter…"
                                        value={myCycle.selfReview.nextLearn}
                                        onChange={(e) => performanceStore.update(CURRENT_EMPLOYEE_ID, myCycle.period, (c) => ({
                                            ...c,
                                            selfReview: { ...c.selfReview, nextLearn: e.target.value },
                                        }))}
                                        className={cn(appTextareaClass, "min-h-[140px]")}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 font-semibold block">
                                        What kind of support or resources would help you be more effective?
                                    </label>
                                    <Textarea
                                        disabled={!managerSubmitted}
                                        placeholder="Describe the tools, mentorship, training or other support you need…"
                                        value={myCycle.selfReview.nextSupport}
                                        onChange={(e) => performanceStore.update(CURRENT_EMPLOYEE_ID, myCycle.period, (c) => ({
                                            ...c,
                                            selfReview: { ...c.selfReview, nextSupport: e.target.value },
                                        }))}
                                        className={cn(appTextareaClass, "min-h-[140px]")}
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
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
