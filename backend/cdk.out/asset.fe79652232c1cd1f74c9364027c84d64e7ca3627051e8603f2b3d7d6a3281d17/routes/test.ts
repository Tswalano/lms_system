// lambda/routes/test.ts
import { Hono } from 'hono';
import { Context } from 'hono';
import { sendEmailNotification, EmailNotificationDetails } from '../email/notificationHandler'; // Import the utility function

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
        const result = await sendEmailNotification(emailDetails);

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

// You would then typically export this `testRoutes` instance
// and register it with your main Hono app in `index.ts` or similar.
export default testRoutes;
