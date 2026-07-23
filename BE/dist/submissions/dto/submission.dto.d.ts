export declare class StartExamDto {
    examId: string;
}
export declare class SubmitAnswerDto {
    questionId: string;
    answer: Record<string, any>;
    timeTaken?: number;
}
export declare class SubmitExamDto {
    answers: SubmitAnswerDto[];
    logs?: Array<{
        type: string;
        details?: any;
        ts?: number;
    }>;
}
export declare class AutosaveAnswerDto {
    questionId: string;
    sequence: number;
    answer: Record<string, any>;
    timeTaken?: number;
}
export declare class AutosaveExamDto {
    clientBatchId?: string;
    baseSubmissionVersion?: number;
    answers: AutosaveAnswerDto[];
}
export declare class AddLogsDto {
    logs: Array<{
        type: string;
        details?: any;
        ts?: number;
    }>;
}
export declare class GradeAnswerDto {
    submissionAnswerId: string;
    pointsAwarded: number;
    feedback?: string;
    reason?: string;
}
export declare class UpdateSubmissionStatusDto {
    status: string;
}
