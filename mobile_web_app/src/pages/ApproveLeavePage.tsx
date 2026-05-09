/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, AlertCircle, Loader2, X, MessageSquare, User, Ban, Square, CheckSquare } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import ProcessedRequestCompactCard from "@/components/approvals/ProcessedRequestCompactCard";

interface LeaveRequest {
    id: number;
    firstName: string;
    lastName: string;
    jobTitle: string;
    email: string;
    leave_type: string;
    start_date: string;
    end_date: string;
    duration: number;
    leave_comment: string;
    leave_length: 'half_day' | 'full_day';
    createdAt: string;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    feedback?: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: {
        requests: LeaveRequest[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        }
    }
}

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
    action: 'approve' | 'reject';
    employeeName: string;
    leaveType: string;
    isSubmitting: boolean;
}

const CommentModal = ({ isOpen, onClose, onSubmit, action, employeeName, leaveType, isSubmitting }: CommentModalProps) => {
    const [comment, setComment] = useState('');

    useEffect(() => {
        setComment(
            action === 'approve'
                ? 'Leave approved. Enjoy your time off!'
                : 'Leave request has been reviewed and rejected. Please contact your manager for more information.'
        );
    }, [action]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50">
                <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action === 'approve' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                {action === 'approve' ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{employeeName} - {leaveType}</p>
                            </div>
                        </div>
                        <Button onClick={onClose} variant="ghost" size="icon" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700" disabled={isSubmitting}>
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-2" />Comment (Optional)
                        </label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={`Add a comment for the ${action === 'approve' ? 'approval' : 'rejection'}...`}
                            className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[120px] resize-none"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>
                <div className="p-6 border-t border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setComment('')} className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600" disabled={isSubmitting}>
                            Clear
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onSubmit(comment)}
                            className={`flex-1 ${action === 'approve' ? 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40' : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40'}`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" />{action === 'approve' ? 'Approving...' : 'Rejecting...'}</>
                            ) : (
                                <>{action === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}{action === 'approve' ? 'Approve' : 'Reject'}</>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface BulkActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (feedback: string) => void;
    action: 'approve' | 'reject';
    selectedRequests: LeaveRequest[];
    isSubmitting: boolean;
}

const BulkActionModal = ({ isOpen, onClose, onSubmit, action, selectedRequests, isSubmitting }: BulkActionModalProps) => {
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (isOpen) {
            setFeedback(
                action === 'approve'
                    ? 'Leave approved. Enjoy your time off!'
                    : 'Leave request has been reviewed and rejected. Please contact your manager for more information.'
            );
        }
    }, [isOpen, action]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full border border-gray-200/50 dark:border-slate-600/50">
                <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action === 'approve' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                {action === 'approve' ? <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" /> : <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    Bulk {action === 'approve' ? 'Approve' : 'Reject'}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
                                </p>
                            </div>
                        </div>
                        <Button onClick={onClose} variant="ghost" size="icon" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700" disabled={isSubmitting}>
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </Button>
                    </div>
                </div>

                <div className="p-6 space-y-4 max-h-80 overflow-y-auto">
                    <div className="space-y-2">
                        {selectedRequests.map(r => (
                            <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-xl text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                        {r.firstName[0]}{r.lastName[0]}
                                    </div>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{r.firstName} {r.lastName}</span>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{r.leave_type}</span>
                                </div>
                                <span className="text-gray-500 dark:text-gray-400 text-xs">{r.duration} day{r.duration !== 1 ? 's' : ''}</span>
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-2" />Feedback (applied to all)
                        </label>
                        <Textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[100px] resize-none"
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200/50 dark:border-slate-600/50 flex gap-3">
                    <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => onSubmit(feedback)}
                        className={`flex-1 text-white ${action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin mr-2" />{action === 'approve' ? 'Approving...' : 'Rejecting...'}</>
                        ) : (
                            <>{action === 'approve' ? <CheckCircle className="w-4 h-4 mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}{action === 'approve' ? `Approve ${selectedRequests.length}` : `Reject ${selectedRequests.length}`}</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ApproveLeavePage = () => {
    const { authFetch } = useAuth();
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<LeaveRequest | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [leaveToCancel, setLeaveToCancel] = useState<LeaveRequest | null>(null);

    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<'approve' | 'reject'>('approve');

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
        if (!token) throw new Error('Unauthorized');

        const response = await authFetch('/leave/all-leave-requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: ApiResponse = await response.json();
        if (!result.success) throw new Error(result.message || 'Failed to fetch leave requests');

        return result.data.requests;
    };

    const {
        data: requests = [],
        isLoading,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['leaveApprovalRequests'],
        queryFn: fetchLeaveRequests,
        staleTime: 2 * 60 * 1000,
        retry: 2,
    });

    const pendingRequests = requests.filter(req => req.status.toLowerCase() === 'pending');
    const processedRequests = requests.filter(req => req.status.toLowerCase() !== 'pending');
    const approvedCount = processedRequests.filter(req => req.status === 'approved').length;
    const recentProcessedRequests = [...processedRequests]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);
    const pendingPagination = usePagination(pendingRequests, 5);

    const processLeaveMutation = useMutation({
        mutationFn: async ({ requestId, action, comment }: { requestId: number; action: 'approve' | 'reject'; comment: string }) => {
            if (!token) throw new Error('Unauthorized');
            const response = await authFetch(`/leave/${requestId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, feedback: comment })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || `Failed to ${action} leave request`);
            return result;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
            const status = variables.action === 'approve' ? 'Approved' : 'Rejected';
            toast(`Leave ${status}`, { description: `The leave request has been ${status.toLowerCase()} successfully.` });
            setIsModalOpen(false);
            setSelectedRequest(null);
        },
        onError: (error) => {
            toast.error('Error', { description: error instanceof Error ? error.message : 'Something went wrong' });
        },
    });

    const bulkActionMutation = useMutation({
        mutationFn: async ({ ids, action, feedback }: { ids: number[]; action: 'approve' | 'reject'; feedback: string }) => {
            if (!token) throw new Error('Unauthorized');
            const response = await authFetch('/leave/bulk-action', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ leaveIds: ids, action, feedback })
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Bulk action failed');
            return result;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
            setIsBulkModalOpen(false);
            setSelectedIds(new Set());

            const { succeeded, failed } = data.data;
            if (failed === 0) {
                toast.success('Bulk action complete', { description: data.message });
            } else {
                toast.warning('Bulk action partial', {
                    description: `${succeeded} succeeded, ${failed} failed. Failed requests remain pending.`,
                });
            }
        },
        onError: (error) => {
            toast.error('Bulk action failed', { description: error instanceof Error ? error.message : 'Something went wrong' });
        },
    });

    const cancelLeaveMutation = useMutation({
        mutationFn: async (requestId: number) => {
            if (!token) throw new Error('Unauthorized');
            const response = await authFetch(`/leave/${requestId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.message || 'Failed to cancel leave request');
            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
            toast.success('Leave Cancelled', { description: 'The approved leave has been cancelled successfully.' });
            setShowCancelConfirm(false);
            setLeaveToCancel(null);
            setIsDetailsModalOpen(false);
            setSelectedLeaveDetails(null);
        },
        onError: (error) => {
            toast.error('Cancellation Failed', { description: error instanceof Error ? error.message : 'Failed to cancel leave' });
        },
    });

    const handleRefresh = () => {
        setSelectedIds(new Set());
        queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
    };

    const openApprovalModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setModalAction(action);
        setIsModalOpen(true);
    };

    const openDetailsModal = (request: LeaveRequest) => {
        setSelectedLeaveDetails(request);
        setIsDetailsModalOpen(true);
    };

    const handleCancelLeave = (request: LeaveRequest) => {
        setLeaveToCancel(request);
        setShowCancelConfirm(true);
    };

    // Checkbox helpers
    const allPendingSelected = pendingRequests.length > 0 && pendingRequests.every(r => selectedIds.has(r.id));
    const somePendingSelected = pendingRequests.some(r => selectedIds.has(r.id));

    const toggleSelectAll = () => {
        if (allPendingSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(pendingRequests.map(r => r.id)));
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const openBulkModal = (action: 'approve' | 'reject') => {
        setBulkAction(action);
        setIsBulkModalOpen(true);
    };

    const handleBulkSubmit = (feedback: string) => {
        bulkActionMutation.mutate({ ids: Array.from(selectedIds), action: bulkAction, feedback });
    };

    const isFutureLeave = (r: LeaveRequest) => new Date(r.start_date) > new Date(new Date().toDateString());

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h1>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to access leave approvals.</p>
                </div>
            </div>
        );
    }

    const selectedRequests = pendingRequests.filter(r => selectedIds.has(r.id));
    const summaryStats = [
        { label: "Pending", value: pendingRequests.length, helper: "awaiting review", className: "border-amber-200/70 bg-amber-50/75 dark:border-amber-900/40 dark:bg-amber-950/20" },
        { label: "Approved", value: approvedCount, helper: "approved", className: "border-emerald-200/70 bg-emerald-50/75 dark:border-emerald-900/40 dark:bg-emerald-950/20" },
        { label: "Total", value: requests.length, helper: "all requests", className: "border-cyan-200/70 bg-cyan-50/75 dark:border-cyan-900/40 dark:bg-cyan-950/20" },
    ] as const;

    return (
        <div className="mx-auto w-full max-w-5xl px-4 pb-28">
            <MobilePageHeader className="mb-4" />
            <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-3 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)] md:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <h1 className="text-xl font-semibold text-slate-950 dark:text-gray-100 md:text-2xl">Leave Approvals</h1>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review, approve, reject, or cancel employee leave requests.</p>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        className="h-9 min-w-9 rounded-xl border-slate-200 bg-white px-3 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    </Button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 md:mt-4 md:gap-3">
                    {summaryStats.map((stat) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "min-w-0 rounded-2xl border px-3 py-2.5 shadow-sm",
                                stat.className
                            )}
                        >
                            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                {stat.label}
                            </p>
                            <p className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100 md:text-2xl">
                                {stat.value}
                            </p>
                            <p className="truncate text-[11px] text-slate-600 dark:text-slate-400">
                                {stat.helper}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {isLoading ? (
                <div className="mt-6 rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-10 text-center shadow-[0_18px_48px_rgba(15,23,42,0.12)] dark:border-slate-700 dark:bg-slate-800">
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-500" />
                    <p className="text-sm text-slate-600 dark:text-slate-400">Loading leave requests...</p>
                </div>
            ) : error ? (
                <div className="mt-6 rounded-[1.5rem] border border-rose-200 bg-rose-50/80 p-10 text-center dark:border-rose-900/40 dark:bg-rose-950/20">
                    <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
                    <p className="mb-2 font-medium text-slate-900 dark:text-slate-100">Error loading requests</p>
                    <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{error instanceof Error ? error.message : 'Something went wrong'}</p>
                    <Button onClick={() => refetch()} className="rounded-2xl bg-blue-600 hover:bg-blue-700 text-white">Try Again</Button>
                </div>
            ) : (
                <>
                    <section className="mt-6">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Pending Requests</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{pendingRequests.length} request{pendingRequests.length === 1 ? '' : 's'} waiting for review</p>
                            </div>
                            {pendingRequests.length > 0 && (
                                <button
                                    onClick={toggleSelectAll}
                                    className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                                >
                                    {allPendingSelected ? (
                                        <CheckSquare className="h-4 w-4 text-blue-500" />
                                    ) : somePendingSelected ? (
                                        <CheckSquare className="h-4 w-4 text-blue-300" />
                                    ) : (
                                        <Square className="h-4 w-4" />
                                    )}
                                    {allPendingSelected ? 'Deselect all' : 'Select all'}
                                </button>
                            )}
                        </div>

                        {pendingRequests.length > 0 ? (
                            <div className="space-y-4">
                                {pendingPagination.paginatedItems.map((request) => {
                                    const isSelected = selectedIds.has(request.id);
                                    return (
                                        <article
                                            key={request.id}
                                            className={cn(
                                                "rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all dark:border-slate-700 dark:bg-slate-800",
                                                isSelected
                                                    ? "ring-2 ring-blue-200 dark:ring-blue-900/60"
                                                    : ""
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <button
                                                    onClick={() => toggleSelect(request.id)}
                                                    className="mt-1 flex-shrink-0 text-slate-400 transition-colors hover:text-blue-500"
                                                    aria-label={isSelected ? 'Deselect' : 'Select'}
                                                >
                                                    {isSelected ? <CheckSquare className="h-5 w-5 text-blue-500" /> : <Square className="h-5 w-5" />}
                                                </button>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-bold text-white">
                                                                {request.firstName[0]}{request.lastName[0]}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <h3 className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">
                                                                        {request.firstName} {request.lastName}
                                                                    </h3>
                                                                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                        {request.leave_type}
                                                                    </Badge>
                                                                    {request.leave_length === 'half_day' ? (
                                                                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Half Day</Badge>
                                                                    ) : null}
                                                                </div>
                                                                <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">{request.jobTitle || request.email}</p>
                                                            </div>
                                                        </div>
                                                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                            Pending
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-700/40">
                                                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Dates</p>
                                                            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {formatDate(request.start_date)} - {formatDate(request.end_date)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-3 dark:border-slate-700 dark:bg-slate-700/40">
                                                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Duration</p>
                                                            <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {request.duration} day{request.duration !== 1 ? 's' : ''}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {request.leave_comment ? (
                                                        <div className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
                                                            <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Employee Comment</p>
                                                            <p className="mt-1 text-sm text-slate-600 line-clamp-3 dark:text-slate-300">"{request.leave_comment}"</p>
                                                        </div>
                                                    ) : null}

                                                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openApprovalModal(request, 'approve')}
                                                            className="h-11 rounded-2xl border-green-200 bg-green-50 text-green-600 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40"
                                                            disabled={processLeaveMutation.isPending}
                                                        >
                                                            <CheckCircle className="mr-2 h-4 w-4" />Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openApprovalModal(request, 'reject')}
                                                            className="h-11 rounded-2xl border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
                                                            disabled={processLeaveMutation.isPending}
                                                        >
                                                            <XCircle className="mr-2 h-4 w-4" />Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDetailsModal(request)}
                                                            className="h-11 rounded-2xl border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />View Details
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                                <Pagination
                                    currentPage={pendingPagination.page}
                                    totalPages={pendingPagination.totalPages}
                                    pageSize={pendingPagination.pageSize}
                                    totalItems={pendingPagination.totalItems}
                                    onPageChange={pendingPagination.setPage}
                                    onPageSizeChange={pendingPagination.setPageSize}
                                    className="mt-2 rounded-2xl border border-gray-100 bg-white dark:border-slate-700 dark:bg-slate-800"
                                />
                            </div>
                        ) : (
                            <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-10 text-center dark:border-slate-700 dark:bg-slate-800">
                                <Clock className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                                <p className="font-medium text-slate-900 dark:text-slate-100">No pending leave requests</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">All requests have been processed.</p>
                            </div>
                        )}
                    </section>

                    {processedRequests.length > 0 && (
                        <section className="mt-8">
                            <div className="mb-4 flex items-end justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-100">Recently Processed</h2>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Showing {recentProcessedRequests.length} of {processedRequests.length}
                                    </p>
                                </div>
                                <Link
                                    to="/approve-leave/processed"
                                    className="inline-flex h-9 items-center rounded-full border border-cyan-200 bg-cyan-50 px-4 text-sm font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50"
                                >
                                    View all processed requests
                                </Link>
                            </div>

                            {recentProcessedRequests.length > 0 ? (
                                <div className="space-y-3">
                                    {recentProcessedRequests.map((request) => (
                                        <ProcessedRequestCompactCard
                                            key={request.id}
                                            request={request}
                                            formatDate={formatDate}
                                            onOpenDetails={(item) => openDetailsModal(item as LeaveRequest)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-6 text-center dark:border-slate-700 dark:bg-slate-800">
                                    <p className="font-medium text-slate-900 dark:text-slate-100">No processed requests yet</p>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Processed approvals will appear here once requests are reviewed.</p>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}

            {/* Floating bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="fixed inset-x-4 bottom-24 z-40 rounded-[1.5rem] border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95 lg:left-[calc(50%+8rem)] lg:right-auto lg:w-auto lg:-translate-x-1/2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {selectedIds.size} selected
                        </span>
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                            <Button
                                size="sm"
                                onClick={() => openBulkModal('approve')}
                                className="h-10 rounded-2xl bg-green-600 hover:bg-green-700 text-white gap-1.5"
                                disabled={bulkActionMutation.isPending}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => openBulkModal('reject')}
                                className="h-10 rounded-2xl bg-red-600 hover:bg-red-700 text-white gap-1.5"
                                disabled={bulkActionMutation.isPending}
                            >
                                <XCircle className="w-4 h-4" />
                                Reject
                            </Button>
                        </div>
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="self-end text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200 sm:self-auto"
                            aria-label="Clear selection"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Single approval modal */}
            <CommentModal
                isOpen={isModalOpen}
                onClose={() => { if (!processLeaveMutation.isPending) { setIsModalOpen(false); setSelectedRequest(null); } }}
                onSubmit={(comment) => { if (selectedRequest) processLeaveMutation.mutate({ requestId: selectedRequest.id, action: modalAction, comment }); }}
                action={modalAction}
                employeeName={selectedRequest ? `${selectedRequest.firstName} ${selectedRequest.lastName}` : ''}
                leaveType={selectedRequest?.leave_type || ''}
                isSubmitting={processLeaveMutation.isPending}
            />

            {/* Bulk action modal */}
            <BulkActionModal
                isOpen={isBulkModalOpen}
                onClose={() => { if (!bulkActionMutation.isPending) setIsBulkModalOpen(false); }}
                onSubmit={handleBulkSubmit}
                action={bulkAction}
                selectedRequests={selectedRequests}
                isSubmitting={bulkActionMutation.isPending}
            />

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && leaveToCancel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Cancel Approved Leave</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">This action cannot be undone</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to cancel the approved leave for{' '}
                                <span className="font-semibold">{leaveToCancel.firstName} {leaveToCancel.lastName}</span>?
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>Leave Type:</strong> {leaveToCancel.leave_type}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Duration:</strong> {formatDate(leaveToCancel.start_date)} - {formatDate(leaveToCancel.end_date)}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200/50 dark:border-slate-600/50 flex gap-3">
                            <Button variant="outline" onClick={() => { setShowCancelConfirm(false); setLeaveToCancel(null); }} className="flex-1" disabled={cancelLeaveMutation.isPending}>
                                No, Keep It
                            </Button>
                            <Button onClick={() => leaveToCancel && cancelLeaveMutation.mutate(leaveToCancel.id)} className="flex-1 bg-red-600 hover:bg-red-700 text-white" disabled={cancelLeaveMutation.isPending}>
                                {cancelLeaveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cancelling...</> : <><Ban className="w-4 h-4 mr-2" />Yes, Cancel Leave</>}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Details Modal */}
            {isDetailsModalOpen && selectedLeaveDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            {selectedLeaveDetails.leave_type} Leave Request
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {selectedLeaveDetails.firstName} {selectedLeaveDetails.lastName}
                                        </p>
                                    </div>
                                </div>
                                <Button onClick={() => setIsDetailsModalOpen(false)} variant="ghost" size="icon" className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80">
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </Button>
                            </div>
                        </div>
                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedLeaveDetails.firstName} {selectedLeaveDetails.lastName}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLeaveDetails.jobTitle}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatDate(selectedLeaveDetails.start_date)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatDate(selectedLeaveDetails.end_date)}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Type</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{selectedLeaveDetails.leave_type}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {`${selectedLeaveDetails.duration} day${selectedLeaveDetails.duration > 1 ? 's' : ''}${selectedLeaveDetails.leave_length === 'half_day' ? ' (Half Day)' : ''}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                        <div className="mt-1">
                                            <Badge className={getStatusColor(selectedLeaveDetails.status)}>
                                                {selectedLeaveDetails.status.charAt(0).toUpperCase() + selectedLeaveDetails.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatDate(selectedLeaveDetails.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                            {selectedLeaveDetails.leave_comment && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee Comment</label>
                                    <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300">{selectedLeaveDetails.leave_comment}</p>
                                    </div>
                                </div>
                            )}
                            {selectedLeaveDetails.feedback && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Manager Feedback</label>
                                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-gray-700 dark:text-gray-300">{selectedLeaveDetails.feedback}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                {selectedLeaveDetails.status === 'pending' && (
                                    <>
                                        <Button variant="outline" onClick={() => { setIsDetailsModalOpen(false); openApprovalModal(selectedLeaveDetails, 'approve'); }} className="flex-1 border-green-200 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40">
                                            <CheckCircle className="w-4 h-4 mr-2" />Approve
                                        </Button>
                                        <Button variant="outline" onClick={() => { setIsDetailsModalOpen(false); openApprovalModal(selectedLeaveDetails, 'reject'); }} className="flex-1 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40">
                                            <XCircle className="w-4 h-4 mr-2" />Reject
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className={cn("px-4 py-2 rounded-lg font-medium transition-colors duration-200",
                                        selectedLeaveDetails.status === 'pending'
                                            ? 'flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700'
                                            : 'w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-500 dark:hover:bg-slate-400 text-white'
                                    )}
                                    variant={selectedLeaveDetails.status === 'pending' ? "outline" : "default"}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApproveLeavePage;
