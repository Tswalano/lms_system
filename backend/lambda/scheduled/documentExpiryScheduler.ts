import dayjs from 'dayjs';
import { DatabaseService } from '../helpers/databaseHeler';
import { senderDocumentExpiring } from '../email/emailMiddleware';
import { logDocumentAudit } from '../helpers/documentAudit';

/**
 * EventBridge-triggered Lambda that runs daily (expiry doesn't respect weekends).
 *
 * Two passes:
 *   1. Documents expiring within 14 days: reset already-signed assignments back to
 *      `pending` (re-signature required) and notify those employees. This query only
 *      matches while status is still signed/completed, so re-running daily is
 *      naturally idempotent — once reset, an employee won't be renotified by this pass.
 *   2. Documents already past their expiry date with assignments still `pending`
 *      (never re-signed in time): mark them `overdue`.
 */
export const handler = async (): Promise<void> => {
    console.log('=== Document Expiry Scheduler started ===');

    let connection;

    try {
        connection = await DatabaseService.createConnection();
        const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';

        // --- Pass 1: expiring within 14 days -----------------------------------
        const [expiringSoonDocs] = await connection.execute<any[]>(
            `SELECT d.id, d.name, dtm.expiry_date
             FROM documents d
             INNER JOIN document_training_metadata dtm ON dtm.document_id = d.id
             WHERE dtm.expiry_date IS NOT NULL
               AND dtm.expiry_date >= CURDATE()
               AND dtm.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 14 DAY)`
        );

        let resetCount = 0;
        let notifiedCount = 0;
        let failedCount = 0;

        for (const doc of expiringSoonDocs) {
            const expiryDateText = dayjs(doc.expiry_date).format('DD MMM YYYY');

            const [affectedRows] = await connection.execute<any[]>(
                `SELECT uda.id AS assignment_id, u.id AS user_id,
                        CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) AS user_name,
                        u.email
                 FROM user_document_assignments uda
                 INNER JOIN users u ON u.id = uda.user_id AND u.isActive = 1
                 WHERE uda.document_id = ? AND uda.status IN ('signed', 'completed')`,
                [doc.id]
            );

            if (affectedRows.length === 0) continue;

            await connection.execute(
                `UPDATE user_document_assignments
                 SET status = 'pending', completed_at = NULL, due_date = ?
                 WHERE document_id = ? AND status IN ('signed', 'completed')`,
                [doc.expiry_date, doc.id]
            );
            resetCount += affectedRows.length;

            for (const row of affectedRows) {
                try {
                    await connection.execute(
                        `INSERT INTO notifications
                            (recipientId, type, category, title, message,
                             actionUrl, actionText, relatedId, relatedType, priority,
                             isRead, isArchived, createdAt, updatedAt)
                         VALUES (?, 'reminder', 'document_management', ?, ?, '/documents', 'Review & Sign', ?, 'document', 'high', false, false, NOW(), NOW())`,
                        [
                            row.user_id,
                            `"${doc.name}" needs to be re-signed`,
                            `This document expires on ${expiryDateText} and requires renewal.`,
                            String(doc.id),
                        ]
                    );

                    if (row.email) {
                        await senderDocumentExpiring(row.email, {
                            employeeName: (row.user_name as string)?.trim() || 'there',
                            documentName: doc.name as string,
                            expiryDate: expiryDateText,
                            portalUrl,
                        });
                    }

                    await logDocumentAudit(connection, {
                        documentId: doc.id,
                        userId: row.user_id,
                        action: 'expiring_soon',
                        metadata: { expiryDate: expiryDateText },
                    });

                    notifiedCount++;
                    console.log(`Expiry notice sent: ${row.user_name} (${row.email ?? 'no email'}) — "${doc.name}"`);
                } catch (err) {
                    failedCount++;
                    console.error(`Failed to notify user ${row.user_id} about expiring document ${doc.id}:`, err);
                }
            }
        }

        // --- Pass 2: past expiry, never re-signed -> overdue --------------------
        const [expiredDocs] = await connection.execute<any[]>(
            `SELECT d.id, d.name
             FROM documents d
             INNER JOIN document_training_metadata dtm ON dtm.document_id = d.id
             WHERE dtm.expiry_date IS NOT NULL AND dtm.expiry_date < CURDATE()`
        );

        let overdueCount = 0;
        for (const doc of expiredDocs) {
            const [staleRows] = await connection.execute<any[]>(
                `SELECT user_id FROM user_document_assignments
                 WHERE document_id = ? AND status = 'pending'`,
                [doc.id]
            );
            if (staleRows.length === 0) continue;

            await connection.execute(
                `UPDATE user_document_assignments SET status = 'overdue'
                 WHERE document_id = ? AND status = 'pending'`,
                [doc.id]
            );
            overdueCount += staleRows.length;

            for (const row of staleRows) {
                await logDocumentAudit(connection, {
                    documentId: doc.id,
                    userId: row.user_id,
                    action: 'expired',
                });
            }
        }

        console.log(`=== Scheduler complete: ${resetCount} reset to pending, ${notifiedCount} notified, ${failedCount} failed, ${overdueCount} marked overdue ===`);
    } catch (err) {
        console.error('Fatal error in document expiry scheduler:', err);
        throw err;
    } finally {
        if (connection) await connection.end();
    }
};
