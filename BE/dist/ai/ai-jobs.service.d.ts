import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
declare const AI_SECTIONS: readonly ["CONTENT", "ANSWERS", "EXPLANATION", "CLASSIFICATION", "QUALITY_REVIEW", "RISK_ASSESSMENT"];
type AISectionValue = (typeof AI_SECTIONS)[number];
type AiTaskType = 'single-question' | 'exam-questions' | 'draft-section' | 'exam-quality-review' | 'exam-risk-assessment' | 'question-improvement';
interface CreateAiJobParams {
    task: AiTaskType;
    draftId?: string | null;
    questionVersionId?: string | null;
    examId?: string | null;
    submissionId?: string | null;
    section?: AISectionValue | string | null;
    payload: Record<string, any>;
    requestedBy?: string | null;
}
export declare class AiJobsService {
    private readonly prisma;
    private readonly queueService;
    constructor(prisma: PrismaService, queueService: QueueService);
    private normalizeSection;
    createJob(params: CreateAiJobParams): Promise<any>;
}
export {};
