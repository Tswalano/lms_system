-- CreateTable
CREATE TABLE `document_auto_assign_rules` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `document_id` BIGINT NOT NULL,
    `department_id` INTEGER NULL,
    `role` VARCHAR(50) NULL,
    `due_days` INTEGER NOT NULL DEFAULT 30,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    INDEX `document_auto_assign_rules_document_id_idx` (`document_id`),
    INDEX `document_auto_assign_rules_department_id_idx` (`department_id`),
    UNIQUE INDEX `document_auto_assign_rules_document_id_department_id_role_key` (
        `document_id`,
        `department_id`,
        `role`
    ),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `document_auto_assign_rules`
ADD CONSTRAINT `document_auto_assign_rules_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_auto_assign_rules`
ADD CONSTRAINT `document_auto_assign_rules_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
