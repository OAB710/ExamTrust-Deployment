export declare class GenerateExamLinkDto {
    expiryDatetime?: string;
    maxUses?: number;
    password?: string;
    restrictedToCourse?: boolean;
    note?: string;
}
export declare class JoinExamLinkDto {
    password?: string;
}
export declare class UpdateExamLinkDto {
    disabled?: boolean;
    expiryDatetime?: string;
    maxUses?: number;
    note?: string;
}
