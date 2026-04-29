import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RatingScale from "@/components/RatingScale";
import {
    CURRENT_EMPLOYEE_ID,
    EMPLOYEES,
    PEER_QUESTIONS,
    REVIEW_PERIODS,
    type ReviewPeriod,
    WEIGHTS,
    performanceStore,
    usePerformanceCycle,
} from "@/lib/performanceReview";
import { ArrowLeft, CheckCircle2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const shellCardClass = "rounded-3xl border border-gray-200/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95";
const appTextareaClass = "rounded-2xl border-gray-200 bg-white/95 shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500";
const appPrimaryButtonClass = "rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";
const appOutlineButtonClass = "rounded-2xl border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";

const PerformanceReviewPeerPage = () => {
    const navigate = useNavigate();
    const { employeeId } = useParams<{ employeeId: string }>();
    const [searchParams] = useSearchParams();
    const requestedPeriod = searchParams.get("period");
    const selectedPeriod: ReviewPeriod = REVIEW_PERIODS.includes(requestedPeriod as ReviewPeriod)
        ? (requestedPeriod as ReviewPeriod)
        : "2026 Cycle";

    const peerCycle = usePerformanceCycle(employeeId ?? "", selectedPeriod);
    const peerEmployee = employeeId ? EMPLOYEES.find((e) => e.id === employeeId) : null;
    const myPeerSubmission = peerCycle?.peerReviews.find((p) => p.reviewerId === CURRENT_EMPLOYEE_ID);

    if (!peerCycle || !peerEmployee || !myPeerSubmission) {
        return (
            <div className={cn(shellCardClass, "p-6")}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Peer Review</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected peer review could not be found.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/performance-review")} className={appOutlineButtonClass}>
                        Back to review
                    </Button>
                </div>
            </div>
        );
    }

    const answered = Object.values(myPeerSubmission.ratings).filter((v) => v != null).length;

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <Button variant="ghost" onClick={() => navigate("/performance-review")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>

            <div className={cn(shellCardClass, "p-6")}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Peer Review</h1>
                        </div>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Provide honest, constructive feedback for {peerEmployee.name}. Your responses contribute to the {WEIGHTS.peer}% peer score for {selectedPeriod}.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <StatusPill label="Reviewee" value={peerEmployee.name} />
                        <StatusPill label="Role" value={peerEmployee.role} />
                        <StatusPill label="Answered" value={`${answered}/${PEER_QUESTIONS.length}`} highlight />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {PEER_QUESTIONS.map((q) => (
                    <div key={q.id} className={cn(shellCardClass, "overflow-hidden")}>
                        <div className="grid grid-cols-12 gap-4 p-5 items-start">
                            <div className="col-span-12 md:col-span-4">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{q.category}</p>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{q.question}</p>
                            </div>
                            <div className="col-span-12 md:col-span-3">
                                <RatingScale
                                    size="sm"
                                    disabled={myPeerSubmission.submitted}
                                    value={myPeerSubmission.ratings[q.id] ?? null}
                                    onChange={(v) => performanceStore.update(peerCycle.employeeId, peerCycle.period, (c) => ({
                                        ...c,
                                        peerReviews: c.peerReviews.map((p) =>
                                            p.reviewerId === CURRENT_EMPLOYEE_ID
                                                ? { ...p, ratings: { ...p.ratings, [q.id]: v } }
                                                : p
                                        ),
                                    }))}
                                />
                            </div>
                            <div className="col-span-12 md:col-span-5 grid grid-cols-1 gap-2 md:grid-cols-2">
                                {(["feedback", "notes"] as const).map((field) => (
                                    <Textarea
                                        key={field}
                                        disabled={myPeerSubmission.submitted}
                                        placeholder={field === "feedback" ? "Feedback…" : "Notes…"}
                                        value={myPeerSubmission[field][q.id] ?? ""}
                                        onChange={(e) => performanceStore.update(peerCycle.employeeId, peerCycle.period, (c) => ({
                                            ...c,
                                            peerReviews: c.peerReviews.map((p) =>
                                                p.reviewerId === CURRENT_EMPLOYEE_ID
                                                    ? { ...p, [field]: { ...p[field], [q.id]: e.target.value } }
                                                    : p
                                            ),
                                        }))}
                                        className={cn(appTextareaClass, "min-h-[110px] text-sm")}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className={cn(shellCardClass, "flex justify-end gap-2 p-5")}>
                <Button variant="outline" onClick={() => navigate("/performance-review")} className={appOutlineButtonClass}>
                    Save & close
                </Button>
                {!myPeerSubmission.submitted && (
                    <Button
                        className={appPrimaryButtonClass}
                        onClick={() => {
                            performanceStore.update(peerCycle.employeeId, peerCycle.period, (c) => ({
                                ...c,
                                peerReviews: c.peerReviews.map((p) =>
                                    p.reviewerId === CURRENT_EMPLOYEE_ID ? { ...p, submitted: true } : p
                                ),
                            }));
                            navigate("/performance-review");
                        }}
                        disabled={answered < PEER_QUESTIONS.length}
                    >
                        Submit review
                        <CheckCircle2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
};

const StatusPill = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className="flex flex-col items-center min-w-[88px]">
        <span className="mb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
        <span className={cn(
            "rounded-xl border px-3 py-1.5 text-sm font-semibold shadow-sm",
            highlight
                ? "border-blue-300 bg-blue-50/90 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-emerald-200 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
        )}>
            {value}
        </span>
    </div>
);

export default PerformanceReviewPeerPage;
