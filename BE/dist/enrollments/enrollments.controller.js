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
exports.EnrollmentsController = void 0;
const common_1 = require("@nestjs/common");
const enrollments_service_1 = require("./enrollments.service");
const enrollment_dto_1 = require("./dto/enrollment.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let EnrollmentsController = class EnrollmentsController {
    constructor(enrollmentsService) {
        this.enrollmentsService = enrollmentsService;
    }
    create(createEnrollmentDto, req) {
        return this.enrollmentsService.create(createEnrollmentDto, req.user);
    }
    bulkEnroll(bulkEnrollmentDto, req) {
        return this.enrollmentsService.bulkEnroll(bulkEnrollmentDto, req.user);
    }
    bulkEnrollByEmails(dto, req) {
        return this.enrollmentsService.bulkEnrollByEmails(dto, req.user);
    }
    bulkImport(dto, req) {
        return this.enrollmentsService.bulkImport(dto, req.user);
    }
    searchTrainingSystemStudents(query, courseId) {
        return this.enrollmentsService.searchTrainingSystemStudents(query, courseId);
    }
    findByCourse(courseId, req) {
        return this.enrollmentsService.findByCourse(courseId, req.user);
    }
    findByStudent(studentId, req) {
        if (req.user.role === 'STUDENT' && req.user.id !== studentId) {
            return [];
        }
        return this.enrollmentsService.findByStudent(studentId);
    }
    getMyEnrollments(req) {
        return this.enrollmentsService.findByStudent(req.user.id);
    }
    updateStatus(id, updateStatusDto, req) {
        return this.enrollmentsService.updateStatus(id, updateStatusDto, req.user);
    }
    remove(id, req) {
        return this.enrollmentsService.remove(id, req.user);
    }
    removeByStudentAndCourse(courseId, studentId, req) {
        return this.enrollmentsService.removeByStudentAndCourse(studentId, courseId, req.user);
    }
};
exports.EnrollmentsController = EnrollmentsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [enrollment_dto_1.CreateEnrollmentDto, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [enrollment_dto_1.BulkEnrollmentDto, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "bulkEnroll", null);
__decorate([
    (0, common_1.Post)('bulk-by-emails'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [enrollment_dto_1.BulkEnrollByEmailsDto, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "bulkEnrollByEmails", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [enrollment_dto_1.BulkImportStudentsDto, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "bulkImport", null);
__decorate([
    (0, common_1.Get)('training-system/students'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "searchTrainingSystemStudents", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "findByCourse", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Get)('my-enrollments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "getMyEnrollments", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, enrollment_dto_1.UpdateEnrollmentStatusDto, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('course/:courseId/student/:studentId'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], EnrollmentsController.prototype, "removeByStudentAndCourse", null);
exports.EnrollmentsController = EnrollmentsController = __decorate([
    (0, swagger_1.ApiTags)('Enrollments'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('enrollments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [enrollments_service_1.EnrollmentsService])
], EnrollmentsController);
//# sourceMappingURL=enrollments.controller.js.map