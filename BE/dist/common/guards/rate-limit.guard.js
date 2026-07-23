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
exports.RateLimitGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const rate_limit_decorator_1 = require("../rate-limit.decorator");
const rate_limiter_service_1 = require("../rate-limiter.service");
const POLICIES = {
    start: {
        perUser: { capacity: 1, refillPerSecond: 1 / 30 },
        perIp: { capacity: 10, refillPerSecond: 10 / 60 },
        perExam: { capacity: 200, refillPerSecond: 200 },
    },
    autosave: {
        perUser: { capacity: 10, refillPerSecond: 0.5 },
        perIp: { capacity: 50, refillPerSecond: 1 },
        perExam: { capacity: 1000, refillPerSecond: 1000 },
    },
    submit: {
        perUser: { capacity: 1, refillPerSecond: 1 / 60 },
        perIp: { capacity: 20, refillPerSecond: 20 / 60 },
        perExam: { capacity: 200, refillPerSecond: 200 },
    },
    integrity: {
        perUser: { capacity: 200, refillPerSecond: 10 },
        perIp: { capacity: 2000, refillPerSecond: 100 },
        perExam: { capacity: 5000, refillPerSecond: 500 },
    },
};
let RateLimitGuard = class RateLimitGuard {
    constructor(reflector, limiter) {
        this.reflector = reflector;
        this.limiter = limiter;
    }
    ipFromRequest(req) {
        const xf = req.headers?.['x-forwarded-for'];
        if (xf && typeof xf === 'string')
            return xf.split(',')[0].trim();
        return req.ip || req.connection?.remoteAddress || 'unknown';
    }
    async canActivate(context) {
        const policyName = this.reflector.get(rate_limit_decorator_1.RATE_LIMIT_KEY, context.getHandler());
        if (!policyName)
            return true;
        const policy = POLICIES[policyName];
        if (!policy)
            return true;
        const req = context.switchToHttp().getRequest();
        const userId = req.user?.id || 'anon';
        const ip = this.ipFromRequest(req);
        const examId = req.params?.examId || req.params?.id || req.body?.examId || req.body?.submission?.examId || null;
        if (policy.perUser) {
            const key = `rl:user:${userId}:${policyName}`;
            const r = await this.limiter.consume(key, policy.perUser.capacity, policy.perUser.refillPerSecond, 1);
            if (!r.allowed)
                throw new common_1.HttpException(`Rate limit: ${policyName} per-user. retryAfter=${r.retryAfter}ms`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (policy.perIp) {
            const key = `rl:ip:${ip}:${policyName}`;
            const r = await this.limiter.consume(key, policy.perIp.capacity, policy.perIp.refillPerSecond, 1);
            if (!r.allowed)
                throw new common_1.HttpException(`Rate limit: ${policyName} per-ip. retryAfter=${r.retryAfter}ms`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        if (policy.perExam && examId) {
            const key = `rl:exam:${examId}:${policyName}`;
            const r = await this.limiter.consume(key, policy.perExam.capacity, policy.perExam.refillPerSecond, 1);
            if (!r.allowed)
                throw new common_1.HttpException(`Rate limit: ${policyName} per-exam. retryAfter=${r.retryAfter}ms`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        return true;
    }
};
exports.RateLimitGuard = RateLimitGuard;
exports.RateLimitGuard = RateLimitGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector, rate_limiter_service_1.RateLimiterService])
], RateLimitGuard);
//# sourceMappingURL=rate-limit.guard.js.map