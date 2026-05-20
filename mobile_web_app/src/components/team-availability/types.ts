export interface LeaveRequest {
    id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    duration: number;
    leave_length: "half_day" | "full_day";
    status: "approved" | "pending" | "rejected";
    reason?: string;
}

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    status: "available" | "on-leave" | "upcoming-leave" | string;
    avatar: string;
    leaveType: string | null;
    leave_length: "half_day" | "full_day";
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

export interface ApiResponse {
    code: string;
    error: boolean;
    message: string;
    payload: { summary: string; teamMembers: TeamMember[] };
}
