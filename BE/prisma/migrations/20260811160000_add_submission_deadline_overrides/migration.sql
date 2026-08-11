ALTER TABLE `exam_submissions`
  ADD COLUMN `deadlineOverrideAt` DATETIME(3) NULL,
  ADD COLUMN `autoSubmittedAt` DATETIME(3) NULL;

CREATE INDEX `exam_submissions_status_deadlineOverrideAt_idx`
  ON `exam_submissions`(`status`, `deadlineOverrideAt`);
