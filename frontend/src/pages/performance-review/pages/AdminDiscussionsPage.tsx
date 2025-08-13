/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import {
    MessageSquare, Plus, Search, Clock, CheckCircle,
    AlertTriangle, Users, Send, MoreVertical, Archive,
    Reply, Flag, Trash2
} from 'lucide-react';
import type { CompletedReview, DiscussionMessage, DiscussionThread } from '../types/adminTypes';
import type { TeamMember } from '../types/types';
import { BackButton, PageHeader } from '../Components/SharedComponents';


interface AdminDiscussionsPageProps {
    discussions: DiscussionThread[];
    completedReviews: CompletedReview[];
    teamMembers: TeamMember[];
    currentUser: TeamMember;
    onBack: () => void;
    onCreateDiscussion: (reviewId: string, title: string, message: string) => void;
    onAddMessage: (discussionId: string, message: Omit<DiscussionMessage, 'id' | 'timestamp'>) => void;
    onUpdateDiscussionStatus: (discussionId: string, status: DiscussionThread['status']) => void;
    onDeleteDiscussion: (discussionId: string) => void;
}

const AdminDiscussionsPage: React.FC<AdminDiscussionsPageProps> = ({
    discussions,
    completedReviews,
    currentUser,
    onBack,
    onCreateDiscussion,
    onAddMessage,
    onUpdateDiscussionStatus,
    onDeleteDiscussion
}) => {
    const [selectedDiscussion, setSelectedDiscussion] = useState<DiscussionThread | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | DiscussionThread['status']>('all');
    const [priorityFilter, setPriorityFilter] = useState<'all' | DiscussionThread['priority']>('all');
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState<DiscussionMessage['type']>('comment');

    // Filter discussions
    const filteredDiscussions = useMemo(() => {
        return discussions.filter(discussion => {
            if (statusFilter !== 'all' && discussion.status !== statusFilter) return false;
            if (priorityFilter !== 'all' && discussion.priority !== priorityFilter) return false;

            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!discussion.title.toLowerCase().includes(query)) return false;
            }

            return true;
        });
    }, [discussions, statusFilter, priorityFilter, searchQuery]);

    // Discussion statistics
    const discussionStats = useMemo(() => {
        const total = discussions.length;
        const active = discussions.filter(d => d.status === 'active').length;
        const resolved = discussions.filter(d => d.status === 'resolved').length;
        const highPriority = discussions.filter(d => d.priority === 'high').length;

        return {
            total,
            active,
            resolved,
            highPriority
        };
    }, [discussions]);

    const handleAddMessage = () => {
        if (newMessage.trim() && selectedDiscussion) {
            onAddMessage(selectedDiscussion.id, {
                authorId: currentUser.id,
                authorName: currentUser.name,
                content: newMessage,
                type: messageType
            });
            setNewMessage('');
        }
    };

    return (
        <div className="mx-auto">
            <BackButton onBack={onBack} text="Back to Admin Dashboard" />

            <PageHeader title="Discussion Management">
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    New Discussion
                </button>
            </PageHeader>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <DiscussionStatCard
                    title="Total Discussions"
                    value={discussionStats.total}
                    icon={<MessageSquare className="w-6 h-6" />}
                    color="blue"
                />
                <DiscussionStatCard
                    title="Active"
                    value={discussionStats.active}
                    icon={<Clock className="w-6 h-6" />}
                    color="orange"
                />
                <DiscussionStatCard
                    title="Resolved"
                    value={discussionStats.resolved}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="green"
                />
                <DiscussionStatCard
                    title="High Priority"
                    value={discussionStats.highPriority}
                    icon={<AlertTriangle className="w-6 h-6" />}
                    color="red"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Discussions List */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Discussions ({filteredDiscussions.length})
                            </h3>

                            {/* Search and Filters */}
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search discussions..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as any)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="archived">Archived</option>
                                    </select>

                                    <select
                                        value={priorityFilter}
                                        onChange={(e) => setPriorityFilter(e.target.value as any)}
                                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="all">All Priority</option>
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="max-h-96 overflow-y-auto">
                            {filteredDiscussions.map((discussion) => (
                                <DiscussionItem
                                    key={discussion.id}
                                    discussion={discussion}
                                    isSelected={selectedDiscussion?.id === discussion.id}
                                    onClick={() => setSelectedDiscussion(discussion)}
                                    completedReviews={completedReviews}
                                />
                            ))}

                            {filteredDiscussions.length === 0 && (
                                <div className="p-8 text-center">
                                    <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No discussions found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Discussion Detail */}
                <div className="lg:col-span-2">
                    {selectedDiscussion ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            {/* Discussion Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                            {selectedDiscussion.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                            <span>
                                                Created: {new Date(selectedDiscussion.createdAt).toLocaleDateString()}
                                            </span>
                                            <span>
                                                {selectedDiscussion.messages.length} messages
                                            </span>
                                            <span>
                                                {selectedDiscussion.participants.length} participants
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <DiscussionStatusBadge status={selectedDiscussion.status} />
                                        <DiscussionPriorityBadge priority={selectedDiscussion.priority} />
                                        <DiscussionActionsDropdown
                                            discussion={selectedDiscussion}
                                            onUpdateStatus={onUpdateDiscussionStatus}
                                            onDelete={() => {
                                                onDeleteDiscussion(selectedDiscussion.id);
                                                setSelectedDiscussion(null);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="max-h-96 overflow-y-auto p-6">
                                <div className="space-y-4">
                                    {selectedDiscussion.messages.map((message) => (
                                        <MessageBubble key={message.id} message={message} />
                                    ))}
                                </div>
                            </div>

                            {/* Reply Form */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex gap-4">
                                    <select
                                        value={messageType}
                                        onChange={(e) => setMessageType(e.target.value as DiscussionMessage['type'])}
                                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="comment">Comment</option>
                                        <option value="suggestion">Suggestion</option>
                                        <option value="action-item">Action Item</option>
                                        <option value="resolution">Resolution</option>
                                    </select>

                                    <div className="flex-1 flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Add a message to this discussion..."
                                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddMessage()}
                                        />
                                        <button
                                            onClick={handleAddMessage}
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        >
                                            <Send className="w-4 h-4" />
                                            Send
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-center h-96">
                            <div className="text-center">
                                <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    Select a Discussion
                                </h3>
                                <p className="text-gray-400 dark:text-gray-500">
                                    Choose a discussion from the list to view messages and participate
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Discussion Modal */}
            {showCreateForm && (
                <CreateDiscussionModal
                    completedReviews={completedReviews}
                    onClose={() => setShowCreateForm(false)}
                    onCreate={onCreateDiscussion}
                />
            )}
        </div>
    );
};

const DiscussionStatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: 'blue' | 'orange' | 'green' | 'red';
}) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400',
        orange: 'bg-orange-100 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400',
        green: 'bg-green-100 text-green-500 dark:bg-green-900/20 dark:text-green-400',
        red: 'bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400',
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center gap-4">
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

const DiscussionItem = ({ discussion, isSelected, onClick, completedReviews }: {
    discussion: DiscussionThread;
    isSelected: boolean;
    onClick: () => void;
    completedReviews: CompletedReview[];
}) => {
    const relatedReview = completedReviews.find(r => r.id === discussion.reviewId);

    return (
        <div
            onClick={onClick}
            className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">
                    {discussion.title}
                </h4>
                <div className="flex items-center gap-1 ml-2">
                    <DiscussionStatusBadge status={discussion.status} />
                    <DiscussionPriorityIndicator priority={discussion.priority} />
                </div>
            </div>

            {relatedReview && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    Related to: {relatedReview.revieweeName} ({relatedReview.reviewType} review)
                </p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {discussion.messages.length}
                </span>
                <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {discussion.participants.length}
                </span>
                <span>
                    {new Date(discussion.updatedAt).toLocaleDateString()}
                </span>
            </div>
        </div>
    );
};

const MessageBubble = ({ message }: { message: DiscussionMessage }) => {
    const getMessageIcon = (type: DiscussionMessage['type']) => {
        const icons = {
            'comment': <MessageSquare className="w-4 h-4" />,
            'suggestion': <Reply className="w-4 h-4" />,
            'action-item': <Flag className="w-4 h-4" />,
            'resolution': <CheckCircle className="w-4 h-4" />,
        };
        return icons[type];
    };

    const getMessageColor = (type: DiscussionMessage['type']) => {
        const colors = {
            'comment': 'text-blue-600 dark:text-blue-400',
            'suggestion': 'text-purple-600 dark:text-purple-400',
            'action-item': 'text-orange-600 dark:text-orange-400',
            'resolution': 'text-green-600 dark:text-green-400',
        };
        return colors[type];
    };

    return (
        <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                {message.authorName.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                        {message.authorName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(message.timestamp).toLocaleString()}
                    </span>
                    <div className={`flex items-center gap-1 ${getMessageColor(message.type)}`}>
                        {getMessageIcon(message.type)}
                        <span className="text-xs capitalize">{message.type.replace('-', ' ')}</span>
                    </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                    {message.content}
                </p>
            </div>
        </div>
    );
};

const DiscussionStatusBadge = ({ status }: { status: DiscussionThread['status'] }) => {
    const getStatusColor = (status: string) => {
        const colors = {
            'active': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            'resolved': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            'archived': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
        };
        return colors[status as keyof typeof colors] || colors.active;
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status}
        </span>
    );
};

const DiscussionPriorityBadge = ({ priority }: { priority: DiscussionThread['priority'] }) => {
    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
            'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'high': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
            {priority}
        </span>
    );
};

const DiscussionPriorityIndicator = ({ priority }: { priority: DiscussionThread['priority'] }) => {
    const getPriorityColor = (priority: string) => {
        const colors = {
            'low': 'bg-gray-400',
            'medium': 'bg-yellow-400',
            'high': 'bg-red-400',
        };
        return colors[priority as keyof typeof colors] || colors.low;
    };

    return <div className={`w-2 h-2 rounded-full ${getPriorityColor(priority)}`} />;
};

const DiscussionActionsDropdown = ({ discussion, onUpdateStatus, onDelete }: {
    discussion: DiscussionThread;
    onUpdateStatus: (discussionId: string, status: DiscussionThread['status']) => void;
    onDelete: () => void;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
                <MoreVertical className="w-4 h-4" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <button
                        onClick={() => {
                            onUpdateStatus(discussion.id, 'resolved');
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <CheckCircle className="w-4 h-4" />
                        Mark as Resolved
                    </button>
                    <button
                        onClick={() => {
                            onUpdateStatus(discussion.id, 'archived');
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                        <Archive className="w-4 h-4" />
                        Archive
                    </button>
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                    <button
                        onClick={() => {
                            onDelete();
                            setIsOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete Discussion
                    </button>
                </div>
            )}
        </div>
    );
};

const CreateDiscussionModal = ({ completedReviews, onClose, onCreate }: {
    completedReviews: CompletedReview[];
    onClose: () => void;
    onCreate: (reviewId: string, title: string, message: string) => void;
}) => {
    const [selectedReviewId, setSelectedReviewId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedReviewId && title.trim() && message.trim()) {
            onCreate(selectedReviewId, title, message);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Create New Discussion
                    </h3>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Related Review
                        </label>
                        <select
                            value={selectedReviewId}
                            onChange={(e) => setSelectedReviewId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a review...</option>
                            {completedReviews.map(review => (
                                <option key={review.id} value={review.id}>
                                    {review.revieweeName} - {review.reviewType} Review
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Discussion Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter discussion title..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Initial Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Start the discussion..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Discussion
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminDiscussionsPage;