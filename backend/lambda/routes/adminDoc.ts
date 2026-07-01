import { Hono } from "hono";
import {
    S3Client, S3ClientConfig,
    PutObjectCommand, PutObjectCommandInput,
    DeleteObjectCommand, DeleteObjectCommandInput
} from "@aws-sdk/client-s3";
import dayjs from "dayjs";
import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { extension } from "mime-types";
import { DatabaseService } from '../helpers/databaseHeler';
import { ResponseService } from '../models/apiResponse';
import { DocumentCategoryRow } from "../models/documentCategory";
import { senderDocumentReminder, senderDocumentAssigned } from "../email/emailMiddleware";
import { autoAssignOnboardingDocuments } from '../helpers/documentAssignment';
import { getUserId } from '../middleware/auth';

const adminDocs = new Hono();

adminDocs.get('/categories', async (c) => {
    // Return all document categories 
    console.log("GET /admin-docs/categories");

    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const selectSql = `
            SELECT dc.id, dc.name, dc.description, dc.color, COUNT(d.id) as document_count
            FROM document_categories dc
            LEFT JOIN documents d ON dc.id = d.category_id
            GROUP BY dc.id, dc.name, dc.description, dc.color
            ORDER BY dc.name ASC
        `;

        const [rows] = await connection.execute<DocumentCategoryRow[]>(selectSql);

        const response = ResponseService.success(
            "Document categories retrieved successfully",
            rows
        );

        return c.json(response, 200);
    } catch (databaseError: any) {
        console.error("FETCH DOCUMENT CATEGORIES ERROR: DATABASE:", databaseError);

        const fetchErrorResponse = ResponseService.error(
            "FetchDocumentCategoriesDatabaseError",
            databaseError.message || "Failed to fetch document categories from database. Please check logs for details."
        );

        return c.json(fetchErrorResponse, 200);

    } finally {
        if (!!connection) await connection.end();
    }
});

adminDocs.put("/categories", async (c) => {
    console.log("PUT /admin-docs/categories");

    const {
        name,
        color, departmentId
    } = await c.req.json();
    const MAX_FOLDER_NAME_LENGTH = 50;
    let connection;

    if (name.length > MAX_FOLDER_NAME_LENGTH) {
        console.error("NEW DOCUMENT CATEGORY ERROR: NAME TOO LONG:", name);

        const nameLengthErrorResponse = ResponseService.error(
            "DocumentCategoryNameTooLongError",
            `The category name exceeds the maximum length of ${MAX_FOLDER_NAME_LENGTH} characters.`
        );

        return c.json(nameLengthErrorResponse, 413);
    }

    try {
        connection = await DatabaseService.createConnection();

        // Ensure the folder name is unique
        const checkCategoryExists = `
            select count(1) as count 
            from document_categories 
            where name = ?;
        `;
        const checkFolderNameResult = await connection.query<any[]>(checkCategoryExists, [name]);

        if (checkFolderNameResult[0][0].count > 0) {
            console.error("NEW DOCUMENT CATEGORY ERROR: DUPLICATE:", name);

            const databaseErrorResponse = ResponseService.error(
                "DuplicateDocumentCategoryError",
                `The category name "${name}" already exists. Please choose a different name.`
            );

            return c.json(databaseErrorResponse, 409);
        }

        // const categoryId = uuid7(); // Generate a unique ID for the category
        const insertStatement = `
            insert into document_categories (name, color, departmentId, createdAt, updatedAt)
            values ( ?, ?, ?, NOW(), NOW());
        `;

        await connection.execute<any[]>(insertStatement, [
            name,
            color,
            departmentId
        ]);

        const fetchNewDocumentStatement = `
            select * 
            from document_categories
            where name = ?;
        `;

        const newDocumentCategoryResponse = await connection.query<any[]>(fetchNewDocumentStatement, [name]);
        const newDocumentCategory = newDocumentCategoryResponse[0][0];

        const response = ResponseService.success(
            "Document categories with documents retrieved successfully",
            newDocumentCategory
        );

        return c.json(response, 200);
    } catch (databaseError: any) {
        console.error("NEW DOCUMENT CATEGORY ERROR: DATABASE:", databaseError);

        const databaseErrorResponse = ResponseService.error(
            "NewDocumentCategorySaveToDatabaseError",
            databaseError.message || "Failed to save document category to database. Please check logs for details."
        );

        return c.json(databaseErrorResponse, 200);
    } finally {
        if (!!connection) await connection.end();
    }

});

adminDocs.get('/by-category', async (c) => {
    console.log("GET /admin-docs/by-category");

    let connection;

    try {
        connection = await DatabaseService.createConnection();

        // SQL query to get all categories and their related documents,
        // and also count the number of signatures and total assignments for each document.
        const selectSql = `
            SELECT
                dc.id AS category_id,
                dc.name AS category_name,
                dc.description AS category_description,
                dc.color AS category_color,
                d.id AS document_id,
                d.name AS document_name,
                dpt.name AS department_name,
                dpt.id AS department_id,
                d.file_url,
                d.file_size,
                d.priority,
                d.createdat AS document_created_at,
                d.created_by AS uploaded_by_id,
                CONCAT(u.firstName, ' ', u.lastName) AS uploaded_by_display,
                COUNT(uda.user_id) AS total_assignments,
                COUNT(ds.user_id) AS total_signatures
            FROM
                document_categories dc
                LEFT JOIN documents d ON dc.id = d.category_id
                LEFT JOIN users u ON u.id = d.created_by
                LEFT JOIN user_document_assignments uda ON d.id = uda.document_id
                LEFT JOIN document_signatures ds ON uda.user_id = ds.user_id
                AND uda.document_id = ds.document_id
                LEFT JOIN departments dpt ON dc.departmentId = dpt.id
            GROUP BY
                dc.id,
                dc.name,
                dc.description,
                dc.color,
                d.id,
                d.name,
                d.file_url,
                d.file_size,
                d.priority,
                d.createdat,
                d.created_by,
                uploaded_by_display
            ORDER BY dc.name ASC, d.name ASC;
        `;

        const [rows] = await connection.execute<any[]>(selectSql);

        const grouped = new Map<number, any>();

        rows.forEach(row => {
            const {
                category_id,
                category_name,
                category_description,
                category_color,
                document_id,
                document_name,
                department_name,
                department_id,
                file_url,
                file_size,
                priority,
                document_created_at,
                uploaded_by_id,
                uploaded_by_display,
                total_assignments,
                total_signatures
            } = row;

            // Initialize the category in the map if it doesn't exist
            if (!grouped.has(category_id)) {
                grouped.set(category_id, {
                    id: category_id,
                    departmentId: department_id,
                    department: department_name,
                    name: category_name,
                    description: category_description,
                    color: category_color,
                    documents: []
                });
            }

            // If a document exists, add it to the category's documents array
            if (document_id !== null) {
                const signatures_percentage = total_assignments > 0
                    ? parseFloat(((total_signatures / total_assignments) * 100).toFixed(2))
                    : 0;

                grouped.get(category_id)?.documents.push({
                    id: document_id,
                    name: document_name,
                    department: department_name,
                    departmentId: department_id,
                    category: category_name,
                    file_url: file_url,
                    file_size: file_size,
                    priority: priority,
                    createdAt: document_created_at,
                    uploadedById: uploaded_by_id,
                    uploadedByDisplay: uploaded_by_display,
                    signatures: {
                        signed: total_signatures,
                        totalAssigned: total_assignments,
                        percentage: signatures_percentage
                    }
                });
            }
        });

        const response = ResponseService.success(
            "Document categories with documents retrieved successfully",
            Array.from(grouped.values())
        );

        return c.json(response, 200);
    } catch (error) {
        console.error("Error retrieving documents by category:", error);
        return c.json(ResponseService.error("DocumentRetrievalError", "Failed to retrieve documents by category"), 500);
    } finally {
        if (connection) await connection.end();
    }
});

adminDocs.post('/', async (c) => {
    console.log("POST /admin-docs");

    // TODO: Perform S3 upload and database changes inside a MySQL transaction

    if (!process.env.POLICY_DOCUMENTS_DISTRIBUTION_URL ||
        !process.env.POLICY_DOCUMENTS_BUCKET_NAME
    ) {
        const configErrorResponse = ResponseService.error(
            "LambdaConfigurationError",
            "Missing environment variables; unable to process upload request"
        );

        return c.json(configErrorResponse, 500);
    }

    const requestBody = await c.req.json();
    const {
        name,
        uploadedById,
        departmentId,
        folder,
        size,
        content,
        fileUrl,
        mimeType,
        fileBase64
    } = requestBody;

    let finalUrl;
    let isUploadedToS3 = false;
    let s3Client: S3Client | null = null;

    // Validate input - either fileUrl or fileBase64 must be provided
    if (!fileUrl?.trim() && !fileBase64?.trim()) {
        const validationErrorResponse = ResponseService.error(
            "ValidationError",
            "Either a file URL or file data must be provided"
        );
        return c.json(validationErrorResponse, 400);
    }

    if (!!fileUrl?.trim()) {
        // This document will point to an existing file
        // available publicly on the internet and will
        // not be uploaded to S3

        // Validate URL format
        try {
            const url = new URL(fileUrl.trim());
            if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                throw new Error('Invalid protocol');
            }
            finalUrl = fileUrl.trim();
        } catch (urlError) {
            const urlValidationErrorResponse = ResponseService.error(
                "InvalidUrlError",
                "Please provide a valid URL starting with http:// or https://"
            );
            return c.json(urlValidationErrorResponse, 400);
        }
    } else {
        // This document will be uploaded to S3

        if (!mimeType?.trim()) {
            const mimeTypeErrorResponse = ResponseService.error(
                "ValidationError",
                "MIME type is required for file uploads"
            );
            return c.json(mimeTypeErrorResponse, 400);
        }

        try {
            const s3ClientConfig: S3ClientConfig = {};
            s3Client = new S3Client(s3ClientConfig);

            const objectNameExtension = extension(mimeType);
            const putObjectCommandInput: PutObjectCommandInput = {
                Bucket: process.env.POLICY_DOCUMENTS_BUCKET_NAME,
                Key: `${folder}/${name}.${objectNameExtension}`,
                Body: Buffer.from(fileBase64, 'base64'),
                ContentType: mimeType,
            }
            const putObjectCommand: PutObjectCommand = new PutObjectCommand(putObjectCommandInput);
            /*const putObjectResponse: PutObjectCommandOutput = */ await s3Client.send(putObjectCommand);

            finalUrl = `${process.env.POLICY_DOCUMENTS_DISTRIBUTION_URL}/${folder}/${name}.${objectNameExtension}`;
            isUploadedToS3 = true;
        } catch (s3UploadError: any) {
            console.error("NEW DOCUMENT ERROR: UPLOAD TO S3:", s3UploadError);

            const s3UploadErrorResponse = ResponseService.error(
                "NewDocumentUploadToS3Error",
                s3UploadError.message || "Failed to upload document to S3. Please check logs for details."
            );

            return c.json(s3UploadErrorResponse, 500);
        }
    }

    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const insertStatement = `
            insert into documents (name, category_id, file_url, file_size, content, created_by, createdAt, updatedAt)
            values (?, ?, ?, ?, ?, ?, NOW(), NOW());
        `;

        await connection.execute<any[]>(insertStatement, [
            name,
            folder,
            finalUrl,
            size || '0 KB', // Default size for URL documents
            content || 'Document content will be processed and displayed here once uploaded.',
            uploadedById
        ]);

        const fetchNewDocumentStatement = `
            select * 
            from documents
            where id = last_insert_id();
        `;

        const newDocumentRecords = await connection.execute<any[]>(fetchNewDocumentStatement);

        const response = ResponseService.success(
            "Document created successfully",
            newDocumentRecords[0][0]
        );

        return c.json(response, 200);
    } catch (databaseError: any) {
        console.error("NEW DOCUMENT ERROR: DATABASE:", databaseError);

        let responseMessage = "Failed to save document to database.";

        if (isUploadedToS3 && s3Client) {
            // If the document was uploaded to S3 but failed to save in the database,
            // we should delete it from S3 to avoid orphaned files

            responseMessage = "Document uploaded to S3 but failed to save in database.";

            try {
                const objectNameExtension = extension(mimeType);
                const deleteObjectCommandInput: DeleteObjectCommandInput = {
                    Bucket: process.env.POLICY_DOCUMENTS_BUCKET_NAME,
                    Key: `${folder}/${name}.${objectNameExtension}`,
                };
                const deleteObjectCommand: DeleteObjectCommand = new DeleteObjectCommand(deleteObjectCommandInput);
                await s3Client.send(deleteObjectCommand);

                responseMessage += " Orphaned document removed from S3.";
            } catch (deleteDocumentError: any) {
                console.error("NEW DOCUMENT ERROR: DELETE FROM S3:", deleteDocumentError);

                responseMessage += ` Failed to delete document from S3: ${deleteDocumentError.message || "Unknown error"}`;
            }
        }

        const databaseErrorResponse = ResponseService.error(
            "NewDocumentSaveToDatabaseError",
            responseMessage + " Please check logs for more details."
        );

        return c.json(databaseErrorResponse, 500);
    } finally {
        if (!!connection) await connection.end();
    }
});

adminDocs.delete('/document/:document_id', async (c) => {
    console.log("DELETE /admin-docs/document/:document_id");

    const { document_id } = c.req.param();
    let connection: mysql.Connection | null = null;

    try {
        connection = await DatabaseService.createConnection();

        const [rows] = await connection.execute<any[]>(
            `SELECT id, name, file_url, category_id FROM documents WHERE id = ?`,
            [document_id]
        );

        if (rows.length === 0) {
            return c.json(ResponseService.error("NotFound", "Document not found."), 404);
        }

        const doc = rows[0];
        const distributionUrl = process.env.POLICY_DOCUMENTS_DISTRIBUTION_URL;

        // Delete from S3 if the file was stored there (URL starts with our distribution URL)
        if (distributionUrl && doc.file_url?.startsWith(distributionUrl) && process.env.POLICY_DOCUMENTS_BUCKET_NAME) {
            try {
                const s3Key = doc.file_url.replace(`${distributionUrl}/`, '');
                const s3 = new S3Client({});
                await s3.send(new DeleteObjectCommand({
                    Bucket: process.env.POLICY_DOCUMENTS_BUCKET_NAME,
                    Key: s3Key,
                }));
            } catch (s3Err: any) {
                // Log but don't block DB deletion
                console.error("DELETE DOCUMENT: S3 deletion failed:", s3Err.message);
            }
        }

        // CASCADE deletes user_document_assignments, document_signatures, etc.
        await connection.execute(`DELETE FROM documents WHERE id = ?`, [document_id]);

        return c.json(
            ResponseService.success("Document deleted successfully.", { id: Number(document_id) }),
            200
        );
    } catch (err: any) {
        console.error("DELETE /admin-docs/:document_id error:", err);
        return c.json(ResponseService.error("DeleteDocumentError", err.message || "Failed to delete document."), 500);
    } finally {
        if (connection) await connection.end();
    }
});

adminDocs.post('/assignments', async (c) => {
    console.log("POST /assignments");

    const requestBody = await c.req.json();
    const {
        userId,
        documentId,
        dueDate: rawDueDate
    } = requestBody;

    // Default due date to 30 days from now if not provided
    const dueDate = rawDueDate || dayjs().add(30, 'day').toISOString();

    let connection: mysql.Connection | null = null;

    if (!userId || !documentId) {
        console.error("ASSIGN DOCUMENT ERROR: INCOMPLETE PAYLOAD");

        const assignDocumentIncompleteErrorResponse = ResponseService.error(
            "AssignDocumentIncompletePayloadError",
            `Failed to assign document. Provided payload is incomplete.`
        );

        return c.json(assignDocumentIncompleteErrorResponse, 400);
    }

    if (!dayjs(dueDate).isValid()) {
        console.error("ASSIGN DOCUMENT ERROR: INVALID DUE DATE:", dueDate);

        const assignDocumentInvalidDueDateErrorResponse = ResponseService.error(
            "AssignDocumentInvalidDueDateError",
            `Failed to assign document. Provided due date is invalid: ${dueDate}.`
        );

        return c.json(assignDocumentInvalidDueDateErrorResponse, 400);
    }

    const now = dayjs();
    const then = dayjs(dueDate);

    if (then.isBefore(now)) {
        console.error("ASSIGN DOCUMENT ERROR: PAST DUE DATE:", dueDate);

        const assignDocumentPastDueDateErrorResponse = ResponseService.error(
            "AssignDocumentPastDueDateError",
            `Failed to assign document. Provided due date is in the past: ${dueDate}.`
        );

        return c.json(assignDocumentPastDueDateErrorResponse, 400);
    }

    try {
        connection = await DatabaseService.createConnection();

        // TODO: Verify that the user exists 
        const checkUserSql = `
            select count(1) as count
            from users 
            where id = ?
        `;
        const matchingUsers: any = await connection.query(checkUserSql, [userId]);

        if (matchingUsers[0][0].count != 1) {
            console.error("ASSIGN DOCUMENT ERROR: USER NOT FOUND:", userId);

            const assignDocumentUserNotFoundErrorResponse = ResponseService.error(
                "AssignDocumentUserNotFoundError",
                `Failed to assign document. User not found: ${userId}.`
            );

            return c.json(assignDocumentUserNotFoundErrorResponse, 404);
        }

        // TODO: Verify that the document exists
        const checkDocSql = `
            select count(1) as count 
            from documents 
            where id = ?
        `;
        const matchingDocuments: any = await connection.query(checkDocSql, [documentId]);

        if (matchingDocuments[0][0].count != 1) {
            console.error("ASSIGN DOCUMENT ERROR: DOCUMENT NOT FOUND:", documentId);

            const assignDocumentDocumentNotFoundErrorResponse = ResponseService.error(
                "AssignDocumentDocumentNotFoundError",
                `Failed to assign document. Document not found: ${documentId}`
            );

            return c.json(assignDocumentDocumentNotFoundErrorResponse, 404);
        }

        // TODO: Verify that the document hasn't already been allocated to the user 
        const checkUserDocAssignmentSql = `
            select count(1) as count 
            from user_document_assignments 
            where user_id = ?
            and document_id = ?
        `;
        const matchingUserDocAssignments: any = await connection.query(checkUserDocAssignmentSql, [userId, documentId]);

        if (matchingUserDocAssignments[0][0].count != 0) {
            console.error("ASSIGN DOCUMENT ERROR: DOCUMENT ALREADY ASSIGNED:", userId, documentId);

            const assignDocumentAlreadyAssignedErrorResponse = ResponseService.error(
                "AssignDocumentAlreadyAssignedError",
                `Failed to assign document. Document [${documentId}] already assigned to user [${userId}]`
            );

            return c.json(assignDocumentAlreadyAssignedErrorResponse, 409);
        }

        // TODO: Create new assignment in the database 
        const insertSql = `
            insert into user_document_assignments (user_id, document_id, status, due_date, assigned_at) 
            values (?, ?, 'pending', ?, now()); 
        `;

        await connection.execute<DocumentCategoryRow[]>(insertSql, [
            userId,
            documentId,
            dueDate
        ]);

        const fetchNewDocumentAssignmentSql = `
            select * 
            from user_document_assignments
            where id = last_insert_id();
        `;

        const newDocumentAssignmentRecords = await connection.execute<any[]>(fetchNewDocumentAssignmentSql);

        const response = ResponseService.success(
            "Document assignment created successfully successfully",
            newDocumentAssignmentRecords[0][0]
        );

        // Notify the employee (in-app + email, fire-and-forget)
        try {
            const [userRows] = await connection.execute<RowDataPacket[]>(
                `SELECT email, CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, '')) AS user_name FROM users WHERE id = ?`,
                [userId]
            );
            const [docRows] = await connection.execute<RowDataPacket[]>(
                `SELECT d.name, COALESCE(m.is_mandatory, 0) AS is_mandatory
                 FROM documents d
                 LEFT JOIN document_training_metadata m ON m.document_id = d.id
                 WHERE d.id = ?`,
                [documentId]
            );
            const user = userRows[0];
            const doc = docRows[0];

            await connection.execute(
                `INSERT INTO notifications
                    (recipientId, createdById, type, category, title, message,
                     actionUrl, actionText, priority, relatedType,
                     isRead, isArchived, createdAt, updatedAt)
                 VALUES (?, ?, 'action_required', 'document_management', ?, ?, '/documents', 'View Document', 'normal', 'document', false, false, NOW(), NOW())`,
                [
                    userId,
                    getUserId(c) ?? null,
                    'New document assigned',
                    `The document "${doc?.name ?? documentId}" has been assigned to you. Please review and sign it by ${dayjs(dueDate).format('DD MMM YYYY')}.`,
                ]
            );

            if (user?.email) {
                const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';
                void senderDocumentAssigned(user.email as string, {
                    employeeName: (user.user_name as string)?.trim() || 'there',
                    portalUrl,
                    documents: [{
                        name: (doc?.name as string) ?? `Document ${documentId}`,
                        isMandatory: Boolean(doc?.is_mandatory),
                        dueDate: dayjs(dueDate).format('DD MMM YYYY'),
                        assignedDate: dayjs().format('DD MMM YYYY'),
                    }],
                }).catch((err) => console.error('ASSIGN DOCUMENT: email failed:', err));
            }
        } catch (notifyError) {
            console.error('ASSIGN DOCUMENT: notification failed (assignment still created):', notifyError);
        }

        return c.json(response, 200);
    } catch (assignDocumentDatabaseError: any) {
        console.error("ASSIGN DOCUMENT ERROR: DATABASE:", assignDocumentDatabaseError);

        const assignDocumentErrorResponse = ResponseService.error(
            "AssignDocumentDatabaseError",
            assignDocumentDatabaseError.message || "Failed to assign document. Please check logs for details."
        );

        return c.json(assignDocumentErrorResponse, 200);

    } finally {
        if (connection) await connection.end();
    }
});

// POST /admin-docs/assignments/bulk
// Assigns one document to many employees in a single call. The selector is either
// an explicit userIds list, a departmentId, or all=true — resolved server-side to
// individual user_document_assignments rows (idempotent; existing rows are skipped).
adminDocs.post('/assignments/bulk', async (c) => {
    console.log("POST /admin-docs/assignments/bulk");

    const body = await c.req.json().catch(() => ({}));
    const { documentId, userIds, departmentId, all, dueDate: rawDueDate } = body as {
        documentId?: number;
        userIds?: string[];
        departmentId?: number;
        all?: boolean;
        dueDate?: string;
    };

    const selectors = [Array.isArray(userIds) && userIds.length > 0, departmentId != null, all === true].filter(Boolean);
    if (!documentId || selectors.length !== 1) {
        return c.json(ResponseService.error(
            "BulkAssignInvalidPayloadError",
            "documentId and exactly one of userIds / departmentId / all are required."
        ), 400);
    }

    const dueDate = rawDueDate || dayjs().add(30, 'day').toISOString();
    if (!dayjs(dueDate).isValid() || dayjs(dueDate).isBefore(dayjs())) {
        return c.json(ResponseService.error(
            "BulkAssignInvalidDueDateError",
            `Provided due date is invalid or in the past: ${dueDate}.`
        ), 400);
    }

    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [docRows] = await connection.execute<RowDataPacket[]>(
            `SELECT d.id, d.name, COALESCE(m.is_mandatory, 0) AS is_mandatory
             FROM documents d
             LEFT JOIN document_training_metadata m ON m.document_id = d.id
             WHERE d.id = ?`,
            [documentId]
        );
        if (docRows.length === 0) {
            return c.json(ResponseService.error(
                "BulkAssignDocumentNotFoundError",
                `Document not found: ${documentId}`
            ), 404);
        }
        const doc = docRows[0];

        // Resolve the selector to concrete users
        let targetRows: RowDataPacket[];
        if (all === true) {
            [targetRows] = await connection.execute<RowDataPacket[]>(
                `SELECT id, email, CONCAT(COALESCE(firstName,''),' ',COALESCE(lastName,'')) AS user_name
                 FROM users WHERE isActive = 1`
            );
        } else if (departmentId != null) {
            [targetRows] = await connection.execute<RowDataPacket[]>(
                `SELECT id, email, CONCAT(COALESCE(firstName,''),' ',COALESCE(lastName,'')) AS user_name
                 FROM users WHERE isActive = 1 AND departmentId = ?`,
                [departmentId]
            );
        } else {
            const placeholders = (userIds as string[]).map(() => '?').join(',');
            [targetRows] = await connection.execute<RowDataPacket[]>(
                `SELECT id, email, CONCAT(COALESCE(firstName,''),' ',COALESCE(lastName,'')) AS user_name
                 FROM users WHERE isActive = 1 AND id IN (${placeholders})`,
                userIds as string[]
            );
        }

        if (targetRows.length === 0) {
            return c.json(ResponseService.success(
                "No matching active users for the given selector.",
                { requested: 0, created: 0, skipped: 0 }
            ), 200);
        }

        // Skip users who already have this document
        const targetIds = targetRows.map((u) => u.id as string);
        const existingPlaceholders = targetIds.map(() => '?').join(',');
        const [existingRows] = await connection.execute<RowDataPacket[]>(
            `SELECT user_id FROM user_document_assignments
             WHERE document_id = ? AND user_id IN (${existingPlaceholders})`,
            [documentId, ...targetIds]
        );
        const alreadyAssigned = new Set(existingRows.map((r) => r.user_id as string));
        const toCreate = targetRows.filter((u) => !alreadyAssigned.has(u.id as string));

        if (toCreate.length > 0) {
            const valuesSql = toCreate.map(() => `(?, ?, 'pending', ?, NOW())`).join(', ');
            const params = toCreate.flatMap((u) => [u.id, documentId, dayjs(dueDate).format('YYYY-MM-DD HH:mm:ss')]);
            await connection.execute(
                `INSERT IGNORE INTO user_document_assignments (user_id, document_id, status, due_date, assigned_at)
                 VALUES ${valuesSql}`,
                params
            );

            // One in-app notification per newly assigned user
            const adminId = getUserId(c) ?? null;
            for (const u of toCreate) {
                await connection.execute(
                    `INSERT INTO notifications
                        (recipientId, createdById, type, category, title, message,
                         actionUrl, actionText, priority, relatedType,
                         isRead, isArchived, createdAt, updatedAt)
                     VALUES (?, ?, 'action_required', 'document_management', ?, ?, '/documents', 'View Document', 'normal', 'document', false, false, NOW(), NOW())`,
                    [
                        u.id,
                        adminId,
                        'New document assigned',
                        `The document "${doc.name}" has been assigned to you. Please review and sign it by ${dayjs(dueDate).format('DD MMM YYYY')}.`,
                    ]
                );
            }

            // Assignment emails — fire-and-forget so a mail failure never fails the assignment
            const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';
            void Promise.allSettled(
                toCreate
                    .filter((u) => !!u.email)
                    .map((u) => senderDocumentAssigned(u.email as string, {
                        employeeName: (u.user_name as string)?.trim() || 'there',
                        portalUrl,
                        documents: [{
                            name: doc.name as string,
                            isMandatory: Boolean(doc.is_mandatory),
                            dueDate: dayjs(dueDate).format('DD MMM YYYY'),
                            assignedDate: dayjs().format('DD MMM YYYY'),
                        }],
                    }))
            ).then((results) => {
                const failed = results.filter((r) => r.status === 'rejected').length;
                if (failed) console.error(`BULK ASSIGN: ${failed} assignment email(s) failed`);
            });
        }

        return c.json(ResponseService.success(
            `Document assigned to ${toCreate.length} user(s); ${alreadyAssigned.size} already had it.`,
            {
                requested: targetRows.length,
                created: toCreate.length,
                skipped: alreadyAssigned.size,
            }
        ), 200);
    } catch (bulkAssignError: any) {
        console.error("BULK ASSIGN DOCUMENT ERROR:", bulkAssignError);
        return c.json(ResponseService.error(
            "BulkAssignDatabaseError",
            bulkAssignError.message || "Failed to bulk assign document. Please check logs for details."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// POST /admin-docs/assignments/sync-onboarding
// Backfills auto-assign documents for one user (userId) or every active user.
adminDocs.post('/assignments/sync-onboarding', async (c) => {
    console.log("POST /admin-docs/assignments/sync-onboarding");

    const body = await c.req.json().catch(() => ({}));
    const { userId } = body as { userId?: string };

    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [users] = await connection.execute<RowDataPacket[]>(
            userId
                ? `SELECT id, departmentId, role FROM users WHERE isActive = 1 AND id = ?`
                : `SELECT id, departmentId, role FROM users WHERE isActive = 1`,
            userId ? [userId] : []
        );

        if (users.length === 0) {
            return c.json(ResponseService.error(
                "SyncOnboardingUserNotFoundError",
                userId ? `Active user not found: ${userId}` : "No active users found."
            ), 404);
        }

        let totalAssigned = 0;
        for (const user of users) {
            const result = await autoAssignOnboardingDocuments(connection, {
                userId: user.id as string,
                departmentId: user.departmentId as number | null,
                role: user.role as string | null,
            });
            totalAssigned += result.assigned;
        }

        return c.json(ResponseService.success(
            `Onboarding sync complete. ${totalAssigned} assignment(s) created across ${users.length} user(s).`,
            { usersProcessed: users.length, assignmentsCreated: totalAssigned }
        ), 200);
    } catch (syncError: any) {
        console.error("SYNC ONBOARDING DOCUMENTS ERROR:", syncError);
        return c.json(ResponseService.error(
            "SyncOnboardingError",
            syncError.message || "Failed to sync onboarding documents."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /admin-docs/documents/:document_id/auto-assign — current auto-assign config
adminDocs.get('/documents/:document_id/auto-assign', async (c) => {
    const { document_id } = c.req.param();

    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [metaRows] = await connection.execute<RowDataPacket[]>(
            `SELECT COALESCE(m.auto_assign_new_users, 0) AS enabled
             FROM documents d
             LEFT JOIN document_training_metadata m ON m.document_id = d.id
             WHERE d.id = ?`,
            [document_id]
        );
        if (metaRows.length === 0) {
            return c.json(ResponseService.error("NotFound", `Document not found: ${document_id}`), 404);
        }

        const [ruleRows] = await connection.execute<RowDataPacket[]>(
            `SELECT r.id, r.department_id AS departmentId, dep.name AS departmentName, r.role, r.due_days AS dueDays
             FROM document_auto_assign_rules r
             LEFT JOIN departments dep ON dep.id = r.department_id
             WHERE r.document_id = ?`,
            [document_id]
        );

        return c.json(ResponseService.success("Auto-assign configuration retrieved.", {
            enabled: Boolean(metaRows[0].enabled),
            rules: ruleRows,
        }), 200);
    } catch (error: any) {
        console.error("GET AUTO-ASSIGN CONFIG ERROR:", error);
        return c.json(ResponseService.error(
            "AutoAssignConfigError",
            error.message || "Failed to fetch auto-assign configuration."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// PUT /admin-docs/documents/:document_id/auto-assign
// Body: { enabled: boolean, rules?: [{ departmentId?, role?, dueDays? }] }
adminDocs.put('/documents/:document_id/auto-assign', async (c) => {
    const { document_id } = c.req.param();
    const body = await c.req.json().catch(() => ({}));
    const { enabled, rules } = body as {
        enabled?: boolean;
        rules?: Array<{ departmentId?: number | null; role?: string | null; dueDays?: number }>;
    };

    if (typeof enabled !== 'boolean') {
        return c.json(ResponseService.error(
            "AutoAssignInvalidPayloadError",
            "enabled (boolean) is required."
        ), 400);
    }

    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        const [docRows] = await connection.execute<RowDataPacket[]>(
            `SELECT id FROM documents WHERE id = ?`,
            [document_id]
        );
        if (docRows.length === 0) {
            return c.json(ResponseService.error("NotFound", `Document not found: ${document_id}`), 404);
        }

        await connection.execute(
            `INSERT INTO document_training_metadata (document_id, auto_assign_new_users, createdAt, updatedAt)
             VALUES (?, ?, NOW(), NOW())
             ON DUPLICATE KEY UPDATE auto_assign_new_users = VALUES(auto_assign_new_users), updatedAt = NOW()`,
            [document_id, enabled]
        );

        // Replace the scoping rules wholesale
        await connection.execute(
            `DELETE FROM document_auto_assign_rules WHERE document_id = ?`,
            [document_id]
        );
        const cleanRules = (Array.isArray(rules) ? rules : []).filter(
            (r) => r.departmentId != null || (r.role != null && r.role !== '') || r.dueDays != null
        );
        for (const rule of cleanRules) {
            await connection.execute(
                `INSERT IGNORE INTO document_auto_assign_rules (document_id, department_id, role, due_days, createdAt)
                 VALUES (?, ?, ?, ?, NOW())`,
                [document_id, rule.departmentId ?? null, rule.role ?? null, rule.dueDays ?? 30]
            );
        }

        return c.json(ResponseService.success("Auto-assign configuration saved.", {
            enabled,
            rulesSaved: cleanRules.length,
        }), 200);
    } catch (error: any) {
        console.error("PUT AUTO-ASSIGN CONFIG ERROR:", error);
        return c.json(ResponseService.error(
            "AutoAssignConfigError",
            error.message || "Failed to save auto-assign configuration."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

adminDocs.delete('/assignments/:assignmentId', async (c) => {
    console.log("DELETE /admin-docs/assignments/:assignmentId");

    const { assignmentId } = c.req.param();
    const force = c.req.query('force') === 'true';

    let connection: mysql.Connection | null = null;
    try {
        connection = await DatabaseService.createConnection();

        // Fetch the assignment with signature status
        const [assignmentRows] = await connection.execute<any[]>(
            `SELECT uda.id, uda.user_id, uda.document_id,
                    ds.signed_at IS NOT NULL AS has_signed
             FROM user_document_assignments uda
             LEFT JOIN document_signatures ds
               ON ds.user_id = uda.user_id AND ds.document_id = uda.document_id
             WHERE uda.id = ?`,
            [assignmentId]
        );

        if (assignmentRows.length === 0) {
            return c.json(ResponseService.error("NotFound", "Assignment not found."), 404);
        }

        const assignment = assignmentRows[0];

        if (assignment.has_signed && !force) {
            return c.json(
                ResponseService.error(
                    "AssignmentAlreadySigned",
                    "This document has already been signed by the user. Pass ?force=true to remove anyway."
                ),
                409
            );
        }

        // Delete signatures first (in case there is no cascade), then the assignment
        await connection.execute(
            `DELETE FROM document_signatures WHERE user_id = ? AND document_id = ?`,
            [assignment.user_id, assignment.document_id]
        );
        await connection.execute(
            `DELETE FROM user_document_assignments WHERE id = ?`,
            [assignmentId]
        );

        return c.json(
            ResponseService.success("Assignment removed successfully.", {
                assignmentId: Number(assignmentId),
                userId: assignment.user_id,
                documentId: assignment.document_id
            }),
            200
        );
    } catch (err: any) {
        console.error("DELETE /assignments error:", err);
        return c.json(ResponseService.error("DeleteAssignmentError", err.message || "Failed to remove assignment."), 500);
    } finally {
        if (connection) await connection.end();
    }
});

adminDocs.get('/:document_id/signatures', async (c) => {
    console.log("GET /admin-docs/:document_id/signatures");

    let connection;
    try {
        const { document_id } = c.req.param();
        if (!document_id) {
            return c.json(ResponseService.error("InvalidRequest", "Document ID is required."), 400);
        }

        connection = await DatabaseService.createConnection();

        // SQL query to get the list of all assigned users for a document
        // and check if they have a corresponding signature record.
        const selectSql = `
            SELECT
                uda.id AS assignment_id,
                u.id AS user_id,
                CONCAT(u.firstName, ' ', u.lastName) AS user_name,
                uda.status AS assignment_status,
                ds.signed_at IS NOT NULL AS has_signed,
                ds.signed_at
            FROM user_document_assignments uda
            LEFT JOIN users u ON uda.user_id = u.id
            LEFT JOIN document_signatures ds ON ds.user_id = uda.user_id AND ds.document_id = uda.document_id
            WHERE uda.document_id = ?
            ORDER BY has_signed DESC, user_name ASC;
        `;

        const [rows] = await connection.execute<any[]>(selectSql, [document_id]);

        const signedUsers = rows.filter(row => row.has_signed);
        const notSignedUsers = rows.filter(row => !row.has_signed);

        const response = ResponseService.success(
            "Document signature status retrieved successfully.",
            {
                signed: signedUsers.map(u => ({
                    assignmentId: u.assignment_id,
                    id: u.user_id,
                    name: u.user_name,
                    signedAt: u.signed_at
                })),
                notSigned: notSignedUsers.map(u => ({
                    assignmentId: u.assignment_id,
                    id: u.user_id,
                    name: u.user_name,
                    status: u.assignment_status
                }))
            }
        );

        return c.json(response, 200);

    } catch (error) {
        console.error("Error retrieving document signature status:", error);
        return c.json(ResponseService.error("DocumentSignatureRetrievalError", "Failed to retrieve document signature status."), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// Add department
adminDocs.post('/departments', async (c) => {
    console.log("POST /admin-docs/departments");
    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const { name, description } = await c.req.json();

        if (!name) {
            return c.json(ResponseService.error("InvalidRequest", "Department name is required."), 400);
        }

        const sql = `INSERT INTO departments (name, description) VALUES (?,?)`;
        const [result] = await connection.execute<ResultSetHeader>(sql, [name, description]);
        const [rows] = await connection.execute(`SELECT * FROM departments WHERE id = ?`, [result.insertId]);
        const created = (rows as any[])[0];
        const response = ResponseService.success("Department added successfully", created);
        return c.json(response, 201);
    } catch (error) {
        console.error("Error adding department:", error);
        return c.json(ResponseService.error("DepartmentAdditionError", "Failed to add department."), 500);
    } finally {
        if (connection) await connection.end();
    }
})

// Get departments
adminDocs.get('/departments', async (c) => {
    console.log("GET /admin-docs/departments");
    let connection;

    try {
        connection = await DatabaseService.createConnection();

        const sql = `SELECT * FROM departments`;
        const [departments] = await connection.execute(sql);
        const response = ResponseService.success(
            "Departments retrieved successfully",
            departments
        );
        return c.json(response, 200);
    } catch (error) {
        console.error("Error retrieving departments:", error);
        return c.json(ResponseService.error("DepartmentsRetrievalError", "Failed to retrieve departments."), 500);
    } finally {
        if (connection) await connection.end();
    }
})

// Update department
adminDocs.put('/departments/:department_id', async (c) => {
    console.log("PATCH /admin-docs/departments/:department_id");
    let connection;

    try {
        const { department_id } = c.req.param();
        if (!department_id) {
            return c.json(ResponseService.error("InvalidRequest", "Department ID is required."), 400);
        }

        const departmentId = parseInt(department_id);
        if (isNaN(departmentId)) {
            return c.json(ResponseService.error("InvalidRequest", "Department ID must be a valid number."), 400);
        }

        connection = await DatabaseService.createConnection();

        const { name, description } = await c.req.json();
        const sql = `UPDATE departments SET name = ?, description = ? WHERE id = ?`;
        await connection.execute(sql, [name, description, departmentId]);
        const [rows] = await connection.execute(`SELECT * FROM departments WHERE id = ?`, [departmentId]);
        const updated = (rows as any[])[0];
        const response = ResponseService.success("Department updated successfully", updated);
        return c.json(response, 200);
    } catch (error) {
        console.error("Error updating department:", error);
        return c.json(ResponseService.error("DepartmentUpdateError", "Failed to update department."), 500);
    } finally {
        if (connection) await connection.end();
    }
})

// Delete department
adminDocs.delete('/departments/:department_id', async (c) => {
    console.log("DELETE /admin-docs/departments/:department_id");
    let connection;

    try {
        const { department_id } = c.req.param();
        if (!department_id) {
            return c.json(ResponseService.error("InvalidRequest", "Department ID is required."), 400);
        }

        const departmentId = parseInt(department_id);
        if (isNaN(departmentId)) {
            return c.json(ResponseService.error("InvalidRequest", "Department ID must be a valid number."), 400);
        }

        connection = await DatabaseService.createConnection();

        const sql = `DELETE FROM departments WHERE id = ?`;
        const [rows] = await connection.execute(sql, [departmentId]);
        const response = ResponseService.success(
            "Department deleted successfully",
            rows
        );
        return c.json(response, 200);
    } catch (error) {
        console.error("Error deleting department:", error);
        return c.json(ResponseService.error("DepartmentDeletionError", "Failed to delete department."), 500);
    } finally {
        if (connection) await connection.end();
    }
})

// Delete category
adminDocs.delete('/categories/:category_id', async (c) => {
    console.log("DELETE /admin-docs/categories/:category_id");
    let connection;

    try {
        const { category_id } = c.req.param();
        if (!category_id) {
            return c.json(ResponseService.error("InvalidRequest", "Category ID is required."), 400);
        }

        const categoryId = parseInt(category_id);
        if (isNaN(categoryId)) {
            return c.json(ResponseService.error("InvalidRequest", "Category ID must be a valid number."), 400);
        }

        connection = await DatabaseService.createConnection();

        // Check if category exists
        const checkCategorySql = `SELECT id, name FROM document_categories WHERE id = ?`;
        const [categoryRows] = await connection.execute<RowDataPacket[]>(checkCategorySql, [categoryId]);

        if (categoryRows.length === 0) {
            return c.json(ResponseService.error("CategoryNotFound", "Category not found."), 404);
        }

        const categoryName = categoryRows[0].name;

        // Check if category has documents
        const checkDocumentsSql = `SELECT COUNT(*) as count FROM documents WHERE category_id = ?`;
        const [documentRows] = await connection.execute<RowDataPacket[]>(checkDocumentsSql, [categoryId]);
        const documentCount = documentRows[0]?.count || 0;

        if (documentCount > 0) {
            return c.json(ResponseService.error(
                "CategoryNotEmpty",
                `Cannot delete folder "${categoryName}". It contains ${documentCount} document${documentCount > 1 ? 's' : ''}. Please move or delete them first.`
            ), 400);
        }

        // Delete category
        const deleteSql = `DELETE FROM document_categories WHERE id = ?`;
        const [deleteResult] = await connection.execute<ResultSetHeader>(deleteSql, [categoryId]);

        if (deleteResult.affectedRows === 0) {
            return c.json(ResponseService.error("CategoryDeletionError", "Failed to delete category. Category may not exist."), 400);
        }

        return c.json(ResponseService.success(
            "Category deleted successfully",
            {
                deletedCategoryId: categoryId,
                deletedCategoryName: categoryName,
                message: `Folder "${categoryName}" has been deleted successfully.`
            }
        ), 200);

    } catch (error) {
        console.error("Error deleting category:", error);

        return c.json(ResponseService.error("CategoryDeletionError", "An unexpected error occurred while deleting the category."), 500);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});

// Update category
adminDocs.put('/categories/:category_id', async (c) => {
    console.log("PUT /admin-docs/categories/:category_id");
    let connection;

    try {
        const { category_id } = c.req.param();
        if (!category_id) {
            return c.json(ResponseService.error("InvalidRequest", "Category ID is required."), 400);
        }

        const categoryId = parseInt(category_id);
        if (isNaN(categoryId)) {
            return c.json(ResponseService.error("InvalidRequest", "Category ID must be a valid number."), 400);
        }

        const body = await c.req.json();
        const { name, color, departmentId } = body;

        if (!name) {
            return c.json(ResponseService.error("InvalidRequest", "Category name is required and cannot be empty."), 400);
        }

        const trimmedName = name.trim();
        if (trimmedName.length > 100) {
            return c.json(ResponseService.error("InvalidRequest", "Category name cannot exceed 100 characters."), 400);
        }

        if (color && typeof color !== 'string') {
            return c.json(ResponseService.error("InvalidRequest", "Color must be a string."), 400);
        }

        let validDepartmentId = null;
        if (departmentId !== undefined && departmentId !== null) {
            validDepartmentId = parseInt(departmentId);
            if (isNaN(validDepartmentId)) {
                return c.json(ResponseService.error("InvalidRequest", "Department ID must be a valid number."), 400);
            }
        }

        connection = await DatabaseService.createConnection();

        const checkCategorySql = `SELECT id, name, color, departmentId FROM document_categories WHERE id = ?`;
        const [categoryRows] = await connection.execute<RowDataPacket[]>(checkCategorySql, [categoryId]);

        if (categoryRows.length === 0) {
            return c.json(ResponseService.error("CategoryNotFound", "Category not found."), 404);
        }

        const currentCategory = categoryRows[0];

        // Check for duplicate name
        const checkNameSql = `SELECT id FROM document_categories WHERE name = ? AND id != ?`;
        const [nameRows] = await connection.execute<RowDataPacket[]>(checkNameSql, [trimmedName, categoryId]);

        if (nameRows.length > 0) {
            return c.json(ResponseService.error(
                "CategoryNameExists",
                `A folder with the name "${trimmedName}" already exists.`
            ), 400);
        }

        if (validDepartmentId !== null) {
            const checkDepartmentSql = `SELECT id FROM departments WHERE id = ?`;
            const [departmentRows] = await connection.execute<RowDataPacket[]>(checkDepartmentSql, [validDepartmentId]);
            if (departmentRows.length === 0) {
                return c.json(ResponseService.error("DepartmentNotFound", "Selected department does not exist."), 400);
            }
        }

        const updateSql = `UPDATE document_categories SET name = ?, color = ?, departmentId = ?, updatedAt = NOW() WHERE id = ?`;
        const [updateResult] = await connection.execute<ResultSetHeader>(updateSql, [trimmedName, color, validDepartmentId, categoryId]);

        if (updateResult.affectedRows === 0) {
            return c.json(ResponseService.error("CategoryUpdateError", "Failed to update category."), 500);
        }

        const getUpdatedSql = `
            SELECT dc.id, dc.name, dc.color, dc.departmentId, dc.createdAt, dc.updatedAt,
                   d.name as department_name
            FROM document_categories dc
            LEFT JOIN departments d ON dc.departmentId = d.id
            WHERE dc.id = ?
        `;
        const [updatedRows] = await connection.execute<RowDataPacket[]>(getUpdatedSql, [categoryId]);
        const updatedCategory = updatedRows[0];

        return c.json(ResponseService.success(
            "Category updated successfully",
            {
                id: updatedCategory.id,
                name: updatedCategory.name,
                color: updatedCategory.color,
                departmentId: updatedCategory.departmentId,
                departmentName: updatedCategory.department_name,
                createdAt: updatedCategory.createdAt,
                updatedAt: updatedCategory.updatedAt,
                changes: {
                    nameChanged: currentCategory.name !== trimmedName,
                    colorChanged: color !== undefined && currentCategory.color !== color,
                    departmentChanged: departmentId !== undefined && currentCategory.departmentId !== validDepartmentId
                }
            }
        ), 200);

    } catch (error) {
        console.error("Error updating category:", error);

        return c.json(ResponseService.error("CategoryUpdateError", "An unexpected error occurred while updating the category."), 500);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
});



// POST /admin-docs/send-bulk-reminders
// Sends ONE reminder email per unsigned user covering ALL documents created 15+ days ago.
// Per (user, document) pair: skips if reminded within the last 24 hours.
adminDocs.post('/send-bulk-reminders', async (c) => {
    console.log("POST /admin-docs/send-bulk-reminders");

    let connection;

    try {
        let adminId: string;
        try {
            adminId = getUserId(c);
        } catch {
            return c.json(ResponseService.error("UNAUTHORIZED", "Authentication required"), 401);
        }

        connection = await DatabaseService.createConnection();

        // Find all unsigned assignments for documents created 15+ days ago,
        // along with the most-recent reminder sent per (user, document).
        const [rows] = await connection.execute<RowDataPacket[]>(
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
             INNER JOIN users     u   ON uda.user_id     = u.id
             INNER JOIN documents d   ON uda.document_id = d.id
             LEFT  JOIN document_training_metadata dtm ON uda.document_id = dtm.document_id
             LEFT  JOIN document_signatures ds
                ON ds.user_id = uda.user_id AND ds.document_id = uda.document_id
             LEFT  JOIN document_reminders dr
                ON dr.user_id = uda.user_id AND dr.document_id = uda.document_id
             WHERE ds.id IS NULL
               AND u.email   IS NOT NULL
               AND u.email   != ''
               AND d.createdAt <= DATE_SUB(NOW(), INTERVAL 15 DAY)
             GROUP BY u.id, u.firstName, u.lastName, u.email,
                      d.id, d.name, uda.due_date, uda.assigned_at, dtm.is_mandatory
             ORDER BY u.id, d.name`
        );

        if (rows.length === 0) {
            return c.json(ResponseService.success(
                "No pending documents older than 15 days found — all assigned users have signed or no eligible documents exist.",
                { emailsSent: 0, emailsFailed: 0, usersSkipped: 0, totalUsers: 0, totalDocuments: 0 }
            ), 200);
        }

        const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';
        const cooldownMs = 24 * 60 * 60 * 1000;
        const now = Date.now();

        // Group rows by user and filter out (user, document) pairs reminded within 24 hours
        const userMap = new Map<string, {
            userId: string;
            userName: string;
            email: string;
            docs: Array<{ documentId: number; name: string; isMandatory: boolean; dueDate?: string; assignedDate: string }>;
        }>();

        let totalSkippedDocs = 0;
        for (const row of rows) {
            const isOnCooldown = row.last_reminded_at &&
                (now - new Date(row.last_reminded_at).getTime()) < cooldownMs;
            if (isOnCooldown) { totalSkippedDocs++; continue; }

            if (!userMap.has(row.user_id)) {
                userMap.set(row.user_id, {
                    userId: row.user_id as string,
                    userName: row.user_name as string,
                    email: row.email as string,
                    docs: [],
                });
            }
            userMap.get(row.user_id)!.docs.push({
                documentId: row.document_id as number,
                name: row.document_name as string,
                isMandatory: Boolean(row.is_mandatory),
                dueDate: row.due_date ? dayjs(row.due_date).format('DD MMM YYYY') : undefined,
                assignedDate: dayjs(row.assigned_at).format('DD MMM YYYY'),
            });
        }

        const eligibleUsers = [...userMap.values()];
        let emailsSent = 0;
        let emailsFailed = 0;

        const results = await Promise.allSettled(
            eligibleUsers.map(async (u) => {
                await senderDocumentReminder(u.email, {
                    employeeName: u.userName,
                    portalUrl,
                    documents: u.docs.map(d => ({
                        name: d.name,
                        isMandatory: d.isMandatory,
                        dueDate: d.dueDate,
                        assignedDate: d.assignedDate,
                    })),
                });

                // Log a reminder entry per (user, document) sent
                for (const doc of u.docs) {
                    await connection!.execute(
                        `INSERT INTO document_reminders (user_id, document_id, sent_at) VALUES (?, ?, NOW())`,
                        [u.userId, doc.documentId]
                    );
                }

                // One in-app notification per user listing all documents
                const docList = u.docs.map(d => `"${d.name}"`).join(', ');
                const notifId = `not_bulk_${Date.now()}_${String(u.userId).slice(0, 8)}`;
                await connection!.execute(
                    `INSERT INTO notifications
                        (id, recipientId, createdById, type, category, title, message,
                         actionUrl, actionText, priority, relatedType,
                         isRead, isArchived, createdAt, updatedAt)
                     VALUES (?, ?, ?, 'action_required', 'documents', ?, ?, '/documents', 'Sign Now', 'high', 'document', false, false, NOW(), NOW())`,
                    [
                        notifId,
                        u.userId,
                        adminId,
                        `Document Signature Reminder`,
                        `You have ${u.docs.length} pending document${u.docs.length > 1 ? 's' : ''} requiring your signature: ${docList}.`,
                    ]
                );
            })
        );

        results.forEach(r => r.status === 'fulfilled' ? emailsSent++ : emailsFailed++);

        const totalDocumentsCovered = eligibleUsers.reduce((sum, u) => sum + u.docs.length, 0);
        console.log(`Bulk reminders: ${emailsSent} emails sent, ${emailsFailed} failed, ${eligibleUsers.length} users, ${totalSkippedDocs} (user,doc) pairs skipped (24h cooldown)`);

        return c.json(ResponseService.success(
            `Reminders sent to ${emailsSent} of ${eligibleUsers.length} eligible user${eligibleUsers.length !== 1 ? 's' : ''} covering ${totalDocumentsCovered} pending document${totalDocumentsCovered !== 1 ? 's' : ''}.`,
            { emailsSent, emailsFailed, usersSkipped: eligibleUsers.length - emailsSent, totalUsers: eligibleUsers.length, totalDocuments: totalDocumentsCovered }
        ), 200);

    } catch (error: any) {
        console.error("Error sending bulk document reminders:", error);
        return c.json(ResponseService.error(
            "BulkReminderError",
            error.message || "Failed to send bulk document reminders."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});


// POST /admin-docs/:document_id/send-reminders
// Sends document signing reminder emails to unsigned users.
// Skips users reminded within the last 24 hours and logs every send to document_reminders.
adminDocs.post('/:document_id/send-reminders', async (c) => {
    console.log("POST /admin-docs/:document_id/send-reminders");

    let connection;

    try {
        const { document_id } = c.req.param();
        const documentId = parseInt(document_id);

        if (isNaN(documentId)) {
            return c.json(ResponseService.error("InvalidRequest", "Document ID must be a valid number."), 400);
        }

        connection = await DatabaseService.createConnection();

        // Verify document exists
        const [docRows] = await connection.execute<RowDataPacket[]>(
            `SELECT id, name FROM documents WHERE id = ?`,
            [documentId]
        );

        if (docRows.length === 0) {
            return c.json(ResponseService.error("DocumentNotFound", `Document not found: ${documentId}`), 404);
        }

        const documentName = docRows[0].name as string;

        let adminId: string;
        try { adminId = getUserId(c); } catch { adminId = 'system'; }

        // Find unsigned users, joining the reminder log to expose last_reminded_at.
        // The LEFT JOIN on document_reminders picks the most-recent reminder per user.
        const [unsignedRows] = await connection.execute<RowDataPacket[]>(
            `SELECT
                u.id              AS user_id,
                CONCAT(u.firstName, ' ', u.lastName) AS user_name,
                u.email,
                uda.due_date,
                uda.assigned_at,
                COALESCE(dtm.is_mandatory, 0) AS is_mandatory,
                MAX(dr.sent_at)   AS last_reminded_at
            FROM user_document_assignments uda
            INNER JOIN users u ON uda.user_id = u.id
            LEFT  JOIN document_training_metadata dtm ON uda.document_id = dtm.document_id
            LEFT  JOIN document_signatures ds
                ON ds.user_id = uda.user_id AND ds.document_id = uda.document_id
            LEFT  JOIN document_reminders dr
                ON dr.user_id = uda.user_id AND dr.document_id = uda.document_id
            WHERE uda.document_id = ?
              AND ds.id IS NULL
              AND u.email IS NOT NULL
              AND u.email != ''
            GROUP BY u.id, u.firstName, u.lastName, u.email,
                     uda.due_date, uda.assigned_at, dtm.is_mandatory`,
            [documentId]
        );

        if (unsignedRows.length === 0) {
            return c.json(ResponseService.success(
                "No unsigned users found — all assigned users have already signed this document.",
                { sent: 0, failed: 0, skipped: 0, total: 0 }
            ), 200);
        }

        const portalUrl = process.env.FRONTEND_URL || 'https://lms.disraptor.co.za/documents';
        const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();

        const eligible   = unsignedRows.filter(row =>
            !row.last_reminded_at || (now - new Date(row.last_reminded_at).getTime()) >= cooldownMs
        );
        const skipped    = unsignedRows.length - eligible.length;

        const results = await Promise.allSettled(
            eligible.map(async row => {
                await senderDocumentReminder(row.email as string, {
                    employeeName: row.user_name as string,
                    portalUrl,
                    documents: [{
                        name: documentName,
                        isMandatory: Boolean(row.is_mandatory),
                        dueDate: row.due_date
                            ? dayjs(row.due_date).format('DD MMM YYYY')
                            : undefined,
                        assignedDate: dayjs(row.assigned_at).format('DD MMM YYYY'),
                    }],
                });

                // Log the successful send
                await connection!.execute(
                    `INSERT INTO document_reminders (user_id, document_id, sent_at) VALUES (?, ?, NOW())`,
                    [row.user_id, documentId]
                );

                // Create in-app notification
                const notifId = `not_${Date.now()}_${String(row.user_id).slice(0, 8)}_doc${documentId}`;
                await connection!.execute(
                    `INSERT INTO notifications
                        (id, recipientId, createdById, type, category, title, message,
                         actionUrl, actionText, priority, relatedId, relatedType,
                         isRead, isArchived, createdAt, updatedAt)
                     VALUES (?, ?, ?, 'action_required', 'documents', ?, ?, '/documents', 'Sign Now', 'high', ?, 'document', false, false, NOW(), NOW())`,
                    [
                        notifId,
                        row.user_id,
                        adminId,
                        `Document Signature Reminder`,
                        `Please sign "${documentName}". Your signature is required.`,
                        String(documentId),
                    ]
                );
            })
        );

        const sent   = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        console.log(`Document reminders: ${sent} sent, ${failed} failed, ${skipped} skipped (24h cooldown)`);

        return c.json(ResponseService.success(
            `Reminders sent to ${sent} of ${eligible.length} eligible user${eligible.length !== 1 ? 's' : ''}. ${skipped} skipped (reminded within the last 24 hours).`,
            { sent, failed, skipped, total: unsignedRows.length }
        ), 200);

    } catch (error: any) {
        console.error("Error sending document reminders:", error);
        return c.json(ResponseService.error(
            "DocumentReminderError",
            error.message || "Failed to send document reminders."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

// GET /admin-docs/:document_id/reminders
// Returns the full reminder history for a document, showing who was reminded and when.
adminDocs.get('/:document_id/reminders', async (c) => {
    console.log("GET /admin-docs/:document_id/reminders");

    let connection;

    try {
        const { document_id } = c.req.param();
        const documentId = parseInt(document_id);

        if (isNaN(documentId)) {
            return c.json(ResponseService.error("InvalidRequest", "Document ID must be a valid number."), 400);
        }

        connection = await DatabaseService.createConnection();

        const [rows] = await connection.execute<RowDataPacket[]>(
            `SELECT
                dr.id,
                dr.sent_at,
                u.id                                 AS user_id,
                CONCAT(u.firstName, ' ', u.lastName) AS user_name,
                u.email,
                ds.signed_at IS NOT NULL             AS has_since_signed
            FROM document_reminders dr
            INNER JOIN users u ON dr.user_id = u.id
            LEFT  JOIN document_signatures ds
                ON ds.user_id = dr.user_id AND ds.document_id = dr.document_id
            WHERE dr.document_id = ?
            ORDER BY dr.sent_at DESC`,
            [documentId]
        );

        // Group into per-user summary
        const byUser = new Map<string, { userId: string; userName: string; email: string; hasSinceSignedAt: string | null; reminders: string[] }>();

        for (const row of rows) {
            if (!byUser.has(row.user_id)) {
                byUser.set(row.user_id, {
                    userId: row.user_id,
                    userName: row.user_name,
                    email: row.email,
                    hasSinceSignedAt: row.has_since_signed ? row.signed_at : null,
                    reminders: [],
                });
            }
            byUser.get(row.user_id)!.reminders.push(row.sent_at);
        }

        return c.json(ResponseService.success(
            "Reminder history retrieved successfully.",
            {
                total: rows.length,
                users: Array.from(byUser.values()),
            }
        ), 200);

    } catch (error: any) {
        console.error("Error retrieving reminder history:", error);
        return c.json(ResponseService.error(
            "ReminderHistoryError",
            error.message || "Failed to retrieve reminder history."
        ), 500);
    } finally {
        if (connection) await connection.end();
    }
});

export default adminDocs;
