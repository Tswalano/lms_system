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
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Peer Review</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The selected peer review could not be found.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/performance-review")}
                        className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                    >
                        Back to review
                    </Button>
                </div>
            </div>
        );
    }

    const answered = Object.values(myPeerSubmission.ratings).filter((v) => v != null).length;
    const gradient = getEmployeeGradient(peerEmployee.id);

    return (
        <div className="space-y-5">
            {/* Back button */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate("/performance-review")}
                    className="px-2 text-gray-500 hover:text-gray-900 hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </div>

            {/* Header card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 border-l-4 border-l-blue-400 dark:border-l-blue-500 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white font-semibold text-lg">{peerEmployee.initials}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <UserCheck className="h-4 w-4 text-blue-600" />
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Peer Review</h1>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Reviewing <span className="font-medium text-gray-900 dark:text-gray-100">{peerEmployee.name}</span>
                                {" · "}{peerEmployee.role} · {selectedPeriod}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Your responses contribute to the {WEIGHTS.peer}% peer score.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <ScorePill label="Answered" value={`${answered}/${PEER_QUESTIONS.length}`} highlight />
                        {myPeerSubmission.submitted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-4 h-4" /> Submitted
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="p-4 lg:p-5 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Review Questions</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Rate each category and provide written feedback</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {PEER_QUESTIONS.map((q) => (
                        <div key={q.id} className="p-5 grid grid-cols-12 gap-4 items-start">
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
                                        className="min-h-[110px] text-sm rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 dark:focus-visible:border-blue-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => navigate("/performance-review")}
                    className="rounded-xl border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                    Save & close
                </Button>
                {!myPeerSubmission.submitted && (
                    <Button
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm disabled:opacity-50"
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
                        <CheckCircle2 className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>
        </div>
    );
};

const ScorePill = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
    <div className="flex flex-col items-center min-w-[80px]">
        <span className="mb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</span>
        <span className={cn(
            "rounded-lg border px-3 py-1 text-sm font-semibold",
            highlight
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
        )}>
            {value}
        </span>
    </div>
);

export default PerformanceReviewPeerPage;
