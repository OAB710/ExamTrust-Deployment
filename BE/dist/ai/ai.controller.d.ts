import { GenerateQuestionDto, GenerateExamQuestionsDto, SuggestSimilarTopicsDto } from './dto/generate-question.dto';
import { AiJobsService } from './ai-jobs.service';
import { AiService } from './ai.service';
import { AccessPolicyService } from '../common/services/access-policy.service';
export declare class AiController {
    private readonly aiJobsService;
    private readonly aiService;
    private readonly accessPolicy;
    constructor(aiJobsService: AiJobsService, aiService: AiService, accessPolicy: AccessPolicyService);
    private assertCourseContext;
    generateQuestion(dto: GenerateQuestionDto, req: any): Promise<{
        jobId: any;
        status: any;
    }>;
    generateExamQuestions(dto: GenerateExamQuestionsDto, req: any): Promise<{
        jobId: any;
        status: any;
    }>;
    suggestSimilarTopics(dto: SuggestSimilarTopicsDto, req: any): Promise<{
        matches: any;
    }>;
}
