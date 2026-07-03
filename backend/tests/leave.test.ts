import request from 'supertest';
import { createAdaptorServer } from '@hono/node-server';
import { leaveApp } from '../lambda/routes/leave';
import * as authMiddleware from '../lambda/middleware/auth';
import * as dbHelper from '../lambda/helpers/databaseHeler';
import * as leaveHelpers from '../lambda/helpers/leaveHelpers';
import * as leaveCalculations from '../lambda/helpers/leaveCalculations';
import * as emailMiddleware from '../lambda/email/emailMiddleware';

jest.mock('../lambda/middleware/auth', () => ({
    getUserId: jest.fn(),
    getDecodedToken: jest.fn(),
}));

jest.mock('../lambda/helpers/databaseHeler', () => ({
    DatabaseService: {
        createConnection: jest.fn(),
    },
}));

jest.mock('../lambda/helpers/leaveHelpers', () => ({
    ...jest.requireActual('../lambda/helpers/leaveHelpers'),
    isWeekend: jest.fn(),
    uploadToS3: jest.fn(),
    getSignedUrlFromS3: jest.fn(),
    deleteFromS3: jest.fn(),
    formatDateTime: jest.fn(),
}));

jest.mock('../lambda/helpers/leaveCalculations', () => ({
    calculateTotalLeaveDays: jest.fn(),
    getExcludedDaysDetails: jest.fn(),
    getPublicHolidayDatesUsingGoogleCalendarAPIAsync: jest.fn(),
}));

jest.mock('../lambda/email/emailMiddleware', () => ({
    sender: jest.fn(),
    senderManagement: jest.fn(),
}));

const server = createAdaptorServer(leaveApp);

const mockGetUserId = authMiddleware.getUserId as jest.Mock;
const mockGetDecodedToken = authMiddleware.getDecodedToken as jest.Mock;
const mockIsWeekend = leaveHelpers.isWeekend as jest.Mock;
const mockUploadToS3 = leaveHelpers.uploadToS3 as jest.Mock;
const mockGetSignedUrlFromS3 = leaveHelpers.getSignedUrlFromS3 as jest.Mock;
const mockDeleteFromS3 = leaveHelpers.deleteFromS3 as jest.Mock;
const mockFormatDateTime = leaveHelpers.formatDateTime as jest.Mock;
const mockCalculateTotalLeaveDays = leaveCalculations.calculateTotalLeaveDays as jest.Mock;
const mockGetExcludedDaysDetails = leaveCalculations.getExcludedDaysDetails as jest.Mock;
const mockGetPublicHolidayDatesUsingGoogleCalendarAPIAsync = leaveCalculations.getPublicHolidayDatesUsingGoogleCalendarAPIAsync as jest.Mock;
const mockSender = emailMiddleware.sender as jest.Mock;
const mockSenderManagement = emailMiddleware.senderManagement as jest.Mock;
const mockCreateConnection = dbHelper.DatabaseService.createConnection as jest.Mock;

describe('Leave API Integration Tests', () => {
    const TEST_USER_ID = 1;
    const TEST_USER_EMAIL = 'testuser@example.com';
    const TEST_USER_FIRST_NAME = 'Test';
    const TEST_USER_LAST_NAME = 'User';
    const TEST_LEAVE_ID = 101;

    let mockQuery: jest.Mock;
    let mockBeginTransaction: jest.Mock;
    let mockCommit: jest.Mock;
    let mockRollback: jest.Mock;
    let mockConnectionEnd: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockQuery = jest.fn();
        mockBeginTransaction = jest.fn();
        mockCommit = jest.fn();
        mockRollback = jest.fn();
        mockConnectionEnd = jest.fn();

        mockCreateConnection.mockReturnValue({
            query: mockQuery,
            beginTransaction: mockBeginTransaction,
            commit: mockCommit,
            rollback: mockRollback,
            end: mockConnectionEnd,
        });

        mockGetUserId.mockReturnValue(TEST_USER_ID);
        mockGetDecodedToken.mockReturnValue({
            email: TEST_USER_EMAIL,
            given_name: TEST_USER_FIRST_NAME,
            family_name: TEST_USER_LAST_NAME,
            name: `${TEST_USER_FIRST_NAME} ${TEST_USER_LAST_NAME}`
        });
        mockFormatDateTime.mockReturnValue('2023-10-27 10:00:00');

        mockQuery.mockImplementation((sql: string, params: any[]) => {
            if (sql.trim().startsWith('INSERT')) {
                return Promise.resolve([{ insertId: TEST_LEAVE_ID }] as any);
            }
            if (sql.includes('SELECT * FROM leave_requests WHERE id = ? AND uid = ?')) {
                if (params[0] === TEST_LEAVE_ID && params[1] === TEST_USER_ID) {
                    return Promise.resolve([[{
                        id: TEST_LEAVE_ID,
                        uid: TEST_USER_ID,
                        leave_type: 'Annual Leave',
                        status: 'pending',
                        duration: '5',
                        start_date: '2023-11-01',
                        end_date: '2023-11-05',
                        system_notes: 'Some notes',
                        feedback: 'Some feedback',
                        document: 'no supporting document',
                        leave_length: 'full_day',
                        leave_comment: 'Vacation',
                        createdAt: '2023-10-20',
                        updatedAt: '2023-10-20'
                    }]] as any);
                }
                return Promise.resolve([[]] as any);
            }
            if (sql.includes('SELECT lr.*, u.firstName, u.lastName, u.email FROM leave_requests lr LEFT JOIN users u ON lr.uid = u.id WHERE lr.id = ? AND lr.status = "pending"')) {
                if (params[0] === TEST_LEAVE_ID) {
                    return Promise.resolve([[{
                        id: TEST_LEAVE_ID,
                        uid: TEST_USER_ID,
                        leave_type: 'Annual Leave',
                        status: 'pending',
                        duration: '5',
                        start_date: '2023-11-01',
                        end_date: '2023-11-05',
                        email: TEST_USER_EMAIL,
                        firstName: TEST_USER_FIRST_NAME,
                        lastName: TEST_USER_LAST_NAME,
                        leave_length: 'full_day'
                    }]] as any);
                }
                return Promise.resolve([[]] as any);
            }
            if (sql.includes('SELECT lr.*, u.firstName, u.lastName, u.email FROM leave_requests lr LEFT JOIN users u ON lr.uid = u.id WHERE lr.id = ? AND lr.status = "approved"')) {
                if (params[0] === TEST_LEAVE_ID) {
                    return Promise.resolve([[{
                        id: TEST_LEAVE_ID,
                        uid: TEST_USER_ID,
                        leave_type: 'Annual Leave',
                        status: 'approved',
                        duration: '5',
                        start_date: '2023-11-01',
                        end_date: '2023-11-05',
                        email: TEST_USER_EMAIL,
                        firstName: TEST_USER_FIRST_NAME,
                        lastName: TEST_USER_LAST_NAME,
                        leave_length: 'full_day'
                    }]] as any);
                }
                return Promise.resolve([[]] as any);
            }
            if (sql.startsWith('SELECT id, leave_type')) {
                return Promise.resolve([[]] as any);
            }
            if (sql.includes('SELECT COUNT(*) as total')) {
                return Promise.resolve([[{ total: 0 }]] as any);
            }
            if (sql.includes('SELECT lr.*, u.firstName, u.lastName, u.email, m.firstName as managerFirstName, m.lastName as managerLastName')) {
                if (params[0] === TEST_LEAVE_ID && params[1] === TEST_USER_ID) {
                    return Promise.resolve([[{
                        id: TEST_LEAVE_ID,
                        uid: TEST_USER_ID,
                        leave_type: 'Annual Leave',
                        status: 'approved',
                        duration: '5',
                        start_date: '2023-11-01',
                        end_date: '2023-11-05',
                        document: 's3://some-path/document.pdf',
                        firstName: TEST_USER_FIRST_NAME,
                        lastName: TEST_USER_LAST_NAME,
                        email: TEST_USER_EMAIL,
                        managerFirstName: 'Manager',
                        managerLastName: 'One'
                    }]] as any);
                }
                return Promise.resolve([[]] as any);
            }
            if (sql.includes('SELECT lr.*, u.firstName')) {
                return Promise.resolve([[]] as any);
            }
            if (sql.includes('SELECT u.id, u.firstName')) {
                return Promise.resolve([[]] as any);
            }
            return Promise.resolve([{} as any]);
        });
        mockBeginTransaction.mockResolvedValue(undefined);
        mockCommit.mockResolvedValue(undefined);
        mockRollback.mockResolvedValue(undefined);
        mockConnectionEnd.mockResolvedValue(undefined);

        mockCalculateTotalLeaveDays.mockResolvedValue({ totalLeaveDays: 5 });
        mockGetExcludedDaysDetails.mockResolvedValue({ weekends: 0, holidays: [], totalExcluded: 0 });
        mockGetPublicHolidayDatesUsingGoogleCalendarAPIAsync.mockResolvedValue([]);

        mockUploadToS3.mockResolvedValue('s3://mock-path/test-doc.pdf');
        mockGetSignedUrlFromS3.mockResolvedValue('https://mock-s3-url/test-doc.pdf');
        mockDeleteFromS3.mockResolvedValue(undefined);

        mockSender.mockResolvedValue(true);
        mockSenderManagement.mockResolvedValue(true);

        // jest.clearAllMocks() (above) clears call history but not implementations set via
        // mockReturnValue in a previous test, so give isWeekend an explicit default here —
        // otherwise whichever test last set it "leaks" its return value into later tests.
        mockIsWeekend.mockReturnValue(false);
    });

    describe('POST /apply-leave', () => {
        // Deliberately far in the future so this fixture never becomes a "backdated"
        // application just because real time has moved on since the test was written.
        const validLeaveData = {
            leave_type: 'Annual Leave',
            leave_start: '2099-11-01',
            leave_end: '2099-11-05',
            leave_length: 'full_day',
            leave_comment: 'Vacation trip'
        };

        it('should submit a leave request successfully (full day)', async () => {
            const response = await request(server)
                .post('/apply-leave')
                .send(validLeaveData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request submitted successfully');
            expect(response.body.data.leaveId).toBe(TEST_LEAVE_ID);
            expect(response.body.data.duration).toBe(5);
            expect(response.body.data.status).toBe('pending');
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO leave_requests'),
                expect.arrayContaining([
                    TEST_USER_ID,
                    'Annual Leave',
                    'pending',
                    '5',
                    new Date('2099-11-01T00:00:00.000Z'),
                    new Date('2099-11-05T00:00:00.000Z'),
                    'A total of 5 leave days will be deducted from your balance.',
                    'Your leave request is Pending, please wait for approval',
                    'no supporting document',
                    'full_day',
                    'Vacation trip',
                    '2023-10-27 10:00:00',
                    '2023-10-27 10:00:00'
                ])
            );
            expect(mockSender).toHaveBeenCalledTimes(1);
            expect(mockSenderManagement).toHaveBeenCalledTimes(1);
        });

        it('should submit a backdated leave request successfully', async () => {
            const backdatedLeaveData = {
                ...validLeaveData,
                leave_start: '2023-01-01',
                leave_end: '2023-01-05'
            };
            mockFormatDateTime.mockReturnValue('2023-10-27 10:00:00');

            const response = await request(server)
                .post('/apply-leave')
                .send(backdatedLeaveData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request submitted successfully');
            expect(response.body.data.is_backdated).toBe(true);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO leave_requests'),
                expect.arrayContaining([
                    expect.anything(), expect.anything(), expect.anything(), expect.anything(),
                    new Date('2023-01-01T00:00:00.000Z'),
                    new Date('2023-01-05T00:00:00.000Z'),
                    'A total of 5 leave days will be deducted from your balance. (This is a backdated leave request)',
                    expect.anything(), expect.anything(), expect.anything(), expect.anything(),
                    '2023-10-27 10:00:00',
                    '2023-10-27 10:00:00'
                ])
            );
        });

        it('should return 400 for invalid leave data (Zod validation)', async () => {
            const invalidLeaveData = {
                ...validLeaveData,
                leave_length: 'InvalidLength'
            };

            const response = await request(server)
                .post('/apply-leave')
                .send(invalidLeaveData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid request data');
            expect(response.body.errors).toBeDefined();
            expect(mockQuery).not.toHaveBeenCalled();
        });

        it('should return 400 if start date is after end date', async () => {
            const invalidDateRangeData = {
                ...validLeaveData,
                leave_start: '2023-11-05',
                leave_end: '2023-11-01'
            };

            const response = await request(server)
                .post('/apply-leave')
                .send(invalidDateRangeData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Start date cannot be after end date');
        });

        it('should return 400 if half_day leave is on a weekend', async () => {
            mockIsWeekend.mockReturnValue(true);
            const halfDayWeekendData = {
                ...validLeaveData,
                leave_start: '2023-11-04',
                leave_end: '2023-11-04',
                leave_length: 'half_day'
            };

            const response = await request(server)
                .post('/apply-leave')
                .send(halfDayWeekendData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot apply for leave on weekends');
            expect(mockIsWeekend).toHaveBeenCalledWith(new Date('2023-11-04T00:00:00.000Z'));
        });

        it('should return 400 if half_day leave is on a public holiday', async () => {
            mockGetPublicHolidayDatesUsingGoogleCalendarAPIAsync.mockResolvedValueOnce([
                { date: '2023-11-01', name: 'Public Holiday' }
            ]);
            const halfDayHolidayData = {
                ...validLeaveData,
                leave_start: '2023-11-01',
                leave_end: '2023-11-01',
                leave_length: 'half_day'
            };

            const response = await request(server)
                .post('/apply-leave')
                .send(halfDayHolidayData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot apply for leave on public holidays');
        });

        it('should return 401 if user email not found in token', async () => {
            mockGetDecodedToken.mockReturnValue({ email: undefined });

            const response = await request(server)
                .post('/apply-leave')
                .send(validLeaveData)
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('User email not found in token');
        });
    });

    describe('GET /leave-history', () => {
        it('should return an empty array if no leave history found', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            const response = await request(server)
                .get('/leave-history')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave history retrieved successfully');
            expect(response.body.data).toEqual([]);
            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringMatching(/FROM leave_requests\s+WHERE uid = \?/),
                [TEST_USER_ID]
            );
        });

        it('should return leave history for the authenticated user', async () => {
            const mockLeaveRecords = [{
                id: TEST_LEAVE_ID,
                leave_type: 'Annual Leave',
                status: 'approved',
                duration: '5',
                start_date: '2023-11-01',
                end_date: '2023-11-05',
                createdAt: '2023-10-20'
            }];
            mockQuery.mockResolvedValueOnce([mockLeaveRecords]);

            const response = await request(server)
                .get('/leave-history')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave history retrieved successfully');
            expect(response.body.data).toEqual(mockLeaveRecords);
        });
    });

    describe('PUT /:id/approve', () => {
        const approvalData = {
            action: 'approve',
            feedback: 'Approved by manager'
        };
        const rejectData = {
            action: 'reject',
            feedback: 'Rejected due to project deadlines'
        };

        const mockPendingLeave = [{
            id: TEST_LEAVE_ID,
            uid: TEST_USER_ID,
            leave_type: 'Annual Leave',
            status: 'pending',
            duration: '5',
            start_date: '2023-11-01',
            end_date: '2023-11-05',
            email: TEST_USER_EMAIL,
            firstName: TEST_USER_FIRST_NAME,
            lastName: TEST_USER_LAST_NAME,
            leave_length: 'full_day'
        }];

        it('should approve a pending leave request successfully', async () => {
            mockGetUserId.mockReturnValue(2);
            mockQuery.mockImplementationOnce((sql: string) => {
                if (sql.includes('SELECT lr.*, u.firstName')) return Promise.resolve([mockPendingLeave]);
                return Promise.resolve([[]]);
            });
            mockQuery.mockImplementationOnce((_sql: string) => Promise.resolve([{} as any]));
            mockQuery.mockImplementationOnce((_sql: string) => Promise.resolve([{} as any]));

            const response = await request(server)
                .put(`/${TEST_LEAVE_ID}/approve`)
                .send(approvalData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request approved successfully');
            expect(response.body.data.status).toBe('approved');
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockSender).toHaveBeenCalledTimes(1);
            expect(mockSender).toHaveBeenCalledWith(
                TEST_USER_EMAIL,
                `${TEST_USER_FIRST_NAME} ${TEST_USER_LAST_NAME}`,
                expect.stringContaining('has been <strong>approved</strong>'),
                expect.stringContaining('Leave Request approved'),
                'approved'
            );
        });

        it('should reject a pending leave request successfully', async () => {
            mockGetUserId.mockReturnValue(2);
            mockQuery.mockImplementationOnce((sql: string) => {
                if (sql.includes('SELECT lr.*, u.firstName')) return Promise.resolve([mockPendingLeave]);
                return Promise.resolve([[]]);
            });
            mockQuery.mockImplementationOnce((_sql: string) => Promise.resolve([{} as any]));
            mockQuery.mockImplementationOnce((_sql: string) => Promise.resolve([{} as any]));

            const response = await request(server)
                .put(`/${TEST_LEAVE_ID}/approve`)
                .send(rejectData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request rejected successfully');
            expect(response.body.data.status).toBe('rejected');
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockSender).toHaveBeenCalledTimes(1);
            expect(mockSender).toHaveBeenCalledWith(
                TEST_USER_EMAIL,
                `${TEST_USER_FIRST_NAME} ${TEST_USER_LAST_NAME}`,
                expect.stringContaining('has been <strong>rejected</strong>'),
                expect.stringContaining('Leave Request rejected'),
                'rejected'
            );
        });

        it('should return 404 if leave request not found or not pending', async () => {
            mockGetUserId.mockReturnValue(2);
            mockQuery.mockResolvedValueOnce([[]]);

            const response = await request(server)
                .put(`/${TEST_LEAVE_ID}/approve`)
                .send(approvalData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Leave request not found or already processed');
            expect(mockBeginTransaction).not.toHaveBeenCalled();
            expect(mockCommit).not.toHaveBeenCalled();
            expect(mockRollback).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid approval data (Zod validation)', async () => {
            mockGetUserId.mockReturnValue(2);

            const response = await request(server)
                .put(`/${TEST_LEAVE_ID}/approve`)
                .send({ action: 'invalid_action' })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid request data');
            expect(response.body.errors).toBeDefined();
        });

        it('should rollback transaction if database update fails', async () => {
            mockGetUserId.mockReturnValue(2);
            mockQuery.mockImplementationOnce((sql: string) => {
                if (sql.includes('SELECT lr.*, u.firstName')) return Promise.resolve([mockPendingLeave]);
                return Promise.resolve([[]]);
            });
            mockQuery.mockImplementationOnce((_sql: string) => {
                throw new Error('DB Error');
            });

            const response = await request(server)
                .put(`/${TEST_LEAVE_ID}/approve`)
                .send(approvalData)
                .expect(500);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to process leave request');
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockCommit).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /leave/:id', () => {
        const mockPendingLeave = [{
            id: TEST_LEAVE_ID,
            uid: TEST_USER_ID,
            leave_type: 'Annual Leave',
            status: 'pending',
            document: 'no supporting document'
        }];
        const mockPendingLeaveWithDoc = [{
            id: TEST_LEAVE_ID,
            uid: TEST_USER_ID,
            leave_type: 'Annual Leave',
            status: 'pending',
            document: 's3://some-path/document.pdf'
        }];
        const mockApprovedLeave = [{
            id: TEST_LEAVE_ID,
            uid: TEST_USER_ID,
            leave_type: 'Annual Leave',
            status: 'approved',
            document: 'no supporting document'
        }];

        it('should delete a pending leave request successfully', async () => {
            mockQuery.mockImplementationOnce((sql: string, params: any[]) => {
                if (sql.includes('SELECT * FROM leave_requests WHERE id = ? AND uid = ?') && String(params[0]) === String(TEST_LEAVE_ID)) {
                    return Promise.resolve([mockPendingLeave]);
                }
                return Promise.resolve([[]]);
            });
            mockQuery.mockImplementationOnce(() => Promise.resolve([{} as any]));

            const response = await request(server)
                .delete(`/leave/${TEST_LEAVE_ID}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request deleted successfully');
            expect(mockQuery).toHaveBeenCalledWith(
                'DELETE FROM leave_requests WHERE id = ? AND uid = ?',
                [String(TEST_LEAVE_ID), TEST_USER_ID]
            );
            expect(mockDeleteFromS3).not.toHaveBeenCalled();
        });

        it('should delete associated document from S3 if present', async () => {
            mockQuery.mockImplementationOnce((sql: string, params: any[]) => {
                if (sql.includes('SELECT * FROM leave_requests WHERE id = ? AND uid = ?') && String(params[0]) === String(TEST_LEAVE_ID)) {
                    return Promise.resolve([mockPendingLeaveWithDoc]);
                }
                return Promise.resolve([[]]);
            });
            mockQuery.mockImplementationOnce(() => Promise.resolve([{} as any]));

            const response = await request(server)
                .delete(`/leave/${TEST_LEAVE_ID}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Leave request deleted successfully');
            expect(mockDeleteFromS3).toHaveBeenCalledWith('s3://some-path/document.pdf');
        });

        it('should return 404 if leave request not found', async () => {
            mockQuery.mockResolvedValueOnce([[]]);

            const response = await request(server)
                .delete(`/leave/${TEST_LEAVE_ID}`)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Leave request not found');
            expect(mockQuery).not.toHaveBeenCalledWith(
                'DELETE FROM leave_requests WHERE id = ? AND uid = ?',
                expect.any(Array)
            );
        });

        it('should return 400 if leave request is not pending', async () => {
            mockQuery.mockImplementationOnce((sql: string, params: any[]) => {
                if (sql.includes('SELECT * FROM leave_requests WHERE id = ? AND uid = ?') && String(params[0]) === String(TEST_LEAVE_ID)) {
                    return Promise.resolve([mockApprovedLeave]);
                }
                return Promise.resolve([[]]);
            });

            const response = await request(server)
                .delete(`/leave/${TEST_LEAVE_ID}`)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Cannot delete leave request that is not Pending');
            expect(mockQuery).not.toHaveBeenCalledWith(
                'DELETE FROM leave_requests WHERE id = ? AND uid = ?',
                expect.any(Array)
            );
        });
    });
});
