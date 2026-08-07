import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type AuthUser = {
  id: string;
  role?: string;
};

@Injectable()
export class AccessPolicyService {
  constructor(private prisma: PrismaService) {}

  async assertInstructorCanAccessExam(examId: string, user: AuthUser) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        creatorId: true,
        course: {
          select: {
            lecturerId: true,
          },
        },
      },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return exam;

    if (
      role === 'LECTURER' &&
      (exam.creatorId === user.id || exam.course?.lecturerId === user.id)
    ) {
      return exam;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập bài thi này');
  }

  async assertInstructorCanAccessCourse(courseId: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, lecturerId: true },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return course;

    if (role === 'LECTURER' && course.lecturerId === user.id) {
      return course;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập khóa học này');
  }

  async assertInstructorCanAccessSubmission(submissionId: string, user: AuthUser) {
    const submission = await this.prisma.examSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        examId: true,
        exam: {
          select: {
            creatorId: true,
            course: {
              select: {
                lecturerId: true,
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy lượt làm bài');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return submission;

    if (
      role === 'LECTURER' &&
      (submission.exam?.creatorId === user.id || submission.exam?.course?.lecturerId === user.id)
    ) {
      return submission;
    }

    throw new ForbiddenException('Bạn không có quyền truy cập lượt làm bài này');
  }

  async assertInstructorCanAccessSubmissionAnswer(answerId: string, user: AuthUser) {
    const answer = await this.prisma.submissionAnswer.findUnique({
      where: { id: answerId },
      select: { submissionId: true },
    });

    if (!answer) {
      throw new NotFoundException('Không tìm thấy câu trả lời');
    }

    return this.assertInstructorCanAccessSubmission(answer.submissionId, user);
  }

  async assertInstructorCanAccessAnomalyFlag(flagId: string, user: AuthUser) {
    const flag = await this.prisma.anomalyFlag.findUnique({
      where: { id: flagId },
      select: {
        id: true,
        examInstance: {
          select: {
            examId: true,
          },
        },
      },
    });

    if (!flag) {
      throw new NotFoundException('Không tìm thấy cảnh báo bất thường');
    }

    await this.assertInstructorCanAccessExam(flag.examInstance.examId, user);
    return flag;
  }

}
