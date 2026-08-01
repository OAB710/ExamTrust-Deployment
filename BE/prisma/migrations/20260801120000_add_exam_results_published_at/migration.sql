-- Additive, nullable migration. Existing results remain private until an
-- instructor explicitly publishes them through the application workflow.
ALTER TABLE `exams` ADD COLUMN `resultsPublishedAt` DATETIME(3) NULL;

CREATE INDEX `exams_resultsPublishedAt_idx` ON `exams`(`resultsPublishedAt`);
