import { PrismaService } from '../prisma/prisma.service';
import { AiJobsService } from '../ai/ai-jobs.service';
import { ReviewAnomalyFlagDto } from './dto/risk-assessment.dto';
import { AccessPolicyService } from '../common/services/access-policy.service';
interface RequestUser {
    id: string;
    role: string;
}
export declare class ExamRiskAssessmentService {
    private readonly prisma;
    private readonly aiJobsService;
    private readonly accessPolicy;
    constructor(prisma: PrismaService, aiJobsService: AiJobsService, accessPolicy: AccessPolicyService);
    requestAssessment(submissionId: string, user: RequestUser): Promise<{
        jobId: any;
        status: any;
    }>;
    getJob(submissionId: string, jobId: string, user: RequestUser): Promise<any>;
    listFlags(examId: string, user: RequestUser, status?: string): Promise<any>;
    reviewFlag(flagId: string, dto: ReviewAnomalyFlagDto, user: RequestUser): Promise<any>;
}
export {};
