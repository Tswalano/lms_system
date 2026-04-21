import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    Clock, RefreshCw, AlertCircle, X, CheckCircle, XCircle, AlertTriangle,
    Loader2, Edit, Ban, CalendarDays, Tag, ChevronDown, ChevronUp, MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import moment from "moment";

interface LeaveApplicationData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveLength: 'half_day' | 'full_day';
}

interface LeaveRecord {
    id: number;
    leave_type: string;
    start_date: string;
    end_date: string;
    duration: number;
    status: string;
    leave_comment: string;
    createdAt: string;
    feedback?: string;
    leave_length: 'half_day' | 'full_day';
    updatedAt: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: LeaveRecord[];
}

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; pill: string; border: string; label: string }> = {
    approved: {
        icon: <CheckCircle className="w-4 h-4" />,
        pill: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
        border: 'border-l-emerald-500 dark:border-l-emerald-400',
        label: 'Approved',
    },
    pending: {
        icon: <AlertTriangle className="w-4 h-4" />,
        pill: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        border: 'border-l-amber-400 dark:border-l-amber-300',
        label: 'Pending',
    },
    rejected: {
        icon: <XCircle className="w-4 h-4" />,
        pill: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
        border: 'border-l-rose-500 dark:border-l-rose-400',
        label: 'Rejected',
    },
    cancelled: {
        icon: <Ban className="w-4 h-4" />,
        pill: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
        border: 'border-l-gray-400 dark:border-l-gray-300',
        label: 'Cancelled',
    },
};

const getStatus = (s: string) => STATUS_CONFIG[s.toLowerCase()] ?? STATUS_CONFIG.pending;

const FILTER_TABS = [
    { key: 'all', label: 'All' },
    { key: 'approved', label: 'Approved' },
    { key: 'pending', label: 'Pending' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'cancelled', label: 'Cancelled' },
] as const;

const LeaveHistoryPage = () => {
    const { authFetch } = useAuth();
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'cancelled'>('all');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [editFormData, setEditFormData] = useState<LeaveApplicationData>({
        leaveType: '', startDate: '', endDate: '', reason: '', leaveLength: 'full_day'
    });
    const queryClient = useQueryClient();
    const token = localStorage.getItem('authToken');

    const today = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    useEffect(() => {
        if (editFormData.leaveLength === 'half_day' && editFormData.startDate) {
            setEditFormData(prev => ({ ...prev, endDate: prev.startDate }));
        }
    }, [editFormData.leaveLength, editFormData.startDate]);

    const fetchLeaveHistory = async (): Promise<LeaveRecord[]> => {
        if (!token) throw new Error('Unauthorized');
        const response = await authFetch('/leave/leave-history', { method: 'GET' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result: ApiResponse = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to fetch leave history');
        return result.data;
    };

    const { data: leaveHistory = [], isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['leaveHistory'],
        queryFn: fetchLeaveHistory,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const { mutate: updateApplication, isPending: isUpdating } = useMutation({
        mutationFn: ({ leaveId, data }: { leaveId: number; data: LeaveApplicationData }) =>
            authFetch(`/leave/${leaveId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    leave_type: data.leaveType, leave_start: data.startDate,
                    leave_end: data.endDate, leave_comment: data.reason, leave_length: data.leaveLength
                })
            }).then(async r => {
                const json = await r.json().catch(() => ({}));
                if (!r.ok || !json.success) throw new Error(json.message || 'Failed to update');
                return json as ApiResponse;
            }),
        onSuccess: (data) => {
            toast.success("Leave Updated", { description: data.message || "Leave request updated." });
            setIsEditModalOpen(false);
            setSelectedLeave(null);
            queryClient.invalidateQueries({ queryKey: ['leaveHistory'] });
        },
        onError: (e) => toast.error("Update Failed", { description: e instanceof Error ? e.message : 'Try again.' }),
    });

    const { mutate: cancelApplication, isPending: isCancelling } = useMutation({
        mutationFn: ({ leaveId, reason }: { leaveId: number; reason: string }) =>
            authFetch(`/leave/${leaveId}/cancel`, {
                method: 'PATCH',
                body: JSON.stringify({ feedback: reason })
            }).then(async r => {
                const json = await r.json().catch(() => ({}));
                if (!r.ok || !json.success) throw new Error(json.message || 'Failed to cancel');
                return json as ApiResponse;
            }),
        onSuccess: (data) => {
            toast.success("Leave Cancelled", { description: data.message || "Leave request cancelled." });
            setIsCancelModalOpen(false);
            setSelectedLeave(null);
            setCancelReason('');
            queryClient.invalidateQueries({ queryKey: ['leaveHistory'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
        },
        onError: (e) => toast.error("Cancellation Failed", { description: e instanceof Error ? e.message : 'Try again.' }),
    });

    const canEdit = (l: LeaveRecord) => l.status.toLowerCase() === 'pending';
    const isFutureLeave = (l: LeaveRecord) => moment(l.start_date).isAfter(moment(), 'day');
    const isCancelEnabled = (l: LeaveRecord) => ['pending', 'approved'].includes(l.status.toLowerCase()) && isFutureLeave(l);

    const openEdit = (l: LeaveRecord) => {
        setSelectedLeave(l);
        setEditFormData({
            leaveType: l.leave_type,
            startDate: moment(l.start_date).format('YYYY-MM-DD'),
            endDate: moment(l.end_date).format('YYYY-MM-DD'),
            reason: l.leave_comment,
            leaveLength: l.leave_length
        });
        setIsEditModalOpen(true);
    };

    const openCancel = (l: LeaveRecord) => {
        setSelectedLeave(l);
        setCancelReason('');
        setIsCancelModalOpen(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeave) return;
        if (!editFormData.leaveType || !editFormData.startDate || !editFormData.endDate || !editFormData.reason) {
            toast.error("Missing fields", { description: "Please fill in all required fields." });
            return;
        }
        const start = moment(editFormData.startDate), end = moment(editFormData.endDate);
        if (start.isBefore(moment(), 'day')) {
            toast.error("Invalid date", { description: "Start date cannot be in the past." });
            return;
        }
        if (editFormData.leaveLength === 'full_day' && end.isBefore(start, 'day')) {
            toast.error("Invalid range", { description: "End date cannot be before start date." });
            return;
        }
        updateApplication({ leaveId: selectedLeave.id, data: editFormData });
    };

    const handleCancelSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedLeave || !cancelReason.trim()) {
            toast.error("Reason required", { description: "Please provide a reason for cancellation." });
            return;
        }
        cancelApplication({ leaveId: selectedLeave.id, reason: cancelReason });
    };

    const getCount = (key: string) => key === 'all' ? leaveHistory.length : leaveHistory.filter(r => r.status.toLowerCase() === key).length;
    const filtered = leaveHistory.filter(r => filter === 'all' || r.status.toLowerCase() === filter);

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to view your leave history.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Leave History</h1>
                            <p className="text-gray-600 dark:text-gray-400">Track your leave applications and status</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['leaveHistory'] })}
                        variant="outline"
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2">
                    {FILTER_TABS.map(({ key, label }) => (
                        <Button
                            key={key}
                            onClick={() => setFilter(key as typeof filter)}
                            variant={filter === key ? "default" : "outline"}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                                filter === key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                            )}
                        >
                            {label}
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-xs font-bold",
                                filter === key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'
                            )}>
                                {getCount(key)}
                            </span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading leave history...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading leave history</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error instanceof Error ? error.message : 'Something went wrong'}</p>
                        <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">Try Again</Button>
                    </div>
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 flex items-center justify-center h-64">
                    <div className="text-center">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {filter === 'all' ? 'No leave history found' : `No ${filter} requests`}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {filter === 'all' ? 'Your leave requests will appear here.' : 'Try a different filter.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((record) => {
                        const status = getStatus(record.status);
                        const isExpanded = expandedId === record.id;
                        return (
                            <div
                                key={record.id}
                                className={cn(
                                    "bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow",
                                    "border-l-4",
                                    status.border
                                )}
                            >

                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4">
                                        {/* Left: type + dates */}
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                                <CalendarDays className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{record.leave_type}</span>
                                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border", status.pill)}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Tag className="w-3 h-3" />
                                                        {record.leave_length === 'half_day' ? 'Half Day' : 'Full Day'}
                                                    </span>
                                                    <span>·</span>
                                                    <span>{moment(record.start_date).format('MMM D')} — {moment(record.end_date).format('MMM D, YYYY')}</span>
                                                    <span>·</span>
                                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                                        {record.duration} day{record.duration > 1 ? 's' : ''}
                                                        {record.leave_length === 'half_day' ? ' (Half)' : ''}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                    Applied {moment(record.createdAt).format('MMM D, YYYY')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right: actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {canEdit(record) && (
                                                <Button
                                                    onClick={() => openEdit(record)}
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40 transition-colors"
                                                >
                                                    <Edit className="w-4 h-4 mr-1" />
                                                    Edit
                                                </Button>
                                            )}

                                            <Button
                                                    onClick={() => { if (isCancelEnabled(record)) openCancel(record); }}
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={!isCancelEnabled(record)}
                                                    className={isCancelEnabled(record)
                                                        ? "border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/40 transition-colors"
                                                        : "border-gray-200 text-gray-400 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed transition-colors"
                                                    }
                                                >
                                                    <Ban className="w-4 h-4 mr-1" />
                                                    Cancel
                                                </Button>

                                            {/* Divider for visual separation */}
                                            <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

                                            <Button
                                                onClick={() => setExpandedId(isExpanded ? null : record.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                                            >
                                                {isExpanded ? (
                                                    <ChevronUp className="w-4 h-4" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 space-y-3">
                                            {record.leave_comment && (
                                                <div className="rounded-xl bg-gray-50 dark:bg-slate-700/50 p-4">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1 mb-2">
                                                        <MessageSquare className="w-3 h-3" /> Your Reason
                                                    </p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{record.leave_comment}</p>
                                                </div>
                                            )}
                                            {record.feedback && (
                                                <div className={cn("rounded-xl p-4 border", ['cancelled', 'rejected'].includes(record.status.toLowerCase())
                                                    ? 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'
                                                    : 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800'
                                                )}>
                                                    <p className={cn("text-xs font-medium uppercase tracking-wide mb-2", ['cancelled', 'rejected'].includes(record.status.toLowerCase())
                                                        ? 'text-rose-600 dark:text-rose-400'
                                                        : 'text-blue-600 dark:text-blue-400'
                                                    )}>
                                                        {record.status.toLowerCase() === 'cancelled' ? 'Cancellation Reason' : record.status.toLowerCase() === 'rejected' ? 'Rejection Reason' : 'Manager Feedback'}
                                                    </p>
                                                    <p className={cn("text-sm leading-relaxed", ['cancelled', 'rejected'].includes(record.status.toLowerCase())
                                                        ? 'text-rose-800 dark:text-rose-200'
                                                        : 'text-blue-800 dark:text-blue-200'
                                                    )}>{record.feedback}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50 bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                        <Edit className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Leave Application</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Application #{selectedLeave.id}</p>
                                    </div>
                                </div>
                                <Button onClick={() => setIsEditModalOpen(false)} variant="ghost" size="icon" className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700 transition-all" disabled={isUpdating}>
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
                            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                                        <Select value={editFormData.leaveType} onValueChange={(v) => setEditFormData(p => ({ ...p, leaveType: v }))} disabled={isUpdating}>
                                            <SelectTrigger className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                                            <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                                <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                                <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                                <SelectItem value="Family Responsibility">Family Responsibility</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Leave Length *</Label>
                                        <RadioGroup value={editFormData.leaveLength} onValueChange={(v: 'half_day' | 'full_day') => setEditFormData(p => ({ ...p, leaveLength: v }))} className="flex flex-col sm:flex-row gap-3" disabled={isUpdating}>
                                            {(['full_day', 'half_day'] as const).map((v) => (
                                                <Label key={v} htmlFor={`edit_${v}`} className={cn("flex items-center space-x-2 rounded-xl border px-4 py-3 flex-1 cursor-pointer transition-colors",
                                                    editFormData.leaveLength === v ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50')}>
                                                    <RadioGroupItem value={v} id={`edit_${v}`} />
                                                    <span>{v === 'full_day' ? 'Full Day' : 'Half Day'}</span>
                                                </Label>
                                            ))}
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Start Date *</Label>
                                        <input type="date" value={editFormData.startDate} min={today}
                                            onChange={(e) => setEditFormData(p => ({ ...p, startDate: e.target.value, endDate: p.leaveLength === 'half_day' ? e.target.value : (p.endDate < e.target.value ? e.target.value : p.endDate) }))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                            disabled={isUpdating} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">End Date *</Label>
                                        <input type="date" value={editFormData.endDate} min={editFormData.startDate || today}
                                            onChange={(e) => setEditFormData(p => ({ ...p, endDate: e.target.value }))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
                                            disabled={isUpdating || editFormData.leaveLength === 'half_day'} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Reason for Leave *</Label>
                                    <Textarea value={editFormData.reason} onChange={(e) => setEditFormData(p => ({ ...p, reason: e.target.value }))}
                                        placeholder="Please provide a detailed reason..." className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[100px]" disabled={isUpdating} />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isUpdating}>
                                        {isUpdating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Updating...</> : 'Update Application'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600" disabled={isUpdating}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {isCancelModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50 bg-gradient-to-br from-rose-50 to-red-100 dark:from-slate-700 dark:to-slate-900">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
                                        <Ban className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Cancel Leave</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Application #{selectedLeave.id}</p>
                                    </div>
                                </div>
                                <Button onClick={() => setIsCancelModalOpen(false)} variant="ghost" size="icon" className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700 transition-all" disabled={isCancelling}>
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-4 mb-5">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                            {selectedLeave.leave_type} · {moment(selectedLeave.start_date).format('MMM D')} — {moment(selectedLeave.end_date).format('MMM D, YYYY')}
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">This action cannot be undone.</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleCancelSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700 dark:text-gray-300">Reason for Cancellation *</Label>
                                    <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Why are you cancelling this leave request?" className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[100px]"
                                        disabled={isCancelling} required />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white" disabled={isCancelling || !cancelReason.trim()}>
                                        {isCancelling ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cancelling...</> : 'Cancel Request'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setIsCancelModalOpen(false)} className="flex-1 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600" disabled={isCancelling}>
                                        Keep Request
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveHistoryPage;
