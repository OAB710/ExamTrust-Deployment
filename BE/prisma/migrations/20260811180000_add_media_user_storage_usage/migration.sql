-- Per-user breakdown of the same cumulative bytes tracked in
-- media_storage_usage (id='global'). Reporting only (e.g. an admin usage
-- list via GET /media/usage) — it does not gate uploads, the global row
-- still owns the safe-quota cap. See BE/src/media/media.service.ts.
CREATE TABLE `media_user_storage_usage` (
  `userId` VARCHAR(191) NOT NULL,
  `totalBytes` BIGINT NOT NULL DEFAULT 0,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
