import { api } from "@/lib/api";

export type MediaAttachmentType = "image" | "audio";

export interface MediaAttachment {
  mediaUrl: string;
  mediaKey: string;
  mediaSizeBytes: number;
  mediaType: MediaAttachmentType;
}

// Mirrors BE/src/media/media.constants.ts — kept duplicated (not shared) since
// FE and BE are separate deployable packages; the BE values are the ones
// that actually get enforced, this is only for fast client-side feedback.
export const MEDIA_ALLOWED_MIME_TYPES: Record<MediaAttachmentType, string[]> = {
  image: ["image/png", "image/jpeg", "image/webp"],
  audio: ["audio/mpeg", "audio/wav"],
};

export const MEDIA_ACCEPT: Record<MediaAttachmentType, string> = {
  image: MEDIA_ALLOWED_MIME_TYPES.image.join(","),
  audio: MEDIA_ALLOWED_MIME_TYPES.audio.join(","),
};

export const MEDIA_MAX_BYTES: Record<MediaAttachmentType, number> = {
  image: 2 * 1024 * 1024,
  audio: 8 * 1024 * 1024,
};

export function validateMediaFile(file: File, mediaType: MediaAttachmentType): string | null {
  if (!MEDIA_ALLOWED_MIME_TYPES[mediaType].includes(file.type)) {
    return mediaType === "image"
      ? "Chỉ hỗ trợ ảnh PNG, JPEG hoặc WEBP."
      : "Chỉ hỗ trợ âm thanh MP3 hoặc WAV.";
  }
  const maxBytes = MEDIA_MAX_BYTES[mediaType];
  if (file.size > maxBytes) {
    return `Tệp vượt quá giới hạn ${Math.round(maxBytes / (1024 * 1024))}MB.`;
  }
  return null;
}

export async function uploadMediaFile(file: File, mediaType: MediaAttachmentType): Promise<MediaAttachment> {
  const presign = await api.createMediaPresign({
    mediaType,
    mimetype: file.type,
    sizeBytes: file.size,
  });

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error("Tải tệp lên Cloudflare R2 thất bại. Vui lòng thử lại.");
  }

  await api.confirmMediaUpload({ key: presign.key, sizeBytes: file.size });

  return {
    mediaUrl: presign.publicUrl,
    mediaKey: presign.key,
    mediaSizeBytes: file.size,
    mediaType,
  };
}

// Best-effort: releasing an orphaned upload (replaced/removed before the
// question was saved) must never block the UI if it fails.
export function releaseMediaUpload(attachment: MediaAttachment | null | undefined) {
  if (!attachment) return;
  api.releaseMediaUpload({ key: attachment.mediaKey, sizeBytes: attachment.mediaSizeBytes }).catch(() => {});
}
