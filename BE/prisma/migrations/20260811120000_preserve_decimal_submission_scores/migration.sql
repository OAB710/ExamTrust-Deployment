-- Scores are normalized to the Vietnamese 10-point scale and can be fractional.
-- ALTER preserves all existing submissions and converts prior integer values safely.
ALTER TABLE `exam_submissions`
  MODIFY COLUMN `score` DECIMAL(5, 2) NULL;
