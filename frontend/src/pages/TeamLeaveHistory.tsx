import { useState } from "react";
import { Users, Calendar, ArrowLeft, Loader2, AlertCircle, Clock, CheckCircle, XCircle, Search, Mail, Briefcase, History, ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from '@tanstack/react-query';
import moment from 'moment';
import { useAuth } from "@/contexts/AuthContext";

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    role: string;
    dob: string | null;
    gender: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
}

interface LeaveHistoryItem {
    id: number;
    leave_type: string;
    status: string;
    duration: number;
    start_date: string;
    end_date: string;
    feedback: string;
    leave_length: string;
    leave_comment: string;
    createdAt: string;
    updatedAt: string;
}

interface UserApiResponse {
    success: boolean;
    message: string;
    payload: User[] | [];
}

interface ApiResponse {
    success: boolean;
    message: string;
    data?: LeaveHistoryItem[];
}

const TeamListLeaveHistory = () => {
    const { authFetch } = useAuth();
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLeaveId, setExpandedLeaveId] = useState<number | null>(null);

    const token: string | null = localStorage.getItem('authToken');

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    const getUserInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const getUserGradient = (userId: string) => {
        const gradients = [
            'from-purple-500 to-pink-500',
            'from-blue-500 to-cyan-500',
            'from-green-500 to-teal-500',
            'from-orange-500 to-red-500',
            'from-indigo-500 to-purple-500',
            'from-pink-500 to-rose-500',
            'from-cyan-500 to-blue-500',
            'from-teal-500 to-green-500',
            'from-red-500 to-pink-500',
            'from-yellow-500 to-orange-500',
            'from-emerald-500 to-cyan-500',
            'from-violet-500 to-purple-500',
            'from-sky-500 to-blue-500',
            'from-lime-500 to-green-500',
            'from-amber-500 to-orange-500',
            'from-rose-500 to-pink-500'
        ];
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return gradients[Math.abs(hash) % gradients.length];
    };

    const getCardAccent = (userId: string) => {
        const accents = [
            'border-l-purple-400 bg-purple-50/50 dark:bg-purple-900/10',
            'border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10',
            'border-l-green-400 bg-green-50/50 dark:bg-green-900/10',
            'border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/10',
            'border-l-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10',
            'border-l-pink-400 bg-pink-50/50 dark:bg-pink-900/10',
            'border-l-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/10',
            'border-l-teal-400 bg-teal-50/50 dark:bg-teal-900/10',
            'border-l-red-400 bg-red-50/50 dark:bg-red-900/10',
            'border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10',
            'border-l-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10',
            'border-l-violet-400 bg-violet-50/50 dark:bg-violet-900/10',
            'border-l-sky-400 bg-sky-50/50 dark:bg-sky-900/10',
            'border-l-lime-400 bg-lime-50/50 dark:bg-lime-900/10',
            'border-l-amber-400 bg-amber-50/50 dark:bg-amber-900/10',
            'border-l-rose-400 bg-rose-50/50 dark:bg-rose-900/10'
        ];
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        return accents[Math.abs(hash) % accents.length];
    };

    const fetchUsers = async (): Promise<User[]> => {
        const response = await authFetch('/users', {
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

        const result: UserApiResponse = await response.json();
        return result.payload || [];
    };

    const fetchUserLeaveHistory = async (userId: string): Promise<LeaveHistoryItem[]> => {
        const response = await authFetch(`/leave/leave-history/${userId}`, {
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
        return result.data || [];
    };



    const {
        data: users = [],
        isLoading: usersLoading,
        isError: usersError,
        error: usersErrorMessage
    } = useQuery({
        queryKey: ['users'],
        queryFn: fetchUsers,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const {
        data: leaveHistory = [],
        isLoading: historyLoading,
        isError: historyError,
        error: historyErrorMessage
    } = useQuery({
        queryKey: ['userLeaveHistory', selectedUser?.id],
        queryFn: () => fetchUserLeaveHistory(selectedUser!.id),
        enabled: !!selectedUser,
        staleTime: 2 * 60 * 1000,
        gcTime: 5 * 60 * 1000,
    });

    const filteredUsers = users.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'approved':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400';
            case 'rejected':
                return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'approved':
                return <CheckCircle className="w-4 h-4" />;
            case 'pending':
                return <Clock className="w-4 h-4" />;
            case 'rejected':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Clock className="w-4 h-4" />;
        }
    };

    const formatLeaveLength = (length: string) => {
        return length.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const toggleLeaveDetails = (leaveId: number) => {
        setExpandedLeaveId(expandedLeaveId === leaveId ? null : leaveId);
    };


    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Unauthorized</h2>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to view user information.</p>
                </div>
            </div>
        );
    }

    if (selectedUser) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
                <div className="flex">
                    <Sidebar />
                    <div className="flex-1 ml-64">
                        <DashboardHeader />
                        <main className="p-4 lg:p-8">
                            <div className="px-16 mx-auto space-y-8">
                                {/* User Header - keep existing */}
                                <div className="mb-6 lg:mb-8">
                                    <Button
                                        onClick={() => setSelectedUser(null)}
                                        variant="ghost"
                                        className="mb-6 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Team
                                    </Button>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                                        <div className={`w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br ${getUserGradient(selectedUser.id)} rounded-2xl flex items-center justify-center shadow-lg`}>
                                            <span className="text-white font-bold text-lg lg:text-xl">
                                                {getUserInitials(selectedUser.firstName, selectedUser.lastName)}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                                                {toTitleCase(selectedUser.firstName)} {toTitleCase(selectedUser.lastName)}
                                            </h1>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 dark:text-gray-400">
                                                <div className="flex items-center gap-2">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span>{selectedUser.jobTitle}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="text-sm">{selectedUser.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Leave History Table */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                    <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="w-5 h-5 text-blue-600" />
                                            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                                Leave History
                                            </h2>
                                            {historyLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                        </div>
                                    </div>

                                    <div className="p-4 lg:p-6">
                                        {historyError ? (
                                            <div className="flex items-center justify-center py-12">
                                                <div className="text-center">
                                                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                                                    <p className="text-red-600 dark:text-red-400 font-medium">Error loading leave history</p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {historyErrorMessage instanceof Error ? historyErrorMessage.message : 'Something went wrong'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : leaveHistory.length === 0 && !historyLoading ? (
                                            <div className="text-center py-12">
                                                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                                <p className="text-gray-500 dark:text-gray-400">No leave history found</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead className="bg-gray-50 dark:bg-slate-700/30">
                                                            <tr>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Leave Type
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Duration
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Dates
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Status
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Applied
                                                                </th>
                                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                    Actions
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                                            {leaveHistory.map((leave) => (
                                                                <>
                                                                    <tr key={leave.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors duration-150">
                                                                        {/* Leave Type */}
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center gap-3">
                                                                                <div>
                                                                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                                        {toTitleCase(leave.leave_type)}
                                                                                    </div>
                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                                                        {formatLeaveLength(leave.leave_length)}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        {/* Duration */}
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                                <Clock className="w-4 h-4 text-gray-400" />
                                                                                <span>{leave.duration} day{leave.duration > 1 ? 's' : ''}</span>
                                                                            </div>
                                                                        </td>

                                                                        {/* Dates */}
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <div className="text-sm text-gray-700 dark:text-gray-300">
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                                                    <span>{moment(leave.start_date).format('MMM DD, YYYY')}</span>
                                                                                </div>
                                                                                <div className="text-xs text-gray-500 dark:text-gray-400 pl-6">
                                                                                    to {moment(leave.end_date).format('MMM DD, YYYY')}
                                                                                </div>
                                                                            </div>
                                                                        </td>

                                                                        {/* Status */}
                                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(leave.status)}`}>
                                                                                {getStatusIcon(leave.status)}
                                                                                {toTitleCase(leave.status)}
                                                                            </span>
                                                                        </td>

                                                                        {/* Applied Date */}
                                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                            <div>{moment(leave.createdAt).format('MMM DD, YYYY')}</div>
                                                                            {leave.updatedAt && (
                                                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                                                    Updated {moment(leave.updatedAt).format('MMM DD')}
                                                                                </div>
                                                                            )}
                                                                        </td>

                                                                        {/* Actions */}
                                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                            <button
                                                                                onClick={() => toggleLeaveDetails(leave.id)}
                                                                                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-150"
                                                                            >
                                                                                View Details
                                                                                {expandedLeaveId === leave.id ? (
                                                                                    <ChevronUp className="w-4 h-4" />
                                                                                ) : (
                                                                                    <ChevronDown className="w-4 h-4" />
                                                                                )}
                                                                            </button>
                                                                        </td>
                                                                    </tr>

                                                                    {/* Expandable Details Row */}
                                                                    {expandedLeaveId === leave.id && (
                                                                        <tr>
                                                                            <td colSpan={6} className="px-0 py-0">
                                                                                <div className="bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600">
                                                                                    <div className="px-6 py-4">
                                                                                        <div className="px-16 max-w-7xl mx-auto ">
                                                                                            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                                                                                                <MessageSquare className="w-4 h-4" />
                                                                                                Leave Details
                                                                                            </h4>

                                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                                                                <div className="space-y-2">
                                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Leave Information</div>
                                                                                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 space-y-2">
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Type:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{toTitleCase(leave.leave_type)}</span>
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Length:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatLeaveLength(leave.leave_length)}</span>
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Duration:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{leave.duration} day{leave.duration > 1 ? 's' : ''}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-2">
                                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timeline</div>
                                                                                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-3 space-y-2">
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Applied:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{moment(leave.createdAt).format('MMM DD, YYYY')}</span>
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">Start Date:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{moment(leave.start_date).format('MMM DD, YYYY')}</span>
                                                                                                        </div>
                                                                                                        <div className="flex justify-between items-center">
                                                                                                            <span className="text-sm text-gray-600 dark:text-gray-400">End Date:</span>
                                                                                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{moment(leave.end_date).format('MMM DD, YYYY')}</span>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Comments Section */}
                                                                                            {leave.leave_comment && (
                                                                                                <div className="space-y-2">
                                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee Comment</div>
                                                                                                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4">
                                                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                                                                                                            {leave.leave_comment}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}

                                                                                            {/* Feedback Section */}
                                                                                            {leave.feedback && (
                                                                                                <div className="space-y-2 mt-4">
                                                                                                    <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Manager Feedback</div>
                                                                                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                                                                                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                                                                                                            {leave.feedback}
                                                                                                        </p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    )}
                                                                </>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </main>
                    </div>
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
                    <main className="p-4 lg:p-8">
                        <div className="px-16 mx-auto space-y-8">
                            <div className="mb-6 lg:mb-8">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                            <History className="w-5 h-5 text-white" />
                                        </div>
                                        {/* <div>
                                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-200">Team Directory</h1>
                                            <p className="text-gray-600 dark:text-gray-400">Manage team members and view leave history</p>
                                        </div> */}

                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Team Directory</h1>
                                            <p className="text-gray-600 dark:text-gray-400">Manage team members and view leave history</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                    <div className="relative w-full sm:w-96">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            placeholder="Search team members..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                                        />
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {searchTerm ? `${filteredUsers.length} of ${users.length} members` : `${users.length} team members`}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                                            {searchTerm ? 'Search Results' : 'All Team Members'}
                                        </h2>
                                        {usersLoading && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
                                    </div>
                                </div>

                                <div className="p-4 lg:p-6">
                                    {usersError ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="text-center">
                                                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                                                <p className="text-red-600 dark:text-red-400 font-medium">Error loading team members</p>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {usersErrorMessage instanceof Error ? usersErrorMessage.message : 'Something went wrong'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : filteredUsers.length === 0 && !usersLoading ? (
                                        <div className="text-center py-12">
                                            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">
                                                {searchTerm ? 'No team members found' : 'No team members available'}
                                            </p>
                                            {searchTerm && (
                                                <p className="text-sm text-gray-400">
                                                    Try adjusting your search terms
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                            {filteredUsers.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className={`relative bg-white dark:bg-slate-800 border-l-4 ${getCardAccent(user.id)} rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-slate-900/20 transition-all duration-300 overflow-hidden group hover:scale-[1.02]`}
                                                >
                                                    <div className="p-6">
                                                        <div className="flex items-start gap-4 mb-4">
                                                            <div className={`w-14 h-14 bg-gradient-to-br ${getUserGradient(user.id)} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                                                                <span className="text-white font-semibold text-lg">
                                                                    {getUserInitials(user.firstName, user.lastName)}
                                                                </span>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-lg leading-tight mb-1 truncate">
                                                                    {toTitleCase(user.firstName)} {toTitleCase(user.lastName)}
                                                                </h3>
                                                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 mb-2">
                                                                    <Briefcase className="w-3 h-3 flex-shrink-0" />
                                                                    <p className="text-sm font-medium truncate">{user.jobTitle}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-3 mb-4">
                                                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                                                <Mail className="w-4 h-4 flex-shrink-0" />
                                                                <span className="text-sm truncate">{user.email}</span>
                                                            </div>

                                                            <div className="flex items-center justify-between">
                                                                <div className="flex gap-2">
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                        Active
                                                                    </span>
                                                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                                                                        {toTitleCase(user.role)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <Button
                                                            onClick={() => setSelectedUser(user)}
                                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center gap-2 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                                                        >
                                                            View Leave History
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TeamListLeaveHistory;