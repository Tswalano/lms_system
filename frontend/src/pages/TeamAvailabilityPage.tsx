import { useState } from "react";
import { Search, RefreshCw, AlertCircle, Loader2, Users, UserCheck, UserX, Calendar as CalendarIcon, UserSearch, ChevronDown, ChevronRight, Clock, CheckCircle } from "lucide-react";
import { format, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

interface LeaveRequest {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
    leave_length: 'half_day' | 'full_day';
    status: 'approved' | 'pending' | 'rejected';
    reason?: string;
}

interface TeamMember {
    id: string;
    name: string;
    email: string;
    status: 'available' | 'on-leave' | 'upcoming-leave' | string;
    avatar: string;
    leaveType: string | null;
    leave_length: 'half_day' | 'full_day';
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
    payload: { summary: string, teamMembers: TeamMember[] };
}


const TeamAvailabilityPage = () => {
    const { authFetch } = useAuth();
    const [filter, setFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
        // Default to current month (30 days from today)
        const today = new Date();
        const endDate = addDays(today, 30);
        return { from: today, to: endDate };
    });
    const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Fetch team availability data with upcoming leaves
    const fetchTeamAvailability = async (): Promise<TeamMember[]> => {
        if (!token) throw new Error('Unauthorized');

        // Build query parameters - default to next 30 days
        const params = new URLSearchParams();
        const startDate = dateRange?.from || new Date();
        const endDate = dateRange?.to || addDays(new Date(), 30);

        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
        params.append('includeUpcoming', 'true'); // New parameter for upcoming leaves

        const url = `/users/on-leave?${params.toString()}`;

        const response = await authFetch(url, {
            method: 'GET',
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: ApiResponse = await response.json();

        console.log('API Response:', result);

        if (result.error) throw new Error(result.message || 'Failed to fetch team availability');

        const { teamMembers } = result.payload;

        // Process team members to determine their status based on upcoming leaves
        const processedMembers = teamMembers.map(member => {
            const today = new Date();
            const hasUpcomingLeaves = member.upcomingLeaves && member.upcomingLeaves.length > 0;

            // Determine status based on current and upcoming leaves
            let memberStatus = member.status;
            if (memberStatus === 'available' && hasUpcomingLeaves) {
                // Check if any upcoming leaves are starting soon (within next 7 days)
                const soonLeaves = member.upcomingLeaves?.filter(leave => {
                    const leaveStart = new Date(leave.startDate);
                    const daysDiff = Math.ceil((leaveStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    return daysDiff >= 0 && daysDiff <= 7;
                });

                if (soonLeaves && soonLeaves.length > 0) {
                    memberStatus = 'upcoming-leave';
                }
            }

            return {
                ...member,
                status: memberStatus,
                totalUpcomingLeaveDays: member.upcomingLeaves?.reduce((total, leave) => total + leave.duration, 0) || 0
            };
        });

        return processedMembers;
    };

    const { data: teamMembers = [], isLoading, error, refetch, isFetching } = useQuery({
        queryKey: ['teamAvailability', dateRange],
        queryFn: fetchTeamAvailability,
        staleTime: 5 * 60 * 1000,
        retry: 2,
    });

    // Filter team members based on date range
    const isWithinDateRange = (member: TeamMember): boolean => {
        if (!dateRange?.from && !dateRange?.to) return true;
        if (member.status === 'available' && (!member.upcomingLeaves || member.upcomingLeaves.length === 0)) return true;

        // Check current leave dates
        if (member.status === 'on-leave' && member.startDate && member.endDate) {
            const memberStart = new Date(member.startDate);
            const memberEnd = new Date(member.endDate);
            const filterStart = dateRange.from || new Date('1900-01-01');
            const filterEnd = dateRange.to || new Date('2100-12-31');

            if (memberStart <= filterEnd && memberEnd >= filterStart) {
                return true;
            }
        }

        // Check upcoming leave dates
        if (member.upcomingLeaves && member.upcomingLeaves.length > 0) {
            const filterStart = dateRange.from || new Date('1900-01-01');
            const filterEnd = dateRange.to || new Date('2100-12-31');

            return member.upcomingLeaves.some(leave => {
                const leaveStart = new Date(leave.startDate);
                const leaveEnd = new Date(leave.endDate);
                return leaveStart <= filterEnd && leaveEnd >= filterStart;
            });
        }

        return true;
    };

    const STATUS_SORT_ORDER: Record<string, number> = {
        'on-leave': 0,
        'upcoming-leave': 1,
        'available': 2,
    };

    const getNextLeaveDate = (member: TeamMember): number => {
        if (member.status === 'on-leave' && member.startDate) {
            return new Date(member.startDate).getTime();
        }
        if (member.upcomingLeaves && member.upcomingLeaves.length > 0) {
            return new Date(member.upcomingLeaves[0].startDate).getTime();
        }
        return Infinity;
    };

    // Filter team members based on search and status
    const filteredMembers = teamMembers
        .filter(member => {
            const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                member.email.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = filter === "all" || member.status === filter;
            const matchesDateRange = isWithinDateRange(member);

            return matchesSearch && matchesStatus && matchesDateRange;
        })
        .sort((a, b) => {
            const statusDiff = (STATUS_SORT_ORDER[a.status] ?? 3) - (STATUS_SORT_ORDER[b.status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return getNextLeaveDate(a) - getNextLeaveDate(b);
        });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
    };

    const clearDateRange = () => {
        // Reset to default 30 days
        const today = new Date();
        const endDate = addDays(today, 30);
        setDateRange({ from: today, to: endDate });
    };

    const applyQuickDateRange = (days: number) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        setDateRange({ from: today, to: futureDate });
    };

    const openMemberDetails = (memberId: string) => {
        if (expandedRow === memberId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(memberId);
        }
    };

    const getStatusConfig = (status: string, member: TeamMember) => {
        const statusLower = status.toLowerCase();
        const today = new Date();

        switch (statusLower) {
            case 'available':
                return {
                    indicator: 'bg-emerald-500',
                    background: 'bg-emerald-50 dark:bg-emerald-900/20',
                    text: 'text-emerald-800 dark:text-emerald-200',
                    icon: <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                    label: 'Available',
                    priority: 'low'
                };
            case 'on-leave': {
                const daysLeft = member.endDate ? Math.ceil((new Date(member.endDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                return {
                    indicator: 'bg-red-500',
                    background: 'bg-red-50 dark:bg-red-900/20',
                    text: 'text-red-800 dark:text-red-200',
                    icon: <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />,
                    label: 'On Leave',
                    description: daysLeft && daysLeft > 0 ? `Returns in ${daysLeft} day${daysLeft > 1 ? 's' : ''}` : 'Currently away',
                    priority: 'high'
                };
            }
            case 'upcoming-leave': {
                const upcomingSummary = getUpcomingLeavesSummary(member);
                const nextLeave = upcomingSummary?.nextLeave;
                const daysUntil = nextLeave ?
                    Math.ceil((new Date(nextLeave.startDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                return {
                    indicator: 'bg-amber-500',
                    background: 'bg-amber-50 dark:bg-amber-900/20',
                    text: 'text-amber-800 dark:text-amber-200',
                    icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
                    label: 'Upcoming Leave',
                    description: daysUntil ? `Going on leave in ${daysUntil} day${daysUntil > 1 ? 's' : ''}` : 'Leave scheduled',
                    priority: 'medium'
                };
            }
            default:
                return {
                    indicator: 'bg-gray-500',
                    background: 'bg-gray-50 dark:bg-gray-900/20',
                    text: 'text-gray-800 dark:text-gray-200',
                    icon: <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />,
                    label: status,
                    description: '',
                    priority: 'low'
                };
        }
    };

    const StatusDisplay = ({ member }: { member: TeamMember }) => {
        const config = getStatusConfig(member.status, member);
        const upcomingSummary = getUpcomingLeavesSummary(member);

        return (
            <div className="space-y-2">
                {/* Main Status */}
                <div className="flex items-center gap-3">
                    {/* Status Indicator Dot */}
                    <div className={`w-3 h-3 rounded-full ${config.indicator} flex-shrink-0`}></div>

                    {/* Status Content */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className={`p-1.5 rounded-md ${config.background}`}>
                            {config.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className={`font-medium text-sm ${config.text}`}>
                                {config.label}
                            </div>
                            {config.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {config.description}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Additional Context for Upcoming Leaves */}
                {member.status === 'upcoming-leave' && upcomingSummary && upcomingSummary.count > 1 && (
                    <div className="ml-6 pl-2 border-l-2 border-amber-200 dark:border-amber-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            +{upcomingSummary.count - 1} more leave{upcomingSummary.count > 2 ? 's' : ''} planned
                        </div>
                    </div>
                )}

                {/* Additional Context for Current Leave */}
                {member.status === 'on-leave' && member.leaveType && (
                    <div className="ml-6 pl-2 border-l-2 border-red-200 dark:border-red-800">
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                            {member.leaveType}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    };

    const getStatusCount = (status: string) => {
        if (status === 'all') return filteredMembers.length;
        return filteredMembers.filter(m => m.status === status).length;
    };

    const getUpcomingLeavesSummary = (member: TeamMember) => {
        if (!member.upcomingLeaves || member.upcomingLeaves.length === 0) return null;

        const nextLeave = member.upcomingLeaves[0]; // Assuming sorted by date
        const totalDays = member.totalUpcomingLeaveDays || 0;

        return {
            nextLeave,
            totalDays,
            count: member.upcomingLeaves.length
        };
    };

    // Helper function to get status label
    const getStatusLabel = (status: string): string => {
        const labels: { [key: string]: string } = {
            'available': 'Available',
            'on-leave': 'On Leave',
            'upcoming-leave': 'Upcoming Leave',
            'active': 'Active',
            'inactive': 'Inactive',
            'pending': 'Pending'
        };

        return labels[status] || 'Unknown';
    };

    // Statistics
    const availableCount = filteredMembers.filter(m => m.status === 'available').length;
    const onLeaveCount = filteredMembers.filter(m => m.status === 'on-leave').length;
    const upcomingLeaveCount = filteredMembers.filter(m => m.status === 'upcoming-leave').length;

    if (!token) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Unauthorized</h1>
                    <p className="text-gray-600 dark:text-gray-400">Please log in to view team availability.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                            <UserSearch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Team Availability</h1>
                            <p className="text-gray-600 dark:text-gray-400">View current status and upcoming leaves for the next 30 days</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600 transition-colors duration-200"
                            disabled={isFetching}
                        >
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button
                            onClick={() => setShowDateFilter(!showDateFilter)}
                            variant="outline"
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Date Filter
                        </Button>
                    </div>
                </div>

                {/* Date Range Filter */}
                {showDateFilter && (
                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Date Range Filter</h3>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-600 dark:text-gray-400">Date Range</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600",
                                                    !dateRange && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
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
                                                    <span className="text-gray-500 dark:text-gray-400">Pick a date range</span>
                                                )}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" align="start">
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
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickDateRange(7)}
                                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                >
                                    Next 7 Days
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickDateRange(14)}
                                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                >
                                    Next 14 Days
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickDateRange(30)}
                                    className="bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                >
                                    Next 30 Days (Current)
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => applyQuickDateRange(90)}
                                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                >
                                    Next 3 Months
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearDateRange}
                                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                >
                                    Reset to 30 Days
                                </Button>
                                {dateRange && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Viewing: {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : 'All dates'} to {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : 'All dates'}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="group relative bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400 hover:shadow-lg hover:bg-blue-50/30 dark:hover:bg-blue-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-blue-500/10 group-hover:scale-[2] group-hover:bg-blue-500/20 transition-all duration-500" />
                        <CardContent className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Members</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{filteredMembers.length}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">in selected period</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-emerald-500 dark:border-l-emerald-400 hover:shadow-lg hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-emerald-500/10 group-hover:scale-[2] group-hover:bg-emerald-500/20 transition-all duration-500" />
                        <CardContent className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Available</p>
                                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{availableCount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {filteredMembers.length > 0 ? Math.round((availableCount / filteredMembers.length) * 100) : 0}% of team
                                    </p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <UserCheck className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-red-500 dark:border-l-red-400 hover:shadow-lg hover:bg-red-50/30 dark:hover:bg-red-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-red-500/10 group-hover:scale-[2] group-hover:bg-red-500/20 transition-all duration-500" />
                        <CardContent className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">On Leave</p>
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{onLeaveCount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">currently away</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <UserX className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="group relative bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 overflow-hidden border-l-4 border-l-amber-500 dark:border-l-amber-400 hover:shadow-lg hover:bg-amber-50/30 dark:hover:bg-amber-900/10 hover:scale-[1.02] hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-amber-500/10 group-hover:scale-[2] group-hover:bg-amber-500/20 transition-all duration-500" />
                        <CardContent className="p-5 relative">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Upcoming</p>
                                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{upcomingLeaveCount}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">leave{upcomingLeaveCount !== 1 ? 's' : ''} scheduled</p>
                                </div>
                                <div className="w-11 h-11 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300">
                                    <Clock className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
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

                {/* Search Bar */}
                <div className="relative mb-6">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="text-gray-400 w-4 h-4 dark:text-gray-500" />
                    </div>
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Team Members Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">Loading team availability...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">Error loading team availability</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button
                                onClick={() => refetch()}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                                {filter === 'all' ? 'No team members found' : `No ${getStatusLabel(filter).toLowerCase()} team members found`}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {filter === 'all'
                                    ? 'Try adjusting your search or date range.'
                                    : `Try changing the filter to see other team members.`
                                }
                            </p>
                        </div>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-100 dark:border-slate-700">
                                <TableHead className="text-gray-700 dark:text-gray-300">Team Member</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Current/Next Leave</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Upcoming Leaves</TableHead>
                                <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMembers.map((member) => {
                                const upcomingSummary = getUpcomingLeavesSummary(member);

                                return (
                                    <>
                                        <TableRow
                                            key={member.id}
                                            className="border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"
                                        >
                                            <TableCell className="font-medium text-gray-800 dark:text-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-semibold text-sm">
                                                            {member.avatar}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusDisplay member={member} />
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {member.status === 'on-leave' && member.leaveType && member.startDate && member.endDate ? (
                                                    <div>
                                                        <div className="font-medium">{member.leaveType}</div>
                                                        <div className="text-sm">{formatDateRange(member.startDate, member.endDate)}</div>
                                                        {member.duration && (
                                                            <div className="text-xs text-gray-400">
                                                                {member.duration} day{member.duration > 1 ? 's' : ''}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : upcomingSummary && upcomingSummary.nextLeave ? (
                                                    <div>
                                                        <div className="font-medium text-orange-600 dark:text-orange-400">
                                                            {upcomingSummary.nextLeave.leaveType}
                                                        </div>
                                                        <div className="text-sm">
                                                            {formatDateRange(upcomingSummary.nextLeave.startDate, upcomingSummary.nextLeave.endDate)}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {upcomingSummary.nextLeave.duration} day{upcomingSummary.nextLeave.duration > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-gray-400">
                                                {upcomingSummary ? (
                                                    <div>
                                                        <div className="font-medium text-blue-600 dark:text-blue-400">
                                                            {upcomingSummary.count} leave{upcomingSummary.count > 1 ? 's' : ''} planned
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {upcomingSummary.totalDays} total day{upcomingSummary.totalDays > 1 ? 's' : ''}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">No upcoming leaves</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="px-6 py-4 whitespace-nowrap text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/40"
                                                    onClick={() => openMemberDetails(member.id)}
                                                >
                                                    {expandedRow === member.id ? (
                                                        <>
                                                            Hide Details <ChevronDown className="w-4 h-4" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            View Details <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </Button>
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded Row */}
                                        {expandedRow === member.id && (
                                            <TableRow className="border-0">
                                                <TableCell colSpan={5} className="p-0">
                                                    <div className={cn(
                                                        "border-l-4 px-6 py-6",
                                                        member.status === 'available' ? 'border-l-emerald-400 dark:border-l-emerald-300 bg-emerald-50/40 dark:bg-emerald-900/5' :
                                                        member.status === 'on-leave' ? 'border-l-red-400 dark:border-l-red-300 bg-red-50/40 dark:bg-red-900/5' :
                                                        'border-l-amber-400 dark:border-l-amber-300 bg-amber-50/40 dark:bg-amber-900/5'
                                                    )}>
                                                        {/* Member header inside expanded row */}
                                                        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-200/60 dark:border-slate-700/60">
                                                            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <span className="text-white font-semibold text-xs">{member.avatar}</span>
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{member.name}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.department || member.email}</p>
                                                            </div>
                                                            <div className={cn(
                                                                "ml-auto px-3 py-1 rounded-full text-xs font-medium",
                                                                member.status === 'available' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' :
                                                                member.status === 'on-leave' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                            )}>
                                                                {member.status === 'available' ? 'Available' : member.status === 'on-leave' ? 'On Leave' : 'Upcoming Leave'}
                                                            </div>
                                                        </div>

                                                        <div className={cn(
                                                            "grid gap-6",
                                                            (member.status === 'on-leave' || (member.status === 'upcoming-leave' && member.leaveType))
                                                                ? "grid-cols-1 lg:grid-cols-2"
                                                                : "grid-cols-1"
                                                        )}>
                                                            {/* Left: Status panel */}
                                                            <div className="space-y-3">
                                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Status</p>
                                                                {member.status === 'available' ? (
                                                                    <div className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                                                        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Available for Work</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ready to take on tasks and projects</p>
                                                                        </div>
                                                                    </div>
                                                                ) : member.status === 'on-leave' ? (
                                                                    <div className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-red-100 dark:border-red-900/30 shadow-sm">
                                                                        <div className="w-9 h-9 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                            <UserX className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Currently On Leave</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Temporarily unavailable for work</p>
                                                                            {member.currentLeave && (
                                                                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                                                    {member.currentLeave.leaveType} · {member.leaveDates}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-start gap-3 bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-100 dark:border-amber-900/30 shadow-sm">
                                                                        <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-semibold text-gray-900 dark:text-white text-sm">Upcoming Leave Scheduled</p>
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Available now but leave planned soon</p>
                                                                            {member.upcomingLeaves && member.upcomingLeaves.length > 0 && (
                                                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                                                    Next: {member.upcomingLeaves[0].leaveType} · {formatDate(member.upcomingLeaves[0].startDate)}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Employee info pills */}
                                                                {(member.jobTitle || member.department) && (
                                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                                        {member.jobTitle && (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                                                                                {member.jobTitle}
                                                                            </span>
                                                                        )}
                                                                        {member.department && (
                                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-400 shadow-sm">
                                                                                {member.department}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Right: Active/next leave detail */}
                                                            {(member.status === 'on-leave' || member.status === 'upcoming-leave') && member.leaveType && member.startDate && member.endDate && (
                                                                <div className="space-y-3">
                                                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                        {member.status === 'on-leave' ? 'Active Leave' : 'Next Leave'}
                                                                    </p>
                                                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                                                        <div className={cn(
                                                                            "h-1",
                                                                            member.status === 'on-leave' ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                                        )} />
                                                                        <div className="p-4 space-y-3">
                                                                            <div className="flex items-center justify-between">
                                                                                <p className="font-semibold text-gray-900 dark:text-white">{member.leaveType}</p>
                                                                                {member.duration && (
                                                                                    <Badge className={cn(
                                                                                        "text-xs",
                                                                                        member.status === 'on-leave'
                                                                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                                                    )}>
                                                                                        {member.duration} day{member.duration > 1 ? 's' : ''}{member.leave_length === 'half_day' ? ' (Half)' : ''}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="grid grid-cols-2 gap-2">
                                                                                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">From</p>
                                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(member.startDate)}</p>
                                                                                </div>
                                                                                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                                                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Until</p>
                                                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(member.endDate)}</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
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
                                    </>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default TeamAvailabilityPage;