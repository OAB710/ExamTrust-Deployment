-- Expand AI generation sections used by asynchronous quality and risk analysis jobs.
-- Migration-safe: this only adds enum values and preserves existing rows.

ALTER TABLE `ai_generation_records`
  MODIFY COLUMN `section` ENUM(
    'CONTENT',
    'ANSWERS',
    'EXPLANATION',
    'CLASSIFICATION',
    'QUALITY_REVIEW',
    'RISK_ASSESSMENT'
  ) NOT NULL;
