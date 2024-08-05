import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import { useQuery } from '@tanstack/react-query'
import { getAllLeaveRequestsFn } from '../api/authAPI'
import { useCookies } from 'react-cookie'
import { LeaveAPIResponseUID } from '../api/types'
import { useState, useEffect } from 'react'
import { sysColors } from '../utils/Util'

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
    })

    useEffect(() => {
        if (data?.leaveData && data.leaveData.length > 0) {
            data.leaveData.map((item) => {
                return {
                    title: `${item.fullName} - ${item.leave_type}`,
                    start: item.start_date,
                    end: item.end_date,
                    allDay: true,
                    backgroundColor: item.status === "pending"
                        ? sysColors.warning
                        : item.status === "Rejected"
                            ? sysColors.error
                            : sysColors.success,
                };
            }).forEach((event) => {
                setCalenderEvents((prevEvents) => [...prevEvents, event]);
            });
        }
    }, [data?.leaveData]);



    return (
        <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            weekends={false}
            events={calenderEvents}
        />
    )
}

export default CalenderView