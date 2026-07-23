"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_redis_1 = require("@liaoliaots/nestjs-redis");
const prisma_service_1 = require("../prisma/prisma.service");
let CacheService = class CacheService {
    constructor(redisService, prisma) {
        this.redisService = redisService;
        this.prisma = prisma;
        this.EXAM_CACHE_TTL = 5 * 60;
        this.QUESTION_CACHE_TTL = 3 * 60;
        this.SUBMISSION_CACHE_TTL = 60;
        this.redis = this.redisService.getOrThrow(nestjs_redis_1.DEFAULT_REDIS);
    }
    async getExamForStudent(examId) {
        const cacheKey = `exam:${examId}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: {
                examQuestions: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                options: true,
                                points: true,
                            },
                        },
                    },
                },
            },
        });
        if (exam) {
            await this.redis.setex(cacheKey, this.EXAM_CACHE_TTL, JSON.stringify(exam));
        }
        return exam;
    }
    async getQuestionsList(creatorId, courseId, filters = {}, page = 1, limit = 20) {
        const filtersKey = JSON.stringify(filters);
        const cacheKey = `questions:${creatorId}:${courseId}:${filtersKey}:${page}:${limit}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const skip = (page - 1) * limit;
        const questions = await this.prisma.question.findMany({
            where: {
                creatorId,
                courseId,
                ...this.buildFilters(filters),
            },
            skip,
            take: limit,
            select: {
                id: true,
                type: true,
                content: true,
                options: true,
                explanation: true,
                difficulty: true,
                points: true,
                courseId: true,
                creatorId: true,
                createdAt: true,
                updatedAt: true,
                versions: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        const total = await this.prisma.question.count({
            where: {
                creatorId,
                courseId,
                ...this.buildFilters(filters),
            },
        });
        const result = {
            items: questions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        };
        await this.redis.setex(cacheKey, this.QUESTION_CACHE_TTL, JSON.stringify(result));
        return result;
    }
    async getSubmissionAnswers(submissionId) {
        const cacheKey = `submission:${submissionId}:answers`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
        const answers = await this.prisma.submissionAnswer.findMany({
            where: { submissionId },
        });
        await this.redis.setex(cacheKey, this.SUBMISSION_CACHE_TTL, JSON.stringify(answers));
        return answers;
    }
    async invalidateExamCache(examId) {
        await this.redis.del(`exam:${examId}`);
    }
    async invalidateQuestionsCacheForCreator(creatorId) {
        const pattern = `questions:${creatorId}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    async invalidateSubmissionCache(submissionId) {
        await this.redis.del(`submission:${submissionId}:answers`);
    }
    async clearAllCaches() {
        await this.redis.flushdb();
    }
    buildFilters(filters) {
        const result = {};
        if (filters.status) {
            result.status = filters.status;
        }
        if (filters.courseId) {
            result.courseId = filters.courseId;
        }
        if (filters.search) {
            result.OR = [
                { content: { contains: filters.search } },
                { metadata: { path: ['title'], string_contains: filters.search } },
            ];
        }
        return result;
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_redis_1.RedisService,
        prisma_service_1.PrismaService])
], CacheService);
//# sourceMappingURL=cache.service.js.map