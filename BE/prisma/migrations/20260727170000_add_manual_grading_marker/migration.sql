-- `pointsAwarded = 0` is a valid manual mark, so it cannot also mean that a
-- manual answer has been graded. Keep an explicit review marker instead.
ALTER TABLE `submission_answers`
  ADD COLUMN `manualGradedAt` DATETIME(3) NULL;

-- Preserve auditable historic grading decisions. Answers without a recorded
-- manual grading action intentionally remain pending for instructor review.
UPDATE `submission_answers` AS answer_row
INNER JOIN (
  SELECT `submissionAnswerId`, MAX(`createdAt`) AS `gradedAt`
  FROM `exam_submission_regrade_logs`
  WHERE `submissionAnswerId` IS NOT NULL
  GROUP BY `submissionAnswerId`
) AS grading_log ON grading_log.`submissionAnswerId` = answer_row.`id`
SET answer_row.`manualGradedAt` = grading_log.`gradedAt`;

CREATE INDEX `submission_answers_manualGradedAt_idx`
  ON `submission_answers`(`manualGradedAt`);
