import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Plane,
  Stethoscope,
  Users,
  Waves,
} from "lucide-react";
import { Link } from "react-router-dom";
import MobileDashboardHeader from "@/components/dashboard/MobileDashboardHeader";
import MobileStatCard from "@/components/dashboard/MobileStatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

const quotes = [
  { text: "Keep momentum small and consistent.", author: "Daily focus" },
  {
    text: "Clarity beats intensity over a full month.",
    author: "Team reminder",
  },
  { text: "Ship the next useful step.", author: "LMS workflow" },
];

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
  };
}

interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: "available" | "on-leave" | "upcoming-leave" | string;
  avatar?: string;
  leaveType: string | null;
  leave_length: "half_day" | "full_day";
  leaveDates: string | null;
  startDate?: string;
  endDate?: string;
  duration?: number;
  department?: string;
  jobTitle?: string;
  upcomingLeaves?: {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
    leave_length: "half_day" | "full_day";
    status: string;
  }[];
}

interface TeamAvailabilityResponse {
  code: string;
  error: boolean;
  message: string;
  payload: {
    summary: string;
    teamMembers: TeamMember[];
  };
}

interface TeamActivityItem {
  id: string;
  employeeId: string;
  initials: string;
  name: string;
  role: string;
  leaveType: string;
  dateRange: string;
  duration: string;
  status: "On Leave" | "Upcoming";
  startDate: string;
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

  if (
    Number.isNaN(current.getTime()) ||
    Number.isNaN(end.getTime()) ||
    current > end
  ) {
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

const formatCompactDate = (value?: string) => {
  if (!isValidDateInput(value)) {
    return "Date pending";
  }

  return new Date(value).toLocaleDateString("en-ZA", {
    month: "short",
    day: "numeric",
  });
};

const formatCompactDateRange = (startDate?: string, endDate?: string) => {
  if (!isValidDateInput(startDate) || !isValidDateInput(endDate)) {
    return "Dates pending";
  }

  const formattedStartDate = formatCompactDate(startDate);
  const formattedEndDate = formatCompactDate(endDate);

  return formattedStartDate === formattedEndDate
    ? formattedStartDate
    : `${formattedStartDate} - ${formattedEndDate}`;
};

const formatLeaveDuration = (
  leaveLength: TeamMember["leave_length"],
  duration?: number,
) => {
  if (leaveLength === "half_day") {
    return "Half day";
  }

  const safeDuration = Number(duration ?? 0);
  return `${safeDuration} day${safeDuration === 1 ? "" : "s"}`;
};

const toIsoDayOrNull = (value?: string) => {
  if (!isValidDateInput(value)) {
    return null;
  }

  return formatIsoDate(new Date(value));
};

const buildTeamActivityDedupKey = (
  employeeId: string,
  startDate: string,
  leaveType: string,
) => `${employeeId}::${startDate}::${normalizeLeaveType(leaveType)}`;

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

const getSafeLeaveBalanceEntries = (
  leaveData: unknown,
): LeaveBalanceEntry[] => {
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
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [activeActivityTab, setActiveActivityTab] = useState<
    "On Leave" | "Upcoming"
  >("On Leave");
  const statsCarouselRef = useRef<HTMLDivElement | null>(null);
  const statsResumeTimeoutRef = useRef<number | null>(null);
  const statsCarouselPausedRef = useRef(false);
  const statsCarouselPaddingRef = useRef(0);
  const statsCarouselLoopWidthRef = useRef(0);
  const statsUserInteractingRef = useRef(false);
  const activityTouchStartXRef = useRef<number | null>(null);

  const startOfMonth = useMemo(
    () =>
      formatIsoDate(
        new Date(currentTime.getFullYear(), currentTime.getMonth(), 1),
      ),
    [currentTime],
  );
  const endOfMonth = useMemo(
    () =>
      formatIsoDate(
        new Date(currentTime.getFullYear(), currentTime.getMonth() + 1, 0),
      ),
    [currentTime],
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
    const notifications = Array.isArray(
      notificationsResponse?.data?.notifications,
    )
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
        message: toSafeString(
          notification.message,
          "Open notifications to view details.",
        ),
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
        ? leaveRequests.filter(
            (request) => toSafeLowerCase(request?.status) === "pending",
          )
        : ownRequests.filter(
            (request) => toSafeLowerCase(request?.status) === "pending",
          );
    const approvedRequests =
      userRole === "admin"
        ? leaveRequests.filter(
            (request) => toSafeLowerCase(request?.status) === "approved",
          )
        : ownRequests.filter(
            (request) => toSafeLowerCase(request?.status) === "approved",
          );
    const teamAwayToday = leaveRequests.filter((request) => {
      if (toSafeLowerCase(request?.status) !== "approved") return false;
      return enumerateIsoDates(request.start_date, request.end_date).includes(
        todayIso,
      );
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
          userRole === "admin"
            ? "Requests awaiting review"
            : "Requests awaiting action",
        progress: Math.min(pendingRequests.length * 20, 100),
        icon: <Clock3 className="h-4 w-4" />,
        accentClassName: "from-sky-400 to-cyan-500",
      },
      {
        title: "Approved Requests",
        value: String(approvedRequests.length),
        description:
          userRole === "admin"
            ? "Approved this cycle"
            : "Your approved requests",
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
            ? Math.min(
                (remainingAnnualLeave / annualLeaveEntitlement) * 100,
                100,
              )
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

  const loopedStatCards = useMemo(
    () => [...statCards, ...statCards],
    [statCards],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60000);
    return () => window.clearInterval(timer);
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

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["dashboardTeamAvailability"],
    queryFn: async () => {
      const params = new URLSearchParams();

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + 30);

      params.append("startDate", formatIsoDate(today));
      params.append("endDate", formatIsoDate(endDate));
      params.append("includeUpcoming", "true");

      const response = await authFetch(`/users/on-leave?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TeamAvailabilityResponse = await response.json();

      if (result.error) {
        throw new Error(result.message || "Failed to fetch team availability");
      }

      return Array.isArray(result.payload?.teamMembers)
        ? result.payload.teamMembers
        : [];
    },
    enabled: Boolean(user?.id),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const teamActivityBaseItems = useMemo(
    () =>
      teamMembers.map((member) => ({
        employeeId: member.id,
        initials:
          member.avatar ||
          member.name
            ?.split(" ")
            .map((part) => part.charAt(0))
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
          "TM",
        name: member.name,
        role: [member.department, member.jobTitle]
          .filter(isNonEmptyString)
          .join(" • "),
        member,
      })),
    [teamMembers],
  );

  const onLeaveItems = useMemo(() => {
    const dedupedItems = new Map<string, TeamActivityItem>();

    teamActivityBaseItems.forEach(
      ({ employeeId, initials, name, role, member }) => {
        if (
          !member.startDate ||
          !member.endDate ||
          !member.leaveType ||
          toSafeLowerCase(member.status) !== "on-leave"
        ) {
          return;
        }

        const startDate = toIsoDayOrNull(member.startDate);
        const endDate = toIsoDayOrNull(member.endDate);
        const leaveType = toSafeString(member.leaveType);

        if (!startDate || !endDate || !leaveType) {
          return;
        }

        const isApprovedCurrentLeave =
          todayIso >= startDate && todayIso <= endDate;
        if (!isApprovedCurrentLeave) {
          return;
        }

        const dedupKey = buildTeamActivityDedupKey(
          employeeId,
          startDate,
          leaveType,
        );

        if (dedupedItems.has(dedupKey)) {
          return;
        }

        dedupedItems.set(dedupKey, {
          id: dedupKey,
          employeeId,
          initials,
          name,
          role,
          leaveType,
          dateRange: formatCompactDateRange(member.startDate, member.endDate),
          duration: formatLeaveDuration(member.leave_length, member.duration),
          status: "On Leave",
          startDate,
        });
      },
    );

    return Array.from(dedupedItems.values())
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3);
  }, [teamActivityBaseItems, todayIso]);

  const upcomingItems = useMemo(() => {
    const onLeaveKeys = new Set(
      onLeaveItems.map((item) =>
        buildTeamActivityDedupKey(
          item.employeeId,
          item.startDate,
          item.leaveType,
        ),
      ),
    );
    const dedupedItems = new Map<string, TeamActivityItem>();

    teamActivityBaseItems.forEach(
      ({ employeeId, initials, name, role, member }) => {
        if (!Array.isArray(member.upcomingLeaves)) {
          return;
        }

        member.upcomingLeaves.forEach((leave) => {
          if (toSafeLowerCase(leave.status) !== "approved") {
            return;
          }

          const startDate = toIsoDayOrNull(leave.startDate);
          const endDate = toIsoDayOrNull(leave.endDate);
          const leaveType = toSafeString(leave.leaveType);

          if (!startDate || !endDate || !leaveType) {
            return;
          }

          const isCurrentlyActive = todayIso >= startDate && todayIso <= endDate;
          const isFutureLeave = startDate > todayIso;
          if (isCurrentlyActive || !isFutureLeave) {
            return;
          }

          const dedupKey = buildTeamActivityDedupKey(
            employeeId,
            startDate,
            leaveType,
          );

          if (onLeaveKeys.has(dedupKey) || dedupedItems.has(dedupKey)) {
            return;
          }

          dedupedItems.set(dedupKey, {
            id: dedupKey,
            employeeId,
            initials,
            name,
            role,
            leaveType,
            dateRange: formatCompactDateRange(leave.startDate, leave.endDate),
            duration: formatLeaveDuration(leave.leave_length, leave.duration),
            status: "Upcoming",
            startDate,
          });
        });
      },
    );

    return Array.from(dedupedItems.values())
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 3);
  }, [onLeaveItems, teamActivityBaseItems, todayIso]);

  const handleActivityTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    activityTouchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleActivityTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const startX = activityTouchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;

    activityTouchStartXRef.current = null;

    if (startX === null || typeof endX !== "number") {
      return;
    }

    const deltaX = endX - startX;
    const swipeThreshold = 48;

    if (Math.abs(deltaX) < swipeThreshold) {
      return;
    }

    const nextTab = deltaX < 0 ? "Upcoming" : "On Leave";
    if (nextTab !== activeActivityTab) {
      setActiveActivityTab(nextTab);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-0 pb-28 pt-1">
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
            <Link
              to="/notifications"
              className="text-xs font-medium text-cyan-300"
            >
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

      <section className="mt-5 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:shadow-[0_18px_48px_rgba(15,23,42,0.24)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-white/55">
              Team Activity
            </p>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Who&apos;s away
            </h2>
          </div>

          <Link
            to="/team-availability"
            className="shrink-0 rounded-full border border-cyan-400/35 bg-cyan-50/85 px-3 py-1.5 text-[11px] font-semibold text-cyan-700 shadow-sm dark:border-cyan-300/20 dark:bg-cyan-500/10 dark:text-cyan-200"
          >
            View team
          </Link>
        </div>

        <div className="relative mb-4 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200/70 bg-slate-100/90 p-1 shadow-inner dark:border-white/10 dark:bg-[#111c30]">
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc(50%-0.375rem)] rounded-[1rem] bg-gradient-to-r from-cyan-400 to-teal-500 shadow-[0_10px_30px_rgba(6,182,212,0.25)] transition-transform duration-300 ease-out will-change-transform dark:shadow-[0_12px_36px_rgba(8,145,178,0.32)] ${
              activeActivityTab === "On Leave"
                ? "translate-x-0"
                : "translate-x-full"
            }`}
          />
          {(["On Leave", "Upcoming"] as const).map((tab) => {
            const isActive = activeActivityTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveActivityTab(tab)}
                className={`relative z-10 rounded-[1rem] px-3 py-2 text-xs font-semibold transition-colors duration-300 ${
                  isActive
                    ? "text-white"
                    : "bg-white/80 text-slate-600 dark:bg-transparent dark:text-slate-300"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div
          className="overflow-hidden"
          onTouchStart={handleActivityTouchStart}
          onTouchEnd={handleActivityTouchEnd}
        >
          <div
            className={`flex w-full touch-pan-y transition-transform duration-300 ease-out ${
              prefersReducedMotion ? "" : "will-change-transform"
            } ${activeActivityTab === "On Leave" ? "translate-x-0" : "-translate-x-full"}`}
          >
            {([
              { tab: "On Leave" as const, items: onLeaveItems },
              { tab: "Upcoming" as const, items: upcomingItems },
            ] as const).map(({ tab, items }) => (
              <div key={tab} className="w-full shrink-0">
                {items.length > 0 ? (
                  <div className="space-y-2.5 pb-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-[#101b2e]"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 text-sm font-bold text-white">
                            {item.initials}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                                  {item.name}
                                </p>
                                {item.role ? (
                                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                    {item.role}
                                  </p>
                                ) : null}
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                  item.status === "On Leave"
                                    ? "bg-rose-500/15 text-rose-500 dark:text-rose-300"
                                    : "bg-amber-500/15 text-amber-600 dark:text-amber-300"
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                                {item.leaveType}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                              <span>{item.dateRange}</span>
                              <span className="text-slate-400">•</span>
                              <span>{item.duration}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {tab === "On Leave"
                        ? "No team members currently away."
                        : "No upcoming leave scheduled."}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
