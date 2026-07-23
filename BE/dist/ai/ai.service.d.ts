import { ConfigService } from '@nestjs/config';
import { ExamTrustAiContext } from './ai-profile';
export declare class AiService {
    private configService;
    private readonly logger;
    private genAI;
    private nvidiaAI;
    private openRouterAI;
    private model;
    private provider;
    private localUrl;
    private ollamaUrl;
    private ollamaModel;
    private nvidiaModel;
    private openRouterModel;
    private appName;
    private defaultLanguage;
    private ollamaTemperature;
    private ollamaTopP;
    private ollamaRepeatPenalty;
    private ollamaNumCtx;
    constructor(configService: ConfigService);
    generateQuestion(params: {
        prompt: string;
        questionType?: string;
        difficulty?: number;
        language?: string;
        courseName?: string;
        useCase?: string;
        context?: ExamTrustAiContext;
    }): Promise<{
        content: any;
        type: any;
        explanation: any;
        difficulty: number;
        points: any;
        topic: any;
        learningObjective: any;
        options: any;
        correctAnswer: any;
    }>;
    generateExamQuestions(params: {
        prompt: string;
        questionCount: number;
        difficulty?: number;
        questionType?: string;
        language?: string;
        courseName?: string;
        useCase?: string;
        context?: ExamTrustAiContext;
    }): Promise<any>;
    generateExamQualityReview(params: {
        examTitle?: string;
        courseName?: string;
        language?: string;
        examSummary: {
            totalSubmissions: number;
            avgScorePct?: number | null;
            passRate?: number | null;
            completionRate?: number | null;
        };
        questionStats: Array<{
            questionId: string;
            questionVersionId?: string | null;
            questionText: string;
            totalAttempts: number;
            correctRate: number;
            incorrectRate: number;
            skipRate: number;
            avgTimeSeconds: number | null;
            difficultyIndex: number | null;
            discriminationIndex: number | null;
        }>;
        context?: ExamTrustAiContext;
    }): Promise<{
        overallSummary: string;
        suggestions: any;
    }>;
    assessExamIntegrityRisk(params: {
        examTitle?: string;
        courseName?: string;
        language?: string;
        submissionSummary: {
            attemptNo?: number;
            score?: number | null;
            durationMinutes?: number | null;
            timeSpentMinutes?: number | null;
        };
        signals: {
            tabSwitchCount: number;
            mouseAnomalies: number;
            fullscreenExitCount: number;
            focusLossCount: number;
            pageHiddenCount: number;
            tooFastAnswerCount: number;
            totalAnswers: number;
            totalIntegrityEvents: number;
            eventBreakdown: Record<string, number>;
        };
        context?: ExamTrustAiContext;
    }): Promise<{
        riskScore: number;
        riskLevel: "LOW" | "MEDIUM" | "HIGH";
        signals: any;
        explanation: string;
        recommendReview: boolean;
    }>;
    suggestSimilarTopics(params: {
        topicName: string;
        existingTopics: string[];
        language?: string;
        courseName?: string;
        context?: ExamTrustAiContext;
    }): Promise<{
        matches: any;
    }>;
    private _callOllama;
    private _callNvidia;
    private _callOpenRouter;
    private buildOllamaOptions;
    private getTypeLabel;
    private getOptionsInstruction;
    private normalizeQuestionType;
}
