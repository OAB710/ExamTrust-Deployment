import { Prisma, PrismaClient, QuestionLifecycleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = '123123123Az!';
const STUDENT_COUNT = 10;
const LECTURER_COUNT = 10;

const students = Array.from({ length: STUDENT_COUNT }, (_, index) => {
  const id = `522h${String(index + 1).padStart(4, '0')}`;
  return {
    email: `${id}@tdtutdtu.edu.vn`,
    studentId: id,
    // Display name is the MSSV itself, as requested for the demo dataset.
    fullName: id,
    department: index % 3 === 0 ? 'Computer Science' : index % 3 === 1 ? 'Information Technology' : 'Mathematics',
  };
});

const lecturers = Array.from({ length: LECTURER_COUNT }, (_, index) => {
  const num = String(index + 1).padStart(2, '0');
  return {
    email: `lecturer${num}@tdtutdtu.edu.vn`,
    fullName: `Lecturer ${num}`,
    department: index % 2 === 0 ? 'Computer Science' : 'Information Technology',
  };
});

const SEED_COURSE_CODE = 'SEED-101';

// One question per type currently supported by the question editor/preview
// (FE/src/features/lecturer/question-editor-persistence.ts), using the exact
// `options`/`correctAnswer` JSON shapes that code writes — not the generic
// A/B/C/D shape, which only some of these types actually use.
const seedQuestions: Array<{
  type: string;
  content: string;
  options: Prisma.InputJsonValue | null;
  correctAnswer: Prisma.InputJsonValue | null;
  explanation: string;
}> = [
  {
    type: 'MULTIPLE_CHOICE',
    content: 'Thủ đô của Việt Nam là gì?',
    options: { A: 'Hà Nội', B: 'TP. Hồ Chí Minh', C: 'Đà Nẵng', D: 'Huế' },
    correctAnswer: { answer: 'A' },
    explanation: 'Hà Nội là thủ đô của Việt Nam.',
  },
  {
    type: 'TRUE_FALSE',
    content: 'Trái Đất quay quanh Mặt Trời.',
    options: { A: 'True', B: 'False' },
    correctAnswer: { answer: 'A' },
    explanation: 'Đúng — Trái Đất quay quanh Mặt Trời theo quỹ đạo hình elip.',
  },
  {
    type: 'ESSAY',
    content: 'Trình bày ngắn gọn các đặc trưng chính của lập trình hướng đối tượng (OOP).',
    options: null,
    correctAnswer: { answer: 'Bài làm cần nêu được: đóng gói, kế thừa, đa hình, trừu tượng hóa — kèm ví dụ minh họa.' },
    explanation: 'Đáp án tham khảo dùng để chấm thủ công, không tự động chấm điểm.',
  },
  {
    type: 'FILL_IN_BLANK',
    content: 'Ngôn ngữ được dùng phổ biến nhất để xử lý tương tác phía trình duyệt là [[JavaScript]].',
    options: null,
    correctAnswer: null,
    explanation: 'JavaScript chạy trực tiếp trên trình duyệt để xử lý tương tác người dùng.',
  },
  {
    type: 'MATCHING',
    content: 'Ghép mỗi công nghệ web với công dụng chính của nó.',
    options: {
      left: ['HTML', 'CSS', 'JavaScript'],
      right: ['Xử lý tương tác', 'Cấu trúc nội dung trang web', 'Định dạng giao diện'],
    },
    correctAnswer: {
      pairs: [
        { left: 'HTML', right: 'Cấu trúc nội dung trang web' },
        { left: 'CSS', right: 'Định dạng giao diện' },
        { left: 'JavaScript', right: 'Xử lý tương tác' },
      ],
    },
    explanation: 'HTML cấu trúc nội dung, CSS định dạng giao diện, JavaScript xử lý tương tác.',
  },
  {
    type: 'ORDERING',
    content: 'Sắp xếp đúng thứ tự các bước khi biên dịch một chương trình C.',
    options: ['Tiền xử lý', 'Biên dịch', 'Hợp dịch', 'Liên kết'],
    correctAnswer: { items: ['Tiền xử lý', 'Biên dịch', 'Hợp dịch', 'Liên kết'] },
    explanation: 'Quy trình chuẩn: tiền xử lý → biên dịch → hợp dịch → liên kết.',
  },
  {
    type: 'FIND_ERROR',
    content: 'Tìm dòng có lỗi cú pháp trong đoạn mã Java sau.',
    options: {
      A: 'public class Main {',
      B: '  public static void main(String[] args) {',
      C: '    int x = 1',
      D: '  }',
    },
    correctAnswer: { answers: ['C'] },
    explanation: 'Dòng C thiếu dấu chấm phẩy (;) kết thúc câu lệnh.',
  },
];

async function main() {
  try {
    const hashed = await bcrypt.hash(PASSWORD, 10);

    await prisma.user.upsert({
      where: { email: 'admin@tdtutdtu.edu.vn' },
      update: {
        password: hashed,
        fullName: 'System Admin',
        role: 'ADMIN',
        department: 'Information Technology',
      },
      create: {
        email: 'admin@tdtutdtu.edu.vn',
        password: hashed,
        fullName: 'System Admin',
        role: 'ADMIN',
        department: 'Information Technology',
      },
    });

    const lecturerRows: Array<ReturnType<typeof prisma.user.upsert>> = [];
    for (const l of lecturers) {
      lecturerRows.push(
        prisma.user.upsert({
          where: { email: l.email },
          update: {
            password: hashed,
            fullName: l.fullName,
            role: 'LECTURER',
            department: l.department,
          },
          create: {
            email: l.email,
            password: hashed,
            fullName: l.fullName,
            role: 'LECTURER',
            department: l.department,
          },
        }),
      );
    }
    const lecturerUsers = await Promise.all(lecturerRows);

    const studentRows: Array<ReturnType<typeof prisma.user.upsert>> = [];
    for (const student of students) {
      studentRows.push(
        prisma.user.upsert({
          where: { email: student.email },
          update: {
            password: hashed,
            fullName: student.fullName,
            role: 'STUDENT',
            studentId: student.studentId,
            department: student.department,
            status: 'active',
          },
          create: {
            email: student.email,
            password: hashed,
            fullName: student.fullName,
            role: 'STUDENT',
            studentId: student.studentId,
            department: student.department,
            status: 'active',
          },
        }),
      );
    }
    const studentUsers = await Promise.all(studentRows);

    // One demo course owned by the first seeded lecturer, with the first
    // seeded student enrolled, so the seeded questions below have a real
    // home course and are actually reachable from the question bank UI.
    const course = await prisma.course.upsert({
      where: { code: SEED_COURSE_CODE },
      update: {
        name: 'Học phần minh họa Question Bank',
        lecturerId: lecturerUsers[0].id,
      },
      create: {
        code: SEED_COURSE_CODE,
        name: 'Học phần minh họa Question Bank',
        description: 'Khóa học mẫu chứa đủ 7 loại câu hỏi để demo/kiểm thử hệ thống.',
        status: 'active',
        lecturerId: lecturerUsers[0].id,
      },
    });

    await prisma.enrollment.upsert({
      where: { courseId_studentId: { courseId: course.id, studentId: studentUsers[0].id } },
      update: {},
      create: { courseId: course.id, studentId: studentUsers[0].id, status: 'active' },
    });

    let seededQuestions = 0;
    for (const q of seedQuestions) {
      const existing = await prisma.question.findFirst({
        where: { courseId: course.id, content: q.content },
        select: { id: true },
      });
      const question = existing ?? await prisma.question.create({
        data: {
          type: q.type,
          content: q.content,
          options: q.options ?? Prisma.JsonNull,
          correctAnswer: q.correctAnswer ?? Prisma.JsonNull,
          explanation: q.explanation,
          difficulty: 3,
          points: 1,
          defaultPoints: 1,
          courseId: course.id,
          creatorId: lecturerUsers[0].id,
          status: QuestionLifecycleStatus.PUBLISHED,
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
          payload: q.options ?? Prisma.JsonNull,
          answerKey: q.correctAnswer ?? Prisma.JsonNull,
          explanation: q.explanation,
          difficulty: 3,
          points: 1,
          metadata: { seededQuestionType: q.type },
          createdBy: lecturerUsers[0].id,
        },
      });
      if (!existing) seededQuestions += 1;
    }

    console.log('Seed completed safely.');
    console.log(`Admin: 1, Lecturers: ${lecturerUsers.length}, Students: ${studentUsers.length}`);
    console.log(`Course: ${course.code}, Questions seeded (all 7 types): ${seededQuestions}/${seedQuestions.length}`);
  } finally {
    await prisma.$disconnect();
  }
}

export { main };

if (process.argv[1] && process.argv[1].includes('seed.ts')) {
  main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}
