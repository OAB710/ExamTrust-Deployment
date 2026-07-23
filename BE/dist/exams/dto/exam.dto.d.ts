export declare class CreateExamDto {
    title: string;
    description?: string;
    courseId: string;
    duration: number;
    timeLimitMinutes?: number | null;
    totalPoints?: number;
    passingScore?: number;
    startTime?: string;
    endTime?: string;
    settings?: Record<string, any>;
    maxAttempts?: number | null;
    gradingStrategy?: string | null;
    reviewSettings?: Record<string, any> | null;
    questionSelectionConfig?: Record<string, any> | null;
    mode?: string;
    ipWhitelist?: string[];
    questionIds?: string[];
}
export declare class UpdateExamDto {
    title?: string;
    description?: string;
    duration?: number;
    timeLimitMinutes?: number | null;
    totalPoints?: number;
    passingScore?: number;
    startTime?: string;
    endTime?: string;
    settings?: Record<string, any>;
    maxAttempts?: number | null;
    gradingStrategy?: string | null;
    reviewSettings?: Record<string, any> | null;
    questionSelectionConfig?: Record<string, any> | null;
    mode?: string;
    ipWhitelist?: string[];
    status?: string;
}
export declare class RescheduleExamDto {
    startTime: string;
    endTime: string;
}
export declare class AddQuestionsToExamDto {
    questionIds: string[];
}
export declare class UpdateExamQuestionDto {
    orderIndex?: number;
    points?: number;
    assignedScore?: number;
}
export declare class ShareExamDto {
    emails: string[];
    sendToCourse?: boolean;
}
