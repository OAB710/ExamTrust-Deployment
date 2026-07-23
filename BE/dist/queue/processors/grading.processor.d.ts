import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class GradingProcessor {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processGrading(job: Job<any>): Promise<void>;
}
