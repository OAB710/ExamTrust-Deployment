-- Retry-safe client event delivery for integrity signals. Existing evidence is
-- retained because the new identifier is nullable.
ALTER TABLE `integrity_logs`
  ADD COLUMN `clientEventId` VARCHAR(80) NULL;

CREATE UNIQUE INDEX `integrity_logs_proctoringId_clientEventId_key`
  ON `integrity_logs`(`proctoringId`, `clientEventId`);
