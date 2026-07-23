import { QuestionsService } from './questions-v2.service';
import { CreateTopicDto, ListTopicsQueryDto, SetCourseTopicsDto } from './dto/question-metadata.dto';
export declare class QuestionMetadataController {
    private readonly questionsService;
    constructor(questionsService: QuestionsService);
    listTopics(query: ListTopicsQueryDto): Promise<{
        data: {
            id: string;
            code: string;
            name: string;
            createdAt: Date;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createTopic(dto: CreateTopicDto, req: any): Promise<{
        id: string;
        code: string;
        name: string;
        createdAt: Date;
    }>;
    setCourseTopics(courseId: string, dto: SetCourseTopicsDto): Promise<{
        courseId: string;
        topicIds: string[];
        count: number;
    }>;
}
