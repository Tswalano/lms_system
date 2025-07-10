import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from 'hono';
import mysql from 'mysql2/promise';
import { getUserId, getDecodedToken } from '../middleware/auth';
import {
    isWeekend,
    uploadToS3,
    getSignedUrlFromS3,
    deleteFromS3,
    formatDateTime,
    LeaveRequest,
    LeaveRequestWithUser,
    ExcludedDaysDetails,
    LeaveStatus
} from '../helpers/leaveHelpers';
import {
    leaveApplicationSchema,
    leaveUpdateSchema,
    leaveApprovalSchema,
    fileUploadSchema,
    leaveCalculationSchema,
    LeaveApplicationData,
    LeaveUpdateData,
    LeaveApprovalData,
    FileUploadData,
    LeaveCalculationData,
    ApiResponse,
    PaginationData,
    LeaveStatsData,
    LeaveBalanceData,
    LeaveTypeStats,
    LeaveCalculationResult
} from '../schemas/validationSchemas';
import { DatabaseService } from '../helpers/databaseHeler';
import { calculateTotalLeaveDays, getExcludedDaysDetails, getPublicHolidayDatesUsingGoogleCalendarAPIAsync } from '../helpers/leaveCalculations';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import { sender, senderManagement } from '../email/emailMiddleware';
import { EmailNotificationDetails } from '../email/notificationHandler';
import { get } from 'http';
dayjs.extend(utc);
dayjs.extend(isBetween);

const app = new Hono();

// Types for query parameters
interface LeaveQueryParams {
    status?: LeaveStatus;
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: string;
    limit?: string;
}

interface PublicHoliday {
    date: string;
    name: string;
    dayOfWeek: string;
}

interface LeaveCalendarResponse {
    dateRange: {
        startDate: string;
        endDate: string;
    };
    leaveRequests: mysql.RowDataPacket[];
    publicHolidays: PublicHoliday[];
}

// Format dates for display
const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const formattedDate = dateObj.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return formattedDate;
};

app.post('/apply-leave', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const recipientEmail = getDecodedToken(c).email;
        const firstName = getDecodedToken(c).given_name || getDecodedToken(c).name || 'Unknown User';
        const lastName = getDecodedToken(c).family_name || '';
        const fullName = `${firstName} ${lastName}`.trim();

        if (!recipientEmail) {
            return c.json<ApiResponse>({
                success: false,
                message: 'User email not found in token'
            }, 401);
        }

        const body = await c.req.json();
        const validatedData: LeaveApplicationData = leaveApplicationSchema.parse(body);
        const { leave_type, leave_start, leave_end, leave_length, leave_comment } = validatedData;

        const startDate = new Date(leave_start);
        const endDate = new Date(leave_end);

        if (startDate > endDate) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }

        if (startDate < new Date()) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be in the past'
            }, 400);
        }

        let numDays = 0;
        let excludedDetails: ExcludedDaysDetails = { weekends: 0, holidays: [], totalExcluded: 0 };

        if (leave_length === "full_day") {
            const calculation = await calculateTotalLeaveDays(startDate, endDate);
            numDays = calculation.totalLeaveDays;
            excludedDetails = await getExcludedDaysDetails(startDate, endDate);
        } else if (leave_length === "half_day") {
            numDays = 0.5;
            if (isWeekend(startDate)) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Cannot apply for leave on weekends'
                }, 400);
            }

            // For half-day leaves, we still need to check if it's a public holiday
            const holidays = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(startDate, startDate);
            if (holidays.length > 0) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Cannot apply for leave on public holidays'
                }, 400);
            }
        }

        let system_notes = `A total of ${numDays} leave day${numDays === 1 ? "" : "s"} will be deducted from your balance.`;
        if (leave_length === "full_day" && excludedDetails.totalExcluded > 0) {
            system_notes += ` Excluded: ${excludedDetails.weekends} weekend(s)`;
            if (excludedDetails.holidays.length > 0) {
                system_notes += ` and ${excludedDetails.holidays.length} holiday(s)`;
            }
        }

        const createdAt = formatDateTime();

        connection = await DatabaseService.createConnection();

        const [result] = await connection.query<mysql.ResultSetHeader>(`
                INSERT INTO leave_requests (
                    uid, leave_type, status, duration, start_date, end_date, system_notes, feedback,
                    document, leave_length, leave_comment, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
            uid,
            leave_type,
            "pending",
            numDays.toString(),
            startDate,
            endDate,
            system_notes,
            "Your leave request is Pending, please wait for approval",
            "no supporting document",
            leave_length,
            leave_comment,
            createdAt,
            createdAt
        ]);

        // Track email results
        const emailResults = {
            employee: { success: false, error: null as string | null },
            management: { success: false, error: null as string | null }
        };

        // 1. Send email notification to EMPLOYEE
        console.log("=== Sending Employee Notification ===");
        try {

            const employeeEmailBody = `Your <strong>${leave_type}</strong> request has been successfully submitted and is pending approval.`;

            await sender(
                recipientEmail,
                firstName,
                employeeEmailBody,
                `Leave Request Submitted - ${leave_type}`,
                "pending"
            );

            emailResults.employee.success = true;
            console.log("✅ Employee notification email sent successfully to:", recipientEmail);
        } catch (emailError) {
            emailResults.employee.error = (emailError as Error).message;
            console.error("❌ Failed to send employee notification email:", emailError);
        }

        // 2. Send email notification to MANAGEMENT
        console.log("=== Sending Management Notification ===");
        try {
            const managementEmailBody = `${leave_comment}.
                <br><br>
                <i>System Notes: ${system_notes}</i>`;

            await senderManagement(
                fullName,                               // employeeName
                recipientEmail,                         // employeeEmail  
                managementEmailBody,                    // body
                `New Leave Request - ${leave_type}`,    // subject
                "pending",                              // status
                leave_type,                             // leaveType
                formatDate(startDate),                     // startDate
                formatDate(endDate),                       // endDate
                `${numDays} day${numDays === 1 ? '' : 's'} (${leave_length})` // duration
            );

            emailResults.management.success = true;
            console.log("✅ Management notification email sent successfully");
        } catch (emailError) {
            emailResults.management.error = (emailError as Error).message;
            console.error("❌ Failed to send management notification email:", emailError);
        }

        // Log email summary
        console.log("=== Email Notification Summary ===");
        console.log(`Employee notification: ${emailResults.employee.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`Management notification: ${emailResults.management.success ? 'SUCCESS' : 'FAILED'}`);

        if (emailResults.employee.error) {
            console.log(`Employee email error: ${emailResults.employee.error}`);
        }
        if (emailResults.management.error) {
            console.log(`Management email error: ${emailResults.management.error}`);
        }

        // Prepare response with email status
        const emailNotificationStatus = {
            employee: emailResults.employee.success,
            management: emailResults.management.success,
            errors: {
                employee: emailResults.employee.error,
                management: emailResults.management.error
            }
        };

        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                leaveId: result.insertId,
                duration: numDays,
                system_notes: system_notes,
                status: "pending",
                emailNotifications: emailNotificationStatus
            }
        }, 200);

    } catch (error) {
        console.error('Apply leave error:', error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        if (error instanceof Error && error.message.includes('token')) {
            return c.json<ApiResponse>({
                success: false,
                message: error.message
            }, 401);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to submit leave request'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-history - Get user's leave history
app.get('/leave-history', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id, leave_type, status, duration, start_date, end_date, feedback,
                   leave_length, leave_comment, createdAt, updatedAt
            FROM leave_requests 
            WHERE uid = ? 
            AND YEAR(createdAt) = YEAR(NOW())
            ORDER BY createdAt DESC
        `, [uid]);

        return c.json<ApiResponse<LeaveRequest[]>>({
            success: true,
            message: 'Leave history retrieved successfully',
            data: rows as LeaveRequest[]
        }, 200);

    } catch (error) {
        console.error('Get leave history error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave history'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-history/:uid - Get user's leave history by user ID
app.get('/leave-history/:uid', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = c.req.param('uid');
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id, leave_type, status, duration, start_date, end_date, feedback,
                leave_length, leave_comment, createdAt, updatedAt
            FROM leave_requests 
            WHERE uid = ? 
            AND YEAR(createdAt) = YEAR(NOW())
            ORDER BY createdAt DESC;
        `, [uid]);

        return c.json<ApiResponse<LeaveRequest[]>>({
            success: true,
            message: 'Leave history retrieved successfully',
            data: rows as LeaveRequest[]
        }, 200);

    } catch (error) {
        console.error('Get leave history error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave history'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /leave/:id - Update leave request
app.put('/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveId = c.req.param('id');

        const body = await c.req.json();
        const updateData: LeaveUpdateData = leaveUpdateSchema.parse(body);

        connection = await DatabaseService.createConnection();

        // Check if leave exists and is Pending
        const [existingLeave] = await connection.query<mysql.RowDataPacket[]>(
            'SELECT * FROM leave_requests WHERE id = ? AND uid = ?',
            [leaveId, uid]
        );

        if (!existingLeave || existingLeave.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }

        const currentLeave = existingLeave[0] as LeaveRequest;

        if (currentLeave.status !== 'pending') {
            return c.json<ApiResponse>({
                success: false,
                message: 'Cannot update leave request that is not Pending'
            }, 400);
        }

        const fieldsToUpdate: string[] = [];
        const valuesToUpdate: any[] = [];

        if (updateData.leave_type) {
            fieldsToUpdate.push('leave_type = ?');
            valuesToUpdate.push(updateData.leave_type);
        }

        if (updateData.leave_comment !== undefined) {
            fieldsToUpdate.push('leave_comment = ?');
            valuesToUpdate.push(updateData.leave_comment);
        }

        if (updateData.leave_start || updateData.leave_end || updateData.leave_length) {
            const startDate = new Date(updateData.leave_start || currentLeave.start_date);
            const endDate = new Date(updateData.leave_end || currentLeave.end_date);
            const leaveLength = updateData.leave_length || currentLeave.leave_length;

            if (startDate > endDate) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Start date cannot be after end date'
                }, 400);
            }

            let numDays = 0;
            if (leaveLength === "full_day") {
                const calculation = await calculateTotalLeaveDays(startDate, endDate);
                numDays = calculation.totalLeaveDays;
            } else {
                numDays = 0.5;
            }

            const feedback = `A total of ${numDays} leave day${numDays === 1 ? "" : "s"} will be deducted from your balance.`;

            fieldsToUpdate.push('start_date = ?', 'end_date = ?', 'leave_length = ?', 'duration = ?', 'feedback = ?');
            valuesToUpdate.push(startDate, endDate, leaveLength, numDays.toString(), feedback);
        }

        if (fieldsToUpdate.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'No fields to update'
            }, 400);
        }

        fieldsToUpdate.push('updatedAt = ?');
        valuesToUpdate.push(formatDateTime());
        valuesToUpdate.push(leaveId, uid);

        const updateQuery = `UPDATE leave_requests SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND uid = ?`;
        await connection.query(updateQuery, valuesToUpdate);

        // trigger email notification
        const emailDetails: EmailNotificationDetails = {
            recipientEmail: getDecodedToken(c).email,
            name: `${getDecodedToken(c).given_name || getDecodedToken(c).name} ${getDecodedToken(c).family_name || ''}`,
            body: `Your leave request for ${currentLeave.leave_type} has been updated.`,
            subject: `Leave Request Updated - ${currentLeave.leave_type}`,
            status: 'pending'
        };

        await sender(
            emailDetails.recipientEmail,
            emailDetails.name,
            emailDetails.body,
            emailDetails.subject,
            emailDetails.status
        );

        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request updated successfully'
        }, 200);

    } catch (error) {
        console.error('Update leave error:', error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to update leave request'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /:id/approve - Approve or reject leave request
app.put('/:id/approve', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const managerId = getUserId(c);
        const leaveId = c.req.param('id');

        const body = await c.req.json();
        const validatedData: LeaveApprovalData = leaveApprovalSchema.parse(body);
        const { action, feedback } = validatedData;

        connection = await DatabaseService.createConnection();

        // Check if leave request exists and is Pending
        const [existingLeave] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT lr.*, u.firstName, u.lastName, u.email 
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            WHERE lr.id = ? AND lr.status = "pending"
        `, [leaveId]);

        if (!existingLeave || existingLeave.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found or already processed'
            }, 404);
        }

        const leaveRequest = existingLeave[0] as LeaveRequestWithUser;
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const processedAt = new Date().toISOString();

        // Start transaction
        await connection.beginTransaction();

        try {
            // Update leave request
            await connection.query<mysql.ResultSetHeader>(`
                UPDATE leave_requests 
                SET status = ?, approved_by = ?, feedback = ?, approved_at = ?, updatedAt = ?
                WHERE id = ?
            `, [newStatus, managerId, feedback, processedAt, processedAt, leaveId]);

            // Log the action
            await connection.query<mysql.ResultSetHeader>(`
                INSERT INTO leave_action_log (leave_id, manager_id, action, previous_status, new_status, timestamp)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [leaveId, managerId, action, 'pending', newStatus]);

            await connection.commit();

            // Send email notification
            const emailDetails: EmailNotificationDetails = {
                recipientEmail: leaveRequest.email,
                name: `${leaveRequest.firstName} ${leaveRequest.lastName}`,
                body: `Your leave request for <strong>${leaveRequest.leave_type}</strong> from ${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)} has been <strong>${newStatus}</strong>. 
                <br><br>
                Feedback: ${feedback}`,
                subject: `Leave Request ${newStatus} - ${leaveRequest.leave_type}`,
                status: newStatus.toLowerCase() as 'approved' | 'rejected'
            };
            await sender(
                emailDetails.recipientEmail,
                emailDetails.name,
                emailDetails.body,
                emailDetails.subject,
                emailDetails.status
            );

            return c.json<ApiResponse>({
                success: true,
                message: `Leave request ${action}d successfully`,
                data: {
                    leaveId: parseInt(leaveId),
                    action: action,
                    status: newStatus,
                    processedAt: processedAt,
                    feedback: feedback
                }
            }, 200);

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Approve leave error:', error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to process leave request'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /all-leave-requests - Get all leave requests (for managers)
app.get('/all-leave-requests', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const currentYear = new Date().getFullYear();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

        const queryParams: LeaveQueryParams = {
            leave_type: c.req.query('leave_type'),
            search: c.req.query('search'),
            page: c.req.query('page'),
            limit: c.req.query('limit')
        };

        const page = parseInt(queryParams.page || '1');
        const limit = Math.min(100, parseInt(queryParams.limit || '20'));
        const offset = (page - 1) * limit;

        const conditions: string[] = [];
        const params: any[] = [];

        // Core status + date logic - Updated to check:
        // - Pending requests from current year
        // - Approved/Rejected requests from last 30 days
        const statusFilter = `
            (
                (lr.status = 'pending' AND YEAR(lr.start_date) = ?) OR
                ((lr.status = 'approved' OR lr.status = 'rejected') AND lr.start_date >= ?)
            )
        `;
        conditions.push(statusFilter);
        params.push(currentYear, thirtyDaysAgoStr);

        // Apply leave_type if present
        if (queryParams.leave_type) {
            conditions.push('lr.leave_type = ?');
            params.push(queryParams.leave_type);
        }

        // Search condition
        if (queryParams.search) {
            conditions.push('(CONCAT(u.firstName, " ", u.lastName) LIKE ? OR u.email LIKE ?)');
            params.push(`%${queryParams.search}%`, `%${queryParams.search}%`);
        }

        // Add year filter for createdAt
        conditions.push('YEAR(lr.createdAt) = ?');
        params.push(currentYear);

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Count query
        const [countResult] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT COUNT(*) as total 
            FROM leave_requests lr 
            LEFT JOIN users u ON lr.uid = u.id
            ${whereClause}
        `, params);

        const total = countResult[0].total;

        // Data query
        const [requests] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT lr.*, u.firstName, u.lastName, u.email, u.jobTitle,
                   m.firstName as managerFirstName, m.lastName as managerLastName
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            ${whereClause}
            ORDER BY 
                CASE lr.status WHEN 'pending' THEN 1 WHEN 'approved' THEN 2 WHEN 'rejected' THEN 3 ELSE 4 END,
                lr.createdAt DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const paginationData: PaginationData = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        };

        return c.json<ApiResponse<{ requests: LeaveRequestWithUser[], pagination: PaginationData }>>({
            success: true,
            message: 'Leave requests retrieved successfully',
            data: {
                requests: requests as LeaveRequestWithUser[],
                pagination: paginationData
            }
        }, 200);

    } catch (error) {
        console.error('Get all leave requests error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave requests'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// POST /leave-calculation - Preview leave calculation
app.post('/leave-calculation', async (c: Context): Promise<Response> => {
    try {
        const body = await c.req.json();
        const validatedData: LeaveCalculationData = leaveCalculationSchema.parse(body);
        const { leave_start, leave_end, leave_length } = validatedData;

        const startDate = new Date(leave_start);
        const endDate = new Date(leave_end);

        if (startDate > endDate) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }

        let numDays = 0;
        let excludedDetails: ExcludedDaysDetails = { weekends: 0, holidays: [], totalExcluded: 0 };
        let warnings: string[] = [];

        if (leave_length === "full_day") {
            const calculation = await calculateTotalLeaveDays(startDate, endDate);
            numDays = calculation.totalLeaveDays;
            excludedDetails = await getExcludedDaysDetails(startDate, endDate);

            // Add warnings for excluded days
            if (excludedDetails.weekends > 0) {
                warnings.push(`${excludedDetails.weekends} weekend day(s) excluded`);
            }
            if (excludedDetails.holidays.length > 0) {
                warnings.push(`${excludedDetails.holidays.length} public holiday(s) excluded`);
            }
        } else {
            numDays = 0.5;

            // Check for weekend
            if (isWeekend(startDate)) {
                warnings.push('Selected date falls on a weekend');
            }

            // Check for public holiday
            try {
                const holidays = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(startDate, startDate);
                if (holidays.length > 0) {
                    warnings.push('Selected date is a public holiday');
                }
            } catch (error) {
                console.error('Failed to fetch public holidays:', error);
                warnings.push('Could not verify public holidays (system error)');
            }
        }

        const result: LeaveCalculationResult = {
            totalDays: numDays,
            startDate: leave_start,
            endDate: leave_end,
            leaveLength: leave_length,
            excludedDays: {
                weekends: excludedDetails.weekends,
                publicHolidays: excludedDetails.holidays.length,
                totalExcluded: excludedDetails.totalExcluded
            },
            warnings: warnings
        };

        return c.json<ApiResponse<LeaveCalculationResult>>({
            success: true,
            message: 'Leave calculation completed',
            data: result
        }, 200);

    } catch (error) {
        console.error('Leave calculation error:', error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to calculate leave days'
        }, 500);
    }
});

// POST /leave/:id/upload-document - Upload document
app.post('/leave/:id/upload-document', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveId = c.req.param('id');

        const body = await c.req.json();
        const validatedData: FileUploadData = fileUploadSchema.parse(body);
        const { file_type, file_name, file_data } = validatedData;

        connection = await DatabaseService.createConnection();

        // Check if leave request exists and belongs to user
        const [existingLeave] = await connection.query<mysql.RowDataPacket[]>(
            'SELECT * FROM leave_requests WHERE id = ? AND uid = ?',
            [leaveId, uid]
        );

        if (!existingLeave || existingLeave.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }

        // Upload to S3
        const s3Key = await uploadToS3(file_data, file_name, file_type, uid.toString(), leaveId);

        // Update leave request with document path
        const updatedAt = formatDateTime();
        await connection.query<mysql.ResultSetHeader>(
            'UPDATE leave_requests SET document = ?, updatedAt = ? WHERE id = ? AND uid = ?',
            [s3Key, updatedAt, leaveId, uid]
        );

        return c.json<ApiResponse<{ documentPath: string; fileName: string }>>({
            success: true,
            message: 'Document uploaded successfully',
            data: { documentPath: s3Key, fileName: file_name }
        }, 200);

    } catch (error) {
        console.error('Upload document error:', error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid file data',
                errors: error.errors
            }, 400);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to upload document'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave/:id - Get leave request by ID
app.get('/leave/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveId = c.req.param('id');

        connection = await DatabaseService.createConnection();

        const [leaveRequest] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT lr.*, u.firstName, u.lastName, u.email,
                   m.firstName as managerFirstName, m.lastName as managerLastName
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            WHERE lr.id = ? AND lr.uid = ?
            AND createdAt >= DATE_FORMAT(NOW(), '%Y-01-01')
            AND createdAt < DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 YEAR), '%Y-01-01')
        `, [leaveId, uid]);

        if (!leaveRequest || leaveRequest.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }

        const leave = leaveRequest[0] as LeaveRequestWithUser;

        // Generate signed URL for document if exists
        let documentUrl: string | null = null;
        if (leave.document && leave.document !== 'no supporting document') {
            try {
                documentUrl = await getSignedUrlFromS3(leave.document);
            } catch (error) {
                console.error('Error generating document URL:', error);
            }
        }

        const responseData = {
            ...leave,
            documentUrl: documentUrl,
            applicant: {
                name: `${leave.firstName} ${leave.lastName}`,
                email: leave.email
            },
            approver: leave.managerFirstName ? {
                name: `${leave.managerFirstName} ${leave.managerLastName}`
            } : null
        };

        return c.json<ApiResponse<typeof responseData>>({
            success: true,
            message: 'Leave request retrieved successfully',
            data: responseData
        }, 200);

    } catch (error) {
        console.error('Get leave by ID error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave request'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// DELETE /leave/:id - Delete leave request
app.delete('/leave/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveId = c.req.param('id');

        connection = await DatabaseService.createConnection();

        // Check if leave request exists and belongs to user
        const [existingLeave] = await connection.query<mysql.RowDataPacket[]>(
            'SELECT * FROM leave_requests WHERE id = ? AND uid = ?',
            [leaveId, uid]
        );

        if (!existingLeave || existingLeave.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }

        const leave = existingLeave[0] as LeaveRequest;

        // Check if leave can be deleted (only Pending leaves)
        if (leave.status !== 'pending') {
            return c.json<ApiResponse>({
                success: false,
                message: 'Cannot delete leave request that is not Pending'
            }, 400);
        }

        // Delete associated document from S3 if exists
        if (leave.document && leave.document !== 'no supporting document') {
            try {
                await deleteFromS3(leave.document);
            } catch (error) {
                console.error('Error deleting document from S3:', error);
            }
        }

        // Delete leave request
        await connection.query<mysql.ResultSetHeader>(
            'DELETE FROM leave_requests WHERE id = ? AND uid = ?',
            [leaveId, uid]
        );

        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request deleted successfully'
        }, 200);

    } catch (error) {
        console.error('Delete leave error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to delete leave request'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-calendar - Get leave calendar view
app.get('/leave-calendar', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        // Get query parameters with proper date handling
        const now = dayjs().utc();
        const defaultStartDate = now.startOf('month').format('YYYY-MM-DD');
        const defaultEndDate = now.endOf('month').format('YYYY-MM-DD');

        const queryParams = {
            start_date: c.req.query('start_date') || defaultStartDate,
            end_date: c.req.query('end_date') || defaultEndDate
        };

        // Validate date format
        if (!dayjs(queryParams.start_date, 'YYYY-MM-DD', true).isValid() ||
            !dayjs(queryParams.end_date, 'YYYY-MM-DD', true).isValid()) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid date format. Please use YYYY-MM-DD'
            }, 400);
        }

        // Validate date range
        if (dayjs(queryParams.start_date).isAfter(dayjs(queryParams.end_date))) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }

        // Fetch approved leave requests within date range
        const [leaveCalendar] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                lr.id, 
                lr.start_date, 
                lr.end_date, 
                lr.leave_type, 
                lr.leave_length, 
                lr.duration,
                u.firstName, 
                u.lastName, 
                u.email, 
                u.jobTitle,
                m.firstName as managerFirstName, 
                m.lastName as managerLastName
            FROM leave_requests lr
            JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            WHERE lr.start_date <= ? 
              AND lr.end_date >= ? 
              AND lr.status = "approved"
            ORDER BY lr.start_date ASC
        `, [queryParams.end_date, queryParams.start_date]);

        // Get public holidays using Google Calendar API
        let publicHolidays: PublicHoliday[] = [];
        try {
            const holidayDates = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(
                new Date(queryParams.start_date),
                new Date(queryParams.end_date)
            );

            publicHolidays = holidayDates.map(holiday => ({
                date: dayjs(holiday.date).format('YYYY-MM-DD'),
                name: holiday.name || 'Public Holiday',
                dayOfWeek: dayjs(holiday.date).format('dddd')
            }));
        } catch (error) {
            console.error('Failed to fetch public holidays:', error);
            // Continue without holidays rather than failing the entire request
        }

        return c.json<ApiResponse<LeaveCalendarResponse>>({
            success: true,
            message: 'Leave calendar retrieved successfully',
            data: {
                dateRange: {
                    startDate: queryParams.start_date,
                    endDate: queryParams.end_date
                },
                leaveRequests: leaveCalendar,
                publicHolidays
            }
        }, 200);

    } catch (error) {
        console.error('Get leave calendar error:', error);
        // return c.json<ApiResponse>({
        //     success: false,
        //     message: 'Failed to retrieve leave calendar',
        //     error: process.env.NODE_ENV === 'development' ? error.message : undefined
        // }, 500);

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave calendar'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-balance - Get leave balance (placeholder)
app.get('/leave-calendar', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        // Get current date in UTC
        const now = dayjs.utc();

        // Set default date range (current month)
        const defaultStartDate = now.startOf('month').format('YYYY-MM-DD');
        const defaultEndDate = now.endOf('month').format('YYYY-MM-DD');

        // Get query parameters
        const queryParams = {
            start_date: c.req.query('start_date') || defaultStartDate,
            end_date: c.req.query('end_date') || defaultEndDate
        };

        // Validate dates
        if (!dayjs(queryParams.start_date, 'YYYY-MM-DD', true).isValid() ||
            !dayjs(queryParams.end_date, 'YYYY-MM-DD', true).isValid()) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            }, 400);
        }

        if (dayjs(queryParams.start_date).isAfter(dayjs(queryParams.end_date))) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }

        // Fetch approved leave requests
        const [leaveCalendar] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                lr.id, 
                lr.start_date, 
                lr.end_date, 
                lr.leave_type, 
                lr.leave_length, 
                lr.duration,
                u.firstName, 
                u.lastName, 
                u.email, 
                u.jobTitle,
                m.firstName as managerFirstName, 
                m.lastName as managerLastName
            FROM leave_requests lr
            JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            WHERE lr.start_date <= ? 
              AND lr.end_date >= ? 
              AND lr.status = "approved"
            ORDER BY lr.start_date ASC
        `, [queryParams.end_date, queryParams.start_date]);

        // Get public holidays
        let publicHolidays: PublicHoliday[] = [];
        try {
            const holidayDates = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(
                new Date(queryParams.start_date),
                new Date(queryParams.end_date)
            );

            publicHolidays = holidayDates.map(holiday => ({
                date: dayjs(holiday.date).format('YYYY-MM-DD'),
                name: holiday.name || 'Public Holiday',
                dayOfWeek: dayjs(holiday.date).format('dddd')
            }));
        } catch (error) {
            console.error('Failed to fetch public holidays:', error);
            // Optionally add a warning to the response if needed
        }

        return c.json<ApiResponse<LeaveCalendarResponse>>({
            success: true,
            message: 'Leave calendar retrieved successfully',
            data: {
                dateRange: {
                    startDate: queryParams.start_date,
                    endDate: queryParams.end_date
                },
                leaveRequests: leaveCalendar,
                publicHolidays: publicHolidays
            }
        }, 200);

    } catch (error) {
        console.error('Get leave calendar error:', error);

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave calendar'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-stats/personal - Get personal leave statistics
app.get('/leave-stats/personal', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        connection = await DatabaseService.createConnection();

        const year = c.req.query('year') || new Date().getFullYear().toString();

        const [personalStats] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT leave_type, status, COUNT(*) as count, SUM(CAST(duration AS DECIMAL(5,1))) as total_days
            FROM leave_requests 
            WHERE uid = ? AND YEAR(start_date) = ?
            GROUP BY leave_type, status
            ORDER BY leave_type, status
        `, [uid, year]);

        const [totalUsed] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                SUM(CASE WHEN status = 'approved' THEN CAST(duration AS DECIMAL(5,1)) ELSE 0 END) as total_approved_days,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
            FROM leave_requests 
            WHERE uid = ? AND YEAR(start_date) = ?
        `, [uid, year]);

        const statsData: LeaveStatsData = {
            year: year,
            summary: {
                totalApprovedDays: totalUsed[0].total_approved_days || 0,
                pendingRequests: totalUsed[0].pending_requests || 0,
                rejectedRequests: totalUsed[0].rejected_requests || 0
            },
            leaveTypeBreakdown: personalStats as Array<{
                leave_type: string;
                status: string;
                count: number;
                total_days: number;
            }>
        };

        return c.json<ApiResponse<LeaveStatsData>>({
            success: true,
            message: 'Personal leave statistics retrieved successfully',
            data: statsData
        }, 200);

    } catch (error) {
        console.error('Get leave stats error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave statistics'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /leave-types - Get available leave types
app.get('/leave-types', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [leaveTypes] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT leave_type, COUNT(*) as total_requests,
                   SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                   SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
            FROM leave_requests 
            WHERE YEAR(start_date) = YEAR(CURDATE())
            GROUP BY leave_type
            ORDER BY total_requests DESC
        `);

        return c.json<ApiResponse<{ leaveTypes: LeaveTypeStats[]; currentYear: number }>>({
            success: true,
            message: 'Leave types retrieved successfully',
            data: {
                leaveTypes: leaveTypes as LeaveTypeStats[],
                currentYear: new Date().getFullYear()
            }
        }, 200);

    } catch (error) {
        console.error('Get leave types error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave types'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

export { app as leave };