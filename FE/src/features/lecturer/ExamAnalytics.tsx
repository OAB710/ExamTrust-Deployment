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
import { Loader2, ExternalLink, Sparkles, TrendingUp, AlertTriangle, BarChart3, CheckCircle2, X, XCircle } from "lucide-react";
import api from "@/lib/api";
import { unwrapPaginatedData } from "@/lib/api";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ContextHelp, HelpedTitle } from "@/components/common/ContextHelp";
import {
  ISSUE_LABELS,
  QUESTION_TYPE_LABELS,
  buildComparisonSnapshot,
  formatPreviewDate,
  formatTerm,
  getChangedComparisonFields,
  getCourseLabel,
  getDifficultyLabel,
  normalizeCorrectAnswerIds,
  normalizeEditableOptions,
  toQuery,
  translateAiAnalysisText,
  translateMetricText,
  type AiImprovementDetail,
  type AiImprovementSummary,
  type ComparisonFieldKey,
  type EditableOption,
  type ExamOption,
  type IntelligencePayload,
  type PreviewQuestion,
  type QuestionComparisonSnapshot,
  type QuestionCourseInfo,
} from "./exam-analytics-model";

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
  const [reviewQuestionCourse, setReviewQuestionCourse] =
    useState<QuestionCourseInfo | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [previewQuestion, setPreviewQuestion] =
    useState<PreviewQuestion | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

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

  const closeQuestionPreview = () => {
    setPreviewQuestion(null);
    setPreviewError("");
    setPreviewLoading(false);
  };

  const openQuestionPreview = async (item: {
    questionId: string;
    questionText?: string;
  }) => {
    setPreviewError("");
    setPreviewLoading(true);
    setPreviewQuestion({
      id: item.questionId,
      content: item.questionText || "",
    });
    try {
      const detail = (await api.getQuestionById(
        item.questionId,
      )) as PreviewQuestion;
      setPreviewQuestion(detail);
    } catch (error) {
      setPreviewError(
        error instanceof Error
          ? error.message
          : "Không thể tải chi tiết câu hỏi.",
      );
    } finally {
      setPreviewLoading(false);
    }
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

  const closeAiReview = () => {
    setReviewingImprovement(null);
    setReviewQuestionCourse(null);
    setReviewError("");
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
      setReviewQuestionCourse(null);
      const detail = await api.getQuestionAiImprovement(improvementId) as AiImprovementDetail;
      const selectedExamCourse = examOptions.find(
        (exam) => exam.id === selectedExamId,
      )?.course;
      let fetchedQuestion: any = null;
      try {
        fetchedQuestion = await api.getQuestionById(questionId);
      } catch {
        fetchedQuestion = null;
      }
      const fetchedCourse =
        fetchedQuestion?.course ||
        fetchedQuestion?.currentVersion?.course ||
        fetchedQuestion?.question?.course ||
        null;
      const snapshotCourse: QuestionCourseInfo = {
        id:
          detail.originalSnapshot?.courseId ||
          detail.originalSnapshot?.course?.id ||
          null,
        code:
          detail.originalSnapshot?.courseCode ||
          detail.originalSnapshot?.course?.code ||
          null,
        name:
          detail.originalSnapshot?.courseName ||
          detail.originalSnapshot?.course?.name ||
          null,
        academicYear:
          detail.originalSnapshot?.academicYear ||
          detail.originalSnapshot?.courseAcademicYear ||
          detail.originalSnapshot?.course?.academicYear ||
          null,
        term:
          detail.originalSnapshot?.term ||
          detail.originalSnapshot?.courseTerm ||
          detail.originalSnapshot?.course?.term ||
          null,
      };
      const resolvedCourse: QuestionCourseInfo | null =
        getCourseLabel(snapshotCourse)
          ? snapshotCourse
          : fetchedCourse
            ? {
                id: fetchedCourse.id || fetchedQuestion?.courseId || null,
                code: fetchedCourse.code || null,
                name: fetchedCourse.name || null,
                academicYear: fetchedCourse.academicYear || null,
                term: fetchedCourse.term || null,
              }
            : selectedExamCourse
              ? {
                  id: selectedExamCourse.id,
                  code: selectedExamCourse.code,
                  name: selectedExamCourse.name,
                  academicYear: selectedExamCourse.academicYear,
                  term: selectedExamCourse.term,
                }
              : null;
      if (resolvedCourse) {
        setReviewQuestionCourse(resolvedCourse);
        detail.originalSnapshot = {
          ...(detail.originalSnapshot || {}),
          courseId: detail.originalSnapshot?.courseId || resolvedCourse.id,
          courseCode:
            detail.originalSnapshot?.courseCode || resolvedCourse.code,
          courseName:
            detail.originalSnapshot?.courseName || resolvedCourse.name,
          courseAcademicYear:
            detail.originalSnapshot?.courseAcademicYear ||
            resolvedCourse.academicYear,
          courseTerm:
            detail.originalSnapshot?.courseTerm || resolvedCourse.term,
        };
      }
      if (fetchedQuestion) {
        detail.originalSnapshot = {
          ...(fetchedQuestion || {}),
          ...(detail.originalSnapshot || {}),
        };
      }
      setReviewingImprovement(detail);
      setQuestionImprovement(questionId, detail);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Không thể tải đề xuất AI.");
    } finally {
      setReviewBusy(false);
    }
  };

  const approveAiImprovement = async () => {
    if (!reviewingImprovement) return;
    const finalDraft = reviewingImprovement.finalApproved || reviewingImprovement.proposal || null;
    if (!finalDraft) {
      setReviewError("Không tìm thấy bản cải thiện để áp dụng.");
      return;
    }
    if (!String(finalDraft.content || "").trim()) {
      setReviewError("Nội dung câu hỏi không được để trống.");
      return;
    }
    if (!window.confirm("Bản AI đề xuất sẽ thay thế nội dung hiện tại của câu hỏi. Bạn có chắc muốn tiếp tục?")) {
      return;
    }
    try {
      setReviewBusy(true);
      setReviewError("");
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

  const snapshotCourse: QuestionCourseInfo | null = reviewingImprovement
    ? {
        id: reviewingImprovement.originalSnapshot?.courseId || null,
        code: reviewingImprovement.originalSnapshot?.courseCode || null,
        name: reviewingImprovement.originalSnapshot?.courseName || null,
        academicYear:
          reviewingImprovement.originalSnapshot?.courseAcademicYear || null,
        term: reviewingImprovement.originalSnapshot?.courseTerm || null,
      }
    : null;
  const displayedReviewCourse =
    reviewQuestionCourse ||
    (getCourseLabel(snapshotCourse) ? snapshotCourse : null);

  const comparisonBefore = reviewingImprovement
    ? buildComparisonSnapshot(reviewingImprovement.originalSnapshot, displayedReviewCourse)
    : null;
  const comparisonAfter = reviewingImprovement
    ? buildComparisonSnapshot(
        reviewingImprovement.status === "APPROVED"
          ? reviewingImprovement.finalApproved || reviewingImprovement.proposal
          : reviewingImprovement.proposal || reviewingImprovement.finalApproved,
        displayedReviewCourse,
      )
    : null;
  const comparisonChanges =
    comparisonBefore && comparisonAfter
      ? getChangedComparisonFields(comparisonBefore, comparisonAfter)
      : [];
  const canApplyImprovement = reviewingImprovement?.status === "READY_FOR_REVIEW";

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
            <h1 className="text-xl font-bold sm:text-2xl">Phân tích hiệu suất</h1>
            <p className="text-sm text-muted-foreground">
              Phân tích - Luyện tập - Cải thiện theo từng bài thi.
            </p>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-bold">
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
              <p className="text-sm mt-1">Bài thi này chưa có dữ liệu hiệu suất.</p>
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
                  <CardTitle className="text-base font-semibold text-foreground">Đúng / Sai / Bỏ qua</CardTitle>
                  <CardDescription>Tổng quan nhanh kết quả trả lời.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Đúng</span><span className="font-medium">{distribution.correctPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.correctPct} className="h-1.5 [&>div]:bg-emerald-500" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Sai</span><span className="font-medium">{distribution.incorrectPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.incorrectPct} className="h-1.5 [&>div]:bg-rose-500" />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between text-sm"><span>Bỏ qua</span><span className="font-medium">{distribution.skippedPct.toFixed(1)}%</span></div>
                      <Progress value={distribution.skippedPct} className="h-1.5 [&>div]:bg-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-h-[240px] border-border/70 bg-card shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-foreground">Tiến độ theo thời gian</CardTitle>
                  <CardDescription>Điểm trung bình theo ngày nộp bài.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(data.visualizations.trendSeries || []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Chưa có dữ liệu tiến độ.</p>
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
                          Tóm tắt AI
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
                    Điểm cần chú ý
                  </HelpedTitle>
                </CardTitle>
                <CardDescription>Những chủ đề và câu hỏi cần ưu tiên rà soát.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">Chủ đề yếu nhất</h3>
                      <Badge variant="outline" className="border-border bg-muted/40 text-xs">{data.weakestTopics.length}</Badge>
                    </div>
                    <div className="divide-y divide-border/70 rounded-md border border-border/70">
                      {data.weakestTopics.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Chưa có chủ đề yếu nổi bật.</p>
                      ) : data.weakestTopics.slice(0, 3).map((item) => (
                        <div key={`${item.topicId}-${item.topicName}`} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">{item.topicName}</p>
                              <p className="mt-1 text-xs text-muted-foreground">Bỏ qua {item.skipRate.toFixed(0)}%</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">
                              {item.incorrectRate.toFixed(0)}% sai
                            </Badge>
                          </div>
                          <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("weakest_topic_open_practice"); openAction(item.action); }}>
                            Mở luyện tập <ExternalLink className="ml-1 h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-foreground">
                        <HelpedTitle help={{
                          description: "Các câu hỏi được ưu tiên dựa trên nhiều tín hiệu về độ khó, tỷ lệ sai, tỷ lệ bỏ qua và cảnh báo nội dung hiện có.",
                          usedBy: "Giảng viên dùng để chọn câu cần kiểm tra trước khi chỉnh sửa hoặc nhờ AI đề xuất cải thiện.",
                          note: "Tỷ lệ sai cao không nhất thiết có nghĩa câu hỏi bị lỗi; đây chỉ là tín hiệu ưu tiên rà soát, không phải kết luận tự động.",
                        }}>
                          Câu hỏi cần rà soát
                        </HelpedTitle>
                      </h3>
                      {data.mostIncorrectQuestions.length > 8 ? <Badge variant="secondary" className="text-xs">Hiển thị 8/{data.mostIncorrectQuestions.length}</Badge> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Các câu hỏi được ưu tiên dựa trên nhiều tín hiệu; giảng viên nên xem bằng chứng trước khi kết luận câu hỏi có vấn đề.
                    </p>
                    <div className="divide-y divide-border/70 rounded-md border border-border/70">
                      {data.mostIncorrectQuestions.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Chưa có câu hỏi nào cần rà soát.</p>
                      ) : data.mostIncorrectQuestions.slice(0, 8).map((item) => {
                        const improvement = getQuestionImprovement(item.questionId);
                        const status = improvement?.status || "IDLE";
                        const isCreating = aiImprovingQuestionId === item.questionId;
                        return (
                          <div key={item.questionId} className="p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">Bài tập ưu tiên {item.orderIndex + 1}</p>
                                <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.questionText)}</p>
                              </div>
                              <div className="flex shrink-0 flex-wrap gap-2">
                                <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">{item.incorrectRate.toFixed(0)}% sai</Badge>
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Bỏ qua {item.skipRate.toFixed(0)}%</Badge>
                                {item.flaggedCount > 0 ? (
                                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">{item.flaggedCount} cảnh báo</Badge>
                                ) : null}
                              </div>
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
                                {improvement?.id ? (
                                  <Button size="sm" className="h-8 gap-1" onClick={() => openAiReview(item.questionId, improvement.id)}>
                                    <Sparkles className="h-3.5 w-3.5" /> Xem thay đổi
                                  </Button>
                                ) : null}
                              </div>
                            ) : (
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Button variant="ghost" size="sm" className="h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("most_incorrect_open_preview"); openQuestionPreview(item); }}>
                                  Mở câu hỏi <ExternalLink className="ml-1 h-3.5 w-3.5" />
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
                                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">Có bản cải thiện</Badge>
                                    <Button size="sm" className="h-8 gap-1" onClick={() => openAiReview(item.questionId, improvement.id)}>
                                      <Sparkles className="h-3.5 w-3.5" /> Xem cải thiện
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
                  <CardTitle className="text-base font-semibold text-foreground">Khuyến nghị AI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-border/70">
                    {data.aiRecommendations.slice(0, 3).map((item, idx) => (
                      <div key={`${item.title}-${idx}`} className="py-3 first:pt-0 last:pb-0">
                        <p className="text-sm font-semibold text-foreground">{translateMetricText(item.title)}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.detail)}</p>
                        <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("ai_recommendation_action"); openAction(item.action); }}>
                          Thực hiện <ExternalLink className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-foreground">Cảnh báo chất lượng câu hỏi</CardTitle>
                    <CardDescription>Hỗ trợ giảng viên rà soát nội dung câu hỏi.</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 gap-1 whitespace-nowrap" disabled={!selectedExamId} onClick={() => { trackAction("open_ai_quality_review"); router.push(`/lecturer/exam/${selectedExamId}/quality-review`); }}>
                    <Sparkles className="h-3.5 w-3.5" /> Rà soát AI
                  </Button>
                </CardHeader>
                <CardContent>
                  {(data.creatorQualityAlerts?.length ?? 0) === 0 ? (
                    <p className="text-sm text-muted-foreground">Không phát hiện cảnh báo chất lượng câu hỏi mức rủi ro cao.</p>
                  ) : (
                    <div className="divide-y divide-border/70">
                      {data.creatorQualityAlerts.slice(0, 3).map((item) => (
                        <div key={item.questionId} className="py-3 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{translateMetricText(item.questionLabel)}</p>
                              <p className="mt-1 text-xs text-muted-foreground">{translateMetricText(item.signal)}</p>
                            </div>
                            <Badge variant="outline" className="shrink-0 border-rose-200 bg-rose-50 text-rose-700">Cảnh báo</Badge>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{translateMetricText(item.suggestion)}</p>
                          <Button variant="ghost" size="sm" className="mt-2 h-8 px-0 text-primary hover:bg-transparent hover:text-primary/80" onClick={() => { trackAction("quality_alert_open_question_bank"); openAction(item.action); }}>
                            Xem câu hỏi <ExternalLink className="ml-1 h-3.5 w-3.5" />
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

        <Dialog open={Boolean(previewQuestion)} onOpenChange={(open) => {
          if (!open) closeQuestionPreview();
        }}>
          <DialogContent
            hideCloseButton
            className="w-[950px] max-w-[95vw] max-h-[85vh] overflow-hidden p-0 gap-0"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <DialogTitle className="text-lg font-semibold">
                  Question Preview
                </DialogTitle>
                {previewQuestion?.type ? (
                  <Badge variant="outline" className="shrink-0">
                    {QUESTION_TYPE_LABELS[String(previewQuestion.type)] ||
                      previewQuestion.type}
                  </Badge>
                ) : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={closeQuestionPreview}
              >
                <span className="sr-only">Đóng</span>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {previewLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewError ? (
              <div className="flex h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <p className="text-lg font-medium">
                  Không thể tải chi tiết câu hỏi
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  {previewError}
                </p>
              </div>
            ) : previewQuestion ? (() => {
              const options = normalizeEditableOptions(previewQuestion.options);
              const correctAnswers = normalizeCorrectAnswerIds(
                previewQuestion.correctAnswer,
              );
              const hasOptions = !["ESSAY", "SHORT_ANSWER"].includes(
                String(previewQuestion.type || ""),
              );
              const difficulty = getDifficultyLabel(previewQuestion.difficulty);

              return (
                <div className="max-h-[calc(85vh-73px)] space-y-6 overflow-y-auto p-6">
                  <QuestionReviewCard title="Nội dung câu hỏi">
                    <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                      {previewQuestion.content || "Không có nội dung câu hỏi."}
                    </p>
                  </QuestionReviewCard>

                  <QuestionReviewCard title="Các lựa chọn">
                    {hasOptions && options.length > 0 ? (
                      <div className="space-y-2">
                        {options.map((option) => {
                          const isCorrect = correctAnswers.some(
                            (answer) =>
                              answer.toUpperCase() === option.id.toUpperCase() ||
                              answer === option.text,
                          );
                          return (
                            <div
                              key={option.id}
                              className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                                isCorrect
                                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30"
                                  : "border-border bg-card"
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                  isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {isCorrect ? "✓" : option.id}
                              </span>
                              <span className="flex-1 whitespace-pre-wrap break-words pt-0.5">
                                {option.text}
                              </span>
                              {isCorrect ? (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-green-200 bg-green-100 text-green-700 dark:border-green-700 dark:bg-green-900/40 dark:text-green-400"
                                >
                                  Đáp án đúng
                                </Badge>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Loại câu hỏi này không dùng lựa chọn
                      </p>
                    )}
                  </QuestionReviewCard>

                  <QuestionReviewCard title="Đáp án đúng">
                    {correctAnswers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {correctAnswers.map((answer) => (
                          <Badge
                            key={answer}
                            variant="outline"
                            className="border-green-200 bg-green-100 text-green-800 dark:border-green-700 dark:bg-green-900/40 dark:text-green-300"
                          >
                            ✓ {answer}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Chưa có đáp án đúng
                      </p>
                    )}
                  </QuestionReviewCard>

                  <QuestionReviewCard title="Giải thích">
                    {previewQuestion.explanation ? (
                      <p className="whitespace-pre-wrap break-words text-sm text-foreground">
                        {previewQuestion.explanation}
                      </p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        Chưa có giải thích
                      </p>
                    )}
                  </QuestionReviewCard>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-lg border bg-card p-4 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Difficulty
                      </p>
                      <p className={`text-lg font-semibold ${difficulty.className}`}>
                        {difficulty.text}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Points
                      </p>
                      <p className="text-lg font-semibold">
                        {previewQuestion.points ?? 1}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-4 text-center">
                      <p className="mb-1 text-xs text-muted-foreground">
                        Type
                      </p>
                      <p className="text-lg font-semibold">
                        {QUESTION_TYPE_LABELS[String(previewQuestion.type || "")] ||
                          previewQuestion.type ||
                          "Không xác định"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Course:
                      </span>
                      <span>
                        {getCourseLabel(previewQuestion.course) || "—"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Created:
                      </span>
                      <span>{formatPreviewDate(previewQuestion.createdAt)}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Last updated:
                      </span>
                      <span>{formatPreviewDate(previewQuestion.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })() : null}
          </DialogContent>
        </Dialog>

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
                      description: "Màn hình này cho phép so sánh bản cũ với bản AI đề xuất hoặc bản đã áp dụng cho câu hỏi.",
                      usedBy: "Giảng viên dùng để kiểm tra thay đổi trước khi chấp nhận cập nhật vào ngân hàng câu hỏi.",
                      note: "AI chỉ tạo đề xuất. Câu hỏi chỉ được cập nhật sau khi giảng viên bấm áp dụng.",
                    }}>
                      {"So sánh cải thiện câu hỏi"}
                    </HelpedTitle>
                  </DialogTitle>
                  <DialogDescription className="mt-2">
                    {canApplyImprovement
                      ? "So sánh bản cũ và bản AI đề xuất trước khi áp dụng vào ngân hàng câu hỏi."
                      : "Xem lại những thay đổi đã được áp dụng cho câu hỏi này."}
                  </DialogDescription>
                </div>
                {reviewingImprovement ? <Badge variant="outline" className="shrink-0 border-primary/25 bg-primary/10 text-primary">{`Độ tin cậy ${Math.round(Number(reviewingImprovement.confidence || 0) * 100)}%`}</Badge> : null}
              </div>
            </DialogHeader>
            {reviewError ? <div className="mx-6 mt-4 shrink-0 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">{reviewError}</div> : null}
            {reviewingImprovement && comparisonBefore && comparisonAfter ? (
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="space-y-5">
                  <Card className="border-border/70">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Tóm tắt thay đổi</CardTitle>
                      <CardDescription>
                        {comparisonChanges.length
                          ? "Chỉ hiển thị các trường có thay đổi giữa bản cũ và bản mới."
                          : "Không phát hiện thay đổi rõ ràng giữa hai phiên bản."}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {comparisonChanges.length ? (
                        <div className="flex flex-wrap gap-2">
                          {comparisonChanges.map((field) => (
                            <Badge key={field.key} variant="outline" className="border-primary/25 bg-primary/10 text-primary">
                              {field.label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          AI không tạo ra khác biệt dễ nhận thấy ở các trường chính. Bạn vẫn có thể kiểm tra chi tiết bên dưới.
                        </p>
                      )}

                      {(reviewingImprovement.diagnosis?.reason || (reviewingImprovement.diagnosis?.issues || []).length > 0) ? (
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                          <p className="text-sm font-medium text-foreground">Nhận định của AI</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {translateAiAnalysisText(reviewingImprovement.diagnosis?.reason) || "AI chưa cung cấp nhận định tổng quan."}
                          </p>
                          {(reviewingImprovement.diagnosis?.issues || []).length ? (
                            <div className="mt-3 space-y-2">
                              {reviewingImprovement.diagnosis?.issues?.map((issue, index) => (
                                <div key={`${issue.type}-${index}`} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">
                                  <p className="font-medium">{ISSUE_LABELS[String(issue.type || "")] || issue.type || "Vấn đề cần xem xét"}</p>
                                  {issue.description ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{translateAiAnalysisText(issue.description)}</p> : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <QuestionComparisonCard
                      title="Bản cũ"
                      snapshot={comparisonBefore}
                      changedFields={comparisonChanges.map((field) => field.key)}
                    />
                    <QuestionComparisonCard
                      title="Bản mới"
                      snapshot={comparisonAfter}
                      changedFields={comparisonChanges.map((field) => field.key)}
                    />
                  </div>
                </div>
              </div>
            ) : reviewBusy ? <div className="grid min-h-80 flex-1 place-items-center text-muted-foreground"><div className="space-y-4 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><div className="space-y-1 text-sm"><p>{"Đang phân tích câu hỏi."}</p><p>{"Đang kiểm tra đáp án."}</p><p>{"Đang viết lại nội dung và giải thích."}</p></div></div></div> : null}
            <DialogFooter className="sticky bottom-0 z-10 shrink-0 justify-between gap-3 border-t border-border bg-card/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-card/80">
              <div className="flex gap-2">
                <Button variant="outline" disabled={reviewBusy} onClick={closeAiReview}>{"Đóng"}</Button>
                {canApplyImprovement ? (
                  <Button variant="outline" disabled={reviewBusy || !reviewingImprovement} onClick={rejectAiImprovement}>{"Giữ nguyên câu hỏi hiện tại"}</Button>
                ) : null}
              </div>
              <div className="flex gap-2">
                {canApplyImprovement ? (
                  <Button disabled={reviewBusy || !reviewingImprovement} onClick={approveAiImprovement}>
                    {reviewBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {"Áp dụng bản cải thiện"}
                  </Button>
                ) : null}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminPageShell>
    </DashboardLayout>
  );
}

function QuestionReviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
function QuestionComparisonCard({
  title,
  snapshot,
  changedFields,
}: {
  title: string;
  snapshot: QuestionComparisonSnapshot;
  changedFields: ComparisonFieldKey[];
}) {
  const difficulty = getDifficultyLabel(snapshot.difficulty);
  const changedSet = new Set(changedFields);
  const isChanged = (field: ComparisonFieldKey) => changedSet.has(field);

  return (
    <Card className="border-border/70">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {snapshot.type ? (
            <Badge variant="outline">
              {QUESTION_TYPE_LABELS[String(snapshot.type)] || snapshot.type}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ComparisonSection title="Nội dung câu hỏi" changed={isChanged("content")}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {snapshot.content || "Chưa có nội dung."}
          </p>
        </ComparisonSection>

        <ComparisonSection title="Loại câu hỏi" changed={isChanged("type")}>
          <p className="text-sm text-foreground">
            {QUESTION_TYPE_LABELS[String(snapshot.type)] || snapshot.type || "Không xác định"}
          </p>
        </ComparisonSection>

        <ComparisonSection title="Phương án" changed={isChanged("options") || isChanged("correctAnswer")}>
          {snapshot.options.length ? (
            <div className="space-y-2">
              {snapshot.options.map((option) => (
                <OptionPreviewRow
                  key={option.id}
                  option={option}
                  isCorrect={snapshot.correctAnswerIds.includes(option.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có phương án.</p>
          )}
        </ComparisonSection>

        <ComparisonSection title="Đáp án đúng" changed={isChanged("correctAnswer")}>
          <p className="text-sm text-foreground">
            {snapshot.correctAnswerIds.length ? snapshot.correctAnswerIds.join(", ") : "Chưa xác định"}
          </p>
        </ComparisonSection>

        <ComparisonSection title="Giải thích" changed={isChanged("explanation")}>
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {snapshot.explanation || "Chưa có giải thích."}
          </p>
        </ComparisonSection>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ComparisonSection title="Độ khó" changed={isChanged("difficulty")}>
            <p className={`text-sm font-medium ${difficulty.className}`}>
              {snapshot.difficulty == null ? "Chưa gán" : `${snapshot.difficulty} · ${difficulty.text}`}
            </p>
          </ComparisonSection>
          <ComparisonSection title="Điểm" changed={isChanged("points")}>
            <p className="text-sm font-medium text-foreground">
              {snapshot.points == null ? "Chưa gán" : snapshot.points}
            </p>
          </ComparisonSection>
        </div>

        <ComparisonSection title="Khóa học" changed={false}>
          {getCourseLabel(snapshot.course) ? (
            <div className="space-y-1 text-sm text-foreground">
              <p className="font-medium">{getCourseLabel(snapshot.course)}</p>
              {snapshot.course?.academicYear || snapshot.course?.term ? (
                <p className="text-xs text-muted-foreground">
                  {[snapshot.course?.academicYear, snapshot.course?.term].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa xác định khóa học.</p>
          )}
        </ComparisonSection>

        <ComparisonSection title="Thẻ" changed={isChanged("tags")}>
          <TagList values={snapshot.tags} emptyLabel="Chưa có thẻ." />
        </ComparisonSection>

        <ComparisonSection title="Chủ đề" changed={isChanged("topics")}>
          <TagList values={snapshot.topics} emptyLabel="Chưa có chủ đề." />
        </ComparisonSection>
      </CardContent>
    </Card>
  );
}

function OptionPreviewRow({ option, isCorrect }: { option: EditableOption; isCorrect: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
      <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border font-semibold ${isCorrect ? "border-success bg-success/15 text-success" : "border-border text-muted-foreground"}`}>{isCorrect ? <CheckCircle2 className="h-4 w-4" /> : option.id}</span>
      <span className="leading-6">{option.text}</span>
    </div>
  );
}

function ComparisonSection({
  title,
  changed,
  children,
}: {
  title: string;
  changed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-4 ${changed ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {changed ? (
          <Badge variant="outline" className="border-primary/25 bg-primary/10 text-primary">
            Đã thay đổi
          </Badge>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function TagList({ values, emptyLabel }: { values: string[]; emptyLabel: string }) {
  if (!values.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value) => (
        <Badge key={value} variant="secondary" className="font-normal">
          {value}
        </Badge>
      ))}
    </div>
  );
}
