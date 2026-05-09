import { useEffect, useMemo, useRef, useState } from "react";
import {
    CalendarClock,
    CheckCircle2,
    Clock3,
    Plane,
    Stethoscope,
    Users,
    Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import MobileCalendarCard, { type MobileCalendarEvent } from "@/components/dashboard/MobileCalendarCard";
import MobileDashboardHeader from "@/components/dashboard/MobileDashboardHeader";
import MobileStatCard from "@/components/dashboard/MobileStatCard";
import { useAuth } from "@/contexts/AuthContext";

const quotes = [
    { text: "Keep momentum small and consistent.", author: "Daily focus" },
    { text: "Clarity beats intensity over a full month.", author: "Team reminder" },
    { text: "Ship the next useful step.", author: "LMS workflow" },
];

const notificationItems = [
    { id: "n1", title: "2 leave requests need review", time: "5 min ago" },
    { id: "n2", title: "Performance review opens tomorrow", time: "1 hr ago" },
    { id: "n3", title: "Team calendar updated for May", time: "Today" },
];

const statCards = [
    {
        title: "Annual Leave",
        value: "12",
        description: "Used this year",
        progress: 60,
        icon: <Plane className="h-4 w-4" />,
        accentClassName: "from-emerald-400 to-teal-500",
    },
    {
        title: "Sick Leave",
        value: "3",
        description: "Taken so far",
        progress: 25,
        icon: <Stethoscope className="h-4 w-4" />,
        accentClassName: "from-amber-400 to-orange-500",
    },
    {
        title: "Pending",
        value: "2",
        description: "Awaiting action",
        progress: 40,
        icon: <Clock3 className="h-4 w-4" />,
        accentClassName: "from-sky-400 to-cyan-500",
    },
    {
        title: "Approved",
        value: "8",
        description: "Approved this cycle",
        progress: 82,
        icon: <CheckCircle2 className="h-4 w-4" />,
        accentClassName: "from-lime-400 to-emerald-500",
    },
    {
        title: "Team Away Today",
        value: "4",
        description: "Away right now",
        progress: 33,
        icon: <Users className="h-4 w-4" />,
        accentClassName: "from-pink-400 to-rose-500",
    },
];

const mockEvents: MobileCalendarEvent[] = [
    { id: "e1", title: "Annual leave: Sam D.", type: "annual", date: "2026-05-11", time: "All day" },
    { id: "e2", title: "Pending approval: You", type: "pending", date: "2026-05-12", time: "09:00" },
    { id: "e3", title: "Sick leave: Ayanda", type: "sick", date: "2026-05-14", time: "All day" },
    { id: "e4", title: "Team offsite", type: "team", date: "2026-05-18", time: "13:00" },
    { id: "e5", title: "Annual leave: Lerato", type: "annual", date: "2026-05-22", time: "All day" },
    { id: "e6", title: "Pending approval: David", type: "pending", date: "2026-05-22", time: "11:30" },
    { id: "e7", title: "Sick leave: Priya", type: "sick", date: "2026-05-28", time: "All day" },
];

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

const formatIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const DashboardPage = () => {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState(() => formatIsoDate(new Date()));
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const statsCarouselRef = useRef<HTMLDivElement | null>(null);
    const statsResumeTimeoutRef = useRef<number | null>(null);
    const statsCarouselPausedRef = useRef(false);
    const statsCarouselPaddingRef = useRef(0);
    const statsCarouselLoopWidthRef = useRef(0);

    const loopedStatCards = useMemo(() => [...statCards, ...statCards], []);

    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(new Date()), 60000);
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        const today = new Date();
        setCurrentTime(today);
        setSelectedDate(formatIsoDate(today));
    }, []);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

        updatePreference();
        mediaQuery.addEventListener("change", updatePreference);

        return () => mediaQuery.removeEventListener("change", updatePreference);
    }, []);

    useEffect(() => {
        const carousel = statsCarouselRef.current;
        if (!carousel) return;

        const setLoopMetrics = () => {
            const computedStyle = window.getComputedStyle(carousel);
            const paddingLeft = Number.parseFloat(computedStyle.paddingLeft || "0");
            const paddingRight = Number.parseFloat(computedStyle.paddingRight || "0");
            const totalHorizontalPadding = paddingLeft + paddingRight;
            const loopWidth = (carousel.scrollWidth - totalHorizontalPadding) / 2;

            statsCarouselPaddingRef.current = paddingLeft;
            statsCarouselLoopWidthRef.current = loopWidth;

            if (carousel.scrollLeft < paddingLeft || carousel.scrollLeft > paddingLeft + loopWidth) {
                carousel.scrollLeft = paddingLeft;
            }
        };

        setLoopMetrics();
        window.addEventListener("resize", setLoopMetrics);

        if (prefersReducedMotion) {
            return () => window.removeEventListener("resize", setLoopMetrics);
        }

        let frameId = 0;
        let lastFrameTime = 0;
        const pixelsPerMillisecond = 0.06;

        const step = (timestamp: number) => {
            if (!lastFrameTime) lastFrameTime = timestamp;
            const delta = timestamp - lastFrameTime;
            lastFrameTime = timestamp;

            if (!statsCarouselPausedRef.current) {
                const loopWidth = statsCarouselLoopWidthRef.current;
                const startOffset = statsCarouselPaddingRef.current;
                const endOffset = startOffset + loopWidth;

                carousel.scrollLeft += delta * pixelsPerMillisecond;

                if (carousel.scrollLeft >= endOffset) {
                    carousel.scrollLeft -= loopWidth;
                } else if (carousel.scrollLeft < startOffset) {
                    carousel.scrollLeft += loopWidth;
                }
            }

            frameId = window.requestAnimationFrame(step);
        };

        frameId = window.requestAnimationFrame(step);

        return () => {
            window.removeEventListener("resize", setLoopMetrics);
            window.cancelAnimationFrame(frameId);
        };
    }, [prefersReducedMotion]);

    useEffect(() => {
        return () => {
            if (statsResumeTimeoutRef.current) {
                window.clearTimeout(statsResumeTimeoutRef.current);
            }
        };
    }, []);

    const quote = useMemo(() => {
        const dayIndex = currentTime.getDate() % quotes.length;
        return quotes[dayIndex];
    }, [currentTime]);

    const formattedDateTime = useMemo(
        () =>
            currentTime.toLocaleString("en-ZA", {
                weekday: "short",
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
            }),
        [currentTime]
    );

    const calendarDays = useMemo(() => {
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        const leadingDays = start.getDay();
        const trailingDays = 6 - end.getDay();
        const firstGridDate = new Date(start);
        firstGridDate.setDate(start.getDate() - leadingDays);
        const totalDays = leadingDays + end.getDate() + trailingDays;

        return Array.from({ length: totalDays }, (_, index) => {
            const date = new Date(firstGridDate);
            date.setDate(firstGridDate.getDate() + index);
            const isoDate = formatIsoDate(date);
            const events = mockEvents.filter((event) => event.date === isoDate);
            const todayIso = formatIsoDate(new Date());

            return {
                isoDate,
                dayNumber: date.getDate(),
                isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
                isToday: isoDate === todayIso,
                isSelected: isoDate === selectedDate,
                events,
            };
        });
    }, [currentMonth, selectedDate]);

    const selectedEvents = useMemo(
        () => mockEvents.filter((event) => event.date === selectedDate),
        [selectedDate]
    );

    const selectedDateLabel = useMemo(
        () =>
            new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-ZA", {
                weekday: "long",
                day: "numeric",
                month: "long",
            }),
        [selectedDate]
    );

    const monthLabel = useMemo(
        () =>
            currentMonth.toLocaleDateString("en-ZA", {
                month: "long",
                year: "numeric",
            }),
        [currentMonth]
    );

    const pauseStatsCarousel = () => {
        if (statsResumeTimeoutRef.current) {
            window.clearTimeout(statsResumeTimeoutRef.current);
            statsResumeTimeoutRef.current = null;
        }
        statsCarouselPausedRef.current = true;
    };

    const resumeStatsCarousel = (delay = 1400) => {
        if (prefersReducedMotion) return;
        if (statsResumeTimeoutRef.current) {
            window.clearTimeout(statsResumeTimeoutRef.current);
        }
        statsResumeTimeoutRef.current = window.setTimeout(() => {
            statsCarouselPausedRef.current = false;
            statsResumeTimeoutRef.current = null;
        }, delay);
    };

    const handleStatsCarouselScroll = () => {
        const carousel = statsCarouselRef.current;
        if (!carousel) return;

        const loopWidth = statsCarouselLoopWidthRef.current;
        const startOffset = statsCarouselPaddingRef.current;
        const endOffset = startOffset + loopWidth;

        if (!loopWidth) return;

        if (carousel.scrollLeft >= endOffset) {
            carousel.scrollLeft -= loopWidth;
        } else if (carousel.scrollLeft < startOffset) {
            carousel.scrollLeft += loopWidth;
        }
    };

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-md flex-col pb-28 pt-1">
                <MobileDashboardHeader
                    formattedDateTime={formattedDateTime}
                    onOpenNotifications={() => setShowNotifications((value) => !value)}
                    quote={quote}
                    leadingIcon={<Waves className="h-5 w-5" />}
                />

                {showNotifications && (
                    <section className="mt-4 rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1627]/95 dark:shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">Notifications</h2>
                            <Link to="/notifications" className="text-xs font-medium text-cyan-300">
                                View all
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {notificationItems.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/8 dark:bg-white/6">
                                    <p className="text-sm font-medium text-slate-950 dark:text-white">{item.title}</p>
                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.time}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/55">
                                Dashboard Snapshot
                            </p>
                            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Quick stats overview</h2>
                        </div>
                    </div>

                    <div className="relative overflow-hidden px-4">
                        <div
                            ref={statsCarouselRef}
                            className="flex gap-3 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                            onMouseEnter={pauseStatsCarousel}
                            onMouseLeave={() => resumeStatsCarousel(300)}
                            onPointerDown={pauseStatsCarousel}
                            onPointerUp={() => resumeStatsCarousel()}
                            onPointerCancel={() => resumeStatsCarousel()}
                            onTouchStart={pauseStatsCarousel}
                            onTouchEnd={() => resumeStatsCarousel()}
                            onTouchCancel={() => resumeStatsCarousel()}
                            onScroll={handleStatsCarouselScroll}
                        >
                            {loopedStatCards.map((card, index) => (
                                <MobileStatCard key={`${card.title}-${index}`} {...card} />
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-5">
                    <MobileCalendarCard
                        monthLabel={monthLabel}
                        weekdays={weekdayLabels}
                        days={calendarDays}
                        selectedDateLabel={selectedDateLabel}
                        selectedEvents={selectedEvents}
                        onPreviousMonth={() =>
                            setCurrentMonth(
                                (value) => new Date(value.getFullYear(), value.getMonth() - 1, 1)
                            )
                        }
                        onNextMonth={() =>
                            setCurrentMonth(
                                (value) => new Date(value.getFullYear(), value.getMonth() + 1, 1)
                            )
                        }
                        onSelectDate={setSelectedDate}
                    />
                </section>

                <section className="mt-5 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/55">
                                Next action
                            </p>
                            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Keep requests moving</h2>
                        </div>
                        <CalendarClock className="h-5 w-5 text-cyan-300" />
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        Your pending leave request for 12 May needs manager approval. Open requests to review status or submit a new application.
                    </p>
                </section>
        </div>
    );
};

export default DashboardPage;
