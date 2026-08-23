import { PrismaClient } from '@prisma/client';
import { daysAgo, generateCourseCode } from './seed-helpers';
import { main as seedUsers } from './seed-users';

const prisma = new PrismaClient();

// One row per course. `lecturerIndex` selects which seeded lecturer (0-based,
// matches seed-users.ts numbering) owns it. `createdDaysAgo` must stay after
// that lecturer's own createdAt (lecturer i is created at daysAgo(50 - i*3))
// AND stay inside the admin dashboard's ~55-day horizon (see seed-users.ts) —
// values here are capped at 40 for that reason.
export type CoursePlan = {
  key: string; // stable key other seed scripts reference this course by
  name: string;
  lecturerIndex: number;
  createdDaysAgo: number;
  term: 'TERM_1' | 'TERM_2';
  enrollFraction: number; // 0..1 of the 20 students to enroll
};

// Theo yêu cầu: mọi course dồn về lecturer01 (lecturerIndex: 0) để có thể
// kiểm tra hết mọi case (đủ loại câu hỏi, trùng lặp, ma trận đề, nhiều lượt
// làm, giám thị...) chỉ từ 1 tài khoản, không phải đăng nhập lần lượt 10
// giảng viên. 9 lecturer còn lại vẫn được tạo (đăng nhập được) nhưng không sở
// hữu course nào — bản thân đó cũng là 1 case hợp lệ ("giảng viên chưa có
// course nào", màn danh sách course rỗng).
export const COURSE_PLANS: CoursePlan[] = [
  { key: 'intro-it', name: 'Nhập môn Công nghệ Thông tin', lecturerIndex: 0, createdDaysAgo: 40, term: 'TERM_1', enrollFraction: 1 },
  // enrollFraction: 1 (not 0) so its exam has enough enrolled students for a
  // rich demo dataset (many attempts, every integrity violation type) — see
  // "seven-types-exam" in seed-exams.ts / seed-submissions.ts / seed-integrity.ts.
  { key: 'seven-types', name: 'Kiểm thử 7 loại câu hỏi', lecturerIndex: 0, createdDaysAgo: 15, term: 'TERM_2', enrollFraction: 1 },
  { key: 'dsa', name: 'Cấu trúc Dữ liệu và Giải thuật', lecturerIndex: 0, createdDaysAgo: 38, term: 'TERM_1', enrollFraction: 1 },
  { key: 'database', name: 'Cơ sở Dữ liệu', lecturerIndex: 0, createdDaysAgo: 36, term: 'TERM_1', enrollFraction: 1 },
  { key: 'networking', name: 'Mạng máy tính', lecturerIndex: 0, createdDaysAgo: 34, term: 'TERM_1', enrollFraction: 0.85 },
  { key: 'infosec', name: 'An toàn & Bảo mật Thông tin', lecturerIndex: 0, createdDaysAgo: 33, term: 'TERM_1', enrollFraction: 0.85 },
  { key: 'webdev', name: 'Phát triển Ứng dụng Web', lecturerIndex: 0, createdDaysAgo: 25, term: 'TERM_2', enrollFraction: 1 },
  { key: 'ai', name: 'Trí tuệ Nhân tạo', lecturerIndex: 0, createdDaysAgo: 20, term: 'TERM_2', enrollFraction: 0.7 },
  { key: 'business-intel', name: 'Nhập môn Trí tuệ Doanh nghiệp', lecturerIndex: 0, createdDaysAgo: 18, term: 'TERM_2', enrollFraction: 0.6 },
  { key: 'discrete-math', name: 'Toán rời rạc', lecturerIndex: 0, createdDaysAgo: 37, term: 'TERM_1', enrollFraction: 0.8 },
  { key: 'soft-skills', name: 'Kỹ năng mềm & Giao tiếp CNTT', lecturerIndex: 0, createdDaysAgo: 16, term: 'TERM_2', enrollFraction: 0.75 },
  { key: 'project-mgmt', name: 'Quản trị Dự án Phần mềm', lecturerIndex: 0, createdDaysAgo: 14, term: 'TERM_2', enrollFraction: 0.6 },
];

export async function main(seededUsers?: Awaited<ReturnType<typeof seedUsers>>) {
  try {
    const { lecturerUsers, studentUsers } = seededUsers ?? (await seedUsers());

    const coursesByKey: Record<string, any> = {};

    for (const plan of COURSE_PLANS) {
      const lecturer = lecturerUsers[plan.lecturerIndex];
      const createdAt = daysAgo(plan.createdDaysAgo);

      // Reuse an already-seeded course with the same name+lecturer (idempotent
      // re-run) instead of minting a new code every time.
      let course = await prisma.course.findFirst({
        where: { name: plan.name, lecturerId: lecturer.id },
      });

      if (!course) {
        const code = await generateCourseCode(prisma, plan.name, lecturer.fullName);
        course = await prisma.course.create({
          data: {
            code,
            name: plan.name,
            description: `Học phần "${plan.name}" — dữ liệu demo ExamTrust.`,
            academicYear: '2025-2026',
            term: plan.term,
            credits: 3,
            status: 'active',
            statusEnum: 'ACTIVE',
            lecturerId: lecturer.id,
            createdAt,
          },
        });
      }

      coursesByKey[plan.key] = course;

      const enrollCount = Math.round(plan.enrollFraction * studentUsers.length);
      for (let i = 0; i < enrollCount; i++) {
        const student = studentUsers[i];
        await prisma.enrollment.upsert({
          where: { courseId_studentId: { courseId: course.id, studentId: student.id } },
          update: {},
          create: {
            courseId: course.id,
            studentId: student.id,
            status: 'active',
            statusEnum: 'ACTIVE',
            joinedAt: new Date(Math.max(createdAt.getTime() + i * 3_600_000, createdAt.getTime())),
          },
        });
      }
    }

    console.log(`[seed-courses] courses=${Object.keys(coursesByKey).length}`);
    return { lecturerUsers, studentUsers, coursesByKey };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-courses.ts')) {
  main().catch((error) => {
    console.error('[seed-courses] failed:', error);
    process.exit(1);
  });
}
