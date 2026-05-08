import { createLeaveEvents, deleteLeaveEvents } from '../lambda/integrations/outlookCalendar';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

// ── AWS SDK mock ─────────────────────────────────────────────────────────────
jest.mock('@aws-sdk/client-secrets-manager', () => ({
    SecretsManagerClient: jest.fn(),
    GetSecretValueCommand: jest.fn(),
}));

const MockSecretsManagerClient = SecretsManagerClient as jest.MockedClass<typeof SecretsManagerClient>;

// ── Global fetch mock ────────────────────────────────────────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Constants ────────────────────────────────────────────────────────────────
const SHARED_MAILBOX = 'leave-calendar@disraptor.co.za';
const EMPLOYEE_EMAIL = 'jane.doe@disraptor.co.za';
const SHARED_EVENT_ID = 'shared-graph-event-id-abc123';
const PERSONAL_EVENT_ID = 'personal-graph-event-id-xyz789';
const ACCESS_TOKEN = 'mock-access-token';

const VALID_AZURE_SECRET = JSON.stringify({
    AZURE_TENANT_ID: 'test-tenant-id',
    AZURE_CLIENT_ID: 'test-client-id',
    AZURE_CLIENT_SECRET: 'test-client-secret',
});

const SAMPLE_PARAMS = {
    employeeEmail: EMPLOYEE_EMAIL,
    employeeName: 'Jane Doe',
    leaveType: 'Annual Leave',
    startDate: '2024-03-01',
    endDate: '2024-03-05',
    managerName: 'John Manager',
};

// ── Response helpers ─────────────────────────────────────────────────────────
const jsonResponse = (body: object, status = 200): Response =>
    ({
        ok: status >= 200 && status < 300,
        status,
        json: jest.fn().mockResolvedValue(body),
        text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    } as unknown as Response);

const errorResponse = (text: string, status: number): Response =>
    ({
        ok: false,
        status,
        json: jest.fn().mockRejectedValue(new Error('not json')),
        text: jest.fn().mockResolvedValue(text),
    } as unknown as Response);

// ── Shared setup helper ──────────────────────────────────────────────────────
let mockSend: jest.Mock;

/** Re-apply the SecretsManager mock after jest.clearAllMocks() wipes it. */
const setupSecretsMock = () => {
    mockSend = jest.fn().mockResolvedValue({ SecretString: VALID_AZURE_SECRET });
    MockSecretsManagerClient.mockImplementation(() => ({ send: mockSend } as any));
};

/** Queue the standard happy-path fetch responses: token → shared event → personal event */
const setupHappyPathFetch = () => {
    mockFetch
        .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
        .mockResolvedValueOnce(jsonResponse({ id: SHARED_EVENT_ID }))
        .mockResolvedValueOnce(jsonResponse({ id: PERSONAL_EVENT_ID }));
};

// ── Suite ────────────────────────────────────────────────────────────────────
describe('outlookCalendar integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.AZURE_CALENDAR_SECRET_NAME = 'lmsDevelopment';
        process.env.OUTLOOK_SHARED_MAILBOX = SHARED_MAILBOX;
        setupSecretsMock();
    });

    // ── Token acquisition ────────────────────────────────────────────────────
    describe('token acquisition', () => {
        it('calls the Azure token endpoint with client credentials grant', async () => {
            setupHappyPathFetch();
            await createLeaveEvents(SAMPLE_PARAMS);

            const tokenCall = mockFetch.mock.calls[0];
            expect(tokenCall[0]).toMatch(/login\.microsoftonline\.com\/test-tenant-id\/oauth2\/v2\.0\/token/);
            expect(tokenCall[1].method).toBe('POST');

            const sentBody = tokenCall[1].body as string;
            expect(sentBody).toContain('grant_type=client_credentials');
            expect(sentBody).toContain('client_id=test-client-id');
            expect(sentBody).toContain('client_secret=test-client-secret');
            expect(sentBody).toContain('scope=https%3A%2F%2Fgraph.microsoft.com%2F.default');
        });

        it('reads Azure credentials from AWS Secrets Manager', async () => {
            setupHappyPathFetch();
            await createLeaveEvents(SAMPLE_PARAMS);

            expect(mockSend).toHaveBeenCalledTimes(1);
        });

        it('returns both null IDs when AZURE_CALENDAR_SECRET_NAME env var is missing', async () => {
            delete process.env.AZURE_CALENDAR_SECRET_NAME;

            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBeNull();
            expect(result.personalEventId).toBeNull();
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it('returns both null IDs when Azure credentials are absent from the secret', async () => {
            mockSend.mockResolvedValueOnce({
                SecretString: JSON.stringify({ someOtherKey: 'value' }),
            });

            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBeNull();
            expect(result.personalEventId).toBeNull();
        });

        it('returns both null IDs when the token endpoint returns a non-200 response', async () => {
            mockFetch.mockResolvedValueOnce(errorResponse('unauthorized', 401));

            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBeNull();
            expect(result.personalEventId).toBeNull();
        });
    });

    // ── createLeaveEvents ────────────────────────────────────────────────────
    describe('createLeaveEvents', () => {
        beforeEach(() => {
            setupHappyPathFetch();
        });

        it('returns both event IDs on success', async () => {
            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBe(SHARED_EVENT_ID);
            expect(result.personalEventId).toBe(PERSONAL_EVENT_ID);
        });

        it('creates the shared calendar event on the shared mailbox URL', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const sharedCall = mockFetch.mock.calls[1];
            expect(sharedCall[0]).toBe(
                `https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events`
            );
            expect(sharedCall[1].method).toBe('POST');
            expect(sharedCall[1].headers['Authorization']).toBe(`Bearer ${ACCESS_TOKEN}`);
        });

        it('creates the personal calendar event on the employee calendar URL', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const personalCall = mockFetch.mock.calls[2];
            expect(personalCall[0]).toBe(
                `https://graph.microsoft.com/v1.0/users/${EMPLOYEE_EMAIL}/calendar/events`
            );
            expect(personalCall[1].method).toBe('POST');
        });

        it('sends NO attendees — prevents org-wide email invitations', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            // Both event creation calls (indices 1 and 2) must have an empty attendees array
            for (const callIndex of [1, 2]) {
                const payload = JSON.parse(mockFetch.mock.calls[callIndex][1].body);
                expect(payload.attendees).toEqual([]);
            }
        });

        it('sets isAllDay=true and showAs="oof" in the event payload', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
            expect(payload.isAllDay).toBe(true);
            expect(payload.showAs).toBe('oof');
        });

        it('formats the event subject as "{employeeName} - {leaveType}"', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
            expect(payload.subject).toBe('Jane Doe - Annual Leave');
        });

        it('adds 1 day to endDate to satisfy MS Graph exclusive-end convention', async () => {
            // SAMPLE_PARAMS: start=2024-03-01, end=2024-03-05 → Graph end must be 2024-03-06
            await createLeaveEvents(SAMPLE_PARAMS);

            const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
            expect(payload.start.dateTime).toBe('2024-03-01T00:00:00');
            expect(payload.end.dateTime).toBe('2024-03-06T00:00:00');
        });

        it('uses Africa/Johannesburg timezone', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
            expect(payload.start.timeZone).toBe('Africa/Johannesburg');
            expect(payload.end.timeZone).toBe('Africa/Johannesburg');
        });

        it('includes the manager name in the event body', async () => {
            await createLeaveEvents(SAMPLE_PARAMS);

            const payload = JSON.parse(mockFetch.mock.calls[1][1].body);
            expect(payload.body.content).toContain('John Manager');
        });

        it('returns null sharedEventId but still creates personal event if shared creation fails', async () => {
            // Reset and provide custom fetch sequence
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(errorResponse('Mailbox not found', 404)) // shared fails
                .mockResolvedValueOnce(jsonResponse({ id: PERSONAL_EVENT_ID })); // personal succeeds

            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBeNull();
            expect(result.personalEventId).toBe(PERSONAL_EVENT_ID);
        });

        it('returns null personalEventId but still records shared event if personal creation fails', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({ id: SHARED_EVENT_ID }))
                .mockResolvedValueOnce(errorResponse('Forbidden', 403)); // personal fails

            const result = await createLeaveEvents(SAMPLE_PARAMS);

            expect(result.sharedEventId).toBe(SHARED_EVENT_ID);
            expect(result.personalEventId).toBeNull();
        });

        it('returns both null if both event creations fail, without throwing', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(errorResponse('Server error', 500))
                .mockResolvedValueOnce(errorResponse('Server error', 500));

            await expect(createLeaveEvents(SAMPLE_PARAMS)).resolves.toEqual({
                sharedEventId: null,
                personalEventId: null,
            });
        });
    });

    // ── deleteLeaveEvents ────────────────────────────────────────────────────
    describe('deleteLeaveEvents', () => {
        beforeEach(() => {
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({}, 204))
                .mockResolvedValueOnce(jsonResponse({}, 204));
        });

        it('deletes the shared calendar event using the correct URL and token', async () => {
            await deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL);

            const sharedDeleteCall = mockFetch.mock.calls[1];
            expect(sharedDeleteCall[0]).toBe(
                `https://graph.microsoft.com/v1.0/users/${SHARED_MAILBOX}/calendar/events/${SHARED_EVENT_ID}`
            );
            expect(sharedDeleteCall[1].method).toBe('DELETE');
            expect(sharedDeleteCall[1].headers['Authorization']).toBe(`Bearer ${ACCESS_TOKEN}`);
        });

        it('deletes the personal calendar event using the correct URL', async () => {
            await deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL);

            const personalDeleteCall = mockFetch.mock.calls[2];
            expect(personalDeleteCall[0]).toBe(
                `https://graph.microsoft.com/v1.0/users/${EMPLOYEE_EMAIL}/calendar/events/${PERSONAL_EVENT_ID}`
            );
            expect(personalDeleteCall[1].method).toBe('DELETE');
        });

        it('treats a 404 on the shared event as success (event already gone)', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(errorResponse('Not found', 404))
                .mockResolvedValueOnce(jsonResponse({}, 204));

            await expect(
                deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL)
            ).resolves.toBeUndefined();
        });

        it('treats a 404 on the personal event as success (event already gone)', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({}, 204))
                .mockResolvedValueOnce(errorResponse('Not found', 404));

            await expect(
                deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL)
            ).resolves.toBeUndefined();
        });

        it('skips shared deletion and only deletes personal when sharedEventId is null', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({}, 204));

            await deleteLeaveEvents(null, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL);

            // token call + exactly one delete (personal)
            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockFetch.mock.calls[1][0]).toContain(EMPLOYEE_EMAIL);
        });

        it('skips personal deletion and only deletes shared when personalEventId is null', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({}, 204));

            await deleteLeaveEvents(SHARED_EVENT_ID, null, EMPLOYEE_EMAIL);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockFetch.mock.calls[1][0]).toContain(SHARED_MAILBOX);
        });

        it('makes no API calls when both IDs are null', async () => {
            mockFetch.mockReset();
            await deleteLeaveEvents(null, null, EMPLOYEE_EMAIL);

            expect(mockFetch).not.toHaveBeenCalled();
            expect(mockSend).not.toHaveBeenCalled();
        });

        it('does not throw when shared deletion fails with a non-404 error, and still attempts personal', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(errorResponse('Internal Server Error', 500))
                .mockResolvedValueOnce(jsonResponse({}, 204));

            await expect(
                deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL)
            ).resolves.toBeUndefined();

            // personal delete must still have been called
            expect(mockFetch.mock.calls[2][0]).toContain(EMPLOYEE_EMAIL);
        });

        it('does not throw when personal deletion fails with a non-404 error', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch
                .mockResolvedValueOnce(jsonResponse({ access_token: ACCESS_TOKEN }))
                .mockResolvedValueOnce(jsonResponse({}, 204))
                .mockResolvedValueOnce(errorResponse('Forbidden', 403));

            await expect(
                deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL)
            ).resolves.toBeUndefined();
        });

        it('returns without making any Graph calls when token acquisition fails', async () => {
            mockFetch.mockReset();
            setupSecretsMock();
            mockFetch.mockResolvedValueOnce(errorResponse('unauthorized', 401)); // token fails

            await expect(
                deleteLeaveEvents(SHARED_EVENT_ID, PERSONAL_EVENT_ID, EMPLOYEE_EMAIL)
            ).resolves.toBeUndefined();

            // only the token call was made — no delete calls
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });
    });
});
