User Document Management API

This API, built with Hono.js, provides endpoints for managing user-assigned documents, categories, progress tracking, and completion records. It integrates with a MySQL database and uses AWS Cognito for authentication. The API follows a RESTful design with standardized responses.

Base URL
http://localhost:3000

Authentication
All endpoints require authentication via AWS Cognito. Include a valid JWT token in the Authorization header. The middleware (getDecodedToken, getUserEmail, etc.) extracts user information from the token.

Response Format
All responses follow this structure:
{
  "code": string,
  "message": string,
  "error": boolean,
  "payload": object | null
}


Success: error: false, code: "SUCCESS", and payload contains the response data.
Error: error: true, code: <ERROR_CODE>, and payload may contain error details.

Endpoints
1. Get User's Assigned Documents
URL: /documents/:userId
http://localhost:3000/user-docs/documents/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Method: GET
Query Parameters:
category_id (optional): Filter by category ID.
status (optional): Filter by document status (e.g., pending, viewed, completed).


Success:
Status Code: 200
URL: /documents/:userId

{
    "code": "SUCCESS",
    "message": "User documents retrieved successfully",
    "error": false,
    "payload": [
        {
            "id": 4,
            "name": "Data Protection Training",
            "category_id": "training",
            "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
            "file_size": "320 KB",
            "priority": "high",
            "created_by": "6f329acb-665f-4841-a1f2-22af84c4c374",
            "createdAt": "2025-08-13T16:24:10.000Z",
            "updatedAt": "2025-08-13T16:24:10.000Z",
            "content": "Essential training on data protection regulations and GDPR compliance.",
            "category_name": "Training Materials",
            "category_color": "bg-purple-500",
            "status": "signed",
            "due_date": "2025-09-12T16:24:11.000Z",
            "assigned_at": "2025-08-13T16:24:11.000Z",
            "completed_at": "2025-08-13T16:24:11.000Z",
            "version": "v2.0",
            "is_mandatory": 1,
            "expiry_date": "2025-09-21T22:00:00.000Z",
            "current_status": "signed",
            "has_been_viewed": 1
        }
    ]
}





Failure:
Status Code: 500
URL: /documents/:userId
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





2. Get Specific Document Content
URL: /document-content/:documentId/:userId
http://localhost:3000/user-docs/document-content/4/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Method: GET
Success:
Status Code: 200
URL: /document-content/:documentId/:userId
Payload:{
    "code": "SUCCESS",
    "message": "Document content accessed successfully",
    "error": false,
    "payload": {
        "document_id": "4",
        "name": "Data Protection Training",
        "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        "content": "Essential training on data protection regulations and GDPR compliance.",
        "category_id": "training",
        "version": "v2.0",
        "is_mandatory": 1,
        "access_granted": true
    }
}




Failure:
Status Code: 403 (Access Denied) or 500 (Internal Server Error)
URL: /document-content/:documentId/:userId
Payload:{
  "code": "ACCESS_DENIED" | "INTERNAL_SERVER_ERROR",
  "message": "User does not have access to this document" | "Internal server error",
  "error": true,
  "payload": null
}





3. Get Document Categories
URL: /document-categories
http://localhost:3000/user-docs/document-categories

Method: GET
Success:
Status Code: 200
URL: /document-categories

Payload:{
    "code": "SUCCESS",
    "message": "Document categories retrieved successfully",
    "error": false,
    "payload": [
        {
            "id": "benefits",
            "name": "Benefits & HR",
            "description": null,
            "color": "bg-orange-500",
            "document_count": 1
        },
        {
            "id": "policies",
            "name": "Company Policies",
            "description": null,
            "color": "bg-blue-500",
            "document_count": 4
        },
        {
            "id": "contracts",
            "name": "Employment Documents",
            "description": null,
            "color": "bg-green-500",
            "document_count": 1
        },
        {
            "id": "0198a778-951c-71ce-943f-ede3c57425a1",
            "name": "my-cool-folder-name",
            "description": null,
            "color": "bg-blue-500",
            "document_count": 5
        },
        {
            "id": "0198a815-0e7f-7468-8752-9b33737b6dfc",
            "name": "Test Spaced o",
            "description": null,
            "color": "bg-orange-500",
            "document_count": 1
        },
        {
            "id": "training",
            "name": "Training Materials",
            "description": null,
            "color": "bg-purple-500",
            "document_count": 4
        },
        {
            "id": "0198a7c4-051f-74de-882f-54b3de331388",
            "name": "uncontroller-folder-04",
            "description": null,
            "color": "bg-red-500",
            "document_count": 1
        }
    ]
}




Failure:
Status Code: 500
URL: /document-categories
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





4. Track Document Reading Progress
URL: /document-progress
http://localhost:3000/user-docs/document-progress

Method: POST
Request Body:{
  "user_id": "90f19835-c07c-4f3e-9b66-7f686bdde1ca",
  "document_id": 4,
  "progress_data": { "page": 1 },
  "time_spent": 120,
  "duration": 120

}


Success:
Status Code: 200
URL: /document-progress
Payload:{
    "code": "SUCCESS",
    "message": "Document progress saved successfully",
    "error": false,
    "payload": {
        "user_id": "90f19835-c07c-4f3e-9b66-7f686bdde1ca",
        "document_id": 4
    }
}




Failure:
Status Code: 400 (Invalid Input) or 500 (Internal Server Error)
URL: /document-progress
Payload:{
  "code": "INVALID_INPUT" | "INTERNAL_SERVER_ERROR",
  "message": "user_id and document_id are required" | "Internal server error",
  "error": true,
  "payload": null
}





5. Submit Document Completion/Acknowledgement
URL: /document-completion
http://localhost:3000/user-docs/document-completion

Method: POST
Request Body:{
  "user_id": "90f19835-c07c-4f3e-9b66-7f686bdde1ca",
  "document_id": 4,
  "acknowledgement_checked": true
}


Success:
Status Code: 200
URL: /document-completion
Payload:{
    "code": "SUCCESS",
    "message": "Document completed successfully",
    "error": false,
    "payload": {
        "user_id": "90f19835-c07c-4f3e-9b66-7f686bdde1ca",
        "document_id": 4,
        "completed_at": "2025-08-14T12:25:25.921Z",
        "acknowledgement_checked": true
    }
}




Failure:
Status Code: 400 (Invalid Input or Access Required) or 500 (Internal Server Error)
URL: /document-completion
Payload:{
  "code": "INVALID_INPUT" | "ACCESS_REQUIRED" | "INTERNAL_SERVER_ERROR",
  "message": "user_id, document_id, and acknowledgement_checked are required" | "Document must be viewed before completion" | "Internal server error",
  "error": true,
  "payload": null
}





6. Get User Document Statistics
URL: /document-stats/:userId

Method: GET
Success:
Status Code: 200
URL: /document-stats/:userId
http://localhost:3000/user-docs/document-stats/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Payload:{
    "code": "SUCCESS",
    "message": "User document statistics retrieved successfully",
    "error": false,
    "payload": {
        "overall_stats": {
            "total_assigned": 7,
            "completed": 3,
            "pending": 0,
            "viewed": 0,
            "overdue": 0,
            "mandatory_pending": 2,
            "completion_percentage": "42.86"
        },
        "recent_activity": [
            {
                "document_name": "Software Development Standards",
                "category_name": "Training Materials",
                "status": "signed",
                "due_date": "2025-11-30T22:00:00.000Z",
                "completed_at": "2025-11-14T22:00:00.000Z",
                "is_mandatory": 0,
                "current_status": "signed"
            },
            {
                "document_name": "Benefits Handbook 2025",
                "category_name": "Benefits & HR",
                "status": "completed",
                "due_date": "2025-11-14T22:00:00.000Z",
                "completed_at": "2025-08-14T07:13:57.000Z",
                "is_mandatory": null,
                "current_status": "completed"
            },
            {
                "document_name": "Employment Contract Template",
                "category_name": "Employment Documents",
                "status": "signed",
                "due_date": "2025-10-31T22:00:00.000Z",
                "completed_at": "2025-10-24T22:00:00.000Z",
                "is_mandatory": null,
                "current_status": "signed"
            },
            {
                "document_name": "Data Protection Training",
                "category_name": "Training Materials",
                "status": "completed",
                "due_date": "2025-09-12T16:24:11.000Z",
                "completed_at": "2025-08-14T10:25:26.000Z",
                "is_mandatory": 1,
                "current_status": "completed"
            },
            {
                "document_name": "Whistleblowing Policy v2.1",
                "category_name": "Company Policies",
                "status": "signed",
                "due_date": "2025-09-12T16:24:11.000Z",
                "completed_at": "2025-08-13T16:24:11.000Z",
                "is_mandatory": 1,
                "current_status": "signed"
            },
            {
                "document_name": "Ethics and Anti-Corruption Policy",
                "category_name": "Company Policies",
                "status": "completed",
                "due_date": "2025-09-12T16:24:11.000Z",
                "completed_at": "2025-08-14T10:22:08.000Z",
                "is_mandatory": 1,
                "current_status": "completed"
            },
            {
                "document_name": "Safety Guidelines",
                "category_name": "Training Materials",
                "status": "signed",
                "due_date": "2025-09-12T16:24:11.000Z",
                "completed_at": "2025-08-13T16:24:11.000Z",
                "is_mandatory": 1,
                "current_status": "signed"
            }
        ],
        "category_breakdown": [
            {
                "category_name": "Benefits & HR",
                "color": "bg-orange-500",
                "total_in_category": 1,
                "completed_in_category": 1,
                "category_completion_percentage": "100.00"
            },
            {
                "category_name": "Company Policies",
                "color": "bg-blue-500",
                "total_in_category": 2,
                "completed_in_category": 1,
                "category_completion_percentage": "50.00"
            },
            {
                "category_name": "Employment Documents",
                "color": "bg-green-500",
                "total_in_category": 1,
                "completed_in_category": 0,
                "category_completion_percentage": "0.00"
            },
            {
                "category_name": "Training Materials",
                "color": "bg-purple-500",
                "total_in_category": 3,
                "completed_in_category": 1,
                "category_completion_percentage": "33.33"
            }
        ]
    }
}




Failure:
Status Code: 500
URL: /document-stats/:userId
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





7. Get User Document Activity History
URL: /document-activity/:userId
http://localhost:3000/user-docs/document-activity/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Method: GET
Query Parameters:
days (optional, default: 30): Filter activities within the last X days.
document_id (optional): Filter by specific document ID.


Success:
Status Code: 200
URL: /document-activity/:userId
Payload:{
    "code": "SUCCESS",
    "message": "User document activity retrieved successfully",
    "error": false,
    "payload": [
        {
            "activity_type": "signature",
            "document_name": "Data Protection Training",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-08-14T10:25:26.000Z",
            "duration": null,
            "signed_at": "2025-08-14T10:25:26.000Z"
        },
        {
            "activity_type": "signature",
            "document_name": "Ethics and Anti-Corruption Policy",
            "category_name": "Company Policies",
            "activity_timestamp": "2025-08-14T10:22:08.000Z",
            "duration": null,
            "signed_at": "2025-08-14T10:22:08.000Z"
        },
        {
            "activity_type": "view",
            "document_name": "Data Protection Training",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-08-14T10:10:28.000Z",
            "duration": 120,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Ethics and Anti-Corruption Policy",
            "category_name": "Company Policies",
            "activity_timestamp": "2025-08-14T08:50:48.000Z",
            "duration": null,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Benefits Handbook 2025",
            "category_name": "Benefits & HR",
            "activity_timestamp": "2025-08-14T08:50:35.000Z",
            "duration": null,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Data Protection Training",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-08-14T08:46:01.000Z",
            "duration": null,
            "signed_at": null
        },
        {
            "activity_type": "signature",
            "document_name": "Benefits Handbook 2025",
            "category_name": "Benefits & HR",
            "activity_timestamp": "2025-08-14T07:13:57.000Z",
            "duration": null,
            "signed_at": "2025-08-14T07:13:57.000Z"
        },
        {
            "activity_type": "signature",
            "document_name": "Whistleblowing Policy v2.1",
            "category_name": "Company Policies",
            "activity_timestamp": "2025-08-13T16:24:11.000Z",
            "duration": null,
            "signed_at": "2025-08-13T16:24:11.000Z"
        },
        {
            "activity_type": "signature",
            "document_name": "Safety Guidelines",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-08-13T16:24:11.000Z",
            "duration": null,
            "signed_at": "2025-08-13T16:24:11.000Z"
        },
        {
            "activity_type": "view",
            "document_name": "Benefits Handbook 2025",
            "category_name": "Benefits & HR",
            "activity_timestamp": "2025-08-07T16:24:13.000Z",
            "duration": 699,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Safety Guidelines",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-07-27T16:24:13.000Z",
            "duration": 361,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Software Development Standards",
            "category_name": "Training Materials",
            "activity_timestamp": "2025-07-20T16:24:13.000Z",
            "duration": 896,
            "signed_at": null
        },
        {
            "activity_type": "view",
            "document_name": "Ethics and Anti-Corruption Policy",
            "category_name": "Company Policies",
            "activity_timestamp": "2025-07-16T16:24:13.000Z",
            "duration": 555,
            "signed_at": null
        }
    ]
}




Failure:
Status Code: 500
URL: /document-activity/:userId
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





8. Get User Completion Records
URL: /completion-records/:userId
http://localhost:3000/user-docs/completion-records/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Method: GET
Query Parameters:
category_id (optional): Filter by category ID.


Success:
Status Code: 200
URL: /completion-records/:userId
Payload:{
    "code": "SUCCESS",
    "message": "User completion records retrieved successfully",
    "error": false,
    "payload": [
        {
            "document_id": 4,
            "document_name": "Data Protection Training",
            "category_name": "Training Materials",
            "version": "v2.0",
            "is_mandatory": 1,
            "completed_at": "2025-08-14T10:25:26.000Z",
            "signed_at": "2025-08-14T10:25:26.000Z",
            "ip_address": "unknown",
            "total_time_spent": "120"
        },
        {
            "document_id": 8,
            "document_name": "Ethics and Anti-Corruption Policy",
            "category_name": "Company Policies",
            "version": "v1.0",
            "is_mandatory": 1,
            "completed_at": "2025-08-14T10:22:08.000Z",
            "signed_at": "2025-08-14T10:22:08.000Z",
            "ip_address": "unknown",
            "total_time_spent": "555"
        },
        {
            "document_id": 5,
            "document_name": "Benefits Handbook 2025",
            "category_name": "Benefits & HR",
            "version": null,
            "is_mandatory": null,
            "completed_at": "2025-08-14T07:13:57.000Z",
            "signed_at": "2025-08-14T07:13:57.000Z",
            "ip_address": "unknown",
            "total_time_spent": "699"
        }
    ]
}




Failure:
Status Code: 500
URL: /completion-records/:userId
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





9. Search Documents for User
URL: /search-documents/:userId
http://localhost:3000/user-docs/search-documents/90f19835-c07c-4f3e-9b66-7f686bdde1ca?q=Data Protection Training

Method: GET
Query Parameters:
q (required): Search query (minimum 2 characters).
category_id (optional): Filter by category ID.
status (optional): Filter by document status.
is_mandatory (optional): Filter by mandatory status (true or false).


Success:
Status Code: 200
URL: /search-documents/:userId
Payload:{
    "code": "SUCCESS",
    "message": "Document search completed successfully",
    "error": false,
    "payload": {
        "query": "Data Protection Training",
        "total_results": 1,
        "results": [
            {
                "id": 4,
                "name": "Data Protection Training",
                "category_id": "training",
                "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                "file_size": "320 KB",
                "priority": "high",
                "created_by": "6f329acb-665f-4841-a1f2-22af84c4c374",
                "createdAt": "2025-08-13T16:24:10.000Z",
                "updatedAt": "2025-08-13T16:24:10.000Z",
                "content": "Essential training on data protection regulations and GDPR compliance.",
                "category_name": "Training Materials",
                "category_color": "bg-purple-500",
                "status": "completed",
                "due_date": "2025-09-12T16:24:11.000Z",
                "assigned_at": "2025-08-13T16:24:11.000Z",
                "completed_at": "2025-08-14T10:25:26.000Z",
                "version": "v2.0",
                "is_mandatory": 1,
                "expiry_date": "2025-09-21T22:00:00.000Z",
                "current_status": "completed"
            }
        ]
    }
}




Failure:
Status Code: 400 (Invalid Input) or 500 (Internal Server Error)
URL: /search-documents/:userId
Payload:{
  "code": "INVALID_INPUT" | "INTERNAL_SERVER_ERROR",
  "message": "Search query must be at least 2 characters long" | "Internal server error",
  "error": true,
  "payload": null
}





10. Get All Documents in Each Category
URL: /categories-with-documents
http://localhost:3000/user-docs/categories-with-documents

Method: GET
Success:
Status Code: 200
URL: /categories-with-documents
Payload:{
    "code": "SUCCESS",
    "message": "Document categories with documents retrieved successfully",
    "error": false,
    "payload": [
        {
            "id": "benefits",
            "name": "Benefits & HR",
            "description": null,
            "color": "bg-orange-500",
            "documents": [
                {
                    "id": 5,
                    "name": "Benefits Handbook 2025",
                    "file_url": "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
                    "file_size": "1.2 MB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "policies",
            "name": "Company Policies",
            "description": null,
            "color": "bg-blue-500",
            "documents": [
                {
                    "id": 8,
                    "name": "Ethics and Anti-Corruption Policy",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/cli_admin_user_accessKeys.csv",
                    "file_size": "428 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 1,
                    "name": "Marketing Guidelines",
                    "file_url": "/marketing-guidelines.pdf",
                    "file_size": "430 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 10,
                    "name": "Remote Work Policy",
                    "file_url": "/sample-document.pdf",
                    "file_size": "180 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 7,
                    "name": "Whistleblowing Policy v2.1",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/Disraptor_Whistleblowing_Policy_final.docx",
                    "file_size": "245 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "contracts",
            "name": "Employment Documents",
            "description": null,
            "color": "bg-green-500",
            "documents": [
                {
                    "id": 6,
                    "name": "Employment Contract Template",
                    "file_url": "https://pdfobject.com/pdf/sample.pdf",
                    "file_size": "892 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "0198a778-951c-71ce-943f-ede3c57425a1",
            "name": "my-cool-folder-name",
            "description": null,
            "color": "bg-blue-500",
            "documents": [
                {
                    "id": 14,
                    "name": "The Fourth Policy",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a778-951c-71ce-943f-ede3c57425a1/The Fourth Policy",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T05:56:43.000Z"
                },
                {
                    "id": 16,
                    "name": "The Latest-Latest Policy",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a778-951c-71ce-943f-ede3c57425a1/The Latest-Latest Policy",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T07:19:22.000Z"
                },
                {
                    "id": 12,
                    "name": "The Other Policy",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a778-951c-71ce-943f-ede3c57425a1/The Other Policy",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T05:46:20.000Z"
                },
                {
                    "id": 11,
                    "name": "The Policy",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a778-951c-71ce-943f-ede3c57425a1/The Policy",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T05:43:40.000Z"
                },
                {
                    "id": 13,
                    "name": "The Third Policy",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a778-951c-71ce-943f-ede3c57425a1/The Third Policy",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T05:52:49.000Z"
                }
            ]
        },
        {
            "id": "0198a815-0e7f-7468-8752-9b33737b6dfc",
            "name": "Test Spaced o",
            "description": null,
            "color": "bg-orange-500",
            "documents": [
                {
                    "id": 17,
                    "name": "Test new document",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a815-0e7f-7468-8752-9b33737b6dfc/Test new document",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T08:18:50.000Z"
                }
            ]
        },
        {
            "id": "training",
            "name": "Training Materials",
            "description": null,
            "color": "bg-purple-500",
            "documents": [
                {
                    "id": 4,
                    "name": "Data Protection Training",
                    "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    "file_size": "320 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 9,
                    "name": "Safety Guidelines",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/DR_Staff+Training_2025.pptx",
                    "file_size": "156 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 2,
                    "name": "Sales Process Manual",
                    "file_url": "/sales-manual.pdf",
                    "file_size": "890 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 3,
                    "name": "Software Development Standards",
                    "file_url": "/dev-standards.pdf",
                    "file_size": "650 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "0198a7c4-051f-74de-882f-54b3de331388",
            "name": "uncontroller-folder-04",
            "description": null,
            "color": "bg-red-500",
            "documents": [
                {
                    "id": 15,
                    "name": "Uncontrolled Document 02",
                    "file_url": "https://d32y4rtgjuxgm6.cloudfront.net/0198a7c4-051f-74de-882f-54b3de331388/Uncontrolled Document 02",
                    "file_size": "723 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-14T06:49:45.000Z"
                }
            ]
        }
    ]
}




Failure:
Status Code: 500
URL: /categories-with-documents
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





11. Get User-Specific Documents in Each Category
URL: /categories-with-documents/:userId
http://localhost:3000/user-docs/categories-with-documents/90f19835-c07c-4f3e-9b66-7f686bdde1ca

Method: GET
Success:
Status Code: 200
URL: /categories-with-documents/:userId
Payload:{
    "code": "SUCCESS",
    "message": "User-specific document categories retrieved successfully",
    "error": false,
    "payload": [
        {
            "id": "benefits",
            "name": "Benefits & HR",
            "description": null,
            "color": "bg-orange-500",
            "documents": [
                {
                    "id": 5,
                    "name": "Benefits Handbook 2025",
                    "file_url": "https://www.learningcontainer.com/wp-content/uploads/2019/09/sample-pdf-file.pdf",
                    "file_size": "1.2 MB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "policies",
            "name": "Company Policies",
            "description": null,
            "color": "bg-blue-500",
            "documents": [
                {
                    "id": 8,
                    "name": "Ethics and Anti-Corruption Policy",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/cli_admin_user_accessKeys.csv",
                    "file_size": "428 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 7,
                    "name": "Whistleblowing Policy v2.1",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/Disraptor_Whistleblowing_Policy_final.docx",
                    "file_size": "245 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "contracts",
            "name": "Employment Documents",
            "description": null,
            "color": "bg-green-500",
            "documents": [
                {
                    "id": 6,
                    "name": "Employment Contract Template",
                    "file_url": "https://pdfobject.com/pdf/sample.pdf",
                    "file_size": "892 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        },
        {
            "id": "training",
            "name": "Training Materials",
            "description": null,
            "color": "bg-purple-500",
            "documents": [
                {
                    "id": 4,
                    "name": "Data Protection Training",
                    "file_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
                    "file_size": "320 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 9,
                    "name": "Safety Guidelines",
                    "file_url": "https://disraptor-website.s3.eu-west-1.amazonaws.com/docs/DR_Staff+Training_2025.pptx",
                    "file_size": "156 KB",
                    "priority": "medium",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                },
                {
                    "id": 3,
                    "name": "Software Development Standards",
                    "file_url": "/dev-standards.pdf",
                    "file_size": "650 KB",
                    "priority": "high",
                    "createdAt": "2025-08-13T16:24:10.000Z"
                }
            ]
        }
    ]
}




Failure:
Status Code: 500
URL: /categories-with-documents/:userId
Payload:{
  "code": "INTERNAL_SERVER_ERROR",
  "message": "Internal server error",
  "error": true,
  "payload": null
}





Notes

All dates in responses are in ISO 8601 format (e.g., 2025-08-14T11:29:00.000Z).
Ensure the database schema matches the queries, including tables like user_document_assignments, documents, document_categories, document_training_metadata, document_views, and document_signatures.
The API uses parameterized queries to prevent SQL injection.
Connections to the MySQL database are managed with proper cleanup using finally blocks.

Dependencies

Hono: Web framework for routing.
MySQL2: For database interactions.
AWS SDK: For Cognito authentication.
Node.js Crypto: For generating UUIDs.

Setup

Configure the MySQL database with the required schema.
Set up AWS Cognito for authentication and configure the middleware.
Install dependencies:npm install hono @aws-sdk/client-cognito-identity-provider mysql2


Deploy the API to a server (e.g., AWS Lambda, Node.js server).
Replace http://localhost:3000 with your actual API base URL.
