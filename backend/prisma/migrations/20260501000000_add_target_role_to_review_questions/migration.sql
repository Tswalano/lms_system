-- Add targetRole to review_questions so employee vs manager/admin appraisal questions can differ
ALTER TABLE `review_questions` ADD COLUMN `targetRole` VARCHAR(50) NULL;

-- Existing manager_appraisal questions are employee-facing (engineering-focused)
UPDATE `review_questions` SET `targetRole` = 'employee' WHERE `reviewType` = 'manager_appraisal';
