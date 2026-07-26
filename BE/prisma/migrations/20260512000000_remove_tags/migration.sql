-- Migration: remove tags column and related tag tables
-- Generated: 2026-05-12

SET FOREIGN_KEY_CHECKS=0;

-- Drop tags column on questions if it exists
-- (plain MySQL has no "DROP COLUMN IF EXISTS"; only MariaDB supports that shorthand)
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'tags'
);
SET @drop_col_sql := IF(@col_exists > 0, 'ALTER TABLE `questions` DROP COLUMN `tags`', 'SELECT 1');
PREPARE drop_col_stmt FROM @drop_col_sql;
EXECUTE drop_col_stmt;
DEALLOCATE PREPARE drop_col_stmt;

-- Drop normalized tag tables if they exist
DROP TABLE IF EXISTS `question_tags`;
DROP TABLE IF EXISTS `tags`;

SET FOREIGN_KEY_CHECKS=1;

-- End migration
