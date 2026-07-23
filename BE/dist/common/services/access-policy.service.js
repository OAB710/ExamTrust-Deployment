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
var AccessPolicyService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessPolicyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ip_utils_1 = require("../utils/ip.utils");
let AccessPolicyService = AccessPolicyService_1 = class AccessPolicyService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(AccessPolicyService_1.name);
    }
    resolveClientIpFromParts(remoteIpRaw, forwardedForRaw) {
        const remoteIp = (0, ip_utils_1.normalizeIp)(remoteIpRaw || null);
        const xff = typeof forwardedForRaw === 'string' ? forwardedForRaw : (forwardedForRaw ? String(forwardedForRaw) : null);
        const trustedRaw = process.env.TRUSTED_PROXY_CIDRS || '';
        const trustedCidrs = trustedRaw.split(',').map((s) => s.trim()).filter(Boolean);
        if (trustedCidrs.length > 0 && (0, ip_utils_1.isIpInAnyCidr)(remoteIp, trustedCidrs)) {
            if (xff) {
                const parts = xff.split(',').map((p) => (0, ip_utils_1.normalizeIp)(p.trim())).filter(Boolean);
                for (const p of parts) {
                    if (!(0, ip_utils_1.isIpInAnyCidr)(p, trustedCidrs)) {
                        return p;
                    }
                }
                return parts[0] || remoteIp;
            }
            return remoteIp;
        }
        return xff ? (0, ip_utils_1.normalizeIp)(xff.split(',')[0].trim()) || remoteIp : remoteIp;
    }
    resolveClientIp(req) {
        const remote = req?.socket?.remoteAddress || req?.ip || null;
        const xff = req?.headers?.['x-forwarded-for'];
        return this.resolveClientIpFromParts(remote, xff ?? null);
    }
    async isIpAllowedForExam(examId, clientIp) {
        const exam = await this.prisma.exam.findUnique({ where: { id: examId }, select: { id: true, mode: true, settings: true } });
        if (!exam)
            return { allowed: false, reason: 'exam_not_found' };
        if (!exam.mode || exam.mode === 'NORMAL')
            return { allowed: true };
        const entries = await this.prisma.examIpWhitelist.findMany({ where: { examId } });
        const rules = entries.map((e) => e.rule);
        if (rules.length === 0) {
            const allowedFromSettings = Array.isArray((exam.settings || {})?.allowedIpCidrs)
                ? (exam.settings || {})?.allowedIpCidrs
                : [];
            if (!allowedFromSettings || allowedFromSettings.length === 0) {
                return { allowed: false, reason: 'no_whitelist' };
            }
            if ((0, ip_utils_1.isIpInAnyCidr)(clientIp, allowedFromSettings))
                return { allowed: true };
            return { allowed: false, reason: 'outside_allowed_cidrs' };
        }
        if ((0, ip_utils_1.isIpInAnyCidr)(clientIp, rules))
            return { allowed: true };
        return { allowed: false, reason: 'outside_allowed_cidrs' };
    }
    async assertInstructorCanAccessExam(examId, user) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: {
                id: true,
                creatorId: true,
                course: {
                    select: {
                        lecturerId: true,
                    },
                },
            },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        const role = String(user?.role || '').toUpperCase();
        if (role === 'ADMIN')
            return exam;
        if (role === 'LECTURER' &&
            (exam.creatorId === user.id || exam.course?.lecturerId === user.id)) {
            return exam;
        }
        throw new common_1.ForbiddenException('You are not allowed to access this exam');
    }
    async assertInstructorCanAccessCourse(courseId, user) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true, lecturerId: true },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const role = String(user?.role || '').toUpperCase();
        if (role === 'ADMIN')
            return course;
        if (role === 'LECTURER' && course.lecturerId === user.id) {
            return course;
        }
        throw new common_1.ForbiddenException('You are not allowed to access this course');
    }
    async assertInstructorCanAccessSubmission(submissionId, user) {
        const submission = await this.prisma.examSubmission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                examId: true,
                exam: {
                    select: {
                        creatorId: true,
                        course: {
                            select: {
                                lecturerId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!submission) {
            throw new common_1.NotFoundException('Submission not found');
        }
        const role = String(user?.role || '').toUpperCase();
        if (role === 'ADMIN')
            return submission;
        if (role === 'LECTURER' &&
            (submission.exam?.creatorId === user.id || submission.exam?.course?.lecturerId === user.id)) {
            return submission;
        }
        throw new common_1.ForbiddenException('You are not allowed to access this submission');
    }
    async assertInstructorCanAccessSubmissionAnswer(answerId, user) {
        const answer = await this.prisma.submissionAnswer.findUnique({
            where: { id: answerId },
            select: { submissionId: true },
        });
        if (!answer) {
            throw new common_1.NotFoundException('Answer not found');
        }
        return this.assertInstructorCanAccessSubmission(answer.submissionId, user);
    }
    async assertInstructorCanAccessAnomalyFlag(flagId, user) {
        const flag = await this.prisma.anomalyFlag.findUnique({
            where: { id: flagId },
            select: {
                id: true,
                examInstance: {
                    select: {
                        examId: true,
                    },
                },
            },
        });
        if (!flag) {
            throw new common_1.NotFoundException('Anomaly flag not found');
        }
        await this.assertInstructorCanAccessExam(flag.examInstance.examId, user);
        return flag;
    }
    async logDeniedAccess(examId, data) {
        try {
            await this.prisma.examAccessDeniedLog.create({
                data: {
                    examId,
                    studentId: data.studentId || null,
                    resolvedClientIp: data.resolvedClientIp || (data.remoteIp ?? null) || '',
                    remoteIp: data.remoteIp || null,
                    forwardedFor: data.forwardedFor || null,
                    userAgent: data.userAgent || null,
                    reasonCode: data.reasonCode || 'DENIED',
                    reasonMessage: data.reasonMessage || null,
                    route: data.route || null,
                },
            });
        }
        catch (err) {
            this.logger.warn('Failed to persist exam access denied log: ' + String(err));
        }
    }
};
exports.AccessPolicyService = AccessPolicyService;
exports.AccessPolicyService = AccessPolicyService = AccessPolicyService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AccessPolicyService);
//# sourceMappingURL=access-policy.service.js.map