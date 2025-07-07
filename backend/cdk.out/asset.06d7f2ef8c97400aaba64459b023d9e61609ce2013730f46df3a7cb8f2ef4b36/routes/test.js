"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// lambda/routes/test.ts
const hono_1 = require("hono");
const notificationHandler_1 = require("../email/notificationHandler"); // Import the utility function
// Define a new Hono app instance for test routes, or integrate into your main app
const testRoutes = new hono_1.Hono();
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
testRoutes.post('/send-email', async (c) => {
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
        const emailDetails = {
            recipientEmail,
            name,
            body: emailBody, // Renamed to avoid conflict with Hono's body
            subject,
            status
        };
        console.log("Received request to send test email. Details:", JSON.stringify(emailDetails, null, 2));
        // Call the utility function to send the email
        const result = await (0, notificationHandler_1.sendEmailNotification)(emailDetails);
        return c.json({
            success: true,
            message: 'Test email notification triggered successfully.',
            data: result
        }, 200);
    }
    catch (error) {
        console.error('Error sending test email:', error);
        return c.json({
            success: false,
            message: `Failed to send test email: ${error.message}`
        }, 500);
    }
});
// You would then typically export this `testRoutes` instance
// and register it with your main Hono app in `index.ts` or similar.
exports.default = testRoutes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSx3QkFBd0I7QUFDeEIsK0JBQTRCO0FBRTVCLHNFQUErRixDQUFDLDhCQUE4QjtBQUU5SCxrRkFBa0Y7QUFDbEYsTUFBTSxVQUFVLEdBQUcsSUFBSSxXQUFJLEVBQUUsQ0FBQztBQUU5Qjs7Ozs7Ozs7Ozs7Ozs7O0dBZUc7QUFDSCxVQUFVLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLEVBQUUsQ0FBVSxFQUFxQixFQUFFO0lBQ25FLElBQUksQ0FBQztRQUNELHNDQUFzQztRQUN0QyxNQUFNLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDaEMsTUFBTSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDO1FBRXhFLHdEQUF3RDtRQUN4RCxJQUFJLENBQUMsY0FBYyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsU0FBUyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDaEUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNWLE9BQU8sRUFBRSxLQUFLO2dCQUNkLE9BQU8sRUFBRSxzRkFBc0Y7YUFDbEcsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNaLENBQUM7UUFFRCx3REFBd0Q7UUFDeEQsTUFBTSxZQUFZLEdBQTZCO1lBQzNDLGNBQWM7WUFDZCxJQUFJO1lBQ0osSUFBSSxFQUFFLFNBQVMsRUFBRSw2Q0FBNkM7WUFDOUQsT0FBTztZQUNQLE1BQU07U0FDVCxDQUFDO1FBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQywrQ0FBK0MsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVwRyw4Q0FBOEM7UUFDOUMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLDJDQUFxQixFQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXpELE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNWLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLGlEQUFpRDtZQUMxRCxJQUFJLEVBQUUsTUFBTTtTQUNmLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFFWixDQUFDO0lBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztRQUNiLE9BQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ1YsT0FBTyxFQUFFLEtBQUs7WUFDZCxPQUFPLEVBQUUsOEJBQStCLEtBQWUsQ0FBQyxPQUFPLEVBQUU7U0FDcEUsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNaLENBQUM7QUFDTCxDQUFDLENBQUMsQ0FBQztBQUVILDZEQUE2RDtBQUM3RCxvRUFBb0U7QUFDcEUsa0JBQWUsVUFBVSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gbGFtYmRhL3JvdXRlcy90ZXN0LnRzXG5pbXBvcnQgeyBIb25vIH0gZnJvbSAnaG9ubyc7XG5pbXBvcnQgeyBDb250ZXh0IH0gZnJvbSAnaG9ubyc7XG5pbXBvcnQgeyBzZW5kRW1haWxOb3RpZmljYXRpb24sIEVtYWlsTm90aWZpY2F0aW9uRGV0YWlscyB9IGZyb20gJy4uL2VtYWlsL25vdGlmaWNhdGlvbkhhbmRsZXInOyAvLyBJbXBvcnQgdGhlIHV0aWxpdHkgZnVuY3Rpb25cblxuLy8gRGVmaW5lIGEgbmV3IEhvbm8gYXBwIGluc3RhbmNlIGZvciB0ZXN0IHJvdXRlcywgb3IgaW50ZWdyYXRlIGludG8geW91ciBtYWluIGFwcFxuY29uc3QgdGVzdFJvdXRlcyA9IG5ldyBIb25vKCk7XG5cbi8qKlxuICogVGVzdCByb3V0ZSB0byBtYW51YWxseSB0cmlnZ2VyIGFuIGVtYWlsIG5vdGlmaWNhdGlvbi5cbiAqIFRoaXMgcm91dGUgY2FuIGJlIHVzZWQgZm9yIGRldmVsb3BtZW50IGFuZCB0ZXN0aW5nIHB1cnBvc2VzXG4gKiB0byBlbnN1cmUgdGhlIGVtYWlsIHNlbmRpbmcgdXRpbGl0eSBpcyB3b3JraW5nIGNvcnJlY3RseS5cbiAqXG4gKiBFeGFtcGxlIHVzYWdlIChhc3N1bWluZyB5b3VyIEFQSSBnYXRld2F5IGlzIHNldCB1cCk6XG4gKiBQT1NUIC90ZXN0L3NlbmQtZW1haWxcbiAqIEJvZHk6XG4gKiB7XG4gKiBcInJlY2lwaWVudEVtYWlsXCI6IFwidGVzdC51c2VyQGV4YW1wbGUuY29tXCIsXG4gKiBcIm5hbWVcIjogXCJUZXN0IFVzZXJcIixcbiAqIFwiYm9keVwiOiBcIlRoaXMgaXMgYSB0ZXN0IGVtYWlsIHNlbnQgZnJvbSB0aGUgdGVzdCByb3V0ZS5cIixcbiAqIFwic3ViamVjdFwiOiBcIlRlc3QgRW1haWwgZnJvbSBBUEkgUm91dGVcIixcbiAqIFwic3RhdHVzXCI6IFwiYXBwcm92ZWRcIlxuICogfVxuICovXG50ZXN0Um91dGVzLnBvc3QoJy9zZW5kLWVtYWlsJywgYXN5bmMgKGM6IENvbnRleHQpOiBQcm9taXNlPFJlc3BvbnNlPiA9PiB7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gUGFyc2UgYW5kIHZhbGlkYXRlIHRoZSByZXF1ZXN0IGJvZHlcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IGMucmVxLmpzb24oKTtcbiAgICAgICAgY29uc3QgeyByZWNpcGllbnRFbWFpbCwgbmFtZSwgYm9keTogZW1haWxCb2R5LCBzdWJqZWN0LCBzdGF0dXMgfSA9IGJvZHk7XG5cbiAgICAgICAgLy8gQmFzaWMgdmFsaWRhdGlvbiBmb3IgcmVxdWlyZWQgZmllbGRzIGZyb20gdGhlIHJlcXVlc3RcbiAgICAgICAgaWYgKCFyZWNpcGllbnRFbWFpbCB8fCAhbmFtZSB8fCAhZW1haWxCb2R5IHx8ICFzdWJqZWN0IHx8ICFzdGF0dXMpIHtcbiAgICAgICAgICAgIHJldHVybiBjLmpzb24oe1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6ICdNaXNzaW5nIHJlcXVpcmVkIGZpZWxkcyBpbiByZXF1ZXN0IGJvZHk6IHJlY2lwaWVudEVtYWlsLCBuYW1lLCBib2R5LCBzdWJqZWN0LCBzdGF0dXMnXG4gICAgICAgICAgICB9LCA0MDApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29uc3RydWN0IHRoZSBkZXRhaWxzIG9iamVjdCBmb3IgdGhlIHV0aWxpdHkgZnVuY3Rpb25cbiAgICAgICAgY29uc3QgZW1haWxEZXRhaWxzOiBFbWFpbE5vdGlmaWNhdGlvbkRldGFpbHMgPSB7XG4gICAgICAgICAgICByZWNpcGllbnRFbWFpbCxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBib2R5OiBlbWFpbEJvZHksIC8vIFJlbmFtZWQgdG8gYXZvaWQgY29uZmxpY3Qgd2l0aCBIb25vJ3MgYm9keVxuICAgICAgICAgICAgc3ViamVjdCxcbiAgICAgICAgICAgIHN0YXR1c1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnNvbGUubG9nKFwiUmVjZWl2ZWQgcmVxdWVzdCB0byBzZW5kIHRlc3QgZW1haWwuIERldGFpbHM6XCIsIEpTT04uc3RyaW5naWZ5KGVtYWlsRGV0YWlscywgbnVsbCwgMikpO1xuXG4gICAgICAgIC8vIENhbGwgdGhlIHV0aWxpdHkgZnVuY3Rpb24gdG8gc2VuZCB0aGUgZW1haWxcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc2VuZEVtYWlsTm90aWZpY2F0aW9uKGVtYWlsRGV0YWlscyk7XG5cbiAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgICAgICAgbWVzc2FnZTogJ1Rlc3QgZW1haWwgbm90aWZpY2F0aW9uIHRyaWdnZXJlZCBzdWNjZXNzZnVsbHkuJyxcbiAgICAgICAgICAgIGRhdGE6IHJlc3VsdFxuICAgICAgICB9LCAyMDApO1xuXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyB0ZXN0IGVtYWlsOicsIGVycm9yKTtcbiAgICAgICAgcmV0dXJuIGMuanNvbih7XG4gICAgICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IGBGYWlsZWQgdG8gc2VuZCB0ZXN0IGVtYWlsOiAkeyhlcnJvciBhcyBFcnJvcikubWVzc2FnZX1gXG4gICAgICAgIH0sIDUwMCk7XG4gICAgfVxufSk7XG5cbi8vIFlvdSB3b3VsZCB0aGVuIHR5cGljYWxseSBleHBvcnQgdGhpcyBgdGVzdFJvdXRlc2AgaW5zdGFuY2Vcbi8vIGFuZCByZWdpc3RlciBpdCB3aXRoIHlvdXIgbWFpbiBIb25vIGFwcCBpbiBgaW5kZXgudHNgIG9yIHNpbWlsYXIuXG5leHBvcnQgZGVmYXVsdCB0ZXN0Um91dGVzO1xuIl19