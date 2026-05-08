-- CreateTable
CREATE TABLE `document_reminders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(36) NOT NULL,
    `document_id` BIGINT NOT NULL,
    `sent_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `document_reminders_user_id_idx`(`user_id`),
    INDEX `document_reminders_document_id_idx`(`document_id`),
    INDEX `document_reminders_sent_at_idx`(`sent_at`),
    INDEX `document_reminders_user_id_document_id_sent_at_idx`(`user_id`, `document_id`, `sent_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_reminders` ADD CONSTRAINT `document_reminders_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_reminders` ADD CONSTRAINT `document_reminders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
