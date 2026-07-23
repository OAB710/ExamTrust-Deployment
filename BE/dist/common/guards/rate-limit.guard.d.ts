import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../rate-limiter.service';
export declare class RateLimitGuard implements CanActivate {
    private reflector;
    private limiter;
    constructor(reflector: Reflector, limiter: RateLimiterService);
    private ipFromRequest;
    canActivate(context: ExecutionContext): Promise<boolean>;
}
