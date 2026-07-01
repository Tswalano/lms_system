import mysql from 'mysql2/promise';

export interface AutoAssignTarget {
    userId: string;
    departmentId?: number | null;
    role?: string | null;
}

export interface AutoAssignResult {
    assigned: number;
    documents: Array<{ documentId: number; dueDays: number }>;
}

/**
 * Assigns every auto-assign-flagged document that applies to the given employee.
 *
 * A document participates when document_training_metadata.auto_assign_new_users is set.
 * Scoping semantics:
 *   - no rows in document_auto_assign_rules → the document goes to every new employee
 *   - rules present → the document is assigned when any rule matches the employee's
 *     department/role (a NULL rule column matches anything)
 *
 * Inserts are idempotent against UNIQUE(user_id, document_id), so this is safe to
 * re-run (used by both the add-user hook and the admin backfill endpoint).
 */
export async function autoAssignOnboardingDocuments(
    connection: mysql.Connection,
    { userId, departmentId, role }: AutoAssignTarget
): Promise<AutoAssignResult> {
    const [rows] = await connection.execute<mysql.RowDataPacket[]>(
        `SELECT d.id AS document_id,
                COALESCE(MIN(r.due_days), 30) AS due_days
         FROM documents d
         JOIN document_training_metadata m
           ON m.document_id = d.id AND m.auto_assign_new_users = 1
         LEFT JOIN document_auto_assign_rules r
           ON r.document_id = d.id
         WHERE d.status = 'active'
           AND (
                r.id IS NULL
                OR (
                    (r.department_id IS NULL OR r.department_id <=> ?)
                    AND (r.role IS NULL OR r.role <=> ?)
                )
           )
         GROUP BY d.id`,
        [departmentId ?? null, role ?? null]
    );

    const documents = rows.map((row) => ({
        documentId: Number(row.document_id),
        dueDays: Number(row.due_days),
    }));

    let assigned = 0;
    for (const doc of documents) {
        const [result] = await connection.execute<mysql.ResultSetHeader>(
            `INSERT INTO user_document_assignments (user_id, document_id, status, due_date, assigned_at)
             SELECT ?, ?, 'pending', DATE_ADD(NOW(), INTERVAL ? DAY), NOW()
             FROM DUAL
             WHERE NOT EXISTS (
                 SELECT 1 FROM user_document_assignments
                 WHERE user_id = ? AND document_id = ?
             )`,
            [userId, doc.documentId, doc.dueDays, userId, doc.documentId]
        );
        assigned += result.affectedRows;
    }

    return { assigned, documents };
}
