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
exports.UpdateSubmissionStatusDto = exports.GradeAnswerDto = exports.AddLogsDto = exports.AutosaveExamDto = exports.AutosaveAnswerDto = exports.SubmitExamDto = exports.SubmitAnswerDto = exports.StartExamDto = void 0;
const class_validator_1 = require("class-validator");
class StartExamDto {
}
exports.StartExamDto = StartExamDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartExamDto.prototype, "examId", void 0);
class SubmitAnswerDto {
}
exports.SubmitAnswerDto = SubmitAnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SubmitAnswerDto.prototype, "answer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], SubmitAnswerDto.prototype, "timeTaken", void 0);
class SubmitExamDto {
}
exports.SubmitExamDto = SubmitExamDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitExamDto.prototype, "answers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], SubmitExamDto.prototype, "logs", void 0);
class AutosaveAnswerDto {
}
exports.AutosaveAnswerDto = AutosaveAnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AutosaveAnswerDto.prototype, "questionId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], AutosaveAnswerDto.prototype, "sequence", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AutosaveAnswerDto.prototype, "answer", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], AutosaveAnswerDto.prototype, "timeTaken", void 0);
class AutosaveExamDto {
}
exports.AutosaveExamDto = AutosaveExamDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AutosaveExamDto.prototype, "clientBatchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], AutosaveExamDto.prototype, "baseSubmissionVersion", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], AutosaveExamDto.prototype, "answers", void 0);
class AddLogsDto {
}
exports.AddLogsDto = AddLogsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], AddLogsDto.prototype, "logs", void 0);
class GradeAnswerDto {
}
exports.GradeAnswerDto = GradeAnswerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GradeAnswerDto.prototype, "submissionAnswerId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], GradeAnswerDto.prototype, "pointsAwarded", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GradeAnswerDto.prototype, "feedback", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GradeAnswerDto.prototype, "reason", void 0);
class UpdateSubmissionStatusDto {
}
exports.UpdateSubmissionStatusDto = UpdateSubmissionStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['IN_PROGRESS', 'SUBMITTED', 'GRADED', 'FLAGGED']),
    __metadata("design:type", String)
], UpdateSubmissionStatusDto.prototype, "status", void 0);
//# sourceMappingURL=submission.dto.js.map