import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = '123123123Az!';
const STUDENT_COUNT = 36;

const now = Date.now();
const daysAgo = (n: number) => new Date(now - n * 24 * 60 * 60 * 1000);

// Spread signup dates across the last ~4 weeks so admin's "Tăng trưởng
// người dùng" chart (User.createdAt bucketed by day) shows a real growth
// curve instead of every account landing in the same minute. Kept well
// before any seeded exam activity (seed-analytics-ui-demo.ts dates its
// submissions ~5 days ago) so no student's exam activity ever precedes
// their own signup date.
const ADMIN_CREATED_AT = daysAgo(29);
const LECTURER01_CREATED_AT = daysAgo(28);
const studentCreatedAt = (index: number) =>
  daysAgo(25 - Math.round((index / (STUDENT_COUNT - 1)) * 19)); // day -25 → day -6

const students = Array.from({ length: STUDENT_COUNT }, (_, index) => {
  const id = `522h${String(index + 1).padStart(4, '0')}`;
  return {
    email: `${id}@tdtutdtu.edu.vn`,
    studentId: id,
    fullName: `Student ${id}`,
    department: index % 3 === 0 ? 'Computer Science' : index % 3 === 1 ? 'Information Technology' : 'Mathematics',
  };
});

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
      createdAt: ADMIN_CREATED_AT,
    },
    create: {
      email: 'admin@tdtutdtu.edu.vn',
      password: hashed,
      fullName: 'System Admin',
      role: 'ADMIN',
      department: 'Information Technology',
      createdAt: ADMIN_CREATED_AT,
    },
  });

  await prisma.user.upsert({
    where: { email: 'lecturer01@tdtutdtu.edu.vn' },
    update: {
      password: hashed,
      fullName: 'Lecturer 01',
      role: 'LECTURER',
      department: 'Computer Science',
      createdAt: LECTURER01_CREATED_AT,
    },
    create: {
      email: 'lecturer01@tdtutdtu.edu.vn',
      password: hashed,
      fullName: 'Lecturer 01',
      role: 'LECTURER',
      department: 'Computer Science',
      createdAt: LECTURER01_CREATED_AT,
    },
  });

  for (let index = 0; index < students.length; index += 1) {
    const student = students[index];
    const createdAt = studentCreatedAt(index);
    await prisma.user.upsert({
      where: { email: student.email },
      update: {
        password: hashed,
        fullName: student.fullName,
        role: 'STUDENT',
        studentId: student.studentId,
        department: student.department,
        status: 'active',
        createdAt,
      },
      create: {
        email: student.email,
        password: hashed,
        fullName: student.fullName,
        role: 'STUDENT',
        studentId: student.studentId,
        department: student.department,
        status: 'active',
        createdAt,
      },
    });
  }

  console.log('Seeded accounts only: 1 admin, 1 lecturer, 36 students. No course/exam/question data.');
  } finally {
    await prisma.$disconnect();
  }
}

export { main };

if (process.argv[1] && process.argv[1].includes('seed-accounts-only.ts')) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
