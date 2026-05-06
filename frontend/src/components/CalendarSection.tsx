/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, startTransition, useCallback, useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, type Event } from 'react-big-calendar';
import moment from 'moment';
import { X, Loader2, AlertCircle, CalendarRange } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";

const localizer = momentLocalizer(moment);
const BigCalendar = Calendar as React.ComponentType<any>;
const sastDateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Johannesburg',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
});

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
        status: string;
    };
}

interface BirthdayPerson {
    userId: number;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    profilePicture?: string;
    age: number;
    isToday: boolean;
    avatar: string;
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
        isObserved: boolean;
        observedDate?: string;
        type: 'birthday';
        color: string;
        bgColor: string;
        avatar: string;
        groupedPeople?: BirthdayPerson[];
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
    status: string;
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
    onCellMouseDown: () => { },
    onCellMouseEnter: () => { },
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
    // const [, setShowMoreEvents] = useState<{ events: CalendarEvent[], date: Date, slot: Date } | null>(null);
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
    const publicHolidayDatesRef = useRef<Set<string>>(new Set());

    const handleCellMouseDown = useCallback((date: Date) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        // Don't start a drag selection on a public holiday
        if (publicHolidayDatesRef.current.has(dateStr)) return;
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

    // Fetch function — stable reference so prefetch can reuse it
    const fetchCalendarData = useCallback(async (startDate: string, endDate: string): Promise<ApiResponse> => {
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
    }, [authFetch]);

    // React Query hook — keepPreviousData shows the current month while the next loads
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
        placeholderData: keepPreviousData,
        retry: 2,
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });

    // Prefetch prev and next months so navigation feels instant
    useEffect(() => {
        const prefetch = (start: string, end: string) =>
            queryClient.prefetchQuery({
                queryKey: ['leaveCalendar', start, end],
                queryFn: () => fetchCalendarData(start, end),
                staleTime: 5 * 60 * 1000,
            });

        prefetch(
            moment(currentDate).subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
            moment(currentDate).subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        );
        prefetch(
            moment(currentDate).add(1, 'month').startOf('month').format('YYYY-MM-DD'),
            moment(currentDate).add(1, 'month').endOf('month').format('YYYY-MM-DD')
        );
    }, [currentDate, queryClient, fetchCalendarData]);

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

    // Extract the SAST calendar date from an API date string (handles both UTC midnight
    // and SAST-midnight-encoded-as-UTC that mysql2 may return), then create a local-midnight
    // Date so react-big-calendar renders it in the correct calendar cell in any browser timezone.
    const toCalendarDate = (dateStr: string): Date => {
        const sastDate = sastDateFormatter.format(new Date(dateStr)); // "YYYY-MM-DD"
        return new Date(`${sastDate}T00:00:00`); // local midnight (browser timezone)
    };

    // Convert API data to calendar events with deduplication
    const convertApiDataToEvents = useCallback((apiData: ApiResponse): CalendarEvent[] => {
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

            // Normalise dates to SAST calendar dates at local midnight so react-big-calendar
            // renders them in the correct cells regardless of browser timezone.
            const startDate = toCalendarDate(request.start_date);
            const endDate = toCalendarDate(request.end_date);
            endDate.setDate(endDate.getDate() + 1); // exclusive end for react-big-calendar

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
                    status: request.status,
                }
            };

            uniqueLeaveEvents.set(request.id, event);
        });

        events.push(...Array.from(uniqueLeaveEvents.values()));

        // Group birthdays by date so multiple people sharing a birthday become one event
        const birthdaysByDate = new Map<string, Birthday[]>();
        apiData.data.birthdays.forEach((birthday) => {
            const dateKey = birthday.birthdayDate.slice(0, 10);
            if (!birthdaysByDate.has(dateKey)) birthdaysByDate.set(dateKey, []);
            birthdaysByDate.get(dateKey)!.push(birthday);
        });

        birthdaysByDate.forEach((birthdays) => {
            const primary = birthdays[0];
            const birthdayDate = new Date(primary.birthdayDate);
            const avatar = getAvatar(primary.firstName.toUpperCase(), primary.lastName.toUpperCase());
            const dayOfWeek = birthdayDate.getDay();
            const isObserved = dayOfWeek === 6 || dayOfWeek === 0;
            let observedDate: string | undefined;
            if (isObserved) {
                const friday = new Date(birthdayDate);
                friday.setDate(friday.getDate() - (dayOfWeek === 6 ? 1 : 2));
                observedDate = moment(friday).format('MMMM Do');
            }

            const groupedPeople: BirthdayPerson[] = birthdays.map((b) => ({
                userId: b.userId,
                name: b.name,
                firstName: b.firstName,
                lastName: b.lastName,
                email: b.email,
                jobTitle: b.jobTitle,
                profilePicture: b.profilePicture,
                age: b.age,
                isToday: b.isToday,
                avatar: getAvatar(b.firstName.toUpperCase(), b.lastName.toUpperCase()),
            }));

            // Build a combined title for multiple birthdays
            let title: string;
            if (birthdays.length === 1) {
                title = `🎂 ${primary.name} (${primary.age})`;
            } else if (birthdays.length === 2) {
                title = `🎂 Happy Birthday ${primary.firstName} & ${birthdays[1].firstName}`;
            } else {
                title = `🎂 Happy Birthday ${primary.firstName} & ${birthdays.length - 1} others`;
            }

            const birthdayEvent: BirthdayEvent = {
                id: primary.id,
                title,
                start: birthdayDate,
                end: birthdayDate,
                allDay: true,
                resource: {
                    userId: primary.userId,
                    name: primary.name,
                    firstName: primary.firstName,
                    lastName: primary.lastName,
                    email: primary.email,
                    jobTitle: primary.jobTitle,
                    profilePicture: primary.profilePicture,
                    age: primary.age,
                    isToday: primary.isToday,
                    isObserved,
                    observedDate,
                    type: 'birthday',
                    color: 'text-pink-600',
                    bgColor: 'bg-pink-100',
                    avatar,
                    groupedPeople: birthdays.length > 1 ? groupedPeople : undefined,
                }
            };

            events.push(birthdayEvent);
        });

        return events;
    }, []);

    // Derived data
    const allEvents = useMemo(() => (
        apiData ? convertApiDataToEvents(apiData) : []
    ), [apiData, convertApiDataToEvents]);
    const deferredEvents = useDeferredValue(allEvents);
    const publicHolidays = useMemo(() => apiData?.data.publicHolidays || [], [apiData]);
    const publicHolidayDateSet = useMemo(
        () => new Set(publicHolidays.map((holiday) => holiday.date)),
        [publicHolidays]
    );
    const publicHolidayNameMap = useMemo(
        () => new Map(publicHolidays.map((holiday) => [holiday.date, toTitleCase(holiday.name)])),
        [publicHolidays]
    );

    // Keep a ref set of holiday date strings so handleCellMouseDown can check without a closure dep
    useEffect(() => {
        publicHolidayDatesRef.current = publicHolidayDateSet;
    }, [publicHolidayDateSet]);

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
        return publicHolidayDateSet.has(dateStr);
    };

    // Get public holiday name for a date
    const getPublicHolidayName = (date: Date) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        return publicHolidayNameMap.get(dateStr) || '';
    };

    const handleSelectEvent = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsDialogOpen(true);
    };

    // Handle "show more" popup
    // const handleShowMore = (events: CalendarEvent[], date: Date) => {
    //     setShowMoreEvents({ events, date, slot: date });
    // };

    const handleNavigate = useCallback((newDate: Date) => {
        setDragPreviewRange(null);
        setDragAnchorDate(null);
        setHoveredDate(null);
        dragAnchorRef.current = null;

        startTransition(() => {
            setCurrentDate(newDate);
        });
    }, []);

    const navigateMonth = useCallback((direction: 'prev' | 'next' | 'today') => {
        const nextDate = direction === 'today'
            ? new Date()
            : moment(currentDate)[direction === 'prev' ? 'subtract' : 'add'](1, 'month').toDate();

        handleNavigate(nextDate);
    }, [currentDate, handleNavigate]);

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

        // Check for overlapping leave requests for the current user.
        // Cancelled and rejected requests do not block re-application on the same dates.
        const hasOverlap = allEvents.some((event) => {
            if (isBirthdayEvent(event)) return false;
            const leaveEvent = event as LeaveEvent;
            if (leaveEvent.resource.email !== user?.email) return false;
            const status = leaveEvent.resource.status;
            if (status === 'cancelled' || status === 'rejected') return false;
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
        const isDark = document.documentElement.classList.contains('dark');

        if ('type' in resource && resource.type === 'birthday') {
            const bdRes = resource as BirthdayEvent['resource'];
            return {
                style: {
                    backgroundColor: isDark ? '#500724' : '#fdf2f8',
                    border: `1.5px solid ${isDark ? '#be185d' : '#f9a8d4'}`,
                    borderLeft: `3px solid #ec4899`,
                    color: isDark ? '#fbcfe8' : '#be185d',
                    borderRadius: 6,
                    animation: bdRes.isToday ? 'birthday-glow 2s ease-in-out infinite alternate' : 'none',
                }
            };
        }

        // Map bgColor → solid palette
        const paletteMap: Record<string, { bg: string; bgDark: string; accent: string; textLight: string; textDark: string }> = {
            'bg-blue-100': { bg: '#eff6ff', bgDark: '#1e3a5f', accent: '#3b82f6', textLight: '#1d4ed8', textDark: '#93c5fd' },
            'bg-red-100': { bg: '#fef2f2', bgDark: '#3b1219', accent: '#ef4444', textLight: '#b91c1c', textDark: '#fca5a5' },
            'bg-green-100': { bg: '#f0fdf4', bgDark: '#14362a', accent: '#22c55e', textLight: '#15803d', textDark: '#86efac' },
            'bg-purple-100': { bg: '#faf5ff', bgDark: '#2e1a4a', accent: '#a855f7', textLight: '#7e22ce', textDark: '#d8b4fe' },
            'bg-cyan-100': { bg: '#ecfeff', bgDark: '#0e3347', accent: '#06b6d4', textLight: '#0e7490', textDark: '#67e8f9' },
            'bg-indigo-100': { bg: '#eef2ff', bgDark: '#1e2b5e', accent: '#6366f1', textLight: '#4338ca', textDark: '#a5b4fc' },
            'bg-yellow-100': { bg: '#fefce8', bgDark: '#3b2f08', accent: '#eab308', textLight: '#a16207', textDark: '#fde047' },
            'bg-orange-100': { bg: '#fff7ed', bgDark: '#3b1f08', accent: '#f97316', textLight: '#c2410c', textDark: '#fdba74' },
            'bg-emerald-100': { bg: '#ecfdf5', bgDark: '#0d3326', accent: '#10b981', textLight: '#047857', textDark: '#6ee7b7' },
            'bg-violet-100': { bg: '#f5f3ff', bgDark: '#281545', accent: '#8b5cf6', textLight: '#6d28d9', textDark: '#c4b5fd' },
            'bg-sky-100': { bg: '#f0f9ff', bgDark: '#0d3050', accent: '#0ea5e9', textLight: '#0369a1', textDark: '#7dd3fc' },
            'bg-rose-100': { bg: '#fff1f2', bgDark: '#3b1020', accent: '#f43f5e', textLight: '#be123c', textDark: '#fda4af' },
            'bg-amber-100': { bg: '#fffbeb', bgDark: '#3b2900', accent: '#f59e0b', textLight: '#b45309', textDark: '#fcd34d' },
            'bg-lime-100': { bg: '#f7fee7', bgDark: '#1e3310', accent: '#84cc16', textLight: '#4d7c0f', textDark: '#bef264' },
            'bg-pink-100': { bg: '#fdf2f8', bgDark: '#3b1030', accent: '#ec4899', textLight: '#be185d', textDark: '#f9a8d4' },
        };

        const p = paletteMap[resource.bgColor] ?? { bg: '#f8fafc', bgDark: '#1e293b', accent: '#94a3b8', textLight: '#475569', textDark: '#94a3b8' };

        return {
            style: {
                backgroundColor: isDark ? p.bgDark : p.bg,
                borderLeft: `3px solid ${p.accent}`,
                border: `1px solid ${p.accent}40`,
                color: isDark ? p.textDark : p.textLight,
                borderRadius: 6,
            }
        };
    };

    // Custom day cell wrapper to highlight public holidays
    const dayPropGetter = (date: Date) => {
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isHoliday = isPublicHoliday(date);
        const isDarkMode = theme === 'dark';
        const isPastDate = moment(date).startOf('day').isBefore(moment().startOf('day'));
        const isFutureDate = moment(date).startOf('day').isAfter(moment().startOf('day'));
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

        if (isFutureDate && !isHoliday) {
            return {
                className: 'future-date-cell',
                style: {
                    // backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc',
                    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                    color: isDarkMode ? '#64748b' : '#94a3b8',
                    opacity: 0.9,
                    cursor: 'pointer',
                    position: 'relative'
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

        if ('type' in resource && resource.type === 'birthday') {
            const bdRes = resource as BirthdayEvent['resource'];
            let displayName: string;
            if (bdRes.groupedPeople && bdRes.groupedPeople.length > 1) {
                const firstNames = bdRes.groupedPeople.map((p) => p.firstName);
                displayName = firstNames.length === 2
                    ? `${firstNames[0]} & ${firstNames[1]}`
                    : `${firstNames[0]} & ${firstNames.length - 1} others`;
            } else {
                displayName = bdRes.name;
            }
            return (
                <div className="flex items-center gap-1 w-full min-w-0">
                    <span style={{ fontSize: 12 }}>🎂</span>
                    <span className="truncate text-[11px] font-semibold leading-tight">
                        Happy Birthday {displayName}
                    </span>
                </div>
            );
        }

        const leaveResource = resource as LeaveEvent['resource'];
        // Show initials chip + first name only (saves horizontal space)
        // const firstName = resource.name.split(' ')[0];

        return (
            <div className="flex items-center gap-1.5 w-full min-w-0">
                <span className="truncate text-[11px] font-semibold leading-tight flex-1 min-w-0">
                    {resource.name}
                    {' '}
                    <span className="font-normal opacity-80">{leaveResource.type}</span>
                </span>
                {leaveResource.duration >= 2 && (
                    <span className="flex-shrink-0 text-[9px] font-bold opacity-70">{leaveResource.duration}d</span>
                )}
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
    const CustomToolbar = ({ label }: { label: string }) => (
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                    ←
                </button>
                <span className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 min-w-[120px] sm:min-w-[200px] text-center">
                    {label}
                </span>
                <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                    →
                </button>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => navigateMonth('today')}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded text-sm font-medium transition-colors"
                >
                    Today
                </button>
                {isFetching && (
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
                            Team Calendar
                        </h2>
                        <div className="hidden md:flex items-center gap-2 rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50/80 dark:bg-cyan-950/30 px-3 py-1.5 text-xs font-medium text-cyan-700 dark:text-cyan-300">
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
                    <div className="relative w-full" style={{ minHeight: 960 }}>
                        {/* Blocking overlay only on initial load — navigation uses keepPreviousData instead */}
                        {isLoading && (
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
                            <BigCalendar
                                localizer={localizer}
                                events={deferredEvents}
                                startAccessor="start"
                                endAccessor="end"
                                onSelectEvent={handleSelectEvent}
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
                                style={{ height: 960 }}
                                formats={{
                                    monthHeaderFormat: 'MMMM YYYY',
                                    dayHeaderFormat: 'ddd',
                                    dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
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
                        {/* ↑ Added overflow-hidden here — this is the critical fix */}

                        {/* Header */}
                        <div className={`relative p-6 border-b border-gray-200/50 dark:border-slate-600/50 ${isBirthdayEvent(selectedEvent)
                            ? 'bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20'
                            : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-700 dark:to-slate-600'
                            }`}>
                            {/* header content unchanged */}
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
                                            {isBirthdayEvent(selectedEvent) && selectedEvent.resource.groupedPeople && selectedEvent.resource.groupedPeople.length > 1
                                                ? `${selectedEvent.resource.groupedPeople[0].firstName} & ${selectedEvent.resource.groupedPeople[1].firstName}${selectedEvent.resource.groupedPeople.length > 2 ? ` +${selectedEvent.resource.groupedPeople.length - 2}` : ''}`
                                                : selectedEvent.resource.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {isBirthdayEvent(selectedEvent) ? (
                                                <>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
                                                        🎉 Birthday
                                                    </span>
                                                    {!selectedEvent.resource.groupedPeople && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Turning {selectedEvent.resource.age}
                                                        </span>
                                                    )}
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

                        {/* Body — add overflow-y-auto so content scrolls instead of breaking layout */}
                        <div className="p-6 space-y-5 overflow-y-auto bg-gradient-to-b from-gray-50/30 to-white dark:from-slate-800/30 dark:to-slate-800">
                            {isBirthdayEvent(selectedEvent) ? (
                                <>
                                    {(selectedEvent.resource.groupedPeople && selectedEvent.resource.groupedPeople.length > 1
                                        ? selectedEvent.resource.groupedPeople
                                        : [selectedEvent.resource]
                                    ).map((person, idx) => (
                                        <div key={person.userId ?? idx} className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/10 dark:to-purple-900/10 rounded-2xl p-4 border border-pink-200 dark:border-pink-800/30">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-pink-200 dark:bg-pink-600/30 rounded-lg flex items-center justify-center">
                                                    <span className="text-pink-600 dark:text-pink-300 text-lg">🎈</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide">Birthday Message</p>
                                                    {user && String(user.id) === String(person.userId) ? (
                                                        <p className="text-sm text-pink-800 dark:text-pink-200 font-semibold">
                                                            {selectedEvent.resource.isToday
                                                                ? `🎉 Happy Birthdayyy ${person.firstName}, Wishing you a fantastic day!`
                                                                : selectedEvent.resource.isObserved
                                                                    ? `It's Your Birthday ${person.firstName} on ${moment(selectedEvent.start).format('MMMM Do')} (Observed on ${selectedEvent.resource.observedDate} - weekend)`
                                                                    : `It's Your Birthday ${person.firstName} on ${moment(selectedEvent.start).format('MMMM Do')}`
                                                            }
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                                            {selectedEvent.resource.isToday
                                                                ? `🎉 Happy Birthday ${person.firstName}! Wishing a fantastic day!`
                                                                : selectedEvent.resource.isObserved
                                                                    ? `🎂 ${person.firstName} turns ${person.age} on ${moment(selectedEvent.start).format('MMMM Do')} (Observed on ${selectedEvent.resource.observedDate} - weekend)`
                                                                    : `🎂 ${person.firstName} turns ${person.age} on ${moment(selectedEvent.start).format('MMMM Do')}`
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div className="bg-white dark:bg-slate-700/50 rounded-2xl overflow-hidden p-4 border border-gray-100 dark:border-slate-600/30 hover:shadow-md transition-shadow duration-200">
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

                                    <div className="bg-white dark:bg-slate-700/50 rounded-2xl overflow-hidden p-4 border border-gray-100 dark:border-slate-600/30 hover:shadow-md transition-shadow duration-200">
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

                                    {selectedEvent.resource.description && (
                                        <div className="bg-gray-50 dark:bg-slate-700/30 rounded-2xl overflow-hidden p-4 border border-gray-200 dark:border-slate-600/30">
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

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-100 dark:border-slate-600/30">
                            <div className="flex gap-2">
                                {isBirthdayEvent(selectedEvent) && (
                                    <button
                                        onClick={() => console.log('Send birthday message to:', selectedEvent.resource.email)}
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
                /* ── Calendar base ─────────────────────────────────────────── */
                .rbc-calendar {
                    font-family: inherit;
                }

                /* ── Month view shell ──────────────────────────────────────── */
                .rbc-month-view {
                    border-radius: 12px;
                    overflow: hidden;
                    border: 1px solid #d1d9e0;
                    background: #ffffff;
                }
                .dark .rbc-month-view {
                    border: 1px solid #334155;
                    background: #1e293b;
                }

                /* ── Week day headers ──────────────────────────────────────── */
                .rbc-header {
                    padding: 10px 8px;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    background: #f1f5f9;
                    border-bottom: 2px solid #d1d9e0;
                    border-right: 1px solid #d1d9e0;
                    color: #64748b;
                    text-align: center;
                }
                .rbc-header:last-child { border-right: none; }
                .dark .rbc-header {
                    background: #172033;
                    border-bottom: 2px solid #334155;
                    border-right: 1px solid #334155;
                    color: #475569;
                }
                .dark .rbc-header:last-child { border-right: none; }

                /* ── Month rows ────────────────────────────────────────────── */
                .rbc-month-row {
                    min-height: 130px;
                    overflow: visible;
                    border-bottom: none; /* let rbc-day-bg handle bottom borders */
                }
                .rbc-month-row:last-child { border-bottom: none; }
                .dark .rbc-month-row { border-bottom: none; }
                .dark .rbc-month-row:last-child { border-bottom: none; }
                @media (min-width: 640px) { .rbc-month-row { min-height: 150px; } }
                @media (max-width: 640px) { .rbc-month-row { min-height: 110px; } }

                /* Force the row container to use a full border grid */
                .rbc-month-view .rbc-row-bg {
                    border-top: 1px solid #d1d9e0;
                }
                .dark .rbc-month-view .rbc-row-bg {
                    border-top: 1px solid #334155;
                }
                .rbc-month-view .rbc-row-bg:first-child {
                    border-top: none;
                }


                /* ── Day blocks — current-month cells ──────────────────────── */
                .rbc-day-bg {
                    background: #ffffff;
                    border-right: 1px solid #d1d9e0;
                    border-bottom: 1px solid #d1d9e0;
                    min-height: 150px;
                    cursor: pointer;
                    transition: background 0.1s ease;
                }
                .rbc-day-bg:last-child { border-right: none; }

                .dark .rbc-day-bg {
                    background: #1e293b;
                    border-right: 1px solid #334155;
                    border-bottom: 1px solid #334155;
                }
                .dark .rbc-day-bg:last-child { border-right: none; }

                /* ── Off-range (previous / next month) ─────────────────────── */
                .rbc-off-range-bg {
                    background: #f5f7fa !important;
                }
                .dark .rbc-off-range-bg {
                    background: #111827 !important;
                }
                .rbc-off-range .rbc-date-cell a,
                .rbc-off-range .rbc-date-cell { color: #c5cdd9 !important; }
                .dark .rbc-off-range .rbc-date-cell a,
                .dark .rbc-off-range .rbc-date-cell { color: #2e3a4d !important; }

                /* ── Today ─────────────────────────────────────────────────── */
                .rbc-today {
                    background: rgba(59,130,246,0.08) !important;
                    border-right: 1px solid #d1d9e0 !important;
                }
                .dark .rbc-today {
                    background: rgba(59,130,246,0.13) !important;
                    border-right: 1px solid #334155 !important;
                }

                /* Public holiday always wins over today's blue tint */
                .rbc-today.public-holiday-cell {
                    background: #fef3c7 !important;
                    border: 2px solid #f59e0b !important;
                }
                .dark .rbc-today.public-holiday-cell {
                    background: #431407 !important;
                    border: 2px solid #9a3412 !important;
                }

                /* ── Date number ────────────────────────────────────────────── */
                .rbc-date-cell { padding: 6px 8px 2px; text-align: right; }
                .rbc-date-cell > a {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    font-size: 13px;
                    font-weight: 600;
                    text-decoration: none;
                    color: #374151;
                    transition: background 0.15s ease, color 0.15s ease;
                }
                .rbc-date-cell > a:hover { background: #e0e7ff; color: #4338ca; }
                .dark .rbc-date-cell > a { color: #cbd5e1; }
                .dark .rbc-date-cell > a:hover { background: #312e81; color: #c7d2fe; }

                /* Today's number — filled blue circle */
                .rbc-today .rbc-date-cell > a {
                    background: #3b82f6 !important;
                    color: #ffffff !important;
                }
                .rbc-today .rbc-date-cell > a:hover { background: #2563eb !important; }

                /* ── Hover on interactive cells ─────────────────────────────── */
                .rbc-day-bg:hover:not(.rbc-off-range-bg) { background: #f0f6ff; }
                .dark .rbc-day-bg:hover:not(.rbc-off-range-bg) { background: #1a2e46; }

                /* ── Weekend tint ───────────────────────────────────────────── */
                .weekend-cell { background: #fafbfc !important; }
                .dark .weekend-cell { background: #192030 !important; }

                /* ── Past dates ─────────────────────────────────────────────── */
                .past-date-cell { cursor: pointer !important; }
                .past-date-cell .rbc-date-cell > a { color: #94a3b8 !important; }
                .dark .past-date-cell .rbc-date-cell > a { color: #3d4f65 !important; }
                .past-date-cell:hover { background: inherit !important; box-shadow: none !important; }

                /* ── Custom drag-select wrapper ─────────────────────────────── */
                .calendar-date-cell-wrapper {
                    height: 100%;
                    width: 100%;
                    transition: background 0.08s ease, box-shadow 0.08s ease;
                }
                .calendar-date-cell-interactive { cursor: pointer; }
                .calendar-date-cell-hovered {
                    background: rgba(34,211,238,0.09);
                    box-shadow: inset 0 0 0 2px rgba(14,165,233,0.25);
                }
                .dark .calendar-date-cell-hovered {
                    background: rgba(8,145,178,0.16);
                    box-shadow: inset 0 0 0 2px rgba(34,211,238,0.22);
                }
                .calendar-date-cell-selected {
                    background: rgba(34,211,238,0.14);
                    box-shadow: inset 0 0 0 2px rgba(14,165,233,0.32);
                }
                .dark .calendar-date-cell-selected {
                    background: rgba(8,145,178,0.24);
                    box-shadow: inset 0 0 0 2px rgba(34,211,238,0.32);
                }
                .calendar-date-cell-disabled { cursor: pointer; }

                /* ── Events ─────────────────────────────────────────────────── */
                .rbc-event {
                    border-radius: 5px;
                    font-weight: 500;
                    margin: 1px 2px;
                    padding: 2px 5px;
                    min-height: 20px;
                    font-size: 11px;
                    line-height: 1.3;
                    border: 1px solid transparent;
                    transition: opacity 0.15s ease, transform 0.1s ease, box-shadow 0.1s ease;
                }
                .rbc-event:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                    box-shadow: 0 3px 8px rgba(0,0,0,0.12);
                }
                .rbc-event-content { font-size: 11px; line-height: 1.3; }
                .rbc-row-segment { padding: 0 1px; height: auto; }

                /* ── "+X more" link ─────────────────────────────────────────── */
                .rbc-show-more {
                    color: #3b82f6;
                    font-weight: 600;
                    font-size: 11px;
                    padding: 2px 5px;
                    border-radius: 4px;
                    margin: 1px 2px;
                    display: block;
                    cursor: pointer;
                    background: transparent;
                }
                .rbc-show-more:hover { color: #1d4ed8; background: #eff6ff; text-decoration: underline; }
                .dark .rbc-show-more { color: #60a5fa !important; }
                .dark .rbc-show-more:hover { color: #93c5fd !important; background: #1e3a8a; }

                /* ── Slot selection ──────────────────────────────────────────── */
                .rbc-slot-selection {
                    background: linear-gradient(135deg, rgba(34,211,238,0.25) 0%, rgba(59,130,246,0.25) 100%) !important;
                    border: 2px solid rgba(14,165,233,0.45);
                    border-radius: 8px;
                }

                /* ── Pointer events ──────────────────────────────────────────── */
                .rbc-row-content { pointer-events: none; }
                .rbc-date-cell, .rbc-date-cell a, .rbc-event, .rbc-show-more, .rbc-row-segment { pointer-events: auto; }

                /* ── Public holiday cell ─────────────────────────────────────── */
                .public-holiday-cell { position: relative; }
                .public-holiday-cell::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: repeating-linear-gradient(
                        -45deg,
                        rgba(245,158,11,0.06) 0px,
                        rgba(245,158,11,0.06) 4px,
                        transparent 4px,
                        transparent 10px
                    );
                    pointer-events: none;
                }

                /* ── Popup overlay ───────────────────────────────────────────── */
                .rbc-overlay {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    box-shadow: 0 12px 28px rgba(0,0,0,0.14);
                    padding: 0;
                    min-width: 200px;
                    max-width: 300px;
                    z-index: 1000;
                }
                .dark .rbc-overlay {
                    background: #1e293b;
                    border: 1px solid #334155;
                    box-shadow: 0 12px 28px rgba(0,0,0,0.35);
                }
                .rbc-overlay-header {
                    background: #f8fafc;
                    color: #374151;
                    border-bottom: 1px solid #e5e7eb;
                    padding: 8px 12px;
                    font-weight: 700;
                    font-size: 13px;
                    border-radius: 10px 10px 0 0;
                }
                .dark .rbc-overlay-header {
                    background: #273548;
                    color: #e2e8f0;
                    border-bottom: 1px solid #334155;
                }

                /* ── Dark mode base ──────────────────────────────────────────── */
                .dark .rbc-calendar { background: #1e293b; color: #e2e8f0; }
                .dark .rbc-toolbar { color: #e2e8f0; }
                .dark .rbc-toolbar button { background: #1a2740; color: #e2e8f0; border: 1px solid #273548; }
                .dark .rbc-toolbar button:hover { background: #273548; }
                .dark .rbc-toolbar button.rbc-active { background: #3b82f6; border-color: #3b82f6; }

                /* ── Selected range ──────────────────────────────────────────── */
                .selected-leave-range-cell { position: relative; cursor: pointer; }

                /* ── Birthday glow ───────────────────────────────────────────── */
                @keyframes birthday-glow {
                    0%   { box-shadow: 0 4px 12px rgba(236,72,153,0.30); }
                    100% { box-shadow: 0 6px 22px rgba(236,72,153,0.55); }
                }
                `}
            </style>
        </div>
    );
};

export default CalendarSection;
