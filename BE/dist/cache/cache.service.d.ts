import { RedisService } from '@liaoliaots/nestjs-redis';
import { PrismaService } from '../prisma/prisma.service';
export declare class CacheService {
    private readonly redisService;
    private readonly prisma;
    private readonly EXAM_CACHE_TTL;
    private readonly QUESTION_CACHE_TTL;
    private readonly SUBMISSION_CACHE_TTL;
    private readonly redis;
    constructor(redisService: RedisService, prisma: PrismaService);
    getExamForStudent(examId: string): Promise<any>;
    getQuestionsList(creatorId: string, courseId: string, filters?: any, page?: number, limit?: number): Promise<any>;
    getSubmissionAnswers(submissionId: string): Promise<any>;
    invalidateExamCache(examId: string): Promise<void>;
    invalidateQuestionsCacheForCreator(creatorId: string): Promise<void>;
    invalidateSubmissionCache(submissionId: string): Promise<void>;
    clearAllCaches(): Promise<void>;
    private buildFilters;
}
