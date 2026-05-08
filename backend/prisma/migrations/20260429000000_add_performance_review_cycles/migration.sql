-- DropForeignKey
ALTER TABLE `performance_reviews` DROP FOREIGN KEY `performance_reviews_employeeId_fkey`;

-- DropIndex
DROP INDEX `performance_reviews_employeeId_reviewPeriod_key` ON `performance_reviews`;

-- AlterTable
ALTER TABLE `manager_feedback` ADD COLUMN `overrideNote` TEXT NULL;

-- AlterTable
ALTER TABLE `performance_reviews` ADD COLUMN `cycleId` VARCHAR(36) NULL,
    ADD COLUMN `reviewType` ENUM('self_review', 'peer_review', 'manager_appraisal') NOT NULL DEFAULT 'self_review',
    ADD COLUMN `revieweeId` VARCHAR(36) NULL,
    MODIFY `status` ENUM('not_started', 'employee_in_progress', 'employee_completed', 'manager_reviewing', 'discussion_scheduled', 'discussion_completed', 'final_review_complete', 'acknowledged', 'peer_review_pending', 'peer_reviews_in_progress', 'peer_reviews_complete') NOT NULL DEFAULT 'not_started';

-- AlterTable
ALTER TABLE `review_questions` ADD COLUMN `guidanceText` TEXT NULL,
    ADD COLUMN `reviewType` ENUM('self_review', 'peer_review', 'manager_appraisal', 'next_steps') NOT NULL DEFAULT 'self_review',
    ADD COLUMN `subcategory` VARCHAR(100) NULL,
    ADD COLUMN `weight` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `review_responses` ADD COLUMN `overrideNote` TEXT NULL,
    ADD COLUMN `overrideRating` INTEGER NULL,
    ADD COLUMN `ratingDecimal` DECIMAL(3, 2) NULL,
    ADD COLUMN `reviewerType` ENUM('self', 'peer', 'manager') NOT NULL DEFAULT 'self';

-- CreateTable
CREATE TABLE `review_cycles` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `startDate` DATE NOT NULL,
    `endDate` DATE NOT NULL,
    `status` ENUM('draft', 'active', 'closed') NOT NULL DEFAULT 'draft',
    `createdById` VARCHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `review_cycles_status_idx`(`status`),
    INDEX `review_cycles_createdById_idx`(`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `peer_review_assignments` (
    `id` VARCHAR(36) NOT NULL,
    `cycleId` VARCHAR(36) NOT NULL,
    `revieweeId` VARCHAR(36) NOT NULL,
    `reviewerId` VARCHAR(36) NOT NULL,
    `status` ENUM('pending', 'in_progress', 'completed') NOT NULL DEFAULT 'pending',
    `performanceReviewId` VARCHAR(36) NULL,
    `assignedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `completedAt` TIMESTAMP(0) NULL,

    INDEX `peer_review_assignments_cycleId_idx`(`cycleId`),
    INDEX `peer_review_assignments_revieweeId_idx`(`revieweeId`),
    INDEX `peer_review_assignments_reviewerId_idx`(`reviewerId`),
    INDEX `peer_review_assignments_status_idx`(`status`),
    UNIQUE INDEX `peer_review_assignments_cycleId_revieweeId_reviewerId_key`(`cycleId`, `revieweeId`, `reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `performance_reviews_revieweeId_idx` ON `performance_reviews`(`revieweeId`);

-- CreateIndex
CREATE INDEX `performance_reviews_cycleId_idx` ON `performance_reviews`(`cycleId`);

-- CreateIndex
CREATE INDEX `performance_reviews_reviewType_idx` ON `performance_reviews`(`reviewType`);

-- CreateIndex
CREATE UNIQUE INDEX `performance_reviews_employeeId_reviewPeriod_reviewType_revie_key` ON `performance_reviews`(`employeeId`, `reviewPeriod`, `reviewType`, `revieweeId`);

-- CreateIndex
CREATE INDEX `review_questions_reviewType_idx` ON `review_questions`(`reviewType`);

-- CreateIndex
CREATE INDEX `review_responses_reviewerType_idx` ON `review_responses`(`reviewerType`);

-- AddForeignKey
ALTER TABLE `user_departments` ADD CONSTRAINT `user_departments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_cycles` ADD CONSTRAINT `review_cycles_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_review_assignments` ADD CONSTRAINT `peer_review_assignments_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `review_cycles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_review_assignments` ADD CONSTRAINT `peer_review_assignments_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_review_assignments` ADD CONSTRAINT `peer_review_assignments_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `peer_review_assignments` ADD CONSTRAINT `peer_review_assignments_performanceReviewId_fkey` FOREIGN KEY (`performanceReviewId`) REFERENCES `performance_reviews`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_revieweeId_fkey` FOREIGN KEY (`revieweeId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `performance_reviews` ADD CONSTRAINT `performance_reviews_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `review_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
