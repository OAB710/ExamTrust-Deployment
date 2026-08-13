import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createHash, randomUUID } from 'crypto';
import type { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AccessPolicyService } from '../common/services/access-policy.service';

const KNOWN_SIGNAL_SLUGS = ['tab_switch', 'fullscreen_exit', 'paste_external', 'mouse_idle'];

// Human-readable object key so evidence is identifiable directly in the R2
// bucket — the unguessable part (capture.id, a uuid) stays DB-only, never in
// this path; access is gated by assertInstructorCanAccessExam on every read,
// not by path secrecy.
function buildEvidenceStorageKey(params: {
  examId: string;
  submissionId: string;
  trigger: 'SCHEDULED' | 'SUSPICIOUS_EVENT';
  triggerDetails: unknown;
  captureSource: string;
  ordinal: number;
  extension: string;
}): string {
  const signals = Array.isArray((params.triggerDetails as { signals?: unknown[] } | null)?.signals)
    ? ((params.triggerDetails as { signals: unknown[] }).signals as unknown[]).map(String)
    : [];
  const eventSlug = params.trigger === 'SCHEDULED'
    ? 'scheduled'
    : signals.find((s) => KNOWN_SIGNAL_SLUGS.includes(s)) || 'event';
  const sourceSlug = params.captureSource.toLowerCase();
  const ordinal = String(params.ordinal).padStart(2, '0');
  return `proctoring-evidence/${params.examId}/${params.submissionId}/${eventSlug}_${sourceSlug}_${ordinal}.${params.extension}`;
}

type EventCaptureLimits = {
  tab_switch: number;
  fullscreen_exit: number;
  paste_external: number;
  mouse_idle: number;
};

type WebcamEvidencePolicy = {
  enabled: boolean;
  examProfile: 'THEORY' | 'MIXED' | 'CALCULATION';
  scheduledCaptureOffsetsMs: number[];
  eventCaptureLimits: EventCaptureLimits;
  eventCooldownMs: number;
  retentionDays: number;
  consentVersion: string;
  requireFullScreenCapture: boolean;
  screenCaptureEnabled: boolean;
};

const SCHEDULED_CAPTURE_GRACE_MS = 90_000;
const SCHEDULED_CAPTURE_PERCENTAGES = [0, 0.25, 0.5, 0.75, 1];

const DEFAULT_EVENT_CAPTURE_LIMITS: EventCaptureLimits = {
  tab_switch: 3,
  fullscreen_exit: 3,
  paste_external: 3,
  mouse_idle: 3,
};

const DEFAULT_POLICY: WebcamEvidencePolicy = {
  enabled: false,
  examProfile: 'MIXED',
  scheduledCaptureOffsetsMs: [],
  eventCaptureLimits: DEFAULT_EVENT_CAPTURE_LIMITS,
  eventCooldownMs: 60_000,
  retentionDays: 30,
  consentVersion: 'webcam-evidence-v1',
  requireFullScreenCapture: false,
  screenCaptureEnabled: false,
};

@Injectable()
export class ProctoringEvidenceService implements OnModuleInit {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly accessPolicy: AccessPolicyService,
    private readonly config: ConfigService,
  ) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const endpoint =
      this.config.get<string>('R2_ENDPOINT') ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  onModuleInit() {
    const run = () => this.purgeExpired().catch(() => undefined);
    run();
    const timer = setInterval(run, 24 * 60 * 60 * 1000);
    timer.unref();
  }

  static normalizePolicy(input: any, _randomizationSeed?: string, durationMinutes?: number | null): WebcamEvidencePolicy {
    const source = input && typeof input === 'object' ? input : {};
    const enabled = Boolean(source.enabled) && String(source.examProfile || '').toUpperCase() === 'THEORY';
    const sourceLimits = source.eventCaptureLimits && typeof source.eventCaptureLimits === 'object' ? source.eventCaptureLimits : {};
    const eventCaptureLimits: EventCaptureLimits = {
      tab_switch: Math.max(1, Number(sourceLimits.tab_switch) || DEFAULT_EVENT_CAPTURE_LIMITS.tab_switch),
      fullscreen_exit: Math.max(1, Number(sourceLimits.fullscreen_exit) || DEFAULT_EVENT_CAPTURE_LIMITS.fullscreen_exit),
      paste_external: Math.max(1, Number(sourceLimits.paste_external) || DEFAULT_EVENT_CAPTURE_LIMITS.paste_external),
      mouse_idle: Math.max(1, Number(sourceLimits.mouse_idle) || DEFAULT_EVENT_CAPTURE_LIMITS.mouse_idle),
    };
    const durationMs = Number(durationMinutes) > 0 ? Number(durationMinutes) * 60_000 : null;
    const scheduledCaptureOffsetsMs = durationMs
      ? SCHEDULED_CAPTURE_PERCENTAGES.map((pct) => Math.round(durationMs * pct))
      : [];
    return {
      enabled,
      examProfile: String(source.examProfile || 'MIXED').toUpperCase() as WebcamEvidencePolicy['examProfile'],
      scheduledCaptureOffsetsMs,
      eventCaptureLimits,
      eventCooldownMs: Math.max(60_000, Number(source.eventCooldownMs) || DEFAULT_POLICY.eventCooldownMs),
      retentionDays: 30,
      consentVersion: String(source.consentVersion || DEFAULT_POLICY.consentVersion),
      requireFullScreenCapture: Boolean(source.requireFullScreenCapture),
      screenCaptureEnabled: Boolean(source.screenCaptureEnabled),
    };
  }

  private async getStudentSubmission(submissionId: string, studentId: string) {
    const submission = await this.prisma.examSubmission.findUnique({
      where: { id: submissionId },
      include: { examInstance: true },
    });
    if (!submission) throw new NotFoundException('Không tìm thấy lượt làm bài');
    if (submission.studentId !== studentId) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    if (!submission.examInstance) throw new BadRequestException('Không có phiên bài thi khả dụng');
    return submission;
  }

  private policyFromInstance(instance: any): WebcamEvidencePolicy {
    return ProctoringEvidenceService.normalizePolicy(
      instance?.snapshotPayload?.webcamEvidencePolicy,
      instance?.randomizationSeed,
      instance?.snapshotPayload?.timeLimitMinutes,
    );
  }

  async requestCapture(submissionId: string, studentId: string, dto: { trigger: 'SCHEDULED' | 'SUSPICIOUS_EVENT'; signals?: string[] }) {
    const submission = await this.getStudentSubmission(submissionId, studentId);
    if (submission.status !== 'IN_PROGRESS') throw new BadRequestException('Bài thi không còn đang diễn ra');
    const policy = this.policyFromInstance(submission.examInstance);
    if (!policy.enabled) throw new ForbiddenException('Bài thi này không bật yêu cầu bằng chứng webcam');
    const now = new Date();
    let scheduledSlot: number | null = null;
    let scheduledAt: Date | null = null;

    if (dto.trigger === 'SCHEDULED') {
      const startedAt = submission.startedAt || submission.examInstance?.startedAt;
      if (!startedAt || policy.scheduledCaptureOffsetsMs.length === 0) {
        throw new BadRequestException('Không có lịch chụp webcam nào cho phiên bài thi này');
      }
      const elapsedMs = now.getTime() - startedAt.getTime();
      const missedSlots = policy.scheduledCaptureOffsetsMs
        .map((offset, slot) => ({ offset, slot }))
        .filter(({ offset }) => elapsedMs > offset + SCHEDULED_CAPTURE_GRACE_MS);
      if (missedSlots.length > 0) {
        await this.prisma.proctoringEvidenceCapture.createMany({
          data: missedSlots.map(({ offset, slot }) => ({
            submissionId,
            examInstanceId: submission.examInstanceId!,
            trigger: 'SCHEDULED',
            captureSource: 'WEBCAM',
            triggerDetails: { outcome: 'MISSED', scheduledOffsetMs: offset },
            scheduledSlot: slot,
            scheduledAt: new Date(startedAt.getTime() + offset),
            captureNonceHash: createHash('sha256').update(`missed:${submissionId}:${slot}`).digest('hex'),
            nonceExpiresAt: now,
            retentionUntil: new Date(now.getTime() + policy.retentionDays * 86_400_000),
            status: 'FAILED',
          })),
          skipDuplicates: true,
        });
      }
      const next = policy.scheduledCaptureOffsetsMs
        .map((offset, slot) => ({ offset, slot }))
        .find(({ offset }) => elapsedMs >= offset && elapsedMs <= offset + SCHEDULED_CAPTURE_GRACE_MS);
      if (!next) throw new BadRequestException('Chưa đến thời điểm chụp webcam theo lịch');
      scheduledSlot = next.slot;
      scheduledAt = new Date(startedAt.getTime() + next.offset);
    } else {
      const signalType = (dto.signals || []).find((signal): signal is keyof EventCaptureLimits =>
        Object.prototype.hasOwnProperty.call(policy.eventCaptureLimits, signal),
      );
      const limit = signalType ? policy.eventCaptureLimits[signalType] : DEFAULT_EVENT_CAPTURE_LIMITS.tab_switch;
      // Counted per triggering event, not per image — a paired webcam+screen
      // capture from the same event must only consume one slot of the limit,
      // so only the WEBCAM row (always created first, see below) is counted.
      const recentEvents = await this.prisma.proctoringEvidenceCapture.findMany({
        where: { submissionId, trigger: 'SUSPICIOUS_EVENT', captureSource: 'WEBCAM', status: { not: 'PURGED' }, ...(signalType ? { triggerDetails: { path: ['signals'], array_contains: signalType } } : {}) },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      if (recentEvents.length >= limit) throw new BadRequestException('Đã đạt giới hạn số lần ghi bằng chứng cho loại sự kiện này');
      if (recentEvents[0] && now.getTime() - recentEvents[0].createdAt.getTime() < policy.eventCooldownMs) {
        throw new BadRequestException('Đang trong thời gian chờ giữa các lần ghi bằng chứng sự kiện nghi vấn');
      }
    }

    const nonce = randomUUID();
    const triggerDetails = { signals: (dto.signals || []).slice(0, 10) };
    const retentionUntil = new Date(now.getTime() + policy.retentionDays * 86_400_000);
    const capture = await this.prisma.proctoringEvidenceCapture.create({
      data: {
        submissionId,
        examInstanceId: submission.examInstanceId!,
        trigger: dto.trigger,
        captureSource: 'WEBCAM',
        triggerDetails,
        scheduledSlot,
        scheduledAt,
        captureNonceHash: createHash('sha256').update(nonce).digest('hex'),
        nonceExpiresAt: new Date(now.getTime() + 60_000),
        retentionUntil,
      },
      select: { id: true, nonceExpiresAt: true },
    });
    const result: { captureId: string; nonce: string; expiresAt: Date; maxBytes: number; screen?: { captureId: string; nonce: string; expiresAt: Date; maxBytes: number } } = {
      captureId: capture.id, nonce, expiresAt: capture.nonceExpiresAt, maxBytes: 1_000_000,
    };

    // One trigger (event or scheduled slot) yields one webcam permit plus, when
    // the policy requires it, one paired screen permit — same trigger/signals,
    // separate nonce/captureId so each stream is captured and finalized on its
    // own. Paired together in listForInstructor by scheduledSlot (SCHEDULED) or
    // timestamp proximity (SUSPICIOUS_EVENT).
    if (policy.screenCaptureEnabled) {
      const screenNonce = randomUUID();
      const screenCapture = await this.prisma.proctoringEvidenceCapture.create({
        data: {
          submissionId,
          examInstanceId: submission.examInstanceId!,
          trigger: dto.trigger,
          captureSource: 'SCREEN',
          triggerDetails,
          scheduledSlot,
          scheduledAt,
          captureNonceHash: createHash('sha256').update(screenNonce).digest('hex'),
          nonceExpiresAt: new Date(now.getTime() + 60_000),
          retentionUntil,
        },
        select: { id: true, nonceExpiresAt: true },
      });
      result.screen = { captureId: screenCapture.id, nonce: screenNonce, expiresAt: screenCapture.nonceExpiresAt, maxBytes: 1_000_000 };
    }

    return result;
  }

  async finalizeCapture(submissionId: string, studentId: string, captureId: string, nonce: string, imageDataUrl: string) {
    const submission = await this.getStudentSubmission(submissionId, studentId);
    const capture = await this.prisma.proctoringEvidenceCapture.findFirst({ where: { id: captureId, submissionId } });
    if (!capture) throw new NotFoundException('Không tìm thấy yêu cầu chụp bằng chứng');
    if (capture.status !== 'REQUESTED' || capture.nonceExpiresAt < new Date()) throw new BadRequestException('Yêu cầu chụp bằng chứng đã hết hạn');
    if (createHash('sha256').update(nonce).digest('hex') !== capture.captureNonceHash) throw new ForbiddenException('Mã xác thực chụp ảnh không hợp lệ');

    const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(imageDataUrl);
    if (!match) throw new BadRequestException('Chỉ chấp nhận ảnh webcam định dạng JPEG hoặc PNG');
    const image = Buffer.from(match[2], 'base64');
    if (!image.length || image.length > 1_000_000) throw new BadRequestException('Ảnh webcam không được vượt quá 1 MB');

    const extension = match[1] === 'image/png' ? 'png' : 'jpg';
    // Ordinal excludes this capture (still status REQUESTED at this point),
    // so it reflects how many captures for this submission were already
    // finalized before it — stable and race-safe enough for a display name.
    const priorFinalized = await this.prisma.proctoringEvidenceCapture.count({
      where: { submissionId, status: { in: ['UPLOADED', 'ANALYZING', 'ANALYZED', 'FAILED'] } },
    });
    const storageKey = buildEvidenceStorageKey({
      examId: submission.examId,
      submissionId,
      trigger: capture.trigger,
      triggerDetails: capture.triggerDetails,
      captureSource: capture.captureSource,
      ordinal: priorFinalized + 1,
      extension,
    });
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, Body: image, ContentType: match[1] }));

    await this.prisma.proctoringEvidenceCapture.update({
      where: { id: capture.id },
      data: {
        status: 'UPLOADED', storageKey, mimeType: match[1], sizeBytes: image.length,
        contentHash: createHash('sha256').update(image).digest('hex'), capturedAt: new Date(),
      },
    });
    try {
      const job = await this.prisma.aIGenerationRecord.create({
        data: {
          submissionId,
          section: 'RISK_ASSESSMENT',
          provider: process.env.AI_PROVIDER || 'google',
          prompt: { task: 'proctoring-evidence', captureId: capture.id },
        },
      });
      await this.queueService.enqueueAiGeneration({ jobId: job.id, task: 'proctoring-evidence', payload: { captureId: capture.id } });
    } catch {
      // Evidence is still reviewable if the queue is temporarily unavailable.
    }
    return { id: capture.id, status: 'UPLOADED' };
  }

  async listForInstructor(submissionId: string, user: any) {
    const submission = await this.prisma.examSubmission.findUnique({ where: { id: submissionId }, select: { examId: true } });
    if (!submission) throw new NotFoundException('Không tìm thấy lượt làm bài');
    await this.accessPolicy.assertInstructorCanAccessExam(submission.examId, user);
    return this.prisma.proctoringEvidenceCapture.findMany({
      where: { submissionId }, orderBy: { createdAt: 'asc' },
      select: { id: true, status: true, trigger: true, captureSource: true, triggerDetails: true, scheduledSlot: true, scheduledAt: true, aiTags: true, aiProvider: true, aiAnalyzedAt: true, aiError: true, reviewStatus: true, reviewerNote: true, reviewedAt: true, capturedAt: true, retentionUntil: true, purgedAt: true, createdAt: true },
    });
  }

  async getImageStream(submissionId: string, captureId: string, user: any): Promise<{ stream: Readable; mimeType: string }> {
    const capture = await this.prisma.proctoringEvidenceCapture.findFirst({ where: { id: captureId, submissionId }, include: { submission: { select: { examId: true } } } });
    if (!capture || !capture.storageKey || capture.status === 'PURGED') throw new NotFoundException('Không có ảnh bằng chứng');
    await this.accessPolicy.assertInstructorCanAccessExam(capture.submission.examId, user);
    const object = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: capture.storageKey }));
    if (!object.Body) throw new NotFoundException('Không có ảnh bằng chứng');
    return { stream: object.Body as Readable, mimeType: capture.mimeType || 'image/jpeg' };
  }

  async reviewCapture(submissionId: string, captureId: string, dto: { reviewStatus: 'REVIEWED' | 'DISMISSED'; reviewerNote?: string }, user: any) {
    const capture = await this.prisma.proctoringEvidenceCapture.findFirst({ where: { id: captureId, submissionId }, include: { submission: { select: { examId: true } } } });
    if (!capture) throw new NotFoundException('Không tìm thấy bản chụp bằng chứng');
    await this.accessPolicy.assertInstructorCanAccessExam(capture.submission.examId, user);
    return this.prisma.proctoringEvidenceCapture.update({ where: { id: captureId }, data: { reviewStatus: dto.reviewStatus, reviewerNote: dto.reviewerNote || null, reviewedById: user.id, reviewedAt: new Date() } });
  }

  async purgeExpired(): Promise<number> {
    const captures = await this.prisma.proctoringEvidenceCapture.findMany({ where: { retentionUntil: { lte: new Date() }, status: { not: 'PURGED' } }, select: { id: true, storageKey: true } });
    for (const capture of captures) {
      if (capture.storageKey) {
        try {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: capture.storageKey }));
        } catch {
          // Retention purge must still clear the DB row even if the R2 delete fails.
        }
      }
      await this.prisma.proctoringEvidenceCapture.update({ where: { id: capture.id }, data: { status: 'PURGED', storageKey: null, contentHash: null, mimeType: null, sizeBytes: null, purgedAt: new Date() } });
    }
    return captures.length;
  }

  async readCaptureForAi(captureId: string) {
    const capture = await this.prisma.proctoringEvidenceCapture.findUnique({ where: { id: captureId } });
    if (!capture?.storageKey || capture.status === 'PURGED') throw new NotFoundException('Không có ảnh bằng chứng');
    const object = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: capture.storageKey }));
    if (!object.Body) throw new NotFoundException('Không có ảnh bằng chứng');
    const image = Buffer.from(await object.Body.transformToByteArray());
    return { capture, image };
  }
}
