import React, { useState, useMemo } from 'react';
import {
    Users, CheckCircle, Clock, AlertTriangle,
    Search, Eye, MessageSquare,
    BarChart3, PieChart, Download, RefreshCw
} from 'lucide-react';
import type { TeamMember } from '../types/types';
import type { CompletedReview, ReviewSummary } from '../types/adminTypes';
import { BackButton, PageHeader } from '../Components/SharedComponents';

interface TeamSummaryPageProps {
    teamMembers: TeamMember[];
    completedReviews: CompletedReview[];
    currentUser: TeamMember;
    onBack: () => void;
    onViewMember: (member: TeamMember) => void;
    onViewReview: (review: CompletedReview) => void;
}

const TeamSummaryPage: React.FC<TeamSummaryPageProps> = ({
    teamMembers,
    completedReviews,
    onBack,
    onViewMember,
    onViewReview
}) => {
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Generate team summaries
    const teamSummaries = useMemo(() => {
        return teamMembers.map(member => {
            const memberReviews = completedReviews.filter(r => r.revieweeId === member.id);
            const selfReview = memberReviews.find(r => r.reviewType === 'self');
            const peerReviews = memberReviews.filter(r => r.reviewType === 'peer');

            let overallStatus: ReviewSummary['overallStatus'] = 'incomplete';
            if (memberReviews.length > 0) {
                const allCompleted = memberReviews.every(r => r.status === 'completed');
                const anyInDiscussion = memberReviews.some(r => r.status === 'in-discussion');
                const anyPending = memberReviews.some(r => r.status === 'pending-review');

                if (allCompleted) overallStatus = 'completed';
                else if (anyInDiscussion) overallStatus = 'in-discussion';
                else if (anyPending) overallStatus = 'pending-review';
            }

            return {
                employeeId: member.id,
                employeeName: member.name,
                employeeRole: member.role,
                department: member.department,
                selfReview,
                peerReviews,
                overallStatus,
                lastUpdated: memberReviews.length > 0
                    ? new Date(Math.max(...memberReviews.map(r => new Date(r.completedDate).getTime()))).toISOString()
                    : '',
                reviewCount: memberReviews.length,
                completedCount: memberReviews.filter(r => r.status === 'completed').length,
                reviewCycle: 'monthly', // Assuming a fixed review cycle for simplicity
            } as ReviewSummary & { department: string; reviewCount: number; completedCount: number };
        });
    }, [teamMembers, completedReviews]);

    // Filter summaries
    const filteredSummaries = useMemo(() => {
        return teamSummaries.filter(summary => {
            if (selectedDepartment !== 'all' && summary.department !== selectedDepartment) return false;
            if (selectedStatus !== 'all' && summary.overallStatus !== selectedStatus) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!summary.employeeName.toLowerCase().includes(query) &&
                    !summary.employeeRole.toLowerCase().includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [teamSummaries, selectedDepartment, selectedStatus, searchQuery]);

    // Department list
    const departments = useMemo(() => {
        const depts = new Set(teamMembers.map(m => m.department));
        return Array.from(depts);
    }, [teamMembers]);

    // Team statistics
    const teamStats = useMemo(() => {
        const total = teamSummaries.length;
        const completed = teamSummaries.filter(s => s.overallStatus === 'completed').length;
        const inProgress = teamSummaries.filter(s => s.overallStatus === 'in-discussion' || s.overallStatus === 'pending-review').length;
        const incomplete = teamSummaries.filter(s => s.overallStatus === 'incomplete').length;

        return {
            totalMembers: total,
            completedReviews: completed,
            inProgress,
            incomplete,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }, [teamSummaries]);

    return (
        <div className="mx-auto">
            <BackButton onBack={onBack} text="Back to Admin Dashboard" />

            <PageHeader title="Team Review Summary">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        {viewMode === 'grid' ? <BarChart3 className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
                        {viewMode === 'grid' ? 'List View' : 'Grid View'}
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>
            </PageHeader>

            {/* Team Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <TeamStatCard
                    title="Total Team Members"
                    value={teamStats.totalMembers}
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                />
                <TeamStatCard
                    title="Completed Reviews"
                    value={teamStats.completedReviews}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="green"
                    percentage={teamStats.completionRate}
                />
                <TeamStatCard
                    title="In Progress"
                    value={teamStats.inProgress}
                    icon={<Clock className="w-6 h-6" />}
                    color="orange"
                />
                <TeamStatCard
                    title="Not Started"
                    value={teamStats.incomplete}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    color="red"
                />
            </div>

            {/* Filters and Search */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search team members..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>

                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="completed">Completed</option>
                            <option value="in-discussion">In Discussion</option>
                            <option value="pending-review">Pending Review</option>
                            <option value="incomplete">Not Started</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Team Members ({filteredSummaries.length})
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <RefreshCw className="w-4 h-4" />
                            Last updated: {new Date().toLocaleDateString()}
                        </div>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredSummaries.map((summary) => (
                                <TeamMemberCard
                                    key={summary.employeeId}
                                    summary={summary}
                                    onViewMember={() => onViewMember(teamMembers.find(m => m.id === summary.employeeId)!)}
                                    onViewReviews={() => {
                                        if (summary.selfReview) onViewReview(summary.selfReview);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredSummaries.map((summary) => (
                            <TeamMemberRow
                                key={summary.employeeId}
                                summary={summary}
                                onViewMember={() => onViewMember(teamMembers.find(m => m.id === summary.employeeId)!)}
                                onViewReviews={() => {
                                    if (summary.selfReview) onViewReview(summary.selfReview);
                                }}
                            />
                        ))}
                    </div>
                )}

                {filteredSummaries.length === 0 && (
                    <div className="p-12 text-center">
                        <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                            No team members found
                        </h3>
                        <p className="text-gray-400 dark:text-gray-500">
                            Try adjusting your filters or search criteria
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeamStatCard = ({ title, value, icon, color, percentage }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'orange' | 'red';
    percentage?: number;
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400',
        orange: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
        red: 'bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
                    {percentage !== undefined && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({percentage}%)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const TeamMemberCard = ({ summary, onViewMember, onViewReviews }: {
    summary: ReviewSummary & { department: string; reviewCount: number; completedCount: number };
    onViewMember: () => void;
    onViewReviews: () => void;
}) => {
    const getStatusColor = (status: string) => {
        const colors = {
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'in-discussion': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            'pending-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'incomplete': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
        };
        return colors[status as keyof typeof colors] || colors.incomplete;
    };

    const getProgressPercentage = () => {
        if (summary.reviewCount === 0) return 0;
        return Math.round((summary.completedCount / summary.reviewCount) * 100);
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {summary.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{summary.employeeName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{summary.employeeRole}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{summary.department}</p>
                    </div>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(summary.overallStatus)}`}>
                    {summary.overallStatus.replace('-', ' ')}
                </span>
            </div>

            <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Review Progress</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                        {summary.completedCount}/{summary.reviewCount}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="text-center">
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {summary.selfReview ? 1 : 0}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Self Review</div>
                </div>
                <div className="text-center">
                    <div className="font-semibold text-gray-900 dark:text-white">
                        {summary.peerReviews.length}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">Peer Reviews</div>
                </div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onViewMember}
                    className="flex-1 px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Eye className="w-4 h-4" />
                    View Profile
                </button>
                {summary.reviewCount > 0 && (
                    <button
                        onClick={onViewReviews}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Reviews
                    </button>
                )}
            </div>
        </div>
    );
};

const TeamMemberRow = ({ summary, onViewMember, onViewReviews }: {
    summary: ReviewSummary & { department: string; reviewCount: number; completedCount: number };
    onViewMember: () => void;
    onViewReviews: () => void;
}) => {
    const getStatusColor = (status: string) => {
        const colors = {
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'in-discussion': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            'pending-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'incomplete': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
        };
        return colors[status as keyof typeof colors] || colors.incomplete;
    };

    return (
        <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {summary.employeeName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{summary.employeeName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{summary.employeeRole} • {summary.department}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {summary.completedCount}/{summary.reviewCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {summary.peerReviews.length}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Peer Reviews</div>
                    </div>

                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(summary.overallStatus)}`}>
                        {summary.overallStatus.replace('-', ' ')}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={onViewMember}
                            className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                            <Eye className="w-4 h-4" />
                            View
                        </button>
                        {summary.reviewCount > 0 && (
                            <button
                                onClick={onViewReviews}
                                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Reviews
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamSummaryPage;