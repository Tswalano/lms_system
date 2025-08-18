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

SELECT AUTO_INCREMENT, MAX(id) FROM notifications;