-- Additive support for a fixed-point integrity penalty. Existing percentage
-- decisions remain untouched and are explicitly marked as PERCENT.
ALTER TABLE `integrity_reviews`
  ADD COLUMN `penaltyMode` VARCHAR(16) NULL,
  ADD COLUMN `penaltyAmount` DECIMAL(5,2) NULL;

UPDATE `integrity_reviews`
SET `penaltyMode` = 'PERCENT'
WHERE `penaltyPercent` IS NOT NULL
  AND `penaltyMode` IS NULL;
