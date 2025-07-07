// lambda/routes/test.ts
import { Hono } from 'hono';
import { Context } from 'hono';
import { sendEmailNotification, EmailNotificationDetails } from '../email/notificationHandler'; // Import the utility function
import { sender, senderManagement } from '../email/emailMiddleware';

// Define a new Hono app instance for test routes, or integrate into your main app
const testRoutes = new Hono();

/**
 * Test route to manually trigger an email notification.
 * This route can be used for development and testing purposes
 * to ensure the email sending utility is working correctly.
 *
 * Example usage (assuming your API gateway is set up):
 * POST /test/send-email
 * Body:
 * {
 * "recipientEmail": "test.user@example.com",
 * "name": "Test User",
 * "body": "This is a test email sent from the test route.",
 * "subject": "Test Email from API Route",
 * "status": "approved"
 * }
 */
testRoutes.post('/send-email', async (c: Context): Promise<Response> => {
    try {
        // Parse and validate the request body
        const body = await c.req.json();
        const { recipientEmail, name, body: emailBody, subject, status } = body;

        // Basic validation for required fields from the request
        if (!recipientEmail || !name || !emailBody || !subject || !status) {
            return c.json({
                success: false,
                message: 'Missing required fields in request body: recipientEmail, name, body, subject, status'
            }, 400);
        }

        // Construct the details object for the utility function
        const emailDetails: EmailNotificationDetails = {
            recipientEmail,
            name,
            body: emailBody, // Renamed to avoid conflict with Hono's body
            subject,
            status
        };

        console.log("Received request to send test email. Details:", JSON.stringify(emailDetails, null, 2));

        // Call the utility function to send the email
        const result = await sender(
            recipientEmail,
            name,
            emailBody, // Renamed to avoid conflict with Hono's body
            subject,
            status
        );

        return c.json({
            success: true,
            message: 'Test email notification triggered successfully.',
            data: result
        }, 200);

    } catch (error) {
        console.error('Error sending test email:', error);
        return c.json({
            success: false,
            message: `Failed to send test email: ${(error as Error).message}`
        }, 500);
    }
});

// Test route for user/employee email notifications
testRoutes.post('/send-user-email', async (c: Context): Promise<Response> => {
    try {
        // Parse and validate the request body
        const body = await c.req.json();
        const { recipientEmail, name, body: emailBody, subject, status } = body;

        // Basic validation for required fields from the request
        if (!recipientEmail || !name || !emailBody || !subject || !status) {
            return c.json({
                success: false,
                message: 'Missing required fields in request body: recipientEmail, name, body, subject, status'
            }, 400);
        }

        // Validate status value
        const validStatuses = ['approved', 'rejected', 'pending', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return c.json({
                success: false,
                message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
            }, 400);
        }

        console.log("Received request to send test user email. Details:", JSON.stringify({
            recipientEmail,
            name,
            body: emailBody,
            subject,
            status
        }, null, 2));

        // Call the sender function for user notifications
        const result = await sender(
            recipientEmail,
            name,
            emailBody,
            subject,
            status
        );

        return c.json({
            success: true,
            message: 'Test user email notification sent successfully.',
            data: {
                messageId: result.messageId,
                recipient: result.recipient,
                status: result.success ? 'sent' : 'failed'
            }
        }, 200);

    } catch (error) {
        console.error('Error sending test user email:', error);
        return c.json({
            success: false,
            message: `Failed to send test user email: ${(error as Error).message}`
        }, 500);
    }
});

// Test route for management email notifications
testRoutes.post('/send-management-email', async (c: Context): Promise<Response> => {
    try {
        // Parse and validate the request body
        const body = await c.req.json();
        const {
            employeeName,
            employeeEmail,
            body: emailBody,
            subject,
            status,
            leaveType,
            startDate,
            endDate,
            duration
        } = body;

        // Basic validation for required fields
        if (!employeeName || !employeeEmail || !emailBody || !subject || !status) {
            return c.json({
                success: false,
                message: 'Missing required fields in request body: employeeName, employeeEmail, body, subject, status'
            }, 400);
        }

        // Validate status value
        const validStatuses = ['approved', 'rejected', 'pending', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return c.json({
                success: false,
                message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
            }, 400);
        }

        // Validate employee email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(employeeEmail)) {
            return c.json({
                success: false,
                message: `Invalid employee email format: ${employeeEmail}`
            }, 400);
        }

        console.log("Received request to send test management email. Details:", JSON.stringify({
            employeeName,
            employeeEmail,
            body: emailBody,
            subject,
            status,
            leaveType,
            startDate,
            endDate,
            duration
        }, null, 2));

        // Call the senderManagement function for management notifications
        const result = await senderManagement(
            employeeName,
            employeeEmail,
            emailBody,
            subject,
            status,
            leaveType,
            startDate,
            endDate,
            duration
        );

        return c.json({
            success: true,
            message: 'Test management email notification sent successfully.',
            data: {
                messageId: result.messageId,
                recipient: result.recipient,
                status: result.success ? 'sent' : 'failed'
            }
        }, 200);

    } catch (error) {
        console.error('Error sending test management email:', error);
        return c.json({
            success: false,
            message: `Failed to send test management email: ${(error as Error).message}`
        }, 500);
    }
});

// Combined test route that sends both user and management notifications
testRoutes.post('/send-test-leave-notification', async (c: Context): Promise<Response> => {
    try {
        // Parse and validate the request body
        const body = await c.req.json();
        const {
            employeeName,
            employeeEmail,
            leaveType = "Annual Leave",
            status = "pending",
            startDate,
            endDate,
            duration,
            customMessage
        } = body;

        // Basic validation for required fields
        if (!employeeName || !employeeEmail) {
            return c.json({
                success: false,
                message: 'Missing required fields: employeeName, employeeEmail'
            }, 400);
        }

        const validStatuses = ['approved', 'rejected', 'pending', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return c.json({
                success: false,
                message: `Invalid status value: ${status}. Must be one of: ${validStatuses.join(', ')}`
            }, 400);
        }

        console.log("Received request to send complete leave notification test. Details:", JSON.stringify({
            employeeName,
            employeeEmail,
            leaveType,
            status,
            startDate,
            endDate,
            duration,
            customMessage
        }, null, 2));

        // Generate appropriate messages based on status
        const getStatusMessage = (status: string) => {
            switch (status.toLowerCase()) {
                case 'approved':
                    return 'Your leave request has been approved! You can now proceed with your planned time off.';
                case 'rejected':
                    return 'Unfortunately, your leave request has been declined. Please contact your manager for more information.';
                case 'pending':
                    return 'Your leave request has been submitted and is currently being reviewed. You will be notified once a decision has been made.';
                case 'cancelled':
                    return 'Your leave request has been cancelled as requested.';
                default:
                    return 'Your leave request status has been updated.';
            }
        };

        const userMessage = customMessage || getStatusMessage(status);
        const managementMessage = customMessage || `${employeeName} has a ${leaveType} request that is currently ${status}.`;

        const results = {
            userEmail: null as any,
            managementEmail: null as any,
            errors: [] as string[]
        };

        // Send user notification
        try {
            results.userEmail = await sender(
                employeeEmail,
                employeeName.split(' ')[0] || employeeName, // Use first name
                userMessage,
                `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)} - ${leaveType}`,
                status
            );
            console.log("User notification sent successfully");
        } catch (userEmailError) {
            console.error("Failed to send user notification:", userEmailError);
            results.errors.push(`User email failed: ${(userEmailError as Error).message}`);
        }

        // Send management notification
        try {
            results.managementEmail = await senderManagement(
                employeeName,
                employeeEmail,
                managementMessage,
                `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)} - ${leaveType}`,
                status,
                leaveType,
                startDate,
                endDate,
                duration
            );
            console.log("Management notification sent successfully");
        } catch (managementEmailError) {
            console.error("Failed to send management notification:", managementEmailError);
            results.errors.push(`Management email failed: ${(managementEmailError as Error).message}`);
        }

        const successCount = (results.userEmail ? 1 : 0) + (results.managementEmail ? 1 : 0);
        const totalCount = 2;

        return c.json({
            success: successCount > 0,
            message: `Test leave notification completed. ${successCount}/${totalCount} emails sent successfully.`,
            data: {
                userEmail: results.userEmail ? {
                    messageId: results.userEmail.messageId,
                    recipient: results.userEmail.recipient,
                    status: 'sent'
                } : null,
                managementEmail: results.managementEmail ? {
                    messageId: results.managementEmail.messageId,
                    recipient: results.managementEmail.recipient,
                    status: 'sent'
                } : null,
                errors: results.errors
            }
        }, successCount > 0 ? 200 : 500);

    } catch (error) {
        console.error('Error sending test leave notifications:', error);
        return c.json({
            success: false,
            message: `Failed to send test leave notifications: ${(error as Error).message}`
        }, 500);
    }
});

// Quick test route with predefined data
testRoutes.post('/quick-email-test', async (c: Context): Promise<Response> => {
    try {
        const { type = "user" } = await c.req.json().catch(() => ({}));

        if (type === "user") {
            const result = await sender(
                "test@example.com",
                "Test User",
                "This is a quick test of the user email notification system. Your leave request has been processed.",
                "Test Leave Notification",
                "approved"
            );

            return c.json({
                success: true,
                message: 'Quick user email test sent successfully.',
                data: result
            }, 200);

        } else if (type === "management") {
            const result = await senderManagement(
                "John Doe",
                "john.doe@company.com",
                "This is a quick test of the management email notification system. An employee has submitted a leave request requiring your attention.",
                "Test Management Leave Notification",
                "pending",
                "Annual Leave",
                "2024-12-15",
                "2024-12-22",
                "5 working days"
            );

            return c.json({
                success: true,
                message: 'Quick management email test sent successfully.',
                data: result
            }, 200);

        } else {
            return c.json({
                success: false,
                message: 'Invalid type. Use "user" or "management"'
            }, 400);
        }

    } catch (error) {
        console.error('Error sending quick email test:', error);
        return c.json({
            success: false,
            message: `Failed to send quick email test: ${(error as Error).message}`
        }, 500);
    }
});

// You would then typically export this `testRoutes` instance
// and register it with your main Hono app in `index.ts` or similar.
export default testRoutes;
