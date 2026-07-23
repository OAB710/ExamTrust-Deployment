export type ExamTrustAiUseCase = 'question_generation' | 'exam_generation' | 'draft_section' | 'topic_matching' | 'grading_support' | 'exam_quality_review' | 'exam_risk_assessment';
export interface ExamTrustAiAnalyticsSummary {
    totalAttempts?: number;
    correctAttempts?: number;
    incorrectAttempts?: number;
    skippedAttempts?: number;
    passRate?: number;
    difficultyIndex?: number;
    discriminationIndex?: number;
    dominantWrongAnswer?: string;
    averageScore?: number;
}
export interface ExamTrustAiContext {
    courseId?: string;
    courseCode?: string;
    courseName?: string;
    subjectCode?: string;
    examId?: string;
    examTitle?: string;
    examMode?: string;
    examStatus?: string;
    questionId?: string;
    questionVersionId?: string;
    questionVersionNo?: number;
    questionType?: string;
    questionCount?: number;
    difficulty?: number;
    attemptNo?: number;
    topicName?: string;
    existingTopics?: string[];
    draftId?: string;
    draftMode?: string;
    draftStep?: string;
    currentStem?: string;
    instruction?: string;
    analytics?: ExamTrustAiAnalyticsSummary;
    extra?: Record<string, any>;
}
export interface ExamTrustAiPromptParams {
    appName: string;
    useCase: ExamTrustAiUseCase;
    language: string;
    questionType?: string;
    questionCount?: number;
    context?: ExamTrustAiContext;
}
export interface OllamaGenerationOptions {
    temperature: number;
    top_p: number;
    repeat_penalty: number;
    num_ctx: number;
}
export declare function buildExamTrustPromptHeader(params: ExamTrustAiPromptParams): string;
export declare function getOllamaGenerationOptions(useCase: ExamTrustAiUseCase): OllamaGenerationOptions;
