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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.app = void 0;
const hono_1 = require("hono");
const aws_lambda_1 = require("hono/aws-lambda");
const cors_1 = require("hono/cors");
const http_exception_1 = require("hono/http-exception");
const auth_1 = require("./routes/auth");
const user_1 = require("./routes/user");
const leave_1 = require("./routes/leave");
const auth_2 = require("./middleware/auth");
const test_1 = __importDefault(require("./routes/test"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
exports.app = new hono_1.Hono();
exports.app.use('/*', (0, cors_1.cors)({
    origin: [
        'http://localhost:5173',
        'https://7es7o4tcqc.execute-api.af-south-1.amazonaws.com',
        'https://main.d10e0bk85semh2.amplifyapp.com',
        'https://glenify.studio'
    ],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision', 'Set-Cookie'],
    credentials: true,
    maxAge: 600
}));
exports.app.route('/auth', auth_1.auth);
// Protected routes - require authentication
exports.app.use('/users/*', (0, auth_2.authMiddleware)());
exports.app.use('/leave/*', (0, auth_2.authMiddleware)());
// Apply routes
exports.app.route('/users', user_1.users);
exports.app.route('/leave', leave_1.leave);
// test
exports.app.route('/test', test_1.default);
// Basic error handling
exports.app.onError((err, c) => {
    console.error('Error:', err);
    if (err instanceof http_exception_1.HTTPException) {
        return err.getResponse();
    }
    return c.json({ error: 'Internal server error' }, 500);
});
// Health check endpoint
exports.app.get('/health', (c) => c.json({
    status: 'healthy',
    service: 'Leave Management System API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
}));
// Simple ping endpoint
exports.app.get('/ping', (c) => c.json({
    status: 'ok',
    message: 'Leave Management System API is running',
    timestamp: new Date().toISOString()
}));
// 404 handler
exports.app.notFound((c) => {
    return c.json({
        error: true,
        message: 'Endpoint not found',
        path: c.req.path,
        method: c.req.method,
        service: 'Leave Management System API',
        timestamp: new Date().toISOString()
    }, 404);
});
// Read the HTML file content when the Lambda function is initialized
// This makes the content available to your handler without re-reading it on every invocation.
const htmlTemplatePath = path.join(__dirname, 'template.html');
let htmlContent;
try {
    htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8');
    console.log('template.html loaded successfully for Lambda bundling.');
}
catch (error) {
    console.error('Failed to load template.html during Lambda initialization:', error);
    // Provide a fallback or re-throw if the file is critical
    htmlContent = '<h1>Error: HTML template not found!</h1>';
}
// Export the handler for AWS Lambda
exports.handler = (0, aws_lambda_1.handle)(exports.app);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLCtCQUE0QjtBQUM1QixnREFBeUM7QUFDekMsb0NBQWlDO0FBQ2pDLHdEQUFvRDtBQUNwRCx3Q0FBcUM7QUFDckMsd0NBQXNDO0FBQ3RDLDBDQUF1QztBQUN2Qyw0Q0FBbUQ7QUFDbkQseURBQXVDO0FBRXZDLHVDQUF5QjtBQUN6QiwyQ0FBNkI7QUFFaEIsUUFBQSxHQUFHLEdBQUcsSUFBSSxXQUFJLEVBQUUsQ0FBQztBQUU5QixXQUFHLENBQUMsR0FBRyxDQUNILElBQUksRUFDSixJQUFBLFdBQUksRUFBQztJQUNELE1BQU0sRUFBRTtRQUNKLHVCQUF1QjtRQUN2Qix5REFBeUQ7UUFDekQsNENBQTRDO1FBQzVDLHdCQUF3QjtLQUMzQjtJQUNELFlBQVksRUFBRSxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUM7SUFDekQsWUFBWSxFQUFFLENBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxRQUFRLEVBQUUsUUFBUSxDQUFDO0lBQ3ZGLGFBQWEsRUFBRSxDQUFDLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFlBQVksQ0FBQztJQUNsRSxXQUFXLEVBQUUsSUFBSTtJQUNqQixNQUFNLEVBQUUsR0FBRztDQUNkLENBQUMsQ0FDTCxDQUFDO0FBRUYsV0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsV0FBSSxDQUFDLENBQUM7QUFDekIsNENBQTRDO0FBQzVDLFdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLElBQUEscUJBQWMsR0FBRSxDQUFDLENBQUM7QUFDdEMsV0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsSUFBQSxxQkFBYyxHQUFFLENBQUMsQ0FBQztBQUV0QyxlQUFlO0FBQ2YsV0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsWUFBSyxDQUFDLENBQUM7QUFDM0IsV0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBSyxDQUFDLENBQUM7QUFFM0IsT0FBTztBQUNQLFdBQUcsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGNBQVUsQ0FBQyxDQUFDO0FBRS9CLHVCQUF1QjtBQUN2QixXQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzdCLElBQUksR0FBRyxZQUFZLDhCQUFhLEVBQUUsQ0FBQztRQUMvQixPQUFPLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBQ0QsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDM0QsQ0FBQyxDQUFDLENBQUM7QUFFSCx3QkFBd0I7QUFDeEIsV0FBRyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNyQixDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ0gsTUFBTSxFQUFFLFNBQVM7SUFDakIsT0FBTyxFQUFFLDZCQUE2QjtJQUN0QyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7SUFDbkMsT0FBTyxFQUFFLE9BQU87Q0FDbkIsQ0FBQyxDQUNMLENBQUM7QUFFRix1QkFBdUI7QUFDdkIsV0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUNuQixDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ0gsTUFBTSxFQUFFLElBQUk7SUFDWixPQUFPLEVBQUUsd0NBQXdDO0lBQ2pELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtDQUN0QyxDQUFDLENBQ0wsQ0FBQztBQUVGLGNBQWM7QUFDZCxXQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7SUFDZixPQUFPLENBQUMsQ0FBQyxJQUFJLENBQ1Q7UUFDSSxLQUFLLEVBQUUsSUFBSTtRQUNYLE9BQU8sRUFBRSxvQkFBb0I7UUFDN0IsSUFBSSxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSTtRQUNoQixNQUFNLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNO1FBQ3BCLE9BQU8sRUFBRSw2QkFBNkI7UUFDdEMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO0tBQ3RDLEVBQ0QsR0FBRyxDQUNOLENBQUM7QUFDTixDQUFDLENBQUMsQ0FBQztBQUVILHFFQUFxRTtBQUNyRSw4RkFBOEY7QUFDOUYsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztBQUMvRCxJQUFJLFdBQW1CLENBQUM7QUFDeEIsSUFBSSxDQUFDO0lBQ0QsV0FBVyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUMsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDeEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyx3REFBd0QsQ0FBQyxDQUFDO0FBQzFFLENBQUM7QUFBQyxPQUFPLEtBQUssRUFBRSxDQUFDO0lBQ2IsT0FBTyxDQUFDLEtBQUssQ0FBQyw0REFBNEQsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNuRix5REFBeUQ7SUFDekQsV0FBVyxHQUFHLDBDQUEwQyxDQUFDO0FBQzdELENBQUM7QUFFRCxvQ0FBb0M7QUFDdkIsUUFBQSxPQUFPLEdBQUcsSUFBQSxtQkFBTSxFQUFDLFdBQUcsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSG9ubyB9IGZyb20gJ2hvbm8nO1xuaW1wb3J0IHsgaGFuZGxlIH0gZnJvbSAnaG9uby9hd3MtbGFtYmRhJztcbmltcG9ydCB7IGNvcnMgfSBmcm9tICdob25vL2NvcnMnO1xuaW1wb3J0IHsgSFRUUEV4Y2VwdGlvbiB9IGZyb20gJ2hvbm8vaHR0cC1leGNlcHRpb24nO1xuaW1wb3J0IHsgYXV0aCB9IGZyb20gJy4vcm91dGVzL2F1dGgnO1xuaW1wb3J0IHsgdXNlcnMgfSBmcm9tICcuL3JvdXRlcy91c2VyJztcbmltcG9ydCB7IGxlYXZlIH0gZnJvbSAnLi9yb3V0ZXMvbGVhdmUnO1xuaW1wb3J0IHsgYXV0aE1pZGRsZXdhcmUgfSBmcm9tICcuL21pZGRsZXdhcmUvYXV0aCc7XG5pbXBvcnQgdGVzdFJvdXRlcyBmcm9tICcuL3JvdXRlcy90ZXN0JztcblxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcblxuZXhwb3J0IGNvbnN0IGFwcCA9IG5ldyBIb25vKCk7XG5cbmFwcC51c2UoXG4gICAgJy8qJyxcbiAgICBjb3JzKHtcbiAgICAgICAgb3JpZ2luOiBbXG4gICAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDo1MTczJyxcbiAgICAgICAgICAgICdodHRwczovLzdlczdvNHRjcWMuZXhlY3V0ZS1hcGkuYWYtc291dGgtMS5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICdodHRwczovL21haW4uZDEwZTBiazg1c2VtaDIuYW1wbGlmeWFwcC5jb20nLFxuICAgICAgICAgICAgJ2h0dHBzOi8vZ2xlbmlmeS5zdHVkaW8nXG4gICAgICAgIF0sXG4gICAgICAgIGFsbG93TWV0aG9kczogWydHRVQnLCAnUE9TVCcsICdQVVQnLCAnREVMRVRFJywgJ09QVElPTlMnXSxcbiAgICAgICAgYWxsb3dIZWFkZXJzOiBbJ0NvbnRlbnQtVHlwZScsICdBdXRob3JpemF0aW9uJywgJ1gtUmVxdWVzdGVkLVdpdGgnLCAnQWNjZXB0JywgJ0Nvb2tpZSddLFxuICAgICAgICBleHBvc2VIZWFkZXJzOiBbJ0NvbnRlbnQtTGVuZ3RoJywgJ1gtS3VtYS1SZXZpc2lvbicsICdTZXQtQ29va2llJ10sXG4gICAgICAgIGNyZWRlbnRpYWxzOiB0cnVlLFxuICAgICAgICBtYXhBZ2U6IDYwMFxuICAgIH0pXG4pO1xuXG5hcHAucm91dGUoJy9hdXRoJywgYXV0aCk7XG4vLyBQcm90ZWN0ZWQgcm91dGVzIC0gcmVxdWlyZSBhdXRoZW50aWNhdGlvblxuYXBwLnVzZSgnL3VzZXJzLyonLCBhdXRoTWlkZGxld2FyZSgpKTtcbmFwcC51c2UoJy9sZWF2ZS8qJywgYXV0aE1pZGRsZXdhcmUoKSk7XG5cbi8vIEFwcGx5IHJvdXRlc1xuYXBwLnJvdXRlKCcvdXNlcnMnLCB1c2Vycyk7XG5hcHAucm91dGUoJy9sZWF2ZScsIGxlYXZlKTtcblxuLy8gdGVzdFxuYXBwLnJvdXRlKCcvdGVzdCcsIHRlc3RSb3V0ZXMpO1xuXG4vLyBCYXNpYyBlcnJvciBoYW5kbGluZ1xuYXBwLm9uRXJyb3IoKGVyciwgYykgPT4ge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yOicsIGVycik7XG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIEhUVFBFeGNlcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIGVyci5nZXRSZXNwb25zZSgpO1xuICAgIH1cbiAgICByZXR1cm4gYy5qc29uKHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0sIDUwMCk7XG59KTtcblxuLy8gSGVhbHRoIGNoZWNrIGVuZHBvaW50XG5hcHAuZ2V0KCcvaGVhbHRoJywgKGMpID0+XG4gICAgYy5qc29uKHtcbiAgICAgICAgc3RhdHVzOiAnaGVhbHRoeScsXG4gICAgICAgIHNlcnZpY2U6ICdMZWF2ZSBNYW5hZ2VtZW50IFN5c3RlbSBBUEknLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgdmVyc2lvbjogJzEuMC4wJ1xuICAgIH0pXG4pO1xuXG4vLyBTaW1wbGUgcGluZyBlbmRwb2ludFxuYXBwLmdldCgnL3BpbmcnLCAoYykgPT5cbiAgICBjLmpzb24oe1xuICAgICAgICBzdGF0dXM6ICdvaycsXG4gICAgICAgIG1lc3NhZ2U6ICdMZWF2ZSBNYW5hZ2VtZW50IFN5c3RlbSBBUEkgaXMgcnVubmluZycsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfSlcbik7XG5cbi8vIDQwNCBoYW5kbGVyXG5hcHAubm90Rm91bmQoKGMpID0+IHtcbiAgICByZXR1cm4gYy5qc29uKFxuICAgICAgICB7XG4gICAgICAgICAgICBlcnJvcjogdHJ1ZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6ICdFbmRwb2ludCBub3QgZm91bmQnLFxuICAgICAgICAgICAgcGF0aDogYy5yZXEucGF0aCxcbiAgICAgICAgICAgIG1ldGhvZDogYy5yZXEubWV0aG9kLFxuICAgICAgICAgICAgc2VydmljZTogJ0xlYXZlIE1hbmFnZW1lbnQgU3lzdGVtIEFQSScsXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgICB9LFxuICAgICAgICA0MDRcbiAgICApO1xufSk7XG5cbi8vIFJlYWQgdGhlIEhUTUwgZmlsZSBjb250ZW50IHdoZW4gdGhlIExhbWJkYSBmdW5jdGlvbiBpcyBpbml0aWFsaXplZFxuLy8gVGhpcyBtYWtlcyB0aGUgY29udGVudCBhdmFpbGFibGUgdG8geW91ciBoYW5kbGVyIHdpdGhvdXQgcmUtcmVhZGluZyBpdCBvbiBldmVyeSBpbnZvY2F0aW9uLlxuY29uc3QgaHRtbFRlbXBsYXRlUGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICd0ZW1wbGF0ZS5odG1sJyk7XG5sZXQgaHRtbENvbnRlbnQ6IHN0cmluZztcbnRyeSB7XG4gICAgaHRtbENvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoaHRtbFRlbXBsYXRlUGF0aCwgJ3V0ZjgnKTtcbiAgICBjb25zb2xlLmxvZygndGVtcGxhdGUuaHRtbCBsb2FkZWQgc3VjY2Vzc2Z1bGx5IGZvciBMYW1iZGEgYnVuZGxpbmcuJyk7XG59IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBsb2FkIHRlbXBsYXRlLmh0bWwgZHVyaW5nIExhbWJkYSBpbml0aWFsaXphdGlvbjonLCBlcnJvcik7XG4gICAgLy8gUHJvdmlkZSBhIGZhbGxiYWNrIG9yIHJlLXRocm93IGlmIHRoZSBmaWxlIGlzIGNyaXRpY2FsXG4gICAgaHRtbENvbnRlbnQgPSAnPGgxPkVycm9yOiBIVE1MIHRlbXBsYXRlIG5vdCBmb3VuZCE8L2gxPic7XG59XG5cbi8vIEV4cG9ydCB0aGUgaGFuZGxlciBmb3IgQVdTIExhbWJkYVxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBoYW5kbGUoYXBwKTtcbiJdfQ==