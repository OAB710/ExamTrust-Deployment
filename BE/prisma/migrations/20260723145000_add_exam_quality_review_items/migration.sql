-- Additive migration: create the AI exam quality review item table expected by the current Prisma schema.
-- This preserves existing seeded/demo data and does not modify historical submissions.

CREATE TABLE IF NOT EXISTS `exam_quality_review_items` (
  `id` VARCHAR(191) NOT NULL,
  `jobId` VARCHAR(191) NOT NULL,
  `questionId` VARCHAR(191) NOT NULL,
  `questionVersionId` VARCHAR(191) NULL,
  `severity` VARCHAR(191) NULL,
  `reasonSummary` TEXT NOT NULL,
  `statsSnapshot` JSON NULL,
  `recommendation` TEXT NOT NULL,
  `reviewStatus` ENUM('PENDING','APPROVED','REJECTED','NEEDS_CHANGES') NOT NULL DEFAULT 'PENDING',
  `reviewedBy` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `reviewNotes` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  PRIMARY KEY (`id`),
  INDEX `exam_quality_review_items_jobId_idx` (`jobId`),
  INDEX `exam_quality_review_items_questionId_idx` (`questionId`),
  INDEX `exam_quality_review_items_reviewStatus_idx` (`reviewStatus`),
  CONSTRAINT `exam_quality_review_items_jobId_fkey`
    FOREIGN KEY (`jobId`) REFERENCES `ai_generation_records`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_quality_review_items_questionId_fkey`
    FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_quality_review_items_reviewedBy_fkey`
    FOREIGN KEY (`reviewedBy`) REFERENCES `users`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
