-- Adds a single optional media attachment (image or audio) per question,
-- stored in Cloudflare R2 (not in this database). mediaKey is kept so the
-- object can be deleted from R2 and its bytes reclaimed from
-- media_storage_usage when the attachment is removed or replaced.
ALTER TABLE `questions`
  ADD COLUMN `mediaUrl` TEXT NULL,
  ADD COLUMN `mediaType` VARCHAR(191) NULL,
  ADD COLUMN `mediaKey` TEXT NULL,
  ADD COLUMN `mediaSizeBytes` INT NULL;

-- Singleton counter (id always "global") of cumulative bytes confirmed
-- uploaded to the R2 media bucket, used to hard-stop new uploads well before
-- the Cloudflare R2 free-tier storage limit.
CREATE TABLE `media_storage_usage` (
  `id` VARCHAR(191) NOT NULL,
  `totalBytes` BIGINT NOT NULL DEFAULT 0,
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `media_storage_usage` (`id`, `totalBytes`, `updatedAt`) VALUES ('global', 0, CURRENT_TIMESTAMP(3));
