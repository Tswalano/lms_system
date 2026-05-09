import React from "react";
import { ChevronDown, ChevronRight, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamMember } from "./types";
import { formatDateRange, getInitials, getMemberOverview, getStatusConfig } from "./helpers";

const TeamMemberTable = ({
    members,
    expandedRow,
    onToggle,
}: {
    members: TeamMember[];
    expandedRow: string | null;
    onToggle: (memberId: string) => void;
}) => {
    return (
        <div className="hidden overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/90 shadow-[0_18px_48px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_18px_48px_rgba(2,6,23,0.28)] md:block">
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-200/80 hover:bg-transparent dark:border-slate-700">
                        <TableHead className="text-slate-600 dark:text-slate-300">Member</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300">Leave Type</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300">Range</TableHead>
                        <TableHead className="text-slate-600 dark:text-slate-300">Upcoming</TableHead>
                        <TableHead className="text-right text-slate-600 dark:text-slate-300">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map((member) => {
                        const isExpanded = expandedRow === member.id;
                        const statusConfig = getStatusConfig(member.status, member);
                        const overview = getMemberOverview(member);

                        return (
                            <React.Fragment key={member.id}>
                                <TableRow className="border-slate-200/80 hover:bg-slate-50/90 dark:border-slate-700 dark:hover:bg-slate-700/40">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                                                {getInitials(member.name)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-950 dark:text-gray-100">{member.name}</p>
                                                <div className="mt-1 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    {member.email}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusConfig.badgeClassName}`}>
                                            <span className={`h-2 w-2 rounded-full ${statusConfig.dotClassName}`} />
                                            {statusConfig.label}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-slate-950 dark:text-gray-100">{overview.nextLeaveType}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{overview.leaveRange}</TableCell>
                                    <TableCell className="text-slate-600 dark:text-slate-300">{overview.upcomingCount}</TableCell>
                                    <TableCell className="text-right">
                                        <button
                                            type="button"
                                            onClick={() => onToggle(member.id)}
                                            className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/12 px-3 py-2 text-sm font-medium text-cyan-100"
                                        >
                                            View Details
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    </TableCell>
                                </TableRow>
                                {isExpanded ? (
                                    <TableRow className="border-slate-200/80 bg-slate-50/95 dark:border-slate-700 dark:bg-slate-900/70">
                                        <TableCell colSpan={6}>
                                            <div className="grid gap-4 lg:grid-cols-3">
                                                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/80">
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Current / Next Leave</p>
                                                    <p className="mt-2 font-medium text-slate-950 dark:text-gray-100">{overview.nextLeaveType}</p>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{overview.leaveRange}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/80">
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Leave Summary</p>
                                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{overview.duration} day{overview.duration === 1 ? "" : "s"} primary leave</p>
                                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{overview.totalUpcomingDays} upcoming day{overview.totalUpcomingDays === 1 ? "" : "s"}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/80">
                                                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Profile</p>
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {member.jobTitle ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{member.jobTitle}</Badge> : null}
                                                        {member.department ? <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{member.department}</Badge> : null}
                                                    </div>
                                                </div>
                                            </div>

                                            {member.upcomingLeaves && member.upcomingLeaves.length > 0 ? (
                                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                                    {member.upcomingLeaves.map((leave) => (
                                                        <div key={leave.id} className={cn("rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/80")}>
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="font-medium text-slate-950 dark:text-gray-100">{leave.leaveType}</p>
                                                                <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">{leave.duration} day{leave.duration === 1 ? "" : "s"}</Badge>
                                                            </div>
                                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{formatDateRange(leave.startDate, leave.endDate)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};

export default TeamMemberTable;
