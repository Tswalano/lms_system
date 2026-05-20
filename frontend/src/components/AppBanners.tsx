import { useState, useEffect, useRef, useMemo } from 'react';
import JSConfetti from 'js-confetti';
import { X, Cake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const DISMISSED_BIRTHDAY_PROMPT_KEY = 'dismissedBirthdayBanner';
const DISMISSED_BIRTHDAY_WISH_KEY = 'dismissedBirthdayWish';
const DISMISSED_COLLEAGUE_WISH_KEY = 'dismissedColleagueBirthdays';
const BIRTHDAY_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const CONFETTI_EMOJIS = ['🎉', '🎂', '🎈', '🥳', '🎁'];
const SHOW_CONFETTI_ON_EVERY_REFRESH_FOR_TESTING = import.meta.env.DEV;


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

const AppBanners: React.FC = () => {
    const { user, authFetch } = useAuth();
    const today = useMemo(() => new Date(), []);
    const jsConfettiRef = useRef<JSConfetti | null>(null);
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
    const isOwnBirthday = Boolean(user?.dob && isTodayBirthday(user.dob));
    const hasBirthdayCelebration = isOwnBirthday || colleagueBirthdays.length > 0;
    const shouldShowConfetti = hasBirthdayCelebration || SHOW_CONFETTI_ON_EVERY_REFRESH_FOR_TESTING;
    const hasVisibleBanner = shouldShowConfetti || showBirthdayPrompt || showBirthdayWish || showColleagueBanner;

    useEffect(() => {
        jsConfettiRef.current = new JSConfetti();

        return () => {
            jsConfettiRef.current?.clearCanvas();
            jsConfettiRef.current = null;
        };
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
    }, [today, user]);

    useEffect(() => {
        if (colleagueBirthdays.length === 0) return;
        const dismissedOn = localStorage.getItem(DISMISSED_COLLEAGUE_WISH_KEY);
        if (dismissedOn !== today.toDateString()) setShowColleagueBanner(true);
    }, [birthdayData, colleagueBirthdays.length, today]);

    useEffect(() => {
        if (!hasBirthdayCelebration) return;
        const intervalId = window.setInterval(() => {
            window.location.reload();
        }, BIRTHDAY_REFRESH_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [hasBirthdayCelebration]);

    useEffect(() => {
        if (!shouldShowConfetti || !jsConfettiRef.current) return;

        void jsConfettiRef.current.addConfetti({
            emojis: CONFETTI_EMOJIS,
            emojiSize: 36,
            confettiNumber: 50,
        });
    }, [shouldShowConfetti]);

    const handleDismissBirthdayPrompt = () => {
        if (user) localStorage.setItem(DISMISSED_BIRTHDAY_PROMPT_KEY, user.id);
        setShowBirthdayPrompt(false);
    };

    if (!hasVisibleBanner && !shouldShowConfetti) return null;

    return (
        <div className="relative w-18 z-20">
            {showBirthdayPrompt && (
                <div className="px-4 pt-4">
                    <div className="mx-auto w-full max-w-sm sm:max-w-4xl lg:max-w-6xl flex items-center justify-between gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-900 dark:text-amber-100 px-6 py-3 text-sm shadow-sm">
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

                        <button
                            onClick={handleDismissBirthdayPrompt}
                            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppBanners;
