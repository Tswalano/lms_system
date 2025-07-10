import { useState } from "react";
import { Search, RefreshCw, AlertCircle, Loader2, Users, UserCheck, UserX, Calendar as CalendarIcon, UserSearch, ChevronDown, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    payload: { summary: string, teamMembers: TeamMember[] };
}

const TeamAvailability = () => {
    const { authFetch } = useAuth();
    const [filter, setFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

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
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const result: ApiResponse = await response.json();

        console.log('API Response:', result);

        if (result.error) throw new Error(result.message || 'Failed to fetch team availability');

        const { teamMembers } = result.payload

        return teamMembers;
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

    // Filter team members based 
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

    const openMemberDetails = (memberId: string) => {
        if (expandedRow === memberId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(memberId);
        }
    };

    const getStatusColor = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'available':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium';
            case 'on-leave':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium';
        }
    };

    const getStatusIcon = (status: string) => {
        const statusLower = status.toLowerCase();
        switch (statusLower) {
            case 'available': return <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />;
            case 'on-leave': return <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />;
            default: return <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
        }
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
        <div>
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
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

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'available', label: 'Available' },
                        { key: 'on-leave', label: 'On Leave' }
                    ].map(({ key, label }) => (
                        <Button
                            key={key}
                            onClick={() => setFilter(key)}
                            variant='ghost'
                            className={`${filter === key ? 'bg-cyan-600 text-white' : 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-300'} hover:bg-cyan-500 hover:text-white flex items-center gap-2`}
                        >
                            {label}
                            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                {getStatusCount(key)}
                            </span>
                        </Button>
                    ))}
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
                                {filter === 'all' ? 'No team members found' : `No ${filter} team members found`}
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
                                {/* <TableHead className="text-gray-700 dark:text-gray-300">Job Title</TableHead> */}
                                <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Leave Details</TableHead>
                                <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMembers.map((member) => (
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
                                        {/* <TableCell className="text-gray-600 dark:text-gray-400">
                                            {member.jobTitle}
                                        </TableCell> */}
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(member.status)}
                                                <Badge className={getStatusColor(member.status)}>
                                                    {member.status === 'available' ? 'Available' : 'On Leave'}
                                                </Badge>
                                            </div>
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
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/50 dark:text-blue-400 dark:hover:text-blue-300"
                                                onClick={() => openMemberDetails(member.id)}
                                            >
                                                {expandedRow === member.id ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded Row */}
                                    {expandedRow === member.id && (
                                        <TableRow className="border-0 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-900/50">
                                            <TableCell colSpan={5} className="py-8 px-6">
                                                <div className=" mx-auto">
                                                    {/* Header */}
                                                    {/* <div className="flex items-center justify-between mb-8">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                    {member.name}
                                                                </h3>
                                                                <p className="text-gray-600 dark:text-gray-300 font-medium">
                                                                    {member.jobTitle || 'Team Member'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <Badge className={`${getStatusColor(member.status)} text-sm px-4 py-2 font-semibold`}>
                                                                {member.status === 'available' ? 'Available' : 'On Leave'}
                                                            </Badge>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                                ID: {member.id}
                                                            </span>
                                                        </div>
                                                    </div> */}

                                                    {/* Status Cards */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                                        {/* Current Status Card */}
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${member.status === 'available'
                                                                    ? 'bg-green-100 dark:bg-green-900/30'
                                                                    : 'bg-red-100 dark:bg-red-900/30'
                                                                    }`}>
                                                                    {member.status === 'available' ? (
                                                                        <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                                    ) : (
                                                                        <UserX className="w-5 h-5 text-red-600 dark:text-red-400" />
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                        Current Status
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        Work availability
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {member.status === 'available' ? (
                                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-400">
                                                                    <p className="text-green-800 dark:text-green-200 font-medium mb-1">
                                                                        Available for Work
                                                                    </p>
                                                                    <p className="text-sm text-green-700 dark:text-green-300">
                                                                        Ready to take on new tasks and projects
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border-l-4 border-red-400">
                                                                    <p className="text-red-800 dark:text-red-200 font-medium mb-1">
                                                                        Currently On Leave
                                                                    </p>
                                                                    <p className="text-sm text-red-700 dark:text-red-300">
                                                                        Temporarily unavailable for work assignments
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Leave Details Card */}
                                                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                                    <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                        Leave Information
                                                                    </h4>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        Schedule details
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {member.status === 'on-leave' && member.leaveType ? (
                                                                <div className="space-y-4">
                                                                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                                                                        <div className="grid grid-cols-1 gap-3">
                                                                            <div>
                                                                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                    Leave Type
                                                                                </span>
                                                                                <p className="text-gray-900 dark:text-white font-semibold mt-1">
                                                                                    {member.leaveType}
                                                                                </p>
                                                                            </div>

                                                                            {member.duration && (
                                                                                <div>
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                        Duration
                                                                                    </span>
                                                                                    <p className="text-gray-900 dark:text-white font-semibold mt-1">
                                                                                        {member.duration} day{member.duration > 1 ? 's' : ''}
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            {member.leaveDates && (
                                                                                <div>
                                                                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                                                        Period
                                                                                    </span>
                                                                                    <p className="text-gray-900 dark:text-white font-semibold mt-1">
                                                                                        {member.leaveDates}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {(member.startDate || member.endDate) && (
                                                                        <div className="flex gap-4">
                                                                            {member.startDate && (
                                                                                <div className="flex-1 text-center py-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                                                                        Start Date
                                                                                    </p>
                                                                                    <p className="text-blue-900 dark:text-blue-100 font-semibold mt-1">
                                                                                        {formatDate(member.startDate)}
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            {member.endDate && (
                                                                                <div className="flex-1 text-center py-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                                                                        End Date
                                                                                    </p>
                                                                                    <p className="text-purple-900 dark:text-purple-100 font-semibold mt-1">
                                                                                        {formatDate(member.endDate)}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8">
                                                                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                        <CalendarIcon className="w-8 h-8 text-gray-400" />
                                                                    </div>
                                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                                                                        No active leave schedule
                                                                    </p>
                                                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                                                        This team member has no current leave information
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
};

export default TeamAvailability;