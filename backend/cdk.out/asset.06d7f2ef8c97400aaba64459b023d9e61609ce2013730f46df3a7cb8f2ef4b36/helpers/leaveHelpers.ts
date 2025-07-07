
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Interfaces
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

// AWS Configuration
const s3Client = new S3Client({ region: "af-south-1" });
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || "lms-sick-notes-bucket";

// Date Calculation Functions
export const getSouthAfricanPublicHolidays = (year: number): Date[] => {
    const holidays: Date[] = [];
    holidays.push(new Date(year, 0, 1));   // New Year's Day
    holidays.push(new Date(year, 2, 21));  // Human Rights Day
    holidays.push(new Date(year, 3, 27));  // Freedom Day
    holidays.push(new Date(year, 4, 1));   // Workers' Day
    holidays.push(new Date(year, 5, 16));  // Youth Day
    holidays.push(new Date(year, 7, 9));   // National Women's Day
    holidays.push(new Date(year, 8, 24));  // Heritage Day
    holidays.push(new Date(year, 11, 16)); // Day of Reconciliation
    holidays.push(new Date(year, 11, 25)); // Christmas Day
    holidays.push(new Date(year, 11, 26)); // Day of Goodwill

    const easter = calculateEaster(year);
    holidays.push(new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000)); // Good Friday
    holidays.push(new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000)); // Family Day

    return holidays.map(holiday => {
        const dayOfWeek = holiday.getDay();
        if (dayOfWeek === 0) return new Date(holiday.getTime() + 24 * 60 * 60 * 1000);
        if (dayOfWeek === 6) return new Date(holiday.getTime() + 2 * 24 * 60 * 60 * 1000);
        return holiday;
    });
};

export const calculateEaster = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = Math.floor((h + l - 7 * m + 114) / 31);
    const p = (h + l - 7 * m + 114) % 31;

    return new Date(year, n - 1, p + 1);
};

export const isPublicHoliday = (date: Date, holidays: Date[]): boolean => {
    return holidays.some(holiday =>
        holiday.getFullYear() === date.getFullYear() &&
        holiday.getMonth() === date.getMonth() &&
        holiday.getDate() === date.getDate()
    );
};

export const isWeekend = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
};

export const calculateTotalLeaveDays = async (startDate: Date, endDate: Date): Promise<number> => {
    let leaveDays = 0;
    const currentDate = new Date(startDate);

    const years = new Set<number>();
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
        years.add(tempDate.getFullYear());
        tempDate.setFullYear(tempDate.getFullYear() + 1);
    }

    const allHolidays: Date[] = [];
    years.forEach(year => {
        allHolidays.push(...getSouthAfricanPublicHolidays(year));
    });

    while (currentDate <= endDate) {
        if (!isWeekend(currentDate) && !isPublicHoliday(currentDate, allHolidays)) {
            leaveDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return leaveDays;
};

export const getExcludedDaysDetails = (startDate: Date, endDate: Date): ExcludedDaysDetails => {
    let weekends = 0;
    const holidaysInRange: Date[] = [];
    const currentDate = new Date(startDate);

    const years = new Set<number>();
    const tempDate = new Date(startDate);
    while (tempDate <= endDate) {
        years.add(tempDate.getFullYear());
        tempDate.setFullYear(tempDate.getFullYear() + 1);
    }

    const allHolidays: Date[] = [];
    years.forEach(year => {
        allHolidays.push(...getSouthAfricanPublicHolidays(year));
    });

    while (currentDate <= endDate) {
        if (isWeekend(currentDate)) {
            weekends++;
        } else if (isPublicHoliday(currentDate, allHolidays)) {
            holidaysInRange.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return {
        weekends,
        holidays: holidaysInRange,
        totalExcluded: weekends + holidaysInRange.length
    };
};

// S3 Functions
export const uploadToS3 = async (
    fileData: string,
    fileName: string,
    fileType: string,
    uid: string,
    leaveId: string
): Promise<string> => {
    const timestamp = Date.now();
    const fileExtension = fileName.split('.').pop();
    const s3Key = `leave-documents/${uid}/${leaveId}/${timestamp}.${fileExtension}`;

    const fileBuffer = Buffer.from(fileData, 'base64');
    const uploadCommand = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key,
        Body: fileBuffer,
        ContentType: fileType,
        Metadata: {
            originalName: fileName,
            userId: uid,
            leaveId: leaveId
        }
    });

    await s3Client.send(uploadCommand);
    return s3Key;
};

export const getSignedUrlFromS3 = async (s3Key: string): Promise<string> => {
    const getObjectCommand = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key
    });
    return await getSignedUrl(s3Client, getObjectCommand, { expiresIn: 3600 });
};

export const deleteFromS3 = async (s3Key: string): Promise<void> => {
    const deleteCommand = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: s3Key
    });
    await s3Client.send(deleteCommand);
};

// Utility Functions
export const formatDateTime = (): string => {
    const currentDateTime = new Date();
    const formattedDate = currentDateTime.toISOString().split("T")[0];
    const formattedTime = currentDateTime.toTimeString().split(" ")[0];
    return `${formattedDate} ${formattedTime}`;
};