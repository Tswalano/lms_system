"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.users = void 0;
const hono_1 = require("hono");
const auth_1 = require("../middleware/auth");
const databaseHeler_1 = require("../helpers/databaseHeler");
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const app = new hono_1.Hono();
exports.users = app;
const client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({});
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const USER_POOL_ID = process.env.USER_POOL_ID;
// Response utilities
class ResponseService {
    static success(message, payload, statusCode = 200) {
        return {
            code: "SUCCESS",
            message,
            error: false,
            payload
        };
    }
    static error(code, message, payload = null) {
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
    static mapUserAttributes(user) {
        console.log("mapUserAttributes", user);
        const getAttributeValue = (attrName) => user.UserAttributes?.find((attr) => attr.Name === attrName)?.Value;
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
    static createUserAttributesFromToken(c) {
        const decodedToken = (0, auth_1.getDecodedToken)(c);
        return {
            username: decodedToken['cognito:username'] || decodedToken.preferred_username || decodedToken.email,
            email: (0, auth_1.getUserEmail)(c),
            sub: (0, auth_1.getCognitoSub)(c),
            firstName: (0, auth_1.getUserFirstName)(c),
            lastName: (0, auth_1.getUserLastName)(c),
            role: (0, auth_1.getUserRole)(c),
            occupation: (0, auth_1.getUserOccupation)(c),
            userId: (0, auth_1.getCustomUserId)(c),
            createdAt: undefined,
            updatedAt: undefined,
            userStatus: undefined,
            enabled: undefined
        };
    }
    static async getCurrentUserWithLeaveData(userId) {
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            // First get basic user info
            const userSql = `SELECT * FROM users WHERE id = ?`;
            const [userRows] = await connection.execute(userSql, [userId]);
            const user = userRows[0];
            if (!user) {
                return null;
            }
            // Then get aggregated leave data
            const leaveSql = `
                SELECT 
                    lr.leave_type,
                    COUNT(*) AS leave_count
                FROM leave_requests lr 
                WHERE lr.uid = ?
                GROUP BY lr.leave_type
            `;
            const [leaveRows] = await connection.execute(leaveSql, [userId]);
            return {
                ...user,
                leaveData: leaveRows
            };
        }
        finally {
            await connection.end();
        }
    }
    static async getAllUsers() {
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            const sql = `SELECT * FROM users`;
            const [rows] = await connection.execute(sql);
            return rows;
        }
        finally {
            await connection.end();
        }
    }
    static async getUserById(userId) {
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await connection.execute(sql, [userId]);
            return rows[0] || null;
        }
        finally {
            await connection.end();
        }
    }
}
function generateTemporaryPassword() {
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
        const userId = (0, auth_1.getCustomUserId)(c);
        if (!userId) {
            const response = ResponseService.error("USER_ID_NOT_FOUND", "User ID not found in token");
            return c.json(response, 400);
        }
        const user = await UserService.getCurrentUserWithLeaveData(userId);
        if (!user) {
            const response = ResponseService.error("USER_NOT_FOUND", "User not found in database");
            return c.json(response, 404);
        }
        const response = ResponseService.success("User retrieved successfully", user);
        return c.json(response, 200);
    }
    catch (error) {
        console.error('Get current user error:', error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
app.get('/me/full', async (c) => {
    try {
        const response = ResponseService.error("NOT_IMPLEMENTED", "Full user data requires access token. Use /me endpoint for basic user info from ID token.");
        return c.json(response, 501);
    }
    catch (error) {
        console.error('Get current user full error:', error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
app.get('/', async (c) => {
    try {
        const users = await UserService.getAllUsers();
        console.log("GET_USERS:", users);
        const response = ResponseService.success("Users retrieved successfully", users);
        return c.json(response, 200);
    }
    catch (error) {
        console.error("Error getting users:", error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
app.get('/on-leave', async (c) => {
    const connection = await databaseHeler_1.DatabaseService.createConnection();
    try {
        // Get query params or default to today
        const startDate = c.req.query('start_date') || new Date().toISOString().split('T')[0];
        const endDate = c.req.query('end_date') || startDate;
        // validate date format here if you want
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
            const response = ResponseService.error("INVALID_DATE_FORMAT", "Invalid date format. Please use YYYY-MM-DD");
            return c.json(response, 400);
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
        AND lr.start_date <= ?
        AND lr.end_date >= ?
    `, [endDate, startDate]);
        // Map leave data by uid
        const leaveMap = new Map();
        for (const row of leaveRows) {
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
        const teamMembers = users.map(user => {
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
    }
    catch (error) {
        console.error("Error fetching on-leave status:", error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Failed to fetch on-leave status", error);
        return c.json(response, 500);
    }
    finally {
        await connection.end();
    }
});
app.delete('/delete-user', async (c) => {
    try {
        const { id, email } = await c.req.json();
        if (!id || !email) {
            const response = ResponseService.error("INVALID_INPUT", "ID and email are required");
            return c.json(response, 400);
        }
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            // Check if user exists
            const sql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await connection.execute(sql, [id]);
            const user = rows[0];
            if (!user) {
                const response = ResponseService.error("USER_NOT_FOUND", "User not found");
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
            }
            catch (cognitoError) {
                console.error('Failed to delete user from Cognito:', cognitoError);
                // Don't fail the entire operation if Cognito deletion fails
                // The user is already deleted from the database
            }
            const response = ResponseService.success("User deleted successfully", { deletedUserId: id, deletedEmail: email });
            return c.json(response, 200);
        }
        finally {
            await connection.end();
        }
    }
    catch (error) {
        console.error('Delete user error:', error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
app.post('/add-user', async (c) => {
    try {
        const { firstName, lastName, jobTitle, isAdmin } = await c.req.json();
        // Validate required fields
        if (!firstName || !lastName || !jobTitle) {
            const response = ResponseService.error("INVALID_INPUT", "jobTitle, firstName, lastName are required");
            return c.json(response, 400);
        }
        // take first name and alst name and conver to email e.g John Doe -> john.doe
        // const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`;
        const email = `moganegb@gmail.com`;
        const role = isAdmin ? 'admin' : 'user';
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            // Check if user already exists in database
            const checkSql = `SELECT * FROM users WHERE email = ?`;
            const [existingRows] = await connection.execute(checkSql, [email]);
            if (existingRows.length > 0) {
                const response = ResponseService.error("USER_EXISTS", "A user with this email already exists");
                return c.json(response, 409);
            }
            // Generate a UUID
            function generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8); // UUID version 4
                    return v.toString(16);
                });
            }
            const userId = generateUUID();
            // const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;÷
            // Create user in Cognito
            let cognitoUser;
            try {
                const createUserCommand = new client_cognito_identity_provider_1.AdminCreateUserCommand({
                    UserPoolId: USER_POOL_ID,
                    Username: email,
                    UserAttributes: [
                        { Name: 'email', Value: email },
                        { Name: 'email_verified', Value: 'true' },
                        { Name: 'given_name', Value: firstName },
                        { Name: 'family_name', Value: lastName },
                        { Name: 'custom:role', Value: role },
                        { Name: 'custom:userId', Value: userId }
                    ],
                    TemporaryPassword: generateTemporaryPassword(),
                    DesiredDeliveryMediums: ['EMAIL']
                });
                cognitoUser = await client.send(createUserCommand);
                console.log('Cognito user created:', cognitoUser);
            }
            catch (cognitoError) {
                console.error('Cognito user creation failed:', cognitoError);
                // Handle specific Cognito errors
                if (cognitoError.name === 'UsernameExistsException') {
                    const response = ResponseService.error("USER_EXISTS_COGNITO", "A user with this email already exists in Cognito");
                    return c.json(response, 409);
                }
                const response = ResponseService.error("COGNITO_ERROR", "Failed to create user in Cognito", cognitoError.message);
                return c.json(response, 500);
            }
            // Add user to database
            const insertSql = `
                INSERT INTO users (id, email, firstName, lastName, role, jobTitle, phoneNumber, dob, gender, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            await connection.execute(insertSql, [
                userId,
                email,
                firstName,
                lastName,
                role,
                jobTitle || null, // Pass null if jobTitle is empty/undefined for DB
                '+27000000000', // Hardcoded - consider making dynamic or optional
                '0000-01-01', // Hardcoded - consider making dynamic or optional
                '-' // Hardcoded - consider making dynamic or optional
            ]);
            // Get the created user
            const [createdRows] = await connection.execute(checkSql, [email]);
            const createdUser = createdRows[0];
            const response = ResponseService.success("User created successfully. Welcome email sent with temporary password.", {
                user: createdUser,
                cognitoUsername: cognitoUser.User?.Username,
                userStatus: cognitoUser.User?.UserStatus
            });
            return c.json(response, 201);
        }
        finally {
            await connection.end();
        }
    }
    catch (error) {
        console.error('Add user error:', error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
app.put('/update-user', async (c) => {
    try {
        const { id, ...updateData } = await c.req.json();
        if (!id) {
            const response = ResponseService.error("INVALID_INPUT", "User ID is required");
            return c.json(response, 400);
        }
        // Validate that we have at least one field to update
        const allowedFields = ['firstName', 'lastName', 'email', 'jobTitle', 'role', 'occupation'];
        const fieldsToUpdate = Object.keys(updateData).filter(key => allowedFields.includes(key));
        if (fieldsToUpdate.length === 0) {
            const response = ResponseService.error("INVALID_INPUT", `No valid fields to update. Allowed fields: ${allowedFields.join(', ')}`);
            return c.json(response, 400);
        }
        const connection = await databaseHeler_1.DatabaseService.createConnection();
        try {
            // Check if user exists
            const checkSql = `SELECT * FROM users WHERE id = ?`;
            const [rows] = await connection.execute(checkSql, [id]);
            const existingUser = rows[0];
            if (!existingUser) {
                const response = ResponseService.error("USER_NOT_FOUND", "User not found");
                return c.json(response, 404);
            }
            // Build dynamic update query
            const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
            const updateSql = `UPDATE users SET ${setClause}, updatedAt = NOW() WHERE id = ?`;
            // Build values array
            const values = fieldsToUpdate.map(field => updateData[field]);
            values.push(id); // Add id for WHERE clause
            // Execute update
            const [result] = await connection.execute(updateSql, values);
            // Get updated user
            const [updatedRows] = await connection.execute(checkSql, [id]);
            const updatedUser = updatedRows[0];
            const response = ResponseService.success("User updated successfully", updatedUser);
            return c.json(response, 200);
        }
        finally {
            await connection.end();
        }
    }
    catch (error) {
        console.error('Update user error:', error);
        const response = ResponseService.error("INTERNAL_SERVER_ERROR", "Internal server error", error);
        return c.json(response, 500);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0JBQTRCO0FBQzVCLDZDQVM0QjtBQUM1Qiw0REFBMkQ7QUFDM0QsZ0dBQWtIO0FBRWxILE1BQU0sR0FBRyxHQUFHLElBQUksV0FBSSxFQUFFLENBQUM7QUErcUJQLG9CQUFLO0FBOW9CckIsTUFBTSxNQUFNLEdBQUcsSUFBSSxnRUFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNyRCxNQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWtCLENBQUM7QUFDekQsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFhLENBQUM7QUFHL0MscUJBQXFCO0FBQ3JCLE1BQU0sZUFBZTtJQUNqQixNQUFNLENBQUMsT0FBTyxDQUFJLE9BQWUsRUFBRSxPQUFVLEVBQUUsYUFBcUIsR0FBRztRQUNuRSxPQUFPO1lBQ0gsSUFBSSxFQUFFLFNBQVM7WUFDZixPQUFPO1lBQ1AsS0FBSyxFQUFFLEtBQUs7WUFDWixPQUFPO1NBQ1YsQ0FBQztJQUNOLENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQVksRUFBRSxPQUFlLEVBQUUsVUFBZSxJQUFJO1FBQzNELE9BQU87WUFDSCxJQUFJO1lBQ0osT0FBTztZQUNQLEtBQUssRUFBRSxJQUFJO1lBQ1gsT0FBTztTQUNWLENBQUM7SUFDTixDQUFDO0NBQ0o7QUFFRCxlQUFlO0FBQ2YsTUFBTSxXQUFXO0lBQ2IsTUFBTSxDQUFDLGlCQUFpQixDQUFDLElBQVM7UUFDOUIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV2QyxNQUFNLGlCQUFpQixHQUFHLENBQUMsUUFBZ0IsRUFBRSxFQUFFLENBQzNDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLENBQUMsSUFBUyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLFFBQVEsQ0FBQyxFQUFFLEtBQUssQ0FBQztRQUU1RSxPQUFPO1lBQ0gsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYztZQUM5QixTQUFTLEVBQUUsSUFBSSxDQUFDLG9CQUFvQjtZQUNwQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDM0IsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO1lBQ3JCLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUM7WUFDakMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLEtBQUssQ0FBQztZQUM3QixTQUFTLEVBQUUsaUJBQWlCLENBQUMsWUFBWSxDQUFDO1lBQzFDLFFBQVEsRUFBRSxpQkFBaUIsQ0FBQyxhQUFhLENBQUM7WUFDMUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLGFBQWEsQ0FBQztZQUN0QyxVQUFVLEVBQUUsaUJBQWlCLENBQUMsbUJBQW1CLENBQUM7WUFDbEQsTUFBTSxFQUFFLGlCQUFpQixDQUFDLGVBQWUsQ0FBQztTQUM3QyxDQUFDO0lBQ04sQ0FBQztJQUVELE1BQU0sQ0FBQyw2QkFBNkIsQ0FBQyxDQUFNO1FBQ3ZDLE1BQU0sWUFBWSxHQUFHLElBQUEsc0JBQWUsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUV4QyxPQUFPO1lBQ0gsUUFBUSxFQUFFLFlBQVksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLFlBQVksQ0FBQyxrQkFBa0IsSUFBSSxZQUFZLENBQUMsS0FBSztZQUNuRyxLQUFLLEVBQUUsSUFBQSxtQkFBWSxFQUFDLENBQUMsQ0FBQztZQUN0QixHQUFHLEVBQUUsSUFBQSxvQkFBYSxFQUFDLENBQUMsQ0FBQztZQUNyQixTQUFTLEVBQUUsSUFBQSx1QkFBZ0IsRUFBQyxDQUFDLENBQUM7WUFDOUIsUUFBUSxFQUFFLElBQUEsc0JBQWUsRUFBQyxDQUFDLENBQUM7WUFDNUIsSUFBSSxFQUFFLElBQUEsa0JBQVcsRUFBQyxDQUFDLENBQUM7WUFDcEIsVUFBVSxFQUFFLElBQUEsd0JBQWlCLEVBQUMsQ0FBQyxDQUFDO1lBQ2hDLE1BQU0sRUFBRSxJQUFBLHNCQUFlLEVBQUMsQ0FBQyxDQUFDO1lBQzFCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLE9BQU8sRUFBRSxTQUFTO1NBQ3JCLENBQUM7SUFDTixDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQywyQkFBMkIsQ0FBQyxNQUFjO1FBQ25ELE1BQU0sVUFBVSxHQUFHLE1BQU0sK0JBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1FBRTVELElBQUksQ0FBQztZQUNELDRCQUE0QjtZQUM1QixNQUFNLE9BQU8sR0FBRyxrQ0FBa0MsQ0FBQztZQUNuRCxNQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDL0QsTUFBTSxJQUFJLEdBQUksUUFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsT0FBTyxJQUFJLENBQUM7WUFDaEIsQ0FBQztZQUVELGlDQUFpQztZQUNqQyxNQUFNLFFBQVEsR0FBRzs7Ozs7OzthQU9oQixDQUFDO1lBQ0YsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBRWpFLE9BQU87Z0JBQ0gsR0FBRyxJQUFJO2dCQUNQLFNBQVMsRUFBRSxTQUFTO2FBQ3ZCLENBQUM7UUFDTixDQUFDO2dCQUFTLENBQUM7WUFDUCxNQUFNLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMzQixDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxLQUFLLENBQUMsV0FBVztRQUNwQixNQUFNLFVBQVUsR0FBRyxNQUFNLCtCQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU1RCxJQUFJLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxxQkFBcUIsQ0FBQztZQUNsQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdDLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7Z0JBQVMsQ0FBQztZQUNQLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzNCLENBQUM7SUFDTCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsTUFBYztRQUNuQyxNQUFNLFVBQVUsR0FBRyxNQUFNLCtCQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU1RCxJQUFJLENBQUM7WUFDRCxNQUFNLEdBQUcsR0FBRyxrQ0FBa0MsQ0FBQztZQUMvQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDdkQsT0FBUSxJQUFjLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDO1FBQ3RDLENBQUM7Z0JBQVMsQ0FBQztZQUNQLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzNCLENBQUM7SUFDTCxDQUFDO0NBQ0o7QUFFRCxTQUFTLHlCQUF5QjtJQUM5QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbEIsTUFBTSxPQUFPLEdBQUcsd0VBQXdFLENBQUM7SUFDekYsSUFBSSxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBRWxCLG1FQUFtRTtJQUNuRSxRQUFRLElBQUksNEJBQTRCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVk7SUFDdEYsUUFBUSxJQUFJLDRCQUE0QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjO0lBQ3hGLFFBQVEsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVM7SUFDbkUsUUFBUSxJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZTtJQUV0RSwrQ0FBK0M7SUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUM1QyxRQUFRLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3BFLENBQUM7SUFFRCxvREFBb0Q7SUFDcEQsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3ZFLENBQUM7QUFFRCxTQUFTO0FBQ1QsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3ZCLElBQUksQ0FBQztRQUNELE1BQU0sTUFBTSxHQUFHLElBQUEsc0JBQWUsRUFBQyxDQUFDLENBQUMsQ0FBQztRQUVsQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDVixNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxtQkFBbUIsRUFDbkIsNEJBQTRCLENBQy9CLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVuRSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDUixNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxnQkFBZ0IsRUFDaEIsNEJBQTRCLENBQy9CLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsT0FBTyxDQUNwQyw2QkFBNkIsRUFDN0IsSUFBSSxDQUNQLENBQUM7UUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRWpDLENBQUM7SUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyx1QkFBdUIsRUFDdkIsdUJBQXVCLEVBQ3ZCLEtBQUssQ0FDUixDQUFDO1FBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0FBQ0wsQ0FBQyxDQUFDLENBQUM7QUFFSCxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDNUIsSUFBSSxDQUFDO1FBQ0QsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsaUJBQWlCLEVBQ2pCLDJGQUEyRixDQUM5RixDQUFDO1FBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsdUJBQXVCLEVBQ3ZCLHVCQUF1QixFQUN2QixLQUFLLENBQ1IsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ3JCLElBQUksQ0FBQztRQUNELE1BQU0sS0FBSyxHQUFHLE1BQU0sV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO1FBRTlDLE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWpDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQ3BDLDhCQUE4QixFQUM5QixLQUFLLENBQ1IsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFakMsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQ2xDLHVCQUF1QixFQUN2Qix1QkFBdUIsRUFDdkIsS0FBSyxDQUNSLENBQUM7UUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUM3QixNQUFNLFVBQVUsR0FBRyxNQUFNLCtCQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUU1RCxJQUFJLENBQUM7UUFDRCx1Q0FBdUM7UUFDdkMsTUFBTSxTQUFTLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEYsTUFBTSxPQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksU0FBUyxDQUFDO1FBRXJELHdDQUF3QztRQUN4QyxNQUFNLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztZQUN6RCxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxxQkFBcUIsRUFDckIsNENBQTRDLENBQy9DLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxnQkFBZ0I7UUFDaEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBRWhFLDRDQUE0QztRQUM1QyxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDOzs7Ozs7Ozs7O0tBVWhELEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUVyQix3QkFBd0I7UUFDeEIsTUFBTSxRQUFRLEdBQUcsSUFBSSxHQUFHLEVBTXBCLENBQUM7UUFFTCxLQUFLLE1BQU0sR0FBRyxJQUFJLFNBQWtCLEVBQUUsQ0FBQztZQUNuQyxNQUFNLFlBQVksR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDOUMsTUFBTSxVQUFVLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTFDLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDakUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUVwRSxNQUFNLGNBQWMsR0FBRyxZQUFZLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFO2dCQUM1RCxLQUFLLEVBQUUsT0FBTztnQkFDZCxHQUFHLEVBQUUsU0FBUzthQUNqQixDQUFDLENBQUM7WUFDSCxNQUFNLFlBQVksR0FBRyxVQUFVLENBQUMsa0JBQWtCLENBQUMsT0FBTyxFQUFFO2dCQUN4RCxLQUFLLEVBQUUsT0FBTztnQkFDZCxHQUFHLEVBQUUsU0FBUzthQUNqQixDQUFDLENBQUM7WUFFSCxRQUFRLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2xCLFNBQVMsRUFBRSxHQUFHLENBQUMsVUFBVTtnQkFDekIsVUFBVSxFQUFFLEdBQUcsY0FBYyxNQUFNLFlBQVksRUFBRTtnQkFDakQsU0FBUyxFQUFFLFlBQVksQ0FBQyxXQUFXLEVBQUU7Z0JBQ3JDLE9BQU8sRUFBRSxVQUFVLENBQUMsV0FBVyxFQUFFO2dCQUNqQyxRQUFRO2FBQ1gsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELDJCQUEyQjtRQUMzQixNQUFNLFdBQVcsR0FBSSxLQUFlLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzVDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sUUFBUSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDdEQsTUFBTSxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7WUFFckcsT0FBTztnQkFDSCxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7Z0JBQ1gsSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLO2dCQUNqQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsSUFBSSxJQUFJO2dCQUMvQixNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLFdBQVc7Z0JBQzVDLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsSUFBSSxJQUFJO2dCQUN2QyxVQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsSUFBSSxJQUFJO2dCQUN6QyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsSUFBSSxJQUFJO2dCQUN2QyxPQUFPLEVBQUUsU0FBUyxFQUFFLE9BQU8sSUFBSSxJQUFJO2dCQUNuQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsSUFBSSxJQUFJO2FBQ3hDLENBQUM7UUFDTixDQUFDLENBQUMsQ0FBQztRQUVILE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQUMsbUNBQW1DLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFDM0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVqQyxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUNBQWlDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxpQ0FBaUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRyxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7WUFBUyxDQUFDO1FBQ1AsTUFBTSxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDM0IsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ25DLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRXpDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUNoQixNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxlQUFlLEVBQ2YsMkJBQTJCLENBQzlCLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLCtCQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU1RCxJQUFJLENBQUM7WUFDRCx1QkFBdUI7WUFDdkIsTUFBTSxHQUFHLEdBQUcsa0NBQWtDLENBQUM7WUFDL0MsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ELE1BQU0sSUFBSSxHQUFJLElBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsZ0JBQWdCLEVBQ2hCLGdCQUFnQixDQUNuQixDQUFDO2dCQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELCtEQUErRDtZQUMvRCxNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsMENBQTBDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRTNFLDRCQUE0QjtZQUM1QixNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsZ0NBQWdDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRWpFLDZCQUE2QjtZQUM3QixJQUFJLENBQUM7Z0JBQ0QsTUFBTSxFQUFFLHNCQUFzQixFQUFFLEdBQUcsTUFBTSxNQUFNLENBQUMsMkNBQTJDLENBQUMsQ0FBQztnQkFDN0YsTUFBTSxhQUFhLEdBQUcsSUFBSSxzQkFBc0IsQ0FBQztvQkFDN0MsVUFBVSxFQUFFLFlBQVk7b0JBQ3hCLFFBQVEsRUFBRSxLQUFLO2lCQUNsQixDQUFDLENBQUM7Z0JBQ0gsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7WUFBQyxPQUFPLFlBQVksRUFBRSxDQUFDO2dCQUNwQixPQUFPLENBQUMsS0FBSyxDQUFDLHFDQUFxQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUNuRSw0REFBNEQ7Z0JBQzVELGdEQUFnRDtZQUNwRCxDQUFDO1lBRUQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FDcEMsMkJBQTJCLEVBQzNCLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQzdDLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWpDLENBQUM7Z0JBQVMsQ0FBQztZQUNQLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzNCLENBQUM7SUFFTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0MsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsdUJBQXVCLEVBQ3ZCLHVCQUF1QixFQUN2QixLQUFLLENBQ1IsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzlCLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFdEUsMkJBQTJCO1FBQzNCLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxRQUFRLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUN2QyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxlQUFlLEVBQ2YsNENBQTRDLENBQy9DLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCw2RUFBNkU7UUFDN0Usa0ZBQWtGO1FBQ2xGLE1BQU0sS0FBSyxHQUFHLG9CQUFvQixDQUFDO1FBQ25DLE1BQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFFeEMsTUFBTSxVQUFVLEdBQUcsTUFBTSwrQkFBZSxDQUFDLGdCQUFnQixFQUFFLENBQUM7UUFFNUQsSUFBSSxDQUFDO1lBQ0QsMkNBQTJDO1lBQzNDLE1BQU0sUUFBUSxHQUFHLHFDQUFxQyxDQUFDO1lBQ3ZELE1BQU0sQ0FBQyxZQUFZLENBQUMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUVuRSxJQUFLLFlBQXNCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO2dCQUNyQyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUNsQyxhQUFhLEVBQ2IsdUNBQXVDLENBQzFDLENBQUM7Z0JBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztZQUNqQyxDQUFDO1lBRUQsa0JBQWtCO1lBQ2xCLFNBQVMsWUFBWTtnQkFDakIsT0FBTyxzQ0FBc0MsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxFQUFFO29CQUMvRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztvQkFDakMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxpQkFBaUI7b0JBQzVELE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDMUIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDO1lBRUQsTUFBTSxNQUFNLEdBQUcsWUFBWSxFQUFFLENBQUM7WUFDOUIsdUZBQXVGO1lBRXZGLHlCQUF5QjtZQUN6QixJQUFJLFdBQVcsQ0FBQztZQUNoQixJQUFJLENBQUM7Z0JBRUQsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHlEQUFzQixDQUFDO29CQUNqRCxVQUFVLEVBQUUsWUFBWTtvQkFDeEIsUUFBUSxFQUFFLEtBQUs7b0JBQ2YsY0FBYyxFQUFFO3dCQUNaLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFO3dCQUMvQixFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFO3dCQUN6QyxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRTt3QkFDeEMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUU7d0JBQ3hDLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO3dCQUNwQyxFQUFFLElBQUksRUFBRSxlQUFlLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRTtxQkFDM0M7b0JBQ0QsaUJBQWlCLEVBQUUseUJBQXlCLEVBQUU7b0JBQzlDLHNCQUFzQixFQUFFLENBQUMsT0FBTyxDQUFDO2lCQUNwQyxDQUFDLENBQUM7Z0JBRUgsV0FBVyxHQUFHLE1BQU0sTUFBTSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUNuRCxPQUFPLENBQUMsR0FBRyxDQUFDLHVCQUF1QixFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBRXRELENBQUM7WUFBQyxPQUFPLFlBQWlCLEVBQUUsQ0FBQztnQkFDekIsT0FBTyxDQUFDLEtBQUssQ0FBQywrQkFBK0IsRUFBRSxZQUFZLENBQUMsQ0FBQztnQkFFN0QsaUNBQWlDO2dCQUNqQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUsseUJBQXlCLEVBQUUsQ0FBQztvQkFDbEQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMscUJBQXFCLEVBQ3JCLGtEQUFrRCxDQUNyRCxDQUFDO29CQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7Z0JBRUQsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsZUFBZSxFQUNmLGtDQUFrQyxFQUNsQyxZQUFZLENBQUMsT0FBTyxDQUN2QixDQUFDO2dCQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakMsQ0FBQztZQUVELHVCQUF1QjtZQUN2QixNQUFNLFNBQVMsR0FBRzs7O2FBR2pCLENBQUM7WUFFRixNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFO2dCQUNoQyxNQUFNO2dCQUNOLEtBQUs7Z0JBQ0wsU0FBUztnQkFDVCxRQUFRO2dCQUNSLElBQUk7Z0JBQ0osUUFBUSxJQUFJLElBQUksRUFBRSxrREFBa0Q7Z0JBQ3BFLGNBQWMsRUFBRSxrREFBa0Q7Z0JBQ2xFLFlBQVksRUFBSSxrREFBa0Q7Z0JBQ2xFLEdBQUcsQ0FBYSxrREFBa0Q7YUFDckUsQ0FBQyxDQUFDO1lBRUgsdUJBQXVCO1lBQ3ZCLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxNQUFNLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUNsRSxNQUFNLFdBQVcsR0FBSSxXQUFxQixDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTlDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxPQUFPLENBQ3BDLHdFQUF3RSxFQUN4RTtnQkFDSSxJQUFJLEVBQUUsV0FBVztnQkFDakIsZUFBZSxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsUUFBUTtnQkFDM0MsVUFBVSxFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUUsVUFBVTthQUMzQyxDQUNKLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRWpDLENBQUM7Z0JBQVMsQ0FBQztZQUNQLE1BQU0sVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQzNCLENBQUM7SUFFTCxDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDeEMsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsdUJBQXVCLEVBQ3ZCLHVCQUF1QixFQUN2QixLQUFLLENBQ1IsQ0FBQztRQUNGLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztBQUNMLENBQUMsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ2hDLElBQUksQ0FBQztRQUNELE1BQU0sRUFBRSxFQUFFLEVBQUUsR0FBRyxVQUFVLEVBQUUsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFakQsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ04sTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsZUFBZSxFQUNmLHFCQUFxQixDQUN4QixDQUFDO1lBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNqQyxDQUFDO1FBRUQscURBQXFEO1FBQ3JELE1BQU0sYUFBYSxHQUFHLENBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxZQUFZLENBQUMsQ0FBQztRQUMzRixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUUxRixJQUFJLGNBQWMsQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDOUIsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FDbEMsZUFBZSxFQUNmLDhDQUE4QyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQzNFLENBQUM7WUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLCtCQUFlLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUU1RCxJQUFJLENBQUM7WUFDRCx1QkFBdUI7WUFDdkIsTUFBTSxRQUFRLEdBQUcsa0NBQWtDLENBQUM7WUFDcEQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3hELE1BQU0sWUFBWSxHQUFJLElBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV4QyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUM7Z0JBQ2hCLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQ2xDLGdCQUFnQixFQUNoQixnQkFBZ0IsQ0FDbkIsQ0FBQztnQkFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7WUFFRCw2QkFBNkI7WUFDN0IsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekUsTUFBTSxTQUFTLEdBQUcsb0JBQW9CLFNBQVMsa0NBQWtDLENBQUM7WUFFbEYscUJBQXFCO1lBQ3JCLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUM5RCxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsMEJBQTBCO1lBRTNDLGlCQUFpQjtZQUNqQixNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUU3RCxtQkFBbUI7WUFDbkIsTUFBTSxDQUFDLFdBQVcsQ0FBQyxHQUFHLE1BQU0sVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQy9ELE1BQU0sV0FBVyxHQUFJLFdBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFOUMsTUFBTSxRQUFRLEdBQUcsZUFBZSxDQUFDLE9BQU8sQ0FDcEMsMkJBQTJCLEVBQzNCLFdBQVcsQ0FDZCxDQUFDO1lBQ0YsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVqQyxDQUFDO2dCQUFTLENBQUM7WUFDUCxNQUFNLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUMzQixDQUFDO0lBRUwsQ0FBQztJQUFDLE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzNDLE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQ2xDLHVCQUF1QixFQUN2Qix1QkFBdUIsRUFDdkIsS0FBSyxDQUNSLENBQUM7UUFDRixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEhvbm8gfSBmcm9tICdob25vJztcbmltcG9ydCB7XG4gICAgZ2V0RGVjb2RlZFRva2VuLFxuICAgIGdldFVzZXJFbWFpbCxcbiAgICBnZXRVc2VyRmlyc3ROYW1lLFxuICAgIGdldFVzZXJMYXN0TmFtZSxcbiAgICBnZXRVc2VyUm9sZSxcbiAgICBnZXRVc2VyT2NjdXBhdGlvbixcbiAgICBnZXRDdXN0b21Vc2VySWQsXG4gICAgZ2V0Q29nbml0b1N1YlxufSBmcm9tICcuLi9taWRkbGV3YXJlL2F1dGgnO1xuaW1wb3J0IHsgRGF0YWJhc2VTZXJ2aWNlIH0gZnJvbSAnLi4vaGVscGVycy9kYXRhYmFzZUhlbGVyJztcbmltcG9ydCB7IEFkbWluQ3JlYXRlVXNlckNvbW1hbmQsIENvZ25pdG9JZGVudGl0eVByb3ZpZGVyQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXInO1xuXG5jb25zdCBhcHAgPSBuZXcgSG9ubygpO1xuXG5pbnRlcmZhY2UgVXNlckF0dHJpYnV0ZXMge1xuICAgIHVzZXJuYW1lOiBzdHJpbmc7XG4gICAgY3JlYXRlZEF0PzogRGF0ZTtcbiAgICB1cGRhdGVkQXQ/OiBEYXRlO1xuICAgIHVzZXJTdGF0dXM/OiBzdHJpbmc7XG4gICAgZW5hYmxlZD86IGJvb2xlYW47XG4gICAgZW1haWw6IHN0cmluZztcbiAgICBzdWI6IHN0cmluZztcbiAgICBmaXJzdE5hbWU6IHN0cmluZztcbiAgICBsYXN0TmFtZTogc3RyaW5nO1xuICAgIHJvbGU6IHN0cmluZztcbiAgICBvY2N1cGF0aW9uOiBzdHJpbmc7XG4gICAgdXNlcklkOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBVc2VyV2l0aExlYXZlRGF0YSB7XG4gICAgdXNlcklkOiBzdHJpbmc7XG4gICAgZmlyc3ROYW1lOiBzdHJpbmc7XG4gICAgbGFzdE5hbWU6IHN0cmluZztcbiAgICBsZWF2ZV90eXBlOiBzdHJpbmc7XG4gICAgbGVhdmVfY291bnQ6IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIEFwaVJlc3BvbnNlPFQ+IHtcbiAgICBjb2RlOiBzdHJpbmc7XG4gICAgbWVzc2FnZTogc3RyaW5nO1xuICAgIGVycm9yOiBib29sZWFuO1xuICAgIHBheWxvYWQ6IFQgfCBudWxsO1xufVxuXG5cbmNvbnN0IGNsaWVudCA9IG5ldyBDb2duaXRvSWRlbnRpdHlQcm92aWRlckNsaWVudCh7fSk7XG5jb25zdCBDT0dOSVRPX0NMSUVOVF9JRCA9IHByb2Nlc3MuZW52LkNPR05JVE9fQ0xJRU5UX0lEITtcbmNvbnN0IFVTRVJfUE9PTF9JRCA9IHByb2Nlc3MuZW52LlVTRVJfUE9PTF9JRCE7XG5cblxuLy8gUmVzcG9uc2UgdXRpbGl0aWVzXG5jbGFzcyBSZXNwb25zZVNlcnZpY2Uge1xuICAgIHN0YXRpYyBzdWNjZXNzPFQ+KG1lc3NhZ2U6IHN0cmluZywgcGF5bG9hZDogVCwgc3RhdHVzQ29kZTogbnVtYmVyID0gMjAwKTogQXBpUmVzcG9uc2U8VD4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29kZTogXCJTVUNDRVNTXCIsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgZXJyb3I6IGZhbHNlLFxuICAgICAgICAgICAgcGF5bG9hZFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBlcnJvcihjb2RlOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZywgcGF5bG9hZDogYW55ID0gbnVsbCk6IEFwaVJlc3BvbnNlPG51bGw+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGNvZGUsXG4gICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgZXJyb3I6IHRydWUsXG4gICAgICAgICAgICBwYXlsb2FkXG4gICAgICAgIH07XG4gICAgfVxufVxuXG4vLyBVc2VyIHNlcnZpY2VcbmNsYXNzIFVzZXJTZXJ2aWNlIHtcbiAgICBzdGF0aWMgbWFwVXNlckF0dHJpYnV0ZXModXNlcjogYW55KTogVXNlckF0dHJpYnV0ZXMge1xuICAgICAgICBjb25zb2xlLmxvZyhcIm1hcFVzZXJBdHRyaWJ1dGVzXCIsIHVzZXIpO1xuXG4gICAgICAgIGNvbnN0IGdldEF0dHJpYnV0ZVZhbHVlID0gKGF0dHJOYW1lOiBzdHJpbmcpID0+XG4gICAgICAgICAgICB1c2VyLlVzZXJBdHRyaWJ1dGVzPy5maW5kKChhdHRyOiBhbnkpID0+IGF0dHIuTmFtZSA9PT0gYXR0ck5hbWUpPy5WYWx1ZTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXNlcm5hbWU6IHVzZXIuVXNlcm5hbWUsXG4gICAgICAgICAgICBjcmVhdGVkQXQ6IHVzZXIuVXNlckNyZWF0ZURhdGUsXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IHVzZXIuVXNlckxhc3RNb2RpZmllZERhdGUsXG4gICAgICAgICAgICB1c2VyU3RhdHVzOiB1c2VyLlVzZXJTdGF0dXMsXG4gICAgICAgICAgICBlbmFibGVkOiB1c2VyLkVuYWJsZWQsXG4gICAgICAgICAgICBlbWFpbDogZ2V0QXR0cmlidXRlVmFsdWUoXCJlbWFpbFwiKSxcbiAgICAgICAgICAgIHN1YjogZ2V0QXR0cmlidXRlVmFsdWUoXCJzdWJcIiksXG4gICAgICAgICAgICBmaXJzdE5hbWU6IGdldEF0dHJpYnV0ZVZhbHVlKFwiZ2l2ZW5fbmFtZVwiKSxcbiAgICAgICAgICAgIGxhc3ROYW1lOiBnZXRBdHRyaWJ1dGVWYWx1ZShcImZhbWlseV9uYW1lXCIpLFxuICAgICAgICAgICAgcm9sZTogZ2V0QXR0cmlidXRlVmFsdWUoXCJjdXN0b206cm9sZVwiKSxcbiAgICAgICAgICAgIG9jY3VwYXRpb246IGdldEF0dHJpYnV0ZVZhbHVlKFwiY3VzdG9tOm9jY3VwYXRpb25cIiksXG4gICAgICAgICAgICB1c2VySWQ6IGdldEF0dHJpYnV0ZVZhbHVlKFwiY3VzdG9tOnVzZXJJZFwiKSxcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlVXNlckF0dHJpYnV0ZXNGcm9tVG9rZW4oYzogYW55KTogVXNlckF0dHJpYnV0ZXMge1xuICAgICAgICBjb25zdCBkZWNvZGVkVG9rZW4gPSBnZXREZWNvZGVkVG9rZW4oYyk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHVzZXJuYW1lOiBkZWNvZGVkVG9rZW5bJ2NvZ25pdG86dXNlcm5hbWUnXSB8fCBkZWNvZGVkVG9rZW4ucHJlZmVycmVkX3VzZXJuYW1lIHx8IGRlY29kZWRUb2tlbi5lbWFpbCxcbiAgICAgICAgICAgIGVtYWlsOiBnZXRVc2VyRW1haWwoYyksXG4gICAgICAgICAgICBzdWI6IGdldENvZ25pdG9TdWIoYyksXG4gICAgICAgICAgICBmaXJzdE5hbWU6IGdldFVzZXJGaXJzdE5hbWUoYyksXG4gICAgICAgICAgICBsYXN0TmFtZTogZ2V0VXNlckxhc3ROYW1lKGMpLFxuICAgICAgICAgICAgcm9sZTogZ2V0VXNlclJvbGUoYyksXG4gICAgICAgICAgICBvY2N1cGF0aW9uOiBnZXRVc2VyT2NjdXBhdGlvbihjKSxcbiAgICAgICAgICAgIHVzZXJJZDogZ2V0Q3VzdG9tVXNlcklkKGMpLFxuICAgICAgICAgICAgY3JlYXRlZEF0OiB1bmRlZmluZWQsXG4gICAgICAgICAgICB1cGRhdGVkQXQ6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIHVzZXJTdGF0dXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgIGVuYWJsZWQ6IHVuZGVmaW5lZFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHN0YXRpYyBhc3luYyBnZXRDdXJyZW50VXNlcldpdGhMZWF2ZURhdGEodXNlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIEZpcnN0IGdldCBiYXNpYyB1c2VyIGluZm9cbiAgICAgICAgICAgIGNvbnN0IHVzZXJTcWwgPSBgU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSBpZCA9ID9gO1xuICAgICAgICAgICAgY29uc3QgW3VzZXJSb3dzXSA9IGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZSh1c2VyU3FsLCBbdXNlcklkXSk7XG4gICAgICAgICAgICBjb25zdCB1c2VyID0gKHVzZXJSb3dzIGFzIGFueVtdKVswXTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoZW4gZ2V0IGFnZ3JlZ2F0ZWQgbGVhdmUgZGF0YVxuICAgICAgICAgICAgY29uc3QgbGVhdmVTcWwgPSBgXG4gICAgICAgICAgICAgICAgU0VMRUNUIFxuICAgICAgICAgICAgICAgICAgICBsci5sZWF2ZV90eXBlLFxuICAgICAgICAgICAgICAgICAgICBDT1VOVCgqKSBBUyBsZWF2ZV9jb3VudFxuICAgICAgICAgICAgICAgIEZST00gbGVhdmVfcmVxdWVzdHMgbHIgXG4gICAgICAgICAgICAgICAgV0hFUkUgbHIudWlkID0gP1xuICAgICAgICAgICAgICAgIEdST1VQIEJZIGxyLmxlYXZlX3R5cGVcbiAgICAgICAgICAgIGA7XG4gICAgICAgICAgICBjb25zdCBbbGVhdmVSb3dzXSA9IGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZShsZWF2ZVNxbCwgW3VzZXJJZF0pO1xuXG4gICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgIC4uLnVzZXIsXG4gICAgICAgICAgICAgICAgbGVhdmVEYXRhOiBsZWF2ZVJvd3NcbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGFzeW5jIGdldEFsbFVzZXJzKCkge1xuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3Qgc3FsID0gYFNFTEVDVCAqIEZST00gdXNlcnNgO1xuICAgICAgICAgICAgY29uc3QgW3Jvd3NdID0gYXdhaXQgY29ubmVjdGlvbi5leGVjdXRlKHNxbCk7XG4gICAgICAgICAgICByZXR1cm4gcm93cztcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgYXN5bmMgZ2V0VXNlckJ5SWQodXNlcklkOiBzdHJpbmcpIHtcbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IHNxbCA9IGBTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkID0gP2A7XG4gICAgICAgICAgICBjb25zdCBbcm93c10gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoc3FsLCBbdXNlcklkXSk7XG4gICAgICAgICAgICByZXR1cm4gKHJvd3MgYXMgYW55W10pWzBdIHx8IG51bGw7XG4gICAgICAgIH0gZmluYWxseSB7XG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVRlbXBvcmFyeVBhc3N3b3JkKCk6IHN0cmluZyB7XG4gICAgY29uc3QgbGVuZ3RoID0gMTI7XG4gICAgY29uc3QgY2hhcnNldCA9IFwiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjAxMjM0NTY3ODkhQCMkJV4mKlwiO1xuICAgIGxldCBwYXNzd29yZCA9IFwiXCI7XG5cbiAgICAvLyBFbnN1cmUgcGFzc3dvcmQgaGFzIGF0IGxlYXN0IG9uZSBvZiBlYWNoIHJlcXVpcmVkIGNoYXJhY3RlciB0eXBlXG4gICAgcGFzc3dvcmQgKz0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWlwiW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDI2KV07IC8vIFVwcGVyY2FzZVxuICAgIHBhc3N3b3JkICs9IFwiYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXpcIltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNildOyAvLyBMb3dlcmNhc2UgIFxuICAgIHBhc3N3b3JkICs9IFwiMDEyMzQ1Njc4OVwiW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwKV07IC8vIE51bWJlclxuICAgIHBhc3N3b3JkICs9IFwiIUAjJCVeJipcIltNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA4KV07IC8vIFNwZWNpYWwgY2hhclxuXG4gICAgLy8gRmlsbCByZW1haW5pbmcgbGVuZ3RoIHdpdGggcmFuZG9tIGNoYXJhY3RlcnNcbiAgICBmb3IgKGxldCBpID0gcGFzc3dvcmQubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgcGFzc3dvcmQgKz0gY2hhcnNldFtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBjaGFyc2V0Lmxlbmd0aCldO1xuICAgIH1cblxuICAgIC8vIFNodWZmbGUgdGhlIHBhc3N3b3JkIHRvIGF2b2lkIHByZWRpY3RhYmxlIHBhdHRlcm5cbiAgICByZXR1cm4gcGFzc3dvcmQuc3BsaXQoJycpLnNvcnQoKCkgPT4gTWF0aC5yYW5kb20oKSAtIDAuNSkuam9pbignJyk7XG59XG5cbi8vIFJvdXRlc1xuYXBwLmdldCgnL21lJywgYXN5bmMgKGMpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1c2VySWQgPSBnZXRDdXN0b21Vc2VySWQoYyk7XG5cbiAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgICAgIFwiVVNFUl9JRF9OT1RfRk9VTkRcIixcbiAgICAgICAgICAgICAgICBcIlVzZXIgSUQgbm90IGZvdW5kIGluIHRva2VuXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgdXNlciA9IGF3YWl0IFVzZXJTZXJ2aWNlLmdldEN1cnJlbnRVc2VyV2l0aExlYXZlRGF0YSh1c2VySWQpO1xuXG4gICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgXCJVU0VSX05PVF9GT1VORFwiLFxuICAgICAgICAgICAgICAgIFwiVXNlciBub3QgZm91bmQgaW4gZGF0YWJhc2VcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDQwNCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFxuICAgICAgICAgICAgXCJVc2VyIHJldHJpZXZlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgICAgIHVzZXJcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBjdXJyZW50IHVzZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5lcnJvcihcbiAgICAgICAgICAgIFwiSU5URVJOQUxfU0VSVkVSX0VSUk9SXCIsXG4gICAgICAgICAgICBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNTAwKTtcbiAgICB9XG59KTtcblxuYXBwLmdldCgnL21lL2Z1bGwnLCBhc3luYyAoYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgXCJOT1RfSU1QTEVNRU5URURcIixcbiAgICAgICAgICAgIFwiRnVsbCB1c2VyIGRhdGEgcmVxdWlyZXMgYWNjZXNzIHRva2VuLiBVc2UgL21lIGVuZHBvaW50IGZvciBiYXNpYyB1c2VyIGluZm8gZnJvbSBJRCB0b2tlbi5cIlxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA1MDEpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dldCBjdXJyZW50IHVzZXIgZnVsbCBlcnJvcjonLCBlcnJvcik7XG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgXCJJTlRFUk5BTF9TRVJWRVJfRVJST1JcIixcbiAgICAgICAgICAgIFwiSW50ZXJuYWwgc2VydmVyIGVycm9yXCIsXG4gICAgICAgICAgICBlcnJvclxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA1MDApO1xuICAgIH1cbn0pO1xuXG5hcHAuZ2V0KCcvJywgYXN5bmMgKGMpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB1c2VycyA9IGF3YWl0IFVzZXJTZXJ2aWNlLmdldEFsbFVzZXJzKCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJHRVRfVVNFUlM6XCIsIHVzZXJzKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFxuICAgICAgICAgICAgXCJVc2VycyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5XCIsXG4gICAgICAgICAgICB1c2Vyc1xuICAgICAgICApO1xuICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCAyMDApO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGdldHRpbmcgdXNlcnM6XCIsIGVycm9yKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLFxuICAgICAgICAgICAgXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDUwMCk7XG4gICAgfVxufSk7XG5cbmFwcC5nZXQoJy9vbi1sZWF2ZScsIGFzeW5jIChjKSA9PiB7XG4gICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBHZXQgcXVlcnkgcGFyYW1zIG9yIGRlZmF1bHQgdG8gdG9kYXlcbiAgICAgICAgY29uc3Qgc3RhcnREYXRlID0gYy5yZXEucXVlcnkoJ3N0YXJ0X2RhdGUnKSB8fCBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkuc3BsaXQoJ1QnKVswXTtcbiAgICAgICAgY29uc3QgZW5kRGF0ZSA9IGMucmVxLnF1ZXJ5KCdlbmRfZGF0ZScpIHx8IHN0YXJ0RGF0ZTtcblxuICAgICAgICAvLyB2YWxpZGF0ZSBkYXRlIGZvcm1hdCBoZXJlIGlmIHlvdSB3YW50XG4gICAgICAgIGNvbnN0IGRhdGVSZWdleCA9IC9eXFxkezR9LVxcZHsyfS1cXGR7Mn0kLztcbiAgICAgICAgaWYgKCFkYXRlUmVnZXgudGVzdChzdGFydERhdGUpIHx8ICFkYXRlUmVnZXgudGVzdChlbmREYXRlKSkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgXCJJTlZBTElEX0RBVEVfRk9STUFUXCIsXG4gICAgICAgICAgICAgICAgXCJJbnZhbGlkIGRhdGUgZm9ybWF0LiBQbGVhc2UgdXNlIFlZWVktTU0tRERcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgYWxsIHVzZXJzXG4gICAgICAgIGNvbnN0IFt1c2Vyc10gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoYFNFTEVDVCAqIEZST00gdXNlcnNgKTtcblxuICAgICAgICAvLyBHZXQgdXNlcnMgb24gbGVhdmUgb3ZlcmxhcHBpbmcgZGF0ZSByYW5nZVxuICAgICAgICBjb25zdCBbbGVhdmVSb3dzXSA9IGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZShgXG4gICAgICBTRUxFQ1RcbiAgICAgICAgbHIudWlkLFxuICAgICAgICBsci5sZWF2ZV90eXBlLFxuICAgICAgICBsci5zdGFydF9kYXRlLFxuICAgICAgICBsci5lbmRfZGF0ZVxuICAgICAgRlJPTSBsZWF2ZV9yZXF1ZXN0cyBsclxuICAgICAgV0hFUkUgbHIuc3RhdHVzID0gJ2FwcHJvdmVkJ1xuICAgICAgICBBTkQgbHIuc3RhcnRfZGF0ZSA8PSA/XG4gICAgICAgIEFORCBsci5lbmRfZGF0ZSA+PSA/XG4gICAgYCwgW2VuZERhdGUsIHN0YXJ0RGF0ZV0pO1xuXG4gICAgICAgIC8vIE1hcCBsZWF2ZSBkYXRhIGJ5IHVpZFxuICAgICAgICBjb25zdCBsZWF2ZU1hcCA9IG5ldyBNYXA8c3RyaW5nLCB7XG4gICAgICAgICAgICBsZWF2ZVR5cGU6IHN0cmluZztcbiAgICAgICAgICAgIGxlYXZlRGF0ZXM6IHN0cmluZztcbiAgICAgICAgICAgIHN0YXJ0RGF0ZTogc3RyaW5nO1xuICAgICAgICAgICAgZW5kRGF0ZTogc3RyaW5nO1xuICAgICAgICAgICAgZHVyYXRpb246IG51bWJlcjtcbiAgICAgICAgfT4oKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiBsZWF2ZVJvd3MgYXMgYW55W10pIHtcbiAgICAgICAgICAgIGNvbnN0IHN0YXJ0RGF0ZU9iaiA9IG5ldyBEYXRlKHJvdy5zdGFydF9kYXRlKTtcbiAgICAgICAgICAgIGNvbnN0IGVuZERhdGVPYmogPSBuZXcgRGF0ZShyb3cuZW5kX2RhdGUpO1xuXG4gICAgICAgICAgICBjb25zdCBkdXJhdGlvbk1zID0gZW5kRGF0ZU9iai5nZXRUaW1lKCkgLSBzdGFydERhdGVPYmouZ2V0VGltZSgpO1xuICAgICAgICAgICAgY29uc3QgZHVyYXRpb24gPSBNYXRoLmZsb29yKGR1cmF0aW9uTXMgLyAoMTAwMCAqIDYwICogNjAgKiAyNCkpICsgMTtcblxuICAgICAgICAgICAgY29uc3QgZm9ybWF0dGVkU3RhcnQgPSBzdGFydERhdGVPYmoudG9Mb2NhbGVEYXRlU3RyaW5nKCdlbi1VUycsIHtcbiAgICAgICAgICAgICAgICBtb250aDogJ3Nob3J0JyxcbiAgICAgICAgICAgICAgICBkYXk6ICdudW1lcmljJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb25zdCBmb3JtYXR0ZWRFbmQgPSBlbmREYXRlT2JqLnRvTG9jYWxlRGF0ZVN0cmluZygnZW4tVVMnLCB7XG4gICAgICAgICAgICAgICAgbW9udGg6ICdzaG9ydCcsXG4gICAgICAgICAgICAgICAgZGF5OiAnbnVtZXJpYydcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZWF2ZU1hcC5zZXQocm93LnVpZCwge1xuICAgICAgICAgICAgICAgIGxlYXZlVHlwZTogcm93LmxlYXZlX3R5cGUsXG4gICAgICAgICAgICAgICAgbGVhdmVEYXRlczogYCR7Zm9ybWF0dGVkU3RhcnR9IC0gJHtmb3JtYXR0ZWRFbmR9YCxcbiAgICAgICAgICAgICAgICBzdGFydERhdGU6IHN0YXJ0RGF0ZU9iai50b0lTT1N0cmluZygpLFxuICAgICAgICAgICAgICAgIGVuZERhdGU6IGVuZERhdGVPYmoudG9JU09TdHJpbmcoKSxcbiAgICAgICAgICAgICAgICBkdXJhdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBCdWlsZCB0ZWFtIG1lbWJlciBvdXRwdXRcbiAgICAgICAgY29uc3QgdGVhbU1lbWJlcnMgPSAodXNlcnMgYXMgYW55W10pLm1hcCh1c2VyID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGxlYXZlSW5mbyA9IGxlYXZlTWFwLmdldCh1c2VyLmlkKTtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxOYW1lID0gYCR7dXNlci5maXJzdE5hbWV9ICR7dXNlci5sYXN0TmFtZX1gO1xuICAgICAgICAgICAgY29uc3QgaW5pdGlhbHMgPSBgJHt1c2VyLmZpcnN0TmFtZT8uY2hhckF0KDApIHx8ICcnfSR7dXNlci5sYXN0TmFtZT8uY2hhckF0KDApIHx8ICcnfWAudG9VcHBlckNhc2UoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgICAgICAgICBuYW1lOiBmdWxsTmFtZSxcbiAgICAgICAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICAgICAgICBqb2JUaXRsZTogdXNlci5qb2JUaXRsZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHN0YXR1czogbGVhdmVJbmZvID8gJ29uLWxlYXZlJyA6ICdhdmFpbGFibGUnLFxuICAgICAgICAgICAgICAgIGF2YXRhcjogaW5pdGlhbHMsXG4gICAgICAgICAgICAgICAgbGVhdmVUeXBlOiBsZWF2ZUluZm8/LmxlYXZlVHlwZSB8fCBudWxsLFxuICAgICAgICAgICAgICAgIGxlYXZlRGF0ZXM6IGxlYXZlSW5mbz8ubGVhdmVEYXRlcyB8fCBudWxsLFxuICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZTogbGVhdmVJbmZvPy5zdGFydERhdGUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBlbmREYXRlOiBsZWF2ZUluZm8/LmVuZERhdGUgfHwgbnVsbCxcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogbGVhdmVJbmZvPy5kdXJhdGlvbiB8fCBudWxsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFwiTGVhdmUgc3RhdHVzIGZldGNoZWQgc3VjY2Vzc2Z1bGx5XCIsIHRlYW1NZW1iZXJzKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgMjAwKTtcblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBvbi1sZWF2ZSBzdGF0dXM6XCIsIGVycm9yKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXCJJTlRFUk5BTF9TRVJWRVJfRVJST1JcIiwgXCJGYWlsZWQgdG8gZmV0Y2ggb24tbGVhdmUgc3RhdHVzXCIsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNTAwKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmVuZCgpO1xuICAgIH1cbn0pO1xuXG5hcHAuZGVsZXRlKCcvZGVsZXRlLXVzZXInLCBhc3luYyAoYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgaWQsIGVtYWlsIH0gPSBhd2FpdCBjLnJlcS5qc29uKCk7XG5cbiAgICAgICAgaWYgKCFpZCB8fCAhZW1haWwpIHtcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgICAgIFwiSU5WQUxJRF9JTlBVVFwiLFxuICAgICAgICAgICAgICAgIFwiSUQgYW5kIGVtYWlsIGFyZSByZXF1aXJlZFwiXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNDAwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBhd2FpdCBEYXRhYmFzZVNlcnZpY2UuY3JlYXRlQ29ubmVjdGlvbigpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBDaGVjayBpZiB1c2VyIGV4aXN0c1xuICAgICAgICAgICAgY29uc3Qgc3FsID0gYFNFTEVDVCAqIEZST00gdXNlcnMgV0hFUkUgaWQgPSA/YDtcbiAgICAgICAgICAgIGNvbnN0IFtyb3dzXSA9IGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZShzcWwsIFtpZF0pO1xuICAgICAgICAgICAgY29uc3QgdXNlciA9IChyb3dzIGFzIGFueVtdKVswXTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgIFwiVVNFUl9OT1RfRk9VTkRcIixcbiAgICAgICAgICAgICAgICAgICAgXCJVc2VyIG5vdCBmb3VuZFwiXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA0MDQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBEZWxldGUgcmVsYXRlZCBsZWF2ZSByZXF1ZXN0cyBmaXJzdCAoZm9yZWlnbiBrZXkgY29uc3RyYWludClcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZXhlY3V0ZSgnREVMRVRFIEZST00gbGVhdmVfcmVxdWVzdHMgV0hFUkUgdWlkID0gPycsIFtpZF0pO1xuXG4gICAgICAgICAgICAvLyBEZWxldGUgdXNlciBmcm9tIGRhdGFiYXNlXG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoJ0RFTEVURSBGUk9NIHVzZXJzIFdIRVJFIGlkID0gPycsIFtpZF0pO1xuXG4gICAgICAgICAgICAvLyBUcnkgdG8gZGVsZXRlIGZyb20gQ29nbml0b1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IEFkbWluRGVsZXRlVXNlckNvbW1hbmQgfSA9IGF3YWl0IGltcG9ydCgnQGF3cy1zZGsvY2xpZW50LWNvZ25pdG8taWRlbnRpdHktcHJvdmlkZXInKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkZWxldGVDb21tYW5kID0gbmV3IEFkbWluRGVsZXRlVXNlckNvbW1hbmQoe1xuICAgICAgICAgICAgICAgICAgICBVc2VyUG9vbElkOiBVU0VSX1BPT0xfSUQsXG4gICAgICAgICAgICAgICAgICAgIFVzZXJuYW1lOiBlbWFpbFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGF3YWl0IGNsaWVudC5zZW5kKGRlbGV0ZUNvbW1hbmQpO1xuICAgICAgICAgICAgfSBjYXRjaCAoY29nbml0b0Vycm9yKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignRmFpbGVkIHRvIGRlbGV0ZSB1c2VyIGZyb20gQ29nbml0bzonLCBjb2duaXRvRXJyb3IpO1xuICAgICAgICAgICAgICAgIC8vIERvbid0IGZhaWwgdGhlIGVudGlyZSBvcGVyYXRpb24gaWYgQ29nbml0byBkZWxldGlvbiBmYWlsc1xuICAgICAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGFscmVhZHkgZGVsZXRlZCBmcm9tIHRoZSBkYXRhYmFzZVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFxuICAgICAgICAgICAgICAgIFwiVXNlciBkZWxldGVkIHN1Y2Nlc3NmdWxseVwiLFxuICAgICAgICAgICAgICAgIHsgZGVsZXRlZFVzZXJJZDogaWQsIGRlbGV0ZWRFbWFpbDogZW1haWwgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDIwMCk7XG5cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgICAgIH1cblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0RlbGV0ZSB1c2VyIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLFxuICAgICAgICAgICAgXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDUwMCk7XG4gICAgfVxufSk7XG5cbmFwcC5wb3N0KCcvYWRkLXVzZXInLCBhc3luYyAoYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHsgZmlyc3ROYW1lLCBsYXN0TmFtZSwgam9iVGl0bGUsIGlzQWRtaW4gfSA9IGF3YWl0IGMucmVxLmpzb24oKTtcblxuICAgICAgICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgICAgICAgaWYgKCFmaXJzdE5hbWUgfHwgIWxhc3ROYW1lIHx8ICFqb2JUaXRsZSkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgXCJJTlZBTElEX0lOUFVUXCIsXG4gICAgICAgICAgICAgICAgXCJqb2JUaXRsZSwgZmlyc3ROYW1lLCBsYXN0TmFtZSBhcmUgcmVxdWlyZWRcIlxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDQwMCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0YWtlIGZpcnN0IG5hbWUgYW5kIGFsc3QgbmFtZSBhbmQgY29udmVyIHRvIGVtYWlsIGUuZyBKb2huIERvZSAtPiBqb2huLmRvZVxuICAgICAgICAvLyBjb25zdCBlbWFpbCA9IGAke2ZpcnN0TmFtZS50b0xvd2VyQ2FzZSgpfS4ke2xhc3ROYW1lLnRvTG93ZXJDYXNlKCl9QGdtYWlsLmNvbWA7XG4gICAgICAgIGNvbnN0IGVtYWlsID0gYG1vZ2FuZWdiQGdtYWlsLmNvbWA7XG4gICAgICAgIGNvbnN0IHJvbGUgPSBpc0FkbWluID8gJ2FkbWluJyA6ICd1c2VyJztcblxuICAgICAgICBjb25zdCBjb25uZWN0aW9uID0gYXdhaXQgRGF0YWJhc2VTZXJ2aWNlLmNyZWF0ZUNvbm5lY3Rpb24oKTtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGV4aXN0cyBpbiBkYXRhYmFzZVxuICAgICAgICAgICAgY29uc3QgY2hlY2tTcWwgPSBgU0VMRUNUICogRlJPTSB1c2VycyBXSEVSRSBlbWFpbCA9ID9gO1xuICAgICAgICAgICAgY29uc3QgW2V4aXN0aW5nUm93c10gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoY2hlY2tTcWwsIFtlbWFpbF0pO1xuXG4gICAgICAgICAgICBpZiAoKGV4aXN0aW5nUm93cyBhcyBhbnlbXSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIlVTRVJfRVhJU1RTXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiQSB1c2VyIHdpdGggdGhpcyBlbWFpbCBhbHJlYWR5IGV4aXN0c1wiXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA0MDkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBHZW5lcmF0ZSBhIFVVSURcbiAgICAgICAgICAgIGZ1bmN0aW9uIGdlbmVyYXRlVVVJRCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBjID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHYgPSBjID09PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpOyAvLyBVVUlEIHZlcnNpb24gNFxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGdlbmVyYXRlVVVJRCgpO1xuICAgICAgICAgICAgLy8gY29uc3QgdXNlcklkID0gYHVzZXJfJHtEYXRlLm5vdygpfV8ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCAxNSl9YDvDt1xuXG4gICAgICAgICAgICAvLyBDcmVhdGUgdXNlciBpbiBDb2duaXRvXG4gICAgICAgICAgICBsZXQgY29nbml0b1VzZXI7XG4gICAgICAgICAgICB0cnkge1xuXG4gICAgICAgICAgICAgICAgY29uc3QgY3JlYXRlVXNlckNvbW1hbmQgPSBuZXcgQWRtaW5DcmVhdGVVc2VyQ29tbWFuZCh7XG4gICAgICAgICAgICAgICAgICAgIFVzZXJQb29sSWQ6IFVTRVJfUE9PTF9JRCxcbiAgICAgICAgICAgICAgICAgICAgVXNlcm5hbWU6IGVtYWlsLFxuICAgICAgICAgICAgICAgICAgICBVc2VyQXR0cmlidXRlczogW1xuICAgICAgICAgICAgICAgICAgICAgICAgeyBOYW1lOiAnZW1haWwnLCBWYWx1ZTogZW1haWwgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgTmFtZTogJ2VtYWlsX3ZlcmlmaWVkJywgVmFsdWU6ICd0cnVlJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBOYW1lOiAnZ2l2ZW5fbmFtZScsIFZhbHVlOiBmaXJzdE5hbWUgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgTmFtZTogJ2ZhbWlseV9uYW1lJywgVmFsdWU6IGxhc3ROYW1lIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IE5hbWU6ICdjdXN0b206cm9sZScsIFZhbHVlOiByb2xlIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB7IE5hbWU6ICdjdXN0b206dXNlcklkJywgVmFsdWU6IHVzZXJJZCB9XG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIFRlbXBvcmFyeVBhc3N3b3JkOiBnZW5lcmF0ZVRlbXBvcmFyeVBhc3N3b3JkKCksXG4gICAgICAgICAgICAgICAgICAgIERlc2lyZWREZWxpdmVyeU1lZGl1bXM6IFsnRU1BSUwnXVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY29nbml0b1VzZXIgPSBhd2FpdCBjbGllbnQuc2VuZChjcmVhdGVVc2VyQ29tbWFuZCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0NvZ25pdG8gdXNlciBjcmVhdGVkOicsIGNvZ25pdG9Vc2VyKTtcblxuICAgICAgICAgICAgfSBjYXRjaCAoY29nbml0b0Vycm9yOiBhbnkpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdDb2duaXRvIHVzZXIgY3JlYXRpb24gZmFpbGVkOicsIGNvZ25pdG9FcnJvcik7XG5cbiAgICAgICAgICAgICAgICAvLyBIYW5kbGUgc3BlY2lmaWMgQ29nbml0byBlcnJvcnNcbiAgICAgICAgICAgICAgICBpZiAoY29nbml0b0Vycm9yLm5hbWUgPT09ICdVc2VybmFtZUV4aXN0c0V4Y2VwdGlvbicpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlVTRVJfRVhJU1RTX0NPR05JVE9cIixcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiQSB1c2VyIHdpdGggdGhpcyBlbWFpbCBhbHJlYWR5IGV4aXN0cyBpbiBDb2duaXRvXCJcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNDA5KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJDT0dOSVRPX0VSUk9SXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiRmFpbGVkIHRvIGNyZWF0ZSB1c2VyIGluIENvZ25pdG9cIixcbiAgICAgICAgICAgICAgICAgICAgY29nbml0b0Vycm9yLm1lc3NhZ2VcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDUwMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEFkZCB1c2VyIHRvIGRhdGFiYXNlXG4gICAgICAgICAgICBjb25zdCBpbnNlcnRTcWwgPSBgXG4gICAgICAgICAgICAgICAgSU5TRVJUIElOVE8gdXNlcnMgKGlkLCBlbWFpbCwgZmlyc3ROYW1lLCBsYXN0TmFtZSwgcm9sZSwgam9iVGl0bGUsIHBob25lTnVtYmVyLCBkb2IsIGdlbmRlciwgY3JlYXRlZEF0LCB1cGRhdGVkQXQpXG4gICAgICAgICAgICAgICAgVkFMVUVTICg/LCA/LCA/LCA/LCA/LCA/LCA/LCA/LCA/LCBOT1coKSwgTk9XKCkpXG4gICAgICAgICAgICBgO1xuXG4gICAgICAgICAgICBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoaW5zZXJ0U3FsLCBbXG4gICAgICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgICAgICAgIGVtYWlsLFxuICAgICAgICAgICAgICAgIGZpcnN0TmFtZSxcbiAgICAgICAgICAgICAgICBsYXN0TmFtZSxcbiAgICAgICAgICAgICAgICByb2xlLFxuICAgICAgICAgICAgICAgIGpvYlRpdGxlIHx8IG51bGwsIC8vIFBhc3MgbnVsbCBpZiBqb2JUaXRsZSBpcyBlbXB0eS91bmRlZmluZWQgZm9yIERCXG4gICAgICAgICAgICAgICAgJysyNzAwMDAwMDAwMCcsIC8vIEhhcmRjb2RlZCAtIGNvbnNpZGVyIG1ha2luZyBkeW5hbWljIG9yIG9wdGlvbmFsXG4gICAgICAgICAgICAgICAgJzAwMDAtMDEtMDEnLCAgIC8vIEhhcmRjb2RlZCAtIGNvbnNpZGVyIG1ha2luZyBkeW5hbWljIG9yIG9wdGlvbmFsXG4gICAgICAgICAgICAgICAgJy0nICAgICAgICAgICAgIC8vIEhhcmRjb2RlZCAtIGNvbnNpZGVyIG1ha2luZyBkeW5hbWljIG9yIG9wdGlvbmFsXG4gICAgICAgICAgICBdKTtcblxuICAgICAgICAgICAgLy8gR2V0IHRoZSBjcmVhdGVkIHVzZXJcbiAgICAgICAgICAgIGNvbnN0IFtjcmVhdGVkUm93c10gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoY2hlY2tTcWwsIFtlbWFpbF0pO1xuICAgICAgICAgICAgY29uc3QgY3JlYXRlZFVzZXIgPSAoY3JlYXRlZFJvd3MgYXMgYW55W10pWzBdO1xuXG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFxuICAgICAgICAgICAgICAgIFwiVXNlciBjcmVhdGVkIHN1Y2Nlc3NmdWxseS4gV2VsY29tZSBlbWFpbCBzZW50IHdpdGggdGVtcG9yYXJ5IHBhc3N3b3JkLlwiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcjogY3JlYXRlZFVzZXIsXG4gICAgICAgICAgICAgICAgICAgIGNvZ25pdG9Vc2VybmFtZTogY29nbml0b1VzZXIuVXNlcj8uVXNlcm5hbWUsXG4gICAgICAgICAgICAgICAgICAgIHVzZXJTdGF0dXM6IGNvZ25pdG9Vc2VyLlVzZXI/LlVzZXJTdGF0dXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgMjAxKTtcblxuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgICAgYXdhaXQgY29ubmVjdGlvbi5lbmQoKTtcbiAgICAgICAgfVxuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignQWRkIHVzZXIgZXJyb3I6JywgZXJyb3IpO1xuICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5lcnJvcihcbiAgICAgICAgICAgIFwiSU5URVJOQUxfU0VSVkVSX0VSUk9SXCIsXG4gICAgICAgICAgICBcIkludGVybmFsIHNlcnZlciBlcnJvclwiLFxuICAgICAgICAgICAgZXJyb3JcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNTAwKTtcbiAgICB9XG59KTtcblxuYXBwLnB1dCgnL3VwZGF0ZS11c2VyJywgYXN5bmMgKGMpID0+IHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCB7IGlkLCAuLi51cGRhdGVEYXRhIH0gPSBhd2FpdCBjLnJlcS5qc29uKCk7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICAgICAgXCJJTlZBTElEX0lOUFVUXCIsXG4gICAgICAgICAgICAgICAgXCJVc2VyIElEIGlzIHJlcXVpcmVkXCJcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgdGhhdCB3ZSBoYXZlIGF0IGxlYXN0IG9uZSBmaWVsZCB0byB1cGRhdGVcbiAgICAgICAgY29uc3QgYWxsb3dlZEZpZWxkcyA9IFsnZmlyc3ROYW1lJywgJ2xhc3ROYW1lJywgJ2VtYWlsJywgJ2pvYlRpdGxlJywgJ3JvbGUnLCAnb2NjdXBhdGlvbiddO1xuICAgICAgICBjb25zdCBmaWVsZHNUb1VwZGF0ZSA9IE9iamVjdC5rZXlzKHVwZGF0ZURhdGEpLmZpbHRlcihrZXkgPT4gYWxsb3dlZEZpZWxkcy5pbmNsdWRlcyhrZXkpKTtcblxuICAgICAgICBpZiAoZmllbGRzVG9VcGRhdGUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5lcnJvcihcbiAgICAgICAgICAgICAgICBcIklOVkFMSURfSU5QVVRcIixcbiAgICAgICAgICAgICAgICBgTm8gdmFsaWQgZmllbGRzIHRvIHVwZGF0ZS4gQWxsb3dlZCBmaWVsZHM6ICR7YWxsb3dlZEZpZWxkcy5qb2luKCcsICcpfWBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICByZXR1cm4gYy5qc29uKHJlc3BvbnNlLCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgY29ubmVjdGlvbiA9IGF3YWl0IERhdGFiYXNlU2VydmljZS5jcmVhdGVDb25uZWN0aW9uKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHVzZXIgZXhpc3RzXG4gICAgICAgICAgICBjb25zdCBjaGVja1NxbCA9IGBTRUxFQ1QgKiBGUk9NIHVzZXJzIFdIRVJFIGlkID0gP2A7XG4gICAgICAgICAgICBjb25zdCBbcm93c10gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUoY2hlY2tTcWwsIFtpZF0pO1xuICAgICAgICAgICAgY29uc3QgZXhpc3RpbmdVc2VyID0gKHJvd3MgYXMgYW55W10pWzBdO1xuXG4gICAgICAgICAgICBpZiAoIWV4aXN0aW5nVXNlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gUmVzcG9uc2VTZXJ2aWNlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIlVTRVJfTk9UX0ZPVU5EXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiVXNlciBub3QgZm91bmRcIlxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgNDA0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQnVpbGQgZHluYW1pYyB1cGRhdGUgcXVlcnlcbiAgICAgICAgICAgIGNvbnN0IHNldENsYXVzZSA9IGZpZWxkc1RvVXBkYXRlLm1hcChmaWVsZCA9PiBgJHtmaWVsZH0gPSA/YCkuam9pbignLCAnKTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZVNxbCA9IGBVUERBVEUgdXNlcnMgU0VUICR7c2V0Q2xhdXNlfSwgdXBkYXRlZEF0ID0gTk9XKCkgV0hFUkUgaWQgPSA/YDtcblxuICAgICAgICAgICAgLy8gQnVpbGQgdmFsdWVzIGFycmF5XG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBmaWVsZHNUb1VwZGF0ZS5tYXAoZmllbGQgPT4gdXBkYXRlRGF0YVtmaWVsZF0pO1xuICAgICAgICAgICAgdmFsdWVzLnB1c2goaWQpOyAvLyBBZGQgaWQgZm9yIFdIRVJFIGNsYXVzZVxuXG4gICAgICAgICAgICAvLyBFeGVjdXRlIHVwZGF0ZVxuICAgICAgICAgICAgY29uc3QgW3Jlc3VsdF0gPSBhd2FpdCBjb25uZWN0aW9uLmV4ZWN1dGUodXBkYXRlU3FsLCB2YWx1ZXMpO1xuXG4gICAgICAgICAgICAvLyBHZXQgdXBkYXRlZCB1c2VyXG4gICAgICAgICAgICBjb25zdCBbdXBkYXRlZFJvd3NdID0gYXdhaXQgY29ubmVjdGlvbi5leGVjdXRlKGNoZWNrU3FsLCBbaWRdKTtcbiAgICAgICAgICAgIGNvbnN0IHVwZGF0ZWRVc2VyID0gKHVwZGF0ZWRSb3dzIGFzIGFueVtdKVswXTtcblxuICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2Uuc3VjY2VzcyhcbiAgICAgICAgICAgICAgICBcIlVzZXIgdXBkYXRlZCBzdWNjZXNzZnVsbHlcIixcbiAgICAgICAgICAgICAgICB1cGRhdGVkVXNlclxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDIwMCk7XG5cbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICAgIGF3YWl0IGNvbm5lY3Rpb24uZW5kKCk7XG4gICAgICAgIH1cblxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSB1c2VyIGVycm9yOicsIGVycm9yKTtcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4gICAgICAgICAgICBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLFxuICAgICAgICAgICAgXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcbiAgICAgICAgICAgIGVycm9yXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDUwMCk7XG4gICAgfVxufSk7XG5cblxuLy8gYXBwLmdldCgnLzp1c2VySWQnLCBhc3luYyAoYykgPT4ge1xuLy8gICAgIHRyeSB7XG4vLyAgICAgICAgIGNvbnN0IHVzZXJJZCA9IGMucmVxLnBhcmFtKCd1c2VySWQnKTtcblxuLy8gICAgICAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuLy8gICAgICAgICBjb25zdCB2YWxpZGF0aW9uID0gZ2V0VXNlckJ5SWRTY2hlbWEuc2FmZVBhcnNlKHsgdXNlcklkIH0pO1xuLy8gICAgICAgICBpZiAoIXZhbGlkYXRpb24uc3VjY2Vzcykge1xuLy8gICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4vLyAgICAgICAgICAgICAgICAgXCJJTlZBTElEX0lOUFVUXCIsXG4vLyAgICAgICAgICAgICAgICAgXCJJbnZhbGlkIGlucHV0IGRhdGFcIixcbi8vICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uLmVycm9yLmVycm9yc1xuLy8gICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDQwMCk7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBjb25zdCB7IHVzZXJJZDogdmFsaWRhdGVkVXNlcklkIH0gPSB2YWxpZGF0aW9uLmRhdGE7XG4vLyAgICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBVc2VyU2VydmljZS5nZXRVc2VyQnlJZCh2YWxpZGF0ZWRVc2VySWQpO1xuXG4vLyAgICAgICAgIGlmICghdXNlcikge1xuLy8gICAgICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4vLyAgICAgICAgICAgICAgICAgXCJVU0VSX05PVF9GT1VORFwiLFxuLy8gICAgICAgICAgICAgICAgIFwiVXNlciBub3QgZm91bmRcIlxuLy8gICAgICAgICAgICAgKTtcbi8vICAgICAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDQwNCk7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIkdFVF9VU0VSX0JZX0lEOlwiLCB1c2VyKTtcblxuLy8gICAgICAgICBjb25zdCByZXNwb25zZSA9IFJlc3BvbnNlU2VydmljZS5zdWNjZXNzKFxuLy8gICAgICAgICAgICAgXCJVc2VyIHJldHJpZXZlZCBzdWNjZXNzZnVsbHlcIixcbi8vICAgICAgICAgICAgIHVzZXJcbi8vICAgICAgICAgKTtcbi8vICAgICAgICAgcmV0dXJuIGMuanNvbihyZXNwb25zZSwgMjAwKTtcblxuLy8gICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIHVzZXIgYnkgSUQ6XCIsIGVycm9yKTtcbi8vICAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBSZXNwb25zZVNlcnZpY2UuZXJyb3IoXG4vLyAgICAgICAgICAgICBcIklOVEVSTkFMX1NFUlZFUl9FUlJPUlwiLFxuLy8gICAgICAgICAgICAgXCJJbnRlcm5hbCBzZXJ2ZXIgZXJyb3JcIixcbi8vICAgICAgICAgICAgIGVycm9yXG4vLyAgICAgICAgICk7XG4vLyAgICAgICAgIHJldHVybiBjLmpzb24ocmVzcG9uc2UsIDUwMCk7XG4vLyAgICAgfVxuLy8gfSk7XG5cbmV4cG9ydCB7IGFwcCBhcyB1c2VycyB9OyJdfQ==