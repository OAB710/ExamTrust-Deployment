/**
 * Khôi phục lại các "lớp học phần" (course sections) từng được tạo bởi bản
 * `prisma/seed.ts` cũ (trước khi bị thay bằng bản SEED-101/7-câu-hỏi tại
 * commit 71d6c3d5, xem BE/docs/SEED_DATA_ANALYSIS.md mục 4.1).
 *
 * Đây là điều kiện tiên quyết bắt buộc cho:
 *   - prisma/seed-course-question-banks.ts (cần CLS001..CLS010, DATNUO-LECT-01/02)
 *   - prisma/seed-cls001-grade1-math.ts     (cần CLS001 có lecturerId)
 *
 * Nguồn gốc dữ liệu: khôi phục nguyên trạng từ `git show 95cd9cea:BE/prisma/seed.ts`
 * (commit đã thêm các lớp học phần này trước khi bị gỡ), giữ đúng code/tên/credits.
 *
 * Idempotent (upsert theo course.code + enrollment createMany skipDuplicates).
 *
 * Cách chạy:
 *   cd BE && npx ts-node --transpile-only prisma/seed-legacy-course-sections.ts
 */
import { PrismaClient, CourseTerm } from '@prisma/client';

const prisma = new PrismaClient();

const LECTURER_EMAIL = 'lecturer01@tdtutdtu.edu.vn';
const COURSE_ACADEMIC_YEAR = '2025-2026';
const COURSE_TERM: CourseTerm = CourseTerm.TERM_2;
const STUDENTS_PER_CLASS = 20;

const CLS001 = {
  code: 'CLS001',
  name: 'Khóa học thử nghiệm Academic Trust',
  description: 'Khóa học demo phục vụ kiểm thử nền tảng Academic Trust.',
  credits: 3,
};

// Các lớp học phần "thực tế" — cùng môn có thể được dạy ở nhiều ca khác nhau,
// mô phỏng đúng thời khóa biểu thật (giữ nguyên từ bản seed.ts gốc).
const realisticCourseSections = [
  { code: 'DATNUO-LECT-01', name: 'Đất nước Việt Nam - Thứ 4 ca 1', credits: 2 },
  { code: 'DATNUO-LECT-02', name: 'Đất nước Việt Nam - Thứ 4 ca 2', credits: 2 },
  { code: 'CLS002', name: 'Lập trình Web - Thứ 4 ca 1', credits: 3 },
  { code: 'CLS003', name: 'Lập trình Web - Thứ 4 ca 2', credits: 3 },
  { code: 'CLS004', name: 'Lập trình hướng đối tượng - Thứ 3 ca 1', credits: 3 },
  { code: 'CLS005', name: 'Nhập môn lập trình - Thứ 2 ca 1', credits: 3 },
  { code: 'CLS006', name: 'Cấu trúc dữ liệu và giải thuật - Thứ 5 ca 2', credits: 3 },
  { code: 'CLS007', name: 'Hệ điều hành - Thứ 3 ca 2', credits: 3 },
  { code: 'CLS008', name: 'Mạng máy tính - Thứ 4 ca 3', credits: 3 },
  { code: 'CLS009', name: 'Phân tích và thiết kế hệ thống - Thứ 6 ca 1', credits: 3 },
  { code: 'CLS010', name: 'Xây dựng ứng dụng di động - Thứ 5 ca 1', credits: 3 },
] as const;

async function main() {
  try {
    const lecturer = await prisma.user.findUnique({ where: { email: LECTURER_EMAIL } });
    if (!lecturer) {
      throw new Error(`Không tìm thấy giảng viên ${LECTURER_EMAIL}; hãy chạy seed accounts trước.`);
    }

    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, studentId: true },
      orderBy: { studentId: 'asc' },
    });
    if (students.length === 0) {
      throw new Error('Không có sinh viên nào trong DB; hãy chạy seed accounts trước.');
    }

    const course = await prisma.course.upsert({
      where: { code: CLS001.code },
      update: {
        name: CLS001.name,
        academicYear: COURSE_ACADEMIC_YEAR,
        term: COURSE_TERM,
        credits: CLS001.credits,
        status: 'active',
        statusEnum: 'ACTIVE',
        lecturerId: lecturer.id,
      },
      create: {
        code: CLS001.code,
        name: CLS001.name,
        academicYear: COURSE_ACADEMIC_YEAR,
        term: COURSE_TERM,
        credits: CLS001.credits,
        description: CLS001.description,
        status: 'active',
        statusEnum: 'ACTIVE',
        lecturerId: lecturer.id,
      },
    });

    await prisma.enrollment.createMany({
      data: students.map((student) => ({
        courseId: course.id,
        studentId: student.id,
        status: 'active',
        statusEnum: 'ACTIVE' as const,
      })),
      skipDuplicates: true,
    });

    let sectionCount = 0;
    for (const [sectionIndex, section] of realisticCourseSections.entries()) {
      const sectionCourse = await prisma.course.upsert({
        where: { code: section.code },
        update: {
          name: section.name,
          academicYear: COURSE_ACADEMIC_YEAR,
          term: COURSE_TERM,
          credits: section.credits,
          description: `Lớp học phần ${section.name}.`,
          status: 'active',
          statusEnum: 'ACTIVE',
          lecturerId: lecturer.id,
        },
        create: {
          code: section.code,
          name: section.name,
          academicYear: COURSE_ACADEMIC_YEAR,
          term: COURSE_TERM,
          credits: section.credits,
          description: `Lớp học phần ${section.name}.`,
          status: 'active',
          statusEnum: 'ACTIVE',
          lecturerId: lecturer.id,
        },
      });

      const sectionStudents = Array.from(
        { length: Math.min(STUDENTS_PER_CLASS, students.length) },
        (_, offset) => students[(sectionIndex * STUDENTS_PER_CLASS + offset) % students.length],
      );

      await prisma.enrollment.createMany({
        data: sectionStudents.map((student) => ({
          courseId: sectionCourse.id,
          studentId: student.id,
          status: 'active',
          statusEnum: 'ACTIVE' as const,
        })),
        skipDuplicates: true,
      });

      sectionCount += 1;
    }

    console.log('=== Seed lớp học phần (legacy CLS00x/DATNUO) hoàn tất ===');
    console.log(`Lớp gốc: ${course.code} (${students.length} sinh viên)`);
    console.log(`Lớp học phần bổ sung: ${sectionCount} (${realisticCourseSections.map((s) => s.code).join(', ')})`);
  } finally {
    await prisma.$disconnect();
  }
}

export { main };

if (process.argv[1] && process.argv[1].includes('seed-legacy-course-sections.ts')) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
