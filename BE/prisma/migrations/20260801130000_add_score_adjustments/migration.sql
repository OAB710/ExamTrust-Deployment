-- Additive score-adjustment ledger. It never rewrites historic exam snapshots
-- or submission answer scores.
CREATE TABLE `score_adjustments` (
  `id` VARCHAR(191) NOT NULL,
  `submissionId` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(5,2) NOT NULL,
  `category` ENUM('QUESTION_ERROR', 'PARTICIPATION', 'OTHER') NOT NULL,
  `reason` TEXT NOT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `revokedAt` DATETIME(3) NULL,
  `revokedById` VARCHAR(191) NULL,
  `revocationReason` TEXT NULL,
  PRIMARY KEY (`id`),
  INDEX `score_adjustments_submissionId_createdAt_idx` (`submissionId`, `createdAt`),
  INDEX `score_adjustments_createdById_idx` (`createdById`),
  INDEX `score_adjustments_revokedById_idx` (`revokedById`),
  CONSTRAINT `score_adjustments_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `exam_submissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `score_adjustments_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `score_adjustments_revokedById_fkey` FOREIGN KEY (`revokedById`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
