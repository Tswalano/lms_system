import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Eye } from 'lucide-react';
import type { ReviewRequest } from '../types/types';
import { BackButton, EmptyState, PageHeader, StatusBadge } from '../Components/SharedComponents';

const ReviewRequestsPage: React.FC = () => {
    const navigate = useNavigate();
    const [filter, setFilter] = useState<'all' | 'pending' | 'in-progress' | 'completed'>('all');

    // Mock data - replace with your actual data source
    const mockReviewRequests: ReviewRequest[] = [
        {
            id: '1',
            requesterId: 2,
            reviewerId: 1, // Current user
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
            reviewerId: 1, // Current user
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
            requesterId: 4,
            reviewerId: 1, // Current user
            requesterName: 'Emily Davis',
            requesterRole: 'Site Reliability Engineer',
            requesterAvatar: 'ED',
            reviewerName: 'Glen Mogane',
            reviewerRole: 'AWS Solutions Architect',
            reviewerAvatar: 'GM',
            status: 'completed',
            requestDate: '2025-08-05',
            dueDate: '2025-08-12',
            message: 'Could use your expertise on infrastructure scaling.',
            type: 'peer-review'
        }
    ];

    // Filter to show only requests where current user is the reviewer
    const currentUserId = 1; // This should come from your auth context
    const reviewRequests = mockReviewRequests.filter(r => r.reviewerId === currentUserId);

    const filteredRequests = reviewRequests.filter(request =>
        filter === 'all' || request.status === filter
    );

    const handleBack = () => {
        navigate('/performance');
    };

    const handleStartReview = (request: ReviewRequest) => {
        navigate(`/performance/conduct-review/${request.id}`);
    };

    const handleUpdateStatus = (id: string, status: ReviewRequest['status']) => {
        // TODO: Update the request status
        // This would normally update your state management or call an API
        console.log(`Updating request ${id} to status: ${status}`);

        // For now, just show an alert
        alert(`Review request ${status}`);
    };

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <BackButton onBack={handleBack} />

                <PageHeader title="Review Requests">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as typeof filter)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </PageHeader>

                <div className="space-y-4">
                    {filteredRequests.map((request) => (
                        <ReviewRequestCard
                            key={request.id}
                            request={request}
                            onStartReview={handleStartReview}
                            onUpdateStatus={handleUpdateStatus}
                        />
                    ))}
                </div>

                {filteredRequests.length === 0 && (
                    <EmptyState
                        icon={<Bell className="w-16 h-16" />}
                        title="No review requests"
                        description={filter === 'all' ? 'You don\'t have any review requests yet.' : `No ${filter} review requests.`}
                    />
                )}
            </div>
        </>
    );
};

const ReviewRequestCard = ({ request, onStartReview, onUpdateStatus }: {
    request: ReviewRequest;
    onStartReview: (request: ReviewRequest) => void;
    onUpdateStatus: (id: string, status: ReviewRequest['status']) => void;
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {request.requesterAvatar}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Review request from {request.requesterName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">{request.requesterRole}</p>
                        {request.message && (
                            <p className="text-gray-700 dark:text-gray-300 mb-3 italic">"{request.message}"</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Requested: {request.requestDate}</span>
                            <span>Due: {request.dueDate}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={request.status} />
                    <ReviewRequestActions
                        request={request}
                        onStartReview={onStartReview}
                        onUpdateStatus={onUpdateStatus}
                    />
                </div>
            </div>
        </div>
    );
};

const ReviewRequestActions = ({ request, onStartReview, onUpdateStatus }: {
    request: ReviewRequest;
    onStartReview: (request: ReviewRequest) => void;
    onUpdateStatus: (id: string, status: ReviewRequest['status']) => void;
}) => {
    if (request.status === 'pending') {
        return (
            <div className="flex gap-2">
                <button
                    onClick={() => onUpdateStatus(request.id, 'declined')}
                    className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                    Decline
                </button>
                <button
                    onClick={() => onStartReview(request)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Start Review
                </button>
            </div>
        );
    }

    if (request.status === 'in-progress') {
        return (
            <button
                onClick={() => onStartReview(request)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Continue Review
            </button>
        );
    }

    if (request.status === 'completed') {
        return (
            <button
                onClick={() => onStartReview(request)}
                className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center gap-2"
            >
                <Eye className="w-4 h-4" />
                View Review
            </button>
        );
    }

    return null;
};

export default ReviewRequestsPage;