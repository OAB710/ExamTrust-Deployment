"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const queue_service_1 = require("./queue.service");
const integrity_logs_processor_1 = require("./processors/integrity-logs.processor");
const notifications_processor_1 = require("./processors/notifications.processor");
const grading_processor_1 = require("./processors/grading.processor");
const events_processor_1 = require("./processors/events.processor");
const ai_generation_processor_1 = require("./processors/ai-generation.processor");
const prisma_module_1 = require("../prisma/prisma.module");
const notifications_module_1 = require("../notifications/notifications.module");
const events_module_1 = require("../events/events.module");
const ai_module_1 = require("../ai/ai.module");
let QueueModule = class QueueModule {
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
            bull_1.BullModule.registerQueue({ name: 'integrity-logs' }, { name: 'notifications' }, { name: 'grading' }, { name: 'events' }, { name: 'ai-generation' }),
            prisma_module_1.PrismaModule,
            notifications_module_1.NotificationsModule,
            (0, common_1.forwardRef)(() => ai_module_1.AiModule),
            events_module_1.EventsModule,
        ],
        providers: [
            queue_service_1.QueueService,
            integrity_logs_processor_1.IntegrityLogsProcessor,
            notifications_processor_1.NotificationsProcessor,
            grading_processor_1.GradingProcessor,
            events_processor_1.EventsProcessor,
            ai_generation_processor_1.AIGenerationProcessor,
        ],
        exports: [queue_service_1.QueueService],
    })
], QueueModule);
//# sourceMappingURL=queue.module.js.map