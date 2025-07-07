import { sender, EmailResult, LeaveStatus } from './emailMiddleware';

// Define the expected structure of the email details
interface EmailNotificationDetails {
    recipientEmail: string;
    name: string;
    body: string;    // The specific message for this notification
    subject: string;
    status: LeaveStatus;  // The leave status (e.g., 'approved', 'rejected', 'created', 'pending', 'cancelled')
}

/**
 * Utility function for sending email notifications.
 * This function can be directly imported and called by other modules
 * in your application to send emails.
 */
export const sendEmailNotification = async (details: EmailNotificationDetails): Promise<EmailResult> => {
    console.log("Attempting to send email notification with details:", JSON.stringify(details, null, 2));

    const { recipientEmail, name, body, subject, status } = details;

    // Validate incoming details
    if (!recipientEmail || !name || !body || !subject || !status) {
        console.error("Missing required fields for email notification:", details);
        throw new Error("Invalid email notification details: Missing required fields.");
    }

    try {
        // Call the existing sender function from emailMiddleware
        const result: EmailResult = await sender(
            recipientEmail,
            name,
            body,
            subject,
            status
        );

        console.log("Email notification sent successfully:", result);
        return result; // Return the result from the sender function

    } catch (error) {
        console.error("Error sending email notification:", error);
        // Re-throw the error for the caller to handle
        throw error;
    }
};

// Export types for clarity if needed elsewhere
export type { EmailNotificationDetails };
