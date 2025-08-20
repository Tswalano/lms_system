SELECT
    u.*,
    d.id AS department_id,
    d.name AS department_name
FROM
    users u
    LEFT JOIN user_departments ud ON ud.user_id = u.id
    LEFT JOIN departments d ON d.id = ud.department_id;

SELECT * FROM user_document_assignments;

SHOW TRIGGERS;

SHOW TRIGGERS WHERE `Table` = 'documents'\G

SHOW CREATE TABLE notifications;

-- Signature percentage across all documents and users:
-- This query calculates the percentage of users who have signed documents out of all users assigned documents.
SELECT ROUND(
        (
            COUNT(
                DISTINCT CONCAT(
                    ds.user_id, '-', ds.document_id
                )
            ) * 100.0
        ) / COUNT(
            DISTINCT CONCAT(
                uda.user_id, '-', uda.document_id
            )
        ), 2
    ) as signature_percentage
FROM
    user_document_assignments uda
    LEFT JOIN document_signatures ds ON uda.user_id = ds.user_id
    AND uda.document_id = ds.document_id;

-- Signature percentage per document:
-- This query calculates the percentage of users who have signed each document out of all users assigned to that document.
-- It groups by document ID and name, providing a count of total assigned users and total signed users.
-- The percentage is calculated as (total signed / total assigned) * 100, rounded to two decimal places.
-- It orders the results by signature percentage in descending order.

SELECT
    d.id as document_id,
    d.name as document_name,
    COUNT(uda.user_id) as total_assigned,
    COUNT(ds.user_id) as total_signed,
    CASE
        WHEN COUNT(uda.user_id) > 0 THEN ROUND(
            (COUNT(ds.user_id) * 100.0) / COUNT(uda.user_id),
            2
        )
        ELSE 0
    END as signature_percentage
FROM
    documents d
    LEFT JOIN user_document_assignments uda ON d.id = uda.document_id
    LEFT JOIN document_signatures ds ON uda.user_id = ds.user_id
    AND uda.document_id = ds.document_id
GROUP BY
    d.id,
    d.name
ORDER BY signature_percentage DESC;

-- Signature percentage per user:
-- This query calculates the percentage of documents signed by each user out of the total documents assigned to them.
-- It groups by user ID and name, providing a count of total assigned documents and total signed documents.
-- The percentage is calculated as (total signed / total assigned) * 100, rounded to two decimal places.
-- It orders the results by signature percentage in ascending order.
SELECT
    u.id as user_id,
    CONCAT(u.firstName, ' ', u.lastName) as user_name,
    COUNT(uda.document_id) as documents_assigned,
    COUNT(ds.document_id) as documents_signed,
    CASE
        WHEN COUNT(uda.document_id) > 0 THEN ROUND(
            (COUNT(ds.document_id) * 100.0) / COUNT(uda.document_id),
            2
        )
        ELSE 0
    END as signature_percentage
FROM
    users u
    LEFT JOIN user_document_assignments uda ON u.id = uda.user_id
    LEFT JOIN document_signatures ds ON u.id = ds.user_id
    AND uda.document_id = ds.document_id
WHERE
    u.isActive = true
GROUP BY
    u.id,
    u.firstName,
    u.lastName
ORDER BY signature_percentage ASC;

Select * from notifications;