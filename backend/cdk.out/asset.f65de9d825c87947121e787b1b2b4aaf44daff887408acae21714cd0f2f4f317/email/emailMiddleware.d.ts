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
    ConfigurationSetName?: string;
}
interface SESResponse {
    MessageId: string;
    ResponseMetadata?: {
        RequestId: string;
    };
}
type LeaveStatus = 'approved' | 'rejected' | 'pending' | 'cancelled';
/**
 * Send email using AWS SES with HTML template
 */
export declare function sender(recipientEmail: string, name: string, body: string, subject: string, status: string): Promise<EmailResult>;
/**
 * Generate a plain text version of the email as fallback
 */
export declare function generatePlainTextVersion(name: string, body: string, status: string): string;
/**
 * Test function to verify email configuration
 */
export declare function testEmailConfiguration(testEmail?: string): Promise<boolean>;
/**
 * Batch send emails to multiple recipients
 */
export declare function batchSendEmails(emailList: Array<{
    recipientEmail: string;
    name: string;
    body: string;
    subject: string;
    status: string;
}>): Promise<Array<EmailResult | Error>>;
/**
 * Validate email template syntax
 */
export declare function validateEmailTemplate(): boolean;
export type { EmailResult, EmailParams, TemplateVariables, SESEmailParams, SESResponse, LeaveStatus };
