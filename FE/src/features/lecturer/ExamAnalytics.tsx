"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ExternalLink, Sparkles, TrendingUp, AlertTriangle, BarChart3, CheckCircle2, Plus, Trash2, XCircle } from "lucide-react";
import api from "@/lib/api";
import { unwrapPaginatedData } from "@/lib/api";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ContextHelp, HelpedTitle } from "@/components/common/ContextHelp";

type CourseTerm = "TERM_1" | "TERM_2" | "TERM_3" | (string & {});

type AnalyticsCourseInfo = {
  id: string;
  code: string;
  name: string;
  academicYear: string | null;
  term: CourseTerm | null;
};

type ExamOption = {
  id: string;
  title: string;
  course?: AnalyticsCourseInfo;
};

type AiImprovementStatus =
  | "IDLE"
  | "QUEUED"
  | "GENERATING"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "EXPIRED";

type AiImprovementSummary = {
  id: string;
  status: AiImprovementStatus;
  rawStatus?: string;
  reviewStatus?: string;
  completedAt?: string | null;
  reviewedAt?: string | null;
  errorMessage?: string | null;
};

type AiImprovementDetail = AiImprovementSummary & {
  originalSnapshot?: Record<string, any>;
  proposal?: Record<string, any>;
  diagnosis?: {
    reason?: string;
    issues?: Array<{ type?: string; description?: string }>;
  };
  changes?: Array<{ field?: string; before?: string; after?: string; reason?: string }>;
  confidence?: number;
  warnings?: string[];
};

type ReviewMode = "proposal" | "compare" | "current";
type EditableOption = { id: string; text: string };

const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  MULTI_SELECT: "Nhiều đáp án",
  TRUE_FALSE: "Đúng / Sai",
  SHORT_ANSWER: "Trả lời ngắn",
  ESSAY: "Tự luận",
  FILL_IN_BLANK: "Điền khuyết",
  MATCHING: "Ghép đôi",
  ORDERING: "Sắp xếp",
};

const ISSUE_LABELS: Record<string, string> = {
  INCORRECT_ANSWER: "Sai đáp án",
  POOR_EXPLANATION: "Giải thích chưa rõ",
  AMBIGUOUS_QUESTION: "Câu hỏi mơ hồ",
  INVALID_OPTIONS: "Phương án chưa hợp lệ",
  POOR_CONTENT: "Nội dung chưa rõ",
};

const safeJsonValue = (value: any) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const normalizeEditableOptions = (value: any): EditableOption[] => {
  const raw = safeJsonValue(value);
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (typeof item === "object" && item !== null) {
        return {
          id: String(item.id ?? item.key ?? String.fromCharCode(65 + index)),
          text: String(item.text ?? item.label ?? item.value ?? ""),
        };
      }
      return { id: String.fromCharCode(65 + index), text: String(item ?? "") };
    });
  }
  if (typeof raw === "object" && raw !== null) {
    return Object.entries(raw).map(([id, text]) => ({
      id,
      text: String(text ?? ""),
    }));
  }
  return [];
};

const normalizeCorrectAnswerIds = (value: any): string[] => {
  const raw = safeJsonValue(value);
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item ?? ""));
  if (typeof raw === "object") {
    const obj = raw as Record<string, any>;
    if (obj.optionId) return [String(obj.optionId)];
    if (obj.answer !== undefined && obj.answer !== null) {
      const answer = String(obj.answer);
      return answer.includes(",") ? answer.split(",").map((item) => item.trim()) : [answer];
    }
    const checked = Object.entries(obj)
      .filter(([, value]) => value === true || value === "true" || value === 1 || value === "1")
      .map(([key]) => key);
    if (checked.length) return checked;
  }
  if (typeof raw === "boolean") return [raw ? "True" : "False"];
  return [String(raw)];
};

const serializeOptions = (options: EditableOption[]) =>
  options.reduce<Record<string, string>>((acc, option) => {
    acc[option.id] = option.text;
    return acc;
  }, {});

const serializeCorrectAnswer = (answers: string[]) => ({
  answer: answers.length > 1 ? answers.join(",") : answers[0] || "",
});

const hasFieldChanged = (before: any, after: any) =>
  JSON.stringify(safeJsonValue(before) ?? "") !== JSON.stringify(safeJsonValue(after) ?? "");

const TERM_LABELS: Record<string, string> = {
  TERM_1: "H\u1ecdc k\u1ef3 1",
  TERM_2: "H\u1ecdc k\u1ef3 2",
  TERM_3: "H\u1ecdc k\u1ef3 3",
};

const formatTerm = (term: string | null | undefined): string => {
  if (!term) return "Ch\u01b0a x\u00e1c \u0111\u1ecbnh h\u1ecdc k\u1ef3";
  return TERM_LABELS[term] || term;
};

const formatAcademicYear = (year: string | null | undefined): string => {
  if (!year) return "Ch\u01b0a x\u00e1c \u0111\u1ecbnh n\u0103m h\u1ecdc";
  return year;
};

const translateAiAnalysisText = (value?: string) => {
  if (!value) return "";
  return value
    .replace(/The question's current formulation lacks sufficient clarity regarding the application of WHERE and HAVING clauses when filtering aggregate results\./g, "Cách diễn đạt hiện tại chưa đủ rõ về việc sử dụng WHERE và HAVING khi lọc kết quả tổng hợp.")
    .replace(/The explanation is also too brief and doesn.t adequately illustrate the distinction\./g, "Phần giải thích còn quá ngắn và chưa làm rõ sự khác biệt.")
    .replace(/Question stem and explanation are not clear enough to differentiate between WHERE and HAVING clauses in the context of aggregate filtering\./g, "Đề bài và phần giải thích chưa đủ rõ để phân biệt WHERE và HAVING trong ngữ cảnh lọc dữ liệu tổng hợp.")
    .replace(/The 100% incorrect rate suggests students are struggling to identify the correct clause\./g, "Tỷ lệ sai 100% cho thấy sinh viên đang gặp khó khăn khi xác định mệnh đề đúng.");
};

const translateMetricText = (value: string) =>
  value
    .replace(/% incorrect/g, "% sai")
    .replace(/Skip rate:/g, "T\u1ef7 l\u1ec7 b\u1ecf qua:")
    .replace(/Q(\d+)/g, "C\u00e2u $1")
    .replace(/Performance is strongest/g, "Hi\u1ec7u su\u1ea5t t\u1ed1t nh\u1ea5t")
    .replace(/but weakness concentrates in/g, "nh\u01b0ng \u0111i\u1ec3m y\u1ebfu t\u1eadp trung \u1edf")
    .replace(/Time pressure is highest on/g, "\u00c1p l\u1ef1c th\u1eddi gian cao nh\u1ea5t \u1edf")
    .replace(/Prioritize targeted timed practice/g, "\u01afu ti\u00ean luy\u1ec7n t\u1eadp c\u00f3 gi\u1edbi h\u1ea1n th\u1eddi gian")
    .replace(/before the next full test/g, "tr\u01b0\u1edbc b\u00e0i ki\u1ec3m tra \u0111\u1ea7y \u0111\u1ee7 ti\u1ebfp theo");

type IntelligencePayload = {
  exam: { id: string; title: string; courseId: string };
  analyticsScope?: "OFFICIAL" | "PRACTICE";
  isUnlimited?: boolean;
  kpis: {
    totalSubmissions: number;
    analyzedSubmissions?: number;
    completedSubmissions: number;
    completionRate: number;
    avgScorePct: number;
    passRate: number;
  };
  visualizations: {
    correctVsIncorrect: {
      correct: number;
      incorrect: number;
      skipped: number;
    };
    trendSeries: Array<{ date: string; avgScorePct: number }>;
  };
  mostIncorrectQuestions: Array<{
    questionId: string;
    orderIndex: number;
    questionText: string;
    incorrectRate: number;
    skipRate: number;
    flaggedCount: number;
    aiImprovement?: AiImprovementSummary | null;
    action?: { path: string; params?: Record<string, string> };
  }>;
  weakestTopics: Array<{
    topicId?: string | null;
    topicName: string;
    incorrectRate: number;
    skipRate: number;
    action?: { path: string; params?: Record<string, string> };
  }>;
  slowestQuestionTypes: Array<{
    type: string;
    avgTimeSeconds: number;
    incorrectRate: number;
    action?: { path: string; params?: Record<string, string> };
  }>;
  mostFlaggedQuestions: Array<{
    questionId: string;
    orderIndex: number;
    flaggedCount: number;
    questionText: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  abnormalSkips: Array<{
    questionId: string;
    orderIndex: number;
    skipRate: number;
    questionText: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  aiSummary: string;
  aiRecommendations: Array<{
    title: string;
    detail: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  creatorQualityAlerts: Array<{
    questionId: string;
    questionLabel: string;
    signal: string;
    suggestion: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
};

function toQuery(params?: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default function ExamAnalytics() {
  const router = useRouter();
  const [requestedExamId, setRequestedExamId] = useState("");
  const [examOptions, setExamOptions] = useState<ExamOption[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingIntelligence, setLoadingIntelligence] = useState(false);
  const [data, setData] = useState<IntelligencePayload | null>(null);
  const [aiImprovements, setAiImprovements] = useState<Record<string, AiImprovementSummary>>({});
  const [aiImprovingQuestionId, setAiImprovingQuestionId] = useState<string | null>(null);
  const [reviewingImprovement, setReviewingImprovement] = useState<AiImprovementDetail | null>(null);
  const [reviewDraft, setReviewDraft] = useState<Record<string, any> | null>(null);
  const [reviewMode, setReviewMode] = useState<ReviewMode>("proposal");
  const [reviewOptions, setReviewOptions] = useState<EditableOption[]>([]);
  const [reviewAnswers, setReviewAnswers] = useState<string[]>([]);
  const [expandedOldFields, setExpandedOldFields] = useState<Record<string, boolean>>({});
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    setRequestedExamId(
      new URLSearchParams(window.location.search).get("examId") || "",
    );
  }, []);

  // Derived: unique academic years from all exams (via course)
  const academicYears = useMemo(() => {
    const years = new Set<string>();
    examOptions.forEach((ex) => {
      const year = ex.course?.academicYear;
      if (year && year.trim()) years.add(year);
    });
    return Array.from(years).sort().reverse();
  }, [examOptions]);

  // Derived: terms filtered by selected academic year
  const terms = useMemo(() => {
    const termSet = new Set<string>();
    const filtered = selectedAcademicYear && selectedAcademicYear !== "__all__"
      ? examOptions.filter((ex) => ex.course?.academicYear === selectedAcademicYear)
      : examOptions;
    filtered.forEach((ex) => {
      const t = ex.course?.term;
      if (t && t.trim()) termSet.add(t);
    });
    return Array.from(termSet);
  }, [examOptions, selectedAcademicYear]);

  // Derived: exams filtered by academic year and term
  const filteredExams = useMemo(() => {
    let result = examOptions;
    if (selectedAcademicYear && selectedAcademicYear !== "__all__") {
      result = result.filter((ex) => ex.course?.academicYear === selectedAcademicYear);
    }
    if (selectedTerm && selectedTerm !== "__all__") {
      result = result.filter((ex) => ex.course?.term === selectedTerm);
    }
    return result;
  }, [examOptions, selectedAcademicYear, selectedTerm]);

  // Sync selected exam when filters change
  useEffect(() => {
    if (!filteredExams.length) {
      setSelectedExamId("");
      return;
    }
    const stillValid = filteredExams.some((ex) => ex.id === selectedExamId);
    const requestedStillValid =
      requestedExamId && filteredExams.some((ex) => ex.id === requestedExamId);
    if (requestedStillValid && selectedExamId !== requestedExamId) {
      setSelectedExamId(requestedExamId);
      return;
    }
    if (!stillValid) {
      setSelectedExamId(filteredExams[0].id);
    }
  }, [filteredExams, requestedExamId, selectedExamId]);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);
        const response = await api.getExams({ page: 1, limit: 100 });
        const items = unwrapPaginatedData<ExamOption>(response);
        setExamOptions(items);
        if (items.length > 0) {
          const requestedExam = items.find((item) => item.id === requestedExamId);
          setSelectedExamId(requestedExam?.id || items[0].id);
        }
      } catch (error) {
        console.error("Failed to load exams for analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, [requestedExamId]);

  useEffect(() => {
    if (!selectedExamId) return;

    const loadIntelligence = async () => {
      try {
        setLoadingIntelligence(true);
        const payload = await api.getExamIntelligence(selectedExamId);
        setData(payload as IntelligencePayload);
        const nextImprovements: Record<string, AiImprovementSummary> = {};
        for (const item of (payload as IntelligencePayload).mostIncorrectQuestions || []) {
          if (item.aiImprovement?.id) {
            nextImprovements[item.questionId] = item.aiImprovement;
          }
        }
        setAiImprovements(nextImprovements);
      } catch (error) {
        console.error("Failed to load exam intelligence:", error);
        setData(null);
      } finally {
        setLoadingIntelligence(false);
      }
    };

    loadIntelligence();
  }, [selectedExamId]);

  useEffect(() => {
    const activeEntries = Object.entries(aiImprovements).filter(([, item]) =>
      item?.id && isPollingStatus(item.status),
    );
    if (!activeEntries.length) return;

    let cancelled = false;
    const interval = window.setInterval(async () => {
      for (const [questionId, improvement] of activeEntries) {
        try {
          const latest = await api.getQuestionAiImprovement(improvement.id) as AiImprovementSummary;
          if (!cancelled) setQuestionImprovement(questionId, latest);
        } catch (error) {
          console.error("Failed to poll AI improvement:", error);
        }
      }
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [aiImprovements]);

  const distribution = useMemo(() => {
    const total = (data?.visualizations.correctVsIncorrect.correct || 0)
      + (data?.visualizations.correctVsIncorrect.incorrect || 0)
      + (data?.visualizations.correctVsIncorrect.skipped || 0);
    return {
      total,
      correctPct: total ? ((data?.visualizations.correctVsIncorrect.correct || 0) / total) * 100 : 0,
      incorrectPct: total ? ((data?.visualizations.correctVsIncorrect.incorrect || 0) / total) * 100 : 0,
      skippedPct: total ? ((data?.visualizations.correctVsIncorrect.skipped || 0) / total) * 100 : 0,
    };
  }, [data]);

  const openAction = (action?: { path: string; params?: Record<string, string> }) => {
    if (!action?.path) return;
    router.push(`${action.path}${toQuery(action.params)}`);
  };

  const setQuestionImprovement = (questionId: string, improvement: AiImprovementSummary | null) => {
    setAiImprovements((current) => {
      const next = { ...current };
      if (improvement?.id) next[questionId] = improvement;
      else delete next[questionId];
      return next;
    });
  };

  const getQuestionImprovement = (questionId: string) =>
    aiImprovements[questionId] || data?.mostIncorrectQuestions.find((item) => item.questionId === questionId)?.aiImprovement || null;

  const isPollingStatus = (status?: string) => status === "QUEUED" || status === "GENERATING";

  const formatAiStatus = (status?: string) => {
    switch (status) {
      case "QUEUED":
        return "Đang chờ AI xử lý";
      case "GENERATING":
        return "AI đang cải thiện câu hỏi...";
      case "READY_FOR_REVIEW":
        return "AI đã đề xuất bản mới";
      case "APPROVED":
        return "Đã cải thiện chất lượng câu hỏi";
      case "REJECTED":
        return "Đã từ chối đề xuất AI";
      case "FAILED":
        return "Không thể tạo đề xuất";
      case "EXPIRED":
        return "Đề xuất không còn phù hợp";
      default:
        return "";
    }
  };

  const updateReviewDraft = (field: string, value: any) => {
    setReviewDraft((current) => ({ ...(current || {}), [field]: value }));
  };

  const closeAiReview = () => {
    setReviewingImprovement(null);
    setReviewDraft(null);
    setReviewMode("proposal");
    setReviewOptions([]);
    setReviewAnswers([]);
    setExpandedOldFields({});
    setReviewError("");
  };

  const openQuestionCurrentVersion = (item?: { action?: { path: string; params?: Record<string, string> } }) => {
    openAction(item?.action);
  };

  const createAiImprovement = async (item: IntelligencePayload["mostIncorrectQuestions"][number]) => {
    if (!selectedExamId || aiImprovingQuestionId) return;
    try {
      setAiImprovingQuestionId(item.questionId);
      const response = await api.createQuestionAiImprovement({
        questionId: item.questionId,
        examId: selectedExamId,
        analytics: {
          orderIndex: item.orderIndex,
          questionText: item.questionText,
          incorrectRate: item.incorrectRate,
          skipRate: item.skipRate,
          flaggedCount: item.flaggedCount,
        },
      });
      setQuestionImprovement(item.questionId, response as AiImprovementSummary);
    } catch (error) {
      console.error("Failed to create AI improvement:", error);
      setAiImprovements((current) => ({
        ...current,
        [item.questionId]: {
          id: "",
          status: "FAILED",
          errorMessage: error instanceof Error ? error.message : "Không thể tạo đề xuất AI.",
        },
      }));
    } finally {
      setAiImprovingQuestionId(null);
    }
  };

  const openAiReview = async (questionId: string, improvementId: string) => {
    try {
      setReviewBusy(true);
      setReviewError("");
      const detail = await api.getQuestionAiImprovement(improvementId) as AiImprovementDetail;
      setReviewingImprovement(detail);
      const draft = detail.proposal || {};
      setReviewDraft(draft);
      setReviewMode("proposal");
      setReviewOptions(normalizeEditableOptions(draft.options));
      setReviewAnswers(normalizeCorrectAnswerIds(draft.correctAnswer));
      setExpandedOldFields({});
      setQuestionImprovement(questionId, detail);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Không thể tải đề xuất AI.");
    } finally {
      setReviewBusy(false);
    }
  };

  const approveAiImprovement = async () => {
    if (!reviewingImprovement || !reviewDraft) return;
    if (!String(reviewDraft.content || "").trim()) {
      setReviewError("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (!window.confirm("Bản AI đề xuất sẽ thay thế nội dung hiện tại của câu hỏi. Bạn có chắc muốn tiếp tục?")) {
      return;
    }
    try {
      setReviewBusy(true);
      setReviewError("");
      const finalDraft = {
        ...reviewDraft,
        options: serializeOptions(reviewOptions),
        correctAnswer: serializeCorrectAnswer(reviewAnswers),
      };
      await api.updateQuestionAiImprovementDraft(reviewingImprovement.id, finalDraft);
      const updated = await api.approveQuestionAiImprovement(reviewingImprovement.id, finalDraft);
      const questionId = String(updated?.originalSnapshot?.questionId || reviewingImprovement.originalSnapshot?.questionId || "");
      if (questionId) setQuestionImprovement(questionId, updated as AiImprovementSummary);
      closeAiReview();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Không thể duyệt đề xuất AI.");
    } finally {
      setReviewBusy(false);
    }
  };

  const rejectAiImprovement = async () => {
    if (!reviewingImprovement) return;
    try {
      setReviewBusy(true);
      setReviewError("");
      const updated = await api.rejectQuestionAiImprovement(reviewingImprovement.id, "Giảng viên từ chối đề xuất trong Analytics.");
      const questionId = String(updated?.originalSnapshot?.questionId || reviewingImprovement.originalSnapshot?.questionId || "");
      if (questionId) setQuestionImprovement(questionId, updated as AiImprovementSummary);
      closeAiReview();
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Không thể từ chối đề xuất AI.");
    } finally {
      setReviewBusy(false);
    }
  };

  const getKpiCards = (payload: IntelligencePayload) => [
    {
      icon: TrendingUp,
      value: payload.kpis.avgScorePct.toFixed(1) + "%",
      label: "Điểm trung bình",
      iconWrapClassName: "bg-sky-500/10",
      iconClassName: "text-sky-600",
      className: "border-border/70 bg-sky-50/35",
    },
    {
      icon: TrendingUp,
      value: payload.kpis.passRate.toFixed(1) + "%",
      label: "Tỷ lệ đạt",
      iconWrapClassName: "bg-emerald-500/10",
      iconClassName: "text-emerald-600",
      className: "border-border/70 bg-emerald-50/35",
    },
    {
      icon: TrendingUp,
      value: payload.kpis.completionRate.toFixed(1) + "%",
      label: "Hoàn thành",
      iconWrapClassName: "bg-amber-500/10",
      iconClassName: "text-amber-600",
      className: "border-border/70 bg-amber-50/35",
    },
    {
      icon: AlertTriangle,
      value: payload.creatorQualityAlerts?.length ?? 0,
      label: "Cảnh báo chất lượng",
      iconWrapClassName: "bg-rose-500/10",
      iconClassName: "text-rose-600",
      className: "border-border/70 bg-rose-50/35",
    },
  ];

  const trackAction = async (name: string) => {
    try {
      await api.sendExamLogs(
        "analytics",
        [{ type: "analytics_action_click", details: JSON.stringify({ event: name, examId: selectedExamId }), ts: Date.now() }],
      );
    } catch {
      // Non-blocking tracking.
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải thiết lập phân tích...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminPageShell backTo="/lecturer">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            {data?.analyticsScope ? (
              <Badge variant={data.analyticsScope === "OFFICIAL" ? "default" : "secondary"} className="mb-2">
                {data.analyticsScope === "OFFICIAL" ? "Phân tích chính thức" : "Phân tích luyện tập"}
              </Badge>
            ) : null}
            <h1 className="text-2xl font-bold">Phân tích hiệu suất</h1>
            <p className="text-sm text-muted-foreground">
              Phân tích - Luyện tập - Cải thiện theo từng bài thi.
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Bộ lọc phân tích bài thi
            </CardTitle>
            <CardDescription>Chọn bài thi để xem phân tích hiệu suất</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[220px_220px_minmax(320px,1fr)]">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Năm học</label>
                <Select value={selectedAcademicYear} onValueChange={(val) => { setSelectedAcademicYear(val); setSelectedTerm(""); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả năm học</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Học kỳ</label>
                <Select value={selectedTerm} onValueChange={setSelectedTerm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tất cả học kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Tất cả học kỳ</SelectItem>
                    {terms.map((term) => (
                      <SelectItem key={term} value={term}>{formatTerm(term)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bài thi</label>
                <Select
                  value={selectedExamId}
                  onValueChange={setSelectedExamId}
                  disabled={loadingIntelligence || filteredExams.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filteredExams.length === 0 ? "Không tìm thấy bài thi" : "Chọn bài thi"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredExams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.course?.code ? `${e.course.code} - ` : ""}{e.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedExamId && (() => {
              const current = examOptions.find((ex) => ex.id === selectedExamId);
              if (!current) return null;
              return (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">Đang phân tích:</span>
                  {current.course?.code && <Badge variant="outline" className="text-xs">{current.course.code}</Badge>}
                  {current.course?.academicYear && <Badge variant="outline" className="text-xs">{current.course.academicYear}</Badge>}
                  {current.course?.term && <Badge variant="outline" className="text-xs">{formatTerm(current.course.term)}</Badge>}
                  <Badge variant="secondary" className="text-xs">{current.title}</Badge>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {!selectedExamId && !loadingIntelligence ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Không tìm thấy bài thi</p>
              <p className="text-sm mt-1">
                {selectedAcademicYear || selectedTerm
                  ? "Không có bài thi trong năm học và học kỳ đã chọn."
                  : "Chưa có bài thi để phân tích. Hãy tạo bài thi trước."}
              </p>
            </CardContent>
          </Card>
        ) : loadingIntelligence ? (
          <div className="min-h-[35vh] flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Đang tải dữ liệu phân tích...
          </div>
        ) : !data ? (
          <Card className="border-border/70 bg-card shadow-sm">
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">Chưa có dữ liệu hiệu suất</p>
              <p className="text-sm mt-1">Bài thi n?y ch?a c? d? li?u hi?u su?t.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {getKpiCards(data).map((card) => (
                <AdminStatCard
                  key={card.label}
                  icon={card.icon}
                  value={card.value}
                  label={card.label}
                  iconWrapClassName={card.iconWrapClassName}
                  iconClassName={card.iconClassName}
                  className={card.className}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="min-h-[240px] border-border/70 bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">&#272;&#250;ng / Sai / B&#7887; qua</CardTitle>
                  <CardDescription>T&#7893;ng quan nhanh k&#7871;t qu&#7843; tr&#7843; l&#7901;i.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>&#272;&#250;ng</span><span className="font-medium">{distribution.correctPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.correctPct} className="h-1.5 [&>div]:bg-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Sai</span><span className="font-medium">{distribution.incorrectPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.incorrectPct} className="h-1.5 [&>div]:bg-rose-500" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>B&#7887; qua</span><span className="font-medium">{distribution.skippedPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.skippedPct} className="h-1.5 [&>div]:bg-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-h-[240px] border-border/70 bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">Ti&#7871;n &#273;&#7897; theo th&#7901;i gian</CardTitle>
                  <CardDescription>&#272;i&#7875;m trung b&#236;nh theo ng&#224;y n&#7897;p b&#224;i.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.visualizations.trendSeries || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Ch&#432;a c&#243; d&#7919; li&#7879;u ti&#7871;n &#273;&#7897;.</p>
                  ) : (data.visualizations.trendSeries || []).map((row) => (
                    <div key={row.date} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-xs text-muted-foreground">{row.date}</span>
                      <Progress value={row.avgScorePct} className="h-1.5 flex-1 [&>div]:bg-primary" />
                      <span className="w-12 text-right text-xs font-medium">{row.avgScorePct}%</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/70 bg-card shadow-sm">
              <CardContent className="p-5">
                <div className="flex gap-4">
                  <div className="mt-1 h-12 w-1 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h2 className="text-base font-semibold text-foreground">
                        <HelpedTitle help={{
                          description: "Tóm tắt ngắn do AI tạo từ dữ liệu kết quả bài thi, tỷ lệ sai, chủ đề yếu và áp lực thời gian.",
                          usedBy: "Giảng viên dùng để nhìn nhanh xu hướng trước khi đi vào từng câu hỏi hoặc từng chủ đề.",
                          note: "Đây là gợi ý hỗ trợ phân tích, nên đối chiếu với dữ liệu chi tiết trước khi quyết định chỉnh đề.",
                        }}>
                          T&#243;m t&#7855;t AI
                        </HelpedTitle>
                      </h2>
                    </div>
                    <p className="max-w-4xl text-sm leading-6 text-foreground/85">
                      {translateMetricText(data.aiSummary)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold text-foreground">
                  <HelpedTitle help={{
                    description: "Tập hợp các chủ đề yếu và câu hỏi có tỷ lệ sai cao để giảng viên ưu tiên rà soát.",
                    usedBy: "Dùng sau khi bài thi có dữ liệu nộp bài, đặc biệt khi cần cải thiện chất lượng câu hỏi hoặc chuẩn bị ôn tập.",
                    note: "Tỷ lệ sai cao không luôn có nghĩa câu hỏi sai; có thể do chủ đề khó hoặc sinh viên chưa nắm kiến thức.",
                  }}>
                    &#272;i&#7875;m c&#7847;n ch&#250; &#253;
                  </HelpedTitle>
                </CardTitle>
                <CardDescription>Nh&#7919;ng ch&#7911; &#273;&#7873; v&#224; c&#226;u h&#7887;i c&#7847;n &#432;u ti&#234;n r&#224; so&#225;t.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Ch&#7911; &#273;&#7873; y&#7871;u nh&#7845;t</h3>
                      <Badge variant="outline" className="border-border bg-muted/40 text-xs">{data.weakestTopics.length}</Badge>
                    </div>
                    <div className="divide-y divide-border/70 rounded-md border border-border/70">
                      {data.weakestTopics.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Ch&#432;a c&#243; ch&#7911; &#273;&#7873; y&#7871;u n&#7893;i b&#7853;t.</p>
                      ) : data.weakestTopics.slice(0, 3).map((item) => (
                        <div key={`${item.topicId}-${item.topicName}`} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{item.topicName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">B&#7887; qua {item.skipRate.toFixed(0)}%</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">
                              {item.incorrectRate.toFixed(0)}% sai
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("weakest_topic_open_practice"); openAction(item.action); }}>
                            M&#7903; luy&#7879;n t&#7853;p <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">C&#226;u sai nhi&#7873;u nh&#7845;t</h3>
                      {data.mostIncorrectQuestions.length > 3 ? <Badge variant="secondary" className="text-xs">Hi&#7875;n th&#7883; 3/{data.mostIncorrectQuestions.length}</Badge> : null}
                    </div>
                    <div className="divide-y divide-border/70 rounded-md border border-border/70">
                      {data.mostIncorrectQuestions.slice(0, 3).map((item) => {
                        const improvement = getQuestionImprovement(item.questionId);
                        const status = improvement?.status || "IDLE";
                        const isCreating = aiImprovingQuestionId === item.questionId;
                        return (
                          <div key={item.questionId} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">C&#226;u {item.orderIndex + 1}</p>
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.questionText)}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">{item.incorrectRate.toFixed(0)}% sai</Badge>
                            </div>

                            {status === "APPROVED" ? (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {formatAiStatus(status)}
                                </Badge>
                                <ContextHelp content={{
                                  description: "Câu hỏi đã được giảng viên duyệt bản cải thiện và cập nhật vào ngân hàng câu hỏi.",
                                  usedBy: "Dùng để phân biệt câu hỏi đã xử lý xong với câu hỏi vẫn còn chờ xem xét.",
                                  note: "Các bài thi cũ vẫn nên giữ nguyên snapshot lịch sử, chỉ ngân hàng câu hỏi hiện tại được cập nhật.",
                                }} />
                                <Button variant="ghost" size="sm" className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("ai_improvement_open_current"); openQuestionCurrentVersion(item); }}>
                                  Xem phi&#234;n b&#7843;n hi&#7879;n t&#7841;i <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("most_incorrect_open_bank"); openAction(item.action); }}>
                                  M&#7903; c&#226;u h&#7887;i <ExternalLink className="ml-1 h-3.5 w-3.5" />
                                </Button>

                                {status === "IDLE" || status === "REJECTED" || status === "FAILED" || status === "EXPIRED" ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1"
                                      disabled={isCreating}
                                      onClick={() => {
                                        trackAction("create_ai_question_improvement");
                                        createAiImprovement(item);
                                      }}
                                    >
                                      {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                                      {status === "IDLE" ? "Nhờ AI cải thiện" : status === "FAILED" ? "Thử lại" : "Tạo đề xuất khác"}
                                    </Button>
                                    {status === "IDLE" ? <ContextHelp content={{
                                      description: "Yêu cầu AI phân tích câu hỏi có tỷ lệ sai cao và tạo một bản đề xuất cải thiện.",
                                      usedBy: "Giảng viên dùng khi muốn AI gợi ý cách viết lại nội dung, phương án, đáp án hoặc giải thích.",
                                      note: "AI không tự cập nhật ngân hàng câu hỏi; bản đề xuất chỉ có hiệu lực sau khi giảng viên duyệt.",
                                    }} /> : null}
                                  </>
                                ) : null}

                                {isPollingStatus(status) ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    {formatAiStatus(status)}
                                  </span>
                                ) : null}

                                {status === "READY_FOR_REVIEW" && improvement?.id ? (
                                  <>
                                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">{formatAiStatus(status)}</Badge>
                                    <Button size="sm" className="h-8 gap-1" onClick={() => openAiReview(item.questionId, improvement.id)}>
                                      <Sparkles className="h-3.5 w-3.5" /> Xem v&#224; duy&#7879;t
                                    </Button>
                                  </>
                                ) : null}

                                {status === "REJECTED" ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <XCircle className="h-3.5 w-3.5" /> {formatAiStatus(status)}
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">Khuy&#7871;n ngh&#7883; AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/70">
                    {data.aiRecommendations.slice(0, 3).map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold text-foreground">{translateMetricText(item.title)}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.detail)}</p>
                        <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("ai_recommendation_action"); openAction(item.action); }}>
                          Th&#7921;c hi&#7879;n <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">C&#7843;nh b&#225;o ch&#7845;t l&#432;&#7907;ng c&#226;u h&#7887;i</CardTitle>
                    <CardDescription>H&#7895; tr&#7907; gi&#7843;ng vi&#234;n r&#224; so&#225;t n&#7897;i dung c&#226;u h&#7887;i.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-1 whitespace-nowrap" disabled={!selectedExamId} onClick={() => { trackAction("open_ai_quality_review"); router.push(`/lecturer/exam/${selectedExamId}/quality-review`); }}>
                    <Sparkles className="h-3.5 w-3.5" /> R&#224; so&#225;t AI
                  </Button>
                </CardHeader>
                <CardContent>
                  {(data.creatorQualityAlerts?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Kh&#244;ng ph&#225;t hi&#7879;n c&#7843;nh b&#225;o ch&#7845;t l&#432;&#7907;ng c&#226;u h&#7887;i m&#7913;c r&#7911;i ro cao.</p>
                  ) : (
                    <div className="divide-y divide-border/70">
                      {data.creatorQualityAlerts.slice(0, 3).map((item) => (
                        <div key={item.questionId} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{translateMetricText(item.questionLabel)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{translateMetricText(item.signal)}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">C&#7843;nh b&#225;o</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.suggestion)}</p>
                          <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("quality_alert_open_question_bank"); openAction(item.action); }}>
                            Xem c&#226;u h&#7887;i <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Dialog open={Boolean(reviewingImprovement)} onOpenChange={(open) => {
          if (!open && !reviewBusy) closeAiReview();
        }}>
          <DialogContent className="flex h-[94vh] w-[min(1440px,96vw)] max-w-none flex-col overflow-hidden p-0">
            <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <HelpedTitle help={{
                      description: "Màn hình này cho phép xem, chỉnh sửa và duyệt bản cải thiện câu hỏi do AI đề xuất.",
                      usedBy: "Giảng viên dùng để kiểm tra nội dung AI tạo trước khi cập nhật câu hỏi trong ngân hàng.",
                      note: "AI chỉ tạo bản đề xuất. Câu hỏi chỉ được cập nhật sau khi giảng viên bấm duyệt.",
                    }}>
                      {"AI đề xuất cải thiện câu hỏi"}
                    </HelpedTitle>
                  </DialogTitle>
                  <DialogDescription className="mt-2">{"AI chỉ tạo bản đề xuất. Câu hỏi trong ngân hàng chỉ được cập nhật sau khi giảng viên duyệt."}</DialogDescription>
                </div>
                {reviewingImprovement ? <Badge variant="outline" className="shrink-0 border-primary/25 bg-primary/10 text-primary">{`Độ tin cậy ${Math.round(Number(reviewingImprovement.confidence || 0) * 100)}%`}</Badge> : null}
              </div>
            </DialogHeader>
            {reviewError ? <div className="mx-6 mt-4 shrink-0 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{reviewError}</div> : null}
            {reviewingImprovement && reviewDraft ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <Tabs value={reviewMode} onValueChange={(value) => setReviewMode(value as ReviewMode)} className="mb-5">
                  <TabsList className="grid w-full max-w-xl grid-cols-3"><TabsTrigger value="proposal">{"Bản AI đề xuất"}</TabsTrigger><TabsTrigger value="compare">{"So sánh thay đổi"}</TabsTrigger><TabsTrigger value="current">{"Bản hiện tại"}</TabsTrigger></TabsList>
                </Tabs>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                  <div className="space-y-5">
                    <QuestionReviewCard title="Loại câu hỏi" help={{
                      description: "Xác định cách sinh viên trả lời câu hỏi và cách hệ thống kiểm tra đáp án.",
                      usedBy: "Dùng khi xem bản AI đề xuất để đảm bảo AI không làm lệch dạng câu hỏi ban đầu.",
                      note: "Nếu đổi loại câu hỏi, cần kiểm tra lại phương án và đáp án đúng trước khi duyệt.",
                    }}><div className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium">{QUESTION_TYPE_LABELS[String(reviewDraft.type || reviewingImprovement.originalSnapshot?.type || "")] || String(reviewDraft.type || reviewingImprovement.originalSnapshot?.type || "Không xác định")}</div></QuestionReviewCard>
                    <EditableFieldCard title="Nội dung câu hỏi" field="content" mode={reviewMode} before={reviewingImprovement.originalSnapshot?.content} after={reviewDraft.content} expanded={Boolean(expandedOldFields.content)} onToggleOld={() => setExpandedOldFields((current) => ({ ...current, content: !current.content }))}><Textarea value={String(reviewDraft.content || "")} onChange={(event) => updateReviewDraft("content", event.target.value)} rows={6} className="min-h-32 resize-y bg-background text-sm leading-6" readOnly={reviewMode === "current"} /></EditableFieldCard>
                    <EditableOptionsCard mode={reviewMode} beforeOptions={reviewingImprovement.originalSnapshot?.options} beforeAnswers={reviewingImprovement.originalSnapshot?.correctAnswer} options={reviewOptions} answers={reviewAnswers} onOptionsChange={setReviewOptions} onAnswersChange={setReviewAnswers} />
                    <EditableFieldCard title="Giải thích" field="explanation" mode={reviewMode} before={reviewingImprovement.originalSnapshot?.explanation} after={reviewDraft.explanation} expanded={Boolean(expandedOldFields.explanation)} onToggleOld={() => setExpandedOldFields((current) => ({ ...current, explanation: !current.explanation }))}><Textarea value={String(reviewDraft.explanation || "")} onChange={(event) => updateReviewDraft("explanation", event.target.value)} rows={5} className="min-h-28 resize-y bg-background text-sm leading-6" readOnly={reviewMode === "current"} /></EditableFieldCard>
                  </div>
                  <aside className="space-y-5 lg:sticky lg:top-0">
                    <QuestionReviewCard title="Khóa học"><p className="text-sm text-muted-foreground">{String(reviewingImprovement.originalSnapshot?.courseCode || reviewingImprovement.originalSnapshot?.courseName || "Chưa có dữ liệu khóa học")}</p></QuestionReviewCard>
                    <QuestionReviewCard title="Độ khó" help={{
                      description: "Mức độ khó dự kiến của câu hỏi sau khi AI đề xuất chỉnh sửa.",
                      usedBy: "Giảng viên dùng để giữ độ khó phù hợp với mục tiêu đề thi và phân tích sau này.",
                      note: "Độ khó nên được xem như nhãn phân loại; dữ liệu bài làm thực tế mới phản ánh độ khó chính xác hơn.",
                    }}><Input type="number" min={1} max={10} value={Number(reviewDraft.difficulty || 1)} onChange={(event) => updateReviewDraft("difficulty", Number(event.target.value || 1))} className="max-w-28 bg-background" readOnly={reviewMode === "current"} /></QuestionReviewCard>
                    <QuestionReviewCard title="AI nhận định"><div className="space-y-3"><Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{`Độ tin cậy ${Math.round(Number(reviewingImprovement.confidence || 0) * 100)}%`}</Badge><p className="text-sm leading-6 text-muted-foreground">{translateAiAnalysisText(reviewingImprovement.diagnosis?.reason) || "AI chưa cung cấp nhận định tổng quan."}</p>{(reviewingImprovement.diagnosis?.issues || []).length ? <div className="space-y-2">{reviewingImprovement.diagnosis?.issues?.map((issue, index) => <div key={`${issue.type}-${index}`} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"><p className="font-medium">{ISSUE_LABELS[String(issue.type || "")] || issue.type || "Vấn đề cần xem xét"}</p>{issue.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{translateAiAnalysisText(issue.description)}</p> : null}</div>)}</div> : null}</div></QuestionReviewCard>
                    <QuestionReviewCard title="Trạng thái thay đổi"><div className="space-y-2 text-sm text-muted-foreground"><ChangeStatus label="Nội dung câu hỏi" changed={hasFieldChanged(reviewingImprovement.originalSnapshot?.content, reviewDraft.content)} /><ChangeStatus label="Phương án" changed={hasFieldChanged(reviewingImprovement.originalSnapshot?.options, serializeOptions(reviewOptions))} /><ChangeStatus label="Đáp án" changed={hasFieldChanged(reviewingImprovement.originalSnapshot?.correctAnswer, serializeCorrectAnswer(reviewAnswers))} /><ChangeStatus label="Giải thích" changed={hasFieldChanged(reviewingImprovement.originalSnapshot?.explanation, reviewDraft.explanation)} /></div></QuestionReviewCard>
                  </aside>
                </div>
              </div>
            ) : reviewBusy ? <div className="grid min-h-80 flex-1 place-items-center text-muted-foreground"><div className="space-y-4 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><div className="space-y-1 text-sm"><p>{"Đang phân tích câu hỏi."}</p><p>{"Đang kiểm tra đáp án."}</p><p>{"Đang viết lại nội dung và giải thích."}</p></div></div></div> : null}
            <DialogFooter className="sticky bottom-0 z-10 shrink-0 justify-between gap-3 border-t border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80"><div className="flex gap-2"><Button variant="outline" disabled={reviewBusy} onClick={closeAiReview}>{"Hủy"}</Button><Button variant="outline" disabled={reviewBusy || !reviewingImprovement} onClick={rejectAiImprovement}>{"Giữ nguyên câu hỏi hiện tại"}</Button></div><div className="flex gap-2"><Button variant="outline" disabled={reviewBusy} onClick={() => setReviewDraft((current) => ({ ...(current || {}), savedAt: new Date().toISOString() }))}>{"Lưu bản nháp"}</Button><Button disabled={reviewBusy || !reviewDraft?.content} onClick={approveAiImprovement}>{reviewBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{"Duyệt và cập nhật câu hỏi"}</Button></div></DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminPageShell>
    </DashboardLayout>
  );
}

function QuestionReviewCard({ title, help, children }: { title: string; help?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          {help ? <HelpedTitle help={help}>{title}</HelpedTitle> : title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EditableFieldCard({ title, field, mode, before, after, expanded, onToggleOld, children }: { title: string; field: string; mode: ReviewMode; before: any; after: any; expanded: boolean; onToggleOld: () => void; children: React.ReactNode }) {
  const changed = hasFieldChanged(before, after);
  return <QuestionReviewCard title={title}><div className="space-y-3"><div className="flex flex-wrap items-center gap-2">{changed && mode !== "proposal" ? <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{"AI đã chỉnh sửa"}</Badge> : null}{changed && mode === "compare" ? <Button variant="outline" size="sm" className="h-8" onClick={onToggleOld}>{expanded ? "Ẩn bản cũ" : "Xem bản cũ"}</Button> : null}</div>{mode === "current" || expanded ? <div className="rounded-lg border border-border bg-muted/30 p-3"><p className="text-xs font-medium text-muted-foreground">{"Bản hiện tại"}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{String(before || "Chưa có dữ liệu")}</p></div> : null}{mode !== "current" ? children : null}<span className="sr-only">{field}</span></div></QuestionReviewCard>;
}

function EditableOptionsCard({ mode, beforeOptions, beforeAnswers, options, answers, onOptionsChange, onAnswersChange }: { mode: ReviewMode; beforeOptions: any; beforeAnswers: any; options: EditableOption[]; answers: string[]; onOptionsChange: (options: EditableOption[]) => void; onAnswersChange: (answers: string[]) => void }) {
  const beforeRows = normalizeEditableOptions(beforeOptions);
  const beforeCorrect = normalizeCorrectAnswerIds(beforeAnswers);
  const changed = hasFieldChanged(beforeOptions, serializeOptions(options)) || hasFieldChanged(beforeAnswers, serializeCorrectAnswer(answers));
  const setOptionText = (id: string, value: string) => onOptionsChange(options.map((option) => option.id === id ? { ...option, text: value } : option));
  const addOption = () => onOptionsChange([...options, { id: String.fromCharCode(65 + options.length), text: "" }]);
  const removeOption = (id: string) => { onOptionsChange(options.filter((option) => option.id !== id)); onAnswersChange(answers.filter((answer) => answer !== id)); };
  const toggleAnswer = (id: string) => onAnswersChange(answers.includes(id) ? answers.filter((answer) => answer !== id) : [id]);
  return <QuestionReviewCard title="Phương án / Đáp án đúng"><div className="space-y-4">{changed && mode === "compare" ? <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">{"AI đã chỉnh sửa phương án hoặc đáp án"}</Badge> : null}{mode === "current" ? <div className="space-y-2">{beforeRows.length ? beforeRows.map((option) => <OptionPreviewRow key={option.id} option={option} isCorrect={beforeCorrect.includes(option.id)} />) : <p className="text-sm text-muted-foreground">{"Câu hỏi hiện tại chưa có phương án."}</p>}</div> : <><div className="space-y-2">{options.map((option) => <div key={option.id} className="grid grid-cols-[40px_minmax(0,1fr)_36px] items-center gap-2"><button type="button" onClick={() => toggleAnswer(option.id)} className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-semibold ${answers.includes(option.id) ? "border-success bg-success/15 text-success" : "border-border text-muted-foreground"}`} aria-label={`Chọn ${option.id} là đáp án đúng`}>{answers.includes(option.id) ? <CheckCircle2 className="h-4 w-4" /> : option.id}</button><Input value={option.text} onChange={(event) => setOptionText(option.id, event.target.value)} className="bg-background" placeholder={`Phương án ${option.id}`} /><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeOption(option.id)}><Trash2 className="h-4 w-4" /></Button></div>)}</div><Button variant="outline" size="sm" className="gap-1.5" onClick={addOption}><Plus className="h-4 w-4" />{"Thêm phương án"}</Button></>}</div></QuestionReviewCard>;
}

function OptionPreviewRow({ option, isCorrect }: { option: EditableOption; isCorrect: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-semibold ${isCorrect ? "border-success bg-success/15 text-success" : "border-border text-muted-foreground"}`}>{isCorrect ? <CheckCircle2 className="h-4 w-4" /> : option.id}</span>
      <span className="leading-6">{option.text}</span>
    </div>
  );
}

function ChangeStatus({ label, changed }: { label: string; changed: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <Badge variant="outline" className={changed ? "border-primary/25 bg-primary/10 text-primary" : "border-border bg-muted/40 text-muted-foreground"}>{changed ? "Đã chỉnh sửa" : "Không đổi"}</Badge>
    </div>
  );
}
