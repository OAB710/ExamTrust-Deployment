export declare class CreateQuestionCrudDto {
    type: string;
    content: string;
    options?: Record<string, any>;
    correctAnswer?: Record<string, any>;
    explanation?: string;
    difficulty?: number;
    points?: number;
    defaultPoints?: number;
    courseId?: string;
    topicId?: string;
}
export declare class UpdateQuestionCrudDto {
    type?: string;
    content?: string;
    options?: Record<string, any>;
    correctAnswer?: Record<string, any>;
    explanation?: string;
    difficulty?: number;
    points?: number;
    defaultPoints?: number;
    courseId?: string;
    topicId?: string;
}
