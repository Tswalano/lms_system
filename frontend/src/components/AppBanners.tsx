import { useState, useEffect } from 'react';
import { X, RefreshCw, Cake, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const SEEN_VERSION_KEY = 'lastSeenVersion';
const DISMISSED_BIRTHDAY_PROMPT_KEY = 'dismissedBirthdayBanner';
const DISMISSED_BIRTHDAY_WISH_KEY = 'dismissedBirthdayWish';
const DISMISSED_COLLEAGUE_WISH_KEY = 'dismissedColleagueBirthdays';

function localDateStr(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isTodayBirthday(dob: string): boolean {
    const today = new Date();
    // Slice the date part from ISO strings like "1985-05-19T22:00:00.000Z"
    // to avoid timezone shifting the day when parsing via Date constructor
    const [, mm, dd] = dob.split('T')[0].split('-').map(Number);
    return mm - 1 === today.getMonth() && dd === today.getDate();
}

function isBirthdayObservedToday(birthdayDate: string): boolean {
    const now = new Date();
    const bday = new Date(birthdayDate);
    const nowStr = localDateStr(now);
    const bdayStr = localDateStr(bday);
    if (bdayStr === nowStr) return true;
    // On Friday, observe Saturday and Sunday birthdays too
    if (now.getDay() === 5) {
        const sat = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
        const sun = localDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2));
        if (bdayStr === sat || bdayStr === sun) return true;
    }
    return false;
}

export function formatColleagueNames(names: string[]): string {
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} and ${names.length - 2} other${names.length - 2 > 1 ? 's' : ''}`;
}

const AppBanners: React.FC = () => {
    const { user, authFetch } = useAuth();
    const today = new Date();
    const [newVersion, setNewVersion] = useState<string | null>(null);
    const [showVersionBanner, setShowVersionBanner] = useState(false);
    const [showBirthdayPrompt, setShowBirthdayPrompt] = useState(false);
    const [showBirthdayWish, setShowBirthdayWish] = useState(false);
    const [showColleagueBanner, setShowColleagueBanner] = useState(false);

    const todayDow = today.getDay();
    const lookAheadEnd = todayDow === 5
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
        : today;
    const birthdayQueryStart = localDateStr(today);
    const birthdayQueryEnd = localDateStr(lookAheadEnd);

    // Shares the same cache key as DashboardHeader — no extra network request
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

    const colleagueBirthdays: Array<{ userId: string; firstName: string; birthdayDate: string }> =
        (birthdayData?.data?.birthdays ?? []).filter(
            (b: { userId: string; birthdayDate: string }) =>
                isBirthdayObservedToday(b.birthdayDate) && String(b.userId) !== String(user?.id)
        );

    useEffect(() => {
        const checkVersion = async () => {
            try {
                const res = await fetch('/version.json', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                const latest: string = data.version;
                if (!latest) return;
                const lastSeen = localStorage.getItem(SEEN_VERSION_KEY);
                if (!lastSeen) {
                    localStorage.setItem(SEEN_VERSION_KEY, latest);
                } else if (lastSeen !== latest) {
                    setNewVersion(latest);
                    setShowVersionBanner(true);
                }
            } catch {
                // version.json absent in dev — silently skip
            }
        };
        checkVersion();
    }, []);

    useEffect(() => {
        if (!user) return;
        const dobDate = user.dob?.split('T')[0];
        const hasDob = dobDate && dobDate !== '0000-00-00';
        if (!hasDob) {
            const dismissedFor = localStorage.getItem(DISMISSED_BIRTHDAY_PROMPT_KEY);
            if (dismissedFor !== user.id) setShowBirthdayPrompt(true);
            return;
        }
        if (isTodayBirthday(user.dob)) {
            const dismissedOn = localStorage.getItem(DISMISSED_BIRTHDAY_WISH_KEY);
            if (dismissedOn !== today.toDateString()) setShowBirthdayWish(true);
        }
    }, [user]);

    useEffect(() => {
        if (colleagueBirthdays.length === 0) return;
        const dismissedOn = localStorage.getItem(DISMISSED_COLLEAGUE_WISH_KEY);
        if (dismissedOn !== today.toDateString()) setShowColleagueBanner(true);
    }, [birthdayData]);

    const handleRefresh = () => {
        if (newVersion) localStorage.setItem(SEEN_VERSION_KEY, newVersion);
        window.location.reload();
    };

    const handleDismissVersion = () => {
        if (newVersion) localStorage.setItem(SEEN_VERSION_KEY, newVersion);
        setShowVersionBanner(false);
    };

    const handleDismissBirthdayPrompt = () => {
        if (user) localStorage.setItem(DISMISSED_BIRTHDAY_PROMPT_KEY, user.id);
        setShowBirthdayPrompt(false);
    };

    const handleDismissBirthdayWish = () => {
        localStorage.setItem(DISMISSED_BIRTHDAY_WISH_KEY, today.toDateString());
        setShowBirthdayWish(false);
    };

    const handleDismissColleague = () => {
        localStorage.setItem(DISMISSED_COLLEAGUE_WISH_KEY, today.toDateString());
        setShowColleagueBanner(false);
    };

    if (!showVersionBanner && !showBirthdayPrompt && !showBirthdayWish && !showColleagueBanner) return null;

    return (
        <div className="relative z-20">
            {showVersionBanner && (
                <div className="flex items-center justify-between gap-3 bg-emerald-600 dark:bg-emerald-700 text-white px-6 py-2.5 text-sm">
                    <span>
                        A new version <span className="font-bold">v{newVersion}</span> has been deployed.
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-xs font-semibold transition-colors"
                        >
                            <RefreshCw size={12} />
                            Refresh now
                        </button>
                        <button onClick={handleDismissVersion} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {showBirthdayWish && (
                <div className="flex items-center justify-between gap-3 bg-pink-50 dark:bg-pink-900/30 border-b border-pink-200 dark:border-pink-700 text-pink-900 dark:text-pink-100 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                        <PartyPopper size={15} className="shrink-0 text-pink-500 dark:text-pink-400" />
                        <span>
                            Happy Birthday, {user?.firstName}!{' '}
                            <span className="font-medium">Wishing you a wonderful day from everyone at Disraptor.</span>
                        </span>
                    </div>
                    <button onClick={handleDismissBirthdayWish} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                        <X size={16} />
                    </button>
                </div>
            )}

            {showColleagueBanner && (
                <div className="flex items-center justify-between gap-3 bg-purple-50 dark:bg-purple-900/30 border-b border-purple-200 dark:border-purple-700 text-purple-900 dark:text-purple-100 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                        <Cake size={15} className="shrink-0 text-purple-500 dark:text-purple-400" />
                        <span>
                            Today is{' '}
                            <span className="font-semibold">
                                {formatColleagueNames(colleagueBirthdays.map(b => b.firstName))}'s
                            </span>{' '}
                            birthday — don't forget to wish {colleagueBirthdays.length === 1 ? 'them' : 'them all'} a happy day!
                        </span>
                    </div>
                    <button onClick={handleDismissColleague} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                        <X size={16} />
                    </button>
                </div>
            )}

            {showBirthdayPrompt && (
                <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-2.5 text-sm">
                    <div className="flex items-center gap-2">
                        <Cake size={15} className="shrink-0 text-amber-500 dark:text-amber-400" />
                        <span>
                            We'd love to celebrate your birthday!{' '}
                            <Link
                                to="/profile"
                                className="font-semibold underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                            >
                                Add your birthday to your profile
                            </Link>{' '}
                            so we don't miss your special day.
                        </span>
                    </div>
                    <button onClick={handleDismissBirthdayPrompt} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss">
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default AppBanners;
