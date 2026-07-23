export declare class GenerateQuestionDto {
    prompt: string;
    questionType?: string;
    difficulty?: number;
    language?: string;
    courseName?: string;
    useCase?: string;
    context?: Record<string, any>;
}
export declare class GenerateExamQuestionsDto {
    prompt: string;
    questionCount: number;
    difficulty?: number;
    questionType?: string;
    language?: string;
    courseName?: string;
    useCase?: string;
    courseId?: string;
    context?: Record<string, any>;
}
export declare class SuggestSimilarTopicsDto {
    topicName: string;
    existingTopics: string[];
    language?: string;
    courseName?: string;
    context?: Record<string, any>;
}
