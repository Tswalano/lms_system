import { SESClient, SendEmailCommand, SendEmailCommandInput, SESServiceException } from "@aws-sdk/client-ses";
import {
    emailTemplate,
    managementEmailTemplate,
    documentReminderTemplate,
    documentAssignedTemplate,
    reviewCycleReminderTemplate,
    documentExpiringTemplate,
    EmailTemplateData,
    ManagementTemplateData,
    DocumentReminderData,
    ReviewCycleReminderData,
    DocumentExpiringData
} from "./templateHtml";
import { LeaveStatus } from "../helpers/leaveHelpers";

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
    status: LeaveStatus;
}

interface TemplateVariables {
    subject: string;
    name: string;
    body: string;
    status: LeaveStatus;
    currentYear: number;
}

interface ManagementEmailParams {
    employeeName: string;
    employeeEmail: string;
    body: string;
    subject: string;
    status: LeaveStatus;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
}

interface ManagementTemplateVariables {
    subject: string;
    employeeName: string;
    employeeEmail: string;
    body: string;
    status: LeaveStatus;
    currentYear: number;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    duration?: string;
}

interface EnvironmentEmailConfig {
    managementEmail: string;
    managementCcEmails: string[];
    environment: string;
}

// Adjusted SESEmailParams to align more closely with SendEmailCommandInput
interface SESEmailParams {
    Destination: {
        ToAddresses: string[];
        CcAddresses?: string[];
        BccAddresses?: string[];
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

// Constants
const CHARSET = "UTF-8";
const SES_REGION = "us-east-1"; // Consider making this configurable via environment variables
const SENDER_EMAIL = "LMS Notifications <noreply@disraptor-internal.net>"; // Consider making this configurable
const REPLY_TO_EMAIL = "noreply@disraptor-internal.net"; // Consider making this configurable

// Environment-based email configuration
function getEmailConfiguration(): EnvironmentEmailConfig {
    const environment = process.env.ENVIRONMENT || process.env.NODE_ENV || 'prod';

    console.log(`Getting email configuration for environment: ${environment}`);

    if (environment === 'prod' || environment === 'production') {
        // Production configuration
        return {
            managementEmail: "preneshni.moodley@disraptor.co.za",
            managementCcEmails: [
                "malloron.nair@disraptor.co.za",
                "hemansu.keeka@disraptor.co.za"
            ],
            environment: 'prod'
        };
    } else {
        return {
            managementEmail: "glen.mogane@disraptor.co.za",
            managementCcEmails: [
                "hanness@disraptor.co.za",
                "xolani@disraptor.co.za"
            ],
            environment: 'dev'
        };
    }
}

function createSESClient(): SESClient {
    return new SESClient({
        region: SES_REGION,
        maxAttempts: 3
    });
}

/**
 * Send email notification to management recipients
 */
export async function senderManagement(
    employeeName: string,
    employeeEmail: string,
    body: string,
    subject: string,
    status: LeaveStatus,
    leaveType?: string,
    startDate?: string,
    endDate?: string,
    duration?: string
): Promise<EmailResult> {
    console.log("=== Management Email Sending Process Started ===");

    const emailConfig = getEmailConfiguration();

    console.log("Environment:", emailConfig.environment);
    console.log("Employee:", employeeName);
    console.log("Employee Email:", employeeEmail);
    console.log("Subject:", subject);
    console.log("Status:", status);
    console.log("Primary Recipient:", emailConfig.managementEmail);
    console.log("CC Recipients:", emailConfig.managementCcEmails);

    try {
        // Validate management email parameters
        validateManagementEmailParams({
            employeeName,
            employeeEmail,
            body,
            subject,
            status,
            leaveType,
            startDate,
            endDate,
            duration
        });

        const html: string = await renderManagementEmailTemplate({
            subject,
            employeeName,
            employeeEmail,
            body,
            status,
            currentYear: new Date().getFullYear(),
            leaveType,
            startDate,
            endDate,
            duration
        });

        const params: SESEmailParams = buildManagementSESParams(
            subject,
            html,
            employeeName,
            employeeEmail,
            body,
            status,
            emailConfig
        );

        const sesClient = createSESClient();
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const data = await sesClient.send(command);

        console.log("Management email sent successfully!");
        console.log("MessageId:", data.MessageId);

        return {
            success: true,
            messageId: data.MessageId ?? "unknown",
            recipient: `${emailConfig.managementEmail} (CC: ${emailConfig.managementCcEmails.join(', ')})`
        };

    } catch (err) {
        console.error("Error sending management email:");
        handleEmailError(err);
        throw err;
    }
}

/**
 * Send email using AWS SES with HTML template
 */
export async function sender(
    recipientEmail: string,
    name: string,
    body: string,
    subject: string,
    status: LeaveStatus
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
 * Validate input parameters for management email sending
 */
function validateManagementEmailParams(params: ManagementEmailParams): void {
    const { employeeName, employeeEmail, body, subject, status } = params;

    if (!employeeName || !employeeEmail || !body || !subject || !status) {
        throw new Error("Missing required parameters for management email sending");
    }

    // Validate employee email format
    const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeEmail)) {
        throw new Error(`Invalid employee email format: ${employeeEmail}`);
    }

    // Validate employee name (should not be empty after trimming)
    if (!employeeName.trim()) {
        throw new Error("Employee name cannot be empty");
    }

    // Validate subject and body length
    if (subject.length > 998) { // SES limit
        throw new Error("Subject line too long (max 998 characters)");
    }

    if (body.length > 40000) { // Conservative limit for email body
        console.warn("Email body is quite long, consider shortening it");
    }

    // Validate status
    const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending', 'cancelled'];
    if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
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
 * Render the management email template with provided variables
 */
async function renderManagementEmailTemplate(variables: ManagementTemplateVariables): Promise<string> {
    console.log("Rendering management email template with variables:", variables);

    try {
        // Validate required variables
        if (!variables.subject || !variables.employeeName || !variables.employeeEmail || !variables.status || !variables.body) {
            throw new Error("Missing required management template variables. Required: subject, employeeName, employeeEmail, status, body");
        }

        // Validate status value
        const validStatuses: LeaveStatus[] = ['approved', 'rejected', 'pending', 'cancelled'];
        if (!validStatuses.includes(variables.status)) {
            throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        console.log("Management template variables validated successfully");

        // Create ManagementTemplateData object for the new template
        const templateData: ManagementTemplateData = {
            subject: variables.subject,
            employeeName: variables.employeeName,
            employeeEmail: variables.employeeEmail,
            status: variables.status,
            body: variables.body,
            leaveType: variables.leaveType,
            startDate: variables.startDate,
            endDate: variables.endDate,
            duration: variables.duration
        };

        console.log("Generating management HTML from template...");

        // Render the HTML using our dedicated management template
        const html: string = managementEmailTemplate(templateData);

        console.log("Management template rendered successfully, HTML size:", html.length, "characters");

        return html;
    } catch (error) {
        console.error("Error rendering management email template:", error);
        throw new Error(`Failed to render management email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Render the email template with provided variables
 */
async function renderEmailTemplate(variables: TemplateVariables): Promise<string> {
    console.log("Rendering email template with variables:", variables);

    try {
        // Validate required variables
        if (!variables.subject || !variables.name || !variables.status || !variables.body) {
            throw new Error("Missing required template variables. Required: subject, name, status, body");
        }

        // Validate status value
        const validStatuses = ['approved', 'rejected', 'pending'];
        if (!validStatuses.includes(variables.status)) {
            throw new Error(`Invalid status value: ${variables.status}. Must be one of: ${validStatuses.join(', ')}`);
        }

        console.log("Template variables validated successfully");

        // Create EmailTemplateData object
        const templateData: EmailTemplateData = {
            subject: variables.subject,
            name: variables.name,
            status: variables.status,
            body: variables.body
        };

        console.log("Generating HTML from template...");

        // Render the HTML using our string template
        const html: string = emailTemplate(templateData);

        console.log("Template rendered successfully, HTML size:", html.length, "characters");

        return html;
    } catch (error) {
        console.error("Error rendering email template:", error);
        throw new Error(`Failed to render email template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Build SES parameters for sending management email
 * @see https://docs.aws.amazon.com/ses/latest/DeveloperGuide/send-personalized-email-api.html
 */
function buildManagementSESParams(
    subject: string,
    html: string,
    employeeName: string,
    employeeEmail: string,
    body: string,
    status: string,
    emailConfig: EnvironmentEmailConfig
): SESEmailParams {
    return {
        Destination: {
            ToAddresses: [emailConfig.managementEmail],
            CcAddresses: emailConfig.managementCcEmails
        },
        Message: {
            Body: {
                Html: {
                    Charset: CHARSET,
                    Data: html,
                },
                Text: {
                    Charset: CHARSET,
                    Data: generateManagementPlainTextVersion(employeeName, employeeEmail, body, status)
                }
            },
            Subject: {
                Charset: CHARSET,
                Data: `[MANAGEMENT${emailConfig.environment === 'dev' ? ' - DEV' : ''}] ${subject}`,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            {
                Name: "EmailType",
                Value: "ManagementLeaveNotification"
            },
            {
                Name: "Status",
                Value: status
            },
            {
                Name: "Employee",
                Value: employeeName.replace(/[^a-zA-Z0-9._@-]/g, '_')
            },
            {
                Name: "Environment",
                Value: emailConfig.environment
            }
        ]
    };
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
    const emailConfig = getEmailConfiguration();

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
                Data: emailConfig.environment === 'dev' ? `[DEV] ${subject}` : subject,
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
            },
            {
                Name: "Environment",
                Value: emailConfig.environment
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
 * Generate a plain text version of the management email as fallback
 */
export function generateManagementPlainTextVersion(
    employeeName: string,
    employeeEmail: string,
    body: string,
    status: string
): string {
    const emailConfig = getEmailConfiguration();

    return `
        LEAVE MANAGEMENT NOTIFICATION${emailConfig.environment === 'dev' ? ' (DEVELOPMENT)' : ''}

        Employee: ${employeeName}
        Email: ${employeeEmail}
        Status: ${status.toUpperCase()}

        Details:
        ${body}

        ${getStatusMessage(status)}

        Please review this leave request in the Disruptor Leave Management System.

        ---
        This is an automated notification from the Disruptor Leave Management System.
        Environment: ${emailConfig.environment.toUpperCase()}
        © ${new Date().getFullYear()} Disruptor. All rights reserved.
        `.trim();
}

/**
 * Generate a plain text version of the email as fallback
 */
export function generatePlainTextVersion(name: string, body: string, status: string): string {
    const emailConfig = getEmailConfiguration();

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
Environment: ${emailConfig.environment.toUpperCase()}
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
 * Test function to verify management email configuration
 */
export async function testManagementEmailConfiguration(): Promise<boolean> {
    console.log("Testing management email configuration...");

    try {
        await senderManagement(
            "Test Employee",
            "test.employee@company.com",
            "This is a test management notification to verify the email configuration.",
            "Management Email Configuration Test",
            "pending",
            "Annual Leave",
            "2024-12-15",
            "2024-12-22",
            "5 working days"
        );

        console.log("Management email configuration test successful!");
        return true;
    } catch (error) {
        console.error("Management email configuration test failed:", (error as Error).message);
        return false;
    }
}

/**
 * Get current email configuration (useful for debugging)
 */
export function getCurrentEmailConfiguration(): EnvironmentEmailConfig {
    return getEmailConfiguration();
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
        status: LeaveStatus;
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
 * Validate email template (now validates the string template function)
 */
export function validateEmailTemplate(): boolean {
    try {
        console.log("Validating email template...");

        // Test the employee template with sample data
        const testData: EmailTemplateData = {
            subject: "Test Subject",
            name: "Test User",
            status: "approved",
            body: "This is a test message."
        };

        const html = emailTemplate(testData);

        // Basic validation checks
        if (!html || html.length === 0) {
            throw new Error("Template generated empty HTML");
        }

        if (!html.includes("<!DOCTYPE html>")) {
            throw new Error("Template does not generate valid HTML structure");
        }

        if (!html.includes(testData.name)) {
            throw new Error("Template does not properly substitute name variable");
        }

        if (!html.includes(testData.subject)) {
            throw new Error("Template does not properly substitute subject variable");
        }

        if (!html.includes(testData.body)) {
            throw new Error("Template does not properly substitute body variable");
        }

        // Test the management template
        const managementTestData: ManagementTemplateData = {
            subject: "Test Management Subject",
            employeeName: "Test Employee",
            employeeEmail: "test@company.com",
            status: "pending",
            body: "This is a test management message."
        };

        const managementHtml = managementEmailTemplate(managementTestData);

        if (!managementHtml || managementHtml.length === 0) {
            throw new Error("Management template generated empty HTML");
        }

        if (!managementHtml.includes(managementTestData.employeeName)) {
            throw new Error("Management template does not properly substitute employee name");
        }

        console.log("Email template validation successful");
        return true;
    } catch (error) {
        console.error("Email template validation failed:", (error as Error).message);
        return false;
    }
}

/**
 * Send document signing reminder email via AWS SES
 */
export async function senderDocumentReminder(
    recipientEmail: string,
    data: DocumentReminderData
): Promise<EmailResult> {
    console.log("=== Document Reminder Email Sending Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Employee:", data.employeeName);
    console.log("Documents:", data.documents.length);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }
    if (!data.employeeName?.trim()) {
        throw new Error("Employee name is required");
    }
    if (!data.documents?.length) {
        throw new Error("At least one document is required");
    }

    const emailConfig = getEmailConfiguration();
    const subject = `Action Required: You have ${data.documents.length} pending document${data.documents.length > 1 ? 's' : ''} to sign`;
    const html = documentReminderTemplate(data);

    const plainText = [
        `Hi ${data.employeeName},`,
        "",
        "This is a reminder that you have pending documents requiring your signature:",
        "",
        ...data.documents.map(doc =>
            `- ${doc.name}${doc.isMandatory ? " [MANDATORY]" : ""}${doc.dueDate ? ` | Due: ${doc.dueDate}` : ` | Assigned: ${doc.assignedDate}`}`
        ),
        "",
        `Please log in to the portal to sign: ${data.portalUrl}`,
        "",
        "---",
        "This is an automated message from the Employee Management System.",
    ].join("\n");

    const params: SESEmailParams = {
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
            Body: {
                Html: { Charset: CHARSET, Data: html },
                Text: { Charset: CHARSET, Data: plainText },
            },
            Subject: {
                Charset: CHARSET,
                Data: emailConfig.environment === 'dev' ? `[DEV] ${subject}` : subject,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            { Name: "EmailType", Value: "DocumentSigningReminder" },
            { Name: "Environment", Value: emailConfig.environment },
        ],
    };

    try {
        const sesClient = createSESClient();
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const data2 = await sesClient.send(command);

        console.log("Document reminder sent. MessageId:", data2.MessageId);
        return { success: true, messageId: data2.MessageId ?? "unknown", recipient: recipientEmail };
    } catch (err) {
        console.error("Error sending document reminder email:");
        handleEmailError(err);
        throw err;
    }
}

/**
 * Send new-document-assignment notification email via AWS SES
 */
export async function senderDocumentAssigned(
    recipientEmail: string,
    data: DocumentReminderData
): Promise<EmailResult> {
    console.log("=== Document Assigned Email Sending Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Employee:", data.employeeName);
    console.log("Documents:", data.documents.length);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }
    if (!data.employeeName?.trim()) {
        throw new Error("Employee name is required");
    }
    if (!data.documents?.length) {
        throw new Error("At least one document is required");
    }

    const emailConfig = getEmailConfiguration();
    const subject = `New document${data.documents.length > 1 ? 's' : ''} assigned to you (${data.documents.length})`;
    const html = documentAssignedTemplate(data);

    const plainText = [
        `Hi ${data.employeeName},`,
        "",
        "The following documents have been assigned to you for review and signature:",
        "",
        ...data.documents.map(doc =>
            `- ${doc.name}${doc.isMandatory ? " [MANDATORY]" : ""}${doc.dueDate ? ` | Due: ${doc.dueDate}` : ` | Assigned: ${doc.assignedDate}`}`
        ),
        "",
        `Please log in to the portal to review and sign: ${data.portalUrl}`,
        "",
        "---",
        "This is an automated message from the Employee Management System.",
    ].join("\n");

    const params: SESEmailParams = {
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
            Body: {
                Html: { Charset: CHARSET, Data: html },
                Text: { Charset: CHARSET, Data: plainText },
            },
            Subject: {
                Charset: CHARSET,
                Data: emailConfig.environment === 'dev' ? `[DEV] ${subject}` : subject,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            { Name: "EmailType", Value: "DocumentAssigned" },
            { Name: "Environment", Value: emailConfig.environment },
        ],
    };

    try {
        const sesClient = createSESClient();
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const result = await sesClient.send(command);

        console.log("Document assigned email sent. MessageId:", result.MessageId);
        return { success: true, messageId: result.MessageId ?? "unknown", recipient: recipientEmail };
    } catch (err) {
        console.error("Error sending document assigned email:");
        handleEmailError(err);
        throw err;
    }
}

/**
 * Send performance review cycle deadline reminder email via AWS SES
 */
export async function senderReviewCycleReminder(
    recipientEmail: string,
    data: ReviewCycleReminderData
): Promise<EmailResult> {
    console.log("=== Review Cycle Reminder Email Sending Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Cycle:", data.cycleName);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }
    if (!data.pendingItems?.length) {
        throw new Error("At least one pending item is required");
    }

    const emailConfig = getEmailConfiguration();
    const subject = `Reminder: "${data.cycleName}" review cycle closes on ${data.endDate}`;
    const html = reviewCycleReminderTemplate(data);

    const plainText = [
        `Hi ${data.employeeName},`,
        "",
        `The "${data.cycleName}" performance review cycle closes on ${data.endDate}.`,
        "You still have the following items to complete:",
        "",
        ...data.pendingItems.map((item) => `- ${item}`),
        "",
        `Please log in to complete them: ${data.portalUrl}`,
        "",
        "---",
        "This is an automated message from the Employee Management System.",
    ].join("\n");

    const params: SESEmailParams = {
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
            Body: {
                Html: { Charset: CHARSET, Data: html },
                Text: { Charset: CHARSET, Data: plainText },
            },
            Subject: {
                Charset: CHARSET,
                Data: emailConfig.environment === 'dev' ? `[DEV] ${subject}` : subject,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            { Name: "EmailType", Value: "ReviewCycleReminder" },
            { Name: "Environment", Value: emailConfig.environment },
        ],
    };

    try {
        const sesClient = createSESClient();
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const result = await sesClient.send(command);

        console.log("Review cycle reminder sent. MessageId:", result.MessageId);
        return { success: true, messageId: result.MessageId ?? "unknown", recipient: recipientEmail };
    } catch (err) {
        console.error("Error sending review cycle reminder email:");
        handleEmailError(err);
        throw err;
    }
}

/**
 * Send document expiry/renewal reminder email via AWS SES
 */
export async function senderDocumentExpiring(
    recipientEmail: string,
    data: DocumentExpiringData
): Promise<EmailResult> {
    console.log("=== Document Expiring Email Sending Started ===");
    console.log("Recipient:", recipientEmail);
    console.log("Document:", data.documentName);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail)) {
        throw new Error(`Invalid recipient email: ${recipientEmail}`);
    }
    if (!data.documentName?.trim()) {
        throw new Error("Document name is required");
    }

    const emailConfig = getEmailConfiguration();
    const subject = `Action required: "${data.documentName}" expires on ${data.expiryDate}`;
    const html = documentExpiringTemplate(data);

    const plainText = [
        `Hi ${data.employeeName},`,
        "",
        `The document "${data.documentName}" expires on ${data.expiryDate}.`,
        "Please review and re-sign it before then to stay compliant.",
        "",
        `Please log in to the portal: ${data.portalUrl}`,
        "",
        "---",
        "This is an automated message from the Employee Management System.",
    ].join("\n");

    const params: SESEmailParams = {
        Destination: { ToAddresses: [recipientEmail] },
        Message: {
            Body: {
                Html: { Charset: CHARSET, Data: html },
                Text: { Charset: CHARSET, Data: plainText },
            },
            Subject: {
                Charset: CHARSET,
                Data: emailConfig.environment === 'dev' ? `[DEV] ${subject}` : subject,
            },
        },
        Source: SENDER_EMAIL,
        ReplyToAddresses: [REPLY_TO_EMAIL],
        Tags: [
            { Name: "EmailType", Value: "DocumentExpiring" },
            { Name: "Environment", Value: emailConfig.environment },
        ],
    };

    try {
        const sesClient = createSESClient();
        const command = new SendEmailCommand(params as SendEmailCommandInput);
        const result = await sesClient.send(command);

        console.log("Document expiring email sent. MessageId:", result.MessageId);
        return { success: true, messageId: result.MessageId ?? "unknown", recipient: recipientEmail };
    } catch (err) {
        console.error("Error sending document expiring email:");
        handleEmailError(err);
        throw err;
    }
}

// Export types for use in other modules
export type {
    EmailResult,
    EmailParams,
    TemplateVariables,
    ManagementEmailParams,
    ManagementTemplateVariables,
    SESEmailParams,
    SESResponse,
    LeaveStatus,
    EnvironmentEmailConfig
};