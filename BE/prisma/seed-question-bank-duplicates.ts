import { PrismaClient, Prisma } from '@prisma/client';
import { main as seedQuestionBank } from './seed-question-bank';

const prisma = new PrismaClient();

// Duplicate-detection case (plan 4.3): lives in the "Cơ sở Dữ liệu" course.
// EXACT pairs share identical content/type (byte-for-byte) — the detector's
// simplest, always-on signal. SEMANTIC pairs reword the same underlying
// question/skill — flagged only when the AI similarity pass runs, so they
// also share one dedicated topic (the detector's fallback "same topic"
// heuristic) in case the lexical/AI check alone wouldn't catch them.
type DupQuestion = { type: string; content: string; options?: unknown; correctAnswer?: unknown; explanation?: string };

const EXACT_PAIRS: Array<[DupQuestion, DupQuestion]> = [
  [
    { type: 'MULTIPLE_CHOICE', content: '[Trùng lặp] Câu lệnh SQL nào dùng để loại bỏ các dòng trùng lặp trong kết quả truy vấn?', options: { A: 'DISTINCT', B: 'GROUP BY', C: 'HAVING', D: 'ORDER BY' }, correctAnswer: { answer: 'A' } },
    { type: 'MULTIPLE_CHOICE', content: '[Trùng lặp] Câu lệnh SQL nào dùng để loại bỏ các dòng trùng lặp trong kết quả truy vấn?', options: { A: 'DISTINCT', B: 'GROUP BY', C: 'HAVING', D: 'ORDER BY' }, correctAnswer: { answer: 'A' } },
  ],
  [
    { type: 'TRUE_FALSE', content: '[Trùng lặp] Chỉ mục (index) có thể làm chậm tốc độ ghi dữ liệu.', options: { A: 'True', B: 'False' }, correctAnswer: { answer: 'A' } },
    { type: 'TRUE_FALSE', content: '[Trùng lặp] Chỉ mục (index) có thể làm chậm tốc độ ghi dữ liệu.', options: { A: 'True', B: 'False' }, correctAnswer: { answer: 'A' } },
  ],
  [
    { type: 'FIND_ERROR', content: '[Trùng lặp] Tìm dòng chứa lỗi cú pháp trong câu lệnh SELECT sau.', options: { A: 'SELECT name', B: 'FROM students', C: 'WHERE age > 18', D: 'ORDER name' }, correctAnswer: { answers: ['D'] } },
    { type: 'FIND_ERROR', content: '[Trùng lặp] Tìm dòng chứa lỗi cú pháp trong câu lệnh SELECT sau.', options: { A: 'SELECT name', B: 'FROM students', C: 'WHERE age > 18', D: 'ORDER name' }, correctAnswer: { answers: ['D'] } },
  ],
];

const SEMANTIC_PAIRS: Array<[DupQuestion, DupQuestion]> = [
  [
    { type: 'MULTIPLE_CHOICE', content: '[Trùng lặp] Mệnh đề nào dùng để lọc các nhóm sau khi đã tính hàm tổng hợp (aggregate)?', options: { A: 'WHERE', B: 'HAVING', C: 'DISTINCT', D: 'LIMIT' }, correctAnswer: { answer: 'B' } },
    { type: 'MULTIPLE_CHOICE', content: '[Trùng lặp] Làm sao để giới hạn kết quả của một hàm tổng hợp như COUNT theo từng nhóm?', options: { A: 'WHERE', B: 'HAVING', C: 'GROUP BY', D: 'ORDER BY' }, correctAnswer: { answer: 'B' } },
  ],
  [
    { type: 'TRUE_FALSE', content: '[Trùng lặp] Khoá chính (primary key) xác định duy nhất mỗi dòng trong bảng.', options: { A: 'True', B: 'False' }, correctAnswer: { answer: 'A' } },
    { type: 'TRUE_FALSE', content: '[Trùng lặp] Mỗi dòng dữ liệu trong bảng đều có thể được nhận diện thông qua khoá chính của nó.', options: { A: 'True', B: 'False' }, correctAnswer: { answer: 'A' } },
  ],
  [
    { type: 'ESSAY', content: '[Trùng lặp] Trình bày lợi ích chính của việc chuẩn hoá cơ sở dữ liệu (normalization).', correctAnswer: { answer: 'Giảm trùng lặp dữ liệu và tránh dị thường khi cập nhật.' } },
    { type: 'ESSAY', content: '[Trùng lặp] Tại sao nên chuẩn hoá một lược đồ quan hệ trước khi triển khai?', correctAnswer: { answer: 'Loại bỏ dư thừa dữ liệu và các lỗi phát sinh khi cập nhật.' } },
  ],
  [
    { type: 'MATCHING', content: '[Trùng lặp] Ghép mỗi ràng buộc SQL với mục đích sử dụng của nó.', options: { left: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE'], right: ['Định danh dòng', 'Liên kết bảng', 'Giá trị không trùng'] }, correctAnswer: { pairs: [{ left: 'PRIMARY KEY', right: 'Định danh dòng' }, { left: 'FOREIGN KEY', right: 'Liên kết bảng' }, { left: 'UNIQUE', right: 'Giá trị không trùng' }] } },
    { type: 'MATCHING', content: '[Trùng lặp] Ghép mỗi ràng buộc dữ liệu với vai trò tương ứng trong thiết kế bảng.', options: { left: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE'], right: ['Định danh dòng', 'Liên kết bảng', 'Giá trị không trùng'] }, correctAnswer: { pairs: [{ left: 'PRIMARY KEY', right: 'Định danh dòng' }, { left: 'FOREIGN KEY', right: 'Liên kết bảng' }, { left: 'UNIQUE', right: 'Giá trị không trùng' }] } },
  ],
];

export async function main(seeded?: Awaited<ReturnType<typeof seedQuestionBank>>) {
  try {
    const result = seeded ?? (await seedQuestionBank());
    const { coursesByKey, questionsByCourseKey } = result;
    const course = coursesByKey['database'];

    const sharedTopic = await prisma.topic.upsert({
      where: { courseId_code: { courseId: course.id, code: 'DUP-REVIEW' } },
      update: {},
      create: { courseId: course.id, code: 'DUP-REVIEW', name: 'Trùng lặp & Ôn tập SQL' },
    });

    const allPairs = [...EXACT_PAIRS, ...SEMANTIC_PAIRS];
    const createdDuplicates: any[] = [];
    for (const pair of allPairs) {
      for (const q of pair) {
        const existing = await prisma.question.findFirst({
          where: { courseId: course.id, content: q.content, type: q.type },
        });
        const question = existing ?? await prisma.question.create({
          data: {
            type: q.type,
            content: q.content,
            options: (q.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            correctAnswer: (q.correctAnswer as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            explanation: q.explanation ?? 'Câu hỏi minh hoạ cho tính năng lọc trùng lặp.',
            difficulty: 5,
            points: 1,
            defaultPoints: 1,
            courseId: course.id,
            creatorId: course.lecturerId,
            status: 'PUBLISHED',
            latestVersionNo: 1,
            isReusable: true,
          },
        });
        await prisma.questionVersion.upsert({
          where: { questionId_versionNo: { questionId: question.id, versionNo: 1 } },
          update: {},
          create: {
            questionId: question.id,
            versionNo: 1,
            stem: q.content,
            payload: (q.options as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            answerKey: (q.correctAnswer as Prisma.InputJsonValue) ?? Prisma.JsonNull,
            explanation: q.explanation ?? null,
            difficulty: 5,
            points: 1,
            metadata: { seededQuestionType: q.type, seededDuplicateCase: true },
            createdBy: question.creatorId,
          },
        });
        await prisma.questionTopic.upsert({
          where: { questionId_topicId: { questionId: question.id, topicId: sharedTopic.id } },
          update: {},
          create: { questionId: question.id, topicId: sharedTopic.id, weight: 1 },
        });
        createdDuplicates.push(question);
      }
    }

    console.log(`[seed-question-bank-duplicates] pairs=${allPairs.length} questions=${createdDuplicates.length}`);
    return { ...result, duplicateQuestions: createdDuplicates };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-question-bank-duplicates.ts')) {
  main().catch((error) => {
    console.error('[seed-question-bank-duplicates] failed:', error);
    process.exit(1);
  });
}
