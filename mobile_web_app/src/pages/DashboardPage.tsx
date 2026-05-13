import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import MobileCalendarCard, {
  type MobileCalendarEvent,
} from "@/components/dashboard/MobileCalendarCard";
import MobileDashboardHeader from "@/components/dashboard/MobileDashboardHeader";
import MobileStatCard from "@/components/dashboard/MobileStatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const quotes = [
  { text: "Keep momentum small and consistent.", author: "Daily focus" },
  { text: "Clarity beats intensity over a full month.", author: "Team reminder" },
  { text: "Ship the next useful step.", author: "LMS workflow" },
];

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

interface LeaveRequest {
  id: number;
  start_date: string;
  end_date: string;
  leave_type: string;
  duration: number;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Birthday {
  id: string;
  firstName: string;
  birthdayDate: string;
}

interface LeaveBalanceEntry {
  leave_type: string;
  leave_count: number;
}

interface DashboardStatCard {
  title: string;
  value: string;
  description: string;
  progress: number;
  icon: JSX.Element;
  accentClassName: string;
}

interface DashboardCalendarResponse {
  success: boolean;
  message: string;
  data: {
    leaveRequests: LeaveRequest[];
    birthdays: Birthday[];
  };
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const toSafeString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const toSafeLowerCase = (value: unknown, fallback = "unknown") =>
  String(value ?? fallback).toLowerCase();

const isValidDateInput = (value: unknown) => {
  if (!isNonEmptyString(value)) return false;
  return !Number.isNaN(new Date(value).getTime());
};

const isValidIsoDay = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const formatIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const enumerateIsoDates = (startDate: string, endDate: string) => {
  const MAX_RANGE_DAYS = 120;
  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
    return [];
  }

  const dates: string[] = [];
  const current = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  const end = new Date(`${endDate.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime()) || current > end) {
    return [];
  }

  let safetyCounter = 0;
  while (current <= end) {
    dates.push(formatIsoDate(current));
    current.setDate(current.getDate() + 1);
    safetyCounter += 1;

    if (safetyCounter > MAX_RANGE_DAYS) {
      break;
    }
  }

  return dates;
};

const getEventType = (
  request: LeaveRequest,
): MobileCalendarEvent["type"] => {
  const normalizedType = toSafeLowerCase(request?.leave_type, "general");
  const normalizedStatus = toSafeLowerCase(request?.status, "unknown");

  if (normalizedStatus === "pending") return "pending";
  if (normalizedType.includes("sick")) return "sick";
  if (normalizedType.includes("annual")) return "annual";
  return "team";
};

const formatRelativeTime = (dateString: string) => {
  if (!isValidDateInput(dateString)) {
    return "Recently";
  }

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
};

const normalizeLeaveType = (value: string) => value.trim().toLowerCase();

const getLeaveCountByAliases = (
  leaveCountMap: Map<string, number>,
  aliases: string[],
) => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeLeaveType(alias);
    if (leaveCountMap.has(normalizedAlias)) {
      return Number(leaveCountMap.get(normalizedAlias) ?? 0);
    }
  }

  return 0;
};

const getSafeLeaveBalanceEntries = (leaveData: unknown): LeaveBalanceEntry[] => {
  if (!Array.isArray(leaveData)) {
    return [];
  }

  return leaveData.filter(
    (entry): entry is LeaveBalanceEntry =>
      Boolean(entry) &&
      isNonEmptyString((entry as LeaveBalanceEntry).leave_type) &&
      typeof (entry as LeaveBalanceEntry).leave_count === "number",
  );
};

const DashboardPage = () => {
  const { user, authFetch } = useAuth();
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
  const statsUserInteractingRef = useRef(false);

  const startOfMonth = useMemo(
    () => formatIsoDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)),
    [currentMonth],
  );
  const endOfMonth = useMemo(
    () =>
      formatIsoDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)),
    [currentMonth],
  );

  const { data: calendarResponse } = useQuery({
    queryKey: ["mobileDashboardCalendar", startOfMonth, endOfMonth],
    queryFn: async () => {
      const response = await authFetch(
        `/leave/leave-calendar-with-birthdays?start_date=${startOfMonth}&end_date=${endOfMonth}`,
        { method: "GET" },
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: DashboardCalendarResponse = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to fetch dashboard calendar");
      }

      return result.data;
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: notificationsResponse, isLoading: notificationsLoading } =
    useNotifications({
      limit: 5,
      isArchived: false,
    });

  const leaveRequests = useMemo(
    () =>
      Array.isArray(calendarResponse?.leaveRequests)
        ? calendarResponse.leaveRequests.filter(
            (request): request is LeaveRequest =>
              Boolean(request) &&
              typeof request.id === "number" &&
              isNonEmptyString(request.email),
          )
        : [],
    [calendarResponse],
  );
  const birthdays = useMemo(
    () =>
      Array.isArray(calendarResponse?.birthdays)
        ? calendarResponse.birthdays.filter(
            (birthday): birthday is Birthday =>
              Boolean(birthday) &&
              isNonEmptyString(birthday.id) &&
              isValidDateInput(birthday.birthdayDate),
          )
        : [],
    [calendarResponse],
  );
  const todayIso = formatIsoDate(new Date());
  const userRole = user?.role === "admin" ? "admin" : "user";
  const ownRequests = useMemo(
    () =>
      leaveRequests.filter(
        (request) =>
          request.email?.toLowerCase() === user?.email?.toLowerCase(),
      ),
    [leaveRequests, user?.email],
  );

  const notificationItems = useMemo(() => {
    const notifications =
      Array.isArray(notificationsResponse?.data?.notifications)
        ? (notificationsResponse.data.notifications as DashboardNotification[])
        : [];

    return notifications
      .filter(
        (notification) =>
          Boolean(notification) &&
          isNonEmptyString(notification.id) &&
          typeof notification.isRead === "boolean" &&
          !notification.isRead,
      )
      .slice(0, 3)
      .map((notification) => ({
        id: toSafeString(notification.id, "notification"),
        title: toSafeString(notification.title, "Notification"),
        time: formatRelativeTime(toSafeString(notification.createdAt)),
        message: toSafeString(notification.message, "Open notifications to view details."),
      }));
  }, [notificationsResponse]);

  const statCards = useMemo<DashboardStatCard[]>(() => {
    const safeLeaveData = getSafeLeaveBalanceEntries(user?.leaveData);
    const leaveCountMap = new Map(
      safeLeaveData.map((leave) => [
        normalizeLeaveType(leave.leave_type),
        Number(leave.leave_count ?? 0),
      ]),
    );
    const annualLeaveTaken = getLeaveCountByAliases(leaveCountMap, [
      "Annual Leave",
    ]);
    const sickLeaveTaken = getLeaveCountByAliases(leaveCountMap, [
      "Sick Leave",
    ]);
    const annualLeaveEntitlement = getLeaveCountByAliases(leaveCountMap, [
      "Annual Leave Entitlement",
      "Annual Leave Allowance",
      "Annual Leave Total",
      "Total Annual Leave",
    ]);
    const annualLeaveRemainingFromData = getLeaveCountByAliases(leaveCountMap, [
      "Remaining Annual Leave",
      "Annual Leave Remaining",
      "Annual Leave Balance",
      "Annual Balance",
    ]);
    const remainingAnnualLeave =
      annualLeaveRemainingFromData > 0
        ? annualLeaveRemainingFromData
        : annualLeaveEntitlement > 0
          ? Math.max(annualLeaveEntitlement - annualLeaveTaken, 0)
          : 0;
    const pendingRequests =
      userRole === "admin"
        ? leaveRequests.filter((request) => toSafeLowerCase(request?.status) === "pending")
        : ownRequests.filter((request) => toSafeLowerCase(request?.status) === "pending");
    const approvedRequests =
      userRole === "admin"
        ? leaveRequests.filter((request) => toSafeLowerCase(request?.status) === "approved")
        : ownRequests.filter((request) => toSafeLowerCase(request?.status) === "approved");
    const teamAwayToday = leaveRequests.filter((request) => {
      if (toSafeLowerCase(request?.status) !== "approved") return false;
      return enumerateIsoDates(request.start_date, request.end_date).includes(todayIso);
    });

    return [
      {
        title: "Annual Leave",
        value: String(annualLeaveTaken),
        description: "Days taken so far",
        progress: Math.min(annualLeaveTaken * 10, 100),
        icon: <Plane className="h-4 w-4" />,
        accentClassName: "from-emerald-400 to-teal-500",
      },
      {
        title: "Sick Leave",
        value: String(sickLeaveTaken),
        description: "Days taken so far",
        progress: Math.min(sickLeaveTaken * 10, 100),
        icon: <Stethoscope className="h-4 w-4" />,
        accentClassName: "from-amber-400 to-orange-500",
      },
      {
        title: "Pending Requests",
        value: String(pendingRequests.length),
        description:
          userRole === "admin" ? "Requests awaiting review" : "Requests awaiting action",
        progress: Math.min(pendingRequests.length * 20, 100),
        icon: <Clock3 className="h-4 w-4" />,
        accentClassName: "from-sky-400 to-cyan-500",
      },
      {
        title: "Approved Requests",
        value: String(approvedRequests.length),
        description:
          userRole === "admin" ? "Approved this cycle" : "Your approved requests",
        progress: Math.min(approvedRequests.length * 15, 100),
        icon: <CheckCircle2 className="h-4 w-4" />,
        accentClassName: "from-lime-400 to-emerald-500",
      },
      {
        title: "Remaining Annual Leave",
        value: String(remainingAnnualLeave),
        description:
          annualLeaveEntitlement > 0 || annualLeaveRemainingFromData > 0
            ? "Annual leave still available"
            : "Annual balance unavailable",
        progress:
          annualLeaveEntitlement > 0
            ? Math.min((remainingAnnualLeave / annualLeaveEntitlement) * 100, 100)
            : 0,
        icon: <Plane className="h-4 w-4" />,
        accentClassName: "from-cyan-400 to-teal-500",
      },
      {
        title: "Team Away Today",
        value: String(teamAwayToday.length),
        description: "Approved leave active today",
        progress: Math.min(teamAwayToday.length * 15, 100),
        icon: <Users className="h-4 w-4" />,
        accentClassName: "from-pink-400 to-rose-500",
      },
    ];
  }, [leaveRequests, ownRequests, todayIso, user?.leaveData, userRole]);

  const loopedStatCards = useMemo(() => [...statCards, ...statCards], [statCards]);

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

      if (
        carousel.scrollLeft < paddingLeft ||
        carousel.scrollLeft > paddingLeft + loopWidth
      ) {
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

        if (!loopWidth) {
          frameId = window.requestAnimationFrame(step);
          return;
        }

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
  }, [prefersReducedMotion, loopedStatCards]);

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
    [currentTime],
  );

  const eventsByDate = useMemo(() => {
    const mappedEvents = new Map<string, MobileCalendarEvent[]>();

    leaveRequests.forEach((request) => {
      const eventType = getEventType(request);
      const fullName = `${toSafeString(request.firstName, "Team")} ${toSafeString(request.lastName)}`.trim();
      const eventTitle =
        eventType === "pending"
          ? `Pending: ${fullName}`
          : `${toSafeString(request.leave_type, "Leave")}: ${fullName}`;
      const eventTime =
        toSafeLowerCase(request?.status) === "pending"
          ? "Pending approval"
          : `${request.duration ?? 0} day${request.duration === 1 ? "" : "s"}`;

      enumerateIsoDates(request.start_date, request.end_date).forEach((isoDate) => {
        if (!isValidIsoDay(isoDate)) return;

        const dateEvents = mappedEvents.get(isoDate) ?? [];
        dateEvents.push({
          id: `${request.id}-${isoDate}`,
          title: eventTitle,
          type: eventType,
          date: isoDate,
          time: eventTime,
        });
        mappedEvents.set(isoDate, dateEvents);
      });
    });

    birthdays.forEach((birthday) => {
      const isoDate = birthday.birthdayDate.slice(0, 10);
      if (!isValidIsoDay(isoDate)) return;

      const dateEvents = mappedEvents.get(isoDate) ?? [];
      dateEvents.push({
        id: birthday.id,
        title: `Birthday: ${toSafeString(birthday.firstName, "Team member")}`,
        type: "team",
        date: isoDate,
        time: "Birthday reminder",
      });
      mappedEvents.set(isoDate, dateEvents);
    });

    return mappedEvents;
  }, [birthdays, leaveRequests]);

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
      const today = formatIsoDate(new Date());

      return {
        isoDate,
        dayNumber: date.getDate(),
        isCurrentMonth: date.getMonth() === currentMonth.getMonth(),
        isToday: isoDate === today,
        isSelected: isoDate === selectedDate,
        events: eventsByDate.get(isoDate) ?? [],
      };
    });
  }, [currentMonth, eventsByDate, selectedDate]);

  const selectedEvents = useMemo(
    () => eventsByDate.get(selectedDate) ?? [],
    [eventsByDate, selectedDate],
  );

  const selectedDateLabel = useMemo(
    () => {
      const parsedDate = new Date(`${selectedDate}T00:00:00`);
      if (Number.isNaN(parsedDate.getTime())) {
        return "Selected day";
      }

      return parsedDate.toLocaleDateString("en-ZA", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    },
    [selectedDate],
  );

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString("en-ZA", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth],
  );

  const nextAction = useMemo(() => {
    const pendingApprovals = leaveRequests.filter(
      (request) => toSafeLowerCase(request?.status) === "pending",
    );
    const ownPendingRequests = ownRequests.filter(
      (request) => toSafeLowerCase(request?.status) === "pending",
    );

    if (userRole === "admin" && pendingApprovals.length > 0) {
      return {
        title: "Keep approvals moving",
        body: `${pendingApprovals.length} leave request${pendingApprovals.length === 1 ? "" : "s"} need review. Open approvals to process the next request.`,
      };
    }

    if (ownPendingRequests.length > 0) {
      const nextPendingRequest = ownPendingRequests[0];
      return {
        title: "Track your pending leave",
        body: `Your ${toSafeString(nextPendingRequest.leave_type, "leave").toLowerCase()} request from ${toSafeString(nextPendingRequest.start_date).slice(0, 10) || "the selected dates"} is still awaiting approval.`,
      };
    }

    return {
      title: "Stay ahead of requests",
      body: "Review your team calendar or submit your next leave request when plans are confirmed.",
    };
  }, [leaveRequests, ownRequests, userRole]);

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

  const handleStatsCarouselPointerDown = () => {
    statsUserInteractingRef.current = true;
    pauseStatsCarousel();
  };

  const handleStatsCarouselPointerRelease = (delay = 1400) => {
    statsUserInteractingRef.current = false;
    resumeStatsCarousel(delay);
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

    if (statsUserInteractingRef.current) {
      resumeStatsCarousel(1800);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col pt-1">
      <MobileDashboardHeader
        formattedDateTime={formattedDateTime}
        onOpenNotifications={() => setShowNotifications((value) => !value)}
        quote={quote}
        leadingIcon={<Waves className="h-5 w-5" />}
      />

      {showNotifications && (
        <section className="mt-4 rounded-[1.6rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0d1627]/95 dark:shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
              Notifications
            </h2>
            <Link to="/notifications" className="text-xs font-medium text-cyan-300">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {notificationsLoading ? (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/8 dark:bg-white/6">
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  Loading notifications...
                </p>
              </div>
            ) : notificationItems.length > 0 ? (
              notificationItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/8 dark:bg-white/6"
                >
                  <p className="text-sm font-medium text-slate-950 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.message}
                  </p>
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    {item.time}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-3 dark:border-white/8 dark:bg-white/6">
                <p className="text-sm font-medium text-slate-950 dark:text-white">
                  You're all caught up
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  No unread notifications right now.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/55">
              Dashboard Snapshot
            </p>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Quick stats overview
            </h2>
          </div>
        </div>

        <div className="relative overflow-hidden px-4">
          <div
            ref={statsCarouselRef}
            className="flex snap-x snap-proximity gap-3 overflow-x-auto px-1 pb-2 pt-1 touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={pauseStatsCarousel}
            onMouseLeave={() => handleStatsCarouselPointerRelease(300)}
            onPointerDown={handleStatsCarouselPointerDown}
            onPointerUp={() => handleStatsCarouselPointerRelease()}
            onPointerCancel={() => handleStatsCarouselPointerRelease()}
            onTouchStart={handleStatsCarouselPointerDown}
            onTouchEnd={() => handleStatsCarouselPointerRelease()}
            onTouchCancel={() => handleStatsCarouselPointerRelease()}
            onWheel={() => {
              pauseStatsCarousel();
              resumeStatsCarousel(1800);
            }}
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
              (value) => new Date(value.getFullYear(), value.getMonth() - 1, 1),
            )
          }
          onNextMonth={() =>
            setCurrentMonth(
              (value) => new Date(value.getFullYear(), value.getMonth() + 1, 1),
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
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              {nextAction.title}
            </h2>
          </div>
          <CalendarClock className="h-5 w-5 text-cyan-300" />
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {nextAction.body}
        </p>
      </section>
    </div>
  );
};

export default DashboardPage;
