import { Clock, UserX, Users } from "lucide-react";
import { format } from "date-fns";
import type { LeaveRequest, TeamMember } from "./types";

export const STATUS_SORT_ORDER: Record<string, number> = {
    "on-leave": 0,
    "upcoming-leave": 1,
    available: 2,
};

export const getInitials = (name: string) =>
    name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");

export const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

export const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
};

export const getStatusLabel = (status: string): string => {
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

export const getUpcomingLeavesSummary = (member: TeamMember) => {
    if (!member.upcomingLeaves || member.upcomingLeaves.length === 0) return null;

    const nextLeave = member.upcomingLeaves[0];
    const totalDays = member.totalUpcomingLeaveDays || 0;

    return {
        nextLeave,
        totalDays,
        count: member.upcomingLeaves.length,
    };
};

export const getNextLeaveDate = (member: TeamMember): number => {
    if (member.status === "on-leave" && member.startDate) {
        return new Date(member.startDate).getTime();
    }
    if (member.upcomingLeaves && member.upcomingLeaves.length > 0) {
        return new Date(member.upcomingLeaves[0].startDate).getTime();
    }
    return Infinity;
};

export const getStatusConfig = (status: string, member: TeamMember) => {
    const today = new Date();

    switch (status.toLowerCase()) {
        case "available":
            return {
                badgeClassName: "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/15 dark:text-emerald-300",
                cardGlow: "from-emerald-500/14 to-teal-500/8",
                dotClassName: "bg-emerald-500 dark:bg-emerald-400",
                icon: <UserCheck className="h-4 w-4 text-emerald-700 dark:text-emerald-300" />,
                label: "Available",
                description: "Ready for work",
            };
        case "on-leave": {
            const daysLeft = member.endDate
                ? Math.ceil((new Date(member.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                : null;
            return {
                badgeClassName: "border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/15 dark:text-rose-300",
                cardGlow: "from-rose-500/14 to-orange-500/8",
                dotClassName: "bg-rose-500 dark:bg-rose-400",
                icon: <UserX className="h-4 w-4 text-rose-700 dark:text-rose-300" />,
                label: "On Leave",
                description: daysLeft && daysLeft > 0 ? `Returns in ${daysLeft} day${daysLeft > 1 ? "s" : ""}` : "Currently away",
            };
        }
        case "upcoming-leave": {
            const upcomingSummary = getUpcomingLeavesSummary(member);
            const nextLeave = upcomingSummary?.nextLeave;
            const daysUntil = nextLeave
                ? Math.ceil((new Date(nextLeave.startDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                : null;
            return {
                badgeClassName: "border border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/15 dark:text-amber-200",
                cardGlow: "from-amber-500/14 to-yellow-500/8",
                dotClassName: "bg-amber-500 dark:bg-amber-300",
                icon: <Clock className="h-4 w-4 text-amber-700 dark:text-amber-200" />,
                label: "Upcoming Leave",
                description: daysUntil ? `Starts in ${daysUntil} day${daysUntil > 1 ? "s" : ""}` : "Leave scheduled",
            };
        }
        default:
            return {
                badgeClassName: "border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-400/20 dark:bg-slate-500/15 dark:text-slate-200",
                cardGlow: "from-slate-500/14 to-slate-600/8",
                dotClassName: "bg-slate-500 dark:bg-slate-400",
                icon: <Users className="h-4 w-4 text-slate-700 dark:text-slate-200" />,
                label: status,
                description: "Status unavailable",
            };
    }
};

export const getPrimaryLeave = (member: TeamMember): LeaveRequest | null => {
    if (member.status === "on-leave" && member.currentLeave) return member.currentLeave;
    if (member.upcomingLeaves && member.upcomingLeaves.length > 0) return member.upcomingLeaves[0];
    return null;
};

export const getMemberOverview = (member: TeamMember) => {
    const primaryLeave = getPrimaryLeave(member);
    const summary = getUpcomingLeavesSummary(member);

    return {
        primaryLeave,
        nextLeaveType: primaryLeave?.leaveType || member.leaveType || "No leave scheduled",
        leaveRange:
            primaryLeave && primaryLeave.startDate && primaryLeave.endDate
                ? formatDateRange(primaryLeave.startDate, primaryLeave.endDate)
                : member.leaveDates || "No leave dates",
        duration:
            primaryLeave?.duration || member.duration || 0,
        upcomingCount: summary?.count || 0,
        totalUpcomingDays: summary?.totalDays || 0,
    };
};

export const getStatCards = (teamMembers: TeamMember[]) => {
    const onLeaveCount = teamMembers.filter((member) => member.status === "on-leave").length;
    const upcomingLeaveCount = teamMembers.filter((member) => member.status === "upcoming-leave").length;

    return [
        {
            title: "Team Members",
            value: String(teamMembers.length),
            description: "Shown in this list",
            icon: <Users className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />,
            iconBadgeClassName: "bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300",
        },
        {
            title: "On Leave",
            value: String(onLeaveCount),
            description: "Currently away",
            icon: <UserX className="h-5 w-5 text-rose-700 dark:text-rose-300" />,
            iconBadgeClassName: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
        },
        {
            title: "Upcoming",
            value: String(upcomingLeaveCount),
            description: "Starting soon",
            icon: <Clock className="h-5 w-5 text-amber-700 dark:text-amber-300" />,
            iconBadgeClassName: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
        },
    ];
};
