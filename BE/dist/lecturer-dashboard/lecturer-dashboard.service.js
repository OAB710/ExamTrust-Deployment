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
exports.LecturerDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LecturerDashboardService = class LecturerDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAttention(lecturerId) {
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
        const [suspiciousReports, pendingAiQuestions, draftExams, firstDraftExam, upcomingExams] = await Promise.all([
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
                href: draftExams === 1 && firstDraftExam
                    ? `/lecturer/exam/${firstDraftExam.id}/preview`
                    : '/lecturer/exams?status=DRAFT',
            },
            upcomingExams: {
                count: upcomingExams,
                href: '/lecturer/exams?timeRange=next24Hours',
            },
        };
    }
};
exports.LecturerDashboardService = LecturerDashboardService;
exports.LecturerDashboardService = LecturerDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LecturerDashboardService);
//# sourceMappingURL=lecturer-dashboard.service.js.map