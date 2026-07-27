"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Loader2, Save, UserCheck } from "lucide-react";
import { toast } from "sonner";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";

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
    return JSON.stringify(value);
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
                            {toDisplayText(answer.answer)}
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



