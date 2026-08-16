/**
 * Seed riêng cho trang "Lịch sử phiên bản & phân tích chất lượng câu hỏi"
 * (lecturer/question-history?courseCode=...&courseId=...).
 *
 * Tạo khoá học QHIST-2026 với 10 câu hỏi, mỗi câu có NHIỀU phiên bản
 * (QuestionVersion) + thống kê chất lượng (QuestionStatistics) + dữ liệu trả lời
 * qua 3 kỳ thi ("lần thi") để hiển thị đủ:
 *   - Tab "Theo phiên bản": nhiều phiên bản mỗi câu với chỉ số độ khó/phân biệt/độ tin cậy.
 *   - Tab "Theo lần thi": 3 kỳ thi với tỷ lệ trả lời đúng theo từng lần.
 *   - Tab "Lịch sử chỉnh sửa": timeline các phiên bản (có cả phiên bản AI).
 *   - Xu hướng đa dạng: improving / stable / degrading (một số "Cần xem xét").
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-question-history-demo.ts
 *
 * Idempotent (dùng upsert).
 */
import { PrismaClient, QuestionLifecycleStatus, CourseTerm } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_CODE = 'QHIST-2026';
const LECTURER_EMAIL = 'lecturer01@tdtutdtu.edu.vn';
const TOPIC_CODE = 'QHIST-2026-QB';
const STUDENTS_PER_EXAM = 18; // dùng 522h0001..522h0018

const studentCode = (i: number) => `522h${String(i + 1).padStart(4, '0')}`;

type VersionSpec = { rate: number; aiGenerated?: boolean };
type QuestionSpec = {
  type: string;
  stem: (v: number) => string;
  versions: VersionSpec[];
};

// rate = tỷ lệ trả lời đúng của phiên bản đó (p - càng cao càng dễ).
const QUESTIONS: QuestionSpec[] = [
  { type: 'MULTIPLE_CHOICE',
    stem: () => '[QHIST-2026] Which clause filters aggregated rows after a GROUP BY?',
    versions: [{ rate: 0.35 }, { rate: 0.62 }, { rate: 0.8, aiGenerated: true }] }, // improving
  { type: 'TRUE_FALSE',
    stem: () => '[QHIST-2026] An index speeds up reads but can slow down writes.',
    versions: [{ rate: 0.55 }, { rate: 0.58 }] }, // stable
  { type: 'MULTI_SELECT',
    stem: () => '[QHIST-2026] Select the SQL joins that only return matching rows.',
    versions: [{ rate: 0.6 }, { rate: 0.62 }, { rate: 0.61 }] }, // stable
  { type: 'SHORT_ANSWER',
    stem: () => '[QHIST-2026] Explain why normalization reduces update anomalies.',
    versions: [{ rate: 0.4 }, { rate: 0.55 }, { rate: 0.73 }] }, // improving
  { type: 'FILL_IN_BLANK',
    stem: () => '[QHIST-2026] Complete: "The ___ keyword removes duplicate rows."',
    versions: [{ rate: 0.7 }, { rate: 0.55 }, { rate: 0.4 }] }, // degrading
  { type: 'MATCHING',
    stem: () => '[QHIST-2026] Match each SQL join type with its behaviour.',
    versions: [{ rate: 0.65 }, { rate: 0.63 }] }, // stable
  { type: 'ORDERING',
    stem: () => '[QHIST-2026] Order the logical clauses of a SELECT statement.',
    versions: [{ rate: 0.3 }, { rate: 0.5 }, { rate: 0.66 }] }, // improving
  { type: 'FIND_ERROR',
    stem: () => '[QHIST-2026] Find the line containing a syntax error.',
    versions: [{ rate: 0.72 }, { rate: 0.5 }, { rate: 0.33 }] }, // degrading
  { type: 'MULTI_SELECT',
    stem: () => '[QHIST-2026] Select aggregate-friendly clauses in SQL.',
    versions: [{ rate: 0.58 }, { rate: 0.6 }, { rate: 0.59 }] }, // stable
  { type: 'MULTIPLE_CHOICE',
    stem: () => '[QHIST-2026] Which operator performs pattern matching in SQL?',
    versions: [{ rate: 0.78 }, { rate: 0.6, aiGenerated: true }, { rate: 0.42 }] }, // degrading
];

const EXAMS: Array<{ title: string; year: number; month: number; day: number }> = [
  { title: 'Ôn tập Học kỳ 1 – 2026', year: 2026, month: 0, day: 10 },
  { title: 'Kiểm tra giữa kỳ – 2026', year: 2026, month: 2, day: 15 },
  { title: 'Kiểm tra cuối kỳ – 2026', year: 2026, month: 4, day: 20 },
];

async function main() {
  const lecturer = await prisma.user.findUnique({ where: { email: LECTURER_EMAIL } });
  if (!lecturer) throw new Error(`Không tìm thấy giảng viên ${LECTURER_EMAIL}`);

  // 1) Khoá học.
  const course = await prisma.course.upsert({
    where: { code: COURSE_CODE },
    update: { name: 'Lịch sử câu hỏi & phân tích chất lượng 2026', lecturerId: lecturer.id, status: 'active', academicYear: '2026', term: CourseTerm.TERM_1 },
    create: { code: COURSE_CODE, name: 'Lịch sử câu hỏi & phân tích chất lượng 2026', lecturerId: lecturer.id, status: 'active', academicYear: '2026', term: CourseTerm.TERM_1, credits: 3 },
  });

  const topic = await prisma.topic.upsert({
    where: { courseId_code: { courseId: course.id, code: TOPIC_CODE } },
    update: { name: 'SQL & data analytics' },
    create: { courseId: course.id, code: TOPIC_CODE, name: 'SQL & data analytics' },
  });
  await prisma.courseTopic.upsert({ where: { courseId_topicId: { courseId: course.id, topicId: topic.id } }, update: {}, create: { courseId: course.id, topicId: topic.id } });

  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, studentId: true } });
  const studentsByCode = new Map<string, string>();
  for (const s of students) if (s.studentId) studentsByCode.set(s.studentId, s.id);
  const usedStudents = Array.from({ length: STUDENTS_PER_EXAM }, (_, i) => studentsByCode.get(studentCode(i))).filter(Boolean) as string[];
  if (usedStudents.length < STUDENTS_PER_EXAM) throw new Error('Thiếu sinh viên; hãy chạy seed accounts trước.');

  // 2) Tạo 10 câu hỏi + các phiên bản.
  const questionRows: Array<{ id: string; type: string; versions: Array<{ id: string; versionNo: number; rate: number; aiGenerated: boolean }> }> = [];
  for (const q of QUESTIONS) {
    const content = q.stem(1);
    const existing = await prisma.question.findFirst({ where: { courseId: course.id, content }, select: { id: true } });
    const question = existing ?? (await prisma.question.create({
      data: { type: q.type, content, options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correctAnswer: { answer: 'A' }, difficulty: 5, points: 1, defaultPoints: 1, courseId: course.id, creatorId: lecturer.id, status: QuestionLifecycleStatus.PUBLISHED, latestVersionNo: q.versions.length, isReusable: true },
    }));
    await prisma.questionCourseScope.upsert({ where: { questionId_courseId: { questionId: question.id, courseId: course.id } }, update: {}, create: { questionId: question.id, courseId: course.id } });
    await prisma.questionTopic.upsert({ where: { questionId_topicId: { questionId: question.id, topicId: topic.id } }, update: { weight: 1 }, create: { questionId: question.id, topicId: topic.id, weight: 1 } });

    const versionRows: typeof questionRows[0]['versions'] = [];
    for (let v = 0; v < q.versions.length; v += 1) {
      const spec = q.versions[v];
      const versionNo = v + 1;
      const stem = q.stem(versionNo);
      // Spread version creation dates across months so "Lịch sử chỉnh sửa"
      // timeline reads as a real progression, aligned with the exam dates.
      const versionCreatedAt = new Date(Date.UTC(2026, 0, 1 + (versionNo - 1) * 75, 0, 0, 0));
      const version = await prisma.questionVersion.upsert({
        where: { questionId_versionNo: { questionId: question.id, versionNo } },
        update: { stem, payload: { A: 'a', B: 'b', C: 'c', D: 'd' }, answerKey: { answer: 'A' }, aiGenerated: Boolean(spec.aiGenerated), createdAt: versionCreatedAt },
        create: { questionId: question.id, versionNo, stem, payload: { A: 'a', B: 'b', C: 'c', D: 'd' }, answerKey: { answer: 'A' }, aiGenerated: Boolean(spec.aiGenerated), metadata: { seededHistoryDemo: true, targetCorrectRate: spec.rate }, createdBy: lecturer.id, createdAt: versionCreatedAt },
      });
      versionRows.push({ id: version.id, versionNo, rate: spec.rate, aiGenerated: Boolean(spec.aiGenerated) });
    }
    questionRows.push({ id: question.id, type: q.type, versions: versionRows });
  }

  // 3) Tạo 3 kỳ thi ("lần thi").
  const exams: Array<{ id: string; title: string; date: Date }> = [];
  for (const spec of EXAMS) {
    const start = new Date(Date.UTC(spec.year, spec.month, spec.day, 1, 0, 0));
    const end = new Date(start.getTime() + 2 * 60 * 60_000);
    let exam = await prisma.exam.findFirst({ where: { courseId: course.id, title: spec.title, deletedAt: null } });
    if (!exam) {
      exam = await prisma.exam.create({
        data: { title: spec.title, description: `Kỳ thi minh hoạ lịch sử câu hỏi – ${spec.title}`, courseId: course.id, creatorId: lecturer.id, duration: 90, timeLimitMinutes: 90, totalPoints: 10, passingScore: 5, maxAttempts: 1, status: 'COMPLETED', startTime: start, endTime: end, resultsPublishedAt: end, scoringScale: 10, gradingStrategy: 'HIGHEST', settings: { autoGrade: true, showResult: false }, questionSelectionConfig: { mode: 'FIXED' } },
      });
    }
    exams.push({ id: exam.id, title: spec.title, date: start });
  }

  // 4) Phiên bản dùng trong mỗi kỳ thi.
  const versionForExam = (qVersions: typeof questionRows[0]['versions'], examIndex: number) => {
    if (qVersions.length === 1) return qVersions[0];
    if (qVersions.length === 2) return examIndex === 0 ? qVersions[0] : qVersions[1];
    return qVersions[Math.min(examIndex, qVersions.length - 1)];
  };

  const orderIndexByQuestion = new Map<string, number>();
  questionRows.forEach((q, index) => orderIndexByQuestion.set(q.id, index));

  // 5) Submissions + answers theo phiên bản dùng trong từng kỳ.
  for (let e = 0; e < exams.length; e += 1) {
    const exam = exams[e];
    const ctx = questionRows.map((q) => ({ questionId: q.id, version: versionForExam(q.versions, e) }));

    for (const c of ctx) {
      await prisma.examQuestion.upsert({
        where: { examId_questionId: { examId: exam.id, questionId: c.questionId } },
        update: { questionVersionId: c.version.id, orderIndex: orderIndexByQuestion.get(c.questionId)!, points: 1 },
        create: { examId: exam.id, questionId: c.questionId, questionVersionId: c.version.id, orderIndex: orderIndexByQuestion.get(c.questionId)!, points: 1 },
      });
    }

    for (let s = 0; s < usedStudents.length; s += 1) {
      const studentId = usedStudents[s];
      await prisma.enrollment.upsert({ where: { courseId_studentId: { courseId: course.id, studentId } }, update: {}, create: { courseId: course.id, studentId, status: 'active' } });

      const startedAt = new Date(exam.date.getTime() + s * 60_000);
      const submittedAt = new Date(startedAt.getTime() + 45 * 60_000);

      const submission = await prisma.examSubmission.upsert({
        where: { examId_studentId_attemptNo: { examId: exam.id, studentId, attemptNo: 1 } },
        update: { status: 'GRADED', startedAt, submittedAt, gradedAt: submittedAt },
        create: { examId: exam.id, studentId, attemptNo: 1, status: 'GRADED', startedAt, submittedAt, gradedAt: submittedAt },
      });

      let correctCount = 0;
      for (const c of ctx) {
        const correct = s < Math.round(c.version.rate * usedStudents.length);
        if (correct) correctCount += 1;
        await prisma.submissionAnswer.upsert({
          where: { submissionId_questionId: { submissionId: submission.id, questionId: c.questionId } },
          update: { questionVersionId: c.version.id, answer: { answer: 'A' }, isCorrect: correct, sequence: orderIndexByQuestion.get(c.questionId)! + 1 },
          create: { submissionId: submission.id, questionId: c.questionId, questionVersionId: c.version.id, answer: { answer: 'A' }, isCorrect: correct, sequence: orderIndexByQuestion.get(c.questionId)! + 1 },
        });
      }
      await prisma.examSubmission.update({ where: { id: submission.id }, data: { score: Math.min(10, correctCount) } });
    }
  }

  // 6) Cập nhật QuestionStatistics cho từng phiên bản.
  for (const q of questionRows) {
    for (const v of q.versions) {
      const aggRows = await prisma.submissionAnswer.findMany({
        where: { questionVersionId: v.id, submission: { status: { in: ['SUBMITTED', 'GRADED', 'FLAGGED', 'FINALIZED'] } } },
        select: { isCorrect: true },
      });
      const total = aggRows.length;
      const correct = aggRows.filter((r) => Boolean(r.isCorrect)).length;
      const pValue = total > 0 ? correct / total : 0;
      await prisma.questionStatistics.upsert({
        where: { questionVersionId: v.id },
        update: { questionId: q.id, totalAttempts: total, correctAttempts: correct, incorrectAttempts: total - correct, skippedAttempts: 0, pValue, difficultyIndex: pValue, discriminationIndex: Math.max(-1, Math.min(1, 2 * pValue - 1)), lastRecomputedAt: new Date() },
        create: { questionVersionId: v.id, questionId: q.id, totalAttempts: total, correctAttempts: correct, incorrectAttempts: total - correct, skippedAttempts: 0, pValue, difficultyIndex: pValue, discriminationIndex: Math.max(-1, Math.min(1, 2 * pValue - 1)), lastRecomputedAt: new Date() },
      });
    }
  }

  console.log('=== Seed Lịch sử câu hỏi hoàn tất ===');
  console.log(`Khoá học: ${course.code} (id: ${course.id})`);
  console.log(`Số câu hỏi: ${questionRows.length}; kỳ thi: ${exams.length}`);
  console.log(`URL: http://localhost:3000/lecturer/question-history?courseCode=${course.code}&courseId=${course.id}`);
}

main()
  .catch((error) => { console.error(error); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });