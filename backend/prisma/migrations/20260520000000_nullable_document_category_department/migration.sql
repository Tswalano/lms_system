-- Make document_categories.departmentId nullable so categories can be global (cross-department).
-- A NULL departmentId means the category — and its documents — applies to all departments.
-- The after_document_insert trigger is also updated to respect this (see sql-triggers.sql T4).

ALTER TABLE `document_categories`
  MODIFY COLUMN `departmentId` INT NULL;
