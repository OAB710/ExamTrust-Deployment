import type { StatusTone, UiStatus } from "@/types/ui";

const STATUS_LABELS: Record<string, UiStatus> = {
  draft: { label: "Bản nháp", tone: "neutral" },
  published: { label: "Đã công bố", tone: "info" },
  ongoing: { label: "Đang diễn ra", tone: "warning" },
  completed: { label: "Đã hoàn thành", tone: "success" },
  archived: { label: "Đã lưu trữ", tone: "neutral" },
  not_started: { label: "Chưa bắt đầu", tone: "neutral" },
  in_progress: { label: "Đang làm bài", tone: "warning" },
  pending: { label: "Chờ xử lý", tone: "warning" },
  reviewed: { label: "Đã xem xét", tone: "info" },
  dismissed: { label: "Đã bỏ qua", tone: "neutral" },
  confirmed: { label: "Đã xác nhận", tone: "danger" },
  active: { label: "Đang hoạt động", tone: "success" },
  suspended: { label: "Đã tạm khóa", tone: "danger" },
  inactive: { label: "Ngừng hoạt động", tone: "neutral" },
  submitted: { label: "Đã nộp", tone: "success" },
  graded: { label: "Đã chấm", tone: "success" },
  approved: { label: "Đã duyệt", tone: "success" },
  rejected: { label: "Đã từ chối", tone: "danger" },
  flagged: { label: "Cần xem xét", tone: "warning" },
  failed: { label: "Không đạt", tone: "danger" },
  submit_failed: { label: "Nộp bài thất bại", tone: "danger" },
  grade_pending: { label: "Chờ chấm điểm", tone: "warning" },
  finalized: { label: "Đã hoàn tất", tone: "success" },
  expired: { label: "Đã kết thúc", tone: "neutral" },
};

function normalize(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getUiStatus(value?: string, fallbackTone: StatusTone = "neutral"): UiStatus {
  const key = normalize(value);
  return STATUS_LABELS[key] ?? { label: value || "Chưa xác định", tone: fallbackTone };
}

export function getExamStatusLabel(value?: string) {
  return getUiStatus(value).label;
}

export function getAttemptStatusLabel(value?: string) {
  return getUiStatus(value || "NOT_STARTED").label;
}

export function getExamWindowLabel(value?: string) {
  const key = normalize(value);
  const labels: Record<string, string> = {
    open: "Đang mở",
    upcoming: "Sắp mở",
    ended: "Đã kết thúc",
    closed: "Đã đóng",
    unknown: "Chưa xác định",
  };

  return labels[key] ?? "Chưa xác định";
}

export function getScheduleLabel(value?: string | Date | null) {
  if (!value) return "Chưa lên lịch";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa lên lịch";
  return formatDateTimeVi(date);
}

export function formatNumberVi(value?: number | null, fallback = "Chưa cập nhật") {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value);
}

export function formatDurationVi(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Chưa cập nhật";
  return `${formatNumberVi(value)} phút`;
}

export function formatAttemptLimitVi(value?: number | null) {
  if (value === null || value === undefined) return "Không giới hạn";
  return formatNumberVi(value);
}

export function formatDateVi(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  if (!value) return "Chưa có";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Không hợp lệ";
  return new Intl.DateTimeFormat("vi-VN", options).format(date);
}

export function formatDateTimeVi(value?: string | Date | null) {
  return formatDateVi(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatScoreVi(value?: number | null, maximum = 10) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Chưa chấm";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)}/${maximum}`;
}

export function formatPercentVi(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Chưa có";
  return new Intl.NumberFormat("vi-VN", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value > 1 ? value / 100 : value);
}
