import { useState } from "react";
import { Filter, Search, RefreshCw, AlertCircle, Loader2, Users, UserCheck, UserX, Calendar as CalendarIcon, UserSearch } from "lucide-react";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import DashboardHeader from "@/components/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import type { DateRange } from "react-day-picker";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    status: 'available' | 'on-leave' | string;
    avatar: string;
    leaveType: string | null;
    leaveDates: string | null;
    startDate?: string;
    endDate?: string;
    duration?: number;
    department?: string;
    jobTitle?: string;
}

interface ApiResponse {
    code: string;
    error: boolean;
    message: string;
    payload: TeamMember[];
}

const TeamAvailability = () => {
    const { authFetch } = useAuth();
    const [filter, setFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showDateFilter, setShowDateFilter] = useState<boolean>(false);

    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');

    // Fetch team availability data
    const fetchTeamAvailability = async (): Promise<TeamMember[]> => {
        if (!token) throw new Error('Unauthorized');

        // Build query parameters
        const params = new URLSearchParams();
        if (dateRange?.from) params.append('startDate', format(dateRange.from, 'yyyy-MM-dd'));
        if (dateRange?.to) params.append('endDate', format(dateRange.to, 'yyyy-MM-dd'));

        const url = `/users/on-leave${params.toString() ? `?${params.toString()}` : ''}`;

        const response = await authFetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: ApiResponse = await response.json();
        if (result.error) throw new Error(result.message || 'Failed to fetch team availability');

        return result.payload;
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
        if (member.status === 'available') return true;

        if (member.status === 'on-leave' && member.startDate && member.endDate) {
            const memberStart = new Date(member.startDate);
            const memberEnd = new Date(member.endDate);
            const filterStart = dateRange.from || new Date('1900-01-01');
            const filterEnd = dateRange.to || new Date('2100-12-31');

            return memberStart <= filterEnd && memberEnd >= filterStart;
        }

        return true;
    };

    // Filter team members
    const filteredMembers = teamMembers.filter(member => {
        const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filter === "all" || member.status === filter;
        const matchesDateRange = isWithinDateRange(member);

        return matchesSearch && matchesStatus && matchesDateRange;
    });

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['teamAvailability'] });
    };

    const clearDateRange = () => {
        setDateRange(undefined);
    };

    const applyQuickDateRange = (days: number) => {
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + days);
        setDateRange({ from: today, to: futureDate });
    };

    const getStatusBadge = (status: string) => {
        return status === "available" ? (
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 flex items-center gap-1">
                <UserCheck className="w-3 h-3" /> Available
            </Badge>
        ) : (
            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 flex items-center gap-1">
                <UserX className="w-3 h-3" /> On Leave
            </Badge>
        );
    };

    const formatDateRange = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    };

    // Statistics
    const availableCount = filteredMembers.filter(m => m.status === 'available').length;
    const onLeaveCount = filteredMembers.filter(m => m.status === 'on-leave').length;

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950">
            <div className="flex">
                <Sidebar />
                <div className="flex-1 ml-64">
                    <DashboardHeader />
                    <main className="p-8">
                        <div className="px-16 mx-auto space-y-8">
                            <div className="mb-8">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                                            <UserSearch className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Team Availability</h1>
                                            <p className="text-gray-600 dark:text-gray-400">View who's available and who's on leave</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Button
                                            onClick={handleRefresh}
                                            variant="outline"
                                            disabled={isFetching}
                                            className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                        >
                                            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                                            Refresh
                                        </Button>
                                        <Button
                                            onClick={() => setShowDateFilter(!showDateFilter)}
                                            variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
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
                                                    className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600"
                                                >
                                                    Next 30 Days
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
                                                    Clear Filter
                                                </Button>
                                                {dateRange && (
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        Filtering: {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : 'All dates'} to {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : 'All dates'}
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Statistics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                    <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Team Members</p>
                                                    <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{filteredMembers.length}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                    <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Available</p>
                                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{availableCount}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                                                    <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">On Leave</p>
                                                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{onLeaveCount}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Filters */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <div className="relative flex-1">
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

                                    <Select value={filter} onValueChange={setFilter}>
                                        <SelectTrigger className="w-full sm:w-48 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700">
                                            <div className="flex items-center">
                                                <Filter className="w-4 h-4 mr-2 text-gray-400 dark:text-gray-500" />
                                                <SelectValue placeholder="Filter by status" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700">
                                            <SelectItem
                                                value="all"
                                                className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700"
                                            >
                                                All Status
                                            </SelectItem>
                                            <SelectItem
                                                value="available"
                                                className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700"
                                            >
                                                Available
                                            </SelectItem>
                                            <SelectItem
                                                value="on-leave"
                                                className="text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700"
                                            >
                                                On Leave
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Team Members List */}
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
                                            <p className="font-medium text-gray-800 dark:text-gray-200 mb-2">No team members found</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Try adjusting your search, status filter, or date range.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                        {filteredMembers.map((member) => (
                                            <div key={member.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                                            <span className="text-white font-semibold text-sm">
                                                                {member.avatar}
                                                            </span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                                {member.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{member.email}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-sm text-gray-500 dark:text-gray-400">{member.jobTitle}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 flex-shrink-0">
                                                        {member.status === "on-leave" && member.leaveType && member.startDate && member.endDate && (
                                                            <div className="text-right min-w-0">
                                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                                    {member.leaveType}
                                                                </p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                                                    {formatDateRange(member.startDate, member.endDate)}
                                                                </p>
                                                                {member.duration && (
                                                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                        {member.duration} day{member.duration > 1 ? 's' : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div className="flex-shrink-0">
                                                            {getStatusBadge(member.status)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default TeamAvailability;