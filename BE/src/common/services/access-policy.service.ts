import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { normalizeIp, isIpInAnyCidr } from '../utils/ip.utils';

type AuthUser = {
  id: string;
  role?: string;
};

@Injectable()
export class AccessPolicyService {
  private readonly logger = new Logger(AccessPolicyService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Resolve the client's apparent IP address taking into account trusted proxy CIDRs.
   * If the remote (socket) address belongs to a trusted proxy, the X-Forwarded-For
   * header is examined and the left-most untrusted IP is returned.
   */
  resolveClientIpFromParts(remoteIpRaw?: string | null, forwardedForRaw?: string | null): string | null {
    const remoteIp = normalizeIp(remoteIpRaw || null);
    const xff = typeof forwardedForRaw === 'string' ? forwardedForRaw : (forwardedForRaw ? String(forwardedForRaw) : null);

    const trustedRaw = process.env.TRUSTED_PROXY_CIDRS || '';
    const trustedCidrs = trustedRaw.split(',').map((s) => s.trim()).filter(Boolean);

    if (trustedCidrs.length > 0 && isIpInAnyCidr(remoteIp, trustedCidrs)) {
      // remote is a trusted proxy — parse X-Forwarded-For and pick first untrusted IP
      if (xff) {
        const parts = xff.split(',').map((p) => normalizeIp(p.trim())).filter(Boolean);
        for (const p of parts) {
          if (!isIpInAnyCidr(p, trustedCidrs)) {
            return p;
          }
        }
        // fallback to first part if all are trusted
        return parts[0] || remoteIp;
      }
      return remoteIp;
    }

    // Not behind a trusted proxy — do not trust X-Forwarded-For header
    return xff ? normalizeIp(xff.split(',')[0].trim()) || remoteIp : remoteIp;
  }

  resolveClientIp(req: Request): string | null {
    const remote = req?.socket?.remoteAddress || (req as any)?.ip || null;
    const xff = req?.headers?.['x-forwarded-for'] as string | undefined;
    return this.resolveClientIpFromParts(remote, xff ?? null);
  }

  async isIpAllowedForExam(examId: string, clientIp: string | null) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId }, select: { id: true, mode: true, settings: true } });
    if (!exam) return { allowed: false, reason: 'exam_not_found' };
    if (!exam.mode || exam.mode === 'NORMAL') return { allowed: true };

    // LAB mode: check whitelist table first
    const entries = await this.prisma.examIpWhitelist.findMany({ where: { examId } });
    const rules = entries.map((e) => e.rule);
    if (rules.length === 0) {
      // fallback to legacy settings.allowedIpCidrs if present
      const allowedFromSettings = Array.isArray((exam.settings || {})?.allowedIpCidrs)
        ? (exam.settings || {})?.allowedIpCidrs
        : [];
      if (!allowedFromSettings || allowedFromSettings.length === 0) {
        return { allowed: false, reason: 'no_whitelist' };
      }
      if (isIpInAnyCidr(clientIp, allowedFromSettings)) return { allowed: true };
      return { allowed: false, reason: 'outside_allowed_cidrs' };
    }

    if (isIpInAnyCidr(clientIp, rules)) return { allowed: true };
    return { allowed: false, reason: 'outside_allowed_cidrs' };
  }

  async assertInstructorCanAccessExam(examId: string, user: AuthUser) {
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
      throw new NotFoundException('Exam not found');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return exam;

    if (
      role === 'LECTURER' &&
      (exam.creatorId === user.id || exam.course?.lecturerId === user.id)
    ) {
      return exam;
    }

    throw new ForbiddenException('You are not allowed to access this exam');
  }

  async assertInstructorCanAccessCourse(courseId: string, user: AuthUser) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, lecturerId: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return course;

    if (role === 'LECTURER' && course.lecturerId === user.id) {
      return course;
    }

    throw new ForbiddenException('You are not allowed to access this course');
  }

  async assertInstructorCanAccessSubmission(submissionId: string, user: AuthUser) {
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
      throw new NotFoundException('Submission not found');
    }

    const role = String(user?.role || '').toUpperCase();
    if (role === 'ADMIN') return submission;

    if (
      role === 'LECTURER' &&
      (submission.exam?.creatorId === user.id || submission.exam?.course?.lecturerId === user.id)
    ) {
      return submission;
    }

    throw new ForbiddenException('You are not allowed to access this submission');
  }

  async assertInstructorCanAccessSubmissionAnswer(answerId: string, user: AuthUser) {
    const answer = await this.prisma.submissionAnswer.findUnique({
      where: { id: answerId },
      select: { submissionId: true },
    });

    if (!answer) {
      throw new NotFoundException('Answer not found');
    }

    return this.assertInstructorCanAccessSubmission(answer.submissionId, user);
  }

  async assertInstructorCanAccessAnomalyFlag(flagId: string, user: AuthUser) {
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
      throw new NotFoundException('Anomaly flag not found');
    }

    await this.assertInstructorCanAccessExam(flag.examInstance.examId, user);
    return flag;
  }

  async logDeniedAccess(examId: string, data: {
    studentId?: string | null;
    resolvedClientIp?: string | null;
    remoteIp?: string | null;
    forwardedFor?: string | null;
    userAgent?: string | null;
    reasonCode?: string | null;
    reasonMessage?: string | null;
    route?: string | null;
  }) {
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
    } catch (err) {
      this.logger.warn('Failed to persist exam access denied log: ' + String(err));
    }
  }
}
