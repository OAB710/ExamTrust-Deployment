import { PrismaClient } from '@prisma/client';
import { COURSE_TOPIC_LABELS } from './seed-question-bank';
import { main as seedQuestionBankDuplicates } from './seed-question-bank-duplicates';

const prisma = new PrismaClient();

function topicCode(label: string, index: number): string {
  const ascii = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('-');
  return `${ascii || 'TOPIC'}-${index + 1}`;
}

export async function main(seeded?: Awaited<ReturnType<typeof seedQuestionBankDuplicates>>) {
  try {
    const result = seeded ?? (await seedQuestionBankDuplicates());
    const { coursesByKey, questionsByCourseKey } = result;

    let topicCount = 0;
    let linkCount = 0;

    for (const [courseKey, course] of Object.entries(coursesByKey)) {
      const labels = COURSE_TOPIC_LABELS[courseKey] ?? ['Nội dung tổng hợp'];
      const topicsByLabel: Record<string, any> = {};

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        const code = topicCode(label, i);
        const topic = await prisma.topic.upsert({
          where: { courseId_code: { courseId: course.id, code } },
          update: { name: label },
          create: { courseId: course.id, code, name: label },
        });
        topicsByLabel[label] = topic;
        topicCount += 1;

        await prisma.courseTopic.upsert({
          where: { courseId_topicId: { courseId: course.id, topicId: topic.id } },
          update: {},
          create: { courseId: course.id, topicId: topic.id },
        });
      }

      const questions = questionsByCourseKey[courseKey] ?? [];
      for (const question of questions) {
        const label: string = question.topic || labels[0];
        const topic = topicsByLabel[label] ?? topicsByLabel[labels[0]];
        if (!topic) continue;
        await prisma.questionTopic.upsert({
          where: { questionId_topicId: { questionId: question.id, topicId: topic.id } },
          update: {},
          create: { questionId: question.id, topicId: topic.id, weight: 0.7 },
        });
        linkCount += 1;
      }
    }

    console.log(`[seed-topics] topics=${topicCount} questionLinks=${linkCount}`);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-topics.ts')) {
  main().catch((error) => {
    console.error('[seed-topics] failed:', error);
    process.exit(1);
  });
}
