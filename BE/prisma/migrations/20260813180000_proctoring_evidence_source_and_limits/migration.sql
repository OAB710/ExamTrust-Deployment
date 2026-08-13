-- Add captureSource to proctoring_evidence_captures (webcam vs. parallel screen-capture),
-- replacing the (submissionId, scheduledSlot) unique constraint with one that includes it
-- since each scheduled slot now produces one row per capture source.

ALTER TABLE `proctoring_evidence_captures`
  ADD COLUMN `captureSource` ENUM('WEBCAM', 'SCREEN') NOT NULL DEFAULT 'WEBCAM';

ALTER TABLE `proctoring_evidence_captures`
  DROP INDEX `proctoring_evidence_captures_submissionId_scheduledSlot_key`;

ALTER TABLE `proctoring_evidence_captures`
  ADD UNIQUE INDEX `proctoring_evidence_captures_submissionId_scheduledSlot_capt_key` (`submissionId`, `scheduledSlot`, `captureSource`);
