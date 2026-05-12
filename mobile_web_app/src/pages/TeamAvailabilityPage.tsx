import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import {
    AlertCircle,
    Loader2,
    Search,
    UserSearch,
    Users,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import MobilePageHeader from "@/components/layout/MobilePageHeader";
import { useAuth } from "@/contexts/AuthContext";
import AvailabilityFilterChips from "@/components/team-availability/AvailabilityFilterChips";
import TeamMemberCard from "@/components/team-availability/TeamMemberCard";
import TeamStats from "@/components/team-availability/TeamStats";
import type { ApiResponse, TeamMember } from "@/components/team-availability/types";
import {
    STATUS_SORT_ORDER,
    getNextLeaveDate,
    getStatCards,
    getStatusLabel,
} from "@/components/team-availability/helpers";

const TeamAvailabilityPage = () => {
    const { authFetch } = useAuth();
    const [filter, setFilter] = useState<string>("on-leave");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        const today = new Date();
        const endDate = addDays(today, 30);
        return { from: today, to: endDate };
    });

    const token = localStorage.getItem("authToken");

    const fetchTeamAvailability = async (): Promise<TeamMember[]> => {
        if (!token) throw new Error("Unauthorized");

        const params = new URLSearchParams();
        const startDate = dateRange?.from || new Date();
        const endDate = dateRange?.to || addDays(new Date(), 30);

        params.append("startDate", format(startDate, "yyyy-MM-dd"));
        params.append("endDate", format(endDate, "yyyy-MM-dd"));
        params.append("includeUpcoming", "true");

        const response = await authFetch(`/users/on-leave?${params.toString()}`, { method: "GET" });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: ApiResponse = await response.json();
        if (result.error) throw new Error(result.message || "Failed to fetch team availability");

        const today = new Date();

        return result.payload.teamMembers.map((member) => {
            const hasUpcomingLeaves = member.upcomingLeaves && member.upcomingLeaves.length > 0;
            let memberStatus = member.status;

            if (memberStatus === "available" && hasUpcomingLeaves) {
                const soonLeaves = member.upcomingLeaves?.filter((leave) => {
                    const leaveStart = new Date(leave.startDate);
                    const daysDiff = Math.ceil((leaveStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysDiff >= 0 && daysDiff <= 7;
                });

                if (soonLeaves && soonLeaves.length > 0) {
                    memberStatus = "upcoming-leave";
                }
            }

            return {
                ...member,
                status: memberStatus,
                totalUpcomingLeaveDays: member.upcomingLeaves?.reduce((total, leave) => total + leave.duration, 0) || 0,
            };
        });
    };

    const { data: teamMembers = [], isLoading, error } = useQuery({
        queryKey: ["teamAvailability", dateRange],
        queryFn: fetchTeamAvailability,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    const isWithinDateRange = (member: TeamMember): boolean => {
        if (!dateRange?.from && !dateRange?.to) return true;
        if (member.status === "available" && (!member.upcomingLeaves || member.upcomingLeaves.length === 0)) return true;

        if (member.status === "on-leave" && member.startDate && member.endDate) {
            const memberStart = new Date(member.startDate);
            const memberEnd = new Date(member.endDate);
            const filterStart = dateRange.from || new Date("1900-01-01");
            const filterEnd = dateRange.to || new Date("2100-12-31");

            if (memberStart <= filterEnd && memberEnd >= filterStart) {
                return true;
            }
        }

        if (member.upcomingLeaves && member.upcomingLeaves.length > 0) {
            const filterStart = dateRange.from || new Date("1900-01-01");
            const filterEnd = dateRange.to || new Date("2100-12-31");

            return member.upcomingLeaves.some((leave) => {
                const leaveStart = new Date(leave.startDate);
                const leaveEnd = new Date(leave.endDate);
                return leaveStart <= filterEnd && leaveEnd >= filterStart;
            });
        }

        return true;
    };

    const visibleMembers = useMemo(
        () =>
            teamMembers
                .filter((member) => {
                    const matchesSearch =
                        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (member.jobTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (member.department || "").toLowerCase().includes(searchTerm.toLowerCase());

                    return matchesSearch && isWithinDateRange(member);
                })
                .sort((a, b) => {
                    const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 3) - (STATUS_SORT_ORDER[b.status] ?? 3);
                    if (statusDiff !== 0) return statusDiff;
                    return getNextLeaveDate(a) - getNextLeaveDate(b);
                }),
        [teamMembers, searchTerm, dateRange]
    );

    const filteredMembers = useMemo(
        () => visibleMembers.filter((member) => member.status === filter),
        [visibleMembers, filter]
    );

    const statCards = getStatCards(visibleMembers);

    const chipOptions = [
        { key: "on-leave", label: "On Leave", count: visibleMembers.filter((member) => member.status === "on-leave").length },
        { key: "upcoming-leave", label: "Upcoming", count: visibleMembers.filter((member) => member.status === "upcoming-leave").length },
    ];

    if (!token) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="mx-auto mb-4 h-16 w-16 text-rose-400" />
                    <h1 className="mb-2 text-2xl font-bold text-slate-950 dark:text-gray-100">Unauthorized</h1>
                    <p className="text-slate-600 dark:text-slate-400">Please log in to view team availability.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-2xl">
            <MobilePageHeader className="mb-4" />
            <section className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.10)] dark:border-slate-700 dark:bg-slate-800 md:p-5">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                        <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-slate-950 dark:text-gray-100 md:text-2xl">Team Availability</h1>
                        <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                            See who is currently away and who is due to go on leave soon.
                        </p>
                    </div>
                </div>

                <div className="mt-3">
                    <TeamStats stats={statCards} />
                </div>

                <div className="mt-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by name, role, department, or email..."
                            className="h-12 rounded-2xl border-slate-200 bg-white pl-11 text-slate-900 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <div className="mt-3">
                    <AvailabilityFilterChips options={chipOptions} activeFilter={filter} onChange={setFilter} />
                </div>
            </section>

            <div className="mt-6">
                {isLoading ? (
                    <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-slate-200/80 bg-white/85 dark:border-slate-700 dark:bg-slate-800">
                        <div className="text-center">
                            <Loader2 className="mx-auto h-10 w-10 animate-spin text-cyan-300" />
                            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Loading team availability...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-[1.5rem] border border-rose-400/15 bg-rose-500/10 p-6 text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-rose-300" />
                        <h2 className="mt-3 text-lg font-semibold text-slate-950 dark:text-gray-100">Unable to load team availability</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                            {error instanceof Error ? error.message : "An unexpected error occurred."}
                        </p>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/85 p-8 text-center dark:border-slate-700 dark:bg-slate-800">
                        <UserSearch className="mx-auto h-12 w-12 text-slate-500" />
                        <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-gray-100">
                            {`No ${getStatusLabel(filter).toLowerCase()} team members found`}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            Try adjusting your search or switching filters.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMembers.map((member) => (
                            <TeamMemberCard key={member.id} member={member} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamAvailabilityPage;
