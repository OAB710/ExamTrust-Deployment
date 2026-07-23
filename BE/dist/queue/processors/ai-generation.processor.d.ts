import { Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
export declare class AIGenerationProcessor {
    private readonly prisma;
    private readonly aiService;
    private readonly logger;
    constructor(prisma: PrismaService, aiService: AiService);
    private normalizeDifficulty;
    private parseJson;
    private buildDraftPrompt;
    private buildContext;
    process(job: Job<any>): Promise<void>;
}
