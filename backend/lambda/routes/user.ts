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

const app = new Hono();

interface UserAttributes {
    username: string;
    createdAt?: Date;
    updatedAt?: Date;
    userStatus?: string;
    enabled?: boolean;
    email: string;
    sub: string;
    firstName: string;
    lastName: string;
    role: string;
    occupation: string;
    userId: string;
}

interface UserWithLeaveData {
    userId: string;
    firstName: string;
    lastName: string;
    leave_type: string;
    leave_count: number;
}

interface ApiResponse<T> {
    code: string;
    message: string;
    error: boolean;
    payload: T | null;
}


const client = new CognitoIdentityProviderClient({});
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const USER_POOL_ID = process.env.USER_POOL_ID!;


// Response utilities
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

// User service
class UserService {
    static mapUserAttributes(user: any): UserAttributes {

        const getAttributeValue = (attrName: string) =>
            user.UserAttributes?.find((attr: any) => attr.Name === attrName)?.Value;

        return {
            username: user.Username,
            createdAt: user.UserCreateDate,
            updatedAt: user.UserLastModifiedDate,
            userStatus: user.UserStatus,
            enabled: user.Enabled,
            email: getAttributeValue("email"),
            sub: getAttributeValue("sub"),
            firstName: getAttributeValue("given_name"),
            lastName: getAttributeValue("family_name"),
            role: getAttributeValue("custom:role"),
            occupation: getAttributeValue("custom:occupation"),
            userId: getAttributeValue("custom:userId"),
        };
    }

    static createUserAttributesFromToken(c: any): UserAttributes {
        const decodedToken = getDecodedToken(c);

        return {
            username: decodedToken['cognito:username'] || decodedToken.preferred_username || decodedToken.email,
            email: getUserEmail(c),
            sub: getCognitoSub(c),
            firstName: getUserFirstName(c),
            lastName: getUserLastName(c),
            role: getUserRole(c),
            occupation: getUserOccupation(c),
            userId: getCustomUserId(c),
            createdAt: undefined,
            updatedAt: undefined,
            userStatus: undefined,
            enabled: undefined
        };
    }

    static async getCurrentUserWithLeaveData(userId: string) {
        const connection = await DatabaseService.createConnection();

        try {
            // First get basic user info
            const userSql = `SELECT * FROM users WHERE id = ?`;
            const [userRows] = await connection.execute(userSql, [userId]);
            const user = (userRows as any[])[0];

            if (!user) {
                return null;
            }

            // Then get aggregated leave data
            const leaveSql = `
                SELECT 
                    lr.leave_type,
                    COUNT(*) AS leave_count
                FROM leave_requests lr 
                WHERE lr.uid = ? AND lr.status = 'approved'
                GROUP BY lr.leave_type
            `;

            const [leaveRows] = await connection.execute(leaveSql, [userId]);

            return {
                ...user,
                leaveData: leaveRows
            };
        } finally {
            await connection.end();
        }
    }

    static async getAllUsers() {
        const connection = await DatabaseService.createConnection();

        try {
            const sql = `SELECT * FROM users`;
            const [rows] = await connection.execute(sql);
            return rows;
        } finally {
            await connection.end();
        }
    }

    static async getUserById(userId: string) {
        const connection = await DatabaseService.createConnection();

        try {
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await connection.execute(sql, [userId]);
            return (rows as any[])[0] || null;
        } finally {
            await connection.end();
        }
    }
}

function generateTemporaryPassword(): string {
    const length = 12;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    // Ensure password has at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase  
    password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special char

    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
        password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password to avoid predictable pattern
    return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Routes
app.get('/me', async (c) => {
    try {
        const userId = getCustomUserId(c);

        if (!userId) {
            const response = ResponseService.error(
                "USER_ID_NOT_FOUND",
                "User ID not found in token"
            );
            return c.json(response, 400);
        }

        const user = await UserService.getCurrentUserWithLeaveData(userId);

        if (!user) {
            const response = ResponseService.error(
                "USER_NOT_FOUND",
                "User not found in database"
            );
            return c.json(response, 404);
        }

        const response = ResponseService.success(
            "User retrieved successfully",
            user
        );
        return c.json(response, 200);

    } catch (error) {
        console.error('Get current user error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

app.get('/me/full', async (c) => {
    try {
        const response = ResponseService.error(
            "NOT_IMPLEMENTED",
            "Full user data requires access token. Use /me endpoint for basic user info from ID token."
        );
        return c.json(response, 501);
    } catch (error) {
        console.error('Get current user full error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

app.get('/', async (c) => {
    try {
        const users = await UserService.getAllUsers();

        const response = ResponseService.success(
            "Users retrieved successfully",
            users
        );
        return c.json(response, 200);

    } catch (error) {
        console.error("Error getting users:", error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

app.get('/on-leave', async (c) => {
    const connection = await DatabaseService.createConnection();

    try {
        // Get query params or default to today
        const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0];
        const endDate = c.req.query('end_date') || startDate;

        // Validate parameters exist
        if (!startDate || !endDate) {
            return c.json(ResponseService.error(
                "MISSING_PARAMETERS",
                "Both startDate and endDate parameters are required"
            ), 400);
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            return c.json(ResponseService.error(
                "INVALID_DATE_FORMAT",
                "Invalid date format. Please use YYYY-MM-DD"
            ), 400);
        }

        // Get all users
        const [users] = await connection.execute(`SELECT * FROM users`);

        // Get users on leave overlapping date range
        const [leaveRows] = await connection.execute(`
            SELECT
                lr.uid,
                lr.leave_type,
                lr.start_date,
                lr.end_date
            FROM leave_requests lr
            WHERE lr.status = 'approved'
                AND (
                    (lr.start_date BETWEEN ? AND ?) OR
                    (lr.end_date BETWEEN ? AND ?) OR
                    (lr.start_date <= ? AND lr.end_date >= ?)
                )
        `, [startDate, endDate, startDate, endDate, startDate, endDate]);


        // Map leave data by uid
        const leaveMap = new Map<string, {
            leaveType: string;
            leaveDates: string;
            startDate: string;
            endDate: string;
            duration: number;
        }>();

        for (const row of leaveRows as any[]) {
            const startDateObj = new Date(row.start_date);
            const endDateObj = new Date(row.end_date);

            const durationMs = endDateObj.getTime() - startDateObj.getTime();
            const duration = Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1;

            const formattedStart = startDateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
            const formattedEnd = endDateObj.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            leaveMap.set(row.uid, {
                leaveType: row.leave_type,
                leaveDates: `${formattedStart} - ${formattedEnd}`,
                startDate: startDateObj.toISOString(),
                endDate: endDateObj.toISOString(),
                duration
            });
        }

        // Build team member output
        const teamMembers = (users as any[]).map(user => {
            const leaveInfo = leaveMap.get(user.id);
            const fullName = `${user.firstName} ${user.lastName}`;
            const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

            return {
                id: user.id,
                name: fullName,
                email: user.email,
                jobTitle: user.jobTitle || null,
                status: leaveInfo ? 'on-leave' : 'available',
                avatar: initials,
                leaveType: leaveInfo?.leaveType || null,
                leaveDates: leaveInfo?.leaveDates || null,
                startDate: leaveInfo?.startDate || null,
                endDate: leaveInfo?.endDate || null,
                duration: leaveInfo?.duration || null
            };
        });

        const response = ResponseService.success("Leave status fetched successfully", teamMembers);
        return c.json(response, 200);

    } catch (error) {
        console.error("Error fetching on-leave status:", error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Failed to fetch on-leave status", error);
        return c.json(response, 500);
    } finally {
        await connection.end();
    }
});

app.delete('/delete-user', async (c) => {
    try {
        const { id, email } = await c.req.json();

        if (!id || !email) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "ID and email are required"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            // Check if user exists
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await connection.execute(sql, [id]);
            const user = (rows as any[])[0];

            if (!user) {
                const response = ResponseService.error(
                    "USER_NOT_FOUND",
                    "User not found"
                );
                return c.json(response, 404);
            }

            // Delete related leave requests first (foreign key constraint)
            await connection.execute('DELETE FROM leave_requests WHERE uid = ?', [id]);

            // Delete user from database
            await connection.execute('DELETE FROM users WHERE id = ?', [id]);

            // Try to delete from Cognito
            try {
                const { AdminDeleteUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
                const deleteCommand = new AdminDeleteUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email
                });
                await client.send(deleteCommand);
            } catch (cognitoError) {
                console.error('Failed to delete user from Cognito:', cognitoError);
                // Don't fail the entire operation if Cognito deletion fails
                // The user is already deleted from the database
            }

            const response = ResponseService.success(
                "User deleted successfully",
                { deletedUserId: id, deletedEmail: email }
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Delete user error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// TODO remove the hardcoded email
app.post('/add-user', async (c) => {
    try {
        const { firstName, lastName, jobTitle, isAdmin } = await c.req.json();

        // Validate required fields
        if (!firstName || !lastName || !jobTitle) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "jobTitle, firstName, lastName are required"
            );
            return c.json(response, 400);
        }

        // take first name and alst name and conver to email e.g John Doe -> john.doe
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@disraptor.co.za`;
        const role = isAdmin ? 'admin' : 'user';

        const connection = await DatabaseService.createConnection();

        try {
            // Check if user already exists in database
            const checkSql = `SELECT * FROM users WHERE email = ?`;
            const [existingRows] = await connection.execute(checkSql, [email]);

            if ((existingRows as any[]).length > 0) {
                const response = ResponseService.error(
                    "USER_EXISTS",
                    "A user with this email already exists"
                );
                return c.json(response, 409);
            }

            // Generate a UUID
            const uuid = randomUUID();

            // const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;÷

            const requiredAttributes = {
                firstName,
                lastName,
                email,
                role,
                userId: uuid
            };

            for (const [key, value] of Object.entries(requiredAttributes)) {
                if (!value) {
                    const response = ResponseService.error(
                        "MISSING_REQUIRED_FIELD",
                        `Missing required field: ${key}`
                    );
                    return c.json(response, 400);
                }
            }

            // Create user in Cognito
            let cognitoUser;
            try {

                const createUserCommand = new AdminCreateUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email,
                    UserAttributes: [
                        { Name: 'email', Value: email },
                        { Name: 'email_verified', Value: 'true' },
                        { Name: 'given_name', Value: firstName },
                        { Name: 'family_name', Value: lastName },
                        { Name: 'custom:role', Value: role },
                        { Name: 'custom:occupation', Value: jobTitle },
                        { Name: 'custom:userId', Value: uuid }
                    ],
                    TemporaryPassword: generateTemporaryPassword(),
                    DesiredDeliveryMediums: ['EMAIL']
                });

                cognitoUser = await client.send(createUserCommand);

            } catch (cognitoError: any) {
                console.error('Cognito user creation failed:', cognitoError);

                // Handle specific Cognito errors
                if (cognitoError.name === 'UsernameExistsException') {
                    const response = ResponseService.error(
                        "USER_EXISTS_COGNITO",
                        "A user with this email already exists in Cognito"
                    );
                    return c.json(response, 409);
                }

                const response = ResponseService.error(
                    "COGNITO_ERROR",
                    "Failed to create user in Cognito",
                    cognitoError.message
                );
                return c.json(response, 500);
            }

            // Add user to database
            const insertSql = `
                INSERT INTO users (id, email, firstName, lastName, role, jobTitle, phoneNumber, dob, gender, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            await connection.execute(insertSql, [
                uuid,
                email,
                firstName,
                lastName,
                role,
                jobTitle || '', // Pass null if jobTitle is empty/undefined for DB
                '+27000000000', // Hardcoded - consider making dynamic or optional
                '0000-01-01',   // Hardcoded - consider making dynamic or optional
                '-'             // Hardcoded - consider making dynamic or optional
            ]);

            // Get the created user
            // const [createdRows] = await connection.execute(checkSql, [email]);
            // const createdUser = (createdRows as any[])[0];

            const response = ResponseService.success(
                "User created successfully. Welcome email sent with temporary password.",
                {
                    // user: createdUser,
                    cognitoUsername: cognitoUser.User?.Username,
                    userStatus: cognitoUser.User?.UserStatus
                }
            );
            //   const response = ResponseService.success(
            //     "User deleted successfully",
            //     { deletedUserId: id, deletedEmail: email }
            // );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Add user error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// POST: /me/update
// Update current user attributes
app.post('/me/update', async (c) => {
    try {
        const userAttributes = UserService.createUserAttributesFromToken(c);
        const { firstName, lastName, jobTitle, dob, gender, phoneNumber } = await c.req.json();

        // Validate required fields
        if (!firstName || !lastName || !jobTitle) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "jobTitle, firstName, lastName are required"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            const updateSql = `
                UPDATE users
                SET firstName = ?, lastName = ?, jobTitle = ?, phoneNumber = ?, dob = ?, gender = ?
                WHERE id = ? AND email = ?
            `;

            await connection.execute(updateSql, [
                firstName,
                lastName,
                jobTitle,
                phoneNumber,
                dob,
                gender,
                userAttributes.userId,
                userAttributes.email
            ]);

            const response = ResponseService.success(
                "User updated successfully",
                { firstName, lastName, jobTitle }
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Update user error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// POST: /users/update-user
// This endpoint is for admin to update any user attributes
app.post('/update-user', async (c) => {
    try {
        const { id, firstName, lastName, jobTitle, phoneNumber, dob, gender } = await c.req.json();

        // Validate required fields
        if (!id || !firstName || !lastName || !jobTitle) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "id, jobTitle, firstName, lastName are required"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            const updateSql = `
                UPDATE users
                SET firstName = ?, lastName = ?, jobTitle = ?, phoneNumber = ?, dob = ?, gender = ?
                WHERE id = ?
            `;

            await connection.execute(updateSql, [
                firstName,
                lastName,
                jobTitle,
                phoneNumber,
                dob,
                gender,
                id
            ]);

            const response = ResponseService.success(
                "User updated successfully",
                { firstName, lastName, jobTitle }
            );
            return c.json(response, 200);

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Update user error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

export { app as users };