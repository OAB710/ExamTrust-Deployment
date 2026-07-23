import { QuestionsService } from './questions-v2.service';
export declare class AIGenerationJobsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    getJobStatus(jobId: string, req: any): Promise<{
        jobId: any;
        draftId: any;
        section: any;
        status: any;
        reviewStatus: any;
        provider: any;
        model: any;
        output: any;
        safetyFlags: any;
        errorMessage: any;
        createdAt: any;
        completedAt: any;
    }>;
}
