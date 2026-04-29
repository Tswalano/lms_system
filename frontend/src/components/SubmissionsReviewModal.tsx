import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    RatingValue,
    SELF_QUESTIONS,
    WEIGHTS,
    effectiveRatings,
    finalScore,
    managerScore,
    peerScore,
    performanceStore,
    selfScore,
} from "@/lib/performanceReview";
import { ArrowRight, ShieldCheck, UserCheck, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    employeeId: string | null;
}

const fmt = (n: number | null) => (n == null ? "—" : n.toFixed(1));

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
                {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
            </div>
            <div className="col-span-6 md:col-span-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-1">Submitted</p>
                {original == null ? (
                    <span className="text-sm text-slate-400">Not rated</span>
                ) : (
                    <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center justify-center h-8 w-8 rounded-md border bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 text-sm">
                            {original}
                        </span>
                        <span className={cn("text-xs font-medium", RATING_TEXT_TONES[original])}>{RATING_LABELS[original]}</span>
                    </div>
                )}
            </div>
            <div className="col-span-6 md:col-span-4">
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">Manager override</p>
                    {changed && (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[10px] gap-1">
                            {original ?? "—"} <ArrowRight className="w-3 h-3" /> {override}
                        </Badge>
                    )}
                </div>
                <RatingScale size="sm" value={override} onChange={onOverride} showLabel={false} />
            </div>
        </div>
    );
};

const SubmissionsReviewModal = ({ open, onOpenChange, employeeId }: Props) => {
    const cycle = employeeId ? performanceStore.get(employeeId) : null;
    const employee = employeeId ? EMPLOYEES.find((e) => e.id === employeeId) : null;

    // Re-render reactively when store changes — subscribe via lightweight hook below.
    // We rely on the parent re-rendering (it uses usePerformanceCycles).

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

    if (!cycle || !employee) return null;

    const updatePeerOverride = (reviewerId: string, qid: string, v: RatingValue) =>
        performanceStore.update(cycle.employeeId, (c) => ({
            ...c,
            peerReviews: c.peerReviews.map((p) =>
                p.reviewerId === reviewerId
                    ? { ...p, overrides: { ...(p.overrides ?? {}), [qid]: v } }
                    : p
            ),
        }));

    const updatePeerNote = (reviewerId: string, note: string) =>
        performanceStore.update(cycle.employeeId, (c) => ({
            ...c,
            peerReviews: c.peerReviews.map((p) => (p.reviewerId === reviewerId ? { ...p, overrideNote: note } : p)),
        }));

    const updateSelfOverride = (qid: string, v: RatingValue) =>
        performanceStore.update(cycle.employeeId, (c) => ({
            ...c,
            selfReview: { ...c.selfReview, overrides: { ...(c.selfReview.overrides ?? {}), [qid]: v } },
        }));

    const updateSelfNote = (note: string) =>
        performanceStore.update(cycle.employeeId, (c) => ({ ...c, selfReview: { ...c.selfReview, overrideNote: note } }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-blue-600" />
                        Review Submissions — {employee.name}
                    </DialogTitle>
                    <DialogDescription>
                        Inspect manager, peer and self submissions. You can override any rating — the original value stays visible
                        so the audit trail is preserved (e.g. <span className="font-medium">3 → 5</span>).
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <ScoreTile label={`Manager ${WEIGHTS.manager}%`} value={managerScore(cycle)} icon={<UserCheck className="w-4 h-4" />} />
                    <ScoreTile label={`Peer ${WEIGHTS.peer}%`} value={peerScore(cycle)} icon={<Users className="w-4 h-4" />} />
                    <ScoreTile label={`Self ${WEIGHTS.self}%`} value={selfScore(cycle)} icon={<FileText className="w-4 h-4" />} />
                    <ScoreTile label="Final" value={finalScore(cycle)} icon={<ShieldCheck className="w-4 h-4" />} highlight />
                </div>

                <Tabs defaultValue="manager" className="mt-2">
                    <TabsList>
                        <TabsTrigger value="manager">Manager</TabsTrigger>
                        <TabsTrigger value="peer">
                            Peers
                            <Badge variant="outline" className="ml-2 text-[10px]">
                                {cycle.peerReviews.filter((p) => p.submitted).length}/{cycle.peerReviews.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="self">Self</TabsTrigger>
                    </TabsList>

                    {/* MANAGER */}
                    <TabsContent value="manager" className="mt-4 space-y-3">
                        {!cycle.managerReview.submitted ? (
                            <EmptyState text="Manager appraisal not submitted yet." />
                        ) : (
                            MANAGER_CATEGORIES.map((cat) => (
                                <Card key={cat.id} className="border-slate-200 dark:border-slate-800">
                                    <div className="px-5 py-2.5 border-b bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                                        <h4 className="font-semibold uppercase tracking-wide text-xs text-slate-700 dark:text-slate-300">{cat.name}</h4>
                                    </div>
                                    <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                                        {cat.subs.map((s) => {
                                            const val = cycle.managerReview.ratings[s.id] ?? null;
                                            const note = cycle.managerReview.notes[s.id];
                                            return (
                                                <div key={s.id} className="p-4 grid grid-cols-12 gap-4">
                                                    <div className="col-span-12 md:col-span-5">
                                                        <p className="font-medium text-slate-900 dark:text-slate-100">{s.name}</p>
                                                        {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                                                    </div>
                                                    <div className="col-span-12 md:col-span-3">
                                                        {val ? (
                                                            <div className="inline-flex items-center gap-2">
                                                                <span className="inline-flex items-center justify-center h-8 w-8 rounded-md border bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 text-sm">
                                                                    {val}
                                                                </span>
                                                                <span className={cn("text-xs font-medium", RATING_TEXT_TONES[val])}>{RATING_LABELS[val]}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-slate-400">Not rated</span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-12 md:col-span-4 text-sm text-slate-600 dark:text-slate-300 italic">
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

                    {/* PEERS */}
                    <TabsContent value="peer" className="mt-4 space-y-4">
                        {cycle.peerReviews.length === 0 ? (
                            <EmptyState text="No peers nominated yet." />
                        ) : (
                            <>
                                <Card className="border-slate-200 dark:border-slate-800">
                                    <div className="px-5 py-2.5 border-b bg-slate-50 dark:bg-slate-800/50 rounded-t-lg">
                                        <h4 className="font-semibold uppercase tracking-wide text-xs text-slate-700 dark:text-slate-300">Aggregated peer scores</h4>
                                    </div>
                                    <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                                        {peerAggregates.map(({ q, avg, count }) => (
                                            <div key={q.id} className="p-4 flex items-center justify-between">
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
                                            <Card key={p.reviewerId} className="border-dashed border-slate-300 dark:border-slate-700">
                                                <CardContent className="p-4 flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-semibold text-sm">
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
                                        <Card key={p.reviewerId} className="border-slate-200 dark:border-slate-800">
                                            <div className="px-5 py-3 border-b bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between rounded-t-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white flex items-center justify-center font-semibold text-sm">
                                                        {reviewer?.initials}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{reviewer?.name}</p>
                                                        <p className="text-xs text-slate-500">{reviewer?.role}</p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white">Submitted</Badge>
                                            </div>
                                            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
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
                                                    <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Manager calibration note</label>
                                                    <Textarea
                                                        placeholder="Why are you adjusting this peer review? (optional)"
                                                        value={p.overrideNote ?? ""}
                                                        onChange={(e) => updatePeerNote(p.reviewerId, e.target.value)}
                                                        className="mt-1 min-h-[60px] text-sm"
                                                    />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </>
                        )}
                    </TabsContent>

                    {/* SELF */}
                    <TabsContent value="self" className="mt-4 space-y-3">
                        {!cycle.selfReview.submitted && Object.keys(cycle.selfReview.ratings).length === 0 ? (
                            <EmptyState text="Employee has not started their self-review yet." />
                        ) : (
                            <Card className="border-slate-200 dark:border-slate-800">
                                <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
                                    {SELF_QUESTIONS.map((q) => (
                                        <div key={q.id}>
                                            <OverrideRow
                                                label={q.title}
                                                description={q.prompt}
                                                original={cycle.selfReview.ratings[q.id] ?? null}
                                                override={cycle.selfReview.overrides?.[q.id] ?? cycle.selfReview.ratings[q.id] ?? null}
                                                onOverride={(v) => updateSelfOverride(q.id, v)}
                                            />
                                            <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                <Field label="Examples" value={cycle.selfReview.examples[q.id]} />
                                                <Field label="Feedback" value={cycle.selfReview.feedback[q.id]} />
                                                <Field label="Metric" value={cycle.selfReview.metric[q.id]} />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="p-4">
                                        <label className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">Manager calibration note</label>
                                        <Textarea
                                            placeholder="Why are you adjusting the self-assessment? (optional)"
                                            value={cycle.selfReview.overrideNote ?? ""}
                                            onChange={(e) => updateSelfNote(e.target.value)}
                                            className="mt-1 min-h-[60px] text-sm"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

const Field = ({ label, value }: { label: string; value?: string }) => (
    <div className="rounded-md border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-800/30">
        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{label}</p>
        <p className="text-slate-700 dark:text-slate-300 mt-0.5">{value || <span className="text-slate-400 italic">Not provided</span>}</p>
    </div>
);

const ScoreTile = ({ label, value, icon, highlight }: { label: string; value: number | null; icon: React.ReactNode; highlight?: boolean }) => (
    <div className={cn(
        "rounded-lg border p-3",
        highlight
            ? "bg-gradient-to-br from-blue-500 to-blue-700 border-transparent text-white"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
    )}>
        <div className="flex items-center justify-between">
            <p className={cn("text-[10px] uppercase tracking-wide font-medium", highlight ? "text-blue-100" : "text-slate-500")}>{label}</p>
            <div className={cn("h-6 w-6 rounded-md flex items-center justify-center",
                highlight ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                {icon}
            </div>
        </div>
        <p className={cn("text-xl font-bold mt-1", highlight ? "text-white" : "text-slate-900 dark:text-slate-100")}>{fmt(value)}</p>
    </div>
);

const EmptyState = ({ text }: { text: string }) => (
    <Card className="border-dashed border-slate-300 dark:border-slate-700">
        <CardContent className="p-8 text-center text-sm text-slate-500">{text}</CardContent>
    </Card>
);

export default SubmissionsReviewModal;
