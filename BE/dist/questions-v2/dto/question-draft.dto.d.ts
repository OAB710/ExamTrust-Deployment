export declare enum QuestionDraftMode {
    MANUAL = "MANUAL",
    AI_ASSISTED = "AI_ASSISTED",
    DUPLICATE = "DUPLICATE"
}
export declare enum QuestionDraftStepKey {
    INTENT = "intent",
    CONTENT = "content",
    ANSWERS = "answers",
    CLASSIFICATION = "classification",
    REVIEW = "review"
}
export declare enum AISection {
    CONTENT = "CONTENT",
    ANSWERS = "ANSWERS",
    EXPLANATION = "EXPLANATION",
    CLASSIFICATION = "CLASSIFICATION",
    QUALITY_REVIEW = "QUALITY_REVIEW",
    RISK_ASSESSMENT = "RISK_ASSESSMENT"
}
export declare enum DraftValidationLevel {
    SOFT = "SOFT",
    STRICT = "STRICT"
}
export declare enum DraftPublishMode {
    IN_REVIEW = "IN_REVIEW",
    PUBLISHED = "PUBLISHED"
}
export declare class CreateQuestionDraftDto {
    mode: QuestionDraftMode;
    questionType?: string;
    sourceQuestionId?: string;
    initialContext?: Record<string, any>;
}
export declare class SaveDraftStepDto {
    autosaveVersion: number;
    data: Record<string, any>;
}
export declare class AIGenerationConstraintsDto {
    difficulty?: number;
    language?: string;
    optionCount?: number;
    maxLength?: number;
    forbiddenTerms?: string[];
}
export declare class AIGenerateSectionDto {
    section: AISection;
    instruction?: string;
    constraints?: AIGenerationConstraintsDto;
    variants?: number;
}
export declare class ApplyAICandidateDto {
    jobId: string;
    candidateId: string;
    section: AISection;
}
export declare class ValidateQuestionDraftDto {
    level?: DraftValidationLevel;
}
export declare class PublishQuestionDraftDto {
    expectedAutosaveVersion: number;
    publishMode?: DraftPublishMode;
}
