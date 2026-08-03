import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto, BulkEnrollmentDto, BulkEnrollByEmailsDto, BulkImportStudentsDto, UpdateEnrollmentStatusDto } from './dto/enrollment.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  private assertCanManageCourse(courseLecturerId: string | null, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    if (user.role === 'ADMIN') return;
    if (user.role !== 'LECTURER' || courseLecturerId !== user.id) {
      throw new ForbiddenException('You are not allowed to manage enrollments for this course');
    }
  }

  private async assertCanManageCourseById(courseId: string, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, lecturerId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertCanManageCourse(course.lecturerId, user);
    return course;
  }

  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createEnrollmentDto: CreateEnrollmentDto, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createEnrollmentDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertCanManageCourse(course.lecturerId, user);

    // Check if student exists and is a student
    const student = await this.prisma.user.findUnique({
      where: { id: createEnrollmentDto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (student.role !== 'STUDENT') {
      throw new BadRequestException('User is not a student');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: {
          studentId: createEnrollmentDto.studentId,
          courseId: createEnrollmentDto.courseId,
        },
      },
    });

    if (existingEnrollment) {
      throw new ConflictException('Student already enrolled in this course');
    }

    const enrollment = await this.prisma.enrollment.create({
      data: createEnrollmentDto,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });



    return enrollment;
  }

  async bulkEnroll(bulkEnrollmentDto: BulkEnrollmentDto, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const { courseId, studentIds } = bulkEnrollmentDto;

    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    this.assertCanManageCourse(course.lecturerId, user);

    const results = {
      success: [] as string[],
      failed: [] as { studentId: string; reason: string }[],
    };

    for (const studentId of studentIds) {
      try {
        const student = await this.prisma.user.findUnique({
          where: { id: studentId },
        });

        if (!student) {
          results.failed.push({ studentId, reason: 'Student not found' });
          continue;
        }

        if (student.role !== 'STUDENT') {
          results.failed.push({ studentId, reason: 'User is not a student' });
          continue;
        }

        const existingEnrollment = await this.prisma.enrollment.findUnique({
          where: {
            courseId_studentId: { studentId, courseId },
          },
        });

        if (existingEnrollment) {
          results.failed.push({ studentId, reason: 'Already enrolled' });
          continue;
        }

        await this.prisma.enrollment.create({
          data: { studentId, courseId },
        });

        results.success.push(studentId);
      } catch (error) {
        results.failed.push({ studentId, reason: 'Unknown error' });
      }
    }



    return results;
  }

  async bulkEnrollByEmails(dto: BulkEnrollByEmailsDto, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const { courseId, emails } = dto;

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    this.assertCanManageCourse(course.lecturerId, user);

    const results = {
      success: [] as { email: string; fullName: string; studentId: string | null }[],
      failed: [] as { email: string; reason: string }[],
      provisioned: 0,
    };

    for (const email of emails) {
      try {
        let student = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

        // Auto-provision: create student account if email not yet registered
        if (!student) {
          const tempPassword = await bcrypt.hash('Examtrust@123', 10);
          const emailPrefix = email.split('@')[0];
          student = await this.prisma.user.create({
            data: {
              email: email.toLowerCase().trim(),
              password: tempPassword,
              passwordChangedAt: new Date(),
              fullName: emailPrefix,
              role: 'STUDENT',
            },
          });
          results.provisioned = (results.provisioned ?? 0) + 1;
        }

        if (student.role !== 'STUDENT') { results.failed.push({ email, reason: 'User is not a student (role: ' + student.role + ')' }); continue; }

        const existing = await this.prisma.enrollment.findUnique({
          where: { courseId_studentId: { studentId: student.id, courseId } },
        });
        if (existing) { results.failed.push({ email, reason: 'Already enrolled' }); continue; }

        await this.prisma.enrollment.create({ data: { studentId: student.id, courseId } });
        results.success.push({ email, fullName: student.fullName, studentId: student.studentId });
      } catch (err: any) {
        this.logger.error(`Failed to enroll ${email}: ${err?.message}`);
        results.failed.push({ email, reason: err?.message ?? 'Unknown error' });
      }
    }



    return results;
  }

  async bulkImport(dto: BulkImportStudentsDto, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const { courseId, students } = dto;

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    this.assertCanManageCourse(course.lecturerId, user);

    const results = {
      success: [] as { email: string; fullName: string; studentId: string | null; row: number }[],
      failed: [] as { email: string; reason: string; row: number }[],
      provisioned: 0,
      totalProcessed: students.length,
    };

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const rowNum = i + 1;
      const email = (row.email || '').toLowerCase().trim();

      if (!email) {
        results.failed.push({ email: email || '(empty)', reason: 'Email is required', row: rowNum });
        continue;
      }

      try {
        let student = await this.prisma.user.findUnique({ where: { email } });

        // Auto-provision: create student account if not found
        if (!student) {
          const tempPassword = await bcrypt.hash('Examtrust@123', 10);
          const emailPrefix = email.split('@')[0];
          student = await this.prisma.user.create({
            data: {
              email,
              password: tempPassword,
              passwordChangedAt: new Date(),
              fullName: row.fullName?.trim() || emailPrefix,
              role: 'STUDENT',
              studentId: row.studentId?.trim() || null,
              department: row.department?.trim() || null,
            },
          });
          results.provisioned++;
        }

        if (student.role !== 'STUDENT') {
          results.failed.push({ email, reason: `User is not a student (role: ${student.role})`, row: rowNum });
          continue;
        }

        // Update fullName/studentId if provided in file and currently empty
        const updateData: any = {};
        if (row.fullName?.trim() && (!student.fullName || student.fullName === email.split('@')[0])) {
          updateData.fullName = row.fullName.trim();
        }
        if (row.studentId?.trim() && !student.studentId) {
          updateData.studentId = row.studentId.trim();
        }
        if (row.department?.trim() && !student.department) {
          updateData.department = row.department.trim();
        }
        if (Object.keys(updateData).length > 0) {
          await this.prisma.user.update({ where: { id: student.id }, data: updateData });
        }

        const existing = await this.prisma.enrollment.findUnique({
          where: { courseId_studentId: { studentId: student.id, courseId } },
        });
        if (existing) {
          results.failed.push({ email, reason: 'Already enrolled in this course', row: rowNum });
          continue;
        }

        await this.prisma.enrollment.create({ data: { studentId: student.id, courseId } });
        results.success.push({
          email,
          fullName: row.fullName?.trim() || student.fullName,
          studentId: row.studentId?.trim() || student.studentId,
          row: rowNum,
        });
      } catch (err: any) {
        this.logger.error(`Bulk import failed for ${email}: ${err?.message}`);
        results.failed.push({ email, reason: err?.message ?? 'Unknown error', row: rowNum });
      }
    }

    return results;
  }

  async searchTrainingSystemStudents(query?: string, courseId?: string) {
    const trimmedQuery = String(query || '').trim();
    const normalizedQuery = trimmedQuery.toLowerCase();

    const alreadyEnrolled = courseId
      ? await this.prisma.enrollment.findMany({
          where: { courseId },
          select: { studentId: true },
        })
      : [];
    const excludedStudentIds = new Set(alreadyEnrolled.map((row) => row.studentId));

    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
        status: 'active',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        studentId: true,
        department: true,
      },
      orderBy: { fullName: 'asc' },
      take: 100,
    });

    return students.filter((student) => {
      if (excludedStudentIds.has(student.id)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        student.email,
        student.fullName,
        student.studentId,
        student.department,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }

  async findByCourse(courseId: string, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    await this.assertCanManageCourseById(courseId, user);

    return this.prisma.enrollment.findMany({
      where: { courseId },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
            department: true,
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            lecturer: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });
  }

  async updateStatus(id: string, updateStatusDto: UpdateEnrollmentStatusDto, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            lecturerId: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    this.assertCanManageCourse(enrollment.course.lecturerId, user);

    const updated = await this.prisma.enrollment.update({
      where: { id },
      data: { status: updateStatusDto.status },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            email: true,
            studentId: true,
          },
        },
        course: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });



    return updated;
  }

  async remove(id: string, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, code: true, name: true, lecturerId: true },
        },
        student: {
          select: { id: true, fullName: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    this.assertCanManageCourse(enrollment.course.lecturerId, user);

    await this.prisma.enrollment.delete({ where: { id } });



    return { message: 'Enrollment removed successfully' };
  }

  async removeByStudentAndCourse(studentId: string, courseId: string, user: { id: string; role: 'ADMIN' | 'LECTURER' | 'STUDENT' }) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        courseId_studentId: { studentId, courseId },
      },
      include: {
        course: {
          select: { id: true, code: true, lecturerId: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    this.assertCanManageCourse(enrollment.course.lecturerId, user);

    await this.prisma.enrollment.delete({
      where: { id: enrollment.id },
    });



    return { message: 'Enrollment removed successfully' };
  }
}
