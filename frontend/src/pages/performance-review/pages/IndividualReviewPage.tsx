/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
    MessageSquare, CheckCircle, AlertTriangle,
    Star, TrendingUp, User, Target, Award,
    Plus, ThumbsUp, MoreHorizontal
} from 'lucide-react';

import type { CompletedReview, ReviewResponse, AdminNote, FeedbackSuggestion } from '../types/adminTypes';
import type { TeamMember } from '../types/types';
import { BackButton } from '../Components/SharedComponents';

interface IndividualReviewPageProps {
    review: CompletedReview;
    allReviews: CompletedReview[];
    teamMembers: TeamMember[];
    currentUser: TeamMember;
    onBack: () => void;
    onUpdateStatus: (reviewId: string, status: CompletedReview['status']) => void;
    onAddNote: (reviewId: string, note: Omit<AdminNote, 'id' | 'createdAt'>) => void;
    onUpdateReview: (review: CompletedReview) => void;
}

const IndividualReviewPage: React.FC<IndividualReviewPageProps> = ({
    review,
    allReviews,
    currentUser,
    onBack,
    onUpdateStatus,
    onAddNote,
}) => {
    const [activeTab, setActiveTab] = useState<'responses' | 'discussion' | 'suggestions' | 'history'>('responses');
    const [newNote, setNewNote] = useState('');
    const [noteType, setNoteType] = useState<AdminNote['type']>('discussion');
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Get related reviews for this employee
    const relatedReviews = useMemo(() => {
        return allReviews.filter(r =>
            r.revieweeId === review.revieweeId && r.id !== review.id
        );
    }, [allReviews, review]);

    // Generate AI suggestions (mock implementation)
    const suggestions: FeedbackSuggestion[] = useMemo(() => [
        {
            id: '1',
            reviewId: review.id,
            type: 'strength',
            category: 'Technical Skills',
            title: 'Strong Technical Leadership',
            description: 'Based on multiple peer reviews, consider highlighting their mentoring abilities in technical architecture decisions.',
            priority: 'high',
            aiGenerated: true,
            approved: false
        },
        {
            id: '2',
            reviewId: review.id,
            type: 'development',
            category: 'Communication',
            title: 'Cross-team Collaboration',
            description: 'Suggest focusing on improving communication with non-technical stakeholders.',
            priority: 'medium',
            aiGenerated: true,
            approved: false
        }
    ], [review.id]);

    const handleAddNote = () => {
        if (newNote.trim()) {
            onAddNote(review.id, {
                authorId: currentUser.id,
                authorName: currentUser.name,
                content: newNote,
                type: noteType
            });
            setNewNote('');
            setShowNoteForm(false);
        }
    };

    const handleStatusChange = (newStatus: CompletedReview['status']) => {
        onUpdateStatus(review.id, newStatus);
    };

    const categorizedResponses = useMemo(() => {
        const categories = review.responses.reduce((acc, response) => {
            if (!acc[response.category]) {
                acc[response.category] = [];
            }
            acc[response.category].push(response);
            return acc;
        }, {} as Record<string, ReviewResponse[]>);

        return categories;
    }, [review.responses]);

    return (
        <>
            <div className="mx-auto">
                <BackButton onBack={onBack} text="Back to Admin Dashboard" />

                {/* Header */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                {review.revieweeAvatar}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    {review.revieweeName}
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">{review.revieweeRole}</p>
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <User className="w-4 h-4" />
                                        {review.reviewType === 'self' ? 'Self Review' : `Peer Review by ${review.reviewerName}`}
                                    </span>
                                    <span>
                                        Completed: {new Date(review.completedDate).toLocaleDateString()}
                                    </span>
                                    <span>
                                        {review.responses.length} responses
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ReviewStatusBadge status={review.status} />
                            <ReviewPriorityBadge priority={review.priority} />
                            <StatusDropdown
                                currentStatus={review.status}
                                onStatusChange={handleStatusChange}
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    {review.tags.length > 0 && (
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Tags:</span>
                            {review.tags.map((tag, index) => (
                                <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-sm rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <nav className="flex space-x-8 px-6">
                            <TabButton
                                active={activeTab === 'responses'}
                                onClick={() => setActiveTab('responses')}
                                icon={<MessageSquare className="w-4 h-4" />}
                            >
                                Review Responses
                            </TabButton>
                            <TabButton
                                active={activeTab === 'discussion'}
                                onClick={() => setActiveTab('discussion')}
                                icon={<MessageSquare className="w-4 h-4" />}
                                badge={review.notes.length}
                            >
                                Discussion
                            </TabButton>
                            <TabButton
                                active={activeTab === 'history'}
                                onClick={() => setActiveTab('history')}
                                icon={<Award className="w-4 h-4" />}
                                badge={relatedReviews.length}
                            >
                                Review History
                            </TabButton>
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'responses' && (
                            <ResponsesTab
                                responses={review.responses}
                                categorizedResponses={categorizedResponses}
                                scores={review.scores}
                            />
                        )}

                        {activeTab === 'discussion' && (
                            <DiscussionTab
                                notes={review.notes}
                                currentUser={currentUser}
                                showNoteForm={showNoteForm}
                                newNote={newNote}
                                noteType={noteType}
                                onShowNoteForm={setShowNoteForm}
                                onNewNoteChange={setNewNote}
                                onNoteTypeChange={setNoteType}
                                onAddNote={handleAddNote}
                            />
                        )}

                        {/* {activeTab === 'suggestions' && (
                            <SuggestionsTab suggestions={suggestions} />
                        )} */}

                        {activeTab === 'history' && (
                            <HistoryTab reviews={relatedReviews} />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// Tab Components
const TabButton = ({ active, onClick, icon, children, badge }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
    badge?: number;
}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 py-4 border-b-2 font-medium text-sm transition-colors ${active
            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
    >
        {icon}
        {children}
        {badge !== undefined && badge > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                {badge}
            </span>
        )}
    </button>
);

const ResponsesTab = ({ categorizedResponses, scores }: {
    responses: ReviewResponse[];
    categorizedResponses: Record<string, ReviewResponse[]>;
    scores?: any;
}) => (
    <div className="space-y-6">
        {/* Scores Overview */}
        {scores && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {Object.entries(scores).map(([key, value]) => (
                        <div key={key} className="text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {value as number}/5
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Categorized Responses */}
        {Object.entries(categorizedResponses).map(([category, categoryResponses]) => (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{category}</h3>
                <div className="space-y-4">
                    {categoryResponses.map((response, index) => (
                        <ResponseCard key={index} response={response} />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

const ResponseCard = ({ response }: { response: ReviewResponse }) => {
    const getHighlightColor = (type?: string) => {
        const colors = {
            'strength': 'border-l-green-500 bg-green-50 dark:bg-green-900/20',
            'improvement': 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
            'concern': 'border-l-red-500 bg-red-50 dark:bg-red-900/20',
            'neutral': 'border-l-gray-500 bg-gray-50 dark:bg-gray-700',
        };
        return colors[type as keyof typeof colors] || colors.neutral;
    };

    return (
        <div className={`border-l-4 p-4 rounded-r-lg ${getHighlightColor(response.highlightType)}`}>
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white">{response.question}</h4>
                {response.score && (
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {response.score}/5
                        </span>
                    </div>
                )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response.answer}</p>
        </div>
    );
};

const DiscussionTab = ({ notes, showNoteForm, newNote, noteType, onShowNoteForm, onNewNoteChange, onNoteTypeChange, onAddNote }: {
    notes: AdminNote[];
    currentUser: TeamMember;
    showNoteForm: boolean;
    newNote: string;
    noteType: AdminNote['type'];
    onShowNoteForm: (show: boolean) => void;
    onNewNoteChange: (note: string) => void;
    onNoteTypeChange: (type: AdminNote['type']) => void;
    onAddNote: () => void;
}) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Discussion & Notes</h3>
            <button
                onClick={() => onShowNoteForm(!showNoteForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Note
            </button>
        </div>

        {showNoteForm && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="mb-4">
                    <select
                        value={noteType}
                        onChange={(e) => onNoteTypeChange(e.target.value as AdminNote['type'])}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="discussion">Discussion</option>
                        <option value="action-item">Action Item</option>
                        <option value="concern">Concern</option>
                        <option value="highlight">Highlight</option>
                    </select>
                </div>
                <textarea
                    value={newNote}
                    onChange={(e) => onNewNoteChange(e.target.value)}
                    rows={4}
                    placeholder="Add your note or comment..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={() => onShowNoteForm(false)}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAddNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Add Note
                    </button>
                </div>
            </div>
        )}

        <div className="space-y-4">
            {notes.map((note) => (
                <NoteCard key={note.id} note={note} />
            ))}
            {notes.length === 0 && (
                <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No discussion notes yet</p>
                </div>
            )}
        </div>
    </div>
);

const NoteCard = ({ note }: { note: AdminNote }) => {
    const getNoteIcon = (type: AdminNote['type']) => {
        const icons = {
            'discussion': <MessageSquare className="w-4 h-4" />,
            'action-item': <Target className="w-4 h-4" />,
            'concern': <AlertTriangle className="w-4 h-4" />,
            'highlight': <Star className="w-4 h-4" />,
        };
        return icons[type];
    };

    const getNoteColor = (type: AdminNote['type']) => {
        const colors = {
            'discussion': 'text-blue-600 dark:text-blue-400',
            'action-item': 'text-orange-600 dark:text-orange-400',
            'concern': 'text-red-600 dark:text-red-400',
            'highlight': 'text-yellow-600 dark:text-yellow-400',
        };
        return colors[type];
    };

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`${getNoteColor(note.type)}`}>
                        {getNoteIcon(note.type)}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{note.authorName}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getNoteColor(note.type)} bg-current bg-opacity-10`}>
                        {note.type.replace('-', ' ')}
                    </span>
                </div>
                {note.resolved && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                )}
            </div>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
        </div>
    );
};

// const SuggestionsTab = ({ suggestions }: { suggestions: FeedbackSuggestion[] }) => (
//     <div className="space-y-6">
//         <div className="flex justify-between items-center">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AI-Generated Suggestions</h3>
//             <span className="text-sm text-gray-500 dark:text-gray-400">
//                 {suggestions.length} suggestions available
//             </span>
//         </div>

//         <div className="space-y-4">
//             {suggestions.map((suggestion) => (
//                 <SuggestionCard key={suggestion.id} suggestion={suggestion} />
//             ))}
//         </div>
//     </div>
// );

// const SuggestionCard = ({ suggestion }: { suggestion: FeedbackSuggestion }) => {
//     const getTypeIcon = (type: string) => {
//         const icons = {
//             'strength': <ThumbsUp className="w-4 h-4" />,
//             'development': <TrendingUp className="w-4 h-4" />,
//             'goal': <Target className="w-4 h-4" />,
//             'recognition': <Award className="w-4 h-4" />,
//         };
//         return icons[type as keyof typeof icons];
//     };

//     const getTypeColor = (type: string) => {
//         const colors = {
//             'strength': 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20',
//             'development': 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20',
//             'goal': 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20',
//             'recognition': 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20',
//         };
//         return colors[type as keyof typeof colors];
//     };

//     return (
//         <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <div className="flex items-start justify-between mb-3">
//                 <div className="flex items-center gap-3">
//                     <div className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}>
//                         {getTypeIcon(suggestion.type)}
//                     </div>
//                     <div>
//                         <h4 className="font-medium text-gray-900 dark:text-white">{suggestion.title}</h4>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">{suggestion.category}</p>
//                     </div>
//                 </div>
//                 <div className="flex items-center gap-2">
//                     {suggestion.aiGenerated && (
//                         <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400 text-xs rounded-full">
//                             AI Generated
//                         </span>
//                     )}
//                     <span className={`px-2 py-1 text-xs rounded-full ${suggestion.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
//                         suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
//                             'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
//                         }`}>
//                         {suggestion.priority} priority
//                     </span>
//                 </div>
//             </div>
//             <p className="text-gray-700 dark:text-gray-300 mb-3">{suggestion.description}</p>
//             <div className="flex justify-end gap-2">
//                 <button className="px-3 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors text-sm">
//                     Reject
//                 </button>
//                 <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
//                     Approve
//                 </button>
//             </div>
//         </div>
//     );
// };

const HistoryTab = ({ reviews }: { reviews: CompletedReview[] }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Review History</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
                {reviews.length} previous reviews
            </span>
        </div>

        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {review.reviewType} Review
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(review.completedDate).toLocaleDateString()}
                            </span>
                            {review.reviewerName && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    by {review.reviewerName}
                                </span>
                            )}
                        </div>
                        <ReviewStatusBadge status={review.status} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {review.responses.length} responses • {review.tags.length} tags
                    </p>
                </div>
            ))}
            {reviews.length === 0 && (
                <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">No previous reviews found</p>
                </div>
            )}
        </div>
    </div>
);

// Utility Components
const ReviewStatusBadge = ({ status }: { status: CompletedReview['status'] }) => {
    const getStatusColor = (status: string) => {
        const colors = {
            'pending-review': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'in-discussion': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'needs-action': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
        return colors[status as keyof typeof colors] || colors['pending-review'];
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status.replace('-', ' ')}
        </span>
    );
};

const ReviewPriorityBadge = ({ priority }: { priority: CompletedReview['priority'] }) => {
    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
            'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'high': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
            {priority} priority
        </span>
    );
};

const StatusDropdown = ({ currentStatus, onStatusChange }: {
    currentStatus: CompletedReview['status'];
    onStatusChange: (status: CompletedReview['status']) => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const statuses: { value: CompletedReview['status']; label: string }[] = [
        { value: 'pending-review', label: 'Pending Review' },
        { value: 'in-discussion', label: 'In Discussion' },
        { value: 'completed', label: 'Completed' },
        { value: 'needs-action', label: 'Needs Action' },
    ];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                Change Status
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    {statuses.map((status) => (
                        <button
                            key={status.value}
                            onClick={() => {
                                onStatusChange(status.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${currentStatus === status.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                                }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default IndividualReviewPage;