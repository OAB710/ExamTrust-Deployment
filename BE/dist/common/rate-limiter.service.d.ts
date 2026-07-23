import { RedisService } from '@liaoliaots/nestjs-redis';
export declare class RateLimiterService {
    private readonly redisService;
    private readonly logger;
    private readonly redis;
    private tokenBucketScript;
    constructor(redisService: RedisService);
    consume(key: string, capacity: number, refillPerSecond: number, tokens?: number): Promise<{
        allowed: boolean;
        remaining: number;
        retryAfter: number;
    }>;
}
