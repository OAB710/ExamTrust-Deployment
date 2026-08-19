import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PASSWORD, daysAgo } from './seed-helpers';

const prisma = new PrismaClient();

export const STUDENT_COUNT = 20;
export const LECTURER_COUNT = 10;

// Distinct real-looking full names — NOT "Giảng viên 01".."10", because the
// real course-code generator (generateCourseCode) takes its first 4 ASCII
// characters from the lecturer's fullName; a shared "Giảng viên " prefix
// would collapse every course code to the same "...-GIAN-xx" suffix.
const LECTURER_FULL_NAMES = [
  'Nguyễn Văn An',
  'Trần Thị Bích',
  'Lê Minh Cường',
  'Phạm Thị Dung',
  'Hoàng Văn Em',
  'Vũ Thị Giang',
  'Đặng Minh Hải',
  'Bùi Thị Kim',
  'Ngô Văn Long',
  'Đỗ Thị Mai',
];

// Departments vary per lecturer so a "by department" breakdown isn't a
// single bucket; still all under the same faculty context as the courses.
const LECTURER_DEPARTMENTS = [
  'Khoa học Máy tính',
  'Công nghệ Thông tin',
  'Hệ thống Thông tin',
  'Kỹ thuật Phần mềm',
  'An toàn Thông tin',
  'Mạng máy tính & Truyền thông',
  'Trí tuệ Nhân tạo',
  'Toán - Tin ứng dụng',
  'Thương mại Điện tử',
  'Quản lý Dự án CNTT',
];

export async function main() {
  try {
    const hashed = await bcrypt.hash(PASSWORD, 10);

    // The admin dashboard's default view is a 30-day window
    // (FE/src/features/admin/AdminAnalyticsDashboard.tsx:16, `rangeFor(30)`).
    // Every date in this whole seed suite must stay inside a ~55-day horizon
    // from "today" (not 180) so the DEFAULT view already shows real bars —
    // switching to the 90-day preset should still show growth, not a cliff.
    // Admin created first (day -55), lecturers roll out over the next ~3
    // weeks, students trickle in over the following ~5 weeks — so the "user
    // growth" chart has a real upward staircase instead of one flat line.
    const admin = await prisma.user.upsert({
      where: { email: 'admin@tdtutdtu.edu.vn' },
      update: { password: hashed, fullName: 'System Admin', role: 'ADMIN', department: 'Ban Quản trị Hệ thống' },
      create: {
        email: 'admin@tdtutdtu.edu.vn',
        password: hashed,
        fullName: 'System Admin',
        role: 'ADMIN',
        department: 'Ban Quản trị Hệ thống',
        createdAt: daysAgo(55),
      },
    });

    const lecturerUsers = [];
    for (let index = 0; index < LECTURER_COUNT; index++) {
      const num = String(index + 1).padStart(2, '0');
      const email = `lecturer${num}@tdtutdtu.edu.vn`;
      const fullName = LECTURER_FULL_NAMES[index] ?? `Giảng viên ${num}`;
      const department = LECTURER_DEPARTMENTS[index % LECTURER_DEPARTMENTS.length];
      const createdAt = daysAgo(50 - index * 3); // 50 days ago .. 23 days ago
      const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashed, fullName, role: 'LECTURER', department },
        create: { email, password: hashed, fullName, role: 'LECTURER', department, createdAt },
      });
      lecturerUsers.push(user);
    }

    const studentUsers = [];
    for (let index = 0; index < STUDENT_COUNT; index++) {
      const id = `522h${String(index + 1).padStart(4, '0')}`;
      const email = `${id}@tdtutdtu.edu.vn`;
      const department = index % 3 === 0 ? 'Khoa học Máy tính' : index % 3 === 1 ? 'Công nghệ Thông tin' : 'Hệ thống Thông tin';
      // Students enroll over the ~6 weeks following the lecturer rollout,
      // most of them landing inside the default 30-day window.
      const createdAt = daysAgo(40 - index * 2); // 40 days ago .. 2 days ago
      const user = await prisma.user.upsert({
        where: { email },
        update: { password: hashed, fullName: id, role: 'STUDENT', studentId: id, department, status: 'active' },
        create: {
          email,
          password: hashed,
          fullName: id,
          role: 'STUDENT',
          studentId: id,
          department,
          status: 'active',
          createdAt,
        },
      });
      studentUsers.push(user);
    }

    console.log(`[seed-users] admin=1 lecturer=${lecturerUsers.length} student=${studentUsers.length}`);
    return { admin, lecturerUsers, studentUsers };
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && process.argv[1].includes('seed-users.ts')) {
  main().catch((error) => {
    console.error('[seed-users] failed:', error);
    process.exit(1);
  });
}
