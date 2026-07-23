"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiWorkerModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const ai_service_1 = require("./ai/ai.service");
const ai_generation_processor_1 = require("./queue/processors/ai-generation.processor");
let AiWorkerModule = class AiWorkerModule {
};
exports.AiWorkerModule = AiWorkerModule;
exports.AiWorkerModule = AiWorkerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env', '../.env'],
            }),
            prisma_module_1.PrismaModule,
            bull_1.BullModule.forRoot({
                redis: {
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    password: process.env.REDIS_PASSWORD,
                },
            }),
            bull_1.BullModule.registerQueue({ name: 'ai-generation' }),
        ],
        providers: [ai_service_1.AiService, ai_generation_processor_1.AIGenerationProcessor],
    })
], AiWorkerModule);
//# sourceMappingURL=ai-worker.module.js.map