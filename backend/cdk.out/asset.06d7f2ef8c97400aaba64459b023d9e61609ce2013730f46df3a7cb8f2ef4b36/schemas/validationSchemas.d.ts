import { z } from 'zod';
export declare const leaveApplicationSchema: z.ZodObject<{
    leave_type: z.ZodString;
    leave_start: z.ZodString;
    leave_end: z.ZodString;
    leave_length: z.ZodEnum<["Full Day", "Half Day"]>;
    leave_comment: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    leave_type: string;
    leave_start: string;
    leave_end: string;
    leave_length: "Full Day" | "Half Day";
    leave_comment: string;
}, {
    leave_type: string;
    leave_start: string;
    leave_end: string;
    leave_length: "Full Day" | "Half Day";
    leave_comment?: string | undefined;
}>;
export declare const leaveUpdateSchema: z.ZodObject<{
    leave_type: z.ZodOptional<z.ZodString>;
    leave_start: z.ZodOptional<z.ZodString>;
    leave_end: z.ZodOptional<z.ZodString>;
    leave_length: z.ZodOptional<z.ZodEnum<["Full Day", "Half Day"]>>;
    leave_comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    leave_type?: string | undefined;
    leave_start?: string | undefined;
    leave_end?: string | undefined;
    leave_length?: "Full Day" | "Half Day" | undefined;
    leave_comment?: string | undefined;
}, {
    leave_type?: string | undefined;
    leave_start?: string | undefined;
    leave_end?: string | undefined;
    leave_length?: "Full Day" | "Half Day" | undefined;
    leave_comment?: string | undefined;
}>;
export declare const leaveApprovalSchema: z.ZodObject<{
    action: z.ZodEnum<["approve", "reject"]>;
    feedback: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    action: "reject" | "approve";
    feedback: string;
}, {
    action: "reject" | "approve";
    feedback?: string | undefined;
}>;
export declare const fileUploadSchema: z.ZodObject<{
    file_type: z.ZodString;
    file_name: z.ZodString;
    file_data: z.ZodString;
}, "strip", z.ZodTypeAny, {
    file_type: string;
    file_name: string;
    file_data: string;
}, {
    file_type: string;
    file_name: string;
    file_data: string;
}>;
export declare const leaveCalculationSchema: z.ZodObject<{
    leave_start: z.ZodString;
    leave_end: z.ZodString;
    leave_length: z.ZodEnum<["Full Day", "Half Day"]>;
}, "strip", z.ZodTypeAny, {
    leave_start: string;
    leave_end: string;
    leave_length: "Full Day" | "Half Day";
}, {
    leave_start: string;
    leave_end: string;
    leave_length: "Full Day" | "Half Day";
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    username: string;
}, {
    password: string;
    username: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const resetPasswordSchema: z.ZodObject<{
    email: z.ZodString;
    code: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    email: string;
    newPassword: string;
}, {
    code: string;
    email: string;
    newPassword: string;
}>;
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export type LoginData = z.infer<typeof loginSchema>;
export type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordData = z.infer<typeof resetPasswordSchema>;
export type RefreshTokenData = z.infer<typeof refreshTokenSchema>;
export type LeaveApplicationData = z.infer<typeof leaveApplicationSchema>;
export type LeaveUpdateData = z.infer<typeof leaveUpdateSchema>;
export type LeaveApprovalData = z.infer<typeof leaveApprovalSchema>;
export type FileUploadData = z.infer<typeof fileUploadSchema>;
export type LeaveCalculationData = z.infer<typeof leaveCalculationSchema>;
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
