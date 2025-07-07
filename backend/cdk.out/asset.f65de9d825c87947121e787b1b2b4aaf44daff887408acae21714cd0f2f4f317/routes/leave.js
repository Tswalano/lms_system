"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leave = void 0;
const hono_1 = require("hono");
const zod_1 = require("zod");
const auth_1 = require("../middleware/auth");
const leaveHelpers_1 = require("../helpers/leaveHelpers");
const validationSchemas_1 = require("../schemas/validationSchemas");
const databaseHeler_1 = require("../helpers/databaseHeler");
const app = new hono_1.Hono();
exports.leave = app;
// POST /apply-leave - Submit leave application
app.post('/apply-leave', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        const decodedToken = (0, auth_1.getDecodedToken)(c);
        const body = await c.req.json();
        const validatedData = validationSchemas_1.leaveApplicationSchema.parse(body);
        const { leave_type, leave_start, leave_end, leave_length, leave_comment } = validatedData;
        const startDate = new Date(leave_start);
        const endDate = new Date(leave_end);
        if (startDate > endDate) {
            return c.json({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }
        if (startDate < new Date()) {
            return c.json({
                success: false,
                message: 'Start date cannot be in the past'
            }, 400);
        }
        let numDays = 0;
        let excludedDetails = { weekends: 0, holidays: [], totalExcluded: 0 };
        if (leave_length === "Full Day") {
            numDays = await (0, leaveHelpers_1.calculateTotalLeaveDays)(startDate, endDate);
            excludedDetails = (0, leaveHelpers_1.getExcludedDaysDetails)(startDate, endDate);
        }
        else if (leave_length === "Half Day") {
            numDays = 0.5;
            if ((0, leaveHelpers_1.isWeekend)(startDate)) {
                return c.json({
                    success: false,
                    message: 'Cannot apply for leave on weekends'
                }, 400);
            }
            const allHolidays = (0, leaveHelpers_1.getSouthAfricanPublicHolidays)(startDate.getFullYear());
            if ((0, leaveHelpers_1.isPublicHoliday)(startDate, allHolidays)) {
                return c.json({
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
        const createdAt = (0, leaveHelpers_1.formatDateTime)();
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const [result] = await connection.query(`
            INSERT INTO leave_requests (
                uid, leave_type, status, duration, start_date, end_date, feedback, 
                document, leave_length, leave_comment, createdAt, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [uid, leave_type, "pending", numDays.toString(), startDate, endDate, feedback, "no supporting document", leave_length, leave_comment, createdAt, createdAt]);
        return c.json({
            success: true,
            message: 'Leave request submitted successfully',
            data: {
                leaveId: result.insertId,
                duration: numDays,
                feedback: feedback,
                status: "pending"
            }
        }, 200);
    }
    catch (error) {
        console.error('Apply leave error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }
        if (error instanceof Error && error.message.includes('token')) {
            return c.json({
                success: false,
                message: error.message
            }, 401);
        }
        return c.json({
            success: false,
            message: 'Failed to submit leave request'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /leave-history - Get user's leave history
app.get('/leave-history', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const [rows] = await connection.query(`
            SELECT id, leave_type, status, duration, start_date, end_date, feedback,
                   leave_length, leave_comment, createdAt, updatedAt
            FROM leave_requests 
            WHERE uid = ? 
            ORDER BY createdAt DESC
        `, [uid]);
        return c.json({
            success: true,
            message: 'Leave history retrieved successfully',
            data: rows
        }, 200);
    }
    catch (error) {
        console.error('Get leave history error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave history'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// PUT /leave/:id - Update leave request
app.put('/leave/:id', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        const leaveId = c.req.param('id');
        const body = await c.req.json();
        const updateData = validationSchemas_1.leaveUpdateSchema.parse(body);
        connection = await databaseHeler_1.DatabaseService.createConnection();
        // Check if leave exists and is pending
        const [existingLeave] = await connection.query('SELECT * FROM leave_requests WHERE id = ? AND uid = ?', [leaveId, uid]);
        if (!existingLeave || existingLeave.length === 0) {
            return c.json({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }
        const currentLeave = existingLeave[0];
        if (currentLeave.status !== 'pending') {
            return c.json({
                success: false,
                message: 'Cannot update leave request that is not pending'
            }, 400);
        }
        const fieldsToUpdate = [];
        const valuesToUpdate = [];
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
                return c.json({
                    success: false,
                    message: 'Start date cannot be after end date'
                }, 400);
            }
            let numDays = 0;
            if (leaveLength === "Full Day") {
                numDays = await (0, leaveHelpers_1.calculateTotalLeaveDays)(startDate, endDate);
            }
            else {
                numDays = 0.5;
            }
            const feedback = `A total of ${numDays} leave day${numDays === 1 ? "" : "s"} will be deducted from your balance.`;
            fieldsToUpdate.push('start_date = ?', 'end_date = ?', 'leave_length = ?', 'duration = ?', 'feedback = ?');
            valuesToUpdate.push(startDate, endDate, leaveLength, numDays.toString(), feedback);
        }
        if (fieldsToUpdate.length === 0) {
            return c.json({
                success: false,
                message: 'No fields to update'
            }, 400);
        }
        fieldsToUpdate.push('updatedAt = ?');
        valuesToUpdate.push((0, leaveHelpers_1.formatDateTime)());
        valuesToUpdate.push(leaveId, uid);
        const updateQuery = `UPDATE leave_requests SET ${fieldsToUpdate.join(', ')} WHERE id = ? AND uid = ?`;
        await connection.query(updateQuery, valuesToUpdate);
        return c.json({
            success: true,
            message: 'Leave request updated successfully'
        }, 200);
    }
    catch (error) {
        console.error('Update leave error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to update leave request'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// PUT /:id/approve - Approve or reject leave request
app.put('/:id/approve', async (c) => {
    let connection = null;
    try {
        const managerId = (0, auth_1.getUserId)(c);
        const leaveId = c.req.param('id');
        const body = await c.req.json();
        const validatedData = validationSchemas_1.leaveApprovalSchema.parse(body);
        const { action, feedback } = validatedData;
        connection = await databaseHeler_1.DatabaseService.createConnection();
        // Check if leave request exists and is pending
        const [existingLeave] = await connection.query(`
            SELECT lr.*, u.firstName, u.lastName, u.email 
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            WHERE lr.id = ? AND lr.status = "pending"
        `, [leaveId]);
        if (!existingLeave || existingLeave.length === 0) {
            return c.json({
                success: false,
                message: 'Leave request not found or already processed'
            }, 404);
        }
        const leaveRequest = existingLeave[0];
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const processedAt = new Date().toISOString();
        // Start transaction
        await connection.beginTransaction();
        try {
            // Update leave request
            await connection.query(`
                UPDATE leave_requests 
                SET status = ?, approved_by = ?, feedback = ?, approved_at = ?, updatedAt = ?
                WHERE id = ?
            `, [newStatus, managerId, feedback, processedAt, processedAt, leaveId]);
            // Log the action
            await connection.query(`
                INSERT INTO leave_action_log (leave_id, manager_id, action, previous_status, new_status, timestamp)
                VALUES (?, ?, ?, ?, ?, NOW())
            `, [leaveId, managerId, action, 'pending', newStatus]);
            await connection.commit();
            return c.json({
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
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
    }
    catch (error) {
        console.error('Approve leave error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to process leave request'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /all-leave-requests - Get all leave requests (for managers)
app.get('/all-leave-requests', async (c) => {
    let connection = null;
    try {
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const currentYear = new Date().getFullYear();
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
        const twoMonthsAgoStr = twoMonthsAgo.toISOString().split('T')[0];
        const queryParams = {
            leave_type: c.req.query('leave_type'),
            search: c.req.query('search'),
            page: c.req.query('page'),
            limit: c.req.query('limit')
        };
        const page = parseInt(queryParams.page || '1');
        const limit = Math.min(100, parseInt(queryParams.limit || '20'));
        const offset = (page - 1) * limit;
        const conditions = [];
        const params = [];
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
        const [countResult] = await connection.query(`
            SELECT COUNT(*) as total 
            FROM leave_requests lr 
            LEFT JOIN users u ON lr.uid = u.id
            ${whereClause}
        `, params);
        const total = countResult[0].total;
        // Data query
        const [requests] = await connection.query(`
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
        const paginationData = {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        };
        return c.json({
            success: true,
            message: 'Leave requests retrieved successfully',
            data: {
                requests: requests,
                pagination: paginationData
            }
        }, 200);
    }
    catch (error) {
        console.error('Get all leave requests error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave requests'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// POST /leave-calculation - Preview leave calculation
app.post('/leave-calculation', async (c) => {
    try {
        const body = await c.req.json();
        const validatedData = validationSchemas_1.leaveCalculationSchema.parse(body);
        const { leave_start, leave_end, leave_length } = validatedData;
        const startDate = new Date(leave_start);
        const endDate = new Date(leave_end);
        if (startDate > endDate) {
            return c.json({
                success: false,
                message: 'Start date cannot be after end date'
            }, 400);
        }
        let numDays = 0;
        let excludedDetails = { weekends: 0, holidays: [], totalExcluded: 0 };
        let warnings = [];
        if (leave_length === "Full Day") {
            numDays = await (0, leaveHelpers_1.calculateTotalLeaveDays)(startDate, endDate);
            excludedDetails = (0, leaveHelpers_1.getExcludedDaysDetails)(startDate, endDate);
        }
        else {
            numDays = 0.5;
            if ((0, leaveHelpers_1.isWeekend)(startDate))
                warnings.push('Selected date falls on a weekend');
            const allHolidays = (0, leaveHelpers_1.getSouthAfricanPublicHolidays)(startDate.getFullYear());
            if ((0, leaveHelpers_1.isPublicHoliday)(startDate, allHolidays))
                warnings.push('Selected date is a public holiday');
        }
        const result = {
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
        return c.json({
            success: true,
            message: 'Leave calculation completed',
            data: result
        }, 200);
    }
    catch (error) {
        console.error('Leave calculation error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to calculate leave days'
        }, 500);
    }
});
// GET /public-holidays/:year - Get public holidays
app.get('/public-holidays/:year', async (c) => {
    try {
        const year = parseInt(c.req.param('year'));
        if (isNaN(year) || year < 2020 || year > 2030) {
            return c.json({
                success: false,
                message: 'Invalid year. Please provide a year between 2020 and 2030'
            }, 400);
        }
        const holidays = (0, leaveHelpers_1.getSouthAfricanPublicHolidays)(year);
        const holidayNames = [
            "New Year's Day", "Human Rights Day", "Good Friday", "Family Day",
            "Freedom Day", "Workers' Day", "Youth Day", "National Women's Day",
            "Heritage Day", "Day of Reconciliation", "Christmas Day", "Day of Goodwill"
        ];
        const holidaysWithNames = holidays.map((holiday, index) => ({
            date: holiday.toISOString().split('T')[0],
            name: holidayNames[index] || 'Public Holiday',
            dayOfWeek: holiday.toLocaleDateString('en-US', { weekday: 'long' })
        })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return c.json({
            success: true,
            message: `Public holidays for ${year}`,
            data: {
                year: year,
                holidays: holidaysWithNames,
                total: holidaysWithNames.length
            }
        }, 200);
    }
    catch (error) {
        console.error('Get public holidays error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve public holidays'
        }, 500);
    }
});
// POST /leave/:id/upload-document - Upload document
app.post('/leave/:id/upload-document', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        const leaveId = c.req.param('id');
        const body = await c.req.json();
        const validatedData = validationSchemas_1.fileUploadSchema.parse(body);
        const { file_type, file_name, file_data } = validatedData;
        connection = await databaseHeler_1.DatabaseService.createConnection();
        // Check if leave request exists and belongs to user
        const [existingLeave] = await connection.query('SELECT * FROM leave_requests WHERE id = ? AND uid = ?', [leaveId, uid]);
        if (!existingLeave || existingLeave.length === 0) {
            return c.json({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }
        // Upload to S3
        const s3Key = await (0, leaveHelpers_1.uploadToS3)(file_data, file_name, file_type, uid.toString(), leaveId);
        // Update leave request with document path
        const updatedAt = (0, leaveHelpers_1.formatDateTime)();
        await connection.query('UPDATE leave_requests SET document = ?, updatedAt = ? WHERE id = ? AND uid = ?', [s3Key, updatedAt, leaveId, uid]);
        return c.json({
            success: true,
            message: 'Document uploaded successfully',
            data: { documentPath: s3Key, fileName: file_name }
        }, 200);
    }
    catch (error) {
        console.error('Upload document error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid file data',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to upload document'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /leave/:id - Get leave request by ID
app.get('/leave/:id', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        const leaveId = c.req.param('id');
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const [leaveRequest] = await connection.query(`
            SELECT lr.*, u.firstName, u.lastName, u.email,
                   m.firstName as managerFirstName, m.lastName as managerLastName
            FROM leave_requests lr
            LEFT JOIN users u ON lr.uid = u.id
            LEFT JOIN users m ON lr.approved_by = m.id
            WHERE lr.id = ? AND lr.uid = ?
        `, [leaveId, uid]);
        if (!leaveRequest || leaveRequest.length === 0) {
            return c.json({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }
        const leave = leaveRequest[0];
        // Generate signed URL for document if exists
        let documentUrl = null;
        if (leave.document && leave.document !== 'no supporting document') {
            try {
                documentUrl = await (0, leaveHelpers_1.getSignedUrlFromS3)(leave.document);
            }
            catch (error) {
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
        return c.json({
            success: true,
            message: 'Leave request retrieved successfully',
            data: responseData
        }, 200);
    }
    catch (error) {
        console.error('Get leave by ID error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave request'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// DELETE /leave/:id - Delete leave request
app.delete('/leave/:id', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        const leaveId = c.req.param('id');
        connection = await databaseHeler_1.DatabaseService.createConnection();
        // Check if leave request exists and belongs to user
        const [existingLeave] = await connection.query('SELECT * FROM leave_requests WHERE id = ? AND uid = ?', [leaveId, uid]);
        if (!existingLeave || existingLeave.length === 0) {
            return c.json({
                success: false,
                message: 'Leave request not found'
            }, 404);
        }
        const leave = existingLeave[0];
        // Check if leave can be deleted (only pending leaves)
        if (leave.status !== 'pending') {
            return c.json({
                success: false,
                message: 'Cannot delete leave request that is not pending'
            }, 400);
        }
        // Delete associated document from S3 if exists
        if (leave.document && leave.document !== 'no supporting document') {
            try {
                await (0, leaveHelpers_1.deleteFromS3)(leave.document);
            }
            catch (error) {
                console.error('Error deleting document from S3:', error);
            }
        }
        // Delete leave request
        await connection.query('DELETE FROM leave_requests WHERE id = ? AND uid = ?', [leaveId, uid]);
        return c.json({
            success: true,
            message: 'Leave request deleted successfully'
        }, 200);
    }
    catch (error) {
        console.error('Delete leave error:', error);
        return c.json({
            success: false,
            message: 'Failed to delete leave request'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /leave-calendar - Get leave calendar view
app.get('/leave-calendar', async (c) => {
    let connection = null;
    try {
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const queryParams = {
            start_date: c.req.query('start_date') || firstDay.toISOString().split('T')[0],
            end_date: c.req.query('end_date') || lastDay.toISOString().split('T')[0]
        };
        let whereClause = 'WHERE lr.start_date <= ? AND lr.end_date >= ? AND lr.status = "approved"';
        const queryParamsArray = [queryParams.end_date, queryParams.start_date];
        const [leaveCalendar] = await connection.query(`
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
        const startYear = new Date(queryParams.start_date).getFullYear();
        const endYear = new Date(queryParams.end_date).getFullYear();
        const publicHolidays = [];
        for (let year = startYear; year <= endYear; year++) {
            publicHolidays.push(...(0, leaveHelpers_1.getSouthAfricanPublicHolidays)(year));
        }
        const holidaysInRange = publicHolidays.filter(holiday => {
            const holidayStr = holiday.toISOString().split('T')[0];
            return holidayStr >= queryParams.start_date && holidayStr <= queryParams.end_date;
        }).map(holiday => ({
            date: holiday.toISOString().split('T')[0],
            name: 'Public Holiday',
            dayOfWeek: holiday.toLocaleDateString('en-US', { weekday: 'long' })
        }));
        return c.json({
            success: true,
            message: 'Leave calendar retrieved successfully',
            data: {
                dateRange: {
                    startDate: queryParams.start_date,
                    endDate: queryParams.end_date
                },
                leaveRequests: leaveCalendar,
                publicHolidays: holidaysInRange
            }
        }, 200);
    }
    catch (error) {
        console.error('Get leave calendar error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave calendar'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /leave-balance - Get leave balance (placeholder)
app.get('/leave-balance', async (c) => {
    try {
        const balanceData = {
            annual_leave: 15,
            sick_leave: 10,
            personal_leave: 5,
            used_annual: 3,
            used_sick: 1,
            used_personal: 0
        };
        return c.json({
            success: true,
            message: 'Leave balance retrieved successfully',
            data: balanceData
        }, 200);
    }
    catch (error) {
        console.error('Get leave balance error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave balance'
        }, 500);
    }
});
// GET /leave-stats/personal - Get personal leave statistics
app.get('/leave-stats/personal', async (c) => {
    let connection = null;
    try {
        const uid = (0, auth_1.getUserId)(c);
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const year = c.req.query('year') || new Date().getFullYear().toString();
        const [personalStats] = await connection.query(`
            SELECT leave_type, status, COUNT(*) as count, SUM(CAST(duration AS DECIMAL(5,1))) as total_days
            FROM leave_requests 
            WHERE uid = ? AND YEAR(start_date) = ?
            GROUP BY leave_type, status
            ORDER BY leave_type, status
        `, [uid, year]);
        const [totalUsed] = await connection.query(`
            SELECT 
                SUM(CASE WHEN status = 'approved' THEN CAST(duration AS DECIMAL(5,1)) ELSE 0 END) as total_approved_days,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_requests,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_requests
            FROM leave_requests 
            WHERE uid = ? AND YEAR(start_date) = ?
        `, [uid, year]);
        const statsData = {
            year: year,
            summary: {
                totalApprovedDays: totalUsed[0].total_approved_days || 0,
                pendingRequests: totalUsed[0].pending_requests || 0,
                rejectedRequests: totalUsed[0].rejected_requests || 0
            },
            leaveTypeBreakdown: personalStats
        };
        return c.json({
            success: true,
            message: 'Personal leave statistics retrieved successfully',
            data: statsData
        }, 200);
    }
    catch (error) {
        console.error('Get leave stats error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave statistics'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
// GET /leave-types - Get available leave types
app.get('/leave-types', async (c) => {
    let connection = null;
    try {
        connection = await databaseHeler_1.DatabaseService.createConnection();
        const [leaveTypes] = await connection.query(`
            SELECT leave_type, COUNT(*) as total_requests,
                   SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                   SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                   SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count
            FROM leave_requests 
            WHERE YEAR(start_date) = YEAR(CURDATE())
            GROUP BY leave_type
            ORDER BY total_requests DESC
        `);
        return c.json({
            success: true,
            message: 'Leave types retrieved successfully',
            data: {
                leaveTypes: leaveTypes,
                currentYear: new Date().getFullYear()
            }
        }, 200);
    }
    catch (error) {
        console.error('Get leave types error:', error);
        return c.json({
            success: false,
            message: 'Failed to retrieve leave types'
        }, 500);
    }
    finally {
        if (connection)
            await connection.end();
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsZWF2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwrQkFBNEI7QUFDNUIsNkJBQXdCO0FBR3hCLDZDQUFnRjtBQUNoRiwwREFjaUM7QUFDakMsb0VBaUJzQztBQUN0Qyw0REFBMkQ7QUFFM0QsTUFBTSxHQUFHLEdBQUcsSUFBSSxXQUFJLEVBQUUsQ0FBQztBQSs3QlAsb0JBQUs7QUE3NkJyQiwrQ0FBK0M7QUFDL0MsR0FBRyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQVUsRUFBcUIsRUFBRTtJQUM3RCxJQUFJLFVBQVUsR0FBNEIsSUFBSSxDQUFDO0lBQy9DLElBQUksQ0FBQztRQUNELE1BQU0sR0FBRyxHQUFHLElBQUEsZ0JBQVMsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUN6QixNQUFNLFlBQVksR0FBRyxJQUFBLHNCQUFlLEVBQUMsQ0FBQyxDQUFDLENBQUM7UUFFeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2hDLE1BQU0sYUFBYSxHQUF5QiwwQ0FBc0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0UsTUFBTSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsR0FBRyxhQUFhLENBQUM7UUFFMUYsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDeEMsTUFBTSxPQUFPLEdBQUcsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFcEMsSUFBSSxTQUFTLEdBQUcsT0FBTyxFQUFFLENBQUM7WUFDdEIsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFjO2dCQUN2QixPQUFPLEVBQUUsS0FBSztnQkFDZCxPQUFPLEVBQUUscUNBQXFDO2FBQ2pELEVBQUUsR0FBRyxDQUFDLENBQUM7UUFD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QUE0QixJQUFJLENBQUM7SUFDL0MsSUFBSSxDQUFDO1FBQ0QsVUFBVSxHQUFHLE1BQU0sK0JBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRXRELE1BQU0sQ0FBQyxVQUFVLENBQUMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxLQUFLLENBQXdCOzs7Ozs7Ozs7U0FTbEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFxRTtZQUM5RSxPQUFPLEVBQUUsSUFBSTtZQUNiLE9BQU8sRUFBRSxvQ0FBb0M7WUFDN0MsSUFBSSxFQUFFO2dCQUNGLFVBQVUsRUFBRSxVQUE4QjtnQkFDMUMsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2FBQ3hDO1NBQ0osRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVaLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQWM7WUFDdkIsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsZ0NBQWdDO1NBQzVDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDO1lBQVMsQ0FBQztRQUNQLElBQUksVUFBVTtZQUFFLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQzNDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhvbm8gfSBmcm9tICdob25vJztcbmltcG9ydCB7IHogfSBmcm9tICd6b2QnO1xuaW1wb3J0IHsgQ29udGV4dCB9IGZyb20gJ2hvbm8nO1xuaW1wb3J0IG15c3FsIGZyb20gJ215c3FsMi9wcm9taXNlJztcbmltcG9ydCB7IGdldFVzZXJJZCwgZ2V0RGVjb2RlZFRva2VuLCBnZXRBY2Nlc3NUb2tlbiB9IGZyb20gJy4uL21pZGRsZXdhcmUvYXV0aCc7XG5pbXBvcnQge1xuICAgIGdldFNvdXRoQWZyaWNhblB1YmxpY0hvbGlkYXlzLFxuICAgIGNhbGN1bGF0ZVRvdGFsTGVhdmVEYXlzLFxuICAgIGdldEV4Y2x1ZGVkRGF5c0RldGFpbHMsXG4gICAgaXNXZWVrZW5kLFxuICAgIGlzUHVibGljSG9saWRheSxcbiAgICB1cGxvYWRUb1MzLFxuICAgIGdldFNpZ25lZFVybEZyb21TMyxcbiAgICBkZWxldGVGcm9tUzMsXG4gICAgZm9ybWF0RGF0ZVRpbWUsXG4gICAgTGVhdmVSZXF1ZXN0LFxuICAgIExlYXZlUmVxdWVzdFdpdGhVc2VyLFxuICAgIFB1YmxpY0hvbGlkYXksXG4gICAgRXhjbHVkZWREYXlzRGV0YWlsc1xufSBmcm9tICcuLi9oZWxwZXJzL2xlYXZlSGVscGVycyc7XG5pbXBvcnQge1xuICAgIGxlYXZlQXBwbGljYXRpb25TY2hlbWEsXG4gICAgbGVhdmVVcGRhdGVTY2hlbWEsXG4gICAgbGVhdmVBcHByb3ZhbFNjaGVtYSxcbiAgICBmaWxlVXBsb2FkU2NoZW1hLFxuICAgIGxlYXZlQ2FsY3VsYXRpb25TY2hlbWEsXG4gICAgTGVhdmVBcHBsaWNhdGlvbkRhdGEsXG4gICAgTGVhdmVVcGRhdGVEYXRhLFxuICAgIExlYXZlQXBwcm92YWxEYXRhLFxuICAgIEZpbGVVcGxvYWREYXRhLFxuICAgIExlYXZlQ2FsY3VsYXRpb25EYXRhLFxuICAgIEFwaVJlc3BvbnNlLFxuICAgIFBhZ2luYXRpb25EYXRhLFxuICAgIExlYXZlU3RhdHNEYXRhLFxuICAgIExlYXZlQmFsYW5jZURhdGEsXG4gICAgTGVhdmVUeXBlU3RhdHMsXG4gICAgTGVhdmVDYWxjdWxhdGlvblJlc3VsdFxufSBmcm9tICcuLi9zY2hlbWFzL3ZhbGlkYXRpb25TY2hlbWFzJztcbmltcG9ydCB7IERhdGFiYXNlU2VydmljZSB9IGZyb20gJy4uL2hlbHBlcnMvZGF0YWJhc2VIZWxlcic7XG5cbmNvbnN0IGFwcCA9IG5ldyBIb25vKCk7XG5cbi8vIFR5cGVzIGZvciBxdWVyeSBwYXJhbWV0ZXJzXG5pbnRlcmZhY2UgTGVhdmVRdWVyeVBhcmFtcyB7XG4gICAgc3RhdHVzPzogJ3BlbmRpbmcnIHwgJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCc7XG4gICAgbGVhdmVfdHlwZT86IHN0cmluZztcbiAgICBzdGFydF9kYXRlPzogc3RyaW5nO1xuICAgIGVuZF9kYXRlPzogc3RyaW5nO1xuICAgIHNlYXJjaD86IHN0cmluZztcbiAgICBwYWdlPzogc3RyaW5nO1xuICAgIGxpbWl0Pzogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgQ2FsZW5kYXJRdWVyeVBhcmFtcyB7XG4gICAgc3RhcnRfZGF0ZT86IHN0cmluZztcbiAgICBlbmRfZGF0ZT86IHN0cmluZztcbn1cblxuLy8gUE9TVCAvYXBwbHktbGVhdmUgLSBTdWJtaXQgbGVhdmUgYXBwbGljYXRpb25cbmFwcC5wb3N0KCcvYXBwbHktbGVhdmUnLCBhc3luYyAoYzogQ29udGV4dCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgY29ubmVjdGlvbjogbXlzcWwuQ29ubmVjdGlvbiB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVpZCA9IGdldFVzZXJJZChjKTtcbiAgICAgICAgY29uc3QgZGVjb2RlZFRva2VuID0gZ2V0RGVjb2RlZFRva2VuKGMpO1xuXG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgIGNvbnN0IHZhbGlkYXRlZERhdGE6IExlYXZlQXBwbGljYXRpb25EYXRhID0gbGVhdmVBcHBsaWNhdGlvblNjaGVtYS5wYXJzZShib2R5KTtcbiAgICAgICAgY29uc3QgeyBsZWF2ZV90eXBlLCBsZWF2ZV9zdGFydCwgbGVhdmVfZW5kLCBsZWF2ZV9sZW5ndGgsIGxlYXZlX2NvbW1lbnQgfSA9IHZhbGlkYXRlZERhdGE7XG5cbiAgICAgICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUobGVhdmVfc3RhcnQpO1xuICAgICAgICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUobGVhdmVfZW5kKTtcblxuICAgICAgICBpZiAoc3RhcnREYXRlID4gZW5kRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdGFydCBkYXRlIGNhbm5vdCBiZSBhZnRlciBlbmQgZGF0ZSdcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3RhcnREYXRlIDwgbmV3IERhdGUoKSkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdGFydCBkYXRlIGNhbm5vdCBiZSBpbiB0aGUgcGFzdCdcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbnVtRGF5cyA9IDA7XG4gICAgICAgIGxldCBleGNsdWRlZERldGFpbHM6IEV4Y2x1ZGVkRGF5c0RldGFpbHMgPSB7IHdlZWtlbmRzOiAwLCBob2xpZGF5czogW10sIHRvdGFsRXhjbHVkZWQ6IDAgfTtcblxuICAgICAgICBpZiAobGVhdmVfbGVuZ3RoID09PSBcIkZ1bGwgRGF5XCIpIHtcbiAgICAgICAgICAgIG51bURheXMgPSBhd2FpdCBjYWxjdWxhdGVUb3RhbExlYXZlRGF5cyhzdGFydERhdGUsIGVuZERhdGUpO1xuICAgICAgICAgICAgZXhjbHVkZWREZXRhaWxzID0gZ2V0RXhjbHVkZWREYXlzRGV0YWlscyhzdGFydERhdGUsIGVuZERhdGUpO1xuICAgICAgICB9IGVsc2UgaWYgKGxlYXZlX2xlbmd0aCA9PT0gXCJIYWxmIERheVwiKSB7XG4gICAgICAgICAgICBudW1EYXlzID0gMC41O1xuICAgICAgICAgICAgaWYgKGlzV2Vla2VuZChzdGFydERhdGUpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Nhbm5vdCBhcHBseSBmb3IgbGVhdmUgb24gd2Vla2VuZHMnXG4gICAgICAgICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgYWxsSG9saWRheXMgPSBnZXRTb3V0aEFmcmljYW5QdWJsaWNIb2xpZGF5cyhzdGFydERhdGUuZ2V0RnVsbFllYXIoKSk7XG4gICAgICAgICAgICBpZiAoaXNQdWJsaWNIb2xpZGF5KHN0YXJ0RGF0ZSwgYWxsSG9saWRheXMpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogJ0Nhbm5vdCBhcHBseSBmb3IgbGVhdmUgb24gcHVibGljIGhvbGlkYXlzJ1xuICAgICAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZmVlZGJhY2sgPSBgQSB0b3RhbCBvZiAke251bURheXN9IGxlYXZlIGRheSR7bnVtRGF5cyA9PT0gMSA/IFwiXCIgOiBcInNcIn0gd2lsbCBiZSBkZWR1Y3RlZCBmcm9tIHlvdXIgYmFsYW5jZS5gO1xuICAgICAgICBpZiAobGVhdmVfbGVuZ3RoID09PSBcIkZ1bGwgRGF5XCIgJiYgZXhjbHVkZWREZXRhaWxzLnRvdGFsRXhjbHVkZWQgPiAwKSB7XG4gICAgICAgICAgICBmZWVkYmFjayArPSBgIEV4Y2x1ZGVkOiAke2V4Y2x1ZGVkRGV0YWlscy53ZWVrZW5kc30gd2Vla2VuZChzKWA7XG4gICAgICAgICAgICBpZiAoZXhjbHVkZWREZXRhaWxzLmhvbGlkYXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBmZWVkYmFjayArPSBgIGFuZCAke2V4Y2x1ZGVkRGV0YWlscy5ob2xpZGF5cy5sZW5ndGh9IGhvbGlkYXkocylgO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3JlYXRlZEF0ID0gZm9ybWF0RGF0ZVRpbWUoKTtcblxuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICBjb25zdCBbcmVzdWx0XSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUmVzdWx0U2V0SGVhZGVyPihgXG4gICAgICAgICAgICBJTlNFUlQgSU5UTyBsZWF2ZV9yZXF1ZXN0cyAoXG4gICAgICAgICAgICAgICAgdWlkLCBsZWF2ZV90eXBlLCBzdGF0dXMsIGR1cmF0aW9uLCBzdGFydF9kYXRlLCBlbmRfZGF0ZSwgZmVlZGJhY2ssIFxuICAgICAgICAgICAgICAgIGRvY3VtZW50LCBsZWF2ZV9sZW5ndGgsIGxlYXZlX2NvbW1lbnQsIGNyZWF0ZWRBdCwgdXBkYXRlZEF0XG4gICAgICAgICAgICApIFZBTFVFUyAoPywgPywgPywgPywgPywgPywgPywgPywgPywgPywgPywgPylcbiAgICAgICAgYCwgW3VpZCwgbGVhdmVfdHlwZSwgXCJwZW5kaW5nXCIsIG51bURheXMudG9TdHJpbmcoKSwgc3RhcnREYXRlLCBlbmREYXRlLCBmZWVkYmFjaywgXCJubyBzdXBwb3J0aW5nIGRvY3VtZW50XCIsIGxlYXZlX2xlbmd0aCwgbGVhdmVfY29tbWVudCwgY3JlYXRlZEF0LCBjcmVhdGVkQXRdKTtcblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHJlcXVlc3Qgc3VibWl0dGVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgbGVhdmVJZDogcmVzdWx0Lmluc2VydElkLFxuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiBudW1EYXlzLFxuICAgICAgICAgICAgICAgIGZlZWRiYWNrOiBmZWVkYmFjayxcbiAgICAgICAgICAgICAgICBzdGF0dXM6IFwicGVuZGluZ1wiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdBcHBseSBsZWF2ZSBlcnJvcjonLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygei5ab2RFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHJlcXVlc3QgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvciAmJiBlcnJvci5tZXNzYWdlLmluY2x1ZGVzKCd0b2tlbicpKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZVxuICAgICAgICAgICAgfSwgNDAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzdWJtaXQgbGVhdmUgcmVxdWVzdCdcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoY29ubmVjdGlvbikgYXdhaXQgY29ubmVjdGlvbi5lbmQoKTtcbiAgICB9XG59KTtcblxuLy8gR0VUIC9sZWF2ZS1oaXN0b3J5IC0gR2V0IHVzZXIncyBsZWF2ZSBoaXN0b3J5XG5hcHAuZ2V0KCcvbGVhdmUtaGlzdG9yeScsIGFzeW5jIChjOiBDb250ZXh0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgIGxldCBjb25uZWN0aW9uOiBteXNxbC5Db25uZWN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdWlkID0gZ2V0VXNlcklkKGMpO1xuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICBjb25zdCBbcm93c10gPSBhd2FpdCBjb25uZWN0aW9uLnF1ZXJ5PG15c3FsLlJvd0RhdGFQYWNrZXRbXT4oYFxuICAgICAgICAgICAgU0VMRUNUIGlkLCBsZWF2ZV90eXBlLCBzdGF0dXMsIGR1cmF0aW9uLCBzdGFydF9kYXRlLCBlbmRfZGF0ZSwgZmVlZGJhY2ssXG4gICAgICAgICAgICAgICAgICAgbGVhdmVfbGVuZ3RoLCBsZWF2ZV9jb21tZW50LCBjcmVhdGVkQXQsIHVwZGF0ZWRBdFxuICAgICAgICAgICAgRlJPTSBsZWF2ZV9yZXF1ZXN0cyBcbiAgICAgICAgICAgIFdIRVJFIHVpZCA9ID8gXG4gICAgICAgICAgICBPUkRFUiBCWSBjcmVhdGVkQXQgREVTQ1xuICAgICAgICBgLCBbdWlkXSk7XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZTxMZWF2ZVJlcXVlc3RbXT4+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnTGVhdmUgaGlzdG9yeSByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgIGRhdGE6IHJvd3MgYXMgTGVhdmVSZXF1ZXN0W11cbiAgICAgICAgfSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBsZWF2ZSBoaXN0b3J5IGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHJldHJpZXZlIGxlYXZlIGhpc3RvcnknXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24pIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgfVxufSk7XG5cbi8vIFBVVCAvbGVhdmUvOmlkIC0gVXBkYXRlIGxlYXZlIHJlcXVlc3RcbmFwcC5wdXQoJy9sZWF2ZS86aWQnLCBhc3luYyAoYzogQ29udGV4dCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgY29ubmVjdGlvbjogbXlzcWwuQ29ubmVjdGlvbiB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVpZCA9IGdldFVzZXJJZChjKTtcbiAgICAgICAgY29uc3QgbGVhdmVJZCA9IGMucmVxLnBhcmFtKCdpZCcpO1xuXG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgIGNvbnN0IHVwZGF0ZURhdGE6IExlYXZlVXBkYXRlRGF0YSA9IGxlYXZlVXBkYXRlU2NoZW1hLnBhcnNlKGJvZHkpO1xuXG4gICAgICAgIGNvbm5lY3Rpb24gPSBhd2FpdCBEYXRhYmFzZVNlcnZpY2UuY3JlYXRlQ29ubmVjdGlvbigpO1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGxlYXZlIGV4aXN0cyBhbmQgaXMgcGVuZGluZ1xuICAgICAgICBjb25zdCBbZXhpc3RpbmdMZWF2ZV0gPSBhd2FpdCBjb25uZWN0aW9uLnF1ZXJ5PG15c3FsLlJvd0RhdGFQYWNrZXRbXT4oXG4gICAgICAgICAgICAnU0VMRUNUICogRlJPTSBsZWF2ZV9yZXF1ZXN0cyBXSEVSRSBpZCA9ID8gQU5EIHVpZCA9ID8nLFxuICAgICAgICAgICAgW2xlYXZlSWQsIHVpZF1cbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWV4aXN0aW5nTGVhdmUgfHwgZXhpc3RpbmdMZWF2ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnTGVhdmUgcmVxdWVzdCBub3QgZm91bmQnXG4gICAgICAgICAgICB9LCA0MDQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY3VycmVudExlYXZlID0gZXhpc3RpbmdMZWF2ZVswXSBhcyBMZWF2ZVJlcXVlc3Q7XG5cbiAgICAgICAgaWYgKGN1cnJlbnRMZWF2ZS5zdGF0dXMgIT09ICdwZW5kaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdDYW5ub3QgdXBkYXRlIGxlYXZlIHJlcXVlc3QgdGhhdCBpcyBub3QgcGVuZGluZydcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBmaWVsZHNUb1VwZGF0ZTogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgdmFsdWVzVG9VcGRhdGU6IGFueVtdID0gW107XG5cbiAgICAgICAgaWYgKHVwZGF0ZURhdGEubGVhdmVfdHlwZSkge1xuICAgICAgICAgICAgZmllbGRzVG9VcGRhdGUucHVzaCgnbGVhdmVfdHlwZSA9ID8nKTtcbiAgICAgICAgICAgIHZhbHVlc1RvVXBkYXRlLnB1c2godXBkYXRlRGF0YS5sZWF2ZV90eXBlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGRhdGVEYXRhLmxlYXZlX2NvbW1lbnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZmllbGRzVG9VcGRhdGUucHVzaCgnbGVhdmVfY29tbWVudCA9ID8nKTtcbiAgICAgICAgICAgIHZhbHVlc1RvVXBkYXRlLnB1c2godXBkYXRlRGF0YS5sZWF2ZV9jb21tZW50KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1cGRhdGVEYXRhLmxlYXZlX3N0YXJ0IHx8IHVwZGF0ZURhdGEubGVhdmVfZW5kIHx8IHVwZGF0ZURhdGEubGVhdmVfbGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydERhdGUgPSBuZXcgRGF0ZSh1cGRhdGVEYXRhLmxlYXZlX3N0YXJ0IHx8IGN1cnJlbnRMZWF2ZS5zdGFydF9kYXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGVuZERhdGUgPSBuZXcgRGF0ZSh1cGRhdGVEYXRhLmxlYXZlX2VuZCB8fCBjdXJyZW50TGVhdmUuZW5kX2RhdGUpO1xuICAgICAgICAgICAgY29uc3QgbGVhdmVMZW5ndGggPSB1cGRhdGVEYXRhLmxlYXZlX2xlbmd0aCB8fCBjdXJyZW50TGVhdmUubGVhdmVfbGVuZ3RoO1xuXG4gICAgICAgICAgICBpZiAoc3RhcnREYXRlID4gZW5kRGF0ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdGFydCBkYXRlIGNhbm5vdCBiZSBhZnRlciBlbmQgZGF0ZSdcbiAgICAgICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgbnVtRGF5cyA9IDA7XG4gICAgICAgICAgICBpZiAobGVhdmVMZW5ndGggPT09IFwiRnVsbCBEYXlcIikge1xuICAgICAgICAgICAgICAgIG51bURheXMgPSBhd2FpdCBjYWxjdWxhdGVUb3RhbExlYXZlRGF5cyhzdGFydERhdGUsIGVuZERhdGUpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1EYXlzID0gMC41O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBmZWVkYmFjayA9IGBBIHRvdGFsIG9mICR7bnVtRGF5c30gbGVhdmUgZGF5JHtudW1EYXlzID09PSAxID8gXCJcIiA6IFwic1wifSB3aWxsIGJlIGRlZHVjdGVkIGZyb20geW91ciBiYWxhbmNlLmA7XG5cbiAgICAgICAgICAgIGZpZWxkc1RvVXBkYXRlLnB1c2goJ3N0YXJ0X2RhdGUgPSA/JywgJ2VuZF9kYXRlID0gPycsICdsZWF2ZV9sZW5ndGggPSA/JywgJ2R1cmF0aW9uID0gPycsICdmZWVkYmFjayA9ID8nKTtcbiAgICAgICAgICAgIHZhbHVlc1RvVXBkYXRlLnB1c2goc3RhcnREYXRlLCBlbmREYXRlLCBsZWF2ZUxlbmd0aCwgbnVtRGF5cy50b1N0cmluZygpLCBmZWVkYmFjayk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZmllbGRzVG9VcGRhdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ05vIGZpZWxkcyB0byB1cGRhdGUnXG4gICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgZmllbGRzVG9VcGRhdGUucHVzaCgndXBkYXRlZEF0ID0gPycpO1xuICAgICAgICB2YWx1ZXNUb1VwZGF0ZS5wdXNoKGZvcm1hdERhdGVUaW1lKCkpO1xuICAgICAgICB2YWx1ZXNUb1VwZGF0ZS5wdXNoKGxlYXZlSWQsIHVpZCk7XG5cbiAgICAgICAgY29uc3QgdXBkYXRlUXVlcnkgPSBgVVBEQVRFIGxlYXZlX3JlcXVlc3RzIFNFVCAke2ZpZWxkc1RvVXBkYXRlLmpvaW4oJywgJyl9IFdIRVJFIGlkID0gPyBBTkQgdWlkID0gP2A7XG4gICAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucXVlcnkodXBkYXRlUXVlcnksIHZhbHVlc1RvVXBkYXRlKTtcblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHJlcXVlc3QgdXBkYXRlZCBzdWNjZXNzZnVsbHknXG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdVcGRhdGUgbGVhdmUgZXJyb3I6JywgZXJyb3IpO1xuXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIHouWm9kRXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCByZXF1ZXN0IGRhdGEnLFxuICAgICAgICAgICAgICAgIGVycm9yczogZXJyb3IuZXJyb3JzXG4gICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHVwZGF0ZSBsZWF2ZSByZXF1ZXN0J1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG4vLyBQVVQgLzppZC9hcHByb3ZlIC0gQXBwcm92ZSBvciByZWplY3QgbGVhdmUgcmVxdWVzdFxuYXBwLnB1dCgnLzppZC9hcHByb3ZlJywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGNvbm5lY3Rpb246IG15c3FsLkNvbm5lY3Rpb24gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBtYW5hZ2VySWQgPSBnZXRVc2VySWQoYyk7XG4gICAgICAgIGNvbnN0IGxlYXZlSWQgPSBjLnJlcS5wYXJhbSgnaWQnKTtcblxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgYy5yZXEuanNvbigpO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZWREYXRhOiBMZWF2ZUFwcHJvdmFsRGF0YSA9IGxlYXZlQXBwcm92YWxTY2hlbWEucGFyc2UoYm9keSk7XG4gICAgICAgIGNvbnN0IHsgYWN0aW9uLCBmZWVkYmFjayB9ID0gdmFsaWRhdGVkRGF0YTtcblxuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICAvLyBDaGVjayBpZiBsZWF2ZSByZXF1ZXN0IGV4aXN0cyBhbmQgaXMgcGVuZGluZ1xuICAgICAgICBjb25zdCBbZXhpc3RpbmdMZWF2ZV0gPSBhd2FpdCBjb25uZWN0aW9uLnF1ZXJ5PG15c3FsLlJvd0RhdGFQYWNrZXRbXT4oYFxuICAgICAgICAgICAgU0VMRUNUIGxyLiosIHUuZmlyc3ROYW1lLCB1Lmxhc3ROYW1lLCB1LmVtYWlsIFxuICAgICAgICAgICAgRlJPTSBsZWF2ZV9yZXF1ZXN0cyBsclxuICAgICAgICAgICAgTEVGVCBKT0lOIHVzZXJzIHUgT04gbHIudWlkID0gdS5pZFxuICAgICAgICAgICAgV0hFUkUgbHIuaWQgPSA/IEFORCBsci5zdGF0dXMgPSBcInBlbmRpbmdcIlxuICAgICAgICBgLCBbbGVhdmVJZF0pO1xuXG4gICAgICAgIGlmICghZXhpc3RpbmdMZWF2ZSB8fCBleGlzdGluZ0xlYXZlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSByZXF1ZXN0IG5vdCBmb3VuZCBvciBhbHJlYWR5IHByb2Nlc3NlZCdcbiAgICAgICAgICAgIH0sIDQwNCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsZWF2ZVJlcXVlc3QgPSBleGlzdGluZ0xlYXZlWzBdIGFzIExlYXZlUmVxdWVzdFdpdGhVc2VyO1xuICAgICAgICBjb25zdCBuZXdTdGF0dXMgPSBhY3Rpb24gPT09ICdhcHByb3ZlJyA/ICdhcHByb3ZlZCcgOiAncmVqZWN0ZWQnO1xuICAgICAgICBjb25zdCBwcm9jZXNzZWRBdCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcblxuICAgICAgICAvLyBTdGFydCB0cmFuc2FjdGlvblxuICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmJlZ2luVHJhbnNhY3Rpb24oKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gVXBkYXRlIGxlYXZlIHJlcXVlc3RcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUmVzdWx0U2V0SGVhZGVyPihgXG4gICAgICAgICAgICAgICAgVVBEQVRFIGxlYXZlX3JlcXVlc3RzIFxuICAgICAgICAgICAgICAgIFNFVCBzdGF0dXMgPSA/LCBhcHByb3ZlZF9ieSA9ID8sIGZlZWRiYWNrID0gPywgYXBwcm92ZWRfYXQgPSA/LCB1cGRhdGVkQXQgPSA/XG4gICAgICAgICAgICAgICAgV0hFUkUgaWQgPSA/XG4gICAgICAgICAgICBgLCBbbmV3U3RhdHVzLCBtYW5hZ2VySWQsIGZlZWRiYWNrLCBwcm9jZXNzZWRBdCwgcHJvY2Vzc2VkQXQsIGxlYXZlSWRdKTtcblxuICAgICAgICAgICAgLy8gTG9nIHRoZSBhY3Rpb25cbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUmVzdWx0U2V0SGVhZGVyPihgXG4gICAgICAgICAgICAgICAgSU5TRVJUIElOVE8gbGVhdmVfYWN0aW9uX2xvZyAobGVhdmVfaWQsIG1hbmFnZXJfaWQsIGFjdGlvbiwgcHJldmlvdXNfc3RhdHVzLCBuZXdfc3RhdHVzLCB0aW1lc3RhbXApXG4gICAgICAgICAgICAgICAgVkFMVUVTICg/LCA/LCA/LCA/LCA/LCBOT1coKSlcbiAgICAgICAgICAgIGAsIFtsZWF2ZUlkLCBtYW5hZ2VySWQsIGFjdGlvbiwgJ3BlbmRpbmcnLCBuZXdTdGF0dXNdKTtcblxuICAgICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5jb21taXQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogYExlYXZlIHJlcXVlc3QgJHthY3Rpb259ZCBzdWNjZXNzZnVsbHlgLFxuICAgICAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICAgICAgbGVhdmVJZDogcGFyc2VJbnQobGVhdmVJZCksXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogYWN0aW9uLFxuICAgICAgICAgICAgICAgICAgICBzdGF0dXM6IG5ld1N0YXR1cyxcbiAgICAgICAgICAgICAgICAgICAgcHJvY2Vzc2VkQXQ6IHByb2Nlc3NlZEF0LFxuICAgICAgICAgICAgICAgICAgICBmZWVkYmFjazogZmVlZGJhY2tcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAyMDApO1xuXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLnJvbGxiYWNrKCk7XG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcbiAgICAgICAgfVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQXBwcm92ZSBsZWF2ZSBlcnJvcjonLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygei5ab2RFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHJlcXVlc3QgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcHJvY2VzcyBsZWF2ZSByZXF1ZXN0J1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG4vLyBHRVQgL2FsbC1sZWF2ZS1yZXF1ZXN0cyAtIEdldCBhbGwgbGVhdmUgcmVxdWVzdHMgKGZvciBtYW5hZ2VycylcbmFwcC5nZXQoJy9hbGwtbGVhdmUtcmVxdWVzdHMnLCBhc3luYyAoYzogQ29udGV4dCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgY29ubmVjdGlvbjogbXlzcWwuQ29ubmVjdGlvbiB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbm5lY3Rpb24gPSBhd2FpdCBEYXRhYmFzZVNlcnZpY2UuY3JlYXRlQ29ubmVjdGlvbigpO1xuXG4gICAgICAgIGNvbnN0IGN1cnJlbnRZZWFyID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuICAgICAgICBjb25zdCB0d29Nb250aHNBZ28gPSBuZXcgRGF0ZSgpO1xuICAgICAgICB0d29Nb250aHNBZ28uc2V0TW9udGgodHdvTW9udGhzQWdvLmdldE1vbnRoKCkgLSAyKTtcbiAgICAgICAgY29uc3QgdHdvTW9udGhzQWdvU3RyID0gdHdvTW9udGhzQWdvLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcblxuICAgICAgICBjb25zdCBxdWVyeVBhcmFtczogTGVhdmVRdWVyeVBhcmFtcyA9IHtcbiAgICAgICAgICAgIGxlYXZlX3R5cGU6IGMucmVxLnF1ZXJ5KCdsZWF2ZV90eXBlJyksXG4gICAgICAgICAgICBzZWFyY2g6IGMucmVxLnF1ZXJ5KCdzZWFyY2gnKSxcbiAgICAgICAgICAgIHBhZ2U6IGMucmVxLnF1ZXJ5KCdwYWdlJyksXG4gICAgICAgICAgICBsaW1pdDogYy5yZXEucXVlcnkoJ2xpbWl0JylcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBwYWdlID0gcGFyc2VJbnQocXVlcnlQYXJhbXMucGFnZSB8fCAnMScpO1xuICAgICAgICBjb25zdCBsaW1pdCA9IE1hdGgubWluKDEwMCwgcGFyc2VJbnQocXVlcnlQYXJhbXMubGltaXQgfHwgJzIwJykpO1xuICAgICAgICBjb25zdCBvZmZzZXQgPSAocGFnZSAtIDEpICogbGltaXQ7XG5cbiAgICAgICAgY29uc3QgY29uZGl0aW9uczogc3RyaW5nW10gPSBbXTtcbiAgICAgICAgY29uc3QgcGFyYW1zOiBhbnlbXSA9IFtdO1xuXG4gICAgICAgIC8vIEFwcGx5IGxlYXZlX3R5cGUgaWYgcHJlc2VudFxuICAgICAgICBpZiAocXVlcnlQYXJhbXMubGVhdmVfdHlwZSkge1xuICAgICAgICAgICAgY29uZGl0aW9ucy5wdXNoKCdsci5sZWF2ZV90eXBlID0gPycpO1xuICAgICAgICAgICAgcGFyYW1zLnB1c2gocXVlcnlQYXJhbXMubGVhdmVfdHlwZSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZWFyY2ggY29uZGl0aW9uXG4gICAgICAgIGlmIChxdWVyeVBhcmFtcy5zZWFyY2gpIHtcbiAgICAgICAgICAgIGNvbmRpdGlvbnMucHVzaCgnKENPTkNBVCh1LmZpcnN0TmFtZSwgXCIgXCIsIHUubGFzdE5hbWUpIExJS0UgPyBPUiB1LmVtYWlsIExJS0UgPyknKTtcbiAgICAgICAgICAgIHBhcmFtcy5wdXNoKGAlJHtxdWVyeVBhcmFtcy5zZWFyY2h9JWAsIGAlJHtxdWVyeVBhcmFtcy5zZWFyY2h9JWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29yZSBzdGF0dXMgKyBkYXRlIGxvZ2ljXG4gICAgICAgIGNvbnN0IHN0YXR1c0ZpbHRlciA9IGBcbiAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAobHIuc3RhdHVzID0gJ3BlbmRpbmcnIEFORCBZRUFSKGxyLnN0YXJ0X2RhdGUpID0gPykgT1JcbiAgICAgICAgICAgICAgICAobHIuc3RhdHVzID0gJ0FwcHJvdmVkJyBBTkQgbHIuc3RhcnRfZGF0ZSA+PSA/KVxuICAgICAgICAgICAgKVxuICAgICAgICBgO1xuICAgICAgICBjb25kaXRpb25zLnB1c2goc3RhdHVzRmlsdGVyKTtcbiAgICAgICAgcGFyYW1zLnB1c2goY3VycmVudFllYXIsIHR3b01vbnRoc0Fnb1N0cik7XG5cbiAgICAgICAgY29uc3Qgd2hlcmVDbGF1c2UgPSBjb25kaXRpb25zLmxlbmd0aCA/IGBXSEVSRSAke2NvbmRpdGlvbnMuam9pbignIEFORCAnKX1gIDogJyc7XG5cbiAgICAgICAgLy8gQ291bnQgcXVlcnlcbiAgICAgICAgY29uc3QgW2NvdW50UmVzdWx0XSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihgXG4gICAgICAgICAgICBTRUxFQ1QgQ09VTlQoKikgYXMgdG90YWwgXG4gICAgICAgICAgICBGUk9NIGxlYXZlX3JlcXVlc3RzIGxyIFxuICAgICAgICAgICAgTEVGVCBKT0lOIHVzZXJzIHUgT04gbHIudWlkID0gdS5pZFxuICAgICAgICAgICAgJHt3aGVyZUNsYXVzZX1cbiAgICAgICAgYCwgcGFyYW1zKTtcblxuICAgICAgICBjb25zdCB0b3RhbCA9IGNvdW50UmVzdWx0WzBdLnRvdGFsO1xuXG4gICAgICAgIC8vIERhdGEgcXVlcnlcbiAgICAgICAgY29uc3QgW3JlcXVlc3RzXSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihgXG4gICAgICAgICAgICBTRUxFQ1QgbHIuKiwgdS5maXJzdE5hbWUsIHUubGFzdE5hbWUsIHUuZW1haWwsIHUuam9iVGl0bGUsXG4gICAgICAgICAgICAgICAgICAgbS5maXJzdE5hbWUgYXMgbWFuYWdlckZpcnN0TmFtZSwgbS5sYXN0TmFtZSBhcyBtYW5hZ2VyTGFzdE5hbWVcbiAgICAgICAgICAgIEZST00gbGVhdmVfcmVxdWVzdHMgbHJcbiAgICAgICAgICAgIExFRlQgSk9JTiB1c2VycyB1IE9OIGxyLnVpZCA9IHUuaWRcbiAgICAgICAgICAgIExFRlQgSk9JTiB1c2VycyBtIE9OIGxyLmFwcHJvdmVkX2J5ID0gbS5pZFxuICAgICAgICAgICAgJHt3aGVyZUNsYXVzZX1cbiAgICAgICAgICAgIE9SREVSIEJZIFxuICAgICAgICAgICAgICAgIENBU0UgbHIuc3RhdHVzIFdIRU4gJ3BlbmRpbmcnIFRIRU4gMSBXSEVOICdBcHByb3ZlZCcgVEhFTiAyIFdIRU4gJ1JlamVjdGVkJyBUSEVOIDMgRUxTRSA0IEVORCxcbiAgICAgICAgICAgICAgICBsci5jcmVhdGVkQXQgREVTQ1xuICAgICAgICAgICAgTElNSVQgPyBPRkZTRVQgP1xuICAgICAgICBgLCBbLi4ucGFyYW1zLCBsaW1pdCwgb2Zmc2V0XSk7XG5cbiAgICAgICAgY29uc3QgcGFnaW5hdGlvbkRhdGE6IFBhZ2luYXRpb25EYXRhID0ge1xuICAgICAgICAgICAgcGFnZSxcbiAgICAgICAgICAgIGxpbWl0LFxuICAgICAgICAgICAgdG90YWwsXG4gICAgICAgICAgICB0b3RhbFBhZ2VzOiBNYXRoLmNlaWwodG90YWwgLyBsaW1pdClcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPHsgcmVxdWVzdHM6IExlYXZlUmVxdWVzdFdpdGhVc2VyW10sIHBhZ2luYXRpb246IFBhZ2luYXRpb25EYXRhIH0+Pih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHJlcXVlc3RzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIHJlcXVlc3RzOiByZXF1ZXN0cyBhcyBMZWF2ZVJlcXVlc3RXaXRoVXNlcltdLFxuICAgICAgICAgICAgICAgIHBhZ2luYXRpb246IHBhZ2luYXRpb25EYXRhXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgYWxsIGxlYXZlIHJlcXVlc3RzIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHJldHJpZXZlIGxlYXZlIHJlcXVlc3RzJ1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG5cbi8vIFBPU1QgL2xlYXZlLWNhbGN1bGF0aW9uIC0gUHJldmlldyBsZWF2ZSBjYWxjdWxhdGlvblxuYXBwLnBvc3QoJy9sZWF2ZS1jYWxjdWxhdGlvbicsIGFzeW5jIChjOiBDb250ZXh0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBjLnJlcS5qc29uKCk7XG4gICAgICAgIGNvbnN0IHZhbGlkYXRlZERhdGE6IExlYXZlQ2FsY3VsYXRpb25EYXRhID0gbGVhdmVDYWxjdWxhdGlvblNjaGVtYS5wYXJzZShib2R5KTtcbiAgICAgICAgY29uc3QgeyBsZWF2ZV9zdGFydCwgbGVhdmVfZW5kLCBsZWF2ZV9sZW5ndGggfSA9IHZhbGlkYXRlZERhdGE7XG5cbiAgICAgICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUobGVhdmVfc3RhcnQpO1xuICAgICAgICBjb25zdCBlbmREYXRlID0gbmV3IERhdGUobGVhdmVfZW5kKTtcblxuICAgICAgICBpZiAoc3RhcnREYXRlID4gZW5kRGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdTdGFydCBkYXRlIGNhbm5vdCBiZSBhZnRlciBlbmQgZGF0ZSdcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbnVtRGF5cyA9IDA7XG4gICAgICAgIGxldCBleGNsdWRlZERldGFpbHM6IEV4Y2x1ZGVkRGF5c0RldGFpbHMgPSB7IHdlZWtlbmRzOiAwLCBob2xpZGF5czogW10sIHRvdGFsRXhjbHVkZWQ6IDAgfTtcbiAgICAgICAgbGV0IHdhcm5pbmdzOiBzdHJpbmdbXSA9IFtdO1xuXG4gICAgICAgIGlmIChsZWF2ZV9sZW5ndGggPT09IFwiRnVsbCBEYXlcIikge1xuICAgICAgICAgICAgbnVtRGF5cyA9IGF3YWl0IGNhbGN1bGF0ZVRvdGFsTGVhdmVEYXlzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgICAgICBleGNsdWRlZERldGFpbHMgPSBnZXRFeGNsdWRlZERheXNEZXRhaWxzKHN0YXJ0RGF0ZSwgZW5kRGF0ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBudW1EYXlzID0gMC41O1xuICAgICAgICAgICAgaWYgKGlzV2Vla2VuZChzdGFydERhdGUpKSB3YXJuaW5ncy5wdXNoKCdTZWxlY3RlZCBkYXRlIGZhbGxzIG9uIGEgd2Vla2VuZCcpO1xuXG4gICAgICAgICAgICBjb25zdCBhbGxIb2xpZGF5cyA9IGdldFNvdXRoQWZyaWNhblB1YmxpY0hvbGlkYXlzKHN0YXJ0RGF0ZS5nZXRGdWxsWWVhcigpKTtcbiAgICAgICAgICAgIGlmIChpc1B1YmxpY0hvbGlkYXkoc3RhcnREYXRlLCBhbGxIb2xpZGF5cykpIHdhcm5pbmdzLnB1c2goJ1NlbGVjdGVkIGRhdGUgaXMgYSBwdWJsaWMgaG9saWRheScpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVzdWx0OiBMZWF2ZUNhbGN1bGF0aW9uUmVzdWx0ID0ge1xuICAgICAgICAgICAgdG90YWxEYXlzOiBudW1EYXlzLFxuICAgICAgICAgICAgc3RhcnREYXRlOiBsZWF2ZV9zdGFydCxcbiAgICAgICAgICAgIGVuZERhdGU6IGxlYXZlX2VuZCxcbiAgICAgICAgICAgIGxlYXZlTGVuZ3RoOiBsZWF2ZV9sZW5ndGgsXG4gICAgICAgICAgICBleGNsdWRlZERheXM6IHtcbiAgICAgICAgICAgICAgICB3ZWVrZW5kczogZXhjbHVkZWREZXRhaWxzLndlZWtlbmRzLFxuICAgICAgICAgICAgICAgIHB1YmxpY0hvbGlkYXlzOiBleGNsdWRlZERldGFpbHMuaG9saWRheXMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIHRvdGFsRXhjbHVkZWQ6IGV4Y2x1ZGVkRGV0YWlscy50b3RhbEV4Y2x1ZGVkXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgd2FybmluZ3M6IHdhcm5pbmdzXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZTxMZWF2ZUNhbGN1bGF0aW9uUmVzdWx0Pj4oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSBjYWxjdWxhdGlvbiBjb21wbGV0ZWQnLFxuICAgICAgICAgICAgZGF0YTogcmVzdWx0XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdMZWF2ZSBjYWxjdWxhdGlvbiBlcnJvcjonLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygei5ab2RFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIHJlcXVlc3QgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gY2FsY3VsYXRlIGxlYXZlIGRheXMnXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxufSk7XG5cbi8vIEdFVCAvcHVibGljLWhvbGlkYXlzLzp5ZWFyIC0gR2V0IHB1YmxpYyBob2xpZGF5c1xuYXBwLmdldCgnL3B1YmxpYy1ob2xpZGF5cy86eWVhcicsIGFzeW5jIChjOiBDb250ZXh0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHllYXIgPSBwYXJzZUludChjLnJlcS5wYXJhbSgneWVhcicpKTtcblxuICAgICAgICBpZiAoaXNOYU4oeWVhcikgfHwgeWVhciA8IDIwMjAgfHwgeWVhciA+IDIwMzApIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnSW52YWxpZCB5ZWFyLiBQbGVhc2UgcHJvdmlkZSBhIHllYXIgYmV0d2VlbiAyMDIwIGFuZCAyMDMwJ1xuICAgICAgICAgICAgfSwgNDAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGhvbGlkYXlzID0gZ2V0U291dGhBZnJpY2FuUHVibGljSG9saWRheXMoeWVhcik7XG4gICAgICAgIGNvbnN0IGhvbGlkYXlOYW1lcyA9IFtcbiAgICAgICAgICAgIFwiTmV3IFllYXIncyBEYXlcIiwgXCJIdW1hbiBSaWdodHMgRGF5XCIsIFwiR29vZCBGcmlkYXlcIiwgXCJGYW1pbHkgRGF5XCIsXG4gICAgICAgICAgICBcIkZyZWVkb20gRGF5XCIsIFwiV29ya2VycycgRGF5XCIsIFwiWW91dGggRGF5XCIsIFwiTmF0aW9uYWwgV29tZW4ncyBEYXlcIixcbiAgICAgICAgICAgIFwiSGVyaXRhZ2UgRGF5XCIsIFwiRGF5IG9mIFJlY29uY2lsaWF0aW9uXCIsIFwiQ2hyaXN0bWFzIERheVwiLCBcIkRheSBvZiBHb29kd2lsbFwiXG4gICAgICAgIF07XG5cbiAgICAgICAgY29uc3QgaG9saWRheXNXaXRoTmFtZXM6IFB1YmxpY0hvbGlkYXlbXSA9IGhvbGlkYXlzLm1hcCgoaG9saWRheSwgaW5kZXgpID0+ICh7XG4gICAgICAgICAgICBkYXRlOiBob2xpZGF5LnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSxcbiAgICAgICAgICAgIG5hbWU6IGhvbGlkYXlOYW1lc1tpbmRleF0gfHwgJ1B1YmxpYyBIb2xpZGF5JyxcbiAgICAgICAgICAgIGRheU9mV2VlazogaG9saWRheS50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLVVTJywgeyB3ZWVrZGF5OiAnbG9uZycgfSlcbiAgICAgICAgfSkpLnNvcnQoKGEsIGIpID0+IG5ldyBEYXRlKGEuZGF0ZSkuZ2V0VGltZSgpIC0gbmV3IERhdGUoYi5kYXRlKS5nZXRUaW1lKCkpO1xuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U8eyB5ZWFyOiBudW1iZXI7IGhvbGlkYXlzOiBQdWJsaWNIb2xpZGF5W107IHRvdGFsOiBudW1iZXIgfT4+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiBgUHVibGljIGhvbGlkYXlzIGZvciAke3llYXJ9YCxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICB5ZWFyOiB5ZWFyLFxuICAgICAgICAgICAgICAgIGhvbGlkYXlzOiBob2xpZGF5c1dpdGhOYW1lcyxcbiAgICAgICAgICAgICAgICB0b3RhbDogaG9saWRheXNXaXRoTmFtZXMubGVuZ3RoXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgcHVibGljIGhvbGlkYXlzIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIHJldHJpZXZlIHB1YmxpYyBob2xpZGF5cydcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG59KTtcblxuLy8gUE9TVCAvbGVhdmUvOmlkL3VwbG9hZC1kb2N1bWVudCAtIFVwbG9hZCBkb2N1bWVudFxuYXBwLnBvc3QoJy9sZWF2ZS86aWQvdXBsb2FkLWRvY3VtZW50JywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGNvbm5lY3Rpb246IG15c3FsLkNvbm5lY3Rpb24gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1aWQgPSBnZXRVc2VySWQoYyk7XG4gICAgICAgIGNvbnN0IGxlYXZlSWQgPSBjLnJlcS5wYXJhbSgnaWQnKTtcblxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgYy5yZXEuanNvbigpO1xuICAgICAgICBjb25zdCB2YWxpZGF0ZWREYXRhOiBGaWxlVXBsb2FkRGF0YSA9IGZpbGVVcGxvYWRTY2hlbWEucGFyc2UoYm9keSk7XG4gICAgICAgIGNvbnN0IHsgZmlsZV90eXBlLCBmaWxlX25hbWUsIGZpbGVfZGF0YSB9ID0gdmFsaWRhdGVkRGF0YTtcblxuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICAvLyBDaGVjayBpZiBsZWF2ZSByZXF1ZXN0IGV4aXN0cyBhbmQgYmVsb25ncyB0byB1c2VyXG4gICAgICAgIGNvbnN0IFtleGlzdGluZ0xlYXZlXSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihcbiAgICAgICAgICAgICdTRUxFQ1QgKiBGUk9NIGxlYXZlX3JlcXVlc3RzIFdIRVJFIGlkID0gPyBBTkQgdWlkID0gPycsXG4gICAgICAgICAgICBbbGVhdmVJZCwgdWlkXVxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghZXhpc3RpbmdMZWF2ZSB8fCBleGlzdGluZ0xlYXZlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSByZXF1ZXN0IG5vdCBmb3VuZCdcbiAgICAgICAgICAgIH0sIDQwNCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBVcGxvYWQgdG8gUzNcbiAgICAgICAgY29uc3QgczNLZXkgPSBhd2FpdCB1cGxvYWRUb1MzKGZpbGVfZGF0YSwgZmlsZV9uYW1lLCBmaWxlX3R5cGUsIHVpZC50b1N0cmluZygpLCBsZWF2ZUlkKTtcblxuICAgICAgICAvLyBVcGRhdGUgbGVhdmUgcmVxdWVzdCB3aXRoIGRvY3VtZW50IHBhdGhcbiAgICAgICAgY29uc3QgdXBkYXRlZEF0ID0gZm9ybWF0RGF0ZVRpbWUoKTtcbiAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5xdWVyeTxteXNxbC5SZXN1bHRTZXRIZWFkZXI+KFxuICAgICAgICAgICAgJ1VQREFURSBsZWF2ZV9yZXF1ZXN0cyBTRVQgZG9jdW1lbnQgPSA/LCB1cGRhdGVkQXQgPSA/IFdIRVJFIGlkID0gPyBBTkQgdWlkID0gPycsXG4gICAgICAgICAgICBbczNLZXksIHVwZGF0ZWRBdCwgbGVhdmVJZCwgdWlkXVxuICAgICAgICApO1xuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U8eyBkb2N1bWVudFBhdGg6IHN0cmluZzsgZmlsZU5hbWU6IHN0cmluZyB9Pj4oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdEb2N1bWVudCB1cGxvYWRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgZGF0YTogeyBkb2N1bWVudFBhdGg6IHMzS2V5LCBmaWxlTmFtZTogZmlsZV9uYW1lIH1cbiAgICAgICAgfSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VwbG9hZCBkb2N1bWVudCBlcnJvcjonLCBlcnJvcik7XG5cbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2Ygei5ab2RFcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdJbnZhbGlkIGZpbGUgZGF0YScsXG4gICAgICAgICAgICAgICAgZXJyb3JzOiBlcnJvci5lcnJvcnNcbiAgICAgICAgICAgIH0sIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gdXBsb2FkIGRvY3VtZW50J1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG4vLyBHRVQgL2xlYXZlLzppZCAtIEdldCBsZWF2ZSByZXF1ZXN0IGJ5IElEXG5hcHAuZ2V0KCcvbGVhdmUvOmlkJywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGNvbm5lY3Rpb246IG15c3FsLkNvbm5lY3Rpb24gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1aWQgPSBnZXRVc2VySWQoYyk7XG4gICAgICAgIGNvbnN0IGxlYXZlSWQgPSBjLnJlcS5wYXJhbSgnaWQnKTtcblxuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICBjb25zdCBbbGVhdmVSZXF1ZXN0XSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihgXG4gICAgICAgICAgICBTRUxFQ1QgbHIuKiwgdS5maXJzdE5hbWUsIHUubGFzdE5hbWUsIHUuZW1haWwsXG4gICAgICAgICAgICAgICAgICAgbS5maXJzdE5hbWUgYXMgbWFuYWdlckZpcnN0TmFtZSwgbS5sYXN0TmFtZSBhcyBtYW5hZ2VyTGFzdE5hbWVcbiAgICAgICAgICAgIEZST00gbGVhdmVfcmVxdWVzdHMgbHJcbiAgICAgICAgICAgIExFRlQgSk9JTiB1c2VycyB1IE9OIGxyLnVpZCA9IHUuaWRcbiAgICAgICAgICAgIExFRlQgSk9JTiB1c2VycyBtIE9OIGxyLmFwcHJvdmVkX2J5ID0gbS5pZFxuICAgICAgICAgICAgV0hFUkUgbHIuaWQgPSA/IEFORCBsci51aWQgPSA/XG4gICAgICAgIGAsIFtsZWF2ZUlkLCB1aWRdKTtcblxuICAgICAgICBpZiAoIWxlYXZlUmVxdWVzdCB8fCBsZWF2ZVJlcXVlc3QubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHJlcXVlc3Qgbm90IGZvdW5kJ1xuICAgICAgICAgICAgfSwgNDA0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGxlYXZlID0gbGVhdmVSZXF1ZXN0WzBdIGFzIExlYXZlUmVxdWVzdFdpdGhVc2VyO1xuXG4gICAgICAgIC8vIEdlbmVyYXRlIHNpZ25lZCBVUkwgZm9yIGRvY3VtZW50IGlmIGV4aXN0c1xuICAgICAgICBsZXQgZG9jdW1lbnRVcmw6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICAgICAgICBpZiAobGVhdmUuZG9jdW1lbnQgJiYgbGVhdmUuZG9jdW1lbnQgIT09ICdubyBzdXBwb3J0aW5nIGRvY3VtZW50Jykge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudFVybCA9IGF3YWl0IGdldFNpZ25lZFVybEZyb21TMyhsZWF2ZS5kb2N1bWVudCk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGdlbmVyYXRpbmcgZG9jdW1lbnQgVVJMOicsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IHtcbiAgICAgICAgICAgIC4uLmxlYXZlLFxuICAgICAgICAgICAgZG9jdW1lbnRVcmw6IGRvY3VtZW50VXJsLFxuICAgICAgICAgICAgYXBwbGljYW50OiB7XG4gICAgICAgICAgICAgICAgbmFtZTogYCR7bGVhdmUuZmlyc3ROYW1lfSAke2xlYXZlLmxhc3ROYW1lfWAsXG4gICAgICAgICAgICAgICAgZW1haWw6IGxlYXZlLmVtYWlsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYXBwcm92ZXI6IGxlYXZlLm1hbmFnZXJGaXJzdE5hbWUgPyB7XG4gICAgICAgICAgICAgICAgbmFtZTogYCR7bGVhdmUubWFuYWdlckZpcnN0TmFtZX0gJHtsZWF2ZS5tYW5hZ2VyTGFzdE5hbWV9YFxuICAgICAgICAgICAgfSA6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPHR5cGVvZiByZXNwb25zZURhdGE+Pih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHJlcXVlc3QgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgICAgICBkYXRhOiByZXNwb25zZURhdGFcbiAgICAgICAgfSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBsZWF2ZSBieSBJRCBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byByZXRyaWV2ZSBsZWF2ZSByZXF1ZXN0J1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG4vLyBERUxFVEUgL2xlYXZlLzppZCAtIERlbGV0ZSBsZWF2ZSByZXF1ZXN0XG5hcHAuZGVsZXRlKCcvbGVhdmUvOmlkJywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgbGV0IGNvbm5lY3Rpb246IG15c3FsLkNvbm5lY3Rpb24gfCBudWxsID0gbnVsbDtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1aWQgPSBnZXRVc2VySWQoYyk7XG4gICAgICAgIGNvbnN0IGxlYXZlSWQgPSBjLnJlcS5wYXJhbSgnaWQnKTtcblxuICAgICAgICBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICAvLyBDaGVjayBpZiBsZWF2ZSByZXF1ZXN0IGV4aXN0cyBhbmQgYmVsb25ncyB0byB1c2VyXG4gICAgICAgIGNvbnN0IFtleGlzdGluZ0xlYXZlXSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihcbiAgICAgICAgICAgICdTRUxFQ1QgKiBGUk9NIGxlYXZlX3JlcXVlc3RzIFdIRVJFIGlkID0gPyBBTkQgdWlkID0gPycsXG4gICAgICAgICAgICBbbGVhdmVJZCwgdWlkXVxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghZXhpc3RpbmdMZWF2ZSB8fCBleGlzdGluZ0xlYXZlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSByZXF1ZXN0IG5vdCBmb3VuZCdcbiAgICAgICAgICAgIH0sIDQwNCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBsZWF2ZSA9IGV4aXN0aW5nTGVhdmVbMF0gYXMgTGVhdmVSZXF1ZXN0O1xuXG4gICAgICAgIC8vIENoZWNrIGlmIGxlYXZlIGNhbiBiZSBkZWxldGVkIChvbmx5IHBlbmRpbmcgbGVhdmVzKVxuICAgICAgICBpZiAobGVhdmUuc3RhdHVzICE9PSAncGVuZGluZycpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U+KHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiAnQ2Fubm90IGRlbGV0ZSBsZWF2ZSByZXF1ZXN0IHRoYXQgaXMgbm90IHBlbmRpbmcnXG4gICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGVsZXRlIGFzc29jaWF0ZWQgZG9jdW1lbnQgZnJvbSBTMyBpZiBleGlzdHNcbiAgICAgICAgaWYgKGxlYXZlLmRvY3VtZW50ICYmIGxlYXZlLmRvY3VtZW50ICE9PSAnbm8gc3VwcG9ydGluZyBkb2N1bWVudCcpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgZGVsZXRlRnJvbVMzKGxlYXZlLmRvY3VtZW50KTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgZGVsZXRpbmcgZG9jdW1lbnQgZnJvbSBTMzonLCBlcnJvcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEZWxldGUgbGVhdmUgcmVxdWVzdFxuICAgICAgICBhd2FpdCBjb25uZWN0aW9uLnF1ZXJ5PG15c3FsLlJlc3VsdFNldEhlYWRlcj4oXG4gICAgICAgICAgICAnREVMRVRFIEZST00gbGVhdmVfcmVxdWVzdHMgV0hFUkUgaWQgPSA/IEFORCB1aWQgPSA/JyxcbiAgICAgICAgICAgIFtsZWF2ZUlkLCB1aWRdXG4gICAgICAgICk7XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSByZXF1ZXN0IGRlbGV0ZWQgc3VjY2Vzc2Z1bGx5J1xuICAgICAgICB9LCAyMDApO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRGVsZXRlIGxlYXZlIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbjxBcGlSZXNwb25zZT4oe1xuICAgICAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGRlbGV0ZSBsZWF2ZSByZXF1ZXN0J1xuICAgICAgICB9LCA1MDApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICAgIGlmIChjb25uZWN0aW9uKSBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG4vLyBHRVQgL2xlYXZlLWNhbGVuZGFyIC0gR2V0IGxlYXZlIGNhbGVuZGFyIHZpZXdcbmFwcC5nZXQoJy9sZWF2ZS1jYWxlbmRhcicsIGFzeW5jIChjOiBDb250ZXh0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgIGxldCBjb25uZWN0aW9uOiBteXNxbC5Db25uZWN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgY29uc3QgZmlyc3REYXkgPSBuZXcgRGF0ZShub3cuZ2V0RnVsbFllYXIoKSwgbm93LmdldE1vbnRoKCksIDEpO1xuICAgICAgICBjb25zdCBsYXN0RGF5ID0gbmV3IERhdGUobm93LmdldEZ1bGxZZWFyKCksIG5vdy5nZXRNb250aCgpICsgMSwgMCk7XG5cbiAgICAgICAgY29uc3QgcXVlcnlQYXJhbXM6IENhbGVuZGFyUXVlcnlQYXJhbXMgPSB7XG4gICAgICAgICAgICBzdGFydF9kYXRlOiBjLnJlcS5xdWVyeSgnc3RhcnRfZGF0ZScpIHx8IGZpcnN0RGF5LnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXSxcbiAgICAgICAgICAgIGVuZF9kYXRlOiBjLnJlcS5xdWVyeSgnZW5kX2RhdGUnKSB8fCBsYXN0RGF5LnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXVxuICAgICAgICB9O1xuXG4gICAgICAgIGxldCB3aGVyZUNsYXVzZSA9ICdXSEVSRSBsci5zdGFydF9kYXRlIDw9ID8gQU5EIGxyLmVuZF9kYXRlID49ID8gQU5EIGxyLnN0YXR1cyA9IFwiYXBwcm92ZWRcIic7XG4gICAgICAgIGNvbnN0IHF1ZXJ5UGFyYW1zQXJyYXk6IGFueVtdID0gW3F1ZXJ5UGFyYW1zLmVuZF9kYXRlLCBxdWVyeVBhcmFtcy5zdGFydF9kYXRlXTtcblxuICAgICAgICBjb25zdCBbbGVhdmVDYWxlbmRhcl0gPSBhd2FpdCBjb25uZWN0aW9uLnF1ZXJ5PG15c3FsLlJvd0RhdGFQYWNrZXRbXT4oYFxuICAgICAgICAgICAgU0VMRUNUIGxyLmlkLCBsci5zdGFydF9kYXRlLCBsci5lbmRfZGF0ZSwgbHIubGVhdmVfdHlwZSwgbHIubGVhdmVfbGVuZ3RoLCBsci5kdXJhdGlvbixcbiAgICAgICAgICAgICAgICAgICB1LmZpcnN0TmFtZSwgdS5sYXN0TmFtZSwgdS5lbWFpbCwgdS5qb2JUaXRsZSxcbiAgICAgICAgICAgICAgICAgICBtLmZpcnN0TmFtZSBhcyBtYW5hZ2VyRmlyc3ROYW1lLCBtLmxhc3ROYW1lIGFzIG1hbmFnZXJMYXN0TmFtZVxuICAgICAgICAgICAgRlJPTSBsZWF2ZV9yZXF1ZXN0cyBsclxuICAgICAgICAgICAgSk9JTiB1c2VycyB1IE9OIGxyLnVpZCA9IHUuaWRcbiAgICAgICAgICAgIExFRlQgSk9JTiB1c2VycyBtIE9OIGxyLmFwcHJvdmVkX2J5ID0gbS5pZFxuICAgICAgICAgICAgJHt3aGVyZUNsYXVzZX1cbiAgICAgICAgICAgIE9SREVSIEJZIGxyLnN0YXJ0X2RhdGUgQVNDXG4gICAgICAgIGAsIHF1ZXJ5UGFyYW1zQXJyYXkpO1xuXG4gICAgICAgIC8vIEdldCBwdWJsaWMgaG9saWRheXMgaW4gdGhlIHJhbmdlXG4gICAgICAgIGNvbnN0IHN0YXJ0WWVhciA9IG5ldyBEYXRlKHF1ZXJ5UGFyYW1zLnN0YXJ0X2RhdGUhKS5nZXRGdWxsWWVhcigpO1xuICAgICAgICBjb25zdCBlbmRZZWFyID0gbmV3IERhdGUocXVlcnlQYXJhbXMuZW5kX2RhdGUhKS5nZXRGdWxsWWVhcigpO1xuICAgICAgICBjb25zdCBwdWJsaWNIb2xpZGF5czogRGF0ZVtdID0gW107XG5cbiAgICAgICAgZm9yIChsZXQgeWVhciA9IHN0YXJ0WWVhcjsgeWVhciA8PSBlbmRZZWFyOyB5ZWFyKyspIHtcbiAgICAgICAgICAgIHB1YmxpY0hvbGlkYXlzLnB1c2goLi4uZ2V0U291dGhBZnJpY2FuUHVibGljSG9saWRheXMoeWVhcikpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaG9saWRheXNJblJhbmdlOiBQdWJsaWNIb2xpZGF5W10gPSBwdWJsaWNIb2xpZGF5cy5maWx0ZXIoaG9saWRheSA9PiB7XG4gICAgICAgICAgICBjb25zdCBob2xpZGF5U3RyID0gaG9saWRheS50b0lTT1N0cmluZygpLnNwbGl0KCdUJylbMF07XG4gICAgICAgICAgICByZXR1cm4gaG9saWRheVN0ciA+PSBxdWVyeVBhcmFtcy5zdGFydF9kYXRlISAmJiBob2xpZGF5U3RyIDw9IHF1ZXJ5UGFyYW1zLmVuZF9kYXRlITtcbiAgICAgICAgfSkubWFwKGhvbGlkYXkgPT4gKHtcbiAgICAgICAgICAgIGRhdGU6IGhvbGlkYXkudG9JU09TdHJpbmcoKS5zcGxpdCgnVCcpWzBdLFxuICAgICAgICAgICAgbmFtZTogJ1B1YmxpYyBIb2xpZGF5JyxcbiAgICAgICAgICAgIGRheU9mV2VlazogaG9saWRheS50b0xvY2FsZURhdGVTdHJpbmcoJ2VuLVVTJywgeyB3ZWVrZGF5OiAnbG9uZycgfSlcbiAgICAgICAgfSkpO1xuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U8e1xuICAgICAgICAgICAgZGF0ZVJhbmdlOiB7IHN0YXJ0RGF0ZTogc3RyaW5nOyBlbmREYXRlOiBzdHJpbmcgfTtcbiAgICAgICAgICAgIGxlYXZlUmVxdWVzdHM6IG15c3FsLlJvd0RhdGFQYWNrZXRbXTtcbiAgICAgICAgICAgIHB1YmxpY0hvbGlkYXlzOiBQdWJsaWNIb2xpZGF5W11cbiAgICAgICAgfT4+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnTGVhdmUgY2FsZW5kYXIgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgZGF0ZVJhbmdlOiB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZTogcXVlcnlQYXJhbXMuc3RhcnRfZGF0ZSEsXG4gICAgICAgICAgICAgICAgICAgIGVuZERhdGU6IHF1ZXJ5UGFyYW1zLmVuZF9kYXRlIVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbGVhdmVSZXF1ZXN0czogbGVhdmVDYWxlbmRhcixcbiAgICAgICAgICAgICAgICBwdWJsaWNIb2xpZGF5czogaG9saWRheXNJblJhbmdlXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgbGVhdmUgY2FsZW5kYXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmV0cmlldmUgbGVhdmUgY2FsZW5kYXInXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24pIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgfVxufSk7XG5cbi8vIEdFVCAvbGVhdmUtYmFsYW5jZSAtIEdldCBsZWF2ZSBiYWxhbmNlIChwbGFjZWhvbGRlcilcbmFwcC5nZXQoJy9sZWF2ZS1iYWxhbmNlJywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgY29uc3QgYmFsYW5jZURhdGE6IExlYXZlQmFsYW5jZURhdGEgPSB7XG4gICAgICAgICAgICBhbm51YWxfbGVhdmU6IDE1LFxuICAgICAgICAgICAgc2lja19sZWF2ZTogMTAsXG4gICAgICAgICAgICBwZXJzb25hbF9sZWF2ZTogNSxcbiAgICAgICAgICAgIHVzZWRfYW5udWFsOiAzLFxuICAgICAgICAgICAgdXNlZF9zaWNrOiAxLFxuICAgICAgICAgICAgdXNlZF9wZXJzb25hbDogMFxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U8TGVhdmVCYWxhbmNlRGF0YT4+KHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlOiAnTGVhdmUgYmFsYW5jZSByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5JyxcbiAgICAgICAgICAgIGRhdGE6IGJhbGFuY2VEYXRhXG4gICAgICAgIH0sIDIwMCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignR2V0IGxlYXZlIGJhbGFuY2UgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmV0cmlldmUgbGVhdmUgYmFsYW5jZSdcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9XG59KTtcblxuLy8gR0VUIC9sZWF2ZS1zdGF0cy9wZXJzb25hbCAtIEdldCBwZXJzb25hbCBsZWF2ZSBzdGF0aXN0aWNzXG5hcHAuZ2V0KCcvbGVhdmUtc3RhdHMvcGVyc29uYWwnLCBhc3luYyAoYzogQ29udGV4dCk6IFByb21pc2U8UmVzcG9uc2U+ID0+IHtcbiAgICBsZXQgY29ubmVjdGlvbjogbXlzcWwuQ29ubmVjdGlvbiB8IG51bGwgPSBudWxsO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHVpZCA9IGdldFVzZXJJZChjKTtcbiAgICAgICAgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgeWVhciA9IGMucmVxLnF1ZXJ5KCd5ZWFyJykgfHwgbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgY29uc3QgW3BlcnNvbmFsU3RhdHNdID0gYXdhaXQgY29ubmVjdGlvbi5xdWVyeTxteXNxbC5Sb3dEYXRhUGFja2V0W10+KGBcbiAgICAgICAgICAgIFNFTEVDVCBsZWF2ZV90eXBlLCBzdGF0dXMsIENPVU5UKCopIGFzIGNvdW50LCBTVU0oQ0FTVChkdXJhdGlvbiBBUyBERUNJTUFMKDUsMSkpKSBhcyB0b3RhbF9kYXlzXG4gICAgICAgICAgICBGUk9NIGxlYXZlX3JlcXVlc3RzIFxuICAgICAgICAgICAgV0hFUkUgdWlkID0gPyBBTkQgWUVBUihzdGFydF9kYXRlKSA9ID9cbiAgICAgICAgICAgIEdST1VQIEJZIGxlYXZlX3R5cGUsIHN0YXR1c1xuICAgICAgICAgICAgT1JERVIgQlkgbGVhdmVfdHlwZSwgc3RhdHVzXG4gICAgICAgIGAsIFt1aWQsIHllYXJdKTtcblxuICAgICAgICBjb25zdCBbdG90YWxVc2VkXSA9IGF3YWl0IGNvbm5lY3Rpb24ucXVlcnk8bXlzcWwuUm93RGF0YVBhY2tldFtdPihgXG4gICAgICAgICAgICBTRUxFQ1QgXG4gICAgICAgICAgICAgICAgU1VNKENBU0UgV0hFTiBzdGF0dXMgPSAnYXBwcm92ZWQnIFRIRU4gQ0FTVChkdXJhdGlvbiBBUyBERUNJTUFMKDUsMSkpIEVMU0UgMCBFTkQpIGFzIHRvdGFsX2FwcHJvdmVkX2RheXMsXG4gICAgICAgICAgICAgICAgQ09VTlQoQ0FTRSBXSEVOIHN0YXR1cyA9ICdwZW5kaW5nJyBUSEVOIDEgRU5EKSBhcyBwZW5kaW5nX3JlcXVlc3RzLFxuICAgICAgICAgICAgICAgIENPVU5UKENBU0UgV0hFTiBzdGF0dXMgPSAncmVqZWN0ZWQnIFRIRU4gMSBFTkQpIGFzIHJlamVjdGVkX3JlcXVlc3RzXG4gICAgICAgICAgICBGUk9NIGxlYXZlX3JlcXVlc3RzIFxuICAgICAgICAgICAgV0hFUkUgdWlkID0gPyBBTkQgWUVBUihzdGFydF9kYXRlKSA9ID9cbiAgICAgICAgYCwgW3VpZCwgeWVhcl0pO1xuXG4gICAgICAgIGNvbnN0IHN0YXRzRGF0YTogTGVhdmVTdGF0c0RhdGEgPSB7XG4gICAgICAgICAgICB5ZWFyOiB5ZWFyLFxuICAgICAgICAgICAgc3VtbWFyeToge1xuICAgICAgICAgICAgICAgIHRvdGFsQXBwcm92ZWREYXlzOiB0b3RhbFVzZWRbMF0udG90YWxfYXBwcm92ZWRfZGF5cyB8fCAwLFxuICAgICAgICAgICAgICAgIHBlbmRpbmdSZXF1ZXN0czogdG90YWxVc2VkWzBdLnBlbmRpbmdfcmVxdWVzdHMgfHwgMCxcbiAgICAgICAgICAgICAgICByZWplY3RlZFJlcXVlc3RzOiB0b3RhbFVzZWRbMF0ucmVqZWN0ZWRfcmVxdWVzdHMgfHwgMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxlYXZlVHlwZUJyZWFrZG93bjogcGVyc29uYWxTdGF0cyBhcyBBcnJheTx7XG4gICAgICAgICAgICAgICAgbGVhdmVfdHlwZTogc3RyaW5nO1xuICAgICAgICAgICAgICAgIHN0YXR1czogc3RyaW5nO1xuICAgICAgICAgICAgICAgIGNvdW50OiBudW1iZXI7XG4gICAgICAgICAgICAgICAgdG90YWxfZGF5czogbnVtYmVyO1xuICAgICAgICAgICAgfT5cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPExlYXZlU3RhdHNEYXRhPj4oe1xuICAgICAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdQZXJzb25hbCBsZWF2ZSBzdGF0aXN0aWNzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgZGF0YTogc3RhdHNEYXRhXG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgbGVhdmUgc3RhdHMgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmV0cmlldmUgbGVhdmUgc3RhdGlzdGljcydcbiAgICAgICAgfSwgNTAwKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBpZiAoY29ubmVjdGlvbikgYXdhaXQgY29ubmVjdGlvbi5lbmQoKTtcbiAgICB9XG59KTtcblxuLy8gR0VUIC9sZWF2ZS10eXBlcyAtIEdldCBhdmFpbGFibGUgbGVhdmUgdHlwZXNcbmFwcC5nZXQoJy9sZWF2ZS10eXBlcycsIGFzeW5jIChjOiBDb250ZXh0KTogUHJvbWlzZTxSZXNwb25zZT4gPT4ge1xuICAgIGxldCBjb25uZWN0aW9uOiBteXNxbC5Db25uZWN0aW9uIHwgbnVsbCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgICAgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgY29uc3QgW2xlYXZlVHlwZXNdID0gYXdhaXQgY29ubmVjdGlvbi5xdWVyeTxteXNxbC5Sb3dEYXRhUGFja2V0W10+KGBcbiAgICAgICAgICAgIFNFTEVDVCBsZWF2ZV90eXBlLCBDT1VOVCgqKSBhcyB0b3RhbF9yZXF1ZXN0cyxcbiAgICAgICAgICAgICAgICAgICBTVU0oQ0FTRSBXSEVOIHN0YXR1cyA9ICdhcHByb3ZlZCcgVEhFTiAxIEVMU0UgMCBFTkQpIGFzIGFwcHJvdmVkX2NvdW50LFxuICAgICAgICAgICAgICAgICAgIFNVTShDQVNFIFdIRU4gc3RhdHVzID0gJ3BlbmRpbmcnIFRIRU4gMSBFTFNFIDAgRU5EKSBhcyBwZW5kaW5nX2NvdW50LFxuICAgICAgICAgICAgICAgICAgIFNVTShDQVNFIFdIRU4gc3RhdHVzID0gJ3JlamVjdGVkJyBUSEVOIDEgRUxTRSAwIEVORCkgYXMgcmVqZWN0ZWRfY291bnRcbiAgICAgICAgICAgIEZST00gbGVhdmVfcmVxdWVzdHMgXG4gICAgICAgICAgICBXSEVSRSBZRUFSKHN0YXJ0X2RhdGUpID0gWUVBUihDVVJEQVRFKCkpXG4gICAgICAgICAgICBHUk9VUCBCWSBsZWF2ZV90eXBlXG4gICAgICAgICAgICBPUkRFUiBCWSB0b3RhbF9yZXF1ZXN0cyBERVNDXG4gICAgICAgIGApO1xuXG4gICAgICAgIHJldHVybiBjLmpzb248QXBpUmVzcG9uc2U8eyBsZWF2ZVR5cGVzOiBMZWF2ZVR5cGVTdGF0c1tdOyBjdXJyZW50WWVhcjogbnVtYmVyIH0+Pih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ0xlYXZlIHR5cGVzIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIGxlYXZlVHlwZXM6IGxlYXZlVHlwZXMgYXMgTGVhdmVUeXBlU3RhdHNbXSxcbiAgICAgICAgICAgICAgICBjdXJyZW50WWVhcjogbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIDIwMCk7XG5cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKCdHZXQgbGVhdmUgdHlwZXMgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICByZXR1cm4gYy5qc29uPEFwaVJlc3BvbnNlPih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdGYWlsZWQgdG8gcmV0cmlldmUgbGVhdmUgdHlwZXMnXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24pIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgfVxufSk7XG5cbmV4cG9ydCB7IGFwcCBhcyBsZWF2ZSB9OyJdfQ==