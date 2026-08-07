"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

type Suggestion = {
  id: string;
  questionId: string;
  severity: string | null;
  reasonSummary: string;
  recommendation: string;
  statsSnapshot: Record<string, any> | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_CHANGES";
  reviewNotes: string | null;
  question?: { id: string; content: string; type: string };
};

const REVIEW_COPY: Record<Suggestion["reviewStatus"], string> = {
  PENDING: "Chờ xem xét",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
  NEEDS_CHANGES: "Cần chỉnh sửa",
};

const SEVERITY_COPY: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

function formatPercent(value: unknown) {
  return typeof value === "number" ? `${value.toFixed(0)}%` : "N/A";
}

function formatNumber(value: unknown) {
  return typeof value === "number" ? value.toFixed(2) : "N/A";
}

function countByStatus(suggestions: Suggestion[], status: Suggestion["reviewStatus"]) {
  return suggestions.filter((item) => item.reviewStatus === status).length;
}

export default function ExamQualityReview() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug : [];
  const routeId = params?.id;
  const examId = Array.isArray(routeId) ? routeId[0] : routeId || slug[1];
  const pathname = usePathname();
  const router = useRouter();
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/lecturer";

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [overallSummary, setOverallSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!examId) return;

    const loadExisting = async () => {
      try {
        const items = await api.listExamQualityReviewSuggestions(examId);
        setSuggestions(items || []);

        const latestWithSummary = (items || []).find(
          (item: any) => item.job?.output?.overallSummary,
        );
        if (latestWithSummary) {
          setOverallSummary(latestWithSummary.job.output.overallSummary);
        }
      } catch {
        // No prior review yet is a valid empty state.
      } finally {
        setLoading(false);
      }
    };

    loadExisting();
  }, [examId]);

  const reviewStats = useMemo(
    () => ({
      total: suggestions.length,
      pending: countByStatus(suggestions, "PENDING"),
      approved: countByStatus(suggestions, "APPROVED"),
      rejected: countByStatus(suggestions, "REJECTED"),
      needsChanges: countByStatus(suggestions, "NEEDS_CHANGES"),
      highSeverity: suggestions.filter((item) =>
        ["high", "critical"].includes(String(item.severity || "").toLowerCase()),
      ).length,
    }),
    [suggestions],
  );

  const handleGenerate = async () => {
    if (!examId) return;

    setGenerating(true);
    try {
      const job = await api.generateExamQualityReview(examId);
      setOverallSummary(job?.output?.overallSummary || null);
      setSuggestions(job?.qualityReviewItems || []);
      toast.success("Đã tạo rà soát chất lượng bằng AI.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo rà soát chất lượng bằng AI.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (
    item: Suggestion,
    decision: "APPROVED" | "REJECTED" | "NEEDS_CHANGES",
  ) => {
    if (!examId) return;

    try {
      const notes = notesDraft[item.id]?.trim() || undefined;
      const updated = await api.reviewExamQualitySuggestion(examId, item.id, {
        decision,
        notes,
      });

      setSuggestions((prev) =>
        prev.map((suggestion) =>
          suggestion.id === item.id
            ? {
                ...suggestion,
                reviewStatus: updated.reviewStatus,
                reviewNotes: updated.reviewNotes,
              }
            : suggestion,
        ),
      );

      toast.success(
        decision === "APPROVED"
          ? "Đã duyệt gợi ý."
          : decision === "REJECTED"
            ? "Đã từ chối gợi ý."
            : "Đã đánh dấu cần chỉnh sửa.",
      );
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật trạng thái rà soát.");
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <AdminPageShell showBackButton={false}>
          <div className="grid min-h-[420px] place-items-center rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Đang tải dữ liệu rà soát chất lượng...
            </div>
          </div>
        </AdminPageShell>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminPageShell showBackButton={false}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-3">
            <Button
              variant="ghost"
              className="h-8 gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
              onClick={() => router.push(`${basePath}/exam/${examId}/results`)}
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại kết quả bài thi
            </Button>

            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                Cải tiến chất lượng đề thi
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                AI phân tích thống kê thật của bài thi và đề xuất điểm cần kiểm tra. Giảng viên là người duyệt, chỉnh sửa hoặc từ chối từng gợi ý.
              </p>
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="h-9 gap-2 whitespace-nowrap"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {generating ? "Đang phân tích..." : "Tạo rà soát AI"}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
          <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base text-primary">Trợ lý AI</CardTitle>
                </div>
                <CardDescription>
                  Tạo đề xuất cải tiến từ tỉ lệ sai, tỉ lệ bỏ qua, độ khó và độ phân biệt của câu hỏi.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs italic text-muted-foreground">
                  Nội dung AI chỉ là gợi ý rà soát. Hệ thống không tự thay đổi câu hỏi hoặc kết luận chất lượng cuối cùng.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  size="sm"
                  className="gap-2 sm:w-auto"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Chạy phân tích
                </Button>
              </CardContent>
            </Card>

            {overallSummary ? (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Tóm tắt chất lượng tổng quan</CardTitle>
                  <CardDescription>
                    Nhận định nhanh để ưu tiên các câu hỏi cần kiểm tra trước.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6">{overallSummary}</p>
                </CardContent>
              </Card>
            ) : null}

            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="grid min-h-[280px] place-items-center p-6 text-center">
                  <div className="max-w-md space-y-4">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                      {generating ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ClipboardCheck className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">
                        {generating ? "Đang phân tích dữ liệu bài thi" : "Chưa có rà soát chất lượng"}
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {generating
                          ? "AI đang đọc thống kê câu hỏi và chuẩn bị danh sách gợi ý."
                          : "Bấm tạo rà soát AI để phân tích các câu hỏi có tỉ lệ sai, bỏ qua hoặc độ phân biệt bất thường."}
                      </p>
                    </div>
                    {!generating ? (
                      <Button onClick={handleGenerate} className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Tạo rà soát bằng AI
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.map((item, index) => {
                  const stats = item.statsSnapshot || {};
                  const severity = String(item.severity || "medium").toLowerCase();

                  return (
                    <Card key={item.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge domain="severity" status={severity} label={SEVERITY_COPY[severity]} />
                              <StatusBadge domain="approval" status={item.reviewStatus} label={REVIEW_COPY[item.reviewStatus]} />
                              <span className="text-xs text-muted-foreground">Gợi ý #{index + 1}</span>
                            </div>
                            <CardTitle className="line-clamp-2 text-base">
                              {item.question?.content || `Câu hỏi ${item.questionId}`}
                            </CardTitle>
                            <CardDescription>
                              {item.question?.type || "Chưa có loại câu hỏi"}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 whitespace-nowrap"
                            onClick={() => router.push(`${basePath}/question-editor?id=${item.questionId}`)}
                          >
                            <Edit3 className="h-4 w-4" />
                            Mở editor
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                          <Metric label="Sai" value={formatPercent(stats.incorrectRate)} />
                          <Metric label="Bỏ qua" value={formatPercent(stats.skipRate)} />
                          <Metric label="Độ khó" value={formatNumber(stats.difficultyIndex)} />
                          <Metric label="Phân biệt" value={formatNumber(stats.discriminationIndex)} />
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <div className="flex gap-2">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium leading-6">{item.reasonSummary}</p>
                              <p className="text-sm leading-6 text-muted-foreground">{item.recommendation}</p>
                            </div>
                          </div>
                        </div>

                        <Textarea
                          placeholder="Ghi chú rà soát tùy chọn..."
                          value={notesDraft[item.id] ?? item.reviewNotes ?? ""}
                          onChange={(event) =>
                            setNotesDraft((prev) => ({
                              ...prev,
                              [item.id]: event.target.value,
                            }))
                          }
                          className="min-h-[72px] resize-none bg-background text-sm"
                        />

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-success/25 text-success hover:bg-success/10 hover:text-success"
                            onClick={() => handleReview(item, "APPROVED")}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleReview(item, "REJECTED")}
                          >
                            <XCircle className="h-4 w-4" />
                            Từ chối
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReview(item, "NEEDS_CHANGES")}
                          >
                            Cần chỉnh sửa
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tiến độ rà soát</CardTitle>
                <CardDescription>Theo dõi quyết định của giảng viên</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <SummaryRow label="Tổng gợi ý" value={reviewStats.total} />
                <SummaryRow label="Chờ xem xét" value={reviewStats.pending} tone="warning" />
                <SummaryRow label="Đã duyệt" value={reviewStats.approved} tone="success" />
                <SummaryRow label="Cần chỉnh sửa" value={reviewStats.needsChanges} tone="info" />
                <SummaryRow label="Đã từ chối" value={reviewStats.rejected} tone="danger" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ưu tiên kiểm tra</CardTitle>
                <CardDescription>Các tín hiệu cần đọc kỹ trước khi chỉnh câu hỏi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-warning/25 bg-warning/10 p-3">
                  <p className="text-sm font-semibold text-warning">
                    {reviewStats.highSeverity} gợi ý mức cao
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Ưu tiên các câu có độ phân biệt thấp, tỉ lệ sai cao hoặc nhiều lượt bỏ qua.
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-5 text-muted-foreground">
                  AI chỉ hỗ trợ phát hiện tín hiệu. Mọi thay đổi nội dung câu hỏi vẫn cần được giảng viên mở editor, rà soát và lưu phiên bản mới.
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </AdminPageShell>
    </DashboardLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "info" | "danger";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-9 rounded-md border px-2 py-1 text-center text-xs font-semibold tabular-nums",
          tone === "neutral" && "border-border bg-muted/60 text-foreground",
          tone === "success" && "border-success/20 bg-success/10 text-success",
          tone === "warning" && "border-warning/25 bg-warning/10 text-warning",
          tone === "info" && "border-info/25 bg-info/10 text-info",
          tone === "danger" && "border-destructive/25 bg-destructive/10 text-destructive",
        )}
      >
        {value}
      </span>
    </div>
  );
}
