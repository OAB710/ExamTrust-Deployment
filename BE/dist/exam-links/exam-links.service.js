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
exports.ExamLinksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ip_utils_1 = require("../common/utils/ip.utils");
const access_policy_service_1 = require("../common/services/access-policy.service");
const crypto_1 = require("crypto");
const bcrypt = require("bcrypt");
const notifications_service_1 = require("../notifications/notifications.service");
let ExamLinksService = class ExamLinksService {
    constructor(prisma, notificationsService, accessPolicy) {
        this.prisma = prisma;
        this.notificationsService = notificationsService;
        this.accessPolicy = accessPolicy;
    }
    makeToken() {
        return (0, crypto_1.randomBytes)(32).toString('base64url');
    }
    hashToken(token) {
        return (0, crypto_1.createHash)('sha256').update(token).digest('hex');
    }
    getAppBaseUrl() {
        return process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    }
    async assertCanManageExam(examId, userId, role) {
        const exam = await this.prisma.exam.findUnique({
            where: { id: examId },
            select: { id: true, creatorId: true, startTime: true, endTime: true },
        });
        if (!exam) {
            throw new common_1.NotFoundException('Exam not found');
        }
        if (role !== 'ADMIN' && exam.creatorId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to manage links for this exam');
        }
        return exam;
    }
    async generateLink(examId, dto, userId, role) {
        const exam = await this.assertCanManageExam(examId, userId, role);
        const expiresAt = dto.expiryDatetime
            ? new Date(dto.expiryDatetime)
            : exam.endTime || null;
        if (expiresAt && expiresAt.getTime() <= Date.now()) {
            throw new common_1.BadRequestException('Expiry datetime must be in the future');
        }
        const token = this.makeToken();
        const tokenHash = this.hashToken(token);
        const passwordHash = dto.password
            ? await bcrypt.hash(dto.password, 10)
            : null;
        const created = await this.prisma.examLink.create({
            data: {
                examId,
                tokenHash,
                createdBy: userId,
                expiresAt,
                maxUses: dto.maxUses ?? null,
                passwordHash,
                restrictedToCourse: dto.restrictedToCourse ?? false,
                note: dto.note,
            },
            include: {
                exam: { select: { id: true, title: true } },
            },
        });
        const url = `${this.getAppBaseUrl()}/student/join/${token}`;
        try {
            if (created.exam) {
                await this.notificationsService.create({
                    recipientId: userId,
                    kind: 'EXAM_LINK_CREATED',
                    title: 'Exam link generated',
                    message: `Secure join link for ${created.exam.title} has been generated.`,
                    link: `/lecturer/generate-link?examId=${examId}`,
                    priority: 'normal',
                    metadata: { examId, linkId: created.id },
                });
            }
        }
        catch {
        }
        return {
            id: created.id,
            token,
            url,
            qrDataUrl: `https://quickchart.io/qr?size=240&text=${encodeURIComponent(url)}`,
            expiresAt: created.expiresAt,
            maxUses: created.maxUses,
            restrictedToCourse: created.restrictedToCourse,
            disabled: created.disabled,
        };
    }
    async getLinkByRawToken(token) {
        const tokenHash = this.hashToken(token);
        const link = await this.prisma.examLink.findUnique({
            where: { tokenHash },
            include: {
                exam: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                        duration: true,
                        startTime: true,
                        endTime: true,
                        settings: true,
                        status: true,
                        course: { select: { code: true, name: true } },
                    },
                },
            },
        });
        if (!link) {
            throw new common_1.NotFoundException('Invalid exam link');
        }
        return link;
    }
    async validateEligibility(link, userId, ip) {
        if (link.disabled) {
            throw new common_1.ForbiddenException('Link has been revoked');
        }
        if (link.lockedUntil && new Date(link.lockedUntil).getTime() > Date.now()) {
            throw new common_1.ForbiddenException('Link is temporarily locked due to multiple failed password attempts');
        }
        if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
            throw new common_1.GoneException('Link expired or no longer valid');
        }
        if (link.maxUses != null && link.usedCount >= link.maxUses) {
            throw new common_1.GoneException('Link expired or no longer valid');
        }
        if (link.exam.status !== 'PUBLISHED' && link.exam.status !== 'ONGOING') {
            throw new common_1.ForbiddenException('Exam is not available');
        }
        if (link.exam.startTime && new Date(link.exam.startTime).getTime() > Date.now()) {
            throw new common_1.ForbiddenException('Exam has not started yet');
        }
        const allowLateSubmission = Boolean(link.exam.settings?.allowLateSubmission);
        if (!allowLateSubmission && link.exam.endTime && new Date(link.exam.endTime).getTime() < Date.now()) {
            throw new common_1.ForbiddenException('Exam has ended');
        }
        if (link.restrictedToCourse) {
            if (!userId) {
                throw new common_1.UnauthorizedException('Please login to continue');
            }
            const enrollment = await this.prisma.enrollment.findFirst({
                where: {
                    studentId: userId,
                    courseId: link.exam.courseId,
                    status: 'active',
                },
            });
            if (!enrollment) {
                throw new common_1.ForbiddenException('You are not eligible for this exam link');
            }
        }
        try {
            const check = await this.accessPolicy.isIpAllowedForExam(link.exam.id, ip ? (0, ip_utils_1.normalizeIp)(ip) : null);
            if (!check.allowed) {
                await this.accessPolicy.logDeniedAccess(link.exam.id, {
                    resolvedClientIp: ip ? (0, ip_utils_1.normalizeIp)(ip) : null,
                    remoteIp: ip || null,
                    reasonCode: check.reason || 'LAB_IP_DENIED',
                    reasonMessage: 'Access denied by lab IP whitelist',
                    route: 'exam-links.validateEligibility',
                });
                throw new common_1.ForbiddenException('Access denied: outside allowed lab network');
            }
        }
        catch (e) {
            if (e instanceof common_1.ForbiddenException)
                throw e;
            throw new common_1.ForbiddenException('Access restricted by network policy');
        }
    }
    async validateToken(token) {
        const link = await this.getLinkByRawToken(token);
        if (link.disabled) {
            throw new common_1.ForbiddenException('Link has been revoked');
        }
        if (link.lockedUntil && new Date(link.lockedUntil).getTime() > Date.now()) {
            throw new common_1.ForbiddenException('Link is temporarily locked due to multiple failed password attempts');
        }
        if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
            throw new common_1.GoneException('Link expired or no longer valid');
        }
        if (link.maxUses != null && link.usedCount >= link.maxUses) {
            throw new common_1.GoneException('Link expired or no longer valid');
        }
        return {
            valid: true,
            requiresPassword: !!link.passwordHash,
            requiresAuth: !!link.restrictedToCourse,
            examId: link.exam.id,
            examTitle: link.exam.title,
            course: link.exam.course,
            joinUrl: `/student/exam-ready?examId=${link.exam.id}`,
            expiresAt: link.expiresAt,
            maxUses: link.maxUses,
            usedCount: link.usedCount,
        };
    }
    async joinByToken(token, dto, context) {
        const link = await this.getLinkByRawToken(token);
        await this.validateEligibility(link, context.userId, context.ip);
        if (link.passwordHash) {
            const provided = dto.password || '';
            const matched = await bcrypt.compare(provided, link.passwordHash);
            if (!matched) {
                const nextAttempts = Number(link.passwordAttempts || 0) + 1;
                const shouldLock = nextAttempts >= 5;
                await this.prisma.examLink.update({
                    where: { id: link.id },
                    data: {
                        passwordAttempts: nextAttempts,
                        lockedUntil: shouldLock ? new Date(Date.now() + 10 * 60 * 1000) : null,
                    },
                });
                throw new common_1.ForbiddenException('Password is required or incorrect');
            }
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            const current = await tx.examLink.findUnique({ where: { id: link.id } });
            if (!current) {
                throw new common_1.NotFoundException('Invalid exam link');
            }
            if (current.disabled) {
                throw new common_1.ForbiddenException('Link has been revoked');
            }
            if (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now()) {
                throw new common_1.GoneException('Link expired or no longer valid');
            }
            if (current.maxUses != null && current.usedCount >= current.maxUses) {
                throw new common_1.GoneException('Link expired or no longer valid');
            }
            const saved = await tx.examLink.update({
                where: { id: link.id },
                data: {
                    usedCount: { increment: 1 },
                    lastUsedAt: new Date(),
                    passwordAttempts: 0,
                    lockedUntil: null,
                },
            });
            await tx.examLinkUsage.create({
                data: {
                    linkId: link.id,
                    userId: context.userId ?? null,
                    ip: context.ip || null,
                    userAgent: context.userAgent || null,
                },
            });
            return saved;
        });
        try {
            const examOwner = await this.prisma.exam.findUnique({
                where: { id: link.exam.id },
                select: { creatorId: true, title: true },
            });
            if (context.userId) {
                await this.notificationsService.create({
                    recipientId: context.userId,
                    kind: 'EXAM_LINK_USED',
                    title: 'Exam link accepted',
                    message: `You can now join ${link.exam.title}.`,
                    link: `/student/exam-ready?examId=${link.exam.id}`,
                    priority: 'low',
                    metadata: { examId: link.exam.id, linkId: link.id },
                });
            }
            if (examOwner?.creatorId) {
                await this.notificationsService.create({
                    recipientId: examOwner.creatorId,
                    kind: 'EXAM_LINK_USED',
                    title: 'Exam link was used',
                    message: `A student joined exam ${examOwner.title} via secure link.`,
                    link: `/lecturer/exam/${link.exam.id}/monitor`,
                    priority: 'normal',
                    metadata: { examId: link.exam.id, linkId: link.id, usedCount: updated.usedCount },
                });
            }
        }
        catch {
        }
        return {
            valid: true,
            examId: link.exam.id,
            joinUrl: `/student/exam-ready?examId=${link.exam.id}`,
            usedCount: updated.usedCount,
            maxUses: updated.maxUses,
        };
    }
    async listByExam(examId, userId, role) {
        await this.assertCanManageExam(examId, userId, role);
        const links = await this.prisma.examLink.findMany({
            where: { examId },
            include: {
                creator: { select: { id: true, fullName: true, email: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        return links.map((link) => ({
            id: link.id,
            expiresAt: link.expiresAt,
            maxUses: link.maxUses,
            usedCount: link.usedCount,
            lastUsedAt: link.lastUsedAt,
            restrictedToCourse: link.restrictedToCourse,
            disabled: link.disabled,
            note: link.note,
            createdAt: link.createdAt,
            createdBy: link.creator,
            hasPassword: !!link.passwordHash,
            previewUrl: `${this.getAppBaseUrl()}/student/join/[hidden-token]`,
        }));
    }
    async updateLink(id, dto, userId, role) {
        const link = await this.prisma.examLink.findUnique({
            where: { id },
            include: {
                exam: { select: { creatorId: true } },
            },
        });
        if (!link) {
            throw new common_1.NotFoundException('Exam link not found');
        }
        if (role !== 'ADMIN' && link.exam.creatorId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to update this link');
        }
        const updated = await this.prisma.examLink.update({
            where: { id },
            data: {
                disabled: dto.disabled ?? link.disabled,
                expiresAt: dto.expiryDatetime ? new Date(dto.expiryDatetime) : link.expiresAt,
                maxUses: dto.maxUses ?? link.maxUses,
                note: dto.note ?? link.note,
            },
        });
        try {
            await this.notificationsService.create({
                recipientId: userId,
                kind: 'EXAM_LINK_UPDATED',
                title: 'Exam link updated',
                message: `Exam link settings were updated${updated.disabled ? ' and the link is now disabled' : ''}.`,
                link: `/lecturer/generate-link?examId=${link.examId}`,
                priority: updated.disabled ? 'high' : 'normal',
                metadata: { linkId: updated.id, examId: link.examId, disabled: updated.disabled },
            });
        }
        catch {
        }
        return {
            id: updated.id,
            disabled: updated.disabled,
            expiresAt: updated.expiresAt,
            maxUses: updated.maxUses,
            usedCount: updated.usedCount,
            note: updated.note,
            updatedAt: updated.updatedAt,
        };
    }
    async usageByLink(id, userId, role) {
        const link = await this.prisma.examLink.findUnique({
            where: { id },
            include: {
                exam: { select: { creatorId: true } },
            },
        });
        if (!link) {
            throw new common_1.NotFoundException('Exam link not found');
        }
        if (role !== 'ADMIN' && link.exam.creatorId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to view this link usage');
        }
        return this.prisma.examLinkUsage.findMany({
            where: { linkId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        studentId: true,
                    },
                },
            },
            orderBy: { usedAt: 'desc' },
        });
    }
};
exports.ExamLinksService = ExamLinksService;
exports.ExamLinksService = ExamLinksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService,
        access_policy_service_1.AccessPolicyService])
], ExamLinksService);
//# sourceMappingURL=exam-links.service.js.map