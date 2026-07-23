import { AIGenerateSectionDto, ApplyAICandidateDto, CreateQuestionDraftDto, PublishQuestionDraftDto, QuestionDraftStepKey, SaveDraftStepDto, ValidateQuestionDraftDto } from './dto/question-draft.dto';
import { CreateQuestionCrudDto, UpdateQuestionCrudDto } from './dto/question-crud.dto';
import { ListQuestionsQueryDto } from './dto/question-v2-query.dto';
import { QuestionsService } from './questions-v2.service';
export declare class QuestionDraftsController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    createQuestion(dto: CreateQuestionCrudDto, req: any): Promise<any>;
    createDraft(dto: CreateQuestionDraftDto, req: any): Promise<{
        draftId: `${string}-${string}-${string}-${string}-${string}`;
        questionId: string | null;
        currentStep: QuestionDraftStepKey;
        autosaveVersion: number;
        state: Record<string, any>;
    }>;
    saveStep(draftId: string, stepKey: QuestionDraftStepKey, dto: SaveDraftStepDto, req: any): Promise<{
        draftId: string;
        autosaveVersion: number;
        completion: {
            intent: boolean;
            content: boolean;
            answers: boolean;
            classification: boolean;
            review: boolean;
        };
        currentStep: QuestionDraftStepKey;
        state: any;
    }>;
    aiGenerateSection(draftId: string, dto: AIGenerateSectionDto, req: any): Promise<{
        jobId: any;
        status: any;
    }>;
    applyAICandidate(draftId: string, dto: ApplyAICandidateDto, req: any): Promise<{
        draftId: string;
        autosaveVersion: number;
        state: any;
    }>;
    validateDraft(draftId: string, dto: ValidateQuestionDraftDto, req: any): Promise<{
        valid: boolean;
        level: import("./dto/question-draft.dto").DraftValidationLevel;
        errors: {
            code: string;
            path: string;
            message: string;
        }[];
        warnings: {
            code: string;
            path: string;
            message: string;
        }[];
        qualityScore: number;
        validatedAt: string;
    }>;
    publishDraft(draftId: string, dto: PublishQuestionDraftDto, req: any): Promise<{
        questionId: string | null;
        versionId: `${string}-${string}-${string}-${string}-${string}`;
        versionNo: number;
        status: string;
    }>;
    listQuestions(query: ListQuestionsQueryDto, req: any): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getQuestionStats(req: any): Promise<{
        total: any;
        byType: any;
        byDifficulty: any;
    }>;
    getQuestionHistory(courseId: string | undefined, req: any): Promise<{
        data: any;
        stats: {
            totalQuestions: any;
            withAttempts: any;
            degrading: any;
            aiGenerated: any;
        };
        updatedAt: string;
    }>;
    findQuestionById(id: string, req: any): Promise<any>;
    updateQuestion(id: string, dto: UpdateQuestionCrudDto, req: any): Promise<any>;
    deleteQuestion(id: string, req: any): Promise<{
        message: string;
    }>;
}
