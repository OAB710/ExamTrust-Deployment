import { PrismaClient } from '@prisma/client';

// Shared helpers for the rebuilt seed suite (seed-users.ts .. seed-master.ts).
// Every script below imports from here so dates, IDs, and question-type
// templates stay consistent across files instead of drifting like the old
// per-script seeds did.

export const PASSWORD = '123123123Az!';

// Anchor date = whenever the seed actually runs, so "6 months ago" etc.
// always looks recent relative to today instead of drifting stale over time.
export const TODAY = new Date();

export function daysAgo(n: number, hour = 9, minute = 0): Date {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, Math.abs((hour * 37 + minute * 13) % 60), 0);
  return d;
}

export function addMinutes(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000);
}

// Deterministic PRNG (mulberry32) — same seed always produces the same
// sequence, so re-running the seed on a fresh DB reproduces identical data
// (easier to debug/diff), while still giving each entity varied-looking values.
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function pick<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

export function randInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// --- Course code generation, copied 1:1 from BE/src/courses/courses.service.ts
// (toAsciiUpper/buildToken/generateCourseCode) so seeded course codes look
// exactly like what a lecturer creating a course through the real UI would get.
function toAsciiUpper(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .toUpperCase();
}

function buildToken(value: string, maxLength: number, fallback: string): string {
  const compact = toAsciiUpper(value)
    .split(/\s+/)
    .filter(Boolean)
    .join('');
  return (compact.slice(0, maxLength) || fallback).toUpperCase();
}

export async function generateCourseCode(
  prisma: PrismaClient,
  courseName: string,
  lecturerFullName: string,
): Promise<string> {
  const courseToken = buildToken(courseName, 6, 'COURSE');
  const creatorToken = buildToken(lecturerFullName, 4, 'USER');
  const base = `${courseToken}-${creatorToken}`;

  const existingCodes = await prisma.course.findMany({
    where: { code: { startsWith: `${base}-` } },
    select: { code: true },
  });
  const usedNumbers = new Set<number>();
  for (const item of existingCodes) {
    const suffix = item.code.slice(base.length + 1);
    const parsed = Number.parseInt(suffix, 10);
    if (!Number.isNaN(parsed)) usedNumbers.add(parsed);
  }
  let sequence = 1;
  while (usedNumbers.has(sequence)) sequence += 1;
  return `${base}-${String(sequence).padStart(2, '0')}`;
}

// --- Auto-grading eligibility, copied from BE/src/submissions/submissions.service.ts
// (isAutoGradable) so seeded answers are scored using the exact same rule the
// real submit/grade endpoints use.
const AUTO_GRADED_TYPES = new Set(['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE', 'FIND_ERROR']);

export function isAutoGradable(type: string, correctAnswer: any): boolean {
  if (AUTO_GRADED_TYPES.has(type)) return true;
  if (type === 'MATCHING') {
    return Array.isArray(correctAnswer?.pairs) && correctAnswer.pairs.length > 0;
  }
  if (type === 'ORDERING') {
    return Array.isArray(correctAnswer?.items) && correctAnswer.items.length > 0;
  }
  return false;
}

// The 7 question types actually creatable through the UI today
// (FE/src/features/lecturer/QuestionEditor.tsx + CreateExam.tsx manual-question
// selects) — MULTI_SELECT/SHORT_ANSWER exist in the schema/grading code but have
// no creation path, so seeded data intentionally never uses them.
export const QUESTION_TYPES = [
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'FILL_IN_BLANK',
  'MATCHING',
  'ORDERING',
  'FIND_ERROR',
  'ESSAY',
] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export type QuestionTemplate = {
  type: QuestionType;
  content: string;
  options: any;
  correctAnswer: any;
  explanation: string;
};

// Per-type content generator. `topic` + `n` (a running index within that
// topic) vary the wording so a course with many questions of the same type
// doesn't repeat verbatim, while keeping the exact options/correctAnswer JSON
// shapes seed.ts already proved work end-to-end with the real grading logic.
// Builds the exact snapshot payload shape used by the real publish flow
// (BE/src/exams/exams.service.ts:buildQuestionSnapshotPayload) so seeded
// exams behave identically to ones published through the UI: auto-grading,
// the answer matrix, and manual-grading screens all read this payload shape.
export function buildSnapshotPayload(question: any, questionVersion: any, assignedScore: number) {
  const stem = String(questionVersion?.stem || question.content || '').trim();
  const answerKey = questionVersion?.answerKey ?? question.correctAnswer ?? null;
  return {
    questionId: question.id,
    questionVersionId: questionVersion?.id ?? null,
    type: String(question.type || '').toUpperCase(),
    stem,
    content: stem,
    options: questionVersion?.payload ?? question.options ?? null,
    answerKey,
    correctAnswer: answerKey,
    explanation: questionVersion?.explanation ?? question.explanation ?? null,
    assignedScore,
    points: assignedScore,
  };
}

// Mirrors ExamsService.publishExam's snapshot-creation transaction: for every
// ExamQuestion of `examId`, materialize a QuestionSnapshot + ExamQuestionSnapshot
// row under one new ExamSnapshot. Returns the created ExamSnapshot with its
// question rows (id/questionId/questionVersionId/questionSnapshotId/assignedScore)
// for callers that need to build SubmissionAnswer rows against it.
export async function createExamSnapshot(prisma: PrismaClient, examId: string, publishedAt: Date, createdBy: string) {
  const exam = await prisma.exam.findUniqueOrThrow({ where: { id: examId } });
  const examQuestions = await prisma.examQuestion.findMany({
    where: { examId },
    include: { question: true, questionVersion: true },
    orderBy: { orderIndex: 'asc' },
  });

  const examSnapshot = await prisma.examSnapshot.create({
    data: {
      examId,
      title: exam.title,
      payload: {
        timeLimitMinutes: exam.timeLimitMinutes ?? null,
        maxAttempts: exam.maxAttempts ?? null,
        gradingStrategy: exam.gradingStrategy ?? null,
        reviewSettings: exam.reviewSettings ?? null,
        questionSelectionConfig: exam.questionSelectionConfig ?? null,
      },
      createdBy,
      publishedAt,
      createdAt: publishedAt,
    },
  });

  const snapshotQuestions: Array<{
    questionId: string;
    questionVersionId: string | null;
    questionSnapshotId: string;
    assignedScore: number;
    orderIndex: number;
    type: string;
    answerKey: any;
  }> = [];

  for (const eq of examQuestions) {
    const assignedScore = Number(eq.assignedScore ?? eq.points ?? 1);
    const payload = buildSnapshotPayload(eq.question, eq.questionVersion, assignedScore);
    const questionSnapshot = await prisma.questionSnapshot.create({
      data: {
        originalQuestionId: eq.questionId,
        questionVersionId: eq.questionVersionId ?? eq.question.id,
        payload,
        createdAt: publishedAt,
      },
    });
    await prisma.examQuestionSnapshot.create({
      data: {
        examSnapshotId: examSnapshot.id,
        questionId: eq.questionId,
        questionVersionId: eq.questionVersionId,
        questionSnapshotId: questionSnapshot.id,
        orderIndex: eq.orderIndex,
        points: Math.max(1, Math.round(assignedScore)),
        assignedScore,
        payload,
      },
    });
    snapshotQuestions.push({
      questionId: eq.questionId,
      questionVersionId: eq.questionVersionId,
      questionSnapshotId: questionSnapshot.id,
      assignedScore,
      orderIndex: eq.orderIndex,
      type: String(eq.question.type || '').toUpperCase(),
      answerKey: payload.answerKey,
    });
  }

  return { examSnapshot, snapshotQuestions };
}

// Builds a plausible submitted `answer` JSON for a snapshot question, in
// whichever shape submissions.service.ts#compareAnswers expects for that
// type, so re-grading (recalculateSubmissionScore, exports, etc.) sees a
// genuinely correct or genuinely wrong answer — not just a claimed one.
export function buildSubmittedAnswer(type: string, correctAnswer: any, wantCorrect: boolean, rng: () => number): any {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correctLetter = correctAnswer?.answer;
      if (wantCorrect || !correctLetter) return { answer: correctLetter ?? 'A' };
      const letters = ['A', 'B', 'C', 'D'].filter((l) => l !== correctLetter);
      return { answer: pick(rng, letters) };
    }
    case 'TRUE_FALSE': {
      const correctLetter = correctAnswer?.answer === 'A' ? 'A' : 'B';
      return { answer: wantCorrect ? correctLetter : (correctLetter === 'A' ? 'B' : 'A') };
    }
    case 'FIND_ERROR': {
      const correctLetters: string[] = Array.isArray(correctAnswer?.answers) ? correctAnswer.answers : ['A'];
      if (wantCorrect) return { answers: correctLetters };
      const wrong = ['A', 'B', 'C', 'D'].filter((l) => !correctLetters.includes(l));
      return { answers: [pick(rng, wrong.length ? wrong : ['A'])] };
    }
    case 'MATCHING': {
      const pairs: Array<{ left: string; right: string }> = Array.isArray(correctAnswer?.pairs) ? correctAnswer.pairs : [];
      const submitted: Record<string, string> = {};
      pairs.forEach((pair, index) => { submitted[String(index)] = pair.right; });
      if (!wantCorrect && pairs.length > 1) {
        // swap two entries so at least one no longer matches its left item
        const keys = Object.keys(submitted);
        const [a, b] = [keys[0], keys[1]];
        [submitted[a], submitted[b]] = [submitted[b], submitted[a]];
      }
      return submitted;
    }
    case 'ORDERING': {
      const items: string[] = Array.isArray(correctAnswer?.items) ? [...correctAnswer.items] : [];
      if (wantCorrect || items.length < 2) return items;
      const reversed = [...items].reverse();
      return reversed;
    }
    case 'FILL_IN_BLANK':
      return { text: 'JavaScript' };
    case 'ESSAY':
    default:
      return { text: 'Bài làm tự luận của sinh viên — nêu các ý chính theo yêu cầu đề bài, có ví dụ minh hoạ liên quan tới nội dung đã học.' };
  }
}

export function buildQuestionTemplate(type: QuestionType, topic: string, n: number, rng: () => number): QuestionTemplate {
  switch (type) {
    case 'MULTIPLE_CHOICE': {
      const correctIdx = randInt(rng, 0, 3);
      const letters = ['A', 'B', 'C', 'D'];
      const options: Record<string, string> = {};
      letters.forEach((letter, idx) => {
        options[letter] = idx === correctIdx
          ? `Đáp án đúng về ${topic}`
          : `Phương án gây nhiễu ${letter} về ${topic}`;
      });
      return {
        type,
        content: `Trong chủ đề "${topic}", phát biểu nào sau đây là đúng?`,
        options,
        correctAnswer: { answer: letters[correctIdx] },
        explanation: `Đáp án ${letters[correctIdx]} là phát biểu chính xác về ${topic}.`,
      };
    }
    case 'TRUE_FALSE': {
      const isTrue = rng() > 0.5;
      return {
        type,
        content: `Phát biểu về "${topic}" sau đây là ${isTrue ? 'đúng' : 'sai'} trên thực tế — hãy xác nhận.`,
        options: { A: 'True', B: 'False' },
        correctAnswer: { answer: isTrue ? 'A' : 'B' },
        explanation: isTrue ? `Phát biểu đúng theo lý thuyết ${topic}.` : `Phát biểu sai theo lý thuyết ${topic}.`,
      };
    }
    case 'FILL_IN_BLANK': {
      const answer = pick(rng, ['khái niệm cốt lõi', 'thuật toán chính', 'cấu trúc dữ liệu phù hợp', 'giao thức tương ứng']);
      return {
        type,
        content: `Trong ${topic}, phần còn thiếu là [[${answer}]].`,
        options: null,
        correctAnswer: null,
        explanation: `Câu trả lời tham khảo: "${answer}" — giảng viên chấm tay theo mức độ chính xác.`,
      };
    }
    case 'MATCHING': {
      const leftRight: Array<[string, string]> = [
        [`Khái niệm ${n}.1 (${topic})`, `Định nghĩa ${n}.1`],
        [`Khái niệm ${n}.2 (${topic})`, `Định nghĩa ${n}.2`],
        [`Khái niệm ${n}.3 (${topic})`, `Định nghĩa ${n}.3`],
      ];
      return {
        type,
        content: `Ghép mỗi khái niệm trong "${topic}" với định nghĩa tương ứng.`,
        options: { left: leftRight.map((p) => p[0]), right: leftRight.map((p) => p[1]) },
        correctAnswer: { pairs: leftRight.map(([left, right]) => ({ left, right })) },
        explanation: `Mỗi khái niệm của ${topic} khớp đúng 1 định nghĩa duy nhất.`,
      };
    }
    case 'ORDERING': {
      const steps = [`Bước 1 (${topic})`, `Bước 2 (${topic})`, `Bước 3 (${topic})`, `Bước 4 (${topic})`];
      return {
        type,
        content: `Sắp xếp đúng thứ tự các bước thực hiện trong "${topic}".`,
        options: steps,
        correctAnswer: { items: steps },
        explanation: `Thứ tự chuẩn của quy trình ${topic}: ${steps.join(' → ')}.`,
      };
    }
    case 'FIND_ERROR': {
      const errorLine = pick(rng, ['A', 'B', 'C', 'D']);
      const options: Record<string, string> = {};
      ['A', 'B', 'C', 'D'].forEach((letter) => {
        options[letter] = letter === errorLine
          ? `// dòng ${letter} liên quan ${topic} (chứa lỗi)`
          : `// dòng ${letter} liên quan ${topic}`;
      });
      return {
        type,
        content: `Tìm dòng chứa lỗi trong đoạn minh họa "${topic}" sau.`,
        options,
        correctAnswer: { answers: [errorLine] },
        explanation: `Dòng ${errorLine} chứa lỗi cú pháp/logic trong ví dụ về ${topic}.`,
      };
    }
    case 'ESSAY': {
      return {
        type,
        content: `Trình bày phân tích của bạn về "${topic}" (tối thiểu 3 ý chính, có ví dụ minh hoạ).`,
        options: null,
        correctAnswer: { answer: `Rubric tham khảo: nêu được định nghĩa, ít nhất 2 đặc điểm, và 1 ví dụ thực tế liên quan tới ${topic}.` },
        explanation: 'Đáp án tham khảo dùng để chấm thủ công, không tự động chấm điểm.',
      };
    }
  }
}
