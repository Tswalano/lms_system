-- -- DropForeignKey
-- ALTER TABLE `leave_requests` DROP FOREIGN KEY `fk_approved_by_user`;

-- -- DropForeignKey
-- -- ALTER TABLE `leave_action_log` DROP FOREIGN KEY `leave_action_log_ibfk_1`;

-- -- DropForeignKey
-- ALTER TABLE `leave_action_log`
-- DROP FOREIGN KEY `leave_action_log_ibfk_2`;

-- -- DropIndex
-- DROP INDEX `id` ON `leave_requests`;

-- -- AlterTable
-- ALTER TABLE `users`
-- DROP PRIMARY KEY,
-- ADD COLUMN `departmentId` INTEGER NULL,
-- ADD COLUMN `employeeId` VARCHAR(50) NULL,
-- ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
-- ADD COLUMN `jobLevel` VARCHAR(50) NULL,
-- ADD COLUMN `managerId` VARCHAR(36) NULL,
-- ADD COLUMN `roleType` ENUM(
--     'engineer',
--     'product_manager',
--     'manager',
--     'admin'
-- ) NULL,
-- MODIFY `id` VARCHAR(36) NOT NULL,
-- MODIFY `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
-- MODIFY `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
-- ADD PRIMARY KEY (`id`);

-- -- AlterTable
-- ALTER TABLE `leave_requests`
-- DROP PRIMARY KEY,
-- ADD COLUMN `outlook_personal_event_id` VARCHAR(512) NULL,
-- ADD COLUMN `outlook_shared_event_id` VARCHAR(512) NULL,
-- MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
-- MODIFY `status` ENUM(
--     'pending',
--     'approved',
--     'rejected',
--     'cancelled'
-- ) NOT NULL DEFAULT 'pending',
-- MODIFY `approved_by` VARCHAR(36) NULL,
-- ADD PRIMARY KEY (`id`);

-- -- AlterTable
-- ALTER TABLE `leave_action_log`
-- DROP PRIMARY KEY,
-- MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
-- MODIFY `leave_id` BIGINT NOT NULL,
-- MODIFY `manager_id` VARCHAR(36) NULL,
-- ADD PRIMARY KEY (`id`);

-- -- DropTable
-- DROP TABLE `atlas_schema_revisions`;

-- -- DropTable
-- DROP TABLE `invitations`;

-- -- CreateTable
-- CREATE TABLE `document_categories` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `name` VARCHAR(255) NOT NULL,
--     `description` TEXT NULL,
--     `color` VARCHAR(50) NULL,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `departmentId` INTEGER NOT NULL,
--     INDEX `document_categories_departmentId_idx` (`departmentId`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `documents` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `name` VARCHAR(500) NOT NULL,
--     `category_id` BIGINT NOT NULL,
--     `file_url` TEXT NOT NULL,
--     `file_size` VARCHAR(50) NULL,
--     `content` TEXT NULL,
--     `priority` ENUM(
--         'low',
--         'medium',
--         'high',
--         'urgent'
--     ) NOT NULL DEFAULT 'medium',
--     `created_by` VARCHAR(36) NULL,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `status` ENUM(
--         'active',
--         'archived',
--         'deleted',
--         'expire'
--     ) NOT NULL DEFAULT 'active',
--     INDEX `documents_category_id_idx` (`category_id`),
--     INDEX `documents_created_by_idx` (`created_by`),
--     INDEX `documents_priority_idx` (`priority`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `document_training_metadata` (
--     `document_id` BIGINT NOT NULL,
--     `version` VARCHAR(50) NULL,
--     `renewal_frequency` INTEGER NULL,
--     `expiry_date` DATETIME(0) NULL,
--     `is_mandatory` BOOLEAN NOT NULL DEFAULT false,
--     `auto_assign_new_users` BOOLEAN NOT NULL DEFAULT false,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `document_training_metadata_expiry_date_idx` (`expiry_date`),
--     INDEX `document_training_metadata_is_mandatory_idx` (`is_mandatory`),
--     INDEX `document_training_metadata_auto_assign_new_users_idx` (`auto_assign_new_users`),
--     PRIMARY KEY (`document_id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `user_document_assignments` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `user_id` VARCHAR(36) NOT NULL,
--     `document_id` BIGINT NOT NULL,
--     `status` ENUM(
--         'pending',
--         'viewed',
--         'signed',
--         'overdue',
--         'completed'
--     ) NOT NULL DEFAULT 'pending',
--     `due_date` DATETIME(0) NULL,
--     `assigned_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `completed_at` TIMESTAMP(0) NULL,
--     INDEX `user_document_assignments_user_id_idx` (`user_id`),
--     INDEX `user_document_assignments_document_id_idx` (`document_id`),
--     INDEX `user_document_assignments_status_idx` (`status`),
--     INDEX `user_document_assignments_due_date_idx` (`due_date`),
--     UNIQUE INDEX `user_document_assignments_user_id_document_id_key` (`user_id`, `document_id`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `document_signatures` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `user_id` VARCHAR(36) NOT NULL,
--     `document_id` BIGINT NOT NULL,
--     `signed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `document_signatures_user_id_idx` (`user_id`),
--     INDEX `document_signatures_document_id_idx` (`document_id`),
--     UNIQUE INDEX `document_signatures_user_id_document_id_key` (`user_id`, `document_id`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `document_views` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `user_id` VARCHAR(36) NOT NULL,
--     `document_id` BIGINT NOT NULL,
--     `viewed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `ip_address` VARCHAR(45) NULL,
--     `duration` INTEGER NULL,
--     `progress_data` TEXT NULL,
--     INDEX `document_views_user_id_idx` (`user_id`),
--     INDEX `document_views_document_id_idx` (`document_id`),
--     INDEX `document_views_viewed_at_idx` (`viewed_at`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `document_reminders` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `user_id` VARCHAR(36) NOT NULL,
--     `document_id` BIGINT NOT NULL,
--     `sent_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `document_reminders_user_id_idx` (`user_id`),
--     INDEX `document_reminders_document_id_idx` (`document_id`),
--     INDEX `document_reminders_sent_at_idx` (`sent_at`),
--     INDEX `document_reminders_user_id_document_id_sent_at_idx` (
--         `user_id`,
--         `document_id`,
--         `sent_at`
--     ),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `departments` (
--     `id` INTEGER NOT NULL AUTO_INCREMENT,
--     `name` VARCHAR(255) NOT NULL,
--     `description` TEXT NULL,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `user_departments` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `user_id` VARCHAR(36) NOT NULL,
--     `department_id` INTEGER NOT NULL,
--     INDEX `user_departments_user_id_idx` (`user_id`),
--     INDEX `user_departments_department_id_idx` (`department_id`),
--     UNIQUE INDEX `user_departments_user_id_department_id_key` (`user_id`, `department_id`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `notifications` (
--     `id` BIGINT NOT NULL AUTO_INCREMENT,
--     `recipientId` VARCHAR(36) NOT NULL,
--     `createdById` VARCHAR(36) NULL,
--     `type` ENUM(
--         'info',
--         'success',
--         'warning',
--         'error',
--         'reminder',
--         'action_required'
--     ) NOT NULL,
--     `category` ENUM(
--         'leave_management',
--         'document_management',
--         'performance_reviews',
--         'system_updates',
--         'security',
--         'general'
--     ) NOT NULL,
--     `title` VARCHAR(255) NOT NULL,
--     `message` TEXT NOT NULL,
--     `actionUrl` VARCHAR(500) NULL,
--     `actionText` VARCHAR(100) NULL,
--     `imageUrl` VARCHAR(500) NULL,
--     `relatedId` VARCHAR(36) NULL,
--     `relatedType` VARCHAR(50) NULL,
--     `isRead` BOOLEAN NOT NULL DEFAULT false,
--     `isArchived` BOOLEAN NOT NULL DEFAULT false,
--     `readAt` TIMESTAMP(0) NULL,
--     `priority` ENUM(
--         'low',
--         'normal',
--         'high',
--         'urgent'
--     ) NOT NULL DEFAULT 'normal',
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `notifications_recipientId_idx` (`recipientId`),
--     INDEX `notifications_recipientId_isRead_idx` (`recipientId`, `isRead`),
--     INDEX `notifications_recipientId_isArchived_idx` (`recipientId`, `isArchived`),
--     INDEX `notifications_type_idx` (`type`),
--     INDEX `notifications_category_idx` (`category`),
--     INDEX `notifications_priority_idx` (`priority`),
--     INDEX `notifications_relatedId_relatedType_idx` (`relatedId`, `relatedType`),
--     INDEX `notifications_createdAt_idx` (`createdAt`),
--     INDEX `notifications_createdById_fkey` (`createdById`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `review_cycles` (
--     `id` VARCHAR(36) NOT NULL,
--     `name` VARCHAR(100) NOT NULL,
--     `startDate` DATE NOT NULL,
--     `endDate` DATE NOT NULL,
--     `status` ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
--     `createdById` VARCHAR(36) NULL,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `review_cycles_status_idx` (`status`),
--     INDEX `review_cycles_createdById_idx` (`createdById`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `peer_review_assignments` (
--     `id` VARCHAR(36) NOT NULL,
--     `cycleId` VARCHAR(36) NOT NULL,
--     `revieweeId` VARCHAR(36) NOT NULL,
--     `reviewerId` VARCHAR(36) NOT NULL,
--     `status` ENUM(
--         'pending',
--         'in_progress',
--         'completed'
--     ) NOT NULL DEFAULT 'pending',
--     `performanceReviewId` VARCHAR(36) NULL,
--     `assignedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `completedAt` TIMESTAMP(0) NULL,
--     INDEX `peer_review_assignments_cycleId_idx` (`cycleId`),
--     INDEX `peer_review_assignments_revieweeId_idx` (`revieweeId`),
--     INDEX `peer_review_assignments_reviewerId_idx` (`reviewerId`),
--     INDEX `peer_review_assignments_status_idx` (`status`),
--     UNIQUE INDEX `peer_review_assignments_cycleId_revieweeId_reviewerId_key` (
--         `cycleId`,
--         `revieweeId`,
--         `reviewerId`
--     ),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `performance_reviews` (
--     `id` VARCHAR(36) NOT NULL,
--     `reviewPeriod` VARCHAR(100) NOT NULL,
--     `cycleId` VARCHAR(36) NULL,
--     `reviewType` ENUM(
--         'self_review',
--         'peer_review',
--         'manager_appraisal'
--     ) NOT NULL DEFAULT 'self_review',
--     `employeeId` VARCHAR(36) NOT NULL,
--     `managerId` VARCHAR(36) NOT NULL,
--     `revieweeId` VARCHAR(36) NULL,
--     `createdById` VARCHAR(36) NULL,
--     `status` ENUM(
--         'not_started',
--         'employee_in_progress',
--         'employee_completed',
--         'manager_reviewing',
--         'discussion_scheduled',
--         'discussion_completed',
--         'final_review_complete',
--         'acknowledged',
--         'peer_review_pending',
--         'peer_reviews_in_progress',
--         'peer_reviews_complete'
--     ) NOT NULL DEFAULT 'not_started',
--     `employeeCompletedAt` DATETIME(3) NULL,
--     `managerReviewCompletedAt` DATETIME(3) NULL,
--     `discussionCompletedAt` DATETIME(3) NULL,
--     `overallRating` DECIMAL(3, 2) NULL,
--     `promotionRecommended` BOOLEAN NOT NULL DEFAULT false,
--     `newJobLevel` VARCHAR(50) NULL,
--     `finalSummary` TEXT NULL,
--     `employeeAcknowledged` BOOLEAN NOT NULL DEFAULT false,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `performance_reviews_employeeId_idx` (`employeeId`),
--     INDEX `performance_reviews_managerId_idx` (`managerId`),
--     INDEX `performance_reviews_revieweeId_idx` (`revieweeId`),
--     INDEX `performance_reviews_cycleId_idx` (`cycleId`),
--     INDEX `performance_reviews_status_idx` (`status`),
--     INDEX `performance_reviews_reviewType_idx` (`reviewType`),
--     INDEX `performance_reviews_createdById_fkey` (`createdById`),
--     UNIQUE INDEX `performance_reviews_employeeId_reviewPeriod_reviewType_revie_key` (
--         `employeeId`,
--         `reviewPeriod`,
--         `reviewType`,
--         `revieweeId`
--     ),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `review_questions` (
--     `id` VARCHAR(36) NOT NULL,
--     `category` VARCHAR(100) NOT NULL,
--     `subcategory` VARCHAR(100) NULL,
--     `questionText` TEXT NOT NULL,
--     `guidanceText` TEXT NULL,
--     `questionType` ENUM(
--         'text',
--         'rating',
--         'nomination'
--     ) NOT NULL,
--     `phase` ENUM('self', 'peer', 'nomination') NOT NULL,
--     `reviewType` ENUM(
--         'self_review',
--         'peer_review',
--         'manager_appraisal',
--         'next_steps'
--     ) NOT NULL DEFAULT 'self_review',
--     `targetRole` VARCHAR(50) NULL,
--     `weight` DECIMAL(5, 2) NULL,
--     `displayOrder` INTEGER NOT NULL DEFAULT 0,
--     `isActive` BOOLEAN NOT NULL DEFAULT true,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `review_questions_phase_idx` (`phase`),
--     INDEX `review_questions_reviewType_idx` (`reviewType`),
--     INDEX `review_questions_isActive_idx` (`isActive`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `review_responses` (
--     `id` VARCHAR(36) NOT NULL,
--     `performanceReviewId` VARCHAR(36) NOT NULL,
--     `questionId` VARCHAR(36) NOT NULL,
--     `employeeId` VARCHAR(36) NOT NULL,
--     `reviewerType` ENUM('self', 'peer', 'manager') NOT NULL DEFAULT 'self',
--     `textResponse` TEXT NULL,
--     `ratingResponse` INTEGER NULL,
--     `ratingDecimal` DECIMAL(3, 2) NULL,
--     `nominationResponse` TEXT NULL,
--     `overrideRating` INTEGER NULL,
--     `overrideNote` TEXT NULL,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `review_responses_performanceReviewId_idx` (`performanceReviewId`),
--     INDEX `review_responses_questionId_idx` (`questionId`),
--     INDEX `review_responses_employeeId_idx` (`employeeId`),
--     INDEX `review_responses_reviewerType_idx` (`reviewerType`),
--     UNIQUE INDEX `review_responses_performanceReviewId_questionId_key` (
--         `performanceReviewId`,
--         `questionId`
--     ),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateTable
-- CREATE TABLE `manager_feedback` (
--     `id` VARCHAR(36) NOT NULL,
--     `performanceReviewId` VARCHAR(36) NOT NULL,
--     `managerId` VARCHAR(36) NOT NULL,
--     `feedbackType` ENUM(
--         'question_comment',
--         'rating_adjustment',
--         'general_feedback',
--         'final_summary',
--         'development_goals'
--     ) NOT NULL,
--     `originalResponse` TEXT NULL,
--     `managerComment` TEXT NULL,
--     `modifiedResponse` TEXT NULL,
--     `originalRating` INTEGER NULL,
--     `managerRating` INTEGER NULL,
--     `questionReference` VARCHAR(36) NULL,
--     `overrideNote` TEXT NULL,
--     `isVisible` BOOLEAN NOT NULL DEFAULT true,
--     `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
--     INDEX `manager_feedback_performanceReviewId_idx` (`performanceReviewId`),
--     INDEX `manager_feedback_managerId_idx` (`managerId`),
--     INDEX `manager_feedback_feedbackType_idx` (`feedbackType`),
--     PRIMARY KEY (`id`)
-- ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- -- CreateIndex
-- CREATE UNIQUE INDEX `users_email_key` ON `users` (`email`);

-- -- CreateIndex
-- CREATE UNIQUE INDEX `users_employeeId_key` ON `users` (`employeeId`);

-- -- CreateIndex
-- CREATE INDEX `users_managerId_idx` ON `users` (`managerId`);

-- -- CreateIndex
-- CREATE INDEX `users_departmentId_idx` ON `users` (`departmentId`);

-- -- CreateIndex
-- CREATE INDEX `leave_requests_uid_idx` ON `leave_requests` (`uid`);

-- -- AddForeignKey
-- ALTER TABLE `users`
-- ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `users`
-- ADD CONSTRAINT `users_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `leave_requests`
-- ADD CONSTRAINT `fk_approved_by_user` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE NO ACTION;

-- -- AddForeignKey
-- ALTER TABLE `leave_action_log`
-- ADD CONSTRAINT `leave_action_log_leave_id_fkey` FOREIGN KEY (`leave_id`) REFERENCES `leave_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `leave_action_log`
-- ADD CONSTRAINT `leave_action_log_manager_id_fkey` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_categories`
-- ADD CONSTRAINT `document_categories_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `documents`
-- ADD CONSTRAINT `documents_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `document_categories` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `documents`
-- ADD CONSTRAINT `documents_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_training_metadata`
-- ADD CONSTRAINT `document_training_metadata_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `user_document_assignments`
-- ADD CONSTRAINT `user_document_assignments_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `user_document_assignments`
-- ADD CONSTRAINT `user_document_assignments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_signatures`
-- ADD CONSTRAINT `document_signatures_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_signatures`
-- ADD CONSTRAINT `document_signatures_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_views`
-- ADD CONSTRAINT `document_views_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_views`
-- ADD CONSTRAINT `document_views_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_reminders`
-- ADD CONSTRAINT `document_reminders_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `document_reminders`
-- ADD CONSTRAINT `document_reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `user_departments`
-- ADD CONSTRAINT `user_departments_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `user_departments`
-- ADD CONSTRAINT `user_departments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `notifications`
-- ADD CONSTRAINT `notifications_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `notifications`
-- ADD CONSTRAINT `notifications_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `review_cycles`
-- ADD CONSTRAINT `review_cycles_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `peer_review_assignments`
-- ADD CONSTRAINT `peer_review_assignments_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `review_cycles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `peer_review_assignments`
-- ADD CONSTRAINT `peer_review_assignments_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE `peer_review_assignments`
-- ADD CONSTRAINT `peer_review_assignments_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `peer_review_assignments`
-- ADD CONSTRAINT `peer_review_assignments_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
-- ALTER TABLE `performance_reviews`
-- ADD CONSTRAINT `performance_reviews_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- -- AddForeignKey
-- ALTER TABLE `performance_reviews`
-- ADD CONSTRAINT `performance_reviews_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews`
ADD CONSTRAINT `performance_reviews_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews`
ADD CONSTRAINT `performance_reviews_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews`
ADD CONSTRAINT `performance_reviews_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `review_cycles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses`
ADD CONSTRAINT `review_responses_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses`
ADD CONSTRAINT `review_responses_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses`
ADD CONSTRAINT `review_responses_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `review_questions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_feedback`
ADD CONSTRAINT `manager_feedback_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_feedback`
ADD CONSTRAINT `manager_feedback_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- -- RenameIndex
-- ALTER TABLE `leave_action_log`
-- RENAME INDEX `leave_id` TO `leave_action_log_leave_id_idx`;

-- -- RenameIndex
-- ALTER TABLE `leave_action_log`
-- RENAME INDEX `manager_id` TO `leave_action_log_manager_id_idx`;