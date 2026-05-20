/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    RefreshCw,
    Eye,
    EyeOff,
    Clock,
    ChevronDown,
    Inbox,
    ArchiveX,
    Loader2,
    MoreHorizontal,
    X
} from 'lucide-react';
import { toCamelCase } from '@/lib/helper';
import StatsCard from "@/components/ui/StatsCard";
import MobilePageHeader from "@/components/layout/MobilePageHeader";

// Type definitions matching API response
interface Notification {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success' | 'action_required';
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

interface NotificationType extends Notification {
    creatorFirstName: string | null;
    creatorLastName: string | null;
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

type FilterType = 'all' | 'unread' | 'read' | 'starred' | 'urgent' | 'high';

const NotificationCenterPage: React.FC = () => {
    const navigate = useNavigate();

    // State
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
    const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState<boolean>(false);
    const [showArchived,] = useState<boolean>(false);
    const [showQuickActions, setShowQuickActions] = useState<boolean>(false);

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
    const notifications = useMemo(() => notificationsResponse?.data?.notifications || [], [notificationsResponse]);
    const countsData = countsResponse?.data;

    const counts = {
        total: Number(countsData?.totalCount) || 0,
        unread: Number(countsData?.totalUnread) || 0,
        urgent: Number(countsData?.urgentUnread) || 0,
        archived: Number(countsData?.archivedCount) || 0
    };

    // Filter and search logic - moved to useMemo to prevent infinite re-renders
    const filteredNotifications: NotificationType[] = useMemo(() => {
        if (!notifications.length) {
            return [];
        }

        const filtered = notifications.filter((notification: Notification) => {
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                if (!notification.title.toLowerCase().includes(query) &&
                    !notification.message.toLowerCase().includes(query)) {
                    return false;
                }
            }

            switch (selectedFilter) {
                case 'unread': if (notification.isRead !== 0) return false; break;
                case 'read': if (notification.isRead !== 1) return false; break;
                case 'urgent': if (notification.priority !== 'urgent') return false; break;
                case 'high': if (notification.priority !== 'high') return false; break;
            }

            return true;
        });

        // Unread first (newest→oldest), then read (newest→oldest)
        filtered.sort((a: Notification, b: Notification) => {
            if (a.isRead !== b.isRead) return a.isRead - b.isRead;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return filtered;
    }, [notifications, searchQuery, selectedFilter]);

    const getTypeRingColor = (type: string): string => {
        switch (type) {
            case 'success': return 'ring-emerald-500/30 bg-emerald-500/10';
            case 'warning': return 'ring-amber-500/30 bg-amber-500/10';
            case 'error': return 'ring-rose-500/30 bg-rose-500/10';
            case 'info': return 'ring-sky-500/30 bg-sky-500/10';
            case 'action_required': return 'ring-violet-500/30 bg-violet-500/10';
            default: return 'ring-slate-500/30 bg-slate-500/10';
        }
    };

    const getPriorityBadgeStyles = (priority: string): string => {
        switch (priority) {
            case 'urgent': return 'bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30';
            case 'high': return 'bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30';
            case 'normal': return 'bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30';
            default: return 'bg-slate-500/15 text-slate-400 ring-1 ring-slate-500/30';
        }
    };

    // Fixed: Returns JSX element for notification icon
    const getNotificationIcon = (type: string): JSX.Element => {
        const iconClass = "h-4 w-4";
        switch (type) {
            case 'success':
                return <Check className={`${iconClass} text-green-500`} />;
            case 'warning':
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case 'error':
                return <X className={`${iconClass} text-red-500`} />;
            case 'info':
                return <Bell className={`${iconClass} text-blue-500`} />;
            case 'action_required':
                return <Bell className={`${iconClass} text-purple-500`} />;
            default:
                return <Bell className={`${iconClass} text-gray-500`} />;
        }
    };

    // Fixed: Separate function for priority badge colors
    // const getPriorityBadgeStyles = (priority: string): string => {
    //     switch (priority) {
    //         case 'urgent':
    //             return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800';
    //         case 'high':
    //             return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800';
    //         case 'normal':
    //             return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800';
    //         default:
    //             return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-800';
    //     }
    // };

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

    const handleNotificationClick = (notification: NotificationType, e: React.MouseEvent): void => {
        // Don't intercept clicks on interactive controls inside the row
        if ((e.target as HTMLElement).closest('button, input')) return;

        // Mark as read on click
        if (notification.isRead === 0) {
            markAsRead.mutate(notification.id);
        }

        // Navigate to actionUrl if present
        if (notification.actionUrl) {
            if (notification.actionUrl.startsWith('http')) {
                window.open(notification.actionUrl, '_blank', 'noopener');
            } else {
                navigate(notification.actionUrl);
            }
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
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
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
            <MobilePageHeader />
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
                <StatsCard
                    label="Total"
                    value={countsLoading ? '...' : Number(stats.total) || 0}
                    subtitle="all notifications"
                    tone="indigo"
                    icon={<Inbox className="w-5 h-5" />}
                />
                <StatsCard
                    label="Unread"
                    value={countsLoading ? '...' : Number(stats.unread) || 0}
                    subtitle="need attention"
                    tone="blue"
                    icon={<Bell className="w-5 h-5" />}
                />
                <StatsCard
                    label="Urgent"
                    value={countsLoading ? '...' : Number(stats.urgent) || 0}
                    subtitle="high priority"
                    tone="red"
                    icon={<AlertTriangle className="w-5 h-5" />}
                />
                <StatsCard
                    label="Archived"
                    value={countsLoading ? '...' : Number(stats.archived) || 0}
                    subtitle="stored away"
                    tone="violet"
                    icon={<ArchiveX className="w-5 h-5" />}
                />
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
                            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Extended Filters */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-3">
                        {/* Status filter */}
                        <div className="flex flex-wrap gap-2">
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

                    </div>
                )}
            </div>

            {/* Notifications List */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">

                {/* Header */}
                {filteredNotifications.length > 0 && (
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex items-center justify-between">

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.size === filteredNotifications.length && filteredNotifications.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-3.5 h-3.5 rounded accent-sky-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                />

                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                    {selectedNotifications.size > 0 ? (
                                        <span className="text-sky-600 dark:text-sky-400">
                                            {selectedNotifications.size} selected
                                        </span>
                                    ) : (
                                        `${filteredNotifications.length} notifications`
                                    )}
                                </span>

                                {selectedNotifications.size > 0 && (
                                    <button
                                        onClick={() => setSelectedNotifications(new Set())}
                                        className="text-[11px] text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                {selectedNotifications.size > 0 ? (
                                    <>
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => markAsRead.mutate(id))}
                                            disabled={isMutating}
                                            title="Mark selected as read"
                                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                                            <Check className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => archiveNotification.mutate(id))}
                                            disabled={isMutating}
                                            title="Archive selected"
                                            className="p-1.5 rounded-lg text-sky-600 dark:text-sky-400 hover:bg-sky-500/10">
                                            <Archive className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => Array.from(selectedNotifications).forEach(id => deleteNotification.mutate(id))}
                                            disabled={isMutating}
                                            title="Delete selected"
                                            className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-500/10">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            onClick={handleMarkAllRead}
                                            disabled={isMutating || filteredNotifications.every((n: any) => n.isRead === 1)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-500/10 hover:bg-sky-200 dark:hover:bg-sky-500/20 rounded-lg ring-1 ring-sky-200 dark:ring-sky-500/20">
                                            <CheckCircle className="w-3 h-3" />
                                            Mark all read
                                        </button>

                                        <button className="p-1.5 text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                                            <RefreshCw className="w-3.5 h-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty / Loading */}
                {filteredNotifications.length === 0 ? (
                    <div className="py-16 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 
                bg-gray-100 dark:bg-gray-800 
                ring-1 ring-gray-200 dark:ring-gray-700 
                rounded-2xl flex items-center justify-center">
                            <Bell className="w-6 h-6 text-gray-400" />
                        </div>

                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-1">
                            {searchQuery ? 'No results found' : 'All caught up'}
                        </h3>

                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            {searchQuery ? 'Try different search terms' : 'No new notifications'}
                        </p>
                    </div>
                ) : (

                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {filteredNotifications.map((notification: NotificationType) => {
                            const isUnread = notification.isRead === 0;
                            const isClickable = !!notification.actionUrl;

                            return (
                                <div
                                    key={notification.id}
                                    onClick={(e) => handleNotificationClick(notification, e)}
                                    className={`group relative flex items-start gap-3 px-4 py-3.5 transition
                        hover:bg-gray-50 dark:hover:bg-gray-800/50
                        ${isClickable ? 'cursor-pointer' : ''}
                        ${isUnread ? 'bg-sky-50 dark:bg-sky-500/[0.05]' : ''}`}
                                >

                                    {/* unread bar */}
                                    {isUnread && (
                                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-sky-500 rounded-r-full" />
                                    )}

                                    <input
                                        checked={selectedNotifications.has(notification.id)}
                                        onChange={() => handleSelectNotification(notification.id)}
                                        type="checkbox"
                                        className="mt-1 w-3.5 h-3.5 rounded accent-sky-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                                    />

                                    {/* Icon */}
                                    <div className={`flex-shrink-0 mt-0.5 w-8 h-8 rounded-xl ring-1 flex items-center justify-center ${getTypeRingColor(notification.type)}`}>
                                        {getNotificationIcon(notification.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">

                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {notification.actionUrl ? (
                                                notification.actionUrl.startsWith('http') ? (
                                                    <a
                                                        href={notification.actionUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => { if (notification.isRead === 0) markAsRead.mutate(notification.id); }}
                                                        className={`text-sm font-semibold ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                                    >
                                                        {notification.title}
                                                    </a>
                                                ) : (
                                                    <Link
                                                        to={notification.actionUrl}
                                                        onClick={() => { if (notification.isRead === 0) markAsRead.mutate(notification.id); }}
                                                        className={`text-sm font-semibold ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                                                    >
                                                        {notification.title}
                                                    </Link>
                                                )
                                            ) : (
                                                <h4 className={`text-sm font-semibold ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {notification.title}
                                                </h4>
                                            )}

                                            <span className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md ${getPriorityBadgeStyles(notification.priority)}`}>
                                                {notification.priority}
                                            </span>
                                        </div>

                                        <p className={`text-xs mb-2 ${isUnread ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                                            }`}>
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-500 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-2.5 h-2.5" />
                                                {formatTime(notification.createdAt)}
                                            </span>

                                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />

                                            <span>
                                                {notification.category ? toCamelCase(notification.category.replace('_', ' ')) : 'General'}
                                            </span>

                                            {notification.actionUrl && notification.actionText && (
                                                <>
                                                    <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
                                                    <span className="text-blue-500 dark:text-blue-400 font-medium">
                                                        {notification.actionText}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Hover actions */}
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => handleToggleRead(notification.id, notification.isRead)}
                                            disabled={isMutating}
                                            title={notification.isRead === 1 ? 'Mark as unread' : 'Mark as read'}
                                            className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                            {isMutating
                                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                                : notification.isRead === 1
                                                    ? <EyeOff className="w-3 h-3" />
                                                    : <Eye className="w-3 h-3" />
                                            }
                                        </button>

                                        <button
                                            onClick={() => handleArchive(notification.id)}
                                            disabled={isMutating}
                                            className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                            <Archive className="w-3 h-3" />
                                        </button>

                                        <button
                                            onClick={() => handleDelete(notification.id)}
                                            disabled={isMutating}
                                            className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationCenterPage;
