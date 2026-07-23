import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { PrismaClient } from '@prisma/client';

const backendEnvPath = join(process.cwd(), '.env');

if (!process.env.DATABASE_URL && existsSync(backendEnvPath)) {
  const envFile = readFileSync(backendEnvPath, 'utf8');

  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*DATABASE_URL\s*=\s*(.*)\s*$/);
    if (!match) continue;

    process.env.DATABASE_URL = match[1].replace(/^['"]|['"]$/g, '');
    break;
  }
}

const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.updateMany({
    where: {
      code: 'CLS001',
      name: 'Academic Trust Demo Course',
    },
    data: {
      name: 'Khóa học thử nghiệm Academic Trust',
    },
  });

  const unlimitedExam = await prisma.exam.updateMany({
    where: {
      title: 'CLS001 - Unlimited Attempts Demo',
    },
    data: {
      title: 'CLS001 - Bài thi thử không giới hạn lượt làm',
      description: 'Bài thi demo cho phép sinh viên thực hành nhiều lượt trong khóa học thử nghiệm.',
    },
  });

  const completedExam = await prisma.exam.updateMany({
    where: {
      title: 'CLS001 - Completed Analytics Demo',
    },
    data: {
      title: 'CLS001 - Bài thi thử đã hoàn thành để phân tích',
      description: 'Bài thi demo có dữ liệu nộp bài để kiểm tra thống kê và phân tích kết quả.',
    },
  });

  console.log(
    `Updated demo labels: ${course.count} course(s), ${unlimitedExam.count + completedExam.count} exam(s).`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
