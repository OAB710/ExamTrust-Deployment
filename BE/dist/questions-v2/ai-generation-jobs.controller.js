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
exports.AIGenerationJobsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const questions_v2_service_1 = require("./questions-v2.service");
let AIGenerationJobsController = class AIGenerationJobsController {
    constructor(questionsService) {
        this.questionsService = questionsService;
    }
    getJobStatus(jobId, req) {
        return this.questionsService.getJobStatus(jobId, req.user);
    }
};
exports.AIGenerationJobsController = AIGenerationJobsController;
__decorate([
    (0, common_1.Get)(':jobId'),
    __param(0, (0, common_1.Param)('jobId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AIGenerationJobsController.prototype, "getJobStatus", null);
exports.AIGenerationJobsController = AIGenerationJobsController = __decorate([
    (0, swagger_1.ApiTags)('Questions AI Jobs'),
    (0, swagger_1.ApiBearerAuth)('access-token'),
    (0, common_1.Controller)('questions/ai-jobs'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('LECTURER', 'ADMIN'),
    __metadata("design:paramtypes", [questions_v2_service_1.QuestionsService])
], AIGenerationJobsController);
//# sourceMappingURL=ai-generation-jobs.controller.js.map