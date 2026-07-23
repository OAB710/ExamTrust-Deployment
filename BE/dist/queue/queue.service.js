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
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../prisma/prisma.service");
const distributed_events_service_1 = require("../events/distributed-events.service");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
let QueueService = QueueService_1 = class QueueService {
    constructor(integrityLogsQueue, notificationsQueue, gradingQueue, eventsQueue, aiGenerationQueue, prisma, events, redisService) {
        this.integrityLogsQueue = integrityLogsQueue;
        this.notificationsQueue = notificationsQueue;
        this.gradingQueue = gradingQueue;
        this.eventsQueue = eventsQueue;
        this.aiGenerationQueue = aiGenerationQueue;
        this.prisma = prisma;
        this.events = events;
        this.redisService = redisService;
        this.logger = new common_1.Logger(QueueService_1.name);
    }
    async enqueueIntegrityLogs(data) {
        await this.integrityLogsQueue.add(data, {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }
    async enqueueNotification(data) {
        await this.notificationsQueue.add(data, {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 2,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
    async enqueueGrading(data) {
        await this.gradingQueue.add(data, {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }
    async enqueueAiGeneration(data) {
        await this.aiGenerationQueue.add(data, {
            removeOnComplete: false,
            removeOnFail: false,
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
    }
    async publishEvent(opts) {
        const { kind, payload, critical = false, dedupId, channel, source } = opts;
        const event = {
            kind,
            payload,
            timestamp: new Date().toISOString(),
            source: source || process.env.HOSTNAME || 'api-instance',
        };
        try {
            const targetChannel = channel || `events:${kind}`;
            await this.events.emitEvent(targetChannel, event);
        }
        catch (err) {
            this.logger.error('Realtime publish failed: ' + String(err));
        }
        if (!critical)
            return;
        const record = await this.prisma.eventStore.create({
            data: {
                dedupId: dedupId || null,
                kind,
                payload,
                critical: true,
                source: source || process.env.HOSTNAME || 'api-instance',
            },
        });
        await this.eventsQueue.add({ eventId: record.id, event }, {
            attempts: 5,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
    async getQueueStats(queueName) {
        const queue = this.getQueue(queueName);
        if (!queue)
            return null;
        const counts = await queue.getJobCounts();
        return {
            queue: queueName,
            ...counts,
        };
    }
    async isQueueOverloaded(queueName, waitingThreshold) {
        try {
            const stats = await this.getQueueStats(queueName);
            if (!stats)
                return false;
            return (stats.waiting || 0) > waitingThreshold;
        }
        catch (err) {
            this.logger.error('Failed to get queue stats: ' + String(err));
            return false;
        }
    }
    getQueue(name) {
        switch (name) {
            case 'integrity-logs':
                return this.integrityLogsQueue;
            case 'notifications':
                return this.notificationsQueue;
            case 'grading':
                return this.gradingQueue;
            case 'events':
                return this.eventsQueue;
            case 'ai-generation':
                return this.aiGenerationQueue;
            default:
                return null;
        }
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('integrity-logs')),
    __param(1, (0, bull_1.InjectQueue)('notifications')),
    __param(2, (0, bull_1.InjectQueue)('grading')),
    __param(3, (0, bull_1.InjectQueue)('events')),
    __param(4, (0, bull_1.InjectQueue)('ai-generation')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object, prisma_service_1.PrismaService,
        distributed_events_service_1.DistributedEventsService,
        nestjs_redis_1.RedisService])
], QueueService);
//# sourceMappingURL=queue.service.js.map