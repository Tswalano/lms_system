import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import https from "https";

dayjs.extend(utc);

const GOOGLE_CALENDAR_API_BASE_URL = "https://www.googleapis.com/calendar/v3/calendars";
const GOOGLE_CALENDAR_API_REGION = "en.sa";
const GOOGLE_CALENDAR_API_CALENDAR_ID = "holiday@group.v.calendar.google.com";
const GOOGLE_CALENDAR_API_CALENDAR_FILTER = "public holiday";

type PublicHoliday = {
    date: string;
    name: string;
};


// Helper functions
const isWeekend = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
};

const calculateTotalDays = (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

const calculateWeekendDays = (start: Date, end: Date): number => {
    let weekendDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
        if (isWeekend(currentDate)) {
            weekendDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return weekendDays;
};

const readSecretValueAsync = async (secretName: string): Promise<string | null> => {
    const secretValueKeyName = "SECRET_VALUE_KEY";
    const secretValueKey = process.env[secretValueKeyName];

    if (!secretValueKey) {
        throw new Error(`Required environment variable [${secretValueKeyName}] is not configured.`);
    }

    try {
        const secretsClient = new SecretsManagerClient({});
        const command = new GetSecretValueCommand({ SecretId: secretName });
        const response = await secretsClient.send(command);
        const secretValue = JSON.parse(response.SecretString || '{}');
        return secretValue[secretValueKey] || null;
    } catch (secretError) {
        console.error(`The secret [${secretName}] could not be read: [${secretError instanceof Error ? secretError.message : String(secretError)}]`);
        return null;
    }
};

export const getPublicHolidayDatesUsingGoogleCalendarAPIAsync = async (
    start: Date,
    end: Date
): Promise<PublicHoliday[]> => {
    const calendarApiKeyVarName = "GOOGLE_CALENDAR_API_KEY_SECRET_NAME";
    const googleApiKeySecretName = process.env[calendarApiKeyVarName];

    if (!googleApiKeySecretName) {
        throw new Error(`Required environment variable [${calendarApiKeyVarName}] is not configured.`);
    }

    const apiKey = await readSecretValueAsync(googleApiKeySecretName);

    if (!apiKey) {
        throw new Error(`Required secret value [${googleApiKeySecretName}] could not be read.`);
    }

    const startDateString = start.toISOString();
    const endDateString = end.toISOString();
    const url = `${GOOGLE_CALENDAR_API_BASE_URL}/${GOOGLE_CALENDAR_API_REGION}%23${GOOGLE_CALENDAR_API_CALENDAR_ID}/events?key=${apiKey}&timeMin=${startDateString}&timeMax=${endDateString}&q=${GOOGLE_CALENDAR_API_CALENDAR_FILTER}`;

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            let rawData = "";

            if (response.statusCode === 200) {
                response.on("data", (chunk) => {
                    rawData += chunk;
                });

                response.on("end", () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        const publicHolidays: PublicHoliday[] = parsedData.items.map((holiday: any) => ({
                            date: holiday.start.date,
                            name: holiday.summary,
                        }));
                        resolve(publicHolidays);
                    } catch (responseParseError) {
                        reject(
                            new Error(
                                `There was an error parsing the API response: [${responseParseError instanceof Error
                                    ? responseParseError.message
                                    : String(responseParseError)
                                }]`
                            )
                        );
                    }
                });
            } else {
                response.on("data", (chunk) => {
                    rawData += chunk;
                });
                response.on("end", () => {
                    let errorMessage = `Received an unexpected response code: [${response.statusCode}] [${response.statusMessage}]`;
                    try {
                        errorMessage += " - " + rawData;
                    } catch {
                        errorMessage += " (Failed to parse response body)";
                    }
                    reject(new Error(errorMessage));
                });
            }
        }).on("error", (httpError) => {
            reject(
                new Error(
                    `There was an error making the call to the API: [${httpError instanceof Error ? httpError.message : String(httpError)
                    }]`
                )
            );
        });
    });
};


export const calculatePublicHolidays = async (start: Date, end: Date): Promise<number> => {
    try {
        const publicHolidayDates = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(start, end);
        const publicHolidays = publicHolidayDates.filter(h => !isWeekend(new Date(h.date)));
        return publicHolidays.length;
    } catch (error) {
        console.error('Error calculating public holidays:', error);
        return 0;
    }
};

export const calculateTotalLeaveDays = async (start: Date, end: Date): Promise<{ totalDays: number; weekends: number; holidays: number; totalLeaveDays: number }> => {
    const totalDays = calculateTotalDays(start, end);
    const weekends = calculateWeekendDays(start, end);
    const holidays = await calculatePublicHolidays(start, end);

    return {
        totalDays,
        weekends,
        holidays,
        totalLeaveDays: totalDays - weekends - holidays
    };
};

export const getExcludedDaysDetails = async (start: Date, end: Date): Promise<ExcludedDaysDetails> => {
    const weekends = calculateWeekendDays(start, end);
    const holidays = await getPublicHolidayDatesUsingGoogleCalendarAPIAsync(start, end);

    return {
        weekends,
        holidays: holidays.map(holiday => new Date(holiday.date)),
        totalExcluded: weekends + holidays.length
    };
};

interface ExcludedDaysDetails {
    weekends: number;
    holidays: Date[];
    totalExcluded: number;
}