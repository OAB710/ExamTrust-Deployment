export declare class ListTopicsQueryDto {
    search?: string;
    courseId?: string;
    page?: number;
    limit?: number;
}
export declare class CreateTopicDto {
    code: string;
    name: string;
    courseId?: string;
}
export declare class SetCourseTopicsDto {
    topicIds: string[];
}
