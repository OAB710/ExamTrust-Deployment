"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExamsModule = void 0;
const common_1 = require("@nestjs/common");
const exams_service_1 = require("./exams.service");
const exams_controller_1 = require("./exams.controller");
const exam_quality_review_service_1 = require("./exam-quality-review.service");
const mailer_module_1 = require("../mailer/mailer.module");
const enrollments_module_1 = require("../enrollments/enrollments.module");
const notifications_module_1 = require("../notifications/notifications.module");
const submissions_module_1 = require("../submissions/submissions.module");
const ai_module_1 = require("../ai/ai.module");
const access_policy_service_1 = require("../common/services/access-policy.service");
let ExamsModule = class ExamsModule {
};
exports.ExamsModule = ExamsModule;
exports.ExamsModule = ExamsModule = __decorate([
    (0, common_1.Module)({
        imports: [mailer_module_1.MailerModule, enrollments_module_1.EnrollmentsModule, notifications_module_1.NotificationsModule, submissions_module_1.SubmissionsModule, ai_module_1.AiModule],
        controllers: [exams_controller_1.ExamsController],
        providers: [exams_service_1.ExamsService, access_policy_service_1.AccessPolicyService, exam_quality_review_service_1.ExamQualityReviewService],
        exports: [exams_service_1.ExamsService, access_policy_service_1.AccessPolicyService],
    })
], ExamsModule);
//# sourceMappingURL=exams.module.js.map