/**
 * Seed demo cho tính năng TOPIC SIMILARITY (dialog "Chọn hoặc tạo chủ đề",
 * backend: POST /ai/suggest-similar-topics).
 *
 * Tạo một KHÓA HỌC DEMO RIÊNG (`TOPIC-DEMO-DB`) chỉ để kiểm thử/trình diễn
 * Topic Similarity — KHÔNG đụng tới dữ liệu các khóa học khác; KHÔNG reset DB;
 * KHÔNG xóa dữ liệu người dùng; KHÔNG sửa migration/thuật toán.
 *
 * Dataset được thiết kế có chủ đích (không ngẫu nhiên) để khi giảng viên nhập
 * Proposed Topic mới, hệ thống thể hiện đủ các relation:
 *   DUPLICATE | SAME_CONCEPT | PARENT_OF | CHILD_OF | OVERLAP | RELATED | DISTINCT
 *
 * Ghi chú quan trọng:
 *   - Model `Topic` hiện KHÔNG có field description (chỉ id/code/name/courseId).
 *     Theo yêu cầu, KHÔNG tạo migration để thêm description.
 *   - Course description được đưa vào AI như "Course overview" => đóng vai trò
 *     semantic boundary (giúp loại DISTINCT như "Bóng đá chuyên nghiệp").
 *   - Ngân hàng Topic ban đầu ĐƯỢC GIỮ SẠCH (12 topic, không seed rác duplicate).
 *     Việc test DUPLICATE/SAME_CONCEPT được thực hiện bằng cách NHẬP Proposed
 *     Topic mới rồi đối chiếu với Topic hiện có.
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-topic-similarity-demo.ts
 *
 * Idempotent: upsert theo course.code và topic (courseId, code).
 */
import { PrismaClient, CourseTerm } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_CODE = 'TOPIC-DEMO-DB';
const COURSE_NAME = 'Cơ sở dữ liệu và Phân tích dữ liệu - Demo Topic AI';
const COURSE_DESCRIPTION =
  'Học phần trình bày nền tảng cơ sở dữ liệu quan hệ, SQL, thiết kế và chuẩn hóa dữ liệu, ' +
  'lập chỉ mục, tối ưu hóa truy vấn, giao dịch, phân tích và trực quan hóa dữ liệu. ' +
  'Khóa học demo được dùng để đánh giá khả năng phân loại quan hệ giữa các Topic của ExamTrust.';
const LECTURER_EMAIL = 'lecturer01@tdtutdtu.edu.vn';

type TopicSeed = { code: string; name: string };

// Ngân hàng Topic nền — được thiết kế có chủ đích, sạch (không duplicate rác).
// Lưu ý: DB thực tế có unique index TOÀN CỤC trên `code` (ngoài composite
// [courseId, code] trong schema), nên mọi code đều được prefix "TDB-" để
// đảm bảo không trùng với Topic của các khóa học khác.
const TOPICS: TopicSeed[] = [
  { code: 'TDB-CSDL', name: 'Cơ sở dữ liệu' },
  { code: 'TDB-CSDL-QUANHE', name: 'Cơ sở dữ liệu quan hệ' },
  { code: 'TDB-SQL-COBAN', name: 'SQL cơ bản' },
  { code: 'TDB-SQL-JOIN', name: 'SQL JOIN' },
  { code: 'TDB-CHUAN-HOA', name: 'Chuẩn hóa dữ liệu' },
  { code: 'TDB-INDEXING', name: 'Lập chỉ mục (Indexing)' },
  { code: 'TDB-TOI-UU-TRUY-VAN', name: 'Tối ưu hóa truy vấn' },
  { code: 'TDB-GIAO-DICH-DB', name: 'Giao dịch và kiểm soát đồng thời' },
  { code: 'TDB-PHAN-TICH-DL', name: 'Phân tích dữ liệu' },
  { code: 'TDB-TRUC-QUAN-HOA', name: 'Trực quan hóa dữ liệu' },
  { code: 'TDB-KHO-DL', name: 'Kho dữ liệu' },
  { code: 'TDB-LAM-SACH-DL', name: 'Làm sạch dữ liệu' },
];

// Nội dung nhập vào dialog "Chọn hoặc tạo chủ đề" cho từng test case (để in ra
// làm tài liệu hướng dẫn cho người phát triển khi demo).
const PRINT_TEST_CASES = `
═══════════════════════════════════ TEST CASES (nhập vào dialog "Chọn hoặc tạo chủ đề") ═══════════════════════════════════

Case A — DUPLICATE
  Proposed:  SQL JOIN
  Description: Các phép JOIN trong SQL để kết hợp dữ liệu từ nhiều bảng.
  Expected : existing "SQL JOIN" -> relation DUPLICATE  (UI: Trùng chủ đề)
  Mục đích : chứng minh hệ thống phát hiện Topic trùng trực tiếp.

Case B — SAME_CONCEPT (khác ngôn ngữ Việt/Anh)
  Proposed:  Database Indexing
  Description: Sử dụng B-tree, hash index và các cấu trúc chỉ mục để tăng tốc truy vấn cơ sở dữ liệu.
  Expected : existing "Lập chỉ mục (Indexing)" -> SAME_CONCEPT (UI: Cùng khái niệm), confidence cao.
  Mục đích : chứng minh AI nhận biết thuật ngữ Việt/Anh cùng khái niệm, không chỉ so từ.

Case C — PARENT_OF (existing rộng hơn proposed)
  Proposed:  Chuẩn hóa BCNF
  Description: Tập trung vào dạng chuẩn Boyce-Codd, phụ thuộc hàm và phân rã quan hệ để đạt BCNF.
  Expected : existing "Chuẩn hóa dữ liệu" -> PARENT_OF (UI: Rộng hơn chủ đề mới)
  Giải thích: Chuẩn hóa dữ liệu bao gồm 1NF/2NF/3NF/BCNF; Topic mới chỉ xét BCNF.

Case D — CHILD_OF (existing hẹp hơn proposed) — kiểm tra chiều relation
  Proposed:  Kỹ thuật thiết kế cơ sở dữ liệu
  Description: Bao gồm mô hình dữ liệu quan hệ, thiết kế bảng, khóa, phụ thuộc hàm và chuẩn hóa dữ liệu.
  Expected : existing "Chuẩn hóa dữ liệu" -> CHILD_OF (UI: Hẹp hơn chủ đề mới)
  Mục đích : đảm bảo relation "existing → proposed" không bị đảo.

Case E — OVERLAP (giao nhau một phần)
  Proposed:  Hiệu năng SQL
  Description: Phân tích hiệu năng truy vấn SQL, sử dụng index, execution plan và lựa chọn chiến lược thực thi phù hợp.
  Expected : candidates "Lập chỉ mục (Indexing)" và/hoặc "Tối ưu hóa truy vấn" -> OVERLAP.
  Lưu ý   : không được kết luận DUPLICATE chỉ vì cùng nhắc hiệu năng.

Case F — RELATED
  Proposed:  Thiết kế Dashboard dữ liệu
  Description: Xây dựng dashboard để trình bày KPI và insight từ dữ liệu đã được xử lý.
  Expected : existing "Trực quan hóa dữ liệu" -> RELATED (hoặc relation semantic phù hợp);
             không được coi là DUPLICATE vì phạm vi còn liên quan dashboard/KPI/application design.

Case G — DISTINCT (phải được loại)
  Proposed:  Bóng đá chuyên nghiệp
  Description: Chiến thuật, vị trí cầu thủ và tổ chức thi đấu bóng đá.
  Expected : suggestion list rỗng / không có candidate database đáng kể
  Mục đích : chứng minh Course context đóng vai trò semantic boundary.

Case H — CHỨNG MINH GIÁ TRỊ CỦA TOPIC DESCRIPTION (chỉ nhập tên "Matching")
  Lần 1 (không description): AI đánh giá thận trọng, confidence không giả tạo cao.
  Lần 2 (có description): "Ghép các bản ghi từ nhiều bảng dựa trên khóa và điều kiện JOIN trong SQL."
         -> "SQL JOIN" phải thành candidate mạnh rõ rệt.
  Kết luận: kết quả phụ thuộc nội dung/ngữ cảnh cung cấp cho AI.

═════════════════════════════════════════════════════════════════════════════════════════════════════
Bảng tóm tắt kỳ vọng:
| Case | Proposed Topic                | Existing Topic kỳ vọng | Expected Relation |
|---|---|---|---|
| A    | SQL JOIN                      | SQL JOIN                | DUPLICATE         |
| B    | Database Indexing             | Lập chỉ mục (Indexing)  | SAME_CONCEPT      |
| C    | Chuẩn hóa BCNF                | Chuẩn hóa dữ liệu       | PARENT_OF         |
| D    | Kỹ thuật thiết kế cơ sở dữ liệu | Chuẩn hóa dữ liệu      | CHILD_OF          |
| E    | Hiệu năng SQL                 | Indexing / Tối ưu hóa truy vấn | OVERLAP   |
| F    | Thiết kế Dashboard dữ liệu    | Trực quan hóa dữ liệu   | RELATED           |
| G    | Bóng đá chuyên nghiệp         | Không có                | DISTINCT / omitted|
`;

async function main() {
  try {
  const lecturer = await prisma.user.findUnique({ where: { email: LECTURER_EMAIL } });
  if (!lecturer) throw new Error(`Không tìm thấy giảng viên ${LECTURER_EMAIL}; hãy chạy seed accounts trước.`);

  const course = await prisma.course.upsert({
    where: { code: COURSE_CODE },
    update: {
      name: COURSE_NAME,
      description: COURSE_DESCRIPTION,
      lecturerId: lecturer.id,
      status: 'active',
      academicYear: '2026',
      term: CourseTerm.TERM_1,
      credits: 3,
    },
    create: {
      code: COURSE_CODE,
      name: COURSE_NAME,
      description: COURSE_DESCRIPTION,
      lecturerId: lecturer.id,
      status: 'active',
      academicYear: '2026',
      term: CourseTerm.TERM_1,
      credits: 3,
    },
  });

  const createdTopics: string[] = [];
  for (const topic of TOPICS) {
    const row = await prisma.topic.upsert({
      where: { courseId_code: { courseId: course.id, code: topic.code } },
      update: { name: topic.name },
      create: { courseId: course.id, code: topic.code, name: topic.name },
    });
    await prisma.courseTopic.upsert({
      where: { courseId_topicId: { courseId: course.id, topicId: row.id } },
      update: {},
      create: { courseId: course.id, topicId: row.id },
    });
    createdTopics.push(row.name);
  }

  console.log('=== Seed Topic Similarity demo hoàn tất ===');
  console.log(`Khoá học: ${COURSE_CODE} (id: ${course.id}) — ${course.name}`);
  console.log(`Giảng viên: ${lecturer.email} (role ${lecturer.role})`);
  console.log(`Số Topic đã đảm bảo: ${createdTopics.length}`);
  console.log('Danh sách Topic:');
  TOPICS.forEach((t) => console.log(`  - ${t.code.padEnd(18)} ${t.name}`));
  console.log('');
  console.log(PRINT_TEST_CASES);
  console.log('URL ngân hàng câu hỏi (chọn course TOPIC-DEMO-DB, mở dialog tạo Topic):');
  console.log(`  http://localhost:3000/lecturer/question-bank?courseId=${course.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

export { main };

if (process.argv[1] && process.argv[1].includes('seed-topic-similarity-demo.ts')) {
  main().catch((error) => { console.error(error); process.exit(1); });
}