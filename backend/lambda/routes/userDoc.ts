import { Hono } from 'hono';
import {
    getDecodedToken,
    getUserEmail,
    getUserFirstName,
    getUserLastName,
    getUserRole,
    getUserOccupation,
    getCustomUserId,
    getCognitoSub
} from '../middleware/auth';
const { randomUUID } = require('crypto');
import { DatabaseService } from '../helpers/databaseHeler';
import { AdminCreateUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { RowDataPacket, OkPacket } from 'mysql2';

interface ApiResponse<T> {
    code: string;
    message: string;
    error: boolean;
    payload: T | null;
}

// Define interfaces for your database rows
interface DocumentRow extends RowDataPacket {
    id: number;
    name: string;
    file_url: string;
    content: string;
    category_id: number;
    category_name: string;
    category_color: string;
    status: string;
    due_date: Date;
    assigned_at: Date;
    completed_at: Date;
    version: string;
    is_mandatory: boolean;
    expiry_date: Date;
    current_status: string;
    has_been_viewed: boolean;
}

interface DocumentCategoryRow extends RowDataPacket {
    id: number;
    name: string;
    description: string;
    color: string;
    document_count: number;
}

interface UserStatsRow extends RowDataPacket {
    total_assigned: number;
    completed: number;
    pending: number;
    viewed: number;
    overdue: number;
    mandatory_pending: number;
    completion_percentage: number;
}

interface ActivityRow extends RowDataPacket {
    activity_type: string;
    document_name: string;
    category_name: string;
    activity_timestamp: Date;
    duration: number;
    signed_at: Date;
}

interface CompletionRecordRow extends RowDataPacket {
    document_id: number;
    document_name: string;
    category_name: string;
    version: string;
    is_mandatory: boolean;
    completed_at: Date;
    signed_at: Date;
    ip_address: string;
    total_time_spent: number;
}

const userDoc = new Hono();

class ResponseService {
    static success<T>(message: string, payload: T, statusCode: number = 200): ApiResponse<T> {
        return {
            code: "SUCCESS",
            message,
            error: false,
            payload
        };
    }

    static error(code: string, message: string, payload: any = null): ApiResponse<null> {
        return {
            code,
            message,
            error: true,
            payload
        };
    }
}

// Get user's assigned documents
userDoc.get('/documents/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const { category_id, status } = c.req.query();

        const connection = await DatabaseService.createConnection();

        try {
            let selectSql = `
                SELECT d.*, dc.name as category_name, dc.color as category_color,
                       uda.status, uda.due_date, uda.assigned_at, uda.completed_at,
                       dtm.version, dtm.is_mandatory, dtm.expiry_date,
                       CASE 
                           WHEN uda.due_date < NOW() AND uda.status != 'completed' THEN 'overdue'
                           ELSE uda.status 
                       END as current_status,
                       CASE 
                           WHEN dv.user_id IS NOT NULL THEN true
                           ELSE false
                       END as has_been_viewed
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                LEFT JOIN document_views dv ON d.id = dv.document_id AND dv.user_id = uda.user_id
                WHERE uda.user_id = ?
            `;

            const params = [userId];

            if (category_id) {
                selectSql += ` AND d.category_id = ?`;
                params.push(category_id);
            }

            if (status) {
                selectSql += ` AND uda.status = ?`;
                params.push(status);
            }

            selectSql += ` ORDER BY uda.due_date ASC, uda.assigned_at DESC`;

            const [rows] = await connection.execute<DocumentRow[]>(selectSql, params);

            const response = ResponseService.success(
                "User documents retrieved successfully",
                rows
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get user documents error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// Get specific document content for user
userDoc.get('/document-content/:documentId/:userId', async (c) => {
    try {
        const documentId = c.req.param('documentId');
        const userId = c.req.param('userId');

        const connection = await DatabaseService.createConnection();

        try {
            // Check if user is assigned this document or if it's publicly accessible
            const [accessCheck] = await connection.execute<DocumentRow[]>(`
                SELECT d.*, uda.status, uda.due_date,
                       dtm.version, dtm.is_mandatory
                FROM documents d
                LEFT JOIN user_document_assignments uda ON d.id = uda.document_id AND uda.user_id = ?
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                WHERE d.id = ? AND (uda.user_id IS NOT NULL OR dtm.is_mandatory = false)
            `, [userId, documentId]);

            if (accessCheck.length === 0) {
                const response = ResponseService.error(
                    "ACCESS_DENIED",
                    "User does not have access to this document"
                );
                return c.json(response, 403);
            }

            const document = accessCheck[0];

            // Update assignment status to viewed if it's pending
            if (document.status === 'pending') {
                await connection.execute<OkPacket>(`
                    UPDATE user_document_assignments 
                    SET status = 'viewed' 
                    WHERE user_id = ? AND document_id = ?
                `, [userId, documentId]);
            }

            // Track document view (requirement 9 - prevent acknowledgment without opening)
            const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
            const insertViewSql = `
                INSERT INTO document_views (user_id, document_id, ip_address, viewed_at)
                VALUES (?, ?, ?, NOW())
            `;

            await connection.execute<OkPacket>(insertViewSql, [userId, documentId, ipAddress]);

            const response = ResponseService.success(
                "Document content accessed successfully",
                {
                    document_id: documentId,
                    name: document.name,
                    file_url: document.file_url,
                    content: document.content,
                    category_id: document.category_id,
                    version: document.version,
                    is_mandatory: document.is_mandatory,
                    access_granted: true
                }
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get document content error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// Get document categories (User view - for filtering)
userDoc.get('/document-categories', async (c) => {
    try {
        const connection = await DatabaseService.createConnection();

        try {
            const selectSql = `
                SELECT dc.id, dc.name, dc.color,
                       COUNT(d.id) as document_count
                FROM document_categories dc
                LEFT JOIN documents d ON dc.id = d.category_id
                GROUP BY dc.id, dc.name, dc.color
                HAVING document_count > 0
                ORDER BY dc.name ASC
            `;

            const [rows] = await connection.execute<DocumentCategoryRow[]>(selectSql);

            const response = ResponseService.success(
                "Document categories retrieved successfully",
                rows
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get document categories error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// ============================================================================
// DOCUMENT PROGRESS & INTERACTION
// ============================================================================

// Track document reading progress
userDoc.post('/document-progress', async (c) => {
    try {
        const { user_id, document_id, progress_data, time_spent, duration, status } = await c.req.json();

        if (!user_id || !document_id) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "user_id and document_id are required"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            // Start transaction
            await connection.beginTransaction();

            // --- 1. Document Views ---
            const checkViewSql = `
                SELECT id, duration, progress_data 
                FROM document_views 
                WHERE user_id = ? AND document_id = ? 
                ORDER BY viewed_at DESC 
                LIMIT 1
            `;

            const [viewRows] = await connection.execute(checkViewSql, [user_id, document_id]) as [any[], any];

            if (viewRows.length === 0) {
                const insertViewSql = `
                    INSERT INTO document_views (user_id, document_id, viewed_at, duration, progress_data) 
                    VALUES (?, ?, NOW(), ?, ?)
                `;
                await connection.execute<OkPacket>(insertViewSql, [
                    user_id,
                    document_id,
                    duration || time_spent || 0,
                    JSON.stringify(progress_data || {})
                ]);
            } else {
                const existingView = viewRows[0];
                const currentDuration = existingView.duration || 0;
                const newDuration = Math.max(currentDuration, duration || time_spent || 0);

                const updateViewSql = `
                    UPDATE document_views 
                    SET duration = ?,
                        progress_data = ?,
                        viewed_at = NOW()
                    WHERE id = ?
                `;
                await connection.execute<OkPacket>(updateViewSql, [
                    newDuration,
                    JSON.stringify(progress_data || {}),
                    existingView.id
                ]);
            }

            // --- 2. User Document Assignments ---
            const updateAssignmentSql = `
                UPDATE user_document_assignments
                SET status = ?
                WHERE user_id = ? AND document_id = ?
            `;
            await connection.execute<OkPacket>(updateAssignmentSql, [
                status || 'viewed', // fallback if not provided
                user_id,
                document_id
            ]);

            // Commit transaction
            await connection.commit();

            const response = ResponseService.success(
                "Document progress and assignment status saved successfully",
                {
                    user_id,
                    document_id,
                    duration: duration || time_spent || 0,
                    progress_saved: true,
                    status: status || 'viewed'
                }
            );
            return c.json(response, 200);

        } catch (dbError) {
            // Rollback on error
            await connection.rollback();
            console.error('Transaction failed in document progress:', dbError);
            const response = ResponseService.error(
                "DATABASE_ERROR",
                "Failed to save document progress and status",
                dbError
            );
            return c.json(response, 500);
        } finally {
            await connection.end();
        }

    } catch (parseError) {
        console.error('Request parsing error in document progress:', parseError);
        const response = ResponseService.error(
            "INVALID_REQUEST",
            "Invalid request format",
            parseError
        );
        return c.json(response, 400);
    }
});


// ============================================================================
// DOCUMENT COMPLETION & ACKNOWLEDGMENT
// ============================================================================

// Submit document completion/acknowledgement
userDoc.post('/document-completion', async (c) => {
    try {
        const {
            user_id,
            document_id,
            acknowledgement_checked
        } = await c.req.json();

        if (!user_id || !document_id || !acknowledgement_checked) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "user_id, document_id, and acknowledgement_checked are required"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            const [viewCheck] = await connection.execute<RowDataPacket[]>(`
                SELECT id FROM document_views 
                WHERE user_id = ? AND document_id = ?
            `, [user_id, document_id]);

            if (viewCheck.length === 0) {
                const response = ResponseService.error(
                    "ACCESS_REQUIRED",
                    "Document must be viewed before completion"
                );
                return c.json(response, 400);
            }

            const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
            const userAgent = c.req.header('user-agent') || 'unknown';

            await connection.beginTransaction();

            try {
                // Record document signature/acknowledgement
                const signatureSql = `
                    INSERT INTO document_signatures 
                    (user_id, document_id, ip_address, user_agent)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE 
                    signed_at = NOW(), ip_address = VALUES(ip_address), user_agent = VALUES(user_agent)
                `;

                await connection.execute<OkPacket>(signatureSql, [
                    user_id, document_id, ipAddress, userAgent
                ]);

                // Update assignment status
                const updateAssignmentSql = `
                    UPDATE user_document_assignments 
                    SET status = 'signed', completed_at = NOW()
                    WHERE user_id = ? AND document_id = ?
                `;

                await connection.execute<OkPacket>(updateAssignmentSql, [user_id, document_id]);

                await connection.commit();

                const response = ResponseService.success(
                    "Document completed successfully",
                    {
                        user_id,
                        document_id,
                        completed_at: new Date().toISOString(),
                        acknowledgement_checked
                    }
                );
                return c.json(response, 200);

            } catch (error) {
                await connection.rollback();
                throw error;
            }

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Document completion error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// ============================================================================
// USER DASHBOARD & STATISTICS
// ============================================================================

// Get user's document statistics and dashboard data
userDoc.get('/document-stats/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');

        const connection = await DatabaseService.createConnection();

        try {
            // Overall user statistics
            const [userStats] = await connection.execute<UserStatsRow[]>(`
                SELECT 
                    COUNT(uda.id) as total_assigned,
                    COUNT(CASE WHEN uda.status = 'completed' THEN 1 END) as completed,
                    COUNT(CASE WHEN uda.status = 'pending' THEN 1 END) as pending,
                    COUNT(CASE WHEN uda.status = 'viewed' THEN 1 END) as viewed,
                    COUNT(CASE WHEN uda.due_date < NOW() AND uda.status != 'completed' THEN 1 END) as overdue,
                    COUNT(CASE WHEN dtm.is_mandatory = true AND uda.status != 'completed' THEN 1 END) as mandatory_pending,
                    ROUND(AVG(CASE WHEN uda.status = 'completed' THEN 100 ELSE 0 END), 2) as completion_percentage
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                WHERE uda.user_id = ?
            `, [userId]);

            // Recent activity
            const [recentActivity] = await connection.execute<DocumentRow[]>(`
                SELECT 
                    d.name as document_name,
                    dc.name as category_name,
                    uda.status,
                    uda.due_date,
                    uda.completed_at,
                    dtm.is_mandatory,
                    CASE 
                        WHEN uda.due_date < NOW() AND uda.status != 'completed' THEN 'overdue'
                        ELSE uda.status 
                    END as current_status
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                WHERE uda.user_id = ?
                ORDER BY uda.assigned_at DESC
                LIMIT 10
            `, [userId]);

            // Category breakdown
            const [categoryStats] = await connection.execute<RowDataPacket[]>(`
                SELECT 
                    dc.name as category_name,
                    dc.color,
                    COUNT(uda.id) as total_in_category,
                    COUNT(CASE WHEN uda.status = 'completed' THEN 1 END) as completed_in_category,
                    ROUND((COUNT(CASE WHEN uda.status = 'completed' THEN 1 END) / COUNT(uda.id)) * 100, 2) as category_completion_percentage
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                WHERE uda.user_id = ?
                GROUP BY dc.id, dc.name, dc.color
                ORDER BY dc.name ASC
            `, [userId]);

            const dashboardData = {
                overall_stats: userStats[0],
                recent_activity: recentActivity,
                category_breakdown: categoryStats
            };

            const response = ResponseService.success(
                "User document statistics retrieved successfully",
                dashboardData
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get user document stats error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// ============================================================================
// USER ACTIVITY & AUDIT
// ============================================================================

// Get user's document activity history
userDoc.get('/document-activity/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const { days = 30, document_id } = c.req.query();

        const connection = await DatabaseService.createConnection();

        try {
            let activitySql = `
                SELECT 
                    'view' as activity_type,
                    d.name as document_name,
                    dc.name as category_name,
                    dv.viewed_at as activity_timestamp,
                    dv.duration,
                    NULL as signed_at
                FROM document_views dv
                JOIN documents d ON dv.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                WHERE dv.user_id = ? AND dv.viewed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                
                UNION ALL
                
                SELECT 
                    'signature' as activity_type,
                    d.name as document_name,
                    dc.name as category_name,
                    ds.signed_at as activity_timestamp,
                    NULL as duration,
                    ds.signed_at
                FROM document_signatures ds
                JOIN documents d ON ds.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                WHERE ds.user_id = ? AND ds.signed_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            `;

            const params = [userId, days, userId, days];

            if (document_id) {
                activitySql = activitySql.replace(
                    /WHERE (\w+\.user_id = \? AND \w+\.\w+_at >= DATE_SUB\(NOW\(\), INTERVAL \? DAY\))/g,
                    'WHERE $1 AND d.id = ?'
                );
                params.push(document_id, document_id);
            }

            activitySql += ` ORDER BY activity_timestamp DESC LIMIT 100`;

            const [activityLog] = await connection.execute<ActivityRow[]>(activitySql, params);

            const response = ResponseService.success(
                "User document activity retrieved successfully",
                activityLog
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get user document activity error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// Get user's completion certificates/records
userDoc.get('/completion-records/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const { category_id } = c.req.query();

        const connection = await DatabaseService.createConnection();

        try {
            let recordsSql = `
                SELECT 
                    d.id as document_id,
                    d.name as document_name,
                    dc.name as category_name,
                    dtm.version,
                    dtm.is_mandatory,
                    uda.completed_at,
                    ds.signed_at,
                    ds.ip_address,
                    SUM(dv.duration) as total_time_spent
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                LEFT JOIN document_signatures ds ON d.id = ds.document_id AND ds.user_id = uda.user_id
                LEFT JOIN document_views dv ON d.id = dv.document_id AND dv.user_id = uda.user_id
                WHERE uda.user_id = ? AND uda.status = 'completed'
            `;

            const params = [userId];

            if (category_id) {
                recordsSql += ` AND d.category_id = ?`;
                params.push(category_id);
            }

            recordsSql += `
                GROUP BY d.id, uda.completed_at, ds.signed_at, ds.ip_address
                ORDER BY uda.completed_at DESC
            `;

            const [completionRecords] = await connection.execute<CompletionRecordRow[]>(recordsSql, params);

            const response = ResponseService.success(
                "User completion records retrieved successfully",
                completionRecords
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get user completion records error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// ============================================================================
// SEARCH & FILTERING
// ============================================================================

// Search documents for user
userDoc.get('/search-documents/:userId', async (c) => {
    try {
        const userId = c.req.param('userId');
        const { q, category_id, status, is_mandatory } = c.req.query();

        if (!q || q.trim().length < 2) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "Search query must be at least 2 characters long"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            let searchSql = `
                SELECT d.*, dc.name as category_name, dc.color as category_color,
                       uda.status, uda.due_date, uda.assigned_at, uda.completed_at,
                       dtm.version, dtm.is_mandatory, dtm.expiry_date,
                       CASE 
                           WHEN uda.due_date < NOW() AND uda.status != 'completed' THEN 'overdue'
                           ELSE uda.status 
                       END as current_status
                FROM user_document_assignments uda
                JOIN documents d ON uda.document_id = d.id
                JOIN document_categories dc ON d.category_id = dc.id
                LEFT JOIN document_training_metadata dtm ON d.id = dtm.document_id
                WHERE uda.user_id = ? 
                AND (d.name LIKE ? OR d.content LIKE ? OR dc.name LIKE ?)
            `;

            const searchTerm = `%${q.trim()}%`;
            const params = [userId, searchTerm, searchTerm, searchTerm];

            if (category_id) {
                searchSql += ` AND d.category_id = ?`;
                params.push(category_id);
            }

            if (status) {
                searchSql += ` AND uda.status = ?`;
                params.push(status);
            }

            if (is_mandatory !== undefined) {
                searchSql += ` AND dtm.is_mandatory = ?`;
                params.push(is_mandatory);
            }

            searchSql += ` ORDER BY 
                CASE WHEN d.name LIKE ? THEN 1 ELSE 2 END,
                uda.due_date ASC 
                LIMIT 50
            `;
            params.push(searchTerm);

            const [searchResults] = await connection.execute<DocumentRow[]>(searchSql, params);

            const response = ResponseService.success(
                "Document search completed successfully",
                {
                    query: q,
                    total_results: searchResults.length,
                    results: searchResults
                }
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Search documents error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// GET All documents in each category (with relevant fields)
userDoc.get('/categories-with-documents', async (c) => {

    const userId = c.req.param('userId');

    try {
        const connection = await DatabaseService.createConnection();

        try {
            const selectSql = `
                SELECT 
                dc.id AS category_id,
                dc.name AS category_name,
                dc.color AS category_color,
                d.id AS document_id,
                d.name AS document_name,
                d.file_url,
                d.file_size,
                d.priority,
                d.createdAt AS document_created_at
                FROM document_categories dc
                INNER JOIN documents d ON dc.id = d.category_id
                ORDER BY dc.name ASC, d.name ASC
            `;

            const [rows] = await connection.execute<any[]>(selectSql);

            // Group documents under their categories
            const grouped = rows.reduce((acc, row) => {
                const {
                    category_id,
                    category_name,
                    category_description,
                    category_color,
                    document_id,
                    document_name,
                    file_url,
                    file_size,
                    priority,
                    document_created_at
                } = row;

                if (!acc[category_id]) {
                    acc[category_id] = {
                        id: category_id,
                        name: category_name,
                        description: category_description,
                        color: category_color,
                        documents: []
                    };
                }

                acc[category_id].documents.push({
                    id: document_id,
                    name: document_name,
                    file_url,
                    file_size,
                    priority,
                    createdAt: document_created_at
                });

                return acc;
            }, {} as Record<string, any>);

            const response = ResponseService.success(
                "Document categories with documents retrieved successfully",
                Object.values(grouped)
            );

            return c.json(response, 200);
        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get document categories with documents error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// GET All documents assigned to a user in each category (with relevant fields)
userDoc.get('/by-category/:userId', async (c) => {
    const userId = c.req.param('userId');

    try {
        const connection = await DatabaseService.createConnection();

        try {
            const selectSql = `
                SELECT 
                    dc.id AS category_id,
                    dc.name AS category_name,
                    dc.color AS category_color,
                    d.id AS document_id,
                    d.name AS document_name,
                    d.file_url,
                    d.file_size,
                    d.priority,
                    d.createdAt AS document_created_at,
                    ds.signed_at,
                    uda.status AS signature_status
                FROM document_categories dc
                INNER JOIN documents d 
                    ON dc.id = d.category_id
                INNER JOIN user_document_assignments uda
                    ON uda.document_id = d.id
                LEFT JOIN document_signatures ds
                    ON ds.document_id = d.id AND ds.user_id = ?
                WHERE uda.user_id = ?
                ORDER BY dc.name ASC, d.name ASC
            `;

            const [rows] = await connection.execute<any[]>(selectSql, [userId, userId]);

            // Group documents under their categories
            const grouped = rows.reduce((acc, row) => {
                const {
                    category_id,
                    category_name,
                    category_color,
                    document_id,
                    document_name,
                    file_url,
                    file_size,
                    priority,
                    document_created_at,
                    signature_status
                } = row;

                if (!acc[category_id]) {
                    acc[category_id] = {
                        id: category_id,
                        name: category_name,
                        color: category_color,
                        documents: []
                    };
                }

                acc[category_id].documents.push({
                    id: document_id,
                    name: document_name,
                    fileUrl: file_url,
                    size: file_size,
                    priority,
                    createdAt: document_created_at,
                    status: signature_status,
                    signedDate: row.signed_at
                });

                return acc;
            }, {} as Record<string, any>);

            const response = ResponseService.success(
                "User-specific document categories retrieved successfully",
                Object.values(grouped)
            );

            return c.json(response, 200);
        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Get user-specific document categories error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});



export default userDoc;