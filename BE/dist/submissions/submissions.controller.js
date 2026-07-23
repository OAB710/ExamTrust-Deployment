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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsController = void 0;
const common_1 = require("@nestjs/common");
const submissions_service_1 = require("./submissions.service");
const exam_risk_assessment_service_1 = require("./exam-risk-assessment.service");
const submission_dto_1 = require("./dto/submission.dto");
const risk_assessment_dto_1 = require("./dto/risk-assessment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const rate_limit_decorator_1 = require("../common/rate-limit.decorator");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const submissions_events_service_1 = require("./submissions-events.service");
const access_policy_service_1 = require("../common/services/access-policy.service");
const jwt = require("jsonwebtoken");
const swagger_1 = require("@nestjs/swagger");
let SubmissionsController = class SubmissionsController {
    constructor(submissionsService, submissionsEvents, riskAssessmentService, accessPolicy) {
        this.submissionsService = submissionsService;
        this.submissionsEvents = submissionsEvents;
        this.riskAssessmentService = riskAssessmentService;
        this.accessPolicy = accessPolicy;
    }
    async streamExamEvents(examId, token) {
        if (!token) {
            throw new common_1.UnauthorizedException('Missing access token');
        }
        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET || 'examtrust-secret-key-2024');
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
        const role = String(payload?.role || '').toUpperCase();
        if (!['LECTURER', 'ADMIN'].includes(role)) {
            throw new common_1.ForbiddenException('Only lecturers/admin can monitor realtime events');
        }
        await this.accessPolicy.assertInstructorCanAccessExam(examId, {
            id: String(payload?.sub || payload?.id || ''),
            role,
        });
        return this.submissionsEvents.streamExam(examId);
    }
    startExam(startExamDto, req) {
        const forwardedFor = req?.headers?.['x-forwarded-for'];
        const remoteIp = req?.socket?.remoteAddress || req?.ip;
        const userAgent = req?.headers?.['user-agent'] || undefined;
        return this.submissionsService.startExam(startExamDto, req.user.id, { remoteIp, forwardedFor, userAgent });
    }
    submitExam(id, submitExamDto, idempotencyKey, req) {
        return this.submissionsService.submitExam(id, submitExamDto, req.user.id, { idempotencyKey });
    }
    autosaveAnswers(id, autosaveExamDto, req) {
        return this.submissionsService.autosaveAnswers(id, autosaveExamDto, req.user.id);
    }
    addLogs(id, addLogsDto, req) {
        return this.submissionsService.addLogs(id, addLogsDto.logs || [], req.user.id);
    }
    getIntegrityCases(page, limit, search, confidence, examTitle, submittedFrom, submittedTo, timeAnomaly, status) {
        return this.submissionsService.getIntegrityCases({
            page,
            limit,
            search,
            confidence,
            examTitle,
            submittedFrom,
            submittedTo,
            timeAnomaly,
            status,
        });
    }
    getSubmissionTimeline(id, req) {
        return this.submissionsService.getSubmissionTimeline(id, req.user);
    }
    findAll(page, limit) {
        const pagination = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        };
        return this.submissionsService.findAll(pagination);
    }
    findByExam(examId, page, limit, req) {
        const pagination = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        };
        return this.submissionsService.findByExam(examId, pagination, req.user);
    }
    getExamOverview(examId, req) {
        return this.submissionsService.getExamOverview(examId, req.user);
    }
    getExamIntelligence(examId, req) {
        return this.submissionsService.getExamIntelligence(examId, req.user);
    }
    requestRiskAssessment(id, req) {
        return this.riskAssessmentService.requestAssessment(id, req.user);
    }
    getRiskAssessmentJob(id, jobId, req) {
        return this.riskAssessmentService.getJob(id, jobId, req.user);
    }
    listRiskFlags(examId, status, req) {
        return this.riskAssessmentService.listFlags(examId, req.user, status);
    }
    reviewRiskFlag(flagId, dto, req) {
        return this.riskAssessmentService.reviewFlag(flagId, dto, req.user);
    }
    getManualGradingStatus(examId, req) {
        return this.submissionsService.getManualGradingStatus(examId, req.user);
    }
    publishExamResults(examId, req) {
        return this.submissionsService.publishExamResults(examId, req.user);
    }
    async exportExamResults(examId, req, res) {
        const csv = await this.submissionsService.exportExamResults(examId, req.user);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="exam-${examId}-results.csv"`);
        return res.send(csv);
    }
    getMySubmissions(req) {
        return this.submissionsService.findByStudent(req.user.id);
    }
    getMyExamSubmission(examId, req) {
        return this.submissionsService.getStudentSubmission(examId, req.user.id).then((submission) => {
            if (!submission)
                return submission;
            const sanitized = { ...submission };
            if (sanitized.proctoring) {
                sanitized.proctoring = {
                    tabSwitchCount: sanitized.proctoring.tabSwitchCount ?? 0,
                    mouseAnomalies: sanitized.proctoring.mouseAnomalies ?? 0,
                    logsCount: Array.isArray(sanitized.proctoring.logs) ? sanitized.proctoring.logs.length : 0,
                };
            }
            return sanitized;
        });
    }
    getMySubmissionById(id, req) {
        return this.submissionsService.getMySubmissionById(id, req.user.id).then((submission) => {
            if (!submission)
                return submission;
            const sanitized = { ...submission };
            if (sanitized.proctoring) {
                sanitized.proctoring = {
                    tabSwitchCount: sanitized.proctoring.tabSwitchCount ?? 0,
                    mouseAnomalies: sanitized.proctoring.mouseAnomalies ?? 0,
                    logsCount: Array.isArray(sanitized.proctoring.logs) ? sanitized.proctoring.logs.length : 0,
                };
            }
            return sanitized;
        });
    }
    async getStudentSubmissionForInstructor(examId, studentId, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(examId, req.user);
        return this.submissionsService.getStudentSubmission(examId, studentId);
    }
    getManualGradingSubmission(id, req) {
        return this.submissionsService.getManualGradingSubmission(id, req.user);
    }
    findOne(id, req) {
        return this.submissionsService.findOne(id, req.user);
    }
    gradeAnswer(gradeDto, req) {
        return this.submissionsService.gradeAnswer(gradeDto, req.user);
    }
    finalizeGrading(id, req) {
        return this.submissionsService.finalizeGrading(id, req.user);
    }
    updateStatus(id, updateDto, req) {
        return this.submissionsService.updateStatus(id, updateDto, req.user);
    }
};
exports.SubmissionsController = SubmissionsController;
__decorate([
    (0, common_1.Sse)('exam/:examId/events'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "streamExamEvents", null);
__decorate([
    (0, common_1.Post)('start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_decorator_1.RateLimit)('start'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_dto_1.StartExamDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "startExam", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_decorator_1.RateLimit)('submit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('idempotency-key')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submission_dto_1.SubmitExamDto, Object, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "submitExam", null);
__decorate([
    (0, common_1.Post)(':id/autosave'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_decorator_1.RateLimit)('autosave'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submission_dto_1.AutosaveExamDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "autosaveAnswers", null);
__decorate([
    (0, common_1.Post)(':id/logs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseGuards)(rate_limit_guard_1.RateLimitGuard),
    (0, rate_limit_decorator_1.RateLimit)('integrity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submission_dto_1.AddLogsDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "addLogs", null);
__decorate([
    (0, common_1.Get)('integrity/cases'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('confidence')),
    __param(4, (0, common_1.Query)('examTitle')),
    __param(5, (0, common_1.Query)('submittedFrom')),
    __param(6, (0, common_1.Query)('submittedTo')),
    __param(7, (0, common_1.Query)('timeAnomaly')),
    __param(8, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getIntegrityCases", null);
__decorate([
    (0, common_1.Get)(':id/timeline'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getSubmissionTimeline", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('exam/:examId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findByExam", null);
__decorate([
    (0, common_1.Get)('exam/:examId/overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getExamOverview", null);
__decorate([
    (0, common_1.Get)('exam/:examId/intelligence'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getExamIntelligence", null);
__decorate([
    (0, common_1.Post)(':id/risk-assessment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "requestRiskAssessment", null);
__decorate([
    (0, common_1.Get)(':id/risk-assessment/jobs/:jobId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getRiskAssessmentJob", null);
__decorate([
    (0, common_1.Get)('exam/:examId/risk-flags'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "listRiskFlags", null);
__decorate([
    (0, common_1.Patch)('risk-flags/:flagId/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('flagId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, risk_assessment_dto_1.ReviewAnomalyFlagDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "reviewRiskFlag", null);
__decorate([
    (0, common_1.Get)('exam/:examId/manual-grading-status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getManualGradingStatus", null);
__decorate([
    (0, common_1.Post)('exam/:examId/publish-results'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "publishExamResults", null);
__decorate([
    (0, common_1.Get)('exam/:examId/export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "exportExamResults", null);
__decorate([
    (0, common_1.Get)('my-submissions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getMySubmissions", null);
__decorate([
    (0, common_1.Get)('exam/:examId/my-submission'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getMyExamSubmission", null);
__decorate([
    (0, common_1.Get)('my-submissions/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getMySubmissionById", null);
__decorate([
    (0, common_1.Get)('exam/:examId/student/:studentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], SubmissionsController.prototype, "getStudentSubmissionForInstructor", null);
__decorate([
    (0, common_1.Get)(':id/manual-grading'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "getManualGradingSubmission", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('grade-answer'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [submission_dto_1.GradeAnswerDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "gradeAnswer", null);
__decorate([
    (0, common_1.Post)(':id/finalize-grading'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "finalizeGrading", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submission_dto_1.UpdateSubmissionStatusDto, Object]),
    __metadata("design:returntype", void 0)
], SubmissionsController.prototype, "updateStatus", null);
exports.SubmissionsController = SubmissionsController = __decorate([
    (0, swagger_1.ApiTags)('Submissions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('submissions'),
    __metadata("design:paramtypes", [submissions_service_1.SubmissionsService,
        submissions_events_service_1.SubmissionsEventsService,
        exam_risk_assessment_service_1.ExamRiskAssessmentService,
        access_policy_service_1.AccessPolicyService])
], SubmissionsController);
//# sourceMappingURL=submissions.controller.js.map