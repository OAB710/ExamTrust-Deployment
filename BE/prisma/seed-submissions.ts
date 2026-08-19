import { PrismaClient } from '@prisma/client';
import { addMinutes, buildSubmittedAnswer, isAutoGradable, makeRng, seedFromString } from './seed-helpers';
import { main as seedExams } from './seed-exams';

const prisma = new PrismaClient();

// Fixed ability tiers by student index (0-based, matches seed-users.ts
// numbering 522h0001..522h0020) — deliberately NOT random so every exam
// reproduces the same kind of score distribution.
// - 0..3   : giỏi (student index 1 = "522h0002" also finishes unusually fast)
// - 4..13  : trung bình (10/20 sinh viên — dải rộng nhất)
// - 14..17 : yếu
// - 18,19  : cặp "gian lận" — đáp án giống bất thường + nộp cách nhau vài chục giây
const FAST_STUDENT_INDEX = 1;
const CHEATER_INDICES = [18, 19];

function abilityTier(studentIndex: number): 'high' | 'mid' | 'low' | 'cheater' {
  if (CHEATER_INDICES.includes(studentIndex)) return 'cheater';
  if (studentIndex <= 3) return 'high';
  if (studentIndex <= 13) return 'mid';
  return 'low';
}

function correctnessRate(tier: ReturnType<typeof abilityTier>, rng: () => number): number {
  switch (tier) {
    case 'high': return 0.85 + rng() * 0.12;
    case 'mid': return 0.55 + rng() * 0.2;
    case 'cheater': return 0.55 + rng() * 0.15;
    default: return 0.28 + rng() * 0.18;
  }
}

function manualGradeFraction(tier: ReturnType<typeof abilityTier>, rng: () => number): number {
  switch (tier) {
    case 'high': return 0.8 + rng() * 0.2;
    case 'mid': return 0.5 + rng() * 0.3;
    case 'cheater': return 0.45 + rng() * 0.25;
    default: return 0.2 + rng() * 0.3;
  }
}

export async function main(seeded?: Awaited<ReturnType<typeof seedExams>>) {
  try {
    const result = seeded ?? (await seedExams());
    const { coursesByKey, examsByKey, studentUsers } = result;

    const submissionsByExamKey: Record<string, Array<{ submission: any; studentIndex: number }>> = {};

    for (const [examKey, entry] of Object.entries(examsByKey)) {
      const { plan, exam, course, snapshot } = entry;
      if (plan.status === 'DRAFT' || !snapshot) continue;

      const enrollments = await prisma.enrollment.findMany({ where: { courseId: course.id }, select: { studentId: true } });
      const enrolledIds = new Set(enrollments.map((e) => e.studentId));
      const studentIndices = studentUsers
        .map((s: any, idx: number) => idx)
        .filter((idx: number) => enrolledIds.has(studentUsers[idx].id));

      submissionsByExamKey[examKey] = [];

      if (plan.status === 'ONGOING') {
        // A handful of students have started but not submitted yet.
        const inProgressIndices = studentIndices.slice(0, Math.min(6, studentIndices.length));
        for (const studentIndex of inProgressIndices) {
          const student = studentUsers[studentIndex];
          const rng = makeRng(seedFromString(`submission:${examKey}:${studentIndex}`));
          const startedAt = new Date(exam.startTime.getTime() + rng() * 20 * 3_600_000);
          const instance = await prisma.examInstance.upsert({
            where: { examId_studentId: { examId: exam.id, studentId: student.id } },
            update: {},
            create: {
              examId: exam.id,
              studentId: student.id,
              examSnapshotId: snapshot.examSnapshot.id,
              status: 'IN_PROGRESS',
              startedAt,
              lastActivityAt: startedAt,
            },
          });
          const submission = await prisma.examSubmission.upsert({
            where: { examId_studentId_attemptNo: { examId: exam.id, studentId: student.id, attemptNo: 1 } },
            update: {},
            create: {
              examId: exam.id,
              examInstanceId: instance.id,
              studentId: student.id,
              attemptNo: 1,
              status: 'IN_PROGRESS',
              statusEnum: 'IN_PROGRESS',
              examSnapshotId: snapshot.examSnapshot.id,
              startedAt,
              lastActivityAt: startedAt,
            },
          });
          submissionsByExamKey[examKey].push({ submission, studentIndex });
        }
        continue;
      }

      // COMPLETED_PUBLISHED / COMPLETED_PENDING: everyone enrolled submits.
      const attemptPlan: Array<{ studentIndex: number; attempts: number }> = studentIndices.map((studentIndex: number) => ({
        studentIndex,
        attempts: plan.key === 'webdev-multi-attempt' && studentIndex < 5 ? 2 + (studentIndex % 2) : 1,
      }));

      const hasManualGrading = snapshot.snapshotQuestions.some((q) => !isAutoGradable(q.type, q.answerKey));
      const resultsPublished = plan.status === 'COMPLETED_PUBLISHED';

      // Track which manual answers still need to stay ungraded overall, so a
      // COMPLETED_PENDING exam always has at least one real "chưa chấm" case.
      let ungradedManualBudget = plan.status === 'COMPLETED_PENDING'
        ? Math.max(1, Math.round(attemptPlan.length * 0.12))
        : 0;

      for (const { studentIndex, attempts } of attemptPlan) {
        const student = studentUsers[studentIndex];
        const tier = abilityTier(studentIndex);
        const isCheaterPair = tier === 'cheater';
        const rng = makeRng(seedFromString(`submission:${examKey}:${studentIndex}`));
        // Both cheaters in a pair share one rng so their per-question
        // correct/incorrect + wrong-answer choices come out identical.
        const sharedCheaterRng = isCheaterPair ? makeRng(seedFromString(`submission:${examKey}:cheater-pair`)) : rng;

        const instance = await prisma.examInstance.upsert({
          where: { examId_studentId: { examId: exam.id, studentId: student.id } },
          update: {},
          create: {
            examId: exam.id,
            studentId: student.id,
            examSnapshotId: snapshot.examSnapshot.id,
            status: resultsPublished ? 'GRADED' : 'SUBMITTED',
          },
        });

        for (let attemptNo = 1; attemptNo <= attempts; attemptNo++) {
          const rate = Math.min(0.98, correctnessRate(tier, rng) + (attemptNo - 1) * 0.08); // later attempts improve slightly
          const manualFrac = Math.min(1, manualGradeFraction(tier, rng) + (attemptNo - 1) * 0.05);

          const dayOffset = rng() * (isCheaterPair ? 3 : 4); // cheater pair sits the same session, so keep them on the same day
          const hourOffset = 8 + rng() * 10;
          let startedAt = new Date(exam.startTime.getTime() + dayOffset * 24 * 3_600_000 + hourOffset * 3_600_000);
          if (isCheaterPair) {
            // Force both cheaters onto the identical day/hour bucket.
            const sharedRng = makeRng(seedFromString(`submission:${examKey}:cheater-pair:timing`));
            startedAt = new Date(exam.startTime.getTime() + sharedRng() * 3 * 24 * 3_600_000 + (8 + sharedRng() * 10) * 3_600_000);
          }
          const fastFinish = studentIndex === FAST_STUDENT_INDEX;
          const elapsedFraction = fastFinish ? 0.15 + rng() * 0.1 : 0.4 + rng() * 0.5;
          const submittedAt = addMinutes(startedAt, exam.duration * elapsedFraction + (isCheaterPair ? studentIndex - 18 : 0) * 0.5);

          const answerRows: any[] = [];
          let rawScore = 0;
          let maxRawScore = 0;
          let hasUngradedManual = false;

          for (const q of snapshot.snapshotQuestions) {
            maxRawScore += q.assignedScore;
            const autoGradable = isAutoGradable(q.type, q.answerKey);
            const wantCorrect = (isCheaterPair ? sharedCheaterRng() : rng()) < rate;
            const answerPayload = buildSubmittedAnswer(
              q.type,
              q.answerKey,
              wantCorrect,
              isCheaterPair ? sharedCheaterRng : rng,
            );

            if (autoGradable) {
              const pointsAwarded = wantCorrect ? q.assignedScore : 0;
              rawScore += pointsAwarded;
              answerRows.push({
                submissionId: '', // filled after submission row is created
                questionId: q.questionId,
                questionVersionId: q.questionVersionId,
                questionSnapshotId: q.questionSnapshotId,
                answer: answerPayload,
                isCorrect: wantCorrect,
                pointsAwarded,
                manualGradedAt: null,
                timeTaken: Math.round(20 + rng() * 90),
              });
            } else {
              const willGradeNow = resultsPublished || (rng() < manualFrac && ungradedManualBudget <= 0);
              if (!willGradeNow) ungradedManualBudget -= 1;
              const graded = willGradeNow;
              // SubmissionAnswer.pointsAwarded is an Int column — always
              // round to a whole number, never a decimal fraction.
              const pointsAwarded = graded ? Math.round(q.assignedScore * (0.5 + rng() * 0.5)) : null;
              if (graded) rawScore += Number(pointsAwarded || 0);
              else hasUngradedManual = true;
              answerRows.push({
                submissionId: '',
                questionId: q.questionId,
                questionVersionId: q.questionVersionId,
                questionSnapshotId: q.questionSnapshotId,
                answer: answerPayload,
                isCorrect: null,
                pointsAwarded,
                manualGradedAt: graded ? submittedAt : null,
                timeTaken: Math.round(60 + rng() * 240),
              });
            }
          }

          const normalizedScore = maxRawScore > 0 ? Math.round((rawScore / maxRawScore) * 1000) / 100 : 0;
          const submissionStatus = resultsPublished ? 'GRADED' : (hasManualGrading ? 'SUBMITTED' : 'GRADED');

          const submission = await prisma.examSubmission.upsert({
            where: { examId_studentId_attemptNo: { examId: exam.id, studentId: student.id, attemptNo } },
            update: {},
            create: {
              examId: exam.id,
              examInstanceId: instance.id,
              studentId: student.id,
              attemptNo,
              status: submissionStatus,
              statusEnum: submissionStatus as any,
              examSnapshotId: snapshot.examSnapshot.id,
              score: normalizedScore,
              startedAt,
              submittedAt,
              gradedAt: submissionStatus === 'GRADED' ? submittedAt : null,
              lastActivityAt: submittedAt,
            },
          });

          for (const row of answerRows) {
            await prisma.submissionAnswer.upsert({
              where: { submissionId_questionId: { submissionId: submission.id, questionId: row.questionId } },
              update: {},
              create: { ...row, submissionId: submission.id },
            });
          }

          submissionsByExamKey[examKey].push({ submission, studentIndex });

          if (attemptNo === attempts && hasUngradedManual) {
            // Already accounted for in ungradedManualBudget bookkeeping above.
          }
        }
      }

      if (resultsPublished) {
        await prisma.exam.update({
          where: { id: exam.id },
          data: { resultsPublishedAt: new Date(exam.endTime.getTime() + 2 * 24 * 3_600_000) },
        });
      }
    }

    console.log(`[seed-submissions] exams=${Object.keys(submissionsByExamKey).length} submissions=${Object.values(submissionsByExamKey).reduce((s, arr) => s + arr.length, 0)}`);
    return { ...result, submissionsByExamKey };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-submissions.ts')) {
  main().catch((error) => {
    console.error('[seed-submissions] failed:', error);
    process.exit(1);
  });
}
