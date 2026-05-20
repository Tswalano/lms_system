import { Hono } from 'hono';
import dayjs from 'dayjs';
import { DatabaseService } from '../helpers/databaseHeler';
import { ResponseService } from '../models/apiResponse';

const reports = new Hono();

// ── helpers ──────────────────────────────────────────────────────────────────

function parseDateRange(startDate?: string, endDate?: string) {
    const end = endDate ? dayjs(endDate) : dayjs();
    const start = startDate ? dayjs(startDate) : end.startOf('year');
    return { start: start.format('YYYY-MM-DD'), end: end.format('YYYY-MM-DD') };
}

// ── GET /reports/leave-summary ────────────────────────────────────────────────
// Total approved leave days per employee per leave type for a date range.
// Query params: startDate, endDate, leaveType (optional)
reports.get('/leave-summary', async (c) => {
    const { startDate, endDate, leaveType } = c.req.query();
    const { start, end } = parseDateRange(startDate, endDate);

    let connection;
    try {
        connection = await DatabaseService.createConnection();

        const params: any[] = [start, end];
        const leaveTypeClause = leaveType ? 'AND lr.leave_type = ?' : '';
        if (leaveType) params.push(leaveType);

        const [rows] = await connection.execute<any[]>(
            `SELECT
                u.id        AS userId,
                u.firstName,
                u.lastName,
                lr.leave_type   AS leaveType,
                SUM(lr.duration) AS totalDays,
                COUNT(*)        AS requestCount
             FROM leave_requests lr
             JOIN users u ON lr.uid = u.id
             WHERE lr.status = 'approved'
               AND lr.start_date >= ?
               AND lr.start_date <= ?
               ${leaveTypeClause}
             GROUP BY u.id, u.firstName, u.lastName, lr.leave_type
             ORDER BY totalDays DESC`,
            params
        );

        // Roll up into per-employee totals for the summary table
        const byEmployee: Record<string, any> = {};
        for (const row of rows) {
            const key = String(row.userId);
            if (!byEmployee[key]) {
                byEmployee[key] = {
                    userId: row.userId,
                    name: `${row.firstName} ${row.lastName}`,
                    totalDays: 0,
                    breakdown: {}
                };
            }
            byEmployee[key].totalDays += Number(row.totalDays);
            byEmployee[key].breakdown[row.leaveType] = Number(row.totalDays);
        }

        const employees = Object.values(byEmployee).sort(
            (a: any, b: any) => b.totalDays - a.totalDays
        );

        return c.json(ResponseService.success('Leave summary retrieved.', {
            period: { start, end },
            employees,
            raw: rows
        }), 200);
    } catch (err: any) {
        console.error('GET /reports/leave-summary error:', err);
        return c.json(ResponseService.error('ReportError', err.message), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// ── GET /reports/department-coverage ─────────────────────────────────────────
// Monthly leave volume grouped by department.
// Query params: startDate, endDate
reports.get('/department-coverage', async (c) => {
    const { startDate, endDate } = c.req.query();
    const { start, end } = parseDateRange(startDate, endDate);

    let connection;
    try {
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.execute<any[]>(
            `SELECT
                d.name                                  AS department,
                DATE_FORMAT(lr.start_date, '%Y-%m')    AS month,
                COUNT(DISTINCT lr.uid)                  AS employeeCount,
                SUM(lr.duration)                        AS totalDays
             FROM leave_requests lr
             JOIN users u ON lr.uid = u.id
             JOIN user_departments ud ON ud.user_id = u.id
             JOIN departments d ON d.id = ud.department_id
             WHERE lr.status = 'approved'
               AND lr.start_date >= ?
               AND lr.start_date <= ?
             GROUP BY d.name, DATE_FORMAT(lr.start_date, '%Y-%m')
             ORDER BY month, department`,
            [start, end]
        );

        // Pivot into { department → [{ month, totalDays }] } for chart rendering
        const byDepartment: Record<string, any> = {};
        const months = new Set<string>();
        for (const row of rows) {
            months.add(row.month);
            if (!byDepartment[row.department]) byDepartment[row.department] = {};
            byDepartment[row.department][row.month] = {
                employeeCount: Number(row.employeeCount),
                totalDays: Number(row.totalDays)
            };
        }

        // Build a flat array suitable for recharts stacked bar
        const sortedMonths = [...months].sort();
        const chartData = sortedMonths.map(month => {
            const point: Record<string, any> = { month };
            for (const dept of Object.keys(byDepartment)) {
                point[dept] = byDepartment[dept][month]?.totalDays ?? 0;
            }
            return point;
        });

        // Also provide per-department totals for simpler bar chart
        const departmentTotals = Object.entries(byDepartment).map(([dept, months]) => ({
            department: dept,
            totalDays: Object.values(months as Record<string, any>).reduce(
                (sum: number, m: any) => sum + m.totalDays, 0
            )
        })).sort((a, b) => b.totalDays - a.totalDays);

        return c.json(ResponseService.success('Department coverage retrieved.', {
            period: { start, end },
            chartData,
            departmentTotals,
            departments: Object.keys(byDepartment),
            raw: rows
        }), 200);
    } catch (err: any) {
        console.error('GET /reports/department-coverage error:', err);
        return c.json(ResponseService.error('ReportError', err.message), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// ── GET /reports/peak-periods ─────────────────────────────────────────────────
// Monthly leave request volume (count + days).
// Query params: startDate, endDate
reports.get('/peak-periods', async (c) => {
    const { startDate, endDate } = c.req.query();
    const { start, end } = parseDateRange(startDate, endDate);

    let connection;
    try {
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.execute<any[]>(
            `SELECT
                DATE_FORMAT(start_date, '%Y-%m') AS month,
                COUNT(*)                          AS requestCount,
                SUM(duration)                     AS totalDays,
                COUNT(DISTINCT uid)               AS uniqueEmployees
             FROM leave_requests
             WHERE status = 'approved'
               AND start_date >= ?
               AND start_date <= ?
             GROUP BY DATE_FORMAT(start_date, '%Y-%m')
             ORDER BY month`,
            [start, end]
        );

        const formatted = rows.map(r => ({
            month: r.month,
            requestCount: Number(r.requestCount),
            totalDays: Number(r.totalDays),
            uniqueEmployees: Number(r.uniqueEmployees)
        }));

        return c.json(ResponseService.success('Peak periods retrieved.', {
            period: { start, end },
            monthly: formatted
        }), 200);
    } catch (err: any) {
        console.error('GET /reports/peak-periods error:', err);
        return c.json(ResponseService.error('ReportError', err.message), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// ── GET /reports/leave-type-breakdown ────────────────────────────────────────
// Org-wide split by leave type (count + days + percentage).
// Query params: startDate, endDate
reports.get('/leave-type-breakdown', async (c) => {
    const { startDate, endDate } = c.req.query();
    const { start, end } = parseDateRange(startDate, endDate);

    let connection;
    try {
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.execute<any[]>(
            `SELECT
                leave_type                  AS leaveType,
                COUNT(*)                    AS requestCount,
                SUM(duration)               AS totalDays,
                COUNT(DISTINCT uid)         AS uniqueEmployees
             FROM leave_requests
             WHERE status = 'approved'
               AND start_date >= ?
               AND start_date <= ?
             GROUP BY leave_type
             ORDER BY totalDays DESC`,
            [start, end]
        );

        const grandTotalDays = rows.reduce((s, r) => s + Number(r.totalDays), 0);
        const grandTotalRequests = rows.reduce((s, r) => s + Number(r.requestCount), 0);

        const breakdown = rows.map(r => ({
            leaveType: r.leaveType,
            requestCount: Number(r.requestCount),
            totalDays: Number(r.totalDays),
            uniqueEmployees: Number(r.uniqueEmployees),
            daysPct: grandTotalDays > 0
                ? parseFloat(((Number(r.totalDays) / grandTotalDays) * 100).toFixed(1))
                : 0,
            requestPct: grandTotalRequests > 0
                ? parseFloat(((Number(r.requestCount) / grandTotalRequests) * 100).toFixed(1))
                : 0
        }));

        return c.json(ResponseService.success('Leave type breakdown retrieved.', {
            period: { start, end },
            breakdown,
            totals: { totalDays: grandTotalDays, totalRequests: grandTotalRequests }
        }), 200);
    } catch (err: any) {
        console.error('GET /reports/leave-type-breakdown error:', err);
        return c.json(ResponseService.error('ReportError', err.message), 500);
    } finally {
        if (connection) await connection.end();
    }
});

export default reports;
