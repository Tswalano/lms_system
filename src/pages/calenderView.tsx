import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID } from '../api/types';
import { useState, useEffect } from 'react';
import { sysColors } from '../utils/Util';
import { FaTimes, FaCalendar, FaUser, FaAlignLeft } from 'react-icons/fa';

type CalendarEvent = {
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    backgroundColor: string;
    description?: string;
    fullName: string;
    leaveType: string;
};

interface EventDetailsPopupProps {
    event: CalendarEvent;
    onClose: () => void;
}

const getLeaveTypeBadgeClass = (leaveType: string): string => {
    const type = leaveType.toLowerCase();
    if (type.includes('annual')) return 'annual';
    if (type.includes('sick')) return 'sick';
    if (type.includes('personal')) return 'personal';
    return 'other';
};

function CalendarView() {
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [cookies] = useCookies(["token"]);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const { data, isLoading, isError } = useQuery<LeaveAPIResponseUID>({
        queryKey: ['calendarLeaveRequest'],
        queryFn: () => getAllLeaveRequestsFn(cookies.token),
    });

    useEffect(() => {
        if (data?.leaveData && data.leaveData.length > 0) {
            const newEvents = data.leaveData
                .filter(item => item.status !== "Rejected")
                .map((item) => ({
                    title: `${item.fullName} - ${item.leave_type}`,
                    start: item.start_date,
                    end: item.end_date,
                    allDay: true,
                    backgroundColor: item.status === "pending"
                        ? sysColors.warning
                        : sysColors.success,
                    description: item.leave_comment,
                    fullName: item.fullName,
                    leaveType: item.leave_type
                }));

            setCalendarEvents(newEvents);
        }
    }, [data?.leaveData]);

    if (isLoading) return <div className="loading">Loading...</div>;
    if (isError) return <div className="error">Error loading leave requests</div>;

    const handleEventClick = (eventInfo: any) => {
        const event = eventInfo.event;
        setSelectedEvent({
            title: event.title,
            start: event.start.toISOString(),
            end: event.end ? event.end.toISOString() : event.start.toISOString(),
            allDay: event.allDay,
            backgroundColor: event.backgroundColor,
            description: event.extendedProps.description,
            fullName: event.extendedProps.fullName,
            leaveType: event.extendedProps.leaveType
        });
    };

    const renderEventContent = (eventInfo: any) => {
        return (
            <div
                className="event-content cursor-pointer"
                style={{ cursor: 'pointer' }} // Ensure the mouse pointer appears
            >
                <span>{eventInfo.event.title}</span>
            </div>
        );
    };

    return (
        <div className="calendar-container">
            <div className="calendar-wrapper">
                <FullCalendar
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,dayGridWeek'
                    }}
                    height="auto"
                    eventContent={renderEventContent}
                />
            </div>

            {selectedEvent && (
                <EventDetailsPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}

const EventDetailsPopup = ({ event, onClose }: EventDetailsPopupProps) => {
    const formatDate = (date: string) => {
        const dateObj = new Date(date);
        return {
            dateStr: dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            }),
            timeStr: dateObj.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            })
        };
    };

    const startDate = formatDate(event.start);
    const endDate = formatDate(event.end);

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <div className="popup-header">
                    <h3 className="popup-title">{event.leaveType}</h3>
                    <button onClick={onClose} className="close-button">
                        <FaTimes className="close-icon" />
                    </button>
                </div>

                <div className="event-details">
                    <div className="date-range">
                        <FaCalendar className="detail-icon" />
                        <div className="date-range-content">
                            <div className="date-item">
                                {startDate.dateStr} at {startDate.timeStr}
                            </div>
                            <div className="date-item">
                                {endDate.dateStr} at {endDate.timeStr}
                            </div>
                        </div>
                    </div>

                    <div className="detail-item">
                        <FaUser className="detail-icon" />
                        <div className="detail-content">
                            <p>{event.fullName}</p>
                        </div>
                    </div>

                    {event.description && (
                        <div className="detail-item">
                            <FaAlignLeft className="detail-icon" />
                            <div className="detail-content">
                                <p>{event.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="leave-type-badge">
                        {event.leaveType}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;