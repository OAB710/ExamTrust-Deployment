import { PrismaClient, QuestionLifecycleStatus, Prisma } from '@prisma/client';
import { QUESTION_TYPES, QuestionType, buildQuestionTemplate, makeRng, seedFromString, pick, randInt } from './seed-helpers';
import { main as seedCourses } from './seed-courses';

const prisma = new PrismaClient();

// Per-course question volume + type emphasis. Every course still gets all 7
// types at least once (see buildTypePlan) — weights only bias how many EXTRA
// questions of a type get added on top of that baseline. Max is capped at 100.
const COURSE_QUESTION_PLAN: Record<string, { count: number; emphasize?: QuestionType[] }> = {
  'intro-it': { count: 90, emphasize: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FIND_ERROR'] },
  dsa: { count: 70, emphasize: ['ORDERING', 'MATCHING', 'MULTIPLE_CHOICE'] },
  database: { count: 60, emphasize: ['MULTIPLE_CHOICE', 'FIND_ERROR'] },
  networking: { count: 45, emphasize: ['TRUE_FALSE', 'MULTIPLE_CHOICE'] },
  infosec: { count: 45, emphasize: ['MULTIPLE_CHOICE', 'ESSAY'] },
  webdev: { count: 55, emphasize: ['FIND_ERROR', 'MULTIPLE_CHOICE', 'FILL_IN_BLANK'] },
  ai: { count: 35, emphasize: ['ESSAY', 'MULTIPLE_CHOICE'] },
  'business-intel': { count: 22, emphasize: ['ESSAY', 'MULTIPLE_CHOICE'] },
  'discrete-math': { count: 40, emphasize: ['ORDERING', 'MATCHING', 'TRUE_FALSE'] },
  'soft-skills': { count: 20, emphasize: ['ESSAY', 'FILL_IN_BLANK'] },
  'project-mgmt': { count: 18, emphasize: ['ESSAY', 'MULTIPLE_CHOICE'] },
  'seven-types': { count: 7 }, // exactly 1 of each type, see the branch below
};

export const COURSE_TOPIC_LABELS: Record<string, string[]> = {
  'intro-it': ['Phần cứng máy tính', 'Hệ điều hành', 'Mạng cơ bản', 'An toàn thông tin cơ bản', 'Internet & Web'],
  dsa: ['Danh sách liên kết', 'Cây nhị phân', 'Đồ thị', 'Giải thuật sắp xếp', 'Đệ quy & chia để trị'],
  database: ['Mô hình quan hệ', 'Chuẩn hoá dữ liệu', 'Truy vấn SQL', 'Giao dịch & khoá', 'Chỉ mục & tối ưu truy vấn'],
  // "Bảo mật hạ tầng mạng" (networking) và "Bảo mật mạng" (infosec) mô tả gần
  // như cùng nội dung bằng cách diễn đạt khác nhau — case tương đồng chủ đề
  // xuyên course (plan mục 4.4) cho tính năng gợi ý topic tương đồng.
  networking: ['Mô hình OSI', 'TCP/IP', 'Định tuyến', 'DNS & DHCP', 'Mạng không dây', 'Bảo mật hạ tầng mạng'],
  infosec: ['Mã hoá đối xứng', 'Mã hoá bất đối xứng', 'Bảo mật mạng', 'Quản lý rủi ro an ninh', 'Chứng chỉ số & PKI'],
  webdev: ['HTML/CSS', 'JavaScript nâng cao', 'REST API', 'Bảo mật ứng dụng web', 'Triển khai & CI/CD'],
  ai: ['Học máy giám sát', 'Học sâu', 'Xử lý ngôn ngữ tự nhiên', 'Thị giác máy tính'],
  'business-intel': ['Kho dữ liệu', 'Trực quan hoá dữ liệu', 'Chỉ số kinh doanh KPI'],
  'discrete-math': ['Logic mệnh đề', 'Lý thuyết tập hợp', 'Tổ hợp', 'Lý thuyết đồ thị'],
  'soft-skills': ['Giao tiếp trong nhóm dự án', 'Thuyết trình kỹ thuật', 'Viết tài liệu kỹ thuật'],
  'project-mgmt': ['Quản lý phạm vi dự án', 'Agile/Scrum', 'Quản lý rủi ro dự án'],
  'seven-types': ['Tổng hợp kiểm thử'],
};

// Manual-grading types are worth more points than auto-graded ones — both
// more realistic, and it gives SubmissionAnswer.pointsAwarded (an Int column)
// a real 0..N range to show partial credit in. Set once here (the single
// source of truth for a question's weight) so every exam that pulls this
// question inherits the same value instead of guessing it independently.
function pointsForType(type: QuestionType): number {
  return type === 'ESSAY' || type === 'FILL_IN_BLANK' ? 4 : 1;
}

function buildTypePlan(count: number, emphasize: QuestionType[] = [], rng: () => number): QuestionType[] {
  const plan: QuestionType[] = [...QUESTION_TYPES];
  const remaining = Math.max(0, Math.min(100, count) - plan.length);
  for (let i = 0; i < remaining; i++) {
    const pool = emphasize.length && rng() < 0.6 ? emphasize : QUESTION_TYPES;
    plan.push(pick(rng, pool as QuestionType[]));
  }
  return plan;
}

function pickDifficulty(rng: () => number): number {
  // Light bell curve centered on 4-6 (Trung bình), rare 1-2 / 9-10.
  const roll = rng() + rng() + rng();
  return Math.max(1, Math.min(10, Math.round((roll / 3) * 9) + 1));
}

function pickLifecycleStatus(index: number, total: number, rng: () => number): QuestionLifecycleStatus {
  if (total >= 10) {
    if (index === total - 1) return QuestionLifecycleStatus.ARCHIVED;
    if (index === total - 2 && total >= 20) return QuestionLifecycleStatus.ARCHIVED;
    if (rng() < 0.06) return QuestionLifecycleStatus.DRAFT;
    if (rng() < 0.06) return QuestionLifecycleStatus.IN_REVIEW;
  }
  return QuestionLifecycleStatus.PUBLISHED;
}

export async function main(seeded?: Awaited<ReturnType<typeof seedCourses>>) {
  try {
    const { lecturerUsers, studentUsers, coursesByKey } = seeded ?? (await seedCourses());

    const questionsByCourseKey: Record<string, any[]> = {};

    for (const [courseKey, course] of Object.entries(coursesByKey)) {
      const plan = COURSE_QUESTION_PLAN[courseKey] ?? { count: 20 };
      const topics = COURSE_TOPIC_LABELS[courseKey] ?? ['Nội dung tổng hợp'];
      const rng = makeRng(seedFromString(`question-bank:${courseKey}`));
      const typePlan = courseKey === 'seven-types'
        ? [...QUESTION_TYPES]
        : buildTypePlan(plan.count, plan.emphasize, rng);

      const createdAt0 = new Date(course.createdAt.getTime() + 3 * 24 * 3_600_000); // a few days after the course itself
      const created: any[] = [];

      for (let i = 0; i < typePlan.length; i++) {
        const type = typePlan[i];
        const topic = pick(rng, topics);
        const template = buildQuestionTemplate(type, topic, i + 1, rng);
        const difficulty = courseKey === 'seven-types' ? 5 : pickDifficulty(rng);
        const status = courseKey === 'seven-types'
          ? QuestionLifecycleStatus.PUBLISHED
          : pickLifecycleStatus(i, typePlan.length, rng);
        const createdAt = new Date(createdAt0.getTime() + i * randInt(rng, 4, 30) * 3_600_000);

        const existing = await prisma.question.findFirst({
          where: { courseId: course.id, content: template.content },
        });

        const question = existing ?? await prisma.question.create({
          data: {
            type: template.type,
            content: template.content,
            options: template.options ?? Prisma.JsonNull,
            correctAnswer: template.correctAnswer ?? Prisma.JsonNull,
            explanation: template.explanation,
            difficulty,
            points: pointsForType(template.type),
            defaultPoints: pointsForType(template.type),
            courseId: course.id,
            creatorId: course.lecturerId,
            status,
            latestVersionNo: 1,
            isReusable: true,
            createdAt,
            updatedAt: createdAt,
          },
        });

        await prisma.questionVersion.upsert({
          where: { questionId_versionNo: { questionId: question.id, versionNo: 1 } },
          update: {},
          create: {
            questionId: question.id,
            versionNo: 1,
            stem: template.content,
            payload: template.options ?? Prisma.JsonNull,
            answerKey: template.correctAnswer ?? Prisma.JsonNull,
            explanation: template.explanation,
            difficulty,
            points: pointsForType(template.type),
            metadata: { seededQuestionType: template.type },
            createdBy: question.creatorId,
            createdAt,
          },
        });

        created.push({ ...question, difficulty, topic, createdAt });
      }

      questionsByCourseKey[courseKey] = created;
    }

    // Version-history case (plan 4.2): a handful of DSA questions get a 2nd,
    // revised version with a different difficulty/statistics profile so the
    // question-history chart shows a believable before/after.
    const dsaQuestions = questionsByCourseKey['dsa'] ?? [];
    const revisionRng = makeRng(seedFromString('question-bank:dsa:revisions'));
    const revisedCount = Math.min(12, dsaQuestions.length);
    for (let i = 0; i < revisedCount; i++) {
      const q = dsaQuestions[i];
      const newDifficulty = Math.max(1, Math.min(10, q.difficulty + (revisionRng() > 0.5 ? 2 : -2)));
      const revisedAt = new Date(q.createdAt.getTime() + randInt(revisionRng, 20, 60) * 24 * 3_600_000);

      const v1 = await prisma.questionVersion.findUniqueOrThrow({
        where: { questionId_versionNo: { questionId: q.id, versionNo: 1 } },
      });
      const v2 = await prisma.questionVersion.upsert({
        where: { questionId_versionNo: { questionId: q.id, versionNo: 2 } },
        update: {},
        create: {
          questionId: q.id,
          versionNo: 2,
          stem: `${q.content} (đã chỉnh sửa để rõ ràng hơn)`,
          payload: q.options ?? Prisma.JsonNull,
          answerKey: q.correctAnswer ?? Prisma.JsonNull,
          explanation: q.explanation,
          difficulty: newDifficulty,
          points: pointsForType(q.type),
          metadata: { seededQuestionType: q.type, revisionOf: 1 },
          createdBy: q.creatorId,
          createdAt: revisedAt,
        },
      });
      await prisma.question.update({ where: { id: q.id }, data: { latestVersionNo: 2, difficulty: newDifficulty } });

      // Older version keeps a "harder, more missed" stats profile; the
      // revision looks easier — a believable before/after for the chart.
      await prisma.questionStatistics.upsert({
        where: { questionVersionId: v1.id },
        update: {},
        create: {
          questionVersionId: v1.id,
          questionId: q.id,
          totalAttempts: 40,
          correctAttempts: 14,
          incorrectAttempts: 26,
          skippedAttempts: 0,
          pValue: 0.35,
          difficultyIndex: 0.65,
          discriminationIndex: 0.3,
          lastRecomputedAt: revisedAt,
        },
      });
      await prisma.questionStatistics.upsert({
        where: { questionVersionId: v2.id },
        update: {},
        create: {
          questionVersionId: v2.id,
          questionId: q.id,
          totalAttempts: 30,
          correctAttempts: 24,
          incorrectAttempts: 6,
          skippedAttempts: 0,
          pValue: 0.8,
          difficultyIndex: 0.2,
          discriminationIndex: 0.35,
          lastRecomputedAt: revisedAt,
        },
      });
    }

    console.log(`[seed-question-bank] courses=${Object.keys(questionsByCourseKey).length} totalQuestions=${Object.values(questionsByCourseKey).reduce((s, arr) => s + arr.length, 0)}`);
    return { lecturerUsers, studentUsers, coursesByKey, questionsByCourseKey };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-question-bank.ts')) {
  main().catch((error) => {
    console.error('[seed-question-bank] failed:', error);
    process.exit(1);
  });
}
