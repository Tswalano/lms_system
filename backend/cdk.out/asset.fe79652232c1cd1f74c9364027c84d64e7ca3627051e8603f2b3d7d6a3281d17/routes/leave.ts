import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from 'hono';
import mysql from 'mysql2/promise';
import { getUserId, getDecodedToken, getAccessToken } from '../middleware/auth';
import {
    getSouthAfricanPublicHolidays,
    calculateTotalLeaveDays,
    getExcludedDaysDetails,
    isWeekend,
    isPublicHoliday,
    uploadToS3,
    getSignedUrlFromS3,
    deleteFromS3,
    formatDateTime,
    LeaveRequest,
    LeaveRequestWithUser,
    PublicHoliday,
    ExcludedDaysDetails
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

const app = new Hono();

// Types for query parameters
interface LeaveQueryParams {
    status?: 'pending' | 'approved' | 'rejected';
    leave_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
    page?: string;
    limit?: string;
}

interface CalendarQueryParams {
    start_date?: string;
    end_date?: string;
}

// POST /apply-leave - Submit leave application
app.post('/apply-leave', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const decodedToken = getDecodedToken(c);

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

        if (leave_length === "Full Day") {
            numDays = await calculateTotalLeaveDays(startDate, endDate);
            excludedDetails = getExcludedDaysDetails(startDate, endDate);
        } else if (leave_length === "Half Day") {
            numDays = 0.5;
            if (isWeekend(startDate)) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Cannot apply for leave on weekends'
                }, 400);
            }

            const allHolidays = getSouthAfricanPublicHolidays(startDate.getFullYear());
            if (isPublicHoliday(startDate, allHolidays)) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Cannot apply for leave on public holidays'
                }, 400);
            }
        }

        let feedback = `A total of ${numDays} leave day${numDays === 1 ? "" : "s"} will be deducted from your balance.`;
        if (leave_length === "Full Day" && excludedDetails.totalExcluded > 0) {
            feedback += ` Excluded: ${excludedDetails.weekends} weekend(s)`;
            if (excludedDetails.holidays.length > 0) {
                feedback += ` and ${excludedDetails.holidays.length} holiday(s)`;
            }
        }

        const createdAt = formatDateTime();

        connection = await DatabaseService.createConnection();

        const [result] = await connection.query<mysql.ResultSetHeader>(`
            INSERT INTO leave_requests (
                uid, leave_type, status, duration, start_date, end_date, feedback, 
                document, leave_length, leave_comment, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [uid, leave_type, "pending", numDays.toString(), startDate, endDate, feedback, "no supporting document", leave_length, leave_comment, createdAt, createdAt]);

        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                leaveId: result.insertId,
                duration: numDays,
                feedback: feedback,
                status: "pending"
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

// PUT /leave/:id - Update leave request
app.put('/leave/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveId = c.req.param('id');

        const body = await c.req.json();
        const updateData: LeaveUpdateData = leaveUpdateSchema.parse(body);

        connection = await DatabaseService.createConnection();

        // Check if leave exists and is pending
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
                message: 'Cannot update leave request that is not pending'
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
            if (leaveLength === "Full Day") {
                numDays = await calculateTotalLeaveDays(startDate, endDate);
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

        // Check if leave request exists and is pending
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
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];

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

        // Core status + date logic
        const statusFilter = `
            (
                (lr.status = 'pending' AND YEAR(lr.start_date) = ?) OR
                (lr.status = 'Approved' AND lr.start_date >= ?)
            )
        `;
        conditions.push(statusFilter);
        params.push(currentYear, twoMonthsAgoStr);

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
                CASE lr.status WHEN 'pending' THEN 1 WHEN 'Approved' THEN 2 WHEN 'Rejected' THEN 3 ELSE 4 END,
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

        if (leave_length === "Full Day") {
            numDays = await calculateTotalLeaveDays(startDate, endDate);
            excludedDetails = getExcludedDaysDetails(startDate, endDate);
        } else {
            numDays = 0.5;
            if (isWeekend(startDate)) warnings.push('Selected date falls on a weekend');

            const allHolidays = getSouthAfricanPublicHolidays(startDate.getFullYear());
            if (isPublicHoliday(startDate, allHolidays)) warnings.push('Selected date is a public holiday');
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

// GET /public-holidays/:year - Get public holidays
app.get('/public-holidays/:year', async (c: Context): Promise<Response> => {
    try {
        const year = parseInt(c.req.param('year'));

        if (isNaN(year) || year < 2020 || year > 2030) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid year. Please provide a year between 2020 and 2030'
            }, 400);
        }

        const holidays = getSouthAfricanPublicHolidays(year);
        const holidayNames = [
            "New Year's Day", "Human Rights Day", "Good Friday", "Family Day",
            "Freedom Day", "Workers' Day", "Youth Day", "National Women's Day",
            "Heritage Day", "Day of Reconciliation", "Christmas Day", "Day of Goodwill"
        ];

        const holidaysWithNames: PublicHoliday[] = holidays.map((holiday, index) => ({
            date: holiday.toISOString().split('T')[0],
            name: holidayNames[index] || 'Public Holiday',
            dayOfWeek: holiday.toLocaleDateString('en-US', { weekday: 'long' })
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return c.json<ApiResponse<{ year: number; holidays: PublicHoliday[]; total: number }>>({
            success: true,
            message: `Public holidays for ${year}`,
            data: {
                year: year,
                holidays: holidaysWithNames,
                total: holidaysWithNames.length
            }
        }, 200);

    } catch (error) {
        console.error('Get public holidays error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve public holidays'
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

        // Check if leave can be deleted (only pending leaves)
        if (leave.status !== 'pending') {
            return c.json<ApiResponse>({
                success: false,
                message: 'Cannot delete leave request that is not pending'
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

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const queryParams: CalendarQueryParams = {
            start_date: c.req.query('start_date') || firstDay.toISOString().split('T')[0],
            end_date: c.req.query('end_date') || lastDay.toISOString().split('T')[0]
        };

        let whereClause = 'WHERE lr.start_date <= ? AND lr.end_date >= ? AND lr.status = "approved"';
        const queryParamsArray: any[] = [queryParams.end_date, queryParams.start_date];

        const [leaveCalendar] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT lr.id, lr.start_date, lr.end_date, lr.leave_type, lr.leave_length, lr.duration,
                   u.firstName, u.lastName, u.email, u.jobTitle,
                   m.firstName as managerFirstName, m.lastName as managerLastName
            FROM leave_requests lr
            JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            ${whereClause}
            ORDER BY lr.start_date ASC
        `, queryParamsArray);

        // Get public holidays in the range
        const startYear = new Date(queryParams.start_date!).getFullYear();
        const endYear = new Date(queryParams.end_date!).getFullYear();
        const publicHolidays: Date[] = [];

        for (let year = startYear; year <= endYear; year++) {
            publicHolidays.push(...getSouthAfricanPublicHolidays(year));
        }

        const holidaysInRange: PublicHoliday[] = publicHolidays.filter(holiday => {
            const holidayStr = holiday.toISOString().split('T')[0];
            return holidayStr >= queryParams.start_date! && holidayStr <= queryParams.end_date!;
        }).map(holiday => ({
            date: holiday.toISOString().split('T')[0],
            name: 'Public Holiday',
            dayOfWeek: holiday.toLocaleDateString('en-US', { weekday: 'long' })
        }));

        return c.json<ApiResponse<{
            dateRange: { startDate: string; endDate: string };
            leaveRequests: mysql.RowDataPacket[];
            publicHolidays: PublicHoliday[]
        }>>({
            success: true,
            message: 'Leave calendar retrieved successfully',
            data: {
                dateRange: {
                    startDate: queryParams.start_date!,
                    endDate: queryParams.end_date!
                },
                leaveRequests: leaveCalendar,
                publicHolidays: holidaysInRange
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

// GET /leave-balance - Get leave balance (placeholder)
app.get('/leave-balance', async (c: Context): Promise<Response> => {
    try {
        const balanceData: LeaveBalanceData = {
            annual_leave: 15,
            sick_leave: 10,
            personal_leave: 5,
            used_annual: 3,
            used_sick: 1,
            used_personal: 0
        };

        return c.json<ApiResponse<LeaveBalanceData>>({
            success: true,
            message: 'Leave balance retrieved successfully',
            data: balanceData
        }, 200);
    } catch (error) {
        console.error('Get leave balance error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve leave balance'
        }, 500);
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