import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Clock, Download, Eye, RefreshCw, AlertCircle, X, CheckCircle, XCircle, AlertTriangle, Loader2, Edit, Calendar as CalendarIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

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
    leave_length: number;
    updatedAt: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: LeaveRecord[];
}

const LeaveHistory = () => {
    const { authFetch } = useAuth()
    const [filter, setFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
    const [editFormData, setEditFormData] = useState<LeaveApplicationData>({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        leaveLength: 'full_day'
    });
    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    const fetchLeaveHistory = async (): Promise<LeaveRecord[]> => {
        if (!token) {
            throw new Error('Unauthorized');
        }

        const response = await authFetch('/leave/leave-history', {
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
            throw new Error(result.message || 'Failed to fetch leave history');
        }

        return result.data;
    };

    const {
        data: leaveHistory = [],
        isLoading,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['leaveHistory'],
        queryFn: fetchLeaveHistory,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    // Effect to handle leave length changes in edit form
    useEffect(() => {
        if (editFormData.leaveLength === 'half_day' && editFormData.startDate) {
            setEditFormData(prev => ({
                ...prev,
                endDate: editFormData.startDate
            }));
        }
    }, [editFormData.leaveLength, editFormData.startDate]);

    // Helper function for date formatting without timezone issues
    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // API function to update leave application
    const updateLeaveApplication = async (leaveId: number, data: LeaveApplicationData): Promise<ApiResponse> => {
        const payload = {
            leave_type: data.leaveType,
            leave_start: data.startDate,
            leave_end: data.endDate,
            leave_comment: data.reason,
            leave_length: data.leaveLength
        };

        const response = await authFetch(`/leave/${leaveId}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result: ApiResponse = await response.json();

        if (!result.success) {
            throw new Error(result.message || 'Failed to update leave application');
        }

        return result;
    };

    // React Query mutation for updating leave application
    const {
        mutate: updateApplication,
        isPending: isUpdating
    } = useMutation({
        mutationFn: ({ leaveId, data }: { leaveId: number; data: LeaveApplicationData }) =>
            updateLeaveApplication(leaveId, data),
        onSuccess: (data) => {
            toast.success("Leave Application Updated", {
                description: data.message || "Your leave request has been updated successfully.",
            });

            // Close edit modal
            setIsEditModalOpen(false);
            setSelectedLeave(null);

            // Reset form data
            setEditFormData({
                leaveType: '',
                startDate: '',
                endDate: '',
                reason: '',
                leaveLength: 'full_day'
            });

            // Invalidate and refetch leave history
            queryClient.invalidateQueries({ queryKey: ['leaveHistory'] });
        },
        onError: (error) => {
            toast.error("Update Failed", {
                description: error instanceof Error ? error.message : "Failed to update leave application. Please try again.",
            });
        }
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['leaveHistory'] });
    };

    const openLeaveDetails = (leave: LeaveRecord) => {
        setSelectedLeave(leave);
        setIsDialogOpen(true);
    };

    const handleEditLeave = (leave: LeaveRecord) => {
        setSelectedLeave(leave);
        setEditFormData({
            leaveType: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            reason: leave.leave_comment,
            leaveLength: leave.leave_length === 0.5 ? 'half_day' : 'full_day'
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedLeave) return;

        // Basic validation
        if (!editFormData.leaveType || !editFormData.startDate || !editFormData.endDate || !editFormData.reason) {
            toast.error("Missing Required Fields", {
                description: "Please fill in all required fields.",
            });
            return;
        }

        // Date validation
        const startDate = new Date(editFormData.startDate);
        const endDate = new Date(editFormData.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            toast.error("Invalid Start Date", {
                description: "Start date cannot be in the past."
            });
            return;
        }

        if (editFormData.leaveLength === 'full_day' && endDate < startDate) {
            toast.error("Invalid Date Range", {
                description: "End date cannot be before start date."
            });
            return;
        }

        // Submit the update
        updateApplication({ leaveId: selectedLeave.id, data: editFormData });
    };

    const canEditLeave = (leave: LeaveRecord): boolean => {
        // Only allow editing of pending leaves
        return leave.status.toLowerCase() === 'pending';
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium';
        }
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'approved': return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'pending': return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
            default: return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusCount = (status: string) => {
        if (status === 'all') return leaveHistory.length;
        return leaveHistory.filter(r => r.status.toLowerCase() === status).length;
    };

    const filteredHistory = leaveHistory.filter(record => {
        if (filter === 'all') return true;
        return record.status.toLowerCase() === filter;
    });

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h1>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to view your leave history.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className=" mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Leave History</h1>
                            <p className="text-gray-600 dark:text-gray-400">Track your leave applications and status</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={isFetching}
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            Export History
                        </Button>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'approved', label: 'Approved' },
                        { key: 'pending', label: 'Pending' },
                        { key: 'rejected', label: 'Rejected' }
                    ].map(({ key, label }) => (
                        <Button
                            key={key}
                            onClick={() => setFilter(key as typeof filter)}
                            variant='ghost'
                            className={`${filter === key ? 'bg-cyan-600 text-white' : 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} hover:bg-cyan-500 hover:text-white flex items-center gap-2`}
                        >
                            {label}
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                {getStatusCount(key)}
                            </span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
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
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button
                                onClick={() => refetch()}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : filteredHistory.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                {filter === 'all' ? 'No leave history found' : `No ${filter} leave requests found`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {filter === 'all'
                                    ? 'Your leave requests will appear here once you submit them.'
                                    : `Try changing the filter to see other leave requests.`
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-100 dark:border-slate-700">
                                <TableHead className="text-gray-700 dark:text-gray-300">Leave Type</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Duration</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Days</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Applied Date</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredHistory.map((record) => (
                                <TableRow
                                    key={record.id}
                                    className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                                    <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(record.status)}
                                            {record.leave_type}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">
                                        {formatDate(record.start_date)} - {formatDate(record.end_date)}
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">
                                        {record.duration} day{record.duration > 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(record.status)}>
                                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-400">
                                        {formatDate(record.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:hover:text-blue-300"
                                                onClick={() => openLeaveDetails(record)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            {canEditLeave(record) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/50 dark:text-orange-400 dark:hover:text-orange-300"
                                                    onClick={() => handleEditLeave(record)}
                                                    title="Edit Leave Application"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Leave Details Modal */}
            {isDialogOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                        {getStatusIcon(selectedLeave.status)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            {selectedLeave.leave_type} Leave
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Application #{selectedLeave.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Start Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeave.start_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">End Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeave.end_date)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Duration</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {selectedLeave.duration} day{selectedLeave.duration > 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                        <div className="mt-1">
                                            <Badge className={getStatusColor(selectedLeave.status)}>
                                                {selectedLeave.status.charAt(0).toUpperCase() + selectedLeave.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Applied Date</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeave.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                                        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                            {formatDate(selectedLeave.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {selectedLeave.leave_comment && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Comment</label>
                                    <div className="mt-2 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                                        <p className="text-gray-700 dark:text-gray-300">{selectedLeave.leave_comment}</p>
                                    </div>
                                </div>
                            )}

                            {selectedLeave.feedback && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Manager Feedback</label>
                                    <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <p className="text-gray-700 dark:text-gray-300">{selectedLeave.feedback}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-3">
                                {canEditLeave(selectedLeave) && (
                                    <Button
                                        onClick={() => handleEditLeave(selectedLeave)}
                                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Edit Application
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setIsDialogOpen(false)}
                                    variant="outline"
                                    className="flex-1 bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Leave Modal */}
            {isEditModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                                        <Edit className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                                            Edit Leave Application
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Application #{selectedLeave.id}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                    disabled={isUpdating}
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        {/* Form Content */}
                        <div className="p-6">
                            <form onSubmit={handleUpdateSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="editLeaveType" className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                                    <Select
                                        value={editFormData.leaveType}
                                        onValueChange={(value) => setEditFormData({ ...editFormData, leaveType: value })}
                                        disabled={isUpdating}
                                    >
                                        <SelectTrigger className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                            <SelectValue placeholder="Select leave type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                                            <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                            <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                            <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                            <SelectItem value="Family Responsibility">Family Responsibility</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-gray-700 dark:text-gray-300">Leave Length *</Label>
                                    <RadioGroup
                                        value={editFormData.leaveLength}
                                        onValueChange={(value: 'half_day' | 'full_day') => setEditFormData({ ...editFormData, leaveLength: value })}
                                        className="flex gap-6"
                                        disabled={isUpdating}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="full_day" id="edit_full_day" />
                                            <Label htmlFor="edit_full_day">Full Day</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="half_day" id="edit_half_day" />
                                            <Label htmlFor="edit_half_day">Half Day</Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                                    <CalendarIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <span>Start Date *</span>
                                            </div>
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600",
                                                        !editFormData.startDate && "text-muted-foreground"
                                                    )}
                                                    disabled={isUpdating}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {editFormData.startDate ? format(new Date(editFormData.startDate), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                                <Calendar
                                                    mode="single"
                                                    className="bg-white dark:bg-slate-800"
                                                    selected={editFormData.startDate ? new Date(editFormData.startDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const dateString = formatDateToLocal(date);
                                                            setEditFormData({ ...editFormData, startDate: dateString });
                                                            if (editFormData.leaveLength === 'half_day') {
                                                                setEditFormData(prev => ({ ...prev, endDate: dateString }));
                                                            }
                                                        }
                                                    }}
                                                    initialFocus
                                                    disabled={(date) => {
                                                        const today = new Date();
                                                        const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                        const compareToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                                        return compareDate < compareToday;
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                                    <CalendarIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <span>{editFormData.leaveLength === 'half_day' ? 'Date' : 'End Date *'}</span>
                                            </div>
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600",
                                                        !editFormData.endDate && "text-muted-foreground"
                                                    )}
                                                    disabled={isUpdating || editFormData.leaveLength === 'half_day'}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {editFormData.endDate ? format(new Date(editFormData.endDate), "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                                <Calendar
                                                    mode="single"
                                                    className="bg-white dark:bg-slate-800"
                                                    selected={editFormData.endDate ? new Date(editFormData.endDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date && editFormData.leaveLength === 'full_day') {
                                                            setEditFormData({ ...editFormData, endDate: formatDateToLocal(date) });
                                                        }
                                                    }}
                                                    initialFocus
                                                    disabled={(date) => {
                                                        if (editFormData.leaveLength === 'full_day' && editFormData.startDate) {
                                                            const startDateObj = new Date(editFormData.startDate);
                                                            const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
                                                            const compareStart = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                                                            return compareDate < compareStart;
                                                        }
                                                        return false;
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="editReason" className="text-gray-700 dark:text-gray-300">Reason for Leave *</Label>
                                    <Textarea
                                        id="editReason"
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        value={editFormData.reason}
                                        onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                                        className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[120px]"
                                        disabled={isUpdating}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        type="submit"
                                        className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 px-8"
                                        disabled={isUpdating}
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Edit className="w-4 h-4" />
                                                Update Application
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        variant="outline"
                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                                        disabled={isUpdating}
                                    >
                                        Cancel
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

export default LeaveHistory;