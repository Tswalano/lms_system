import request from 'supertest';
import { createAdaptorServer } from '@hono/node-server';
import { userApp } from '../lambda/routes/user';
import * as authMiddleware from '../lambda/middleware/auth';
import * as dbHelper from '../lambda/helpers/databaseHeler';
import { AdminCreateUserCommand, AdminDisableUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { mockClient } from 'aws-sdk-client-mock';

jest.mock('../lambda/middleware/auth', () => ({
    getDecodedToken: jest.fn(),
    getUserEmail: jest.fn(),
    getUserFirstName: jest.fn(),
    getUserLastName: jest.fn(),
    getUserRole: jest.fn(),
    getUserOccupation: jest.fn(),
    getCustomUserId: jest.fn(),
    getCognitoSub: jest.fn(),
}));

jest.mock('../lambda/helpers/databaseHeler', () => ({
    DatabaseService: {
        createConnection: jest.fn(),
    },
}));

jest.mock('crypto', () => ({
    ...jest.requireActual('crypto'),
    randomUUID: jest.fn(),
}));

import * as cryptoModule from 'crypto';

const server = createAdaptorServer(userApp);
const cognitoMock = mockClient(CognitoIdentityProviderClient);

const mockGetDecodedToken = authMiddleware.getDecodedToken as jest.Mock;
const mockGetUserEmail = authMiddleware.getUserEmail as jest.Mock;
const mockGetUserFirstName = authMiddleware.getUserFirstName as jest.Mock;
const mockGetUserLastName = authMiddleware.getUserLastName as jest.Mock;
const mockGetUserRole = authMiddleware.getUserRole as jest.Mock;
const mockGetUserOccupation = authMiddleware.getUserOccupation as jest.Mock;
const mockGetCustomUserId = authMiddleware.getCustomUserId as jest.Mock;
const mockGetCognitoSub = authMiddleware.getCognitoSub as jest.Mock;
const mockCreateConnection = dbHelper.DatabaseService.createConnection as jest.Mock;
const mockRandomUUID = cryptoModule.randomUUID as jest.Mock;

describe('User API Integration Tests', () => {
    const TEST_USER_ID = 'test-uuid-123';
    const TEST_COGNITO_SUB = 'test-sub-abc';
    const TEST_USER_EMAIL = 'testuser@example.com';
    const TEST_USER_FIRST_NAME = 'Test';
    const TEST_USER_LAST_NAME = 'User';
    const TEST_USER_ROLE = 'user';
    const TEST_USER_OCCUPATION = 'Software Engineer';
    const TEST_DEPARTMENT_ID = 1;
    const TEST_USER_PHONE_NUMBER = '+27123456789';
    const TEST_USER_DOB = '1990-01-01';
    const TEST_USER_GENDER = 'Male';

    let mockExecute: jest.Mock;
    let mockConnectionEnd: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        cognitoMock.reset();

        mockExecute = jest.fn().mockResolvedValue([[]]);
        mockConnectionEnd = jest.fn().mockResolvedValue(undefined);

        mockCreateConnection.mockReturnValue({
            execute: mockExecute,
            end: mockConnectionEnd,
        });

        mockGetDecodedToken.mockReturnValue({
            'cognito:username': 'testuser',
            preferred_username: 'testuser',
            email: TEST_USER_EMAIL,
            given_name: TEST_USER_FIRST_NAME,
            family_name: TEST_USER_LAST_NAME,
            'custom:role': TEST_USER_ROLE,
            'custom:occupation': TEST_USER_OCCUPATION,
            'custom:userId': TEST_USER_ID,
            sub: TEST_COGNITO_SUB,
        });
        mockGetUserEmail.mockReturnValue(TEST_USER_EMAIL);
        mockGetUserFirstName.mockReturnValue(TEST_USER_FIRST_NAME);
        mockGetUserLastName.mockReturnValue(TEST_USER_LAST_NAME);
        mockGetUserRole.mockReturnValue(TEST_USER_ROLE);
        mockGetUserOccupation.mockReturnValue(TEST_USER_OCCUPATION);
        mockGetCustomUserId.mockReturnValue(TEST_USER_ID);
        mockGetCognitoSub.mockReturnValue(TEST_COGNITO_SUB);
        mockRandomUUID.mockReturnValue('new-test-uuid');

        process.env.COGNITO_CLIENT_ID = 'test-client-id';
        process.env.COGNITO_USER_POOL_ID = 'test-user-pool-id';
    });

    afterEach(() => {
        delete process.env.COGNITO_CLIENT_ID;
        delete process.env.COGNITO_USER_POOL_ID;
    });

    describe('GET /me', () => {
        it('should return current user data with leave data on success', async () => {
            const mockUserData = {
                id: TEST_USER_ID,
                firstName: TEST_USER_FIRST_NAME,
                lastName: TEST_USER_LAST_NAME,
                email: TEST_USER_EMAIL,
                departmentId: TEST_DEPARTMENT_ID,
                department: 'IT',
            };
            const mockLeaveData = [
                { leave_type: 'Annual Leave', leave_count: 5 },
                { leave_type: 'Sick Leave', leave_count: 2 },
            ];

            mockExecute.mockImplementation((sql: string, _params: any[]) => {
                if (sql.includes('FROM users u') && sql.includes('WHERE u.id = ?')) {
                    return Promise.resolve([[mockUserData]]);
                }
                if (sql.includes('FROM leave_requests lr') && sql.includes("lr.status = 'approved'")) {
                    return Promise.resolve([mockLeaveData]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .get('/me')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.payload.firstName).toBe(TEST_USER_FIRST_NAME);
            expect(response.body.payload.leaveData).toEqual(mockLeaveData);
            expect(mockGetCustomUserId).toHaveBeenCalledTimes(1);
            expect(mockExecute).toHaveBeenCalledTimes(2);
        });

        it('should return 400 if user ID is not found in token', async () => {
            mockGetCustomUserId.mockReturnValue(undefined);

            const response = await request(server)
                .get('/me')
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('USER_ID_NOT_FOUND');
            expect(response.body.message).toBe('User ID not found in token');
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it('should return 404 if user not found in database', async () => {
            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users u') && sql.includes('WHERE u.id = ?')) {
                    return Promise.resolve([[]]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .get('/me')
                .expect(404);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('USER_NOT_FOUND');
            expect(response.body.message).toBe('User not found in database');
        });
    });

    describe('GET /', () => {
        it('should return all users and departments', async () => {
            const mockUsers = [{ id: 'u1', firstName: 'John', lastName: 'Doe', department: 'IT' }];
            const mockDepartments = [{ id: 1, name: 'IT' }];

            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users u') && sql.includes('LEFT JOIN user_departments ud')) {
                    return Promise.resolve([mockUsers]);
                }
                if (sql.includes('FROM departments')) {
                    return Promise.resolve([mockDepartments]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .get('/')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.payload.users).toEqual(mockUsers);
            expect(response.body.payload.departments).toEqual(mockDepartments);
        });

        it('should return empty arrays if no users or departments exist', async () => {
            mockExecute.mockResolvedValue([[]]);

            const response = await request(server)
                .get('/')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.payload.users).toEqual([]);
            expect(response.body.payload.departments).toEqual([]);
        });
    });

    describe('POST /add-user', () => {
        const newUserPayload = {
            firstName: 'New',
            lastName: 'User',
            jobTitle: 'Engineer',
            isAdmin: false,
            departmentId: TEST_DEPARTMENT_ID
        };
        const expectedEmail = 'new.user@disraptor.co.za';
        const newUserId = 'new-test-uuid';

        beforeEach(() => {
            mockRandomUUID.mockReturnValue(newUserId);
        });

        it('should successfully add a new user to Cognito and DB', async () => {
            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users WHERE email = ?')) {
                    return Promise.resolve([[]]);
                }
                if (sql.includes('INSERT INTO users')) {
                    return Promise.resolve([{} as any]);
                }
                return Promise.resolve([[]]);
            });
            cognitoMock.on(AdminCreateUserCommand).resolves({
                User: {
                    Username: expectedEmail,
                    UserStatus: 'FORCE_CHANGE_PASSWORD'
                }
            });

            const response = await request(server)
                .post('/add-user')
                .send(newUserPayload)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User created successfully. Welcome email sent with temporary password.');
            expect(response.body.payload.users.email).toBe(expectedEmail);
            expect(cognitoMock.commandCalls(AdminCreateUserCommand)).toHaveLength(1);
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO users'),
                expect.arrayContaining([newUserId, expectedEmail, newUserPayload.firstName])
            );
        });

        it('should return 400 for missing required fields', async () => {
            const invalidPayload = { ...newUserPayload, firstName: undefined };

            const response = await request(server)
                .post('/add-user')
                .send(invalidPayload)
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('INVALID_INPUT');
            expect(response.body.message).toBe('jobTitle, firstName, lastName are required');
            expect(cognitoMock.commandCalls(AdminCreateUserCommand)).toHaveLength(0);
            expect(mockExecute).not.toHaveBeenCalled();
        });

        it('should return 409 if user already exists in database', async () => {
            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users WHERE email = ?')) {
                    return Promise.resolve([[{ id: TEST_USER_ID, email: expectedEmail }]]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .post('/add-user')
                .send(newUserPayload)
                .expect(409);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('USER_EXISTS');
            expect(response.body.message).toBe('A user with this email already exists');
            expect(cognitoMock.commandCalls(AdminCreateUserCommand)).toHaveLength(0);
        });

        it('should return 409 if user already exists in Cognito', async () => {
            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users WHERE email = ?')) {
                    return Promise.resolve([[]]);
                }
                return Promise.resolve([[]]);
            });
            cognitoMock.on(AdminCreateUserCommand).rejectsOnce({
                name: 'UsernameExistsException',
                message: 'User already exists in Cognito'
            });

            const response = await request(server)
                .post('/add-user')
                .send(newUserPayload)
                .expect(409);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('USER_EXISTS_COGNITO');
            expect(response.body.message).toBe('A user with this email already exists in Cognito');
            expect(mockExecute).toHaveBeenCalledTimes(1);
        });
    });

    describe('DELETE /delete-user', () => {
        const deletePayload = { id: TEST_USER_ID, email: TEST_USER_EMAIL };

        it('should successfully deactivate a user in DB and Cognito', async () => {
            mockExecute.mockImplementation((sql: string, _params: any[]) => {
                if (sql.includes('FROM users WHERE id = ?')) {
                    return Promise.resolve([[{ id: TEST_USER_ID, email: TEST_USER_EMAIL }]]);
                }
                return Promise.resolve([{} as any]);
            });
            cognitoMock.on(AdminDisableUserCommand).resolves({});

            const response = await request(server)
                .delete('/delete-user')
                .send(deletePayload)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User deactivated successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                'UPDATE users SET isActive = 0, deactivatedAt = NOW(), updatedAt = NOW() WHERE id = ?',
                [TEST_USER_ID]
            );
            expect(cognitoMock.commandCalls(AdminDisableUserCommand)).toHaveLength(1);
        });

        it('should return 400 for missing ID', async () => {
            const response = await request(server)
                .delete('/delete-user')
                .send({})
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('INVALID_INPUT');
            expect(response.body.message).toBe('ID is required');
            expect(mockExecute).not.toHaveBeenCalled();
            expect(cognitoMock.commandCalls(AdminDisableUserCommand)).toHaveLength(0);
        });

        it('should return 404 if user not found in database', async () => {
            mockExecute.mockImplementation((sql: string) => {
                if (sql.includes('FROM users WHERE id = ?')) {
                    return Promise.resolve([[]]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .delete('/delete-user')
                .send(deletePayload)
                .expect(404);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('USER_NOT_FOUND');
            expect(response.body.message).toBe('User not found');
            expect(mockExecute).toHaveBeenCalledTimes(1);
            expect(cognitoMock.commandCalls(AdminDisableUserCommand)).toHaveLength(0);
        });

        it('should proceed if Cognito disable fails but DB deactivation succeeds', async () => {
            mockExecute.mockImplementation((sql: string, _params: any[]) => {
                if (sql.includes('FROM users WHERE id = ?')) {
                    return Promise.resolve([[{ id: TEST_USER_ID, email: TEST_USER_EMAIL }]]);
                }
                return Promise.resolve([{} as any]);
            });
            cognitoMock.on(AdminDisableUserCommand).rejectsOnce(new Error('Cognito error'));

            const response = await request(server)
                .delete('/delete-user')
                .send(deletePayload)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User deactivated successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                'UPDATE users SET isActive = 0, deactivatedAt = NOW(), updatedAt = NOW() WHERE id = ?',
                [TEST_USER_ID]
            );
            expect(cognitoMock.commandCalls(AdminDisableUserCommand)).toHaveLength(1);
        });
    });

    describe('POST /me/update', () => {
        const updatePayload = {
            firstName: 'Updated',
            lastName: 'User',
            jobTitle: 'Senior Dev',
            dob: TEST_USER_DOB,
            gender: TEST_USER_GENDER,
            phoneNumber: TEST_USER_PHONE_NUMBER
        };

        it('should successfully update current user data in DB', async () => {
            mockExecute.mockResolvedValue([{} as any]);

            const response = await request(server)
                .post('/me/update')
                .send(updatePayload)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User updated successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringMatching(/UPDATE users\s+SET firstName = \?, lastName = \?, jobTitle = \?, phoneNumber = \?, dob = \?, gender = \?, updatedAt = NOW\(\)\s+WHERE id = \? AND email = \?/),
                [
                    updatePayload.firstName,
                    updatePayload.lastName,
                    updatePayload.jobTitle,
                    updatePayload.phoneNumber,
                    updatePayload.dob,
                    updatePayload.gender,
                    TEST_USER_ID,
                    TEST_USER_EMAIL
                ]
            );
        });

        it('should return 400 for missing required fields', async () => {
            const invalidPayload = { ...updatePayload, firstName: undefined };

            const response = await request(server)
                .post('/me/update')
                .send(invalidPayload)
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('INVALID_INPUT');
            expect(response.body.message).toBe('jobTitle, firstName, lastName are required');
            expect(mockExecute).not.toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users'),
                expect.any(Array)
            );
        });
    });

    describe('POST /update-user (Admin)', () => {
        const adminUpdatePayload = {
            id: TEST_USER_ID,
            firstName: 'AdminUpdated',
            lastName: 'User',
            jobTitle: 'Lead Engineer',
            departmentId: TEST_DEPARTMENT_ID
        };

        it('should successfully update any user data in DB by admin', async () => {
            mockExecute.mockResolvedValue([{} as any]);

            const response = await request(server)
                .post('/update-user')
                .send(adminUpdatePayload)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User updated successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET firstName = ?, lastName = ?, jobTitle = ?, departmentId = ?, updatedAt = NOW() WHERE id = ?'),
                [
                    adminUpdatePayload.firstName,
                    adminUpdatePayload.lastName,
                    adminUpdatePayload.jobTitle,
                    adminUpdatePayload.departmentId,
                    adminUpdatePayload.id
                ]
            );
        });

        it('should return 400 for missing required fields', async () => {
            const invalidPayload = { ...adminUpdatePayload, id: undefined };

            const response = await request(server)
                .post('/update-user')
                .send(invalidPayload)
                .expect(400);

            expect(response.body.error).toBe(true);
            expect(response.body.code).toBe('INVALID_INPUT');
            expect(response.body.message).toBe('id, jobTitle, firstName, lastName are required');
        });

        it('should succeed without touching departmentId when it is omitted (optional field)', async () => {
            mockExecute.mockResolvedValue([{} as any]);
            const { departmentId: _omit, ...payloadWithoutDepartment } = adminUpdatePayload;

            const response = await request(server)
                .post('/update-user')
                .send(payloadWithoutDepartment)
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('User updated successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE users SET firstName = ?, lastName = ?, jobTitle = ?, updatedAt = NOW() WHERE id = ?'),
                [
                    adminUpdatePayload.firstName,
                    adminUpdatePayload.lastName,
                    adminUpdatePayload.jobTitle,
                    adminUpdatePayload.id
                ]
            );
        });
    });

    describe('GET /departments', () => {
        it('should return all departments', async () => {
            const mockDepartments = [{ id: 1, name: 'IT' }, { id: 2, name: 'HR' }];
            mockExecute.mockResolvedValue([mockDepartments]);

            const response = await request(server)
                .get('/departments')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.payload).toEqual(mockDepartments);
            expect(mockExecute).toHaveBeenCalledWith('SELECT * FROM departments');
        });

        it('should return empty array if no departments exist', async () => {
            mockExecute.mockResolvedValue([[]]);

            const response = await request(server)
                .get('/departments')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.payload).toEqual([]);
        });
    });

    describe('POST /seed-departments', () => {
        it('should successfully seed departments', async () => {
            mockExecute.mockResolvedValue([{} as any]);

            const response = await request(server)
                .post('/seed-departments')
                .expect(200);

            expect(response.body.error).toBe(false);
            expect(response.body.message).toBe('Departments seeded successfully');
            expect(mockExecute).toHaveBeenCalledWith(
                "INSERT INTO departments (name) VALUES ('IT'), ('HR'), ('Admin'), ('Finance')"
            );
        });

        it('should handle errors during seeding', async () => {
            mockExecute.mockRejectedValueOnce(new Error('DB Seed Error'));

            const response = await request(server)
                .post('/seed-departments')
                .expect(500);

            expect(response.body.error).toBe(true);
            expect(response.body.message).toBe('Internal server error');
        });
    });
});
