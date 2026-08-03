"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Loader2, Save, UserCheck, Plus, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { formatManualAnswer } from "./manual-grading-formatters";

function toDisplayText(value: any): string {
  if (value == null) return "Chưa nộp câu trả lời";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(toDisplayText).join(", ");
  }
  if (typeof value === "object") {
    if ("answer" in value) return toDisplayText(value.answer);
    if ("text" in value) return toDisplayText(value.text);
    if ("content" in value) return toDisplayText(value.content);
    return Object.entries(value).map(([key, item]) => `${key}: ${toDisplayText(item)}`).join(", ");
  }
  return String(value);
}

function toSavedPoints(value: any): string {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeFeedback(value: any): string {
  return String(value || "");
}

type DraftGrade = {
  pointsAwarded: string;
  feedback: string;
};

export default function ManualGradingDetail() {
  const params = useParams();
  const examId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const submissionId = Array.isArray(params?.submissionId)
    ? params.submissionId[0]
    : params?.submissionId;
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/lecturer";

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<any | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftGrade>>({});
  const [adjustmentAmount, setAdjustmentAmount] = useState("");
  const [adjustmentCategory, setAdjustmentCategory] = useState<"QUESTION_ERROR" | "PARTICIPATION" | "OTHER">("QUESTION_ERROR");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [evidenceCaptures, setEvidenceCaptures] = useState<any[]>([]);
  const [evidenceImageUrls, setEvidenceImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!submissionId) {
        setLoading(false);
        toast.error("Thiếu mã bài nộp.");
        return;
      }
      try {
        setLoading(true);
        const data = await api.getManualGradingSubmission(submissionId);
        if (!mounted) return;
        setSubmission(data);
        const captures = await api.getEvidenceCaptures(submissionId).catch(() => []);
        if (!mounted) return;
        setEvidenceCaptures(captures);
        const urls = await Promise.all(captures.filter((capture: any) => capture.status !== "PURGED" && capture.capturedAt).map(async (capture: any) => [capture.id, await api.getEvidenceImageUrl(submissionId, capture.id).catch(() => "")] as const));
        if (mounted) setEvidenceImageUrls(Object.fromEntries(urls.filter(([, url]) => url)));
        const nextDrafts: Record<string, DraftGrade> = {};
        (data.manualAnswers || []).forEach((answer: any) => {
          nextDrafts[answer.id] = {
            pointsAwarded:
              answer.pointsAwarded === null || answer.pointsAwarded === undefined
                ? ""
                : String(answer.pointsAwarded),
            feedback: answer.feedback || "",
          };
        });
        setDrafts(nextDrafts);
      } catch (err: any) {
        toast.error(err?.message || "Không thể tải chi tiết chấm thủ công.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [submissionId]);

  const reviewEvidence = async (captureId: string, reviewStatus: "REVIEWED" | "DISMISSED") => {
    if (!submissionId) return;
    try {
      await api.reviewEvidenceCapture(submissionId, captureId, { reviewStatus });
      setEvidenceCaptures((items) => items.map((item) => item.id === captureId ? { ...item, reviewStatus } : item));
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật đánh giá bằng chứng.");
    }
  };

  const gradedCount = useMemo(
    () =>
      (submission?.manualAnswers || []).filter((answer: any) => Boolean(answer.manualGradedAt)).length,
    [submission?.manualAnswers],
  );
  const manualTotal = Number(submission?.manualTotal || 0);
  const isAllManualGraded = manualTotal > 0 && gradedCount === manualTotal;

  const saveAnswer = async (answer: any) => {
    const draft = drafts[answer.id];
    const points = Number(draft?.pointsAwarded);
    if (!Number.isFinite(points) || points < 0 || points > Number(answer.maxPoints)) {
      toast.error(`Điểm phải nằm trong khoảng từ 0 đến ${answer.maxPoints}.`);
      return;
    }

    try {
      setSavingId(answer.id);
      const updated = await api.gradeAnswer(answer.id, points, draft?.feedback || "");
      const savedDraft = {
        pointsAwarded: toSavedPoints(updated.pointsAwarded),
        feedback: normalizeFeedback(updated.feedback),
      };
      setSubmission((current: any) => ({
        ...current,
        manualAnswers: (current?.manualAnswers || []).map((item: any) =>
          item.id === answer.id
            ? {
                ...item,
                pointsAwarded: updated.pointsAwarded,
                manualGradedAt: updated.manualGradedAt,
                feedback: updated.feedback || "",
              }
            : item,
        ),
      }));
      setDrafts((current) => ({
        ...current,
        [answer.id]: savedDraft,
      }));
      toast.success("Đã lưu điểm chấm thủ công.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu điểm.");
    } finally {
      setSavingId(null);
    }
  };

  const refreshSubmission = async () => {
    if (!submissionId) return;
    const data = await api.getManualGradingSubmission(submissionId);
    setSubmission(data);
  };

  const createAdjustment = async () => {
    const amount = Number(adjustmentAmount);
    if (!Number.isFinite(amount) || amount === 0) {
      toast.error("Nhập số điểm điều chỉnh khác 0.");
      return;
    }
    if (adjustmentReason.trim().length < 3) {
      toast.error("Cần ghi rõ lý do điều chỉnh điểm.");
      return;
    }
    try {
      setIsAdjusting(true);
      await api.createScoreAdjustment(String(submissionId), {
        amount,
        category: adjustmentCategory,
        reason: adjustmentReason.trim(),
      });
      setAdjustmentAmount("");
      setAdjustmentReason("");
      await refreshSubmission();
      toast.success("Đã lưu điều chỉnh điểm và nhật ký kiểm toán.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể điều chỉnh điểm.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const revokeAdjustment = async (adjustmentId: string) => {
    const reason = window.prompt("Lý do thu hồi điều chỉnh này:");
    if (!reason?.trim()) return;
    try {
      setIsAdjusting(true);
      await api.revokeScoreAdjustment(String(submissionId), adjustmentId, reason.trim());
      await refreshSubmission();
      toast.success("Đã thu hồi điều chỉnh; lịch sử vẫn được bảo toàn.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể thu hồi điều chỉnh.");
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-5 rounded-3xl bg-gradient-to-b from-slate-50/90 via-background to-background px-4 py-5 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          className="-ml-2 gap-2 text-muted-foreground"
          onClick={() => router.push(`${basePath}/exam/${examId}/results`)}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại kết quả
        </Button>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card className="border-slate-200 bg-white/95 shadow-medium">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <UserCheck className="h-6 w-6 text-primary" />
                      Chấm thủ công
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {submission?.student?.fullName || "Sinh viên"} - {submission?.exam?.title || "Bài thi"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      isAllManualGraded
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    }
                  >
                    {isAllManualGraded
                      ? "Đã hoàn tất chấm"
                      : `Đã chấm ${gradedCount}/${manualTotal} câu`}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-indigo-200 bg-indigo-50/40 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Điều chỉnh điểm hậu kiểm</CardTitle>
                <CardDescription>
                  Không sửa snapshot hay điểm gốc của bài thi. Dùng cho câu hỏi sai, điểm phát biểu hoặc lý do đã được đối chiếu.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[140px_190px_1fr_auto] md:items-end">
                  <div>
                    <label className="text-sm font-medium">Điểm +/-</label>
                    <Input className="mt-2" type="number" step="0.01" min={-10} max={10} value={adjustmentAmount} onChange={(event) => setAdjustmentAmount(event.target.value)} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Loại</label>
                    <select className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={adjustmentCategory} onChange={(event) => setAdjustmentCategory(event.target.value as typeof adjustmentCategory)}>
                      <option value="QUESTION_ERROR">Câu hỏi sai</option>
                      <option value="PARTICIPATION">Điểm phát biểu</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lý do bắt buộc</label>
                    <Input className="mt-2" value={adjustmentReason} onChange={(event) => setAdjustmentReason(event.target.value)} placeholder="Ví dụ: Câu 4 có hai đáp án đúng, cộng 0.5 điểm" />
                  </div>
                  <Button className="gap-2" onClick={createAdjustment} disabled={isAdjusting}>
                    {isAdjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Điều chỉnh
                  </Button>
                </div>
                <div className="rounded-lg border border-indigo-100 bg-white/80 p-3 text-sm">
                  Điểm gốc: <strong>{Number(submission?.academicScore ?? submission?.score ?? 0).toFixed(2)}</strong> · Điều chỉnh đang hiệu lực: <strong>{Number(submission?.activeAdjustmentTotal ?? 0).toFixed(2)}</strong> · Điểm học thuật sau điều chỉnh: <strong>{Number(submission?.adjustedAcademicScore ?? submission?.score ?? 0).toFixed(2)}</strong>/10
                </div>
                {(submission?.scoreAdjustments || []).length > 0 ? (
                  <div className="space-y-2">
                    {submission.scoreAdjustments.map((adjustment: any) => (
                      <div key={adjustment.id} className="flex flex-col gap-2 rounded-lg border bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <strong className={Number(adjustment.amount) >= 0 ? "text-emerald-700" : "text-rose-700"}>{Number(adjustment.amount) >= 0 ? "+" : ""}{Number(adjustment.amount).toFixed(2)}</strong> · {adjustment.category} · {adjustment.reason}
                          <p className="mt-1 text-xs text-muted-foreground">{adjustment.createdBy?.fullName || "Giảng viên"} · {new Date(adjustment.createdAt).toLocaleString("vi-VN")}{adjustment.revokedAt ? ` · Đã thu hồi: ${adjustment.revocationReason || ""}` : ""}</p>
                        </div>
                        {!adjustment.revokedAt ? <Button size="sm" variant="outline" className="gap-1" onClick={() => revokeAdjustment(adjustment.id)} disabled={isAdjusting}><Undo2 className="h-3.5 w-3.5" /> Thu hồi</Button> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {evidenceCaptures.length > 0 ? (
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle>Bằng chứng webcam</CardTitle>
                  <CardDescription>Tag AI chỉ là tín hiệu hỗ trợ; giảng viên cần tự xem ảnh trước khi kết luận.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {evidenceCaptures.map((capture: any) => (
                    <div key={capture.id} className="rounded-lg border p-3 space-y-2">
                      {evidenceImageUrls[capture.id] ? <img src={evidenceImageUrls[capture.id]} alt="Webcam evidence" className="aspect-video w-full rounded bg-black object-cover" /> : <div className="aspect-video rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">{capture.status === "PURGED" ? "Ảnh đã được xóa theo thời hạn lưu trữ" : "Không tải được ảnh"}</div>}
                      <div className="text-xs text-muted-foreground">{capture.trigger === "SCHEDULED" ? "Chụp theo lịch" : capture.trigger === "IDLE" ? "Không tương tác (lịch sử)" : "Tín hiệu bảo mật"} · {capture.capturedAt ? new Date(capture.capturedAt).toLocaleString("vi-VN") : "Đang chờ ảnh"}</div>
                      <div className="flex flex-wrap gap-1">{(capture.aiTags || []).map((tag: any) => <Badge key={`${capture.id}-${tag.tag}`} variant="secondary">{tag.tag} {Number.isFinite(Number(tag.confidence)) ? `${Math.round(Number(tag.confidence) * 100)}%` : ""}</Badge>)}</div>
                      <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => void reviewEvidence(capture.id, "REVIEWED")}>Đã xem</Button><Button size="sm" variant="ghost" onClick={() => void reviewEvidence(capture.id, "DISMISSED")}>Bỏ qua</Button><span className="ml-auto text-xs text-muted-foreground">{capture.reviewStatus}</span></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {(submission?.manualAnswers || []).length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Bài nộp này không có câu hỏi cần chấm thủ công.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {submission.manualAnswers.map((answer: any, index: number) => {
                  const draft = drafts[answer.id] || { pointsAwarded: "", feedback: "" };
                  const savedPoints = toSavedPoints(answer.pointsAwarded);
                  const savedFeedback = normalizeFeedback(answer.feedback);
                  const isSaved = Boolean(answer.manualGradedAt);
                  const isDirty =
                    draft.pointsAwarded !== savedPoints ||
                    draft.feedback !== savedFeedback;
                  const isSaving = savingId === answer.id;
                  const answerLines = formatManualAnswer(answer.questionType, answer.answer, answer.questionOptions);
                  return (
                    <Card key={answer.id} className="border-slate-200 bg-white/95 shadow-sm">
                      <CardHeader className="border-b border-slate-100 bg-slate-50/70">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <CardTitle className="text-base">
                              Câu {index + 1}. {answer.questionText}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {answer.questionType} · tối đa {answer.maxPoints} điểm
                            </CardDescription>
                          </div>
                          {answer.manualGradedAt ? (
                            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700" variant="outline">
                              Đã chấm: {answer.pointsAwarded}/{answer.maxPoints} điểm
                            </Badge>
                          ) : (
                            <Badge className="border-amber-200 bg-amber-50 text-amber-700" variant="outline">
                              Chờ chấm
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-5">
                        <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4">
                          <p className="text-xs font-semibold uppercase text-muted-foreground">
                            Câu trả lời của sinh viên
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">
                            {answerLines.map((line, lineIndex) => <span key={lineIndex} className="block">{line}</span>)}
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                          <div>
                            <label className="text-sm font-medium">Điểm</label>
                            <div className="mt-2 flex items-center gap-2">
                              <Input
                                type="number"
                                min={0}
                                max={answer.maxPoints}
                                value={draft.pointsAwarded}
                                onChange={(event) =>
                                  setDrafts((prev) => ({
                                    ...prev,
                                    [answer.id]: {
                                      ...draft,
                                      pointsAwarded: event.target.value,
                                    },
                                  }))
                                }
                              />
                              <span className="text-sm text-muted-foreground">/{answer.maxPoints}</span>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Nhận xét</label>
                            <Textarea
                              className="mt-2 min-h-[96px]"
                              placeholder="Nhập nhận xét cho sinh viên..."
                              value={draft.feedback}
                              onChange={(event) =>
                                setDrafts((prev) => ({
                                  ...prev,
                                  [answer.id]: {
                                    ...draft,
                                    feedback: event.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant={isSaved && !isDirty ? "outline" : "default"}
                            className="gap-2"
                            onClick={() => saveAnswer(answer)}
                            disabled={isSaving || (isSaved && !isDirty)}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : isSaved && !isDirty ? (
                              <UserCheck className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            {isSaved && !isDirty ? "Đã lưu" : "Lưu điểm"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}



