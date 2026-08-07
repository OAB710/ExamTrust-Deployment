-- Link risk flags to the AI generation job that produced them.
-- This is additive and preserves every existing anomaly flag.
ALTER TABLE `anomaly_flags`
  ADD COLUMN `jobId` VARCHAR(191) NULL;

CREATE INDEX `anomaly_flags_jobId_idx` ON `anomaly_flags`(`jobId`);

ALTER TABLE `anomaly_flags`
  ADD CONSTRAINT `anomaly_flags_jobId_fkey`
  FOREIGN KEY (`jobId`) REFERENCES `ai_generation_records`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
