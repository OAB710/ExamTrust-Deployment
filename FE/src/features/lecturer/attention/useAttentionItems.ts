"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Clock, AlertTriangle, Sparkles } from "lucide-react";
import api from "@/lib/api";
import type { AttentionItemData, AttentionPriority } from "./types";

export const LECTURER_ATTENTION_QUERY_KEY = ["lecturer", "dashboard", "attention"] as const;

const PRIORITY_ORDER: Record<AttentionPriority, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function sortByPriority(a: AttentionItemData, b: AttentionItemData) {
  return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
}

export function useAttentionItems() {
  const query = useQuery({
    queryKey: LECTURER_ATTENTION_QUERY_KEY,
    queryFn: () => api.getLecturerAttention(),
    staleTime: 30_000,
    retry: 1,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const items = useMemo<AttentionItemData[]>(() => {
    if (!query.data) return [];

    const result: AttentionItemData[] = [];
    const { suspiciousReports, pendingAiQuestions, draftExams, upcomingExams } = query.data;

    if (suspiciousReports.count > 0) {
      result.push({
        id: "suspicious-reports",
        icon: AlertTriangle,
        priority: "critical",
        message: `${suspiciousReports.count} suspicious activity ${suspiciousReports.count === 1 ? "report requires" : "reports require"} instructor review`,
        count: suspiciousReports.count,
        actionLabel: "Review flags",
        href: suspiciousReports.href,
      });
    }

    if (pendingAiQuestions.count > 0) {
      result.push({
        id: "pending-ai-questions",
        icon: Sparkles,
        priority: "high",
        message: `${pendingAiQuestions.count} AI-generated ${pendingAiQuestions.count === 1 ? "question is" : "questions are"} waiting for approval`,
        count: pendingAiQuestions.count,
        actionLabel: "Review questions",
        href: pendingAiQuestions.href,
      });
    }

    if (draftExams.count > 0) {
      result.push({
        id: "draft-exams",
        icon: FileText,
        priority: "high",
        message: `${draftExams.count} draft ${draftExams.count === 1 ? "exam has" : "exams have"} not been published`,
        count: draftExams.count,
        actionLabel: "Continue editing",
        href: draftExams.href,
      });
    }

    if (upcomingExams.count > 0) {
      result.push({
        id: "upcoming-exams",
        icon: Clock,
        priority: "medium",
        message: `${upcomingExams.count} ${upcomingExams.count === 1 ? "exam starts" : "exams start"} within the next 24 hours`,
        count: upcomingExams.count,
        actionLabel: "Review schedule",
        href: upcomingExams.href,
      });
    }

    return result.sort(sortByPriority);
  }, [query.data]);

  return {
    items,
    loading: query.isPending,
    error: query.isError,
    retry: query.refetch,
  };
}
