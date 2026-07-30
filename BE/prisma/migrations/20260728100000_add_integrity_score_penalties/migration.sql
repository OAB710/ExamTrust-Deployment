-- Keep academic scores intact; integrity penalties are stored as a separate,
-- auditable decision and can be reversed without rewriting historic grading.
ALTER TABLE `integrity_reviews`
  ADD COLUMN `penaltyPercent` INT NULL,
  ADD COLUMN `academicScore` DECIMAL(5,2) NULL,
  ADD COLUMN `deductedScore` DECIMAL(5,2) NULL,
  ADD COLUMN `finalScore` DECIMAL(5,2) NULL,
  ADD COLUMN `penaltyAppliedAt` DATETIME(3) NULL;

CREATE TABLE `integrity_review_audits` (
  `id` VARCHAR(191) NOT NULL,
  `integrityReviewId` VARCHAR(191) NOT NULL,
  `action` VARCHAR(32) NOT NULL,
  `previousPercent` INT NULL,
  `nextPercent` INT NULL,
  `academicScore` DECIMAL(5,2) NULL,
  `deductedScore` DECIMAL(5,2) NULL,
  `finalScore` DECIMAL(5,2) NULL,
  `note` TEXT NULL,
  `actorId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `integrity_review_audits_integrityReviewId_createdAt_idx` (`integrityReviewId`, `createdAt`),
  INDEX `integrity_review_audits_actorId_idx` (`actorId`),
  CONSTRAINT `integrity_review_audits_integrityReviewId_fkey`
    FOREIGN KEY (`integrityReviewId`) REFERENCES `integrity_reviews`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `integrity_review_audits_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
