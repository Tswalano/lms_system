import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID } from '../api/types';
import { useState, useEffect } from 'react';
import { FaTimes, FaCalendar, FaUser, FaAlignLeft } from 'react-icons/fa';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { motion } from "framer-motion"; // Importing motion

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

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const handleYearChange = (increment: number) => {
        setSelectedYear(prevYear => prevYear + increment);
    };

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
                    end: new Date(new Date(item.end_date).setDate(new Date(item.end_date).getDate() + 1)).toISOString().split("T")[0], // Add one day to the end date
                    allDay: true,
                    backgroundColor: item.status === "pending"
                        ? '#FFB84D' // color for pending status
                        : '#26F596', // color for approved status
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
            end: event.end ? new Date(new Date(event.end).setDate(new Date(event.end).getDate() - 1)).toISOString() : event.start.toISOString(),
            allDay: event.allDay,
            backgroundColor: event.backgroundColor,
            description: event.extendedProps.description,
            fullName: event.extendedProps.fullName,
            leaveType: event.extendedProps.leaveType
        });
    };

    const renderEventContent = (eventInfo: any) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                <div
                    className="event-content cursor-pointer"
                    style={{
                        cursor: 'pointer',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        backgroundColor: eventInfo.event.backgroundColor,
                        color: '#fff',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <span>{eventInfo.event.title}</span>
                </div>
            </motion.div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="calendar-container" style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '10px' }}>
                <div className="calendar-wrapper" style={{ boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', borderRadius: '10px' }}>
                    <FullCalendar
                        plugins={[dayGridPlugin]}
                        initialView="dayGridMonth"
                        events={calendarEvents}
                        eventClick={handleEventClick}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,dayGridWeek',
                        }}
                        height="auto"
                        eventContent={renderEventContent}
                        eventColor="#26F596"
                    />
                </div>

                {selectedEvent && (
                    <EventDetailsPopup event={selectedEvent} onClose={() => setSelectedEvent(null)} />
                )}
            </div>
        </motion.div>
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
        <div className="popup-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            <div className="popup-content" style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                padding: '20px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
            }}>
                <div className="popup-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                }}>
                    <h3 className="popup-title" style={{ color: '#333', fontSize: '18px' }}>{event.leaveType}</h3>
                    <button onClick={onClose} className="close-button" style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#333',
                    }}>
                        <FaTimes className="close-icon" />
                    </button>
                </div>

                <div className="event-details">
                    <div className="date-range" style={{ marginBottom: '10px' }}>
                        <FaCalendar className="detail-icon" style={{ color: '#26F596' }} />
                        <div className="date-range-content" style={{ marginLeft: '10px' }}>
                            <div className="date-item" style={{ fontSize: '14px' }}>
                                {startDate.dateStr} at {startDate.timeStr}
                            </div>
                            <div className="date-item" style={{ fontSize: '14px' }}>
                                {endDate.dateStr} at {endDate.timeStr}
                            </div>
                        </div>
                    </div>

                    <div className="detail-item" style={{ marginBottom: '10px' }}>
                        <FaUser className="detail-icon" style={{ color: '#26F596' }} />
                        <div className="detail-content">
                            <p style={{ fontSize: '14px' }}>{event.fullName}</p>
                        </div>
                    </div>

                    {event.description && (
                        <div className="detail-item" style={{ marginBottom: '10px' }}>
                            <FaAlignLeft className="detail-icon" style={{ color: '#26F596' }} />
                            <div className="detail-content">
                                <p style={{ fontSize: '14px' }}>{event.description}</p>
                            </div>
                        </div>
                    )}

                    <div className="leave-type-badge" style={{
                        backgroundColor: '#00B1FF',
                        color: '#fff',
                        padding: '5px 10px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        display: 'inline-block',
                    }}>
                        {event.leaveType}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
