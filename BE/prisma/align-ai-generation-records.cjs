require('dotenv/config');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function hasColumn(tableName, columnName) {
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    tableName,
    columnName,
  );
  return rows.length > 0;
}

async function hasIndex(tableName, indexName) {
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT INDEX_NAME
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND INDEX_NAME = ?
    LIMIT 1
    `,
    tableName,
    indexName,
  );
  return rows.length > 0;
}

async function hasForeignKey(tableName, constraintName) {
  const rows = await prisma.$queryRawUnsafe(
    `
    SELECT CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND CONSTRAINT_NAME = ?
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    LIMIT 1
    `,
    tableName,
    constraintName,
  );
  return rows.length > 0;
}

async function main() {
  const tableName = 'ai_generation_records';

  if (!(await hasColumn(tableName, 'examId'))) {
    console.log('ADD COLUMN ai_generation_records.examId');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `ai_generation_records` ADD COLUMN `examId` VARCHAR(191) NULL',
    );
  } else {
    console.log('SKIP COLUMN ai_generation_records.examId');
  }

  if (!(await hasColumn(tableName, 'submissionId'))) {
    console.log('ADD COLUMN ai_generation_records.submissionId');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `ai_generation_records` ADD COLUMN `submissionId` VARCHAR(191) NULL',
    );
  } else {
    console.log('SKIP COLUMN ai_generation_records.submissionId');
  }

  if (!(await hasIndex(tableName, 'ai_generation_records_examId_createdAt_idx'))) {
    console.log('ADD INDEX ai_generation_records_examId_createdAt_idx');
    await prisma.$executeRawUnsafe(
      'CREATE INDEX `ai_generation_records_examId_createdAt_idx` ON `ai_generation_records` (`examId`, `createdAt`)',
    );
  } else {
    console.log('SKIP INDEX ai_generation_records_examId_createdAt_idx');
  }

  if (!(await hasIndex(tableName, 'ai_generation_records_submissionId_createdAt_idx'))) {
    console.log('ADD INDEX ai_generation_records_submissionId_createdAt_idx');
    await prisma.$executeRawUnsafe(
      'CREATE INDEX `ai_generation_records_submissionId_createdAt_idx` ON `ai_generation_records` (`submissionId`, `createdAt`)',
    );
  } else {
    console.log('SKIP INDEX ai_generation_records_submissionId_createdAt_idx');
  }

  if (!(await hasForeignKey(tableName, 'ai_generation_records_examId_fkey'))) {
    console.log('ADD FK ai_generation_records_examId_fkey');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `ai_generation_records` ADD CONSTRAINT `ai_generation_records_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    );
  } else {
    console.log('SKIP FK ai_generation_records_examId_fkey');
  }

  if (!(await hasForeignKey(tableName, 'ai_generation_records_submissionId_fkey'))) {
    console.log('ADD FK ai_generation_records_submissionId_fkey');
    await prisma.$executeRawUnsafe(
      'ALTER TABLE `ai_generation_records` ADD CONSTRAINT `ai_generation_records_submissionId_fkey` FOREIGN KEY (`submissionId`) REFERENCES `exam_submissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    );
  } else {
    console.log('SKIP FK ai_generation_records_submissionId_fkey');
  }

  console.log('ai_generation_records aligned.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
