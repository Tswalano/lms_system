import { Hono } from 'hono';
import { Context } from 'hono';
import * as mysql from 'mysql2/promise';
import { DatabaseService } from '../helpers/databaseHeler';
import { getUserId } from '../middleware/auth';

// Create new Hono app instance for notification routes
const notificationRoutes = new Hono();

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

interface NotificationRecord {
    id: string;
    recipientId: string;
    createdById?: string;
    type: string;
    category: string;
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
    imageUrl?: string;
    priority: string;
    isRead: boolean;
    isArchived: boolean;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    relatedId?: string;
    relatedType?: string;
    metadata?: string;
    expiresAt?: Date;
}

interface NotificationWithCreator extends NotificationRecord {
    creatorFirstName?: string;
    creatorLastName?: string;
}

interface CategoryBreakdown {
    category: string;
    count: number;
}

interface NotificationSettings {
    id: string;
    userId: string;
    emailEnabled: boolean;
    emailLeaveRequests: boolean;
    emailDocuments: boolean;
    emailPerformanceReviews: boolean;
    emailSystemUpdates: boolean;
    emailMarketing: boolean;
    inAppEnabled: boolean;
    inAppLeaveRequests: boolean;
    inAppDocuments: boolean;
    inAppPerformanceReviews: boolean;
    inAppSystemUpdates: boolean;
    pushEnabled: boolean;
    pushLeaveRequests: boolean;
    pushDocuments: boolean;
    pushPerformanceReviews: boolean;
    pushSystemUpdates: boolean;
    digestFrequency: string;
    quietHoursStart?: string;
    quietHoursEnd?: string;
    timezone?: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * GET /notifications
 * Retrieve notifications for the authenticated user with filtering and pagination
 */
notificationRoutes.get('/', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        // Parse query parameters
        const page = Math.max(1, parseInt(c.req.query('page') || '1'));
        const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
        const offset = (page - 1) * limit;

        const category = c.req.query('category');
        const type = c.req.query('type');
        const priority = c.req.query('priority');
        const isRead = c.req.query('isRead');
        const isArchived = c.req.query('isArchived') !== 'true' ? false : true;
        const startDate = c.req.query('startDate');
        const endDate = c.req.query('endDate');

        // Build where clause and parameters
        let whereClause = 'WHERE n.recipientId = ? AND n.isArchived = ?';
        const queryParams: any[] = [userId, isArchived];

        // Add optional filters
        if (category) {
            whereClause += ' AND n.category = ?';
            queryParams.push(category);
        }
        if (type) {
            whereClause += ' AND n.type = ?';
            queryParams.push(type);
        }
        if (priority) {
            whereClause += ' AND n.priority = ?';
            queryParams.push(priority);
        }
        if (isRead !== undefined) {
            whereClause += ' AND n.isRead = ?';
            queryParams.push(isRead === 'true');
        }

        // Date range filter
        if (startDate) {
            whereClause += ' AND n.createdAt >= ?';
            queryParams.push(new Date(startDate));
        }
        if (endDate) {
            whereClause += ' AND n.createdAt <= ?';
            queryParams.push(new Date(endDate));
        }

        // Get notifications with pagination
        const notificationsQuery = `
            SELECT 
                n.*,
                u.firstName as creatorFirstName,
                u.lastName as creatorLastName
            FROM notifications n
            LEFT JOIN users u ON n.createdById = u.id
            ${whereClause}
            ORDER BY 
                CASE n.priority 
                    WHEN 'urgent' THEN 4
                    WHEN 'high' THEN 3
                    WHEN 'normal' THEN 2
                    WHEN 'low' THEN 1
                    ELSE 0
                END DESC,
                n.createdAt DESC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM notifications n
            ${whereClause}
        `;

        const [notificationRows] = await connection.query<mysql.RowDataPacket[]>(
            notificationsQuery,
            [...queryParams, limit, offset]
        );

        const [countRows] = await connection.query<mysql.RowDataPacket[]>(
            countQuery,
            queryParams
        );

        const totalCount = countRows[0].total;
        const totalPages = Math.ceil(totalCount / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        // Format notifications
        const notifications = (notificationRows as NotificationWithCreator[]).map(notification => ({
            id: notification.id,
            type: notification.type,
            category: notification.category,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
            imageUrl: notification.imageUrl,
            priority: notification.priority,
            isRead: notification.isRead,
            isArchived: notification.isArchived,
            readAt: notification.readAt,
            createdAt: notification.createdAt,
            relatedId: notification.relatedId,
            relatedType: notification.relatedType,
            createdBy: notification.creatorFirstName || notification.creatorLastName ? {
                name: `${notification.creatorFirstName || ''} ${notification.creatorLastName || ''}`.trim()
            } : null,
            metadata: notification.metadata ? JSON.parse(notification.metadata) : null
        }));

        return c.json<ApiResponse>({
            success: true,
            message: 'Notifications retrieved successfully',
            data: {
                notifications,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCount,
                    limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        }, 200);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to fetch notifications'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /notifications/counts
 * Get notification counts and summary for the authenticated user
 */
notificationRoutes.get('/counts', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        // Get various counts in a single query for efficiency
        const countsQuery = `
            SELECT 
                COUNT(*) as totalUnread,
                SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgentUnread,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as highPriorityUnread
            FROM notifications 
            WHERE recipientId = ? AND isRead = false AND isArchived = false
        `;

        const categoryQuery = `
            SELECT category, COUNT(*) as count
            FROM notifications 
            WHERE recipientId = ? AND isRead = false AND isArchived = false
            GROUP BY category
        `;

        const recentQuery = `
            SELECT COUNT(*) as recentCount
            FROM notifications 
            WHERE recipientId = ? AND isArchived = false
            AND createdAt >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        `;

        const [countsRows] = await connection.query<mysql.RowDataPacket[]>(countsQuery, [userId]);
        const [categoryRows] = await connection.query<mysql.RowDataPacket[]>(categoryQuery, [userId]);
        const [recentRows] = await connection.query<mysql.RowDataPacket[]>(recentQuery, [userId]);

        const counts = countsRows[0];
        const totalUnread = counts.totalUnread || 0;
        const urgentUnread = counts.urgentUnread || 0;
        const highPriorityUnread = counts.highPriorityUnread || 0;
        const recentCount = recentRows[0].recentCount || 0;

        // Format category breakdown
        const categories = (categoryRows as CategoryBreakdown[]).reduce((acc: Record<string, number>, item) => {
            acc[item.category] = item.count;
            return acc;
        }, {} as Record<string, number>);

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification counts retrieved successfully',
            data: {
                totalUnread,
                urgentUnread,
                highPriorityUnread,
                recentCount,
                categoryBreakdown: categories,
                summary: {
                    hasUrgent: urgentUnread > 0,
                    hasHighPriority: highPriorityUnread > 0,
                    hasUnread: totalUnread > 0
                }
            }
        }, 200);

    } catch (error) {
        console.error('Error fetching notification counts:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to fetch notification counts'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /notifications/:id
 * Get a specific notification (only if it belongs to the authenticated user)
 */
notificationRoutes.get('/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        const [rows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                n.*,
                u.firstName as creatorFirstName,
                u.lastName as creatorLastName
            FROM notifications n
            LEFT JOIN users u ON n.createdById = u.id
            WHERE n.id = ? AND n.recipientId = ?
        `, [notificationId, userId]);

        if (rows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        const notification = rows[0] as NotificationWithCreator;

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification retrieved successfully',
            data: {
                id: notification.id,
                type: notification.type,
                category: notification.category,
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
                actionText: notification.actionText,
                imageUrl: notification.imageUrl,
                priority: notification.priority,
                isRead: notification.isRead,
                isArchived: notification.isArchived,
                readAt: notification.readAt,
                createdAt: notification.createdAt,
                updatedAt: notification.updatedAt,
                relatedId: notification.relatedId,
                relatedType: notification.relatedType,
                createdBy: notification.creatorFirstName || notification.creatorLastName ? {
                    name: `${notification.creatorFirstName || ''} ${notification.creatorLastName || ''}`.trim()
                } : null,
                metadata: notification.metadata ? JSON.parse(notification.metadata) : null
            }
        }, 200);

    } catch (error) {
        console.error('Error fetching notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to fetch notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read (only if it belongs to the authenticated user)
 */
notificationRoutes.patch('/:id/read', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        // First verify the notification belongs to this user
        const [checkRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM notifications WHERE id = ? AND recipientId = ?
        `, [notificationId, userId]);

        if (checkRows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        // Update the notification
        const [result] = await connection.query<mysql.ResultSetHeader>(`
            UPDATE notifications 
            SET isRead = true, readAt = NOW(), updatedAt = NOW()
            WHERE id = ?
        `, [notificationId]);

        if (result.affectedRows === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Failed to update notification'
            }, 400);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification marked as read',
            data: {
                id: notificationId,
                isRead: true,
                readAt: new Date()
            }
        }, 200);

    } catch (error) {
        console.error('Error marking notification as read:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to mark notification as read'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/:id/unread
 * Mark a notification as unread (only if it belongs to the authenticated user)
 */
notificationRoutes.patch('/:id/unread', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        // First verify the notification belongs to this user
        const [checkRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM notifications WHERE id = ? AND recipientId = ?
        `, [notificationId, userId]);

        if (checkRows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        // Update the notification
        const [result] = await connection.query<mysql.ResultSetHeader>(`
            UPDATE notifications 
            SET isRead = false, readAt = NULL, updatedAt = NOW()
            WHERE id = ?
        `, [notificationId]);

        if (result.affectedRows === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Failed to update notification'
            }, 400);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification marked as unread',
            data: {
                id: notificationId,
                isRead: false,
                readAt: null
            }
        }, 200);

    } catch (error) {
        console.error('Error marking notification as unread:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to mark notification as unread'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/mark-all-read
 * Mark all unread notifications as read for the authenticated user
 */
notificationRoutes.patch('/mark-all-read', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        const [result] = await connection.query<mysql.ResultSetHeader>(`
            UPDATE notifications 
            SET isRead = true, readAt = NOW(), updatedAt = NOW()
            WHERE recipientId = ? AND isRead = false AND isArchived = false
        `, [userId]);

        return c.json<ApiResponse>({
            success: true,
            message: `Marked ${result.affectedRows} notifications as read`,
            data: {
                updatedCount: result.affectedRows
            }
        }, 200);

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to mark all notifications as read'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/:id/archive
 * Archive a notification (only if it belongs to the authenticated user)
 */
notificationRoutes.patch('/:id/archive', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        // First verify the notification belongs to this user
        const [checkRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM notifications WHERE id = ? AND recipientId = ?
        `, [notificationId, userId]);

        if (checkRows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        // Update the notification
        const [result] = await connection.query<mysql.ResultSetHeader>(`
            UPDATE notifications 
            SET isArchived = true, updatedAt = NOW()
            WHERE id = ?
        `, [notificationId]);

        if (result.affectedRows === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Failed to archive notification'
            }, 400);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification archived',
            data: {
                id: notificationId,
                isArchived: true
            }
        }, 200);

    } catch (error) {
        console.error('Error archiving notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to archive notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/:id/unarchive
 * Unarchive a notification (only if it belongs to the authenticated user)
 */
notificationRoutes.patch('/:id/unarchive', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        // First verify the notification belongs to this user
        const [checkRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM notifications WHERE id = ? AND recipientId = ?
        `, [notificationId, userId]);

        if (checkRows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        // Update the notification
        const [result] = await connection.query<mysql.ResultSetHeader>(`
            UPDATE notifications 
            SET isArchived = false, updatedAt = NOW()
            WHERE id = ?
        `, [notificationId]);

        if (result.affectedRows === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Failed to unarchive notification'
            }, 400);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification unarchived',
            data: {
                id: notificationId,
                isArchived: false
            }
        }, 200);

    } catch (error) {
        console.error('Error unarchiving notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to unarchive notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * DELETE /notifications/:id
 * Permanently delete a notification (only if it belongs to the authenticated user)
 */
notificationRoutes.delete('/:id', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const notificationId = c.req.param('id');
        connection = await DatabaseService.createConnection();

        if (!notificationId) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification ID is required'
            }, 400);
        }

        // First verify the notification belongs to this user
        const [checkRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM notifications WHERE id = ? AND recipientId = ?
        `, [notificationId, userId]);

        if (checkRows.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Notification not found or access denied'
            }, 404);
        }

        // Delete the notification
        const [result] = await connection.query<mysql.ResultSetHeader>(`
            DELETE FROM notifications WHERE id = ?
        `, [notificationId]);

        if (result.affectedRows === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Failed to delete notification'
            }, 400);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification deleted permanently'
        }, 200);

    } catch (error) {
        console.error('Error deleting notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to delete notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /notifications/settings
 * Get notification settings for the authenticated user
 */
notificationRoutes.get('/settings', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT * FROM user_notification_settings WHERE userId = ?
        `, [userId]);

        let settings: NotificationSettings;

        // Create default settings if they don't exist
        if (rows.length === 0) {
            const defaultSettings = {
                id: `uns_${Date.now()}_${userId}`,
                userId,
                emailEnabled: true,
                emailLeaveRequests: true,
                emailDocuments: true,
                emailPerformanceReviews: true,
                emailSystemUpdates: true,
                emailMarketing: false,
                inAppEnabled: true,
                inAppLeaveRequests: true,
                inAppDocuments: true,
                inAppPerformanceReviews: true,
                inAppSystemUpdates: true,
                pushEnabled: false,
                pushLeaveRequests: false,
                pushDocuments: false,
                pushPerformanceReviews: false,
                pushSystemUpdates: false,
                digestFrequency: 'daily',
                quietHoursStart: '22:00',
                quietHoursEnd: '08:00',
                timezone: 'UTC'
            };

            await connection.query(`
                INSERT INTO user_notification_settings SET ?
            `, [defaultSettings]);

            settings = { ...defaultSettings, createdAt: new Date(), updatedAt: new Date() };
        } else {
            settings = rows[0] as NotificationSettings;
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification settings retrieved successfully',
            data: {
                emailEnabled: settings.emailEnabled,
                emailLeaveRequests: settings.emailLeaveRequests,
                emailDocuments: settings.emailDocuments,
                emailPerformanceReviews: settings.emailPerformanceReviews,
                emailSystemUpdates: settings.emailSystemUpdates,
                emailMarketing: settings.emailMarketing,
                inAppEnabled: settings.inAppEnabled,
                inAppLeaveRequests: settings.inAppLeaveRequests,
                inAppDocuments: settings.inAppDocuments,
                inAppPerformanceReviews: settings.inAppPerformanceReviews,
                inAppSystemUpdates: settings.inAppSystemUpdates,
                pushEnabled: settings.pushEnabled,
                pushLeaveRequests: settings.pushLeaveRequests,
                pushDocuments: settings.pushDocuments,
                pushPerformanceReviews: settings.pushPerformanceReviews,
                pushSystemUpdates: settings.pushSystemUpdates,
                digestFrequency: settings.digestFrequency,
                quietHoursStart: settings.quietHoursStart,
                quietHoursEnd: settings.quietHoursEnd,
                timezone: settings.timezone
            }
        }, 200);

    } catch (error) {
        console.error('Error fetching notification settings:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to fetch notification settings'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * PATCH /notifications/settings
 * Update notification settings for the authenticated user
 */
notificationRoutes.patch('/settings', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const body = await c.req.json();
        connection = await DatabaseService.createConnection();

        // Validate settings fields
        const allowedFields = [
            'emailEnabled', 'emailLeaveRequests', 'emailDocuments', 'emailPerformanceReviews',
            'emailSystemUpdates', 'emailMarketing', 'inAppEnabled', 'inAppLeaveRequests',
            'inAppDocuments', 'inAppPerformanceReviews', 'inAppSystemUpdates', 'pushEnabled',
            'pushLeaveRequests', 'pushDocuments', 'pushPerformanceReviews', 'pushSystemUpdates',
            'digestFrequency', 'quietHoursStart', 'quietHoursEnd', 'timezone'
        ];

        const updateData: any = { updatedAt: new Date() };

        // Only include allowed fields that were provided
        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        // Validate digest frequency if provided
        if (updateData.digestFrequency) {
            const validFrequencies = ['never', 'daily', 'weekly', 'monthly'];
            if (!validFrequencies.includes(updateData.digestFrequency)) {
                return c.json<ApiResponse>({
                    success: false,
                    message: `Invalid digest frequency. Must be one of: ${validFrequencies.join(', ')}`
                }, 400);
            }
        }

        // Validate time format for quiet hours
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (updateData.quietHoursStart && !timeRegex.test(updateData.quietHoursStart)) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid quiet hours start time format. Use HH:MM format'
            }, 400);
        }

        if (updateData.quietHoursEnd && !timeRegex.test(updateData.quietHoursEnd)) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Invalid quiet hours end time format. Use HH:MM format'
            }, 400);
        }

        // Check if settings exist
        const [existingRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM user_notification_settings WHERE userId = ?
        `, [userId]);

        if (existingRows.length === 0) {
            // Create new settings
            const newSettings = {
                id: `uns_${Date.now()}_${userId}`,
                userId,
                ...updateData
            };

            await connection.query(`
                INSERT INTO user_notification_settings SET ?
            `, [newSettings]);
        } else {
            // Update existing settings
            const setClause = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updateData);

            await connection.query(`
                UPDATE user_notification_settings 
                SET ${setClause}
                WHERE userId = ?
            `, [...values, userId]);
        }

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification settings updated successfully',
            data: updateData
        }, 200);

    } catch (error) {
        console.error('Error updating notification settings:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to update notification settings'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * POST /notifications/send
 * Send a custom notification (admin/manager functionality)
 */
notificationRoutes.post('/send', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const senderId = getUserId(c);
        const body = await c.req.json();
        connection = await DatabaseService.createConnection();

        // Validate required fields
        const { recipientId, type, category, title, message, priority } = body;

        if (!recipientId || !type || !category || !title || !message) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Missing required fields: recipientId, type, category, title, message'
            }, 400);
        }

        // Validate enum values
        const validTypes = ['info', 'success', 'warning', 'error', 'action_required'];
        const validPriorities = ['low', 'normal', 'high', 'urgent'];

        if (!validTypes.includes(type)) {
            return c.json<ApiResponse>({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            }, 400);
        }

        if (priority && !validPriorities.includes(priority)) {
            return c.json<ApiResponse>({
                success: false,
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
            }, 400);
        }

        // Generate notification ID
        const notificationId = `not_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        // Prepare notification data
        const notificationData = {
            id: notificationId,
            recipientId,
            createdById: senderId,
            type,
            category,
            title,
            message,
            actionUrl: body.actionUrl || null,
            actionText: body.actionText || null,
            imageUrl: body.imageUrl || null,
            priority: priority || 'normal',
            relatedId: body.relatedId || null,
            relatedType: body.relatedType || null,
            metadata: body.metadata ? JSON.stringify(body.metadata) : null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isRead: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert notification
        await connection.query(`
            INSERT INTO notifications SET ?
        `, [notificationData]);

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification sent successfully',
            data: {
                id: notificationId,
                recipientId,
                title,
                type,
                priority: notificationData.priority
            }
        }, 201);

    } catch (error) {
        console.error('Error sending notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to send notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * POST /notifications/broadcast
 * Broadcast a notification to multiple users (admin functionality)
 */
notificationRoutes.post('/broadcast', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const senderId = getUserId(c);
        const body = await c.req.json();
        connection = await DatabaseService.createConnection();

        // Validate required fields
        const { recipientIds, type, category, title, message, priority } = body;

        if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
            return c.json<ApiResponse>({
                success: false,
                message: 'recipientIds must be a non-empty array'
            }, 400);
        }

        if (!type || !category || !title || !message) {
            return c.json<ApiResponse>({
                success: false,
                message: 'Missing required fields: type, category, title, message'
            }, 400);
        }

        // Validate enum values
        const validTypes = ['info', 'success', 'warning', 'error', 'action_required'];
        const validPriorities = ['low', 'normal', 'high', 'urgent'];

        if (!validTypes.includes(type)) {
            return c.json<ApiResponse>({
                success: false,
                message: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            }, 400);
        }

        if (priority && !validPriorities.includes(priority)) {
            return c.json<ApiResponse>({
                success: false,
                message: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
            }, 400);
        }

        // Prepare notifications for batch insert
        const notifications = recipientIds.map((recipientId: string, index: number) => ({
            id: `not_${Date.now()}_${index}_${Math.floor(Math.random() * 1000)}`,
            recipientId,
            createdById: senderId,
            type,
            category,
            title,
            message,
            actionUrl: body.actionUrl || null,
            actionText: body.actionText || null,
            imageUrl: body.imageUrl || null,
            priority: priority || 'normal',
            relatedId: body.relatedId || null,
            relatedType: body.relatedType || null,
            metadata: body.metadata ? JSON.stringify(body.metadata) : null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
            isRead: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        // Batch insert notifications
        if (notifications.length > 0) {
            const columns = Object.keys(notifications[0]);
            const placeholders = notifications.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
            const values = notifications.flatMap(notification => Object.values(notification));

            await connection.query(`
                INSERT INTO notifications (${columns.join(', ')}) 
                VALUES ${placeholders}
            `, values);
        }

        return c.json<ApiResponse>({
            success: true,
            message: `Broadcast notification sent to ${recipientIds.length} users`,
            data: {
                recipientCount: recipientIds.length,
                title,
                type,
                priority: priority || 'normal'
            }
        }, 201);

    } catch (error) {
        console.error('Error broadcasting notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to broadcast notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /notifications/categories
 * Get available notification categories
 */
notificationRoutes.get('/categories', async (c: Context): Promise<Response> => {
    try {
        const categories = [
            {
                id: 'leave_management',
                name: 'Leave Management',
                description: 'Leave requests, approvals, and related notifications'
            },
            {
                id: 'document_management',
                name: 'Document Management',
                description: 'Document assignments, signatures, and completions'
            },
            {
                id: 'performance_reviews',
                name: 'Performance Reviews',
                description: 'Performance review cycles and evaluations'
            },
            {
                id: 'system_updates',
                name: 'System Updates',
                description: 'System announcements and maintenance notifications'
            },
            {
                id: 'general',
                name: 'General',
                description: 'General notifications and announcements'
            }
        ];

        return c.json<ApiResponse>({
            success: true,
            message: 'Notification categories retrieved successfully',
            data: categories
        }, 200);

    } catch (error) {
        console.error('Error fetching notification categories:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to fetch notification categories'
        }, 500);
    }
});

/**
 * POST /notifications/test
 * Send a test notification (development/testing purposes)
 */
notificationRoutes.post('/test', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        // Generate test notification
        const testNotification = {
            id: `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            recipientId: userId,
            createdById: null,
            type: 'info',
            category: 'system_updates',
            title: 'Test Notification',
            message: 'This is a test notification to verify the notification system is working correctly.',
            actionUrl: '/notifications',
            actionText: 'View Notifications',
            imageUrl: null,
            priority: 'normal',
            relatedId: null,
            relatedType: null,
            metadata: JSON.stringify({ test: true, timestamp: new Date().toISOString() }),
            expiresAt: null,
            isRead: false,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Insert test notification
        await connection.query(`
            INSERT INTO notifications SET ?
        `, [testNotification]);

        return c.json<ApiResponse>({
            success: true,
            message: 'Test notification sent successfully',
            data: {
                id: testNotification.id,
                title: testNotification.title,
                message: testNotification.message
            }
        }, 201);

    } catch (error) {
        console.error('Error sending test notification:', error);
        return c.json<ApiResponse>({
            success: false,
            message: 'Failed to send test notification'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

export default notificationRoutes;