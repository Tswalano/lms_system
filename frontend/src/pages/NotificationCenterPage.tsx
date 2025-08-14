/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNotifications, useNotificationCounts, useNotificationMutations } from "@/hooks/useNotifications";
import {
    Bell,
    Search,
    Filter,
    Archive,
    Trash2,
    Check,
    CheckCircle,
    AlertTriangle,
    Info,
    RefreshCw,
    Eye,
    EyeOff,
    Clock,
    ChevronDown,
    Inbox,
    ArchiveX,
    Loader2,
    MoreHorizontal,
    User
} from 'lucide-react';

// Type definitions matching API response
interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    category: string;
    title: string;
    message: string;
    actionUrl: string | null;
    actionText: string | null;
    imageUrl: string | null;
    priority: 'urgent' | 'high' | 'normal';
    isRead: number;
    isArchived: number;
    readAt: string | null;
    createdAt: string;
    relatedId: string | null;
    relatedType: string | null;
    createdBy: string | null;
    metadata: any;
}

interface Stats {
    total: number;
    unread: number;
    urgent: number;
    archived: number;
}

interface FilterOption {
    key: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
}

type SortOption = 'newest' | 'oldest' | 'priority' | 'starred';
type FilterType = 'all' | 'unread' | 'read' | 'starred' | 'urgent' | 'high';

const NotificationCenterPage: React.FC = () => {
    // State
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [sortBy,] = useState<SortOption>('newest');
    const [showArchived,] = useState<boolean>(false);
    const [showQuickActions, setShowQuickActions] = useState<boolean>(false);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);

    // API Hooks
    const {
        data: notificationsResponse,
        isLoading: notificationsLoading,
        error: notificationsError,
        refetch: refetchNotifications
    } = useNotifications({
        limit: 50,
        isArchived: showArchived
    });

    const {
        data: countsResponse,
        isLoading: countsLoading
    } = useNotificationCounts();

    const {
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification,
    } = useNotificationMutations();

    // Extract notifications and counts from API response
    const notifications: Notification[] = notificationsResponse?.data?.notifications || [];
    const countsData = countsResponse?.data;

    const counts = {
        total: countsData?.recentCount || 0,
        unread: countsData?.totalUnread || 0,
        urgent: parseInt(countsData?.urgentUnread?.toString() || '0'),
        archived: parseInt(countsData?.archivedCount?.toString() || '0')
    };

    // Filter and search logic
    useEffect(() => {
        if (!notifications.length) {
            setFilteredNotifications([]);
            return;
        }

        const priorityOrder: Record<string, number> = { urgent: 3, high: 2, normal: 1 };
        const filtered = notifications.filter((notification: Notification) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!notification.title.toLowerCase().includes(query) &&
                    !notification.message.toLowerCase().includes(query)) {
                    return false;
                }
            }

            switch (selectedFilter) {
                case 'unread': return notification.isRead === 0;
                case 'read': return notification.isRead === 1;
                case 'urgent': return notification.priority === 'urgent';
                case 'high': return notification.priority === 'high';
                default: return true;
            }
        });

        filtered.sort((a: Notification, b: Notification) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'priority':
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'newest':
                default:
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
        });

        setFilteredNotifications(filtered);
    }, [notifications, searchQuery, selectedFilter, sortBy]);

    const getNotificationIcon = (type: Notification['type']): JSX.Element => {
        const iconClass = "w-4 h-4";
        const iconMap: Record<Notification['type'], JSX.Element> = {
            info: <Info className={`${iconClass} text-blue-500`} />,
            warning: <AlertTriangle className={`${iconClass} text-amber-500`} />,
            error: <AlertTriangle className={`${iconClass} text-red-500`} />,
            success: <CheckCircle className={`${iconClass} text-green-500`} />
        };
        return iconMap[type] || <Bell className={`${iconClass} text-gray-500`} />;
    };

    const getPriorityColor = (priority: Notification['priority']): string => {
        const colorMap: Record<Notification['priority'], string> = {
            urgent: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800",
            high: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800",
            normal: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800"
        };
        return colorMap[priority] || colorMap.normal;
    };

    const formatTime = (dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "now";
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleSelectNotification = (id: string): void => {
        const newSelected = new Set(selectedNotifications);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedNotifications(newSelected);
    };

    const handleSelectAll = (): void => {
        if (selectedNotifications.size === filteredNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(filteredNotifications.map((n: Notification) => n.id)));
        }
    };

    const handleToggleRead = async (id: string, isRead: number): Promise<void> => {
        try {
            if (isRead === 1) {
                await markAsUnread.mutateAsync(id);
            } else {
                await markAsRead.mutateAsync(id);
            }
        } catch (error) {
            console.error('Failed to toggle notification read status:', error);
        }
    };

    const handleArchive = async (id: string): Promise<void> => {
        try {
            await archiveNotification.mutateAsync(id);
        } catch (error) {
            console.error('Failed to archive notification:', error);
        }
    };

    const handleDelete = async (id: string): Promise<void> => {
        try {
            await deleteNotification.mutateAsync(id);
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleMarkAllRead = async (): Promise<void> => {
        try {
            await markAllAsRead.mutateAsync();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const stats: Stats = {
        total: counts.total,
        unread: counts.unread,
        urgent: counts.urgent,
        archived: counts.archived
    };

    const filterOptions: FilterOption[] = [
        { key: 'all', label: 'All', icon: Inbox },
        { key: 'unread', label: 'Unread', icon: Bell },
        { key: 'read', label: 'Read', icon: CheckCircle },
        { key: 'urgent', label: 'Urgent', icon: AlertTriangle },
        { key: 'high', label: 'High', icon: Clock }
    ];

    const isLoading = notificationsLoading || countsLoading;
    const isMutating = markAsRead.isPending || markAsUnread.isPending || markAllAsRead.isPending;

    if (notificationsError) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Failed to load notifications
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {notificationsError.message || 'Something went wrong'}
                    </p>
                    <button
                        onClick={() => refetchNotifications()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Notifications
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Stay updated with your latest activities
                    </p>
                </div>

                <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: Inbox, color: 'text-gray-600' },
                    { label: 'Unread', value: stats.unread, icon: Bell, color: 'text-blue-600' },
                    { label: 'Urgent', value: stats.urgent, icon: AlertTriangle, color: 'text-red-600' },
                    { label: 'Archived', value: stats.archived, icon: ArchiveX, color: 'text-gray-500' }
                ].map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <div>
                                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {countsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : stat.value}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filter buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        <button
                            onClick={() => refetchNotifications()}
                            disabled={isLoading}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                        </button>
                    </div>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        {filterOptions.map((filter) => (
                            <button
                                key={filter.key}
                                onClick={() => setSelectedFilter(filter.key as FilterType)}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${selectedFilter === filter.key
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                            >
                                <filter.icon className="w-3 h-3" />
                                {filter.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Bulk actions */}
                {/* {selectedNotifications.size > 0 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedNotifications.size} selected
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => Array.from(selectedNotifications).forEach(id => markAsRead.mutate(id))}
                                className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                title="Mark as read"
                            >
                                <Check className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => Array.from(selectedNotifications).forEach(id => archiveNotification.mutate(id))}
                                className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                title="Archive"
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => Array.from(selectedNotifications).forEach(id => deleteNotification.mutate(id))}
                                className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )} */}
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* List Header with Select All */}
                {filteredNotifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Master Checkbox */}
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>

                                {/* Selection Info */}
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {selectedNotifications.size > 0 ? (
                                            <span className="text-blue-600 dark:text-blue-400">
                                                {selectedNotifications.size} selected
                                            </span>
                                        ) : (
                                            `${filteredNotifications.length} notifications`
                                        )}
                                    </span>

                                    {selectedNotifications.size > 0 && (
                                        <button
                                            onClick={() => setSelectedNotifications(new Set())}
                                            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 underline"
                                        >
                                            Clear selection
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2">
                                {selectedNotifications.size > 0 ? (
                                    // Bulk Actions
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => markAsRead.mutate(id))}
                                            disabled={isMutating}
                                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50"
                                            title="Mark selected as read"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => archiveNotification.mutate(id))}
                                            disabled={isMutating}
                                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                                            title="Archive selected"
                                        >
                                            <Archive className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => deleteNotification.mutate(id))}
                                            disabled={isMutating}
                                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                            title="Delete selected"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    // Global Actions
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={isMutating || filteredNotifications.every(n => n.isRead === 1)}
                                            className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isMutating ? (
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    <span>Marking...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-3 h-3" />
                                                    <span>Mark all read</span>
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => refetchNotifications()}
                                            disabled={isLoading}
                                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                            title="Refresh notifications"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Selection Summary Bar */}
                        {selectedNotifications.size > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                        <span>
                                            Actions will be applied to {selectedNotifications.size} notification{selectedNotifications.size !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleSelectAll}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                    >
                                        {selectedNotifications.size === filteredNotifications.length ? 'Deselect all' : 'Select all'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Notification Items */}
                {isLoading && filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-blue-500" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Loading notifications...</p>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No matching notifications' : 'All caught up!'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {searchQuery ? 'Try adjusting your search terms' : 'No new notifications to show'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`group relative transition-all duration-200 ${notification.isRead === 0
                                    ? 'bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20 dark:to-transparent border-l-2 border-blue-500'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                    } ${selectedNotifications.has(notification.id) ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' : ''}`}
                            >
                                <div className="p-4">
                                    <div className="flex gap-3">
                                        {/* Checkbox */}
                                        <div className="flex items-start pt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={selectedNotifications.has(notification.id)}
                                                onChange={() => handleSelectNotification(notification.id)}
                                                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 transition-colors"
                                            />
                                        </div>

                                        {/* Icon */}
                                        <div className="flex-shrink-0 pt-0.5">
                                            <div className={`p-2 rounded-lg ${notification.type === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                                                notification.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/30' :
                                                    notification.type === 'error' ? 'bg-red-100 dark:bg-red-900/30' :
                                                        'bg-green-100 dark:bg-green-900/30'
                                                }`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    {/* Title and Priority */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h4 className={`text-sm font-semibold leading-tight ${notification.isRead === 0
                                                            ? 'text-gray-900 dark:text-white'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                            }`}>
                                                            {notification.title}
                                                        </h4>

                                                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(notification.priority)}`}>
                                                            {notification.priority}
                                                        </span>

                                                        {notification.isRead === 0 && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                        )}
                                                    </div>

                                                    {/* Message */}
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                                                        {notification.message}
                                                    </p>

                                                    {/* Metadata */}
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-1 h-1 bg-gray-400 rounded-full">{" "}</div>
                                                            {notification.category.replace('_', ' ')}
                                                        </span>
                                                        {notification.createdBy && (
                                                            <span className="flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {notification.createdBy}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action Button */}
                                                    {notification.actionText && (
                                                        <div className="mt-3">
                                                            <button className="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800/50 transition-colors">
                                                                {notification.actionText}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => handleToggleRead(notification.id, notification.isRead)}
                                                        disabled={isMutating}
                                                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                                                        title={notification.isRead === 1 ? 'Mark as unread' : 'Mark as read'}
                                                    >
                                                        {isMutating ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : notification.isRead === 1 ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>

                                                    <button
                                                        onClick={() => handleArchive(notification.id)}
                                                        disabled={isMutating}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Archive"
                                                    >
                                                        <Archive className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(notification.id)}
                                                        disabled={isMutating}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenterPage;