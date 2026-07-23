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
exports.SubmissionsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const prisma_service_1 = require("../prisma/prisma.service");
const access_policy_service_1 = require("../common/services/access-policy.service");
const pagination_dto_1 = require("../common/dto/pagination.dto");
const submissions_events_service_1 = require("./submissions-events.service");
const notifications_service_1 = require("../notifications/notifications.service");
const queue_service_1 = require("../queue/queue.service");
const AUTO_GRADED_TYPES = new Set(['MULTIPLE_CHOICE', 'MULTI_SELECT', 'TRUE_FALSE']);
let SubmissionsService = class SubmissionsService {
    constructor(prisma, submissionsEvents, notificationsService, accessPolicy, queueService) {
        this.prisma = prisma;
        this.submissionsEvents = submissionsEvents;
        this.notificationsService = notificationsService;
        this.accessPolicy = accessPolicy;
        this.queueService = queueService;
    }
    async getLatestExamSnapshotId(examId) {
        try {
            const latestSnapshot = await this.prisma.examSnapshot.findFirst({
                where: { examId },
                orderBy: { publishedAt: 'desc' },
                select: { id: true },
            });
            return latestSnapshot?.id ?? null;
        }
        catch (error) {
            if (error?.code === 'P2021') {
                return null;
            }
            throw error;
        }
    }
    getRealtimeSeverity(eventType) {
        const e = String(eventType || '').toLowerCase();
        if (e.includes('fullscreen') || e.includes('face'))
            return 'high';
        if (e.includes('tab') || e.includes('paste'))
            return 'medium';
        return 'low';
    }
    clampPercent(value) {
        if (!Number.isFinite(value))
            return 0;
        return Math.max(0, Math.min(100, value));
    }
    seededRandom(seed) {
        let counter = 0;
        return () => {
            const hash = (0, crypto_1.createHash)('sha256')
                .update(seed)
                .update(':')
                .update(String(counter++))
                .digest();
            return hash.readUInt32BE(0) / 0x100000000;
        };
    }
    shuffleWithSeed(items, seed) {
        const result = [...items];
        const random = this.seededRandom(seed);
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
    parseLogDetails(details) {
        if (!details)
            return null;
        try {
            return JSON.parse(details);
        }
        catch {
            return null;
        }
    }
    getIntegrityLogWeight(eventType) {
        const event = String(eventType || '').toLowerCase();
        if (event === 'fullscreen_exit' || event === 'face_not_detected')
            return 25;
        if (['paste', 'copy', 'window_blur', 'tab_switch'].includes(event))
            return 15;
        return 5;
    }
    getIntegrityConfidence(tabSwitchCount, mouseAnomalies, riskScore) {
        if (tabSwitchCount >= 5 || mouseAnomalies >= 8 || riskScore >= 70)
            return 'High';
        if (tabSwitchCount >= 2 || mouseAnomalies >= 3 || riskScore >= 35)
            return 'Medium';
        return 'Low';
    }
    isTimingAnomalyLog(eventType, details) {
        const text = `${eventType || ''} ${details || ''}`.toLowerCase();
        return ['idle', 'rapid', 'time', 'inactive'].some((keyword) => text.includes(keyword));
    }
    buildIntegrityLogReason(eventType, count) {
        const event = String(eventType || '').toLowerCase();
        const labels = {
            paste: 'Paste event detected',
            copy: 'Copy event detected',
            fullscreen_exit: 'Fullscreen exit detected',
            window_blur: 'Window focus loss detected',
            face_not_detected: 'Face not detected event recorded',
        };
        if (!labels[event])
            return null;
        return {
            type: this.isTimingAnomalyLog(event) ? 'timing' : 'behavior',
            description: labels[event],
            weight: Math.min(1, this.getIntegrityLogWeight(event) / 100),
            evidence: `${count} ${count === 1 ? 'event' : 'events'} recorded`,
        };
    }
    publishRealtimeLogs(examId, submissionId, student, logs) {
        const suspiciousTypes = new Set([
            'tab_switch',
            'mouse_anomaly',
            'mouse_idle',
            'copy',
            'paste',
            'fullscreen_exit',
            'window_blur',
            'face_not_detected',
        ]);
        for (const entry of logs || []) {
            const eventType = String(entry?.type || '').toLowerCase();
            if (!suspiciousTypes.has(eventType))
                continue;
            const id = `${submissionId}-${eventType}-${entry?.ts || Date.now()}`;
            this.submissionsEvents.emitIntegrityEvent(examId, {
                id,
                submissionId,
                eventType,
                details: entry?.details ? String(entry.details) : eventType,
                timestamp: new Date(entry?.ts || Date.now()).toISOString(),
                severity: this.getRealtimeSeverity(eventType),
                student,
            });
        }
    }
    async startExam(startExamDto, studentId, context) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: startExamDto.examId },
            include: {
                course: true,
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
        const now = new Date();
        if (exam.startTime && exam.startTime > now) {
            throw new common_1.ForbiddenException('Exam has not started yet');
        }
        const allowLateSubmission = Boolean(exam.settings?.allowLateSubmission);
        if (!allowLateSubmission && exam.endTime && exam.endTime < now) {
            throw new common_1.ForbiddenException('Exam has ended');
        }
        try {
            const clientIp = this.accessPolicy.resolveClientIpFromParts(context?.remoteIp ?? null, context?.forwardedFor ?? null);
            const check = await this.accessPolicy.isIpAllowedForExam(startExamDto.examId, clientIp);
            if (!check.allowed) {
                await this.accessPolicy.logDeniedAccess(startExamDto.examId, {
                    studentId,
                    resolvedClientIp: clientIp,
                    remoteIp: context?.remoteIp ?? null,
                    forwardedFor: context?.forwardedFor ?? null,
                    userAgent: context?.userAgent ?? null,
                    reasonCode: check.reason || 'LAB_IP_DENIED',
                    reasonMessage: 'Access denied by lab IP whitelist',
                    route: 'submissions.startExam',
                });
                throw new common_1.ForbiddenException('Access denied: outside allowed lab network');
            }
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.ForbiddenException('Access restricted by network policy');
        }
        const latestSnapshot = await this.prisma.examSnapshot.findFirst({
            where: { examId: startExamDto.examId },
            orderBy: { publishedAt: 'desc' },
            include: {
                questions: {
                    include: {
                        questionSnapshot: true,
                    },
                    orderBy: { orderIndex: 'asc' },
                },
            },
        });
        if (!latestSnapshot || !Array.isArray(latestSnapshot.questions) || latestSnapshot.questions.length === 0) {
            throw new common_1.ConflictException('Exam snapshot is unavailable. Please ask the instructor to republish the exam.');
        }
        const inProgressSubmission = await this.prisma.examSubmission.findFirst({
            where: {
                examId: startExamDto.examId,
                studentId,
                status: 'IN_PROGRESS',
            },
        });
        if (inProgressSubmission) {
            if (!inProgressSubmission.examSnapshotId) {
                await this.prisma.examSubmission.update({
                    where: { id: inProgressSubmission.id },
                    data: { examSnapshotId: latestSnapshot.id },
                });
            }
            return inProgressSubmission;
        }
        const examSettings = exam.settings || {};
        let snapshotQuestions = Array.isArray(latestSnapshot?.questions)
            ? [...latestSnapshot.questions]
            : [];
        const shouldShuffleQuestions = Boolean(examSettings?.shuffleQuestions ||
            examSettings?.questionSelectionConfig?.shuffleQuestions);
        const randomizationSeed = (0, crypto_1.randomUUID)();
        if (shouldShuffleQuestions) {
            snapshotQuestions = this.shuffleWithSeed(snapshotQuestions, `${randomizationSeed}:questions`);
        }
        const mappedSnapshotQuestions = this.mapSnapshotQuestions(snapshotQuestions);
        const snapshotPayload = {
            examId: exam.id,
            examSnapshotId: latestSnapshot.id,
            randomizationSeed,
            timeLimitMinutes: exam.timeLimitMinutes ?? exam.duration,
            maxAttempts: exam.maxAttempts ?? (examSettings?.maxAttempts !== undefined && examSettings?.maxAttempts !== null
                ? Number(examSettings.maxAttempts)
                : null),
            gradingStrategy: exam.gradingStrategy ?? examSettings?.gradingStrategy ?? 'HIGHEST',
            reviewSettings: exam.reviewSettings ?? examSettings?.reviewSettings ?? null,
            questionSelectionConfig: exam.questionSelectionConfig ?? examSettings?.questionSelectionConfig ?? null,
            questions: mappedSnapshotQuestions.map((item) => ({
                questionId: item.questionId,
                questionVersionId: item.questionVersionId ?? null,
                questionSnapshotId: item.questionSnapshotId ?? null,
                orderIndex: item.orderIndex,
                type: item.type,
                stem: item.stem,
                answerKey: item.answerKey,
                assignedScore: item.assignedScore,
            })),
        };
        const existingExamInstance = await this.prisma.examInstance.findUnique({
            where: {
                examId_studentId: {
                    examId: startExamDto.examId,
                    studentId,
                },
            },
        });
        const resolvedClientIp = typeof context?.remoteIp !== 'undefined' || typeof context?.forwardedFor !== 'undefined'
            ? this.accessPolicy.resolveClientIpFromParts(context?.remoteIp ?? null, context?.forwardedFor ?? null)
            : null;
        const examInstance = existingExamInstance
            ? await this.prisma.examInstance.update({
                where: { id: existingExamInstance.id },
                data: {
                    examSnapshotId: latestSnapshot.id,
                    snapshotPayload,
                    randomizationSeed,
                    questionOrder: mappedSnapshotQuestions.map((item) => item.questionSnapshotId ?? item.questionId),
                    status: 'IN_PROGRESS',
                    lastActivityAt: now,
                    ipAddress: resolvedClientIp ?? undefined,
                    userAgent: context?.userAgent ?? undefined,
                },
            })
            : await this.prisma.examInstance.create({
                data: {
                    examId: startExamDto.examId,
                    studentId,
                    examSnapshotId: latestSnapshot.id,
                    snapshotPayload,
                    randomizationSeed,
                    questionOrder: mappedSnapshotQuestions.map((item) => item.questionSnapshotId ?? item.questionId),
                    status: 'IN_PROGRESS',
                    startedAt: now,
                    lastActivityAt: now,
                    ipAddress: resolvedClientIp,
                    userAgent: context?.userAgent ?? null,
                },
            });
        const configuredMaxAttempts = exam.maxAttempts ??
            (examSettings?.maxAttempts !== undefined && examSettings?.maxAttempts !== null
                ? Number(examSettings.maxAttempts)
                : null);
        const maxAttempts = configuredMaxAttempts === null || configuredMaxAttempts === undefined
            ? null
            : Math.max(1, Math.floor(Number(configuredMaxAttempts)));
        const completedSubmissions = await this.prisma.examSubmission.findMany({
            where: {
                examId: startExamDto.examId,
                studentId,
                status: { in: ['SUBMITTED', 'GRADED', 'FLAGGED'] },
            },
            select: { attemptNo: true },
            orderBy: { attemptNo: 'desc' },
            take: 1,
        });
        const lastAttemptNo = completedSubmissions[0]?.attemptNo || 0;
        const nextAttemptNo = lastAttemptNo + 1;
        if (maxAttempts !== null && nextAttemptNo > maxAttempts) {
            throw new common_1.ConflictException(`Attempt limit reached (${lastAttemptNo}/${maxAttempts}).`);
        }
        const startedSubmission = await this.prisma.examSubmission.create({
            data: {
                examId: startExamDto.examId,
                studentId,
                attemptNo: nextAttemptNo,
                status: 'IN_PROGRESS',
                startedAt: now,
                examSnapshotId: latestSnapshot.id,
                examInstanceId: examInstance.id,
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        duration: true,
                    },
                },
            },
        }).catch((err) => {
            if (err.code === 'P2002' && err.meta?.target?.includes('unq_exam_student_attempt')) {
                return this.prisma.examSubmission.findFirst({
                    where: {
                        examId: startExamDto.examId,
                        studentId,
                        attemptNo: nextAttemptNo,
                    },
                    include: {
                        exam: {
                            select: {
                                id: true,
                                title: true,
                                duration: true,
                            },
                        },
                    },
                });
            }
            throw err;
        });
        if (!startedSubmission) {
            throw new common_1.ConflictException('Failed to create exam submission');
        }
        try {
            await this.prisma.proctoringSession.create({
                data: {
                    submissionId: startedSubmission.id,
                    ipAddress: typeof context?.remoteIp !== 'undefined' || typeof context?.forwardedFor !== 'undefined'
                        ? this.accessPolicy.resolveClientIpFromParts(context?.remoteIp ?? null, context?.forwardedFor ?? null)
                        : null,
                },
            });
        }
        catch (e) {
        }
        try {
            await this.notificationsService.create({
                recipientId: studentId,
                kind: 'EXAM_SESSION_STARTED',
                title: 'Exam session started',
                message: `You started ${startedSubmission.exam.title}.`,
                link: `/student/exam-ready?examId=${startedSubmission.exam.id}`,
                priority: 'low',
                metadata: { submissionId: startedSubmission.id, examId: startedSubmission.exam.id },
            });
        }
        catch {
        }
        return startedSubmission;
    }
    async submitExam(submissionId, submitExamDto, studentId, options) {
        const idempotencyKey = options?.idempotencyKey?.trim() || null;
        const now = new Date();
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                examId: true,
                studentId: true,
                status: true,
                attemptNo: true,
                version: true,
                submittedAt: true,
                gradedAt: true,
                score: true,
                examInstanceId: true,
                examSnapshotId: true,
                submitIdempotencyKey: true,
                submitLockedAt: true,
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                    },
                },
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        if (submission.studentId !== studentId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (submission.status === 'SUBMITTED' || submission.status === 'GRADED') {
            if (idempotencyKey && submission.submitIdempotencyKey === idempotencyKey) {
                return this.buildSubmitResponse(submission, true);
            }
            throw new common_1.BadRequestException('Exam already submitted');
        }
        if (submission.status === 'SUBMITTING') {
            throw new common_1.ConflictException('Submission is being finalized');
        }
        const logs = submitExamDto.logs || [];
        if (logs.length > 1000) {
            throw new common_1.BadRequestException('Too many log entries');
        }
        let totalLogChars = 0;
        for (const l of logs) {
            const detailsStr = l.details ? String(l.details) : '';
            totalLogChars += detailsStr.length;
            if (detailsStr.length > 2000) {
                throw new common_1.BadRequestException('Log entry too large');
            }
        }
        if (totalLogChars > 200000) {
            throw new common_1.BadRequestException('Proctoring logs payload too large');
        }
        const answers = (submitExamDto.answers || []).slice(0, 1000);
        const result = await this.prisma.$transaction(async (tx) => {
            const locked = await tx.examSubmission.updateMany({
                where: {
                    id: submissionId,
                    studentId,
                    status: 'IN_PROGRESS',
                },
                data: {
                    status: 'SUBMITTING',
                    submitLockedAt: now,
                    submitIdempotencyKey: idempotencyKey ?? undefined,
                    lastActivityAt: now,
                    version: { increment: 1 },
                },
            });
            if (locked.count === 0) {
                const current = await tx.examSubmission.findUnique({
                    where: { id: submissionId },
                    select: {
                        id: true,
                        status: true,
                        attemptNo: true,
                        submittedAt: true,
                        gradedAt: true,
                        score: true,
                        version: true,
                        submitIdempotencyKey: true,
                        studentId: true,
                    },
                });
                if (!current) {
                    throw new common_1.NotFoundException('Submission not found');
                }
                if (current.studentId !== studentId) {
                    throw new common_1.ForbiddenException('Not authorized');
                }
                if ((current.status === 'SUBMITTED' || current.status === 'GRADED') && idempotencyKey && current.submitIdempotencyKey === idempotencyKey) {
                    return this.buildSubmitResponse({
                        ...submission,
                        status: current.status,
                        submittedAt: current.submittedAt,
                        gradedAt: current.gradedAt,
                        score: current.score,
                        version: current.version,
                        submitIdempotencyKey: current.submitIdempotencyKey,
                    }, true);
                }
                if (current.status === 'SUBMITTING') {
                    throw new common_1.ConflictException('Submission is being finalized');
                }
                throw new common_1.BadRequestException('Exam already submitted');
            }
            const lockedSubmission = await tx.examSubmission.findUnique({
                where: { id: submissionId },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            studentId: true,
                        },
                    },
                    exam: {
                        select: {
                            id: true,
                            title: true,
                        },
                    },
                    examSnapshot: {
                        include: {
                            questions: {
                                include: {
                                    questionSnapshot: true,
                                },
                                orderBy: { orderIndex: 'asc' },
                            },
                        },
                    },
                    answers: {
                        select: {
                            questionId: true,
                            sequence: true,
                            clientBatchId: true,
                            serverVersion: true,
                        },
                    },
                },
            });
            if (!lockedSubmission) {
                throw new common_1.NotFoundException('Submission not found');
            }
            const examQuestions = this.mapSnapshotQuestions(lockedSubmission.examSnapshot?.questions || []);
            if (!lockedSubmission.examSnapshotId || examQuestions.length === 0) {
                throw new common_1.ConflictException('Submission snapshot is unavailable. Please restart the exam from a valid published snapshot.');
            }
            const validQuestions = new Map(examQuestions.map((eq) => [eq.questionId, eq]));
            const answerMetaByQuestionId = new Map((lockedSubmission.answers || []).map((answer) => [answer.questionId, answer]));
            const normalizedAnswers = answers.filter((answer) => validQuestions.has(answer.questionId));
            const finalAnswerRows = normalizedAnswers.map((answerDto) => {
                const examQuestion = validQuestions.get(answerDto.questionId);
                const answerMeta = answerMetaByQuestionId.get(answerDto.questionId);
                let pointsAwarded = 0;
                let isCorrect = false;
                if (AUTO_GRADED_TYPES.has(examQuestion.type)) {
                    const correctAnswer = examQuestion.answerKey ?? null;
                    if (correctAnswer && this.compareAnswers(answerDto.answer, correctAnswer)) {
                        pointsAwarded = examQuestion.assignedScore;
                        isCorrect = true;
                    }
                }
                return {
                    submissionId,
                    questionId: answerDto.questionId,
                    questionVersionId: examQuestion.questionVersionId,
                    questionSnapshotId: examQuestion.questionSnapshotId,
                    sequence: Number(answerMeta?.sequence || 1),
                    clientBatchId: answerMeta?.clientBatchId || null,
                    serverVersion: Number(answerMeta?.serverVersion || 0),
                    answer: answerDto.answer,
                    timeTaken: answerDto.timeTaken,
                    isCorrect,
                    pointsAwarded,
                };
            });
            const totalScore = finalAnswerRows.reduce((sum, row) => sum + Number(row.pointsAwarded || 0), 0);
            const maxRawScore = examQuestions.reduce((sum, eq) => sum + Number(eq.assignedScore || 0), 0);
            const normalizedScore = this.normalizeScore(totalScore, maxRawScore);
            const hasManualGrading = examQuestions.some((eq) => !AUTO_GRADED_TYPES.has(eq.type));
            await tx.submissionAnswer.deleteMany({
                where: { submissionId },
            });
            if (finalAnswerRows.length > 0) {
                await tx.submissionAnswer.createMany({
                    data: finalAnswerRows,
                });
            }
            const answeredByVersionId = new Map();
            const finalAnswerByQuestionId = new Map(finalAnswerRows.map((row) => [row.questionId, row]));
            for (const examQuestion of examQuestions) {
                const versionId = examQuestion.questionVersionId ||
                    null;
                if (!versionId)
                    continue;
                const answerRow = finalAnswerByQuestionId.get(examQuestion.questionId);
                const bucket = answeredByVersionId.get(versionId) || { correct: 0, incorrect: 0, skipped: 0 };
                if (!answerRow) {
                    bucket.skipped += 1;
                }
                else if (answerRow.isCorrect) {
                    bucket.correct += 1;
                }
                else {
                    bucket.incorrect += 1;
                }
                answeredByVersionId.set(versionId, bucket);
            }
            for (const examQuestion of examQuestions) {
                const versionId = examQuestion.questionVersionId ||
                    null;
                if (!versionId)
                    continue;
                const bucket = answeredByVersionId.get(versionId) || { correct: 0, incorrect: 0, skipped: 1 };
                const versionTotal = bucket.correct + bucket.incorrect + bucket.skipped;
                const pValue = versionTotal > 0 ? bucket.correct / versionTotal : 0;
                const difficultyIndex = versionTotal > 0 ? 1 - pValue : 0;
                const discriminationIndex = versionTotal > 0
                    ? Math.max(-1, Math.min(1, (bucket.correct - bucket.incorrect) / versionTotal))
                    : null;
                await tx.questionStatistics.upsert({
                    where: { questionVersionId: versionId },
                    create: {
                        questionVersionId: versionId,
                        questionId: examQuestion.questionId,
                        totalAttempts: versionTotal,
                        correctAttempts: bucket.correct,
                        incorrectAttempts: bucket.incorrect,
                        skippedAttempts: bucket.skipped,
                        pValue,
                        difficultyIndex,
                        discriminationIndex,
                        lastRecomputedAt: now,
                    },
                    update: {
                        totalAttempts: { increment: versionTotal },
                        correctAttempts: { increment: bucket.correct },
                        incorrectAttempts: { increment: bucket.incorrect },
                        skippedAttempts: { increment: bucket.skipped },
                        pValue,
                        difficultyIndex,
                        discriminationIndex,
                        lastRecomputedAt: now,
                    },
                });
            }
            if (logs.length > 0) {
                const tabSwitchCount = logs.filter((x) => String(x.type).toLowerCase() === 'tab_switch').length;
                const mouseAnomalies = logs.filter((x) => String(x.type).toLowerCase() === 'mouse_anomaly').length;
                const proctoringSession = await tx.proctoringSession.upsert({
                    where: { submissionId },
                    create: {
                        submissionId,
                        tabSwitchCount,
                        mouseAnomalies,
                    },
                    update: {
                        tabSwitchCount: { increment: tabSwitchCount },
                        mouseAnomalies: { increment: mouseAnomalies },
                    },
                });
                const integrityRows = logs.map((log) => ({
                    proctoringId: proctoringSession.id,
                    eventType: String(log.type).slice(0, 100),
                    details: log.details ? String(log.details).slice(0, 2000) : undefined,
                    timestamp: log.ts ? new Date(log.ts) : now,
                }));
                if (integrityRows.length > 0) {
                    await tx.integrityLog.createMany({ data: integrityRows });
                }
            }
            const updatedSubmission = await tx.examSubmission.update({
                where: { id: submissionId },
                data: {
                    status: hasManualGrading ? 'SUBMITTED' : 'GRADED',
                    submittedAt: now,
                    gradedAt: hasManualGrading ? null : now,
                    score: normalizedScore,
                    finalSnapshotVersion: lockedSubmission.version,
                    lastActivityAt: now,
                    version: { increment: 1 },
                },
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            studentId: true,
                        },
                    },
                    exam: {
                        select: {
                            id: true,
                            title: true,
                            totalPoints: true,
                        },
                    },
                    answers: {
                        include: {
                            question: {
                                select: {
                                    id: true,
                                    type: true,
                                    content: true,
                                },
                            },
                        },
                    },
                },
            });
            if (submission.examInstanceId) {
                await tx.examInstance.update({
                    where: { id: submission.examInstanceId },
                    data: {
                        status: hasManualGrading ? 'SUBMITTED' : 'GRADED',
                        submittedAt: now,
                        rawScore: totalScore,
                        maxRawScore,
                        normalizedScore,
                        lastActivityAt: now,
                    },
                });
            }
            return {
                submission: updatedSubmission,
                totalScore,
                maxRawScore,
                normalizedScore,
                hasManualGrading,
            };
        });
        if (logs.length > 0) {
            this.publishRealtimeLogs(submission.examId, submission.id, {
                id: submission.student?.id,
                fullName: submission.student?.fullName,
                studentId: submission.student?.studentId,
            }, logs);
        }
        this.sendIntegrityNotifications(submissionId, studentId).catch((err) => {
            console.error('Failed to send notifications:', err);
        });
        return {
            ...this.buildSubmitResponse(result.submission, false),
            rawScore: result.totalScore,
            normalizedScore: result.normalizedScore,
            maxRawScore: result.maxRawScore,
        };
    }
    async autosaveAnswers(submissionId, payload, studentId) {
        const answers = Array.isArray(payload?.answers) ? payload.answers : [];
        const clientBatchId = String(payload?.clientBatchId || '').trim() || null;
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                studentId: true,
                status: true,
                version: true,
                examSnapshotId: true,
                exam: {
                    select: {
                        id: true,
                        examQuestions: {
                            select: {
                                questionId: true,
                                questionVersionId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        if (submission.studentId !== studentId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        if (submission.status !== 'IN_PROGRESS') {
            throw new common_1.BadRequestException('Exam already submitted, cannot autosave');
        }
        const validQuestionIds = new Set(submission.exam.examQuestions.map((eq) => eq.questionId));
        const versionByQuestionId = new Map(submission.exam.examQuestions.map((eq) => [eq.questionId, eq.questionVersionId || null]));
        const normalizedAnswers = new Map();
        for (const answer of answers.slice(0, 500)) {
            if (!answer || !validQuestionIds.has(answer.questionId))
                continue;
            const sequence = Number(answer.sequence || 0);
            if (!Number.isInteger(sequence) || sequence < 1)
                continue;
            const current = normalizedAnswers.get(answer.questionId);
            if (!current || sequence > current.sequence) {
                normalizedAnswers.set(answer.questionId, {
                    questionId: answer.questionId,
                    sequence,
                    answer: answer.answer,
                    timeTaken: answer.timeTaken,
                });
            }
        }
        if (normalizedAnswers.size === 0) {
            return { success: true, count: 0, skipped: answers.length, serverVersion: submission.version || 0 };
        }
        try {
            const overloaded = await this.queueService.isQueueOverloaded('integrity-logs', Number(process.env.QUEUE_WAITING_THRESHOLD_AUTOSAVE || '1000'));
            if (overloaded) {
                return { success: false, count: 0, skipped: answers.length, serverVersion: submission.version || 0 };
            }
        }
        catch (err) {
        }
        const incomingQuestionIds = Array.from(normalizedAnswers.keys());
        if (incomingQuestionIds.length === 0) {
            return { success: true, count: 0, skipped: answers.length, serverVersion: submission.version || 0 };
        }
        const now = new Date();
        const result = await this.prisma.$transaction(async (tx) => {
            const locked = await tx.examSubmission.updateMany({
                where: {
                    id: submissionId,
                    studentId,
                    status: 'IN_PROGRESS',
                },
                data: {
                    lastActivityAt: now,
                },
            });
            if (locked.count === 0) {
                throw new common_1.BadRequestException('Exam already submitted, cannot autosave');
            }
            const currentSubmission = await tx.examSubmission.findUnique({
                where: { id: submissionId },
                select: { version: true, status: true },
            });
            if (!currentSubmission || currentSubmission.status !== 'IN_PROGRESS') {
                throw new common_1.BadRequestException('Exam already submitted, cannot autosave');
            }
            const existingAnswers = await tx.submissionAnswer.findMany({
                where: {
                    submissionId,
                    questionId: { in: incomingQuestionIds },
                },
                select: {
                    id: true,
                    questionId: true,
                    sequence: true,
                },
            });
            const questionSnapshotByQuestionId = new Map();
            if (submission.examSnapshotId) {
                const eqSnapshots = await tx.examQuestionSnapshot.findMany({
                    where: { examSnapshotId: submission.examSnapshotId, questionId: { in: incomingQuestionIds } },
                    select: { questionId: true, questionSnapshotId: true },
                });
                for (const r of eqSnapshots)
                    questionSnapshotByQuestionId.set(r.questionId, r.questionSnapshotId || null);
            }
            const existingByQuestionId = new Map(existingAnswers.map((row) => [row.questionId, row]));
            const changedAnswers = Array.from(normalizedAnswers.values()).filter((answer) => {
                const existing = existingByQuestionId.get(answer.questionId);
                return !existing || answer.sequence > existing.sequence;
            });
            if (changedAnswers.length === 0) {
                return {
                    success: true,
                    count: 0,
                    skipped: normalizedAnswers.size,
                    serverVersion: Number(currentSubmission.version || 0),
                };
            }
            const serverVersion = Number(currentSubmission.version || 0) + 1;
            let savedCount = 0;
            for (const answer of changedAnswers) {
                const existing = existingByQuestionId.get(answer.questionId);
                const data = {
                    answer: answer.answer,
                    timeTaken: answer.timeTaken,
                    sequence: answer.sequence,
                    clientBatchId,
                    serverVersion,
                };
                if (existing) {
                    await tx.submissionAnswer.update({
                        where: { id: existing.id },
                        data,
                    });
                }
                else {
                    const qSnapshotId = questionSnapshotByQuestionId.get(answer.questionId) || null;
                    await tx.submissionAnswer.create({
                        data: {
                            submissionId,
                            questionId: answer.questionId,
                            questionVersionId: versionByQuestionId.get(answer.questionId) || null,
                            questionSnapshotId: qSnapshotId,
                            answer: answer.answer,
                            timeTaken: answer.timeTaken,
                            sequence: answer.sequence,
                            clientBatchId,
                            serverVersion,
                        },
                    });
                }
                savedCount += 1;
            }
            await tx.examSubmission.update({
                where: { id: submissionId },
                data: {
                    version: { increment: 1 },
                    lastAutosaveAt: now,
                    lastActivityAt: now,
                },
            });
            return {
                success: true,
                count: savedCount,
                skipped: normalizedAnswers.size - savedCount,
                serverVersion,
            };
        });
        return result;
    }
    async addLogs(submissionId, logs, studentId) {
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        if (submission.studentId !== studentId) {
            throw new common_1.ForbiddenException('Not authorized');
        }
        const entries = logs || [];
        if (entries.length > 1000) {
            throw new common_1.BadRequestException('Too many log entries');
        }
        let totalLogChars = 0;
        for (const l of entries) {
            const detailsStr = l.details ? String(l.details) : '';
            totalLogChars += detailsStr.length;
            if (detailsStr.length > 2000) {
                throw new common_1.BadRequestException('Log entry too large');
            }
        }
        if (totalLogChars > 200000) {
            throw new common_1.BadRequestException('Proctoring logs payload too large');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const tabSwitchCount = entries.filter((x) => String(x.type).toLowerCase() === 'tab_switch').length;
            const mouseAnomalies = entries.filter((x) => String(x.type).toLowerCase() === 'mouse_anomaly').length;
            const proctoringSession = await tx.proctoringSession.upsert({
                where: { submissionId },
                create: {
                    submissionId,
                    tabSwitchCount,
                    mouseAnomalies,
                },
                update: {
                    tabSwitchCount: { increment: tabSwitchCount },
                    mouseAnomalies: { increment: mouseAnomalies },
                },
            });
            const proctoringId = proctoringSession.id;
            const createLogs = entries.map((l) => ({
                proctoringId,
                eventType: String(l.type).slice(0, 100),
                details: l.details ? String(l.details).slice(0, 2000) : undefined,
                timestamp: l.ts ? new Date(l.ts) : new Date(),
            }));
            if (createLogs.length > 0) {
                await tx.integrityLog.createMany({ data: createLogs });
            }
            return { success: true };
        });
        if (entries.length > 0) {
            this.publishRealtimeLogs(submission.examId, submission.id, {
                id: submission.student?.id,
                fullName: submission.student?.fullName,
                studentId: submission.student?.studentId,
            }, entries);
        }
        this.sendIntegrityNotifications(submissionId, studentId).catch((err) => {
            console.error('Failed to send notifications:', err);
        });
        return result;
    }
    async sendIntegrityNotifications(submissionId, studentId) {
        try {
            await this.notificationsService.create({
                recipientId: studentId,
                kind: 'SUBMISSION_RECEIVED',
                title: 'Submission received',
                message: `Your submission for exam has been received.`,
                link: '/student/results',
                priority: 'normal',
                metadata: {
                    submissionId,
                },
            });
            const submissionMeta = await this.prisma.examSubmission.findUnique({
                where: { id: submissionId },
                select: {
                    student: { select: { fullName: true } },
                    exam: {
                        select: {
                            id: true,
                            title: true,
                            creatorId: true,
                        },
                    },
                    proctoring: {
                        select: {
                            tabSwitchCount: true,
                            mouseAnomalies: true,
                        },
                    },
                },
            });
            if (submissionMeta?.exam.creatorId) {
                await this.notificationsService.create({
                    recipientId: submissionMeta.exam.creatorId,
                    kind: 'SUBMISSION_RECEIVED',
                    title: 'New submission received',
                    message: `${submissionMeta.student.fullName} submitted ${submissionMeta.exam.title}.`,
                    link: `/lecturer/exam/${submissionMeta.exam.id}/results`,
                    priority: 'normal',
                    metadata: {
                        submissionId,
                        examId: submissionMeta.exam.id,
                        studentName: submissionMeta.student.fullName,
                    },
                });
                const tabSwitchCount = Number(submissionMeta.proctoring?.tabSwitchCount || 0);
                const mouseAnomalies = Number(submissionMeta.proctoring?.mouseAnomalies || 0);
                if (tabSwitchCount >= 5 || mouseAnomalies >= 8) {
                    await this.notificationsService.createMany([
                        {
                            recipientId: submissionMeta.exam.creatorId,
                            kind: 'INTEGRITY_RISK_DETECTED',
                            title: 'Integrity risk detected',
                            message: `${submissionMeta.student.fullName} has suspicious behavior in ${submissionMeta.exam.title}.`,
                            link: `/lecturer/exam/${submissionMeta.exam.id}/monitor`,
                            priority: 'high',
                            metadata: {
                                submissionId,
                                examId: submissionMeta.exam.id,
                                tabSwitchCount,
                                mouseAnomalies,
                            },
                        },
                    ]);
                    await this.notificationsService.createForRole('ADMIN', {
                        kind: 'INTEGRITY_RISK_DETECTED',
                        title: 'Integrity risk flagged',
                        message: `Potential integrity risk in exam ${submissionMeta.exam.title}.`,
                        link: '/admin/integrity',
                        priority: 'high',
                        metadata: {
                            submissionId,
                            examId: submissionMeta.exam.id,
                            tabSwitchCount,
                            mouseAnomalies,
                        },
                    });
                }
            }
        }
        catch (err) {
            console.error('Notification error:', err);
        }
    }
    compareAnswers(submitted, correct) {
        if (typeof submitted === 'object' && typeof correct === 'object') {
            return JSON.stringify(submitted) === JSON.stringify(correct);
        }
        return submitted === correct;
    }
    async getIntegrityCases(query = {}) {
        const page = Math.max(1, Number(query.page || 1) || 1);
        const limit = Math.max(1, Math.min(100, Number(query.limit || 10) || 10));
        const search = String(query.search || '').trim().toLowerCase();
        const confidenceFilter = String(query.confidence || 'all').trim();
        const examTitleFilter = String(query.examTitle || '').trim().toLowerCase();
        const statusFilter = String(query.status || 'all').trim().toLowerCase();
        const timeAnomalyFilter = typeof query.timeAnomaly === 'boolean'
            ? query.timeAnomaly
            : typeof query.timeAnomaly === 'string' && query.timeAnomaly.trim()
                ? query.timeAnomaly.toLowerCase() === 'true'
                : undefined;
        const submittedFrom = query.submittedFrom ? new Date(String(query.submittedFrom)) : null;
        const submittedTo = query.submittedTo ? new Date(String(query.submittedTo)) : null;
        if (submittedTo && !Number.isNaN(submittedTo.getTime())) {
            submittedTo.setHours(23, 59, 59, 999);
        }
        const sessions = await this.prisma.proctoringSession.findMany({
            where: {
                OR: [
                    { tabSwitchCount: { gt: 0 } },
                    { mouseAnomalies: { gt: 0 } },
                    { logs: { some: {} } },
                ],
            },
            include: {
                logs: {
                    orderBy: { timestamp: 'desc' },
                    take: 50,
                },
                submission: {
                    select: {
                        id: true,
                        studentId: true,
                        submittedAt: true,
                        startedAt: true,
                        createdAt: true,
                        student: {
                            select: {
                                id: true,
                                fullName: true,
                                studentId: true,
                                email: true,
                            },
                        },
                        exam: {
                            select: {
                                id: true,
                                title: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        const allCases = sessions.map((session) => {
            const tabSwitchCount = Number(session.tabSwitchCount || 0);
            const mouseAnomalies = Number(session.mouseAnomalies || 0);
            const logs = Array.isArray(session.logs) ? session.logs : [];
            const weightedLogScore = logs.reduce((sum, log) => sum + this.getIntegrityLogWeight(log.eventType), 0);
            const riskScore = Math.min(100, tabSwitchCount * 10 + mouseAnomalies * 8 + weightedLogScore);
            const confidence = this.getIntegrityConfidence(tabSwitchCount, mouseAnomalies, riskScore);
            const reasonMap = new Map();
            for (const log of logs) {
                const event = String(log.eventType || '').toLowerCase();
                reasonMap.set(event, (reasonMap.get(event) || 0) + 1);
            }
            const reasons = [];
            if (tabSwitchCount > 0) {
                reasons.push({
                    type: 'behavior',
                    description: 'Tab switching detected',
                    weight: Math.min(1, tabSwitchCount / 10),
                    evidence: `${tabSwitchCount} tab ${tabSwitchCount === 1 ? 'switch' : 'switches'} recorded`,
                });
            }
            if (mouseAnomalies > 0) {
                reasons.push({
                    type: 'behavior',
                    description: 'Mouse anomaly pattern detected',
                    weight: Math.min(1, mouseAnomalies / 10),
                    evidence: `${mouseAnomalies} mouse ${mouseAnomalies === 1 ? 'anomaly' : 'anomalies'} recorded`,
                });
            }
            for (const [event, count] of reasonMap.entries()) {
                const reason = this.buildIntegrityLogReason(event, count);
                if (reason)
                    reasons.push(reason);
            }
            const hasTimingAnomaly = logs.some((log) => this.isTimingAnomalyLog(log.eventType, log.details));
            const submittedAt = session.submission?.submittedAt ||
                session.submission?.startedAt ||
                session.submission?.createdAt ||
                session.createdAt;
            const studentCode = session.submission?.student?.studentId ||
                session.submission?.student?.id ||
                session.submission?.studentId;
            return {
                id: `integrity-${session.submission?.id || session.id}`,
                submissionId: session.submission?.id || '',
                studentId: studentCode || 'N/A',
                studentName: session.submission?.student?.fullName || session.submission?.student?.email || 'Unknown student',
                examId: session.submission?.exam?.id || '',
                examTitle: session.submission?.exam?.title || 'Unknown exam',
                submittedAt: submittedAt ? new Date(submittedAt).toISOString() : new Date().toISOString(),
                confidence,
                status: 'pending',
                reasons: reasons.length
                    ? reasons
                    : [{
                            type: 'behavior',
                            description: 'Integrity event recorded',
                            weight: Math.min(1, riskScore / 100),
                            evidence: `${logs.length} ${logs.length === 1 ? 'event' : 'events'} recorded`,
                        }],
                timeAnomaly: hasTimingAnomaly,
                patternMatch: [],
            };
        });
        const filteredCases = allCases.filter((item) => {
            if (statusFilter && statusFilter !== 'all' && item.status !== statusFilter)
                return false;
            if (confidenceFilter && confidenceFilter !== 'all' && item.confidence !== confidenceFilter)
                return false;
            if (examTitleFilter && !item.examTitle.toLowerCase().includes(examTitleFilter))
                return false;
            if (typeof timeAnomalyFilter === 'boolean' && Boolean(item.timeAnomaly) !== timeAnomalyFilter)
                return false;
            const submittedAt = new Date(item.submittedAt).getTime();
            if (submittedFrom && !Number.isNaN(submittedFrom.getTime()) && submittedAt < submittedFrom.getTime())
                return false;
            if (submittedTo && !Number.isNaN(submittedTo.getTime()) && submittedAt > submittedTo.getTime())
                return false;
            if (search) {
                const haystack = [
                    item.studentName,
                    item.studentId,
                    item.examTitle,
                    item.examId,
                ].join(' ').toLowerCase();
                if (!haystack.includes(search))
                    return false;
            }
            return true;
        });
        const patterns = {
            tabSwitch: 0,
            mouseAnomaly: 0,
            copyPaste: 0,
            otherBehavior: 0,
        };
        for (const item of filteredCases) {
            for (const reason of item.reasons) {
                const text = `${reason.description} ${reason.evidence || ''}`.toLowerCase();
                if (text.includes('tab'))
                    patterns.tabSwitch += 1;
                else if (text.includes('mouse'))
                    patterns.mouseAnomaly += 1;
                else if (text.includes('copy') || text.includes('paste'))
                    patterns.copyPaste += 1;
                else
                    patterns.otherBehavior += 1;
            }
        }
        const total = filteredCases.length;
        const start = (page - 1) * limit;
        return {
            data: filteredCases.slice(start, start + limit),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
            stats: {
                totalFlagged: total,
                pendingReview: filteredCases.filter((item) => item.status === 'pending').length,
                highConfidence: filteredCases.filter((item) => item.confidence === 'High').length,
                confirmedCases: 0,
            },
            patterns,
        };
    }
    buildSubmitResponse(submission, duplicate = false) {
        return {
            submissionId: submission.id,
            status: submission.status,
            attemptNo: submission.attemptNo,
            submittedAt: submission.submittedAt ? submission.submittedAt.toISOString() : null,
            gradedAt: submission.gradedAt ? submission.gradedAt.toISOString() : null,
            score: submission.score ?? null,
            serverVersion: submission.version ?? null,
            duplicate,
            idempotencyKey: submission.submitIdempotencyKey ?? null,
        };
    }
    async gradeAnswer(gradeDto, actor) {
        await this.accessPolicy.assertInstructorCanAccessSubmissionAnswer(gradeDto.submissionAnswerId, actor);
        const updated = await this.prisma.$transaction(async (tx) => {
            const existing = await tx.submissionAnswer.findUnique({
                where: { id: gradeDto.submissionAnswerId },
                select: {
                    id: true,
                    submissionId: true,
                    pointsAwarded: true,
                    feedback: true,
                    question: {
                        select: {
                            points: true,
                            defaultPoints: true,
                        },
                    },
                    questionVersion: {
                        select: {
                            points: true,
                        },
                    },
                },
            });
            if (!existing) {
                throw new common_1.NotFoundException('Answer not found');
            }
            const maxPoints = Number(existing.questionVersion?.points ??
                existing.question.points ??
                existing.question.defaultPoints ??
                1);
            if (gradeDto.pointsAwarded > maxPoints) {
                throw new common_1.BadRequestException(`Points awarded cannot exceed ${maxPoints}`);
            }
            const next = await tx.submissionAnswer.update({
                where: { id: gradeDto.submissionAnswerId },
                data: {
                    pointsAwarded: gradeDto.pointsAwarded,
                    feedback: gradeDto.feedback,
                },
            });
            if (existing.pointsAwarded !== gradeDto.pointsAwarded ||
                String(existing.feedback || '') !== String(gradeDto.feedback || '')) {
                await tx.examSubmissionRegradeLog.create({
                    data: {
                        submissionId: existing.submissionId,
                        submissionAnswerId: existing.id,
                        reviewerId: actor.id,
                        previousPoints: existing.pointsAwarded ?? null,
                        newPoints: gradeDto.pointsAwarded,
                        previousFeedback: existing.feedback ?? null,
                        newFeedback: gradeDto.feedback ?? null,
                        reason: gradeDto.reason || 'Manual regrade',
                    },
                });
            }
            return next;
        });
        return updated;
    }
    async finalizeSubmission(submissionId) {
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: { exam: true },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        await this.prisma.examSubmission.update({
            where: { id: submissionId },
            data: { status: 'FINALIZED' },
        });
        this.notificationsService.notify({
            recipientId: submission.studentId,
            kind: 'submission-finalized',
            title: 'Submission Finalized',
            message: `Your submission for ${submission.exam.title} has been received.`,
            metadata: {
                examId: submission.exam.id,
                status: 'FINALIZED',
                score: submission.score,
            },
        });
    }
    async finalizeGrading(submissionId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessSubmission(submissionId, user);
        }
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        await this.prisma.examSubmission.update({
            where: { id: submissionId },
            data: { status: 'FINALIZED' },
        });
    }
    async findByExam(examId, pagination, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        }
        const where = { examId };
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const [submissions, total] = await Promise.all([
            this.prisma.examSubmission.findMany({
                where,
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            studentId: true,
                        },
                    },
                },
                orderBy: { submittedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.examSubmission.count({ where }),
        ]);
        return (0, pagination_dto_1.buildPaginatedResult)(submissions, total, page, limit);
    }
    async getManualGradingStatus(examId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        }
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: { id: true, title: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const submissions = await this.prisma.examSubmission.findMany({
            where: {
                examId,
                status: { in: ['SUBMITTED', 'GRADED', 'FLAGGED', 'FINALIZED'] },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                        email: true,
                    },
                },
                answers: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                points: true,
                                defaultPoints: true,
                                content: true,
                            },
                        },
                        questionVersion: {
                            select: {
                                id: true,
                                stem: true,
                                points: true,
                            },
                        },
                    },
                },
            },
            orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
        });
        const rows = submissions.map((submission) => {
            const manualAnswers = submission.answers.filter((answer) => !AUTO_GRADED_TYPES.has(String(answer.question?.type || '').toUpperCase()));
            const graded = manualAnswers.filter((answer) => answer.pointsAwarded !== null && answer.pointsAwarded !== undefined);
            return {
                submissionId: submission.id,
                student: submission.student,
                status: submission.status,
                attemptNo: submission.attemptNo,
                submittedAt: submission.submittedAt,
                score: submission.score,
                manualTotal: manualAnswers.length,
                manualGraded: graded.length,
                manualPending: Math.max(0, manualAnswers.length - graded.length),
                completed: manualAnswers.length > 0 && manualAnswers.length === graded.length,
            };
        });
        const manualTotal = rows.reduce((sum, row) => sum + row.manualTotal, 0);
        const manualGraded = rows.reduce((sum, row) => sum + row.manualGraded, 0);
        const published = rows.length > 0 &&
            rows
                .filter((row) => row.manualTotal > 0)
                .every((row) => ['GRADED', 'FINALIZED'].includes(String(row.status).toUpperCase()));
        return {
            exam,
            hasManualGrading: manualTotal > 0,
            manualTotal,
            manualGraded,
            manualPending: Math.max(0, manualTotal - manualGraded),
            published,
            canPublish: manualTotal > 0 && manualTotal === manualGraded && !published,
            submissions: rows,
        };
    }
    async getManualGradingSubmission(submissionId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessSubmission(submissionId, user);
        }
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                        email: true,
                    },
                },
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
                answers: {
                    orderBy: [{ questionId: 'asc' }, { sequence: 'asc' }],
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                points: true,
                                defaultPoints: true,
                            },
                        },
                        questionVersion: {
                            select: {
                                id: true,
                                stem: true,
                                payload: true,
                                points: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        const manualAnswers = submission.answers
            .filter((answer) => !AUTO_GRADED_TYPES.has(String(answer.question?.type || '').toUpperCase()))
            .map((answer) => ({
            id: answer.id,
            questionId: answer.questionId,
            questionType: answer.question?.type,
            questionText: answer.questionVersion?.stem || answer.question?.content || 'Question text unavailable',
            answer: answer.answer,
            pointsAwarded: answer.pointsAwarded,
            maxPoints: Number(answer.questionVersion?.points ?? answer.question?.points ?? answer.question?.defaultPoints ?? 1),
            feedback: answer.feedback || '',
            updatedAt: answer.updatedAt,
        }));
        return {
            ...submission,
            manualAnswers,
            manualTotal: manualAnswers.length,
            manualGraded: manualAnswers.filter((answer) => answer.pointsAwarded !== null && answer.pointsAwarded !== undefined).length,
        };
    }
    async publishExamResults(examId, user) {
        const status = await this.getManualGradingStatus(examId, user);
        if (!status.hasManualGrading) {
            throw new common_1.BadRequestException('This exam does not have manually graded answers.');
        }
        if (!status.canPublish) {
            throw new common_1.BadRequestException('All manually graded answers must be scored before publishing results.');
        }
        const submissionIds = status.submissions.map((row) => row.submissionId);
        const answers = await this.prisma.submissionAnswer.findMany({
            where: { submissionId: { in: submissionIds } },
            select: {
                submissionId: true,
                pointsAwarded: true,
            },
        });
        const submissions = await this.prisma.examSubmission.findMany({
            where: { id: { in: submissionIds } },
            select: {
                id: true,
                examInstanceId: true,
                examSnapshot: {
                    include: {
                        questions: {
                            include: {
                                questionSnapshot: true,
                            },
                        },
                    },
                },
            },
        });
        const scoreBySubmission = new Map();
        for (const answer of answers) {
            scoreBySubmission.set(answer.submissionId, (scoreBySubmission.get(answer.submissionId) || 0) + Number(answer.pointsAwarded || 0));
        }
        const maxRawScoreBySubmission = new Map();
        for (const submission of submissions) {
            const snapshotQuestions = this.mapSnapshotQuestions(submission.examSnapshot?.questions || []);
            const maxRawScore = snapshotQuestions.reduce((sum, question) => sum + Number(question.assignedScore || 0), 0);
            maxRawScoreBySubmission.set(submission.id, maxRawScore);
        }
        const now = new Date();
        await this.prisma.$transaction(submissions.flatMap((submission) => {
            const rawScore = scoreBySubmission.get(submission.id) || 0;
            const maxRawScore = maxRawScoreBySubmission.get(submission.id) || 0;
            const normalizedScore = this.normalizeScore(rawScore, maxRawScore);
            const updates = [
                this.prisma.examSubmission.update({
                    where: { id: submission.id },
                    data: {
                        status: 'GRADED',
                        gradedAt: now,
                        score: normalizedScore,
                    },
                }),
            ];
            if (submission.examInstanceId) {
                updates.push(this.prisma.examInstance.update({
                    where: { id: submission.examInstanceId },
                    data: {
                        status: 'GRADED',
                        rawScore,
                        maxRawScore,
                        normalizedScore,
                        lastActivityAt: now,
                    },
                }));
            }
            return updates;
        }));
        return this.getManualGradingStatus(examId, user);
    }
    parseJsonValue(value, fallback = null) {
        if (value === null || typeof value === 'undefined')
            return fallback;
        if (typeof value === 'object')
            return value;
        try {
            return JSON.parse(String(value));
        }
        catch {
            return fallback;
        }
    }
    toNumber(value, fallback = 0) {
        if (value === null || typeof value === 'undefined')
            return fallback;
        const parsed = Number(typeof value?.toString === 'function' ? value.toString() : value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }
    normalizeScore(rawScore, maxRawScore) {
        if (!Number.isFinite(rawScore) || !Number.isFinite(maxRawScore) || maxRawScore <= 0) {
            return 0;
        }
        return Number(Math.max(0, Math.min(10, (rawScore / maxRawScore) * 10)).toFixed(2));
    }
    mapSnapshotQuestions(snapshotQuestions = []) {
        return snapshotQuestions.map((item) => {
            const payload = this.parseJsonValue(item.payload, {});
            const questionPayload = this.parseJsonValue(item.questionSnapshot?.payload, {});
            const merged = {
                ...payload,
                ...questionPayload,
            };
            const assignedScore = this.toNumber(item.assignedScore ?? merged.assignedScore ?? item.points ?? merged.points, 1);
            return {
                questionId: item.questionId,
                questionVersionId: item.questionVersionId ?? merged.questionVersionId ?? null,
                questionSnapshotId: item.questionSnapshotId ?? item.questionSnapshot?.id ?? null,
                orderIndex: Number(item.orderIndex || 0),
                type: String(merged.type || '').toUpperCase(),
                stem: String(merged.stem || merged.content || ''),
                answerKey: typeof merged.answerKey !== 'undefined'
                    ? merged.answerKey
                    : typeof merged.correctAnswer !== 'undefined'
                        ? merged.correctAnswer
                        : null,
                assignedScore,
            };
        });
    }
    async getExamOverview(examId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        }
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                title: true,
                totalPoints: true,
                status: true,
                startTime: true,
                endTime: true,
                maxAttempts: true,
                settings: true,
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const [submissions, proctoringSessions, integrityLogs] = await Promise.all([
            this.prisma.examSubmission.findMany({
                where: { examId },
                select: {
                    id: true,
                    studentId: true,
                    status: true,
                    score: true,
                    startedAt: true,
                    submittedAt: true,
                    createdAt: true,
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            studentId: true,
                        },
                    },
                },
            }),
            this.prisma.proctoringSession.findMany({
                where: {
                    submission: {
                        examId,
                    },
                },
                select: {
                    id: true,
                    ipAddress: true,
                    tabSwitchCount: true,
                    mouseAnomalies: true,
                    submission: {
                        select: {
                            id: true,
                            student: {
                                select: {
                                    id: true,
                                    fullName: true,
                                    studentId: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.integrityLog.findMany({
                where: {
                    proctoring: {
                        submission: {
                            examId,
                        },
                    },
                },
                orderBy: { timestamp: 'desc' },
                take: 80,
                select: {
                    id: true,
                    eventType: true,
                    details: true,
                    timestamp: true,
                    proctoring: {
                        select: {
                            submission: {
                                select: {
                                    id: true,
                                    student: {
                                        select: {
                                            id: true,
                                            fullName: true,
                                            studentId: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const isUnlimited = this.isUnlimitedAttemptsExam(exam);
        const completed = isUnlimited
            ? this.collapseLatestCompletedSubmissions(submissions.filter((s) => ['SUBMITTED', 'GRADED', 'FLAGGED'].includes(s.status)))
            : submissions.filter((s) => ['SUBMITTED', 'GRADED', 'FLAGGED'].includes(s.status));
        const scoresPct = completed
            .filter((s) => typeof s.score === 'number')
            .map((s) => {
            const scoreValue = Number(s.score || 0);
            if ((exam.totalPoints || 0) > 0) {
                return Math.max(0, Math.min(100, (scoreValue / Number(exam.totalPoints)) * 100));
            }
            return Math.max(0, Math.min(100, scoreValue));
        });
        const bins = [
            { key: '0-20', min: 0, max: 20, count: 0 },
            { key: '21-40', min: 21, max: 40, count: 0 },
            { key: '41-60', min: 41, max: 60, count: 0 },
            { key: '61-80', min: 61, max: 80, count: 0 },
            { key: '81-100', min: 81, max: 100, count: 0 },
        ];
        for (const value of scoresPct) {
            const rounded = Math.round(value);
            const bucket = bins.find((b) => rounded >= b.min && rounded <= b.max);
            if (bucket)
                bucket.count += 1;
        }
        const suspiciousTypes = new Set([
            'tab_switch',
            'mouse_anomaly',
            'mouse_idle',
            'copy',
            'paste',
            'fullscreen_exit',
            'window_blur',
            'face_not_detected',
        ]);
        const mappedLogs = integrityLogs
            .filter((log) => suspiciousTypes.has((log.eventType || '').toLowerCase()))
            .map((log) => {
            const event = (log.eventType || 'unknown').toLowerCase();
            const severity = event.includes('fullscreen') || event.includes('face')
                ? 'high'
                : event.includes('tab') || event.includes('paste')
                    ? 'medium'
                    : 'low';
            return {
                id: log.id,
                eventType: log.eventType,
                details: log.details || '',
                timestamp: log.timestamp,
                severity,
                student: log.proctoring?.submission?.student || null,
                submissionId: log.proctoring?.submission?.id || null,
            };
        });
        const syntheticLogs = proctoringSessions.flatMap((p) => {
            const records = [];
            const tabSwitchCount = Number(p.tabSwitchCount || 0);
            const mouseAnomalies = Number(p.mouseAnomalies || 0);
            if (tabSwitchCount > 0) {
                records.push({
                    id: `tab-${p.id}`,
                    eventType: 'tab_switch',
                    details: `Detected ${tabSwitchCount} tab switches`,
                    timestamp: new Date(),
                    severity: tabSwitchCount >= 5 ? 'high' : 'medium',
                    student: p.submission.student,
                    submissionId: p.submission.id,
                });
            }
            if (mouseAnomalies > 0) {
                records.push({
                    id: `mouse-${p.id}`,
                    eventType: 'mouse_anomaly',
                    details: `Detected ${mouseAnomalies} mouse anomalies`,
                    timestamp: new Date(),
                    severity: mouseAnomalies >= 8 ? 'high' : 'medium',
                    student: p.submission.student,
                    submissionId: p.submission.id,
                });
            }
            return records;
        });
        const anomalies = [...mappedLogs, ...syntheticLogs]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 25);
        return {
            exam,
            analyticsScope: isUnlimited ? 'PRACTICE' : 'OFFICIAL',
            isUnlimited,
            summary: {
                totalSubmissions: submissions.length,
                inProgress: submissions.filter((s) => s.status === 'IN_PROGRESS').length,
                completed: completed.length,
                avgScorePct: scoresPct.length ? Number((scoresPct.reduce((a, b) => a + b, 0) / scoresPct.length).toFixed(1)) : 0,
                highestScorePct: scoresPct.length ? Number(Math.max(...scoresPct).toFixed(1)) : 0,
                lowestScorePct: scoresPct.length ? Number(Math.min(...scoresPct).toFixed(1)) : 0,
            },
            scoreDistribution: bins,
            anomalies,
            updatedAt: new Date().toISOString(),
        };
    }
    async getExamIntelligence(examId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        }
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                title: true,
                courseId: true,
                passingScore: true,
                totalPoints: true,
                maxAttempts: true,
                settings: true,
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const [examQuestionRows, submissions, integrityLogs] = await Promise.all([
            this.prisma.examQuestion.findMany({
                where: { examId },
                orderBy: { orderIndex: 'asc' },
                select: {
                    questionId: true,
                    questionVersionId: true,
                    orderIndex: true,
                    question: {
                        select: {
                            type: true,
                            content: true,
                        },
                    },
                    questionVersion: {
                        select: {
                            stem: true,
                        },
                    },
                },
            }),
            this.prisma.examSubmission.findMany({
                where: { examId },
                select: {
                    id: true,
                    studentId: true,
                    status: true,
                    score: true,
                    submittedAt: true,
                    createdAt: true,
                },
            }),
            this.prisma.integrityLog.findMany({
                where: {
                    proctoring: {
                        submission: {
                            examId,
                        },
                    },
                },
                select: {
                    eventType: true,
                    details: true,
                },
            }),
        ]);
        const examQuestions = examQuestionRows.map((item) => ({
            questionId: item.questionId,
            questionVersionId: item.questionVersionId,
            orderIndex: item.orderIndex,
            questionType: item.question?.type || 'UNKNOWN',
            questionContent: item.questionVersion?.stem || item.question?.content || '',
        }));
        const topicByQuestionId = new Map();
        try {
            const topicRows = await this.prisma.$queryRaw `
        SELECT qt.questionId, t.id AS topicId, t.name AS topicName
        FROM question_topics qt
        INNER JOIN topics t ON t.id = qt.topicId
        WHERE qt.questionId IN (
          SELECT eq.questionId FROM exam_questions eq WHERE eq.examId = ${examId}
        )
      `;
            for (const row of topicRows) {
                if (!topicByQuestionId.has(row.questionId)) {
                    topicByQuestionId.set(row.questionId, { topicId: row.topicId, topicName: row.topicName });
                }
            }
        }
        catch {
        }
        const isUnlimited = this.isUnlimitedAttemptsExam(exam);
        const scopedCompletedSubmissions = isUnlimited
            ? this.collapseLatestCompletedSubmissions(submissions.filter((s) => ['SUBMITTED', 'GRADED', 'FLAGGED'].includes(String(s.status).toUpperCase())))
            : submissions.filter((s) => ['SUBMITTED', 'GRADED', 'FLAGGED'].includes(String(s.status).toUpperCase()));
        const completedSubmissionIds = scopedCompletedSubmissions.map((s) => s.id);
        const answers = completedSubmissionIds.length
            ? await this.prisma.submissionAnswer.findMany({
                where: { submissionId: { in: completedSubmissionIds } },
                select: {
                    questionId: true,
                    questionVersionId: true,
                    isCorrect: true,
                    timeTaken: true,
                },
            })
            : [];
        const questionVersionIds = examQuestions
            .map((eq) => eq.questionVersionId)
            .filter((id) => Boolean(id));
        const statsRows = questionVersionIds.length
            ? await this.prisma.questionStatistics.findMany({
                where: {
                    questionVersionId: {
                        in: questionVersionIds,
                    },
                },
                select: {
                    questionVersionId: true,
                    pValue: true,
                    difficultyIndex: true,
                    discriminationIndex: true,
                    totalAttempts: true,
                    correctAttempts: true,
                    incorrectAttempts: true,
                    skippedAttempts: true,
                },
            })
            : [];
        const statsByVersionId = new Map(statsRows.map((row) => [row.questionVersionId, row]));
        const attemptsPerQuestion = Math.max(1, scopedCompletedSubmissions.length);
        const byQuestion = new Map();
        for (const row of answers) {
            const key = row.questionVersionId || row.questionId;
            const list = byQuestion.get(key) || [];
            list.push({ isCorrect: Boolean(row.isCorrect), timeTaken: row.timeTaken ?? null });
            byQuestion.set(key, list);
        }
        const flaggedByQuestion = new Map();
        for (const log of integrityLogs) {
            const eventType = String(log.eventType || '').toLowerCase();
            if (!eventType.includes('flag'))
                continue;
            const parsed = this.parseLogDetails(log.details);
            const questionId = parsed?.questionId ? String(parsed.questionId) : null;
            if (!questionId)
                continue;
            flaggedByQuestion.set(questionId, (flaggedByQuestion.get(questionId) || 0) + 1);
        }
        const questionMetrics = examQuestions.map((eq) => {
            const metricKey = eq.questionVersionId || eq.questionId;
            const rows = byQuestion.get(metricKey) || [];
            const answeredCount = rows.length;
            const correctCount = rows.filter((r) => r.isCorrect).length;
            const incorrectCount = Math.max(0, answeredCount - correctCount);
            const skippedCount = Math.max(0, attemptsPerQuestion - answeredCount);
            const avgTimeSeconds = rows.length
                ? Number((rows.reduce((sum, r) => sum + Number(r.timeTaken || 0), 0) / rows.length).toFixed(1))
                : 0;
            const topic = topicByQuestionId.get(eq.questionId);
            const stats = eq.questionVersionId ? statsByVersionId.get(eq.questionVersionId) : null;
            return {
                questionId: eq.questionId,
                questionVersionId: eq.questionVersionId || null,
                orderIndex: eq.orderIndex,
                questionType: eq.questionType,
                topicId: topic?.topicId || null,
                topicName: topic?.topicName || 'Untagged',
                questionText: String(eq.questionContent || '').slice(0, 180),
                incorrectRate: this.clampPercent((incorrectCount / attemptsPerQuestion) * 100),
                skipRate: this.clampPercent((skippedCount / attemptsPerQuestion) * 100),
                avgTimeSeconds,
                flaggedCount: flaggedByQuestion.get(eq.questionId) || 0,
                correctCount,
                incorrectCount,
                skippedCount,
                pValue: stats?.pValue !== undefined && stats?.pValue !== null ? Number(stats.pValue) : null,
                difficultyIndex: stats?.difficultyIndex !== undefined && stats?.difficultyIndex !== null ? Number(stats.difficultyIndex) : null,
                discriminationIndex: stats?.discriminationIndex !== undefined && stats?.discriminationIndex !== null ? Number(stats.discriminationIndex) : null,
                action: {
                    path: '/lecturer/question-bank',
                    params: {
                        courseId: exam.courseId,
                        topicId: topic?.topicId || undefined,
                        type: eq.questionType,
                    },
                },
            };
        });
        const topicRollup = new Map();
        const typeRollup = new Map();
        for (const q of questionMetrics) {
            const topicKey = q.topicId || q.topicName;
            const t = topicRollup.get(topicKey) || {
                topicId: q.topicId,
                topicName: q.topicName,
                incorrect: 0,
                skipped: 0,
                denominator: 0,
            };
            t.incorrect += q.incorrectCount;
            t.skipped += q.skippedCount;
            t.denominator += attemptsPerQuestion;
            topicRollup.set(topicKey, t);
            const type = typeRollup.get(q.questionType) || {
                type: q.questionType,
                incorrect: 0,
                skipped: 0,
                denominator: 0,
                timeTotal: 0,
                count: 0,
            };
            type.incorrect += q.incorrectCount;
            type.skipped += q.skippedCount;
            type.denominator += attemptsPerQuestion;
            type.timeTotal += q.avgTimeSeconds;
            type.count += 1;
            typeRollup.set(q.questionType, type);
        }
        const weakestTopics = Array.from(topicRollup.values())
            .map((t) => ({
            topicId: t.topicId,
            topicName: t.topicName,
            incorrectRate: this.clampPercent((t.incorrect / Math.max(1, t.denominator)) * 100),
            skipRate: this.clampPercent((t.skipped / Math.max(1, t.denominator)) * 100),
            action: {
                path: '/lecturer/question-bank',
                params: { courseId: exam.courseId, topicId: t.topicId || undefined },
            },
        }))
            .sort((a, b) => b.incorrectRate - a.incorrectRate)
            .slice(0, 8);
        const slowestQuestionTypes = Array.from(typeRollup.values())
            .map((t) => ({
            type: t.type,
            avgTimeSeconds: Number((t.timeTotal / Math.max(1, t.count)).toFixed(1)),
            incorrectRate: this.clampPercent((t.incorrect / Math.max(1, t.denominator)) * 100),
            skipRate: this.clampPercent((t.skipped / Math.max(1, t.denominator)) * 100),
            action: {
                path: '/lecturer/question-bank',
                params: { courseId: exam.courseId, type: t.type },
            },
        }))
            .sort((a, b) => b.avgTimeSeconds - a.avgTimeSeconds);
        const mostIncorrectLimit = Math.min(8, Math.max(5, Math.round(questionMetrics.length * 0.2)));
        const mostIncorrectQuestions = [...questionMetrics]
            .sort((a, b) => {
            const incorrectDelta = b.incorrectRate - a.incorrectRate;
            if (incorrectDelta !== 0)
                return incorrectDelta;
            const skipDelta = b.skipRate - a.skipRate;
            if (skipDelta !== 0)
                return skipDelta;
            return b.flaggedCount - a.flaggedCount;
        })
            .slice(0, mostIncorrectLimit);
        const mostFlaggedQuestions = [...questionMetrics]
            .filter((q) => q.flaggedCount > 0)
            .sort((a, b) => b.flaggedCount - a.flaggedCount)
            .slice(0, 10);
        const abnormalSkips = [...questionMetrics]
            .filter((q) => q.skipRate >= 40)
            .sort((a, b) => b.skipRate - a.skipRate)
            .slice(0, 10);
        const scoreRows = scopedCompletedSubmissions.map((s) => {
            const raw = Number(s.score || 0);
            const pct = Number(exam.totalPoints || 0) > 0
                ? this.clampPercent((raw / Number(exam.totalPoints || 1)) * 100)
                : this.clampPercent(raw);
            return {
                date: new Date(s.submittedAt || s.createdAt).toISOString().slice(0, 10),
                scorePct: pct,
            };
        });
        const trendMap = new Map();
        for (const row of scoreRows) {
            const prev = trendMap.get(row.date) || { total: 0, count: 0 };
            prev.total += row.scorePct;
            prev.count += 1;
            trendMap.set(row.date, prev);
        }
        const trendSeries = Array.from(trendMap.entries())
            .map(([date, v]) => ({ date, avgScorePct: Number((v.total / Math.max(1, v.count)).toFixed(1)) }))
            .sort((a, b) => a.date.localeCompare(b.date));
        const avgScorePct = scoreRows.length
            ? Number((scoreRows.reduce((sum, r) => sum + r.scorePct, 0) / scoreRows.length).toFixed(1))
            : 0;
        const passingScore = Number(exam.passingScore || 50);
        const passRate = this.clampPercent((scoreRows.filter((r) => r.scorePct >= passingScore).length / Math.max(1, scoreRows.length)) * 100);
        const weakestTopic = weakestTopics[0];
        const slowestType = slowestQuestionTypes[0];
        const aiSummary = `Hi\u1ec7u su\u1ea5t t\u1ed1t nh\u1ea5t \u1edf c\u00e1c c\u00e2u h\u1ecfi c\u01a1 b\u1ea3n, nh\u01b0ng \u0111i\u1ec3m y\u1ebfu t\u1eadp trung \u1edf ${weakestTopic ? `${weakestTopic.topicName} (${weakestTopic.incorrectRate.toFixed(0)}% sai)` : 'nhi\u1ec1u ch\u1ee7 \u0111\u1ec1'}. \u00c1p l\u1ef1c th\u1eddi gian cao nh\u1ea5t \u1edf ${slowestType ? `${slowestType.type} (${slowestType.avgTimeSeconds}s trung b\u00ecnh)` : 'c\u00e1c c\u00e2u h\u1ecfi t\u1ef1 lu\u1eadn'}. N\u00ean \u01b0u ti\u00ean luy\u1ec7n t\u1eadp c\u00f3 gi\u1edbi h\u1ea1n th\u1eddi gian tr\u01b0\u1edbc b\u00e0i ki\u1ec3m tra \u0111\u1ea7y \u0111\u1ee7 ti\u1ebfp theo.`;
        const aiRecommendations = [
            {
                title: 'Luy\u1ec7n t\u1eadp l\u1ea1i ch\u1ee7 \u0111\u1ec1 y\u1ebfu',
                detail: weakestTopic
                    ? `T\u1ea1o b\u1ed9 luy\u1ec7n t\u1eadp t\u1eadp trung v\u00e0o ${weakestTopic.topicName} v\u1edbi \u0111\u1ed9 kh\u00f3 trung b\u00ecnh v\u00e0 gi\u1edbi h\u1ea1n th\u1eddi gian.`
                    : 'T\u1ea1o b\u1ed9 luy\u1ec7n t\u1eadp cho nh\u00f3m ch\u1ee7 \u0111\u1ec1 c\u00f3 hi\u1ec7u su\u1ea5t th\u1ea5p nh\u1ea5t.',
                action: weakestTopic?.action || { path: '/lecturer/question-bank', params: { courseId: exam.courseId } },
            },
            {
                title: 'Gi\u1ea3m l\u1ed7i do \u00e1p l\u1ef1c th\u1eddi gian',
                detail: slowestType
                    ? `Ng\u01b0\u1eddi h\u1ecdc m\u1ea5t nhi\u1ec1u th\u1eddi gian \u1edf d\u1ea1ng ${slowestType.type}. Th\u00eam b\u1ed9 luy\u1ec7n t\u1eadp ng\u1eafn 5-8 c\u00e2u c\u00f3 gi\u1edbi h\u1ea1n th\u1eddi gian tr\u01b0\u1edbc b\u00e0i thi \u0111\u1ea7y \u0111\u1ee7.`
                    : 'Th\u00eam b\u1ed9 luy\u1ec7n t\u1eadp ng\u1eafn c\u00f3 gi\u1edbi h\u1ea1n th\u1eddi gian cho c\u00e1c d\u1ea1ng c\u00e2u h\u1ecfi m\u1ea5t nhi\u1ec1u th\u1eddi gian.',
                action: slowestType?.action || { path: '/lecturer/question-bank', params: { courseId: exam.courseId } },
            },
        ];
        const creatorQualityAlerts = questionMetrics
            .filter((q) => q.incorrectRate >= 75 || q.skipRate >= 50 || q.flaggedCount >= 3)
            .sort((a, b) => {
            const severityA = (a.incorrectRate * 0.6) + (a.skipRate * 0.25) + (a.flaggedCount * 8);
            const severityB = (b.incorrectRate * 0.6) + (b.skipRate * 0.25) + (b.flaggedCount * 8);
            return severityB - severityA;
        })
            .slice(0, 5)
            .map((q) => ({
            questionId: q.questionId,
            questionLabel: `C\u00e2u ${q.orderIndex + 1}`,
            signal: `${q.incorrectRate.toFixed(0)}% sai \u00b7 ${q.skipRate.toFixed(0)}% b\u1ecf qua \u00b7 ${q.flaggedCount} c\u1ea3nh b\u00e1o`,
            suggestion: 'C\u00f3 d\u1ea5u hi\u1ec7u c\u00e2u h\u1ecfi d\u1ec5 g\u00e2y nh\u1ea7m l\u1eabn. H\u00e3y r\u00e0 so\u00e1t c\u00e1ch di\u1ec5n \u0111\u1ea1t, ph\u01b0\u01a1ng \u00e1n nhi\u1ec5u v\u00e0 m\u1ee9c \u0111\u1ed9 kh\u00f3.',
            action: q.action,
        }));
        return {
            exam,
            analyticsScope: isUnlimited ? 'PRACTICE' : 'OFFICIAL',
            isUnlimited,
            kpis: {
                totalSubmissions: submissions.length,
                analyzedSubmissions: scopedCompletedSubmissions.length,
                completedSubmissions: scopedCompletedSubmissions.length,
                completionRate: this.clampPercent((scopedCompletedSubmissions.length / Math.max(1, submissions.length)) * 100),
                avgScorePct,
                passRate,
            },
            visualizations: {
                correctVsIncorrect: {
                    correct: questionMetrics.reduce((sum, q) => sum + q.correctCount, 0),
                    incorrect: questionMetrics.reduce((sum, q) => sum + q.incorrectCount, 0),
                    skipped: questionMetrics.reduce((sum, q) => sum + q.skippedCount, 0),
                },
                trendSeries,
            },
            questionMetrics,
            mostIncorrectQuestions,
            weakestTopics,
            slowestQuestionTypes,
            mostFlaggedQuestions,
            abnormalSkips,
            aiSummary,
            aiRecommendations,
            creatorQualityAlerts,
            trackingPlan: {
                experimentName: 'analytics-practice-loop-v1',
                primaryMetrics: ['retry_click_rate', 'practice_completion_rate', 'score_uplift_next_attempt'],
                eventKeys: ['analytics_open', 'analytics_action_click', 'practice_start_from_analytics'],
            },
            updatedAt: new Date().toISOString(),
        };
    }
    async getSubmissionTimeline(submissionId, user) {
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                studentId: true,
                status: true,
                startedAt: true,
                submittedAt: true,
                createdAt: true,
                updatedAt: true,
                exam: {
                    select: {
                        id: true,
                        title: true,
                        course: {
                            select: {
                                id: true,
                                lecturerId: true,
                            },
                        },
                    },
                },
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        studentId: true,
                        email: true,
                    },
                },
                proctoring: {
                    select: {
                        id: true,
                        ipAddress: true,
                        tabSwitchCount: true,
                        mouseAnomalies: true,
                        flaggedStatus: true,
                        integrityScore: true,
                        logs: {
                            orderBy: { timestamp: 'asc' },
                            select: {
                                id: true,
                                eventType: true,
                                details: true,
                                timestamp: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        const role = String(user.role || '').toUpperCase();
        const isOwner = submission.studentId === user.id;
        const isLecturer = submission.exam.course?.lecturerId === user.id;
        if (role === 'STUDENT' && !isOwner) {
            throw new common_1.ForbiddenException('You are not allowed to view this timeline');
        }
        if (role === 'LECTURER' && !isLecturer) {
            throw new common_1.ForbiddenException('You are not allowed to view this timeline');
        }
        const eventTypeLabels = {
            exam_start: 'Exam session started',
            submit: 'Exam submitted',
            answer: 'Answer interaction recorded',
            tab_switch: 'Tab switch detected',
            fullscreen_exit: 'Fullscreen exit detected',
            window_blur: 'Window focus lost',
            blur: 'Window focus lost',
            focus: 'Window focus returned',
            mouse_idle: 'Mouse idle anomaly recorded',
            mouse_anomaly: 'Mouse anomaly recorded',
            copy: 'Copy event detected',
            paste: 'Paste event detected',
            violation_escalation: 'Integrity violation escalation',
            face_not_detected: 'Face not detected',
        };
        const severityFor = (eventType) => {
            const event = String(eventType || '').toLowerCase();
            if (event.includes('fullscreen') || event.includes('face') || event.includes('escalation'))
                return 'critical';
            if (['tab_switch', 'window_blur', 'blur', 'copy', 'paste', 'mouse_idle', 'mouse_anomaly'].includes(event))
                return 'warning';
            return 'normal';
        };
        const formatDetails = (details) => {
            if (!details)
                return undefined;
            const parsed = this.parseLogDetails(details);
            if (!parsed)
                return details;
            if (typeof parsed === 'string')
                return parsed;
            return Object.entries(parsed)
                .filter(([, value]) => value !== null && typeof value !== 'undefined' && value !== '')
                .slice(0, 4)
                .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`)
                .join(' | ');
        };
        const events = [];
        if (submission.startedAt || submission.createdAt) {
            events.push({
                id: `${submission.id}-started`,
                timestamp: new Date(submission.startedAt || submission.createdAt).toISOString(),
                type: 'exam_start',
                description: 'Exam session started',
                severity: 'normal',
                detail: submission.proctoring?.ipAddress ? `IP: ${submission.proctoring.ipAddress}` : undefined,
            });
        }
        for (const log of submission.proctoring?.logs || []) {
            const eventType = String(log.eventType || 'event').toLowerCase();
            events.push({
                id: log.id,
                timestamp: new Date(log.timestamp).toISOString(),
                type: eventType,
                description: eventTypeLabels[eventType] || `Integrity event: ${eventType.replace(/_/g, ' ')}`,
                severity: severityFor(eventType),
                detail: formatDetails(log.details),
            });
        }
        if (submission.submittedAt) {
            events.push({
                id: `${submission.id}-submitted`,
                timestamp: new Date(submission.submittedAt).toISOString(),
                type: 'submit',
                description: 'Exam submitted',
                severity: 'normal',
                detail: `Status: ${submission.status}`,
            });
        }
        events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const warnings = events.filter((event) => event.severity === 'warning').length;
        const critical = events.filter((event) => event.severity === 'critical').length;
        const integrityNotes = events
            .filter((event) => event.severity !== 'normal')
            .map((event, index) => ({
            id: `note-${event.id}`,
            question: null,
            note: event.description,
            severity: event.severity,
            timestamp: event.timestamp,
            detail: event.detail,
            order: index + 1,
        }));
        return {
            submission: {
                id: submission.id,
                status: submission.status,
                startedAt: submission.startedAt,
                submittedAt: submission.submittedAt,
                exam: submission.exam,
                student: submission.student,
            },
            summary: {
                totalEvents: events.length,
                tabSwitches: Number(submission.proctoring?.tabSwitchCount || 0),
                mouseAnomalies: Number(submission.proctoring?.mouseAnomalies || 0),
                warnings,
                critical,
                anomalyScore: submission.proctoring?.integrityScore ? Number(submission.proctoring.integrityScore) : null,
                suspiciousFlag: Boolean(submission.proctoring?.flaggedStatus),
            },
            events,
            integrityNotes,
            updatedAt: new Date().toISOString(),
        };
    }
    async findAll(pagination) {
        const page = pagination?.page || 1;
        const limit = pagination?.limit || 20;
        const [submissions, total] = await Promise.all([
            this.prisma.examSubmission.findMany({
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true,
                            studentId: true,
                        },
                    },
                    exam: {
                        select: {
                            id: true,
                            title: true,
                            totalPoints: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.examSubmission.count(),
        ]);
        return (0, pagination_dto_1.buildPaginatedResult)(submissions, total, page, limit);
    }
    async findByStudent(studentId) {
        return this.prisma.examSubmission.findMany({
            where: { studentId },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        course: {
                            select: {
                                id: true,
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });
    }
    async getMySubmissionById(submissionId, studentId) {
        return this.prisma.examSubmission.findFirst({
            where: {
                id: submissionId,
                studentId,
            },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
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
                },
                answers: {
                    orderBy: [
                        { questionId: 'asc' },
                        { sequence: 'desc' },
                        { updatedAt: 'desc' },
                    ],
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                options: true,
                                points: true,
                                explanation: true,
                                correctAnswer: true,
                            },
                        },
                    },
                },
                proctoring: {
                    select: {
                        ipAddress: true,
                        tabSwitchCount: true,
                        mouseAnomalies: true,
                        logs: true,
                    },
                },
            },
        });
    }
    async findOne(id, user) {
        if (user) {
            const role = String(user.role || '').toUpperCase();
            if (role === 'LECTURER' || role === 'ADMIN') {
                await this.accessPolicy.assertInstructorCanAccessSubmission(id, user);
            }
        }
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true,
                    },
                },
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        passingScore: true,
                    },
                },
                answers: {
                    include: {
                        question: true,
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        if (user && String(user.role || '').toUpperCase() === 'STUDENT' && submission.student.id !== user.id) {
            throw new common_1.ForbiddenException('You are not allowed to access this submission');
        }
        return submission;
    }
    async exportExamResults(examId, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessExam(examId, user);
        }
        const submissions = await this.prisma.examSubmission.findMany({
            where: { examId, status: { in: ['SUBMITTED', 'GRADED', 'FLAGGED'] } },
            include: {
                student: {
                    select: { fullName: true, studentId: true, email: true },
                },
                answers: true,
                exam: { select: { id: true, title: true, totalPoints: true } },
            },
            orderBy: { submittedAt: 'desc' },
        });
        const rows = [];
        rows.push(['Student Name', 'Student ID', 'Email', 'Score', 'Total Points', 'Time Spent (mins)', 'Status', 'Submitted At'].join(','));
        for (const s of submissions) {
            const studentName = (s.student?.fullName || '').replace(/,/g, '');
            const studentId = s.student?.studentId || '';
            const email = s.student?.email || '';
            const score = s.score != null ? String(s.score) : '';
            const totalPoints = s.exam?.totalPoints != null ? String(s.exam.totalPoints) : '';
            let timeSpentMins = '';
            if (s.startedAt && s.submittedAt) {
                const diffMs = new Date(s.submittedAt).getTime() - new Date(s.startedAt).getTime();
                timeSpentMins = String(Math.round(diffMs / 60000));
            }
            const status = s.status || '';
            const submittedAt = s.submittedAt ? new Date(s.submittedAt).toISOString() : '';
            rows.push([studentName, studentId, email, score, totalPoints, timeSpentMins, status, submittedAt].join(','));
        }
        return rows.join('\n');
    }
    async getStudentSubmission(examId, studentId) {
        return this.prisma.examSubmission.findFirst({
            where: { examId, studentId },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        totalPoints: true,
                        maxAttempts: true,
                        settings: true,
                    },
                },
                answers: {
                    orderBy: [
                        { questionId: 'asc' },
                        { sequence: 'desc' },
                        { updatedAt: 'desc' },
                    ],
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                options: true,
                                points: true,
                                explanation: true,
                                correctAnswer: true,
                            },
                        },
                    },
                },
                proctoring: {
                    select: {
                        ipAddress: true,
                        tabSwitchCount: true,
                        mouseAnomalies: true,
                        logs: true,
                    },
                },
            },
            orderBy: [
                { attemptNo: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    }
    resolveConfiguredMaxAttempts(exam) {
        const rawSettings = exam?.settings;
        const settingsMaxAttempts = rawSettings && typeof rawSettings === 'object' && rawSettings.maxAttempts !== undefined && rawSettings.maxAttempts !== null
            ? Number(rawSettings.maxAttempts)
            : null;
        const resolved = exam?.maxAttempts ?? settingsMaxAttempts;
        if (resolved === null || resolved === undefined || Number.isNaN(Number(resolved))) {
            return null;
        }
        return Math.max(1, Math.floor(Number(resolved)));
    }
    isUnlimitedAttemptsExam(exam) {
        return this.resolveConfiguredMaxAttempts(exam) === null;
    }
    collapseLatestCompletedSubmissions(submissions) {
        const buckets = new Map();
        for (const submission of submissions) {
            const studentKey = submission.studentId || submission.id;
            const current = buckets.get(studentKey);
            const currentTime = current ? new Date(current.submittedAt || current.createdAt || 0).getTime() : -1;
            const nextTime = new Date(submission.submittedAt || submission.createdAt || 0).getTime();
            if (!current || nextTime >= currentTime) {
                buckets.set(studentKey, submission);
            }
        }
        return Array.from(buckets.values());
    }
    async updateStatus(id, updateDto, user) {
        if (user) {
            await this.accessPolicy.assertInstructorCanAccessSubmission(id, user);
        }
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        const updated = await this.prisma.examSubmission.update({
            where: { id },
            data: { status: updateDto.status },
        });
        try {
            const context = await this.prisma.examSubmission.findUnique({
                where: { id },
                select: {
                    studentId: true,
                    exam: { select: { id: true, title: true, creatorId: true } },
                },
            });
            if (context) {
                const recipients = Array.from(new Set([context.studentId, context.exam.creatorId]));
                await this.notificationsService.createForUsers(recipients, {
                    kind: 'SUBMISSION_STATUS_UPDATED',
                    title: 'Submission status updated',
                    message: `Submission status for ${context.exam.title} changed to ${updateDto.status}.`,
                    link: updateDto.status === 'FLAGGED'
                        ? `/lecturer/exam/${context.exam.id}/monitor`
                        : `/lecturer/exam/${context.exam.id}/results`,
                    priority: updateDto.status === 'FLAGGED' ? 'high' : 'normal',
                    metadata: { submissionId: id, examId: context.exam.id, status: updateDto.status },
                });
                if (updateDto.status === 'FLAGGED') {
                    await this.notificationsService.createForRole('ADMIN', {
                        kind: 'SUBMISSION_FLAGGED',
                        title: 'Submission flagged',
                        message: `A submission in ${context.exam.title} was flagged for review.`,
                        link: '/admin/integrity',
                        priority: 'high',
                        metadata: { submissionId: id, examId: context.exam.id },
                    });
                }
            }
        }
        catch {
        }
        return updated;
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        submissions_events_service_1.SubmissionsEventsService,
        notifications_service_1.NotificationsService,
        access_policy_service_1.AccessPolicyService,
        queue_service_1.QueueService])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map