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
var EventsProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
const common_1 = require("@nestjs/common");
let EventsProcessor = EventsProcessor_1 = class EventsProcessor {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(EventsProcessor_1.name);
    }
    async processEvent(job) {
        const { eventId, event } = job.data;
        try {
            if (eventId) {
                await this.prisma.eventStore.update({ where: { id: eventId }, data: { status: 'PROCESSING', attempts: { increment: 1 } } });
            }
            if (eventId) {
                await this.prisma.eventStore.update({ where: { id: eventId }, data: { status: 'PROCESSED', processedAt: new Date() } });
            }
            this.logger.log(`Processed durable event ${event?.kind || '[unknown]'}`);
        }
        catch (err) {
            this.logger.error(`Failed processing event: ${err?.message || err}`);
            if (eventId) {
                const record = await this.prisma.eventStore.findUnique({ where: { id: eventId } });
                const attempts = (record?.attempts || 0) + 1;
                const maxAttempts = 5;
                if (attempts >= maxAttempts) {
                    await this.prisma.eventStore.update({ where: { id: eventId }, data: { status: 'FAILED', lastError: String(err?.message || err) } });
                }
                else {
                    await this.prisma.eventStore.update({ where: { id: eventId }, data: { attempts, lastError: String(err?.message || err) } });
                }
            }
            throw err;
        }
    }
};
exports.EventsProcessor = EventsProcessor;
__decorate([
    (0, bull_1.Process)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventsProcessor.prototype, "processEvent", null);
exports.EventsProcessor = EventsProcessor = EventsProcessor_1 = __decorate([
    (0, bull_1.Processor)('events'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EventsProcessor);
//# sourceMappingURL=events.processor.js.map