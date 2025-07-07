// import * as zlib from 'zlib';
// import { Context } from 'aws-lambda';
// import { sender } from './emailMiddleware'; // Assuming emailMiddleware is correctly implemented and available

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