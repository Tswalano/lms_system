import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, History, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePerformanceCycles, useCycleExport, type CycleExportApi } from "@/hooks/usePerformanceReview";
import { WEIGHTS } from "@/lib/performanceReview";
import { formatDate } from "@/lib/helper";

const appPrimaryButtonClass = "rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-sm hover:from-cyan-700 hover:via-blue-700 hover:to-indigo-700";
const appOutlineButtonClass = "rounded-lg border-gray-200 bg-white/90 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-700";

const fmt = (n: number | null) => (n == null ? "—" : `${n.toFixed(1)}%`);

// ── CSV export ────────────────────────────────────────────────────────────────

function buildCsvRows(data: CycleExportApi): string[][] {
    const rows: string[][] = [];

    // ── Sheet 1: Summary ──────────────────────────────────────────────────────
    rows.push([`Cycle: ${data.cycle.name}`]);
    rows.push([`Period: ${formatDate(new Date(data.cycle.startDate))} to ${formatDate(new Date(data.cycle.endDate))}`]);
    rows.push([]);
    rows.push(["=== SCORE SUMMARY ==="]);
    rows.push(["Employee", "Job Title", `Manager Score (${WEIGHTS.manager}%)`, `Peer Score (${WEIGHTS.peer}%)`, `Self Score (${WEIGHTS.self}%)`, "Final Score (%)"]);
    for (const emp of data.employees) {
        rows.push([emp.employeeName, emp.jobTitle, fmt(emp.managerScore), fmt(emp.peerScore), fmt(emp.selfScore), fmt(emp.finalScore)]);
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
    const csv = rows
        .map((row) =>
            row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

const ScoreBadge = ({ value, highlight }: { value: number | null; highlight?: boolean }) => (
    <span className={cn(
        "inline-block rounded-lg border px-2.5 py-1 text-sm font-semibold",
        value == null
            ? "border-gray-200 bg-gray-50 text-gray-400 dark:border-slate-700 dark:bg-slate-800"
            : highlight
                ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
    )}>
        {fmt(value)}
    </span>
);

const CycleExportPanel = ({ cycleId, cycleName }: { cycleId: string; cycleName: string }) => {
    const { data, isLoading } = useCycleExport(cycleId);
    const [exporting, setExporting] = useState(false);

    const handleExport = () => {
        if (!data) return;
        setExporting(true);
        try {
            const rows = buildCsvRows(data);
            downloadCsv(rows, `${cycleName.replace(/\s+/g, "_")}_review_export.csv`);
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
            {/* Export bar */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {data.employees.length} employees · {formatDate(new Date(data.cycle.startDate))} – {formatDate(new Date(data.cycle.endDate))}
                </p>
                <Button onClick={handleExport} disabled={exporting} className={cn(appPrimaryButtonClass, "gap-1.5")}>
                    <Download className="w-4 h-4" />
                    {exporting ? "Exporting…" : "Export to CSV"}
                </Button>
            </div>

            {/* Score table */}
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
                                    <td className="px-4 py-3 text-center"><ScoreBadge value={emp.managerScore} /></td>
                                    <td className="px-4 py-3 text-center"><ScoreBadge value={emp.peerScore} /></td>
                                    <td className="px-4 py-3 text-center"><ScoreBadge value={emp.selfScore} /></td>
                                    <td className="px-4 py-3 text-center"><ScoreBadge value={emp.finalScore} highlight /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────────

const PerformanceReviewHistoryPage = () => {
    const navigate = useNavigate();
    const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
    const { data: allCycles = [], isLoading } = usePerformanceCycles();
    const closedCycles = allCycles.filter((c) => c.status === "closed");

    const selectedCycle = closedCycles.find((c) => c.id === selectedCycleId);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button
                    variant="ghost"
                    onClick={() => navigate("/performance-review-admin")}
                    className="px-2 mb-4 text-gray-500 hover:text-gray-900 hover:bg-transparent dark:text-gray-400 dark:hover:text-gray-200"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to reviews
                </Button>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                        <History className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Review History</h1>
                        <p className="text-gray-600 dark:text-gray-400">Past closed cycles · scores &amp; feedback export</p>
                    </div>
                </div>
            </div>

            {isLoading ? (
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
                    {/* Cycle list */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 px-1 mb-3">Closed Cycles</p>
                        {closedCycles.map((cycle) => (
                            <button
                                key={cycle.id}
                                onClick={() => setSelectedCycleId(cycle.id === selectedCycleId ? null : cycle.id)}
                                className={cn(
                                    "w-full text-left rounded-2xl border p-4 transition-all",
                                    cycle.id === selectedCycleId
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

                    {/* Detail panel */}
                    <div className="lg:col-span-2">
                        {!selectedCycle ? (
                            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-14 text-center h-full flex flex-col items-center justify-center">
                                <History className="w-8 h-8 text-gray-300 dark:text-slate-600 mb-3" />
                                <p className="text-sm text-gray-500 dark:text-gray-400">Select a cycle to view scores and export data</p>
                            </div>
                        ) : (
                            <CycleExportPanel cycleId={selectedCycle.id} cycleName={selectedCycle.name} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceReviewHistoryPage;
