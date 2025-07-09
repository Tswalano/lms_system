/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar';
import moment from 'moment';
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const localizer = momentLocalizer(moment);

interface LeaveEvent extends Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    resource: {
        name: string;
        approvedBy: string;
        type: string;
        color: string;
        bgColor: string;
        avatar: string;
        description?: string;
        email: string;
        jobTitle: string;
        duration: number;
    };
}

interface LeaveRequest {
    id: number;
    start_date: string;
    end_date: string;
    leave_type: string;
    leave_length: number;
    duration: number;
    firstName: string;
    managerFirstName: string;
    managerLastName: string;
    lastName: string;
    email: string;
    role: string;
    jobTitle: string;
    employeeName: string;
}

interface PublicHoliday {
    date: string;
    name: string;
    dayOfWeek: string;
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: {
        dateRange: {
            startDate: string;
            endDate: string;
        };
        leaveRequests: LeaveRequest[];
        publicHolidays: PublicHoliday[];
    };
}

const CalendarSection = () => {
    const [selectedLeave, setSelectedLeave] = useState<LeaveEvent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const { authFetch } = useAuth()
    const { theme } = useTheme();

    // Calculate date range for current month
    const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD');


    // Fetch function for React Query
    const fetchLeaveData = async (startDate: string, endDate: string): Promise<ApiResponse> => {

        const params = new URLSearchParams();

        params.append('start_date', startDate);
        params.append('end_date', endDate);

        // const url = `${baseUrl}?${params.toString()}`;

        const response = await authFetch(`/leave/leave-calendar?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData: ApiResponse = await response.json();

        if (!apiData.success) {
            throw new Error(apiData.message || 'Failed to fetch leave data');
        }

        return apiData;
    };

    // React Query hook
    const {
        data: apiData,
        isLoading,
        isError,
        error,
        refetch,
        isFetching
    } = useQuery({
        queryKey: ['leaveCalendar', startOfMonth, endOfMonth],
        queryFn: () => fetchLeaveData(startOfMonth, endOfMonth),
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (formerly cacheTime)
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: 'always', // Always refetch when component mounts
    });

    // Function to generate random colors for leave events
    const getRandomColor = (id: number) => {
        const colors = [
            { color: 'text-blue-600', bgColor: 'bg-blue-100' },
            { color: 'text-red-600', bgColor: 'bg-red-100' },
            { color: 'text-green-600', bgColor: 'bg-green-100' },
            { color: 'text-purple-600', bgColor: 'bg-purple-100' },
            { color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
            { color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
            { color: 'text-pink-600', bgColor: 'bg-pink-100' },
            { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            { color: 'text-orange-600', bgColor: 'bg-orange-100' },
            { color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
            { color: 'text-violet-600', bgColor: 'bg-violet-100' },
            { color: 'text-sky-600', bgColor: 'bg-sky-100' },
            { color: 'text-rose-600', bgColor: 'bg-rose-100' },
            { color: 'text-amber-600', bgColor: 'bg-amber-100' },
            { color: 'text-lime-600', bgColor: 'bg-lime-100' },
            // { color: 'text-teal-600', bgColor: 'bg-teal-100' },
        ];

        // Use ID to get consistent color for same leave request
        return colors[id % colors.length];
    };

    // Function to convert string to Title Case
    // const toTitleCase = (str: string) => {
    //     return str.replace(/\w\S*/g, (txt) => {
    //         return txt.charAt(0).toUpperCase() + txt.charAt(1).toLowerCase();
    //     });
    // };

    // Function to get avatar based on first name
    const getAvatar = (firstName: string, lastName: string) => {
        return firstName.charAt(0) + lastName.charAt(0);
    };

    const toTitleCase = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Convert API data to calendar events
    const convertApiDataToEvents = (apiData: ApiResponse): LeaveEvent[] => {
        return apiData.data.leaveRequests.map((request) => {
            const colors = getRandomColor(request.id);
            const avatar = getAvatar(request.firstName.toUpperCase(), request.lastName.toUpperCase());
            const fullName = `${toTitleCase(request.firstName)} ${toTitleCase(request.lastName)}`;
            const approvedBy = `${toTitleCase(request.managerFirstName)} ${toTitleCase(request.managerLastName)}`;


            // Handle dates - add one day to end date for multi-day events to make them inclusive
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);

            return {
                id: request.id,
                title: `${request.leave_type} - ${fullName}`,
                start: startDate,
                end: endDate,
                allDay: true,
                resource: {
                    name: fullName,
                    approvedBy,
                    type: request.leave_type,
                    color: colors.color,
                    bgColor: colors.bgColor,
                    avatar: avatar,
                    description: `${request.duration} day${request.duration > 1 ? 's' : ''} - ${request.leave_type}`,
                    email: request.email,
                    jobTitle: request.jobTitle,
                    duration: request.duration,
                }
            };
        });
    };

    // Derived data
    const leaveEvents = apiData ? convertApiDataToEvents(apiData) : [];
    const publicHolidays = apiData?.data.publicHolidays || [];

    // Check if a date is a public holiday
    const isPublicHoliday = (date: Date) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        return publicHolidays.some(holiday => holiday.date === dateStr);
    };

    // Get public holiday name for a date
    const getPublicHolidayName = (date: Date) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        const holiday = publicHolidays.find(h => h.date === dateStr);
        return holiday ? toTitleCase(holiday.name) : '';
    };

    const handleSelectEvent = (event: LeaveEvent) => {
        setSelectedLeave(event);
        setIsDialogOpen(true);
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const eventStyleGetter = (event: LeaveEvent) => {
        const resource = event.resource;

        // Check if we're in dark mode by looking at the document's class
        const isDarkMode = document.documentElement.classList.contains('dark');

        const colorMap: { [key: string]: { bg: string; border: string; text: string; darkText: string } } = {
            'bg-red-100': { bg: '#fef2f2', border: '#f87171', text: '#dc2626', darkText: '#1f2937' },
            'bg-orange-100': { bg: '#fff7ed', border: '#fb923c', text: '#ea580c', darkText: '#1f2937' },
            'bg-blue-100': { bg: '#eff6ff', border: '#60a5fa', text: '#2563eb', darkText: '#1f2937' },
            'bg-green-100': { bg: '#f0fdf4', border: '#4ade80', text: '#16a34a', darkText: '#1f2937' },
            'bg-yellow-100': { bg: '#fefce8', border: '#facc15', text: '#ca8a04', darkText: '#1f2937' },
            'bg-cyan-100': { bg: '#ecfeff', border: '#22d3ee', text: '#0891b2', darkText: '#1f2937' },
            'bg-amber-100': { bg: '#fffbeb', border: '#fbbf24', text: '#d97706', darkText: '#1f2937' },
            'bg-sky-100': { bg: '#f0f9ff', border: '#38bdf8', text: '#0284c7', darkText: '#1f2937' },
            'bg-purple-100': { bg: '#faf5ff', border: '#a855f7', text: '#7c3aed', darkText: '#1f2937' },
            'bg-indigo-100': { bg: '#eef2ff', border: '#818cf8', text: '#4f46e5', darkText: '#1f2937' }
            // 'bg-gray-100': { bg: '#f9fafb', border: '#9ca3af', text: '#374151', darkText: '#1f2937' }
        };

        const colors = colorMap[resource.bgColor] || { bg: '#f3f4f6', border: '#9ca3af', text: '#374151', darkText: '#1f2937' };

        return {
            style: {
                backgroundColor: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '8px',
                color: isDarkMode ? colors.darkText : colors.text,
                padding: '4px 8px',
                margin: '1px',
                fontWeight: '600',
                fontSize: '11px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                minHeight: '24px',
                overflow: 'hidden'
            }
        };
    };

    // Custom day cell wrapper to highlight public holidays
    const dayPropGetter = (date: Date) => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = isPublicHoliday(date);
        const isDarkMode = theme === 'dark';

        // Public holiday styling (takes priority over weekend)
        if (isHoliday) {
            return {
                className: 'public-holiday-cell',
                style: {
                    backgroundColor: isDarkMode ? '#431407' : '#fef3c7',
                    border: isDarkMode ? '2px solid #9a3412' : '2px solid #f59e0b',
                    position: 'relative',
                    cursor: 'help',
                    // Ensure holiday cells stand out even on weekends
                    opacity: 1,
                    zIndex: 1
                } as React.CSSProperties
            };
        }

        // Weekend styling (only applied if not a holiday)
        if (isWeekend) {
            return {
                className: 'weekend-cell',
                style: {
                    backgroundColor: isDarkMode ? '#334155' : '#f9fafb',
                    color: isDarkMode ? '#64748b' : '#9ca3af',
                    opacity: isDarkMode ? 0.8 : 0.9,
                } as React.CSSProperties
            };
        }

        return {};
    };

    // Custom event component to show avatar and name
    const EventComponent = ({ event }: { event: LeaveEvent }) => {
        const duration = event.resource.duration;

        return (
            <div className="flex items-center gap-1 w-full">
                <span className="text-sm flex-shrink-0">
                    {event.resource.avatar}
                </span>
                <span className="text-xs font-medium truncate">
                    {event.title}
                    {duration >= 2 && (
                        <span className="ml-1 text-xs font-bold">
                            ({duration}d)
                        </span>
                    )}
                </span>
            </div>
        );
    };

    // Custom date header component to show public holiday indicator
    const DateHeaderComponent = ({ date, label }: { date: Date; label: string }) => {
        const isHoliday = isPublicHoliday(date);
        const holidayName = getPublicHolidayName(date);

        return (
            <div className="relative flex flex-col items-center" title={isHoliday ? holidayName : ''}>
                <span className={isHoliday ? 'font-bold text-orange-600' : ''}>{label}</span>
                {isHoliday && (
                    <span className="text-[8px] xs:text-[10px] font-bold text-orange-600 truncate w-full text-center">
                        {holidayName}
                    </span>
                )}
            </div>
        );
    };

    // Custom toolbar component
    const CustomToolbar = ({ label, onNavigate }: any) => (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onNavigate('PREV')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    disabled={isLoading || isFetching}
                >
                    ←
                </button>
                <span className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 min-w-[120px] sm:min-w-[200px] text-center">
                    {label}
                </span>
                <button
                    onClick={() => onNavigate('NEXT')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    disabled={isLoading || isFetching}
                >
                    →
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onNavigate('TODAY')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-sm font-medium transition-colors disabled:opacity-50"
                    disabled={isLoading || isFetching}
                >
                    Today
                </button>
                {(isLoading || isFetching) && (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                            Team Calendar
                        </h2>
                        {/* <Button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 sm:px-4 py-2 flex items-center gap-2 shadow-sm text-sm">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add Event</span>
                            <span className="sm:hidden">Add</span>
                        </Button> */}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                            <span className="text-gray-600 dark:text-gray-400">Leave</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-yellow-100 border-2 border-orange-400 rounded"></div>
                            <span className="text-gray-600 dark:text-gray-400">Public Holiday</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-2 sm:p-6">
                {isError ? (
                    <div className="flex items-center justify-center h-64 text-red-600 dark:text-red-400">
                        <div className="text-center">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                            <p className="font-medium">Error loading calendar data</p>
                            <p className="text-sm mt-1">
                                {error instanceof Error ? error.message : 'Something went wrong'}
                            </p>
                            <Button
                                onClick={() => refetch()}
                                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white"
                                disabled={isFetching}
                            >
                                {isFetching ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Retrying...
                                    </>
                                ) : (
                                    'Retry'
                                )}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="h-[400px] sm:h-[600px] relative">
                        {/* Loading overlay */}
                        {(isLoading || isFetching) && (
                            <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
                                <div className="flex flex-col items-center gap-3">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                        Loading calendar data...
                                    </p>
                                </div>
                            </div>
                        )}

                        <style>
                            {`
                                /* Public Holiday Styles */
                                .public-holiday-cell {
                                    position: relative;
                                }
                                .public-holiday-cell::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: linear-gradient(45deg, transparent 40%, #f59e0b 40%, #f59e0b 60%, transparent 60%);
                                    opacity: 0.1;
                                    pointer-events: none;
                                }
                                .public-holiday-cell:hover::after {
                                    content: attr(title);
                                    position: absolute;
                                    top: 100%;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    background-color: #374151;
                                    color: white;
                                    padding: 4px 8px;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    white-space: nowrap;
                                    z-index: 1000;
                                    pointer-events: none;
                                }

                                /* Dark mode calendar styles */
                                .dark .rbc-calendar {
                                    background-color: #1e293b;
                                    color: #e2e8f0;
                                }
                                
                                .dark .rbc-month-view,
                                .dark .rbc-time-view {
                                    background-color: #1e293b;
                                    border-color: #475569;
                                }
                                
                                .dark .rbc-header {
                                    background-color: #334155;
                                    color: #e2e8f0;
                                    border-color: #475569;
                                }
                                
                                .dark .rbc-month-row {
                                    border-color: #475569;
                                }
                                
                                .dark .rbc-day-bg {
                                    background-color: #1e293b;
                                    border-color: #475569;
                                }
                                
                                .dark .rbc-today {
                                    background-color: #1e40af !important;
                                    opacity: 0.3;
                                }
                                
                                .dark .rbc-off-range-bg {
                                    background-color: #0f172a;
                                    color: #64748b;
                                }
                                
                                .dark .rbc-off-range {
                                    color: #64748b;
                                }
                                
                                .dark .rbc-date-cell {
                                    color: #e2e8f0;
                                }
                                
                                .dark .rbc-date-cell a {
                                    color: #e2e8f0;
                                }
                                
                                .dark .rbc-off-range .rbc-date-cell a {
                                    color: #64748b;
                                }
                                
                                /* Fix for "+X more" popup text in dark mode */
                                .dark .rbc-show-more {
                                    color: #3b82f6 !important;
                                    background-color: transparent;
                                    font-weight: 500;
                                }
                                
                                .dark .rbc-show-more:hover {
                                    color: #60a5fa !important;
                                    background-color: #1e40af;
                                    border-radius: 4px;
                                }
                                
                                /* Fix for popup overlay in dark mode */
                                .dark .rbc-overlay {
                                    background-color: #1e293b;
                                    border: 1px solid #475569;
                                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                                }
                                
                                .dark .rbc-overlay-header {
                                    background-color: #334155;
                                    color: #e2e8f0;
                                    border-bottom: 1px solid #475569;
                                }
                                
                                /* Fix for current month vs other months distinction in dark mode */
                                .dark .rbc-month-view .rbc-row {
                                    border-color: #475569;
                                }
                                
                                .dark .rbc-month-view .rbc-day-bg + .rbc-day-bg {
                                    border-left-color: #475569;
                                }
                                
                                /* Better contrast for dates in dark mode */
                                .rbc-date-cell {
                                    padding: 8px;
                                }
                                
                                .dark .rbc-date-cell a {
                                    color: #e2e8f0;
                                    text-decoration: none;
                                    font-weight: 500;
                                }
                                
                                .dark .rbc-date-cell a:hover {
                                    background-color: #334155;
                                    border-radius: 4px;
                                }
                                
                                /* Ensure off-range dates are properly dimmed in dark mode */
                                .dark .rbc-off-range-bg {
                                    background-color: #0f172a;
                                }
                                
                                .dark .rbc-off-range {
                                    color: #475569;
                                }
                                
                                .dark .rbc-off-range .rbc-date-cell a {
                                    color: #475569;
                                }
                                
                                /* Toolbar styles for dark mode */
                                .dark .rbc-toolbar {
                                    color: #e2e8f0;
                                }
                                
                                .dark .rbc-toolbar button {
                                    background-color: #334155;
                                    color: #e2e8f0;
                                    border: 1px solid #475569;
                                }
                                
                                .dark .rbc-toolbar button:hover {
                                    background-color: #475569;
                                }
                                
                                .dark .rbc-toolbar button.rbc-active {
                                    background-color: #3b82f6;
                                    border-color: #3b82f6;
                                }
                            `}
                        </style>
                        <Calendar
                            localizer={localizer}
                            events={leaveEvents}
                            startAccessor="start"
                            endAccessor="end"
                            onSelectEvent={handleSelectEvent}
                            onNavigate={handleNavigate}
                            date={currentDate}
                            selectable
                            eventPropGetter={eventStyleGetter}
                            dayPropGetter={dayPropGetter}
                            views={['month']}
                            defaultView="month"
                            popup
                            formats={{
                                monthHeaderFormat: 'MMMM YYYY',
                                dayHeaderFormat: 'ddd',
                                dayRangeHeaderFormat: ({ start, end }) =>
                                    `${moment(start).format('MMM DD')} - ${moment(end).format('MMM DD')}`,
                            }}
                            components={{
                                event: EventComponent,
                                toolbar: CustomToolbar,
                                month: {
                                    dateHeader: DateHeaderComponent,
                                }
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Enhanced Custom Modal */}
            {isDialogOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform animate-in zoom-in-95 duration-300 border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header with subtle background */}
                        <div className="relative p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600 border-b border-gray-200/50 dark:border-slate-600/50">
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform duration-300">
                                            {selectedLeave.resource.avatar}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                            {selectedLeave.resource.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {selectedLeave.resource.type}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {selectedLeave.resource.duration} day{selectedLeave.resource.duration > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 transform hover:scale-110 group"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
                                </button>
                            </div>
                        </div>

                        {/* Content with enhanced styling */}
                        <div className="p-6 space-y-5 bg-gradient-to-b from-gray-50/30 to-white dark:from-slate-800/30 dark:to-slate-800">


                            {/* Approved By */}
                            <div className="bg-white dark:bg-slate-700/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-600/30 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-blue-600 dark:text-blue-300 text-lg">👤</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Approved By</p>
                                        <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                                            {selectedLeave.resource.approvedBy || 'Pending'}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* Description Card (if exists) */}
                            {selectedLeave.resource.description && (
                                <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 border border-gray-200 dark:border-slate-600/30">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-gray-600 dark:text-gray-300 text-sm font-semibold">📝</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selectedLeave.resource.description}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer with action buttons */}
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-2">
                                <button onClick={() => setIsDialogOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl">
                                    Close
                                </button>
                                {/* <button className="flex-1 bg-white dark:bg-slate-600 hover:bg-gray-50 dark:hover:bg-slate-500 text-gray-700 dark:text-gray-200 font-medium py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                                    Contact
                                </button> */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarSection;