import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Download, Eye, RefreshCw, AlertCircle, X, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
    const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
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

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['leaveHistory'] });
    };

    const openLeaveDetails = (leave: LeaveRecord) => {
        setSelectedLeave(leave);
        setIsDialogOpen(true);
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 ml-64">
                    <DashboardHeader />
                    <main className="p-8">
                        <div className="px-16 mx-auto space-y-8">
                            <div className=" mb-8">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
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
                                            className="flex items-center gap-2"
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
                                            variant={filter === key ? 'default' : 'outline'}
                                            className={`${filter === key ? 'bg-blue-600 hover:bg-blue-700' : ''} flex items-center gap-2`}
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
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:hover:text-blue-300"
                                                            onClick={() => openLeaveDetails(record)}
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
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
                            <Button
                                onClick={() => setIsDialogOpen(false)}
                                className="w-full bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white"
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeaveHistory;