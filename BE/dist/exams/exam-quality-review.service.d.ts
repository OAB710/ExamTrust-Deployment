import { PrismaService } from '../prisma/prisma.service';
import { SubmissionsService } from '../submissions/submissions.service';
import { AiJobsService } from '../ai/ai-jobs.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { ReviewQualitySuggestionDto } from './dto/exam-quality-review.dto';
interface RequestUser {
    id: string;
    role: string;
}
export declare class ExamQualityReviewService {
    private readonly prisma;
    private readonly submissionsService;
    private readonly aiJobsService;
    private readonly accessPolicy;
    constructor(prisma: PrismaService, submissionsService: SubmissionsService, aiJobsService: AiJobsService, accessPolicy: AccessPolicyService);
    requestReview(examId: string, user: RequestUser): Promise<{
        jobId: any;
        status: any;
    }>;
    getJob(examId: string, jobId: string, user: RequestUser): Promise<any>;
    listSuggestions(examId: string, user: RequestUser, status?: string): Promise<any>;
    reviewSuggestion(itemId: string, dto: ReviewQualitySuggestionDto, user: RequestUser): Promise<any>;
}
export {};
