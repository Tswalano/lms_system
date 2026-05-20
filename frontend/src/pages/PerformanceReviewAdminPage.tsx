import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "@/components/ui/StatsCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    usePerformanceCycles,
    useAdminPerformanceSummary,
    useManagerReviews,
    useCreateCycle,
    useActivateCycle,
    useCloseCycle,
    useEmployeeNominations,
    useSetNominations,
    useCycleExport,
    type ReviewCycleApi,
    type AdminSummaryItemApi,
    type NominationAssignment,
    type CycleExportApi,
} from "@/hooks/usePerformanceReview";
import { WEIGHTS } from "@/lib/performanceReview";
import { CheckCircle2, ClipboardEdit, Download, Eye, History, Loader2, Sparkles, UserCheck, UserPlus, Users, Zap, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/lib/helper";

const formatScore = (n: number | null) => (n == null ? "—" : n.toFixed(1));
const fmtPct = (n: number | null) => (n == null ? "—" : `${n.toFixed(1)}%`);

// ── History tab helpers ───────────────────────────────────────────────────────

function buildCsvRows(data: CycleExportApi): string[][] {
    const rows: string[][] = [];
    rows.push([`Cycle: ${data.cycle.name}`]);
    rows.push([`Period: ${formatDate(new Date(data.cycle.startDate))} to ${formatDate(new Date(data.cycle.endDate))}`]);
    rows.push([]);
    rows.push(["=== SCORE SUMMARY ==="]);
    rows.push(["Employee", "Job Title", `Manager Score (${WEIGHTS.manager}%)`, `Peer Score (${WEIGHTS.peer}%)`, `Self Score (${WEIGHTS.self}%)`, "Final Score (%)"]);
    for (const emp of data.employees) {
        rows.push([emp.employeeName, emp.jobTitle, fmtPct(emp.managerScore), fmtPct(emp.peerScore), fmtPct(emp.selfScore), fmtPct(emp.finalScore)]);
    }
    rows.push([]);
    rows.push(["=== MANAGER APPRAISAL FEEDBACK ==="]);
    rows.push(["Employee", "Category", "Subcategory", "Rating (1-5)", "Notes"]);
    for (const emp of data.employees) {
        for (const fb of emp.managerFeedback) {
            rows.push([emp.employeeName, fb.category, fb.subcategory, fb.rating != null ? String(fb.rating) : "—", fb.notes]);
        }
    }
    rows.push([]);
    rows.push(["=== PEER FEEDBACK ==="]);
    rows.push(["Employee", "Reviewer", "Category", "Rating (1-5)"]);
    for (const emp of data.employees) {
        for (const fb of emp.peerFeedback) {
            rows.push([emp.employeeName, fb.reviewerName, fb.category, fb.rating != null ? String(fb.rating) : "—"]);
        }
    }
    rows.push([]);
    rows.push(["=== SELF-REVIEW RESPONSES ==="]);
    rows.push(["Employee", "Category", "Question", "Response"]);
    for (const emp of data.employees) {
        for (const fb of emp.selfFeedback) {
            rows.push([emp.employeeName, fb.category, fb.questionText, fb.response]);
        }
    }
    return rows;
}

function downloadCsv(rows: string[][], filename: string) {
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

const HistoryScoreBadge = ({ value, highlight }: { value: number | null; highlight?: boolean }) => (
    <span className={cn(
        "inline-block rounded-lg border px-2.5 py-1 text-sm font-semibold",
        value == null
            ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800"
            : highlight
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
    )}>
        {fmtPct(value)}
    </span>
);

const CycleExportPanel = ({ cycleId, cycleName }: { cycleId: string; cycleName: string }) => {
    const { data, isLoading } = useCycleExport(cycleId);
    const [exporting, setExporting] = useState(false);

    const handleExport = () => {
        if (!data) return;
        setExporting(true);
        try {
            downloadCsv(buildCsvRows(data), `${cycleName.replace(/\s+/g, "_")}_review_export.csv`);
        } finally {
            setExporting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Loading cycle data…</span>
            </div>
        );
    }
    if (!data) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.employees.length} employees · {formatDate(new Date(data.cycle.startDate))} – {formatDate(new Date(data.cycle.endDate))}
                </p>
                <Button onClick={handleExport} disabled={exporting} className={cn(appPrimaryButtonClass, "gap-1.5")}>
                    <Download className="w-4 h-4" />
                    {exporting ? "Exporting…" : "Export to CSV"}
                </Button>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300">Score Summary</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-slate-700 text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                <th className="text-left px-5 py-3">Employee</th>
                                <th className="text-left px-4 py-3">Role</th>
                                <th className="text-center px-4 py-3">Manager {WEIGHTS.manager}%</th>
                                <th className="text-center px-4 py-3">Peer {WEIGHTS.peer}%</th>
                                <th className="text-center px-4 py-3">Self {WEIGHTS.self}%</th>
                                <th className="text-center px-4 py-3">Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                            {data.employees.map((emp) => (
                                <tr key={emp.employeeName} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                    <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100">{emp.employeeName}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{emp.jobTitle}</td>
                                    <td className="px-4 py-3 text-center"><HistoryScoreBadge value={emp.managerScore} /></td>
                                    <td className="px-4 py-3 text-center"><HistoryScoreBadge value={emp.peerScore} /></td>
                                    <td className="px-4 py-3 text-center"><HistoryScoreBadge value={emp.selfScore} /></td>
                                    <td className="px-4 py-3 text-center"><HistoryScoreBadge value={emp.finalScore} highlight /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

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

const softPanelClass = "rounded-2xl border border-gray-200/80 bg-gray-50/80 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70";
const appOutlineButtonClass = "rounded-lg border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";
const appPrimaryButtonClass = "rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";

const REVIEW_STATUS_BADGES: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    peer_review_pending: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400",
    peer_reviews_in_progress: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
    peer_reviews_complete: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    submitted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

const formatReviewStatus = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const PerformanceReviewAdminPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<'cycles' | 'history'>('cycles');
    const [selectedCycleId, setSelectedCycleId] = useState<string>("");
    const [selectedHistoryCycleId, setSelectedHistoryCycleId] = useState<string | null>(null);
    const [createCycleOpen, setCreateCycleOpen] = useState(false);
    const [newCycleName, setNewCycleName] = useState("");
    const [newStartDate, setNewStartDate] = useState("");
    const [newEndDate, setNewEndDate] = useState("");
    const [nominationTarget, setNominationTarget] = useState<{ employeeId: string; employeeName: string; employeeSystemRole: string } | null>(null);

    const { data: allCycles = [], isLoading: cyclesLoading } = usePerformanceCycles();
    // Only show draft/active cycles in the main view; closed cycles live in History tab
    const cycles = allCycles.filter((c) => c.status !== 'closed');
    const closedCycles = allCycles.filter((c) => c.status === 'closed');
    const activeCycleId = selectedCycleId || cycles[0]?.id || "";
    const selectedCycle = cycles.find((c) => c.id === activeCycleId);
    const selectedHistoryCycle = closedCycles.find((c) => c.id === selectedHistoryCycleId);

    const { data: summary = [], isLoading: summaryLoading } = useAdminPerformanceSummary(activeCycleId || undefined);
    const { data: managerReviews = [] } = useManagerReviews(activeCycleId || undefined);

    // Build a lookup: employeeId → reviewId for appraisals this user must write
    // Exclude own record — admins/managers cannot write their own appraisal
    const myAppraisalMap = Object.fromEntries(
        managerReviews
            .filter((r) => r.employee.id !== user?.id)
            .map((r) => [r.employee.id, r.reviewId])
    );

    const createCycle = useCreateCycle();
    const activateCycle = useActivateCycle();
    const closeCycle = useCloseCycle();

    const handleCreateCycle = async () => {
        if (!newCycleName.trim() || !newStartDate || !newEndDate) return;
        try {
            await createCycle.mutateAsync({ name: newCycleName.trim(), startDate: newStartDate, endDate: newEndDate });
            toast.success("Review cycle created");
            setCreateCycleOpen(false);
            setNewCycleName("");
            setNewStartDate("");
            setNewEndDate("");
        } catch {
            toast.error("Failed to create cycle");
        }
    };

    const handleActivate = async (cycle: ReviewCycleApi) => {
        const tid = toast.loading(`Activating "${cycle.name}" and initialising reviews…`);
        try {
            await activateCycle.mutateAsync(cycle.id);
            toast.dismiss(tid);
            toast.success(`"${cycle.name}" is now active — all reviews initialised`);
        } catch {
            toast.dismiss(tid);
            toast.error("Failed to activate cycle");
        }
    };

    const handleClose = async (cycle: ReviewCycleApi) => {
        try {
            await closeCycle.mutateAsync(cycle.id);
            toast.success(`"${cycle.name}" closed`);
        } catch {
            toast.error("Failed to close cycle");
        }
    };

    const isLoading = cyclesLoading || summaryLoading;
    const allEmployeesForNomination = summary.map((s) => ({ id: s.employee.id, name: s.employee.name, role: s.employee.role }));

    return (
        <div>
            {/* Page Header */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <UserCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Performance Review</h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                {activeView === 'history' ? 'Past closed cycles · scores & feedback export' : selectedCycle ? `${selectedCycle.name} · ${selectedCycle.employeeCount} employees` : "Manage review cycles"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {activeView === 'cycles' && cycles.length > 0 && (
                            <div className="w-full sm:w-[220px]">
                                <Select value={activeCycleId} onValueChange={setSelectedCycleId}>
                                    <SelectTrigger className="h-11 rounded-lg border-gray-200 bg-white/90 shadow-sm dark:border-slate-600 dark:bg-slate-800/90">
                                        <SelectValue placeholder={cyclesLoading ? "Loading…" : "Select cycle"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {cycles.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.name} <span className="text-gray-400">({c.status})</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {activeView === 'cycles' && selectedCycle?.status === "draft" && (
                            <Button
                                onClick={() => handleActivate(selectedCycle)}
                                disabled={activateCycle.isPending}
                                className="rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm hover:from-emerald-700 hover:to-teal-700 gap-1.5"
                            >
                                <Zap className="w-4 h-4" /> {activateCycle.isPending ? "Activating…" : "Activate"}
                            </Button>
                        )}
                        {activeView === 'cycles' && selectedCycle?.status === "active" && (
                            <Button
                                variant="outline"
                                onClick={() => handleClose(selectedCycle)}
                                disabled={closeCycle.isPending}
                                className={cn(appOutlineButtonClass, "gap-1.5")}
                            >
                                <Lock className="w-4 h-4" /> Close cycle
                            </Button>
                        )}
                        {activeView === 'cycles' && (
                            <Button onClick={() => setCreateCycleOpen(true)} className={appPrimaryButtonClass}>
                                + New Cycle
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tab toggle */}
                <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-slate-800 w-fit mb-6">
                    <button
                        onClick={() => setActiveView('cycles')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeView === 'cycles'
                                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        )}
                    >
                        Active Cycles
                    </button>
                    <button
                        onClick={() => setActiveView('history')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                            activeView === 'history'
                                ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        )}
                    >
                        <History className="w-3.5 h-3.5" /> History
                    </button>
                </div>

                {/* Stat Cards — only in cycles view */}
                {activeView === 'cycles' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <StatsCard label="Employees in cycle" value={selectedCycle?.employeeCount ?? "—"} subtitle="in this cycle" tone="blue" icon={<Users className="w-5 h-5" />} />
                        <StatsCard label="Peers assigned" value={selectedCycle ? `${selectedCycle.nominatedCount}/${selectedCycle.employeeCount}` : "—"} subtitle="peer assignments done" tone="violet" icon={<UserCheck className="w-5 h-5" />} />
                        <StatsCard label="Reviews submitted" value={selectedCycle ? `${selectedCycle.submittedCount}/${selectedCycle.employeeCount}` : "—"} subtitle="self-reviews complete" tone="emerald" icon={<CheckCircle2 className="w-5 h-5" />} />
                        <StatsCard label="Avg final score" value={selectedCycle?.avgFinalScore == null ? "—" : selectedCycle.avgFinalScore.toFixed(1)} subtitle="across all employees" tone="amber" icon={<Sparkles className="w-5 h-5" />} />
                    </div>
                )}
            </div>

            {/* History Tab */}
            {activeView === 'history' && (
                cyclesLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
                        <span className="text-sm text-gray-500">Loading cycles…</span>
                    </div>
                ) : closedCycles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-14 text-center">
                        <History className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                        <p className="font-semibold text-gray-700 dark:text-gray-300">No closed cycles yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Once a review cycle is closed it will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-1 mb-3">Closed Cycles</p>
                            {closedCycles.map((cycle) => (
                                <button
                                    key={cycle.id}
                                    onClick={() => setSelectedHistoryCycleId(cycle.id === selectedHistoryCycleId ? null : cycle.id)}
                                    className={cn(
                                        "w-full text-left rounded-2xl border p-4 transition-all",
                                        cycle.id === selectedHistoryCycleId
                                            ? "border-blue-400 bg-blue-50/80 dark:border-blue-600 dark:bg-blue-900/20 shadow-md"
                                            : "border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 hover:border-gray-300 hover:shadow-sm"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{cycle.name}</p>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">Closed</span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(new Date(cycle.startDate))} – {formatDate(new Date(cycle.endDate))}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cycle.employeeCount} employees</span>
                                        {cycle.avgFinalScore != null && (
                                            <span className="font-medium text-blue-600 dark:text-blue-400">Avg {cycle.avgFinalScore.toFixed(1)}%</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                        <div className="lg:col-span-2">
                            {!selectedHistoryCycle ? (
                                <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-14 text-center h-full flex flex-col items-center justify-center">
                                    <History className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Select a cycle to view scores and export data</p>
                                </div>
                            ) : (
                                <CycleExportPanel cycleId={selectedHistoryCycle.id} cycleName={selectedHistoryCycle.name} />
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Employee List — cycles view */}
            {activeView === 'cycles' && (isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading cycle data…</p>
                    </div>
                </div>
            ) : cycles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/90 p-10 text-center dark:border-slate-600 dark:bg-slate-900/90">
                    <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No cycle available</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">There are no performance cycles yet. Create one to get started.</p>
                    <Button onClick={() => setCreateCycleOpen(true)} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700">
                        Create Cycle
                    </Button>
                </div>
            ) : summary.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/90 p-10 text-center dark:border-slate-600 dark:bg-slate-900/90">
                    <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
                    <p className="font-semibold text-gray-700 dark:text-gray-300">No employees in this cycle</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {selectedCycle?.status === "draft" ? "Activate the cycle to auto-assign employees and peers." : "Select a cycle above or create a new one."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {summary.map((item) => (
                        <EmployeeCard
                            key={item.employee.id}
                            item={item}
                            appraisalReviewId={myAppraisalMap[item.employee.id]}
                            onViewSubmissions={() => navigate(`/performance-review-admin/submissions/${item.employee.id}?cycleId=${activeCycleId}`)}
                            onWriteAppraisal={(reviewId) => navigate(`/performance-review/appraisal/${reviewId}`)}
                            onManagePeers={() => setNominationTarget({ employeeId: item.employee.id, employeeName: item.employee.name, employeeSystemRole: item.employee.systemRole })}
                        />
                    ))}
                </div>
            ))}

            {/* Create Cycle Dialog */}
            <Dialog open={createCycleOpen} onOpenChange={setCreateCycleOpen}>
                <DialogContent className="overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                    <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                        <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Create New Review Cycle</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set a name and date range for the cycle.</DialogDescription>
                    </DialogHeader>
                    <div className="px-6 py-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cycle Name</label>
                            <Input placeholder="e.g. 2026 Mid-Year Review" value={newCycleName} onChange={(e) => setNewCycleName(e.target.value)} className="rounded-xl border-gray-200 dark:border-slate-600" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                                <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className="rounded-xl border-gray-200 dark:border-slate-600" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                                <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="rounded-xl border-gray-200 dark:border-slate-600" />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                        <Button variant="outline" onClick={() => setCreateCycleOpen(false)} className={appOutlineButtonClass}>Cancel</Button>
                        <Button onClick={handleCreateCycle} disabled={!newCycleName.trim() || !newStartDate || !newEndDate || createCycle.isPending} className={appPrimaryButtonClass}>
                            {createCycle.isPending ? "Creating…" : "Create Cycle"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Peer Nomination Modal */}
            {nominationTarget && activeCycleId && (
                <PeerNominationModal
                    employeeId={nominationTarget.employeeId}
                    employeeName={nominationTarget.employeeName}
                    employeeSystemRole={nominationTarget.employeeSystemRole}
                    cycleId={activeCycleId}
                    allEmployees={allEmployeesForNomination}
                    onClose={() => setNominationTarget(null)}
                />
            )}
        </div>
    );
};

const EmployeeCard = ({
    item,
    appraisalReviewId,
    onViewSubmissions,
    onWriteAppraisal,
    onManagePeers,
}: {
    item: AdminSummaryItemApi;
    appraisalReviewId?: string;
    onViewSubmissions: () => void;
    onWriteAppraisal: (reviewId: string) => void;
    onManagePeers: () => void;
}) => {
    const cardAccent = getCardAccent(item.employee.id);
    const gradient = getEmployeeGradient(item.employee.id);
    const initials = getInitials(item.employee.name);
    const statusBadge = REVIEW_STATUS_BADGES[item.reviewStatus] ?? "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300";

    return (
        <div className={cn(softPanelClass, "overflow-hidden border-l-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:hover:shadow-slate-950/20", cardAccent)}>
            <div className="p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <span className="text-white font-semibold text-lg">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg leading-tight">{item.employee.name}</h3>
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">{item.employee.role}</span>
                                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusBadge)}>{formatReviewStatus(item.reviewStatus)}</span>
                            </div>
                            <button
                                onClick={onManagePeers}
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                <UserPlus className="w-3 h-3" />
                                {item.nominatedPeers} peer{item.nominatedPeers !== 1 ? "s" : ""} assigned · Manage
                            </button>
                        </div>
                    </div>

                    {/* Score Pills */}
                    <div className="hidden md:flex items-center gap-3">
                        <ScorePill label={`Manager ${WEIGHTS.manager}%`} value={item.managerScore} />
                        <ScorePill label={`Peer ${WEIGHTS.peer}%`} value={item.peerScore} />
                        <ScorePill label={`Self ${WEIGHTS.self}%`} value={item.selfScore} />
                        <ScorePill label="Final" value={item.finalScore} highlight />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col gap-2 flex-shrink-0">
                        {appraisalReviewId && (
                            <Button size="sm" onClick={() => onWriteAppraisal(appraisalReviewId)} className={cn(appPrimaryButtonClass, "gap-1.5")}>
                                <ClipboardEdit className="w-4 h-4" /> Write appraisal
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={onViewSubmissions} className={appOutlineButtonClass}>
                            <Eye className="w-4 h-4 mr-1" /> Review submissions
                        </Button>
                    </div>
                </div>
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
            {formatScore(value)}
        </span>
    </div>
);

const PeerNominationModal = ({
    employeeId,
    employeeName,
    employeeSystemRole,
    cycleId,
    allEmployees,
    onClose,
}: {
    employeeId: string;
    employeeName: string;
    employeeSystemRole: string;
    cycleId: string;
    allEmployees: { id: string; name: string; role: string }[];
    onClose: () => void;
}) => {
    const { data: currentNominations = [], isLoading } = useEmployeeNominations(employeeId, cycleId);
    const setNominations = useSetNominations();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [search, setSearch] = useState("");
    const initialized = useRef(false);

    // Only sync from server once — React Query returns a new array reference on every
    // background refetch, which would otherwise reset the user's in-progress selections.
    useEffect(() => {
        if (!isLoading && !initialized.current) {
            setSelectedIds(new Set(currentNominations.map((n: NominationAssignment) => n.reviewerId)));
            initialized.current = true;
        }
    }, [isLoading, currentNominations]);

    // Admins and managers are reviewed by exactly 3 peers; employees 3–5
    const isManagerRole = employeeSystemRole === 'admin' || employeeSystemRole === 'manager';
    const MIN_PEERS = 3;
    const MAX_PEERS = isManagerRole ? 3 : 5;

    const toggle = (id: string) => {
        const asgn = currentNominations.find((n: NominationAssignment) => n.reviewerId === id);
        if (asgn && !asgn.canRemove) return;
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                if (next.size >= MAX_PEERS) {
                    toast.warning(`You can select a maximum of ${MAX_PEERS} peer reviewers`);
                    return prev;
                }
                next.add(id);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (selectedIds.size < MIN_PEERS) {
            toast.error(`Please select at least ${MIN_PEERS} peer reviewers`);
            return;
        }
        try {
            await setNominations.mutateAsync({ employeeId, cycleId, peerIds: [...selectedIds] });
            toast.success("Peer reviewers updated");
            onClose();
        } catch {
            toast.error("Failed to update peer reviewers");
        }
    };

    const available = allEmployees.filter(
        (e) => e.id !== employeeId && (!search || e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-lg overflow-hidden rounded-[28px] border border-gray-200/70 bg-white/95 p-0 shadow-[0_24px_80px_rgba(15,23,42,0.18)] dark:border-slate-700/70 dark:bg-slate-900/95">
                <DialogHeader className="border-b border-gray-200/70 px-6 py-5 dark:border-slate-700/70">
                    <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">Manage Peer Reviewers</DialogTitle>
                    <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {employeeName} · {selectedIds.size}/{MAX_PEERS} selected
                        {isManagerRole
                            ? <span className="ml-1 text-gray-400">— exactly {MAX_PEERS} required</span>
                            : selectedIds.size < MIN_PEERS && <span className="ml-1 text-amber-500">— select at least {MIN_PEERS}</span>
                        }
                    </DialogDescription>
                </DialogHeader>
                <div className="px-6 py-4 space-y-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <>
                            <Input
                                placeholder="Search employees…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-xl border-gray-200 dark:border-slate-600"
                            />
                            <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                                {available.map((emp) => {
                                    const isSelected = selectedIds.has(emp.id);
                                    const asgn = currentNominations.find((n: NominationAssignment) => n.reviewerId === emp.id);
                                    const locked = asgn && !asgn.canRemove;
                                    return (
                                        <button
                                            key={emp.id}
                                            type="button"
                                            disabled={!!locked}
                                            onClick={() => toggle(emp.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
                                                locked ? "cursor-not-allowed opacity-60 bg-gray-50 dark:bg-slate-800"
                                                    : isSelected ? "bg-blue-50 dark:bg-blue-900/20"
                                                        : "hover:bg-gray-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                                                isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300 dark:border-slate-500"
                                            )}>
                                                {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{emp.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{emp.role}</p>
                                            </div>
                                            {locked && (
                                                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full flex-shrink-0">
                                                    In progress
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 border-t border-gray-200/70 px-6 py-4 dark:border-slate-700/70">
                    <Button variant="outline" onClick={onClose} className={appOutlineButtonClass}>Cancel</Button>
                    <Button
                        onClick={handleSave}
                        disabled={setNominations.isPending || selectedIds.size < MIN_PEERS || (isManagerRole && selectedIds.size > MAX_PEERS)}
                        className={appPrimaryButtonClass}
                    >
                        {setNominations.isPending ? "Saving…" : "Save reviewers"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PerformanceReviewAdminPage;
