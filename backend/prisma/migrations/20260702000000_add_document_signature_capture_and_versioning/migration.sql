-- AlterTable: document_training_metadata.version was an unused String? placeholder;
-- repurpose it as the real version counter used by document re-uploads.
-- Existing rows (if any) get a clean numeric default rather than trying to parse old string values.
ALTER TABLE `document_training_metadata`
    DROP COLUMN `version`;

ALTER TABLE `document_training_metadata`
    ADD COLUMN `version` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `document_signatures`
    DROP INDEX `document_signatures_user_id_document_id_key`,
    ADD COLUMN `document_version` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `signature_type` ENUM('typed', 'drawn') NULL,
    ADD COLUMN `signature_data` TEXT NULL,
    ADD COLUMN `ip_address` VARCHAR(45) NULL,
    ADD COLUMN `user_agent` TEXT NULL;

-- Widen the unique key so re-signing after a version bump inserts a new history
-- row instead of overwriting the previous signature.
ALTER TABLE `document_signatures`
    ADD UNIQUE INDEX `document_signatures_user_id_document_id_document_version_key` (`user_id`, `document_id`, `document_version`);
