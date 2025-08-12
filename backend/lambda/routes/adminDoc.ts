import { Hono } from "hono";
import { DatabaseService } from '../helpers/databaseHeler';
import { ResponseService } from '../models/apiResponse';
import { DocumentCategoryRow } from "../models/documentCategory";

const adminDocs = new Hono();

adminDocs.get('/categories', async (c) => {
    // Return all document categories 
    // TODO: Implement filtering 
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

    } finally {
        if (!!connection) await connection.end();
    }
});

adminDocs.get('/categories-with-documents', async (c) => {

    let connection;

    try {
        connection = await DatabaseService.createConnection();
        
        const selectSql = `
            SELECT 
            dc.id AS category_id,
            dc.name AS category_name,
            dc.description AS category_description,
            dc.color AS category_color,
            d.id AS document_id,
            d.name AS document_name,
            d.file_url,
            d.file_size,
            d.priority,
            d.createdAt AS document_created_at
            FROM document_categories dc
            INNER JOIN documents d ON dc.id = d.category_id
            ORDER BY dc.name ASC, d.name ASC
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

adminDocs.put("/new-category", async (c) => {

});

adminDocs.put('/new-document', async (c) => {
    console.log("create new document")
    // TODO: Determine file content type 
    const contentType = "application/pdf"; // Placeholder content type

    // TODO: Upload the document to S3 and obtain document URL 
    const s3FileUrl = "https://example.com/document.pdf"; // Placeholder URL

    // TODO: Determine file size 
    const fileSize = 123456; // Placeholder file size in bytes 

    // TODO: Add new record to the database 
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
        fileUrl
    } = await c.req.json();
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
            s3FileUrl,
            fileSize,
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
            Object.values(newDocumentRecords[0])
        );

        return c.json(response, 200);
    } finally {
        if (!!connection) await connection.end();
    }

});

export default adminDocs;
