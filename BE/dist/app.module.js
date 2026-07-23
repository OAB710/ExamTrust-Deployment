"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const courses_module_1 = require("./courses/courses.module");
const enrollments_module_1 = require("./enrollments/enrollments.module");
const exams_module_1 = require("./exams/exams.module");
const submissions_module_1 = require("./submissions/submissions.module");
const ai_module_1 = require("./ai/ai.module");
const exam_links_module_1 = require("./exam-links/exam-links.module");
const mailer_module_1 = require("./mailer/mailer.module");
const notifications_module_1 = require("./notifications/notifications.module");
const questions_v2_contracts_module_1 = require("./questions-v2/questions-v2-contracts.module");
const redis_module_1 = require("./redis/redis.module");
const queue_module_1 = require("./queue/queue.module");
const cache_module_1 = require("./cache/cache.module");
const events_module_1 = require("./events/events.module");
const audit_module_1 = require("./audit/audit.module");
const lecturer_dashboard_module_1 = require("./lecturer-dashboard/lecturer-dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../.env'],
            }),
            prisma_module_1.PrismaModule,
            redis_module_1.SharedRedisModule,
            queue_module_1.QueueModule,
            cache_module_1.CacheModule,
            events_module_1.EventsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            courses_module_1.CoursesModule,
            enrollments_module_1.EnrollmentsModule,
            exams_module_1.ExamsModule,
            mailer_module_1.MailerModule,
            submissions_module_1.SubmissionsModule,
            ai_module_1.AiModule,
            exam_links_module_1.ExamLinksModule,
            notifications_module_1.NotificationsModule,
            questions_v2_contracts_module_1.QuestionsContractsModule,
            audit_module_1.AuditModule,
            lecturer_dashboard_module_1.LecturerDashboardModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map