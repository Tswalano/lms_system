/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[employeeId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `departmentId` INTEGER NULL,
    ADD COLUMN `employeeId` VARCHAR(50) NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `jobLevel` VARCHAR(50) NULL,
    ADD COLUMN `managerId` VARCHAR(225) NULL,
    ADD COLUMN `roleType` ENUM('engineer', 'product_manager', 'manager', 'admin') NULL;

-- CreateTable
CREATE TABLE `performance_reviews` (
    `id` VARCHAR(50) NOT NULL,
    `reviewPeriod` VARCHAR(100) NOT NULL,
    `employeeId` VARCHAR(225) NOT NULL,
    `managerId` VARCHAR(225) NOT NULL,
    `createdById` VARCHAR(225) NULL,
    `status` ENUM('not_started', 'employee_in_progress', 'employee_completed', 'manager_reviewing', 'discussion_scheduled', 'discussion_completed', 'final_review_complete', 'acknowledged') NOT NULL DEFAULT 'not_started',
    `employeeCompletedAt` TIMESTAMP(0) NULL,
    `managerReviewCompletedAt` TIMESTAMP(0) NULL,
    `discussionCompletedAt` TIMESTAMP(0) NULL,
    `overallRating` DECIMAL(3, 2) NULL,
    `promotionRecommended` BOOLEAN NOT NULL DEFAULT false,
    `newJobLevel` VARCHAR(50) NULL,
    `finalSummary` TEXT NULL,
    `employeeAcknowledged` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `performance_reviews_employeeId_idx`(`employeeId`),
    INDEX `performance_reviews_managerId_idx`(`managerId`),
    INDEX `performance_reviews_status_idx`(`status`),
    UNIQUE INDEX `performance_reviews_employeeId_reviewPeriod_key`(`employeeId`, `reviewPeriod`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_questions` (
    `id` VARCHAR(50) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `questionText` TEXT NOT NULL,
    `questionType` ENUM('text', 'rating', 'nomination') NOT NULL,
    `phase` ENUM('self', 'peer', 'nomination') NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `review_questions_phase_idx`(`phase`),
    INDEX `review_questions_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_responses` (
    `id` VARCHAR(50) NOT NULL,
    `performanceReviewId` VARCHAR(50) NOT NULL,
    `questionId` VARCHAR(50) NOT NULL,
    `employeeId` VARCHAR(225) NOT NULL,
    `textResponse` TEXT NULL,
    `ratingResponse` INTEGER NULL,
    `nominationResponse` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `review_responses_performanceReviewId_idx`(`performanceReviewId`),
    INDEX `review_responses_questionId_idx`(`questionId`),
    INDEX `review_responses_employeeId_idx`(`employeeId`),
    UNIQUE INDEX `review_responses_performanceReviewId_questionId_key`(`performanceReviewId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `manager_feedback` (
    `id` VARCHAR(50) NOT NULL,
    `performanceReviewId` VARCHAR(50) NOT NULL,
    `managerId` VARCHAR(225) NOT NULL,
    `feedbackType` ENUM('question_comment', 'rating_adjustment', 'general_feedback', 'final_summary', 'development_goals') NOT NULL,
    `originalResponse` TEXT NULL,
    `managerComment` TEXT NULL,
    `modifiedResponse` TEXT NULL,
    `originalRating` INTEGER NULL,
    `managerRating` INTEGER NULL,
    `questionReference` VARCHAR(50) NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `manager_feedback_performanceReviewId_idx`(`performanceReviewId`),
    INDEX `manager_feedback_managerId_idx`(`managerId`),
    INDEX `manager_feedback_feedbackType_idx`(`feedbackType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `team_members` (
    `id` VARCHAR(50) NOT NULL,
    `userId` VARCHAR(225) NULL,
    `name` VARCHAR(255) NOT NULL,
    `role` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(10) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `team_members_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_email_key` ON `users`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `users_employeeId_key` ON `users`(`employeeId`);

-- CreateIndex
CREATE INDEX `users_managerId_idx` ON `users`(`managerId`);

-- CreateIndex
CREATE INDEX `users_departmentId_idx` ON `users`(`departmentId`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses` ADD CONSTRAINT `review_responses_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses` ADD CONSTRAINT `review_responses_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `review_questions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_responses` ADD CONSTRAINT `review_responses_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_feedback` ADD CONSTRAINT `manager_feedback_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `manager_feedback` ADD CONSTRAINT `manager_feedback_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
