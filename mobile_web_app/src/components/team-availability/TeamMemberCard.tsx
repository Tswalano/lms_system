import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./types";
import { formatDateRange, getInitials, getMemberOverview, getStatusConfig } from "./helpers";

interface TeamMemberCardProps {
    member: TeamMember;
}

const TeamMemberCard = ({ member }: TeamMemberCardProps) => {
    const statusConfig = getStatusConfig(member.status, member);
    const overview = getMemberOverview(member);
    const detailLabel = member.department && member.jobTitle
        ? `${member.department} • ${member.jobTitle}`
        : member.department || member.jobTitle || member.email;

    return (
        <article className={cn(
            "rounded-[1.35rem] border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-800 sm:p-5",
            `bg-gradient-to-br ${statusConfig.cardGlow}`
        )}>
            <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-900 ring-1 ring-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:ring-0">
                        {getInitials(member.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-semibold leading-5 text-slate-950 dark:text-gray-100">{member.name}</p>
                                <p className="mt-1 text-xs leading-4 text-slate-600 dark:text-slate-400">
                                    {detailLabel}
                                </p>
                            </div>

                            <span className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium leading-none ${statusConfig.badgeClassName}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClassName}`} />
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Leave Type</p>
                        <p className="mt-1 truncate text-sm font-medium text-slate-950 dark:text-gray-100">{overview.nextLeaveType}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">Duration</p>
                        <p className="mt-1 whitespace-nowrap text-sm font-medium text-slate-950 dark:text-gray-100">{overview.duration || 0} day{overview.duration === 1 ? "" : "s"}</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 dark:border-slate-700 dark:bg-slate-900/70">
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-600 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        Leave Range
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-950 dark:text-gray-100">{overview.leaveRange}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{statusConfig.description}</p>
                </div>
            </div>
        </article>
    );
};

export default TeamMemberCard;
