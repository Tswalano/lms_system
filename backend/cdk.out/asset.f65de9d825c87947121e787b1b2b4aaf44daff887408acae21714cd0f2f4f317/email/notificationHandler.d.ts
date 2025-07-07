import { EmailResult } from './emailMiddleware';
interface EmailNotificationDetails {
    recipientEmail: string;
    name: string;
    body: string;
    subject: string;
    status: string;
}
/**
 * Utility function for sending email notifications.
 * This function can be directly imported and called by other modules
 * in your application to send emails.
 */
export declare const sendEmailNotification: (details: EmailNotificationDetails) => Promise<EmailResult>;
export type { EmailNotificationDetails };
