-- Preserve existing course and exam records while adding archive and draft soft-delete lifecycle metadata.
ALTER TABLE `courses`
  ADD COLUMN `archivedAt` DATETIME(3) NULL,
  ADD COLUMN `archivedById` VARCHAR(191) NULL;

CREATE INDEX `courses_status_idx` ON `courses`(`status`);
CREATE INDEX `courses_archivedAt_idx` ON `courses`(`archivedAt`);

ALTER TABLE `exams`
  ADD COLUMN `archivedAt` DATETIME(3) NULL,
  ADD COLUMN `archivedById` VARCHAR(191) NULL,
  ADD COLUMN `archivedFromStatus` VARCHAR(191) NULL,
  ADD COLUMN `deletedAt` DATETIME(3) NULL,
  ADD COLUMN `deletedById` VARCHAR(191) NULL;

CREATE INDEX `exams_archivedAt_idx` ON `exams`(`archivedAt`);
CREATE INDEX `exams_deletedAt_idx` ON `exams`(`deletedAt`);
