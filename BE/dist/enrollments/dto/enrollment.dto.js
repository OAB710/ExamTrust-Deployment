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
exports.BulkImportStudentsDto = exports.BulkImportStudentRow = exports.UpdateEnrollmentStatusDto = exports.BulkEnrollByEmailsDto = exports.BulkEnrollmentDto = exports.CreateEnrollmentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateEnrollmentDto {
}
exports.CreateEnrollmentDto = CreateEnrollmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnrollmentDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateEnrollmentDto.prototype, "studentId", void 0);
class BulkEnrollmentDto {
}
exports.BulkEnrollmentDto = BulkEnrollmentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkEnrollmentDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkEnrollmentDto.prototype, "studentIds", void 0);
class BulkEnrollByEmailsDto {
}
exports.BulkEnrollByEmailsDto = BulkEnrollByEmailsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkEnrollByEmailsDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], BulkEnrollByEmailsDto.prototype, "emails", void 0);
class UpdateEnrollmentStatusDto {
}
exports.UpdateEnrollmentStatusDto = UpdateEnrollmentStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['ACTIVE', 'DROPPED', 'COMPLETED']),
    __metadata("design:type", String)
], UpdateEnrollmentStatusDto.prototype, "status", void 0);
class BulkImportStudentRow {
}
exports.BulkImportStudentRow = BulkImportStudentRow;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], BulkImportStudentRow.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkImportStudentRow.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkImportStudentRow.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkImportStudentRow.prototype, "className", void 0);
class BulkImportStudentsDto {
}
exports.BulkImportStudentsDto = BulkImportStudentsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BulkImportStudentsDto.prototype, "courseId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BulkImportStudentRow),
    __metadata("design:type", Array)
], BulkImportStudentsDto.prototype, "students", void 0);
//# sourceMappingURL=enrollment.dto.js.map