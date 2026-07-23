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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const access_policy_service_1 = require("../common/services/access-policy.service");
const ip_utils_1 = require("../common/utils/ip.utils");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const notifications_service_1 = require("../notifications/notifications.service");
const AUTO_GRADED_TYPES = new Set(['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE']);
let ExamsService = class ExamsService {
    constructor(prisma, notificationsService, accessPolicy) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.accessPolicy = accessPolicy;
        this.examQuestionVersionColumnExists = null;
        this.examQuestionAssignedScoreColumnExists = null;
    }
    async getCourseRecipientIds(courseId) {
        const enrollments = await this.prisma.enrollment.findMany({
            where: { courseId },
            select: { studentId: true },
        });
        return enrollments.map((e) => e.studentId);
    }
    async hasExamQuestionVersionColumn(client) {
        if (this.examQuestionVersionColumnExists !== null) {
            return this.examQuestionVersionColumnExists;
        }
        const rows = await client.$queryRawUnsafe(`
      SELECT 1 AS ok
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'exam_questions'
        AND column_name = 'questionVersionId'
      LIMIT 1
      `);
        this.examQuestionVersionColumnExists = rows.length > 0;
        return this.examQuestionVersionColumnExists;
    }
    async hasExamQuestionAssignedScoreColumn(client) {
        if (this.examQuestionAssignedScoreColumnExists !== null) {
            return this.examQuestionAssignedScoreColumnExists;
        }
        const rows = await client.$queryRawUnsafe(`
      SELECT 1 AS ok
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'exam_questions'
        AND column_name = 'assignedScore'
      LIMIT 1
      `);
        this.examQuestionAssignedScoreColumnExists = rows.length > 0;
        return this.examQuestionAssignedScoreColumnExists;
    }
    async insertExamQuestionCompat(client, data) {
        const id = (0, crypto_1.randomUUID)();
        const hasVersionColumn = await this.hasExamQuestionVersionColumn(client);
        const hasAssignedScoreColumn = await this.hasExamQuestionAssignedScoreColumn(client);
        if (hasVersionColumn) {
            if (hasAssignedScoreColumn) {
                await client.$executeRawUnsafe(`
          INSERT INTO exam_questions (id, examId, questionId, questionVersionId, orderIndex, points, assignedScore)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `, id, data.examId, data.questionId, data.questionVersionId ?? null, data.orderIndex, data.points ?? 1, data.assignedScore ?? data.points ?? 1);
            }
            else {
                await client.$executeRawUnsafe(`
          INSERT INTO exam_questions (id, examId, questionId, questionVersionId, orderIndex, points)
          VALUES (?, ?, ?, ?, ?, ?)
          `, id, data.examId, data.questionId, data.questionVersionId ?? null, data.orderIndex, data.points ?? 1);
            }
        }
        else {
            if (hasAssignedScoreColumn) {
                await client.$executeRawUnsafe(`
          INSERT INTO exam_questions (id, examId, questionId, orderIndex, points, assignedScore)
          VALUES (?, ?, ?, ?, ?, ?)
          `, id, data.examId, data.questionId, data.orderIndex, data.points ?? 1, data.assignedScore ?? data.points ?? 1);
            }
            else {
                await client.$executeRawUnsafe(`
          INSERT INTO exam_questions (id, examId, questionId, orderIndex, points)
          VALUES (?, ?, ?, ?, ?)
          `, id, data.examId, data.questionId, data.orderIndex, data.points ?? 1);
            }
        }
        return id;
    }
    parseRawJson(value) {
        if (value === null || typeof value === 'undefined')
            return null;
        if (typeof value === 'object')
            return value;
        try {
            return JSON.parse(String(value));
        }
        catch {
            return null;
        }
    }
    buildQuestionSnapshotPayload(examQuestion, questionVersion) {
        const question = examQuestion.question || {};
        const versionPayload = this.parseRawJson(questionVersion?.payload) || {};
        const questionOptions = this.parseRawJson(question.options);
        const questionCorrectAnswer = this.parseRawJson(question.correctAnswer);
        const type = String(question.type || versionPayload.type || '').trim();
        const stem = String(questionVersion?.stem ||
            versionPayload.stem ||
            versionPayload.content ||
            question.content ||
            '').trim();
        const options = typeof versionPayload.options !== 'undefined'
            ? versionPayload.options
            : questionOptions;
        const answerKey = questionVersion?.answerKey ??
            versionPayload.answerKey ??
            versionPayload.correctAnswer ??
            questionCorrectAnswer ??
            null;
        const explanation = questionVersion?.explanation ??
            versionPayload.explanation ??
            question.explanation ??
            null;
        const assignedScore = Number(examQuestion.assignedScore ?? examQuestion.points ?? questionVersion?.points ?? question.defaultPoints ?? question.points ?? 1);
        if (!stem) {
            throw new common_1.BadRequestException(`Cannot snapshot question ${examQuestion.questionId}: missing question content`);
        }
        if (AUTO_GRADED_TYPES.has(type.toUpperCase()) && (answerKey === null || typeof answerKey === 'undefined')) {
            throw new common_1.BadRequestException(`Cannot snapshot question ${examQuestion.questionId}: missing answer key`);
        }
        return {
            questionId: examQuestion.questionId,
            questionVersionId: questionVersion?.id ?? examQuestion.questionVersionId ?? null,
            type,
            stem,
            content: stem,
            options,
            answerKey,
            correctAnswer: answerKey,
            explanation,
            assignedScore,
            points: assignedScore,
            difficulty: questionVersion?.difficulty ?? versionPayload.difficulty ?? question.difficulty ?? null,
            versionNo: questionVersion?.versionNo ?? versionPayload.versionNo ?? null,
        };
    }
    async loadExamQuestionsCompat(examId, includeCorrectAnswer) {
        const rows = await this.prisma.$queryRawUnsafe(`
      SELECT
        eq.id,
        eq.examId,
        eq.questionId,
        eq.questionVersionId,
        eq.orderIndex,
        eq.points,
        eq.assignedScore,
        COALESCE(qv.stem, q.content) AS content,
        COALESCE(qv.payload, q.options) AS options,
        COALESCE(qv.answerKey, q.correctAnswer) AS correctAnswer,
        COALESCE(qv.explanation, q.explanation) AS explanation,
        COALESCE(qv.difficulty, q.difficulty) AS difficulty,
        COALESCE(qv.points, q.defaultPoints, q.points) AS questionPoints,
        COALESCE(qv.versionNo, 0) AS versionNo,
        q.type,
        q.courseId,
        q.creatorId,
        q.createdAt,
        q.updatedAt
      FROM exam_questions eq
      LEFT JOIN question_versions qv
        ON qv.id COLLATE utf8mb4_unicode_ci = eq.questionVersionId COLLATE utf8mb4_unicode_ci
      LEFT JOIN questions q
        ON q.id COLLATE utf8mb4_unicode_ci = eq.questionId COLLATE utf8mb4_unicode_ci
      WHERE eq.examId COLLATE utf8mb4_unicode_ci = ?
      ORDER BY eq.orderIndex ASC
      `, examId);
        return rows.map((row) => ({
            id: row.id,
            examId: row.examId,
            questionId: row.questionId,
            questionVersionId: row.questionVersionId ?? null,
            orderIndex: Number(row.orderIndex || 0),
            points: row.assignedScore ?? row.points ?? 1,
            assignedScore: row.assignedScore ?? row.points ?? 1,
            question: {
                id: row.questionId,
                type: row.type,
                content: row.content,
                options: this.parseRawJson(row.options),
                correctAnswer: includeCorrectAnswer ? this.parseRawJson(row.correctAnswer) : undefined,
                explanation: row.explanation,
                difficulty: row.difficulty,
                points: row.questionPoints,
                courseId: row.courseId,
                creatorId: row.creatorId,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                versionNo: row.versionNo,
            },
        }));
    }
    async create(createExamDto, creatorId, creatorRole) {
        const { questionIds, ...examData } = createExamDto;
        const settings = createExamDto.settings || examData.settings || {};
        const timeLimitMinutes = typeof createExamDto.timeLimitMinutes === 'number'
            ? createExamDto.timeLimitMinutes
            : typeof settings.timeLimitMinutes === 'number'
                ? settings.timeLimitMinutes
                : createExamDto.duration;
        const maxAttempts = typeof createExamDto.maxAttempts === 'number'
            ? createExamDto.maxAttempts
            : typeof settings.maxAttempts === 'number'
                ? settings.maxAttempts
                : null;
        const gradingStrategy = createExamDto.gradingStrategy ||
            settings.gradingStrategy ||
            null;
        const reviewSettings = createExamDto.reviewSettings ||
            settings.reviewSettings ||
            null;
        const questionSelectionConfig = createExamDto.questionSelectionConfig ||
            settings.questionSelectionConfig ||
            {
                sourceMethod: settings.sourceMethod || 'bank',
                shuffleQuestions: Boolean(settings.shuffleQuestions),
                requestedQuestionCount: Number(settings.requestedQuestionCount || 0) || null,
                topicAllocations: Array.isArray(settings.topicAllocations) ? settings.topicAllocations : [],
            };
        const requestedCount = Number(settings.requestedQuestionCount || 0);
        const sourceMethod = settings.sourceMethod || 'bank';
        const normalizedType = this.normalizeQuestionType(settings.questionType);
        const bankDifficulty = settings.bankDifficulty;
        const topicAllocations = Array.isArray(settings.topicAllocations)
            ? settings.topicAllocations
                .map((item) => ({
                topicId: String(item?.topicId || '').trim(),
                count: Math.max(0, Number(item?.count || 0)),
            }))
                .filter((item) => item.topicId && item.count > 0)
            : [];
        if (Array.isArray(createExamDto.ipWhitelist)) {
            const invalidRule = createExamDto.ipWhitelist.find((rule) => !(0, ip_utils_1.isValidIpOrCidr)(rule));
            if (invalidRule) {
                throw new common_1.BadRequestException(`Invalid IP/CIDR format: ${invalidRule}. Example: 192.168.1.10 or 192.168.1.0/24`);
            }
        }
        const course = await this.prisma.course.findUnique({
            where: { id: createExamDto.courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (String(creatorRole || '').toUpperCase() === 'LECTURER' && course.lecturerId !== creatorId) {
            throw new common_1.ForbiddenException('You are not allowed to create exams for this course');
        }
        const createdExam = await this.prisma.$transaction(async (tx) => {
            const exam = await tx.exam.create({
                data: {
                    ...examData,
                    creatorId,
                    startTime: examData.startTime ? new Date(examData.startTime) : null,
                    endTime: examData.endTime ? new Date(examData.endTime) : null,
                    timeLimitMinutes: timeLimitMinutes ?? null,
                    maxAttempts: maxAttempts ?? null,
                    gradingStrategy: gradingStrategy ?? null,
                    reviewSettings: reviewSettings ?? null,
                    questionSelectionConfig: questionSelectionConfig ?? null,
                },
                include: {
                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                },
            });
            if (Array.isArray(createExamDto.ipWhitelist) && createExamDto.ipWhitelist.length > 0) {
                const toCreate = createExamDto.ipWhitelist.map((r) => ({ examId: exam.id, rule: r, normalized: r }));
                await tx.examIpWhitelist.createMany({ data: toCreate });
            }
            if (questionIds && questionIds.length > 0) {
                const versionRows = await tx.questionVersion.findMany({
                    where: { questionId: { in: questionIds } },
                    orderBy: [
                        { questionId: 'asc' },
                        { versionNo: 'desc' },
                    ],
                    select: {
                        id: true,
                        questionId: true,
                    },
                });
                const latestVersionByQuestionId = new Map();
                for (const version of versionRows) {
                    if (!latestVersionByQuestionId.has(version.questionId)) {
                        latestVersionByQuestionId.set(version.questionId, version.id);
                    }
                }
                for (let i = 0; i < questionIds.length; i++) {
                    const questionId = questionIds[i];
                    const question = await tx.question.findUnique({
                        where: { id: questionId },
                        select: {
                            id: true,
                            points: true,
                            defaultPoints: true,
                        },
                    });
                    if (!question) {
                        throw new common_1.BadRequestException(`Question not found: ${questionId}`);
                    }
                    await this.insertExamQuestionCompat(tx, {
                        examId: exam.id,
                        questionId,
                        orderIndex: i + 1,
                        points: Math.max(1, Math.round(Number(question.points ?? question.defaultPoints ?? 1))),
                        assignedScore: Number(question.defaultPoints ?? question.points ?? 1) || 1,
                        questionVersionId: latestVersionByQuestionId.get(questionId) ?? null,
                    });
                }
            }
            const requestedCount = createExamDto.settings?.requestedQuestionCount ||
                examData.settings?.requestedQuestionCount || 0;
            const sourceMethod = createExamDto.settings?.sourceMethod ||
                examData.settings?.sourceMethod || 'bank';
            if (sourceMethod === 'bank' && (requestedCount > 0 || topicAllocations.length > 0)) {
                const baseWhere = { courseId: createExamDto.courseId };
                if (normalizedType) {
                    baseWhere.type = normalizedType;
                }
                if (bankDifficulty && bankDifficulty !== 'mixed') {
                    const parsed = Number(bankDifficulty);
                    if (!Number.isNaN(parsed)) {
                        const center = Math.max(1, Math.min(5, Math.round(parsed * 4 + 1)));
                        baseWhere.difficulty = {
                            gte: Math.max(1, center - 1),
                            lte: Math.min(5, center + 1),
                        };
                    }
                }
                const pickRandomQuestions = (items, count) => {
                    const shuffled = [...items];
                    for (let i = shuffled.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                    }
                    return shuffled.slice(0, count);
                };
                const selectedQuestions = [];
                const usedQuestionIds = new Set(questionIds || []);
                if (topicAllocations.length > 0) {
                    const difficultyGte = Number(baseWhere?.difficulty?.gte);
                    const difficultyLte = Number(baseWhere?.difficulty?.lte);
                    const hasDifficultyRange = !Number.isNaN(difficultyGte) && !Number.isNaN(difficultyLte);
                    const totalRequestedFromTopics = topicAllocations.reduce((sum, item) => sum + item.count, 0);
                    if (requestedCount > 0 && totalRequestedFromTopics !== requestedCount) {
                        throw new common_1.BadRequestException(`Topic allocations must add up to ${requestedCount} questions. Current total is ${totalRequestedFromTopics}.`);
                    }
                    for (const allocation of topicAllocations) {
                        const topicWhereParts = [
                            'q.courseId COLLATE utf8mb4_unicode_ci = CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci',
                            'qt.topicId COLLATE utf8mb4_unicode_ci = CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci',
                        ];
                        const topicArgs = [createExamDto.courseId, allocation.topicId];
                        if (normalizedType) {
                            topicWhereParts.push('q.type COLLATE utf8mb4_unicode_ci = CAST(? AS CHAR CHARACTER SET utf8mb4) COLLATE utf8mb4_unicode_ci');
                            topicArgs.push(normalizedType);
                        }
                        if (hasDifficultyRange) {
                            topicWhereParts.push('q.difficulty BETWEEN ? AND ?');
                            topicArgs.push(difficultyGte, difficultyLte);
                        }
                        const questionsForTopic = await tx.$queryRawUnsafe(`
                  SELECT q.id, q.points, q.defaultPoints
                  FROM questions q
                  INNER JOIN question_topics qt
                    ON qt.questionId COLLATE utf8mb4_unicode_ci = q.id COLLATE utf8mb4_unicode_ci
                  WHERE ${topicWhereParts.join(' AND ')}
                  `, ...topicArgs);
                        const available = questionsForTopic.filter((question) => !usedQuestionIds.has(question.id));
                        if (available.length < allocation.count) {
                            throw new common_1.BadRequestException(`Not enough questions for the selected topic quota (${allocation.count}) in topic ${allocation.topicId}. Available: ${available.length}.`);
                        }
                        const chosen = pickRandomQuestions(available, allocation.count);
                        chosen.forEach((question) => {
                            usedQuestionIds.add(question.id);
                            selectedQuestions.push(question);
                        });
                    }
                }
                else {
                    const selected = await tx.question.findMany({
                        where: baseWhere,
                        take: Math.max(0, Number(requestedCount)),
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            points: true,
                            defaultPoints: true,
                            latestVersionNo: true,
                        },
                    });
                    if (selected.length === 0) {
                        throw new common_1.BadRequestException('No matching questions found in question bank for selected course/type/difficulty. Please adjust filters or add questions first.');
                    }
                    selectedQuestions.push(...selected);
                }
                if (selectedQuestions.length === 0) {
                    throw new common_1.BadRequestException('No matching questions found in question bank for the selected settings.');
                }
                const selectedQuestionIds = Array.from(new Set(selectedQuestions.map((q) => q.id)));
                const latestVersions = await tx.questionVersion.findMany({
                    where: { questionId: { in: selectedQuestionIds } },
                    orderBy: [
                        { questionId: 'asc' },
                        { versionNo: 'desc' },
                    ],
                    select: {
                        id: true,
                        questionId: true,
                        versionNo: true,
                    },
                });
                const latestVersionByQuestionId = new Map();
                for (const version of latestVersions) {
                    if (!latestVersionByQuestionId.has(version.questionId)) {
                        latestVersionByQuestionId.set(version.questionId, version.id);
                    }
                }
                for (let i = 0; i < selectedQuestions.length; i++) {
                    const question = selectedQuestions[i];
                    await this.insertExamQuestionCompat(tx, {
                        examId: exam.id,
                        questionId: question.id,
                        orderIndex: (questionIds?.length || 0) + i + 1,
                        points: Math.max(1, Math.round(Number(question.points ?? question.defaultPoints ?? 1))),
                        assignedScore: Number(question.defaultPoints ?? question.points ?? 1) || 1,
                        questionVersionId: latestVersionByQuestionId.get(question.id) ?? null,
                    });
                }
            }
            const qCount = await tx.examQuestion.count({ where: { examId: exam.id } });
            if (qCount > 0) {
                await tx.exam.update({ where: { id: exam.id }, data: { status: 'PUBLISHED' } });
            }
            const createdExam = await tx.exam.findUnique({
                where: { id: exam.id },
                include: {
                    course: { select: { id: true, code: true, name: true } },
                    creator: { select: { id: true, fullName: true } },
                    _count: { select: { examQuestions: true, submissions: true } },
                },
            });
            return createdExam;
        });
        try {
            const studentIds = await this.getCourseRecipientIds(createdExam.course.id);
            await this.notificationsService.createForUsers(studentIds, {
                kind: 'EXAM_CREATED',
                title: 'New exam available',
                message: `A new exam \"${createdExam.title}\" is available in ${createdExam.course.code}.`,
                link: '/student/exams',
                priority: 'high',
                metadata: { examId: createdExam.id, courseId: createdExam.course.id },
            });
            await this.notificationsService.createForRole('ADMIN', {
                kind: 'EXAM_CREATED',
                title: 'Exam created',
                message: `${createdExam.creator.fullName} created exam \"${createdExam.title}\".`,
                link: '/admin',
                priority: 'low',
                metadata: { examId: createdExam.id, creatorId },
            });
        }
        catch {
        }
        return createdExam;
    }
    async findAll(filters, pagination) {
        const where = {};
        if (filters?.courseId) {
            where.courseId = filters.courseId;
        }
        if (filters?.creatorId) {
            where.creatorId = filters.creatorId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const [exams, total] = await Promise.all([
            this.prisma.exam.findMany({
                where,
                include: {
                    course: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            academicYear: true,
                            term: true,
                        },
                    },
                    creator: {
                        select: {
                            id: true,
                            fullName: true,
                        },
                    },
                    _count: {
                        select: {
                            examQuestions: true,
                            submissions: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.exam.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResult)(exams, total, page, limit);
    }
    async findOne(id) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                creator: {
                    select: {
                        id: true,
                        fullName: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const examQuestions = await this.loadExamQuestionsCompat(id, true);
        return {
            ...exam,
            examQuestions,
        };
    }
    async findForStudent(id, studentId, clientIp) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const enrollment = await this.prisma.enrollment.findFirst({
            where: {
                studentId,
                courseId: exam.courseId,
                status: 'active',
            },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You are not enrolled in this course');
        }
        if (exam.status !== 'PUBLISHED' && exam.status !== 'ONGOING') {
            throw new common_1.ForbiddenException('Exam is not available');
        }
        try {
            const check = await this.accessPolicy.isIpAllowedForExam(exam.id, clientIp ?? null);
            if (!check.allowed) {
                await this.accessPolicy.logDeniedAccess(exam.id, {
                    studentId,
                    resolvedClientIp: clientIp ?? null,
                    reasonCode: check.reason || 'LAB_IP_DENIED',
                    reasonMessage: 'Access denied by lab IP whitelist',
                    route: 'exams.findForStudent',
                });
                throw new common_1.ForbiddenException('Access denied: outside allowed lab network');
            }
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.ForbiddenException('Access restricted by network policy');
        }
        const examQuestions = await this.loadExamQuestionsCompat(id, false);
        return {
            ...exam,
            examQuestions: examQuestions.map((eq) => ({
                ...eq,
                question: {
                    id: eq.question.id,
                    type: eq.question.type,
                    content: eq.question.content,
                    options: eq.question.options,
                    points: eq.question.points,
                },
            })),
        };
    }
    async update(id, updateExamDto) {
        const exam = await this.prisma.exam.findUnique({ where: { id } });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (Array.isArray(updateExamDto.ipWhitelist)) {
            const invalidRule = updateExamDto.ipWhitelist.find((rule) => !(0, ip_utils_1.isValidIpOrCidr)(rule));
            if (invalidRule) {
                throw new common_1.BadRequestException(`Invalid IP/CIDR format: ${invalidRule}. Example: 192.168.1.10 or 192.168.1.0/24`);
            }
        }
        const updateData = { ...updateExamDto };
        if (updateExamDto.startTime) {
            updateData.startTime = new Date(updateExamDto.startTime);
        }
        if (updateExamDto.endTime) {
            updateData.endTime = new Date(updateExamDto.endTime);
        }
        const updatedExam = await this.prisma.exam.update({
            where: { id },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        if (Array.isArray(updateExamDto.ipWhitelist)) {
            await this.prisma.$transaction(async (tx) => {
                await tx.examIpWhitelist.deleteMany({ where: { examId: id } });
                const newList = updateExamDto.ipWhitelist || [];
                if (newList.length > 0) {
                    const toCreate = newList.map((r) => ({ examId: id, rule: r, normalized: r }));
                    await tx.examIpWhitelist.createMany({ data: toCreate });
                }
            });
        }
        try {
            const studentIds = await this.getCourseRecipientIds(updatedExam.course.id);
            await this.notificationsService.createForUsers(studentIds, {
                kind: 'EXAM_UPDATED',
                title: 'Exam updated',
                message: `Exam \"${updatedExam.title}\" has updated details or schedule.`,
                link: '/student/exams',
                priority: 'high',
                metadata: { examId: updatedExam.id, courseId: updatedExam.course.id },
            });
        }
        catch {
        }
        return updatedExam;
    }
    async reschedule(id, rescheduleExamDto) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        submissions: true,
                    },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.status === 'ONGOING') {
            throw new common_1.BadRequestException('Cannot reschedule an ongoing exam');
        }
        if (exam.status === 'COMPLETED' || exam.status === 'ARCHIVED') {
            throw new common_1.BadRequestException(`Cannot reschedule exam with status ${exam.status}`);
        }
        if (exam._count.submissions > 0) {
            throw new common_1.BadRequestException('Cannot reschedule exam that already has submissions');
        }
        if (exam.startTime && exam.startTime.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('Cannot reschedule an exam that has already started');
        }
        const startTime = new Date(rescheduleExamDto.startTime);
        const endTime = new Date(rescheduleExamDto.endTime);
        if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
            throw new common_1.BadRequestException('Invalid startTime or endTime');
        }
        if (endTime <= startTime) {
            throw new common_1.BadRequestException('endTime must be after startTime');
        }
        const availableWindowMinutes = (endTime.getTime() - startTime.getTime()) / 60000;
        if (availableWindowMinutes < exam.duration) {
            throw new common_1.BadRequestException(`Exam duration (${exam.duration} minutes) exceeds the scheduled window`);
        }
        const updatedExam = await this.prisma.exam.update({
            where: { id },
            data: {
                startTime,
                endTime,
            },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });
        try {
            const studentIds = await this.getCourseRecipientIds(updatedExam.course.id);
            await this.notificationsService.createForUsers(studentIds, {
                kind: 'EXAM_UPDATED',
                title: 'Exam rescheduled',
                message: `Exam "${updatedExam.title}" has a new schedule. Please check the updated exam time.`,
                link: '/student/exams',
                priority: 'high',
                metadata: {
                    examId: updatedExam.id,
                    courseId: updatedExam.course.id,
                    startTime: updatedExam.startTime,
                    endTime: updatedExam.endTime,
                },
            });
        }
        catch {
        }
        return updatedExam;
    }
    async remove(id) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, code: true, name: true },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        try {
            await this.prisma.$transaction(async (tx) => {
                await tx.$executeRawUnsafe(`DELETE il
           FROM integrity_logs il
           INNER JOIN proctoring_sessions ps ON ps.id = il.proctoringId
           INNER JOIN exam_submissions es ON es.id = ps.submissionId
           WHERE es.examId = ?`, id);
                await tx.$executeRawUnsafe(`DELETE sa
           FROM submission_answers sa
           INNER JOIN exam_submissions es ON es.id = sa.submissionId
           WHERE es.examId = ?`, id);
                await tx.$executeRawUnsafe(`DELETE ps
           FROM proctoring_sessions ps
           INNER JOIN exam_submissions es ON es.id = ps.submissionId
           WHERE es.examId = ?`, id);
                await tx.$executeRawUnsafe('DELETE FROM exam_submissions WHERE examId = ?', id);
                await tx.$executeRawUnsafe(`DELETE elu
           FROM exam_link_usages elu
           INNER JOIN exam_links el ON el.id = elu.linkId
           WHERE el.examId = ?`, id);
                await tx.$executeRawUnsafe('DELETE FROM exam_links WHERE examId = ?', id);
                await tx.$executeRawUnsafe('DELETE FROM exam_questions WHERE examId = ?', id);
                await tx.$executeRawUnsafe('DELETE FROM exams WHERE id = ?', id);
            });
        }
        catch (error) {
            if (error?.code === 'P2003') {
                throw new common_1.ConflictException('Cannot delete exam because it still has related data');
            }
            if (error?.code === 'P2025') {
                throw new common_1.NotFoundException('Exam not found');
            }
            console.error('Failed to delete exam', {
                examId: id,
                code: error?.code,
                message: error?.message,
                meta: error?.meta,
            });
            throw new common_1.InternalServerErrorException('Failed to delete exam due to a server-side data constraint issue');
        }
        try {
            const studentIds = await this.getCourseRecipientIds(exam.course.id);
            await this.notificationsService.createForUsers(studentIds, {
                kind: 'EXAM_DELETED',
                title: 'Exam removed',
                message: `Exam \"${exam.title}\" in ${exam.course.code} has been removed.`,
                link: '/student/exams',
                priority: 'high',
                metadata: { examId: exam.id, courseId: exam.course.id },
            });
        }
        catch {
        }
        return { message: 'Exam deleted successfully' };
    }
    async addQuestionsToExam(examId, questionIds) {
        const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const maxOrder = await this.prisma.examQuestion.findFirst({
            where: { examId },
            orderBy: { orderIndex: 'desc' },
            select: { orderIndex: true },
        });
        let orderIndex = (maxOrder?.orderIndex || 0) + 1;
        const examQuestions = [];
        const versionRows = await this.prisma.questionVersion.findMany({
            where: { questionId: { in: questionIds } },
            orderBy: [
                { questionId: 'asc' },
                { versionNo: 'desc' },
            ],
            select: {
                id: true,
                questionId: true,
            },
        });
        const latestVersionByQuestionId = new Map();
        for (const version of versionRows) {
            if (!latestVersionByQuestionId.has(version.questionId)) {
                latestVersionByQuestionId.set(version.questionId, version.id);
            }
        }
        for (const questionId of questionIds) {
            const question = await this.prisma.question.findUnique({
                where: { id: questionId },
                select: { id: true, points: true, defaultPoints: true },
            });
            if (!question) {
                continue;
            }
            const existing = await this.prisma.examQuestion.findUnique({
                where: {
                    examId_questionId: { examId, questionId },
                },
            });
            if (!existing) {
                const createdId = await this.insertExamQuestionCompat(this.prisma, {
                    examId,
                    questionId,
                    orderIndex,
                    points: Math.max(1, Math.round(Number(question.points ?? question.defaultPoints ?? 1))),
                    assignedScore: Number(question.defaultPoints ?? question.points ?? 1) || 1,
                    questionVersionId: latestVersionByQuestionId.get(questionId) ?? null,
                });
                examQuestions.push({
                    id: createdId,
                    examId,
                    questionId,
                    orderIndex,
                    points: Math.max(1, Math.round(Number(question.points ?? question.defaultPoints ?? 1))),
                    question,
                });
                orderIndex++;
            }
        }
        return examQuestions;
    }
    async removeQuestionFromExam(examId, questionId) {
        const examQuestion = await this.prisma.examQuestion.findUnique({
            where: {
                examId_questionId: { examId, questionId },
            },
        });
        if (!examQuestion) {
            throw new common_1.NotFoundException('Question not found in exam');
        }
        await this.prisma.examQuestion.delete({
            where: { id: examQuestion.id },
        });
        return { message: 'Question removed from exam' };
    }
    async updateExamQuestion(examId, questionId, updateDto) {
        const examQuestion = await this.prisma.examQuestion.findUnique({
            where: {
                examId_questionId: { examId, questionId },
            },
        });
        if (!examQuestion) {
            throw new common_1.NotFoundException('Question not found in exam');
        }
        return this.prisma.examQuestion.update({
            where: { id: examQuestion.id },
            data: {
                ...(typeof updateDto.orderIndex === 'number' ? { orderIndex: updateDto.orderIndex } : {}),
                ...(typeof updateDto.points === 'number'
                    ? { points: updateDto.points, assignedScore: updateDto.points }
                    : {}),
                ...(typeof updateDto.assignedScore === 'number'
                    ? {
                        assignedScore: updateDto.assignedScore,
                        points: Math.max(1, Math.round(updateDto.assignedScore)),
                    }
                    : {}),
            },
            include: {
                question: true,
            },
        });
    }
    async publishExam(id) {
        const exam = await this.prisma.exam.findUnique({
            where: { id },
            include: {
                examQuestions: true,
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (exam.examQuestions.length === 0) {
            throw new common_1.BadRequestException('Cannot publish exam without questions');
        }
        const publishedExam = await this.prisma.$transaction(async (tx) => {
            const examQuestions = await tx.examQuestion.findMany({
                where: { examId: id },
                include: {
                    question: true,
                    questionVersion: true,
                },
                orderBy: { orderIndex: 'asc' },
            });
            if (!examQuestions || examQuestions.length === 0) {
                throw new common_1.BadRequestException('Cannot publish exam without questions');
            }
            const examSnapshot = await tx.examSnapshot.create({
                data: {
                    examId: id,
                    title: exam.title,
                    payload: {
                        ...(this.parseRawJson(exam.settings) || {}),
                        timeLimitMinutes: exam.timeLimitMinutes ?? null,
                        maxAttempts: exam.maxAttempts ?? null,
                        gradingStrategy: exam.gradingStrategy ?? null,
                        reviewSettings: exam.reviewSettings ?? null,
                        questionSelectionConfig: exam.questionSelectionConfig ?? null,
                    },
                    createdBy: exam.creatorId,
                    publishedAt: new Date(),
                },
            });
            for (const eq of examQuestions) {
                let questionVersionId = eq.questionVersionId;
                if (!questionVersionId) {
                    const latest = await tx.questionVersion.findFirst({
                        where: { questionId: eq.questionId },
                        orderBy: { versionNo: 'desc' },
                    });
                    if (!latest) {
                        throw new common_1.BadRequestException(`Missing version for question ${eq.questionId}`);
                    }
                    questionVersionId = latest.id;
                }
                const questionVersion = eq.questionVersion && eq.questionVersion.id === questionVersionId
                    ? eq.questionVersion
                    : await tx.questionVersion.findUnique({ where: { id: questionVersionId } });
                if (!questionVersion) {
                    throw new common_1.BadRequestException(`Missing version for question ${eq.questionId}`);
                }
                const snapshotPayload = this.buildQuestionSnapshotPayload(eq, questionVersion);
                const assignedScore = Number(snapshotPayload.assignedScore || 1);
                const qSnapshot = await tx.questionSnapshot.create({
                    data: {
                        originalQuestionId: eq.questionId,
                        questionVersionId: questionVersionId,
                        payload: snapshotPayload,
                    },
                });
                await tx.examQuestionSnapshot.create({
                    data: {
                        examSnapshotId: examSnapshot.id,
                        questionId: eq.questionId,
                        questionVersionId: questionVersionId,
                        questionSnapshotId: qSnapshot.id,
                        orderIndex: eq.orderIndex,
                        points: Math.max(1, Math.round(assignedScore)),
                        assignedScore,
                        payload: snapshotPayload,
                    },
                });
            }
            const updated = await tx.exam.update({ where: { id }, data: { status: 'PUBLISHED' } });
            return updated;
        });
        try {
            const fullExam = await this.prisma.exam.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    endTime: true,
                    course: { select: { id: true, code: true } },
                },
            });
            if (fullExam) {
                const studentIds = await this.getCourseRecipientIds(fullExam.course.id);
                await this.notificationsService.createForUsers(studentIds, {
                    kind: 'EXAM_PUBLISHED',
                    title: 'Exam published',
                    message: `Exam \"${fullExam.title}\" is now open${fullExam.endTime ? ` until ${fullExam.endTime.toISOString()}` : ''}.`,
                    link: '/student/exams',
                    priority: 'high',
                    metadata: { examId: fullExam.id, courseId: fullExam.course.id },
                });
                await this.notificationsService.createForRole('ADMIN', {
                    kind: 'EXAM_PUBLISHED',
                    title: 'Exam published',
                    message: `Exam \"${fullExam.title}\" (${fullExam.course.code}) has been published.`,
                    link: '/admin',
                    priority: 'normal',
                    metadata: { examId: fullExam.id, courseId: fullExam.course.id },
                });
            }
        }
        catch {
        }
        return publishedExam;
    }
    async getAvailableExamsForStudent(studentId) {
        const enrollments = await this.prisma.enrollment.findMany({
            where: {
                studentId,
                status: 'active',
            },
            select: {
                courseId: true,
            },
        });
        const courseIds = enrollments.map((e) => e.courseId);
        const now = new Date();
        const exams = await this.prisma.exam.findMany({
            where: {
                courseId: { in: courseIds },
                status: { in: ['PUBLISHED', 'ONGOING'] },
                OR: [
                    { startTime: null },
                    { startTime: { lte: now } },
                ],
                AND: [
                    {
                        OR: [
                            { endTime: null },
                            { endTime: { gte: now } },
                        ],
                    },
                ],
            },
            include: {
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        examQuestions: true,
                    },
                },
            },
            orderBy: { startTime: 'asc' },
        });
        return exams.filter((exam) => {
            const allowLateSubmission = Boolean(exam.settings?.allowLateSubmission);
            if (allowLateSubmission)
                return true;
            if (!exam.endTime)
                return true;
            return exam.endTime >= now;
        });
    }
    async getCourseExamsForStudent(studentId, courseId) {
        const enrollment = await this.prisma.enrollment.findFirst({
            where: {
                studentId,
                courseId,
                status: 'active',
            },
            select: { id: true },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You are not enrolled in this course');
        }
        return this.prisma.exam.findMany({
            where: {
                courseId,
                status: { in: ['PUBLISHED', 'ONGOING', 'COMPLETED'] },
            },
            select: {
                id: true,
                title: true,
                status: true,
                startTime: true,
                endTime: true,
                duration: true,
                totalPoints: true,
                passingScore: true,
                maxAttempts: true,
                settings: true,
                course: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
            orderBy: [{ startTime: 'asc' }, { title: 'asc' }],
        });
    }
    async getExamStats(examId) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            include: {
                submissions: {
                    select: {
                        studentId: true,
                        score: true,
                        status: true,
                        submittedAt: true,
                        createdAt: true,
                    },
                },
                _count: {
                    select: {
                        examQuestions: true,
                        submissions: true,
                    },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const isUnlimited = exam.maxAttempts === null || exam.maxAttempts === undefined;
        const scopedSubmissions = isUnlimited
            ? this.collapseLatestCompletedSubmissions(exam.submissions.filter((s) => s.status === 'GRADED'))
            : exam.submissions.filter((s) => s.status === 'GRADED');
        const scores = scopedSubmissions.map((s) => s.score || 0);
        return {
            analyticsScope: isUnlimited ? 'PRACTICE' : 'OFFICIAL',
            isUnlimited,
            totalQuestions: exam._count.examQuestions,
            totalSubmissions: exam._count.submissions,
            analyzedSubmissions: scopedSubmissions.length,
            completedSubmissions: scopedSubmissions.length,
            averageScore: scores.length > 0
                ? scores.reduce((a, b) => a + b, 0) / scores.length
                : 0,
            highestScore: scores.length > 0 ? Math.max(...scores) : 0,
            lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
            passRate: exam.passingScore && scores.length > 0
                ? (scores.filter((s) => s >= exam.passingScore).length / scores.length) * 100
                : 0,
        };
    }
    collapseLatestCompletedSubmissions(submissions) {
        const buckets = new Map();
        for (const submission of submissions) {
            const key = submission.studentId || submission.id;
            const prev = buckets.get(key);
            const prevTime = prev ? new Date(prev.submittedAt || prev.createdAt || 0).getTime() : -1;
            const nextTime = new Date(submission.submittedAt || submission.createdAt || 0).getTime();
            if (!prev || nextTime >= prevTime) {
                buckets.set(key, submission);
            }
        }
        return Array.from(buckets.values());
    }
    normalizeQuestionType(rawType) {
        if (!rawType)
            return undefined;
        const map = {
            MIXED: '',
            CUSTOM: '',
            MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
            SINGLE_CHOICE: 'MULTIPLE_CHOICE',
            'SINGLE-CHOICE': 'MULTIPLE_CHOICE',
            'MULTIPLE-CHOICE': 'MULTIPLE_CHOICE',
            MULTI_SELECT: 'MULTI_SELECT',
            TRUE_FALSE: 'TRUE_FALSE',
            'TRUE-FALSE': 'TRUE_FALSE',
            SHORT_ANSWER: 'SHORT_ANSWER',
            'SHORT-ANSWER': 'SHORT_ANSWER',
            ESSAY: 'ESSAY',
            FILL_IN_BLANK: 'FILL_IN_BLANK',
            'FILL-BLANK': 'FILL_IN_BLANK',
            MATCHING: 'MATCHING',
            ORDERING: 'ORDERING',
        };
        const normalized = map[String(rawType).trim().toUpperCase()];
        return normalized || undefined;
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        access_policy_service_1.AccessPolicyService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map