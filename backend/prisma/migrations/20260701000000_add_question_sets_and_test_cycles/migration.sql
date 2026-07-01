-- AlterTable
ALTER TABLE `review_cycles`
ADD COLUMN `isTest` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `question_sets` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdById` VARCHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    INDEX `question_sets_isDefault_idx` (`isDefault`),
    INDEX `question_sets_isActive_idx` (`isActive`),
    INDEX `question_sets_createdById_idx` (`createdById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `question_set_questions` (
    `id` VARCHAR(36) NOT NULL,
    `questionSetId` VARCHAR(36) NOT NULL,
    `questionId` VARCHAR(36) NOT NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    INDEX `question_set_questions_questionId_idx` (`questionId`),
    UNIQUE INDEX `question_set_questions_questionSetId_questionId_key` (
        `questionSetId`,
        `questionId`
    ),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_question_set_assignments` (
    `id` VARCHAR(36) NOT NULL,
    `employeeId` VARCHAR(36) NOT NULL,
    `questionSetId` VARCHAR(36) NOT NULL,
    `cycleId` VARCHAR(36) NULL,
    `assignedById` VARCHAR(36) NULL,
    `createdAt` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    INDEX `employee_question_set_assignments_cycleId_idx` (`cycleId`),
    INDEX `employee_question_set_assignments_questionSetId_idx` (`questionSetId`),
    UNIQUE INDEX `employee_question_set_assignments_employeeId_cycleId_key` (
        `employeeId`,
        `cycleId`
    ),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `question_sets`
ADD CONSTRAINT `question_sets_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_set_questions`
ADD CONSTRAINT `question_set_questions_questionSetId_fkey` FOREIGN KEY (`questionSetId`) REFERENCES `question_sets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `question_set_questions`
ADD CONSTRAINT `question_set_questions_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `review_questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_question_set_assignments`
ADD CONSTRAINT `employee_question_set_assignments_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_question_set_assignments`
ADD CONSTRAINT `employee_question_set_assignments_questionSetId_fkey` FOREIGN KEY (`questionSetId`) REFERENCES `question_sets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_question_set_assignments`
ADD CONSTRAINT `employee_question_set_assignments_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `review_cycles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
