export declare class CreateQuestionAiImprovementDto {
    questionId: string;
    examId: string;
    examQuestionId?: string;
    qualityReviewId?: string;
    analytics?: Record<string, any>;
}
export declare class UpdateQuestionAiImprovementDraftDto {
    draft: Record<string, any>;
}
export declare class ApproveQuestionAiImprovementDto {
    final: Record<string, any>;
}
export declare class RejectQuestionAiImprovementDto {
    reason?: string;
}
