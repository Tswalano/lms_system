/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar';
import moment from 'moment';
import { X, Loader2, AlertCircle, CalendarRange, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);

interface LeaveEvent extends Event {
    id: number;
    title: string;
    start: Date;
    end: Date;
    leaveLength?: 'half_day' | 'full_day';
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

interface BirthdayEvent extends Event {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay: boolean;
    resource: {
        userId: number;
        name: string;
        firstName: string;
        lastName: string;
        email: string;
        jobTitle: string;
        profilePicture?: string;
        age: number;
        isToday: boolean;
        type: 'birthday';
        color: string;
        bgColor: string;
        avatar: string;
    };
}

type CalendarEvent = LeaveEvent | BirthdayEvent;

interface LeaveRequest {
    id: number;
    start_date: string;
    end_date: string;
    leave_type: string;
    leave_length: 'half_day' | 'full_day';
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

interface Birthday {
    id: string;
    userId: number;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    profilePicture?: string;
    dateOfBirth: string;
    birthdayDate: string;
    age: number;
    isToday: boolean;
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
        birthdays: Birthday[];
    };
}

interface LeaveApplicationData {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    leaveLength: 'half_day' | 'full_day';
}

interface LeaveApplicationResponse {
    success: boolean;
    message: string;
    data?: any;
}

interface SelectedSlotRange {
    start: Date;
    end: Date;
}

const normalizeRange = (start: Date, end: Date): SelectedSlotRange => {
    const normalizedStart = moment(start).startOf('day').toDate();
    const normalizedEnd = moment(end).startOf('day').toDate();

    return normalizedStart <= normalizedEnd
        ? { start: normalizedStart, end: normalizedEnd }
        : { start: normalizedEnd, end: normalizedStart };
};

interface CalendarDragContextValue {
    dragPreviewRange: SelectedSlotRange | null;
    selectedSlotRange: SelectedSlotRange | null;
    hoveredDate: Date | null;
    dragAnchorDate: Date | null;
    onCellMouseDown: (date: Date) => void;
    onCellMouseEnter: (date: Date) => void;
}

const CalendarDragContext = createContext<CalendarDragContextValue>({
    dragPreviewRange: null,
    selectedSlotRange: null,
    hoveredDate: null,
    dragAnchorDate: null,
    onCellMouseDown: () => {},
    onCellMouseEnter: () => {},
});

const CalendarDateCellWrapperComponent = ({
    value,
    children,
}: {
    value: Date;
    children: React.ReactNode;
}) => {
    const { dragPreviewRange, selectedSlotRange, hoveredDate, dragAnchorDate, onCellMouseDown, onCellMouseEnter } = useContext(CalendarDragContext);
    const normalizedValue = moment(value).startOf('day');
    const isPastDate = normalizedValue.isBefore(moment().startOf('day'));
    const isSelectedPreview = (dragPreviewRange || selectedSlotRange)
        ? normalizedValue.isBetween(
            moment((dragPreviewRange || selectedSlotRange)!.start).startOf('day'),
            moment((dragPreviewRange || selectedSlotRange)!.end).startOf('day'),
            'day',
            '[]'
        )
        : false;
    const isHovered = hoveredDate ? normalizedValue.isSame(moment(hoveredDate).startOf('day'), 'day') : false;

    return (
        <div
            className={cn(
                "calendar-date-cell-wrapper h-full w-full",
                !isPastDate && "calendar-date-cell-interactive",
                isHovered && !dragAnchorDate && !isPastDate && "calendar-date-cell-hovered",
                isSelectedPreview && "calendar-date-cell-selected",
                isPastDate && "calendar-date-cell-disabled"
            )}
            onMouseDown={() => onCellMouseDown(normalizedValue.toDate())}
            onMouseEnter={() => onCellMouseEnter(normalizedValue.toDate())}
        >
            {children}
        </div>
    );
};

const CalendarSection = () => {
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [, setShowMoreEvents] = useState<{ events: CalendarEvent[], date: Date, slot: Date } | null>(null);
    const [selectedSlotRange, setSelectedSlotRange] = useState<SelectedSlotRange | null>(null);
    const [dragPreviewRange, setDragPreviewRange] = useState<SelectedSlotRange | null>(null);
    const [dragAnchorDate, setDragAnchorDate] = useState<Date | null>(null);
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
    const [leaveFormData, setLeaveFormData] = useState<LeaveApplicationData>({
        leaveType: '',
        startDate: '',
        endDate: '',
        reason: '',
        leaveLength: 'full_day'
    });
    const { authFetch, user } = useAuth()
    const { theme } = useTheme();
    const queryClient = useQueryClient();
    const token: string | null = localStorage.getItem('authToken');
    const dragAnchorRef = useRef<Date | null>(null);

    const handleCellMouseDown = useCallback((date: Date) => {
        dragAnchorRef.current = date;
        setDragAnchorDate(date);
        setHoveredDate(date);
        setDragPreviewRange({ start: date, end: date });
    }, []);

    const handleCellMouseEnter = useCallback((date: Date) => {
        setHoveredDate(date);
        if (dragAnchorRef.current) {
            setDragPreviewRange(normalizeRange(dragAnchorRef.current, date));
        }
    }, []);

    // Calculate date range for current month
    const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD');
    const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD');

    // Fetch function for React Query
    const fetchCalendarData = async (startDate: string, endDate: string): Promise<ApiResponse> => {
        const params = new URLSearchParams();
        params.append('start_date', startDate);
        params.append('end_date', endDate);

        const response = await authFetch(`/leave/leave-calendar-with-birthdays?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const apiData: ApiResponse = await response.json();

        if (!apiData.success) {
            throw new Error(apiData.message || 'Failed to fetch calendar data');
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
        queryFn: () => fetchCalendarData(startOfMonth, endOfMonth),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 3,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: 'always',
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
            { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
            { color: 'text-orange-600', bgColor: 'bg-orange-100' },
            { color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
            { color: 'text-violet-600', bgColor: 'bg-violet-100' },
            { color: 'text-sky-600', bgColor: 'bg-sky-100' },
            { color: 'text-rose-600', bgColor: 'bg-rose-100' },
            { color: 'text-amber-600', bgColor: 'bg-amber-100' },
            { color: 'text-lime-600', bgColor: 'bg-lime-100' },
        ];

        return colors[id % colors.length];
    };

    // Function to get avatar based on first name
    const getAvatar = (firstName: string, lastName: string) => {
        return firstName.charAt(0) + lastName.charAt(0);
    };

    const toTitleCase = (str: string) =>
        str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

    // Convert API data to calendar events with deduplication
    const convertApiDataToEvents = (apiData: ApiResponse): CalendarEvent[] => {
        const events: CalendarEvent[] = [];

        // Convert leave requests to events
        const uniqueLeaveEvents = new Map<number, LeaveEvent>();

        apiData.data.leaveRequests.forEach((request) => {
            // Skip if we've already processed this request ID
            if (uniqueLeaveEvents.has(request.id)) {
                return;
            }

            const colors = getRandomColor(request.id);
            const avatar = getAvatar(request.firstName.toUpperCase(), request.lastName.toUpperCase());
            const fullName = `${toTitleCase(request.firstName)} ${toTitleCase(request.lastName)}`;
            const approvedBy = `${toTitleCase(request.managerFirstName)} ${toTitleCase(request.managerLastName)}`;

            // Handle dates
            const startDate = new Date(request.start_date);
            const endDate = new Date(request.end_date);
            endDate.setDate(endDate.getDate() + 1);

            const event: LeaveEvent = {
                id: request.id,
                title: `${request.leave_type} - ${fullName}`,
                start: startDate,
                end: endDate,
                allDay: request.leave_length === 'full_day',
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

            uniqueLeaveEvents.set(request.id, event);
        });

        events.push(...Array.from(uniqueLeaveEvents.values()));

        // Convert birthdays to events
        apiData.data.birthdays.forEach((birthday) => {
            const birthdayDate = new Date(birthday.birthdayDate);
            const avatar = getAvatar(birthday.firstName.toUpperCase(), birthday.lastName.toUpperCase());

            const birthdayEvent: BirthdayEvent = {
                id: birthday.id,
                title: `🎂 ${birthday.name} (${birthday.age})`,
                start: birthdayDate,
                end: birthdayDate,
                allDay: true,
                resource: {
                    userId: birthday.userId,
                    name: birthday.name,
                    firstName: birthday.firstName,
                    lastName: birthday.lastName,
                    email: birthday.email,
                    jobTitle: birthday.jobTitle,
                    profilePicture: birthday.profilePicture,
                    age: birthday.age,
                    isToday: birthday.isToday,
                    type: 'birthday',
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-100',
                    avatar: avatar
                }
            };

            events.push(birthdayEvent);
        });

        return events;
    };

    // Derived data
    const allEvents = apiData ? convertApiDataToEvents(apiData) : [];
    const publicHolidays = apiData?.data.publicHolidays || [];

    const formatDateToLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const countSelectedDays = (startDate: string, endDate: string) => {
        const start = moment(startDate).startOf('day');
        const end = moment(endDate).startOf('day');
        return end.diff(start, 'days') + 1;
    };

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

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsDialogOpen(true);
    };

    // Handle "show more" popup
    const handleShowMore = (events: CalendarEvent[], date: Date) => {
        setShowMoreEvents({ events, date, slot: date });
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const openApplyLeaveModal = (start: Date, end: Date) => {
        const { start: startDate, end: endDate } = normalizeRange(start, end);

        setSelectedSlotRange({ start: startDate, end: endDate });
        setLeaveFormData({
            leaveType: '',
            startDate: formatDateToLocal(startDate),
            endDate: formatDateToLocal(endDate),
            reason: '',
            leaveLength: 'full_day'
        });
        setIsApplyModalOpen(true);
    };

    const handleSelectSlot = ({ start, end, action }: { start: Date; end: Date; action: string }) => {
        setDragPreviewRange(null);
        setDragAnchorDate(null);
        setHoveredDate(null);

        if (action !== 'select') {
            return;
        }

        const normalizedStart = moment(start).startOf('day').toDate();
        const normalizedEnd = moment(end).subtract(1, 'day').startOf('day').toDate();

        openApplyLeaveModal(normalizedStart, normalizedEnd);
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            dragAnchorRef.current = null;
            setDragAnchorDate(null);
            setHoveredDate(null);
        };

        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    const dragContextValue = useMemo<CalendarDragContextValue>(() => ({
        dragPreviewRange,
        selectedSlotRange,
        hoveredDate,
        dragAnchorDate,
        onCellMouseDown: handleCellMouseDown,
        onCellMouseEnter: handleCellMouseEnter,
    }), [dragPreviewRange, selectedSlotRange, hoveredDate, dragAnchorDate, handleCellMouseDown, handleCellMouseEnter]);

    const closeApplyLeaveModal = () => {
        setIsApplyModalOpen(false);
        setSelectedSlotRange(null);
        setDragPreviewRange(null);
        setLeaveFormData({
            leaveType: '',
            startDate: '',
            endDate: '',
            reason: '',
            leaveLength: 'full_day'
        });
    };

    useEffect(() => {
        if (leaveFormData.leaveLength === 'half_day' && leaveFormData.startDate) {
            setLeaveFormData((prev) => ({
                ...prev,
                endDate: prev.startDate
            }));
        }
    }, [leaveFormData.leaveLength, leaveFormData.startDate]);

    const submitLeaveApplication = async (data: LeaveApplicationData): Promise<LeaveApplicationResponse> => {
        const payload = {
            leave_type: data.leaveType,
            leave_start: data.startDate,
            leave_end: data.endDate,
            leave_comment: data.reason,
            leave_length: data.leaveLength
        };

        const response = await authFetch('/leave/apply-leave', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const result: LeaveApplicationResponse = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Failed to submit leave application');
        }

        return result;
    };

    const {
        mutate: submitApplication,
        isPending: isSubmittingLeave,
        isError: isLeaveSubmitError,
        error: leaveSubmitError
    } = useMutation({
        mutationFn: submitLeaveApplication,
        onSuccess: (data) => {
            toast.success("Leave Application Submitted", {
                description: data.message || "Your leave request has been submitted for approval."
            });

            queryClient.invalidateQueries({ queryKey: ['leaveCalendar'] });
            closeApplyLeaveModal();
        },
        onError: (mutationError) => {
            toast.error("Submission Failed", {
                description: mutationError instanceof Error ? mutationError.message : "Failed to submit leave application. Please try again."
            });
        }
    });

    const selectedDayCount = useMemo(() => {
        if (!leaveFormData.startDate || !leaveFormData.endDate) {
            return 0;
        }

        return countSelectedDays(leaveFormData.startDate, leaveFormData.endDate);
    }, [leaveFormData.endDate, leaveFormData.startDate]);

    const handleApplyLeaveSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!leaveFormData.leaveType || !leaveFormData.startDate || !leaveFormData.endDate || !leaveFormData.reason) {
            toast.error("Missing Required Fields", {
                description: "Please fill in all required fields."
            });
            return;
        }

        const startDate = moment(leaveFormData.startDate).startOf('day');
        const endDate = moment(leaveFormData.endDate).startOf('day');
        const today = moment().startOf('day');

        if (startDate.isBefore(today, 'day')) {
            toast.warning("Backdated Leave Application", {
                description: "You are applying for leave that starts in the past."
            });
        }

        if (leaveFormData.leaveLength === 'full_day' && endDate.isBefore(startDate, 'day')) {
            toast.error("Invalid Date Range", {
                description: "End date cannot be before start date."
            });
            return;
        }

        // Check for overlapping leave requests for the current user
        const hasOverlap = allEvents.some((event) => {
            if (isBirthdayEvent(event)) return false;
            const leaveEvent = event as LeaveEvent;
            if (leaveEvent.resource.email !== user?.email) return false;
            const eventStart = moment(leaveEvent.start).startOf('day');
            // end was incremented by 1 day in convertApiDataToEvents
            const eventEnd = moment(leaveEvent.end).subtract(1, 'day').startOf('day');
            return startDate.isSameOrBefore(eventEnd) && endDate.isSameOrAfter(eventStart);
        });

        if (hasOverlap) {
            toast.error("Overlapping Leave Request", {
                description: "You already have a leave request covering these dates. Please choose different dates."
            });
            return;
        }

        submitApplication(leaveFormData);
    };

    const eventStyleGetter = (event: CalendarEvent) => {
        const resource = event.resource;
        const isDarkMode = document.documentElement.classList.contains('dark');

        // Special styling for birthdays
        if ('type' in resource && resource.type === 'birthday') {
            const isToday = true; //resource.isToday;
            return {
                style: {
                    backgroundColor: isToday ? '#fce7f3' : '#fdf2f8',
                    border: isToday ? '3px solid #ec4899' : '2px solid #f472b6',
                    borderRadius: '8px',
                    color: isDarkMode ? '#1f2937' : '#be185d',
                    padding: '4px 8px',
                    margin: '1px',
                    fontWeight: '600',
                    fontSize: '11px',
                    boxShadow: isToday ? '0 4px 12px rgba(236, 72, 153, 0.3)' : '0 2px 8px rgba(244, 114, 182, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '24px',
                    overflow: 'hidden',
                    animation: isToday ? 'birthday-glow 2s ease-in-out infinite alternate' : 'none'
                }
            };
        }

        // Original leave event styling
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
        const isPastDate = moment(date).startOf('day').isBefore(moment().startOf('day'));
        const previewRange = dragPreviewRange || selectedSlotRange;
        const isInPreviewRange = previewRange
            ? moment(date).startOf('day').isBetween(
                moment(previewRange.start).startOf('day'),
                moment(previewRange.end).startOf('day'),
                'day',
                '[]'
            )
            : false;

        if (isInPreviewRange) {
            return {
                className: 'selected-leave-range-cell',
                style: {
                    background: isDarkMode
                        ? 'linear-gradient(180deg, rgba(8,145,178,0.28) 0%, rgba(37,99,235,0.28) 100%)'
                        : 'linear-gradient(180deg, rgba(34,211,238,0.18) 0%, rgba(59,130,246,0.18) 100%)',
                    border: isDarkMode ? '2px solid rgba(34,211,238,0.45)' : '2px solid rgba(14,165,233,0.35)',
                    boxShadow: isDarkMode
                        ? 'inset 0 0 0 1px rgba(34,211,238,0.18)'
                        : 'inset 0 0 0 1px rgba(14,165,233,0.12)',
                    position: 'relative',
                    cursor: 'pointer'
                } as React.CSSProperties
            };
        }

        if (isHoliday) {
            return {
                className: 'public-holiday-cell',
                style: {
                    backgroundColor: isDarkMode ? '#431407' : '#fef3c7',
                    border: isDarkMode ? '2px solid #9a3412' : '2px solid #f59e0b',
                    position: 'relative',
                    cursor: isPastDate ? 'not-allowed' : 'help',
                    opacity: isPastDate ? 0.7 : 1,
                    zIndex: 1
                } as React.CSSProperties
            };
        }

        if (isPastDate) {
            return {
                className: 'past-date-cell',
                style: {
                    backgroundColor: isDarkMode ? '#172033' : '#f3f4f6',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb',
                    color: isDarkMode ? '#64748b' : '#9ca3af',
                    opacity: 0.7,
                    cursor: 'pointer',
                    position: 'relative'
                } as React.CSSProperties
            };
        }

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
    const EventComponent = ({ event }: { event: CalendarEvent }) => {
        const resource = event.resource;

        // Birthday event component
        if ('type' in resource && resource.type === 'birthday') {
            return (
                <div className="flex items-center gap-1 w-full">
                    <span className="text-sm flex-shrink-0">
                        🎂
                    </span>
                    <span className="text-xs font-medium truncate">
                        {resource.name}
                    </span>
                </div>
            );
        }

        // Leave event component
        const duration = (resource as LeaveEvent['resource']).duration;
        return (
            <div className="flex items-center gap-1 w-full">
                <span className="text-sm flex-shrink-0">
                    {resource.avatar}
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

    // Type guard functions
    const isBirthdayEvent = (event: CalendarEvent): event is BirthdayEvent => {
        return 'type' in event.resource && event.resource.type === 'birthday';
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                                    Team Calendar
                                </h2>
                                <div className="hidden md:flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50/80 dark:bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Drag across days to apply for leave
                                </div>
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
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 bg-pink-100 border border-pink-300 rounded"></div>
                            <span className="text-gray-600 dark:text-gray-400">Birthday</span>
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
                    <div className="h-[500px] sm:h-[800px] relative">
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

                        <CalendarDragContext.Provider value={dragContextValue}>
                            <Calendar
                                localizer={localizer}
                                events={allEvents}
                                startAccessor="start"
                                endAccessor="end"
                                onSelectEvent={handleSelectEvent}
                                onShowMore={handleShowMore}
                                onNavigate={handleNavigate}
                                date={currentDate}
                                selectable
                                onSelectSlot={handleSelectSlot}
                                eventPropGetter={eventStyleGetter}
                                dayPropGetter={dayPropGetter}
                                views={['month']}
                                defaultView="month"
                                popup={true}
                                popupOffset={10}
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
                                    },
                                    dateCellWrapper: CalendarDateCellWrapperComponent
                                }}
                            />
                        </CalendarDragContext.Provider>
                    </div>
                )}
            </div>

            {/* Enhanced Custom Modal for both leave and birthday events */}
            {isDialogOpen && selectedEvent && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden transform animate-in zoom-in-95 duration-300 border border-gray-200/50 dark:border-slate-600/50">
                        {/* Header with conditional styling for birthdays */}
                        <div className={`relative p-6 border-b border-gray-200/50 dark:border-slate-600/50 ${isBirthdayEvent(selectedEvent)
                            ? 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600'
                            }`}>
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transform hover:scale-105 transition-transform duration-300 ${isBirthdayEvent(selectedEvent)
                                            ? 'bg-gradient-to-br from-pink-500 to-pink-700'
                                            : 'bg-gradient-to-br from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600'
                                            }`}>
                                            {isBirthdayEvent(selectedEvent) ? '🎂' : selectedEvent.resource.avatar}
                                        </div>
                                        {isBirthdayEvent(selectedEvent) && selectedEvent.resource.isToday && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                                <span className="text-xs">✨</span>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                            {selectedEvent.resource.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {isBirthdayEvent(selectedEvent) ? (
                                                <>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                                                        🎉 Birthday
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Turning {selectedEvent.resource.age}
                                                    </span>
                                                    {selectedEvent.resource.isToday && (
                                                        <span className="text-xs font-bold text-pink-600 dark:text-pink-400 animate-pulse">
                                                            Today! 🎈
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                        {(selectedEvent as LeaveEvent).resource.type}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        {(selectedEvent as LeaveEvent).resource.duration} day{(selectedEvent as LeaveEvent).resource.duration > 1 ? 's' : ''} - {selectedEvent.allDay ? 'Full Day' : 'Half Day'}
                                                    </span>
                                                </>
                                            )}
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

                        <div className="p-6 space-y-5 bg-gradient-to-b from-gray-50/30 to-white dark:from-slate-800/30 dark:to-slate-800">
                            {isBirthdayEvent(selectedEvent) ? (
                                // Birthday event details
                                <>
                                    <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-2xl p-4 border border-pink-200 dark:border-pink-800/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-pink-200 dark:bg-pink-600/30 rounded-lg flex items-center justify-center">
                                                <span className="text-pink-600 dark:text-pink-300 text-lg">🎈</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide">Birthday Message</p>
                                                {user && String(user.id) === String(selectedEvent.resource.userId) ? (
                                                    <p className="text-sm text-pink-800 dark:text-pink-200 font-semibold">
                                                        {selectedEvent.resource.isToday
                                                            ? `🎉 Happy Birthdayyy ${selectedEvent.resource.firstName}, Wishing you a fantastic day!`
                                                            : `It's Your Birthday ${selectedEvent.resource.firstName} on ${moment(selectedEvent.start).format('MMMM Do')}`
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                        {selectedEvent.resource.isToday
                                                            ? `🎉 Happy Birthday ${selectedEvent.resource.firstName}! Wishing a fantastic day!`
                                                            : `🎂 ${selectedEvent.resource.firstName} turns ${selectedEvent.resource.age} on ${moment(selectedEvent.start).format('MMMM Do')}`
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                // Leave event details (existing)
                                <>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-600/30 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                <span className="text-blue-600 dark:text-blue-300 text-lg">👤</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Approved By</p>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                                                    {selectedEvent.resource.approvedBy || 'Pending'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-700/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-600/30 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-500/20 rounded-lg flex items-center justify-center">
                                                <span className="text-green-600 dark:text-green-300 text-lg">🗓️</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Duration</p>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                                                    {moment(selectedEvent.start).format('MMM DD, YYYY')} - {moment(selectedEvent.end).format('MMM DD, YYYY')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description Card (if exists) */}
                                    {selectedEvent.resource.description && (
                                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl p-4 border border-gray-200 dark:border-slate-600/30">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                                    <span className="text-gray-600 dark:text-gray-300 text-sm font-semibold">📝</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{selectedEvent.resource.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Footer with action buttons */}
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-2">
                                {isBirthdayEvent(selectedEvent) && (
                                    <button
                                        onClick={() => {
                                            // Could implement send birthday message functionality
                                            console.log('Send birthday message to:', selectedEvent.resource.email);
                                        }}
                                        className="flex-1 bg-pink-500 hover:bg-pink-600 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mr-2"
                                    >
                                        🎉 Send Wishes
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsDialogOpen(false)}
                                    className="flex-1 bg-gray-800 hover:bg-gray-900 dark:bg-gray-600 dark:hover:bg-gray-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isApplyModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 dark:border-slate-600/50">
                        <div className="p-6 border-b border-gray-200/50 dark:border-slate-600/50 bg-gradient-to-br from-cyan-50 via-blue-50 to-emerald-50 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                                        <CalendarRange className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Apply for Leave</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {leaveFormData.startDate && leaveFormData.endDate
                                                ? `${moment(leaveFormData.startDate).format('MMM D, YYYY')} to ${moment(leaveFormData.endDate).format('MMM D, YYYY')}`
                                                : 'Choose the leave details for the selected dates.'}
                                        </p>
                                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-slate-600">
                                            <span>{selectedDayCount}</span>
                                            <span>{selectedDayCount === 1 ? 'day selected' : 'days selected'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={closeApplyLeaveModal}
                                    className="p-2 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                                >
                                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-92px)]">
                            <form onSubmit={handleApplyLeaveSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Leave Type *</Label>
                                        <Select
                                            value={leaveFormData.leaveType}
                                            onValueChange={(value) => setLeaveFormData((prev) => ({ ...prev, leaveType: value }))}
                                            disabled={isSubmittingLeave}
                                        >
                                            <SelectTrigger className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                                <SelectValue placeholder="Select leave type" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                                                <SelectItem value="Annual Leave">Annual Leave</SelectItem>
                                                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                                                <SelectItem value="Paternity Leave">Paternity Leave</SelectItem>
                                                <SelectItem value="Family Responsibility">Family Responsibility</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Leave Length *</Label>
                                        <RadioGroup
                                            value={leaveFormData.leaveLength}
                                            onValueChange={(value: 'half_day' | 'full_day') => setLeaveFormData((prev) => ({ ...prev, leaveLength: value }))}
                                            className="flex flex-col sm:flex-row gap-4"
                                        >
                                            <Label htmlFor="calendar_full_day" className={cn("flex items-center space-x-2 rounded-xl border px-4 py-3 flex-1 cursor-pointer transition-colors", leaveFormData.leaveLength === 'full_day' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50')}>
                                                <RadioGroupItem value="full_day" id="calendar_full_day" />
                                                <span>Full Day</span>
                                            </Label>
                                            <Label htmlFor="calendar_half_day" className={cn("flex items-center space-x-2 rounded-xl border px-4 py-3 flex-1 cursor-pointer transition-colors", leaveFormData.leaveLength === 'half_day' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600' : 'border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50')}>
                                                <RadioGroupItem value="half_day" id="calendar_half_day" />
                                                <span>Half Day</span>
                                            </Label>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">Start Date *</Label>
                                        <input
                                            type="date"
                                            value={leaveFormData.startDate}
                                            onChange={(e) => setLeaveFormData((prev) => ({
                                                ...prev,
                                                startDate: e.target.value,
                                                endDate: prev.leaveLength === 'half_day'
                                                    ? e.target.value
                                                    : (prev.endDate && prev.endDate < e.target.value ? e.target.value : prev.endDate)
                                            }))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100"
                                            disabled={isSubmittingLeave}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-gray-700 dark:text-gray-300">End Date *</Label>
                                        <input
                                            type="date"
                                            value={leaveFormData.endDate}
                                            min={leaveFormData.startDate || formatDateToLocal(new Date())}
                                            onChange={(e) => setLeaveFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                                            className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-gray-800 dark:text-gray-100 disabled:opacity-60"
                                            disabled={isSubmittingLeave || leaveFormData.leaveLength === 'half_day'}
                                        />
                                    </div>
                                </div>

                                {leaveFormData.startDate && moment(leaveFormData.startDate).isBefore(moment(), 'day') && (
                                    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Backdated Leave Application</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">You are applying for leave starting in the past. Make sure this is intentional.</p>
                                        </div>
                                    </div>
                                )}

                                {selectedSlotRange && (
                                    <div className="rounded-2xl border border-cyan-200/70 dark:border-cyan-800/70 bg-cyan-50/60 dark:bg-cyan-950/20 p-4">
                                        <p className="text-sm font-medium text-cyan-800 dark:text-cyan-200">
                                            Drag selection captured
                                        </p>
                                        <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
                                            {moment(selectedSlotRange.start).format('dddd, MMM D')} to {moment(selectedSlotRange.end).format('dddd, MMM D')}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="calendar-reason" className="text-gray-700 dark:text-gray-300">Reason for Leave *</Label>
                                    <Textarea
                                        id="calendar-reason"
                                        placeholder="Please provide a detailed reason for your leave request..."
                                        value={leaveFormData.reason}
                                        onChange={(e) => setLeaveFormData((prev) => ({ ...prev, reason: e.target.value }))}
                                        className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 min-h-[120px]"
                                        disabled={isSubmittingLeave}
                                    />
                                </div>

                                {isLeaveSubmitError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                        <p className="text-red-600 dark:text-red-400 text-sm">
                                            {leaveSubmitError instanceof Error ? leaveSubmitError.message : 'An error occurred while submitting your application.'}
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                    <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        disabled={isSubmittingLeave || !token}
                                    >
                                        {isSubmittingLeave ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Application'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeApplyLeaveModal}
                                        className="bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        disabled={isSubmittingLeave}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                /* Birthday glow animation */
                @keyframes birthday-glow {
                    0% { box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3); }
                    100% { box-shadow: 0 6px 20px rgba(236, 72, 153, 0.5); }
                }

                /* Increased calendar height and day block sizes - Conservative approach */
                .rbc-calendar {
                    min-height: 500px;
                }
                
                @media (min-width: 640px) {
                    .rbc-calendar {
                        min-height: 800px;
                    }
                }
                
                /* Make day cells larger without breaking event positioning */
                .rbc-month-view {
                    border-radius: 12px;
                    overflow: hidden;
                }
                
                /* Increase row heights */
                .rbc-month-row {
                    min-height: 120px;
                }
                
                @media (min-width: 640px) {
                    .rbc-month-row {
                        min-height: 140px;
                    }
                }
                
                /* Day background cells */
                .rbc-day-bg {
                    min-height: 120px;
                    cursor: pointer;
                    transition: background 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
                }
                
                @media (min-width: 640px) {
                    .rbc-day-bg {
                        min-height: 140px;
                    }
                }
                
                /* Date cells with better spacing */
                .rbc-date-cell {
                    padding: 8px;
                    font-size: 14px;
                    transition: background-color 0.08s ease;
                }
                
                @media (min-width: 640px) {
                    .rbc-date-cell {
                        padding: 12px;
                        font-size: 16px;
                    }
                }
                
                .rbc-date-cell a {
                    font-weight: 600;
                    padding: 6px 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: inline-block;
                    min-width: 28px;
                    text-align: center;
                }

                .calendar-date-cell-wrapper {
                    height: 100%;
                    width: 100%;
                    transition: background 0.08s ease, box-shadow 0.08s ease, border-color 0.08s ease;
                }

                .calendar-date-cell-interactive {
                    cursor: pointer;
                }

                .calendar-date-cell-hovered {
                    background: linear-gradient(180deg, rgba(34, 211, 238, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
                    box-shadow: inset 0 0 0 2px rgba(14, 165, 233, 0.2);
                }

                .dark .calendar-date-cell-hovered {
                    background: linear-gradient(180deg, rgba(8, 145, 178, 0.18) 0%, rgba(37, 99, 235, 0.18) 100%);
                    box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.2);
                }

                .calendar-date-cell-selected {
                    background: linear-gradient(180deg, rgba(34,211,238,0.18) 0%, rgba(59,130,246,0.18) 100%);
                    box-shadow: inset 0 0 0 2px rgba(14,165,233,0.28);
                }

                .dark .calendar-date-cell-selected {
                    background: linear-gradient(180deg, rgba(8,145,178,0.28) 0%, rgba(37,99,235,0.28) 100%);
                    box-shadow: inset 0 0 0 2px rgba(34,211,238,0.28);
                }

                .calendar-date-cell-disabled {
                    cursor: pointer;
                }

                .rbc-day-bg:hover {
                    background: linear-gradient(180deg, rgba(34, 211, 238, 0.08) 0%, rgba(59, 130, 246, 0.08) 100%);
                    box-shadow: inset 0 0 0 2px rgba(14, 165, 233, 0.2);
                }

                .dark .rbc-day-bg:hover {
                    background: linear-gradient(180deg, rgba(8, 145, 178, 0.18) 0%, rgba(37, 99, 235, 0.18) 100%);
                    box-shadow: inset 0 0 0 2px rgba(34, 211, 238, 0.2);
                }

                .past-date-cell {
                    cursor: pointer !important;
                }

                .past-date-cell:hover {
                    background: inherit !important;
                    box-shadow: none !important;
                }

                .past-date-cell::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        135deg,
                        rgba(148, 163, 184, 0.08) 0px,
                        rgba(148, 163, 184, 0.08) 8px,
                        transparent 8px,
                        transparent 16px
                    );
                    pointer-events: none;
                }

                .rbc-slot-selection {
                    background: linear-gradient(135deg, rgba(34, 211, 238, 0.3) 0%, rgba(59, 130, 246, 0.3) 100%) !important;
                    border: 2px solid rgba(14, 165, 233, 0.5);
                    border-radius: 10px;
                }

                /* Let empty cell space hit the day background immediately while keeping labels/events clickable */
                .rbc-row-content {
                    pointer-events: none;
                }

                .rbc-date-cell,
                .rbc-date-cell a,
                .rbc-event,
                .rbc-show-more,
                .rbc-row-segment {
                    pointer-events: auto;
                }
                
                /* Preserve default event behavior - minimal overrides */
                .rbc-event {
                    border-radius: 4px;
                    font-weight: 500;
                    transition: all 0.2s ease;
                }
                
                .rbc-event:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                
                /* Header improvements for larger calendar */
                .rbc-header {
                    padding: 12px 8px;
                    font-size: 13px;
                    font-weight: 600;
                    background-color: #f8fafc;
                    border-bottom: 1px solid #e2e8f0;
                }
                
                .dark .rbc-header {
                    background-color: #334155;
                    border-bottom-color: #475569;
                }
                
                /* Today highlighting - responsive to dark mode */
                .rbc-today {
                    background-color: rgba(59, 130, 246, 0.1) !important;
                    border: 2px solid rgba(59, 130, 246, 0.3) !important;
                    position: relative;
                }
                
                .dark .rbc-today {
                    background-color: rgba(59, 130, 246, 0.15) !important;
                    border: 2px solid rgba(59, 130, 246, 0.4) !important;
                }
                
                /* Add subtle glow effect for today in dark mode */
                .dark .rbc-today::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.1) 100%);
                    border-radius: 8px;
                    z-index: -1;
                    pointer-events: none;
                }
                
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

                /* Custom popup styles to ensure it shows properly */
                .rbc-overlay {
                    background-color: white;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
                    padding: 0;
                    min-width: 200px;
                    max-width: 300px;
                    z-index: 1000;
                }
                
                .dark .rbc-overlay {
                    background-color: #1e293b;
                    border: 1px solid #475569;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                }
                
                .rbc-overlay-header {
                    background-color: #f8fafc;
                    color: #374151;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 8px 12px;
                    font-weight: 600;
                    font-size: 14px;
                    border-radius: 8px 8px 0 0;
                }
                
                .dark .rbc-overlay-header {
                    background-color: #334155;
                    color: #e2e8f0;
                    border-bottom: 1px solid #475569;
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
                
                .dark .rbc-month-row {
                    border-color: #475569;
                }
                
                .dark .rbc-day-bg {
                    background-color: #1e293b;
                    border-color: #475569;
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
                
                .dark .rbc-month-view .rbc-row {
                    border-color: #475569;
                }
                
                .dark .rbc-month-view .rbc-day-bg + .rbc-day-bg {
                    border-left-color: #475569;
                }

                .dark .rbc-header + .rbc-header {
                    border-left-color: #475569;
                }
                
                .dark .rbc-date-cell a:hover {
                    background-color: #334155;
                    border-radius: 4px;
                }
                
                .dark .rbc-off-range-bg {
                    background-color: #0f172a;
                }
                
                .dark .rbc-off-range {
                    color: #475569;
                }
                
                .dark .rbc-off-range .rbc-date-cell a {
                    color: #475569;
                }
                
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

                /* Ensure popup events are clickable */
                .rbc-event {
                    cursor: pointer !important;
                }
                
                .rbc-event:hover {
                    opacity: 0.8;
                }
                
                /* Responsive adjustments for mobile */
                @media (max-width: 640px) {
                    .rbc-month-row {
                        min-height: 100px;
                    }
                    
                    .rbc-day-bg {
                        min-height: 100px;
                    }
                    
                    .rbc-date-cell {
                        padding: 6px;
                        font-size: 12px;
                    }
                    
                    .rbc-date-cell a {
                        padding: 4px 6px;
                        min-width: 24px;
                        font-size: 14px;
                    }
                    
                    .rbc-header {
                        padding: 8px 4px;
                        font-size: 11px;
                    }
                }
                
            `}
            </style>
        </div>
    );
};

export default CalendarSection;
