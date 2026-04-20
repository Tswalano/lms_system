import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, AlertCircle, Loader2, X, MessageSquare, Users, User, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
    action: 'Approved' | 'Rejected' | 'approve' | 'reject';
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

    const handleSubmit = () => {
        onSubmit(comment);
    };

    const handleClear = () => {
        setComment('');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50">
                {/* Header */}
                <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action === 'approve'
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : 'bg-red-100 dark:bg-red-900/30'
                                }`}>
                                {action === 'approve' ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                    {action === 'approve' ? 'Approve' : 'Reject'} Leave Request
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {employeeName} - {leaveType}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            disabled={isSubmitting}
                        >
                            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <MessageSquare className="w-4 h-4 inline mr-2" />
                            Comment (Optional)
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

                {/* Footer */}
                <div className="p-6 border-t border-gray-200/50 dark:border-slate-600/50">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleClear}
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={isSubmitting}
                        >
                            Clear
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className={`flex-1 ${action === 'approve'
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                                } text-white`}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {action === 'approve' ? 'Approving...' : 'Rejecting...'}
                                </>
                            ) : (
                                <>
                                    {action === 'approve' ? (
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                    ) : (
                                        <XCircle className="w-4 h-4 mr-2" />
                                    )}
                                    {action === 'approve' ? 'Approve' : 'Reject'}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ApproveLeavePage = () => {
    const { authFetch } = useAuth()
    const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
    const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedLeaveDetails, setSelectedLeaveDetails] = useState<LeaveRequest | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [leaveToCancel, setLeaveToCancel] = useState<LeaveRequest | null>(null);

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Fetch leave requests for approval
    const fetchLeaveRequests = async (): Promise<LeaveRequest[]> => {
        if (!token) {
            throw new Error('Unauthorized');
        }

        const response = await authFetch('/leave/all-leave-requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch leave requests');
        }

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
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: 2,
    });

    // Mutation for approving/rejecting leave
    const processLeaveMutation = useMutation({
        mutationFn: async ({ requestId, action, comment }: { requestId: number; action: 'approve' | 'reject'; comment: string }) => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch(`/leave/${requestId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    action,
                    feedback: comment
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || `Failed to ${action} leave request`);
            }

            return result;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });

            const isApproved = variables.action?.trim().toLowerCase() === 'approve';
            const status = isApproved ? 'Approved' : 'Rejected';

            toast(`Leave ${status}`, {
                description: `The leave request has been ${status.toLowerCase()} successfully.`,
            });


            setIsModalOpen(false);
            setSelectedRequest(null);
        },
        onError: (error) => {
            toast.error('Error', {
                description: error instanceof Error ? error.message : 'Something went wrong',
            });
        },
    });

    // Mutation for canceling approved leave
    const cancelLeaveMutation = useMutation({
        mutationFn: async (requestId: number) => {
            if (!token) throw new Error('Unauthorized');

            const response = await authFetch(`/leave/${requestId}/cancel`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Failed to cancel leave request');
            }

            return result;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });

            toast.success('Leave Cancelled', {
                description: 'The approved leave has been cancelled successfully.',
            });

            setShowCancelConfirm(false);
            setLeaveToCancel(null);
            setIsDetailsModalOpen(false);
            setSelectedLeaveDetails(null);
        },
        onError: (error) => {
            toast.error('Cancellation Failed', {
                description: error instanceof Error ? error.message : 'Failed to cancel leave',
            });
        },
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['leaveApprovalRequests'] });
    };

    const openApprovalModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
        setSelectedRequest(request);
        setModalAction(action);
        setIsModalOpen(true);
    };

    const handleSubmitComment = (comment: string) => {
        if (!selectedRequest) return;

        processLeaveMutation.mutate({
            requestId: selectedRequest.id,
            action: modalAction,
            comment
        });
    };

    const openDetailsModal = (request: LeaveRequest) => {
        setSelectedLeaveDetails(request);
        setIsDetailsModalOpen(true);
    };

    const handleCancelLeave = (request: LeaveRequest) => {
        setLeaveToCancel(request);
        setShowCancelConfirm(true);
    };

    const confirmCancelLeave = () => {
        if (!leaveToCancel) return;
        cancelLeaveMutation.mutate(leaveToCancel.id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };


    const pendingRequests = requests.filter(req => req.status.toLocaleLowerCase() === 'pending');
    const processedRequests = requests.filter(req => req.status.toLocaleLowerCase() !== 'pending');

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
                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                        disabled={isFetching}
                    >
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 border-l-4 border-l-yellow-500 dark:border-l-yellow-400">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{pendingRequests.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 border-l-4 border-l-green-500 dark:border-l-green-400">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Recently Approved</p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {processedRequests.filter(r => r.status === 'approved').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700 border-l-4 border-l-blue-500 dark:border-l-blue-400">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                                <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{requests.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading/Error States */}
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
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {error instanceof Error ? error.message : 'Something went wrong'}
                        </p>
                        <Button onClick={() => refetch()} className="bg-blue-500 hover:bg-blue-600 text-white">
                            Try Again
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {/* Pending Requests */}
                    <div className="mb-8">
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Pending Requests ({pendingRequests.length})
                        </h2>
                        {pendingRequests.length > 0 ? (
                            <div className="space-y-4">
                                {pendingRequests.map((request) => (
                                    <div key={request.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow border-l-4 border-l-amber-500 dark:border-l-amber-400">
                                        <div className="p-5">
                                            <div className="flex items-start justify-between gap-4">
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
                                                        onClick={() => openApprovalModal(request, 'approve')}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={processLeaveMutation.isPending}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-1" /> Approve
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => openApprovalModal(request, 'reject')}
                                                        disabled={processLeaveMutation.isPending}
                                                    >
                                                        <XCircle className="w-4 h-4 mr-1" /> Reject
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => openDetailsModal(request)}
                                                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                                {processedRequests.map((request) => {
                                    const leftBorderColor = request.status === 'approved'
                                        ? 'border-l-green-500 dark:border-l-green-400'
                                        : request.status === 'rejected'
                                            ? 'border-l-red-500 dark:border-l-red-400'
                                            : 'border-l-gray-500 dark:border-l-gray-400'; // Fallback
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
                                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                                    {request.firstName} {request.lastName}
                                                                </h3>
                                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                                                                    {request.leave_type}
                                                                </span>
                                                                <Badge className={getStatusColor(request.status)}>
                                                                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{request.jobTitle}</p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {formatDate(request.start_date)} → {formatDate(request.end_date)}
                                                            </p>
                                                            {request.feedback && (
                                                                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 italic line-clamp-1">
                                                                    "{request.feedback}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex-shrink-0"
                                                        onClick={() => openDetailsModal(request)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Comment Modal */}
            <CommentModal
                isOpen={isModalOpen}
                onClose={() => {
                    if (!processLeaveMutation.isPending) {
                        setIsModalOpen(false);
                        setSelectedRequest(null);
                    }
                }}
                onSubmit={handleSubmitComment}
                action={modalAction}
                employeeName={selectedRequest ? `${selectedRequest.firstName} ${selectedRequest.lastName}` : ''}
                leaveType={selectedRequest?.leave_type || ''}
                isSubmitting={processLeaveMutation.isPending}
            />

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && leaveToCancel && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                    <Ban className="w-5 h-5 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                        Cancel Approved Leave
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        This action cannot be undone
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <p className="text-gray-700 dark:text-gray-300">
                                Are you sure you want to cancel the approved leave for{' '}
                                <span className="font-semibold">
                                    {leaveToCancel.firstName} {leaveToCancel.lastName}
                                </span>
                                ?
                            </p>
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Leave Type:</strong> {leaveToCancel.leave_type}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    <strong>Duration:</strong> {formatDate(leaveToCancel.start_date)} -{' '}
                                    {formatDate(leaveToCancel.end_date)}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowCancelConfirm(false);
                                        setLeaveToCancel(null);
                                    }}
                                    className="flex-1"
                                    disabled={cancelLeaveMutation.isPending}
                                >
                                    No, Keep It
                                </Button>
                                <Button
                                    onClick={confirmCancelLeave}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    disabled={cancelLeaveMutation.isPending}
                                >
                                    {cancelLeaveMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                            Cancelling...
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="w-4 h-4 mr-2" />
                                            Yes, Cancel Leave
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Leave Details Modal */}
            {isDetailsModalOpen && selectedLeaveDetails && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 lg:pl-72">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header */}
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
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Employee</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {selectedLeaveDetails.firstName} {selectedLeaveDetails.lastName}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{selectedLeaveDetails.jobTitle}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeaveDetails.start_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeaveDetails.end_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Leave Type</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {selectedLeaveDetails.leave_type}
                                        </p>
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
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeaveDetails.createdAt)}
                                        </p>
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

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                {selectedLeaveDetails.status === 'pending' ? (
                                    <>
                                        <Button
                                            onClick={() => {
                                                setIsDetailsModalOpen(false);
                                                openApprovalModal(selectedLeaveDetails, 'approve');
                                            }}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setIsDetailsModalOpen(false);
                                                openApprovalModal(selectedLeaveDetails, 'reject');
                                            }}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </>
                                ) : null}
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${selectedLeaveDetails.status === 'pending'
                                        ? 'flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-700'
                                        : 'w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-500 dark:hover:bg-slate-400 text-white'
                                        }`}
                                >
                                    Close
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
};

export default ApproveLeavePage;
