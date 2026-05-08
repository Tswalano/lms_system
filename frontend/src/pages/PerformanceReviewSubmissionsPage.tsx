import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import RatingScale from "@/components/RatingScale";
import {
    RATING_LABELS,
    RATING_TEXT_TONES,
    WEIGHTS,
    type RatingValue,
} from "@/lib/performanceReview";
import {
    usePerformanceSubmissions,
    useSaveOverrides,
} from "@/hooks/usePerformanceReview";
import { ArrowLeft, ArrowRight, ClipboardList, Loader2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const OverrideRow = ({
    label,
    description,
    original,
    override,
    onOverride,
}: {
    label: string;
    description?: string;
    original: RatingValue;
    override: RatingValue;
    onOverride: (v: RatingValue) => void;
}) => {
    const changed = override != null && override !== original;
    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-start">
            <div className="col-span-12 md:col-span-5">
                <p className="font-medium text-gray-900 dark:text-gray-100">{label}</p>
                {description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{description}</p>}
            </div>
            <div className="col-span-6 md:col-span-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Submitted</p>
                {original == null ? (
                    <span className="text-sm text-gray-400">Not rated</span>
                ) : (
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200">
                            {original}
                        </span>
                        <span className={cn("text-xs font-medium", RATING_TEXT_TONES[original])}>{RATING_LABELS[original]}</span>
                    </div>
                )}
            </div>
            <div className="col-span-6 md:col-span-4">
                <div className="mb-1 flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Manager override</p>
                    {changed && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                            {original ?? "—"} <ArrowRight className="h-3 w-3" /> {override}
                        </span>
                    )}
                </div>
                <RatingScale size="sm" value={override} onChange={onOverride} showLabel={false} />
            </div>
        </div>
    );
};

const PerformanceReviewSubmissionsPage = () => {
    const navigate = useNavigate();
    const { employeeId } = useParams<{ employeeId: string }>();
    const [searchParams] = useSearchParams();
    const cycleId = searchParams.get("cycleId") ?? undefined;

    const { data: submissions, isLoading } = usePerformanceSubmissions(employeeId, cycleId);
    const saveOverrides = useSaveOverrides();

    const [peerOverrides, setPeerOverrides] = useState<Record<string, Record<string, number | null>>>({});
    const [peerNotes, setPeerNotes] = useState<Record<string, string>>({});
    const [selfOverrides, setSelfOverrides] = useState<Record<string, number | null>>({});
    const [selfNote, setSelfNote] = useState("");

    useEffect(() => {
        if (!submissions) return;
        const initPeer: Record<string, Record<string, number | null>> = {};
        for (const assignment of submissions.peerAssignments) {
            if (assignment.review) {
                initPeer[assignment.reviewer.id] = {};
                for (const resp of assignment.review.responses) {
                    if (resp.overrideRating != null) {
                        initPeer[assignment.reviewer.id][resp.questionId] = resp.overrideRating;
                    }
                }
            }
        }
        setPeerOverrides(initPeer);
    }, [submissions]);

    const managerGroups = useMemo(() => {
        if (!submissions?.managerReview) return [];
        const groups: Record<string, typeof submissions.managerReview.responses> = {};
        for (const resp of submissions.managerReview.responses) {
            if (!groups[resp.question.category]) groups[resp.question.category] = [];
            groups[resp.question.category].push(resp);
        }
        return Object.entries(groups).map(([name, responses]) => ({ name, responses }));
    }, [submissions]);

    const completedPeers = useMemo(
        () => (submissions?.peerAssignments ?? []).filter((p) => p.status === "completed" && p.review),
        [submissions]
    );

    const peerAggregates = useMemo(() => {
        const catMap: Record<string, { sum: number; count: number }> = {};
        for (const assignment of completedPeers) {
            for (const resp of assignment.review!.responses) {
                const val = peerOverrides[assignment.reviewer.id]?.[resp.questionId] ?? resp.overrideRating ?? resp.ratingResponse;
                if (val != null) {
                    if (!catMap[resp.question.category]) catMap[resp.question.category] = { sum: 0, count: 0 };
                    catMap[resp.question.category].sum += val;
                    catMap[resp.question.category].count += 1;
                }
            }
        }
        return Object.entries(catMap).map(([category, { sum, count }]) => ({
            category,
            avg: count ? sum / count : null,
            count,
        }));
    }, [completedPeers, peerOverrides]);

    const handleSave = async () => {
        if (!employeeId || !cycleId) return;
        const peerOvArr: { reviewerId: string; questionId: string; value: number | null; overrideNote?: string }[] = [];
        for (const [reviewerId, questions] of Object.entries(peerOverrides)) {
            for (const [questionId, value] of Object.entries(questions)) {
                peerOvArr.push({ reviewerId, questionId, value, overrideNote: peerNotes[reviewerId] });
            }
        }
        const selfOvArr = Object.entries(selfOverrides).map(([questionId, value]) => ({ questionId, value }));
        try {
            await saveOverrides.mutateAsync({
                employeeId,
                cycleId,
                peerOverrides: peerOvArr.length ? peerOvArr : undefined,
                selfOverrides: selfOvArr.length ? selfOvArr : undefined,
                selfOverrideNote: selfNote || undefined,
            });
            toast.success("Overrides saved");
        } catch {
            toast.error("Failed to save overrides");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading submissions…</p>
                </div>
            </div>
        );
    }

    if (!submissions) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Submission Review</h1>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">The selected employee review cycle could not be found.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => navigate("/performance-review-admin")}
                        className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                    >
                        Back to reviews
                    </Button>
                </div>
            </div>
        );
    }

    const gradient = getEmployeeGradient(submissions.employee.id);
    const initials = getInitials(submissions.employee.name);
    const { managerScore, peerScore, selfScore, finalScore } = submissions.scores;

    return (
        <div className="space-y-5">
            {/* Back button */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate("/performance-review-admin")}
                    className="px-2 text-gray-500 hover:text-gray-900 hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
            </div>

            {/* Header card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 border-l-4 border-l-blue-400 dark:border-l-blue-500 p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white font-semibold text-lg">{initials}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{submissions.employee.name}</h1>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {submissions.employee.role} · Review Submissions
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={managerScore} />
                        <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={peerScore} />
                        <ScorePill label={`Self ${WEIGHTS.self}%`} value={selfScore} />
                        <ScorePill label="Final" value={finalScore} highlight />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="manager" className="space-y-4">
                <TabsList className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-1 shadow-sm">
                    <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Manager</TabsTrigger>
                    <TabsTrigger value="peer" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm">
                        Peers
                        <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400">
                            {completedPeers.length}/{submissions.peerAssignments.length}
                        </span>
                    </TabsTrigger>
                    <TabsTrigger value="self" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-sm">Self</TabsTrigger>
                </TabsList>

                {/* MANAGER TAB */}
                <TabsContent value="manager" className="space-y-3">
                    {!submissions.managerReview || submissions.managerReview.status !== "completed" ? (
                        <EmptyState text="Manager appraisal not submitted yet." />
                    ) : (
                        managerGroups.map((group) => (
                            <div key={group.name} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">{group.name}</h4>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {group.responses.map((resp) => {
                                        const val = resp.ratingResponse as RatingValue;
                                        return (
                                            <div key={resp.questionId} className="grid grid-cols-12 gap-4 p-4">
                                                <div className="col-span-12 md:col-span-5">
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{resp.question.subcategory ?? resp.question.category}</p>
                                                </div>
                                                <div className="col-span-12 md:col-span-3">
                                                    {val ? (
                                                        <div className="inline-flex items-center gap-2">
                                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200">
                                                                {val}
                                                            </span>
                                                            <span className={cn("text-xs font-medium", RATING_TEXT_TONES[val])}>{RATING_LABELS[val]}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-400">Not rated</span>
                                                    )}
                                                </div>
                                                <div className="col-span-12 md:col-span-4 text-sm italic text-gray-600 dark:text-gray-300">
                                                    {resp.textResponse ? `"${resp.textResponse}"` : <span className="text-gray-400">No notes</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </TabsContent>

                {/* PEER TAB */}
                <TabsContent value="peer" className="space-y-4">
                    {submissions.peerAssignments.length === 0 ? (
                        <EmptyState text="No peers assigned yet." />
                    ) : (
                        <>
                            {peerAggregates.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Aggregated peer scores</h4>
                                    </div>
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {peerAggregates.map(({ category, avg, count }) => (
                                            <div key={category} className="flex items-center justify-between p-4">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-gray-100">{category}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{count} responses</p>
                                                </div>
                                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {avg == null ? "—" : avg.toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {submissions.peerAssignments.map((assignment) => {
                                const { reviewer } = assignment;
                                const reviewerGradient = getEmployeeGradient(reviewer.id);
                                const reviewerInitials = getInitials(reviewer.name);

                                if (assignment.status !== "completed" || !assignment.review) {
                                    return (
                                        <div key={assignment.assignmentId} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-slate-600 p-4 flex items-center gap-3">
                                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${reviewerGradient} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0 opacity-60`}>
                                                {reviewerInitials}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-700 dark:text-gray-300">{reviewer.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Has not submitted their peer review yet.</p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={assignment.assignmentId} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${reviewerGradient} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
                                                    {reviewerInitials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{reviewer.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{reviewer.role}</p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                Submitted
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                            {assignment.review.responses.map((resp) => {
                                                const original = resp.ratingResponse as RatingValue;
                                                const overrideVal = peerOverrides[reviewer.id]?.[resp.questionId] ?? resp.overrideRating;
                                                return (
                                                    <OverrideRow
                                                        key={resp.questionId}
                                                        label={resp.question.category}
                                                        original={original}
                                                        override={(overrideVal ?? original) as RatingValue}
                                                        onOverride={(v) =>
                                                            setPeerOverrides((prev) => ({
                                                                ...prev,
                                                                [reviewer.id]: { ...(prev[reviewer.id] ?? {}), [resp.questionId]: v },
                                                            }))
                                                        }
                                                    />
                                                );
                                            })}
                                            <div className="p-4">
                                                <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Manager calibration note</label>
                                                <Textarea
                                                    placeholder="Why are you adjusting this peer review? (optional)"
                                                    value={peerNotes[reviewer.id] ?? ""}
                                                    onChange={(e) => setPeerNotes((prev) => ({ ...prev, [reviewer.id]: e.target.value }))}
                                                    className="mt-1 min-h-[72px] text-sm rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 dark:focus-visible:border-blue-500 resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </TabsContent>

                {/* SELF TAB */}
                <TabsContent value="self" className="space-y-3">
                    {!submissions.selfReview ? (
                        <EmptyState text="Employee has not started their self-review yet." />
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                            <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                {submissions.selfReview.responses.map((resp) => {
                                    const original = resp.ratingResponse as RatingValue;
                                    const override = (selfOverrides[resp.questionId] ?? original) as RatingValue;
                                    return (
                                        <div key={resp.questionId}>
                                            <OverrideRow
                                                label={resp.question.category}
                                                description={resp.question.questionText}
                                                original={original}
                                                override={override}
                                                onOverride={(v) =>
                                                    setSelfOverrides((prev) => ({ ...prev, [resp.questionId]: v }))
                                                }
                                            />
                                            {resp.textResponse && (
                                                <div className="px-4 pb-4">
                                                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl border border-gray-100 dark:border-slate-600 p-3">
                                                        <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Written response</p>
                                                        <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{resp.textResponse}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="p-4">
                                    <label className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Manager calibration note</label>
                                    <Textarea
                                        placeholder="Why are you adjusting the self-assessment? (optional)"
                                        value={selfNote}
                                        onChange={(e) => setSelfNote(e.target.value)}
                                        className="mt-1 min-h-[72px] text-sm rounded-xl border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:ring-blue-500/30 focus-visible:border-blue-400 dark:focus-visible:border-blue-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Footer actions */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5 flex justify-end gap-2">
                <Button
                    variant="outline"
                    onClick={handleSave}
                    disabled={saveOverrides.isPending || !cycleId}
                    className="rounded-xl border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-gray-100"
                >
                    {saveOverrides.isPending ? "Saving…" : "Save"}
                </Button>
                <Button
                    onClick={async () => { await handleSave(); navigate("/performance-review-admin"); }}
                    disabled={saveOverrides.isPending || !cycleId}
                    className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm disabled:opacity-50"
                >
                    Save & close
                </Button>
            </div>
        </div>
    );
};

const ScorePill = ({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) => (
    <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <span className={cn(
            "rounded-lg border px-3 py-1 text-sm font-semibold",
            value == null
                ? "border-gray-200 dark:border-slate-700 text-gray-400 bg-gray-50 dark:bg-slate-800"
                : highlight
                    ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
        )}>
            {value == null ? "—" : value.toFixed(1)}
        </span>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-dashed border-gray-300 dark:border-slate-600">
        <div className="p-10 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>
        </div>
    </div>
);

export default PerformanceReviewSubmissionsPage;
