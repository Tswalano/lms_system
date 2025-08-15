/*
  Warnings:

  - The primary key for the `document_categories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `document_categories` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `document_signatures` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `document_signatures` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - You are about to alter the column `document_id` on the `document_signatures` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `document_training_metadata` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `document_id` on the `document_training_metadata` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `document_views` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `document_views` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - You are about to alter the column `document_id` on the `document_views` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - You are about to alter the column `category_id` on the `documents` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `leave_action_log` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `leave_action_log` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - You are about to alter the column `leave_id` on the `leave_action_log` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `leave_requests` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `leave_requests` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `user_departments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_departments` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - The primary key for the `user_document_assignments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `user_document_assignments` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.
  - You are about to alter the column `document_id` on the `user_document_assignments` table. The data in that column could be lost. The data in that column will be cast from `UnsignedBigInt` to `BigInt`.

*/
-- DropForeignKey
ALTER TABLE `document_signatures` DROP FOREIGN KEY `document_signatures_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `document_training_metadata` DROP FOREIGN KEY `document_training_metadata_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `document_views` DROP FOREIGN KEY `document_views_document_id_fkey`;

-- DropForeignKey
ALTER TABLE `documents` DROP FOREIGN KEY `documents_category_id_fkey`;

-- DropForeignKey
ALTER TABLE `leave_action_log` DROP FOREIGN KEY `leave_action_log_leave_id_fkey`;

-- DropForeignKey
ALTER TABLE `user_document_assignments` DROP FOREIGN KEY `user_document_assignments_document_id_fkey`;

-- AlterTable
ALTER TABLE `document_categories` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `document_signatures` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `document_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `document_training_metadata` DROP PRIMARY KEY,
    MODIFY `document_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`document_id`);

-- AlterTable
ALTER TABLE `document_views` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `document_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `documents` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `category_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `leave_action_log` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `leave_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `leave_requests` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_departments` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `user_document_assignments` DROP PRIMARY KEY,
    MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY `document_id` BIGINT NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AddForeignKey
ALTER TABLE `leave_action_log` ADD CONSTRAINT `leave_action_log_leave_id_fkey` FOREIGN KEY (`leave_id`) REFERENCES `leave_requests`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `document_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_training_metadata` ADD CONSTRAINT `document_training_metadata_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_document_assignments` ADD CONSTRAINT `user_document_assignments_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_signatures` ADD CONSTRAINT `document_signatures_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_views` ADD CONSTRAINT `document_views_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
