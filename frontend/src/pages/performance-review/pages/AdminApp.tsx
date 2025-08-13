/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardPage from './AdminDashboardPage';
import IndividualReviewPage from './IndividualReviewPage';
import TeamSummaryPage from './TeamSummaryPage';
import AdminDiscussionsPage from './AdminDiscussionsPage';
import type { CompletedReview, AdminNote, DiscussionThread, DiscussionMessage, AdminViewMode } from '../types/adminTypes';
import type { TeamMember } from '../types/types';
import { ArrowLeft, FileText } from 'lucide-react';

// Sample data for demo - in real app this would come from API
const generateMockReviews = (): CompletedReview[] => [
    {
        id: 'review-1',
        reviewType: 'self',
        revieweeId: 1,
        revieweeName: 'Glen Mogane',
        revieweeRole: 'AWS Solutions Architect',
        revieweeAvatar: 'GM',
        completedDate: '2025-08-10',
        status: 'pending-review',
        priority: 'high',
        tags: ['technical-excellence', 'leadership', 'cloud-architecture'],
        notes: [],
        responses: [
            {
                questionId: 'self-1',
                question: 'What was your most impactful technical contribution this period?',
                category: 'Technical Skills',
                answer: 'Led the migration of our legacy monolith to a microservices architecture on AWS, reducing deployment time by 70% and improving system reliability. Implemented infrastructure as code using Terraform and established CI/CD pipelines that are now used across all teams.',
                highlightType: 'strength'
            },
            {
                questionId: 'self-2',
                question: 'Describe a project where you led the implementation or guided others.',
                category: 'Leadership',
                answer: 'Guided a team of 5 engineers through the cloud migration project. Established technical standards, mentored junior developers on AWS best practices, and coordinated with stakeholders to ensure minimal business disruption during the transition.',
                highlightType: 'strength'
            },
            {
                questionId: 'self-3',
                question: 'How would you rate your proficiency in your core technical areas?',
                category: 'Expertise',
                answer: 'Strong proficiency in AWS services (EC2, RDS, Lambda, CloudFormation), containerization with Docker and Kubernetes, and infrastructure automation. Currently expanding knowledge in serverless architectures and exploring multi-cloud strategies.',
                highlightType: 'neutral'
            }
        ],
        scores: {
            overall: 4.2,
            technical: 4.5,
            collaboration: 4.0,
            leadership: 4.3,
            communication: 3.8,
            growth: 4.1
        }
    },
    {
        id: 'review-2',
        reviewType: 'peer',
        revieweeId: 1,
        revieweeName: 'Glen Mogane',
        revieweeRole: 'AWS Solutions Architect',
        revieweeAvatar: 'GM',
        reviewerId: 2,
        reviewerName: 'Sarah Johnson',
        reviewerRole: 'Cloud Architect',
        reviewerAvatar: 'SJ',
        completedDate: '2025-08-12',
        status: 'in-discussion',
        priority: 'medium',
        tags: ['collaboration', 'mentoring', 'technical-depth'],
        notes: [
            {
                id: 'note-1',
                authorId: 2,
                authorName: 'Sarah Johnson',
                content: 'Glen consistently demonstrates strong technical leadership. His mentoring approach has significantly improved team productivity.',
                createdAt: '2025-08-12T10:30:00Z',
                type: 'highlight'
            }
        ],
        responses: [
            {
                questionId: 'peer-1',
                question: 'Describe a specific instance where Glen collaborated effectively with the team.',
                category: 'Team Collaboration',
                answer: 'Glen facilitated our weekly architecture reviews and always made time to help team members with complex AWS configurations. His door is always open for questions and he explains concepts clearly without making anyone feel inadequate.',
                highlightType: 'strength'
            },
            {
                questionId: 'peer-2',
                question: 'How did Glen\'s work impact the team\'s technical goals this quarter?',
                category: 'Technical Impact',
                answer: 'His infrastructure improvements reduced our deployment failures by 80% and significantly improved our development velocity. The CI/CD pipelines he built are now the gold standard for other teams.',
                highlightType: 'strength'
            },
            {
                questionId: 'peer-3',
                question: 'What areas could Glen focus on for professional development?',
                category: 'Areas for Growth',
                answer: 'While Glen is excellent technically, he could work on delegating more to help team members grow. Sometimes he takes on too much himself instead of using it as a teaching opportunity.',
                highlightType: 'improvement'
            }
        ]
    },
    {
        id: 'review-3',
        reviewType: 'self',
        revieweeId: 2,
        revieweeName: 'Sarah Johnson',
        revieweeRole: 'Cloud Architect',
        revieweeAvatar: 'SJ',
        completedDate: '2025-08-08',
        status: 'completed',
        priority: 'low',
        tags: ['cloud-strategy', 'architecture', 'innovation'],
        notes: [],
        responses: [
            {
                questionId: 'self-1',
                question: 'What was your most impactful technical contribution this period?',
                category: 'Technical Skills',
                answer: 'Designed and implemented our multi-region disaster recovery strategy, ensuring 99.9% availability SLA. Created comprehensive documentation and runbooks that enabled seamless failover procedures.',
                highlightType: 'strength'
            }
        ]
    }
];

const generateMockDiscussions = (): DiscussionThread[] => [
    {
        id: 'disc-1',
        reviewId: 'review-1',
        title: 'Discussion on Glen\'s Leadership Development',
        participants: [1, 2, 3],
        status: 'active',
        priority: 'high',
        createdAt: '2025-08-12T09:00:00Z',
        updatedAt: '2025-08-13T14:30:00Z',
        messages: [
            {
                id: 'msg-1',
                authorId: 2,
                authorName: 'Sarah Johnson',
                content: 'I think Glen shows great potential for senior leadership roles. His technical mentoring has been exceptional, but we should discuss opportunities for him to lead larger strategic initiatives.',
                timestamp: '2025-08-12T09:00:00Z',
                type: 'comment'
            },
            {
                id: 'msg-2',
                authorId: 3,
                authorName: 'Mike Chen',
                content: 'Agreed. Glen has helped me tremendously with cloud architecture. I think he could benefit from some cross-functional project experience to develop his business acumen.',
                timestamp: '2025-08-12T11:15:00Z',
                type: 'suggestion'
            },
            {
                id: 'msg-3',
                authorId: 1,
                authorName: 'Admin User',
                content: 'Let\'s explore opportunities for Glen to lead the upcoming digital transformation project. This would give him exposure to business stakeholders and strategic planning.',
                timestamp: '2025-08-13T14:30:00Z',
                type: 'action-item'
            }
        ]
    },
    {
        id: 'disc-2',
        reviewId: 'review-2',
        title: 'Peer Review Feedback Discussion',
        participants: [1, 2],
        status: 'resolved',
        priority: 'medium',
        createdAt: '2025-08-10T16:00:00Z',
        updatedAt: '2025-08-11T10:00:00Z',
        messages: [
            {
                id: 'msg-4',
                authorId: 2,
                authorName: 'Sarah Johnson',
                content: 'The feedback about delegation is important. Glen, you might want to consider creating more structured mentoring sessions where team members can take ownership of solutions.',
                timestamp: '2025-08-10T16:00:00Z',
                type: 'suggestion'
            },
            {
                id: 'msg-5',
                authorId: 1,
                authorName: 'Admin User',
                content: 'Great point. We can set up a mentoring program where Glen can guide others through complex problems while ensuring they drive the solutions.',
                timestamp: '2025-08-11T10:00:00Z',
                type: 'resolution'
            }
        ]
    }
];

const teamMembers: TeamMember[] = [
    { id: 1, name: "Glen Mogane", role: "AWS Solutions Architect", avatar: "GM", department: "Engineering" },
    { id: 2, name: "Sarah Johnson", role: "Cloud Architect", avatar: "SJ", department: "Engineering" },
    { id: 3, name: "Mike Chen", role: "Platform Engineer", avatar: "MC", department: "Engineering" },
    { id: 4, name: "Emily Davis", role: "Site Reliability Engineer", avatar: "ED", department: "Engineering" },
    { id: 5, name: "Alex Rodriguez", role: "Infrastructure Engineer", avatar: "AR", department: "Engineering" },
    { id: 6, name: "Lisa Thompson", role: "DevOps Lead", avatar: "LT", department: "Engineering" },
    { id: 7, name: "John Smith", role: "Senior DevOps Engineer", avatar: "JS", department: "Engineering" },
    { id: 8, name: "Rachel Park", role: "Security Engineer", avatar: "RP", department: "Engineering" },
];

const AdminApp: React.FC = () => {
    const navigate = useNavigate();

    const [currentUser] = useState<TeamMember>({
        id: 1,
        name: "Glen Mogane",
        role: "AWS Solutions Architect",
        avatar: "GM",
        department: "Engineering"
    });

    const [currentView, setCurrentView] = useState<AdminViewMode>('overview');
    const [selectedReview, setSelectedReview] = useState<CompletedReview | null>(null);

    // Mock data - in real app this would come from API/state management
    const [completedReviews, setCompletedReviews] = useState<CompletedReview[]>(generateMockReviews());
    const [discussions, setDiscussions] = useState<DiscussionThread[]>(generateMockDiscussions());

    const handleBack = () => {
        // Navigate back to the main performance dashboard
        navigate('/performance/admin');
    };

    const handleNavigate = (view: AdminViewMode, data?: any) => {
        setCurrentView(view);
        if (data?.reviewId) {
            const review = completedReviews.find(r => r.id === data.reviewId);
            if (review) setSelectedReview(review);
        }
    };

    const handleViewReview = (review: CompletedReview) => {
        setSelectedReview(review);
        setCurrentView('individual-review');
    };

    const handleViewMember = (member: TeamMember) => {
        // Find the member's first review if available and show it
        const memberReview = completedReviews.find(r => r.revieweeId === member.id);
        if (memberReview) {
            setSelectedReview(memberReview);
            setCurrentView('individual-review');
        }
    };

    const handleUpdateReviewStatus = (reviewId: string, status: CompletedReview['status']) => {
        setCompletedReviews(prev =>
            prev.map(review =>
                review.id === reviewId ? { ...review, status } : review
            )
        );
    };

    const handleAddNote = (reviewId: string, noteData: Omit<AdminNote, 'id' | 'createdAt'>) => {
        const newNote: AdminNote = {
            ...noteData,
            id: `note-${Date.now()}`,
            createdAt: new Date().toISOString()
        };

        setCompletedReviews(prev =>
            prev.map(review =>
                review.id === reviewId
                    ? { ...review, notes: [...review.notes, newNote] }
                    : review
            )
        );
    };

    const handleUpdateReview = (updatedReview: CompletedReview) => {
        setCompletedReviews(prev =>
            prev.map(review =>
                review.id === updatedReview.id ? updatedReview : review
            )
        );
        setSelectedReview(updatedReview);
    };

    const handleCreateDiscussion = (reviewId: string, title: string, message: string) => {
        const newDiscussion: DiscussionThread = {
            id: `disc-${Date.now()}`,
            reviewId,
            title,
            participants: [currentUser.id],
            status: 'active',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: `msg-${Date.now()}`,
                    authorId: currentUser.id,
                    authorName: currentUser.name,
                    content: message,
                    timestamp: new Date().toISOString(),
                    type: 'comment'
                }
            ]
        };

        setDiscussions(prev => [...prev, newDiscussion]);
    };

    const handleAddMessage = (discussionId: string, messageData: Omit<DiscussionMessage, 'id' | 'timestamp'>) => {
        const newMessage: DiscussionMessage = {
            ...messageData,
            id: `msg-${Date.now()}`,
            timestamp: new Date().toISOString()
        };

        setDiscussions(prev =>
            prev.map(discussion =>
                discussion.id === discussionId
                    ? {
                        ...discussion,
                        messages: [...discussion.messages, newMessage],
                        updatedAt: new Date().toISOString(),
                        participants: discussion.participants.includes(messageData.authorId)
                            ? discussion.participants
                            : [...discussion.participants, messageData.authorId]
                    }
                    : discussion
            )
        );
    };

    const handleUpdateDiscussionStatus = (discussionId: string, status: DiscussionThread['status']) => {
        setDiscussions(prev =>
            prev.map(discussion =>
                discussion.id === discussionId
                    ? { ...discussion, status, updatedAt: new Date().toISOString() }
                    : discussion
            )
        );
    };

    const handleDeleteDiscussion = (discussionId: string) => {
        setDiscussions(prev => prev.filter(d => d.id !== discussionId));
    };

    const renderCurrentView = () => {
        switch (currentView) {
            case 'overview':
                return (
                    <AdminDashboardPage
                        completedReviews={completedReviews}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                        onBack={handleBack}
                        onViewReview={handleViewReview}
                        onNavigate={handleNavigate}
                    />
                );

            case 'individual-review':
                return selectedReview ? (
                    <IndividualReviewPage
                        review={selectedReview}
                        allReviews={completedReviews}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                        onBack={() => setCurrentView('overview')}
                        onUpdateStatus={handleUpdateReviewStatus}
                        onAddNote={handleAddNote}
                        onUpdateReview={handleUpdateReview}
                    />
                ) : (
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center min-h-[400px]">
                        <div className="text-center space-y-6 p-8">
                            <div className="w-16 h-16 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                    No Review Selected
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                                    Select a review from the list to view detailed feedback and insights
                                </p>
                            </div>

                            <button
                                onClick={() => setCurrentView('overview')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                );

            case 'team-summary':
                return (
                    <TeamSummaryPage
                        teamMembers={teamMembers}
                        completedReviews={completedReviews}
                        currentUser={currentUser}
                        onBack={() => setCurrentView('overview')}
                        onViewMember={handleViewMember}
                        onViewReview={handleViewReview}
                    />
                );

            case 'discussions':
                return (
                    <AdminDiscussionsPage
                        discussions={discussions}
                        completedReviews={completedReviews}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                        onBack={() => setCurrentView('overview')}
                        onCreateDiscussion={handleCreateDiscussion}
                        onAddMessage={handleAddMessage}
                        onUpdateDiscussionStatus={handleUpdateDiscussionStatus}
                        onDeleteDiscussion={handleDeleteDiscussion}
                    />
                );

            case 'analytics':
                return (
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                Analytics Dashboard
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Advanced analytics and reporting features coming soon...
                            </p>
                            <button
                                onClick={() => setCurrentView('overview')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <AdminDashboardPage
                        completedReviews={completedReviews}
                        teamMembers={teamMembers}
                        currentUser={currentUser}
                        onBack={handleBack}
                        onViewReview={handleViewReview}
                        onNavigate={handleNavigate}
                    />
                );
        }
    };

    return (
        <>
            {renderCurrentView()}
        </>
    );
};

export default AdminApp;