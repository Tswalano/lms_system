-- CreateTable
CREATE TABLE `document_audit_log` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `document_id` BIGINT NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `action` ENUM('signed', 'viewed', 'reminded', 'version_updated', 'expiring_soon', 'expired', 'assigned', 'unassigned') NOT NULL,
    `performed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `metadata` JSON NULL,
    INDEX `document_audit_log_document_id_idx` (`document_id`),
    INDEX `document_audit_log_user_id_idx` (`user_id`),
    INDEX `document_audit_log_action_idx` (`action`),
    INDEX `document_audit_log_performed_at_idx` (`performed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_audit_log`
ADD CONSTRAINT `document_audit_log_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_audit_log`
ADD CONSTRAINT `document_audit_log_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
