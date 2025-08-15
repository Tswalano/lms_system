/*
  Warnings:

  - Made the column `departmentId` on table `document_categories` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `document_categories` DROP FOREIGN KEY `document_categories_departmentId_fkey`;

-- AlterTable
ALTER TABLE `document_categories` MODIFY `departmentId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `document_categories` ADD CONSTRAINT `document_categories_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
