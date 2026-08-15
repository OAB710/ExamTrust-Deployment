-- Migration: Create topic-related tables (topics, course_topics, question_topics, question_course_scopes)
-- Date: 2026-05-19
-- Purpose: These tables were originally created manually (outside Prisma migrations) via one-off SQL
-- scripts. This migration makes them reproducible so Prisma can build the shadow database from scratch.
-- Uses IF NOT EXISTS so it is a no-op on databases where the tables already exist.

-- topics
CREATE TABLE IF NOT EXISTS `topics` (
  `id` CHAR(36) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `topics_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- question_topics
CREATE TABLE IF NOT EXISTS `question_topics` (
  `questionId` CHAR(36) NOT NULL,
  `topicId` CHAR(36) NOT NULL,
  `weight` DOUBLE NULL,
  PRIMARY KEY (`questionId`,`topicId`),
  KEY `question_topics_topicId_idx` (`topicId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- course_topics
CREATE TABLE IF NOT EXISTS `course_topics` (
  `courseId` CHAR(36) NOT NULL,
  `topicId` CHAR(36) NOT NULL,
  PRIMARY KEY (`courseId`,`topicId`),
  KEY `course_topics_topicId_idx` (`topicId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- question_course_scopes
CREATE TABLE IF NOT EXISTS `question_course_scopes` (
  `questionId` CHAR(36) NOT NULL,
  `courseId` CHAR(36) NOT NULL,
  PRIMARY KEY (`questionId`,`courseId`),
  KEY `question_course_scopes_courseId_idx` (`courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Foreign keys (only added if the referenced tables exist; safe to run on existing DBs)
-- These are wrapped so they do not fail if the constraint already exists.
SET @fk_errors := 0;

-- question_topics.questionId -> questions.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_topics' AND CONSTRAINT_NAME = 'question_topics_questionId_fkey') = 0,
  'ALTER TABLE `question_topics` ADD CONSTRAINT `question_topics_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- question_topics.topicId -> topics.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_topics' AND CONSTRAINT_NAME = 'question_topics_topicId_fkey') = 0,
  'ALTER TABLE `question_topics` ADD CONSTRAINT `question_topics_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- course_topics.courseId -> courses.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_topics' AND CONSTRAINT_NAME = 'course_topics_courseId_fkey') = 0,
  'ALTER TABLE `course_topics` ADD CONSTRAINT `course_topics_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- course_topics.topicId -> topics.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course_topics' AND CONSTRAINT_NAME = 'course_topics_topicId_fkey') = 0,
  'ALTER TABLE `course_topics` ADD CONSTRAINT `course_topics_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `topics`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- question_course_scopes.questionId -> questions.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_course_scopes' AND CONSTRAINT_NAME = 'question_course_scopes_questionId_fkey') = 0,
  'ALTER TABLE `question_course_scopes` ADD CONSTRAINT `question_course_scopes_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `questions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- question_course_scopes.courseId -> courses.id
SET @sql := IF(
  (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'question_course_scopes' AND CONSTRAINT_NAME = 'question_course_scopes_courseId_fkey') = 0,
  'ALTER TABLE `question_course_scopes` ADD CONSTRAINT `question_course_scopes_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- End migration