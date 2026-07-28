import type { StatusTone, UiStatus } from "@/types/ui";

const STATUS_LABELS: Record<string, UiStatus> = {
  draft: { label: "Draft", tone: "neutral" },
  published: { label: "Published", tone: "info" },
  ongoing: { label: "Ongoing", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  archived: { label: "Archived", tone: "neutral" },
  not_started: { label: "Not started", tone: "neutral" },
  in_progress: { label: "In progress", tone: "warning" },
  pending: { label: "Pending", tone: "warning" },
  reviewed: { label: "Reviewed", tone: "info" },
  dismissed: { label: "Dismissed", tone: "neutral" },
  confirmed: { label: "Confirmed", tone: "danger" },
  active: { label: "Active", tone: "success" },
  suspended: { label: "Suspended", tone: "danger" },
  inactive: { label: "Inactive", tone: "neutral" },
  submitted: { label: "Submitted", tone: "success" },
  graded: { label: "Graded", tone: "success" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  flagged: { label: "Needs review", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  submit_failed: { label: "Submission failed", tone: "danger" },
  grade_pending: { label: "Grading pending", tone: "warning" },
  finalized: { label: "Finalized", tone: "success" },
  expired: { label: "Ended", tone: "neutral" },
};

function normalize(value?: string) {
  return (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function getUiStatus(value?: string, fallbackTone: StatusTone = "neutral"): UiStatus {
  const key = normalize(value);
  return STATUS_LABELS[key] ?? { label: value || "Unknown", tone: fallbackTone };
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
    open: "Open",
    upcoming: "Opening soon",
    ended: "Ended",
    closed: "Closed",
    unknown: "Unknown",
  };

  return labels[key] ?? "Unknown";
}

export function getScheduleLabel(value?: string | Date | null) {
  if (!value) return "Not scheduled";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return formatDateTimeVi(date);
}

export function formatNumberVi(value?: number | null, fallback = "Not available") {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export function formatDurationVi(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not available";
  return `${formatNumberVi(value)} minutes`;
}

export function formatAttemptLimitVi(value?: number | null) {
  if (value === null || value === undefined) return "Unlimited";
  return formatNumberVi(value);
}

export function formatDateVi(
  value?: string | Date | null,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
) {
  if (!value) return "Not available";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-US", options).format(date);
}

export function formatDateTimeVi(value?: string | Date | null) {
  return formatDateVi(value, { dateStyle: "medium", timeStyle: "short" });
}

export function formatScoreVi(value?: number | null, maximum = 10) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not graded";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)}/${maximum}`;
}

export function formatPercentVi(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(value > 1 ? value / 100 : value);
}
