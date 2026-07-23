export declare enum RiskFlagDecision {
    REVIEWED = "REVIEWED",
    DISMISSED = "DISMISSED",
    CONFIRMED = "CONFIRMED"
}
export declare class ReviewAnomalyFlagDto {
    status: RiskFlagDecision;
    notes?: string;
}
