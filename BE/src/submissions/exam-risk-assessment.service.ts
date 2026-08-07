import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiJobsService } from '../ai/ai-jobs.service';
import { AISection } from '../questions-v2/dto/question-draft.dto';
import { ReviewAnomalyFlagDto } from './dto/risk-assessment.dto';
import { AccessPolicyService } from '../common/services/access-policy.service';

interface RequestUser {
  id: string;
  role: string;
}

const TOO_FAST_ANSWER_SECONDS = 3;
const REUSABLE_JOB_STATUSES = ['QUEUED', 'RUNNING', 'SUCCEEDED'];

@Injectable()
export class ExamRiskAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiJobsService: AiJobsService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  private async getAssessmentContext(submissionId: string, user: RequestUser) {
    const submission = await this.prisma.examSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        examId: true,
        examInstanceId: true,
        attemptNo: true,
        score: true,
        startedAt: true,
        submittedAt: true,
        exam: { select: { title: true, duration: true, course: { select: { name: true } } } },
        proctoring: {
          select: {
            tabSwitchCount: true,
            mouseAnomalies: true,
            logs: { select: { eventType: true } },
          },
        },
        answers: { select: { timeTaken: true } },
      },
    });

    if (!submission) {
      throw new NotFoundException({ code: 'SUBMISSION_NOT_FOUND', message: 'Không tìm thấy lượt làm bài của sinh viên.' });
    }

    await this.accessPolicy.assertInstructorCanAccessExam(submission.examId, user);

    return submission;
  }

  private buildEligibility(submission: any) {
    const answers = submission.answers || [];
    const logs = submission.proctoring?.logs || [];

    if (answers.length === 0 && logs.length === 0) {
      return {
        eligible: false,
        reasonCode: 'INSUFFICIENT_RISK_DATA',
        reason: 'Chưa đủ dữ liệu hành vi để đánh giá. Sinh viên cần có câu trả lời hoặc sự kiện giám sát được ghi nhận.',
        signals: { totalAnswers: 0, totalIntegrityEvents: 0 },
      };
    }

    const eventBreakdown: Record<string, number> = {};
    for (const log of logs) {
      const key = String(log.eventType || 'unknown').toLowerCase();
      eventBreakdown[key] = (eventBreakdown[key] || 0) + 1;
    }

    const tabSwitchCount = submission.proctoring?.tabSwitchCount || 0;
    const mouseAnomalies = submission.proctoring?.mouseAnomalies || 0;
    const fullscreenExitCount = eventBreakdown['fullscreen_exit'] || 0;
    const focusLossCount = eventBreakdown['blur'] || 0;
    const pageHiddenCount = eventBreakdown['tab_switch'] || tabSwitchCount;
    const tooFastAnswerCount = answers.filter(
      (a) => a.timeTaken !== null && a.timeTaken !== undefined && a.timeTaken < TOO_FAST_ANSWER_SECONDS,
    ).length;

    const startedAt = submission.startedAt ? new Date(submission.startedAt) : null;
    const endedAt = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
    const timeSpentMinutes = startedAt
      ? Number(((endedAt.getTime() - startedAt.getTime()) / 60000).toFixed(1))
      : null;

    return {
      eligible: true,
      reasonCode: null,
      reason: null,
      submissionSummary: {
        attemptNo: submission.attemptNo,
        score: submission.score ?? null,
        durationMinutes: submission.exam?.duration ?? null,
        timeSpentMinutes,
      },
      signals: {
        tabSwitchCount,
        mouseAnomalies,
        fullscreenExitCount,
        focusLossCount,
        pageHiddenCount,
        tooFastAnswerCount,
        totalAnswers: answers.length,
        totalIntegrityEvents: logs.length,
        eventBreakdown,
      },
    };
  }

  private async getLatestAssessment(submissionId: string) {
    return this.prisma.aIGenerationRecord.findFirst({
      where: { submissionId, section: AISection.RISK_ASSESSMENT },
      select: {
        id: true,
        status: true,
        output: true,
        errorMessage: true,
        completedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEligibility(submissionId: string, user: RequestUser) {
    const submission = await this.getAssessmentContext(submissionId, user);
    const [eligibility, existingAssessment] = await Promise.all([
      Promise.resolve(this.buildEligibility(submission)),
      this.getLatestAssessment(submission.id),
    ]);

    return {
      ...eligibility,
      existingAssessment,
    };
  }

  async requestAssessment(submissionId: string, user: RequestUser) {
    const submission = await this.getAssessmentContext(submissionId, user);
    const eligibility = this.buildEligibility(submission);
    if (!eligibility.eligible) {
      throw new BadRequestException({
        code: eligibility.reasonCode,
        message: eligibility.reason,
      });
    }

    const existingAssessment = await this.getLatestAssessment(submission.id);
    if (existingAssessment && REUSABLE_JOB_STATUSES.includes(existingAssessment.status)) {
      return { jobId: existingAssessment.id, status: existingAssessment.status, reused: true };
    }

    const record = await this.aiJobsService.createJob({
      task: 'exam-risk-assessment',
      examId: submission.examId,
      submissionId: submission.id,
      section: AISection.RISK_ASSESSMENT,
      payload: {
        examId: submission.examId,
        submissionId: submission.id,
        examInstanceId: submission.examInstanceId,
        submissionSummary: eligibility.submissionSummary,
        signals: eligibility.signals,
        language: 'vi',
      },
      requestedBy: user.id,
    });

    return { jobId: record.id, status: record.status, reused: false };
  }

  async getJob(submissionId: string, jobId: string, user: RequestUser) {
    await this.accessPolicy.assertInstructorCanAccessSubmission(submissionId, user);

    const job = await this.prisma.aIGenerationRecord.findFirst({
      where: { id: jobId, submissionId },
    });
    if (!job) {
      throw new NotFoundException({ code: 'RISK_JOB_NOT_FOUND', message: 'Không tìm thấy kết quả đánh giá rủi ro.' });
    }

    const flag = await this.prisma.anomalyFlag.findFirst({ where: { jobId: job.id } });

    return { ...job, flag };
  }

  async listFlags(examId: string, user: RequestUser, status?: string) {
    await this.accessPolicy.assertInstructorCanAccessExam(examId, user);

    const exam = await this.prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    const validStatuses = ['OPEN', 'REVIEWED', 'DISMISSED', 'CONFIRMED'];
    const normalizedStatus = status && validStatuses.includes(status.toUpperCase())
      ? (status.toUpperCase() as 'OPEN' | 'REVIEWED' | 'DISMISSED' | 'CONFIRMED')
      : undefined;

    return this.prisma.anomalyFlag.findMany({
      where: {
        examInstance: { examId },
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
      include: {
        examInstance: {
          select: {
            studentId: true,
            student: { select: { id: true, fullName: true, studentId: true } },
          },
        },
        job: { select: { id: true, submissionId: true, output: true, createdAt: true } },
        reviewer: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewFlag(flagId: string, dto: ReviewAnomalyFlagDto, user: RequestUser) {
    const flag = await this.prisma.anomalyFlag.findUnique({ where: { id: flagId } });
    if (!flag) {
      throw new NotFoundException('Không tìm thấy cảnh báo bất thường');
    }

    await this.accessPolicy.assertInstructorCanAccessAnomalyFlag(flagId, user);

    return this.prisma.anomalyFlag.update({
      where: { id: flagId },
      data: {
        status: dto.status as unknown as 'REVIEWED' | 'DISMISSED' | 'CONFIRMED',
        reviewerId: user.id,
        reviewedAt: new Date(),
        notes: dto.notes ?? null,
      },
    });
  }
}
