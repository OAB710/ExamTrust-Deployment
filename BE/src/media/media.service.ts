import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmMediaUploadDto, CreatePresignedUploadDto } from './dto/media.dto';
import {
  MEDIA_ALLOWED_MIME_TYPES,
  MEDIA_EXTENSION_BY_MIME,
  MEDIA_MAX_BYTES,
  MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
  MEDIA_STORAGE_SAFE_CAP_BYTES,
} from './media.constants';

const USAGE_ROW_ID = 'global';

interface AuthUser {
  id: string;
}

// Object keys are namespaced as `questions/<uploaderId>/<uuid>.ext` (see
// createPresignedUpload below) — reuse that instead of threading the
// authenticated user through confirm/release just for usage bookkeeping.
function extractUploaderIdFromKey(key: string): string | null {
  const parts = key.split('/');
  return parts.length >= 3 && parts[0] === 'questions' ? parts[1] : null;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const endpoint =
      this.config.get<string>('R2_ENDPOINT') ||
      (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

    this.bucket = this.config.get<string>('R2_BUCKET_NAME') ?? '';
    this.publicBaseUrl = (this.config.get<string>('R2_PUBLIC_BASE_URL') ?? '').replace(/\/+$/, '');

    this.s3 = new S3Client({
      region: 'auto',
      endpoint,
      credentials: {
        accessKeyId: this.config.get<string>('R2_ACCESS_KEY_ID') ?? '',
        secretAccessKey: this.config.get<string>('R2_SECRET_ACCESS_KEY') ?? '',
      },
    });
  }

  async createPresignedUpload(dto: CreatePresignedUploadDto, user: AuthUser) {
    const allowedMimes = MEDIA_ALLOWED_MIME_TYPES[dto.mediaType];
    if (!allowedMimes.includes(dto.mimetype)) {
      throw new BadRequestException(
        `Loại tệp "${dto.mimetype}" không được hỗ trợ cho phương tiện dạng ${dto.mediaType}`,
      );
    }

    const maxBytes = MEDIA_MAX_BYTES[dto.mediaType];
    if (dto.sizeBytes > maxBytes) {
      throw new PayloadTooLargeException(
        `Kích thước tệp vượt quá giới hạn cho phép (${Math.round(maxBytes / (1024 * 1024))}MB)`,
      );
    }

    await this.assertQuotaAvailable(dto.sizeBytes);

    const extension = MEDIA_EXTENSION_BY_MIME[dto.mimetype] ?? '';
    const key = `questions/${user.id}/${randomUUID()}${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: dto.mimetype,
      ContentLength: dto.sizeBytes,
    });
    const uploadUrl = await getSignedUrl(this.s3, command, {
      expiresIn: MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
    });

    return {
      uploadUrl,
      key,
      publicUrl: `${this.publicBaseUrl}/${key}`,
      expiresInSeconds: MEDIA_PRESIGNED_URL_EXPIRY_SECONDS,
    };
  }

  async confirmUpload(dto: ConfirmMediaUploadDto) {
    // Re-checked here (not just at presign time) so a burst of concurrent
    // uploads can't collectively sail past the safe cap.
    await this.assertQuotaAvailable(dto.sizeBytes);
    await this.incrementUsage(dto.sizeBytes, extractUploaderIdFromKey(dto.key));
    return { key: dto.key, sizeBytes: dto.sizeBytes };
  }

  // Best-effort cleanup when a question's attachment is removed or replaced.
  // Never throws — an R2 delete failure must not block saving the question.
  async releaseObject(key?: string | null, sizeBytes?: number | null) {
    if (!key) return;
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(`Failed to delete R2 object ${key}: ${(err as Error)?.message}`);
    }
    if (sizeBytes) {
      await this.decrementUsage(sizeBytes, extractUploaderIdFromKey(key));
    }
  }

  // Per-user breakdown for admin reporting only — see MediaUserStorageUsage.
  async listUsageByUser() {
    const rows = await this.prisma.mediaUserStorageUsage.findMany({
      orderBy: { totalBytes: 'desc' },
    });
    return rows.map((row) => ({
      userId: row.userId,
      totalBytes: row.totalBytes.toString(),
      updatedAt: row.updatedAt,
    }));
  }

  private async assertQuotaAvailable(additionalBytes: number) {
    const used = await this.getUsage();
    if (used + BigInt(additionalBytes) > BigInt(MEDIA_STORAGE_SAFE_CAP_BYTES)) {
      throw new HttpException(
        'Đã đạt hạn mức lưu trữ phương tiện an toàn của hệ thống. Vui lòng liên hệ quản trị viên.',
        507,
      );
    }
  }

  private async getUsage(): Promise<bigint> {
    const row = await this.prisma.mediaStorageUsage.findUnique({ where: { id: USAGE_ROW_ID } });
    const value = row?.totalBytes ?? 0n;
    return value < 0n ? 0n : value;
  }

  private async incrementUsage(bytes: number, userId: string | null) {
    await this.prisma.$transaction([
      this.prisma.mediaStorageUsage.upsert({
        where: { id: USAGE_ROW_ID },
        create: { id: USAGE_ROW_ID, totalBytes: BigInt(bytes) },
        update: { totalBytes: { increment: BigInt(bytes) } },
      }),
      ...(userId
        ? [
            this.prisma.mediaUserStorageUsage.upsert({
              where: { userId },
              create: { userId, totalBytes: BigInt(bytes) },
              update: { totalBytes: { increment: BigInt(bytes) } },
            }),
          ]
        : []),
    ]);
  }

  private async decrementUsage(bytes: number, userId: string | null) {
    await this.prisma.$transaction([
      this.prisma.mediaStorageUsage.upsert({
        where: { id: USAGE_ROW_ID },
        create: { id: USAGE_ROW_ID, totalBytes: 0n },
        update: { totalBytes: { decrement: BigInt(bytes) } },
      }),
      ...(userId
        ? [
            this.prisma.mediaUserStorageUsage.upsert({
              where: { userId },
              create: { userId, totalBytes: 0n },
              update: { totalBytes: { decrement: BigInt(bytes) } },
            }),
          ]
        : []),
    ]);
  }
}
