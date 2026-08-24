/**
 * Seed cho công cụ "Lọc các câu trùng lặp" (Ngân hàng câu hỏi → Lọc câu trùng lặp).
 *
 * Tạo khoá học DUPLICATE-2026 với các câu hỏi được "vô tình" lặp theo 2 dạng:
 *   1. TRÙNG TEXT-TEXT   : câu có nội dung GIỐNG HỆT (cùng loại) -> EXACT_DUPLICATE.
 *   2. TRÙNG NGHĨA (AI)  : nội dung khác từ ngữ nhưng cùng ý nghĩa/kỹ năng
 *                          -> AI (Ollama) nhận diện SEMANTIC_DUPLICATE.
 * Các câu còn lại là "singleton" để ngân hàng trông thực tế.
 *
 * Ghi chú:
 *   - Phát hiện trùng chỉ so sánh CÙNG LOẠI câu; chỉ là "candidate" khi lexical
 *     >= 0.25 HOẶC dùng chung topic. Seed gắn tất cả vào topic chung
 *     "SQL & Cơ sở dữ liệu" để AI xét đủ các cặp cùng loại.
 *   - Idempotent bằng `metadata.seededDuplicateKey` (KHÔNG dedup theo content),
 *     vì các câu trùng text-text phải tạo được 2 hàng có nội dung giống hệt.
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-duplicate-demo.ts
 */
import { PrismaClient, QuestionLifecycleStatus, CourseTerm } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_CODE = 'DUPLICATE-2026';
const LECTURER_EMAIL = 'lecturer01@tdtutdtu.edu.vn';
const TOPIC_CODE = 'DUP-2026-QB';

type Q = {
  key: string;
  type: string;
  content: string;
  options?: unknown;
  correctAnswer?: unknown;
};

// ---- CẶP TRÙNG TEXT-TEXT (nội dung giống hệt, cùng loại -> EXACT) ----
const TEXT_TEXT: Q[] = [
  { key: 't2t-mc-1', type: 'MULTIPLE_CHOICE', content: '[DUP-2026] Which SQL keyword is used to remove duplicate rows from a result set?', options: { A: 'DISTINCT', B: 'GROUP BY', C: 'HAVING', D: 'ORDER BY' }, correctAnswer: { answer: 'A' } },
  { key: 't2t-mc-2', type: 'MULTIPLE_CHOICE', content: '[DUP-2026] Which SQL keyword is used to remove duplicate rows from a result set?', options: { A: 'DISTINCT', B: 'GROUP BY', C: 'HAVING', D: 'ORDER BY' }, correctAnswer: { answer: 'A' } },
  { key: 't2t-tf-1', type: 'TRUE_FALSE', content: '[DUP-2026] An index can slow down write operations.', options: { A: 'Đúng', B: 'Sai' }, correctAnswer: { answer: 'A' } },
  { key: 't2t-tf-2', type: 'TRUE_FALSE', content: '[DUP-2026] An index can slow down write operations.', options: { A: 'Đúng', B: 'Sai' }, correctAnswer: { answer: 'A' } },
];

// ---- CẶP TRÙNG NGHĨA (khác từ ngữ, cùng ý nghĩa => AI nhận diện) ----
const SEMANTIC: Array<[Q, Q]> = [
  [
    { key: 'sem-mc-1', type: 'MULTIPLE_CHOICE', content: '[DUP-2026] Which clause filters the groups created by an aggregate function?', options: { A: 'WHERE', B: 'HAVING', C: 'DISTINCT', D: 'LIMIT' }, correctAnswer: { answer: 'B' } },
    { key: 'sem-mc-2', type: 'MULTIPLE_CHOICE', content: '[DUP-2026] How do you constrain the result of an aggregate such as COUNT over a group?', options: { A: 'WHERE', B: 'HAVING', C: 'GROUP BY', D: 'ORDER BY' }, correctAnswer: { answer: 'B' } },
  ],
  [
    { key: 'sem-ms-1', type: 'MULTI_SELECT', content: '[DUP-2026] Select the SQL joins that return only rows present in both tables.', options: { A: 'INNER JOIN', B: 'LEFT JOIN', C: 'RIGHT JOIN', D: 'FULL JOIN' }, correctAnswer: { answer: ['A'] } },
    { key: 'sem-ms-2', type: 'MULTI_SELECT', content: '[DUP-2026] Which join types keep only the intersection of the two tables?', options: { A: 'INNER JOIN', B: 'LEFT JOIN', C: 'RIGHT JOIN', D: 'CROSS JOIN' }, correctAnswer: { answer: ['A'] } },
  ],
  [
    { key: 'sem-sa-1', type: 'SHORT_ANSWER', content: '[DUP-2026] Explain the main benefit of database normalization.', correctAnswer: { answer: 'Giảm trùng lặp dữ liệu và tránh dị thường cập nhật.' } },
    { key: 'sem-sa-2', type: 'SHORT_ANSWER', content: '[DUP-2026] Why is it helpful to normalize a relational schema?', correctAnswer: { answer: 'Loại bỏ dư thừa dữ liệu và lỗi cập nhật.' } },
  ],
  [
    { key: 'sem-tf-1', type: 'TRUE_FALSE', content: '[DUP-2026] A primary key uniquely identifies each row in a table.', options: { A: 'Đúng', B: 'Sai' }, correctAnswer: { answer: 'A' } },
    { key: 'sem-tf-2', type: 'TRUE_FALSE', content: '[DUP-2026] Every record in a table can be identified by its primary key.', options: { A: 'Đúng', B: 'Sai' }, correctAnswer: { answer: 'A' } },
  ],
];

// ---- Câu "singleton" không trùng ----
const SINGLETON: Q[] = [
  { key: 'single-1', type: 'MULTIPLE_CHOICE', content: '[DUP-2026] Which normal form removes transitive dependencies?', options: { A: '1NF', B: '2NF', C: '3NF', D: 'BCNF' }, correctAnswer: { answer: 'C' } },
  { key: 'single-2', type: 'ESSAY', content: '[DUP-2026] Compare INNER JOIN and LEFT JOIN with examples.', correctAnswer: { answer: 'INNER giữ dòng khớp, LEFT giữ toàn bộ bảng trái...' } },
  { key: 'single-3', type: 'MATCHING', content: '[DUP-2026] Match each constraint with its purpose.', options: { left: ['PRIMARY KEY', 'FOREIGN KEY', 'UNIQUE', 'CHECK'], right: ['Định danh dòng', 'Liên kết bảng', 'Giá trị không trùng', 'Ràng buộc điều kiện'] }, correctAnswer: { pairs: [{ left: 'PRIMARY KEY', right: 'Định danh dòng' }, { left: 'FOREIGN KEY', right: 'Liên kết bảng' }, { left: 'UNIQUE', right: 'Giá trị không trùng' }, { left: 'CHECK', right: 'Ràng buộc điều kiện' }] } },
];

export async function main() {
  const lecturer = await prisma.user.findUnique({ where: { email: LECTURER_EMAIL } });
  if (!lecturer) throw new Error(`Không tìm thấy giảng viên ${LECTURER_EMAIL}`);

  const course = await prisma.course.upsert({
    where: { code: COURSE_CODE },
    update: { name: 'Ngân hàng câu hỏi – Demo lọc trùng lặp 2026', lecturerId: lecturer.id, status: 'active', academicYear: '2026', term: CourseTerm.TERM_1 },
    create: { code: COURSE_CODE, name: 'Ngân hàng câu hỏi – Demo lọc trùng lặp 2026', lecturerId: lecturer.id, status: 'active', academicYear: '2026', term: CourseTerm.TERM_1, credits: 3 },
  });

  const topic = await prisma.topic.upsert({
    where: { courseId_code: { courseId: course.id, code: TOPIC_CODE } },
    update: { name: 'SQL & Cơ sở dữ liệu' },
    create: { courseId: course.id, code: TOPIC_CODE, name: 'SQL & Cơ sở dữ liệu' },
  });
  await prisma.courseTopic.upsert({ where: { courseId_topicId: { courseId: course.id, topicId: topic.id } }, update: {}, create: { courseId: course.id, topicId: topic.id } });

  const all: Q[] = [...TEXT_TEXT, ...SEMANTIC.flat(), ...SINGLETON];
  let created = 0;
  for (const q of all) {
    const existing = await prisma.questionVersion.findFirst({
      where: { question: { courseId: course.id }, metadata: { path: '$.seededDuplicateKey', equals: q.key } },
      select: { questionId: true },
    });
    if (existing) continue;
    const question = await prisma.question.create({
      data: {
        type: q.type, content: q.content, options: q.options ?? undefined, correctAnswer: q.correctAnswer,
        difficulty: 3, points: 1, defaultPoints: 1, courseId: course.id, creatorId: lecturer.id,
        status: QuestionLifecycleStatus.PUBLISHED, latestVersionNo: 1, isReusable: true,
      },
    });
    await prisma.questionVersion.create({
      data: { questionId: question.id, versionNo: 1, stem: q.content, payload: q.options ?? undefined, answerKey: q.correctAnswer, metadata: { seededDuplicateKey: q.key, seededDuplicateDemo: true }, createdBy: lecturer.id },
    });
    await prisma.questionCourseScope.upsert({ where: { questionId_courseId: { questionId: question.id, courseId: course.id } }, update: {}, create: { questionId: question.id, courseId: course.id } });
    await prisma.questionTopic.upsert({ where: { questionId_topicId: { questionId: question.id, topicId: topic.id } }, update: { weight: 1 }, create: { questionId: question.id, topicId: topic.id, weight: 1 } });
    created += 1;
  }

  console.log('=== Seed Lọc câu trùng lặp hoàn tất ===');
  console.log(`Khoá học: ${course.code} (id: ${course.id}) · ${all.length} câu hỏi (tạo mới: ${created})`);
  console.log(`  - Trùng text-text (giống hệt): ${TEXT_TEXT.length} câu (${TEXT_TEXT.length / 2} cặp)`);
  console.log(`  - Trùng nghĩa (AI nhận diện): ${SEMANTIC.length} cặp`);
  console.log(`  - Singleton: ${SINGLETON.length}`);
  console.log(`URL ngân hàng câu hỏi: http://localhost:3000/lecturer/question-bank?courseId=${course.id}`);
}

if (process.argv[1] && process.argv[1].includes('seed-duplicate-demo.ts')) {
  main()
    .catch((error) => { console.error(error); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
}