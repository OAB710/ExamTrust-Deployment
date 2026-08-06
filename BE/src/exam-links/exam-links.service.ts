import {
  BadRequestException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isIpInAnyCidr, normalizeIp } from '../common/utils/ip.utils';
import { AccessPolicyService } from '../common/services/access-policy.service';
import { GenerateExamLinkDto, JoinExamLinkDto, UpdateExamLinkDto } from './dto/exam-link.dto';
import { createHash, randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ExamLinksService {
  constructor(
    private prisma: PrismaService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  private makeToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private getAppBaseUrl() {
    return process.env.APP_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  private async assertCanManageExam(examId: string, userId: string, role: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, creatorId: true, startTime: true, endTime: true },
    });

    if (!exam) {
      throw new NotFoundException('Không tìm thấy bài thi');
    }

    if (role !== 'ADMIN' && exam.creatorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền quản lý liên kết cho bài thi này');
    }

    return exam;
  }

  async generateLink(examId: string, dto: GenerateExamLinkDto, userId: string, role: string) {
    const exam = await this.assertCanManageExam(examId, userId, role);

    const expiresAt = dto.expiryDatetime
      ? new Date(dto.expiryDatetime)
      : exam.endTime || null;

    if (expiresAt && expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('Thời gian hết hạn phải ở trong tương lai');
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

  private async getLinkByRawToken(token: string) {
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
      throw new NotFoundException('Liên kết bài thi không hợp lệ');
    }

    return link;
  }

  private async validateEligibility(link: any, userId?: string) {
    if (link.disabled) {
      throw new ForbiddenException('Liên kết đã bị thu hồi');
    }

    if (link.lockedUntil && new Date(link.lockedUntil).getTime() > Date.now()) {
      throw new ForbiddenException('Liên kết bị tạm khóa do nhập sai mật khẩu nhiều lần');
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
      throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
    }

    if (link.maxUses != null && link.usedCount >= link.maxUses) {
      throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
    }

    if (link.exam.status !== 'PUBLISHED' && link.exam.status !== 'ONGOING') {
      throw new ForbiddenException('Bài thi hiện không khả dụng');
    }

    if (link.exam.startTime && new Date(link.exam.startTime).getTime() > Date.now()) {
      throw new ForbiddenException('Bài thi chưa bắt đầu');
    }

    const allowLateSubmission = Boolean((link.exam.settings as any)?.allowLateSubmission);
    if (!allowLateSubmission && link.exam.endTime && new Date(link.exam.endTime).getTime() < Date.now()) {
      throw new ForbiddenException('Bài thi đã kết thúc');
    }

    if (link.restrictedToCourse) {
      if (!userId) {
        throw new UnauthorizedException('Vui lòng đăng nhập để tiếp tục');
      }

      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          studentId: userId,
          courseId: link.exam.courseId,
          status: 'active',
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('Bạn không đủ điều kiện dùng liên kết bài thi này');
      }
    }

  }

  async validateToken(token: string) {
    const link = await this.getLinkByRawToken(token);

    if (link.disabled) {
      throw new ForbiddenException('Liên kết đã bị thu hồi');
    }

    if (link.lockedUntil && new Date(link.lockedUntil).getTime() > Date.now()) {
      throw new ForbiddenException('Liên kết bị tạm khóa do nhập sai mật khẩu nhiều lần');
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
      throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
    }

    if (link.maxUses != null && link.usedCount >= link.maxUses) {
      throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
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

  async joinByToken(token: string, dto: JoinExamLinkDto, context: { userId?: string; ip?: string; userAgent?: string }) {
    const link = await this.getLinkByRawToken(token);
    await this.validateEligibility(link, context.userId);

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

        throw new ForbiddenException('Cần nhập mật khẩu hoặc mật khẩu không đúng');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.examLink.findUnique({ where: { id: link.id } });
      if (!current) {
        throw new NotFoundException('Liên kết bài thi không hợp lệ');
      }

      if (current.disabled) {
        throw new ForbiddenException('Liên kết đã bị thu hồi');
      }

      if (current.expiresAt && new Date(current.expiresAt).getTime() <= Date.now()) {
        throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
      }

      if (current.maxUses != null && current.usedCount >= current.maxUses) {
        throw new GoneException('Liên kết đã hết hạn hoặc không còn hiệu lực');
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
          userAgent: context.userAgent || null,
        },
      });

      return saved;
    });



    return {
      valid: true,
      examId: link.exam.id,
      joinUrl: `/student/exam-ready?examId=${link.exam.id}`,
      usedCount: updated.usedCount,
      maxUses: updated.maxUses,
    };
  }

  async listByExam(examId: string, userId: string, role: string) {
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

  async updateLink(id: string, dto: UpdateExamLinkDto, userId: string, role: string) {
    const link = await this.prisma.examLink.findUnique({
      where: { id },
      include: {
        exam: { select: { creatorId: true } },
      },
    });

    if (!link) {
      throw new NotFoundException('Không tìm thấy liên kết bài thi');
    }

    if (role !== 'ADMIN' && link.exam.creatorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật liên kết này');
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

  async usageByLink(id: string, userId: string, role: string) {
    const link = await this.prisma.examLink.findUnique({
      where: { id },
      include: {
        exam: { select: { creatorId: true } },
      },
    });

    if (!link) {
      throw new NotFoundException('Không tìm thấy liên kết bài thi');
    }

    if (role !== 'ADMIN' && link.exam.creatorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lượt sử dụng của liên kết này');
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
}
