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
var RateLimiterService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
let RateLimiterService = RateLimiterService_1 = class RateLimiterService {
    constructor(redisService) {
        this.redisService = redisService;
        this.logger = new common_1.Logger(RateLimiterService_1.name);
        this.tokenBucketScript = `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local rate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])
    local requested = tonumber(ARGV[4])

    local row = redis.call('HMGET', key, 'tokens', 'ts')
    local tokens = tonumber(row[1]) or capacity
    local ts = tonumber(row[2]) or now

    local delta = math.max(0, now - ts)
    local refill = (delta / 1000.0) * rate
    tokens = math.min(capacity, tokens + refill)

    local allowed = 0
    if tokens >= requested then
      allowed = 1
      tokens = tokens - requested
    end

    redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
    -- expire after 2x time to fully refill (fallback)
    local ttl = math.ceil(math.max(1000, (capacity / math.max(1, rate)) * 1000 * 2))
    redis.call('PEXPIRE', key, ttl)

    local remaining = math.floor(tokens)
    local retryAfter = 0
    if allowed == 0 then
      retryAfter = math.ceil(((requested - tokens) / rate) * 1000)
      if retryAfter < 0 then retryAfter = 0 end
    end
    return { allowed, remaining, retryAfter }
  `;
        this.redis = this.redisService.getOrThrow(nestjs_redis_1.DEFAULT_REDIS);
    }
    async consume(key, capacity, refillPerSecond, tokens = 1) {
        const now = Date.now();
        try {
            const res = await this.redis.eval(this.tokenBucketScript, 1, key, capacity, refillPerSecond, now, tokens);
            const allowed = Number(res[0]) === 1;
            const remaining = Number(res[1]);
            const retryAfter = Number(res[2]);
            return { allowed, remaining, retryAfter };
        }
        catch (err) {
            this.logger.error('RateLimiter eval failed: ' + String(err));
            return { allowed: true, remaining: 0, retryAfter: 0 };
        }
    }
};
exports.RateLimiterService = RateLimiterService;
exports.RateLimiterService = RateLimiterService = RateLimiterService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_redis_1.RedisService])
], RateLimiterService);
//# sourceMappingURL=rate-limiter.service.js.map