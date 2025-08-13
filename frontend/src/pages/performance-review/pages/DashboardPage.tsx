// DashboardPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartArea, Clock, FileText, Users, CheckCircle, User, Star, UserPlus } from 'lucide-react';
import type { ReviewRequest, TeamMember } from '../types/types';
import { ActionCard, StatCard, StatusBadge } from '../Components/SharedComponents';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();

    const [currentUser] = useState<TeamMember>({
        id: 1,
        name: "Glen Mogane",
        role: "AWS Solutions Architect",
        avatar: "GM",
        department: "Engineering"
    });

    const [reviewRequests] = useState<ReviewRequest[]>([
        {
            id: '1',
            requesterId: 2,
            reviewerId: 1,
            requesterName: 'Sarah Johnson',
            requesterRole: 'Cloud Architect',
            requesterAvatar: 'SJ',
            reviewerName: 'Glen Mogane',
            reviewerRole: 'AWS Solutions Architect',
            reviewerAvatar: 'GM',
            status: 'pending',
            requestDate: '2025-08-09',
            dueDate: '2025-08-16',
            message: 'Hi Glen, I would appreciate your feedback on my cloud architecture work this quarter.',
            type: 'peer-review'
        },
        {
            id: '2',
            requesterId: 3,
            reviewerId: 1,
            requesterName: 'Mike Chen',
            requesterRole: 'Platform Engineer',
            requesterAvatar: 'MC',
            reviewerName: 'Glen Mogane',
            reviewerRole: 'AWS Solutions Architect',
            reviewerAvatar: 'GM',
            status: 'in-progress',
            requestDate: '2025-08-07',
            dueDate: '2025-08-14',
            message: 'Looking forward to your insights on my platform automation projects.',
            type: 'peer-review'
        },
        {
            id: '3',
            requesterId: 1,
            reviewerId: 4,
            requesterName: 'Glen Mogane',
            requesterRole: 'AWS Solutions Architect',
            requesterAvatar: 'GM',
            reviewerName: 'Emily Davis',
            reviewerRole: 'Site Reliability Engineer',
            reviewerAvatar: 'ED',
            status: 'completed',
            requestDate: '2025-08-05',
            dueDate: '2025-08-12',
            type: 'peer-review'
        }
    ]);

    const pendingRequestsForMe = reviewRequests.filter(r => r.reviewerId === currentUser.id && r.status === 'pending').length;
    const inProgressRequestsForMe = reviewRequests.filter(r => r.reviewerId === currentUser.id && r.status === 'in-progress').length;
    const myPendingRequests = reviewRequests.filter(r => r.requesterId === currentUser.id && r.status !== 'completed').length;
    const completedReviews = reviewRequests.filter(r => r.reviewerId === currentUser.id && r.status === 'completed').length;

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <>
            {/* Header */}
            <div className="mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <ChartArea className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Review Dashboard</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome to your performance review dashboard.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => handleNavigate('/performance/request-review')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                        >
                            <UserPlus className="w-4 h-4" />
                            Request Review
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Pending Reviews"
                        value={pendingRequestsForMe}
                        icon={<Clock className="w-6 h-6" />}
                        color="orange"
                        onClick={() => handleNavigate('/performance/review-requests')}
                    />
                    <StatCard
                        title="In Progress"
                        value={inProgressRequestsForMe}
                        icon={<FileText className="w-6 h-6" />}
                        color="blue"
                        onClick={() => handleNavigate('/performance/review-requests')}
                    />
                    <StatCard
                        title="My Requests"
                        value={myPendingRequests}
                        icon={<Users className="w-6 h-6" />}
                        color="purple"
                        onClick={() => handleNavigate('/performance/pending-reviews')}
                    />
                    <StatCard
                        title="Completed"
                        value={completedReviews}
                        icon={<CheckCircle className="w-6 h-6" />}
                        color="green"
                    />
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <ActionCard
                        title="Request Peer Review"
                        description="Ask colleagues to review your performance"
                        icon={<UserPlus className="w-8 h-8" />}
                        color="blue"
                        onClick={() => handleNavigate('/performance/request-review')}
                    />
                    <ActionCard
                        title="Complete Self Review"
                        description="Reflect on your own performance and goals"
                        icon={<User className="w-8 h-8" />}
                        color="green"
                        onClick={() => handleNavigate('/performance/self-review')}
                    />
                    <ActionCard
                        title="Review Requests"
                        description="Complete pending peer review requests"
                        icon={<Star className="w-8 h-8" />}
                        color="purple"
                        onClick={() => handleNavigate('/performance/review-requests')}
                    />
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
                    </div>
                    <div className="p-6">
                        {reviewRequests.slice(0, 5).map((request) => (
                            <ActivityItem
                                key={request.id}
                                request={request}
                                currentUser={currentUser}
                            />
                        ))}
                        {reviewRequests.length === 0 && (
                            <div className="text-center py-8">
                                <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const ActivityItem = ({ request, currentUser }: {
    request: ReviewRequest;
    currentUser: TeamMember;
}) => {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                    {request.requesterId === currentUser.id ? request.reviewerAvatar : request.requesterAvatar}
                </div>
                <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {request.requesterId === currentUser.id
                            ? `You requested a review from ${request.reviewerName}`
                            : `${request.requesterName} requested your review`
                        }
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{request.requestDate}</p>
                </div>
            </div>
            <StatusBadge status={request.status} />
        </div>
    );
};

export default DashboardPage;