"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsModule = void 0;
const common_1 = require("@nestjs/common");
const submissions_service_1 = require("./submissions.service");
const submissions_controller_1 = require("./submissions.controller");
const submissions_events_service_1 = require("./submissions-events.service");
const exam_risk_assessment_service_1 = require("./exam-risk-assessment.service");
const notifications_module_1 = require("../notifications/notifications.module");
const queue_module_1 = require("../queue/queue.module");
const ai_module_1 = require("../ai/ai.module");
const access_policy_service_1 = require("../common/services/access-policy.service");
const rate_limiter_service_1 = require("../common/rate-limiter.service");
const rate_limit_guard_1 = require("../common/guards/rate-limit.guard");
let SubmissionsModule = class SubmissionsModule {
};
exports.SubmissionsModule = SubmissionsModule;
exports.SubmissionsModule = SubmissionsModule = __decorate([
    (0, common_1.Module)({
        imports: [notifications_module_1.NotificationsModule, queue_module_1.QueueModule, ai_module_1.AiModule],
        controllers: [submissions_controller_1.SubmissionsController],
        providers: [submissions_service_1.SubmissionsService, submissions_events_service_1.SubmissionsEventsService, access_policy_service_1.AccessPolicyService, rate_limiter_service_1.RateLimiterService, rate_limit_guard_1.RateLimitGuard, exam_risk_assessment_service_1.ExamRiskAssessmentService],
        exports: [submissions_service_1.SubmissionsService],
    })
], SubmissionsModule);
//# sourceMappingURL=submissions.module.js.map