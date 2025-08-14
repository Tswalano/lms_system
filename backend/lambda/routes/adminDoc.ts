import { Hono } from "hono";
import { 
    S3Client, S3ClientConfig, 
    PutObjectCommand, PutObjectCommandInput,
    DeleteObjectCommand, DeleteObjectCommandInput } from "@aws-sdk/client-s3";
import { v7 as uuid7 } from "uuid";
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
        color
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

        const categoryId = uuid7(); // Generate a unique ID for the category
        const insertStatement = `
            insert into document_categories (id, name, color, createdAt, updatedAt)
            values (?, ?, ?, NOW(), NOW());
        `;

        await connection.execute<any[]>(insertStatement, [
            categoryId,
            name,
            color
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
        
        const selectSql = `
            select 
                dc.id as category_id,
                dc.name as category_name,
                dc.description as category_description,
                dc.color as category_color,
                d.id as document_id,
                d.name as document_name,
                d.file_url,
                d.file_size,
                d.priority,
                d.createdat as document_created_at
            from document_categories dc
            left outer join documents d on dc.id = d.category_id
            order by dc.name asc, d.name asc
        `;

        const [rows] = await connection.execute<any[]>(selectSql);
        
        // Group documents under their categories
        const grouped = rows.reduce((acc, row) => {
            const {
                category_id,
                category_name,
                category_description,
                category_color,
                document_id,
                document_name,
                file_url,
                file_size,
                priority,
                document_created_at
            } = row;

            if (!acc[category_id]) {
                acc[category_id] = {
                    id: category_id,
                    name: category_name,
                    description: category_description,
                    color: category_color,
                    documents: []
                };
            }

            acc[category_id].documents.push({
                id: document_id,
                name: document_name,
                file_url,
                file_size,
                priority,
                createdAt: document_created_at
            });

            return acc;
        }, {} as Record<string, any>);

        const response = ResponseService.success(
            "Document categories with documents retrieved successfully",
            Object.values(grouped)
        );

        return c.json(response, 200);
    } finally {
        if (!!connection) await connection.end();
    }

});

adminDocs.post('/', async (c) => {
    console.log("PUT /admin-docs");

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
        id,
        name,
        uploadedBy,
        avatar,
        date,
        status,
        signatureRate,
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

    if (!!fileUrl) {
        // This document will point to an existing file
        // available publicly on the internet and, will
        // not be uploaded to S3
        finalUrl = fileUrl;
    }
    else {
        // This document will be uploaded to S3

        try {
            const s3ClientConfig: S3ClientConfig = {};
            s3Client = new S3Client(s3ClientConfig); 

            // TODO: Upload the document to S3 and obtain document URL 
            const putObjectCommandInput: PutObjectCommandInput = {
                Bucket: process.env.POLICY_DOCUMENTS_BUCKET_NAME,
                Key: `${folder}/${name}`,
                Body: Buffer.from(fileBase64, 'base64'), // Assuming content is base64 encoded
                ContentType: mimeType,
            }
            const putObjectCommand: PutObjectCommand = new PutObjectCommand(putObjectCommandInput);
            /*const putObjectResrponse: PutObjectCommandOutput = */ await s3Client.send(putObjectCommand);
            
            finalUrl = `${process.env.POLICY_DOCUMENTS_DISTRIBUTION_URL}/${folder}/${name}`;
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

    // TODO: Add new record to the database 
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
            size,
            content,
            uploadedBy
        ]);

        const fetchNewDocumentStatement = `
            select * 
            from documents
            where id = last_insert_id();
        `;

        const newDocumentRecords = await connection.execute<any[]>(fetchNewDocumentStatement);

        const response = ResponseService.success(
            "Document categories with documents retrieved successfully",
            newDocumentRecords[0][0]
        );

        return c.json(response, 200);
    } catch (databaseError: any) {
        console.error("NEW DOCUMENT ERROR: DATABASE:", databaseError);

        let responseMessage = "";
        
        if (isUploadedToS3 && s3Client) {
            // If the document was uploaded to S3 but failed to save in the database,
            // we should delete it from S3 to avoid orphaned files

            responseMessage = "Document uploaded to S3. Insert into database failed.";
            
            try {
                const deleteObjectCommandInput: DeleteObjectCommandInput = {
                    Bucket: process.env.POLICY_DOCUMENTS_BUCKET_NAME,
                    Key: `${folder}/${name}`,
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

export default adminDocs;
