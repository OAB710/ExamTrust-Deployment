"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamRiskAssessmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_jobs_service_1 = require("../ai/ai-jobs.service");
const question_draft_dto_1 = require("../questions-v2/dto/question-draft.dto");
const access_policy_service_1 = require("../common/services/access-policy.service");
const TOO_FAST_ANSWER_SECONDS = 3;
let ExamRiskAssessmentService = class ExamRiskAssessmentService {
    constructor(prisma, aiJobsService, accessPolicy) {
        this.prisma = prisma;
        this.aiJobsService = aiJobsService;
        this.accessPolicy = accessPolicy;
    }
    async requestAssessment(submissionId, user) {
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
            throw new common_1.NotFoundException('Submission not found');
        }
        await this.accessPolicy.assertInstructorCanAccessExam(submission.examId, user);
        const answers = submission.answers || [];
        const logs = submission.proctoring?.logs || [];
        if (answers.length === 0 && logs.length === 0) {
            throw new common_1.BadRequestException('Not enough behavioral data to assess integrity risk. The student has not answered any questions or triggered any proctoring events yet.');
        }
        const eventBreakdown = {};
        for (const log of logs) {
            const key = String(log.eventType || 'unknown').toLowerCase();
            eventBreakdown[key] = (eventBreakdown[key] || 0) + 1;
        }
        const tabSwitchCount = submission.proctoring?.tabSwitchCount || 0;
        const mouseAnomalies = submission.proctoring?.mouseAnomalies || 0;
        const fullscreenExitCount = eventBreakdown['fullscreen_exit'] || 0;
        const focusLossCount = eventBreakdown['blur'] || 0;
        const pageHiddenCount = eventBreakdown['tab_switch'] || tabSwitchCount;
        const tooFastAnswerCount = answers.filter((a) => a.timeTaken !== null && a.timeTaken !== undefined && a.timeTaken < TOO_FAST_ANSWER_SECONDS).length;
        const startedAt = submission.startedAt ? new Date(submission.startedAt) : null;
        const endedAt = submission.submittedAt ? new Date(submission.submittedAt) : new Date();
        const timeSpentMinutes = startedAt
            ? Number(((endedAt.getTime() - startedAt.getTime()) / 60000).toFixed(1))
            : null;
        const record = await this.aiJobsService.createJob({
            task: 'exam-risk-assessment',
            examId: submission.examId,
            submissionId: submission.id,
            section: question_draft_dto_1.AISection.RISK_ASSESSMENT,
            payload: {
                examId: submission.examId,
                submissionId: submission.id,
                examInstanceId: submission.examInstanceId,
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
                language: 'vi',
            },
            requestedBy: user.id,
        });
        return { jobId: record.id, status: record.status };
    }
    async getJob(submissionId, jobId, user) {
        await this.accessPolicy.assertInstructorCanAccessSubmission(submissionId, user);
        const job = await this.prisma.aIGenerationRecord.findFirst({
            where: { id: jobId, submissionId },
        });
        if (!job) {
            throw new common_1.NotFoundException('Risk assessment job not found');
        }
        const flag = await this.prisma.anomalyFlag.findFirst({ where: { jobId: job.id } });
        return { ...job, flag };
    }
    async listFlags(examId, user, status) {
        await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        const exam = await this.prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const validStatuses = ['OPEN', 'REVIEWED', 'DISMISSED', 'CONFIRMED'];
        const normalizedStatus = status && validStatuses.includes(status.toUpperCase())
            ? status.toUpperCase()
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
    async reviewFlag(flagId, dto, user) {
        const flag = await this.prisma.anomalyFlag.findUnique({ where: { id: flagId } });
        if (!flag) {
            throw new common_1.NotFoundException('Anomaly flag not found');
        }
        await this.accessPolicy.assertInstructorCanAccessAnomalyFlag(flagId, user);
        return this.prisma.anomalyFlag.update({
            where: { id: flagId },
            data: {
                status: dto.status,
                reviewerId: user.id,
                reviewedAt: new Date(),
                notes: dto.notes ?? null,
            },
        });
    }
};
exports.ExamRiskAssessmentService = ExamRiskAssessmentService;
exports.ExamRiskAssessmentService = ExamRiskAssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_jobs_service_1.AiJobsService,
        access_policy_service_1.AccessPolicyService])
], ExamRiskAssessmentService);
//# sourceMappingURL=exam-risk-assessment.service.js.map