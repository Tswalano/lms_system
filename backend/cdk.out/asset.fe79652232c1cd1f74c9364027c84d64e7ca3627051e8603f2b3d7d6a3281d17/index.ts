import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { auth } from './routes/auth';
import { users } from './routes/user';
import { leave } from './routes/leave';
import { authMiddleware } from './middleware/auth';
import testRoutes from './routes/test';

import * as fs from 'fs';
import * as path from 'path';

export const app = new Hono();

app.use(
    '/*',
    cors({
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
    })
);

app.route('/auth', auth);
// Protected routes - require authentication
app.use('/users/*', authMiddleware());
app.use('/leave/*', authMiddleware());

// Apply routes
app.route('/users', users);
app.route('/leave', leave);

// test
app.route('/test', testRoutes);

// Basic error handling
app.onError((err, c) => {
    console.error('Error:', err);
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    return c.json({ error: 'Internal server error' }, 500);
});

// Health check endpoint
app.get('/health', (c) =>
    c.json({
        status: 'healthy',
        service: 'Leave Management System API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    })
);

// Simple ping endpoint
app.get('/ping', (c) =>
    c.json({
        status: 'ok',
        message: 'Leave Management System API is running',
        timestamp: new Date().toISOString()
    })
);

// 404 handler
app.notFound((c) => {
    return c.json(
        {
            error: true,
            message: 'Endpoint not found',
            path: c.req.path,
            method: c.req.method,
            service: 'Leave Management System API',
            timestamp: new Date().toISOString()
        },
        404
    );
});

// Read the HTML file content when the Lambda function is initialized
// This makes the content available to your handler without re-reading it on every invocation.
const htmlTemplatePath = path.join(__dirname, 'template.html');
let htmlContent: string;
try {
    htmlContent = fs.readFileSync(htmlTemplatePath, 'utf8');
    console.log('template.html loaded successfully for Lambda bundling.');
} catch (error) {
    console.error('Failed to load template.html during Lambda initialization:', error);
    // Provide a fallback or re-throw if the file is critical
    htmlContent = '<h1>Error: HTML template not found!</h1>';
}

// Export the handler for AWS Lambda
export const handler = handle(app);
