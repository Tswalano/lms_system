import { Hono } from 'hono';
import { z } from 'zod';
import { Context } from 'hono';
import mysql from 'mysql2/promise';
import { getUserId, getDecodedToken } from '../middleware/auth';
import { DatabaseService } from '../helpers/databaseHeler';

const app = new Hono();

// ============= INTERFACES =============

interface ApiQuestion {
    id: string;
    category: string;
    questionText: string;
    questionType: 'text' | 'rating' | 'nomination';
    phase: 'self' | 'peer' | 'nomination';
    displayOrder: number;
    isActive: boolean;
}

interface ApiTeamMember {
    id: string;
    userId: string | null;
    name: string;
    role: string;
    avatar: string;
    isActive: boolean;
}

interface ApiReview {
    id: string;
    reviewPeriod: string;
    employeeId: string;
    managerId: string;
    status: 'active' | 'in_progress' | 'employee_completed' | 'manager_reviewed' | 'completed';
    employeeCompletedAt: string | null;
    managerCompletedAt: string | null;
    overallRating: number | null;
    createdAt: string;
    updatedAt: string;
}

interface ApiReviewResponse {
    id: string;
    questionId: string;
    textResponse: string | null;
    ratingResponse: number | null;
    nominationResponse: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ReviewSession {
    questions: ApiQuestion[];
    totalQuestions: number;
    distribution: {
        self: number;
        peer: number;
        nomination: number;
    };
}

// Database row interfaces
interface ReviewRowDB extends mysql.RowDataPacket {
    id: number;
    reviewPeriod: string;
    employeeId: number;
    managerId: number;
    status: string;
    employeeCompletedAt: Date | null;
    managerCompletedAt: Date | null;
    overallRating: number | null;
    createdAt: Date;
    updatedAt: Date;
}

interface QuestionRowDB extends mysql.RowDataPacket {
    id: number;
    category: string;
    questionText: string;
    questionType: 'text' | 'rating' | 'nomination';
    phase: 'self' | 'peer' | 'nomination';
    displayOrder: number;
    isActive: boolean;
}

interface TeamMemberRowDB extends mysql.RowDataPacket {
    id: number;
    userId: number | null;
    name: string;
    role: string;
    avatar: string;
    isActive: boolean;
}

interface ResponseRowDB extends mysql.RowDataPacket {
    id: number;
    questionId: number;
    textResponse: string | null;
    ratingResponse: number | null;
    nominationResponse: string | null;
    createdAt: Date;
    updatedAt: Date;
}

// ============= VALIDATION SCHEMAS =============

const submitResponseSchema = z.object({
    reviewId: z.string(),
    questionId: z.string(),
    textResponse: z.string().optional(),
    ratingResponse: z.number().min(1).max(5).optional(),
    nominationResponse: z.string().optional()
}).refine((data) => {
    // At least one response type must be provided
    return data.textResponse || data.ratingResponse || data.nominationResponse;
}, {
    message: "At least one response type must be provided"
});

const sessionConfigSchema = z.object({
    selfQuestions: z.number().min(1).max(30).default(10),
    peerQuestions: z.number().min(1).max(30).default(8),
    nominationQuestions: z.number().min(1).max(15).default(7),
    includeCategories: z.array(z.string()).optional(),
    excludeCategories: z.array(z.string()).optional()
});

// ============= HELPER FUNCTIONS =============

function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function generateQuestionSession(questions: ApiQuestion[], config: {
    selfQuestions: number;
    peerQuestions: number;
    nominationQuestions: number;
    includeCategories?: string[];
    excludeCategories?: string[];
}): ReviewSession {
    const { selfQuestions, peerQuestions, nominationQuestions, includeCategories, excludeCategories } = config;

    // Filter questions by categories if specified
    let filteredQuestions = questions;
    if (includeCategories && includeCategories.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => includeCategories.includes(q.category));
    }
    if (excludeCategories && excludeCategories.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => !excludeCategories.includes(q.category));
    }

    // Separate questions by phase
    const selfQs = shuffleArray(filteredQuestions.filter(q => q.phase === 'self')).slice(0, selfQuestions);
    const peerQs = shuffleArray(filteredQuestions.filter(q => q.phase === 'peer')).slice(0, peerQuestions);
    const nominationQs = shuffleArray(filteredQuestions.filter(q => q.phase === 'nomination')).slice(0, nominationQuestions);

    const sessionQuestions = [...selfQs, ...peerQs, ...nominationQs];

    return {
        questions: sessionQuestions,
        totalQuestions: sessionQuestions.length,
        distribution: {
            self: selfQs.length,
            peer: peerQs.length,
            nomination: nominationQs.length
        }
    };
}

// ============= API ENDPOINTS =============

// GET /performance-review/current - Get current active review for logged-in user
app.get('/current', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        // Get current active review
        const [reviewRows] = await connection.query<ReviewRowDB[]>(`
            SELECT id, reviewPeriod, employeeId, managerId, status, 
                   employeeCompletedAt, managerReviewCompletedAt, overallRating, 
                   createdAt, updatedAt
            FROM performance_reviews 
            WHERE employeeId = ? AND status IN ('active', 'in_progress', 'employee_completed')
            ORDER BY createdAt DESC
            LIMIT 1
        `, [userId]);

        if (!reviewRows.length) {
            return c.json({
                success: true,
                data: null,
                message: 'No active review found'
            });
        }

        const review = reviewRows[0];
        const apiReview: ApiReview = {
            id: review.id.toString(),
            reviewPeriod: review.reviewPeriod,
            employeeId: review.employeeId.toString(),
            managerId: review.managerId.toString(),
            status: review.status as any,
            employeeCompletedAt: review.employeeCompletedAt?.toISOString() || null,
            managerCompletedAt: review.managerCompletedAt?.toISOString() || null,
            overallRating: review.overallRating,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString()
        };

        return c.json({
            success: true,
            data: apiReview
        });

    } catch (error) {
        console.error('Get current review error:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch current review'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// POST /performance-review/session - Generate a new question session
app.post('/session', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const body = await c.req.json();
        const config = sessionConfigSchema.parse(body);

        connection = await DatabaseService.createConnection();

        // Get all active questions
        const [questionRows] = await connection.query<QuestionRowDB[]>(`
            SELECT id, category, questionText, questionType, phase, displayOrder, isActive
            FROM review_questions 
            WHERE isActive = 1
            ORDER BY phase, displayOrder
        `);

        const questions: ApiQuestion[] = questionRows.map(q => ({
            id: q.id.toString(),
            category: q.category,
            questionText: q.questionText,
            questionType: q.questionType,
            phase: q.phase,
            displayOrder: q.displayOrder,
            isActive: q.isActive
        }));

        const session = generateQuestionSession(questions, config);

        return c.json({
            success: true,
            data: session
        });

    } catch (error) {
        console.error('Generate session error:', error);
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request parameters',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to generate question session'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /performance-review/team-members - Get team members for nominations
app.get('/team-members', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        connection = await DatabaseService.createConnection();

        // Get active team members excluding the current user
        const [teamMemberRows] = await connection.query<TeamMemberRowDB[]>(`
            SELECT tm.id, tm.userId, tm.name, tm.role, tm.avatar, tm.isActive
            FROM team_members tm
            WHERE tm.isActive = 1 AND (tm.userId IS NULL OR tm.userId != ?)
            ORDER BY tm.name
        `, [userId]);

        const teamMembers: ApiTeamMember[] = teamMemberRows.map(tm => ({
            id: tm.id.toString(),
            userId: tm.userId ? tm.userId.toString() : null,
            name: tm.name,
            role: tm.role,
            avatar: tm.avatar,
            isActive: tm.isActive
        }));

        return c.json({
            success: true,
            data: teamMembers
        });

    } catch (error) {
        console.error('Get team members error:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch team members'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// POST /performance-review/response - Submit or update a response
app.post('/response', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const userId = getUserId(c);
        const body = await c.req.json();
        const payload = submitResponseSchema.parse(body);
        const { reviewId, questionId, textResponse, ratingResponse, nominationResponse } = payload;

        connection = await DatabaseService.createConnection();
        await connection.beginTransaction();

        // Verify user has access to this review
        const [reviewCheck] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT employeeId, status FROM performance_reviews 
            WHERE id = ? AND employeeId = ?
        `, [reviewId, userId]);

        if (!reviewCheck.length) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Review not found or access denied'
            }, 404);
        }

        const review = reviewCheck[0];
        if (review.status === 'completed' || review.status === 'manager_reviewed') {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Review is already completed and cannot be modified'
            }, 400);
        }

        // Verify question exists and is active
        const [questionCheck] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id, questionType, phase FROM review_questions 
            WHERE id = ? AND isActive = 1
        `, [questionId]);

        if (!questionCheck.length) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Invalid question ID'
            }, 400);
        }

        // Validate response type matches question type
        const question = questionCheck[0];
        if (question.questionType === 'text' && !textResponse) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Text response required for this question'
            }, 400);
        }
        if (question.questionType === 'rating' && !ratingResponse) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Rating response required for this question'
            }, 400);
        }
        if (question.questionType === 'nomination' && !nominationResponse) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Nomination response required for this question'
            }, 400);
        }

        // Check if response already exists
        const [existingResponse] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT id FROM review_responses 
            WHERE performanceReviewId = ? AND questionId = ?
        `, [reviewId, questionId]);

        let responseId: string;

        if (existingResponse.length > 0) {
            // Update existing response
            await connection.query(`
                UPDATE review_responses 
                SET textResponse = ?, ratingResponse = ?, nominationResponse = ?, updatedAt = NOW()
                WHERE id = ?
            `, [textResponse || null, ratingResponse || null, nominationResponse || null, existingResponse[0].id]);
            responseId = existingResponse[0].id.toString();
        } else {
            // Insert new response
            const [insertResult] = await connection.query<mysql.ResultSetHeader>(`
                INSERT INTO review_responses (performanceReviewId, questionId, textResponse, ratingResponse, nominationResponse, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, NOW(), NOW())
            `, [reviewId, questionId, textResponse || null, ratingResponse || null, nominationResponse || null]);
            responseId = insertResult.insertId.toString();
        }

        // Update review status to in_progress if it was active
        if (review.status === 'active') {
            await connection.query(`
                UPDATE performance_reviews 
                SET status = 'in_progress', updatedAt = NOW()
                WHERE id = ?
            `, [reviewId]);
        }

        await connection.commit();

        return c.json({
            success: true,
            message: 'Response saved successfully',
            data: {
                responseId,
                questionId,
                reviewId
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Submit response error:', error);
        if (error instanceof z.ZodError) {
            return c.json({
                success: false,
                message: 'Invalid request data',
                errors: error.errors
            }, 400);
        }
        return c.json({
            success: false,
            message: 'Failed to save response'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /performance-review/responses/:reviewId - Get all responses for a review
app.get('/responses/:reviewId', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const reviewId = c.req.param('reviewId');
        const userId = getUserId(c);

        connection = await DatabaseService.createConnection();

        // Verify user has access to this review
        const [reviewCheck] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT employeeId, managerId FROM performance_reviews 
            WHERE id = ?
        `, [reviewId]);

        if (!reviewCheck.length) {
            return c.json({
                success: false,
                message: 'Review not found'
            }, 404);
        }

        const review = reviewCheck[0];
        if (review.employeeId !== userId && review.managerId !== userId) {
            return c.json({
                success: false,
                message: 'Access denied'
            }, 403);
        }

        // Get all responses for this review
        const [responseRows] = await connection.query<ResponseRowDB[]>(`
            SELECT id, questionId, textResponse, ratingResponse, nominationResponse, createdAt, updatedAt
            FROM review_responses 
            WHERE performanceReviewId = ?
            ORDER BY createdAt
        `, [reviewId]);

        const responses: ApiReviewResponse[] = responseRows.map(r => ({
            id: r.id.toString(),
            questionId: r.questionId.toString(),
            textResponse: r.textResponse,
            ratingResponse: r.ratingResponse,
            nominationResponse: r.nominationResponse,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString()
        }));

        return c.json({
            success: true,
            data: responses
        });

    } catch (error) {
        console.error('Get responses error:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch responses'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// POST /performance-review/:reviewId/complete - Complete the employee portion
app.post('/:reviewId/complete', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const reviewId = c.req.param('reviewId');
        const userId = getUserId(c);

        connection = await DatabaseService.createConnection();
        await connection.beginTransaction();

        // Verify user owns this review
        const [reviewCheck] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT employeeId, status, managerId FROM performance_reviews 
            WHERE id = ?
        `, [reviewId]);

        if (!reviewCheck.length) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Review not found'
            }, 404);
        }

        const review = reviewCheck[0];
        if (review.employeeId !== userId) {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Unauthorized to complete this review'
            }, 403);
        }

        if (review.status === 'employee_completed' || review.status === 'completed') {
            await connection.rollback();
            return c.json({
                success: false,
                message: 'Review is already completed'
            }, 400);
        }

        // Check if minimum required questions are answered (at least self and peer phases)
        const [questionCount] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                COUNT(CASE WHEN phase = 'self' THEN 1 END) as selfQuestions,
                COUNT(CASE WHEN phase = 'peer' THEN 1 END) as peerQuestions,
                COUNT(CASE WHEN phase = 'nomination' THEN 1 END) as nominationQuestions
            FROM review_questions 
            WHERE isActive = 1
        `);

        const [responseCount] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                COUNT(CASE WHEN rq.phase = 'self' THEN 1 END) as selfResponses,
                COUNT(CASE WHEN rq.phase = 'peer' THEN 1 END) as peerResponses,
                COUNT(CASE WHEN rq.phase = 'nomination' THEN 1 END) as nominationResponses
            FROM review_responses rr
            JOIN review_questions rq ON rr.questionId = rq.id
            WHERE rr.performanceReviewId = ?
            AND (rr.textResponse IS NOT NULL OR rr.ratingResponse IS NOT NULL OR rr.nominationResponse IS NOT NULL)
        `, [reviewId]);

        const questions = questionCount[0];
        const responses = responseCount[0];

        // Require at least 70% completion for self and peer phases
        const minSelfResponses = Math.ceil(questions.selfQuestions * 0.7);
        const minPeerResponses = Math.ceil(questions.peerQuestions * 0.7);

        if (responses.selfResponses < minSelfResponses || responses.peerResponses < minPeerResponses) {
            await connection.rollback();
            return c.json({
                success: false,
                message: `Minimum completion required: ${minSelfResponses} self-review questions and ${minPeerResponses} peer-review questions. Current: ${responses.selfResponses} self, ${responses.peerResponses} peer.`
            }, 400);
        }

        // Update review status to employee_completed
        await connection.query(`
            UPDATE performance_reviews 
            SET status = 'employee_completed', employeeCompletedAt = NOW(), updatedAt = NOW()
            WHERE id = ?
        `, [reviewId]);

        await connection.commit();

        return c.json({
            success: true,
            message: 'Review completed successfully',
            data: {
                reviewId: reviewId,
                completedAt: new Date().toISOString(),
                status: 'employee_completed',
                summary: {
                    selfResponses: responses.selfResponses,
                    peerResponses: responses.peerResponses,
                    nominationResponses: responses.nominationResponses
                }
            }
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('Complete review error:', error);
        return c.json({
            success: false,
            message: 'Failed to complete review'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /performance-review/categories - Get available question categories
app.get('/categories', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [categoryRows] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT DISTINCT category, phase, COUNT(*) as questionCount
            FROM review_questions 
            WHERE isActive = 1
            GROUP BY category, phase
            ORDER BY phase, category
        `);

        const categories = categoryRows.map(row => ({
            category: row.category,
            phase: row.phase,
            questionCount: row.questionCount
        }));

        return c.json({
            success: true,
            data: categories
        });

    } catch (error) {
        console.error('Get categories error:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch categories'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /performance-review/progress/:reviewId - Get review progress
app.get('/progress/:reviewId', async (c: Context): Promise<Response> => {
    let connection: mysql.Connection | null = null;
    try {
        const reviewId = c.req.param('reviewId');
        const userId = getUserId(c);

        connection = await DatabaseService.createConnection();

        // Verify access
        const [reviewCheck] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT employeeId, managerId, status FROM performance_reviews 
            WHERE id = ?
        `, [reviewId]);

        if (!reviewCheck.length) {
            return c.json({
                success: false,
                message: 'Review not found'
            }, 404);
        }

        const review = reviewCheck[0];
        if (review.employeeId !== userId && review.managerId !== userId) {
            return c.json({
                success: false,
                message: 'Access denied'
            }, 403);
        }

        // Get progress statistics
        const [progressStats] = await connection.query<mysql.RowDataPacket[]>(`
            SELECT 
                rq.phase,
                COUNT(rq.id) as totalQuestions,
                COUNT(rr.id) as answeredQuestions,
                COUNT(CASE WHEN rr.updatedAt >= DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 END) as recentAnswers
            FROM review_questions rq
            LEFT JOIN review_responses rr ON rq.id = rr.questionId AND rr.performanceReviewId = ?
            WHERE rq.isActive = 1
            GROUP BY rq.phase
            ORDER BY 
                CASE rq.phase 
                    WHEN 'self' THEN 1 
                    WHEN 'peer' THEN 2 
                    WHEN 'nomination' THEN 3 
                END
        `, [reviewId]);

        const progress = progressStats.map(stat => ({
            phase: stat.phase,
            totalQuestions: stat.totalQuestions,
            answeredQuestions: stat.answeredQuestions,
            completionPercentage: Math.round((stat.answeredQuestions / stat.totalQuestions) * 100),
            recentAnswers: stat.recentAnswers
        }));

        const totalQuestions = progress.reduce((sum, p) => sum + p.totalQuestions, 0);
        const totalAnswered = progress.reduce((sum, p) => sum + p.answeredQuestions, 0);
        const overallCompletion = Math.round((totalAnswered / totalQuestions) * 100);

        return c.json({
            success: true,
            data: {
                reviewId,
                status: review.status,
                overallCompletion,
                totalQuestions,
                totalAnswered,
                phaseProgress: progress
            }
        });

    } catch (error) {
        console.error('Get progress error:', error);
        return c.json({
            success: false,
            message: 'Failed to fetch progress'
        }, 500);
    } finally {
        if (connection) await connection.end();
    }
});

export { app as performanceRoutes };