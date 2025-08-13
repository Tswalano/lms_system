-- ================================================
-- NOTIFICATION CENTER TRIGGERS
-- ================================================

-- Helper function to generate notification IDs (MySQL compatible)
DELIMITER / /

CREATE FUNCTION generate_notification_id() 
RETURNS VARCHAR(50)
READS SQL DATA
DETERMINISTIC
BEGIN
    RETURN CONCAT('not_', UNIX_TIMESTAMP(), '_', CONNECTION_ID(), '_', FLOOR(RAND() * 1000));
END//

DELIMITER;

-- ================================================
-- LEAVE REQUEST TRIGGERS
-- ================================================

-- Trigger: New leave request submitted
DELIMITER / /

CREATE TRIGGER notify_leave_request_submitted
    AFTER INSERT ON leave_requests
    FOR EACH ROW
BEGIN
    DECLARE manager_id VARCHAR(225);
    DECLARE employee_name VARCHAR(511);
    
    -- Get manager ID and employee name
    SELECT u.managerId, CONCAT(COALESCE(u.firstName, ''), ' ', COALESCE(u.lastName, ''))
    INTO manager_id, employee_name
    FROM users u 
    WHERE u.id = NEW.uid;
    
    -- Notify manager if exists
    IF manager_id IS NOT NULL THEN
        INSERT INTO notifications (
            id, recipientId, createdById, type, category, title, message,
            actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            manager_id,
            NEW.uid,
            'action_required',
            'leave_management',
            'New Leave Request',
            CONCAT(employee_name, ' has submitted a ', NEW.leave_type, ' request from ', 
                   DATE_FORMAT(NEW.start_date, '%M %d, %Y'), ' to ', 
                   DATE_FORMAT(NEW.end_date, '%M %d, %Y')),
            CONCAT('/leave-requests/', NEW.id),
            'Review Request',
            CAST(NEW.id AS CHAR),
            'leave_request',
            'high',
            NOW(),
            NOW()
        );
    END IF;
    
    -- Notify employee of submission
    INSERT INTO notifications (
        id, recipientId, createdById, type, category, title, message,
        actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        NEW.uid,
        NULL,
        'success',
        'leave_management',
        'Leave Request Submitted',
        CONCAT('Your ', NEW.leave_type, ' request has been submitted and is pending approval'),
        CONCAT('/leave-requests/', NEW.id),
        'View Request',
        CAST(NEW.id AS CHAR),
        'leave_request',
        'normal',
        NOW(),
        NOW()
    );
END//

DELIMITER;

-- Trigger: Leave request status changed
DELIMITER / /

CREATE TRIGGER notify_leave_status_change
    AFTER UPDATE ON leave_requests
    FOR EACH ROW
BEGIN
    DECLARE employee_name VARCHAR(511);
    DECLARE approver_name VARCHAR(511);
    DECLARE notification_type VARCHAR(50);
    DECLARE notification_title VARCHAR(255);
    DECLARE notification_message TEXT;
    
    -- Only proceed if status actually changed
    IF OLD.status != NEW.status THEN
        -- Get employee name
        SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
        INTO employee_name
        FROM users 
        WHERE id = NEW.uid;
        
        -- Get approver name if exists
        IF NEW.approved_by IS NOT NULL THEN
            SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
            INTO approver_name
            FROM users 
            WHERE id = NEW.approved_by;
        END IF;
        
        -- Set notification details based on status
        CASE NEW.status
            WHEN 'approved' THEN
                SET notification_type = 'success';
                SET notification_title = 'Leave Request Approved';
                SET notification_message = CONCAT('Your ', NEW.leave_type, ' request has been approved by ', COALESCE(approver_name, 'your manager'));
            WHEN 'rejected' THEN
                SET notification_type = 'error';
                SET notification_title = 'Leave Request Rejected';
                SET notification_message = CONCAT('Your ', NEW.leave_type, ' request has been rejected');
                IF NEW.feedback IS NOT NULL THEN
                    SET notification_message = CONCAT(notification_message, '. Reason: ', NEW.feedback);
                END IF;
            WHEN 'cancelled' THEN
                SET notification_type = 'info';
                SET notification_title = 'Leave Request Cancelled';
                SET notification_message = CONCAT('Your ', NEW.leave_type, ' request has been cancelled');
            ELSE
                SET notification_type = 'info';
                SET notification_title = 'Leave Request Updated';
                SET notification_message = CONCAT('Your ', NEW.leave_type, ' request status has been updated to ', NEW.status);
        END CASE;
        
        -- Notify employee
        INSERT INTO notifications (
            id, recipientId, createdById, type, category, title, message,
            actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            NEW.uid,
            NEW.approved_by,
            notification_type,
            'leave_management',
            notification_title,
            notification_message,
            CONCAT('/leave-requests/', NEW.id),
            'View Details',
            CAST(NEW.id AS CHAR),
            'leave_request',
            'high',
            NOW(),
            NOW()
        );
    END IF;
END//

DELIMITER;

-- ================================================
-- DOCUMENT MANAGEMENT TRIGGERS
-- ================================================

-- Trigger: Document assigned to user
DELIMITER / /

CREATE TRIGGER notify_document_assigned
    AFTER INSERT ON user_document_assignments
    FOR EACH ROW
BEGIN
    DECLARE document_name VARCHAR(500);
    DECLARE document_priority VARCHAR(20);
    DECLARE notification_priority VARCHAR(20);
    DECLARE due_message TEXT;
    
    -- Get document details
    SELECT d.name, d.priority
    INTO document_name, document_priority
    FROM documents d
    WHERE d.id = NEW.document_id;
    
    -- Set notification priority based on document priority
    CASE document_priority
        WHEN 'urgent' THEN SET notification_priority = 'urgent';
        WHEN 'high' THEN SET notification_priority = 'high';
        ELSE SET notification_priority = 'normal';
    END CASE;
    
    -- Create due date message
    IF NEW.due_date IS NOT NULL THEN
        SET due_message = CONCAT(' Due by ', DATE_FORMAT(NEW.due_date, '%M %d, %Y'));
    ELSE
        SET due_message = '';
    END IF;
    
    INSERT INTO notifications (
        id, recipientId, type, category, title, message,
        actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        NEW.user_id,
        'action_required',
        'document_management',
        'New Document Assignment',
        CONCAT('You have been assigned: "', document_name, '"', due_message),
        CONCAT('/documents/', NEW.document_id),
        'View Document',
        CAST(NEW.document_id AS CHAR),
        'document',
        notification_priority,
        NOW(),
        NOW()
    );
END//

DELIMITER;

-- Trigger: Document assignment status changed
DELIMITER / /

CREATE TRIGGER notify_document_status_change
    AFTER UPDATE ON user_document_assignments
    FOR EACH ROW
BEGIN
    DECLARE document_name VARCHAR(500);
    DECLARE creator_id VARCHAR(225);
    DECLARE user_name VARCHAR(511);
    
    -- Only proceed if status actually changed and it's a completion
    IF OLD.status != NEW.status AND NEW.status IN ('signed', 'completed') THEN
        -- Get document and user details
        SELECT d.name, d.created_by
        INTO document_name, creator_id
        FROM documents d
        WHERE d.id = NEW.document_id;
        
        SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
        INTO user_name
        FROM users
        WHERE id = NEW.user_id;
        
        -- Notify document creator if exists
        IF creator_id IS NOT NULL THEN
            INSERT INTO notifications (
                id, recipientId, createdById, type, category, title, message,
                actionUrl, relatedId, relatedType, priority, createdAt, updatedAt
            ) VALUES (
                generate_notification_id(),
                creator_id,
                NEW.user_id,
                'success',
                'document_management',
                'Document Completed',
                CONCAT(user_name, ' has ', NEW.status, ' the document: "', document_name, '"'),
                CONCAT('/documents/', NEW.document_id, '/analytics'),
                CAST(NEW.document_id AS CHAR),
                'document',
                'normal',
                NOW(),
                NOW()
            );
        END IF;
    END IF;
END//

DELIMITER;

-- Trigger: Document assignment overdue
DELIMITER / /

CREATE TRIGGER notify_document_overdue
    AFTER UPDATE ON user_document_assignments
    FOR EACH ROW
BEGIN
    DECLARE document_name VARCHAR(500);
    
    -- Only proceed if status changed to overdue
    IF OLD.status != NEW.status AND NEW.status = 'overdue' THEN
        -- Get document name
        SELECT name INTO document_name
        FROM documents
        WHERE id = NEW.document_id;
        
        INSERT INTO notifications (
            id, recipientId, type, category, title, message,
            actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            NEW.user_id,
            'warning',
            'document_management',
            'Document Overdue',
            CONCAT('URGENT: "', document_name, '" is now overdue. Please complete it immediately.'),
            CONCAT('/documents/', NEW.document_id),
            'Complete Now',
            CAST(NEW.document_id AS CHAR),
            'document',
            'urgent',
            NOW(),
            NOW()
        );
    END IF;
END//

DELIMITER;

-- ================================================
-- PERFORMANCE REVIEW TRIGGERS
-- ================================================

-- Trigger: Performance review created
DELIMITER / /

CREATE TRIGGER notify_review_created
    AFTER INSERT ON performance_reviews
    FOR EACH ROW
BEGIN
    DECLARE employee_name VARCHAR(511);
    
    -- Get employee name
    SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
    INTO employee_name
    FROM users
    WHERE id = NEW.employeeId;
    
    -- Notify employee
    INSERT INTO notifications (
        id, recipientId, createdById, type, category, title, message,
        actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        NEW.employeeId,
        NEW.createdById,
        'action_required',
        'performance_reviews',
        'Performance Review Started',
        CONCAT('Your ', NEW.reviewPeriod, ' performance review is ready to begin'),
        CONCAT('/performance-reviews/', NEW.id),
        'Start Review',
        NEW.id,
        'performance_review',
        'high',
        NOW(),
        NOW()
    );
    
    -- Notify manager
    INSERT INTO notifications (
        id, recipientId, createdById, type, category, title, message,
        actionUrl, relatedId, relatedType, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        NEW.managerId,
        NEW.createdById,
        'info',
        'performance_reviews',
        'Performance Review Assigned',
        CONCAT('You have been assigned to review ', employee_name, ' for ', NEW.reviewPeriod),
        CONCAT('/performance-reviews/', NEW.id, '/manager'),
        NEW.id,
        'performance_review',
        'normal',
        NOW(),
        NOW()
    );
END//

DELIMITER;

-- Trigger: Performance review status changed
DELIMITER / /

CREATE TRIGGER notify_review_status_change
    AFTER UPDATE ON performance_reviews
    FOR EACH ROW
BEGIN
    DECLARE employee_name VARCHAR(511);
    DECLARE manager_name VARCHAR(511);
    DECLARE notification_title VARCHAR(255);
    DECLARE notification_message TEXT;
    DECLARE recipient_id VARCHAR(225);
    DECLARE creator_id VARCHAR(225);
    
    -- Only proceed if status actually changed
    IF OLD.status != NEW.status THEN
        -- Get names
        SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
        INTO employee_name
        FROM users WHERE id = NEW.employeeId;
        
        SELECT CONCAT(COALESCE(firstName, ''), ' ', COALESCE(lastName, ''))
        INTO manager_name
        FROM users WHERE id = NEW.managerId;
        
        -- Handle different status changes
        CASE NEW.status
            WHEN 'employee_completed' THEN
                SET notification_title = 'Employee Self-Review Completed';
                SET notification_message = CONCAT(employee_name, ' has completed their self-review for ', NEW.reviewPeriod);
                SET recipient_id = NEW.managerId;
                SET creator_id = NEW.employeeId;
                
            WHEN 'manager_reviewing' THEN
                SET notification_title = 'Manager Review in Progress';
                SET notification_message = CONCAT('Your manager is now reviewing your ', NEW.reviewPeriod, ' performance');
                SET recipient_id = NEW.employeeId;
                SET creator_id = NEW.managerId;
                
            WHEN 'discussion_scheduled' THEN
                SET notification_title = 'Review Discussion Scheduled';
                SET notification_message = CONCAT('Your performance review discussion with ', manager_name, ' has been scheduled');
                SET recipient_id = NEW.employeeId;
                SET creator_id = NEW.managerId;
                
            WHEN 'discussion_completed' THEN
                SET notification_title = 'Review Discussion Completed';
                SET notification_message = CONCAT('Performance review discussion completed for ', NEW.reviewPeriod);
                SET recipient_id = NEW.employeeId;
                SET creator_id = NEW.managerId;
                
            WHEN 'final_review_complete' THEN
                SET notification_title = 'Performance Review Complete';
                SET notification_message = CONCAT('Your ', NEW.reviewPeriod, ' performance review is complete and ready for acknowledgment');
                SET recipient_id = NEW.employeeId;
                SET creator_id = NEW.managerId;
                
            ELSE
                SET notification_title = 'Performance Review Updated';
                SET notification_message = CONCAT('Your ', NEW.reviewPeriod, ' performance review status has been updated');
                SET recipient_id = NEW.employeeId;
                SET creator_id = NEW.managerId;
        END CASE;
        
        -- Insert notification
        INSERT INTO notifications (
            id, recipientId, createdById, type, category, title, message,
            actionUrl, actionText, relatedId, relatedType, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            recipient_id,
            creator_id,
            'info',
            'performance_reviews',
            notification_title,
            notification_message,
            CONCAT('/performance-reviews/', NEW.id),
            'View Review',
            NEW.id,
            'performance_review',
            'normal',
            NOW(),
            NOW()
        );
    END IF;
END//

DELIMITER;

-- ================================================
-- USER MANAGEMENT TRIGGERS
-- ================================================

-- Trigger: New user created
DELIMITER / /

CREATE TRIGGER notify_new_user_welcome
    AFTER INSERT ON users
    FOR EACH ROW
BEGIN
    -- Send welcome notification to new user
    INSERT INTO notifications (
        id, recipientId, type, category, title, message,
        actionUrl, actionText, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        NEW.id,
        'success',
        'system_updates',
        'Welcome to the HR System!',
        'Welcome to our HR platform. Please complete your profile and review important documents.',
        '/profile',
        'Complete Profile',
        'normal',
        NOW(),
        NOW()
    );
    
    -- Create default notification settings for new user
    INSERT INTO user_notification_settings (
        id, userId, emailEnabled, inAppEnabled, createdAt, updatedAt
    ) VALUES (
        CONCAT('uns_', UNIX_TIMESTAMP(), '_', CONNECTION_ID()),
        NEW.id,
        TRUE,
        TRUE,
        NOW(),
        NOW()
    );
END//

DELIMITER;

-- ================================================
-- SYSTEM MAINTENANCE TRIGGERS
-- ================================================

-- Trigger: Clean up expired notifications (to be run by scheduled job)
DELIMITER / /

CREATE PROCEDURE cleanup_expired_notifications()
BEGIN
    -- Archive expired notifications instead of deleting
    UPDATE notifications 
    SET isArchived = TRUE, updatedAt = NOW()
    WHERE expiresAt IS NOT NULL 
      AND expiresAt < NOW() 
      AND isArchived = FALSE;
      
    -- Delete very old archived notifications (older than 1 year)
    DELETE FROM notifications 
    WHERE isArchived = TRUE 
      AND createdAt < DATE_SUB(NOW(), INTERVAL 1 YEAR);
END//

DELIMITER;

-- ================================================
-- NOTIFICATION DIGEST PROCEDURES
-- ================================================

-- Procedure: Generate daily notification digest
DELIMITER / /

CREATE PROCEDURE generate_daily_digest(IN user_id VARCHAR(225))
BEGIN
    DECLARE unread_count INT;
    DECLARE urgent_count INT;
    DECLARE digest_message TEXT;
    
    -- Count unread notifications
    SELECT COUNT(*) INTO unread_count
    FROM notifications
    WHERE recipientId = user_id 
      AND isRead = FALSE 
      AND isArchived = FALSE
      AND createdAt >= DATE_SUB(NOW(), INTERVAL 1 DAY);
    
    -- Count urgent notifications
    SELECT COUNT(*) INTO urgent_count
    FROM notifications
    WHERE recipientId = user_id 
      AND isRead = FALSE 
      AND priority = 'urgent'
      AND isArchived = FALSE;
    
    -- Only create digest if there are notifications
    IF unread_count > 0 THEN
        SET digest_message = CONCAT('You have ', unread_count, ' unread notifications');
        
        IF urgent_count > 0 THEN
            SET digest_message = CONCAT(digest_message, ', including ', urgent_count, ' urgent items');
        END IF;
        
        INSERT INTO notifications (
            id, recipientId, type, category, title, message,
            actionUrl, actionText, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            user_id,
            'info',
            'system_updates',
            'Daily Notification Digest',
            digest_message,
            '/notifications',
            'View All',
            'low',
            NOW(),
            NOW()
        );
    END IF;
END//

DELIMITER;

-- ================================================
-- MANUAL NOTIFICATION PROCEDURES
-- ================================================

-- Procedure: Send custom notification
DELIMITER / /

CREATE PROCEDURE send_custom_notification(
    IN recipient_id VARCHAR(225),
    IN sender_id VARCHAR(225),
    IN notification_type VARCHAR(50),
    IN notification_category VARCHAR(50),
    IN title VARCHAR(255),
    IN message TEXT,
    IN action_url VARCHAR(500),
    IN action_text VARCHAR(100),
    IN priority VARCHAR(20)
)
BEGIN
    INSERT INTO notifications (
        id, recipientId, createdById, type, category, title, message,
        actionUrl, actionText, priority, createdAt, updatedAt
    ) VALUES (
        generate_notification_id(),
        recipient_id,
        sender_id,
        COALESCE(notification_type, 'info'),
        COALESCE(notification_category, 'general'),
        title,
        message,
        action_url,
        action_text,
        COALESCE(priority, 'normal'),
        NOW(),
        NOW()
    );
END//

DELIMITER;

-- Procedure: Broadcast notification to all users
DELIMITER / /

CREATE PROCEDURE broadcast_notification(
    IN sender_id VARCHAR(225),
    IN notification_type VARCHAR(50),
    IN notification_category VARCHAR(50),
    IN title VARCHAR(255),
    IN message TEXT,
    IN action_url VARCHAR(500),
    IN action_text VARCHAR(100),
    IN priority VARCHAR(20)
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE user_id VARCHAR(225);
    DECLARE user_cursor CURSOR FOR 
        SELECT id FROM users WHERE isActive = TRUE;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN user_cursor;
    
    read_loop: LOOP
        FETCH user_cursor INTO user_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO notifications (
            id, recipientId, createdById, type, category, title, message,
            actionUrl, actionText, priority, createdAt, updatedAt
        ) VALUES (
            generate_notification_id(),
            user_id,
            sender_id,
            COALESCE(notification_type, 'info'),
            COALESCE(notification_category, 'system_updates'),
            title,
            message,
            action_url,
            action_text,
            COALESCE(priority, 'normal'),
            NOW(),
            NOW()
        );
    END LOOP;
    
    CLOSE user_cursor;
END//

DELIMITER;

-- ================================================
-- USAGE EXAMPLES
-- ================================================

/*
-- Example: Send a custom notification
CALL send_custom_notification(
'user123',
'admin456',
'info',
'system_updates',
'System Maintenance',
'Scheduled maintenance will occur this weekend.',
'/announcements/maintenance',
'View Details',
'normal'
);

-- Example: Broadcast to all users
CALL broadcast_notification(
'admin123',
'warning',
'system_updates',
'Important Policy Update',
'Please review the updated company policies in the document center.',
'/documents/policies',
'Review Policies',
'high'
);

-- Example: Generate digest for a user
CALL generate_daily_digest('user123');

-- Example: Clean up old notifications
CALL cleanup_expired_notifications();
*/