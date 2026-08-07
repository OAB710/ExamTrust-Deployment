import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const PASSWORD = '123123123Az!';
const STUDENT_COUNT = 36;

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

  await prisma.user.upsert({
    where: { email: 'lecturer01@tdtutdtu.edu.vn' },
    update: {
      password: hashed,
      fullName: 'Lecturer 01',
      role: 'LECTURER',
      department: 'Computer Science',
    },
    create: {
      email: 'lecturer01@tdtutdtu.edu.vn',
      password: hashed,
      fullName: 'Lecturer 01',
      role: 'LECTURER',
      department: 'Computer Science',
    },
  });

  for (const student of students) {
    await prisma.user.upsert({
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
    });
  }

  console.log('Seeded accounts only: 1 admin, 1 lecturer, 36 students. No course/exam/question data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
