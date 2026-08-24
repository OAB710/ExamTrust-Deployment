import { PrismaClient } from '@prisma/client';
import { createExamSnapshot, daysAgo, makeRng, seedFromString } from './seed-helpers';
import { main as seedTopics } from './seed-topics';

const prisma = new PrismaClient();

export type ExamPlan = {
  key: string;
  courseKey: string;
  title: string;
  questionCount: number;
  // DRAFT: never published, no snapshot, no submissions.
  // ONGOING: published, currently open (endTime in the future), some IN_PROGRESS attempts.
  // COMPLETED_PUBLISHED: published, window closed, fully graded + results published long ago.
  // COMPLETED_PENDING: published, window closed, submissions exist but manual grading is not finished — resultsPublishedAt stays null.
  status: 'DRAFT' | 'ONGOING' | 'COMPLETED_PUBLISHED' | 'COMPLETED_PENDING';
  startDaysAgo: number;
  durationMinutes: number;
  gradingStrategy: 'HIGHEST' | 'AVERAGE' | 'FIRST_ATTEMPT' | 'LAST_ATTEMPT';
  maxAttempts: number;
  hasMatrix?: boolean;
  // Status stays 'ONGOING' (window still open — see windowDays below — so a
  // live demo can still submit a brand new attempt on the spot), but
  // seed-submissions.ts/seed-integrity.ts treat it like a COMPLETED exam for
  // data generation instead of skipping it (the default for ONGOING plans):
  // full attempt history, every integrity violation type, all pre-seeded.
  keepOpenForDemo?: boolean;
};

// startDaysAgo values are capped well under each exam's course's
// createdDaysAgo (see seed-courses.ts) and inside the admin dashboard's
// default ~30-day / ~55-day horizon (see seed-users.ts) — a submission on an
// exam that "started" before its own course existed, or 100+ days before
// today, would either be a logical impossibility or invisible on every chart.
export const EXAM_PLANS: ExamPlan[] = [
  // Dedicated live-demo exam: kept ONGOING (window still open, see
  // keepOpenForDemo) so the presenter can log in as a student and submit a
  // brand new attempt during the demo itself, while still being pre-seeded
  // with a full history of attempts + every integrity violation type so it
  // isn't empty right after a reset. ⭐ prefix + [DEMO] tag make it
  // impossible to miss in the exam list, which also always sorts it first
  // (see the "đưa bài thi demo lên đầu danh sách" step in seed-master.ts).
  { key: 'seven-types-exam', courseKey: 'seven-types', title: '⭐ [DEMO] Đề kiểm thử đủ 7 loại câu hỏi', questionCount: 7, status: 'ONGOING', keepOpenForDemo: true, startDaysAgo: 1, durationMinutes: 30, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 5 },

  { key: 'intro-it-midterm', courseKey: 'intro-it', title: 'Kiểm tra giữa kỳ - Nhập môn CNTT', questionCount: 20, status: 'COMPLETED_PUBLISHED', startDaysAgo: 30, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'intro-it-final', courseKey: 'intro-it', title: 'Kiểm tra cuối kỳ - Nhập môn CNTT', questionCount: 24, status: 'COMPLETED_PENDING', startDaysAgo: 10, durationMinutes: 60, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'intro-it-practice', courseKey: 'intro-it', title: 'Bài thực hành tuần 10 - Nhập môn CNTT', questionCount: 15, status: 'ONGOING', startDaysAgo: 1, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'intro-it-draft', courseKey: 'intro-it', title: 'Đề thi cuối kỳ (đang soạn)', questionCount: 10, status: 'DRAFT', startDaysAgo: -10, durationMinutes: 60, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },

  { key: 'dsa-midterm', courseKey: 'dsa', title: 'Kiểm tra giữa kỳ - Cấu trúc Dữ liệu', questionCount: 20, status: 'COMPLETED_PUBLISHED', startDaysAgo: 28, durationMinutes: 50, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'dsa-final', courseKey: 'dsa', title: 'Kiểm tra cuối kỳ - Cấu trúc Dữ liệu', questionCount: 22, status: 'COMPLETED_PENDING', startDaysAgo: 9, durationMinutes: 60, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'dsa-practice', courseKey: 'dsa', title: 'Bài thực hành - Cây & Đồ thị', questionCount: 12, status: 'ONGOING', startDaysAgo: 1, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'dsa-draft', courseKey: 'dsa', title: 'Đề ôn tập cuối kỳ (đang soạn)', questionCount: 12, status: 'DRAFT', startDaysAgo: -8, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },

  { key: 'db-midterm', courseKey: 'database', title: 'Kiểm tra giữa kỳ - Cơ sở Dữ liệu', questionCount: 20, status: 'COMPLETED_PUBLISHED', startDaysAgo: 26, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'db-final', courseKey: 'database', title: 'Kiểm tra cuối kỳ - Cơ sở Dữ liệu', questionCount: 22, status: 'COMPLETED_PENDING', startDaysAgo: 8, durationMinutes: 60, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'db-practice', courseKey: 'database', title: 'Bài thực hành SQL', questionCount: 10, status: 'ONGOING', startDaysAgo: 1, durationMinutes: 30, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'db-draft', courseKey: 'database', title: 'Đề thi thực hành nâng cao (đang soạn)', questionCount: 10, status: 'DRAFT', startDaysAgo: -6, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },

  { key: 'net-midterm', courseKey: 'networking', title: 'Kiểm tra giữa kỳ - Mạng máy tính', questionCount: 16, status: 'COMPLETED_PUBLISHED', startDaysAgo: 24, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'net-practice', courseKey: 'networking', title: 'Bài thực hành định tuyến', questionCount: 10, status: 'ONGOING', startDaysAgo: 1, durationMinutes: 30, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },

  { key: 'infosec-midterm', courseKey: 'infosec', title: 'Kiểm tra giữa kỳ - An toàn Thông tin', questionCount: 16, status: 'COMPLETED_PUBLISHED', startDaysAgo: 23, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'infosec-final', courseKey: 'infosec', title: 'Kiểm tra cuối kỳ - An toàn Thông tin', questionCount: 18, status: 'COMPLETED_PENDING', startDaysAgo: 6, durationMinutes: 50, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },

  { key: 'webdev-matrix', courseKey: 'webdev', title: 'Đề thi theo ma trận đề (ngẫu nhiên theo chủ đề)', questionCount: 18, status: 'COMPLETED_PUBLISHED', startDaysAgo: 18, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1, hasMatrix: true },
  { key: 'webdev-multi-attempt', courseKey: 'webdev', title: 'Kiểm tra thực hành (cho phép làm nhiều lượt)', questionCount: 10, status: 'COMPLETED_PUBLISHED', startDaysAgo: 12, durationMinutes: 30, gradingStrategy: 'HIGHEST', maxAttempts: 3 },

  { key: 'ai-midterm', courseKey: 'ai', title: 'Kiểm tra giữa kỳ - Trí tuệ Nhân tạo', questionCount: 14, status: 'COMPLETED_PUBLISHED', startDaysAgo: 14, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'bi-quiz', courseKey: 'business-intel', title: 'Kiểm tra nhanh - Trí tuệ Doanh nghiệp', questionCount: 10, status: 'COMPLETED_PUBLISHED', startDaysAgo: 12, durationMinutes: 25, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'discrete-math-midterm', courseKey: 'discrete-math', title: 'Kiểm tra giữa kỳ - Toán rời rạc', questionCount: 16, status: 'COMPLETED_PUBLISHED', startDaysAgo: 27, durationMinutes: 45, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'soft-skills-essay', courseKey: 'soft-skills', title: 'Bài tự luận - Kỹ năng mềm', questionCount: 8, status: 'COMPLETED_PENDING', startDaysAgo: 9, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
  { key: 'project-mgmt-draft', courseKey: 'project-mgmt', title: 'Đề kiểm tra Agile/Scrum (đang soạn)', questionCount: 10, status: 'DRAFT', startDaysAgo: -15, durationMinutes: 40, gradingStrategy: 'LAST_ATTEMPT', maxAttempts: 1 },
];

function toExamStatus(plan: ExamPlan): { status: string; statusEnum: string } {
  if (plan.status === 'DRAFT') return { status: 'DRAFT', statusEnum: 'DRAFT' };
  if (plan.status === 'ONGOING') return { status: 'ONGOING', statusEnum: 'ONGOING' };
  return { status: 'COMPLETED', statusEnum: 'COMPLETED' };
}

export async function main(seeded?: Awaited<ReturnType<typeof seedTopics>>) {
  try {
    const result = seeded ?? (await seedTopics());
    const { coursesByKey, questionsByCourseKey, lecturerUsers } = result;

    const examsByKey: Record<string, {
      plan: ExamPlan;
      exam: any;
      course: any;
      snapshot?: Awaited<ReturnType<typeof createExamSnapshot>>;
    }> = {};

    for (const plan of EXAM_PLANS) {
      const course = coursesByKey[plan.courseKey];
      const pool = questionsByCourseKey[plan.courseKey] ?? [];
      if (pool.length === 0) continue;

      const rng = makeRng(seedFromString(`exam:${plan.key}`));
      const { status, statusEnum } = toExamStatus(plan);
      const startTime = daysAgo(plan.startDaysAgo);
      // The exam window (startTime..endTime) is when students may take it —
      // wider than a single sitting's `duration` so submissions can spread
      // across several real days instead of one instant (needed for the
      // "submissions per day" chart to show more than a single spike).
      const windowDays = plan.status === 'DRAFT' ? 0 : 4;
      const endTime = new Date(startTime.getTime() + windowDays * 24 * 3_600_000 + plan.durationMinutes * 60_000);

      // Pick `questionCount` questions from this course's pool, favouring a
      // mix of types instead of the first N (which would be skewed toward
      // whichever type was generated first).
      const shuffled = [...pool].sort(() => rng() - 0.5);
      const chosen = shuffled.slice(0, Math.min(plan.questionCount, shuffled.length));
      // Each question's weight is whatever the bank assigned it (see
      // pointsForType in seed-question-bank.ts) — inherited the same way a
      // real exam-builder flow inherits question.defaultPoints, so the exam's
      // totalPoints always matches the sum of what students can actually earn
      // instead of assuming every question is worth exactly 1 point.
      const assignedScores = chosen.map((q) => Number(q.defaultPoints ?? q.points ?? 1));
      const totalPoints = assignedScores.reduce((sum, score) => sum + score, 0) || plan.questionCount;

      let exam = await prisma.exam.findFirst({ where: { courseId: course.id, title: plan.title } });
      if (!exam) {
        exam = await prisma.exam.create({
          data: {
            courseId: course.id,
            title: plan.title,
            description: `${plan.title} — dữ liệu demo ExamTrust.`,
            duration: plan.durationMinutes,
            timeLimitMinutes: plan.durationMinutes,
            totalPoints,
            passingScore: Math.round(totalPoints * 0.5),
            startTime,
            endTime,
            status,
            statusEnum: statusEnum as any,
            mode: 'NORMAL',
            maxAttempts: plan.maxAttempts,
            gradingStrategy: plan.gradingStrategy as any,
            scoringScale: 10,
            scoringRounding: 2,
            creatorId: course.lecturerId,
            createdAt: new Date(startTime.getTime() - 5 * 24 * 3_600_000),
            questionSelectionConfig: plan.hasMatrix
              ? {
                sourceMethod: 'composite',
                selectionMode: 'composite',
                randomizePerStudent: true,
                requestedQuestionCount: Math.max(3, Math.round(plan.questionCount * 0.3)),
                randomRequestedQuestionCount: Math.max(3, Math.round(plan.questionCount * 0.3)),
                topicAllocations: [{ topicLabel: 'ngẫu nhiên theo chủ đề', count: Math.max(3, Math.round(plan.questionCount * 0.3)) }],
              }
              : undefined,
          },
        });
      }

      for (let i = 0; i < chosen.length; i++) {
        const q = chosen[i];
        const version = await prisma.questionVersion.findFirst({
          where: { questionId: q.id },
          orderBy: { versionNo: 'desc' },
        });
        const assignedScore = assignedScores[i];
        await prisma.examQuestion.upsert({
          where: { examId_questionId: { examId: exam.id, questionId: q.id } },
          update: {},
          create: {
            examId: exam.id,
            questionId: q.id,
            questionVersionId: version?.id ?? null,
            orderIndex: i + 1,
            points: assignedScore,
            assignedScore,
          },
        });
      }

      let snapshot: Awaited<ReturnType<typeof createExamSnapshot>> | undefined;
      if (plan.status !== 'DRAFT') {
        const existingSnapshot = await prisma.examSnapshot.findFirst({ where: { examId: exam.id } });
        if (existingSnapshot) {
          const snapshotQuestions = await prisma.examQuestionSnapshot.findMany({ where: { examSnapshotId: existingSnapshot.id } });
          snapshot = {
            examSnapshot: existingSnapshot,
            snapshotQuestions: snapshotQuestions.map((sq) => ({
              questionId: sq.questionId,
              questionVersionId: sq.questionVersionId,
              questionSnapshotId: sq.questionSnapshotId!,
              assignedScore: Number(sq.assignedScore ?? 1),
              orderIndex: sq.orderIndex,
              type: String((sq.payload as any)?.type || '').toUpperCase(),
              answerKey: (sq.payload as any)?.answerKey ?? null,
            })),
          };
        } else {
          snapshot = await createExamSnapshot(prisma, exam.id, startTime, course.lecturerId);
        }
      }

      examsByKey[plan.key] = { plan, exam, course, snapshot };
    }

    console.log(`[seed-exams] exams=${Object.keys(examsByKey).length}`);
    return { ...result, examsByKey };
  } finally {
    await prisma.$disconnect();
  }
}

// Called as the very last step of seed-master.ts (after every other seed
// script has finished writing) so this exam's `updatedAt` is unambiguously
// the newest row in the table — the exam list's default sort is
// `updatedAt desc` (see exams.service.ts findAll) — regardless of where
// "seven-types-exam" sits in EXAM_PLANS or how much later steps touch other
// exams' rows.
export async function touchDemoExamToTop() {
  try {
    const demoPlan = EXAM_PLANS.find((p) => p.key === 'seven-types-exam');
    if (!demoPlan) return;
    const exam = await prisma.exam.findFirst({ where: { title: demoPlan.title } });
    if (!exam) return;
    await prisma.exam.update({ where: { id: exam.id }, data: { updatedAt: new Date() } });
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-exams.ts')) {
  main().catch((error) => {
    console.error('[seed-exams] failed:', error);
    process.exit(1);
  });
}
