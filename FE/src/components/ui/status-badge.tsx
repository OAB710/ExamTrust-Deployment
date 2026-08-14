"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold leading-none transition-colors",
  {
    variants: {
      tone: {
        neutral:
          "border-border bg-muted/70 text-muted-foreground shadow-sm shadow-black/5",
        success: "border-success/20 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        danger: "border-destructive/25 bg-destructive/10 text-destructive",
        info: "border-info/25 bg-info/10 text-info",
        accent: "border-accent/25 bg-accent/10 text-accent-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  }
);

export type StatusBadgeTone = VariantProps<typeof statusBadgeVariants>["tone"];

type LegacyStatusBadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "accent";

export type StatusBadgeDomain =
  | "exam"
  | "integrity"
  | "user"
  | "severity"
  | "confidence"
  | "submission"
  | "role"
  | "approval"
  | "session"
  | "course";

type StatusBadgeMapEntry = {
  tone: StatusBadgeTone;
  label?: string;
};

const STATUS_BADGE_MAP: Record<
  StatusBadgeDomain,
  Record<string, StatusBadgeMapEntry>
> = {
  exam: {
    draft: { tone: "neutral", label: "Bản nháp" },
    published: { tone: "info", label: "Đã công bố" },
    ongoing: { tone: "warning", label: "Đang diễn ra" },
    completed: { tone: "success", label: "Đã hoàn thành" },
    archived: { tone: "neutral", label: "Đã lưu trữ" },
  },
  integrity: {
    pending: { tone: "warning", label: "Chờ xem xét" },
    reviewed: { tone: "info", label: "Đã xem xét" },
    dismissed: { tone: "neutral", label: "Đã bỏ qua" },
    confirmed: { tone: "danger", label: "Đã xác nhận" },
  },
  user: {
    active: { tone: "success", label: "Đang hoạt động" },
    suspended: { tone: "danger", label: "Đã tạm khóa" },
    inactive: { tone: "neutral", label: "Ngừng hoạt động" },
    pending: { tone: "warning", label: "Chờ xử lý" },
  },
  severity: {
    none: { tone: "success", label: "Không có tín hiệu" },
    info: { tone: "info" },
    low: { tone: "neutral", label: "Thấp" },
    medium: { tone: "warning", label: "Trung bình" },
    warning: { tone: "warning", label: "Cảnh báo" },
    high: { tone: "danger", label: "Cao" },
    critical: { tone: "danger", label: "Nghiêm trọng" },
  },
  confidence: {
    low: { tone: "neutral" },
    medium: { tone: "warning" },
    high: { tone: "danger" },
  },
  submission: {
    downloading: { tone: "warning", label: "Đang tải xuống" },
    downloaded: { tone: "success", label: "Đã tải xuống" },
    available: { tone: "info", label: "Có sẵn" },
    expired: { tone: "danger", label: "Đã hết hạn" },
    flagged: { tone: "warning", label: "Cần xem xét" },
    approved: { tone: "success", label: "Đã duyệt" },
    rejected: { tone: "danger", label: "Đã từ chối" },
    pending: { tone: "warning", label: "Chờ xử lý" },
    not_started: { tone: "neutral", label: "Chưa bắt đầu" },
    in_progress: { tone: "warning", label: "Đang làm bài" },
    grade_pending: { tone: "warning", label: "Chờ chấm điểm" },
    graded: { tone: "success", label: "Đã chấm" },
    submitted: { tone: "success", label: "Đã nộp bài" },
    submit_failed: { tone: "danger", label: "Nộp bài thất bại" },
    failed: { tone: "danger", label: "Không đạt" },
  },
  role: {
    admin: { tone: "accent", label: "Quản trị viên" },
    lecturer: { tone: "info", label: "Giảng viên" },
    student: { tone: "neutral", label: "Sinh viên" },
  },
  approval: {
    pending: { tone: "warning" },
    approved: { tone: "success" },
    rejected: { tone: "danger" },
    dismissed: { tone: "neutral" },
  },
  session: {
    not_joined: { tone: "neutral", label: "Chưa tham gia" },
    in_progress: { tone: "warning", label: "Đang làm bài" },
    submitted: { tone: "success", label: "Đã nộp bài" },
    flagged: { tone: "danger", label: "Cần xem xét" },
    disconnected: { tone: "warning", label: "Mất kết nối" },
  },
  course: {
    draft: { tone: "warning", label: "Bản nháp" },
    active: { tone: "success", label: "Đang hoạt động" },
    archived: { tone: "neutral", label: "Đã lưu trữ" },
    published: { tone: "info", label: "Đã công bố" },
  },
};

function normalizeStatusKey(value?: string) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatBadgeText(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  const shouldPreserveCase =
    trimmed.includes("/") ||
    /\d/.test(trimmed) ||
    (trimmed.length <= 2 && trimmed === trimmed.toUpperCase());

  if (shouldPreserveCase) return trimmed;

  if (
    trimmed === trimmed.toUpperCase() ||
    trimmed === trimmed.toLowerCase() ||
    /[_-]/.test(trimmed)
  ) {
    return toTitleCase(trimmed.toLowerCase());
  }

  return trimmed;
}

function renderBadgeContent(content: React.ReactNode): React.ReactNode {
  if (typeof content === "string") {
    return formatBadgeText(content);
  }

  if (Array.isArray(content)) {
    // JSX like `Độ tin cậy {label}` compiles to two sibling string children:
    // ["Độ tin cậy ", "Cao"]. Formatting each independently trims the
    // trailing space off the first and glues them together with no
    // separator ("Độ tin cậyCao"). When every child is a plain string, join
    // them back into one string first so only the outer ends get trimmed.
    if (content.every((item) => typeof item === "string")) {
      return formatBadgeText((content as string[]).join(""));
    }
    return content.map((item, index) => (
      <React.Fragment key={index}>{renderBadgeContent(item)}</React.Fragment>
    ));
  }

  return content;
}

export function getStatusBadgeTone(
  status: string | undefined,
  domain?: StatusBadgeDomain,
  fallbackTone: StatusBadgeTone = "neutral",
): StatusBadgeTone {
  if (!domain) return fallbackTone;

  const entry = STATUS_BADGE_MAP[domain][normalizeStatusKey(status)];
  return entry?.tone ?? fallbackTone;
}

export function getStatusBadgeLabel(
  status: string | undefined,
  domain?: StatusBadgeDomain,
  fallbackLabel?: string,
): string {
  if (fallbackLabel) return fallbackLabel;

  if (!status) return "";

  const entry = domain
    ? STATUS_BADGE_MAP[domain][normalizeStatusKey(status)]
    : undefined;

  if (entry?.label) return entry.label;

  const globalEntry =
    STATUS_BADGE_MAP.exam[normalizeStatusKey(status)] ??
    STATUS_BADGE_MAP.submission[normalizeStatusKey(status)] ??
    STATUS_BADGE_MAP.integrity[normalizeStatusKey(status)] ??
    STATUS_BADGE_MAP.course[normalizeStatusKey(status)] ??
    STATUS_BADGE_MAP.approval[normalizeStatusKey(status)] ??
    STATUS_BADGE_MAP.session[normalizeStatusKey(status)];

  return globalEntry?.label ?? status;
}

interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: StatusBadgeTone;
  variant?: StatusBadgeTone | LegacyStatusBadgeVariant;
  status?: string;
  domain?: StatusBadgeDomain;
  label?: string;
  children?: React.ReactNode;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    { className, tone, variant, status, domain, label, children, ...props },
    ref,
  ) => {
    const resolvedTone =
      tone ??
      (variant === "default"
        ? "neutral"
        : variant === "destructive"
          ? "danger"
          : variant ?? getStatusBadgeTone(status, domain));
    const resolvedLabel = getStatusBadgeLabel(status, domain, label);
    const content = renderBadgeContent(children ?? resolvedLabel);

    return (
      <span
        ref={ref}
        className={cn(statusBadgeVariants({ tone: resolvedTone }), className)}
        {...props}
      >
        {content}
      </span>
    );
  },
);

StatusBadge.displayName = "StatusBadge";

export { statusBadgeVariants };

