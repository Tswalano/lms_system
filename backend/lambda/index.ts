import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { serveStatic } from '@hono/node-server/serve-static';
import { authApp } from './routes/auth';
import { userApp } from './routes/user';
import adminDocs from './routes/adminDoc';
import { leaveApp } from './routes/leave';
import { authMiddleware } from './middleware/auth';
import testRoutes from './routes/dummy';
import userDoc from './routes/userDoc';
import { performanceRoutes } from './routes/performance';
import notificationRoutes from './routes/notifications';
import { DatabaseService } from './helpers/databaseHeler';

export const app = new Hono();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3001',
    'https://d2m4zkv512jna9.cloudfront.net',
    'https://d1eqa63aq0eyfn.cloudfront.net',
    'https://lms.disraptor-internal.net'
];

app.use(
    '/*',
    cors({
        origin: (origin) => {
            if (!origin) return null;
            return allowedOrigins.includes(origin) ? origin : null;
        },
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Cookie'],
        exposeHeaders: ['Content-Length', 'X-Kuma-Revision', 'Set-Cookie'],
        credentials: true,
        maxAge: 600
    })
);

app.route('/auth', authApp);
// Protected routes - require authentication
app.use('/users/*', authMiddleware());
app.use('/leave/*', authMiddleware());
app.use('/performance/*', authMiddleware());
app.use('/notifications/*', authMiddleware());
app.use('/user-docs/*', authMiddleware());
app.use('/admin-docs/*', authMiddleware());
// app.use('/user-docs/*', authMiddleware());

// Apply routes
app.route('/users', userApp);
app.route('/leave', leaveApp);

// Document Management
app.route('/user-docs', userDoc);
app.route('/admin-docs', adminDocs);

// notifications routes
app.route('/notifications', notificationRoutes)

// performance review routes
app.route('/performance', performanceRoutes);

// test
app.route('/test', testRoutes);

app.get('/', (c) => {
    return c.json({
        message: 'Welcome to the Leave Management System API',
        service: 'Disraptor LMS API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Basic error handling
app.onError((err, c) => {
    console.error('Error:', err);
    if (err instanceof HTTPException) {
        return err.getResponse();
    }
    return c.json({ error: 'Internal server error' }, 500);
});

// Health check endpoint to check the database connection
app.get('/health', async (c) => {
    try {
        const connection = await DatabaseService.createConnection();

        // Optionally, you can do a simple query to check if DB is responsive
        const s = await connection.query('SELECT 1');
        console.log('Health check query result:', s);

        return c.json({
            status: 'healthy',
            service: 'Disraptor LMS API',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: 'connected'
        });
    } catch (error: any) {
        console.error('Health check failed:', error.code);

        if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            return c.json({
                status: 'unhealthy',
                service: 'Disraptor LMS API',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                database: 'disconnected',
                error: 'Database connection lost'
            });
        }
        return c.json({
            status: 'unhealthy',
            service: 'Disraptor LMS API',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: 'disconnected',
            error: error.message
        }, 503); // Return 503 Service Unavailable
    }
});


// Simple ping endpoint
app.get('/ping', (c) =>
    c.json({
        status: 'ok',
        message: 'Leave Management System API is running',
        timestamp: new Date().toISOString()
    })
);

// Serve built API docs at /docs (production only)
if (process.env.NODE_ENV !== 'development') {
    app.use('/docs/*', serveStatic({
        root: '../api-docs/dist',
        rewriteRequestPath: (path) => path.replace(/^\/docs/, '') || '/index.html',
    }));
    app.get('/docs', (c) => c.redirect('/docs/'));
}

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

// Export the handler for AWS Lambda
export const handler = handle(app);
