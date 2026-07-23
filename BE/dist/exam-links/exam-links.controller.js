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
exports.ExamLinksController = void 0;
const common_1 = require("@nestjs/common");
const exam_links_service_1 = require("./exam-links.service");
const exam_link_dto_1 = require("./dto/exam-link.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let ExamLinksController = class ExamLinksController {
    constructor(examLinksService) {
        this.examLinksService = examLinksService;
    }
    generateLink(examId, dto, req) {
        return this.examLinksService.generateLink(examId, dto, req.user.id, req.user.role);
    }
    listExamLinks(examId, req) {
        return this.examLinksService.listByExam(examId, req.user.id, req.user.role);
    }
    validateToken(token) {
        return this.examLinksService.validateToken(token);
    }
    joinByToken(token, dto, req) {
        const userId = req?.user?.id;
        const ip = req?.ip || req?.headers?.['x-forwarded-for'] || undefined;
        const userAgent = req?.headers?.['user-agent'] || undefined;
        return this.examLinksService.joinByToken(token, dto, {
            userId,
            ip: Array.isArray(ip) ? ip[0] : ip,
            userAgent,
        });
    }
    updateLink(id, dto, req) {
        return this.examLinksService.updateLink(id, dto, req.user.id, req.user.role);
    }
    getUsage(id, req) {
        return this.examLinksService.usageByLink(id, req.user.id, req.user.role);
    }
};
exports.ExamLinksController = ExamLinksController;
__decorate([
    (0, common_1.Post)('exams/:id/generate-link'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_link_dto_1.GenerateExamLinkDto, Object]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "generateLink", null);
__decorate([
    (0, common_1.Get)('exams/:id/links'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "listExamLinks", null);
__decorate([
    (0, common_1.Get)('exam-links/validate/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "validateToken", null);
__decorate([
    (0, common_1.Post)('exam-links/:token/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_link_dto_1.JoinExamLinkDto, Object]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "joinByToken", null);
__decorate([
    (0, common_1.Patch)('exam-links/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, exam_link_dto_1.UpdateExamLinkDto, Object]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "updateLink", null);
__decorate([
    (0, common_1.Get)('exam-links/:id/usage'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamLinksController.prototype, "getUsage", null);
exports.ExamLinksController = ExamLinksController = __decorate([
    (0, swagger_1.ApiTags)('Exam Links'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [exam_links_service_1.ExamLinksService])
], ExamLinksController);
//# sourceMappingURL=exam-links.controller.js.map