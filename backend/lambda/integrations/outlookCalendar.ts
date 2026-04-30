import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";
const SHARED_MAILBOX = process.env.OUTLOOK_SHARED_MAILBOX || "leave-calendar@disraptor.co.za";
const TIMEZONE = "Africa/Johannesburg";

interface AzureCredentials {
    tenantId: string;
    clientId: string;
    clientSecret: string;
}

export interface CreateLeaveEventsParams {
    employeeEmail: string;
    employeeName: string;
    leaveType: string;
    startDate: string | Date;
    endDate: string | Date;
    managerName: string;
}

export interface LeaveEventIds {
    sharedEventId: string | null;
    personalEventId: string | null;
}

async function getAzureCredentials(): Promise<AzureCredentials> {
    // Local dev: read directly from env vars to skip Secrets Manager
    if (process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET) {
        return {
            tenantId: process.env.AZURE_TENANT_ID,
            clientId: process.env.AZURE_CLIENT_ID,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
        };
    }

    const secretName = process.env.AZURE_CALENDAR_SECRET_NAME;
    if (!secretName) throw new Error("AZURE_CALENDAR_SECRET_NAME env var not set");

    const client = new SecretsManagerClient({ region: "af-south-1" });
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    const secret = JSON.parse(response.SecretString || "{}");

    const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = secret;
    if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
        throw new Error("Missing Azure AD credentials in secret (expected AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)");
    }
    return { tenantId: AZURE_TENANT_ID, clientId: AZURE_CLIENT_ID, clientSecret: AZURE_CLIENT_SECRET };
}

async function getGraphToken(): Promise<string> {
    const { tenantId, clientId, clientSecret } = await getAzureCredentials();
    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
    });

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to acquire Graph token: ${err}`);
    }

    const data = await res.json() as { access_token: string };
    return data.access_token;
}

function buildEventPayload(
    employeeName: string,
    leaveType: string,
    startDate: string | Date,
    endDate: string | Date,
    managerName: string
): object {
    // Extract the calendar date in SAST regardless of how the timestamp arrives
    // (mysql2 may return dates as UTC midnight or SAST midnight depending on server config)
    const toSastDateStr = (d: Date): string =>
        new Intl.DateTimeFormat('en-CA', {
            timeZone: TIMEZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).format(d);

    const startStr = toSastDateStr(new Date(startDate));

    // MS Graph all-day events use exclusive end dates (end = last actual day + 1)
    const endSastStr = toSastDateStr(new Date(endDate));
    const [eYear, eMonth, eDay] = endSastStr.split('-').map(Number);
    const endStr = toSastDateStr(new Date(eYear, eMonth - 1, eDay + 1));

    return {
        subject: `${employeeName} - ${leaveType}`,
        isAllDay: true,
        showAs: "oof",
        sensitivity: "normal",
        attendees: [],
        start: { dateTime: `${startStr}T00:00:00`, timeZone: TIMEZONE },
        end: { dateTime: `${endStr}T00:00:00`, timeZone: TIMEZONE },
        body: {
            contentType: "text",
            content: `${leaveType} — approved by ${managerName}`,
        },
    };
}

async function createEventOnCalendar(token: string, userEmail: string, payload: object): Promise<string> {
    const res = await fetch(`${GRAPH_BASE}/users/${userEmail}/calendar/events`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Graph API event creation failed for ${userEmail}: ${err}`);
    }

    const data = await res.json() as { id: string };
    return data.id;
}

async function deleteEventFromCalendar(token: string, userEmail: string, eventId: string): Promise<void> {
    const res = await fetch(`${GRAPH_BASE}/users/${userEmail}/calendar/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });

    // 404 means already deleted — treat as success
    if (!res.ok && res.status !== 404) {
        const err = await res.text();
        throw new Error(`Graph API event deletion failed for ${userEmail}: ${err}`);
    }
}

export async function createLeaveEvents(params: CreateLeaveEventsParams): Promise<LeaveEventIds> {
    const { employeeEmail, employeeName, leaveType, startDate, endDate, managerName } = params;
    const result: LeaveEventIds = { sharedEventId: null, personalEventId: null };

    let token: string;
    try {
        token = await getGraphToken();
    } catch (err) {
        console.error("[Outlook] Failed to acquire Graph token:", err);
        return result;
    }

    const payload = buildEventPayload(employeeName, leaveType, startDate, endDate, managerName);

    try {
        result.sharedEventId = await createEventOnCalendar(token, SHARED_MAILBOX, payload);
    } catch (err) {
        console.error("[Outlook] Failed to create shared calendar event:", err);
    }

    try {
        result.personalEventId = await createEventOnCalendar(token, employeeEmail, payload);
    } catch (err) {
        console.error("[Outlook] Failed to create personal calendar event:", err);
    }

    return result;
}

export async function deleteLeaveEvents(
    sharedEventId: string | null,
    personalEventId: string | null,
    employeeEmail: string
): Promise<void> {
    if (!sharedEventId && !personalEventId) return;

    let token: string;
    try {
        token = await getGraphToken();
    } catch (err) {
        console.error("[Outlook] Failed to acquire Graph token for deletion:", err);
        return;
    }

    if (sharedEventId) {
        try {
            await deleteEventFromCalendar(token, SHARED_MAILBOX, sharedEventId);
        } catch (err) {
            console.error("[Outlook] Failed to delete shared calendar event:", err);
        }
    }

    if (personalEventId) {
        try {
            await deleteEventFromCalendar(token, employeeEmail, personalEventId);
        } catch (err) {
            console.error("[Outlook] Failed to delete personal calendar event:", err);
        }
    }
}
