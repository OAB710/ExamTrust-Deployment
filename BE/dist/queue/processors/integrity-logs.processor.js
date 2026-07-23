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
var IntegrityLogsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntegrityLogsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
let IntegrityLogsProcessor = IntegrityLogsProcessor_1 = class IntegrityLogsProcessor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(IntegrityLogsProcessor_1.name);
    }
    async processIntegrityLogs(job) {
        const { submissionId, proctoringId, logs } = job.data;
        try {
            if (logs && logs.length > 0) {
                await this.prisma.integrityLog.createMany({
                    data: logs.map((log) => ({
                        proctoringId,
                        eventType: log.eventType,
                        details: log.details,
                        timestamp: log.timestamp || new Date(),
                    })),
                });
            }
            this.logger.log(`Processed ${logs?.length || 0} integrity logs for submission ${submissionId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process integrity logs: ${error?.message || String(error)}`, error?.stack);
            throw error;
        }
    }
};
exports.IntegrityLogsProcessor = IntegrityLogsProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IntegrityLogsProcessor.prototype, "processIntegrityLogs", null);
exports.IntegrityLogsProcessor = IntegrityLogsProcessor = IntegrityLogsProcessor_1 = __decorate([
    (0, bull_1.Processor)('integrity-logs'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], IntegrityLogsProcessor);
//# sourceMappingURL=integrity-logs.processor.js.map