import { PrismaService } from '../prisma/prisma.service';
import { AiJobsService } from '../ai/ai-jobs.service';
import { AIGenerateSectionDto, ApplyAICandidateDto, CreateQuestionDraftDto, DraftValidationLevel, PublishQuestionDraftDto, QuestionDraftStepKey, SaveDraftStepDto, ValidateQuestionDraftDto } from './dto/question-draft.dto';
import { ListQuestionsQueryDto } from './dto/question-v2-query.dto';
import { CreateQuestionCrudDto, UpdateQuestionCrudDto } from './dto/question-crud.dto';
interface AuthUser {
    id: string;
    role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}
export declare class QuestionsService {
    private readonly prisma;
    private readonly aiJobsService;
    private tableCache;
    private columnCache;
    constructor(prisma: PrismaService, aiJobsService: AiJobsService);
    private parseJson;
    private normalizeQuestionType;
    private hasTable;
    private hasColumn;
    private assertCourseAccessible;
    private assertCanAccessQuestion;
    private assertTopicBelongsToCourse;
    private syncSingleQuestionTopic;
    createQuestion(dto: CreateQuestionCrudDto, user: AuthUser): Promise<any>;
    findQuestionById(id: string, user: AuthUser): Promise<any>;
    updateQuestion(id: string, dto: UpdateQuestionCrudDto, user: AuthUser): Promise<any>;
    deleteQuestion(id: string, user: AuthUser): Promise<{
        message: string;
    }>;
    getQuestionStats(user: AuthUser): Promise<{
        total: any;
        byType: any;
        byDifficulty: any;
    }>;
    private assertV2Ready;
    private nextStep;
    private computeCompletion;
    private fetchDraftOrThrow;
    createDraft(dto: CreateQuestionDraftDto, user: AuthUser): Promise<{
        draftId: `${string}-${string}-${string}-${string}-${string}`;
        questionId: string | null;
        currentStep: QuestionDraftStepKey;
        autosaveVersion: number;
        state: Record<string, any>;
    }>;
    saveStep(draftId: string, stepKey: QuestionDraftStepKey, dto: SaveDraftStepDto, user: AuthUser): Promise<{
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
    private buildAIPrompt;
    aiGenerateSection(draftId: string, dto: AIGenerateSectionDto, user: AuthUser): Promise<{
        jobId: any;
        status: any;
    }>;
    applyAICandidate(draftId: string, dto: ApplyAICandidateDto, user: AuthUser): Promise<{
        draftId: string;
        autosaveVersion: number;
        state: any;
    }>;
    validateDraft(draftId: string, dto: ValidateQuestionDraftDto, user: AuthUser): Promise<{
        valid: boolean;
        level: DraftValidationLevel;
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
    private normalizeDifficultyRaw;
    getQuestionHistory(params: {
        courseId?: string;
    }, user: AuthUser): Promise<{
        data: any;
        stats: {
            totalQuestions: any;
            withAttempts: any;
            degrading: any;
            aiGenerated: any;
        };
        updatedAt: string;
    }>;
    listTopics(params?: {
        search?: string;
        page?: number;
        limit?: number;
        courseId?: string;
    }): Promise<{
        data: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createOrGetTopic(input: {
        code: string;
        name: string;
        courseId?: string;
    }, user: AuthUser): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
    }>;
    setCourseTopics(courseId: string, topicIds: string[]): Promise<{
        courseId: string;
        topicIds: string[];
        count: number;
    }>;
    private fetchFilteredQuestionIds;
    publishDraft(draftId: string, dto: PublishQuestionDraftDto, user: AuthUser): Promise<{
        questionId: string | null;
        versionId: `${string}-${string}-${string}-${string}-${string}`;
        versionNo: number;
        status: string;
    }>;
    listQuestions(query: ListQuestionsQueryDto, user: AuthUser): Promise<{
        data: any;
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getJobStatus(jobId: string, user: AuthUser): Promise<{
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
export {};
