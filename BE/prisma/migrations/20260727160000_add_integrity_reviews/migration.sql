-- Human-review workflow for integrity signals. Existing raw logs remain unchanged.
CREATE TABLE `integrity_reviews` (
  `id` VARCHAR(191) NOT NULL,
  `submissionId` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'REVIEWED', 'DISMISSED', 'CONFIRMED') NOT NULL DEFAULT 'PENDING',
  `reviewerId` VARCHAR(191) NULL,
  `reviewerNote` TEXT NULL,
  `decidedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `integrity_reviews_submissionId_key`(`submissionId`),
  INDEX `integrity_reviews_status_idx`(`status`),
  INDEX `integrity_reviews_reviewerId_idx`(`reviewerId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `integrity_reviews`
  ADD CONSTRAINT `integrity_reviews_submissionId_fkey`
  FOREIGN KEY (`submissionId`) REFERENCES `exam_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `integrity_reviews_reviewerId_fkey`
  FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
