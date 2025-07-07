"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sender = sender;
exports.generatePlainTextVersion = generatePlainTextVersion;
exports.testEmailConfiguration = testEmailConfiguration;
exports.batchSendEmails = batchSendEmails;
exports.validateEmailTemplate = validateEmailTemplate;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const client_ses_1 = require("@aws-sdk/client-ses");
const ejs = __importStar(require("ejs")); // Added EJS import
// Constants
const CHARSET = "UTF-8";
const SES_REGION = "us-east-1"; // Consider making this configurable via environment variables
const SENDER_EMAIL = "admin.mailer@disraptor-internal.net"; // Consider making this configurable
const REPLY_TO_EMAIL = "noreply@disraptor-internal.net"; // Consider making this configurable
function createSESClient() {
    return new client_ses_1.SESClient({
        region: SES_REGION,
        maxAttempts: 3
    });
}
/**
 * Send email using AWS SES with HTML template
 */
async function sender(recipientEmail, name, body, subject, status) {
    console.log("=== Email Sending Process Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Name:", name);
    console.log("Subject:", subject);
    console.log("Status:", status);
    try {
        validateEmailParams({ recipientEmail, name, body, subject, status });
        const html = await renderEmailTemplate({
            subject,
            name,
            body,
            status,
            currentYear: new Date().getFullYear()
        });
        const params = buildSESParams(recipientEmail, subject, html, name, body, status);
        const sesClient = createSESClient();
        // The SendEmailCommandInput type is compatible with SESEmailParams if all required fields match.
        // If not, it's better to explicitly map rather than casting.
        const command = new client_ses_1.SendEmailCommand(params);
        const data = await sesClient.send(command);
        console.log("Email sent successfully!");
        console.log("MessageId:", data.MessageId);
        return {
            success: true,
            messageId: data.MessageId ?? "unknown",
            recipient: recipientEmail
        };
    }
    catch (err) {
        console.error("Error sending email:");
        handleEmailError(err);
        throw err;
    }
}
/**
 * Validate input parameters for email sending
 */
function validateEmailParams(params) {
    const { recipientEmail, name, body, subject, status } = params;
    if (!recipientEmail || !name || !body || !subject || !status) {
        throw new Error("Missing required parameters for email sending");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid email format: ${recipientEmail}`);
    }
    // Validate name (should not be empty after trimming)
    if (!name.trim()) {
        throw new Error("Name cannot be empty");
    }
    // Validate subject and body length
    if (subject.length > 998) { // SES limit
        throw new Error("Subject line too long (max 998 characters)");
    }
    if (body.length > 40000) { // Conservative limit for email body
        console.warn("Email body is quite long, consider shortening it");
    }
}
/**
 * Render the email template with provided variables
 */
async function renderEmailTemplate(variables) {
    // Verify if the email template exists
    const emailTemplatePath = path.join(__dirname, "template.html");
    console.log("Looking for template at:", emailTemplatePath);
    if (!fs.existsSync(emailTemplatePath)) {
        console.error("Email template not found at:", emailTemplatePath);
        // List files in current directory for debugging
        console.log("Files in current directory:");
        const files = fs.readdirSync(__dirname);
        files.forEach(file => console.log(" -", file));
        throw new Error(`Email template not found: ${emailTemplatePath}`);
    }
    console.log("Email template found, reading file...");
    // Read the email template from a file
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
    console.log("Template loaded, size:", emailTemplate.length, "characters");
    // Compile the email template using EJS
    const compiledEmailTemplate = ejs.compile(emailTemplate, {
        async: true,
        filename: emailTemplatePath // Add filename for better error reporting
    });
    console.log("Template compiled, rendering HTML...");
    // Render the HTML with template variables
    const html = await compiledEmailTemplate(variables);
    return html;
}
/**
 * Build SES parameters for sending email
 */
function buildSESParams(recipientEmail, subject, html, name, body, status) {
    return {
        Destination: {
            ToAddresses: [recipientEmail],
        },
        Message: {
            Body: {
                Html: {
                    Charset: CHARSET,
                    Data: html,
                },
                Text: {
                    Charset: CHARSET,
                    Data: generatePlainTextVersion(name, body, status)
                }
            },
            Subject: {
                Charset: CHARSET,
                Data: subject,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            {
                Name: "EmailType",
                Value: "LeaveStatusUpdate"
            },
            {
                Name: "Status",
                Value: status
            }
        ]
    };
}
/**
 * Handle and log SES errors with specific error codes
 */
function handleEmailError(err) {
    console.error("Error Type:", err.name); // Cast to Error to access name and message
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    // Log specific SES errors
    if (err instanceof client_ses_1.SESServiceException) {
        console.error("SES Error:", err.name, err.message);
        switch (err.name) {
            case 'MessageRejected':
                console.error("SES rejected the message. Check email content and recipient.");
                break;
            case 'SendingPausedException':
                console.error("SES sending is paused for your account.");
                break;
            case 'MailFromDomainNotVerifiedException':
                console.error("The sender email domain is not verified in SES.");
                break;
            case 'ConfigurationSetDoesNotExistException':
                console.error("The specified configuration set does not exist.");
                break;
            case 'AccountSendingPausedException':
                console.error("Your AWS account's SES sending is paused.");
                break;
            case 'InvalidParameterValueException':
                console.error("Invalid parameter value provided to SES.");
                break;
            default:
                console.error("Unknown SES error occurred.");
        }
    }
}
/**
 * Generate a plain text version of the email as fallback
 */
function generatePlainTextVersion(name, body, status) {
    return `
Hello ${name},

${body}

Status: ${status.toUpperCase()}

${getStatusMessage(status)}

Please log into the Disruptor Leave Management System to view more details.

Best regards,
Disruptor LMS Team

---
This is an automated message from the Disruptor Leave Management System.
© ${new Date().getFullYear()} Disruptor. All rights reserved.
`.trim();
}
/**
 * Get status-specific message for plain text emails
 */
function getStatusMessage(status) {
    const statusLower = status.toLowerCase();
    const messages = {
        approved: "Your leave request has been approved! You can proceed with your planned time off.",
        rejected: "Your leave request has been declined. Please contact your manager for more information.",
        pending: "Your leave request is currently being reviewed. You will receive another notification once a decision has been made.",
        cancelled: "Your leave request has been cancelled."
    };
    return messages[statusLower] || `Your leave request status has been updated to: ${status}.`;
}
/**
 * Test function to verify email configuration
 */
async function testEmailConfiguration(testEmail = "test@example.com") {
    console.log("Testing email configuration...");
    try {
        await sender(testEmail, "Test User", "This is a test email to verify the email configuration.", "Email Configuration Test", "approved");
        console.log("Email configuration test successful!");
        return true;
    }
    catch (error) {
        console.error("Email configuration test failed:", error.message);
        return false;
    }
}
/**
 * Batch send emails to multiple recipients
 */
async function batchSendEmails(emailList) {
    console.log(`Starting batch email send for ${emailList.length} recipients`);
    // Send emails in parallel with error handling
    const results = await Promise.allSettled(emailList.map(emailData => sender(emailData.recipientEmail, emailData.name, emailData.body, emailData.subject, emailData.status))).then(results => results.map(result => result.status === 'fulfilled' ? result.value : result.reason));
    const successful = results.filter(result => !(result instanceof Error)).length;
    const failed = results.filter(result => result instanceof Error).length;
    console.log(`Batch email send completed: ${successful} successful, ${failed} failed`);
    return results;
}
/**
 * Validate email template syntax
 */
function validateEmailTemplate() {
    try {
        const templatePath = path.join(__dirname, "template.html");
        if (!fs.existsSync(templatePath)) {
            console.error("Template file not found");
            return false;
        }
        const template = fs.readFileSync(templatePath, "utf-8");
        // Try to compile the template
        ejs.compile(template, { filename: templatePath });
        console.log("Email template validation successful");
        return true;
    }
    catch (error) {
        console.error("Email template validation failed:", error.message);
        return false;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1haWxNaWRkbGV3YXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1haWxNaWRkbGV3YXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFvRkEsd0JBOENDO0FBNkpELDREQW1CQztBQXFCRCx3REFrQkM7QUFLRCwwQ0FrQ0M7QUFLRCxzREFtQkM7QUF4WkQsMkNBQTZCO0FBQzdCLHVDQUF5QjtBQUN6QixvREFBOEc7QUFDOUcseUNBQTJCLENBQUMsbUJBQW1CO0FBaUUvQyxZQUFZO0FBQ1osTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxDQUFDLDhEQUE4RDtBQUM5RixNQUFNLFlBQVksR0FBRyxxQ0FBcUMsQ0FBQyxDQUFDLG9DQUFvQztBQUNoRyxNQUFNLGNBQWMsR0FBRyxnQ0FBZ0MsQ0FBQyxDQUFDLG9DQUFvQztBQUU3RixTQUFTLGVBQWU7SUFDcEIsT0FBTyxJQUFJLHNCQUFTLENBQUM7UUFDakIsTUFBTSxFQUFFLFVBQVU7UUFDbEIsV0FBVyxFQUFFLENBQUM7S0FDakIsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVEOztHQUVHO0FBQ0ksS0FBSyxVQUFVLE1BQU0sQ0FDeEIsY0FBc0IsRUFDdEIsSUFBWSxFQUNaLElBQVksRUFDWixPQUFlLEVBQ2YsTUFBYztJQUVkLE9BQU8sQ0FBQyxHQUFHLENBQUMsdUNBQXVDLENBQUMsQ0FBQztJQUNyRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztJQUMxQyxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMzQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUUvQixJQUFJLENBQUM7UUFD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LEVBQUUsQ0FBQyxDQUFDO1FBRWxELE9BQU8sQ0FBQyxHQUFHLENBQUMsc0NBQXNDLENBQUMsQ0FBQztRQUNwRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUNBQW1DLEVBQUcsS0FBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzdFLE9BQU8sS0FBSyxDQUFDO0lBQ2pCLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0ICogYXMgZnMgZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBTRVNDbGllbnQsIFNlbmRFbWFpbENvbW1hbmQsIFNlbmRFbWFpbENvbW1hbmRJbnB1dCwgU0VTU2VydmljZUV4Y2VwdGlvbiB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc2VzXCI7XG5pbXBvcnQgKiBhcyBlanMgZnJvbSBcImVqc1wiOyAvLyBBZGRlZCBFSlMgaW1wb3J0XG5cblxuLy8gVHlwZXMgYW5kIEludGVyZmFjZXNcbmludGVyZmFjZSBFbWFpbFJlc3VsdCB7XG4gICAgc3VjY2VzczogYm9vbGVhbjtcbiAgICBtZXNzYWdlSWQ6IHN0cmluZztcbiAgICByZWNpcGllbnQ6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEVtYWlsUGFyYW1zIHtcbiAgICByZWNpcGllbnRFbWFpbDogc3RyaW5nO1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBib2R5OiBzdHJpbmc7XG4gICAgc3ViamVjdDogc3RyaW5nO1xuICAgIHN0YXR1czogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgVGVtcGxhdGVWYXJpYWJsZXMge1xuICAgIHN1YmplY3Q6IHN0cmluZztcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgYm9keTogc3RyaW5nO1xuICAgIHN0YXR1czogc3RyaW5nO1xuICAgIGN1cnJlbnRZZWFyOiBudW1iZXI7XG59XG5cbi8vIEFkanVzdGVkIFNFU0VtYWlsUGFyYW1zIHRvIGFsaWduIG1vcmUgY2xvc2VseSB3aXRoIFNlbmRFbWFpbENvbW1hbmRJbnB1dFxuaW50ZXJmYWNlIFNFU0VtYWlsUGFyYW1zIHtcbiAgICBEZXN0aW5hdGlvbjoge1xuICAgICAgICBUb0FkZHJlc3Nlczogc3RyaW5nW107XG4gICAgfTtcbiAgICBNZXNzYWdlOiB7XG4gICAgICAgIEJvZHk6IHtcbiAgICAgICAgICAgIEh0bWw6IHtcbiAgICAgICAgICAgICAgICBDaGFyc2V0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgRGF0YTogc3RyaW5nO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFRleHQ6IHtcbiAgICAgICAgICAgICAgICBDaGFyc2V0OiBzdHJpbmc7XG4gICAgICAgICAgICAgICAgRGF0YTogc3RyaW5nO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfTtcbiAgICAgICAgU3ViamVjdDoge1xuICAgICAgICAgICAgQ2hhcnNldDogc3RyaW5nO1xuICAgICAgICAgICAgRGF0YTogc3RyaW5nO1xuICAgICAgICB9O1xuICAgIH07XG4gICAgU291cmNlOiBzdHJpbmc7XG4gICAgUmVwbHlUb0FkZHJlc3Nlcz86IHN0cmluZ1tdO1xuICAgIFRhZ3M/OiBBcnJheTx7XG4gICAgICAgIE5hbWU6IHN0cmluZztcbiAgICAgICAgVmFsdWU6IHN0cmluZztcbiAgICB9PjtcbiAgICBDb25maWd1cmF0aW9uU2V0TmFtZT86IHN0cmluZzsgLy8gQWRkZWQgdG8gYWxpZ24gd2l0aCBTZW5kRW1haWxDb21tYW5kSW5wdXRcbn1cblxuaW50ZXJmYWNlIFNFU1Jlc3BvbnNlIHtcbiAgICBNZXNzYWdlSWQ6IHN0cmluZztcbiAgICBSZXNwb25zZU1ldGFkYXRhPzoge1xuICAgICAgICBSZXF1ZXN0SWQ6IHN0cmluZztcbiAgICB9O1xufVxuXG50eXBlIExlYXZlU3RhdHVzID0gJ2FwcHJvdmVkJyB8ICdyZWplY3RlZCcgfCAncGVuZGluZycgfCAnY2FuY2VsbGVkJztcblxuLy8gQ29uc3RhbnRzXG5jb25zdCBDSEFSU0VUID0gXCJVVEYtOFwiO1xuY29uc3QgU0VTX1JFR0lPTiA9IFwidXMtZWFzdC0xXCI7IC8vIENvbnNpZGVyIG1ha2luZyB0aGlzIGNvbmZpZ3VyYWJsZSB2aWEgZW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBTRU5ERVJfRU1BSUwgPSBcImFkbWluLm1haWxlckBkaXNyYXB0b3ItaW50ZXJuYWwubmV0XCI7IC8vIENvbnNpZGVyIG1ha2luZyB0aGlzIGNvbmZpZ3VyYWJsZVxuY29uc3QgUkVQTFlfVE9fRU1BSUwgPSBcIm5vcmVwbHlAZGlzcmFwdG9yLWludGVybmFsLm5ldFwiOyAvLyBDb25zaWRlciBtYWtpbmcgdGhpcyBjb25maWd1cmFibGVcblxuZnVuY3Rpb24gY3JlYXRlU0VTQ2xpZW50KCk6IFNFU0NsaWVudCB7XG4gICAgcmV0dXJuIG5ldyBTRVNDbGllbnQoe1xuICAgICAgICByZWdpb246IFNFU19SRUdJT04sXG4gICAgICAgIG1heEF0dGVtcHRzOiAzXG4gICAgfSk7XG59XG5cbi8qKlxuICogU2VuZCBlbWFpbCB1c2luZyBBV1MgU0VTIHdpdGggSFRNTCB0ZW1wbGF0ZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZGVyKFxuICAgIHJlY2lwaWVudEVtYWlsOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGJvZHk6IHN0cmluZyxcbiAgICBzdWJqZWN0OiBzdHJpbmcsXG4gICAgc3RhdHVzOiBzdHJpbmdcbik6IFByb21pc2U8RW1haWxSZXN1bHQ+IHtcbiAgICBjb25zb2xlLmxvZyhcIj09PSBFbWFpbCBTZW5kaW5nIFByb2Nlc3MgU3RhcnRlZCA9PT1cIik7XG4gICAgY29uc29sZS5sb2coXCJSZWNpcGllbnQ6XCIsIHJlY2lwaWVudEVtYWlsKTtcbiAgICBjb25zb2xlLmxvZyhcIk5hbWU6XCIsIG5hbWUpO1xuICAgIGNvbnNvbGUubG9nKFwiU3ViamVjdDpcIiwgc3ViamVjdCk7XG4gICAgY29uc29sZS5sb2coXCJTdGF0dXM6XCIsIHN0YXR1cyk7XG5cbiAgICB0cnkge1xuICAgICAgICB2YWxpZGF0ZUVtYWlsUGFyYW1zKHsgcmVjaXBpZW50RW1haWwsIG5hbWUsIGJvZHksIHN1YmplY3QsIHN0YXR1cyB9KTtcblxuICAgICAgICBjb25zdCBodG1sOiBzdHJpbmcgPSBhd2FpdCByZW5kZXJFbWFpbFRlbXBsYXRlKHtcbiAgICAgICAgICAgIHN1YmplY3QsXG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgYm9keSxcbiAgICAgICAgICAgIHN0YXR1cyxcbiAgICAgICAgICAgIGN1cnJlbnRZZWFyOiBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc3QgcGFyYW1zOiBTRVNFbWFpbFBhcmFtcyA9IGJ1aWxkU0VTUGFyYW1zKHJlY2lwaWVudEVtYWlsLCBzdWJqZWN0LCBodG1sLCBuYW1lLCBib2R5LCBzdGF0dXMpO1xuXG4gICAgICAgIGNvbnN0IHNlc0NsaWVudCA9IGNyZWF0ZVNFU0NsaWVudCgpO1xuICAgICAgICAvLyBUaGUgU2VuZEVtYWlsQ29tbWFuZElucHV0IHR5cGUgaXMgY29tcGF0aWJsZSB3aXRoIFNFU0VtYWlsUGFyYW1zIGlmIGFsbCByZXF1aXJlZCBmaWVsZHMgbWF0Y2guXG4gICAgICAgIC8vIElmIG5vdCwgaXQncyBiZXR0ZXIgdG8gZXhwbGljaXRseSBtYXAgcmF0aGVyIHRoYW4gY2FzdGluZy5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBTZW5kRW1haWxDb21tYW5kKHBhcmFtcyBhcyBTZW5kRW1haWxDb21tYW5kSW5wdXQpO1xuICAgICAgICBjb25zdCBkYXRhID0gYXdhaXQgc2VzQ2xpZW50LnNlbmQoY29tbWFuZCk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJFbWFpbCBzZW50IHN1Y2Nlc3NmdWxseSFcIik7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiTWVzc2FnZUlkOlwiLCBkYXRhLk1lc3NhZ2VJZCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgICAgICBtZXNzYWdlSWQ6IGRhdGEuTWVzc2FnZUlkID8/IFwidW5rbm93blwiLFxuICAgICAgICAgICAgcmVjaXBpZW50OiByZWNpcGllbnRFbWFpbFxuICAgICAgICB9O1xuXG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBzZW5kaW5nIGVtYWlsOlwiKTtcbiAgICAgICAgaGFuZGxlRW1haWxFcnJvcihlcnIpO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIGlucHV0IHBhcmFtZXRlcnMgZm9yIGVtYWlsIHNlbmRpbmdcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVFbWFpbFBhcmFtcyhwYXJhbXM6IEVtYWlsUGFyYW1zKTogdm9pZCB7XG4gICAgY29uc3QgeyByZWNpcGllbnRFbWFpbCwgbmFtZSwgYm9keSwgc3ViamVjdCwgc3RhdHVzIH0gPSBwYXJhbXM7XG5cbiAgICBpZiAoIXJlY2lwaWVudEVtYWlsIHx8ICFuYW1lIHx8ICFib2R5IHx8ICFzdWJqZWN0IHx8ICFzdGF0dXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTWlzc2luZyByZXF1aXJlZCBwYXJhbWV0ZXJzIGZvciBlbWFpbCBzZW5kaW5nXCIpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGVtYWlsIGZvcm1hdFxuICAgIGNvbnN0IGVtYWlsUmVnZXg6IFJlZ0V4cCA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvO1xuICAgIGlmICghZW1haWxSZWdleC50ZXN0KHJlY2lwaWVudEVtYWlsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZW1haWwgZm9ybWF0OiAke3JlY2lwaWVudEVtYWlsfWApO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIG5hbWUgKHNob3VsZCBub3QgYmUgZW1wdHkgYWZ0ZXIgdHJpbW1pbmcpXG4gICAgaWYgKCFuYW1lLnRyaW0oKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOYW1lIGNhbm5vdCBiZSBlbXB0eVwiKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBzdWJqZWN0IGFuZCBib2R5IGxlbmd0aFxuICAgIGlmIChzdWJqZWN0Lmxlbmd0aCA+IDk5OCkgeyAvLyBTRVMgbGltaXRcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU3ViamVjdCBsaW5lIHRvbyBsb25nIChtYXggOTk4IGNoYXJhY3RlcnMpXCIpO1xuICAgIH1cblxuICAgIGlmIChib2R5Lmxlbmd0aCA+IDQwMDAwKSB7IC8vIENvbnNlcnZhdGl2ZSBsaW1pdCBmb3IgZW1haWwgYm9keVxuICAgICAgICBjb25zb2xlLndhcm4oXCJFbWFpbCBib2R5IGlzIHF1aXRlIGxvbmcsIGNvbnNpZGVyIHNob3J0ZW5pbmcgaXRcIik7XG4gICAgfVxufVxuXG4vKipcbiAqIFJlbmRlciB0aGUgZW1haWwgdGVtcGxhdGUgd2l0aCBwcm92aWRlZCB2YXJpYWJsZXNcbiAqL1xuYXN5bmMgZnVuY3Rpb24gcmVuZGVyRW1haWxUZW1wbGF0ZSh2YXJpYWJsZXM6IFRlbXBsYXRlVmFyaWFibGVzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBWZXJpZnkgaWYgdGhlIGVtYWlsIHRlbXBsYXRlIGV4aXN0c1xuICAgIGNvbnN0IGVtYWlsVGVtcGxhdGVQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4oX19kaXJuYW1lLCBcInRlbXBsYXRlLmh0bWxcIik7XG4gICAgY29uc29sZS5sb2coXCJMb29raW5nIGZvciB0ZW1wbGF0ZSBhdDpcIiwgZW1haWxUZW1wbGF0ZVBhdGgpO1xuXG4gICAgaWYgKCFmcy5leGlzdHNTeW5jKGVtYWlsVGVtcGxhdGVQYXRoKSkge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRW1haWwgdGVtcGxhdGUgbm90IGZvdW5kIGF0OlwiLCBlbWFpbFRlbXBsYXRlUGF0aCk7XG5cbiAgICAgICAgLy8gTGlzdCBmaWxlcyBpbiBjdXJyZW50IGRpcmVjdG9yeSBmb3IgZGVidWdnaW5nXG4gICAgICAgIGNvbnNvbGUubG9nKFwiRmlsZXMgaW4gY3VycmVudCBkaXJlY3Rvcnk6XCIpO1xuICAgICAgICBjb25zdCBmaWxlczogc3RyaW5nW10gPSBmcy5yZWFkZGlyU3luYyhfX2Rpcm5hbWUpO1xuICAgICAgICBmaWxlcy5mb3JFYWNoKGZpbGUgPT4gY29uc29sZS5sb2coXCIgLVwiLCBmaWxlKSk7XG5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFbWFpbCB0ZW1wbGF0ZSBub3QgZm91bmQ6ICR7ZW1haWxUZW1wbGF0ZVBhdGh9YCk7XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coXCJFbWFpbCB0ZW1wbGF0ZSBmb3VuZCwgcmVhZGluZyBmaWxlLi4uXCIpO1xuXG4gICAgLy8gUmVhZCB0aGUgZW1haWwgdGVtcGxhdGUgZnJvbSBhIGZpbGVcbiAgICBjb25zdCBlbWFpbFRlbXBsYXRlOiBzdHJpbmcgPSBmcy5yZWFkRmlsZVN5bmMoZW1haWxUZW1wbGF0ZVBhdGgsIFwidXRmLThcIik7XG4gICAgY29uc29sZS5sb2coXCJUZW1wbGF0ZSBsb2FkZWQsIHNpemU6XCIsIGVtYWlsVGVtcGxhdGUubGVuZ3RoLCBcImNoYXJhY3RlcnNcIik7XG5cbiAgICAvLyBDb21waWxlIHRoZSBlbWFpbCB0ZW1wbGF0ZSB1c2luZyBFSlNcbiAgICBjb25zdCBjb21waWxlZEVtYWlsVGVtcGxhdGUgPSBlanMuY29tcGlsZShlbWFpbFRlbXBsYXRlLCB7XG4gICAgICAgIGFzeW5jOiB0cnVlLFxuICAgICAgICBmaWxlbmFtZTogZW1haWxUZW1wbGF0ZVBhdGggLy8gQWRkIGZpbGVuYW1lIGZvciBiZXR0ZXIgZXJyb3IgcmVwb3J0aW5nXG4gICAgfSk7XG5cbiAgICBjb25zb2xlLmxvZyhcIlRlbXBsYXRlIGNvbXBpbGVkLCByZW5kZXJpbmcgSFRNTC4uLlwiKTtcblxuICAgIC8vIFJlbmRlciB0aGUgSFRNTCB3aXRoIHRlbXBsYXRlIHZhcmlhYmxlc1xuICAgIGNvbnN0IGh0bWw6IHN0cmluZyA9IGF3YWl0IGNvbXBpbGVkRW1haWxUZW1wbGF0ZSh2YXJpYWJsZXMpO1xuXG4gICAgcmV0dXJuIGh0bWw7XG59XG5cbi8qKlxuICogQnVpbGQgU0VTIHBhcmFtZXRlcnMgZm9yIHNlbmRpbmcgZW1haWxcbiAqL1xuZnVuY3Rpb24gYnVpbGRTRVNQYXJhbXMoXG4gICAgcmVjaXBpZW50RW1haWw6IHN0cmluZyxcbiAgICBzdWJqZWN0OiBzdHJpbmcsXG4gICAgaHRtbDogc3RyaW5nLFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBib2R5OiBzdHJpbmcsXG4gICAgc3RhdHVzOiBzdHJpbmdcbik6IFNFU0VtYWlsUGFyYW1zIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBEZXN0aW5hdGlvbjoge1xuICAgICAgICAgICAgVG9BZGRyZXNzZXM6IFtyZWNpcGllbnRFbWFpbF0sXG4gICAgICAgIH0sXG4gICAgICAgIE1lc3NhZ2U6IHtcbiAgICAgICAgICAgIEJvZHk6IHtcbiAgICAgICAgICAgICAgICBIdG1sOiB7XG4gICAgICAgICAgICAgICAgICAgIENoYXJzZXQ6IENIQVJTRVQsXG4gICAgICAgICAgICAgICAgICAgIERhdGE6IGh0bWwsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBUZXh0OiB7XG4gICAgICAgICAgICAgICAgICAgIENoYXJzZXQ6IENIQVJTRVQsXG4gICAgICAgICAgICAgICAgICAgIERhdGE6IGdlbmVyYXRlUGxhaW5UZXh0VmVyc2lvbihuYW1lLCBib2R5LCBzdGF0dXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIFN1YmplY3Q6IHtcbiAgICAgICAgICAgICAgICBDaGFyc2V0OiBDSEFSU0VULFxuICAgICAgICAgICAgICAgIERhdGE6IHN1YmplY3QsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBTb3VyY2U6IFNFTkRFUl9FTUFJTCxcbiAgICAgICAgUmVwbHlUb0FkZHJlc3NlczogW1JFUExZX1RPX0VNQUlMXSxcbiAgICAgICAgVGFnczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIE5hbWU6IFwiRW1haWxUeXBlXCIsXG4gICAgICAgICAgICAgICAgVmFsdWU6IFwiTGVhdmVTdGF0dXNVcGRhdGVcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBOYW1lOiBcIlN0YXR1c1wiLFxuICAgICAgICAgICAgICAgIFZhbHVlOiBzdGF0dXNcbiAgICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgIH07XG59XG5cbi8qKlxuICogSGFuZGxlIGFuZCBsb2cgU0VTIGVycm9ycyB3aXRoIHNwZWNpZmljIGVycm9yIGNvZGVzXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUVtYWlsRXJyb3IoZXJyOiB1bmtub3duKTogdm9pZCB7XG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIFR5cGU6XCIsIChlcnIgYXMgRXJyb3IpLm5hbWUpOyAvLyBDYXN0IHRvIEVycm9yIHRvIGFjY2VzcyBuYW1lIGFuZCBtZXNzYWdlXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIE1lc3NhZ2U6XCIsIChlcnIgYXMgRXJyb3IpLm1lc3NhZ2UpO1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBTdGFjazpcIiwgKGVyciBhcyBFcnJvcikuc3RhY2spO1xuXG4gICAgLy8gTG9nIHNwZWNpZmljIFNFUyBlcnJvcnNcbiAgICBpZiAoZXJyIGluc3RhbmNlb2YgU0VTU2VydmljZUV4Y2VwdGlvbikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiU0VTIEVycm9yOlwiLCBlcnIubmFtZSwgZXJyLm1lc3NhZ2UpO1xuICAgICAgICBzd2l0Y2ggKGVyci5uYW1lKSB7XG4gICAgICAgICAgICBjYXNlICdNZXNzYWdlUmVqZWN0ZWQnOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTRVMgcmVqZWN0ZWQgdGhlIG1lc3NhZ2UuIENoZWNrIGVtYWlsIGNvbnRlbnQgYW5kIHJlY2lwaWVudC5cIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdTZW5kaW5nUGF1c2VkRXhjZXB0aW9uJzpcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiU0VTIHNlbmRpbmcgaXMgcGF1c2VkIGZvciB5b3VyIGFjY291bnQuXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnTWFpbEZyb21Eb21haW5Ob3RWZXJpZmllZEV4Y2VwdGlvbic6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBzZW5kZXIgZW1haWwgZG9tYWluIGlzIG5vdCB2ZXJpZmllZCBpbiBTRVMuXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnQ29uZmlndXJhdGlvblNldERvZXNOb3RFeGlzdEV4Y2VwdGlvbic6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIlRoZSBzcGVjaWZpZWQgY29uZmlndXJhdGlvbiBzZXQgZG9lcyBub3QgZXhpc3QuXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnQWNjb3VudFNlbmRpbmdQYXVzZWRFeGNlcHRpb24nOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJZb3VyIEFXUyBhY2NvdW50J3MgU0VTIHNlbmRpbmcgaXMgcGF1c2VkLlwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0ludmFsaWRQYXJhbWV0ZXJWYWx1ZUV4Y2VwdGlvbic6XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkludmFsaWQgcGFyYW1ldGVyIHZhbHVlIHByb3ZpZGVkIHRvIFNFUy5cIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmtub3duIFNFUyBlcnJvciBvY2N1cnJlZC5cIik7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSBwbGFpbiB0ZXh0IHZlcnNpb24gb2YgdGhlIGVtYWlsIGFzIGZhbGxiYWNrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVBsYWluVGV4dFZlcnNpb24obmFtZTogc3RyaW5nLCBib2R5OiBzdHJpbmcsIHN0YXR1czogc3RyaW5nKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYFxuSGVsbG8gJHtuYW1lfSxcblxuJHtib2R5fVxuXG5TdGF0dXM6ICR7c3RhdHVzLnRvVXBwZXJDYXNlKCl9XG5cbiR7Z2V0U3RhdHVzTWVzc2FnZShzdGF0dXMpfVxuXG5QbGVhc2UgbG9nIGludG8gdGhlIERpc3J1cHRvciBMZWF2ZSBNYW5hZ2VtZW50IFN5c3RlbSB0byB2aWV3IG1vcmUgZGV0YWlscy5cblxuQmVzdCByZWdhcmRzLFxuRGlzcnVwdG9yIExNUyBUZWFtXG5cbi0tLVxuVGhpcyBpcyBhbiBhdXRvbWF0ZWQgbWVzc2FnZSBmcm9tIHRoZSBEaXNydXB0b3IgTGVhdmUgTWFuYWdlbWVudCBTeXN0ZW0uXG7CqSAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gRGlzcnVwdG9yLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuYC50cmltKCk7XG59XG5cbi8qKlxuICogR2V0IHN0YXR1cy1zcGVjaWZpYyBtZXNzYWdlIGZvciBwbGFpbiB0ZXh0IGVtYWlsc1xuICovXG5mdW5jdGlvbiBnZXRTdGF0dXNNZXNzYWdlKHN0YXR1czogc3RyaW5nKTogc3RyaW5nIHtcbiAgICBjb25zdCBzdGF0dXNMb3dlciA9IHN0YXR1cy50b0xvd2VyQ2FzZSgpIGFzIExlYXZlU3RhdHVzO1xuXG4gICAgY29uc3QgbWVzc2FnZXM6IFJlY29yZDxMZWF2ZVN0YXR1cywgc3RyaW5nPiA9IHtcbiAgICAgICAgYXBwcm92ZWQ6IFwiWW91ciBsZWF2ZSByZXF1ZXN0IGhhcyBiZWVuIGFwcHJvdmVkISBZb3UgY2FuIHByb2NlZWQgd2l0aCB5b3VyIHBsYW5uZWQgdGltZSBvZmYuXCIsXG4gICAgICAgIHJlamVjdGVkOiBcIllvdXIgbGVhdmUgcmVxdWVzdCBoYXMgYmVlbiBkZWNsaW5lZC4gUGxlYXNlIGNvbnRhY3QgeW91ciBtYW5hZ2VyIGZvciBtb3JlIGluZm9ybWF0aW9uLlwiLFxuICAgICAgICBwZW5kaW5nOiBcIllvdXIgbGVhdmUgcmVxdWVzdCBpcyBjdXJyZW50bHkgYmVpbmcgcmV2aWV3ZWQuIFlvdSB3aWxsIHJlY2VpdmUgYW5vdGhlciBub3RpZmljYXRpb24gb25jZSBhIGRlY2lzaW9uIGhhcyBiZWVuIG1hZGUuXCIsXG4gICAgICAgIGNhbmNlbGxlZDogXCJZb3VyIGxlYXZlIHJlcXVlc3QgaGFzIGJlZW4gY2FuY2VsbGVkLlwiXG4gICAgfTtcblxuICAgIHJldHVybiBtZXNzYWdlc1tzdGF0dXNMb3dlcl0gfHwgYFlvdXIgbGVhdmUgcmVxdWVzdCBzdGF0dXMgaGFzIGJlZW4gdXBkYXRlZCB0bzogJHtzdGF0dXN9LmA7XG59XG5cbi8qKlxuICogVGVzdCBmdW5jdGlvbiB0byB2ZXJpZnkgZW1haWwgY29uZmlndXJhdGlvblxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdEVtYWlsQ29uZmlndXJhdGlvbih0ZXN0RW1haWw6IHN0cmluZyA9IFwidGVzdEBleGFtcGxlLmNvbVwiKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgY29uc29sZS5sb2coXCJUZXN0aW5nIGVtYWlsIGNvbmZpZ3VyYXRpb24uLi5cIik7XG5cbiAgICB0cnkge1xuICAgICAgICBhd2FpdCBzZW5kZXIoXG4gICAgICAgICAgICB0ZXN0RW1haWwsXG4gICAgICAgICAgICBcIlRlc3QgVXNlclwiLFxuICAgICAgICAgICAgXCJUaGlzIGlzIGEgdGVzdCBlbWFpbCB0byB2ZXJpZnkgdGhlIGVtYWlsIGNvbmZpZ3VyYXRpb24uXCIsXG4gICAgICAgICAgICBcIkVtYWlsIENvbmZpZ3VyYXRpb24gVGVzdFwiLFxuICAgICAgICAgICAgXCJhcHByb3ZlZFwiXG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2coXCJFbWFpbCBjb25maWd1cmF0aW9uIHRlc3Qgc3VjY2Vzc2Z1bCFcIik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFbWFpbCBjb25maWd1cmF0aW9uIHRlc3QgZmFpbGVkOlwiLCAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vKipcbiAqIEJhdGNoIHNlbmQgZW1haWxzIHRvIG11bHRpcGxlIHJlY2lwaWVudHNcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGJhdGNoU2VuZEVtYWlscyhcbiAgICBlbWFpbExpc3Q6IEFycmF5PHtcbiAgICAgICAgcmVjaXBpZW50RW1haWw6IHN0cmluZztcbiAgICAgICAgbmFtZTogc3RyaW5nO1xuICAgICAgICBib2R5OiBzdHJpbmc7XG4gICAgICAgIHN1YmplY3Q6IHN0cmluZztcbiAgICAgICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgfT5cbik6IFByb21pc2U8QXJyYXk8RW1haWxSZXN1bHQgfCBFcnJvcj4+IHtcbiAgICBjb25zb2xlLmxvZyhgU3RhcnRpbmcgYmF0Y2ggZW1haWwgc2VuZCBmb3IgJHtlbWFpbExpc3QubGVuZ3RofSByZWNpcGllbnRzYCk7XG5cbiAgICAvLyBTZW5kIGVtYWlscyBpbiBwYXJhbGxlbCB3aXRoIGVycm9yIGhhbmRsaW5nXG4gICAgY29uc3QgcmVzdWx0czogQXJyYXk8RW1haWxSZXN1bHQgfCBFcnJvcj4gPSBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQoXG4gICAgICAgIGVtYWlsTGlzdC5tYXAoZW1haWxEYXRhID0+XG4gICAgICAgICAgICBzZW5kZXIoXG4gICAgICAgICAgICAgICAgZW1haWxEYXRhLnJlY2lwaWVudEVtYWlsLFxuICAgICAgICAgICAgICAgIGVtYWlsRGF0YS5uYW1lLFxuICAgICAgICAgICAgICAgIGVtYWlsRGF0YS5ib2R5LFxuICAgICAgICAgICAgICAgIGVtYWlsRGF0YS5zdWJqZWN0LFxuICAgICAgICAgICAgICAgIGVtYWlsRGF0YS5zdGF0dXNcbiAgICAgICAgICAgIClcbiAgICAgICAgKVxuICAgICkudGhlbihyZXN1bHRzID0+XG4gICAgICAgIHJlc3VsdHMubWFwKHJlc3VsdCA9PlxuICAgICAgICAgICAgcmVzdWx0LnN0YXR1cyA9PT0gJ2Z1bGZpbGxlZCcgPyByZXN1bHQudmFsdWUgOiByZXN1bHQucmVhc29uXG4gICAgICAgIClcbiAgICApO1xuXG4gICAgY29uc3Qgc3VjY2Vzc2Z1bCA9IHJlc3VsdHMuZmlsdGVyKHJlc3VsdCA9PiAhKHJlc3VsdCBpbnN0YW5jZW9mIEVycm9yKSkubGVuZ3RoO1xuICAgIGNvbnN0IGZhaWxlZCA9IHJlc3VsdHMuZmlsdGVyKHJlc3VsdCA9PiByZXN1bHQgaW5zdGFuY2VvZiBFcnJvcikubGVuZ3RoO1xuXG4gICAgY29uc29sZS5sb2coYEJhdGNoIGVtYWlsIHNlbmQgY29tcGxldGVkOiAke3N1Y2Nlc3NmdWx9IHN1Y2Nlc3NmdWwsICR7ZmFpbGVkfSBmYWlsZWRgKTtcblxuICAgIHJldHVybiByZXN1bHRzO1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGVtYWlsIHRlbXBsYXRlIHN5bnRheFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFbWFpbFRlbXBsYXRlKCk6IGJvb2xlYW4ge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsIFwidGVtcGxhdGUuaHRtbFwiKTtcbiAgICAgICAgaWYgKCFmcy5leGlzdHNTeW5jKHRlbXBsYXRlUGF0aCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJUZW1wbGF0ZSBmaWxlIG5vdCBmb3VuZFwiKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRlbXBsYXRlID0gZnMucmVhZEZpbGVTeW5jKHRlbXBsYXRlUGF0aCwgXCJ1dGYtOFwiKTtcblxuICAgICAgICAvLyBUcnkgdG8gY29tcGlsZSB0aGUgdGVtcGxhdGVcbiAgICAgICAgZWpzLmNvbXBpbGUodGVtcGxhdGUsIHsgZmlsZW5hbWU6IHRlbXBsYXRlUGF0aCB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhcIkVtYWlsIHRlbXBsYXRlIHZhbGlkYXRpb24gc3VjY2Vzc2Z1bFwiKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVtYWlsIHRlbXBsYXRlIHZhbGlkYXRpb24gZmFpbGVkOlwiLCAoZXJyb3IgYXMgRXJyb3IpLm1lc3NhZ2UpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG4vLyBFeHBvcnQgdHlwZXMgZm9yIHVzZSBpbiBvdGhlciBtb2R1bGVzXG5leHBvcnQgdHlwZSB7XG4gICAgRW1haWxSZXN1bHQsXG4gICAgRW1haWxQYXJhbXMsXG4gICAgVGVtcGxhdGVWYXJpYWJsZXMsXG4gICAgU0VTRW1haWxQYXJhbXMsXG4gICAgU0VTUmVzcG9uc2UsXG4gICAgTGVhdmVTdGF0dXNcbn07Il19