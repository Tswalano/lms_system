-- ================================================
-- 🔔 NOTIFICATION CENTER TRIGGERS — COMPREHENSIVE
-- ================================================
-- Valid types     : info | success | warning | error | reminder | action_required
-- Valid priorities: low | normal | high | urgent
-- Valid categories: leave_management | document_management | performance_reviews
--                   system_updates | security | general
--
-- HOW TO APPLY:
--   Run this entire file against the MySQL database to drop and recreate all
--   triggers. Safe to re-run — every trigger is dropped first.
-- ================================================

-- ================================================
-- SECTION 1: LEAVE MANAGEMENT
-- ================================================

-- --------------------------------------------------
-- T1: New leave submitted → notify all admins
-- --------------------------------------------------
DROP TRIGGER IF EXISTS after_leave_request_insert;

DELIMITER $$

CREATE TRIGGER after_leave_request_insert
AFTER INSERT ON leave_requests
FOR EACH ROW
BEGIN
    INSERT INTO notifications (
        recipientId, createdById, type, category,
        title, message, actionUrl, actionText,
        priority, relatedId, relatedType, createdAt, updatedAt
    )
    SELECT
        u.id,
        NEW.uid,
        'action_required',
        'leave_management',
        'New Leave Request Submitted',
        CONCAT(
            'A new ', NEW.leave_type, ' request has been submitted by ',
            emp.firstName, ' ', emp.lastName, ' from ',
            DATE_FORMAT(NEW.start_date, '%d %b %Y'), ' to ',
            DATE_FORMAT(NEW.end_date, '%d %b %Y'), '.'
        ),
        '/approve-leave',
        'Review Request',
        'normal',
        NEW.id,
        'leave_request',
        NOW(),
        NOW()
    FROM users u
    JOIN users emp ON emp.id = NEW.uid   -- ✅ FIX HERE
    WHERE u.roleType = 'admin'
      AND u.id <> NEW.uid;
END$$

DELIMITER;

-- --------------------------------------------------
-- T2: Leave status changed → notify employee or admins
--
--   approved          → employee gets 'success' (normal priority)
--   rejected          → employee gets 'warning' with feedback (high priority)
--   cancelled ← approved → employee gets 'warning' (admin cancelled their leave)
--   cancelled ← pending  → admins get 'info' (employee withdrew request)
-- --------------------------------------------------
DROP TRIGGER IF EXISTS after_leave_request_update;

DELIMITER $$

CREATE TRIGGER after_leave_request_update
AFTER UPDATE ON leave_requests
FOR EACH ROW
BEGIN

    -- ── APPROVED ── notify the employee
    IF NEW.status = 'approved' AND OLD.status <> 'approved' THEN
        INSERT INTO notifications (
            recipientId, createdById, type, category,
            title, message, actionUrl,
            priority, relatedId, relatedType, createdAt, updatedAt
        )
        VALUES (
            NEW.uid,
            NEW.approved_by,
            'success',
            'leave_management',
            'Leave Request Approved',
            CONCAT(
                'Your ', NEW.leave_type, ' request from ',
                DATE_FORMAT(NEW.start_date, '%d %b %Y'), ' to ',
                DATE_FORMAT(NEW.end_date, '%d %b %Y'), ' has been approved.'
            ),
            '/my-leave-requests',
            'normal',
            NEW.id,
            'leave_request',
            NOW(),
            NOW()
        );
    END IF;

    -- ── REJECTED ── notify the employee; include feedback when provided
    IF NEW.status = 'rejected' AND OLD.status <> 'rejected' THEN
        INSERT INTO notifications (
            recipientId, createdById, type, category,
            title, message, actionUrl,
            priority, relatedId, relatedType, createdAt, updatedAt
        )
        VALUES (
            NEW.uid,
            NEW.approved_by,
            'warning',
            'leave_management',
            'Leave Request Rejected',
            CONCAT(
                'Your ', NEW.leave_type, ' request from ',
                DATE_FORMAT(NEW.start_date, '%d %b %Y'), ' to ',
                DATE_FORMAT(NEW.end_date, '%d %b %Y'), ' has been rejected.',
                IF(
                    NEW.feedback IS NOT NULL AND TRIM(NEW.feedback) <> '',
                    CONCAT(' Reason: ', NEW.feedback),
                    ' No reason was provided.'
                )
            ),
            '/my-leave-requests',
            'high',
            NEW.id,
            'leave_request',
            NOW(),
            NOW()
        );
    END IF;

    -- ── APPROVED → CANCELLED ── admin cancelled an already-approved leave
    --    Notify the employee so they can replan
    IF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
        INSERT INTO notifications (
            recipientId, createdById, type, category,
            title, message, actionUrl,
            priority, relatedId, relatedType, createdAt, updatedAt
        )
        VALUES (
            NEW.uid,
            NULL,
            'warning',
            'leave_management',
            'Approved Leave Cancelled',
            CONCAT(
                'Your approved ', NEW.leave_type, ' leave from ',
                DATE_FORMAT(NEW.start_date, '%d %b %Y'), ' to ',
                DATE_FORMAT(NEW.end_date, '%d %b %Y'), ' has been cancelled.',
                IF(
                    NEW.feedback IS NOT NULL AND TRIM(NEW.feedback) <> '',
                    CONCAT(' Reason: ', NEW.feedback),
                    ''
                )
            ),
            '/my-leave-requests',
            'high',
            NEW.id,
            'leave_request',
            NOW(),
            NOW()
        );
    END IF;

    -- ── PENDING → CANCELLED ── employee withdrew their own request
    --    Notify admins (low priority — no action needed)
    IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
        INSERT INTO notifications (
            recipientId, createdById, type, category,
            title, message,
            priority, relatedId, relatedType, createdAt, updatedAt
        )
        SELECT
            u.id,
            NEW.uid,
            'info',
            'leave_management',
            'Leave Request Withdrawn',
            CONCAT(
                emp.firstName, ' ', emp.lastName, ' withdrew their ',
                NEW.leave_type, ' request from ',
                DATE_FORMAT(NEW.start_date, '%d %b %Y'), ' to ',
                DATE_FORMAT(NEW.end_date, '%d %b %Y'), '.'
            ),
            'low',
            NEW.id,
            'leave_request',
            NOW(),
            NOW()
        FROM users u
        WHERE u.roleType = 'admin'
          AND u.id <> NEW.uid;
    END IF;

END$$

DELIMITER;

-- ================================================
-- SECTION 2: DOCUMENT MANAGEMENT
-- ================================================

-- --------------------------------------------------
-- T3: Document assigned to a user → notify that user
--     (fires for each row inserted into user_document_assignments,
--      including the batch-insert triggered by T4 below)
-- --------------------------------------------------
DROP TRIGGER IF EXISTS after_document_assignment_insert;

DELIMITER $$

CREATE TRIGGER after_document_assignment_insert
AFTER INSERT ON user_document_assignments
FOR EACH ROW
BEGIN
    INSERT INTO notifications (
        recipientId, createdById, type, category,
        title, message, actionUrl, actionText,
        priority, relatedId, relatedType, createdAt, updatedAt
    )
    SELECT
        NEW.user_id,
        NULL,
        'action_required',
        'document_management',
        'New Document Assigned',
        CONCAT(
            'A new document "', d.name,
            '" has been assigned to you. Please review and acknowledge it.'
        ),
        '/documents',
        'View Document',
        'normal',
        NEW.document_id,
        'document',
        NOW(),
        NOW()
    FROM documents d
    WHERE d.id = NEW.document_id;
END$$

DELIMITER;

-- --------------------------------------------------
-- T4: New document uploaded → auto-assign to all users in the same department
--     Individual assignment notifications are fired automatically by T3 above.
-- --------------------------------------------------
DROP TRIGGER IF EXISTS after_document_insert;

DELIMITER $$

CREATE TRIGGER after_document_insert
AFTER INSERT ON documents
FOR EACH ROW
BEGIN
    INSERT IGNORE INTO user_document_assignments (user_id, document_id, status, assigned_at)
    SELECT ud.user_id, NEW.id, 'pending', NOW()
    FROM user_departments ud
    JOIN document_categories dc ON dc.id = NEW.category_id
    WHERE ud.department_id = dc.departmentId;
END$$

DELIMITER;

-- --------------------------------------------------
-- T5: User acknowledges / completes a document
--     → notify all admins (low priority, audit trail)
-- --------------------------------------------------
DROP TRIGGER IF EXISTS after_document_assignment_update;

DELIMITER $$

CREATE TRIGGER after_document_assignment_update
AFTER UPDATE ON user_document_assignments
FOR EACH ROW
BEGIN
    IF NEW.status IN ('read', 'acknowledged', 'completed') AND OLD.status = 'pending' THEN
        INSERT INTO notifications (
            recipientId, createdById, type, category,
            title, message, actionUrl,
            priority, relatedId, relatedType, createdAt, updatedAt
        )
        SELECT
            u.id,
            NEW.user_id,
            'info',
            'document_management',
            'Document Acknowledged',
            CONCAT(
                (SELECT CONCAT(firstName, ' ', lastName) FROM users WHERE id = NEW.user_id LIMIT 1),
                ' has acknowledged "',
                (SELECT name FROM documents WHERE id = NEW.document_id LIMIT 1),
                '".'
            ),
            '/documents',
            'low',
            NEW.document_id,
            'document',
            NOW(),
            NOW()
        FROM users u
        WHERE u.roleType = 'admin';
    END IF;
END$$

DELIMITER;

-- ================================================
-- SECTION 3: PERFORMANCE REVIEWS
-- (Triggers to be added after DB migrations — see ROADMAP.md)
-- ================================================
-- Planned:
--   after_review_cycle_insert
--       → notify all nominated reviewers (action_required, high priority)
--   after_performance_review_update (status: submitted)
--       → notify manager / HR (info)
--   Deadline reminders require a scheduled job (cannot be done with triggers)
-- ================================================