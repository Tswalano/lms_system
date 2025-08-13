-- AlterTable
ALTER TABLE `document_categories` ADD COLUMN `description` TEXT NULL;

-- AlterTable
ALTER TABLE `documents` ADD COLUMN `content` TEXT NULL;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(50) NOT NULL,
    `recipientId` VARCHAR(225) NOT NULL,
    `createdById` VARCHAR(225) NULL,
    `type` ENUM('info', 'success', 'warning', 'error', 'reminder', 'action_required') NOT NULL,
    `category` ENUM('leave_management', 'document_management', 'performance_reviews', 'system_updates', 'security', 'general') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `actionUrl` VARCHAR(500) NULL,
    `actionText` VARCHAR(100) NULL,
    `imageUrl` VARCHAR(500) NULL,
    `relatedId` VARCHAR(50) NULL,
    `relatedType` VARCHAR(50) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `readAt` TIMESTAMP(0) NULL,
    `priority` ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
    `scheduledFor` TIMESTAMP(0) NULL,
    `expiresAt` TIMESTAMP(0) NULL,
    `metadata` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `notifications_recipientId_idx`(`recipientId`),
    INDEX `notifications_recipientId_isRead_idx`(`recipientId`, `isRead`),
    INDEX `notifications_recipientId_isArchived_idx`(`recipientId`, `isArchived`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_category_idx`(`category`),
    INDEX `notifications_priority_idx`(`priority`),
    INDEX `notifications_scheduledFor_idx`(`scheduledFor`),
    INDEX `notifications_expiresAt_idx`(`expiresAt`),
    INDEX `notifications_relatedId_relatedType_idx`(`relatedId`, `relatedType`),
    INDEX `notifications_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notification_settings` (
    `id` VARCHAR(50) NOT NULL,
    `userId` VARCHAR(225) NOT NULL,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailLeaveRequests` BOOLEAN NOT NULL DEFAULT true,
    `emailDocuments` BOOLEAN NOT NULL DEFAULT true,
    `emailPerformanceReviews` BOOLEAN NOT NULL DEFAULT true,
    `emailSystemUpdates` BOOLEAN NOT NULL DEFAULT true,
    `emailMarketing` BOOLEAN NOT NULL DEFAULT false,
    `inAppEnabled` BOOLEAN NOT NULL DEFAULT true,
    `inAppLeaveRequests` BOOLEAN NOT NULL DEFAULT true,
    `inAppDocuments` BOOLEAN NOT NULL DEFAULT true,
    `inAppPerformanceReviews` BOOLEAN NOT NULL DEFAULT true,
    `inAppSystemUpdates` BOOLEAN NOT NULL DEFAULT true,
    `pushEnabled` BOOLEAN NOT NULL DEFAULT false,
    `pushLeaveRequests` BOOLEAN NOT NULL DEFAULT false,
    `pushDocuments` BOOLEAN NOT NULL DEFAULT false,
    `pushPerformanceReviews` BOOLEAN NOT NULL DEFAULT false,
    `pushSystemUpdates` BOOLEAN NOT NULL DEFAULT false,
    `digestFrequency` ENUM('never', 'daily', 'weekly', 'monthly') NOT NULL DEFAULT 'daily',
    `quietHoursStart` VARCHAR(5) NULL,
    `quietHoursEnd` VARCHAR(5) NULL,
    `timezone` VARCHAR(50) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `user_notification_settings_userId_idx`(`userId`),
    UNIQUE INDEX `user_notification_settings_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(50) NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `type` ENUM('info', 'success', 'warning', 'error', 'reminder', 'action_required') NOT NULL,
    `category` ENUM('leave_management', 'document_management', 'performance_reviews', 'system_updates', 'security', 'general') NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `actionText` VARCHAR(100) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `description` TEXT NULL,
    `variables` TEXT NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `notification_templates_code_key`(`code`),
    INDEX `notification_templates_type_idx`(`type`),
    INDEX `notification_templates_category_idx`(`category`),
    INDEX `notification_templates_isActive_idx`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_recipientId_fkey` FOREIGN KEY (`recipientId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notification_settings` ADD CONSTRAINT `user_notification_settings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
