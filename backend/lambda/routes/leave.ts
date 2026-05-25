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
import { createLeaveEvents, deleteLeaveEvents } from '../integrations/outlookCalendar';
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

interface Birthday {
    id: string;
    userId: number;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle: string;
    dob: string;
    birthdayDate: string;
    age: number;
    isToday: boolean;
}

interface LeaveCalendarResponse {
    dateRange: {
        startDate: string;
        endDate: string;
    };
    leaveRequests: mysql.RowDataPacket[];
    publicHolidays: PublicHoliday[];
}

interface LeaveCalendarWithBirthdaysResponse {
    dateRange: {
        startDate: string;
        endDate: string;
    };
    leaveRequests: any[];
    publicHolidays: PublicHoliday[];
    birthdays: Birthday[];
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate logical ordering
        if (startDate > endDate) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }

        // Allow backdated applications, but flag them
        const isBackdated = startDate < today;
        if (isBackdated) {
            console.log(`Backdated leave application detected from ${fullName}: ${formatDate(startDate)} - ${formatDate(endDate)}`);
        }

        // Calculate number of days
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

            const holidays = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(startDate, startDate);
            if (holidays.length > 0) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Cannot apply for leave on public holidays'
                }, 400);
            }
        }

        // Add backdated context to system notes
        let system_notes = `A total of ${numDays} leave day${numDays === 1 ? "" : "s"} will be deducted from your balance.`;
        if (isBackdated) {
            system_notes += " (This is a backdated leave request)";
        }
        if (leave_length === "full_day" && excludedDetails.totalExcluded > 0) {
            system_notes += ` Excluded: ${excludedDetails.weekends} weekend(s)`;
            if (excludedDetails.holidays.length > 0) {
                system_notes += ` and ${excludedDetails.holidays.length} holiday(s)`;
            }
        }

        const createdAt = formatDateTime();
        connection = await DatabaseService.createConnection();

        // Insert record (add `is_backdated` column if available)
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
            // isBackdated ? 1 : 0, // 1 = true, 0 = false
            createdAt,
            createdAt
        ]);

        // Send notifications
        const emailResults = {
            employee: { success: false, error: null as string | null },
            management: { success: false, error: null as string | null }
        };

        try {
            const employeeEmailBody = `Your <strong>${leave_type}</strong> request has been successfully submitted and is pending approval.`;
            await sender(recipientEmail, firstName, employeeEmailBody, `Leave Request Submitted - ${leave_type}`, "pending");
            emailResults.employee.success = true;
        } catch (emailError) {
            emailResults.employee.error = (emailError as Error).message;
        }

        try {
            const managementEmailBody = leave_comment
                ? `${leave_comment}`
                : 'No reason provided.';

            await senderManagement(
                fullName,
                recipientEmail,
                managementEmailBody,
                `New Leave Request - ${leave_type}`,
                "pending",
                leave_type,
                formatDate(startDate),
                formatDate(endDate),
                `${numDays} day${numDays === 1 ? '' : 's'} (${leave_length})`
            );

            emailResults.management.success = true;
        } catch (emailError) {
            emailResults.management.error = (emailError as Error).message;
        }

        // Response
        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                leaveId: result.insertId,
                duration: numDays,
                system_notes,
                is_backdated: isBackdated,
                status: "pending",
                emailNotifications: emailResults
            }
        }, 200);

    } catch (error) {
        console.error("Apply leave error:", error);

        if (error instanceof z.ZodError) {
            return c.json<ApiResponse>({
                success: false,
                message: "Invalid request data",
                errors: error.errors
            }, 400);
        }

        if (error instanceof Error && error.message.includes("token")) {
            return c.json<ApiResponse>({
                success: false,
                message: error.message
            }, 401);
        }

        return c.json<ApiResponse>({
            success: false,
            message: "Failed to submit leave request"
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

            // Create Outlook calendar events when leave is approved (fire-and-forget)
            if (action === 'approve') {
                try {
                    const managerToken = getDecodedToken(c);
                    const managerName = `${managerToken.given_name || managerToken.name || 'Manager'} ${managerToken.family_name || ''}`.trim();
                    const { sharedEventId, personalEventId } = await createLeaveEvents({
                        employeeEmail: leaveRequest.email,
                        employeeName: `${leaveRequest.firstName} ${leaveRequest.lastName}`,
                        leaveType: leaveRequest.leave_type,
                        startDate: leaveRequest.start_date,
                        endDate: leaveRequest.end_date,
                        managerName,
                    });
                    const calendarConnection = await DatabaseService.createConnection();
                    try {
                        await calendarConnection.query(
                            'UPDATE leave_requests SET outlook_shared_event_id = ?, outlook_personal_event_id = ? WHERE id = ?',
                            [sharedEventId, personalEventId, leaveId]
                        );
                    } finally {
                        await calendarConnection.end();
                    }
                } catch (err) {
                    console.error('[Outlook] Failed to create calendar events:', err);
                }
            }

            return c.json<ApiResponse>({
                success: true,
                message: `Leave request ${action} successfully`,
                data: {
                    leaveId: leaveId !== undefined ? parseInt(leaveId) : null,
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

// POST /bulk-action - Approve or reject multiple pending leave requests at once
app.post('/bulk-action', async (c: Context): Promise<Response> => {
    try {
        const managerId = getUserId(c);
        const managerToken = getDecodedToken(c);
        const managerName = `${managerToken.given_name || managerToken.name || 'Manager'} ${managerToken.family_name || ''}`.trim();

        const body = await c.req.json();
        const schema = z.object({
            leaveIds: z.array(z.number().int().positive()).min(1).max(50),
            action: z.enum(['approve', 'reject']),
            feedback: z.string().optional().default(''),
        });
        const { leaveIds, action, feedback } = schema.parse(body);

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const processedAt = new Date().toISOString();

        const results: { id: number; success: boolean; error?: string }[] = [];

        for (const leaveId of leaveIds) {
            let connection: mysql.Connection | null = null;
            try {
                connection = await DatabaseService.createConnection();

                const [rows] = await connection.query<mysql.RowDataPacket[]>(`
                    SELECT lr.*, u.firstName, u.lastName, u.email
                    FROM leave_requests lr
                    LEFT JOIN users u ON lr.uid = u.id
                    WHERE lr.id = ? AND lr.status = "pending"
                `, [leaveId]);

                if (!rows || rows.length === 0) {
                    results.push({ id: leaveId, success: false, error: 'Not found or already processed' });
                    continue;
                }

                const leaveRequest = rows[0] as LeaveRequestWithUser;

                await connection.beginTransaction();
                await connection.query(`
                    UPDATE leave_requests
                    SET status = ?, approved_by = ?, feedback = ?, approved_at = ?, updatedAt = ?
                    WHERE id = ?
                `, [newStatus, managerId, feedback, processedAt, processedAt, leaveId]);

                await connection.query(`
                    INSERT INTO leave_action_log (leave_id, manager_id, action, previous_status, new_status, timestamp)
                    VALUES (?, ?, ?, ?, ?, NOW())
                `, [leaveId, managerId, action, 'pending', newStatus]);

                await connection.commit();
                await connection.end();
                connection = null;

                // Fire-and-forget: email + calendar — never block the loop
                sender(
                    leaveRequest.email,
                    `${leaveRequest.firstName} ${leaveRequest.lastName}`,
                    `Your leave request for <strong>${leaveRequest.leave_type}</strong> from ${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)} has been <strong>${newStatus}</strong>.<br><br>Feedback: ${feedback}`,
                    `Leave Request ${newStatus} - ${leaveRequest.leave_type}`,
                    newStatus as 'approved' | 'rejected'
                ).catch(err => console.error(`[BulkAction] Email failed for leave ${leaveId}:`, err));

                if (action === 'approve') {
                    createLeaveEvents({
                        employeeEmail: leaveRequest.email,
                        employeeName: `${leaveRequest.firstName} ${leaveRequest.lastName}`,
                        leaveType: leaveRequest.leave_type,
                        startDate: leaveRequest.start_date,
                        endDate: leaveRequest.end_date,
                        managerName,
                    }).then(async ({ sharedEventId, personalEventId }) => {
                        const calConn = await DatabaseService.createConnection();
                        try {
                            await calConn.query(
                                'UPDATE leave_requests SET outlook_shared_event_id = ?, outlook_personal_event_id = ? WHERE id = ?',
                                [sharedEventId, personalEventId, leaveId]
                            );
                        } finally {
                            await calConn.end();
                        }
                    }).catch(err => console.error(`[BulkAction] Outlook calendar failed for leave ${leaveId}:`, err));
                }

                results.push({ id: leaveId, success: true });

            } catch (err) {
                if (connection) {
                    try { await connection.rollback(); } catch (_) {}
                    try { await connection.end(); } catch (_) {}
                }
                console.error(`[BulkAction] Failed to process leave ${leaveId}:`, err);
                results.push({ id: leaveId, success: false, error: 'Internal error' });
            }
        }

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return c.json({
            success: true,
            message: `${succeeded} request${succeeded !== 1 ? 's' : ''} ${newStatus}${failed > 0 ? `, ${failed} failed` : ''}`,
            data: { results, succeeded, failed, action, newStatus },
        }, 200);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return c.json({ success: false, message: 'Invalid request data' }, 400);
        }
        console.error('[BulkAction] Unexpected error:', error);
        return c.json({ success: false, message: 'Failed to process bulk action' }, 500);
    }
});

// GET /all-leave-requests - Get all leave requests (for managers)
app.get('/all-leave-requests', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const currentYear = new Date().getFullYear();

        const queryParams: LeaveQueryParams = {
            leave_type: c.req.query('leave_type'),
            search: c.req.query('search'),
            page: c.req.query('page'),
            limit: c.req.query('limit')
        };

        const page = parseInt(queryParams.page || '1');
        const limit = Math.min(100, parseInt(queryParams.limit || '30'));
        const offset = (page - 1) * limit;

        const conditions: string[] = [];
        const params: any[] = [];

        // Filter by current year only
        conditions.push('YEAR(lr.createdAt) = ?');
        params.push(currentYear);

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
            ORDER BY lr.createdAt DESC
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
        if (!leaveId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request ID is required'
            }, 400);
        }

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

// PUT /:id/cancel - Cancel approved leave request
app.put('/:id/cancel', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const managerId = getUserId(c);
        const leaveId = c.req.param('id');
        const managerEmail = getDecodedToken(c).email;
        const managerFirstName = getDecodedToken(c).given_name || getDecodedToken(c).name || 'Manager';
        const managerLastName = getDecodedToken(c).family_name || '';
        const managerFullName = `${managerFirstName} ${managerLastName}`.trim();

        connection = await DatabaseService.createConnection();

        // Check if leave request exists and is approved
        const [existingLeave] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT lr.*, u.firstName, u.lastName, u.email,
                   lr.outlook_shared_event_id, lr.outlook_personal_event_id
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            WHERE lr.id = ? AND lr.status = "approved"
        `, [leaveId]);

        if (!existingLeave || existingLeave.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request not found or is not approved'
            }, 404);
        }

        const leaveRequest = existingLeave[0] as LeaveRequestWithUser;
        const cancelledAt = new Date().toISOString();
        const cancellationFeedback = `This approved leave has been cancelled by ${managerFullName} on ${formatDate(cancelledAt)}.`;

        // Start transaction
        await connection.beginTransaction();

        try {
            // Update leave request status to cancelled
            await connection.query<mysql.ResultSetHeader>(`
                UPDATE leave_requests 
                SET status = 'cancelled', 
                    approved_by = ?, 
                    feedback = CONCAT(COALESCE(feedback, ''), '\n\n', ?), 
                    approved_at = ?, 
                    updatedAt = ?
                WHERE id = ?
            `, [managerId, cancellationFeedback, cancelledAt, cancelledAt, leaveId]);

            // Log the cancellation action
            await connection.query<mysql.ResultSetHeader>(`
                INSERT INTO leave_action_log (leave_id, manager_id, action, previous_status, new_status, timestamp)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [leaveId, managerId, 'cancel', 'approved', 'cancelled']);

            await connection.commit();

            // Send email notification to employee
            const employeeEmailBody = `Your approved leave request for <strong>${leaveRequest.leave_type}</strong> from ${formatDate(leaveRequest.start_date)} to ${formatDate(leaveRequest.end_date)} has been <strong>cancelled</strong> by management.
            <br><br>
            <strong>Duration:</strong> ${leaveRequest.duration} day${parseFloat(leaveRequest.duration) !== 1 ? 's' : ''} (${leaveRequest.leave_length === 'half_day' ? 'Half Day' : 'Full Day'})
            <br><br>
            <strong>Cancelled By:</strong> ${managerFullName}
            <br>
            <strong>Cancelled On:</strong> ${formatDate(cancelledAt)}
            <br><br>
            If you have any questions about this cancellation, please contact your manager or HR department.`;

            try {
                await sender(
                    leaveRequest.email,
                    `${leaveRequest.firstName} ${leaveRequest.lastName}`,
                    employeeEmailBody,
                    `Leave Cancelled - ${leaveRequest.leave_type}`,
                    'rejected' // Using 'rejected' status for styling in email template
                );
            } catch (emailError) {
                console.error('Failed to send cancellation email to employee:', emailError);
                // Don't fail the request if email fails
            }

            // Send notification to management
            const managementEmailBody = `Cancelled by ${managerFullName} on ${formatDate(cancelledAt)}.`;

            try {
                await senderManagement(
                    managerFullName,
                    managerEmail,
                    managementEmailBody,
                    `Leave Cancelled - ${leaveRequest.leave_type}`,
                    'rejected',
                    leaveRequest.leave_type,
                    formatDate(leaveRequest.start_date),
                    formatDate(leaveRequest.end_date),
                    `${leaveRequest.duration} day${parseFloat(leaveRequest.duration) !== 1 ? 's' : ''} (${leaveRequest.leave_length})`
                );
            } catch (emailError) {
                console.error('Failed to send cancellation notification to management:', emailError);
                // Don't fail the request if email fails
            }

            // Delete Outlook calendar events when leave is cancelled (fire-and-forget)
            try {
                const { outlook_shared_event_id, outlook_personal_event_id, email } = leaveRequest;
                if (outlook_shared_event_id || outlook_personal_event_id) {
                    await deleteLeaveEvents(outlook_shared_event_id ?? null, outlook_personal_event_id ?? null, email);
                }
            } catch (err) {
                console.error('[Outlook] Failed to delete calendar events:', err);
            }

            return c.json<ApiResponse>({
                success: true,
                message: 'Leave request cancelled successfully',
                data: {
                    leaveId: leaveId !== undefined ? parseInt(leaveId) : null,
                    action: 'cancel',
                    status: 'cancelled',
                    cancelledAt: cancelledAt,
                    cancelledBy: managerFullName,
                    employeeNotified: true,
                    managementNotified: true
                }
            }, 200);

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Cancel leave error:', error);

        if (error instanceof Error && error.message.includes("token")) {
            return c.json<ApiResponse>({
                success: false,
                message: error.message
            }, 401);
        }

        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to cancel leave request'
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

app.get('/leave-calendar-with-birthdays', async (c: Context): Promise<Response> => {
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

        // Fetch birthdays within date range
        const [birthdayResults] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                u.id,
                u.firstName,
                u.lastName,
                u.email,
                u.jobTitle,
                u.dob,
                DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) as birthday_this_year,
                YEAR(CURDATE()) - YEAR(u.dob) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(u.dob, '%m%d')) as current_age
            FROM users u
            WHERE u.dob IS NOT NULL
            AND (u.isActive IS NULL OR u.isActive = 1)
            AND (
                -- Birthday falls within the requested date range this year
                DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) BETWEEN ? AND ?
                OR
                -- Handle year boundary cases (e.g., Dec to Jan)
                (YEAR(?) < YEAR(?) AND 
                 (DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) >= ? OR
                  DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) <= ?))
            )
            ORDER BY DATE_FORMAT(u.dob, '%m-%d'), u.firstName
        `, [
            queryParams.start_date, // For YEAR() calculation
            queryParams.start_date, // For YEAR() calculation in range check
            queryParams.start_date,
            queryParams.end_date,
            queryParams.start_date, // For year boundary check
            queryParams.end_date,   // For year boundary check
            queryParams.start_date, // For year boundary check
            queryParams.start_date, // For >= comparison
            queryParams.end_date,   // For year boundary check
            queryParams.end_date    // For <= comparison
        ]);

        // Transform birthday data
        const today = dayjs();
        const todayDayOfWeek = today.day(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
        const birthdays: Birthday[] = birthdayResults.map(user => {
            const birthdayThisYear = dayjs(user.birthday_this_year);
            const age = user.current_age + 1; // Age they'll turn on birthday
            const birthdayDayOfWeek = birthdayThisYear.day();

            // Observe weekend birthdays on the preceding Friday
            const isTodayBirthday = birthdayThisYear.format('YYYY-MM-DD') === today.format('YYYY-MM-DD');
            const isFridayObserved = todayDayOfWeek === 5 && (
                (birthdayDayOfWeek === 6 && birthdayThisYear.isSame(today.add(1, 'day'), 'day')) || // Sat → Fri
                (birthdayDayOfWeek === 0 && birthdayThisYear.isSame(today.add(2, 'day'), 'day'))    // Sun → Fri
            );
            const isToday = isTodayBirthday || isFridayObserved;

            return {
                id: `birthday-${user.id}`,
                userId: user.id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                jobTitle: user.jobTitle || '',
                profilePicture: user.profilePicture,
                dob: dayjs(user.dob).format('YYYY-MM-DD'),
                birthdayDate: birthdayThisYear.format('YYYY-MM-DD'),
                age: age,
                isToday: isToday
            };
        });

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

        return c.json<ApiResponse<LeaveCalendarWithBirthdaysResponse>>({
            success: true,
            message: 'Calendar data with birthdays retrieved successfully',
            data: {
                dateRange: {
                    startDate: queryParams.start_date,
                    endDate: queryParams.end_date
                },
                leaveRequests: leaveCalendar,
                publicHolidays,
                birthdays
            }
        }, 200);

    } catch (error) {
        console.error('Get calendar with birthdays error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve calendar data with birthdays'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// Standalone birthdays endpoint (optional - for birthday-specific queries)
app.get('/birthdays', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        // Get query parameters
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

        // Fetch birthdays within date range
        const [birthdayResults] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                u.id,
                u.firstName,
                u.lastName,
                u.email,
                u.jobTitle,
                u.dob,
                DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) as birthday_this_year,
                YEAR(CURDATE()) - YEAR(u.dob) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(u.dob, '%m%d')) as current_age
            FROM users u
            WHERE u.dob IS NOT NULL
            AND (u.isActive IS NULL OR u.isActive = 1)
            AND (
                -- Birthday falls within the requested date range this year
                DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) BETWEEN ? AND ?
                OR
                -- Handle year boundary cases (e.g., Dec to Jan)
                (YEAR(?) < YEAR(?) AND 
                 (DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) >= ? OR
                  DATE(CONCAT(YEAR(?), '-', DATE_FORMAT(u.dob, '%m-%d'))) <= ?))
            )
            ORDER BY DATE_FORMAT(u.dob, '%m-%d'), u.firstName
        `, [
            queryParams.start_date, // For YEAR() calculation
            queryParams.start_date, // For YEAR() calculation in range check
            queryParams.start_date,
            queryParams.end_date,
            queryParams.start_date, // For year boundary check
            queryParams.end_date,   // For year boundary check
            queryParams.start_date, // For year boundary check
            queryParams.start_date, // For >= comparison
            queryParams.end_date,   // For year boundary check
            queryParams.end_date    // For <= comparison
        ]);

        // Transform birthday data
        const today2 = dayjs();
        const todayDow2 = today2.day();
        const birthdays: Birthday[] = birthdayResults.map(user => {
            const birthdayThisYear = dayjs(user.birthday_this_year);
            const age = user.current_age + 1; // Age they'll turn on birthday
            const birthdayDow = birthdayThisYear.day();

            const isTodayBirthday = birthdayThisYear.format('YYYY-MM-DD') === today2.format('YYYY-MM-DD');
            const isFridayObserved = todayDow2 === 5 && (
                (birthdayDow === 6 && birthdayThisYear.isSame(today2.add(1, 'day'), 'day')) ||
                (birthdayDow === 0 && birthdayThisYear.isSame(today2.add(2, 'day'), 'day'))
            );
            const isToday = isTodayBirthday || isFridayObserved;

            return {
                id: `birthday-${user.id}`,
                userId: user.id,
                name: `${user.firstName} ${user.lastName}`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                jobTitle: user.jobTitle || '',
                profilePicture: user.profilePicture,
                dob: dayjs(user.dob).format('YYYY-MM-DD'),
                birthdayDate: birthdayThisYear.format('YYYY-MM-DD'),
                age: age,
                isToday: isToday
            };
        });

        return c.json<ApiResponse<{ birthdays: Birthday[], total: number }>>({
            success: true,
            message: 'Birthdays retrieved successfully',
            data: {
                birthdays,
                total: birthdays.length
            }
        }, 200);

    } catch (error) {
        console.error('Get birthdays error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to retrieve birthdays'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// // GET /leave-balance - Get leave balance (placeholder)
// app.get('/leave-calendar', async (c: Context): Promise<Response> => {
//     let connection: mysql.Connection | null = null;
//     try {
//         connection = await DatabaseService.createConnection();

//         // Get current date in UTC
//         const now = dayjs.utc();

//         // Set default date range (current month)
//         const defaultStartDate = now.startOf('month').format('YYYY-MM-DD');
//         const defaultEndDate = now.endOf('month').format('YYYY-MM-DD');

//         // Get query parameters
//         const queryParams = {
//             start_date: c.req.query('start_date') || defaultStartDate,
//             end_date: c.req.query('end_date') || defaultEndDate
//         };

//         // Validate dates
//         if (!dayjs(queryParams.start_date, 'YYYY-MM-DD', true).isValid() ||
//             !dayjs(queryParams.end_date, 'YYYY-MM-DD', true).isValid()) {
//             return c.json<ApiResponse>({
//                 success: false,
//                 message: 'Invalid date format. Use YYYY-MM-DD'
//             }, 400);
//         }

//         if (dayjs(queryParams.start_date).isAfter(dayjs(queryParams.end_date))) {
//             return c.json<ApiResponse>({
//                 success: false,
//                 message: 'Start date cannot be after end date'
//             }, 400);
//         }

//         // Fetch approved leave requests
//         const [leaveCalendar] = await connection.query<mysql.RowDataPacket[]>(`
//             SELECT 
//                 lr.id, 
//                 lr.start_date, 
//                 lr.end_date, 
//                 lr.leave_type, 
//                 lr.leave_length, 
//                 lr.duration,
//                 u.firstName, 
//                 u.lastName, 
//                 u.email, 
//                 u.jobTitle,
//                 m.firstName as managerFirstName, 
//                 m.lastName as managerLastName
//             FROM leave_requests lr
//             JOIN users u ON lr.uid = u.id
//             LEFT JOIN users m ON lr.approved_by = m.id
//             WHERE lr.start_date <= ? 
//               AND lr.end_date >= ? 
//               AND lr.status = "approved"
//             ORDER BY lr.start_date ASC
//         `, [queryParams.end_date, queryParams.start_date]);

//         // Get public holidays
//         let publicHolidays: PublicHoliday[] = [];
//         try {
//             const holidayDates = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(
//                 new Date(queryParams.start_date),
//                 new Date(queryParams.end_date)
//             );

//             publicHolidays = holidayDates.map(holiday => ({
//                 date: dayjs(holiday.date).format('YYYY-MM-DD'),
//                 name: holiday.name || 'Public Holiday',
//                 dayOfWeek: dayjs(holiday.date).format('dddd')
//             }));
//         } catch (error) {
//             console.error('Failed to fetch public holidays:', error);
//             // Optionally add a warning to the response if needed
//         }

//         return c.json<ApiResponse<LeaveCalendarResponse>>({
//             success: true,
//             message: 'Leave calendar retrieved successfully',
//             data: {
//                 dateRange: {
//                     startDate: queryParams.start_date,
//                     endDate: queryParams.end_date
//                 },
//                 leaveRequests: leaveCalendar,
//                 publicHolidays: publicHolidays
//             }
//         }, 200);

//     } catch (error) {
//         console.error('Get leave calendar error:', error);

//         return c.json<ApiResponse>({
//             success: false,
//             message: 'Failed to retrieve leave calendar'
//         }, 500);
//     } finally {
//         if (connection) await connection.end();
//     }
// });

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

/**
 * @api {patch} /:id/cancel Cancel a Leave Request
 * @apiName CancelLeaveRequest
 * @apiGroup Leave
 *
 * @apiParam {String} id The unique ID of the leave request.
 *
 * @apiSuccess {Boolean} success Indicates if the operation was successful.
 * @apiSuccess {String}  message A descriptive message.
 *
 * @apiError (400) BadRequest The request could not be cancelled (e.g., status is not 'Pending').
 * @apiError (404) NotFound   The leave request was not found or doesn't belong to the user.
 * @apiError (500) InternalServerError A server-side error occurred.
 */
app.patch('/:id/cancel', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const uid = getUserId(c);
        const leaveRequestId = c.req.param('id');

        const cancellation_reason = c.req.query('cancellation_reason') || 'No reason provided';

        if (!leaveRequestId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Leave request ID is required'
            }, 400);
        }

        connection = await DatabaseService.createConnection();

        // Atomically update the status to 'Canceled' only if it's currently 'Pending'
        // and belongs to the authenticated user.
        const [result] = await connection.query<mysql.OkPacket>(`
            UPDATE leave_requests
            SET feedback = ?, status = 'cancelled', updatedAt = NOW()
            WHERE id = ? AND uid = ? AND status = 'pending'
        `, [cancellation_reason, leaveRequestId, uid]);

        // If no rows were updated, the request either doesn't exist,
        // doesn't belong to the user, or is not in a 'Pending' state.
        if (result.affectedRows === 0) {
            // To provide a more specific error, we check why it failed.
            const [existingRequest] = await connection.query<mysql.RowDataPacket[]>(
                'SELECT status FROM leave_requests WHERE id = ? AND uid = ?',
                [leaveRequestId, uid]
            );

            if (existingRequest.length === 0) {
                return c.json<ApiResponse>({
                    success: false,
                    message: 'Leave request not found or you do not have permission to modify it.'
                }, 404);
            }

            return c.json<ApiResponse>({
                success: false,
                message: `This leave request cannot be cancelled as its status is '${existingRequest[0].status}'.`
            }, 400); // 400 Bad Request is appropriate as the client's request is invalid.
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Leave request cancelled successfully'
        }, 200);

    } catch (error) {
        console.error('Cancel leave request error:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to cancel leave request due to a server error'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

export { app as leaveApp };