import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
declare const PrismaClient: any;
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
export {};
