export declare enum QualityReviewDecision {
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    NEEDS_CHANGES = "NEEDS_CHANGES"
}
export declare class ReviewQualitySuggestionDto {
    decision: QualityReviewDecision;
    notes?: string;
}
