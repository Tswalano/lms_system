import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import RatingScale from "@/components/RatingScale";
import StatsCard from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    EMPLOYEES,
    MANAGER_CATEGORIES,
    REVIEW_PERIODS,
    type ReviewPeriod,
    WEIGHTS,
    completion,
    finalScore,
    managerScore,
    peerScore,
    performanceStore,
    selfScore,
    usePerformanceCycles,
} from "@/lib/performanceReview";
import { CheckCircle2, ChevronRight, Eye, Sparkles, UserCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const formatScore = (n: number | null) => (n == null ? "—" : n.toFixed(1));

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

const CARD_ACCENTS = [
    "border-l-purple-400 dark:border-l-purple-300",
    "border-l-blue-400 dark:border-l-blue-300",
    "border-l-green-400 dark:border-l-green-300",
    "border-l-orange-400 dark:border-l-orange-300",
    "border-l-indigo-400 dark:border-l-indigo-300",
    "border-l-pink-400 dark:border-l-pink-300",
    "border-l-cyan-400 dark:border-l-cyan-300",
    "border-l-teal-400 dark:border-l-teal-300",
];

const getCardAccent = (id: string) => {
    const hash = id.split("").reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
    return CARD_ACCENTS[Math.abs(hash) % CARD_ACCENTS.length];
};

const shellCardClass = "rounded-2xl border border-gray-200/70 bg-white/95 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/95";
const softPanelClass = "rounded-2xl border border-gray-200/80 bg-gray-50/80 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70";
const appTextareaClass = "min-h-[88px] rounded-2xl border-gray-200 bg-white/95 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500/70 focus-visible:ring-offset-0 dark:border-slate-600 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500";
const appOutlineButtonClass = "rounded-lg border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";
const appPrimaryButtonClass = "rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";

const PerformanceReviewAdmin = () => {
    const navigate = useNavigate();
    const [selectedPeriod, setSelectedPeriod] = useState<ReviewPeriod>("2026 Cycle");
    const [createCycleOpen, setCreateCycleOpen] = useState(false);
    const [newCycleName, setNewCycleName] = useState("");
    const cycles = usePerformanceCycles(selectedPeriod);
    const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
    const [nominateFor, setNominateFor] = useState<string | null>(null);

    const handleCreateCycle = () => {
        if (newCycleName.trim()) {
            // TODO: Call API to create new cycle
            console.log("Creating cycle:", newCycleName);
            setCreateCycleOpen(false);
            setNewCycleName("");
        }
    };

    const stats = useMemo(() => {
        const total = cycles.length;
        const submitted = cycles.filter((c) => c.managerReview.submitted).length;
        const nominated = cycles.filter((c) => c.nominatedPeerIds.length === 3).length;
        const avgFinal = cycles.map((c) => finalScore(c)).filter((v): v is number => v != null);
        const avg = avgFinal.length ? avgFinal.reduce((a, b) => a + b, 0) / avgFinal.length : null;
        return { total, submitted, nominated, avg };
    }, [cycles]);

    const activeCycle = activeEmployeeId ? cycles.find((c) => c.employeeId === activeEmployeeId) : null;
    const activeEmployee = activeEmployeeId ? EMPLOYEES.find((e) => e.id === activeEmployeeId) : null;
    const nominateCycle = nominateFor ? cycles.find((c) => c.employeeId === nominateFor) : null;
    const nominateEmployee = nominateFor ? EMPLOYEES.find((e) => e.id === nominateFor) : null;

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
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Performance Review</h1>
                            <p className="text-gray-600 dark:text-gray-400">{selectedPeriod} · {cycles.length} cycles · Nominate, Manage and Review</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="w-full sm:w-[220px]">
                            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReviewPeriod)}>
                                <SelectTrigger className="h-11 rounded-2xl border-gray-200 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-800/90">
                                    <SelectValue placeholder="Select cycle" />
                                </SelectTrigger>
                                <SelectContent>
                                    {REVIEW_PERIODS.map((period) => (
                                        <SelectItem key={period} value={period}>{period}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={() => setCreateCycleOpen(true)}
                            className={appPrimaryButtonClass}
                        >
                            + New Cycle
                        </Button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                    <StatsCard label="Employees in cycle" value={stats.total} subtitle="in this cycle" tone="blue" icon={<Users className="w-5 h-5" />} />
                    <StatsCard label="Peers nominated" value={`${stats.nominated}/${stats.total}`} subtitle="nominations complete" tone="violet" icon={<UserCheck className="w-5 h-5" />} />
                    <StatsCard label="Manager reviews submitted" value={`${stats.submitted}/${stats.total}`} subtitle="appraisals done" tone="emerald" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <StatsCard label="Avg final score" value={stats.avg == null ? "—" : stats.avg.toFixed(1)} subtitle="across all employees" tone="amber" icon={<Sparkles className="w-5 h-5" />} />
                </div>
            </div>

            {/* Employee Cycle List */}
            <div className="space-y-3">
                {cycles.map((c) => {
                    const emp = EMPLOYEES.find((e) => e.id === c.employeeId)!;
                    const pct = completion(c);
                    const cardAccent = getCardAccent(c.employeeId);
                    const gradient = getEmployeeGradient(c.employeeId);

                    return (
                        <div
                            key={c.employeeId}
                            className={cn(
                                softPanelClass,
                                "overflow-hidden border-l-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-slate-950/20",
                                cardAccent
                            )}
                        >
                            <div className="p-5">
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Avatar + Name */}
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                                            <span className="text-white font-semibold text-lg">{emp.initials}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg leading-tight">{emp.name}</h3>
                                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                    {emp.role}
                                                </span>
                                                {c.managerReview.submitted && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                        Manager submitted
                                                    </span>
                                                )}
                                                {c.nominatedPeerIds.length === 3 ? (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400">
                                                        Peers nominated
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                                                        Needs peer nomination
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Progress value={pct} className="flex-1 h-2 max-w-[200px]" />
                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{pct}% complete</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Score Pills */}
                                    <div className="hidden md:flex items-center gap-3">
                                        <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={managerScore(c)} />
                                        <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={peerScore(c)} />
                                        <ScorePill label={`Self ${WEIGHTS.self}%`} value={selfScore(c)} />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setNominateFor(c.employeeId)}
                                            className={appOutlineButtonClass}
                                        >
                                            Nominate peers
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/performance-review-admin/submissions/${c.employeeId}?period=${encodeURIComponent(selectedPeriod)}`)}
                                            className={appOutlineButtonClass}
                                        >
                                            <Eye className="w-4 h-4 mr-1" /> Review submissions
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setActiveEmployeeId(c.employeeId)}
                                            className={appPrimaryButtonClass}
                                        >
                                            Open appraisal <ChevronRight className="w-4 h-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Manager appraisal modal */}
            <Dialog open={!!activeCycle} onOpenChange={(o) => !o && setActiveEmployeeId(null)}>
                <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                    {activeCycle && activeEmployee && (
                        <>
                            <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                                <DialogTitle>Manager Appraisal — {activeEmployee.name}</DialogTitle>
                                <DialogDescription>
                                    Rate each sub-category from 1 (Needs Improvement) to 5 (Exceptional). Weight: {WEIGHTS.manager}% of final score.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5 px-6 py-5">
                                {MANAGER_CATEGORIES.map((cat) => (
                                    <div key={cat.id} className={cn(shellCardClass, "overflow-hidden rounded-[24px]")}>
                                        <div className="bg-gray-50/90 px-5 py-3 dark:bg-slate-800/70 border-b border-gray-200/70 dark:border-slate-700/70">
                                            <h3 className="font-semibold uppercase tracking-wide text-sm text-gray-700 dark:text-gray-300">{cat.name}</h3>
                                        </div>
                                        <div className="divide-y divide-gray-200/70 dark:divide-slate-700/70">
                                            {cat.subs.map((s) => (
                                                <div key={s.id} className="grid grid-cols-12 gap-4 p-4 items-start">
                                                    <div className="col-span-12 md:col-span-4">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100">{s.name}</p>
                                                        {s.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.description}</p>}
                                                        <span className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                                                            Weight {s.weight}%
                                                        </span>
                                                    </div>
                                                    <div className="col-span-6 md:col-span-4">
                                                        <RatingScale
                                                            value={activeCycle.managerReview.ratings[s.id] ?? null}
                                                            onChange={(v) => performanceStore.update(activeCycle.employeeId, activeCycle.period, (c) => ({
                                                                ...c,
                                                                managerReview: { ...c.managerReview, ratings: { ...c.managerReview.ratings, [s.id]: v } },
                                                            }))}
                                                        />
                                                    </div>
                                                    <div className="col-span-6 md:col-span-4">
                                                        <Textarea
                                                            placeholder="Add notes…"
                                                            value={activeCycle.managerReview.notes[s.id] ?? ""}
                                                            onChange={(e) => performanceStore.update(activeCycle.employeeId, activeCycle.period, (c) => ({
                                                                ...c,
                                                                managerReview: { ...c.managerReview, notes: { ...c.managerReview.notes, [s.id]: e.target.value } },
                                                            }))}
                                                            className={cn(appTextareaClass, "min-h-[96px]")}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Score so far: <span className="font-semibold text-gray-900 dark:text-gray-100">{formatScore(managerScore(activeCycle))}</span>
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setActiveEmployeeId(null)} className={appOutlineButtonClass}>Save & close</Button>
                                    <Button
                                        className={appPrimaryButtonClass}
                                        onClick={() => {
                                            performanceStore.update(activeCycle.employeeId, activeCycle.period, (c) => ({
                                                ...c,
                                                managerReview: { ...c.managerReview, submitted: true },
                                            }));
                                            setActiveEmployeeId(null);
                                        }}
                                        disabled={Object.values(activeCycle.managerReview.ratings).filter((v) => v != null).length === 0}
                                    >
                                        Submit appraisal
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Nominate peers modal */}
            <Dialog open={!!nominateCycle} onOpenChange={(o) => !o && setNominateFor(null)}>
                <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                    {nominateCycle && nominateEmployee && (
                        <>
                            <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                                <DialogTitle>Nominate 3 peers for {nominateEmployee.name}</DialogTitle>
                                <DialogDescription>
                                    Once you submit the manager appraisal, these peers will be assigned to review {nominateEmployee.name.split(" ")[0]}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-[400px] space-y-2 overflow-y-auto px-6 py-5">
                                {EMPLOYEES.filter((e) => e.id !== nominateCycle.employeeId).map((e) => {
                                    const selected = nominateCycle.nominatedPeerIds.includes(e.id);
                                    const disabled = !selected && nominateCycle.nominatedPeerIds.length >= 3;
                                    const peerGradient = getEmployeeGradient(e.id);
                                    return (
                                        <button
                                            key={e.id}
                                            disabled={disabled}
                                            onClick={() => performanceStore.update(nominateCycle.employeeId, nominateCycle.period, (c) => {
                                                const next = selected
                                                    ? c.nominatedPeerIds.filter((id) => id !== e.id)
                                                    : [...c.nominatedPeerIds, e.id];
                                                return {
                                                    ...c,
                                                    nominatedPeerIds: next,
                                                    peerReviews: next.map(
                                                        (pid) => c.peerReviews.find((p) => p.reviewerId === pid) ?? { reviewerId: pid, ratings: {}, feedback: {}, notes: {}, submitted: false }
                                                    ),
                                                };
                                            })}
                                            className={cn(
                                                "w-full flex items-center gap-3 rounded-2xl border p-3 transition-all text-left shadow-sm",
                                                selected
                                                    ? "border-cyan-300 bg-cyan-50/90 dark:bg-cyan-950/20 dark:border-cyan-700"
                                                    : "border-gray-200 bg-white/90 dark:border-slate-700 dark:bg-slate-800/80 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800",
                                                disabled && "opacity-50 cursor-not-allowed"
                                            )}
                                        >
                                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${peerGradient} text-white flex items-center justify-center text-sm font-semibold flex-shrink-0`}>
                                                {e.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{e.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{e.role}</p>
                                            </div>
                                            {selected && <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex items-center justify-between border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{nominateCycle.nominatedPeerIds.length}/3 selected</p>
                                <Button
                                    className={appPrimaryButtonClass}
                                    onClick={() => setNominateFor(null)}
                                >
                                    Done
                                </Button>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>


            {/* // Create Cycle Dialog */}
            <Dialog open={createCycleOpen} onOpenChange={setCreateCycleOpen}>
                <DialogContent className="max-w-lg overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">

                    {/* Header */}
                    <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Create New Review Cycle
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Set up a new performance cycle for all employees.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Body */}
                    <div className="px-6 py-6 space-y-5">

                        <div className="space-y-2">
                            <label
                                htmlFor="cycleName"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Cycle Name
                            </label>

                            <input
                                id="cycleName"
                                type="text"
                                placeholder="e.g., 2027 Cycle"
                                value={newCycleName}
                                onChange={(e) => setNewCycleName(e.target.value)}
                                className="
                        w-full h-11 rounded-xl
                        border border-gray-200
                        bg-white/90
                        px-3 text-sm
                        shadow-sm
                        transition-all
                        placeholder:text-gray-400
                        focus:outline-none
                        focus:ring-2 focus:ring-cyan-500/70
                        focus:border-cyan-400
                        dark:border-slate-600
                        dark:bg-slate-800/90
                        dark:text-gray-100
                        dark:placeholder:text-slate-500
                    "
                            />
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">

                        <Button
                            variant="outline"
                            onClick={() => setCreateCycleOpen(false)}
                            className="rounded-xl border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-gray-200 dark:hover:bg-slate-700"
                        >
                            Cancel
                        </Button>

                        <Button
                            onClick={handleCreateCycle}
                            className="rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700"
                        >
                            Create Cycle
                        </Button>

                    </div>

                </DialogContent>
            </Dialog>
        </div>
    );
};

const ScorePill = ({ label, value }: { label: string; value: number | null }) => (
    <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{label}</span>
        <span className={cn(
            "rounded-xl border px-3 py-1.5 text-sm font-semibold shadow-sm",
            value == null
                ? "border-gray-200 dark:border-slate-700 text-gray-400 bg-gray-50/90 dark:bg-slate-800/90"
                : "border-emerald-200 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
        )}>
            {value == null ? "—" : value.toFixed(1)}
        </span>
    </div>
);

export default PerformanceReviewAdmin;
