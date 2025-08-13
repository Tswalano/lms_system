/*
  Warnings:

  - You are about to drop the column `description` on the `document_categories` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `documents` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `document_categories` DROP COLUMN `description`;

-- AlterTable
ALTER TABLE `documents` DROP COLUMN `content`;
