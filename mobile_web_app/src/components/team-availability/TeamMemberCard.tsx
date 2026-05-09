import { Mail, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./types";
import { formatDateRange, getInitials, getMemberOverview, getStatusConfig } from "./helpers";

interface TeamMemberCardProps {
    member: TeamMember;
}

const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
    const statusConfig = getStatusConfig(member.status, member);
    const overview = getMemberOverview(member);
    const nextUpcomingLeave = member.upcomingLeaves?.[0];

    return (
        <article className={cn(
            "h-full rounded-[1.4rem] border border-slate-200/80 bg-white/85 p-4 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)] sm:p-5",
            `bg-gradient-to-br ${statusConfig.cardGlow}`
        )}>
            <div className="space-y-3">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                        {getInitials(member.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold leading-5 text-slate-950 dark:text-gray-100">{member.name}</p>
                                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                                    <Mail className="h-3.5 w-3.5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                            </div>

                            <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none ${statusConfig.badgeClassName}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClassName}`} />
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Leave Type</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-gray-100">{overview.nextLeaveType}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Days</p>
                        <p className="mt-1 text-sm font-medium text-slate-950 dark:text-gray-100">{overview.duration || 0} day{overview.duration === 1 ? "" : "s"}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-3 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" />
                        Leave Range
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-950 dark:text-gray-100">{overview.leaveRange}</p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-700/60 dark:text-slate-300">
                    <span>Upcoming leave count</span>
                    <span className="font-medium text-slate-950 dark:text-gray-100">{overview.upcomingCount}</span>
                </div>

                <div className="rounded-[1.1rem] border border-slate-200/80 bg-slate-50/95 px-3 py-3 dark:border-slate-700 dark:bg-slate-900/75">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Current / Next</p>
                            <p className="mt-1 line-clamp-2 text-xs text-slate-800 dark:text-slate-200">{statusConfig.description}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Upcoming Days</p>
                            <p className="mt-1 text-xs text-slate-800 dark:text-slate-200">{overview.totalUpcomingDays} day{overview.totalUpcomingDays === 1 ? "" : "s"}</p>
                        </div>
                    </div>

                    {(member.jobTitle || member.department) && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {member.jobTitle ? (
                                <span className="rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {member.jobTitle}
                                </span>
                            ) : null}
                            {member.department ? (
                                <span className="rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    {member.department}
                                </span>
                            ) : null}
                        </div>
                    )}

                    <div className="mt-2 rounded-2xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-800/80">
                        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Next Upcoming Leave</p>
                        {nextUpcomingLeave ? (
                            <div className="mt-1 flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-slate-950 dark:text-gray-100">{nextUpcomingLeave.leaveType}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                        {formatDateRange(nextUpcomingLeave.startDate, nextUpcomingLeave.endDate)}
                                    </p>
                                </div>
                                <span className="flex-shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                                    {nextUpcomingLeave.duration}d
                                </span>
                            </div>
                        ) : (
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">No upcoming leave scheduled</p>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
};

export default TeamMemberCard;
