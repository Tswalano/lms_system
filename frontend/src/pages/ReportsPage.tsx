/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp, Users, Calendar, Download, RefreshCw,
    ChevronUp, ChevronDown, BarChart3, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// ── types ────────────────────────────────────────────────────────────────────

interface DateRange { start: string; end: string }

interface EmployeeSummary {
    userId: string;
    name: string;
    totalDays: number;
    breakdown: Record<string, number>;
}

interface MonthlyPoint {
    month: string;
    requestCount: number;
    totalDays: number;
    uniqueEmployees: number;
}

interface DeptTotal { department: string; totalDays: number }

interface LeaveTypeRow {
    leaveType: string;
    requestCount: number;
    totalDays: number;
    uniqueEmployees: number;
    daysPct: number;
    requestPct: number;
}

// ── constants ────────────────────────────────────────────────────────────────

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

const PRESET_RANGES: { label: string; getValue: () => DateRange }[] = [
    {
        label: 'This Year',
        getValue: () => {
            const y = new Date().getFullYear();
            return { start: `${y}-01-01`, end: `${y}-12-31` };
        }
    },
    {
        label: 'This Quarter',
        getValue: () => {
            const now = new Date();
            const q = Math.floor(now.getMonth() / 3);
            const y = now.getFullYear();
            const qStart = new Date(y, q * 3, 1);
            const qEnd = new Date(y, q * 3 + 3, 0);
            return {
                start: qStart.toISOString().slice(0, 10),
                end: qEnd.toISOString().slice(0, 10)
            };
        }
    },
    {
        label: 'Last 6 Months',
        getValue: () => {
            const end = new Date();
            const start = new Date();
            start.setMonth(start.getMonth() - 6);
            return {
                start: start.toISOString().slice(0, 10),
                end: end.toISOString().slice(0, 10)
            };
        }
    },
    {
        label: 'Last Year',
        getValue: () => {
            const y = new Date().getFullYear() - 1;
            return { start: `${y}-01-01`, end: `${y}-12-31` };
        }
    }
];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtMonth(ym: string) {
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

function exportCSV(employees: EmployeeSummary[], range: DateRange) {
    if (!employees.length) return;
    const allTypes = [...new Set(employees.flatMap(e => Object.keys(e.breakdown)))];
    const header = ['Name', 'Total Days', ...allTypes];
    const rows = employees.map(e => [
        e.name,
        e.totalDays,
        ...allTypes.map(t => e.breakdown[t] ?? 0)
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-summary-${range.start}-to-${range.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: React.ElementType; label: string; value: string | number; sub?: string; color: string
}) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 flex items-start gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            {children}
        </div>
    );
}

function ErrorState({ message }: { message: string }) {
    return (
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {message}
        </div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

type SortKey = 'name' | 'totalDays';
type SortDir = 'asc' | 'desc';

export default function ReportsPage() {
    const { authFetch } = useAuth();

    const [activePreset, setActivePreset] = useState(0);
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('totalDays');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    const range: DateRange = useCustom && customStart && customEnd
        ? { start: customStart, end: customEnd }
        : PRESET_RANGES[activePreset].getValue();

    const qs = `startDate=${range.start}&endDate=${range.end}`;

    const fetchReport = (path: string) => async () => {
        const res = await authFetch(`/reports/${path}?${qs}`);
        if (!res.ok) throw new Error(`Failed to load ${path}`);
        const data = await res.json();
        return data.payload;
    };

    const { data: summary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } =
        useQuery({ queryKey: ['reports-summary', range], queryFn: fetchReport('leave-summary') });

    const { data: coverage, isLoading: coverageLoading, error: coverageError } =
        useQuery({ queryKey: ['reports-coverage', range], queryFn: fetchReport('department-coverage') });

    const { data: peaks, isLoading: peaksLoading, error: peaksError } =
        useQuery({ queryKey: ['reports-peaks', range], queryFn: fetchReport('peak-periods') });

    const { data: breakdown, isLoading: breakdownLoading, error: breakdownError } =
        useQuery({ queryKey: ['reports-breakdown', range], queryFn: fetchReport('leave-type-breakdown') });

    const isLoading = summaryLoading || coverageLoading || peaksLoading || breakdownLoading;

    // Derived stats
    const totalDays: number = breakdown?.totals?.totalDays ?? 0;
    const totalRequests: number = breakdown?.totals?.totalRequests ?? 0;
    const uniqueEmployees: number = summary?.employees?.length ?? 0;
    const topLeaveType: string = breakdown?.breakdown?.[0]?.leaveType ?? '—';
    const avgDays: string = uniqueEmployees > 0
        ? (totalDays / uniqueEmployees).toFixed(1)
        : '0';

    // Sorted employee table
    const sortedEmployees: EmployeeSummary[] = useMemo(() => {
        const employees: EmployeeSummary[] = summary?.employees ?? [];
        return [...employees].sort((a, b) => {
            const av = sortKey === 'name' ? a.name : a.totalDays;
            const bv = sortKey === 'name' ? b.name : b.totalDays;
            if (typeof av === 'string') {
                return sortDir === 'asc'
                    ? (av as string).localeCompare(bv as string)
                    : (bv as string).localeCompare(av as string);
            }
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
    }, [summary, sortKey, sortDir]);

    const allLeaveTypes: string[] = useMemo(() => {
        return [...new Set(sortedEmployees.flatMap(e => Object.keys(e.breakdown)))];
    }, [sortedEmployees]);

    function toggleSort(key: SortKey) {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    }

    const SortIcon = ({ k }: { k: SortKey }) => sortKey !== k ? null :
        sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline ml-1" /> : <ChevronDown className="w-3 h-3 inline ml-1" />;

    const monthlyData = (peaks?.monthly ?? []).map((p: MonthlyPoint) => ({
        ...p, month: fmtMonth(p.month)
    }));

    const deptData: DeptTotal[] = coverage?.departmentTotals ?? [];

    const pieData: LeaveTypeRow[] = breakdown?.breakdown ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">   Reporting & Analytics</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Leave trends and workforce insights
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { refetchSummary(); }}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={() => exportCSV(sortedEmployees, range)}
                        disabled={!sortedEmployees.length}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Date range filter */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
                <div className="flex flex-wrap gap-2">
                    {PRESET_RANGES.map((p, i) => (
                        <button
                            key={p.label}
                            onClick={() => { setActivePreset(i); setUseCustom(false); }}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!useCustom && activePreset === i
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <input
                        type="date"
                        value={customStart}
                        onChange={e => { setCustomStart(e.target.value); setUseCustom(true); }}
                        className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                        type="date"
                        value={customEnd}
                        onChange={e => { setCustomEnd(e.target.value); setUseCustom(true); }}
                        className="text-sm border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Calendar} label="Total Leave Days" value={totalDays} sub={`${range.start} → ${range.end}`} color="bg-blue-500" />
                <StatCard icon={TrendingUp} label="Total Requests" value={totalRequests} sub="approved only" color="bg-emerald-500" />
                <StatCard icon={Users} label="Avg Days / Employee" value={avgDays} sub={`across ${uniqueEmployees} employees`} color="bg-violet-500" />
                <StatCard icon={BarChart3} label="Top Leave Type" value={topLeaveType} sub={`${breakdown?.breakdown?.[0]?.daysPct ?? 0}% of days`} color="bg-amber-500" />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly trend line chart */}
                <SectionCard title="Monthly Leave Trend">
                    {peaksError ? <ErrorState message="Failed to load trend data." /> :
                        peaksLoading ? <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div> :
                            monthlyData.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No data for this period.</p> :
                                <ResponsiveContainer width="100%" height={220}>
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="totalDays" stroke="#3b82f6" strokeWidth={2} dot={false} name="Days" />
                                        <Line type="monotone" dataKey="requestCount" stroke="#10b981" strokeWidth={2} dot={false} name="Requests" />
                                    </LineChart>
                                </ResponsiveContainer>
                    }
                </SectionCard>

                {/* Department bar chart */}
                <SectionCard title="Leave Days by Department">
                    {coverageError ? <ErrorState message="Failed to load department data." /> :
                        coverageLoading ? <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div> :
                            deptData.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No data for this period.</p> :
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={deptData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis dataKey="department" type="category" width={110} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="totalDays" name="Days" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                    }
                </SectionCard>
            </div>

            {/* Leave type breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie chart */}
                <SectionCard title="Leave Type Distribution">
                    {breakdownError ? <ErrorState message="Failed to load breakdown data." /> :
                        breakdownLoading ? <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div> :
                            pieData.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No data for this period.</p> :
                                <div className="flex items-center gap-4">
                                    <ResponsiveContainer width="50%" height={200}>
                                        <PieChart>
                                            <Pie data={pieData} dataKey="totalDays" nameKey="leaveType" cx="50%" cy="50%" outerRadius={80}>
                                                {pieData.map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [`${val} days`, '']} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex-1 space-y-2">
                                        {pieData.map((row, i) => (
                                            <div key={row.leaveType} className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                                    <span className="text-gray-700 dark:text-gray-300 capitalize">{row.leaveType}</span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{row.daysPct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                    }
                </SectionCard>

                {/* Breakdown table */}
                <SectionCard title="Leave Type Summary">
                    {breakdownError ? <ErrorState message="Failed to load breakdown data." /> :
                        breakdownLoading ? <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Loading…</div> :
                            <div className="overflow-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-slate-700">
                                            <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                                            <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Requests</th>
                                            <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Days</th>
                                            <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pieData.map((row, i) => (
                                            <tr key={row.leaveType} className="border-b border-gray-50 dark:border-slate-700/50">
                                                <td className="py-2 flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                                    <span className="capitalize text-gray-800 dark:text-gray-200">{row.leaveType}</span>
                                                </td>
                                                <td className="py-2 text-right text-gray-700 dark:text-gray-300">{row.requestCount}</td>
                                                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{row.totalDays}</td>
                                                <td className="py-2 text-right text-gray-500 dark:text-gray-400">{row.daysPct}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                    }
                </SectionCard>
            </div>

            {/* Employee summary table */}
            <SectionCard title="Employee Leave Summary">
                {summaryError ? <ErrorState message="Failed to load employee summary." /> :
                    summaryLoading ? <div className="h-32 flex items-center justify-center text-gray-400 text-sm">Loading…</div> :
                        sortedEmployees.length === 0 ? <p className="text-sm text-gray-400 text-center py-10">No approved leave in this period.</p> :
                            <div className="overflow-auto pt-2">
                                <table className="w-full text-sm">
                                    <thead>
                                        {/* Numeric column headings are angled 45° so long leave-type
                                            names fit in narrow columns without wrapping */}
                                        <tr className="border-b border-gray-100 dark:border-slate-700">
                                            <th
                                                className="text-left px-3 pb-2 align-bottom text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-800 dark:hover:text-gray-200 select-none"
                                                onClick={() => toggleSort('name')}
                                            >
                                                Employee <SortIcon k="name" />
                                            </th>
                                            <th
                                                className="relative p-0 w-16 h-36 align-bottom cursor-pointer select-none"
                                                onClick={() => toggleSort('totalDays')}
                                            >
                                                <div className="absolute bottom-2 left-1/2 origin-bottom-left -rotate-45 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                                                    Total Days <SortIcon k="totalDays" />
                                                </div>
                                            </th>
                                            {allLeaveTypes.map(t => (
                                                <th key={t} className="relative p-0 w-16 h-36 align-bottom">
                                                    <div className="absolute bottom-2 left-1/2 origin-bottom-left -rotate-45 whitespace-nowrap text-xs font-medium capitalize text-gray-500 dark:text-gray-400">
                                                        {t}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedEmployees.map(emp => (
                                            <tr key={emp.userId} className="border-b border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/30">
                                                <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{emp.name}</td>
                                                <td className="py-2.5 px-2 text-center font-bold text-blue-600 dark:text-blue-400">{emp.totalDays}</td>
                                                {allLeaveTypes.map(t => (
                                                    <td key={t} className="py-2.5 px-2 text-center text-gray-600 dark:text-gray-300">
                                                        {emp.breakdown[t] ?? '—'}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                }
            </SectionCard>
        </div>
    );
}
