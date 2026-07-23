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
exports.QuestionDraftsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const question_draft_dto_1 = require("./dto/question-draft.dto");
const question_ai_improvement_dto_1 = require("./dto/question-ai-improvement.dto");
const question_crud_dto_1 = require("./dto/question-crud.dto");
const question_v2_query_dto_1 = require("./dto/question-v2-query.dto");
const swagger_1 = require("@nestjs/swagger");
const questions_v2_service_1 = require("./questions-v2.service");
let QuestionDraftsController = class QuestionDraftsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    createQuestion(dto, req) {
        return this.questionsService.createQuestion(dto, req.user);
    }
    createDraft(dto, req) {
        return this.questionsService.createDraft(dto, req.user);
    }
    saveStep(draftId, stepKey, dto, req) {
        return this.questionsService.saveStep(draftId, stepKey, dto, req.user);
    }
    aiGenerateSection(draftId, dto, req) {
        return this.questionsService.aiGenerateSection(draftId, dto, req.user);
    }
    applyAICandidate(draftId, dto, req) {
        return this.questionsService.applyAICandidate(draftId, dto, req.user);
    }
    validateDraft(draftId, dto, req) {
        return this.questionsService.validateDraft(draftId, dto, req.user);
    }
    publishDraft(draftId, dto, req) {
        return this.questionsService.publishDraft(draftId, dto, req.user);
    }
    listQuestions(query, req) {
        return this.questionsService.listQuestions(query, req.user);
    }
    getQuestionStats(req) {
        return this.questionsService.getQuestionStats(req.user);
    }
    getQuestionHistory(courseId, req) {
        return this.questionsService.getQuestionHistory({ courseId }, req.user);
    }
    createQuestionAiImprovement(dto, req) {
        return this.questionsService.createQuestionAiImprovement(dto, req.user);
    }
    getQuestionAiImprovement(id, req) {
        return this.questionsService.getQuestionAiImprovement(id, req.user);
    }
    updateQuestionAiImprovementDraft(id, dto, req) {
        return this.questionsService.updateQuestionAiImprovementDraft(id, dto, req.user);
    }
    approveQuestionAiImprovement(id, dto, req) {
        return this.questionsService.approveQuestionAiImprovement(id, dto, req.user);
    }
    rejectQuestionAiImprovement(id, dto, req) {
        return this.questionsService.rejectQuestionAiImprovement(id, dto, req.user);
    }
    findQuestionById(id, req) {
        return this.questionsService.findQuestionById(id, req.user);
    }
    updateQuestion(id, dto, req) {
        return this.questionsService.updateQuestion(id, dto, req.user);
    }
    deleteQuestion(id, req) {
        return this.questionsService.deleteQuestion(id, req.user);
    }
};
exports.QuestionDraftsController = QuestionDraftsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_crud_dto_1.CreateQuestionCrudDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Post)('drafts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_draft_dto_1.CreateQuestionDraftDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "createDraft", null);
__decorate([
    (0, common_1.Patch)('drafts/:draftId/steps/:stepKey'),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Param)('stepKey')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, question_draft_dto_1.SaveDraftStepDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "saveStep", null);
__decorate([
    (0, common_1.Post)('drafts/:draftId/ai-generate-section'),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_draft_dto_1.AIGenerateSectionDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "aiGenerateSection", null);
__decorate([
    (0, common_1.Post)('drafts/:draftId/ai-apply'),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_draft_dto_1.ApplyAICandidateDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "applyAICandidate", null);
__decorate([
    (0, common_1.Post)('drafts/:draftId/validate'),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_draft_dto_1.ValidateQuestionDraftDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "validateDraft", null);
__decorate([
    (0, common_1.Post)('drafts/:draftId/publish'),
    __param(0, (0, common_1.Param)('draftId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_draft_dto_1.PublishQuestionDraftDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "publishDraft", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_v2_query_dto_1.ListQuestionsQueryDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "listQuestions", null);
__decorate([
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "getQuestionStats", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Query)('courseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "getQuestionHistory", null);
__decorate([
    (0, common_1.Post)('ai-improvements'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [question_ai_improvement_dto_1.CreateQuestionAiImprovementDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "createQuestionAiImprovement", null);
__decorate([
    (0, common_1.Get)('ai-improvements/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "getQuestionAiImprovement", null);
__decorate([
    (0, common_1.Patch)('ai-improvements/:id/draft'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_ai_improvement_dto_1.UpdateQuestionAiImprovementDraftDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "updateQuestionAiImprovementDraft", null);
__decorate([
    (0, common_1.Post)('ai-improvements/:id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_ai_improvement_dto_1.ApproveQuestionAiImprovementDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "approveQuestionAiImprovement", null);
__decorate([
    (0, common_1.Post)('ai-improvements/:id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_ai_improvement_dto_1.RejectQuestionAiImprovementDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "rejectQuestionAiImprovement", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "findQuestionById", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, question_crud_dto_1.UpdateQuestionCrudDto, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], QuestionDraftsController.prototype, "deleteQuestion", null);
exports.QuestionDraftsController = QuestionDraftsController = __decorate([
    (0, swagger_1.ApiTags)('Questions'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('questions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __metadata("design:paramtypes", [questions_v2_service_1.QuestionsService])
], QuestionDraftsController);
//# sourceMappingURL=question-drafts.controller.js.map