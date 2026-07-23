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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service");
const exam_quality_review_service_1 = require("./exam-quality-review.service");
const access_policy_service_1 = require("../common/services/access-policy.service");
const mailer_service_1 = require("../mailer/mailer.service");
const enrollments_service_1 = require("../enrollments/enrollments.service");
const exam_dto_1 = require("./dto/exam.dto");
const exam_quality_review_dto_1 = require("./dto/exam-quality-review.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let ExamsController = class ExamsController {
    constructor(examsService, qualityReviewService, mailerService, enrollmentsService, accessPolicy) {
        this.examsService = examsService;
        this.qualityReviewService = qualityReviewService;
        this.mailerService = mailerService;
        this.enrollmentsService = enrollmentsService;
        this.accessPolicy = accessPolicy;
    }
    async shareExam(id, body, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        let emails = (body?.emails && Array.isArray(body.emails)) ? body.emails : (body?.email ? [body.email] : []);
        const sendToCourse = !!body?.sendToCourse;
        const exam = await this.examsService.findOne(id);
        const frontend = process.env.FRONTEND_URL || process.env.APP_BASE_URL || 'http://localhost:3000';
        const link = `${frontend}/student/exam-ready?examId=${id}`;
        const subject = `Invitation to exam: ${exam?.title || 'Exam'}`;
        const html = `<p>You have been invited to join the exam <strong>${exam?.title || 'Exam'}</strong>.</p>
      <p>Click to join: <a href="${link}">${link}</a></p>`;
        if (sendToCourse) {
            const courseId = exam?.course?.id || exam?.courseId;
            if (courseId) {
                const enrollments = await this.enrollmentsService.findByCourse(courseId, req.user);
                const studentEmails = (enrollments || [])
                    .map((enr) => enr?.student?.email)
                    .filter((e) => !!e);
                emails = Array.from(new Set([...(emails || []), ...studentEmails]));
            }
        }
        if (!emails || emails.length === 0) {
            return { success: false, message: 'No recipient provided' };
        }
        await this.mailerService.sendExamLink(emails, subject, html);
        return { success: true };
    }
    async create(createExamDto, req) {
        const created = await this.examsService.create(createExamDto, req.user.id, req.user.role);
        return created;
    }
    findAll(req, courseId, status, page, limit) {
        if (req.user.role === 'STUDENT') {
            if (courseId) {
                return this.examsService.getCourseExamsForStudent(req.user.id, courseId);
            }
            return this.examsService.getAvailableExamsForStudent(req.user.id);
        }
        const filters = {};
        if (req.user.role === 'LECTURER') {
            filters.creatorId = req.user.id;
        }
        if (courseId)
            filters.courseId = courseId;
        if (status)
            filters.status = status;
        const pagination = {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 20,
        };
        return this.examsService.findAll(filters, pagination);
    }
    getAvailableExams(req) {
        return this.examsService.getAvailableExamsForStudent(req.user.id);
    }
    async findOne(id, req) {
        if (req.user.role === 'STUDENT') {
            const clientIp = this.accessPolicy.resolveClientIp(req);
            return this.examsService.findForStudent(id, req.user.id, clientIp);
        }
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.findOne(id);
    }
    async getStats(id, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.getExamStats(id);
    }
    requestQualityReview(id, req) {
        return this.qualityReviewService.requestReview(id, req.user);
    }
    getQualityReviewJob(id, jobId, req) {
        return this.qualityReviewService.getJob(id, jobId, req.user);
    }
    listQualityReviewSuggestions(id, status, req) {
        return this.qualityReviewService.listSuggestions(id, req.user, status);
    }
    reviewQualitySuggestion(itemId, dto, req) {
        return this.qualityReviewService.reviewSuggestion(itemId, dto, req.user);
    }
    async update(id, updateExamDto, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.update(id, updateExamDto);
    }
    async reschedule(id, rescheduleExamDto, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.reschedule(id, rescheduleExamDto);
    }
    async publish(id, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.publishExam(id);
    }
    async addQuestions(id, addQuestionsDto, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.addQuestionsToExam(id, addQuestionsDto.questionIds);
    }
    async updateExamQuestion(id, questionId, updateDto, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.updateExamQuestion(id, questionId, updateDto);
    }
    async removeQuestion(id, questionId, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.removeQuestionFromExam(id, questionId);
    }
    async remove(id, req) {
        await this.accessPolicy.assertInstructorCanAccessExam(id, req.user);
        return this.examsService.remove(id);
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Post)(':id/share'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "shareExam", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [exam_dto_1.CreateExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('courseId')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('available'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getAvailableExams", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)(':id/quality-review'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "requestQualityReview", null);
__decorate([
    (0, common_1.Get)(':id/quality-review/jobs/:jobId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('jobId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "getQualityReviewJob", null);
__decorate([
    (0, common_1.Get)(':id/quality-review/suggestions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "listQualityReviewSuggestions", null);
__decorate([
    (0, common_1.Patch)(':id/quality-review/suggestions/:itemId/review'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('itemId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_quality_review_dto_1.ReviewQualitySuggestionDto, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "reviewQualitySuggestion", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_dto_1.UpdateExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/reschedule'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_dto_1.RescheduleExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "reschedule", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_dto_1.AddQuestionsToExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "addQuestions", null);
__decorate([
    (0, common_1.Patch)(':id/questions/:questionId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, exam_dto_1.UpdateExamQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "updateExamQuestion", null);
__decorate([
    (0, common_1.Delete)(':id/questions/:questionId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('questionId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "removeQuestion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "remove", null);
exports.ExamsController = ExamsController = __decorate([
    (0, swagger_1.ApiTags)('Exams'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exams_service_1.ExamsService,
        exam_quality_review_service_1.ExamQualityReviewService,
        mailer_service_1.MailerService,
        enrollments_service_1.EnrollmentsService,
        access_policy_service_1.AccessPolicyService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map