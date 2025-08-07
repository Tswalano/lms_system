-- AlterTable
ALTER TABLE `document_views` ADD COLUMN `progress_data` TEXT NULL;

-- CreateTable
CREATE TABLE `document_training_metadata` (
    `document_id` INTEGER NOT NULL,
    `version` VARCHAR(50) NULL,
    `renewal_frequency` INTEGER NULL,
    `expiry_date` DATETIME(0) NULL,
    `is_mandatory` BOOLEAN NOT NULL DEFAULT false,
    `auto_assign_new_users` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `document_training_metadata_expiry_date_idx`(`expiry_date`),
    INDEX `document_training_metadata_is_mandatory_idx`(`is_mandatory`),
    INDEX `document_training_metadata_auto_assign_new_users_idx`(`auto_assign_new_users`),
    PRIMARY KEY (`document_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_training_metadata` ADD CONSTRAINT `document_training_metadata_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
