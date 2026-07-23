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
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const generate_question_dto_1 = require("./dto/generate-question.dto");
const ai_jobs_service_1 = require("./ai-jobs.service");
const ai_service_1 = require("./ai.service");
const question_draft_dto_1 = require("../questions-v2/dto/question-draft.dto");
const access_policy_service_1 = require("../common/services/access-policy.service");
let AiController = class AiController {
    constructor(aiJobsService, aiService, accessPolicy) {
        this.aiJobsService = aiJobsService;
        this.aiService = aiService;
        this.accessPolicy = accessPolicy;
    }
    async assertCourseContext(data, user) {
        const courseId = String(data?.courseId || data?.context?.courseId || '').trim();
        if (courseId) {
            await this.accessPolicy.assertInstructorCanAccessCourse(courseId, user);
        }
    }
    async generateQuestion(dto, req) {
        await this.assertCourseContext(dto, req.user);
        const job = await this.aiJobsService.createJob({
            task: 'single-question',
            section: question_draft_dto_1.AISection.CONTENT,
            payload: {
                prompt: dto.prompt,
                questionType: dto.questionType,
                difficulty: dto.difficulty,
                language: dto.language,
                courseName: dto.courseName,
                useCase: dto.useCase,
                context: dto.context || {},
            },
            requestedBy: req.user.id,
        });
        return { jobId: job.id, status: job.status };
    }
    async generateExamQuestions(dto, req) {
        await this.assertCourseContext(dto, req.user);
        const job = await this.aiJobsService.createJob({
            task: 'exam-questions',
            section: question_draft_dto_1.AISection.CONTENT,
            payload: {
                prompt: dto.prompt,
                questionCount: dto.questionCount,
                difficulty: dto.difficulty,
                questionType: dto.questionType,
                language: dto.language,
                courseName: dto.courseName,
                useCase: dto.useCase,
                context: dto.context || {},
            },
            requestedBy: req.user.id,
        });
        return { jobId: job.id, status: job.status };
    }
    async suggestSimilarTopics(dto, req) {
        await this.assertCourseContext(dto, req.user);
        return this.aiService.suggestSimilarTopics({
            topicName: dto.topicName,
            existingTopics: dto.existingTopics,
            language: dto.language,
            courseName: dto.courseName,
            context: dto.context || {},
        });
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('generate-question'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_question_dto_1.GenerateQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateQuestion", null);
__decorate([
    (0, common_1.Post)('generate-exam-questions'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_question_dto_1.GenerateExamQuestionsDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateExamQuestions", null);
__decorate([
    (0, common_1.Post)('suggest-similar-topics'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_question_dto_1.SuggestSimilarTopicsDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "suggestSimilarTopics", null);
exports.AiController = AiController = __decorate([
    (0, swagger_1.ApiTags)('AI'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __metadata("design:paramtypes", [ai_jobs_service_1.AiJobsService,
        ai_service_1.AiService,
        access_policy_service_1.AccessPolicyService])
], AiController);
//# sourceMappingURL=ai.controller.js.map