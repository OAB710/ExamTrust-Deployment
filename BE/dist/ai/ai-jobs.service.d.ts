import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AISection } from '../questions-v2/dto/question-draft.dto';
type AiTaskType = 'single-question' | 'exam-questions' | 'draft-section' | 'exam-quality-review' | 'exam-risk-assessment';
interface CreateAiJobParams {
    task: AiTaskType;
    draftId?: string | null;
    questionVersionId?: string | null;
    examId?: string | null;
    submissionId?: string | null;
    section?: AISection | null;
    payload: Record<string, any>;
    requestedBy?: string | null;
}
export declare class AiJobsService {
    private readonly prisma;
    private readonly queueService;
    constructor(prisma: PrismaService, queueService: QueueService);
    createJob(params: CreateAiJobParams): Promise<any>;
}
export {};
