import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class EventsProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processEvent(job: Job<any>): Promise<void>;
}
