import { Hono } from "hono";

const admin = new Hono();

admin.get('/', (c) => {
    return c.json({
        message: 'Admin Dashboard',
        service: 'Leave Management System API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});