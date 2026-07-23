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
exports.AiJobsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const queue_service_1 = require("../queue/queue.service");
const AI_SECTIONS = [
    'CONTENT',
    'ANSWERS',
    'EXPLANATION',
    'CLASSIFICATION',
    'QUALITY_REVIEW',
    'RISK_ASSESSMENT',
];
let AiJobsService = class AiJobsService {
    constructor(prisma, queueService) {
        this.prisma = prisma;
        this.queueService = queueService;
    }
    normalizeSection(section) {
        const normalized = String(section || '').trim().toUpperCase();
        return AI_SECTIONS.includes(normalized)
            ? normalized
            : 'CONTENT';
    }
    async createJob(params) {
        const provider = process.env.AI_PROVIDER || 'google';
        const ollamaModel = process.env.AI_OLLAMA_MODEL || 'gemma3:4b';
        const googleModel = process.env.AI_MODEL || 'gemini-2.0-flash';
        const nvidiaModel = process.env.AI_NVIDIA_MODEL || 'z-ai/glm-5.2';
        const openRouterModel = process.env.AI_OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';
        const model = provider === 'ollama'
            ? ollamaModel
            : provider === 'nvidia'
                ? nvidiaModel
                : provider === 'openrouter'
                    ? openRouterModel
                    : params.task === 'single-question' || params.task === 'exam-questions' || params.task === 'exam-quality-review' || params.task === 'exam-risk-assessment' || params.task === 'question-improvement'
                        ? googleModel
                        : ollamaModel;
        const section = this.normalizeSection(params.section);
        const record = await this.prisma.aIGenerationRecord.create({
            data: {
                draftId: params.draftId ?? null,
                questionVersionId: params.questionVersionId ?? null,
                examId: params.examId ?? null,
                submissionId: params.submissionId ?? null,
                section,
                status: 'QUEUED',
                reviewStatus: 'PENDING',
                provider,
                model,
                prompt: {
                    task: params.task,
                    payload: params.payload,
                    requestedBy: params.requestedBy ?? null,
                    context: params.payload?.context ?? {},
                },
            },
        });
        await this.queueService.enqueueAiGeneration({
            jobId: record.id,
            task: params.task,
            draftId: params.draftId ?? null,
            questionVersionId: params.questionVersionId ?? null,
            examId: params.examId ?? null,
            submissionId: params.submissionId ?? null,
            section,
            payload: params.payload,
        });
        return record;
    }
};
exports.AiJobsService = AiJobsService;
exports.AiJobsService = AiJobsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_service_1.QueueService])
], AiJobsService);
//# sourceMappingURL=ai-jobs.service.js.map