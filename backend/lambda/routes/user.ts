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
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;

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
            const userSql = `SELECT u.*, d.name as department, d.description
                FROM users u
                LEFT JOIN departments d ON u.departmentId = d.id
                WHERE u.id = ?`;
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
            const sql = `SELECT 
                        u.*,
                        d.name AS department
                    FROM users u
                    LEFT JOIN user_departments ud ON ud.user_id = u.id
                    LEFT JOIN departments d ON d.id = ud.department_id
                    WHERE u.isActive = 1;`;
            const [rows] = await connection.execute(sql);
            return rows;
        } finally {
            await connection.end();
        }
    }

    static async getAllDepartments() {
        const connection = await DatabaseService.createConnection();

        try {
            const sql = `SELECT * FROM departments`;
            const [rows] = await connection.execute(sql); // rows is of type QueryResult
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

// GET: get current user info
// This endpoint retrieves the current user info from the ID token
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

// GET: get current user full info and leave data
// This endpoint is not implemented yet, as it requires access token
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

// GET: get all users
// This endpoint returns all users in the system
app.get('/', async (c) => {
    try {
        const users = await UserService.getAllUsers();
        const departments = await UserService.getAllDepartments();

        const response = ResponseService.success(
            "Users retrieved successfully",
            { users, departments }
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

// GET: get users who are on leave
// This endpoint returns all users with their leave status for a given date range
app.get('/on-leave', async (c) => {
    const connection = await DatabaseService.createConnection();

    try {
        // Compute today's date in SAST (Africa/Johannesburg, UTC+2) as a YYYY-MM-DD string.
        // Using toISOString() would give the UTC date, which is 2h behind SAST and causes
        // the last day of leave to be missed (e.g. Friday shows as not-on-leave).
        const SAST_TZ = 'Africa/Johannesburg';
        const toSastDateStr = (d: Date): string =>
            new Intl.DateTimeFormat('en-CA', {
                timeZone: SAST_TZ,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            }).format(d);

        const nowSast = toSastDateStr(new Date());

        // Get query params or default to today (SAST)
        const startDate = c.req.query('startDate') || c.req.query('start_date') || nowSast;
        const endDate = c.req.query('endDate') || c.req.query('end_date') || startDate;

        // Current date string in SAST for status determination
        const currentDate = nowSast;

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

        // Validate date range (startDate should not be after endDate)
        if (new Date(startDate) > new Date(endDate)) {
            return c.json(ResponseService.error(
                "INVALID_DATE_RANGE",
                "Start date cannot be after end date"
            ), 400);
        }

        // Get ALL users with their leave requests (not just approved ones in the query range)
        const query = `
            SELECT 
                u.id,
                u.firstName,
                u.lastName,
                u.email,
                u.jobTitle,
                lr.leave_type,
                lr.start_date,
                lr.end_date,
                lr.status,
                DATE(lr.start_date) as start_date_only,
                DATE(lr.end_date) as end_date_only
            FROM users u
            LEFT JOIN leave_requests lr ON u.id = lr.uid 
                AND lr.status = 'approved'
            ORDER BY u.firstName, u.lastName, lr.start_date
        `;

        const [rows] = await connection.execute(query);

        // Group users and their leave data
        const userMap = new Map<string, {
            user: any;
            allLeaves: any[];
        }>();

        for (const row of rows as any[]) {
            const userId = row.id.toString();

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    user: {
                        id: row.id,
                        firstName: row.firstName,
                        lastName: row.lastName,
                        email: row.email,
                        jobTitle: row.jobTitle
                    },
                    allLeaves: []
                });
            }

            // If there's leave data, add it
            if (row.leave_type && row.start_date && row.end_date) {
                const leaveStartDate = new Date(row.start_date);
                const leaveEndDate = new Date(row.end_date);

                // Calculate total leave duration
                const totalDuration = Math.floor((leaveEndDate.getTime() - leaveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                // Extract SAST calendar dates from the raw mysql2 Date objects.
                // mysql2 may return DATE columns as SAST midnight encoded in UTC
                // (e.g. "2026-05-01T22:00:00Z" = May 2 00:00 SAST), so comparing
                // toISOString() dates against a UTC currentDate string will fail on the
                // last day of leave. Using Intl.DateTimeFormat in SAST gives correct dates.
                const startDateOnly = toSastDateStr(leaveStartDate);
                const endDateOnly = toSastDateStr(leaveEndDate);

                userMap.get(userId)!.allLeaves.push({
                    leaveType: row.leave_type,
                    startDate: leaveStartDate.toISOString(),
                    endDate: leaveEndDate.toISOString(),
                    startDateOnly,
                    endDateOnly,
                    duration: totalDuration,
                    status: row.status
                });
            }
        }

        // Build team member output
        const teamMembers = Array.from(userMap.values()).map(({ user, allLeaves }) => {
            const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
            const initials = `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase();

            // All date comparisons use YYYY-MM-DD string ordering (ISO lexicographic = chronological)
            // Find leave that covers current date
            const currentLeave = allLeaves.find(leave =>
                currentDate >= leave.startDateOnly && currentDate <= leave.endDateOnly
            );

            // Find upcoming leaves (start after current date)
            const upcomingLeaves = allLeaves
                .filter(leave => leave.startDateOnly > currentDate)
                .sort((a, b) => a.startDateOnly.localeCompare(b.startDateOnly));

            // Find past leaves (ended before current date)
            const pastLeaves = allLeaves
                .filter(leave => leave.endDateOnly < currentDate)
                .sort((a, b) => b.endDateOnly.localeCompare(a.endDateOnly));

            // Determine status
            let status = 'available';
            let primaryLeave = null;

            if (currentLeave) {
                status = 'on-leave';
                primaryLeave = currentLeave;
            } else if (upcomingLeaves.length > 0) {
                // All date strings are YYYY-MM-DD (lexicographic = chronological)
                const relevantUpcomingLeave = upcomingLeaves.find(leave =>
                    leave.startDateOnly <= endDate && leave.endDateOnly >= startDate
                );

                if (relevantUpcomingLeave) {
                    status = 'upcoming-leave';
                    primaryLeave = relevantUpcomingLeave;
                }
            }

            // Calculate overlapping days using date-only strings (YYYY-MM-DD)
            let overlappingDays = 0;
            if (primaryLeave) {
                const overlapStartStr = primaryLeave.startDateOnly > startDate ? primaryLeave.startDateOnly : startDate;
                const overlapEndStr = primaryLeave.endDateOnly < endDate ? primaryLeave.endDateOnly : endDate;

                if (overlapStartStr <= overlapEndStr) {
                    const ms = new Date(overlapEndStr).getTime() - new Date(overlapStartStr).getTime();
                    overlappingDays = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
                }
            }

            const toDisplayDate = (d: Date): string =>
                new Intl.DateTimeFormat('en-US', {
                    timeZone: SAST_TZ,
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                }).format(d);

            const member = {
                id: user.id,
                name: fullName,
                email: user.email,
                jobTitle: user.jobTitle || null,
                status: status,
                avatar: initials,
                leaveType: primaryLeave?.leaveType || null,
                leaveDates: primaryLeave ?
                    `${toDisplayDate(new Date(primaryLeave.startDate))} - ${toDisplayDate(new Date(primaryLeave.endDate))}` : null,
                startDate: primaryLeave?.startDate || null,
                endDate: primaryLeave?.endDate || null,
                duration: primaryLeave?.duration || null,
                overlappingDays: overlappingDays,
                // Categorized leaves
                currentLeave: currentLeave || null,
                upcomingLeaves: upcomingLeaves,
                pastLeaves: pastLeaves.slice(0, 5) // Limit to recent 5 past leaves
            };

            return member;
        });

        // Calculate summary based on current status
        const onLeaveCount = teamMembers.filter(m => m.status === 'on-leave').length;
        const availableCount = teamMembers.filter(m => m.status === 'available').length;
        const upcomingLeaveCount = teamMembers.filter(m => m.status === 'upcoming-leave').length;

        // Count people who will be on leave during the query period
        const onLeaveInPeriod = teamMembers.filter(m =>
            m.status === 'on-leave' || (m.status === 'upcoming-leave' && m.overlappingDays > 0)
        ).length;

        const response = ResponseService.success("Leave status fetched successfully", {
            teamMembers,
            summary: {
                totalUsers: teamMembers.length,
                currentlyOnLeave: onLeaveCount,
                available: availableCount,
                upcomingLeave: upcomingLeaveCount,
                onLeaveInPeriod: onLeaveInPeriod,
                queryRange: `${startDate} to ${endDate}`,
                currentDate: currentDate
            }
        });

        return c.json(response, 200);

    } catch (error) {
        console.error("Error fetching on-leave status:", error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Failed to fetch on-leave status", error);
        return c.json(response, 500);
    } finally {
        await connection.end();
    }
});

// DELETE: /users/delete-user
// This endpoint is for admin to deactivate a user by ID.
app.delete('/delete-user', async (c) => {
    try {
        const { id } = await c.req.json();

        if (!id) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "ID is required"
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

            await connection.execute(
                'UPDATE users SET isActive = 0, updatedAt = NOW() WHERE id = ?',
                [id]
            );

            const response = ResponseService.success(
                "User deactivated successfully",
                { deactivatedUserId: id }
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

// POST: /add-user
// This endpoint is for admin to add a new user. It will create the user in Cognito and add to the database
app.post('/add-user', async (c) => {
    try {
        const { firstName, lastName, jobTitle, isAdmin, departmentId } = await c.req.json();

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
                INSERT INTO users (id, email, firstName, lastName, role, jobTitle, departmentId, phoneNumber, dob, gender, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;

            await connection.execute(insertSql, [
                uuid,
                email,
                firstName,
                lastName,
                role,
                jobTitle || '', // Pass null if jobTitle is empty/undefined for DB
                departmentId,
                '+27000000000', // Hardcoded - consider making dynamic or optional
                '0000-01-01',   // Hardcoded - consider making dynamic or optional
                '-'             // Hardcoded - consider making dynamic or optional
            ]);

            // Get the created user
            const [createdRows] = await connection.execute(checkSql, [email]);
            const createdUser = {
                uuid,
                email,
                firstName,
                lastName,
                role,
                jobTitle: jobTitle || '',
                phoneNumber: '+27000000000',
                dob: '0000-01-01',
                gender: '-'
            };

            const response = ResponseService.success(
                "User created successfully. Welcome email sent with temporary password.",
                {
                    users: createdUser,
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
// This endpoint allows the current user to update their own attributes
// It will update the user in the database, but not in Cognito
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
                SET firstName = ?, lastName = ?, jobTitle = ?, phoneNumber = ?, dob = ?, gender = ?, updatedAt = NOW()
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
        const { id, firstName, lastName, jobTitle, departmentId } = await c.req.json();

        // Validate required fields
        if (!id || !firstName || !lastName || !jobTitle) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "id, jobTitle, firstName, lastName are required"
            );
            return c.json(response, 400);
        } else if (!departmentId) {
            const response = ResponseService.error(
                "INVALID_INPUT",
                "User must be assigned to a department, but department is not provided"
            );
            return c.json(response, 400);
        }

        const connection = await DatabaseService.createConnection();

        try {
            const updateSql = `
                UPDATE users
                SET firstName = ?, lastName = ?, jobTitle = ?, departmentId = ?, updatedAt = NOW()
                WHERE id = ?
            `;

            await connection.execute(updateSql, [
                firstName,
                lastName,
                jobTitle,
                departmentId,
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

// GET All departments - This endpoint retrieves all departments
app.get('/departments', async (c) => {
    try {
        const connection = await DatabaseService.createConnection();

        try {
            const sql = `SELECT * FROM departments`;
            const [rows] = await connection.execute(sql);
            const response = ResponseService.success(
                "Departments retrieved successfully",
                rows
            );
            return c.json(response, 200);
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('Get departments error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

// POST: Seed departments data
app.post('/seed-departments', async (c) => {
    try {
        const connection = await DatabaseService.createConnection();

        try {
            const sql = `INSERT INTO departments (name) VALUES ('IT'), ('HR'), ('Admin'), ('Finance')`;
            await connection.execute(sql);
            const response = ResponseService.success(
                "Departments seeded successfully",
                []
            );
            return c.json(response, 200);
        } finally {
            await connection.end();
        }
    } catch (error) {
        console.error('Seed departments error:', error);
        const response = ResponseService.error(
            "INTERNAL_SERVER_ERROR",
            "Internal server error",
            error
        );
        return c.json(response, 500);
    }
});

export { app as userApp };
