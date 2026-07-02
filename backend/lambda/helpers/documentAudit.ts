import mysql from 'mysql2/promise';

export type DocumentAuditAction =
    | 'signed'
    | 'viewed'
    | 'reminded'
    | 'version_updated'
    | 'expiring_soon'
    | 'expired'
    | 'assigned'
    | 'unassigned';

export interface DocumentAuditEntry {
    documentId: number | string;
    userId?: string | null;
    action: DocumentAuditAction;
    metadata?: Record<string, unknown>;
}

/**
 * Appends a row to document_audit_log. Errors are logged, not thrown — an audit
 * write failure should never block the primary action (signing, assigning, etc).
 */
export async function logDocumentAudit(
    connection: mysql.Connection,
    { documentId, userId, action, metadata }: DocumentAuditEntry
): Promise<void> {
    try {
        await connection.execute(
            `INSERT INTO document_audit_log (document_id, user_id, action, metadata, performed_at)
             VALUES (?, ?, ?, ?, NOW())`,
            [documentId, userId ?? null, action, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (err) {
        console.error(`[documentAudit] Failed to log "${action}" for document ${documentId}:`, err);
    }
}
