import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import type { ReviewRequest } from '../types/types';
import { BackButton, EmptyState, PageHeader, StatusBadge } from '../Components/SharedComponents';

const PendingReviewsPage: React.FC = () => {
    const navigate = useNavigate();

    // Mock data - replace with your actual data source
    const mockReviewRequests: ReviewRequest[] = [
        {
            id: '1',
            requesterId: 1, // Current user
            reviewerId: 2,
            requesterName: 'Glen Mogane',
            requesterRole: 'AWS Solutions Architect',
            requesterAvatar: 'GM',
            reviewerName: 'Sarah Johnson',
            reviewerRole: 'Cloud Architect',
            reviewerAvatar: 'SJ',
            status: 'pending',
            requestDate: '2025-08-09',
            dueDate: '2025-08-16',
            message: 'Looking forward to your feedback on my cloud architecture work.',
            type: 'peer-review'
        },
        {
            id: '2',
            requesterId: 1, // Current user
            reviewerId: 4,
            requesterName: 'Glen Mogane',
            requesterRole: 'AWS Solutions Architect',
            requesterAvatar: 'GM',
            reviewerName: 'Emily Davis',
            reviewerRole: 'Site Reliability Engineer',
            reviewerAvatar: 'ED',
            status: 'in-progress',
            requestDate: '2025-08-07',
            dueDate: '2025-08-14',
            message: 'Would appreciate your insights on my recent infrastructure work.',
            type: 'peer-review'
        }
    ];

    // Filter to show only requests where current user is the requester
    const currentUserId = 1; // This should come from your auth context
    const reviewRequests = mockReviewRequests.filter(r => r.requesterId === currentUserId);

    const handleBack = () => {
        navigate('/performance');
    };

    return (
        <div className="max-w-6xl mx-auto">
            <BackButton onBack={handleBack} />
            <PageHeader title="My Review Requests" />

            <div className="space-y-4">
                {reviewRequests.map((request) => (
                    <PendingReviewCard key={request.id} request={request} />
                ))}
            </div>

            {reviewRequests.length === 0 && (
                <EmptyState
                    icon={<Users className="w-16 h-16" />}
                    title="No pending requests"
                    description="You haven't requested any reviews yet."
                />
            )}
        </div>
    );
};

const PendingReviewCard = ({ request }: { request: ReviewRequest }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold">
                        {request.reviewerAvatar}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Review requested from {request.reviewerName}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-3">{request.reviewerRole}</p>
                        {request.message && (
                            <p className="text-gray-700 dark:text-gray-300 mb-3 italic">"{request.message}"</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span>Requested: {request.requestDate}</span>
                            <span>Due: {request.dueDate}</span>
                        </div>
                    </div>
                </div>
                <StatusBadge status={request.status} />
            </div>
        </div>
    );
};

export default PendingReviewsPage;