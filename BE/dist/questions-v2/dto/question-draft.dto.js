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
exports.PublishQuestionDraftDto = exports.ValidateQuestionDraftDto = exports.ApplyAICandidateDto = exports.AIGenerateSectionDto = exports.AIGenerationConstraintsDto = exports.SaveDraftStepDto = exports.CreateQuestionDraftDto = exports.DraftPublishMode = exports.DraftValidationLevel = exports.AISection = exports.QuestionDraftStepKey = exports.QuestionDraftMode = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var QuestionDraftMode;
(function (QuestionDraftMode) {
    QuestionDraftMode["MANUAL"] = "MANUAL";
    QuestionDraftMode["AI_ASSISTED"] = "AI_ASSISTED";
    QuestionDraftMode["DUPLICATE"] = "DUPLICATE";
})(QuestionDraftMode || (exports.QuestionDraftMode = QuestionDraftMode = {}));
var QuestionDraftStepKey;
(function (QuestionDraftStepKey) {
    QuestionDraftStepKey["INTENT"] = "intent";
    QuestionDraftStepKey["CONTENT"] = "content";
    QuestionDraftStepKey["ANSWERS"] = "answers";
    QuestionDraftStepKey["CLASSIFICATION"] = "classification";
    QuestionDraftStepKey["REVIEW"] = "review";
})(QuestionDraftStepKey || (exports.QuestionDraftStepKey = QuestionDraftStepKey = {}));
var AISection;
(function (AISection) {
    AISection["CONTENT"] = "CONTENT";
    AISection["ANSWERS"] = "ANSWERS";
    AISection["EXPLANATION"] = "EXPLANATION";
    AISection["CLASSIFICATION"] = "CLASSIFICATION";
    AISection["QUALITY_REVIEW"] = "QUALITY_REVIEW";
    AISection["RISK_ASSESSMENT"] = "RISK_ASSESSMENT";
})(AISection || (exports.AISection = AISection = {}));
var DraftValidationLevel;
(function (DraftValidationLevel) {
    DraftValidationLevel["SOFT"] = "SOFT";
    DraftValidationLevel["STRICT"] = "STRICT";
})(DraftValidationLevel || (exports.DraftValidationLevel = DraftValidationLevel = {}));
var DraftPublishMode;
(function (DraftPublishMode) {
    DraftPublishMode["IN_REVIEW"] = "IN_REVIEW";
    DraftPublishMode["PUBLISHED"] = "PUBLISHED";
})(DraftPublishMode || (exports.DraftPublishMode = DraftPublishMode = {}));
class CreateQuestionDraftDto {
}
exports.CreateQuestionDraftDto = CreateQuestionDraftDto;
__decorate([
    (0, class_validator_1.IsEnum)(QuestionDraftMode),
    __metadata("design:type", String)
], CreateQuestionDraftDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDraftDto.prototype, "questionType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQuestionDraftDto.prototype, "sourceQuestionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateQuestionDraftDto.prototype, "initialContext", void 0);
class SaveDraftStepDto {
}
exports.SaveDraftStepDto = SaveDraftStepDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], SaveDraftStepDto.prototype, "autosaveVersion", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SaveDraftStepDto.prototype, "data", void 0);
class AIGenerationConstraintsDto {
}
exports.AIGenerationConstraintsDto = AIGenerationConstraintsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(10),
    __metadata("design:type", Number)
], AIGenerationConstraintsDto.prototype, "difficulty", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIGenerationConstraintsDto.prototype, "language", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2),
    (0, class_validator_1.Max)(8),
    __metadata("design:type", Number)
], AIGenerationConstraintsDto.prototype, "optionCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(10),
    (0, class_validator_1.Max)(4000),
    __metadata("design:type", Number)
], AIGenerationConstraintsDto.prototype, "maxLength", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AIGenerationConstraintsDto.prototype, "forbiddenTerms", void 0);
class AIGenerateSectionDto {
}
exports.AIGenerateSectionDto = AIGenerateSectionDto;
__decorate([
    (0, class_validator_1.IsEnum)(AISection),
    __metadata("design:type", String)
], AIGenerateSectionDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AIGenerateSectionDto.prototype, "instruction", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => AIGenerationConstraintsDto),
    __metadata("design:type", AIGenerationConstraintsDto)
], AIGenerateSectionDto.prototype, "constraints", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(3),
    __metadata("design:type", Number)
], AIGenerateSectionDto.prototype, "variants", void 0);
class ApplyAICandidateDto {
}
exports.ApplyAICandidateDto = ApplyAICandidateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAICandidateDto.prototype, "jobId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApplyAICandidateDto.prototype, "candidateId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(AISection),
    __metadata("design:type", String)
], ApplyAICandidateDto.prototype, "section", void 0);
class ValidateQuestionDraftDto {
}
exports.ValidateQuestionDraftDto = ValidateQuestionDraftDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DraftValidationLevel),
    __metadata("design:type", String)
], ValidateQuestionDraftDto.prototype, "level", void 0);
class PublishQuestionDraftDto {
}
exports.PublishQuestionDraftDto = PublishQuestionDraftDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PublishQuestionDraftDto.prototype, "expectedAutosaveVersion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(DraftPublishMode),
    __metadata("design:type", String)
], PublishQuestionDraftDto.prototype, "publishMode", void 0);
//# sourceMappingURL=question-draft.dto.js.map