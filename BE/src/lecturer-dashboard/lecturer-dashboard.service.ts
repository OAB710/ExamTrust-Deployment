import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LecturerAttentionResponseDto } from './dto/lecturer-attention-response.dto';

@Injectable()
export class LecturerDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttention(lecturerId: string): Promise<LecturerAttentionResponseDto> {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const ownedExamWhere = {
      OR: [
        { creatorId: lecturerId },
        { course: { lecturerId } },
      ],
    };
    const ownedQuestionWhere = {
      OR: [
        { creatorId: lecturerId },
        { course: { lecturerId } },
      ],
    };

    const [suspiciousReports, pendingAiQuestions, draftExams, firstDraftExam, upcomingExams] =
      await Promise.all([
        this.prisma.anomalyFlag.count({
          where: {
            status: 'OPEN',
            examInstance: { exam: ownedExamWhere },
          },
        }),
        this.prisma.questionVersion.count({
          where: {
            aiGenerated: true,
            question: ownedQuestionWhere,
            aiRecords: {
              some: {
                status: 'SUCCEEDED',
                reviewStatus: 'PENDING',
              },
            },
          },
        }),
        this.prisma.exam.count({
          where: {
            ...ownedExamWhere,
            status: 'DRAFT',
          },
        }),
        this.prisma.exam.findFirst({
          where: {
            ...ownedExamWhere,
            status: 'DRAFT',
          },
          orderBy: { updatedAt: 'desc' },
          select: { id: true },
        }),
        this.prisma.exam.count({
          where: {
            ...ownedExamWhere,
            status: 'PUBLISHED',
            startTime: {
              gt: now,
              lte: next24Hours,
            },
          },
        }),
      ]);

    return {
      suspiciousReports: {
        count: suspiciousReports,
        href: '/lecturer/analytics?flagStatus=OPEN',
      },
      pendingAiQuestions: {
        count: pendingAiQuestions,
        href: '/lecturer/question-bank?source=AI&approvalStatus=PENDING',
      },
      draftExams: {
        count: draftExams,
        href:
          draftExams === 1 && firstDraftExam
            ? `/lecturer/exam/${firstDraftExam.id}/preview`
            : '/lecturer/exams?status=DRAFT',
      },
      upcomingExams: {
        count: upcomingExams,
        href: '/lecturer/exams?timeRange=next24Hours',
      },
    };
  }
}
