export interface LeaveRequest {
    id: number;
    uid: number;
    leave_type: string;
    status: 'pending' | 'approved' | 'rejected';
    duration: string;
    start_date: string;
    end_date: string;
    feedback?: string;
    document?: string;
    leave_length: 'Full Day' | 'Half Day';
    leave_comment?: string;
    createdAt: string;
    updatedAt: string;
    approved_by?: number;
    approved_at?: string;
}
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    jobTitle?: string;
    managerId?: number;
}
export interface LeaveRequestWithUser extends LeaveRequest {
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    jobTitle?: string;
    managerFirstName?: string;
    managerLastName?: string;
}
export interface PublicHoliday {
    date: string;
    name: string;
    dayOfWeek: string;
}
export interface ExcludedDaysDetails {
    weekends: number;
    holidays: Date[];
    totalExcluded: number;
}
export declare const getSouthAfricanPublicHolidays: (year: number) => Date[];
export declare const calculateEaster: (year: number) => Date;
export declare const isPublicHoliday: (date: Date, holidays: Date[]) => boolean;
export declare const isWeekend: (date: Date) => boolean;
export declare const calculateTotalLeaveDays: (startDate: Date, endDate: Date) => Promise<number>;
export declare const getExcludedDaysDetails: (startDate: Date, endDate: Date) => ExcludedDaysDetails;
export declare const uploadToS3: (fileData: string, fileName: string, fileType: string, uid: string, leaveId: string) => Promise<string>;
export declare const getSignedUrlFromS3: (s3Key: string) => Promise<string>;
export declare const deleteFromS3: (s3Key: string) => Promise<void>;
export declare const formatDateTime: () => string;
