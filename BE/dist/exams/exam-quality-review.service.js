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
exports.ExamQualityReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const submissions_service_1 = require("../submissions/submissions.service");
const ai_jobs_service_1 = require("../ai/ai-jobs.service");
const access_policy_service_1 = require("../common/services/access-policy.service");
const question_draft_dto_1 = require("../questions-v2/dto/question-draft.dto");
const MIN_ANALYZED_SUBMISSIONS = 1;
let ExamQualityReviewService = class ExamQualityReviewService {
    constructor(prisma, submissionsService, aiJobsService, accessPolicy) {
        this.prisma = prisma;
        this.submissionsService = submissionsService;
        this.aiJobsService = aiJobsService;
        this.accessPolicy = accessPolicy;
    }
    async requestReview(examId, user) {
        await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: { id: true, title: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const intelligence = await this.submissionsService.getExamIntelligence(examId);
        const analyzedSubmissions = intelligence.kpis?.analyzedSubmissions || 0;
        if (analyzedSubmissions < MIN_ANALYZED_SUBMISSIONS) {
            throw new common_1.BadRequestException('Not enough submission data to generate an AI quality review. At least one completed submission is required.');
        }
        const questionStats = (intelligence.questionMetrics || []).map((q) => ({
            questionId: q.questionId,
            questionVersionId: q.questionVersionId,
            questionText: q.questionText,
            totalAttempts: q.correctCount + q.incorrectCount + q.skippedCount,
            correctRate: Math.max(0, 100 - q.incorrectRate - q.skipRate),
            incorrectRate: q.incorrectRate,
            skipRate: q.skipRate,
            avgTimeSeconds: q.avgTimeSeconds,
            difficultyIndex: q.difficultyIndex,
            discriminationIndex: q.discriminationIndex,
        }));
        const record = await this.aiJobsService.createJob({
            task: 'exam-quality-review',
            examId,
            section: question_draft_dto_1.AISection.QUALITY_REVIEW,
            payload: {
                examId,
                examSummary: {
                    totalSubmissions: intelligence.kpis?.totalSubmissions || 0,
                    avgScorePct: intelligence.kpis?.avgScorePct ?? null,
                    passRate: intelligence.kpis?.passRate ?? null,
                    completionRate: intelligence.kpis?.completionRate ?? null,
                },
                questionStats,
                language: 'vi',
            },
            requestedBy: user.id,
        });
        return { jobId: record.id, status: record.status };
    }
    async getJob(examId, jobId, user) {
        await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        const job = await this.prisma.aIGenerationRecord.findFirst({
            where: { id: jobId, examId },
            include: {
                qualityReviewItems: {
                    include: {
                        question: { select: { id: true, content: true, type: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!job) {
            throw new common_1.NotFoundException('Quality review job not found');
        }
        return job;
    }
    async listSuggestions(examId, user, status) {
        await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        const exam = await this.prisma.exam.findUnique({ where: { id: examId }, select: { id: true } });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES'];
        const normalizedStatus = status && validStatuses.includes(status.toUpperCase())
            ? status.toUpperCase()
            : undefined;
        return this.prisma.examQualityReviewItem.findMany({
            where: {
                job: { examId },
                ...(normalizedStatus ? { reviewStatus: normalizedStatus } : {}),
            },
            include: {
                question: { select: { id: true, content: true, type: true } },
                job: { select: { id: true, createdAt: true, output: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async reviewSuggestion(itemId, dto, user) {
        const item = await this.prisma.examQualityReviewItem.findUnique({
            where: { id: itemId },
            select: { id: true, job: { select: { examId: true } } },
        });
        if (!item) {
            throw new common_1.NotFoundException('Suggestion not found');
        }
        if (item.job?.examId) {
            await this.accessPolicy.assertInstructorCanAccessExam(item.job.examId, user);
        }
        return this.prisma.examQualityReviewItem.update({
            where: { id: itemId },
            data: {
                reviewStatus: dto.decision,
                reviewedBy: user.id,
                reviewedAt: new Date(),
                reviewNotes: dto.notes ?? null,
            },
        });
    }
};
exports.ExamQualityReviewService = ExamQualityReviewService;
exports.ExamQualityReviewService = ExamQualityReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        submissions_service_1.SubmissionsService,
        ai_jobs_service_1.AiJobsService,
        access_policy_service_1.AccessPolicyService])
], ExamQualityReviewService);
//# sourceMappingURL=exam-quality-review.service.js.map