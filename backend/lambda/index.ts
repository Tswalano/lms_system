import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { auth } from './routes/auth';
import { users } from './routes/user';
import { leave } from './routes/leave';
import { authMiddleware } from './middleware/auth';
import testRoutes from './routes/dummy';
import userDoc from './routes/userDoc';
import { performanceRoutes } from './routes/performance';
import notificationRoutes from './routes/notifications';

export const app = new Hono();


app.use(
    '/*',
    cors({
        origin: [
            'http://localhost:5173',
            'https://lms.disraptor-internal.net',
            'https://d2ao36j4lo1t1d.cloudfront.net',
            'http://disraptor-website.s3-website-eu-west-1.amazonaws.com/'
        ],
        allowMethods: ['*'],
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
app.use('/performance/*', authMiddleware());
app.use('/notifications/*', authMiddleware());
// app.use('/user-docs/*', authMiddleware());

// Apply routes
app.route('/users', users);
app.route('/leave', leave);

// User Document Management
app.route('/user-docs', userDoc);

// notifications routes
app.route('/notifications', notificationRoutes)

// performance review routes
app.route('/performance', performanceRoutes);

// test
app.route('/test', testRoutes);

app.get('/', (c) => {
    return c.json({
        message: 'Welcome to the Leave Management System API',
        service: 'Leave Management System API',
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

// Export the handler for AWS Lambda
export const handler = handle(app);
