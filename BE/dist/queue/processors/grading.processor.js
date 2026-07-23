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
var GradingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradingProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
let GradingProcessor = GradingProcessor_1 = class GradingProcessor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(GradingProcessor_1.name);
    }
    async processGrading(job) {
        const { submissionId, examId } = job.data;
        try {
            const submission = await this.prisma.examSubmission.findUnique({
                where: { id: submissionId },
                include: {
                    exam: {
                        select: {
                            examQuestions: {
                                include: {
                                    question: true,
                                },
                            },
                        },
                    },
                    answers: true,
                },
            });
            if (!submission) {
                this.logger.warn(`Submission not found: ${submissionId}`);
                return;
            }
            const autoGradedTypes = ['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE'];
            const hasManualGrading = submission.exam.examQuestions.some((eq) => !autoGradedTypes.includes(eq.question.type));
            if (!hasManualGrading) {
                await this.prisma.examSubmission.update({
                    where: { id: submissionId },
                    data: { status: 'GRADED', gradedAt: new Date() },
                });
                this.logger.log(`Auto-grading completed for submission ${submissionId}`);
            }
            else {
                this.logger.log(`Submission ${submissionId} awaiting manual grading`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to process grading: ${error?.message || String(error)}`, error?.stack);
            throw error;
        }
    }
};
exports.GradingProcessor = GradingProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GradingProcessor.prototype, "processGrading", null);
exports.GradingProcessor = GradingProcessor = GradingProcessor_1 = __decorate([
    (0, bull_1.Processor)('grading'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GradingProcessor);
//# sourceMappingURL=grading.processor.js.map