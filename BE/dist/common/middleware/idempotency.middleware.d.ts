import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
export interface IdempotencyStore {
    get(key: string): Promise<any>;
    set(key: string, value: any, ttl: number): Promise<void>;
    has(key: string): Promise<boolean>;
}
export declare class IdempotencyMiddleware implements NestMiddleware {
    private store;
    use(req: Request, res: Response, next: NextFunction): void | Response<any, Record<string, any>>;
}
