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
    draft: { tone: "neutral", label: "Draft" },
    published: { tone: "info", label: "Published" },
    ongoing: { tone: "warning", label: "Ongoing" },
    completed: { tone: "success", label: "Completed" },
    archived: { tone: "neutral", label: "Archived" },
  },
  integrity: {
    pending: { tone: "warning", label: "Pending review" },
    reviewed: { tone: "info", label: "Reviewed" },
    dismissed: { tone: "neutral", label: "Dismissed" },
    confirmed: { tone: "danger", label: "Confirmed" },
  },
  user: {
    active: { tone: "success", label: "Active" },
    suspended: { tone: "danger", label: "Suspended" },
    inactive: { tone: "neutral", label: "Inactive" },
  },
  severity: {
    none: { tone: "success", label: "No signals" },
    info: { tone: "info" },
    low: { tone: "neutral", label: "Low" },
    medium: { tone: "warning", label: "Medium" },
    warning: { tone: "warning", label: "Warning" },
    high: { tone: "danger", label: "High" },
    critical: { tone: "danger", label: "Critical" },
  },
  confidence: {
    low: { tone: "neutral" },
    medium: { tone: "warning" },
    high: { tone: "danger" },
  },
  submission: {
    downloading: { tone: "warning", label: "Downloading" },
    downloaded: { tone: "success", label: "Downloaded" },
    available: { tone: "info", label: "Available" },
    expired: { tone: "danger", label: "Expired" },
    flagged: { tone: "warning", label: "Requires review" },
    approved: { tone: "success", label: "Approved" },
    rejected: { tone: "danger", label: "Rejected" },
    pending: { tone: "warning", label: "Pending" },
    not_started: { tone: "neutral", label: "Not started" },
    in_progress: { tone: "warning", label: "In progress" },
    grade_pending: { tone: "warning", label: "Grading pending" },
    graded: { tone: "success", label: "Graded" },
    submitted: { tone: "success", label: "Submitted" },
    submit_failed: { tone: "danger", label: "Submission failed" },
    failed: { tone: "danger", label: "Failed" },
  },
  role: {
    admin: { tone: "accent", label: "Administrator" },
    lecturer: { tone: "info", label: "Lecturer" },
    student: { tone: "neutral", label: "Student" },
  },
  approval: {
    pending: { tone: "warning" },
    approved: { tone: "success" },
    rejected: { tone: "danger" },
    dismissed: { tone: "neutral" },
  },
  session: {
    not_joined: { tone: "neutral", label: "Not joined" },
    in_progress: { tone: "warning", label: "In progress" },
    submitted: { tone: "success", label: "Submitted" },
    flagged: { tone: "danger", label: "Requires review" },
    disconnected: { tone: "warning", label: "Disconnected" },
  },
  course: {
    draft: { tone: "warning", label: "Draft" },
    active: { tone: "success", label: "Active" },
    archived: { tone: "neutral", label: "Archived" },
    published: { tone: "info", label: "Published" },
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

