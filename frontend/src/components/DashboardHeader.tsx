/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/contexts/AuthContext";
import { MonitorOff, Moon, SunDim, Bell, X, Check, Clock, Archive, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useNotifications, useNotificationCounts, useNotificationMutations } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
    isCollapsed?: boolean;
    showSidebar?: boolean;
}

interface NotificationAPI {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'action_required';
    category: 'leave_management' | 'document_management' | 'performance_reviews' | 'system_updates' | 'security' | 'general';
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isRead: boolean;
    isArchived: boolean;
    readAt?: string;
    createdAt: string;
    relatedId?: string;
    relatedType?: string;
    createdBy?: string;
    metadata?: any;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    isCollapsed = false,
    showSidebar = true
}) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [showActions, setShowActions] = useState<string | null>(null);

    const notificationRef = useRef<HTMLDivElement>(null);

    // TanStack Query hooks
    const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({
        limit: 20,
        isArchived: false
    });

    const { data: countsData } = useNotificationCounts();

    const {
        markAsRead,
        markAsUnread,
        markAllAsRead,
        archiveNotification,
        deleteNotification
    } = useNotificationMutations();

    const allNotifications = notificationsData?.data?.notifications || [];
    const notifications = allNotifications.filter((n: NotificationAPI) => !n.isRead);
    const unreadCount = countsData?.data?.totalUnread || 0;
    const urgentCount = countsData?.data?.urgentUnread || 0;

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 100);
        return () => clearInterval(timer);
    }, []);

    // Close notifications when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
                setShowActions(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        }).replace(",", "");
    };

    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    const getTimeEmoji = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return <SunDim className="text-yellow-500 h-12 w-12 dark:text-yellow-500" />;
        if (hour >= 12 && hour < 20) return <Moon className="text-yellow-500 h-12 w-12 dark:text-yellow-500" />;
        return <MonitorOff className="text-yellow-500 h-12 w-12 dark:text-yellow-500" />;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return <Check className="h-4 w-4 text-green-500" />;
            case 'warning': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'error': return <X className="h-4 w-4 text-red-500" />;
            case 'action_required': return <Bell className="h-4 w-4 text-purple-500" />;
            case 'info': return <Bell className="h-4 w-4 text-blue-500" />;
            default: return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    // Fixed: Function to get notification styling based on type and read status
    const getNotificationStyles = (type: string, isRead: boolean): string => {
        // If notification is read, no border or background
        if (isRead) {
            return '';
        }

        // If notification is unread, add left border and subtle background based on type
        switch (type) {
            case 'error':
            case 'urgent':
                return 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10';
            case 'warning':
                return 'border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10';
            case 'success':
                return 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-900/10';
            case 'info':
                return 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10';
            case 'action_required':
                return 'border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10';
            default:
                return 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10';
        }
    };

    const handleNotificationClick = (notification: NotificationAPI) => {
        if (!notification.isRead) {
            markAsRead.mutate(notification.id);
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    const handleMarkAllRead = () => {
        markAllAsRead.mutate();
    };

    const handleArchive = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        archiveNotification.mutate(id);
        setShowActions(null);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this notification?')) {
            deleteNotification.mutate(id);
        }
        setShowActions(null);
    };

    const getResponsivePadding = () => {
        if (!showSidebar) {
            return "px-4 lg:px-8";
        }
        if (isCollapsed) {
            return "px-4 lg:px-8";
        } else {
            return "px-4 lg:px-8";
        }
    };

    const handleNavigation = () => {
        setShowNotifications(false);
        navigate('/notifications');
    };

    return (
        <div className={`relative ${getResponsivePadding()} pt-8 lg:pt-16 overflow-visible transition-all duration-300`}>
            {/* Notification Center */}
            <div className="absolute top-8 lg:top-16 right-4 lg:right-8 mr-20 z-50" ref={notificationRef}>
                <div className="relative">
                    {/* Bell Icon Button */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                    >
                        <Bell className="w-5 h-5" />

                        {/* Unread Badge */}
                        {unreadCount > 0 && (
                            <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                                }`}>
                                <span className="text-xs text-white font-bold">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </div>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute top-full right-0 mt-3 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all">

                            {/* Header */}
                            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                                        Notifications
                                    </h3>
                                    {countsData?.data && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {unreadCount} unread
                                            {urgentCount > 0 && `, ${urgentCount} urgent`}
                                        </p>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllRead}
                                        disabled={markAllAsRead.isPending}
                                        className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                                    >
                                        {markAllAsRead.isPending ? 'Marking...' : 'Mark all read'}
                                    </button>
                                )}
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notificationsLoading ? (
                                    <div className="p-8 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading...</p>
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="font-medium">You're all caught up!</p>
                                        <p className="text-xs mt-1">No unread notifications</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                                        {notifications.map((notification: NotificationAPI) => {
                                            const notificationStyles = getNotificationStyles(notification.type, notification.isRead);

                                            return (
                                                <div
                                                    key={notification.id}
                                                    className={`group relative transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${notificationStyles}`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <div className="p-4 flex gap-3 w-full">
                                                        {/* Icon */}
                                                        <div className="flex-shrink-0 pt-1">
                                                            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className={`text-sm font-medium truncate ${!notification.isRead
                                                                            ? "text-gray-900 dark:text-white"
                                                                            : "text-gray-700 dark:text-gray-300"
                                                                            }`}>
                                                                            {notification.title}
                                                                        </p>

                                                                        {/* Priority Badge */}
                                                                        {notification.priority && notification.priority !== 'normal' && (
                                                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${notification.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                                                notification.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                                                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                                                                }`}>
                                                                                {notification.priority}
                                                                            </span>
                                                                        )}

                                                                        {/* Unread Indicator */}
                                                                        {!notification.isRead && (
                                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
                                                                        )}
                                                                    </div>

                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">
                                                                        {notification.message}
                                                                    </p>

                                                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                                                        <span>{formatNotificationTime(notification.createdAt)}</span>
                                                                        {notification.createdBy && (
                                                                            <span>From: {notification.createdBy}</span>
                                                                        )}
                                                                    </div>

                                                                    {notification.actionText && (
                                                                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                            {notification.actionText}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Actions Menu Button */}
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setShowActions(showActions === notification.id ? null : notification.id);
                                                                        }}
                                                                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                        </svg>
                                                                    </button>

                                                                    {/* Actions Dropdown */}
                                                                    {showActions === notification.id && (
                                                                        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[140px]">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    (notification.isRead ? markAsUnread : markAsRead).mutate(notification.id);
                                                                                    setShowActions(null);
                                                                                }}
                                                                                className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                            >
                                                                                {notification.isRead ? (
                                                                                    <Bell className="h-3 w-3" />
                                                                                ) : (
                                                                                    <Check className="h-3 w-3" />
                                                                                )}
                                                                                Mark as {notification.isRead ? "unread" : "read"}
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleArchive(notification.id, e)}
                                                                                className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                            >
                                                                                <Archive className="h-3 w-3" />
                                                                                Archive
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => handleDelete(notification.id, e)}
                                                                                className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2"
                                                                            >
                                                                                <Trash2 className="h-3 w-3" />
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                                    <button
                                        onClick={() => handleNavigation()}
                                        className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                                    >
                                        View all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 lg:space-y-6">
                {/* Main Greeting Card */}
                <div className="backdrop-blur-sm max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                    {/* Emoji and Time Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 lg:mb-4">
                        <div
                            className="text-5xl lg:text-6xl animate-bounce drop-shadow-sm"
                            style={{ animationDuration: '2.5s', animationTimingFunction: 'ease-in-out' }}
                        >
                            {getTimeEmoji()}
                        </div>
                        <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent"></div>
                        <div className="text-sm lg:text-lg font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/60 dark:to-green-900/60 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 transition-all duration-300">
                            <span className="font-mono">
                                {formatTime(currentTime)}
                            </span>
                        </div>
                    </div>

                    {/* Main Greeting Text */}
                    <div className="space-y-2 lg:space-y-3">
                        <div className="text-xl sm:text-2xl lg:text-4xl font-bold">
                            <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-400 dark:to-green-400 bg-clip-text text-transparent">
                                {getGreeting()}, {user?.firstName} {user?.lastName}
                            </span>
                        </div>
                    </div>

                    {/* Subtitle */}
                    <p className="text-sm lg:text-lg text-gray-600 dark:text-gray-300 mt-3 lg:mt-4 font-medium">
                        {user && user.dob === new Date().getFullYear().toString() ? `🎉 Happy Birthday ${user?.firstName} ${user?.lastName}! Wishing a fantastic day!`
                            : 'Welcome back to Disraptor LMS Hub!'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardHeader;