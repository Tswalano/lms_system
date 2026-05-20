/* eslint-disable @typescript-eslint/no-explicit-any */
import { useAuth } from "@/contexts/AuthContext";
import { MonitorOff, Moon, Sun, SunDim, Bell, X, Check, Clock, Archive, Trash2, Cake } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import JSConfetti from "js-confetti";
import { useNotifications, useNotificationCounts, useNotificationMutations } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

// ── Constants ────────────────────────────────────────────────────────────────

const DISMISSED_BIRTHDAY_PROMPT_KEY = 'dismissedBirthdayBanner';
const CONFETTI_EMOJIS = ['🎉', '🎂', '🎈', '🥳', '🎁'];
const BIRTHDAY_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

interface Quote { text: string; author: string; }

const QUOTES: Quote[] = [
    // Life
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
    // Education
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "Intelligence plus character — that is the goal of true education.", author: "Martin Luther King Jr." },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Tell me and I forget. Teach me and I remember. Involve me and I learn.", author: "Benjamin Franklin" },
    // Engineering & Technology
    { text: "Scientists study the world as it is; engineers create the world that has never been.", author: "Theodore von Kármán" },
    { text: "First, solve the problem. Then, write the code.", author: "John Johnson" },
    { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
    { text: "Make everything as simple as possible, but not simpler.", author: "Albert Einstein" },
    { text: "Programs must be written for people to read, and only incidentally for machines to execute.", author: "Harold Abelson" },
    { text: "Talk is cheap. Show me the code.", author: "Linus Torvalds" },
    { text: "Any sufficiently advanced technology is indistinguishable from magic.", author: "Arthur C. Clarke" },
    { text: "The function of good software is to make the complex appear to be simple.", author: "Grady Booch" },
    { text: "The engineer has been, and is, a maker of history.", author: "James Kip Finch" },
];

const QUOTE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Quote helpers ─────────────────────────────────────────────────────────────

function pickAndStoreQuote(userKey: string): Quote {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    localStorage.setItem(`lms_quote_${userKey}`, JSON.stringify({ quote, ts: Date.now() }));
    return quote;
}

function getQuoteForUser(userKey: string): Quote {
    try {
        const raw = localStorage.getItem(`lms_quote_${userKey}`);
        if (raw) {
            const { quote, ts } = JSON.parse(raw);
            if (Date.now() - ts < QUOTE_TTL_MS) return quote;
        }
    } catch { /* ignore parse errors */ }
    return pickAndStoreQuote(userKey);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function localDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isTodayBirthday(dob: string): boolean {
    const today = new Date();
    const [, mm, dd] = dob.split('T')[0].split('-').map(Number);
    return mm - 1 === today.getMonth() && dd === today.getDate();
}

function isBirthdayObservedToday(birthdayDate: string): boolean {
    const now = new Date();
    const bday = new Date(birthdayDate);
    const nowStr = localDateStr(now);
    const bdayStr = localDateStr(bday);
    if (bdayStr === nowStr) return true;
    if (now.getDay() === 5) {
        const sat = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const sun = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
        if (bdayStr === sat || bdayStr === sun) return true;
    }
    return false;
}

// ── Notification types ────────────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface DashboardHeaderProps { }

const DashboardHeader: React.FC<DashboardHeaderProps> = () => {
    const navigate = useNavigate();
    const { user, authFetch } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [showActions, setShowActions] = useState<string | null>(null);
    const [quote, setQuote] = useState<Quote | null>(null);
    const [showBirthdayPrompt, setShowBirthdayPrompt] = useState(false);
    const today = useMemo(() => new Date(), []);
    const jsConfettiRef = useRef<JSConfetti | null>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Birthday query — shared cache key with any other consumer (e.g. CalendarSection)
    const todayDow = today.getDay();
    const lookAheadEnd = todayDow === 5
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
        : today;
    const birthdayQueryStart = localDateStr(today);
    const birthdayQueryEnd = localDateStr(lookAheadEnd);

    const { data: birthdayData } = useQuery({
        queryKey: ['todayBirthdays', birthdayQueryStart, birthdayQueryEnd],
        queryFn: async () => {
            const res = await authFetch(
                `/leave/leave-calendar-with-birthdays?start_date=${birthdayQueryStart}&end_date=${birthdayQueryEnd}`
            );
            if (!res.ok) throw new Error('Failed to fetch birthdays');
            return res.json();
        },
        staleTime: 60 * 60 * 1000,
        gcTime: 2 * 60 * 60 * 1000,
        refetchOnWindowFocus: false,
        enabled: !!user,
    });

    // Exclude inactive colleagues — the API may return `isActive`; if it does, honour it
    const colleagueBirthdays: Array<{ userId: string; firstName: string; birthdayDate: string }> =
        (birthdayData?.data?.birthdays ?? []).filter(
            (b: any) =>
                isBirthdayObservedToday(b.birthdayDate) &&
                String(b.userId) !== String(user?.id) &&
                b.isActive !== false &&
                b.isActive !== 0 &&
                b.isActive !== '0'
        );

    const isOwnBirthdayFromProfile = Boolean(user?.dob && isTodayBirthday(user.dob));
    const isOwnBirthdayFromApi = (birthdayData?.data?.birthdays ?? []).some(
        (b: any) => String(b.userId) === String(user?.id) && isBirthdayObservedToday(b.birthdayDate)
    );
    const isOwnBirthday = isOwnBirthdayFromProfile || isOwnBirthdayFromApi;
    const hasBirthdayCelebration = isOwnBirthday || colleagueBirthdays.length > 0;
    const shouldShowConfetti = hasBirthdayCelebration;

    // Notifications
    const { data: notificationsData, isLoading: notificationsLoading } = useNotifications({ limit: 20, isArchived: false });
    const { data: countsData } = useNotificationCounts();
    const { markAsRead, markAsUnread, markAllAsRead, archiveNotification, deleteNotification } = useNotificationMutations();

    const allNotifications = notificationsData?.data?.notifications || [];
    const notifications = allNotifications.filter((n: NotificationAPI) => !n.isRead);
    const unreadCount = countsData?.data?.totalUnread || 0;
    const urgentCount = countsData?.data?.urgentUnread || 0;

    // ── Effects ───────────────────────────────────────────────────────────────

    useEffect(() => {
        jsConfettiRef.current = new JSConfetti();
        return () => {
            jsConfettiRef.current?.clearCanvas();
            jsConfettiRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!shouldShowConfetti || !jsConfettiRef.current) return;
        void jsConfettiRef.current.addConfetti({
            emojis: CONFETTI_EMOJIS,
            emojiSize: 36,
            confettiNumber: 50,
        });
    }, [shouldShowConfetti]);

    // Periodic reload to keep birthday banner fresh during long sessions
    useEffect(() => {
        if (!hasBirthdayCelebration) return;
        const id = window.setInterval(() => window.location.reload(), BIRTHDAY_REFRESH_INTERVAL_MS);
        return () => window.clearInterval(id);
    }, [hasBirthdayCelebration]);

    // Birthday prompt — only when user has no DOB set
    useEffect(() => {
        if (!user) return;
        const dobDate = user.dob?.split('T')[0];
        const hasDob = dobDate && dobDate !== '0000-00-00';
        if (!hasDob) {
            const dismissedFor = localStorage.getItem(DISMISSED_BIRTHDAY_PROMPT_KEY);
            if (dismissedFor !== user.id) setShowBirthdayPrompt(true);
        }
    }, [user]);

    useEffect(() => {
        if (user?.email) setQuote(getQuoteForUser(user.email));
    }, [user?.email]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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

    // ── Helpers ───────────────────────────────────────────────────────────────

    const formatTime = (date: Date) =>
        date.toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: false,
        }).replace(",", "");

    const formatNotificationTime = (dateString: string) => {
        const date = new Date(dateString);
        const diffMs = Date.now() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
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

    const getTimeIcon = () => {
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

    const getNotificationStyles = (type: string, isRead: boolean): string => {
        if (isRead) return '';
        switch (type) {
            case 'error': case 'urgent': return 'border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-900/10';
            case 'warning': return 'border-l-4 border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-900/10';
            case 'success': return 'border-l-4 border-l-green-500 bg-green-50/30 dark:bg-green-900/10';
            case 'info': return 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10';
            case 'action_required': return 'border-l-4 border-l-purple-500 bg-purple-50/30 dark:bg-purple-900/10';
            default: return 'border-l-4 border-l-blue-500 bg-blue-50/30 dark:bg-blue-900/10';
        }
    };

    const handleNotificationClick = (notification: NotificationAPI) => {
        if (!notification.isRead) markAsRead.mutate(notification.id);
        if (notification.actionUrl) window.location.href = notification.actionUrl;
    };

    const handleArchive = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        archiveNotification.mutate(id);
        setShowActions(null);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this notification?')) deleteNotification.mutate(id);
        setShowActions(null);
    };

    const handleDismissBirthdayPrompt = () => {
        if (user) localStorage.setItem(DISMISSED_BIRTHDAY_PROMPT_KEY, user.id);
        setShowBirthdayPrompt(false);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="relative px-4 lg:px-8 pt-8 lg:pt-16 overflow-visible transition-all duration-300">

            {/* Header action icons */}
            <div className="absolute top-8 lg:top-16 right-4 lg:right-8 z-50 flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    aria-label="Toggle dark mode"
                    className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors overflow-hidden relative"
                >
                    <span key={theme} className="block" style={{ animation: 'spinIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
                        {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-500" />}
                    </span>
                    <style>{`@keyframes spinIn { from { transform: rotate(-90deg) scale(0.5); opacity: 0; } to { transform: rotate(0deg) scale(1); opacity: 1; } }`}</style>
                </button>

                <div ref={notificationRef}>
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative"
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <div className={`absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center ${urgentCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}>
                                    <span className="text-xs text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                </div>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute top-full right-0 mt-3 w-96 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all">
                                <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-base">Notifications</h3>
                                        {countsData?.data && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {unreadCount} unread{urgentCount > 0 && `, ${urgentCount} urgent`}
                                            </p>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllAsRead.mutate()}
                                            disabled={markAllAsRead.isPending}
                                            className="text-xs px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition disabled:opacity-50"
                                        >
                                            {markAllAsRead.isPending ? 'Marking...' : 'Mark all read'}
                                        </button>
                                    )}
                                </div>

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
                                            {notifications.map((notification: NotificationAPI) => (
                                                <div
                                                    key={notification.id}
                                                    className={`group relative transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${getNotificationStyles(notification.type, notification.isRead)}`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <div className="p-4 flex gap-3 w-full">
                                                        <div className="flex-shrink-0 pt-1">
                                                            <div className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                                                                {getNotificationIcon(notification.type)}
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <p className={`text-sm font-medium truncate ${!notification.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                                                                            {notification.title}
                                                                        </p>
                                                                        {notification.priority && notification.priority !== 'normal' && (
                                                                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${notification.priority === 'urgent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : notification.priority === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                                                                {notification.priority}
                                                                            </span>
                                                                        )}
                                                                        {!notification.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />}
                                                                    </div>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-1">{notification.message}</p>
                                                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                                                        <span>{formatNotificationTime(notification.createdAt)}</span>
                                                                        {notification.createdBy && <span>From: {notification.createdBy}</span>}
                                                                    </div>
                                                                    {notification.actionText && (
                                                                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                                            {notification.actionText}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setShowActions(showActions === notification.id ? null : notification.id); }}
                                                                        className="p-1 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                                                        </svg>
                                                                    </button>
                                                                    {showActions === notification.id && (
                                                                        <div className="absolute right-0 top-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 min-w-[140px]">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); (notification.isRead ? markAsUnread : markAsRead).mutate(notification.id); setShowActions(null); }}
                                                                                className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                                                            >
                                                                                {notification.isRead ? <Bell className="h-3 w-3" /> : <Check className="h-3 w-3" />}
                                                                                Mark as {notification.isRead ? "unread" : "read"}
                                                                            </button>
                                                                            <button onClick={(e) => handleArchive(notification.id, e)} className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                                                                                <Archive className="h-3 w-3" /> Archive
                                                                            </button>
                                                                            <button onClick={(e) => handleDelete(notification.id, e)} className="w-full px-4 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 flex items-center gap-2">
                                                                                <Trash2 className="h-3 w-3" /> Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/30">
                                        <button
                                            onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
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
            </div>

            {/* Birthday prompt banner — shown when user has no DOB set */}
            {showBirthdayPrompt && (
                <div className="mb-4 pt-4">
                    <div className="mx-auto w-full max-w-sm sm:max-w-4xl lg:max-w-6xl flex items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-3 text-sm shadow-sm">
                        <div className="flex items-center gap-2">
                            <Cake size={15} className="shrink-0 text-amber-500 dark:text-amber-400" />
                            <span>
                                We'd love to celebrate your birthday!{' '}
                                <Link to="/profile" className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors">
                                    Add your birthday to your profile
                                </Link>{' '}
                                so we don't miss your special day.
                            </span>
                        </div>
                        <button onClick={handleDismissBirthdayPrompt} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-4 lg:space-y-6">

                {isOwnBirthday ? (
                    /* ── Own birthday ─────────────────────────────────── */
                    <div className="relative w-full max-w-3xl mx-auto py-4 overflow-hidden text-center">

                        {/* Scattered floating emojis in background */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            {[
                                { emoji: '🎉', cls: 'top-4 left-[8%]', dur: '4s', delay: '0s' },
                                { emoji: '🎂', cls: 'top-6 left-[22%]', dur: '5s', delay: '0.5s' },
                                { emoji: '🎈', cls: 'top-3 right-[20%]', dur: '3.8s', delay: '0.2s' },
                                { emoji: '🥳', cls: 'bottom-3 right-[10%]', dur: '6s', delay: '1s' },
                                { emoji: '🎁', cls: 'bottom-4 left-[14%]', dur: '4.5s', delay: '0.8s' },
                                { emoji: '🎈', cls: 'top-1/2 left-[5%]', dur: '5.5s', delay: '1.5s' },
                                { emoji: '🎉', cls: 'bottom-2 right-[28%]', dur: '4.2s', delay: '0.3s' },
                                { emoji: '✨', cls: 'top-8 right-[8%]', dur: '3.5s', delay: '0.7s' },
                            ].map((item, i) => (
                                <span
                                    key={i}
                                    className={`absolute text-2xl opacity-60 ${item.cls}`}
                                    style={{ animation: `ownBdayFloat ${item.dur} ease-in-out ${item.delay} infinite alternate` }}
                                >
                                    {item.emoji}
                                </span>
                            ))}
                        </div>

                        {/* Clock — same layout as standard greeting */}
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-5">
                            <div className="text-5xl lg:text-6xl animate-bounce drop-shadow-sm" style={{ animationDuration: '2.5s', animationTimingFunction: 'ease-in-out' }}>
                                {getTimeIcon()}
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent" />
                            <div className="text-sm lg:text-lg font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/60 dark:to-green-900/60 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 transition-all duration-300">
                                <span className="font-mono">{formatTime(currentTime)}</span>
                            </div>
                        </div>

                        {/* Heading — only names are coloured */}
                        <div className="relative z-10 text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-gray-800 dark:text-gray-100">
                            {"🎂 Happy Birthday, "}
                            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                                {user?.firstName}
                                {colleagueBirthdays.length === 1 && (
                                    <span> & {colleagueBirthdays[0].firstName}</span>
                                )}
                                {colleagueBirthdays.length > 1 && (
                                    <>
                                        {colleagueBirthdays.slice(0, -1).map((b) => (
                                            <span key={b.userId}>, {b.firstName}</span>
                                        ))}
                                        <span> & {colleagueBirthdays[colleagueBirthdays.length - 1].firstName}</span>
                                    </>
                                )}
                            </span>
                            {"! 🎉"}
                        </div>

                        <style>{`
                            @keyframes ownBdayFloat {
                                from { transform: translateY(0px) rotate(-6deg); }
                                to   { transform: translateY(-12px) rotate(6deg); }
                            }
                        `}</style>
                    </div>
                ) : colleagueBirthdays.length > 0 ? (
                    /* ── Ambient birthday celebration ───────────────────────────── */
                    <div className="relative w-full max-w-3xl mx-auto py-4 overflow-hidden">

                        {/* Ambient glow backgrounds */}
                        <div className="pointer-events-none absolute inset-0">
                            <div className="absolute top-0 left-1/4 h-40 w-40 rounded-full bg-pink-500/10 blur-3xl animate-pulse" />
                            <div
                                className="absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl animate-pulse"
                                style={{ animationDuration: '4s' }}
                            />
                        </div>

                        {/* Floating emojis */}
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            {[
                                { emoji: '✨', cls: 'top-6 left-[12%]', dur: '4s' },
                                { emoji: '🎈', cls: 'top-10 right-[18%]', dur: '5s' },
                                { emoji: '🎉', cls: 'bottom-8 left-[20%]', dur: '4.5s' },
                                { emoji: '🥳', cls: 'bottom-6 right-[22%]', dur: '6s' },
                                { emoji: '🎂', cls: 'top-1/2 left-[8%]', dur: '5.5s' },
                            ].map((item, i) => (
                                <span
                                    key={i}
                                    className={`absolute text-xl opacity-70 ${item.cls}`}
                                    style={{
                                        animation: `birthdayFloat ${item.dur} ease-in-out infinite alternate`,
                                    }}
                                >
                                    {item.emoji}
                                </span>
                            ))}
                        </div>

                        <div className="relative z-10 flex flex-col items-center text-center">

                            {/* Greeting */}
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <div
                                    className="drop-shadow-sm"
                                    style={{
                                        animation: 'softBounce 3s ease-in-out infinite',
                                    }}
                                >
                                    {getTimeIcon()}
                                </div>

                                <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent" />

                                <div className="rounded-full border border-white/20 bg-white/40 dark:bg-white/5 backdrop-blur-md px-4 py-2 text-sm lg:text-base text-gray-700 dark:text-gray-200 shadow-sm">
                                    <span className="font-mono tracking-wide">
                                        {formatTime(currentTime)}
                                    </span>
                                </div>
                            </div>

                            {/* Main greeting */}
                            <h1 className="mt-5 text-2xl sm:text-3xl lg:text-5xl font-black tracking-tight">
                                <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                                    {getGreeting()}, {user?.firstName}
                                </span>
                            </h1>

                            {/* Birthday message */}
                            <div className="mt-6 space-y-3">

                                <div
                                    className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100"
                                    style={{
                                        animation: 'fadeGlow 4s ease-in-out infinite',
                                    }}
                                >
                                    {colleagueBirthdays.length === 1 ? (
                                        <>
                                            {"🎂 It's "}
                                            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                                                {colleagueBirthdays[0].firstName}
                                            </span>
                                            {"'s birthday today! Go wish them a happy birthday 🎉"}
                                        </>
                                    ) : (
                                        <>
                                            {"🎂 "}
                                            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-orange-400 bg-clip-text text-transparent">
                                                {colleagueBirthdays.slice(0, -1).map((b, i) => (
                                                    <span key={b.userId}>{i > 0 ? ", " : ""}{b.firstName}</span>
                                                ))}
                                                {" & "}
                                                {colleagueBirthdays[colleagueBirthdays.length - 1].firstName}
                                            </span>
                                            {" are celebrating their birthdays today — go make them feel special! 🎉"}
                                        </>
                                    )}
                                </div>

                                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 tracking-wide">
                                    Go make their day extra special ✨
                                </p>
                            </div>
                        </div>

                        {/* Animations */}
                        <style>{`
            @keyframes birthdayFloat {
                from {
                    transform: translateY(0px) rotate(-6deg);
                }
                to {
                    transform: translateY(-12px) rotate(6deg);
                }
            }

            @keyframes softBounce {
                0%, 100% {
                    transform: translateY(0px);
                }
                50% {
                    transform: translateY(-6px);
                }
            }

            @keyframes fadeGlow {
                0%, 100% {
                    opacity: 0.9;
                    transform: scale(1);
                    text-shadow: 0 0 0px rgba(255,255,255,0);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.02);
                    text-shadow:
                        0 0 12px rgba(255,255,255,0.15),
                        0 0 24px rgba(236,72,153,0.15);
                }
            }
        `}</style>
                    </div>
                ) : (
                    /* ── Standard greeting ─────────────────────────────────── */
                    <div className="backdrop-blur-sm max-w-2xl mx-auto transform hover:scale-105 transition-all duration-300">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 lg:mb-4">
                            <div className="text-5xl lg:text-6xl animate-bounce drop-shadow-sm" style={{ animationDuration: '2.5s', animationTimingFunction: 'ease-in-out' }}>
                                {getTimeIcon()}
                            </div>
                            <div className="hidden sm:block h-8 w-px bg-gradient-to-b from-transparent via-blue-300 dark:via-blue-500 to-transparent" />
                            <div className="text-sm lg:text-lg font-medium text-gray-700 dark:text-gray-200 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/60 dark:to-green-900/60 px-3 lg:px-4 py-1.5 lg:py-2 rounded-full backdrop-blur-sm border border-blue-200/30 dark:border-blue-700/30 transition-all duration-300">
                                <span className="font-mono">{formatTime(currentTime)}</span>
                            </div>
                        </div>

                        <div className="space-y-2 lg:space-y-3">
                            <div className="text-xl sm:text-2xl lg:text-4xl font-bold">
                                <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500 dark:from-blue-400 dark:via-cyan-400 dark:to-green-400 bg-clip-text text-transparent">
                                    {getGreeting()}, {user?.firstName} {user?.lastName}
                                </span>
                            </div>
                        </div>

                        {quote && (
                            <div className="mt-3 lg:mt-4 max-w-xl mx-auto">
                                <p className="text-sm lg:text-base text-gray-600 dark:text-gray-300 italic leading-relaxed">
                                    &ldquo;{quote.text}&rdquo;
                                </p>
                                <p className="text-xs lg:text-sm text-gray-400 dark:text-gray-500 mt-1 font-medium tracking-wide">
                                    — {quote.author}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardHeader;
