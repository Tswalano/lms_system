import { z } from 'zod';

// Leave Application Schema
export const leaveApplicationSchema = z.object({
    leave_type: z.string().min(1, "Leave type is required"),
    leave_start: z.string().min(1, "Start date is required"),
    leave_end: z.string().min(1, "End date is required"),
    leave_length: z.enum(["Full Day", "Half Day"], {
        errorMap: () => ({ message: "Leave length must be 'Full Day' or 'Half Day'" })
    }),
    leave_comment: z.string().optional().default("")
});

// Leave Update Schema
export const leaveUpdateSchema = z.object({
    leave_type: z.string().min(1, "Leave type is required").optional(),
    leave_start: z.string().min(1, "Start date is required").optional(),
    leave_end: z.string().min(1, "End date is required").optional(),
    leave_length: z.enum(["Full Day", "Half Day"]).optional(),
    leave_comment: z.string().optional()
});

// Leave Approval Schema
export const leaveApprovalSchema = z.object({
    action: z.enum(["approve", "reject"], {
        errorMap: () => ({ message: "Action must be 'approve' or 'reject'" })
    }),
    feedback: z.string().optional().default("")
});

// File Upload Schema
export const fileUploadSchema = z.object({
    file_type: z.string().min(1, "File type is required"),
    file_name: z.string().min(1, "File name is required"),
    file_data: z.string().min(1, "File data is required")
});

// Leave Calculation Schema
export const leaveCalculationSchema = z.object({
    leave_start: z.string().min(1, "Start date is required"),
    leave_end: z.string().min(1, "End date is required"),
    leave_length: z.enum(["Full Day", "Half Day"])
});

// Auth Schemas
export const loginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Valid email is required")
});

export const resetPasswordSchema = z.object({
    email: z.string().email("Valid email is required"),
    code: z.string().min(1, "Verification code is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters")
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required")
});

// Type definitions for the schemas
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;

// Type definitions for the schemas
export type LeaveApplicationData = z.infer<typeof leaveApplicationSchema>;
export type LeaveUpdateData = z.infer<typeof leaveUpdateSchema>;
export type LeaveApprovalData = z.infer<typeof leaveApprovalSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type LeaveCalculationData = z.infer<typeof leaveCalculationSchema>;


// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: any[];
}

export interface PaginationData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage?: boolean;
    hasPreviousPage?: boolean;
}

export interface LeaveStatsData {
    year: string;
    summary: {
        totalApprovedDays: number;
        pendingRequests: number;
        rejectedRequests: number;
    };
    leaveTypeBreakdown: Array<{
        leave_type: string;
        status: string;
        count: number;
        total_days: number;
    }>;
}

export interface LeaveBalanceData {
    annual_leave: number;
    sick_leave: number;
    personal_leave: number;
    used_annual: number;
    used_sick: number;
    used_personal: number;
}

export interface LeaveTypeStats {
    leave_type: string;
    total_requests: number;
    approved_count: number;
    pending_count: number;
    rejected_count: number;
}

export interface LeaveCalculationResult {
    totalDays: number;
    startDate: string;
    endDate: string;
    leaveLength: string;
    excludedDays: {
        weekends: number;
        publicHolidays: number;
        totalExcluded: number;
    };
    warnings: string[];
}