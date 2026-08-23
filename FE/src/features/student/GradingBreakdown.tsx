"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Calculator, CheckCircle2, Clock3, Cpu, FileEdit, Image as ImageIcon, Loader2, MessageSquare, Music, RefreshCw, ShieldCheck, User, XCircle } from "lucide-react";
import { formatManualAnswer, formatSignedScoreAdjustment, getScoreAdjustmentCategoryLabel } from "@/features/lecturer/manual-grading-formatters";
import { ContextHelp } from "@/components/common/ContextHelp";

type Question = {
  id: string;
  number: number;
  content: string;
  type: "auto" | "manual";
  answer: string;
  correctAnswer: string;
  points: number;
  maxPoints: number;
  isCorrect: boolean;
  isGraded: boolean;
  revealed: boolean;
  feedback?: string;
  explanation?: string;
  mediaType?: "image" | "audio" | null;
  mediaUrl?: string | null;
};

// These structured types serialize their answer/correctAnswer as JSON
// objects/arrays (matching pairs, ordering lists, find-error id sets...);
// formatChoiceAnswer below only knows option-id lookups and would otherwise
// print the raw JSON. formatManualAnswer already renders all of them as
// readable text, so route these types through it and keep formatChoiceAnswer
// only for option-based types (MULTIPLE_CHOICE/MULTI_SELECT/ESSAY/...).
const STRUCTURED_ANSWER_TYPES = new Set(["MATCHING", "ORDERING", "FIND_ERROR", "FILL_IN_BLANK", "TRUE_FALSE"]);

function formatAnswerCell(type: unknown, rawAnswer: unknown, options: unknown): string {
  const upperType = String(type || "").toUpperCase();
  if (STRUCTURED_ANSWER_TYPES.has(upperType)) {
    const lines = formatManualAnswer(upperType, rawAnswer, options);
    if (lines.length && lines[0] !== "Chưa nộp câu trả lời") return lines.join("; ");
  }
  return formatChoiceAnswer(rawAnswer, options);
}

function MediaBadge({ mediaType }: { mediaType?: "image" | "audio" | null }) {
  if (mediaType === "image") return <ImageIcon className="inline-block h-3.5 w-3.5 shrink-0 align-text-bottom text-muted-foreground" aria-label="Câu hỏi có hình ảnh đính kèm" />;
  if (mediaType === "audio") return <Music className="inline-block h-3.5 w-3.5 shrink-0 align-text-bottom text-muted-foreground" aria-label="Câu hỏi có âm thanh đính kèm" />;
  return null;
}

// Two decimal places to match the score format used everywhere else in the
// app (lecturer results list, student results, exam analytics).
const formatPoints = (value: number) => Number(value || 0).toFixed(2);

function textValue(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return textValue(item.answer ?? item.text ?? item.content ?? JSON.stringify(item));
  }
  return String(value);
}

type OptionDisplay = { key: string; text: string };

function parseStoredValue(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || !["{", "["].includes(trimmed[0])) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function optionDisplays(options: unknown): OptionDisplay[] {
  const parsed = parseStoredValue(options);
  if (Array.isArray(parsed)) {
    return parsed.map((option, index) => {
      if (option && typeof option === "object" && !Array.isArray(option)) {
        const item = option as Record<string, unknown>;
        const key = textValue(item.id ?? item.value ?? item.key ?? String.fromCharCode(65 + index));
        const text = textValue(item.text ?? item.content ?? item.label ?? item.value);
        return { key, text };
      }
      return { key: String.fromCharCode(65 + index), text: textValue(option) };
    }).filter((option) => option.text);
  }
  if (parsed && typeof parsed === "object") {
    return Object.entries(parsed as Record<string, unknown>)
      .map(([key, value]) => ({ key, text: textValue(value) }))
      .filter((option) => option.text);
  }
  return [];
}

function formatChoiceAnswer(rawAnswer: unknown, questionOptions: unknown): string {
  const parsed = parseStoredValue(rawAnswer);
  const values = parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>).answers ?? (parsed as Record<string, unknown>).answer ?? parsed
    : parsed;
  const answerValues = Array.isArray(values) ? values : [values];
  const options = optionDisplays(questionOptions);

  return answerValues
    .map((value) => {
      const code = textValue(value).trim();
      if (!code) return "";
      const matched = options.find((option) => option.key.toLowerCase() === code.toLowerCase());
      if (!matched) return code;
      return matched.text.toLowerCase() === matched.key.toLowerCase()
        ? matched.key
        : `${matched.key}. ${matched.text}`;
    })
    .filter(Boolean)
    .join(", ");
}

export default function GradingBreakdown() {
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") || undefined;
  const submissionId = searchParams.get("submissionId") || undefined;
  const [loading, setLoading] = useState(false);
  const [submission, setSubmission] = useState<any | null>(null);

  const loadSubmission = useCallback(async () => {
    if (!examId && !submissionId) return;
    try {
      setLoading(true);
      const result = submissionId ? await api.getMySubmissionById(submissionId) : await api.getMyExamSubmission(examId!);
      setSubmission(result);
    } catch (error) {
      console.error("Không thể tải chi tiết chấm điểm:", error);
    } finally {
      setLoading(false);
    }
  }, [examId, submissionId]);

  useEffect(() => {
    loadSubmission();
  }, [loadSubmission]);

  const questions = useMemo<Question[]>(() => (submission?.answers || []).map((answer: any, index: number) => {
    const question = answer.question || {};
    return {
      id: String(answer.id || question.id || index), number: index + 1,
      content: textValue(question.content || question.text) || "Nội dung câu hỏi chưa khả dụng",
      // The server derives gradingMode from the immutable exam snapshot.
      // A manually graded answer can legitimately have pointsAwarded.
      answer: formatAnswerCell(question.type, answer.answer, question.options),
      correctAnswer: formatAnswerCell(question.type, question.correctAnswer, question.options),
      points: Number(answer.pointsAwarded ?? 0),
      maxPoints: Number(answer.maxPoints ?? question.points ?? 0),
      isCorrect: Boolean(answer.isCorrect),
      isGraded: Boolean(answer.manualGradedAt),
      // The server strips pointsAwarded to `undefined` when this question's
      // score isn't revealed yet (pending publish, or pending manual grading) —
      // distinguish that from an actual, revealed score of 0.
      revealed: typeof answer.pointsAwarded === "number",
      type: answer.gradingMode === "MANUAL" ? "manual" : "auto",
      feedback: answer.feedback || undefined,
      explanation: question.explanation || undefined,
      mediaType: question.mediaType || null,
      mediaUrl: question.mediaUrl || null,
    };
  }), [submission]);

  const autoQuestions = questions.filter((question) => question.type === "auto");
  const manualQuestions = questions.filter((question) => question.type === "manual");
  const sum = (items: Question[], key: "points" | "maxPoints") => items.reduce((total, item) => total + item[key], 0);
  const autoScore = sum(autoQuestions, "points");
  const autoMax = sum(autoQuestions, "maxPoints");
  const manualScore = sum(manualQuestions, "points");
  const manualMax = sum(manualQuestions, "maxPoints");
  const totalScore = autoScore + manualScore;
  const totalMax = autoMax + manualMax;
  const toTenPointScale = (value: number) => totalMax > 0 ? value / totalMax * 10 : 0;
  const autoScoreOnTen = toTenPointScale(autoScore);
  const autoMaxOnTen = toTenPointScale(autoMax);
  const manualScoreOnTen = toTenPointScale(manualScore);
  const manualMaxOnTen = toTenPointScale(manualMax);
  const totalScoreOnTen = toTenPointScale(totalScore);
  const manualPending = manualQuestions.filter((question) => !question.isGraded).length;
  const manualGraded = manualQuestions.length - manualPending;
  const gradingComplete = manualPending === 0;
  const reviewSettings = submission?.exam?.reviewSettings ?? submission?.exam?.settings?.reviewSettings;
  const afterReview = reviewSettings?.enabled && reviewSettings?.phases?.after
    ? reviewSettings.phases.after
    : null;
  const resultsPublished = Boolean(submission?.exam?.resultsPublishedAt);
  const showCorrectAnswers = resultsPublished && (afterReview ? Boolean(afterReview.showAnswers) : true);
  const showFeedback = resultsPublished && (afterReview ? Boolean(afterReview.showFeedback) : true);
  const autoCorrect = autoQuestions.filter((question) => question.isCorrect).length;
  // Defaults true when the server hasn't sent the field at all (older cached
  // response shape) — the lecturer setting itself defaults to "allowed" too.
  const canReviewAnswers = submission?.canReviewAnswers !== false;
  // Provisional score is computed server-side from the raw (unscrubbed) auto-gradable
  // answers — client-side sums are wrong pre-publish because pointsAwarded/isGraded
  // are stripped from the response, defaulting to 0/false (see the icon-fix note below).
  const provisionalScore = typeof submission?.provisionalScore === "number" ? submission.provisionalScore : null;
  const pendingManualCount = Number.isFinite(submission?.pendingManualCount) ? submission.pendingManualCount : manualPending;
  // True once the auto-gradable questions' correctness/score are actually
  // visible in `questions` (either results are officially published, or the
  // lecturer turned on immediate results and the server revealed the
  // auto-graded subset early — see submissions.service.ts autoProvisionalReveal).
  const autoRevealed = resultsPublished || autoQuestions.some((question) => question.revealed);
  const integrityConfirmed = submission?.integrityReview?.status === 'CONFIRMED';
  // BE nulls out penaltyMode/deductedScore/finalScore etc. pre-publish (see
  // sanitizeStudentSubmissionView) — so a non-null penaltyMode here means the
  // deduction amounts are actually visible right now (i.e. results are
  // published), regardless of PERCENT vs FIXED mode.
  const integrityPenalty = integrityConfirmed && submission?.integrityReview?.penaltyMode
    ? submission.integrityReview
    : null;
  // The decision + its reason are shown regardless of publish status — only
  // the score impact waits for publish.
  const integrityPendingReason = integrityConfirmed && !integrityPenalty && !resultsPublished
    ? submission?.integrityReview?.reviewerNote
    : null;
  // BE returns an empty array pre-publish (same reasoning as the integrity
  // penalty numbers above) — these are post-hoc score corrections, part of
  // the official grade, so they only appear once results are published.
  const scoreAdjustments: any[] = Array.isArray(submission?.scoreAdjustments) ? submission.scoreAdjustments : [];
  // `submission.score` (when present) is the server's authoritative final
  // score — it already folds in scoreAdjustments and, if confirmed,
  // integrityReview.finalScore (see sanitizeStudentSubmissionView's
  // `adjustedScore`). The client-side totalScoreOnTen sum below only adds up
  // per-question points and would silently disagree with it (e.g. never
  // reflecting an integrity penalty), so prefer the server value whenever
  // it's available and fall back to the local sum only pre-publish.
  const finalScoreOnTen = typeof submission?.score === "number" ? submission.score : totalScoreOnTen;

  if (!examId && !submissionId) return <DashboardLayout><div className="mx-auto max-w-5xl py-20 text-center"><h1 className="text-lg font-medium">Chưa chọn bài thi</h1><p className="mt-2 text-sm text-muted-foreground">Mở kết quả của một bài thi để xem chi tiết chấm điểm.</p><BackToDashboardButton to="/student/results" className="mt-5" /></div></DashboardLayout>;

  return <DashboardLayout><div className="mx-auto max-w-5xl">
    <BackToDashboardButton to="/student/results" className="mb-4 -ml-2" />
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold">Chi tiết chấm điểm</h1>
        <p className="mt-1 text-muted-foreground">Theo dõi điểm tạm tính, tiến độ chấm và nhận xét của giảng viên.</p>
      </div>
      <Button variant="outline" size="sm" onClick={loadSubmission} disabled={loading} className="gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        Làm mới
      </Button>
    </div>

    {loading ? <div className="py-20 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></div> : <div className="mt-6 space-y-6">
      <div className="flex flex-wrap gap-2"><Badge variant={gradingComplete ? "default" : "secondary"}>{gradingComplete ? "Đã hoàn tất chấm" : `Đã chấm tự động · Chờ giảng viên chấm ${manualPending} câu`}</Badge>{manualQuestions.length > 0 ? <Badge variant="outline">Chấm thủ công: {manualGraded}/{manualQuestions.length} câu</Badge> : null}</div>

      {resultsPublished ? (
        <Card className="border-emerald-500/30 bg-emerald-500/5"><CardContent className="flex items-start gap-3 pt-6"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-medium text-emerald-700 dark:text-emerald-400">Kết quả đã được công bố</p><p className="mt-1 text-sm text-muted-foreground">Điểm và các thông tin bên dưới là kết quả chính thức. Nếu giảng viên chấm lại một câu tự luận, điểm sẽ được cập nhật ngay khi bạn làm mới trang.</p></div></CardContent></Card>
      ) : autoRevealed ? (
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="flex items-start gap-3 pt-6"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-medium text-amber-700 dark:text-amber-400">Điểm tạm tính — chưa công bố chính thức</p><p className="mt-1 text-sm text-muted-foreground">Các câu chấm tự động đã hiện đúng/sai và điểm bên dưới. Còn {pendingManualCount} câu tự luận/chấm tay chưa chấm — điểm tổng (<span className="font-semibold text-foreground">{formatPoints(provisionalScore ?? 0)} / 10</span> tạm tính) CHƯA phải điểm cuối cùng và có thể thay đổi. Đáp án đúng và nhận xét vẫn được giữ kín cho tới khi giảng viên công bố kết quả chính thức.</p></div></CardContent></Card>
      ) : (
        <Card className="border-amber-500/30 bg-amber-500/5"><CardContent className="flex items-start gap-3 pt-6"><Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="font-medium text-amber-700 dark:text-amber-400">Kết quả chưa được công bố</p><p className="mt-1 text-sm text-muted-foreground">Giảng viên chưa công bố kết quả bài thi này. Điểm, đáp án đúng/sai và nhận xét bên dưới hiện chưa hiển thị — làm mới trang sau khi giảng viên công bố để xem kết quả chính thức.</p></div></CardContent></Card>
      )}

      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Calculator className="h-5 w-5 text-primary" />Tổng quan điểm</CardTitle><CardDescription>Tất cả điểm tổng hợp được quy đổi về thang 10; cột điểm của câu chấm tự động cũng hiển thị theo thang này.</CardDescription></CardHeader><CardContent><div className="grid gap-4 sm:grid-cols-3">
        <ScoreCard icon={<Cpu className="h-5 w-5" />} tone="blue" label="Phần chấm tự động" help="Điểm của các câu hệ thống tự động chấm ngay khi nộp bài: trắc nghiệm, nhiều đáp án, đúng/sai, tìm lỗi sai, ghép đôi, sắp xếp." score={autoScoreOnTen} max={autoMaxOnTen} detail={`${autoQuestions.length} câu hỏi · quy đổi thang 10`} />
        <ScoreCard icon={<User className="h-5 w-5" />} tone="violet" label="Phần chấm thủ công" help="Điểm của các câu cần giảng viên chấm tay: tự luận, trả lời ngắn, điền vào chỗ trống. Điểm chỉ hiển thị sau khi giảng viên chấm xong và kết quả được công bố." score={manualScoreOnTen} max={manualMaxOnTen} detail={manualPending ? `Chờ giảng viên chấm ${manualPending} câu · quy đổi thang 10` : `Đã chấm ${manualGraded} câu · quy đổi thang 10`} />
        <ScoreCard icon={<Calculator className="h-5 w-5" />} tone="primary" label={gradingComplete && resultsPublished ? "Điểm cuối cùng" : "Điểm tạm tính"} help={gradingComplete && resultsPublished ? "Đã bao gồm điểm hậu kiểm và điều chỉnh do vi phạm toàn vẹn (nếu có)." : undefined} score={finalScoreOnTen} max={10} detail={gradingComplete && resultsPublished ? "Đã quy đổi theo thang 10" : "Sẽ cập nhật sau khi hoàn tất chấm & công bố"} />
      </div></CardContent></Card>

      {integrityPenalty ? <Card className="border-destructive/30 bg-destructive/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg text-destructive"><AlertTriangle className="h-5 w-5" />Điều chỉnh điểm do gian lận</CardTitle><CardDescription>Quyết định xử lý toàn vẹn học thuật đã được áp dụng cho bài làm này.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 sm:grid-cols-3"><div><p className="text-sm text-muted-foreground">Điểm học thuật</p><p className="text-lg font-semibold">{Number(integrityPenalty.academicScore ?? 0).toFixed(2)} / 10</p></div><div><p className="text-sm text-muted-foreground">Điểm bị trừ do vi phạm toàn vẹn</p><p className="text-lg font-semibold text-destructive">{integrityPenalty.penaltyMode === 'FIXED' ? `${Number(integrityPenalty.penaltyAmount ?? integrityPenalty.deductedScore ?? 0).toFixed(2)} điểm` : `${Number(integrityPenalty.deductedScore ?? 0).toFixed(2)} điểm (${integrityPenalty.penaltyPercent}%)`}</p></div><div><p className="text-sm text-muted-foreground">Điểm cuối</p><p className="text-lg font-semibold">{Number(integrityPenalty.finalScore ?? 0).toFixed(2)} / 10</p></div></div>{integrityPenalty.reviewerNote ? <p className="rounded-md bg-background/70 p-3 text-sm text-destructive"><span className="font-medium">Lý do: </span>{integrityPenalty.reviewerNote}</p> : null}</CardContent></Card> : integrityPendingReason ? <Card className="border-amber-500/30 bg-amber-500/5"><CardHeader><CardTitle className="flex items-center gap-2 text-lg text-amber-700 dark:text-amber-400"><AlertTriangle className="h-5 w-5" />Vụ việc vi phạm toàn vẹn đã được xác nhận</CardTitle><CardDescription>Mức điều chỉnh điểm (nếu có) sẽ hiển thị sau khi giảng viên công bố kết quả chính thức.</CardDescription></CardHeader><CardContent><p className="rounded-md bg-background/70 p-3 text-sm text-foreground"><span className="font-medium">Lý do: </span>{integrityPendingReason}</p></CardContent></Card> : null}

      {scoreAdjustments.length > 0 ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FileEdit className="h-5 w-5 text-primary" />Điểm hậu kiểm</CardTitle><CardDescription>Các khoản cộng/trừ điểm giảng viên áp dụng sau khi chấm, ngoài điểm từng câu.</CardDescription></CardHeader><CardContent className="space-y-2">{scoreAdjustments.map((adjustment: any) => <div key={adjustment.id} className="rounded-lg border p-3 text-sm"><div className="flex flex-wrap items-center gap-2"><span className={`font-semibold ${Number(adjustment.amount) >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatSignedScoreAdjustment(Number(adjustment.amount))} điểm</span><span className="text-muted-foreground">·</span><span>{getScoreAdjustmentCategoryLabel(adjustment.category)}</span></div>{adjustment.reason ? <p className="mt-1 text-muted-foreground">Lý do: {adjustment.reason}</p> : null}</div>)}</CardContent></Card> : null}

      {submission?.proctoring ? <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-primary" />Dữ liệu giám sát phiên thi</CardTitle><CardDescription>Phiên thi có dữ liệu giám sát được lưu để giảng viên đối chiếu khi cần.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Dữ liệu này không phải điểm phạt, không tự kết luận hành vi và không làm thay đổi điểm số tự động. Chi tiết kỹ thuật chỉ hiển thị cho giảng viên khi cần xem xét.</p></CardContent></Card> : null}

      {canReviewAnswers ? <>
      <Card className="overflow-hidden"><CardHeader className="border-b bg-muted/30"><CardTitle className="flex items-center gap-2 text-lg"><Cpu className="h-5 w-5 text-blue-600" />Câu hỏi chấm tự động</CardTitle><CardDescription>{autoQuestions.length} câu · {autoRevealed ? `${formatPoints(autoScoreOnTen)} / ${formatPoints(autoMaxOnTen)} điểm · quy đổi thang 10 · Đúng ${autoCorrect} câu` : "Điểm và kết quả đúng/sai sẽ hiển thị sau khi giảng viên công bố kết quả"}</CardDescription></CardHeader><CardContent className="pt-5">
        {autoQuestions.length === 0 ? <EmptyQuestions /> : <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>#</TableHead><TableHead>Câu hỏi</TableHead><TableHead>Câu trả lời của bạn</TableHead>{showCorrectAnswers ? <TableHead>Đáp án đúng</TableHead> : null}<TableHead className="text-center">Điểm (thang 10)</TableHead><TableHead className="text-center">Kết quả</TableHead></TableRow></TableHeader><TableBody>{autoQuestions.map((question) => <TableRow key={question.id}><TableCell>{question.number}</TableCell><TableCell className="font-medium max-w-xs whitespace-normal break-words"><p><MediaBadge mediaType={question.mediaType} /> {question.content}</p>{question.mediaType === "image" && question.mediaUrl ? <img src={question.mediaUrl} alt="Hình ảnh minh họa câu hỏi" className="mt-2 max-h-40 w-full rounded-md border object-contain" /> : question.mediaType === "audio" && question.mediaUrl ? <audio src={question.mediaUrl} controls className="mt-2 w-full" /> : null}{showFeedback && question.explanation ? <p className="mt-2 text-sm font-normal text-muted-foreground"><span className="font-medium text-foreground">Giải thích: </span>{question.explanation}</p> : null}</TableCell><TableCell className="max-w-xs whitespace-normal break-words">{question.answer || "Chưa trả lời"}</TableCell>{showCorrectAnswers ? <TableCell className="max-w-xs whitespace-normal break-words">{question.correctAnswer || "Chưa công bố"}</TableCell> : null}<TableCell className="text-center whitespace-nowrap">{question.revealed ? `${formatPoints(toTenPointScale(question.points))} / ${formatPoints(toTenPointScale(question.maxPoints))} điểm` : "— / " + formatPoints(toTenPointScale(question.maxPoints)) + " điểm"}</TableCell><TableCell className="text-center whitespace-nowrap">{!question.revealed ? <Clock3 className="mx-auto h-5 w-5 text-muted-foreground" aria-label="Chưa công bố kết quả" /> : question.isCorrect ? <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" /> : <XCircle className="mx-auto h-5 w-5 text-red-600 dark:text-red-400" />}</TableCell></TableRow>)}</TableBody></Table></div>}
        {(!showCorrectAnswers || !showFeedback) && autoQuestions.length > 0 ? <p className="mt-4 text-xs text-muted-foreground">Đáp án đúng và giải thích chỉ hiển thị khi giảng viên công bố kết quả và cho phép xem lại.</p> : null}
      </CardContent></Card>

      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-violet-600" />Câu hỏi chấm thủ công</CardTitle><CardDescription>Câu tự luận hiển thị điểm và nhận xét theo chính sách xem lại của bài thi. Điểm được quy đổi theo thang 10.</CardDescription></CardHeader><CardContent>{manualQuestions.length === 0 ? <EmptyQuestions /> : <div className="space-y-3">{manualQuestions.map((question) => <div key={question.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><p className="font-medium break-words"><MediaBadge mediaType={question.mediaType} /> Câu {question.number}. {question.content}</p><Badge variant={question.isGraded ? "outline" : "secondary"}>{question.isGraded ? `${formatPoints(toTenPointScale(question.points))} / ${formatPoints(toTenPointScale(question.maxPoints))} điểm` : resultsPublished ? "Chờ chấm" : "Chưa công bố"}</Badge></div>{question.mediaType === "image" && question.mediaUrl ? <img src={question.mediaUrl} alt="Hình ảnh minh họa câu hỏi" className="mt-3 max-h-56 w-full rounded-md border object-contain" /> : question.mediaType === "audio" && question.mediaUrl ? <audio src={question.mediaUrl} controls className="mt-3 w-full" /> : null}<div className="mt-3 rounded-md bg-muted/40 p-3 text-sm break-words"><span className="font-medium">Câu trả lời của bạn: </span>{question.answer || "Chưa trả lời"}</div>{showFeedback && question.feedback ? <div className="mt-3 flex gap-2 text-sm"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><p className="break-words"><span className="font-medium">Nhận xét của giảng viên: </span>{question.feedback}</p></div> : showFeedback && question.isGraded ? <p className="mt-3 text-sm text-muted-foreground">Giảng viên chưa để lại nhận xét.</p> : null}</div>)}</div>}</CardContent></Card>
      </> : <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Cpu className="h-5 w-5 text-muted-foreground" />Xem lại bài làm</CardTitle><CardDescription>Giảng viên đã tắt xem lại nội dung bài làm cho đề thi này.</CardDescription></CardHeader><CardContent><p className="text-sm text-muted-foreground">Bạn không thể xem lại nội dung câu hỏi và câu trả lời của mình cho đề thi này. Điểm số ở các thẻ phía trên vẫn được cập nhật và công bố bình thường theo đúng chính sách của đề thi.</p></CardContent></Card>}
    </div>}
  </div></DashboardLayout>;
}

function ScoreCard({ icon, tone, label, score, max, detail, help }: { icon: React.ReactNode; tone: "blue" | "violet" | "primary"; label: string; score: number; max: number; detail: string; help?: string }) {
  const color = tone === "blue" ? "border-blue-200 bg-blue-50/60 text-blue-700" : tone === "violet" ? "border-violet-200 bg-violet-50/60 text-violet-700" : "border-primary/20 bg-primary/5 text-primary";
  return <div className={`rounded-lg border p-4 ${color}`}><div className="flex items-center gap-2">{icon}<p className="text-sm font-medium">{label}</p>{help ? <ContextHelp content={help} /> : null}</div><p className="mt-3 text-xl font-bold">{formatPoints(score)} / {formatPoints(max)} điểm</p><p className="mt-1 text-xs opacity-80">{detail}</p><Progress value={max > 0 ? score / max * 100 : 0} className="mt-3 h-1.5" /></div>;
}

function EmptyQuestions() { return <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><Clock3 className="mx-auto mb-2 h-5 w-5" />Chưa có dữ liệu câu hỏi để hiển thị.</div>; }
