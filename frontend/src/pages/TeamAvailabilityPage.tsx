import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Search,
  UserCheck,
  UserSearch,
  UserX,
  Users,
} from "lucide-react";
import { addDays, format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DateRange } from "react-day-picker";
import { useAuth } from "@/contexts/AuthContext";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import StatsCard from "@/components/ui/StatsCard";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/ui/Pagination";

interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  duration: number;
  leave_length: "half_day" | "full_day";
  status: "approved" | "pending" | "rejected";
  reason?: string;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: "available" | "on-leave" | "upcoming-leave" | string;
  avatar: string;
  leaveType: string | null;
  leave_length: "half_day" | "full_day";
  leaveDates: string | null;
  startDate?: string;
  endDate?: string;
  duration?: number;
  department?: string;
  jobTitle?: string;
  currentLeave?: LeaveRequest;
  upcomingLeaves?: LeaveRequest[];
  totalUpcomingLeaveDays?: number;
}

interface ApiResponse {
  code: string;
  error: boolean;
  message: string;
  payload: { summary: string; teamMembers: TeamMember[] };
}

const STATUS_SORT_ORDER: Record<string, number> = {
  "on-leave": 0,
  "upcoming-leave": 1,
  available: 2,
};

const TeamAvailabilityPage = () => {
  const { authFetch } = useAuth();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [activeMobileCard, setActiveMobileCard] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    return { from: today, to: addDays(today, 30) };
  });

  const queryClient = useQueryClient();
  const token: string | null = localStorage.getItem("authToken");

  const fetchTeamAvailability = async (): Promise<TeamMember[]> => {
    if (!token) throw new Error("Unauthorized");

    const params = new URLSearchParams();
    const startDate = dateRange?.from || new Date();
    const endDate = dateRange?.to || addDays(new Date(), 30);

    params.append("startDate", format(startDate, "yyyy-MM-dd"));
    params.append("endDate", format(endDate, "yyyy-MM-dd"));
    params.append("includeUpcoming", "true");

    const response = await authFetch(`/users/on-leave?${params.toString()}`, {
      method: "GET",
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const result: ApiResponse = await response.json();
    if (result.error)
      throw new Error(result.message || "Failed to fetch team availability");

    return result.payload.teamMembers.map((member) => {
      const today = new Date();
      const hasUpcomingLeaves =
        member.upcomingLeaves && member.upcomingLeaves.length > 0;
      let memberStatus = member.status;

      if (memberStatus === "available" && hasUpcomingLeaves) {
        const soonLeaves = member.upcomingLeaves?.filter((leave) => {
          const leaveStart = new Date(leave.startDate);
          const daysDiff = Math.ceil(
            (leaveStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
          );
          return daysDiff >= 0 && daysDiff <= 7;
        });

        if (soonLeaves && soonLeaves.length > 0) {
          memberStatus = "upcoming-leave";
        }
      }

      return {
        ...member,
        status: memberStatus,
        totalUpcomingLeaveDays:
          member.upcomingLeaves?.reduce(
            (total, leave) => total + leave.duration,
            0,
          ) || 0,
      };
    });
  };

  const {
    data: teamMembers = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["teamAvailability", dateRange],
    queryFn: fetchTeamAvailability,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const getUpcomingLeavesSummary = (member: TeamMember) => {
    if (!member.upcomingLeaves || member.upcomingLeaves.length === 0)
      return null;

    return {
      nextLeave: member.upcomingLeaves[0],
      totalDays: member.totalUpcomingLeaveDays || 0,
      count: member.upcomingLeaves.length,
    };
  };

  const isWithinDateRange = (member: TeamMember): boolean => {
    if (!dateRange?.from && !dateRange?.to) return true;
    if (
      member.status === "available" &&
      (!member.upcomingLeaves || member.upcomingLeaves.length === 0)
    )
      return true;

    const filterStart = dateRange.from || new Date("1900-01-01");
    const filterEnd = dateRange.to || new Date("2100-12-31");

    if (member.status === "on-leave" && member.startDate && member.endDate) {
      const memberStart = new Date(member.startDate);
      const memberEnd = new Date(member.endDate);
      if (memberStart <= filterEnd && memberEnd >= filterStart) return true;
    }

    if (member.upcomingLeaves && member.upcomingLeaves.length > 0) {
      return member.upcomingLeaves.some((leave) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return leaveStart <= filterEnd && leaveEnd >= filterStart;
      });
    }

    return true;
  };

  const getNextLeaveDate = (member: TeamMember): number => {
    if (member.status === "on-leave" && member.startDate)
      return new Date(member.startDate).getTime();
    if (member.upcomingLeaves && member.upcomingLeaves.length > 0)
      return new Date(member.upcomingLeaves[0].startDate).getTime();
    return Infinity;
  };

  const filteredMembers = teamMembers
    .filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filter === "all" || member.status === filter;
      return matchesSearch && matchesStatus && isWithinDateRange(member);
    })
    .sort((a, b) => {
      const statusDiff =
        (STATUS_SORT_ORDER[a.status] ?? 3) - (STATUS_SORT_ORDER[b.status] ?? 3);
      if (statusDiff !== 0) return statusDiff;
      return getNextLeaveDate(a) - getNextLeaveDate(b);
    });

  useEffect(() => {
    if (!filteredMembers.length) {
      setActiveMobileCard(0);
      return;
    }

    setActiveMobileCard((current) =>
      Math.min(current, filteredMembers.length - 1),
    );
  }, [filteredMembers.length]);

  useEffect(() => {
    if (!isMobile || filteredMembers.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveMobileCard((current) => (current + 1) % filteredMembers.length);
    }, 4500);

    return () => window.clearInterval(interval);
  }, [filteredMembers.length, isMobile]);

    const pagination = usePagination(filteredMembers, 5);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["teamAvailability"] });
  };

  const clearDateRange = () => {
    const today = new Date();
    setDateRange({ from: today, to: addDays(today, 30) });
  };

  const applyQuickDateRange = (days: number) => {
    const today = new Date();
    setDateRange({ from: today, to: addDays(today, days) });
  };

  const openMemberDetails = (memberId: string) => {
    setExpandedRow((current) => (current === memberId ? null : memberId));
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
  };

  const getStatusCount = (status: string) => {
    if (status === "all") return filteredMembers.length;
    return filteredMembers.filter((member) => member.status === status).length;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      available: "Available",
      "on-leave": "On Leave",
      "upcoming-leave": "Upcoming Leave",
      active: "Active",
      inactive: "Inactive",
      pending: "Pending",
    };

    return labels[status] || "Unknown";
  };

  const getStatusConfig = (status: string, member: TeamMember) => {
    const today = new Date();

    switch (status.toLowerCase()) {
      case "available":
        return {
          indicator: "bg-emerald-500",
          panel: "from-emerald-500/12 via-emerald-500/8 to-transparent",
          soft: "bg-emerald-50 dark:bg-emerald-950/40",
          border: "border-emerald-200/70 dark:border-emerald-900/60",
          text: "text-emerald-700 dark:text-emerald-300",
          icon: (
            <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ),
          label: "Available",
          description: "Open for meetings, handoffs, and work allocation.",
        };
      case "on-leave": {
        const daysLeft = member.endDate
          ? Math.ceil(
              (new Date(member.endDate).getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

        return {
          indicator: "bg-rose-500",
          panel: "from-rose-500/12 via-rose-500/8 to-transparent",
          soft: "bg-rose-50 dark:bg-rose-950/40",
          border: "border-rose-200/70 dark:border-rose-900/60",
          text: "text-rose-700 dark:text-rose-300",
          icon: <UserX className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
          label: "On Leave",
          description:
            daysLeft && daysLeft > 0
              ? `Returns in ${daysLeft} day${daysLeft > 1 ? "s" : ""}.`
              : "Currently away from work.",
        };
      }
      case "upcoming-leave": {
        const nextLeave = getUpcomingLeavesSummary(member)?.nextLeave;
        const daysUntil = nextLeave
          ? Math.ceil(
              (new Date(nextLeave.startDate).getTime() - today.getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null;

        return {
          indicator: "bg-amber-500",
          panel: "from-amber-500/12 via-amber-500/8 to-transparent",
          soft: "bg-amber-50 dark:bg-amber-950/40",
          border: "border-amber-200/70 dark:border-amber-900/60",
          text: "text-amber-700 dark:text-amber-300",
          icon: (
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          ),
          label: "Upcoming Leave",
          description:
            daysUntil !== null && daysUntil >= 0
              ? `Leave starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}.`
              : "Leave scheduled soon.",
        };
      }
      default:
        return {
          indicator: "bg-slate-500",
          panel: "from-slate-500/12 via-slate-500/8 to-transparent",
          soft: "bg-slate-50 dark:bg-slate-900/40",
          border: "border-slate-200/70 dark:border-slate-800/60",
          text: "text-slate-700 dark:text-slate-300",
          icon: (
            <Users className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          ),
          label: status,
          description: "",
        };
    }
  };

  const StatusDisplay = ({ member }: { member: TeamMember }) => {
    const config = getStatusConfig(member.status, member);
    const upcomingSummary = getUpcomingLeavesSummary(member);

    return (
      <div className="flex items-start gap-3">
        <div
          className={cn("mt-1 h-2.5 w-2.5 rounded-full", config.indicator)}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className={cn("rounded-xl p-2", config.soft)}>
              {config.icon}
            </div>
            <div>
              <p className={cn("text-sm font-semibold", config.text)}>
                {config.label}
              </p>
              {config.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {config.description}
                </p>
              )}
            </div>
          </div>
          {member.status === "upcoming-leave" &&
            upcomingSummary &&
            upcomingSummary.count > 1 && (
              <p className="mt-2 pl-4 text-xs text-gray-500 dark:text-gray-400">
                +{upcomingSummary.count - 1} more leave plan
                {upcomingSummary.count > 2 ? "s" : ""}
              </p>
            )}
        </div>
      </div>
    );
  };

  const LeaveBreakdown = ({ member }: { member: TeamMember }) => {
    const upcomingSummary = getUpcomingLeavesSummary(member);

    return (
      <div className="space-y-4">
        <div
          className={cn(
            "rounded-2xl border bg-gradient-to-br p-4",
            getStatusConfig(member.status, member).soft,
            getStatusConfig(member.status, member).border,
            `bg-gradient-to-br ${getStatusConfig(member.status, member).panel}`,
          )}
        >
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-sm font-semibold text-slate-900 shadow-sm dark:bg-slate-900/60 dark:text-white">
              {member.avatar}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {member.department || member.email}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "shrink-0 rounded-full border-0 px-3 py-1 text-xs font-medium",
                    getStatusConfig(member.status, member).soft,
                    getStatusConfig(member.status, member).text,
                  )}
                >
                  {getStatusConfig(member.status, member).label}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {member.jobTitle && (
                  <span className="rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-xs text-gray-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-gray-300">
                    {member.jobTitle}
                  </span>
                )}
                {member.department && (
                  <span className="rounded-full border border-white/60 bg-white/70 px-2.5 py-1 text-xs text-gray-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-gray-300">
                    {member.department}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Status
              </p>
              <div className="mt-2">
                <StatusDisplay member={member} />
              </div>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                {member.status === "on-leave" ? "Current Leave" : "Next Leave"}
              </p>
              {member.status === "on-leave" &&
              member.leaveType &&
              member.startDate &&
              member.endDate ? (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {member.leaveType}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDateRange(member.startDate, member.endDate)}
                  </p>
                  {member.duration && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {member.duration} day{member.duration > 1 ? "s" : ""}
                      {member.leave_length === "half_day" ? " · Half day" : ""}
                    </p>
                  )}
                </div>
              ) : upcomingSummary?.nextLeave ? (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {upcomingSummary.nextLeave.leaveType}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDateRange(
                      upcomingSummary.nextLeave.startDate,
                      upcomingSummary.nextLeave.endDate,
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {upcomingSummary.nextLeave.duration} day
                    {upcomingSummary.nextLeave.duration > 1 ? "s" : ""}
                    {upcomingSummary.nextLeave.leave_length === "half_day"
                      ? " · Half day"
                      : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  No leave scheduled in this range.
                </p>
              )}
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                Upcoming Queue
              </p>
              {upcomingSummary ? (
                <div className="mt-2 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {upcomingSummary.count} leave request
                    {upcomingSummary.count > 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {upcomingSummary.totalDays} total day
                    {upcomingSummary.totalDays > 1 ? "s" : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Nothing upcoming.
                </p>
              )}
            </div>
          </div>
        </div>

        {member.upcomingLeaves && member.upcomingLeaves.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {member.upcomingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <div
                  className={cn(
                    "h-1.5",
                    leave.status === "approved"
                      ? "bg-gradient-to-r from-emerald-500 to-green-500"
                      : leave.status === "pending"
                        ? "bg-gradient-to-r from-amber-400 to-yellow-400"
                        : "bg-gradient-to-r from-rose-500 to-red-500",
                  )}
                />
                <div className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {leave.leaveType}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {leave.duration} day{leave.duration > 1 ? "s" : ""}
                        {leave.leave_length === "half_day" ? " · Half day" : ""}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        "rounded-full border-0 text-xs",
                        leave.status === "approved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                          : leave.status === "pending"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
                      )}
                    >
                      {leave.status.charAt(0).toUpperCase() +
                        leave.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {formatDateRange(leave.startDate, leave.endDate)}
                  </div>
                  {leave.reason && (
                    <p className="mt-3 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-slate-700 dark:text-gray-400">
                      {leave.reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-8 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <CalendarIcon className="mx-auto mb-3 h-7 w-7 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No upcoming leaves in the selected period.
            </p>
          </div>
        )}
      </div>
    );
  };

  const availableCount = filteredMembers.filter(
    (member) => member.status === "available",
  ).length;
  const onLeaveCount = filteredMembers.filter(
    (member) => member.status === "on-leave",
  ).length;
  const upcomingLeaveCount = filteredMembers.filter(
    (member) => member.status === "upcoming-leave",
  ).length;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
          <h1 className="mb-2 text-2xl font-bold text-gray-800 dark:text-gray-200">
            Unauthorized
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to view team availability.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#f8fbff_38%,_#ecfeff_100%)] p-6 shadow-sm dark:border-cyan-950/60 dark:bg-[radial-gradient(circle_at_top_left,_rgba(6,182,212,0.2),_transparent_35%),linear-gradient(135deg,_rgba(15,23,42,1)_0%,_rgba(17,24,39,1)_42%,_rgba(8,47,73,0.95)_100%)] md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-blue-600 shadow-lg shadow-cyan-500/20">
              <UserSearch className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Team Availability
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 dark:text-slate-300 md:text-base">
              See who is available, who is out, and who has leave approaching.
              The layout adapts to cards on phone and rotates through the team
              automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="rounded-xl border-white/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-900"
              disabled={isFetching}
            >
              <RefreshCw
                className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")}
              />
              Refresh
            </Button>
            <Button
              onClick={() => setShowDateFilter((current) => !current)}
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {showDateFilter ? "Hide Date Filter" : "Date Filter"}
            </Button>
          </div>
        </div>
      </section>

      {showDateFilter && (
        <Card className="rounded-3xl border-gray-200/80 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <CardContent className="p-5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100 dark:bg-cyan-950/50">
                <CalendarIcon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Date range
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Change the time window for current and upcoming leave
                  visibility.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <div className="space-y-2">
                <Label className="text-gray-600 dark:text-gray-400">
                  Selected period
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start rounded-xl border-gray-200 bg-white text-left font-normal text-gray-800 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700",
                        !dateRange && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d, yyyy")} -{" "}
                            {format(dateRange.to, "MMM d, yyyy")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto border-gray-200 bg-white p-0 dark:border-slate-700 dark:bg-slate-800"
                    align="start"
                  >
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      initialFocus
                      className="bg-white dark:bg-slate-800"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={clearDateRange}
                className="rounded-xl border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700"
              >
                Reset to 30 Days
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[7, 14, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickDateRange(days)}
                  className={cn(
                    "rounded-full border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:hover:bg-slate-700",
                    days === 30 &&
                      "border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300",
                  )}
                >
                  {days === 90 ? "Next 3 Months" : `Next ${days} Days`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <StatsCard
                        label="Total Members"
                        value={filteredMembers.length}
                        subtitle="in selected period"
                        tone="blue"
                        icon={<Users className="w-5 h-5" />}
                    />
                    <StatsCard
                        label="Available"
                        value={availableCount}
                        subtitle={`${filteredMembers.length > 0 ? Math.round((availableCount / filteredMembers.length) * 100) : 0}% of team`}
                        tone="emerald"
                        icon={<UserCheck className="w-5 h-5" />}
                    />
                    <StatsCard
                        label="On Leave"
                        value={onLeaveCount}
                        subtitle="currently away"
                        tone="red"
                        icon={<UserX className="w-5 h-5" />}
                    />
                    <StatsCard
                        label="Upcoming"
                        value={upcomingLeaveCount}
                        subtitle={`leave${upcomingLeaveCount !== 1 ? 's' : ''} scheduled`}
                        tone="amber"
                        icon={<Clock className="w-5 h-5" />}
                    />
                </div>

                {/* Filter Dropdown */}
                <div className="flex items-center gap-3 mb-6">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger className="w-56 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                            <SelectItem value="all">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                                    All Members
                                    <span className="text-xs text-gray-400 ml-1">({getStatusCount('all')})</span>
                                </span>
                            </SelectItem>
                            <SelectItem value="available">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                    Available
                                    <span className="text-xs text-gray-400 ml-1">({getStatusCount('available')})</span>
                                </span>
                            </SelectItem>
                            <SelectItem value="on-leave">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                                    Currently On Leave
                                    <span className="text-xs text-gray-400 ml-1">({getStatusCount('on-leave')})</span>
                                </span>
                            </SelectItem>
                            <SelectItem value="upcoming-leave">
                                <span className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                                    Upcoming Leaves
                                    <span className="text-xs text-gray-400 ml-1">({getStatusCount('upcoming-leave')})</span>
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-medium text-gray-700 dark:text-gray-300">{filteredMembers.length}</span> member{filteredMembers.length !== 1 ? 's' : ''}
                    </p>
                </div>

              <div className="space-y-2">
                <Label className="text-gray-600 dark:text-gray-400">
                  Search
                </Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    className="rounded-xl border-gray-200 bg-white pl-10 text-gray-800 placeholder:text-gray-400 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-200 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Showing{" "}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredMembers.length}
              </span>{" "}
              member{filteredMembers.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-cyan-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading team availability...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <p className="mb-2 font-medium text-gray-800 dark:text-gray-200">
                Error loading team availability
              </p>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                {error instanceof Error
                  ? error.message
                  : "Something went wrong"}
              </p>
              <Button
                onClick={() => refetch()}
                className="bg-cyan-600 text-white hover:bg-cyan-700"
              >
                Try Again
              </Button>
            </div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="flex h-72 items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 font-medium text-gray-800 dark:text-gray-200">
                {filter === "all"
                  ? "No team members found"
                  : `No ${getStatusLabel(filter).toLowerCase()} team members found`}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filter === "all"
                  ? "Try adjusting your search or date range."
                  : "Try changing the filter to see other team members."}
              </p>
            </div>
          </div>
        ) : (
                    <>
          <>
            <div className="hidden md:block overflow-x-auto">
              <Table className="table-fixed min-w-[1120px]">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[24%]" />
                  <col className="w-[22%]" />
                  <col className="w-[14%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-gray-200 bg-slate-50/80 hover:bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:bg-slate-950/40">
                    <TableHead className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      Team Member
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      Current / Next Leave
                    </TableHead>
                    <TableHead className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      Upcoming
                    </TableHead>
                    <TableHead className="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.paginatedItems.map((member) => {
                    const upcomingSummary = getUpcomingLeavesSummary(member);
                    const isExpanded = expandedRow === member.id;

                    return (
                      <React.Fragment key={member.id}>
                        <TableRow className="border-gray-100 transition-colors hover:bg-cyan-50/40 dark:border-slate-800 dark:hover:bg-slate-800/70">
                          <TableCell className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-sm font-semibold text-white shadow-sm">
                                {member.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                                  {member.name}
                                </p>
                                <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                                  {member.email}
                                </p>
                                {(member.jobTitle || member.department) && (
                                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">
                                    {[member.jobTitle, member.department]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            <StatusDisplay member={member} />
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            {member.status === "on-leave" &&
                            member.leaveType &&
                            member.startDate &&
                            member.endDate ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {member.leaveType}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {formatDateRange(
                                    member.startDate,
                                    member.endDate,
                                  )}
                                </p>
                                {member.duration && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {member.duration} day
                                    {member.duration > 1 ? "s" : ""}
                                    {member.leave_length === "half_day"
                                      ? " · Half day"
                                      : ""}
                                  </p>
                                )}
                              </div>
                            ) : upcomingSummary?.nextLeave ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                  {upcomingSummary.nextLeave.leaveType}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  {formatDateRange(
                                    upcomingSummary.nextLeave.startDate,
                                    upcomingSummary.nextLeave.endDate,
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {upcomingSummary.nextLeave.duration} day
                                  {upcomingSummary.nextLeave.duration > 1
                                    ? "s"
                                    : ""}
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                No leave scheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-5">
                            {upcomingSummary ? (
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
                                  {upcomingSummary.count} request
                                  {upcomingSummary.count > 1 ? "s" : ""}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {upcomingSummary.totalDays} day
                                  {upcomingSummary.totalDays > 1
                                    ? "s"
                                    : ""}{" "}
                                  planned
                                </p>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">
                                None
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-5 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openMemberDetails(member.id)}
                              className="rounded-xl text-gray-600 hover:bg-cyan-50 hover:text-cyan-700 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                            >
                              {isExpanded ? (
                                <ChevronDown className="mr-1 h-4 w-4" />
                              ) : (
                                <ChevronRight className="mr-1 h-4 w-4" />
                              )}
                              {isExpanded ? "Less" : "View"}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="border-gray-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                            <TableCell colSpan={5} className="px-6 py-6">
                              <LeaveBreakdown member={member} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden">
              <div className="border-b border-gray-200 bg-slate-50/80 px-5 py-4 dark:border-slate-700 dark:bg-slate-950/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      Mobile Card View
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Auto-rotates every few seconds. Tap dots to jump.
                    </p>
                  </div>
                  <Badge className="rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">
                    {activeMobileCard + 1} / {filteredMembers.length}
                  </Badge>
                </div>
              </div>

                                                        {/* Upcoming Leaves Timeline */}
                                                        {member.upcomingLeaves && member.upcomingLeaves.length > 0 && (
                                                            <div className="mt-6 space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                        Upcoming Leaves
                                                                    </p>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2 py-0.5 rounded-full shadow-sm">
                                                                        {member.upcomingLeaves.length} leave{member.upcomingLeaves.length !== 1 ? 's' : ''} · {member.totalUpcomingLeaveDays} day{(member.totalUpcomingLeaveDays || 0) > 1 ? 's' : ''} total
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                                                    {member.upcomingLeaves.map((leave) => (
                                                                        <div key={leave.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                                                            <div className={cn(
                                                                                "h-1",
                                                                                leave.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                                                                                    leave.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                                                                                        'bg-gradient-to-r from-red-400 to-rose-400'
                                                                            )} />
                                                                            <div className="p-4">
                                                                                <div className="flex items-start justify-between mb-3">
                                                                                    <div>
                                                                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{leave.leaveType}</p>
                                                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                                                            {leave.duration} day{leave.duration > 1 ? 's' : ''}{leave.leave_length === 'half_day' ? ' (Half)' : ''}
                                                                                        </p>
                                                                                    </div>
                                                                                    <Badge className={cn(
                                                                                        "text-xs",
                                                                                        leave.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                                                            leave.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                                                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                                    )}>
                                                                                        {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                                                                                    </Badge>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                                                    <CalendarIcon className="w-3 h-3" />
                                                                                    {formatDateRange(leave.startDate, leave.endDate)}
                                                                                </div>
                                                                                {leave.reason && (
                                                                                    <p className="mt-2 pt-2 border-t border-gray-100 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                                                                                        {leave.reason}
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* No upcoming leaves */}
                                                        {(!member.upcomingLeaves || member.upcomingLeaves.length === 0) && member.status !== 'on-leave' && (
                                                            <div className="mt-5 text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                                                                <CalendarIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming leaves in the selected period</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment >
                                );
                            })}
                        </TableBody>
                    </Table>
                    <Pagination
                        currentPage={pagination.page}
                        totalPages={pagination.totalPages}
                        pageSize={pagination.pageSize}
                        totalItems={pagination.totalItems}
                        onPageChange={pagination.setPage}
                        onPageSizeChange={pagination.setPageSize}
                        pageSizeOptions={[5, 10, 15, 20, 50]}
                    />
                    </>
                )}
            </div>
        </div>
    );
};

export default TeamAvailabilityPage;
