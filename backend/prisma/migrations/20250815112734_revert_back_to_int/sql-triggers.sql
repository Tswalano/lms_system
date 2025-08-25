-- ================================================
-- 🚨 NOTIFICATION CENTER TRIGGERS
-- ================================================

-- ==================================================
-- 1. Document Assignment → Notify user when assigned
-- ==================================================
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

-- ==================================================
-- 2. Leave Requests → Notify admins when submitted
-- ==================================================
DROP TRIGGER IF EXISTS after_leave_request_insert;

DELIMITER $$

CREATE TRIGGER after_leave_request_insert
AFTER INSERT ON leave_requests
FOR EACH ROW
BEGIN
    -- Insert notifications for all admins except the requester
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
        u.id,
        NEW.uid,
        'info',
        'leave_management',
        'New Leave Request Submitted',
        CONCAT('A new leave request submitted by from ',
               DATE_FORMAT(NEW.start_date, '%Y-%m-%d'), ' to ', DATE_FORMAT(NEW.end_date, '%Y-%m-%d')),
        NEW.id,
        'leave_request',
        NOW(),
        NOW()
    FROM users u
    WHERE u.roleType = 'admin'
      AND u.id <> NEW.uid;
END$$

DELIMITER;

-- ==================================================
-- 3. Leave Requests → Notify requester when approved/rejected
-- ==================================================
DROP TRIGGER IF EXISTS after_leave_request_update;

DELIMITER $$

CREATE TRIGGER after_leave_request_update
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN
    -- Only trigger if status changed to approved/rejected
    IF NEW.status IN ('approved', 'rejected') AND OLD.status <> NEW.status THEN
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
        VALUES (
            NEW.uid,                       -- notify the employee
            NEW.approved_by,               -- approver (could be NULL if system)
            IF(NEW.status = 'approved', 'rejected', 'cancelled'),
            'leave_management',
            CONCAT('Leave Request ', UPPER(NEW.status)),
            CONCAT('Your leave request from ',
                   DATE_FORMAT(NEW.start_date, '%Y-%m-%d'), ' to ',
                   DATE_FORMAT(NEW.end_date, '%Y-%m-%d'),
                   ' has been ', NEW.status, '.'),
            NEW.id,
            'leave_request',
            NOW(),
            NOW()
        );
    END IF;
END$$

DELIMITER;

-- ================================================
-- 📄 DOCUMENT MANAGEMENT TRIGGERS
-- ================================================

-- ==================================================
-- 4. Auto-assign documents to users in same department
-- ==================================================
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

-- ==================================================
-- 5. Auto-assign documents to users in same department
-- ==================================================
DROP TRIGGER IF EXISTS after_user_create;

DELIMITER $$

CREATE TRIGGER after_user_create
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    
    

END$$

DELIMITER;
