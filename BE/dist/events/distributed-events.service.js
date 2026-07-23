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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DistributedEventsService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
const rxjs_1 = require("rxjs");
let DistributedEventsService = class DistributedEventsService {
    constructor(redisService) {
        this.redisService = redisService;
        this.eventSubjects = new Map();
        this.redis = this.redisService.getOrThrow(nestjs_redis_1.DEFAULT_REDIS);
        this.redisSubscriber = this.redis.duplicate();
        this.redisPub = this.redis.duplicate();
    }
    async emitEvent(channel, event) {
        await this.redisPub.publish(channel, JSON.stringify(event));
    }
    subscribeToChannel(channel) {
        return new rxjs_1.Observable((observer) => {
            this.redisSubscriber.subscribe(channel, (err) => {
                if (err) {
                    observer.error(err);
                    return;
                }
            });
            const messageHandler = (chan, message) => {
                if (chan === channel) {
                    try {
                        const event = JSON.parse(message);
                        observer.next(event);
                    }
                    catch (err) {
                        observer.error(err);
                    }
                }
            };
            this.redisSubscriber.on('message', messageHandler);
            return () => {
                this.redisSubscriber.unsubscribe(channel);
                this.redisSubscriber.off('message', messageHandler);
            };
        });
    }
    async emitExamEvent(examId, event) {
        const channel = `exam:${examId}:events`;
        await this.emitEvent(channel, {
            ...event,
            timestamp: new Date().toISOString(),
            source: process.env.HOSTNAME || 'api-instance',
        });
    }
    subscribeToExamEvents(examId) {
        const channel = `exam:${examId}:events`;
        return this.subscribeToChannel(channel);
    }
    async broadcastToRole(role, event) {
        const channel = `role:${role}:notifications`;
        await this.emitEvent(channel, event);
    }
    subscribeToRoleNotifications(role) {
        const channel = `role:${role}:notifications`;
        return this.subscribeToChannel(channel);
    }
    async disconnect() {
        await this.redisSubscriber.quit();
        await this.redisPub.quit();
    }
};
exports.DistributedEventsService = DistributedEventsService;
exports.DistributedEventsService = DistributedEventsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_redis_1.RedisService])
], DistributedEventsService);
//# sourceMappingURL=distributed-events.service.js.map