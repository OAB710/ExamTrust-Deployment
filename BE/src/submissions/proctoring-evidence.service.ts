import { BadRequestException, ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { QueueService } from '../queue/queue.service';
import { AccessPolicyService } from '../common/services/access-policy.service';

type WebcamEvidencePolicy = {
  enabled: boolean;
  examProfile: 'THEORY' | 'MIXED' | 'CALCULATION';
  scheduledCaptureOffsetsMs: number[];
  eventCaptureLimit: number;
  eventCooldownMs: number;
  retentionDays: number;
  consentVersion: string;
};

const CAPTURE_WINDOW_MS = 5 * 60_000;
const SCHEDULED_CAPTURE_MIN_OFFSET_MS = 20_000;
const SCHEDULED_CAPTURE_MAX_OFFSET_MS = 280_000;
const SCHEDULED_CAPTURE_GRACE_MS = 90_000;

const DEFAULT_POLICY: WebcamEvidencePolicy = {
  enabled: false,
  examProfile: 'MIXED',
  scheduledCaptureOffsetsMs: [],
  eventCaptureLimit: 5,
  eventCooldownMs: 120_000,
  retentionDays: 30,
  consentVersion: 'webcam-evidence-v1',
};

@Injectable()
export class ProctoringEvidenceService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly accessPolicy: AccessPolicyService,
  ) {}

  onModuleInit() {
    const run = () => this.purgeExpired().catch(() => undefined);
    run();
    const timer = setInterval(run, 24 * 60 * 60 * 1000);
    timer.unref();
  }

  static normalizePolicy(input: any, randomizationSeed?: string, durationMinutes?: number | null): WebcamEvidencePolicy {
    const source = input && typeof input === 'object' ? input : {};
    const enabled = Boolean(source.enabled) && String(source.examProfile || '').toUpperCase() === 'THEORY';
    const configuredSchedule = Array.isArray(source.scheduledCaptureOffsetsMs)
      ? source.scheduledCaptureOffsetsMs
        .map((value: unknown) => Math.floor(Number(value)))
        .filter((value: number) => Number.isFinite(value) && value >= 0)
      : [];
    const captureCount = Math.max(0, Math.floor(Number(durationMinutes) || 0) / 5);
    const seed = String(randomizationSeed || randomUUID());
    const scheduledCaptureOffsetsMs = configuredSchedule.length > 0
      ? configuredSchedule
      : Array.from({ length: captureCount }, (_, slot) => {
          const digest = createHash('sha256').update(`${seed}:webcam-schedule:${slot}`).digest();
          const span = SCHEDULED_CAPTURE_MAX_OFFSET_MS - SCHEDULED_CAPTURE_MIN_OFFSET_MS + 1;
          const withinWindow = SCHEDULED_CAPTURE_MIN_OFFSET_MS + (digest.readUInt32BE(0) % span);
          return slot * CAPTURE_WINDOW_MS + withinWindow;
        });
    return {
      enabled,
      examProfile: String(source.examProfile || 'MIXED').toUpperCase() as WebcamEvidencePolicy['examProfile'],
      scheduledCaptureOffsetsMs,
      eventCaptureLimit: Math.min(5, Math.max(1, Number(source.eventCaptureLimit) || DEFAULT_POLICY.eventCaptureLimit)),
      eventCooldownMs: Math.max(120_000, Number(source.eventCooldownMs) || DEFAULT_POLICY.eventCooldownMs),
      retentionDays: 30,
      consentVersion: String(source.consentVersion || DEFAULT_POLICY.consentVersion),
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
    return ProctoringEvidenceService.normalizePolicy(instance?.snapshotPayload?.webcamEvidencePolicy, instance?.randomizationSeed);
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
      const recentEvents = await this.prisma.proctoringEvidenceCapture.findMany({
        where: { submissionId, trigger: 'SUSPICIOUS_EVENT', status: { not: 'PURGED' } },
        orderBy: { createdAt: 'desc' },
        take: policy.eventCaptureLimit,
      });
      if (recentEvents.length >= policy.eventCaptureLimit) throw new BadRequestException('Đã đạt giới hạn số lần ghi bằng chứng cho sự kiện nghi vấn');
      if (recentEvents[0] && now.getTime() - recentEvents[0].createdAt.getTime() < policy.eventCooldownMs) {
        throw new BadRequestException('Đang trong thời gian chờ giữa các lần ghi bằng chứng sự kiện nghi vấn');
      }
    }

    const nonce = randomUUID();
    const capture = await this.prisma.proctoringEvidenceCapture.create({
      data: {
        submissionId,
        examInstanceId: submission.examInstanceId!,
        trigger: dto.trigger,
        triggerDetails: { signals: (dto.signals || []).slice(0, 10) },
        scheduledSlot,
        scheduledAt,
        captureNonceHash: createHash('sha256').update(nonce).digest('hex'),
        nonceExpiresAt: new Date(now.getTime() + 60_000),
        retentionUntil: new Date(now.getTime() + policy.retentionDays * 86_400_000),
      },
      select: { id: true, nonceExpiresAt: true },
    });
    return { captureId: capture.id, nonce, expiresAt: capture.nonceExpiresAt, maxBytes: 1_000_000 };
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
    const root = process.env.PROCTORING_EVIDENCE_DIR || join(process.cwd(), 'var', 'proctoring-evidence');
    const storageKey = join(new Date().toISOString().slice(0, 10), `${capture.id}.${extension}`).replace(/\\/g, '/');
    const path = join(root, storageKey);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, image, { flag: 'wx' });

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
      select: { id: true, status: true, trigger: true, triggerDetails: true, scheduledSlot: true, scheduledAt: true, aiTags: true, aiProvider: true, aiAnalyzedAt: true, aiError: true, reviewStatus: true, reviewerNote: true, reviewedAt: true, capturedAt: true, retentionUntil: true, purgedAt: true, createdAt: true },
    });
  }

  async getImagePath(submissionId: string, captureId: string, user: any) {
    const capture = await this.prisma.proctoringEvidenceCapture.findFirst({ where: { id: captureId, submissionId }, include: { submission: { select: { examId: true } } } });
    if (!capture || !capture.storageKey || capture.status === 'PURGED') throw new NotFoundException('Không có ảnh bằng chứng');
    await this.accessPolicy.assertInstructorCanAccessExam(capture.submission.examId, user);
    return { path: join(process.env.PROCTORING_EVIDENCE_DIR || join(process.cwd(), 'var', 'proctoring-evidence'), capture.storageKey), mimeType: capture.mimeType || 'image/jpeg' };
  }

  async reviewCapture(submissionId: string, captureId: string, dto: { reviewStatus: 'REVIEWED' | 'DISMISSED'; reviewerNote?: string }, user: any) {
    const capture = await this.prisma.proctoringEvidenceCapture.findFirst({ where: { id: captureId, submissionId }, include: { submission: { select: { examId: true } } } });
    if (!capture) throw new NotFoundException('Không tìm thấy bản chụp bằng chứng');
    await this.accessPolicy.assertInstructorCanAccessExam(capture.submission.examId, user);
    return this.prisma.proctoringEvidenceCapture.update({ where: { id: captureId }, data: { reviewStatus: dto.reviewStatus, reviewerNote: dto.reviewerNote || null, reviewedById: user.id, reviewedAt: new Date() } });
  }

  async purgeExpired(): Promise<number> {
    const captures = await this.prisma.proctoringEvidenceCapture.findMany({ where: { retentionUntil: { lte: new Date() }, status: { not: 'PURGED' } }, select: { id: true, storageKey: true } });
    const root = process.env.PROCTORING_EVIDENCE_DIR || join(process.cwd(), 'var', 'proctoring-evidence');
    for (const capture of captures) {
      if (capture.storageKey) await rm(join(root, capture.storageKey), { force: true });
      await this.prisma.proctoringEvidenceCapture.update({ where: { id: capture.id }, data: { status: 'PURGED', storageKey: null, contentHash: null, mimeType: null, sizeBytes: null, purgedAt: new Date() } });
    }
    return captures.length;
  }

  async readCaptureForAi(captureId: string) {
    const capture = await this.prisma.proctoringEvidenceCapture.findUnique({ where: { id: captureId } });
    if (!capture?.storageKey || capture.status === 'PURGED') throw new NotFoundException('Không có ảnh bằng chứng');
    const path = join(process.env.PROCTORING_EVIDENCE_DIR || join(process.cwd(), 'var', 'proctoring-evidence'), capture.storageKey);
    return { capture, image: await readFile(path) };
  }
}
