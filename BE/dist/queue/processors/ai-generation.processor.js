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
var AIGenerationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIGenerationProcessor = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const ai_service_1 = require("../../ai/ai.service");
const question_draft_dto_1 = require("../../questions-v2/dto/question-draft.dto");
let AIGenerationProcessor = AIGenerationProcessor_1 = class AIGenerationProcessor {
    constructor(prisma, aiService) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.logger = new common_1.Logger(AIGenerationProcessor_1.name);
    }
    normalizeDifficulty(input) {
        const value = Number(input);
        if (Number.isNaN(value))
            return 0.5;
        if (value > 1) {
            return Math.max(0, Math.min(1, (value - 1) / 4));
        }
        return Math.max(0, Math.min(1, value));
    }
    parseJson(value, fallback) {
        if (value === null || typeof value === 'undefined')
            return fallback;
        if (typeof value === 'object')
            return value;
        try {
            return JSON.parse(String(value));
        }
        catch {
            return fallback;
        }
    }
    buildDraftPrompt(section, state, instruction) {
        const questionType = String(state?.intent?.questionType || state?.content?.type || 'MULTIPLE_CHOICE').toUpperCase();
        const content = String(state?.content?.content || state?.content?.stem || '').trim();
        const head = [
            `Question type: ${questionType}`,
            content ? `Current stem: ${content}` : 'Current stem: not provided',
            instruction ? `Additional instruction: ${instruction}` : '',
        ]
            .filter(Boolean)
            .join('\n');
        if (section === question_draft_dto_1.AISection.CONTENT) {
            return `${head}\nGenerate a better question stem.`;
        }
        if (section === question_draft_dto_1.AISection.ANSWERS) {
            return `${head}\nGenerate answer options and correct answer.`;
        }
        if (section === question_draft_dto_1.AISection.EXPLANATION) {
            return `${head}\nGenerate explanation for the correct answer.`;
        }
        return `${head}\nSuggest classification metadata: topic and learning objective.`;
    }
    async buildContext(task, payload) {
        const baseContext = {
            ...this.parseJson(payload.context, {}),
        };
        const courseId = String(payload.courseId || baseContext.courseId || '').trim() || null;
        const questionVersionId = String(payload.questionVersionId || baseContext.questionVersionId || '').trim() || null;
        const draftId = String(payload.draftId || baseContext.draftId || '').trim() || null;
        const examId = String(payload.examId || baseContext.examId || '').trim() || null;
        if (courseId) {
            const course = await this.prisma.course.findUnique({
                where: { id: courseId },
                select: { id: true, code: true, name: true },
            });
            if (course) {
                baseContext.courseId = course.id;
                baseContext.courseCode = course.code;
                baseContext.courseName = course.name;
            }
        }
        if (questionVersionId) {
            const version = await this.prisma.questionVersion.findUnique({
                where: { id: questionVersionId },
                select: {
                    id: true,
                    versionNo: true,
                    questionId: true,
                    stem: true,
                    difficulty: true,
                    points: true,
                    question: {
                        select: {
                            id: true,
                            type: true,
                            courseId: true,
                            course: {
                                select: { id: true, code: true, name: true },
                            },
                        },
                    },
                },
            });
            if (version) {
                baseContext.questionVersionId = version.id;
                baseContext.questionVersionNo = version.versionNo;
                baseContext.questionId = version.questionId;
                baseContext.currentStem = version.stem || baseContext.currentStem;
                baseContext.questionType = version.question?.type || baseContext.questionType;
                if (version.question?.course) {
                    baseContext.courseId = version.question.course.id;
                    baseContext.courseCode = version.question.course.code;
                    baseContext.courseName = version.question.course.name;
                }
            }
        }
        if (draftId) {
            const draft = await this.prisma.questionDraft.findUnique({
                where: { id: draftId },
                select: {
                    id: true,
                    questionId: true,
                    mode: true,
                    currentStep: true,
                    state: true,
                    question: {
                        select: {
                            id: true,
                            type: true,
                            courseId: true,
                            course: {
                                select: { id: true, code: true, name: true },
                            },
                        },
                    },
                },
            });
            if (draft) {
                baseContext.draftId = draft.id;
                baseContext.draftMode = draft.mode;
                baseContext.draftStep = draft.currentStep;
                if (draft.questionId) {
                    baseContext.questionId = draft.questionId;
                }
                if (draft.question?.type) {
                    baseContext.questionType = draft.question.type;
                }
                if (draft.question?.course) {
                    baseContext.courseId = draft.question.course.id;
                    baseContext.courseCode = draft.question.course.code;
                    baseContext.courseName = draft.question.course.name;
                }
                const state = this.parseJson(draft.state, {});
                const currentStem = String(state?.content?.content || state?.content?.stem || '').trim();
                if (currentStem) {
                    baseContext.currentStem = currentStem;
                }
            }
        }
        if (examId) {
            const exam = await this.prisma.exam.findUnique({
                where: { id: examId },
                select: {
                    id: true,
                    title: true,
                    mode: true,
                    status: true,
                    course: {
                        select: { id: true, code: true, name: true },
                    },
                },
            });
            if (exam) {
                baseContext.examId = exam.id;
                baseContext.examTitle = exam.title;
                baseContext.examMode = String(exam.mode);
                baseContext.examStatus = exam.status;
                if (exam.course) {
                    baseContext.courseId = exam.course.id;
                    baseContext.courseCode = exam.course.code;
                    baseContext.courseName = exam.course.name;
                }
            }
        }
        if (typeof payload.questionType !== 'undefined') {
            baseContext.questionType = String(payload.questionType);
        }
        if (typeof payload.questionCount !== 'undefined') {
            baseContext.questionCount = Number(payload.questionCount);
        }
        if (typeof payload.difficulty !== 'undefined') {
            baseContext.difficulty = this.normalizeDifficulty(payload.difficulty);
        }
        if (typeof payload.attemptNo !== 'undefined') {
            baseContext.attemptNo = Number(payload.attemptNo);
        }
        if (typeof payload.topicName !== 'undefined') {
            baseContext.topicName = String(payload.topicName);
        }
        if (typeof payload.instruction !== 'undefined') {
            baseContext.instruction = String(payload.instruction);
        }
        if (Array.isArray(payload.existingTopics)) {
            baseContext.existingTopics = payload.existingTopics.map((topic) => String(topic || '').trim()).filter(Boolean);
        }
        if (payload.analytics) {
            baseContext.analytics = payload.analytics;
        }
        if (task === 'draft-section') {
            baseContext.extra = {
                ...(baseContext.extra || {}),
                section: payload.section || 'CONTENT',
            };
        }
        return baseContext;
    }
    async process(job) {
        const { jobId, task, payload } = job.data;
        const record = await this.prisma.aIGenerationRecord.findUnique({
            where: { id: jobId },
            select: { id: true, status: true },
        });
        if (!record) {
            this.logger.warn(`AI job record not found: ${jobId}`);
            return;
        }
        await this.prisma.aIGenerationRecord.update({
            where: { id: jobId },
            data: {
                status: 'RUNNING',
                errorMessage: null,
            },
        });
        try {
            const context = await this.buildContext(task, payload);
            if (task === 'single-question') {
                const result = await this.aiService.generateQuestion({
                    prompt: String(payload.prompt || ''),
                    questionType: payload.questionType,
                    difficulty: this.normalizeDifficulty(payload.difficulty),
                    language: payload.language,
                    courseName: payload.courseName,
                    useCase: payload.useCase,
                    context,
                });
                await this.prisma.aIGenerationRecord.update({
                    where: { id: jobId },
                    data: {
                        status: 'SUCCEEDED',
                        output: result,
                        completedAt: new Date(),
                    },
                });
                return;
            }
            if (task === 'exam-questions') {
                const questions = await this.aiService.generateExamQuestions({
                    prompt: String(payload.prompt || ''),
                    questionCount: Number(payload.questionCount || 1),
                    difficulty: this.normalizeDifficulty(payload.difficulty),
                    questionType: payload.questionType,
                    language: payload.language,
                    courseName: payload.courseName,
                    useCase: payload.useCase,
                    context,
                });
                await this.prisma.aIGenerationRecord.update({
                    where: { id: jobId },
                    data: {
                        status: 'SUCCEEDED',
                        output: { questions },
                        completedAt: new Date(),
                    },
                });
                return;
            }
            if (task === 'exam-quality-review') {
                const result = await this.aiService.generateExamQualityReview({
                    examTitle: context.examTitle,
                    courseName: context.courseName,
                    language: payload.language,
                    examSummary: payload.examSummary || { totalSubmissions: 0 },
                    questionStats: payload.questionStats || [],
                    context,
                });
                await this.prisma.$transaction([
                    this.prisma.aIGenerationRecord.update({
                        where: { id: jobId },
                        data: {
                            status: 'SUCCEEDED',
                            output: result,
                            completedAt: new Date(),
                        },
                    }),
                    ...result.suggestions.map((s) => {
                        const stat = (payload.questionStats || []).find((q) => q.questionId === s.questionId);
                        return this.prisma.examQualityReviewItem.create({
                            data: {
                                jobId,
                                questionId: s.questionId,
                                questionVersionId: stat?.questionVersionId ?? null,
                                severity: s.severity,
                                reasonSummary: s.reasonSummary,
                                recommendation: s.recommendation,
                                statsSnapshot: stat ?? {},
                            },
                        });
                    }),
                ]);
                return;
            }
            if (task === 'exam-risk-assessment') {
                const result = await this.aiService.assessExamIntegrityRisk({
                    examTitle: context.examTitle,
                    courseName: context.courseName,
                    language: payload.language,
                    submissionSummary: payload.submissionSummary || {},
                    signals: payload.signals || {
                        tabSwitchCount: 0,
                        mouseAnomalies: 0,
                        fullscreenExitCount: 0,
                        focusLossCount: 0,
                        pageHiddenCount: 0,
                        tooFastAnswerCount: 0,
                        totalAnswers: 0,
                        totalIntegrityEvents: 0,
                        eventBreakdown: {},
                    },
                    context,
                });
                await this.prisma.aIGenerationRecord.update({
                    where: { id: jobId },
                    data: {
                        status: 'SUCCEEDED',
                        output: result,
                        completedAt: new Date(),
                    },
                });
                const examInstanceId = payload.examInstanceId || null;
                if (examInstanceId) {
                    await this.prisma.anomalyFlag.create({
                        data: {
                            examInstanceId,
                            jobId,
                            kind: 'AI_RISK_ASSESSMENT',
                            score: result.riskScore,
                            status: 'OPEN',
                        },
                    });
                }
                return;
            }
            if (task === 'question-improvement') {
                const result = await this.aiService.generateQuestionImprovement({
                    language: payload.language,
                    context: {
                        ...context,
                        ...(payload.context || {}),
                    },
                    original: payload.original || {},
                    analytics: payload.analytics || {},
                    qualitySignals: payload.qualitySignals || [],
                });
                await this.prisma.aIGenerationRecord.update({
                    where: { id: jobId },
                    data: {
                        status: 'SUCCEEDED',
                        output: {
                            ...result,
                            draft: result.suggestion,
                        },
                        completedAt: new Date(),
                    },
                });
                return;
            }
            const section = String(payload.section || 'CONTENT').toUpperCase();
            const prompt = this.buildDraftPrompt(section, payload.draftState || {}, payload.instruction);
            const result = await this.aiService.generateQuestion({
                prompt,
                questionType: String(payload.draftState?.intent?.questionType || 'MULTIPLE_CHOICE'),
                difficulty: this.normalizeDifficulty(payload.constraints?.difficulty ?? 0.5),
                language: payload.constraints?.language || 'en',
                useCase: 'question_bank',
                context,
            });
            const candidates = [];
            if (section === question_draft_dto_1.AISection.CONTENT) {
                candidates.push({ id: 'cand-1', content: result.content });
            }
            else if (section === question_draft_dto_1.AISection.ANSWERS) {
                candidates.push({ id: 'cand-1', options: result.options || {}, correctAnswer: result.correctAnswer || {} });
            }
            else if (section === question_draft_dto_1.AISection.EXPLANATION) {
                candidates.push({ id: 'cand-1', explanation: result.explanation || '' });
            }
            else {
                candidates.push({
                    id: 'cand-1',
                    topic: result.topic || '',
                    learningObjective: result.learningObjective || '',
                    difficulty: result.difficulty,
                });
            }
            await this.prisma.aIGenerationRecord.update({
                where: { id: jobId },
                data: {
                    status: 'SUCCEEDED',
                    output: { candidates },
                    completedAt: new Date(),
                },
            });
        }
        catch (error) {
            this.logger.error(`AI job failed: ${jobId}`, error?.stack || String(error));
            await this.prisma.aIGenerationRecord.update({
                where: { id: jobId },
                data: {
                    status: 'FAILED',
                    errorMessage: String(error?.message || error),
                    completedAt: new Date(),
                },
            });
            throw error;
        }
    }
};
exports.AIGenerationProcessor = AIGenerationProcessor;
__decorate([
    (0, bull_1.Process)({ concurrency: 1 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIGenerationProcessor.prototype, "process", null);
exports.AIGenerationProcessor = AIGenerationProcessor = AIGenerationProcessor_1 = __decorate([
    (0, bull_1.Processor)('ai-generation'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AiService])
], AIGenerationProcessor);
//# sourceMappingURL=ai-generation.processor.js.map