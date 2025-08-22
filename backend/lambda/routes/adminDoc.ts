import { Hono } from "hono";
import {
    S3Client, S3ClientConfig,
    PutObjectCommand, PutObjectCommandInput,
    DeleteObjectCommand, DeleteObjectCommandInput
} from "@aws-sdk/client-s3";
import dayjs from "dayjs";
import mysql from 'mysql2/promise';
import { extension } from "mime-types";
import { DatabaseService } from '../helpers/databaseHeler';
import { ResponseService } from '../models/apiResponse';
import { DocumentCategoryRow } from "../models/documentCategory";

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

adminDocs.post('/assignments', async (c) => {
    console.log("POST /assignments");

    const requestBody = await c.req.json();
    const {
        userId,
        documentId,
        dueDate
    } = requestBody;

    let connection: mysql.Connection | null = null;

    if (!dueDate || !userId || !documentId) {
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

    // TODO: Ensure that due date is in the future 
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

        // TODO: Send notification 

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
                    id: u.user_id,
                    name: u.user_name,
                    signedAt: u.signed_at
                })),
                notSigned: notSignedUsers.map(u => ({
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
    }
})

export default adminDocs;
