/* eslint-disable @typescript-eslint/no-unused-expressions */
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, AlertCircle, Loader2, X, MessageSquare, Users, User, Ban, Square, CheckSquare } from "lucide-react";
import { Pagination } from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils"

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
    status: 'pending' | 'approved' | 'rejected';
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
    const pendingPagination = usePagination(pendingRequests, 10);
    const processedPagination = usePagination(processedRequests, 10);

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

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Approve Leave Requests</h1>
                            <p className="text-gray-600 dark:text-gray-400">Review and approve employee leave applications</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRefresh}
                        variant="outline"
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-yellow-500 dark:border-l-yellow-400 hover:shadow-lg hover:bg-yellow-50/30 dark:hover:bg-yellow-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-yellow-500/10 group-hover:scale-[2] group-hover:bg-yellow-500/20 transition-all duration-500" />
                        <div className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Pending Requests</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{pendingRequests.length}</p>
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">awaiting review</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-green-500 dark:border-l-green-400 hover:shadow-lg hover:bg-green-50/30 dark:hover:bg-green-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-green-500/10 group-hover:scale-[2] group-hover:bg-green-500/20 transition-all duration-500" />
                        <div className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Recently Approved</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {processedRequests.filter(r => r.status === 'approved').length}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">leave approved</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <CheckCircle className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="group relative bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-lg hover:bg-blue-50/30 dark:hover:bg-blue-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-500/10 group-hover:scale-[2] group-hover:bg-blue-500/20 transition-all duration-500" />
                        <div className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Requests</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{requests.length}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">all employees</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                    <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">Loading leave requests...</p>
                    </div>
                </div>
            ) : error ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading requests</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{error instanceof Error ? error.message : 'Something went wrong'}</p>
                        <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">Try Again</Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Pending Requests */}
                    <div className="mb-8">
                        {/* Pending section header with select-all */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                {pendingRequests.length > 0 && (
                                    <button
                                        onClick={toggleSelectAll}
                                        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                    >
                                        {allPendingSelected ? (
                                            <CheckSquare className="w-4 h-4 text-blue-500" />
                                        ) : somePendingSelected ? (
                                            <CheckSquare className="w-4 h-4 text-blue-300" />
                                        ) : (
                                            <Square className="w-4 h-4" />
                                        )}
                                        {allPendingSelected ? 'Deselect all' : 'Select all'}
                                    </button>
                                )}
                                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                    Pending Requests ({pendingRequests.length})
                                </h2>
                            </div>
                        </div>

                        {pendingRequests.length > 0 ? (
                            <div className="space-y-4">
                                {pendingPagination.paginatedItems.map((request) => {
                                    const isSelected = selectedIds.has(request.id);
                                    return (
                                        <div
                                            key={request.id}
                                            className={cn(
                                                "bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-all border-l-4",
                                                isSelected
                                                    ? "border-l-blue-500 dark:border-l-blue-400 ring-2 ring-blue-200 dark:ring-blue-800"
                                                    : "border-l-amber-500 dark:border-l-amber-400"
                                            )}
                                        >
                                            <div className="p-5">
                                                <div className="flex items-start gap-3">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={() => toggleSelect(request.id)}
                                                        className="mt-1 flex-shrink-0 text-gray-400 hover:text-blue-500 transition-colors"
                                                        aria-label={isSelected ? 'Deselect' : 'Select'}
                                                    >
                                                        {isSelected
                                                            ? <CheckSquare className="w-5 h-5 text-blue-500" />
                                                            : <Square className="w-5 h-5" />
                                                        }
                                                    </button>

                                                    <div className="flex items-start justify-between gap-4 flex-1">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                                                {request.firstName[0]}{request.lastName[0]}
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                                        {request.firstName} {request.lastName}
                                                                    </h3>
                                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">
                                                                        {request.leave_type}
                                                                    </span>
                                                                    {request.leave_length === 'half_day' && (
                                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">
                                                                            Half Day
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{request.jobTitle}</p>
                                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                                    <span>{formatDate(request.start_date)} → {formatDate(request.end_date)}</span>
                                                                    <span className="text-gray-300 dark:text-gray-600">•</span>
                                                                    <span>{request.duration} day{request.duration > 1 ? 's' : ''}</span>
                                                                </div>
                                                                {request.leave_comment && (
                                                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic line-clamp-2 max-w-lg">
                                                                        "{request.leave_comment}"
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openApprovalModal(request, 'approve')}
                                                                className="border-green-200 text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40"
                                                                disabled={processLeaveMutation.isPending}
                                                            >
                                                                <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openApprovalModal(request, 'reject')}
                                                                className="border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                                                                disabled={processLeaveMutation.isPending}
                                                            >
                                                                <XCircle className="w-4 h-4 mr-1" /> Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => openDetailsModal(request)}
                                                                className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                            >
                                                                <Eye className="w-4 h-4" /> View
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-12 text-center text-gray-500 dark:text-gray-400">
                                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">No pending leave requests</p>
                                <p className="text-sm">All requests have been processed</p>
                            </div>
                        )}
                    </div>

                    {/* Processed Requests */}
                    {processedRequests.length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                Recently Processed ({processedRequests.length})
                            </h2>
                            <div className="space-y-3">
                                {processedPagination.paginatedItems.map((request) => {
                                    const leftBorderColor = request.status === 'approved'
                                        ? 'border-l-green-500 dark:border-l-green-400'
                                        : request.status === 'rejected'
                                            ? 'border-l-red-500 dark:border-l-red-400'
                                            : 'border-l-gray-500 dark:border-l-gray-400';
                                    return (
                                        <div key={request.id} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow border-l-4 ${leftBorderColor}`}>
                                            <div className="p-5">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${request.status === 'approved' ? 'from-green-500 to-green-600' : request.status === 'rejected' ? 'from-red-500 to-red-600' : 'from-gray-500 to-gray-600'} flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                                                            {request.firstName[0]}{request.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{request.firstName} {request.lastName}</h3>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300">{request.leave_type}</span>
                                                                <Badge className={getStatusColor(request.status)}>
                                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{request.jobTitle}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {formatDate(request.start_date)} → {formatDate(request.end_date)}
                                                            </p>
                                                            {request.feedback && (
                                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic line-clamp-1">"{request.feedback}"</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {(() => {
                                                            const cancelActive = request.status === 'approved' && isFutureLeave(request);
                                                            return (
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => { if (cancelActive) handleCancelLeave(request); }}
                                                                    disabled={cancelLeaveMutation.isPending || !cancelActive}
                                                                    className={cancelActive
                                                                        ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40"
                                                                        : "border-gray-200 text-gray-400 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700 dark:text-gray-500 cursor-not-allowed"
                                                                    }
                                                                >
                                                                    <Ban className="w-4 h-4 mr-1" /> Cancel
                                                                </Button>
                                                            );
                                                        })()}
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => openDetailsModal(request)}
                                                            className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                        >
                                                            <Eye className="w-4 h-4" /> View
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <Pagination
                                    currentPage={processedPagination.page}
                                    totalPages={processedPagination.totalPages}
                                    pageSize={processedPagination.pageSize}
                                    totalItems={processedPagination.totalItems}
                                    onPageChange={processedPagination.setPage}
                                    onPageSizeChange={processedPagination.setPageSize}
                                    className="mt-2 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Floating bulk action bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:translate-x-16 z-40 flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-2xl shadow-2xl px-5 py-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {selectedIds.size} selected
                    </span>
                    <div className="w-px h-5 bg-gray-200 dark:bg-slate-600" />
                    <Button
                        size="sm"
                        onClick={() => openBulkModal('approve')}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        disabled={bulkActionMutation.isPending}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Approve all
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => openBulkModal('reject')}
                        className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
                        disabled={bulkActionMutation.isPending}
                    >
                        <XCircle className="w-4 h-4" />
                        Reject all
                    </Button>
                    <button
                        onClick={() => setSelectedIds(new Set())}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        aria-label="Clear selection"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
