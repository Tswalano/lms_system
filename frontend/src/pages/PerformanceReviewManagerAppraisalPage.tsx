import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import RatingScale from "@/components/RatingScale";
import { WEIGHTS, type RatingValue } from "@/lib/performanceReview";
import {
    useManagerAppraisalDetail,
    useSaveResponse,
    useSubmitReview,
    type ManagerAppraisalQuestion,
} from "@/hooks/usePerformanceReview";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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

const PerformanceReviewManagerAppraisalPage = () => {
    const navigate = useNavigate();
    const { reviewId } = useParams<{ reviewId: string }>();

    const { data: detail, isLoading } = useManagerAppraisalDetail(reviewId);
    const saveResponse = useSaveResponse();
    const submitReview = useSubmitReview();

    const [localTexts, setLocalTexts] = useState<Record<string, string>>({});
    const [localRatings, setLocalRatings] = useState<Record<string, RatingValue | null>>({});
    const initialized = useRef(false);

    useEffect(() => {
        if (detail && !initialized.current) {
            const texts: Record<string, string> = {};
            const ratings: Record<string, RatingValue | null> = {};
            for (const q of detail.questions) {
                texts[q.id] = q.response?.textResponse ?? "";
                ratings[q.id] = (q.response?.ratingResponse as RatingValue) ?? null;
            }
            setLocalTexts(texts);
            setLocalRatings(ratings);
            initialized.current = true;
        }
    }, [detail]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 h-24 animate-pulse" />
                ))}
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manager Appraisal</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">This appraisal could not be found.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/performance-review-admin")}
                        className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                        Back to admin
                    </Button>
                </div>
            </div>
        );
    }

    const submitted = detail.status === "final_review_complete" || detail.status === "employee_completed";
    const gradient = getEmployeeGradient(detail.employee.id);
    const initials = getInitials(detail.employee.name);
    const answered = detail.questions.filter((q) => localRatings[q.id] != null).length;
    const allAnswered = answered >= detail.questions.length;
    const avgScore = answered > 0
        ? detail.questions.filter((q) => localRatings[q.id] != null)
            .reduce((sum, q) => sum + (localRatings[q.id] as number), 0) / answered
        : null;

    const handleRatingChange = (questionId: string, v: RatingValue) => {
        setLocalRatings((prev) => ({ ...prev, [questionId]: v }));
    };

    const handleTextChange = (questionId: string, text: string) => {
        setLocalTexts((prev) => ({ ...prev, [questionId]: text }));
    };

    const handleSubmit = async () => {
        if (!reviewId) return;
        try {
            await Promise.all(
                detail.questions.map((q) =>
                    saveResponse.mutateAsync({
                        reviewId: reviewId!,
                        questionId: q.id,
                        ratingResponse: localRatings[q.id] ?? null,
                        textResponse: localTexts[q.id] ?? "",
                        reviewerType: "manager",
                    })
                )
            );
            await submitReview.mutateAsync(reviewId);
            toast.success("Appraisal submitted successfully");
            navigate("/performance-review-admin");
        } catch {
            toast.error("Failed to submit appraisal");
        }
    };

    // Group questions by category for cleaner rendering
    const grouped = detail.questions.reduce<Record<string, ManagerAppraisalQuestion[]>>((acc, q) => {
        const key = q.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
    }, {});

    return (
        <div className="space-y-5">
            {/* Back */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate("/performance-review-admin")}
                    className="px-2 text-gray-500 hover:text-gray-900 hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
            </div>

            {/* Header card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 border-l-4 border-l-indigo-400 dark:border-l-indigo-500 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white font-semibold text-lg">{initials}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Manager Appraisal</h1>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Appraising{" "}
                                <span className="font-medium text-gray-900 dark:text-gray-100">{detail.employee.name}</span>
                                {" · "}{detail.employee.role} · {detail.cycle.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Your assessment contributes to the {WEIGHTS.manager}% manager score.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <ScorePill label="Avg score" value={avgScore != null ? avgScore.toFixed(1) : "—"} highlight />
                        <ScorePill label="Answered" value={`${answered}/${detail.questions.length}`} />
                        {submitted && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-4 h-4" /> Submitted
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions grouped by category */}
            {Object.entries(grouped).map(([category, questions]) => (
                <div key={category} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 lg:p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/60 dark:bg-slate-800/60">
                        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">{category}</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {questions.map((q) => (
                            <div key={q.id} className="p-5 grid grid-cols-12 gap-4 items-start">
                                <div className="col-span-12 md:col-span-5">
                                    {q.subcategory && (
                                        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500 dark:text-indigo-400 mb-1">{q.subcategory}</p>
                                    )}
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{q.questionText}</p>
                                    {q.guidanceText && (
                                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">{q.guidanceText}</p>
                                    )}
                                </div>
                                <div className="col-span-12 md:col-span-3">
                                    <RatingScale
                                        size="sm"
                                        disabled={submitted}
                                        value={localRatings[q.id] ?? null}
                                        onChange={(v) => handleRatingChange(q.id, v)}
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-4">
                                    <Textarea
                                        disabled={submitted}
                                        placeholder="Optional notes…"
                                        value={localTexts[q.id] ?? ""}
                                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                                        className="min-h-[90px] text-sm rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-400 dark:focus-visible:border-indigo-500 resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Footer */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={() => navigate("/performance-review-admin")}
                    className="rounded-xl border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                    Save & close
                </Button>
                {!submitted && (
                    <Button
                        className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm disabled:opacity-50"
                        onClick={handleSubmit}
                        disabled={!allAnswered || saveResponse.isPending || submitReview.isPending}
                    >
                        {saveResponse.isPending ? "Saving…" : submitReview.isPending ? "Submitting…" : "Submit appraisal"}
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
                ? "border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                : "border-gray-200 bg-gray-50 text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
        )}>
            {value}
        </span>
    </div>
);

export default PerformanceReviewManagerAppraisalPage;
