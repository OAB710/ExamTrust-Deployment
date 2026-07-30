import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lecturer = await prisma.user.findUnique({ where: { email: 'lecturer01@tdtutdtu.edu.vn' } });
  const course = await prisma.course.findUnique({ where: { code: 'CLS001' } });
  if (!lecturer || !course) throw new Error('Thiếu dữ liệu demo CLS001 hoặc giảng viên.');

  const questions = await prisma.question.findMany({
    where: { courseId: course.id },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    include: { versions: { orderBy: { versionNo: 'asc' } } },
  });

  const scenarios = [
    { oldP: 0.72, newP: 0.48, oldD: 0.42, newD: 0.18 }, // needs review
    { oldP: 0.36, newP: 0.58, oldD: 0.20, newD: 0.46 }, // improved
    { oldP: 0.63, newP: 0.61, oldD: 0.39, newD: 0.37 }, // stable
  ];

  for (const [index, question] of questions.entries()) {
    const base = question.versions[0];
    if (!base) continue;
    const scenario = scenarios[index];
    const v2 = await prisma.questionVersion.upsert({
      where: { questionId_versionNo: { questionId: question.id, versionNo: 2 } },
      update: {},
      create: {
        questionId: question.id, versionNo: 2,
        stem: `${base.stem} (đã hiệu chỉnh để làm rõ yêu cầu)`,
        payload: base.payload, answerKey: base.answerKey, explanation: base.explanation,
        difficulty: base.difficulty, points: base.points,
        metadata: { demoHistory: true, reviewNote: 'Hiệu chỉnh sau phân tích chất lượng câu hỏi.' },
        aiGenerated: index === 1, createdBy: lecturer.id,
      },
    });
    await prisma.question.update({ where: { id: question.id }, data: { latestVersionNo: 2, content: v2.stem } });
    for (const [version, p, d, total] of [[base, scenario.oldP, scenario.oldD, 42], [v2, scenario.newP, scenario.newD, 56]] as const) {
      const correct = Math.round(total * p);
      await prisma.questionStatistics.upsert({
        where: { questionVersionId: version.id },
        update: { totalAttempts: total, correctAttempts: correct, incorrectAttempts: total - correct, skippedAttempts: 0, pValue: p, difficultyIndex: p, discriminationIndex: d, lastRecomputedAt: new Date() },
        create: { questionVersionId: version.id, questionId: question.id, totalAttempts: total, correctAttempts: correct, incorrectAttempts: total - correct, skippedAttempts: 0, pValue: p, difficultyIndex: p, discriminationIndex: d, lastRecomputedAt: new Date() },
      });
    }
  }
  console.log('Đã seed dữ liệu phân tích: cần xem xét, cải thiện và ổn định.');
}
main().catch(console.error).finally(() => prisma.$disconnect());
