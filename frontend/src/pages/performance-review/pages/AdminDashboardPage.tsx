/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
    Users, Clock, MessageSquare, CheckCircle,
    Search, Eye, Calendar, TrendingUp,
    UserCheck, FileText
} from 'lucide-react';
import type { AdminFilters, AdminViewMode, CompletedReview } from '../types/adminTypes';
import type { TeamMember } from '../types/types';
import { BackButton, PageHeader } from '../Components/SharedComponents';

interface AdminDashboardPageProps {
    completedReviews: CompletedReview[];
    teamMembers: TeamMember[];
    currentUser: TeamMember;
    onBack: () => void;
    onViewReview: (review: CompletedReview) => void;
    onNavigate: (view: AdminViewMode, data?: any) => void;
}

const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
    completedReviews,
    currentUser,
    onBack,
    onViewReview,
    onNavigate
}) => {
    const [filters, setFilters] = useState<AdminFilters>({
        reviewType: 'all',
        status: 'all',
        priority: 'all',
        department: [],
        reviewCycle: 'all',
        dateRange: {}
    });
    const [searchQuery, setSearchQuery] = useState('');

    // Calculate statistics
    const stats = useMemo(() => {
        const total = completedReviews.length;
        const pending = completedReviews.filter(r => r.status === 'pending-review').length;
        const inDiscussion = completedReviews.filter(r => r.status === 'in-discussion').length;
        const completed = completedReviews.filter(r => r.status === 'completed').length;

        return {
            totalReviews: total,
            pendingReviews: pending,
            inDiscussion,
            completedReviews: completed,
            reviewsByType: {
                self: completedReviews.filter(r => r.reviewType === 'self').length,
                peer: completedReviews.filter(r => r.reviewType === 'peer').length,
            }
        };
    }, [completedReviews]);

    // Filter reviews based on current filters
    const filteredReviews = useMemo(() => {
        return completedReviews.filter(review => {
            if (filters.reviewType !== 'all' && review.reviewType !== filters.reviewType) return false;
            if (filters.status !== 'all' && review.status !== filters.status) return false;
            if (filters.priority !== 'all' && review.priority !== filters.priority) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!review.revieweeName.toLowerCase().includes(query) &&
                    !review.revieweeRole.toLowerCase().includes(query) &&
                    !(review.reviewerName?.toLowerCase().includes(query))) {
                    return false;
                }
            }

            return true;
        });
    }, [completedReviews, filters, searchQuery]);

    return (
        <div className="mx-auto">
            <PageHeader title="Admin Review Dashboard">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('analytics')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <TrendingUp className="w-4 h-4" />
                        Analytics
                    </button>
                    <button
                        onClick={() => onNavigate('discussions')}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Discussions
                    </button>
                </div>
            </PageHeader>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <AdminStatCard
                    title="Total Reviews"
                    value={stats.totalReviews}
                    icon={<FileText className="w-6 h-6" />}
                    color="blue"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                />
                <AdminStatCard
                    title="Pending Review"
                    value={stats.pendingReviews}
                    icon={<Clock className="w-6 h-6" />}
                    color="orange"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'pending-review' }))}
                />
                <AdminStatCard
                    title="In Discussion"
                    value={stats.inDiscussion}
                    icon={<MessageSquare className="w-6 h-6" />}
                    color="purple"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'in-discussion' }))}
                />
                <AdminStatCard
                    title="Completed"
                    value={stats.completedReviews}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="green"
                    onClick={() => setFilters(prev => ({ ...prev, status: 'completed' }))}
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <QuickActionCard
                    title="Review Individual Performance"
                    description="Deep dive into individual employee reviews and feedback"
                    icon={<UserCheck className="w-8 h-8" />}
                    color="blue"
                    onClick={() => onNavigate('individual-review')}
                />
                <QuickActionCard
                    title="Team Summary View"
                    description="Overview of team performance and review status"
                    icon={<Users className="w-8 h-8" />}
                    color="green"
                    onClick={() => onNavigate('team-summary')}
                />
                <QuickActionCard
                    title="Manage Discussions"
                    description="Review ongoing discussions and feedback threads"
                    icon={<MessageSquare className="w-8 h-8" />}
                    color="purple"
                    onClick={() => onNavigate('discussions')}
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
                                placeholder="Search reviews by employee or reviewer name..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={filters.reviewType}
                            onChange={(e) => setFilters(prev => ({ ...prev, reviewType: e.target.value as AdminFilters['reviewType'] }))}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="self">Self Reviews</option>
                            <option value="peer">Peer Reviews</option>
                        </select>

                        <select
                            value={filters.status}
                            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as AdminFilters['status'] }))}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending-review">Pending Review</option>
                            <option value="in-discussion">In Discussion</option>
                            <option value="completed">Completed</option>
                            <option value="needs-action">Needs Action</option>
                        </select>

                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as AdminFilters['priority'] }))}
                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Priority</option>
                            <option value="high">High Priority</option>
                            <option value="medium">Medium Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Recent Reviews ({filteredReviews.length})
                        </h3>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                            View All
                        </button>
                    </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredReviews.slice(0, 10).map((review) => (
                        <AdminReviewCard
                            key={review.id}
                            review={review}
                            onView={() => onViewReview(review)}
                            onStartDiscussion={() => onNavigate('discussions', { reviewId: review.id })}
                        />
                    ))}
                </div>

                {filteredReviews.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                            No reviews found
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

const AdminStatCard = ({ title, value, icon, color, onClick }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'orange' | 'purple' | 'green';
    onClick?: () => void;
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
        orange: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
        purple: 'bg-purple-100 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400',
        green: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400',
    };

    return (
        <div
            onClick={onClick}
            className={`p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors' : ''
                }`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
            </div>
        </div>
    );
};

const QuickActionCard = ({ title, description, icon, color, onClick }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'purple';
    onClick: () => void;
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    };

    return (
        <button
            onClick={onClick}
            className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 text-left transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 w-full"
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${colorClasses[color]}`}>
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </button>
    );
};

const AdminReviewCard = ({ review, onView, onStartDiscussion }: {
    review: CompletedReview;
    onView: () => void;
    onStartDiscussion: () => void;
}) => {
    const getStatusBadgeColor = (status: string) => {
        const colors = {
            'pending-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'in-discussion': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'needs-action': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
        return colors[status as keyof typeof colors] || colors['pending-review'];
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'text-gray-500',
            'medium': 'text-yellow-500',
            'high': 'text-red-500',
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return (
        <div className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {review.revieweeAvatar}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                {review.revieweeName}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {review.revieweeRole}
                            </span>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(review.status)}`}>
                                {review.status.replace('-', ' ')}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(review.priority)}`} />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(review.completedDate).toLocaleDateString()}
                            </span>
                            <span className="capitalize">
                                {review.reviewType} Review
                            </span>
                            {review.reviewerName && (
                                <span>
                                    by {review.reviewerName}
                                </span>
                            )}
                            <span>
                                {review.responses.length} responses
                            </span>
                        </div>

                        {review.tags.length > 0 && (
                            <div className="flex items-center gap-2 mb-3">
                                {review.tags.slice(0, 3).map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                                        {tag}
                                    </span>
                                ))}
                                {review.tags.length > 3 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        +{review.tags.length - 3} more
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onStartDiscussion}
                        className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Discuss
                    </button>
                    <button
                        onClick={onView}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                    >
                        <Eye className="w-4 h-4" />
                        Review
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;