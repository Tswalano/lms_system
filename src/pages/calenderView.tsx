import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin!
import { useQuery } from '@tanstack/react-query';
import { getAllLeaveRequestsFn } from '../api/authAPI';
import { useCookies } from 'react-cookie';
import { LeaveAPIResponseUID } from '../api/types';
import { useState, useEffect } from 'react';
import { sysColors } from '../utils/Util';

type CalenderEvent = {
    title: string;
    start: string;
    end: string;
    allDay: boolean;
    backgroundColor: string;
};

function CalenderView() {
    const [calenderEvents, setCalenderEvents] = useState<CalenderEvent[]>([]);
    const [cookies] = useCookies(["token"]);

    const { data } = useQuery<LeaveAPIResponseUID>({
        queryKey: ['calenderLeaveRequest'],
        queryFn: () => getAllLeaveRequestsFn(cookies.token),
    });

    console.log(data)

    useEffect(() => {
        if (data?.leaveData && data.leaveData.length > 0) {
            // Clear old events before adding new ones
            const newEvents = data.leaveData
                .filter(item => item.status !== "Rejected") // Filter out "Rejected" events
                .map((item) => {
                    return {
                        title: `${item.fullName} - ${item.leave_type}`,
                        start: item.start_date,
                        end: item.end_date,
                        allDay: true,
                        backgroundColor: item.status === "pending"
                            ? sysColors.warning
                            : sysColors.success, // Use success color for approved leave
                    };
                });

            setCalenderEvents(newEvents);
        }
    }, [data?.leaveData]);


    return (
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <FullCalendar
                plugins={[dayGridPlugin]}
                initialView="dayGridMonth"
                weekends={false}
                events={calenderEvents}
                height="auto"
                aspectRatio={1.5} // Adjust this ratio for compactness
                contentHeight={500} // Adjust the height to make it smaller
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,dayGridWeek',
                }}
                buttonText={{
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                }}
                eventDisplay="block" // Show events as blocks
                eventTextColor="white" // Ensures event text is readable
                dayMaxEventRows={2} // Limits the number of events shown per day
                moreLinkClick="popover" // Shows remaining events in a popover
                dayMaxEvents={3} // Adjust this to limit events per day
                editable={true}
            />
            <style>{`
                /* Responsive styles for button positioning */
                .fc-toolbar {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }

                @media (min-width: 600px) {
                    .fc-toolbar {
                        flex-direction: row;
                        justify-content: space-between;
                    }
                }

                /* Adjust calendar header buttons for small screens */
                .fc-toolbar-chunk:first-child {
                    order: 1;
                    margin-bottom: 0.5rem;
                }

                .fc-toolbar-chunk:last-child {
                    order: 2;
                    margin-bottom: 0.5rem;
                }

                .fc-toolbar-title {
                    order: 3;
                }

                @media (min-width: 600px) {
                    .fc-toolbar-chunk:first-child,
                    .fc-toolbar-chunk:last-child {
                        order: unset;
                        margin-bottom: 0;
                    }

                    .fc-toolbar-title {
                        order: unset;
                    }
                }
            `}</style>
        </div>
    );
}

export default CalenderView;
