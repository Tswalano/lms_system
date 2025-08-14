-- AlterTable
ALTER TABLE `document_categories` ADD COLUMN `departmentId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `document_categories_departmentId_idx` ON `document_categories`(`departmentId`);

-- AddForeignKey
ALTER TABLE `document_categories` ADD CONSTRAINT `document_categories_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
