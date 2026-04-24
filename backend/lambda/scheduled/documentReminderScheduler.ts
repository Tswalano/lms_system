import dayjs from 'dayjs';
import { DatabaseService } from '../helpers/databaseHeler';
import { senderDocumentReminder } from '../email/emailMiddleware';

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * EventBridge-triggered Lambda that runs Mon–Fri at 8 AM UTC.
 * Finds all overdue, unsigned document assignments and sends reminder emails,
 * respecting the 24-hour per-user/per-document cooldown.
 */
export const handler = async (): Promise<void> => {
    console.log('=== Document Reminder Scheduler started ===');

    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';
        const now = new Date();

        // Fetch all overdue, unsigned assignments that are either:
        //   a) never been reminded, or
        //   b) last reminded more than 24 hours ago
        const [rows] = await connection.execute<any[]>(
            `SELECT
                u.id              AS user_id,
                CONCAT(u.firstName, ' ', u.lastName) AS user_name,
                u.email,
                d.id              AS document_id,
                d.name            AS document_name,
                uda.due_date,
                uda.assigned_at,
                COALESCE(dtm.is_mandatory, 0) AS is_mandatory,
                MAX(dr.sent_at)   AS last_reminded_at
            FROM user_document_assignments uda
            INNER JOIN users u ON uda.user_id = u.id
            INNER JOIN documents d ON uda.document_id = d.id
            LEFT  JOIN document_training_metadata dtm ON d.id = dtm.document_id
            LEFT  JOIN document_signatures ds
                ON ds.user_id = uda.user_id AND ds.document_id = uda.document_id
            LEFT  JOIN document_reminders dr
                ON dr.user_id = uda.user_id AND dr.document_id = uda.document_id
            WHERE ds.id IS NULL
              AND uda.due_date IS NOT NULL
              AND uda.due_date < NOW()
              AND u.email IS NOT NULL
              AND u.email != ''
            GROUP BY u.id, u.firstName, u.lastName, u.email,
                     d.id, d.name, uda.due_date, uda.assigned_at, dtm.is_mandatory
            HAVING last_reminded_at IS NULL
                OR TIMESTAMPDIFF(SECOND, last_reminded_at, NOW()) >= 86400`
        );

        if (rows.length === 0) {
            console.log('No overdue unsigned documents requiring reminders today.');
            return;
        }

        console.log(`Found ${rows.length} overdue assignment(s) to remind.`);

        let sent = 0;
        let failed = 0;

        for (const row of rows) {
            try {
                await senderDocumentReminder(row.email as string, {
                    employeeName: row.user_name as string,
                    portalUrl,
                    documents: [{
                        name: row.document_name as string,
                        isMandatory: Boolean(row.is_mandatory),
                        dueDate: dayjs(row.due_date).format('DD MMM YYYY'),
                        assignedDate: dayjs(row.assigned_at).format('DD MMM YYYY'),
                    }],
                });

                await connection.execute(
                    `INSERT INTO document_reminders (user_id, document_id, sent_at) VALUES (?, ?, NOW())`,
                    [row.user_id, row.document_id]
                );

                sent++;
                console.log(`Reminder sent: ${row.user_name} (${row.email}) — document "${row.document_name}"`);
            } catch (err) {
                failed++;
                console.error(`Failed to remind ${row.email} for document ${row.document_id}:`, err);
            }
        }

        console.log(`=== Scheduler complete: ${sent} sent, ${failed} failed ===`);

    } catch (err) {
        console.error('Fatal error in document reminder scheduler:', err);
        throw err;
    } finally {
        if (connection) await connection.end();
    }
};
