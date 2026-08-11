// Kept intentionally conservative: these are app-level guardrails, not just
// UX limits. Cloudflare R2 has no account-wide auto-cutoff when the free
// tier is exceeded, so the only thing standing between this app and a real
// bill is this file.

export type MediaAttachmentType = 'image' | 'audio';

export const MEDIA_ALLOWED_MIME_TYPES: Record<MediaAttachmentType, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/webp'],
  audio: ['audio/mpeg', 'audio/wav'],
};

export const MEDIA_EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'audio/mpeg': '.mp3',
  'audio/wav': '.wav',
};

export const MEDIA_MAX_BYTES: Record<MediaAttachmentType, number> = {
  image: 2 * 1024 * 1024, // 2 MB
  audio: 8 * 1024 * 1024, // 8 MB
};

// Cloudflare R2 free tier is 10 GB of storage per month. We hard-stop new
// uploads once cumulative confirmed usage reaches 30% of that (3 GB),
// leaving a large safety margin against any drift between this counter and
// real bucket usage (e.g. a presigned URL issued but never confirmed).
export const MEDIA_STORAGE_SAFE_CAP_BYTES = 3 * 1024 * 1024 * 1024;

export const MEDIA_PRESIGNED_URL_EXPIRY_SECONDS = 300;
