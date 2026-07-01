import dayjs from 'dayjs';
import { DatabaseService } from '../helpers/databaseHeler';
import { senderReviewCycleReminder } from '../email/emailMiddleware';

/**
 * EventBridge-triggered Lambda that runs Mon–Fri at 8 AM UTC.
 * Finds active (non-test) review cycles ending within the next 3 days and
 * reminds employees who still have an incomplete self-review or pending peer
 * reviews. Dedupe: at most one reminder per user per cycle per day, tracked via
 * the notifications table (relatedId = cycleId, relatedType = performance_review).
 */
export const handler = async (): Promise<void> => {
    console.log('=== Review Cycle Reminder Scheduler started ===');

    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const portalUrl = process.env.PERFORMANCE_PORTAL_URL || 'https://lms.disraptor.co.za/performance-review';

        const [cycles] = await connection.execute<any[]>(
            `SELECT id, name, endDate
             FROM review_cycles
             WHERE status = 'active'
               AND isTest = 0
               AND endDate >= CURDATE()
               AND endDate <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)`
        );

        if (cycles.length === 0) {
            console.log('No active cycles ending within 3 days.');
            return;
        }

        let sent = 0;
        let failed = 0;
        let skipped = 0;

        for (const cycle of cycles) {
            console.log(`Processing cycle "${cycle.name}" (ends ${dayjs(cycle.endDate).format('DD MMM YYYY')})`);

            // Employees with an incomplete self-review in this cycle
            const [selfRows] = await connection.execute<any[]>(
                `SELECT pr.employeeId AS user_id,
                        CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) AS user_name,
                        u.email
                 FROM performance_reviews pr
                 INNER JOIN users u ON u.id = pr.employeeId AND u.isActive = 1
                 WHERE pr.cycleId = ?
                   AND pr.reviewType = 'self_review'
                   AND pr.status IN ('not_started', 'employee_in_progress')`,
                [cycle.id]
            );

            // Reviewers with pending peer reviews in this cycle
            const [peerRows] = await connection.execute<any[]>(
                `SELECT pra.reviewerId AS user_id,
                        CONCAT(COALESCE(u.firstName,''),' ',COALESCE(u.lastName,'')) AS user_name,
                        u.email,
                        COUNT(*) AS pending_count
                 FROM peer_review_assignments pra
                 INNER JOIN users u ON u.id = pra.reviewerId AND u.isActive = 1
                 WHERE pra.cycleId = ?
                   AND pra.status != 'completed'
                 GROUP BY pra.reviewerId, u.firstName, u.lastName, u.email`,
                [cycle.id]
            );

            // Aggregate pending items per user
            type PendingEntry = { userName: string; email: string | null; items: string[] };
            const pendingByUser = new Map<string, PendingEntry>();
            for (const row of selfRows) {
                const entry: PendingEntry = pendingByUser.get(row.user_id) ?? { userName: (row.user_name as string).trim(), email: row.email, items: [] };
                entry.items.push('Complete your self-review');
                pendingByUser.set(row.user_id, entry);
            }
            for (const row of peerRows) {
                const entry: PendingEntry = pendingByUser.get(row.user_id) ?? { userName: (row.user_name as string).trim(), email: row.email, items: [] };
                const n = Number(row.pending_count);
                entry.items.push(`Complete ${n} peer review${n !== 1 ? 's' : ''}`);
                pendingByUser.set(row.user_id, entry);
            }

            if (pendingByUser.size === 0) {
                console.log('All reviews complete for this cycle.');
                continue;
            }

            // Skip users already reminded for this cycle today
            const [remindedRows] = await connection.execute<any[]>(
                `SELECT DISTINCT recipientId
                 FROM notifications
                 WHERE relatedId = ?
                   AND relatedType = 'performance_review'
                   AND type = 'reminder'
                   AND createdAt >= CURDATE()`,
                [cycle.id]
            );
            const remindedToday = new Set(remindedRows.map((r) => r.recipientId as string));

            const endDateText = dayjs(cycle.endDate).format('DD MMM YYYY');

            for (const [userId, entry] of pendingByUser) {
                if (remindedToday.has(userId)) {
                    skipped++;
                    continue;
                }

                try {
                    // In-app notification (also serves as the dedupe record)
                    await connection.execute(
                        `INSERT INTO notifications
                            (recipientId, type, category, title, message,
                             actionUrl, actionText, relatedId, relatedType, priority,
                             isRead, isArchived, createdAt, updatedAt)
                         VALUES (?, 'reminder', 'performance_reviews', ?, ?, '/performance-review', 'Complete now', ?, 'performance_review', 'high', false, false, NOW(), NOW())`,
                        [
                            userId,
                            `"${cycle.name}" closes on ${endDateText}`,
                            `The review cycle closes soon. Outstanding: ${entry.items.join('; ')}.`,
                            cycle.id,
                        ]
                    );

                    if (entry.email) {
                        await senderReviewCycleReminder(entry.email, {
                            employeeName: entry.userName || 'there',
                            cycleName: cycle.name as string,
                            endDate: endDateText,
                            pendingItems: entry.items,
                            portalUrl,
                        });
                    }

                    sent++;
                    console.log(`Reminder sent: ${entry.userName} (${entry.email ?? 'no email'}) — ${entry.items.join('; ')}`);
                } catch (err) {
                    failed++;
                    console.error(`Failed to remind user ${userId} for cycle ${cycle.id}:`, err);
                }
            }
        }

        console.log(`=== Scheduler complete: ${sent} sent, ${failed} failed, ${skipped} skipped (already reminded today) ===`);
    } catch (err) {
        console.error('Fatal error in review cycle reminder scheduler:', err);
        throw err;
    } finally {
        if (connection) await connection.end();
    }
};
