export type AttentionPriority = "critical" | "high" | "medium" | "low";

export interface LecturerAttentionSummary {
  count: number;
  href: string;
}

export interface LecturerAttentionResponse {
  suspiciousReports: LecturerAttentionSummary;
  pendingAiQuestions: LecturerAttentionSummary;
  draftExams: LecturerAttentionSummary;
  upcomingExams: LecturerAttentionSummary;
}

export interface AttentionItemData {
  id: string;
  icon: React.ElementType;
  priority: AttentionPriority;
  message: string;
  count: number;
  actionLabel: string;
  href: string;
}
