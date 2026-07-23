import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class IntegrityLogsProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processIntegrityLogs(job: Job<any>): Promise<void>;
}
