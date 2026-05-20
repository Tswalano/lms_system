-- Add deactivatedAt to users for audit trail when a user is soft-deleted.
-- The deactivation endpoint sets this alongside isActive = 0.

ALTER TABLE `users`
  ADD COLUMN `deactivatedAt` DATETIME(0) NULL DEFAULT NULL AFTER `isActive`;
