-- Drop IP-related tables
DROP TABLE IF EXISTS `exam_ip_whitelist`;
DROP TABLE IF EXISTS `exam_access_denied_log`;

-- Drop IP columns from existing tables
ALTER TABLE `exam_instances` DROP COLUMN IF EXISTS `ipAddress`;
ALTER TABLE `exam_link_usages` DROP COLUMN IF EXISTS `ip`;
ALTER TABLE `proctoring_sessions` DROP COLUMN IF EXISTS `ipAddress`;
