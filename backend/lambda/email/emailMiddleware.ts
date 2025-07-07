import * as path from "path";
import * as fs from "fs";
import { SESClient, SendEmailCommand, SendEmailCommandInput, SESServiceException } from "@aws-sdk/client-ses";
import * as ejs from "ejs"; // Added EJS import


// Types and Interfaces
interface EmailResult {
    success: boolean;
    messageId: string;
    recipient: string;
}

interface EmailParams {
    recipientEmail: string;
    name: string;
    body: string;
    subject: string;
    status: string;
}

interface TemplateVariables {
    subject: string;
    name: string;
    body: string;
    status: string;
    currentYear: number;
}

// Adjusted SESEmailParams to align more closely with SendEmailCommandInput
interface SESEmailParams {
    Destination: {
        ToAddresses: string[];
    };
    Message: {
        Body: {
            Html: {
                Charset: string;
                Data: string;
            };
            Text: {
                Charset: string;
                Data: string;
            };
        };
        Subject: {
            Charset: string;
            Data: string;
        };
    };
    Source: string;
    ReplyToAddresses?: string[];
    Tags?: Array<{
        Name: string;
        Value: string;
    }>;
    ConfigurationSetName?: string; // Added to align with SendEmailCommandInput
}

interface SESResponse {
    MessageId: string;
    ResponseMetadata?: {
        RequestId: string;
    };
}

type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled';

// Constants
const CHARSET = "UTF-8";
const SES_REGION = "us-east-1"; // Consider making this configurable via environment variables
const SENDER_EMAIL = "admin.mailer@disraptor-internal.net"; // Consider making this configurable
const REPLY_TO_EMAIL = "noreply@disraptor-internal.net"; // Consider making this configurable

function createSESClient(): SESClient {
    return new SESClient({
        region: SES_REGION,
        maxAttempts: 3
    });
}

/**
 * Send email using AWS SES with HTML template
 */
export async function sender(
    recipientEmail: string,
    name: string,
    body: string,
    subject: string,
    status: string
): Promise<EmailResult> {
    console.log("=== Email Sending Process Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Name:", name);
    console.log("Subject:", subject);
    console.log("Status:", status);

    try {
        validateEmailParams({ recipientEmail, name, body, subject, status });

        const html: string = await renderEmailTemplate({
            subject,
            name,
            body,
            status,
            currentYear: new Date().getFullYear()
        });

        const params: SESEmailParams = buildSESParams(recipientEmail, subject, html, name, body, status);

        const sesClient = createSESClient();
        // The SendEmailCommandInput type is compatible with SESEmailParams if all required fields match.
        // If not, it's better to explicitly map rather than casting.
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const data = await sesClient.send(command);

        console.log("Email sent successfully!");
        console.log("MessageId:", data.MessageId);

        return {
            success: true,
            messageId: data.MessageId ?? "unknown",
            recipient: recipientEmail
        };

    } catch (err) {
        console.error("Error sending email:");
        handleEmailError(err);
        throw err;
    }
}

/**
 * Validate input parameters for email sending
 */
function validateEmailParams(params: EmailParams): void {
    const { recipientEmail, name, body, subject, status } = params;

    if (!recipientEmail || !name || !body || !subject || !status) {
        throw new Error("Missing required parameters for email sending");
    }

    // Validate email format
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
async function renderEmailTemplate(variables: TemplateVariables): Promise<string> {
    // Verify if the email template exists
    const emailTemplatePath: string = path.join(__dirname, "template.html");
    console.log("Looking for template at:", emailTemplatePath);

    if (!fs.existsSync(emailTemplatePath)) {
        console.error("Email template not found at:", emailTemplatePath);

        // List files in current directory for debugging
        console.log("Files in current directory:");
        const files: string[] = fs.readdirSync(__dirname);
        files.forEach(file => console.log(" -", file));

        throw new Error(`Email template not found: ${emailTemplatePath}`);
    }

    console.log("Email template found, reading file...");

    // Read the email template from a file
    const emailTemplate: string = fs.readFileSync(emailTemplatePath, "utf-8");
    console.log("Template loaded, size:", emailTemplate.length, "characters");

    // Compile the email template using EJS
    const compiledEmailTemplate = ejs.compile(emailTemplate, {
        async: true,
        filename: emailTemplatePath // Add filename for better error reporting
    });

    console.log("Template compiled, rendering HTML...");

    // Render the HTML with template variables
    const html: string = await compiledEmailTemplate(variables);

    return html;
}

/**
 * Build SES parameters for sending email
 */
function buildSESParams(
    recipientEmail: string,
    subject: string,
    html: string,
    name: string,
    body: string,
    status: string
): SESEmailParams {
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
function handleEmailError(err: unknown): void {
    console.error("Error Type:", (err as Error).name); // Cast to Error to access name and message
    console.error("Error Message:", (err as Error).message);
    console.error("Error Stack:", (err as Error).stack);

    // Log specific SES errors
    if (err instanceof SESServiceException) {
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
export function generatePlainTextVersion(name: string, body: string, status: string): string {
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
function getStatusMessage(status: string): string {
    const statusLower = status.toLowerCase() as LeaveStatus;

    const messages: Record<LeaveStatus, string> = {
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
export async function testEmailConfiguration(testEmail: string = "test@example.com"): Promise<boolean> {
    console.log("Testing email configuration...");

    try {
        await sender(
            testEmail,
            "Test User",
            "This is a test email to verify the email configuration.",
            "Email Configuration Test",
            "approved"
        );

        console.log("Email configuration test successful!");
        return true;
    } catch (error) {
        console.error("Email configuration test failed:", (error as Error).message);
        return false;
    }
}

/**
 * Batch send emails to multiple recipients
 */
export async function batchSendEmails(
    emailList: Array<{
        recipientEmail: string;
        name: string;
        body: string;
        subject: string;
        status: string;
    }>
): Promise<Array<EmailResult | Error>> {
    console.log(`Starting batch email send for ${emailList.length} recipients`);

    // Send emails in parallel with error handling
    const results: Array<EmailResult | Error> = await Promise.allSettled(
        emailList.map(emailData =>
            sender(
                emailData.recipientEmail,
                emailData.name,
                emailData.body,
                emailData.subject,
                emailData.status
            )
        )
    ).then(results =>
        results.map(result =>
            result.status === 'fulfilled' ? result.value : result.reason
        )
    );

    const successful = results.filter(result => !(result instanceof Error)).length;
    const failed = results.filter(result => result instanceof Error).length;

    console.log(`Batch email send completed: ${successful} successful, ${failed} failed`);

    return results;
}

/**
 * Validate email template syntax
 */
export function validateEmailTemplate(): boolean {
    try {
        // const templatePath = path.join(__dirname, "template.html");
        const templatePath: string = path.join(__dirname, "./template.html");
        if (!fs.existsSync(templatePath)) {
            console.error("Template file not found");
            return false;
        }

        const template = fs.readFileSync(templatePath, "utf-8");

        // Try to compile the template
        ejs.compile(template, { filename: templatePath });

        console.log("Email template validation successful");
        return true;
    } catch (error) {
        console.error("Email template validation failed:", (error as Error).message);
        return false;
    }
}

// Export types for use in other modules
export type {
    EmailResult,
    EmailParams,
    TemplateVariables,
    SESEmailParams,
    SESResponse,
    LeaveStatus
};