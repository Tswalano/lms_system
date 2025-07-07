
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Interfaces
export interface LeaveRequest {
    id: number;
    uid: number;
    leave_type: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    duration: string;
    start_date: string;
    end_date: string;
    feedback?: string;
    document?: string;
    leave_length: 'full_day' | 'half_day';
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

export const isWeekend = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
};

// export const calculateTotalLeaveDays = async (startDate: Date, endDate: Date): Promise<number> => {
//     let leaveDays = 0;
//     const currentDate = new Date(startDate);

//     const years = new Set<number>();
//     const tempDate = new Date(startDate);
//     while (tempDate <= endDate) {
//         years.add(tempDate.getFullYear());
//         tempDate.setFullYear(tempDate.getFullYear() + 1);
//     }

//     const allHolidays: Date[] = [];
//     years.forEach(year => {
//         allHolidays.push(...getSouthAfricanPublicHolidays(year));
//     });

//     while (currentDate <= endDate) {
//         if (!isWeekend(currentDate) && !isPublicHoliday(currentDate, allHolidays)) {
//             leaveDays++;
//         }
//         currentDate.setDate(currentDate.getDate() + 1);
//     }

//     return leaveDays;
// };

// export const getExcludedDaysDetails = (startDate: Date, endDate: Date): ExcludedDaysDetails => {
//     let weekends = 0;
//     const holidaysInRange: Date[] = [];
//     const currentDate = new Date(startDate);

//     const years = new Set<number>();
//     const tempDate = new Date(startDate);
//     while (tempDate <= endDate) {
//         years.add(tempDate.getFullYear());
//         tempDate.setFullYear(tempDate.getFullYear() + 1);
//     }

//     const allHolidays: Date[] = [];
//     years.forEach(year => {
//         allHolidays.push(...getSouthAfricanPublicHolidays(year));
//     });

//     while (currentDate <= endDate) {
//         if (isWeekend(currentDate)) {
//             weekends++;
//         } else if (isPublicHoliday(currentDate, allHolidays)) {
//             holidaysInRange.push(new Date(currentDate));
//         }
//         currentDate.setDate(currentDate.getDate() + 1);
//     }

//     return {
//         weekends,
//         holidays: holidaysInRange,
//         totalExcluded: weekends + holidaysInRange.length
//     };
// };

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