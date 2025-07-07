"use strict";
// import * as zlib from 'zlib';
// import { Context } from 'aws-lambda';
// import { sender } from './emailMiddleware'; // Assuming emailMiddleware is correctly implemented and available
Object.defineProperty(exports, "__esModule", { value: true });
// // Types and Interfaces
// interface CloudWatchLogsEvent {
//     awslogs: {
//         data: string; // Base64 encoded, compressed log data
//     };
// }
// interface CloudWatchLogsData {
//     messageType: string;
//     owner: string;
//     logGroup: string;
//     logStream: string;
//     subscriptionFilters: string[];
//     logEvents: LogEvent[];
// }
// interface LogEvent {
//     id: string;
//     timestamp: number;
//     message: string; // The actual log message string
// }
// interface LeaveStatusData {
//     email: string;
//     status: string;
//     [key: string]: any; // Allow for additional properties in the JSON payload
// }
// interface NameData {
//     firstName: string;
//     lastName: string;
// }
// interface EmailContent {
//     subject: string;
//     body: string;
// }
// type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled';
// /**
//  * Main Lambda handler for processing CloudWatch logs and sending leave status emails.
//  * This function is now async and returns a Promise, which is the preferred way for
//  * Node.js Lambda functions to handle asynchronous operations.
//  */
// export const handler = async (input: CloudWatchLogsEvent, context: Context): Promise<void> => {
//     console.log("Lambda handler invoked.");
//     const payload: Buffer = Buffer.from(input.awslogs.data, 'base64');
//     // Promisify zlib.gunzip to use with async/await
//     const gunzipPromise = (data: Buffer): Promise<Buffer> => {
//         return new Promise((resolve, reject) => {
//             zlib.gunzip(data, (error, result) => {
//                 if (error) {
//                     return reject(error);
//                 }
//                 if (!result) {
//                     return reject(new Error("Failed to decompress payload: no result buffer"));
//                 }
//                 resolve(result);
//             });
//         });
//     };
//     try {
//         console.log("Decompressing payload...");
//         const decompressedData: Buffer = await gunzipPromise(payload);
//         const logData: CloudWatchLogsData = JSON.parse(decompressedData.toString('utf8'));
//         console.log("Event Data (parsed):", JSON.stringify(logData, null, 2));
//         // Process log events if any exist
//         if (logData.logEvents && logData.logEvents.length > 0) {
//             console.log(`Found ${logData.logEvents.length} log events to process.`);
//             await processLogEvents(logData.logEvents);
//             console.log("Finished processing all log events.");
//         } else {
//             console.log("No log events found in the payload. Nothing to process.");
//         }
//         // When using async/await, the Lambda function automatically succeeds
//         // when the returned Promise resolves. No need for context.succeed().
//         console.log("Lambda execution completed successfully.");
//     } catch (error) {
//         console.error("❌ Error during Lambda execution:", error);
//         // When using async/await, throwing an error will cause the Lambda function to fail.
//         // No need for context.fail().
//         throw error;
//     }
// };
// /**
//  * Process multiple log events concurrently.
//  * Uses Promise.allSettled to ensure all events are attempted, and results (fulfilled/rejected)
//  * are collected without stopping on the first error.
//  */
// async function processLogEvents(logEvents: LogEvent[]): Promise<void> {
//     console.log("Starting batch processing of log events...");
//     const results = await Promise.allSettled(
//         logEvents.map(logEvent => processLogEvent(logEvent))
//     );
//     let successfulCount = 0;
//     let failedCount = 0;
//     results.forEach((result, index) => {
//         const eventId = logEvents[index]?.id || `unknown-event-${index}`;
//         if (result.status === 'fulfilled') {
//             successfulCount++;
//             console.log(`✅ Log event ${eventId} processed successfully.`);
//         } else {
//             failedCount++;
//             console.error(`❌ Failed to process log event ${eventId}:`, result.reason);
//         }
//     });
//     if (failedCount > 0) {
//         console.warn(`Batch processing finished: ${successfulCount} successful, ${failedCount} failed.`);
//         // Depending on requirements, you might want to throw an error here if any failure
//         // should indicate an overall Lambda failure, or log failures to a separate system.
//     } else {
//         console.log(`All ${successfulCount} log events in the batch processed successfully.`);
//     }
// }
// /**
//  * Process a single log event: extract data and send an email.
//  */
// async function processLogEvent(logEvent: LogEvent): Promise<void> {
//     console.log(`Processing log event ID: ${logEvent.id}`);
//     console.log("Raw log message:", logEvent.message);
//     try {
//         // Extract the leave status information, assuming it's the last tab-separated part
//         const messageParts: string[] = logEvent.message.split('\t');
//         const retrieveLeaveStatus: string | undefined = messageParts[messageParts.length - 1]?.trim();
//         if (!retrieveLeaveStatus) {
//             throw new Error("Could not extract leave status string from log message.");
//         }
//         console.log("Extracted raw status part:", retrieveLeaveStatus);
//         // Remove the 'LEAVE_STATUS: ' prefix
//         const leaveStatusString: string = retrieveLeaveStatus.replace(/^LEAVE_STATUS:\s*/, '');
//         console.log("Cleaned status string for JSON parsing:", leaveStatusString);
//         // Parse the JSON data
//         let emailData: LeaveStatusData;
//         try {
//             emailData = JSON.parse(leaveStatusString) as LeaveStatusData;
//         } catch (parseError) {
//             console.error(`Error parsing leave status JSON from string: '${leaveStatusString}'`, parseError);
//             throw new Error(`Invalid JSON in leave status: ${leaveStatusString}`);
//         }
//         const { email, status } = emailData;
//         console.log("Parsed email data:", { email, status });
//         // Validate required fields
//         if (!email || !status) {
//             throw new Error(`Missing required fields in parsed data: email='${email}', status='${status}'`);
//         }
//         // Validate email format
//         if (!isValidEmail(email)) {
//             throw new Error(`Invalid email format detected: ${email}`);
//         }
//         // Validate status (log warning if unknown, but proceed)
//         if (!isValidStatus(status)) {
//             console.warn(`Unknown leave status '${status}' for email '${email}'. Proceeding with default content.`);
//         }
//         // Extract and format name from email address
//         const { firstName, lastName }: NameData = extractNameFromEmail(email);
//         const fullName: string = `${firstName} ${lastName}`.trim();
//         console.log("Extracted full name:", fullName);
//         // Prepare email content based on status
//         const emailContent: EmailContent = generateEmailContent(status as LeaveStatus);
//         console.log(`Generated email content for status '${status}'. Subject: '${emailContent.subject}'`);
//         // Send the email using the imported sender function
//         const result = await sender(email, fullName, emailContent.body, emailContent.subject, status);
//         console.log(`Email successfully sent to ${email}. MessageId: ${result.messageId}`);
//         console.log("Email sender result:", result);
//     } catch (error) {
//         console.error(`❌ Error processing log event ${logEvent.id}:`, error);
//         throw error; // Re-throw to be caught by Promise.allSettled
//     }
// }
// /**
//  * Extract first name and last name from an email address.
//  * Attempts to capitalize the first letter of each part.
//  */
// function extractNameFromEmail(email: string): NameData {
//     try {
//         const localPart: string = email.split('@')[0] || '';
//         // Replace common separators with a dot for consistent splitting
//         const cleanedLocalPart = localPart.replace(/[-_]/g, '.');
//         const emailParts: string[] = cleanedLocalPart.split('.');
//         let firstName: string = emailParts[0] || '';
//         let lastName: string = emailParts.length > 1 ? emailParts.slice(1).join(' ') : '';
//         // Capitalize first letter of first and last name
//         firstName = capitalizeFirstLetter(firstName);
//         lastName = capitalizeFirstLetter(lastName);
//         return { firstName, lastName };
//     } catch (error) {
//         console.error("Error extracting name from email:", error);
//         // Fallback to a generic name if extraction fails
//         return { firstName: "Valued", lastName: "Customer" };
//     }
// }
// /**
//  * Capitalize the first letter of a string and make the rest lowercase.
//  */
// function capitalizeFirstLetter(str: string): string {
//     if (!str || typeof str !== 'string' || str.length === 0) {
//         return '';
//     }
//     return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
// }
// /**
//  * Generate email subject and body content based on the leave status.
//  */
// function generateEmailContent(status: LeaveStatus): EmailContent {
//     const statusLower = status.toLowerCase() as LeaveStatus;
//     const contentMap: Record<LeaveStatus, EmailContent> = {
//         approved: {
//             subject: "✅ Leave Request Approved",
//             body: "Great news! Your leave request has been approved. You can proceed with your planned time off."
//         },
//         rejected: {
//             subject: "❌ Leave Request Declined",
//             body: "Your leave request has been declined. Please contact your manager for more details or to discuss alternative arrangements."
//         },
//         pending: {
//             subject: "⏳ Leave Request Under Review",
//             body: "Your leave request is currently being reviewed by your manager. You will receive another notification once a decision has been made."
//         },
//         cancelled: {
//             subject: "🚫 Leave Request Cancelled",
//             body: "Your leave request has been cancelled as per your request or system update. If this was an error, please submit a new request."
//         }
//     };
//     // Return specific content or a generic default if status is not explicitly mapped
//     return contentMap[statusLower] || {
//         subject: "📝 Leave Request Status Update",
//         body: `Your leave request status has been updated to: ${status}. Please check the system for more details.`
//     };
// }
// /**
//  * Validate email format using a simple regex.
//  */
// function isValidEmail(email: string): boolean {
//     const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return emailRegex.test(email);
// }
// /**
//  * Check if the provided status string is one of the known LeaveStatus types.
//  */
// function isValidStatus(status: string): status is LeaveStatus {
//     const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending', 'cancelled'];
//     return validStatuses.includes(status.toLowerCase() as LeaveStatus);
// }
// /**
//  * Utility function for testing the Lambda handler locally.
//  * It constructs a mock CloudWatchLogsEvent and a mock Context.
//  */
// export async function testHandler(
//     email: string = "test.user@example.com",
//     status: LeaveStatus = "approved",
//     logMessagePrefix: string = "2024-07-05T01:29:00.000Z\tTEST\t" // Example prefix for log message
// ): Promise<void> {
//     console.log(`--- Starting test for handler with email: ${email}, status: ${status} ---`);
//     // Create a mock log event with the JSON payload embedded
//     const mockLogEventMessage = `${logMessagePrefix}LEAVE_STATUS: ${JSON.stringify({ email, status })}`;
//     const testLogEvents: LogEvent[] = [{
//         id: "test-event-123",
//         timestamp: Date.now(),
//         message: mockLogEventMessage
//     }];
//     // Compress and base64 encode the mock log data, just like CloudWatch does
//     const cloudWatchLogData: CloudWatchLogsData = {
//         messageType: "DATA_MESSAGE",
//         owner: "test-owner",
//         logGroup: "/aws/lambda/test-function",
//         logStream: "test-log-stream",
//         subscriptionFilters: ["test-filter"],
//         logEvents: testLogEvents,
//     };
//     const compressedPayload = zlib.gzipSync(Buffer.from(JSON.stringify(cloudWatchLogData)));
//     const base64EncodedPayload = compressedPayload.toString('base64');
//     const testEvent: CloudWatchLogsEvent = {
//         awslogs: {
//             data: base64EncodedPayload
//         }
//     };
//     // Mock the Lambda context object
//     const testContext: Context = {
//         callbackWaitsForEmptyEventLoop: true,
//         functionName: "test-email-processor",
//         functionVersion: "$LATEST",
//         invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test-email-processor",
//         memoryLimitInMB: "128",
//         awsRequestId: "test-request-id-123",
//         logGroupName: "/aws/lambda/test-email-processor",
//         logStreamName: "2024/07/05/[123]abcdef123",
//         getRemainingTimeInMillis: () => 300000, // 5 minutes remaining
//         done: (error?: Error, result?: any) => {
//             if (error) {
//                 console.error("Context done (error):", error);
//             } else {
//                 console.log("Context done (success):", result);
//             }
//         },
//         succeed: (result?: any) => console.log("Context succeed:", result),
//         fail: (error: Error | string) => console.error("Context fail:", error),
//     };
//     try {
//         await handler(testEvent, testContext);
//         console.log("✅ Test handler execution completed successfully.");
//     } catch (error) {
//         console.error("❌ Test handler execution failed:", error);
//         throw error; // Re-throw to indicate test failure
//     } finally {
//         console.log("--- Test for handler finished ---");
//     }
// }
// // Export types for use in other modules
// export type {
//     CloudWatchLogsEvent,
//     CloudWatchLogsData,
//     LogEvent,
//     LeaveStatusData,
//     NameData,
//     EmailContent,
//     LeaveStatus
// };
// export default handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWxIYW5kbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1haWxIYW5kbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxnQ0FBZ0M7QUFDaEMsd0NBQXdDO0FBQ3hDLGlIQUFpSDs7QUFFakgsMEJBQTBCO0FBQzFCLGtDQUFrQztBQUNsQyxpQkFBaUI7QUFDakIsK0RBQStEO0FBQy9ELFNBQVM7QUFDVCxJQUFJO0FBRUosaUNBQWlDO0FBQ2pDLDJCQUEyQjtBQUMzQixxQkFBcUI7QUFDckIsd0JBQXdCO0FBQ3hCLHlCQUF5QjtBQUN6QixxQ0FBcUM7QUFDckMsNkJBQTZCO0FBQzdCLElBQUk7QUFFSix1QkFBdUI7QUFDdkIsa0JBQWtCO0FBQ2xCLHlCQUF5QjtBQUN6Qix3REFBd0Q7QUFDeEQsSUFBSTtBQUVKLDhCQUE4QjtBQUM5QixxQkFBcUI7QUFDckIsc0JBQXNCO0FBQ3RCLGlGQUFpRjtBQUNqRixJQUFJO0FBRUosdUJBQXVCO0FBQ3ZCLHlCQUF5QjtBQUN6Qix3QkFBd0I7QUFDeEIsSUFBSTtBQUVKLDJCQUEyQjtBQUMzQix1QkFBdUI7QUFDdkIsb0JBQW9CO0FBQ3BCLElBQUk7QUFFSix3RUFBd0U7QUFFeEUsTUFBTTtBQUNOLHlGQUF5RjtBQUN6RixzRkFBc0Y7QUFDdEYsaUVBQWlFO0FBQ2pFLE1BQU07QUFDTixrR0FBa0c7QUFDbEcsOENBQThDO0FBQzlDLHlFQUF5RTtBQUV6RSx1REFBdUQ7QUFDdkQsaUVBQWlFO0FBQ2pFLG9EQUFvRDtBQUNwRCxxREFBcUQ7QUFDckQsK0JBQStCO0FBQy9CLDRDQUE0QztBQUM1QyxvQkFBb0I7QUFDcEIsaUNBQWlDO0FBQ2pDLGtHQUFrRztBQUNsRyxvQkFBb0I7QUFDcEIsbUNBQW1DO0FBQ25DLGtCQUFrQjtBQUNsQixjQUFjO0FBQ2QsU0FBUztBQUVULFlBQVk7QUFDWixtREFBbUQ7QUFDbkQseUVBQXlFO0FBQ3pFLDZGQUE2RjtBQUM3RixpRkFBaUY7QUFFakYsNkNB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Q3RELHlFQUF5RTtBQUN6RSxtREFBbUQ7QUFDbkQsMkJBQTJCO0FBQzNCLGlFQUFpRTtBQUNqRSx1QkFBdUI7QUFDdkIsa0VBQWtFO0FBQ2xFLGdCQUFnQjtBQUNoQixhQUFhO0FBQ2IsOEVBQThFO0FBQzlFLGtGQUFrRjtBQUNsRixTQUFTO0FBRVQsWUFBWTtBQUNaLGlEQUFpRDtBQUNqRCwyRUFBMkU7QUFDM0Usd0JBQXdCO0FBQ3hCLG9FQUFvRTtBQUNwRSw0REFBNEQ7QUFDNUQsa0JBQWtCO0FBQ2xCLDREQUE0RDtBQUM1RCxRQUFRO0FBQ1IsSUFBSTtBQUVKLDJDQUEyQztBQUMzQyxnQkFBZ0I7QUFDaEIsMkJBQTJCO0FBQzNCLDBCQUEwQjtBQUMxQixnQkFBZ0I7QUFDaEIsdUJBQXVCO0FBQ3ZCLGdCQUFnQjtBQUNoQixvQkFBb0I7QUFDcEIsa0JBQWtCO0FBQ2xCLEtBQUs7QUFFTCwwQkFBMEIiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBpbXBvcnQgKiBhcyB6bGliIGZyb20gJ3psaWInO1xuLy8gaW1wb3J0IHsgQ29udGV4dCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuLy8gaW1wb3J0IHsgc2VuZGVyIH0gZnJvbSAnLi9lbWFpbE1pZGRsZXdhcmUnOyAvLyBBc3N1bWluZyBlbWFpbE1pZGRsZXdhcmUgaXMgY29ycmVjdGx5IGltcGxlbWVudGVkIGFuZCBhdmFpbGFibGVcblxuLy8gLy8gVHlwZXMgYW5kIEludGVyZmFjZXNcbi8vIGludGVyZmFjZSBDbG91ZFdhdGNoTG9nc0V2ZW50IHtcbi8vICAgICBhd3Nsb2dzOiB7XG4vLyAgICAgICAgIGRhdGE6IHN0cmluZzsgLy8gQmFzZTY0IGVuY29kZWQsIGNvbXByZXNzZWQgbG9nIGRhdGFcbi8vICAgICB9O1xuLy8gfVxuXG4vLyBpbnRlcmZhY2UgQ2xvdWRXYXRjaExvZ3NEYXRhIHtcbi8vICAgICBtZXNzYWdlVHlwZTogc3RyaW5nO1xuLy8gICAgIG93bmVyOiBzdHJpbmc7XG4vLyAgICAgbG9nR3JvdXA6IHN0cmluZztcbi8vICAgICBsb2dTdHJlYW06IHN0cmluZztcbi8vICAgICBzdWJzY3JpcHRpb25GaWx0ZXJzOiBzdHJpbmdbXTtcbi8vICAgICBsb2dFdmVudHM6IExvZ0V2ZW50W107XG4vLyB9XG5cbi8vIGludGVyZmFjZSBMb2dFdmVudCB7XG4vLyAgICAgaWQ6IHN0cmluZztcbi8vICAgICB0aW1lc3RhbXA6IG51bWJlcjtcbi8vICAgICBtZXNzYWdlOiBzdHJpbmc7IC8vIFRoZSBhY3R1YWwgbG9nIG1lc3NhZ2Ugc3RyaW5nXG4vLyB9XG5cbi8vIGludGVyZmFjZSBMZWF2ZVN0YXR1c0RhdGEge1xuLy8gICAgIGVtYWlsOiBzdHJpbmc7XG4vLyAgICAgc3RhdHVzOiBzdHJpbmc7XG4vLyAgICAgW2tleTogc3RyaW5nXTogYW55OyAvLyBBbGxvdyBmb3IgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIGluIHRoZSBKU09OIHBheWxvYWRcbi8vIH1cblxuLy8gaW50ZXJmYWNlIE5hbWVEYXRhIHtcbi8vICAgICBmaXJzdE5hbWU6IHN0cmluZztcbi8vICAgICBsYXN0TmFtZTogc3RyaW5nO1xuLy8gfVxuXG4vLyBpbnRlcmZhY2UgRW1haWxDb250ZW50IHtcbi8vICAgICBzdWJqZWN0OiBzdHJpbmc7XG4vLyAgICAgYm9keTogc3RyaW5nO1xuLy8gfVxuXG4vLyB0eXBlIExlYXZlU3RhdHVzID0gJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCcgfCAncGVuZGluZycgfCAnY2FuY2VsbGVkJztcblxuLy8gLyoqXG4vLyAgKiBNYWluIExhbWJkYSBoYW5kbGVyIGZvciBwcm9jZXNzaW5nIENsb3VkV2F0Y2ggbG9ncyBhbmQgc2VuZGluZyBsZWF2ZSBzdGF0dXMgZW1haWxzLlxuLy8gICogVGhpcyBmdW5jdGlvbiBpcyBub3cgYXN5bmMgYW5kIHJldHVybnMgYSBQcm9taXNlLCB3aGljaCBpcyB0aGUgcHJlZmVycmVkIHdheSBmb3Jcbi8vICAqIE5vZGUuanMgTGFtYmRhIGZ1bmN0aW9ucyB0byBoYW5kbGUgYXN5bmNocm9ub3VzIG9wZXJhdGlvbnMuXG4vLyAgKi9cbi8vIGV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGlucHV0OiBDbG91ZFdhdGNoTG9nc0V2ZW50LCBjb250ZXh0OiBDb250ZXh0KTogUHJvbWlzZTx2b2lkPiA9PiB7XG4vLyAgICAgY29uc29sZS5sb2coXCJMYW1iZGEgaGFuZGxlciBpbnZva2VkLlwiKTtcbi8vICAgICBjb25zdCBwYXlsb2FkOiBCdWZmZXIgPSBCdWZmZXIuZnJvbShpbnB1dC5hd3Nsb2dzLmRhdGEsICdiYXNlNjQnKTtcblxuLy8gICAgIC8vIFByb21pc2lmeSB6bGliLmd1bnppcCB0byB1c2Ugd2l0aCBhc3luYy9hd2FpdFxuLy8gICAgIGNvbnN0IGd1bnppcFByb21pc2UgPSAoZGF0YTogQnVmZmVyKTogUHJvbWlzZTxCdWZmZXI+ID0+IHtcbi8vICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbi8vICAgICAgICAgICAgIHpsaWIuZ3VuemlwKGRhdGEsIChlcnJvciwgcmVzdWx0KSA9PiB7XG4vLyAgICAgICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4vLyAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZWplY3QoZXJyb3IpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICBpZiAoIXJlc3VsdCkge1xuLy8gICAgICAgICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihcIkZhaWxlZCB0byBkZWNvbXByZXNzIHBheWxvYWQ6IG5vIHJlc3VsdCBidWZmZXJcIikpO1xuLy8gICAgICAgICAgICAgICAgIH1cbi8vICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdCk7XG4vLyAgICAgICAgICAgICB9KTtcbi8vICAgICAgICAgfSk7XG4vLyAgICAgfTtcblxuLy8gICAgIHRyeSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiRGVjb21wcmVzc2luZyBwYXlsb2FkLi4uXCIpO1xuLy8gICAgICAgICBjb25zdCBkZWNvbXByZXNzZWREYXRhOiBCdWZmZXIgPSBhd2FpdCBndW56aXBQcm9taXNlKHBheWxvYWQpO1xuLy8gICAgICAgICBjb25zdCBsb2dEYXRhOiBDbG91ZFdhdGNoTG9nc0RhdGEgPSBKU09OLnBhcnNlKGRlY29tcHJlc3NlZERhdGEudG9TdHJpbmcoJ3V0ZjgnKSk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiRXZlbnQgRGF0YSAocGFyc2VkKTpcIiwgSlNPTi5zdHJpbmdpZnkobG9nRGF0YSwgbnVsbCwgMikpO1xuXG4vLyAgICAgICAgIC8vIFByb2Nlc3MgbG9nIGV2ZW50cyBpZiBhbnkgZXhpc3Rcbi8vICAgICAgICAgaWYgKGxvZ0RhdGEubG9nRXZlbnRzICYmIGxvZ0RhdGEubG9nRXZlbnRzLmxlbmd0aCA+IDApIHtcbi8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBGb3VuZCAke2xvZ0RhdGEubG9nRXZlbnRzLmxlbmd0aH0gbG9nIGV2ZW50cyB0byBwcm9jZXNzLmApO1xuLy8gICAgICAgICAgICAgYXdhaXQgcHJvY2Vzc0xvZ0V2ZW50cyhsb2dEYXRhLmxvZ0V2ZW50cyk7XG4vLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZpbmlzaGVkIHByb2Nlc3NpbmcgYWxsIGxvZyBldmVudHMuXCIpO1xuLy8gICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgY29uc29sZS5sb2coXCJObyBsb2cgZXZlbnRzIGZvdW5kIGluIHRoZSBwYXlsb2FkLiBOb3RoaW5nIHRvIHByb2Nlc3MuXCIpO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgLy8gV2hlbiB1c2luZyBhc3luYy9hd2FpdCwgdGhlIExhbWJkYSBmdW5jdGlvbiBhdXRvbWF0aWNhbGx5IHN1Y2NlZWRzXG4vLyAgICAgICAgIC8vIHdoZW4gdGhlIHJldHVybmVkIFByb21pc2UgcmVzb2x2ZXMuIE5vIG5lZWQgZm9yIGNvbnRleHQuc3VjY2VlZCgpLlxuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIkxhbWJkYSBleGVjdXRpb24gY29tcGxldGVkIHN1Y2Nlc3NmdWxseS5cIik7XG5cbi8vICAgICB9IGNhdGNoIChlcnJvcikge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKFwi4p2MIEVycm9yIGR1cmluZyBMYW1iZGEgZXhlY3V0aW9uOlwiLCBlcnJvcik7XG4vLyAgICAgICAgIC8vIFdoZW4gdXNpbmcgYXN5bmMvYXdhaXQsIHRocm93aW5nIGFuIGVycm9yIHdpbGwgY2F1c2UgdGhlIExhbWJkYSBmdW5jdGlvbiB0byBmYWlsLlxuLy8gICAgICAgICAvLyBObyBuZWVkIGZvciBjb250ZXh0LmZhaWwoKS5cbi8vICAgICAgICAgdGhyb3cgZXJyb3I7XG4vLyAgICAgfVxuLy8gfTtcblxuLy8gLyoqXG4vLyAgKiBQcm9jZXNzIG11bHRpcGxlIGxvZyBldmVudHMgY29uY3VycmVudGx5LlxuLy8gICogVXNlcyBQcm9taXNlLmFsbFNldHRsZWQgdG8gZW5zdXJlIGFsbCBldmVudHMgYXJlIGF0dGVtcHRlZCwgYW5kIHJlc3VsdHMgKGZ1bGZpbGxlZC9yZWplY3RlZClcbi8vICAqIGFyZSBjb2xsZWN0ZWQgd2l0aG91dCBzdG9wcGluZyBvbiB0aGUgZmlyc3QgZXJyb3IuXG4vLyAgKi9cbi8vIGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NMb2dFdmVudHMobG9nRXZlbnRzOiBMb2dFdmVudFtdKTogUHJvbWlzZTx2b2lkPiB7XG4vLyAgICAgY29uc29sZS5sb2coXCJTdGFydGluZyBiYXRjaCBwcm9jZXNzaW5nIG9mIGxvZyBldmVudHMuLi5cIik7XG4vLyAgICAgY29uc3QgcmVzdWx0cyA9IGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChcbi8vICAgICAgICAgbG9nRXZlbnRzLm1hcChsb2dFdmVudCA9PiBwcm9jZXNzTG9nRXZlbnQobG9nRXZlbnQpKVxuLy8gICAgICk7XG5cbi8vICAgICBsZXQgc3VjY2Vzc2Z1bENvdW50ID0gMDtcbi8vICAgICBsZXQgZmFpbGVkQ291bnQgPSAwO1xuXG4vLyAgICAgcmVzdWx0cy5mb3JFYWNoKChyZXN1bHQsIGluZGV4KSA9PiB7XG4vLyAgICAgICAgIGNvbnN0IGV2ZW50SWQgPSBsb2dFdmVudHNbaW5kZXhdPy5pZCB8fCBgdW5rbm93bi1ldmVudC0ke2luZGV4fWA7XG4vLyAgICAgICAgIGlmIChyZXN1bHQuc3RhdHVzID09PSAnZnVsZmlsbGVkJykge1xuLy8gICAgICAgICAgICAgc3VjY2Vzc2Z1bENvdW50Kys7XG4vLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhg4pyFIExvZyBldmVudCAke2V2ZW50SWR9IHByb2Nlc3NlZCBzdWNjZXNzZnVsbHkuYCk7XG4vLyAgICAgICAgIH0gZWxzZSB7XG4vLyAgICAgICAgICAgICBmYWlsZWRDb3VudCsrO1xuLy8gICAgICAgICAgICAgY29uc29sZS5lcnJvcihg4p2MIEZhaWxlZCB0byBwcm9jZXNzIGxvZyBldmVudCAke2V2ZW50SWR9OmAsIHJlc3VsdC5yZWFzb24pO1xuLy8gICAgICAgICB9XG4vLyAgICAgfSk7XG5cbi8vICAgICBpZiAoZmFpbGVkQ291bnQgPiAwKSB7XG4vLyAgICAgICAgIGNvbnNvbGUud2FybihgQmF0Y2ggcHJvY2Vzc2luZyBmaW5pc2hlZDogJHtzdWNjZXNzZnVsQ291bnR9IHN1Y2Nlc3NmdWwsICR7ZmFpbGVkQ291bnR9IGZhaWxlZC5gKTtcbi8vICAgICAgICAgLy8gRGVwZW5kaW5nIG9uIHJlcXVpcmVtZW50cywgeW91IG1pZ2h0IHdhbnQgdG8gdGhyb3cgYW4gZXJyb3IgaGVyZSBpZiBhbnkgZmFpbHVyZVxuLy8gICAgICAgICAvLyBzaG91bGQgaW5kaWNhdGUgYW4gb3ZlcmFsbCBMYW1iZGEgZmFpbHVyZSwgb3IgbG9nIGZhaWx1cmVzIHRvIGEgc2VwYXJhdGUgc3lzdGVtLlxuLy8gICAgIH0gZWxzZSB7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGBBbGwgJHtzdWNjZXNzZnVsQ291bnR9IGxvZyBldmVudHMgaW4gdGhlIGJhdGNoIHByb2Nlc3NlZCBzdWNjZXNzZnVsbHkuYCk7XG4vLyAgICAgfVxuLy8gfVxuXG4vLyAvKipcbi8vICAqIFByb2Nlc3MgYSBzaW5nbGUgbG9nIGV2ZW50OiBleHRyYWN0IGRhdGEgYW5kIHNlbmQgYW4gZW1haWwuXG4vLyAgKi9cbi8vIGFzeW5jIGZ1bmN0aW9uIHByb2Nlc3NMb2dFdmVudChsb2dFdmVudDogTG9nRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbi8vICAgICBjb25zb2xlLmxvZyhgUHJvY2Vzc2luZyBsb2cgZXZlbnQgSUQ6ICR7bG9nRXZlbnQuaWR9YCk7XG4vLyAgICAgY29uc29sZS5sb2coXCJSYXcgbG9nIG1lc3NhZ2U6XCIsIGxvZ0V2ZW50Lm1lc3NhZ2UpO1xuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgLy8gRXh0cmFjdCB0aGUgbGVhdmUgc3RhdHVzIGluZm9ybWF0aW9uLCBhc3N1bWluZyBpdCdzIHRoZSBsYXN0IHRhYi1zZXBhcmF0ZWQgcGFydFxuLy8gICAgICAgICBjb25zdCBtZXNzYWdlUGFydHM6IHN0cmluZ1tdID0gbG9nRXZlbnQubWVzc2FnZS5zcGxpdCgnXFx0Jyk7XG4vLyAgICAgICAgIGNvbnN0IHJldHJpZXZlTGVhdmVTdGF0dXM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IG1lc3NhZ2VQYXJ0c1ttZXNzYWdlUGFydHMubGVuZ3RoIC0gMV0/LnRyaW0oKTtcblxuLy8gICAgICAgICBpZiAoIXJldHJpZXZlTGVhdmVTdGF0dXMpIHtcbi8vICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvdWxkIG5vdCBleHRyYWN0IGxlYXZlIHN0YXR1cyBzdHJpbmcgZnJvbSBsb2cgbWVzc2FnZS5cIik7XG4vLyAgICAgICAgIH1cbi8vICAgICAgICAgY29uc29sZS5sb2coXCJFeHRyYWN0ZWQgcmF3IHN0YXR1cyBwYXJ0OlwiLCByZXRyaWV2ZUxlYXZlU3RhdHVzKTtcblxuLy8gICAgICAgICAvLyBSZW1vdmUgdGhlICdMRUFWRV9TVEFUVVM6ICcgcHJlZml4XG4vLyAgICAgICAgIGNvbnN0IGxlYXZlU3RhdHVzU3RyaW5nOiBzdHJpbmcgPSByZXRyaWV2ZUxlYXZlU3RhdHVzLnJlcGxhY2UoL15MRUFWRV9TVEFUVVM6XFxzKi8sICcnKTtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJDbGVhbmVkIHN0YXR1cyBzdHJpbmcgZm9yIEpTT04gcGFyc2luZzpcIiwgbGVhdmVTdGF0dXNTdHJpbmcpO1xuXG4vLyAgICAgICAgIC8vIFBhcnNlIHRoZSBKU09OIGRhdGFcbi8vICAgICAgICAgbGV0IGVtYWlsRGF0YTogTGVhdmVTdGF0dXNEYXRhO1xuLy8gICAgICAgICB0cnkge1xuLy8gICAgICAgICAgICAgZW1haWxEYXRhID0gSlNPTi5wYXJzZShsZWF2ZVN0YXR1c1N0cmluZykgYXMgTGVhdmVTdGF0dXNEYXRhO1xuLy8gICAgICAgICB9IGNhdGNoIChwYXJzZUVycm9yKSB7XG4vLyAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGBFcnJvciBwYXJzaW5nIGxlYXZlIHN0YXR1cyBKU09OIGZyb20gc3RyaW5nOiAnJHtsZWF2ZVN0YXR1c1N0cmluZ30nYCwgcGFyc2VFcnJvcik7XG4vLyAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgSlNPTiBpbiBsZWF2ZSBzdGF0dXM6ICR7bGVhdmVTdGF0dXNTdHJpbmd9YCk7XG4vLyAgICAgICAgIH1cblxuLy8gICAgICAgICBjb25zdCB7IGVtYWlsLCBzdGF0dXMgfSA9IGVtYWlsRGF0YTtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJQYXJzZWQgZW1haWwgZGF0YTpcIiwgeyBlbWFpbCwgc3RhdHVzIH0pO1xuXG4vLyAgICAgICAgIC8vIFZhbGlkYXRlIHJlcXVpcmVkIGZpZWxkc1xuLy8gICAgICAgICBpZiAoIWVtYWlsIHx8ICFzdGF0dXMpIHtcbi8vICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTWlzc2luZyByZXF1aXJlZCBmaWVsZHMgaW4gcGFyc2VkIGRhdGE6IGVtYWlsPScke2VtYWlsfScsIHN0YXR1cz0nJHtzdGF0dXN9J2ApO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgLy8gVmFsaWRhdGUgZW1haWwgZm9ybWF0XG4vLyAgICAgICAgIGlmICghaXNWYWxpZEVtYWlsKGVtYWlsKSkge1xuLy8gICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGVtYWlsIGZvcm1hdCBkZXRlY3RlZDogJHtlbWFpbH1gKTtcbi8vICAgICAgICAgfVxuXG4vLyAgICAgICAgIC8vIFZhbGlkYXRlIHN0YXR1cyAobG9nIHdhcm5pbmcgaWYgdW5rbm93biwgYnV0IHByb2NlZWQpXG4vLyAgICAgICAgIGlmICghaXNWYWxpZFN0YXR1cyhzdGF0dXMpKSB7XG4vLyAgICAgICAgICAgICBjb25zb2xlLndhcm4oYFVua25vd24gbGVhdmUgc3RhdHVzICcke3N0YXR1c30nIGZvciBlbWFpbCAnJHtlbWFpbH0nLiBQcm9jZWVkaW5nIHdpdGggZGVmYXVsdCBjb250ZW50LmApO1xuLy8gICAgICAgICB9XG5cbi8vICAgICAgICAgLy8gRXh0cmFjdCBhbmQgZm9ybWF0IG5hbWUgZnJvbSBlbWFpbCBhZGRyZXNzXG4vLyAgICAgICAgIGNvbnN0IHsgZmlyc3ROYW1lLCBsYXN0TmFtZSB9OiBOYW1lRGF0YSA9IGV4dHJhY3ROYW1lRnJvbUVtYWlsKGVtYWlsKTtcbi8vICAgICAgICAgY29uc3QgZnVsbE5hbWU6IHN0cmluZyA9IGAke2ZpcnN0TmFtZX0gJHtsYXN0TmFtZX1gLnRyaW0oKTtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCJFeHRyYWN0ZWQgZnVsbCBuYW1lOlwiLCBmdWxsTmFtZSk7XG5cbi8vICAgICAgICAgLy8gUHJlcGFyZSBlbWFpbCBjb250ZW50IGJhc2VkIG9uIHN0YXR1c1xuLy8gICAgICAgICBjb25zdCBlbWFpbENvbnRlbnQ6IEVtYWlsQ29udGVudCA9IGdlbmVyYXRlRW1haWxDb250ZW50KHN0YXR1cyBhcyBMZWF2ZVN0YXR1cyk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGBHZW5lcmF0ZWQgZW1haWwgY29udGVudCBmb3Igc3RhdHVzICcke3N0YXR1c30nLiBTdWJqZWN0OiAnJHtlbWFpbENvbnRlbnQuc3ViamVjdH0nYCk7XG5cbi8vICAgICAgICAgLy8gU2VuZCB0aGUgZW1haWwgdXNpbmcgdGhlIGltcG9ydGVkIHNlbmRlciBmdW5jdGlvblxuLy8gICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBzZW5kZXIoZW1haWwsIGZ1bGxOYW1lLCBlbWFpbENvbnRlbnQuYm9keSwgZW1haWxDb250ZW50LnN1YmplY3QsIHN0YXR1cyk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKGBFbWFpbCBzdWNjZXNzZnVsbHkgc2VudCB0byAke2VtYWlsfS4gTWVzc2FnZUlkOiAke3Jlc3VsdC5tZXNzYWdlSWR9YCk7XG4vLyAgICAgICAgIGNvbnNvbGUubG9nKFwiRW1haWwgc2VuZGVyIHJlc3VsdDpcIiwgcmVzdWx0KTtcblxuLy8gICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4vLyAgICAgICAgIGNvbnNvbGUuZXJyb3IoYOKdjCBFcnJvciBwcm9jZXNzaW5nIGxvZyBldmVudCAke2xvZ0V2ZW50LmlkfTpgLCBlcnJvcik7XG4vLyAgICAgICAgIHRocm93IGVycm9yOyAvLyBSZS10aHJvdyB0byBiZSBjYXVnaHQgYnkgUHJvbWlzZS5hbGxTZXR0bGVkXG4vLyAgICAgfVxuLy8gfVxuXG4vLyAvKipcbi8vICAqIEV4dHJhY3QgZmlyc3QgbmFtZSBhbmQgbGFzdCBuYW1lIGZyb20gYW4gZW1haWwgYWRkcmVzcy5cbi8vICAqIEF0dGVtcHRzIHRvIGNhcGl0YWxpemUgdGhlIGZpcnN0IGxldHRlciBvZiBlYWNoIHBhcnQuXG4vLyAgKi9cbi8vIGZ1bmN0aW9uIGV4dHJhY3ROYW1lRnJvbUVtYWlsKGVtYWlsOiBzdHJpbmcpOiBOYW1lRGF0YSB7XG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgY29uc3QgbG9jYWxQYXJ0OiBzdHJpbmcgPSBlbWFpbC5zcGxpdCgnQCcpWzBdIHx8ICcnO1xuLy8gICAgICAgICAvLyBSZXBsYWNlIGNvbW1vbiBzZXBhcmF0b3JzIHdpdGggYSBkb3QgZm9yIGNvbnNpc3RlbnQgc3BsaXR0aW5nXG4vLyAgICAgICAgIGNvbnN0IGNsZWFuZWRMb2NhbFBhcnQgPSBsb2NhbFBhcnQucmVwbGFjZSgvWy1fXS9nLCAnLicpO1xuLy8gICAgICAgICBjb25zdCBlbWFpbFBhcnRzOiBzdHJpbmdbXSA9IGNsZWFuZWRMb2NhbFBhcnQuc3BsaXQoJy4nKTtcblxuLy8gICAgICAgICBsZXQgZmlyc3ROYW1lOiBzdHJpbmcgPSBlbWFpbFBhcnRzWzBdIHx8ICcnO1xuLy8gICAgICAgICBsZXQgbGFzdE5hbWU6IHN0cmluZyA9IGVtYWlsUGFydHMubGVuZ3RoID4gMSA/IGVtYWlsUGFydHMuc2xpY2UoMSkuam9pbignICcpIDogJyc7XG5cbi8vICAgICAgICAgLy8gQ2FwaXRhbGl6ZSBmaXJzdCBsZXR0ZXIgb2YgZmlyc3QgYW5kIGxhc3QgbmFtZVxuLy8gICAgICAgICBmaXJzdE5hbWUgPSBjYXBpdGFsaXplRmlyc3RMZXR0ZXIoZmlyc3ROYW1lKTtcbi8vICAgICAgICAgbGFzdE5hbWUgPSBjYXBpdGFsaXplRmlyc3RMZXR0ZXIobGFzdE5hbWUpO1xuXG4vLyAgICAgICAgIHJldHVybiB7IGZpcnN0TmFtZSwgbGFzdE5hbWUgfTtcbi8vICAgICB9IGNhdGNoIChlcnJvcikge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgZXh0cmFjdGluZyBuYW1lIGZyb20gZW1haWw6XCIsIGVycm9yKTtcbi8vICAgICAgICAgLy8gRmFsbGJhY2sgdG8gYSBnZW5lcmljIG5hbWUgaWYgZXh0cmFjdGlvbiBmYWlsc1xuLy8gICAgICAgICByZXR1cm4geyBmaXJzdE5hbWU6IFwiVmFsdWVkXCIsIGxhc3ROYW1lOiBcIkN1c3RvbWVyXCIgfTtcbi8vICAgICB9XG4vLyB9XG5cbi8vIC8qKlxuLy8gICogQ2FwaXRhbGl6ZSB0aGUgZmlyc3QgbGV0dGVyIG9mIGEgc3RyaW5nIGFuZCBtYWtlIHRoZSByZXN0IGxvd2VyY2FzZS5cbi8vICAqL1xuLy8gZnVuY3Rpb24gY2FwaXRhbGl6ZUZpcnN0TGV0dGVyKHN0cjogc3RyaW5nKTogc3RyaW5nIHtcbi8vICAgICBpZiAoIXN0ciB8fCB0eXBlb2Ygc3RyICE9PSAnc3RyaW5nJyB8fCBzdHIubGVuZ3RoID09PSAwKSB7XG4vLyAgICAgICAgIHJldHVybiAnJztcbi8vICAgICB9XG4vLyAgICAgcmV0dXJuIHN0ci5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHN0ci5zbGljZSgxKS50b0xvd2VyQ2FzZSgpO1xuLy8gfVxuXG4vLyAvKipcbi8vICAqIEdlbmVyYXRlIGVtYWlsIHN1YmplY3QgYW5kIGJvZHkgY29udGVudCBiYXNlZCBvbiB0aGUgbGVhdmUgc3RhdHVzLlxuLy8gICovXG4vLyBmdW5jdGlvbiBnZW5lcmF0ZUVtYWlsQ29udGVudChzdGF0dXM6IExlYXZlU3RhdHVzKTogRW1haWxDb250ZW50IHtcbi8vICAgICBjb25zdCBzdGF0dXNMb3dlciA9IHN0YXR1cy50b0xvd2VyQ2FzZSgpIGFzIExlYXZlU3RhdHVzO1xuXG4vLyAgICAgY29uc3QgY29udGVudE1hcDogUmVjb3JkPExlYXZlU3RhdHVzLCBFbWFpbENvbnRlbnQ+ID0ge1xuLy8gICAgICAgICBhcHByb3ZlZDoge1xuLy8gICAgICAgICAgICAgc3ViamVjdDogXCLinIUgTGVhdmUgUmVxdWVzdCBBcHByb3ZlZFwiLFxuLy8gICAgICAgICAgICAgYm9keTogXCJHcmVhdCBuZXdzISBZb3VyIGxlYXZlIHJlcXVlc3QgaGFzIGJlZW4gYXBwcm92ZWQuIFlvdSBjYW4gcHJvY2VlZCB3aXRoIHlvdXIgcGxhbm5lZCB0aW1lIG9mZi5cIlxuLy8gICAgICAgICB9LFxuLy8gICAgICAgICByZWplY3RlZDoge1xuLy8gICAgICAgICAgICAgc3ViamVjdDogXCLinYwgTGVhdmUgUmVxdWVzdCBEZWNsaW5lZFwiLFxuLy8gICAgICAgICAgICAgYm9keTogXCJZb3VyIGxlYXZlIHJlcXVlc3QgaGFzIGJlZW4gZGVjbGluZWQuIFBsZWFzZSBjb250YWN0IHlvdXIgbWFuYWdlciBmb3IgbW9yZSBkZXRhaWxzIG9yIHRvIGRpc2N1c3MgYWx0ZXJuYXRpdmUgYXJyYW5nZW1lbnRzLlwiXG4vLyAgICAgICAgIH0sXG4vLyAgICAgICAgIHBlbmRpbmc6IHtcbi8vICAgICAgICAgICAgIHN1YmplY3Q6IFwi4o+zIExlYXZlIFJlcXVlc3QgVW5kZXIgUmV2aWV3XCIsXG4vLyAgICAgICAgICAgICBib2R5OiBcIllvdXIgbGVhdmUgcmVxdWVzdCBpcyBjdXJyZW50bHkgYmVpbmcgcmV2aWV3ZWQgYnkgeW91ciBtYW5hZ2VyLiBZb3Ugd2lsbCByZWNlaXZlIGFub3RoZXIgbm90aWZpY2F0aW9uIG9uY2UgYSBkZWNpc2lvbiBoYXMgYmVlbiBtYWRlLlwiXG4vLyAgICAgICAgIH0sXG4vLyAgICAgICAgIGNhbmNlbGxlZDoge1xuLy8gICAgICAgICAgICAgc3ViamVjdDogXCLwn5qrIExlYXZlIFJlcXVlc3QgQ2FuY2VsbGVkXCIsXG4vLyAgICAgICAgICAgICBib2R5OiBcIllvdXIgbGVhdmUgcmVxdWVzdCBoYXMgYmVlbiBjYW5jZWxsZWQgYXMgcGVyIHlvdXIgcmVxdWVzdCBvciBzeXN0ZW0gdXBkYXRlLiBJZiB0aGlzIHdhcyBhbiBlcnJvciwgcGxlYXNlIHN1Ym1pdCBhIG5ldyByZXF1ZXN0LlwiXG4vLyAgICAgICAgIH1cbi8vICAgICB9O1xuXG4vLyAgICAgLy8gUmV0dXJuIHNwZWNpZmljIGNvbnRlbnQgb3IgYSBnZW5lcmljIGRlZmF1bHQgaWYgc3RhdHVzIGlzIG5vdCBleHBsaWNpdGx5IG1hcHBlZFxuLy8gICAgIHJldHVybiBjb250ZW50TWFwW3N0YXR1c0xvd2VyXSB8fCB7XG4vLyAgICAgICAgIHN1YmplY3Q6IFwi8J+TnSBMZWF2ZSBSZXF1ZXN0IFN0YXR1cyBVcGRhdGVcIixcbi8vICAgICAgICAgYm9keTogYFlvdXIgbGVhdmUgcmVxdWVzdCBzdGF0dXMgaGFzIGJlZW4gdXBkYXRlZCB0bzogJHtzdGF0dXN9LiBQbGVhc2UgY2hlY2sgdGhlIHN5c3RlbSBmb3IgbW9yZSBkZXRhaWxzLmBcbi8vICAgICB9O1xuLy8gfVxuXG4vLyAvKipcbi8vICAqIFZhbGlkYXRlIGVtYWlsIGZvcm1hdCB1c2luZyBhIHNpbXBsZSByZWdleC5cbi8vICAqL1xuLy8gZnVuY3Rpb24gaXNWYWxpZEVtYWlsKGVtYWlsOiBzdHJpbmcpOiBib29sZWFuIHtcbi8vICAgICBjb25zdCBlbWFpbFJlZ2V4OiBSZWdFeHAgPSAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLztcbi8vICAgICByZXR1cm4gZW1haWxSZWdleC50ZXN0KGVtYWlsKTtcbi8vIH1cblxuLy8gLyoqXG4vLyAgKiBDaGVjayBpZiB0aGUgcHJvdmlkZWQgc3RhdHVzIHN0cmluZyBpcyBvbmUgb2YgdGhlIGtub3duIExlYXZlU3RhdHVzIHR5cGVzLlxuLy8gICovXG4vLyBmdW5jdGlvbiBpc1ZhbGlkU3RhdHVzKHN0YXR1czogc3RyaW5nKTogc3RhdHVzIGlzIExlYXZlU3RhdHVzIHtcbi8vICAgICBjb25zdCB2YWxpZFN0YXR1c2VzOiBMZWF2ZVN0YXR1c1tdID0gWydhcHByb3ZlZCcsICdyZWplY3RlZCcsICdwZW5kaW5nJywgJ2NhbmNlbGxlZCddO1xuLy8gICAgIHJldHVybiB2YWxpZFN0YXR1c2VzLmluY2x1ZGVzKHN0YXR1cy50b0xvd2VyQ2FzZSgpIGFzIExlYXZlU3RhdHVzKTtcbi8vIH1cblxuLy8gLyoqXG4vLyAgKiBVdGlsaXR5IGZ1bmN0aW9uIGZvciB0ZXN0aW5nIHRoZSBMYW1iZGEgaGFuZGxlciBsb2NhbGx5LlxuLy8gICogSXQgY29uc3RydWN0cyBhIG1vY2sgQ2xvdWRXYXRjaExvZ3NFdmVudCBhbmQgYSBtb2NrIENvbnRleHQuXG4vLyAgKi9cbi8vIGV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0SGFuZGxlcihcbi8vICAgICBlbWFpbDogc3RyaW5nID0gXCJ0ZXN0LnVzZXJAZXhhbXBsZS5jb21cIixcbi8vICAgICBzdGF0dXM6IExlYXZlU3RhdHVzID0gXCJhcHByb3ZlZFwiLFxuLy8gICAgIGxvZ01lc3NhZ2VQcmVmaXg6IHN0cmluZyA9IFwiMjAyNC0wNy0wNVQwMToyOTowMC4wMDBaXFx0VEVTVFxcdFwiIC8vIEV4YW1wbGUgcHJlZml4IGZvciBsb2cgbWVzc2FnZVxuLy8gKTogUHJvbWlzZTx2b2lkPiB7XG4vLyAgICAgY29uc29sZS5sb2coYC0tLSBTdGFydGluZyB0ZXN0IGZvciBoYW5kbGVyIHdpdGggZW1haWw6ICR7ZW1haWx9LCBzdGF0dXM6ICR7c3RhdHVzfSAtLS1gKTtcblxuLy8gICAgIC8vIENyZWF0ZSBhIG1vY2sgbG9nIGV2ZW50IHdpdGggdGhlIEpTT04gcGF5bG9hZCBlbWJlZGRlZFxuLy8gICAgIGNvbnN0IG1vY2tMb2dFdmVudE1lc3NhZ2UgPSBgJHtsb2dNZXNzYWdlUHJlZml4fUxFQVZFX1NUQVRVUzogJHtKU09OLnN0cmluZ2lmeSh7IGVtYWlsLCBzdGF0dXMgfSl9YDtcbi8vICAgICBjb25zdCB0ZXN0TG9nRXZlbnRzOiBMb2dFdmVudFtdID0gW3tcbi8vICAgICAgICAgaWQ6IFwidGVzdC1ldmVudC0xMjNcIixcbi8vICAgICAgICAgdGltZXN0YW1wOiBEYXRlLm5vdygpLFxuLy8gICAgICAgICBtZXNzYWdlOiBtb2NrTG9nRXZlbnRNZXNzYWdlXG4vLyAgICAgfV07XG5cbi8vICAgICAvLyBDb21wcmVzcyBhbmQgYmFzZTY0IGVuY29kZSB0aGUgbW9jayBsb2cgZGF0YSwganVzdCBsaWtlIENsb3VkV2F0Y2ggZG9lc1xuLy8gICAgIGNvbnN0IGNsb3VkV2F0Y2hMb2dEYXRhOiBDbG91ZFdhdGNoTG9nc0RhdGEgPSB7XG4vLyAgICAgICAgIG1lc3NhZ2VUeXBlOiBcIkRBVEFfTUVTU0FHRVwiLFxuLy8gICAgICAgICBvd25lcjogXCJ0ZXN0LW93bmVyXCIsXG4vLyAgICAgICAgIGxvZ0dyb3VwOiBcIi9hd3MvbGFtYmRhL3Rlc3QtZnVuY3Rpb25cIixcbi8vICAgICAgICAgbG9nU3RyZWFtOiBcInRlc3QtbG9nLXN0cmVhbVwiLFxuLy8gICAgICAgICBzdWJzY3JpcHRpb25GaWx0ZXJzOiBbXCJ0ZXN0LWZpbHRlclwiXSxcbi8vICAgICAgICAgbG9nRXZlbnRzOiB0ZXN0TG9nRXZlbnRzLFxuLy8gICAgIH07XG4vLyAgICAgY29uc3QgY29tcHJlc3NlZFBheWxvYWQgPSB6bGliLmd6aXBTeW5jKEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KGNsb3VkV2F0Y2hMb2dEYXRhKSkpO1xuLy8gICAgIGNvbnN0IGJhc2U2NEVuY29kZWRQYXlsb2FkID0gY29tcHJlc3NlZFBheWxvYWQudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXG4vLyAgICAgY29uc3QgdGVzdEV2ZW50OiBDbG91ZFdhdGNoTG9nc0V2ZW50ID0ge1xuLy8gICAgICAgICBhd3Nsb2dzOiB7XG4vLyAgICAgICAgICAgICBkYXRhOiBiYXNlNjRFbmNvZGVkUGF5bG9hZFxuLy8gICAgICAgICB9XG4vLyAgICAgfTtcblxuLy8gICAgIC8vIE1vY2sgdGhlIExhbWJkYSBjb250ZXh0IG9iamVjdFxuLy8gICAgIGNvbnN0IHRlc3RDb250ZXh0OiBDb250ZXh0ID0ge1xuLy8gICAgICAgICBjYWxsYmFja1dhaXRzRm9yRW1wdHlFdmVudExvb3A6IHRydWUsXG4vLyAgICAgICAgIGZ1bmN0aW9uTmFtZTogXCJ0ZXN0LWVtYWlsLXByb2Nlc3NvclwiLFxuLy8gICAgICAgICBmdW5jdGlvblZlcnNpb246IFwiJExBVEVTVFwiLFxuLy8gICAgICAgICBpbnZva2VkRnVuY3Rpb25Bcm46IFwiYXJuOmF3czpsYW1iZGE6dXMtZWFzdC0xOjEyMzQ1Njc4OTAxMjpmdW5jdGlvbjp0ZXN0LWVtYWlsLXByb2Nlc3NvclwiLFxuLy8gICAgICAgICBtZW1vcnlMaW1pdEluTUI6IFwiMTI4XCIsXG4vLyAgICAgICAgIGF3c1JlcXVlc3RJZDogXCJ0ZXN0LXJlcXVlc3QtaWQtMTIzXCIsXG4vLyAgICAgICAgIGxvZ0dyb3VwTmFtZTogXCIvYXdzL2xhbWJkYS90ZXN0LWVtYWlsLXByb2Nlc3NvclwiLFxuLy8gICAgICAgICBsb2dTdHJlYW1OYW1lOiBcIjIwMjQvMDcvMDUvWzEyM11hYmNkZWYxMjNcIixcbi8vICAgICAgICAgZ2V0UmVtYWluaW5nVGltZUluTWlsbGlzOiAoKSA9PiAzMDAwMDAsIC8vIDUgbWludXRlcyByZW1haW5pbmdcbi8vICAgICAgICAgZG9uZTogKGVycm9yPzogRXJyb3IsIHJlc3VsdD86IGFueSkgPT4ge1xuLy8gICAgICAgICAgICAgaWYgKGVycm9yKSB7XG4vLyAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkNvbnRleHQgZG9uZSAoZXJyb3IpOlwiLCBlcnJvcik7XG4vLyAgICAgICAgICAgICB9IGVsc2Uge1xuLy8gICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQ29udGV4dCBkb25lIChzdWNjZXNzKTpcIiwgcmVzdWx0KTtcbi8vICAgICAgICAgICAgIH1cbi8vICAgICAgICAgfSxcbi8vICAgICAgICAgc3VjY2VlZDogKHJlc3VsdD86IGFueSkgPT4gY29uc29sZS5sb2coXCJDb250ZXh0IHN1Y2NlZWQ6XCIsIHJlc3VsdCksXG4vLyAgICAgICAgIGZhaWw6IChlcnJvcjogRXJyb3IgfCBzdHJpbmcpID0+IGNvbnNvbGUuZXJyb3IoXCJDb250ZXh0IGZhaWw6XCIsIGVycm9yKSxcbi8vICAgICB9O1xuXG4vLyAgICAgdHJ5IHtcbi8vICAgICAgICAgYXdhaXQgaGFuZGxlcih0ZXN0RXZlbnQsIHRlc3RDb250ZXh0KTtcbi8vICAgICAgICAgY29uc29sZS5sb2coXCLinIUgVGVzdCBoYW5kbGVyIGV4ZWN1dGlvbiBjb21wbGV0ZWQgc3VjY2Vzc2Z1bGx5LlwiKTtcbi8vICAgICB9IGNhdGNoIChlcnJvcikge1xuLy8gICAgICAgICBjb25zb2xlLmVycm9yKFwi4p2MIFRlc3QgaGFuZGxlciBleGVjdXRpb24gZmFpbGVkOlwiLCBlcnJvcik7XG4vLyAgICAgICAgIHRocm93IGVycm9yOyAvLyBSZS10aHJvdyB0byBpbmRpY2F0ZSB0ZXN0IGZhaWx1cmVcbi8vICAgICB9IGZpbmFsbHkge1xuLy8gICAgICAgICBjb25zb2xlLmxvZyhcIi0tLSBUZXN0IGZvciBoYW5kbGVyIGZpbmlzaGVkIC0tLVwiKTtcbi8vICAgICB9XG4vLyB9XG5cbi8vIC8vIEV4cG9ydCB0eXBlcyBmb3IgdXNlIGluIG90aGVyIG1vZHVsZXNcbi8vIGV4cG9ydCB0eXBlIHtcbi8vICAgICBDbG91ZFdhdGNoTG9nc0V2ZW50LFxuLy8gICAgIENsb3VkV2F0Y2hMb2dzRGF0YSxcbi8vICAgICBMb2dFdmVudCxcbi8vICAgICBMZWF2ZVN0YXR1c0RhdGEsXG4vLyAgICAgTmFtZURhdGEsXG4vLyAgICAgRW1haWxDb250ZW50LFxuLy8gICAgIExlYXZlU3RhdHVzXG4vLyB9O1xuXG4vLyBleHBvcnQgZGVmYXVsdCBoYW5kbGVyOyJdfQ==