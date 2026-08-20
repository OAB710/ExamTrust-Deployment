import { PrismaClient } from '@prisma/client';
import { main as seedIntegrity } from './seed-integrity';

const prisma = new PrismaClient();

// Regrade-audit / score-adjustment case (plan mục 6, phần cuối) — no existing
// seed script covered these tables at all before this rebuild.
const TARGET_EXAM_KEYS = ['intro-it-midterm', 'dsa-midterm'];

export async function main(seeded?: Awaited<ReturnType<typeof seedIntegrity>>) {
  try {
    const result = seeded ?? (await seedIntegrity());
    const { examsByKey, lecturerUsers } = result;

    let regradeLogs = 0;
    let scoreAdjustments = 0;

    for (const examKey of TARGET_EXAM_KEYS) {
      const entry = examsByKey[examKey];
      if (!entry?.exam) continue;

      const gradedSubmission = await prisma.examSubmission.findFirst({
        where: { examId: entry.exam.id, status: 'GRADED' },
        orderBy: { submittedAt: 'asc' },
        include: { answers: true },
      });
      if (!gradedSubmission) continue;

      const manualAnswer = gradedSubmission.answers.find((a) => a.manualGradedAt !== null);
      if (manualAnswer) {
        // Cap at the question's real assigned score — this writes straight
        // to the DB, bypassing gradeAnswer()'s own "cannot exceed max" check,
        // so it has to enforce that cap itself or it can silently seed an
        // over-award (previousPoints already at max + 1 > max).
        const snapshotQuestions = entry.snapshot?.snapshotQuestions ?? [];
        const maxPoints = Number(
          snapshotQuestions.find((sq) => sq.questionId === manualAnswer.questionId)?.assignedScore ?? 1,
        );
        const previousPoints = Number(manualAnswer.pointsAwarded ?? 0);
        const newPoints = Math.min(previousPoints + 1, maxPoints); // phúc khảo tăng thêm 1 điểm cho câu đó
        const reviewer = lecturerUsers[0];
        const existingLog = await prisma.examSubmissionRegradeLog.findFirst({
          where: { submissionAnswerId: manualAnswer.id, reason: { contains: 'Phúc khảo' } },
        });
        if (!existingLog && newPoints > previousPoints) {
          await prisma.examSubmissionRegradeLog.create({
            data: {
              submissionId: gradedSubmission.id,
              submissionAnswerId: manualAnswer.id,
              reviewerId: reviewer.id,
              previousPoints,
              newPoints,
              previousFeedback: manualAnswer.feedback,
              newFeedback: 'Sau khi phúc khảo, câu trả lời đáp ứng đủ ý theo rubric — tăng điểm.',
              reason: 'Phúc khảo theo yêu cầu của sinh viên',
            },
          });
          await prisma.submissionAnswer.update({
            where: { id: manualAnswer.id },
            data: { pointsAwarded: newPoints, feedback: 'Sau khi phúc khảo, câu trả lời đáp ứng đủ ý theo rubric — tăng điểm.' },
          });

          // Keep ExamSubmission.score in sync with the answers it's derived
          // from — otherwise the regrade bumps one answer's points but the
          // submission's displayed total silently stays stale.
          const updatedAnswers = gradedSubmission.answers.map((a) =>
            a.id === manualAnswer.id ? { ...a, pointsAwarded: newPoints } : a,
          );
          const rawScore = updatedAnswers.reduce((sum, a) => sum + Number(a.pointsAwarded || 0), 0);
          const maxRawScore = updatedAnswers.reduce(
            (sum, a) => sum + Number(snapshotQuestions.find((sq) => sq.questionId === a.questionId)?.assignedScore ?? 1),
            0,
          );
          const normalizedScore = maxRawScore > 0
            ? Number(Math.max(0, Math.min(10, (rawScore / maxRawScore) * 10)).toFixed(2))
            : 0;
          await prisma.examSubmission.update({
            where: { id: gradedSubmission.id },
            data: { score: normalizedScore },
          });

          regradeLogs += 1;
        }
      }

      const existingAdjustment = await prisma.scoreAdjustment.findFirst({ where: { submissionId: gradedSubmission.id } });
      if (!existingAdjustment) {
        await prisma.scoreAdjustment.create({
          data: {
            submissionId: gradedSubmission.id,
            amount: 0.5,
            category: 'PARTICIPATION',
            reason: 'Cộng điểm khuyến khích tham gia thảo luận trên lớp trong học kỳ.',
            createdById: lecturerUsers[0].id,
          },
        });
        scoreAdjustments += 1;

        // A second adjustment that was later revoked — shows the audit trail
        // actually gets exercised, not just a single always-active row.
        const revoked = await prisma.scoreAdjustment.create({
          data: {
            submissionId: gradedSubmission.id,
            amount: -0.25,
            category: 'OTHER',
            reason: 'Trừ điểm do nộp muộn (ghi nhận nhầm).',
            createdById: lecturerUsers[0].id,
          },
        });
        await prisma.scoreAdjustment.update({
          where: { id: revoked.id },
          data: {
            revokedAt: new Date(),
            revokedById: lecturerUsers[0].id,
            revocationReason: 'Ghi nhận sai — sinh viên nộp bài đúng hạn, đã kiểm tra lại log nộp bài.',
          },
        });
        scoreAdjustments += 1;
      }
    }

    console.log(`[seed-grading-adjustments] regradeLogs=${regradeLogs} scoreAdjustments=${scoreAdjustments}`);
    return result;
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-grading-adjustments.ts')) {
  main().catch((error) => {
    console.error('[seed-grading-adjustments] failed:', error);
    process.exit(1);
  });
}
