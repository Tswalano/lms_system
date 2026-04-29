import { useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import RatingScale from "@/components/RatingScale";
import {
    EMPLOYEES,
    MANAGER_CATEGORIES,
    PEER_QUESTIONS,
    RATING_LABELS,
    RATING_TEXT_TONES,
    REVIEW_PERIODS,
    SELF_QUESTIONS,
    WEIGHTS,
    effectiveRatings,
    finalScore,
    managerScore,
    peerScore,
    performanceStore,
    selfScore,
    usePerformanceCycle,
    type RatingValue,
    type ReviewPeriod,
} from "@/lib/performanceReview";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const shellCardClass = "rounded-3xl border border-gray-200/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95";
const panelClass = "rounded-[24px] border border-gray-200/70 bg-white/95 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/95";
const textareaClass = "mt-1 min-h-[72px] rounded-2xl border-gray-200 bg-white/95 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500";
const appPrimaryButtonClass = "rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";
const appOutlineButtonClass = "rounded-2xl border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";

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
                <p className="font-medium text-slate-900 dark:text-slate-100">{label}</p>
                {description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>}
            </div>
            <div className="col-span-6 md:col-span-3">
                <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Submitted</p>
                {original == null ? (
                    <span className="text-sm text-slate-400">Not rated</span>
                ) : (
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {original}
                        </span>
                        <span className={cn("text-xs font-medium", RATING_TEXT_TONES[original])}>{RATING_LABELS[original]}</span>
                    </div>
                )}
            </div>
            <div className="col-span-6 md:col-span-4">
                <div className="mb-1 flex items-center gap-2">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Manager override</p>
                    {changed && (
                        <Badge className="gap-1 rounded-full bg-amber-500 text-[10px] text-white hover:bg-amber-500">
                            {original ?? "—"} <ArrowRight className="h-3 w-3" /> {override}
                        </Badge>
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
    const requestedPeriod = searchParams.get("period");
    const selectedPeriod: ReviewPeriod = REVIEW_PERIODS.includes(requestedPeriod as ReviewPeriod)
        ? (requestedPeriod as ReviewPeriod)
        : "2026 Cycle";
    const cycle = usePerformanceCycle(employeeId ?? "", selectedPeriod);
    const employee = employeeId ? EMPLOYEES.find((e) => e.id === employeeId) : null;

    const peerAggregates = useMemo(() => {
        if (!cycle) return [];
        return PEER_QUESTIONS.map((q) => {
            const submitted = cycle.peerReviews.filter((p) => p.submitted);
            const vals = submitted
                .map((p) => effectiveRatings(p)[q.id])
                .filter((v): v is Exclude<RatingValue, null> => v != null);
            const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
            return { q, avg, count: vals.length };
        });
    }, [cycle]);

    if (!cycle || !employee) {
        return (
            <div className={cn(shellCardClass, "p-6")}>
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Submission Review</h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The selected employee review cycle could not be found.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate("/performance-review-admin")}>
                        Back to reviews
                    </Button>
                </div>
            </div>
        );
    }

    const updatePeerOverride = (reviewerId: string, qid: string, v: RatingValue) =>
        performanceStore.update(cycle.employeeId, cycle.period, (c) => ({
            ...c,
            peerReviews: c.peerReviews.map((p) =>
                p.reviewerId === reviewerId
                    ? { ...p, overrides: { ...(p.overrides ?? {}), [qid]: v } }
                    : p
            ),
        }));

    const updatePeerNote = (reviewerId: string, note: string) =>
        performanceStore.update(cycle.employeeId, cycle.period, (c) => ({
            ...c,
            peerReviews: c.peerReviews.map((p) => (p.reviewerId === reviewerId ? { ...p, overrideNote: note } : p)),
        }));

    const updateSelfOverride = (qid: string, v: RatingValue) =>
        performanceStore.update(cycle.employeeId, cycle.period, (c) => ({
            ...c,
            selfReview: { ...c.selfReview, overrides: { ...(c.selfReview.overrides ?? {}), [qid]: v } },
        }));

    const updateSelfNote = (note: string) =>
        performanceStore.update(cycle.employeeId, cycle.period, (c) => ({ ...c, selfReview: { ...c.selfReview, overrideNote: note } }));

    const handleSave = () => {
        toast.success("Overrides saved", {
            description: `Manager overrides for ${employee.name} have been saved.`,
        });
    };

    const handleSaveAndClose = () => {
        handleSave();
        navigate("/performance-review-admin");
    };

    return (
        <div className="space-y-6">
            {/* Back button on its own row */}
            <div className="mb-4">
                <Button variant="ghost" onClick={() => navigate("/performance-review-admin")}>
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
            </div>
            <div className={cn(shellCardClass, "p-6")}>
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={managerScore(cycle)} />
                        <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={peerScore(cycle)} />
                        <ScorePill label={`Self ${WEIGHTS.self}%`} value={selfScore(cycle)} />
                        <ScorePill label="Final" value={finalScore(cycle)} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleSave} className={appOutlineButtonClass}>
                            Save
                        </Button>
                        <Button onClick={handleSaveAndClose} className={appPrimaryButtonClass}>
                            Save & close
                        </Button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="manager" className="space-y-4">
                <TabsList className="rounded-2xl border border-gray-200/80 bg-white/95 p-1 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/95">
                    <TabsTrigger value="manager" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Manager</TabsTrigger>
                    <TabsTrigger value="peer" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
                        Peers
                        <Badge variant="outline" className="ml-2 rounded-full text-[10px]">
                            {cycle.peerReviews.filter((p) => p.submitted).length}/{cycle.peerReviews.length}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="self" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:via-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">Self</TabsTrigger>
                </TabsList>

                <TabsContent value="manager" className="space-y-3">
                    {!cycle.managerReview.submitted ? (
                        <EmptyState text="Manager appraisal not submitted yet." />
                    ) : (
                        MANAGER_CATEGORIES.map((cat) => (
                            <Card key={cat.id} className={cn(shellCardClass, "rounded-[24px] border-slate-200/70 dark:border-slate-700/70")}>
                                <div className="rounded-t-[24px] border-b border-gray-200/70 bg-slate-50/90 px-5 py-2.5 dark:border-slate-700/70 dark:bg-slate-800/70">
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">{cat.name}</h4>
                                </div>
                                <CardContent className="divide-y divide-slate-200/70 p-0 dark:divide-slate-700/70">
                                    {cat.subs.map((s) => {
                                        const val = cycle.managerReview.ratings[s.id] ?? null;
                                        const note = cycle.managerReview.notes[s.id];
                                        return (
                                            <div key={s.id} className="grid grid-cols-12 gap-4 p-4">
                                                <div className="col-span-12 md:col-span-5">
                                                    <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                                                    {s.description && <p className="mt-0.5 text-xs text-slate-500">{s.description}</p>}
                                                </div>
                                                <div className="col-span-12 md:col-span-3">
                                                    {val ? (
                                                        <div className="inline-flex items-center gap-2">
                                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                                                {val}
                                                            </span>
                                                            <span className={cn("text-xs font-medium", RATING_TEXT_TONES[val])}>{RATING_LABELS[val]}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">Not rated</span>
                                                    )}
                                                </div>
                                                <div className="col-span-12 md:col-span-4 text-sm italic text-slate-600 dark:text-slate-300">
                                                    {note ? `“${note}”` : <span className="text-slate-400">No notes</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="peer" className="space-y-4">
                    {cycle.peerReviews.length === 0 ? (
                        <EmptyState text="No peers nominated yet." />
                    ) : (
                        <>
                            <Card className={cn(shellCardClass, "rounded-[24px] border-slate-200/70 dark:border-slate-700/70")}>
                                <div className="rounded-t-[24px] border-b border-gray-200/70 bg-slate-50/90 px-5 py-2.5 dark:border-slate-700/70 dark:bg-slate-800/70">
                                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">Aggregated peer scores</h4>
                                </div>
                                <CardContent className="divide-y divide-slate-200/70 p-0 dark:divide-slate-700/70">
                                    {peerAggregates.map(({ q, avg, count }) => (
                                        <div key={q.id} className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-slate-100">{q.category}</p>
                                                <p className="text-xs text-slate-500">{q.question}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{avg == null ? "—" : avg.toFixed(2)}</p>
                                                <p className="text-[10px] text-slate-500">{count} responses</p>
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            {cycle.peerReviews.map((p) => {
                                const reviewer = EMPLOYEES.find((e) => e.id === p.reviewerId);
                                if (!p.submitted) {
                                    return (
                                        <Card key={p.reviewerId} className="rounded-[24px] border-dashed border-slate-300 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
                                            <CardContent className="flex items-center gap-3 p-4">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-200 text-sm font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                                    {reviewer?.initials}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-700 dark:text-slate-300">{reviewer?.name}</p>
                                                    <p className="text-xs text-slate-500">Has not submitted their peer review yet.</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                }
                                return (
                                    <Card key={p.reviewerId} className={cn(shellCardClass, "rounded-[24px] border-slate-200/70 dark:border-slate-700/70")}>
                                        <div className="flex items-center justify-between rounded-t-[24px] border-b border-gray-200/70 bg-slate-50/90 px-5 py-3 dark:border-slate-700/70 dark:bg-slate-800/70">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-sm font-semibold text-white">
                                                    {reviewer?.initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{reviewer?.name}</p>
                                                    <p className="text-xs text-slate-500">{reviewer?.role}</p>
                                                </div>
                                            </div>
                                            <Badge className="rounded-full bg-emerald-500 text-white hover:bg-emerald-500">Submitted</Badge>
                                        </div>
                                        <CardContent className="divide-y divide-slate-200/70 p-0 dark:divide-slate-700/70">
                                            {PEER_QUESTIONS.map((q) => (
                                                <OverrideRow
                                                    key={q.id}
                                                    label={q.category}
                                                    description={q.question}
                                                    original={p.ratings[q.id] ?? null}
                                                    override={p.overrides?.[q.id] ?? p.ratings[q.id] ?? null}
                                                    onOverride={(v) => updatePeerOverride(p.reviewerId, q.id, v)}
                                                />
                                            ))}
                                            <div className="p-4">
                                                <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Manager calibration note</label>
                                                <Textarea
                                                    placeholder="Why are you adjusting this peer review? (optional)"
                                                    value={p.overrideNote ?? ""}
                                                    onChange={(e) => updatePeerNote(p.reviewerId, e.target.value)}
                                                    className={textareaClass}
                                                />
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="self" className="space-y-3">
                    {!cycle.selfReview.submitted && Object.keys(cycle.selfReview.ratings).length === 0 ? (
                        <EmptyState text="Employee has not started their self-review yet." />
                    ) : (
                        <Card className={cn(shellCardClass, "rounded-[24px] border-slate-200/70 dark:border-slate-700/70")}>
                            <CardContent className="divide-y divide-slate-200/70 p-0 dark:divide-slate-700/70">
                                {SELF_QUESTIONS.map((q) => (
                                    <div key={q.id}>
                                        <OverrideRow
                                            label={q.title}
                                            description={q.prompt}
                                            original={cycle.selfReview.ratings[q.id] ?? null}
                                            override={cycle.selfReview.overrides?.[q.id] ?? cycle.selfReview.ratings[q.id] ?? null}
                                            onOverride={(v) => updateSelfOverride(q.id, v)}
                                        />
                                        <div className="grid grid-cols-1 gap-3 px-4 pb-4 md:grid-cols-3 text-sm">
                                            <Field label="Examples" value={cycle.selfReview.examples[q.id]} />
                                            <Field label="Feedback" value={cycle.selfReview.feedback[q.id]} />
                                            <Field label="Metric" value={cycle.selfReview.metric[q.id]} />
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4">
                                    <label className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Manager calibration note</label>
                                    <Textarea
                                        placeholder="Why are you adjusting the self-assessment? (optional)"
                                        value={cycle.selfReview.overrideNote ?? ""}
                                        onChange={(e) => updateSelfNote(e.target.value)}
                                        className={textareaClass}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            <div className={cn(shellCardClass, "flex justify-end gap-2 p-5")}>
                <Button variant="outline" onClick={handleSave} className={appOutlineButtonClass}>
                    Save
                </Button>
                <Button onClick={handleSaveAndClose} className={appPrimaryButtonClass}>
                    Save & close
                </Button>
            </div>
        </div>
    );
};

const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className={cn(panelClass, "rounded-2xl p-3")}>
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-slate-700 dark:text-slate-300">{value || <span className="italic text-slate-400">Not provided</span>}</p>
    </div>
);

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

const EmptyState = ({ text }: { text: string }) => (
    <Card className="rounded-[24px] border-dashed border-slate-300 bg-white/90 dark:border-slate-700 dark:bg-slate-900/90">
        <CardContent className="p-8 text-center text-sm text-slate-500">{text}</CardContent>
    </Card>
);

export default PerformanceReviewSubmissionsPage;
