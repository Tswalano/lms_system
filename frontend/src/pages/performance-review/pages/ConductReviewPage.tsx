import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Question, Response, ReviewRequest } from '../types/types';
import { BackButton, PageHeader } from '../Components/SharedComponents';
import { ReviewComplete, ReviewForm } from '../Components/ReviewFormComponents';
import { Binoculars } from 'lucide-react';

const ConductReviewPage: React.FC = () => {
    const navigate = useNavigate();
    const { requestId } = useParams<{ requestId: string }>();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Response[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [isComplete, setIsComplete] = useState(false);

    // Mock data - replace this with your actual data source
    const mockReviewRequests: ReviewRequest[] = [
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
        }
    ];

    // Find the request by ID
    const request = mockReviewRequests.find(r => r.id === requestId);

    // If request not found, redirect back
    if (!request) {
        return (
            <div className="max-w-6xl mx-auto">
                <BackButton onBack={() => navigate('/performance/review-requests')} text="Back to Requests" />
                <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <Binoculars className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4 flex justify-center" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                        Review Request Not Found
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        The review request you're looking for doesn't exist or has been removed.
                    </p>
                </div>
            </div>
        );
    }

    const peerQuestions: Question[] = [
        { id: 'peer-1', type: 'peer', category: 'Team Collaboration', question: `Describe a specific instance where ${request.requesterName} collaborated effectively with the team.` },
        { id: 'peer-2', type: 'peer', category: 'Technical Impact', question: `How did ${request.requesterName}'s work impact the team's or company's technical goals this quarter?` },
        { id: 'peer-3', type: 'peer', category: 'Problem Solving', question: `Provide an example of a challenging problem ${request.requesterName} solved.` },
        { id: 'peer-4', type: 'peer', category: 'Leadership & Mentoring', question: `How has ${request.requesterName} demonstrated leadership or helped mentor others?` },
        { id: 'peer-5', type: 'peer', category: 'Communication', question: `How would you rate ${request.requesterName}'s communication skills? Provide specific examples.` },
        { id: 'peer-6', type: 'peer', category: 'Innovation & Initiative', question: `Describe any innovative approaches or initiatives ${request.requesterName} has taken.` },
        { id: 'peer-7', type: 'peer', category: 'Areas for Growth', question: `What areas could ${request.requesterName} focus on for professional development?` },
        { id: 'peer-8', type: 'peer', category: 'Overall Assessment', question: `What are ${request.requesterName}'s greatest strengths, and how do they contribute to team success?` },
    ];

    const currentQuestion = peerQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / peerQuestions.length) * 100;

    const handleNext = () => {
        if (currentAnswer.trim()) {
            const newResponse: Response = {
                questionId: currentQuestion.id,
                answer: currentAnswer,
            };
            setResponses(prev => [...prev, newResponse]);
            setCurrentAnswer('');
            if (currentQuestionIndex < peerQuestions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
            } else {
                setIsComplete(true);
            }
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            const prevResponse = responses[currentQuestionIndex - 1];
            if (prevResponse) {
                setCurrentAnswer(prevResponse.answer as string);
                setResponses(prev => prev.slice(0, prev.length - 1));
            }
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmitReview = () => {
        // TODO: Update the request status to completed
        // This would normally update your state management or call an API

        // Show success message (you might want to use a toast notification instead)
        alert(`Review for ${request.requesterName} submitted!`);

        // Navigate back to review requests page
        navigate('/performance/review-requests');
    };

    const handleBack = () => {
        navigate('/performance/review-requests');
    };

    return (
        <>
            <div className="max-w-6xl mx-auto">
                <BackButton onBack={handleBack} text="Back to Requests" />
                <PageHeader title={`Reviewing ${request.requesterName}`} />

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    {/* Requester Info */}
                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-semibold">
                            {request.requesterAvatar}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">{request.requesterName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{request.requesterRole}</p>
                            {request.message && (
                                <p className="text-sm text-gray-700 dark:text-gray-300 italic mt-1">"{request.message}"</p>
                            )}
                        </div>
                    </div>

                    {!isComplete ? (
                        <ReviewForm
                            currentQuestionIndex={currentQuestionIndex}
                            totalQuestions={peerQuestions.length}
                            question={currentQuestion}
                            currentAnswer={currentAnswer}
                            onAnswerChange={setCurrentAnswer}
                            onNext={handleNext}
                            onPrev={handlePrev}
                            progress={progress}
                        />
                    ) : (
                        <ReviewComplete
                            title="Review Complete!"
                            subtitle={`Your review for ${request.requesterName} is ready to be submitted.`}
                            onSubmit={handleSubmitReview}
                        />
                    )}
                </div>
            </div>
        </>
    );
};

export default ConductReviewPage;