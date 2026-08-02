-- Add immutable scheduled-capture metadata without altering existing evidence.
ALTER TABLE `proctoring_evidence_captures`
  ADD COLUMN `scheduledSlot` INTEGER NULL,
  ADD COLUMN `scheduledAt` DATETIME(3) NULL;

ALTER TABLE `proctoring_evidence_captures`
  MODIFY COLUMN `trigger` ENUM('IDLE', 'SUSPICIOUS_EVENT', 'SCHEDULED') NOT NULL;

CREATE UNIQUE INDEX `proctoring_evidence_captures_submissionId_scheduledSlot_key`
  ON `proctoring_evidence_captures`(`submissionId`, `scheduledSlot`);
