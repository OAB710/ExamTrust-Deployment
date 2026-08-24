/**
 * Seed riêng cho màn hình Theo dõi thời gian thực phiên làm bài
 * (lecturer/exam/:id/monitor).
 *
 * Tạo một bài thi "Bài thi giám sát thời gian thực 2026" (năm học 2026, học kỳ 1)
 * cùng 33 phiên làm bài thật (tái sử dụng 36 sinh viên 522hXXXX) để thể hiện:
 *   - Phân bố điểm số (score distribution) đầy đủ 5 khoảng.
 *   - Toàn bộ loại tín hiệu gian lận trong luồng cảnh báo (anomaly feed).
 *     Lưu ý: getExamOverview chỉ hiển thị TOP-25 anomalies (timestamp mới nhất),
 *     nên seed tạo ĐÚNG 25 integrity-log nghi vấn (mỗi loại ít nhất 1) và để
 *     tabSwitchCount/mouseAnomalies = 0 (tránh synthetic log "now" dìm mất các
 *     loại khác). Nhờ vậy cả 10 loại đều xuất hiện trong feed:
 *       tab_switch, mouse_anomaly, mouse_idle, copy, paste, fullscreen_exit,
 *       window_blur, face_not_detected, camera_stream_ended, camera_recovery_timeout.
 *   - Đa dạng mức độ rủi ro trên bảng phiên làm bài:
 *       HIGH  = FLAGGED (3) + hoàn thành nhanh HIGH (2) + >=5 sự kiện (2)
 *       WATCH = hoàn thành nhanh REVIEW (1) + 2-4 sự kiện (5)
 *       CLEAN = còn lại.
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-monitor-ui-demo.ts
 *
 * Script idempotent (dùng upsert) nên chạy lại nhiều lần an toàn.
 */
import { PrismaClient, QuestionLifecycleStatus, CourseTerm } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const COURSE_CODE = 'MONITOR-2026';
const EXAM_TITLE = 'Bài thi giám sát thời gian thực 2026';
const LECTURER_EMAIL = 'lecturer01@tdtutdtu.edu.vn';
const STUDENT_ID_PATTERN = (index: number) => `522h${String(index + 1).padStart(4, '0')}`;
const STUDENT_COUNT = 36;
const TOPIC_CODE = 'MONITOR-2026-QB';
const ALLOWED_MINUTES = 90;
const QUESTION_COUNT = 10;
const TOTAL_POINTS = 10; // điểm 0-10 => scorePct 0-100 cho phân bố điểm số

// ProctoringEvidenceCapture.captureNonceHash is @unique @db.VarChar(64) —
// exactly 64 hex chars, no room for a suffix.
const randomHash64 = () => randomBytes(32).toString('hex');
// IntegrityLog.clientEventId is @db.VarChar(80), unique only within one
// proctoring session (see the proctoringId_clientEventId compound key) — a
// short random prefix is enough entropy, the descriptive suffix is for
// readability during debugging, not uniqueness.
const shortEventId = (suffix: string) => `${randomBytes(6).toString('hex')}-${suffix}`.slice(0, 80);

type LogSpec = { type: string; details: string; minutesAgo: number };
type Profile = {
  hasSubmission: boolean;
  status?: 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED' | 'FLAGGED';
  elapsedMin?: number;
  score?: number;
  answers?: number;
  evidence?: number;
  logs?: LogSpec[];
};

const now = Date.now();

// FACTORIES -------------------------------------------------------------
const tabLog = (n: number, m: number): LogSpec => ({ type: 'tab_switch', details: `Đã ghi nhận ${n} lần chuyển tab`, minutesAgo: m });
const mouseLog = (n: number, m: number): LogSpec => ({ type: 'mouse_anomaly', details: `Đã ghi nhận ${n} lần chuyển động chuột bất thường`, minutesAgo: m });
const idleLog = (m: number): LogSpec => ({ type: 'mouse_idle', details: 'Không thao tác chuột/bàn phím trong thời gian dài', minutesAgo: m });
const copyLog = (m: number): LogSpec => ({ type: 'copy', details: 'Thao tác sao chép nội dung', minutesAgo: m });
const pasteLog = (m: number): LogSpec => ({ type: 'paste', details: 'Thao tác dán nội dung', minutesAgo: m });
const fullscreenLog = (m: number): LogSpec => ({ type: 'fullscreen_exit', details: 'Thoát chế độ toàn màn hình', minutesAgo: m });
const blurLog = (m: number): LogSpec => ({ type: 'window_blur', details: 'Mất tiêu điểm cửa sổ làm bài', minutesAgo: m });
const noFaceLog = (m: number): LogSpec => ({ type: 'face_not_detected', details: 'Không phát hiện khuôn mặt trong khung hình webcam', minutesAgo: m });
const camEndLog = (m: number): LogSpec => ({ type: 'camera_stream_ended', details: 'Webcam giám sát không còn khả dụng', minutesAgo: m });
const camTimeoutLog = (m: number): LogSpec => ({ type: 'camera_recovery_timeout', details: 'Webcam không được khôi phục kịp thời', minutesAgo: m });

// PROFILES (index 0..35) --------------------------------------------------
const PROFILES: Profile[] = [
  // ---- FLAGGED (RỦI RO CAO) ----
  { hasSubmission: true, status: 'FLAGGED', elapsedMin: 62, score: 4.0, evidence: 3,
    logs: [tabLog(3, 1), noFaceLog(0)] },
  { hasSubmission: true, status: 'FLAGGED', elapsedMin: 55, score: 5.0, evidence: 2,
    logs: [copyLog(1), pasteLog(0)] },
  { hasSubmission: true, status: 'FLAGGED', elapsedMin: 48, score: 3.0, evidence: 1,
    logs: [fullscreenLog(1), camEndLog(0)] },
  // ---- ĐANG LÀM, RỦI RO CAO (5 sự kiện) ----
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 5, evidence: 0,
    logs: [tabLog(4, 3), mouseLog(2, 3), copyLog(2), pasteLog(1), fullscreenLog(1)] },
  // ---- ĐANG LÀM, SẠCH ----
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 4, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 7, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 3, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 8, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 2, evidence: 0, logs: [] },
  // ---- ĐÃ NỘP, HOÀN THÀNH NHANH BẤT THƯỜNG (HIGH) ----
  { hasSubmission: true, status: 'SUBMITTED', elapsedMin: 8, score: 9.6, evidence: 0, logs: [] },
  // ---- ĐÃ NỘP, HOÀN THÀNH NHANH (REVIEW) ----
  { hasSubmission: true, status: 'SUBMITTED', elapsedMin: 20, score: 9.0, evidence: 0, logs: [] },
  // ---- ĐÃ CHẤM, RỦI RO CAO (5 sự kiện) ----
  { hasSubmission: true, status: 'GRADED', elapsedMin: 70, score: 8.0, evidence: 1,
    logs: [blurLog(3), idleLog(3), tabLog(5, 2), camTimeoutLog(1), noFaceLog(1)] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 65, score: 7.4, evidence: 1, logs: [] },
  // ---- ĐÃ CHẤM, CẦN XEM XÉT (2 sự kiện) ----
  { hasSubmission: true, status: 'GRADED', elapsedMin: 60, score: 6.5, evidence: 0, logs: [tabLog(2, 2), mouseLog(1, 2)] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 58, score: 6.0, evidence: 0, logs: [copyLog(1), pasteLog(1)] },
  // ---- ĐÃ CHẤM, SẠCH (1 sự kiện) ----
  { hasSubmission: true, status: 'GRADED', elapsedMin: 55, score: 7.1, evidence: 0, logs: [blurLog(1)] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 54, score: 5.8, evidence: 0, logs: [] },
  // ---- ĐÃ CHẤM, SẠCH (phân bố điểm số) ----
  { hasSubmission: true, status: 'GRADED', elapsedMin: 50, score: 1.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 49, score: 2.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 47, score: 4.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 8, score: 9.6, evidence: 0, logs: [] }, // timing HIGH
  { hasSubmission: true, status: 'GRADED', elapsedMin: 46, score: 5.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 44, score: 6.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 43, score: 7.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 52, score: 8.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 40, score: 10, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 41, score: 0.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 42, score: 3.5, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 66, score: 8.8, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 68, score: 9.2, evidence: 0, logs: [] },
  { hasSubmission: true, status: 'GRADED', elapsedMin: 61, score: 7.9, evidence: 0, logs: [] },
  // ---- ĐANG LÀM, CẦN XEM XÉT (thêm loại camera/mouse) ----
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 6, evidence: 0, logs: [idleLog(3), camTimeoutLog(2)] },
  { hasSubmission: true, status: 'IN_PROGRESS', answers: 5, evidence: 0, logs: [mouseLog(1, 2), camEndLog(1)] },
  // ---- CHƯA THAM GIA ----
  { hasSubmission: false },
  { hasSubmission: false },
  { hasSubmission: false },
];

export async function main() {
  const lecturer = await prisma.user.findUnique({ where: { email: LECTURER_EMAIL } });
  if (!lecturer) throw new Error(`Không tìm thấy giảng viên ${LECTURER_EMAIL}; hãy chạy seed accounts trước.`);

  const totalLogs = PROFILES.reduce((sum, p) => sum + (p.logs?.length || 0), 0);
  if (totalLogs > 25) throw new Error(`Quá nhiều integrity log nghi vấn (${totalLogs}); getExamOverview chỉ hiển thị TOP-25. Hãy giảm còn <= 25.`);

  // 1) Khoá học.
  const course = await prisma.course.upsert({
    where: { code: COURSE_CODE },
    update: {
      name: 'Giám sát thời gian thực phòng thi 2026',
      description: 'Khoá học mẫu để minh hoạ màn hình Theo dõi thời gian thực phiên làm bài năm học 2026.',
      academicYear: '2026',
      term: CourseTerm.TERM_1,
      lecturerId: lecturer.id,
      status: 'active',
      credits: 3,
    },
    create: {
      code: COURSE_CODE,
      name: 'Giám sát thời gian thực phòng thi 2026',
      description: 'Khoá học mẫu để minh hoạ màn hình Theo dõi thời gian thực phiên làm bài năm học 2026.',
      academicYear: '2026',
      term: CourseTerm.TERM_1,
      lecturerId: lecturer.id,
      status: 'active',
      credits: 3,
    },
  });

  // 2) Topic + 10 câu hỏi trắc nghiệm.
  const topic = await prisma.topic.upsert({
    where: { courseId_code: { courseId: course.id, code: TOPIC_CODE } },
    update: { name: 'SQL Advanced Queries & Analytics' },
    create: { courseId: course.id, code: TOPIC_CODE, name: 'SQL Advanced Queries & Analytics' },
  });
  await prisma.courseTopic.upsert({
    where: { courseId_topicId: { courseId: course.id, topicId: topic.id } },
    update: {},
    create: { courseId: course.id, topicId: topic.id },
  });

  const createdQuestions: Array<{ questionId: string; versionId: string }> = [];
  for (let idx = 0; idx < QUESTION_COUNT; idx += 1) {
    const content = `[MONITOR-2026] Câu ${idx + 1}: Which SQL statement is correct?`;
    const existingQ = await prisma.question.findFirst({ where: { courseId: course.id, content }, select: { id: true } });
    const question = existingQ ?? (await prisma.question.create({
      data: {
        type: 'MULTIPLE_CHOICE', content,
        options: { A: 'SELECT * FROM users', B: 'DELETE FROM users', C: 'INSERT INTO users', D: 'DROP TABLE users' },
        correctAnswer: { answer: 'A' }, explanation: 'Câu hỏi demo cho màn hình giám sát.',
        difficulty: 3, points: 1, defaultPoints: 1,
        courseId: course.id, creatorId: lecturer.id,
        status: QuestionLifecycleStatus.PUBLISHED, latestVersionNo: 1, isReusable: true,
      },
    }));
    const version = await prisma.questionVersion.upsert({
      where: { questionId_versionNo: { questionId: question.id, versionNo: 1 } },
      update: { stem: content, payload: { A: 'a', B: 'b', C: 'c', D: 'd' }, answerKey: { answer: 'A' } },
      create: { questionId: question.id, versionNo: 1, stem: content, payload: { A: 'a', B: 'b', C: 'c', D: 'd' }, answerKey: { answer: 'A' }, metadata: { seededMonitorDemo: true }, createdBy: lecturer.id },
    });
    await prisma.questionCourseScope.upsert({ where: { questionId_courseId: { questionId: question.id, courseId: course.id } }, update: {}, create: { questionId: question.id, courseId: course.id } });
    await prisma.questionTopic.upsert({ where: { questionId_topicId: { questionId: question.id, topicId: topic.id } }, update: { weight: 1 }, create: { questionId: question.id, topicId: topic.id, weight: 1 } });
    createdQuestions.push({ questionId: question.id, versionId: version.id });
  }

  // 3) Bài thi (ONGOING đang diễn ra).
  const startTime = new Date(now - 2 * 60 * 60_000);
  const endTime = new Date(now + 30 * 60_000);
  let examRow = await prisma.exam.findFirst({ where: { courseId: course.id, title: EXAM_TITLE, deletedAt: null } });
  if (!examRow) {
    examRow = await prisma.exam.create({
      data: {
        title: EXAM_TITLE, description: 'Bài thi mẫu để hiển thị theo dõi thời gian thực, cảnh báo toàn vẹn và phân bố điểm số.',
        courseId: course.id, creatorId: lecturer.id, duration: ALLOWED_MINUTES, timeLimitMinutes: ALLOWED_MINUTES,
        totalPoints: TOTAL_POINTS, passingScore: 5, maxAttempts: 1, status: 'ONGOING', startTime, endTime,
        scoringScale: 10, gradingStrategy: 'HIGHEST',
        settings: { autoGrade: true, showResult: false }, questionSelectionConfig: { mode: 'FIXED' },
      },
    });
  }
  for (const [index, q] of createdQuestions.entries()) {
    await prisma.examQuestion.upsert({
      where: { examId_questionId: { examId: examRow.id, questionId: q.questionId } },
      update: { questionVersionId: q.versionId, orderIndex: index, points: 1 },
      create: { examId: examRow.id, questionId: q.questionId, questionVersionId: q.versionId, orderIndex: index, points: 1 },
    });
  }

  // 4) Sinh viên + phiên làm bài.
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' }, select: { id: true, studentId: true } });
  const studentsByCode = new Map<string, string>();
  for (const s of students) if (s.studentId) studentsByCode.set(s.studentId, s.id);

  const base = new Date(now - 90 * 60_000);
  let sessionCount = 0;
  let evidenceCount = 0;

  for (let i = 0; i < STUDENT_COUNT; i += 1) {
    const studentCode = STUDENT_ID_PATTERN(i);
    const studentId = studentsByCode.get(studentCode);
    if (!studentId) { console.warn(`Bỏ qua sinh viên ${studentCode} (không tồn tại).`); continue; }
    const profile = PROFILES[i];

    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId } },
      update: { status: 'active' },
      create: { courseId: course.id, studentId, status: 'active' },
    });

    if (!profile.hasSubmission) continue;

    const startedAt = new Date(base.getTime() + i * 60_000);
    const submittedAt = profile.elapsedMin != null ? new Date(startedAt.getTime() + profile.elapsedMin * 60_000) : null;

    const instance = await prisma.examInstance.upsert({
      where: { examId_studentId: { examId: examRow.id, studentId } },
      update: { status: profile.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'SUBMITTED', startedAt, submittedAt, lastActivityAt: submittedAt ?? new Date() },
      create: { examId: examRow.id, studentId, status: profile.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'SUBMITTED', startedAt, submittedAt, lastActivityAt: submittedAt ?? new Date() },
    });

    const submission = await prisma.examSubmission.upsert({
      where: { examId_studentId_attemptNo: { examId: examRow.id, studentId, attemptNo: 1 } },
      update: { examInstanceId: instance.id, status: profile.status!, score: profile.score ?? undefined, startedAt, submittedAt, gradedAt: submittedAt, lastActivityAt: submittedAt ?? new Date() },
      create: { examId: examRow.id, studentId, examInstanceId: instance.id, attemptNo: 1, status: profile.status!, score: profile.score ?? undefined, startedAt, submittedAt, gradedAt: submittedAt, lastActivityAt: submittedAt ?? new Date() },
    });

    const proctoring = await prisma.proctoringSession.upsert({
      where: { submissionId: submission.id },
      update: { tabSwitchCount: 0, mouseAnomalies: 0, flaggedStatus: profile.status === 'FLAGGED' ? 'FLAGGED' : null },
      create: { submissionId: submission.id, tabSwitchCount: 0, mouseAnomalies: 0, flaggedStatus: profile.status === 'FLAGGED' ? 'FLAGGED' : null },
    });

    // Answers for progress. Cặp nghi vấn (index 11,12) chọn cùng "D" (sai)
    // ở 4 câu cuối => đáp án sai hiếm trùng nhau (rare wrong), đồng thời cùng
    // chọn "A" (đúng) ở 6 câu đầu => matchedBreakdown đủ cả đúng & sai giống nhau.
    const isCollude = (studentIndex: number) => studentIndex === 11 || studentIndex === 12;
    const answerCount = profile.status === 'IN_PROGRESS' ? (profile.answers ?? 1) : QUESTION_COUNT;
    for (let a = 0; a < Math.min(answerCount, QUESTION_COUNT); a += 1) {
      const q = createdQuestions[a % createdQuestions.length];
      const colludeWrong = isCollude(i) && a >= 6; // 4 câu cuối
      const answer = colludeWrong ? { answer: 'D' } : { answer: 'A' };
      await prisma.submissionAnswer.upsert({
        where: { submissionId_questionId: { submissionId: submission.id, questionId: q.questionId } },
        update: { answer: answer as any, isCorrect: !colludeWrong, questionVersionId: q.versionId, sequence: a + 1 },
        create: { submissionId: submission.id, questionId: q.questionId, questionVersionId: q.versionId, answer: answer as any, isCorrect: !colludeWrong, sequence: a + 1 },
      });
    }

    // Integrity logs (anomaly feed — toàn bộ loại tín hiệu, timestamp gần nhất).
    for (const log of profile.logs || []) {
      await prisma.integrityLog.create({
        data: {
          proctoringId: proctoring.id,
          clientEventId: shortEventId(`${log.type}-${i}`),
          eventType: log.type,
          details: log.details,
          timestamp: new Date(now - log.minutesAgo * 60_000),
        },
      });
    }

    // Evidence captures (Bằng chứng).
    const evidenceToCreate = profile.evidence || 0;
    const signalsFor = (profile.logs || []).map((l) => l.type).slice(0, 2);
    for (let e = 0; e < evidenceToCreate; e += 1) {
      await prisma.proctoringEvidenceCapture.create({
        data: {
          submissionId: submission.id,
          examInstanceId: instance.id,
          status: 'ANALYZED',
          trigger: 'SUSPICIOUS_EVENT',
          captureSource: 'WEBCAM',
          triggerDetails: { signals: signalsFor },
          scheduledSlot: null,
          captureNonceHash: randomHash64(),
          nonceExpiresAt: new Date(now + 60 * 60_000),
          retentionUntil: new Date(now + 30 * 24 * 60 * 60_000),
          reviewStatus: 'PENDING',
        },
      });
      evidenceCount += 1;
    }

    sessionCount += 1;
  }

  console.log('=== Seed Giám sát thời gian thực hoàn tất ===');
  console.log(`Khoá học: ${course.code} (${course.academicYear} - ${course.term})`);
  console.log(`Bài thi: ${examRow.title} (id: ${examRow.id})`);
  console.log(`Số phiên làm bài: ${sessionCount}; evidence: ${evidenceCount}; integrity log: ${totalLogs}`);
  console.log(`URL: http://localhost:3000/lecturer/exam/${examRow.id}/monitor`);
}

if (process.argv[1] && process.argv[1].includes('seed-monitor-ui-demo.ts')) {
  main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}