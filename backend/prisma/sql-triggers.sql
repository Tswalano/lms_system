-- ================================================
-- NOTIFICATION CENTER TRIGGER
-- ================================================
DROP TRIGGER IF EXISTS after_document_assignment_insert;

DELIMITER $$

CREATE TRIGGER after_document_assignment_insert
AFTER INSERT ON user_document_assignments
FOR EACH ROW
BEGIN
    INSERT INTO notifications (
        recipientId,
        createdById,
        type,
        category,
        title,
        message,
        relatedId,
        relatedType,
        createdAt,
        updatedAt
    )
    SELECT
        NEW.user_id,
        NULL,
        'info',
        'document_management',
        'New Document Assigned',
        CONCAT('A new document "', d.name, '" has been assigned to you.'),
        NEW.document_id,
        'document',
        NOW(),
        NOW()
    FROM documents d
    WHERE d.id = NEW.document_id;
END$$

DELIMITER;

-- ================================================
-- DOCUMENT ASSIGNMENT TRIGGER
-- ================================================
DROP TRIGGER IF EXISTS after_document_insert;

DELIMITER $$

CREATE TRIGGER after_document_insert
AFTER INSERT ON documents
FOR EACH ROW
BEGIN
    -- Assign the new document to all users in the same department as the document category
    INSERT IGNORE INTO user_document_assignments (user_id, document_id, status, assigned_at)
    SELECT ud.user_id, NEW.id, 'pending', NOW()
    FROM user_departments ud
    JOIN document_categories dc ON dc.id = NEW.category_id
    WHERE ud.department_id = dc.departmentId;
END$$

DELIMITER;