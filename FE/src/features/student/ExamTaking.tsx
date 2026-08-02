"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Volume2,
  Maximize,
  X,
  Shield,
  CheckCircle2,
  Camera,
} from "lucide-react";

import { api } from "@/lib/api";
import { ExamSecurityModal } from "../../components/common/ExamSecurityModal";
import {
  useExamSecurity,
  type ViolationLog,
} from "../../hooks/use-exam-security";
import {
  EXAM_DURATION,
  MAX_VIOLATIONS,
  isAnswered,
  mapBackendToUiQuestion,
  normalizeSubmissionAnswer,
  rawQuestions,
  shuffleArray,
  typeBadgeColor,
  typeLabel,
  type AnswerMap,
  type OrderingQ,
  type Question,
} from "./exam-taking-model";
import { QuestionRenderer } from "./ExamQuestionRenderer";

// ─── Main component ───────────────────────────────────────────────
export default function ExamTaking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") || undefined;
  const isPreviewMode = searchParams.get("mode") === "preview";
  const proctoringEnabled = searchParams.get("proctoring") !== "0";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState("Phiên thi");
  const [isLoadingExam, setIsLoadingExam] = useState(true);

  const [orderState, setOrderState] = useState<Record<number, string[]>>({});

  const total = questions.length;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(15);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [examSessionStatus, setExamSessionStatus] = useState<
    "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED"
  >("NOT_STARTED");
  const [fullscreenRequestedAt, setFullscreenRequestedAt] = useState<number | null>(null);
  const [webcamPolicy, setWebcamPolicy] = useState<any>(null);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [isStartingWebcam, setIsStartingWebcam] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logRef = useRef<{ type: string; ts: number; detail?: string }[]>([]);
  const startSessionRequestedRef = useRef(false);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const evidenceCaptureInFlightRef = useRef(false);

  useEffect(() => {
    if (!examId || isPreviewMode) return;
    const storedSubmissionId = localStorage.getItem("currentSubmissionId");
    const storedExamId = localStorage.getItem("currentSubmissionExamId");
    if (storedSubmissionId && storedExamId === examId) {
      setSubmissionId(storedSubmissionId);
      setExamSessionStatus("IN_PROGRESS");
      const storedStartedAt = Number(localStorage.getItem("currentSubmissionStartedAt") || 0);
      if (storedStartedAt > 0) setExamStartedAt(storedStartedAt);
      try {
        const storedPolicy = localStorage.getItem("currentSubmissionWebcamPolicy");
        if (storedPolicy) setWebcamPolicy(JSON.parse(storedPolicy));
      } catch {}
    }
    const graceStartedAt = Number(localStorage.getItem("examFullscreenGraceStartedAt") || 0);
    if (graceStartedAt > 0 && Date.now() - graceStartedAt < 5000) {
      setFullscreenRequestedAt(graceStartedAt);
    }
    localStorage.removeItem("examFullscreenGraceStartedAt");
  }, [examId, isPreviewMode]);

  useEffect(() => {
    if (!examId || isPreviewMode || isLoadingExam || submissionId) return;
    if (webcamPolicy?.enabled && !webcamReady) return;
    if (startSessionRequestedRef.current) return;
    startSessionRequestedRef.current = true;

    let cancelled = false;
    api
      .startExam(examId, webcamPolicy?.enabled ? { webcamReady: true, webcamConsentVersion: webcamPolicy.consentVersion } : undefined)
      .then((started) => {
        if (cancelled || !started?.id) return;
        setSubmissionId(started.id);
        const snapshotPolicy = started?.examInstance?.snapshotPayload?.webcamEvidencePolicy;
        if (snapshotPolicy?.enabled) setWebcamPolicy(snapshotPolicy);
        const startedAt = new Date(started?.startedAt || Date.now()).getTime();
        setExamStartedAt(startedAt);
        setExamSessionStatus("IN_PROGRESS");
        localStorage.setItem("currentSubmissionId", started.id);
        localStorage.setItem("currentSubmissionExamId", examId);
        localStorage.setItem("currentSubmissionStartedAt", String(startedAt));
        if (snapshotPolicy) localStorage.setItem("currentSubmissionWebcamPolicy", JSON.stringify(snapshotPolicy));
      })
      .catch((error) => {
        startSessionRequestedRef.current = false;
        console.error("Failed to initialize exam session:", error);
      });

    return () => {
      cancelled = true;
    };
  }, [examId, isLoadingExam, isPreviewMode, submissionId, webcamPolicy, webcamReady]);

  useEffect(() => {
    let mounted = true;

    const loadExam = async () => {
      setIsLoadingExam(true);
      try {
        if (!examId) {
          const fallback = shuffleArray(rawQuestions).map((q) => {
            if (q.type === "single-choice" || q.type === "multi-choice") {
              return { ...q, options: shuffleArray(q.options) };
            }
            if (q.type === "matching") {
              return { ...q, right: shuffleArray(q.right) };
            }
            return q;
          });
          if (!mounted) return;
          setExamTitle("Bài thi luyện tập");
          setQuestions(fallback);
          return;
        }

        const exam = await api.getExam(examId);
        const backendQuestions = Array.isArray(exam?.examQuestions)
          ? exam.examQuestions
          : [];
        const mapped = backendQuestions.map((eq: any, idx: number) => {
          const ui = mapBackendToUiQuestion(eq?.question, idx) as any;
          return {
            ...ui,
            questionId: eq?.questionId || eq?.question?.id,
          };
        });

        if (!mounted) return;
        setExamTitle(exam?.title || "Phiên thi");
        const configuredPolicy = exam?.settings?.webcamEvidencePolicy?.enabled ? exam.settings.webcamEvidencePolicy : null;
        setWebcamPolicy((current: any) => current?.scheduledCaptureOffsetsMs?.length ? current : configuredPolicy);
        setQuestions(mapped.length > 0 ? mapped : []);
      } catch (err) {
        console.error("Failed to load exam questions:", err);
        if (!mounted) return;
        setQuestions([]);
      } finally {
        if (mounted) setIsLoadingExam(false);
      }
    };

    loadExam();
    return () => {
      mounted = false;
    };
  }, [examId]);

  useEffect(() => {
    const init: Record<number, string[]> = {};
    questions
      .filter((q): q is OrderingQ => q.type === "ordering")
      .forEach((q) => {
        init[q.id] = shuffleArray(q.items);
      });
    setOrderState(init);
  }, [questions]);

  const log = useCallback((type: string, detail?: string) => {
    logRef.current.push({ type, ts: Date.now(), detail });
  }, []);

  const startWebcam = useCallback(async () => {
    if (!webcamPolicy?.enabled) return;
    setIsStartingWebcam(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        await webcamVideoRef.current.play();
      }
      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", () => {
        setWebcamReady(false);
        log("camera_stream_ended", "Webcam stream ended during the exam");
      }));
      setWebcamReady(true);
    } catch {
      log("webcam_permission_denied", "Student did not grant usable webcam permission");
      toast.error("Bài thi này yêu cầu bạn cấp quyền webcam trước khi bắt đầu.");
    } finally {
      setIsStartingWebcam(false);
    }
  }, [log, webcamPolicy]);

  const requestWebcamEvidence = useCallback(async (trigger: "SCHEDULED" | "SUSPICIOUS_EVENT", options?: { signals?: string[] }) => {
    const activeSubmissionId = submissionId || localStorage.getItem("currentSubmissionId");
    const video = webcamVideoRef.current;
    if (!webcamPolicy?.enabled || !webcamReady || !activeSubmissionId || !video || evidenceCaptureInFlightRef.current || video.videoWidth < 1) return;
    evidenceCaptureInFlightRef.current = true;
    try {
      const permit = await api.requestEvidenceCapture(activeSubmissionId, { trigger, ...options });
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.max(1, Math.floor(video.videoWidth * ratio));
      canvas.height = Math.max(1, Math.floor(video.videoHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare webcam frame");
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      await api.finalizeEvidenceCapture(activeSubmissionId, permit.captureId, { nonce: permit.nonce, imageDataUrl: canvas.toDataURL("image/jpeg", 0.72) });
    } catch (error) {
      console.warn("Webcam evidence capture was skipped:", error);
    } finally {
      evidenceCaptureInFlightRef.current = false;
    }
  }, [submissionId, webcamPolicy, webcamReady]);

  useEffect(() => {
    log("exam_start");
  }, [log]);

  // Timer with auto-submit
  const doSubmit = useCallback(async () => {
    setIsSubmitting(true);
    log("submit");
    // attempt to submit answers + logs if we have a submissionId stored
    try {
      let activeSubmissionId =
        submissionId || localStorage.getItem("currentSubmissionId");
      const submissionExamId = localStorage.getItem("currentSubmissionExamId");

      // Drop stale submission ids from previous exams.
      if (examId && submissionExamId && submissionExamId !== examId) {
        activeSubmissionId = null;
      }

      // Create a submission now if missing.
      if (!activeSubmissionId && examId) {
        const started = await api.startExam(examId);
        if (started?.id) {
          activeSubmissionId = started.id;
          setSubmissionId(activeSubmissionId);
          setExamSessionStatus("IN_PROGRESS");
          localStorage.setItem("currentSubmissionId", activeSubmissionId);
          localStorage.setItem("currentSubmissionExamId", examId);
          const startedAt = new Date(started.startedAt || Date.now()).getTime();
          setExamStartedAt(startedAt);
          localStorage.setItem("currentSubmissionStartedAt", String(startedAt));
          const snapshotPolicy = started?.examInstance?.snapshotPayload?.webcamEvidencePolicy;
          if (snapshotPolicy) localStorage.setItem("currentSubmissionWebcamPolicy", JSON.stringify(snapshotPolicy));
        }
      }

      if (!activeSubmissionId) {
        throw new Error("No active submission found for this exam.");
      }

      // build answers payload from current answers map
      const payloadAnswers = Object.entries(answers)
        .map(([uiQId, ans]) => {
          const question = questions.find(
            (q: any) => q.id === Number(uiQId),
          ) as any;
          if (!question?.questionId) return null;
          return {
            questionId: String(question.questionId),
            answer: normalizeSubmissionAnswer(question as Question, ans),
            timeTaken: undefined,
          };
        })
        .filter(Boolean) as Array<{
        questionId: string;
        answer: any;
        timeTaken?: number;
      }>;

      // send logs
      const logs = logRef.current.map((l) => ({
        type: l.type,
        details: l.detail,
        ts: l.ts,
      }));
      await api.submitExam(activeSubmissionId, payloadAnswers, logs);
      setExamSessionStatus("SUBMITTED");

      // Clear active submission markers after successful submit.
      try {
        localStorage.removeItem("currentSubmissionId");
        localStorage.removeItem("currentSubmissionExamId");
        localStorage.removeItem("currentSubmissionStartedAt");
        localStorage.removeItem("currentSubmissionWebcamPolicy");
      } catch {}
    } catch (err) {
      console.error("Failed to submit to server:", err);
      toast.error("Nộp bài không thành công. Vui lòng thử lại.");
      setIsSubmitting(false);
      return;
    }

    await new Promise((r) => setTimeout(r, 1500));
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    // Navigate to grading for this exam if available
    if (examId)
      router.push(`/student/grading?examId=${encodeURIComponent(examId)}`);
    else router.push("/student/grading");
  }, [log, router, examId, answers, questions, submissionId]);

  const handleViolation = useCallback(
    (entry: ViolationLog) => {
      if (!proctoringEnabled) return;
      log(entry.type, entry.detail);
      try {
        const activeSubmissionId =
          submissionId || localStorage.getItem("currentSubmissionId");
        if (activeSubmissionId) {
          api
            .sendExamLogs(activeSubmissionId, [
              {
                type: entry.type,
                details: entry.detail ?? `Security violation: ${entry.type}`,
                ts: entry.timestamp,
              },
            ])
            .catch((e) => console.error("sendExamLogs failed", e));
        }
      } catch (e) {
        console.error("Failed to send violation log", e);
      }
      if (["tab_switch", "window_blur", "blur", "fullscreen_exit"].includes(entry.type)) {
        void requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: [entry.type] });
      }
    },
    [log, submissionId, proctoringEnabled, requestWebcamEvidence],
  );

  const {
    isBlocked: isSecurityBlocked,
    violationCount,
    isEscalated,
    lastViolation,
    returnToExam,
    canFullscreen,
  } = useExamSecurity({
    // Preview still enforces fullscreen when explicitly requested, but it is a
    // safe rehearsal: no proctoring events are persisted and it cannot submit.
    enabled: proctoringEnabled && !isLoadingExam && (isPreviewMode || examSessionStatus === "IN_PROGRESS"),
    maxViolations: MAX_VIOLATIONS,
    sessionStatus: isPreviewMode ? "IN_PROGRESS" : examSessionStatus,
    isSubmitting,
    initialFullscreenRequestedAt: fullscreenRequestedAt,
    onViolation: isPreviewMode ? undefined : handleViolation,
    onEscalate: isPreviewMode ? undefined : () => {
      if (isSubmitting) return;
      log("violation_escalation", `Reached ${MAX_VIOLATIONS} violations`);
      doSubmit();
    },
  });

  useEffect(() => {
    if (isPreviewMode || !isSecurityBlocked || isSubmitting) {
      setFullscreenCountdown(15);
      return;
    }

    const startedAt = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, 15 - elapsed);
      setFullscreenCountdown(remaining);
      if (remaining === 0) {
        window.clearInterval(id);
        doSubmit();
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [isPreviewMode, isSecurityBlocked, isSubmitting, doSubmit]);

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          doSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [doSubmit]);

  useEffect(() => {
    if (isPreviewMode || examSessionStatus !== "IN_PROGRESS" || isSubmitting || !webcamPolicy?.enabled || !webcamReady || !examStartedAt) return;
    const offsets = Array.isArray(webcamPolicy.scheduledCaptureOffsetsMs)
      ? webcamPolicy.scheduledCaptureOffsetsMs.map(Number).filter(Number.isFinite).sort((a: number, b: number) => a - b)
      : [];
    if (offsets.length === 0) return;

    // Sync once after opening/reloading so the server can record already-missed
    // slots. The server alone decides whether a slot is currently due.
    let timer: number | undefined;
    let cancelled = false;
    const scheduleNext = () => {
      if (cancelled) return;
      const nextOffset = offsets.find((offset: number) => examStartedAt + offset > Date.now());
      if (nextOffset === undefined) return;
      timer = window.setTimeout(async () => {
        await requestWebcamEvidence("SCHEDULED");
        scheduleNext();
      // A small buffer prevents client/server clock skew from submitting a
      // request a few milliseconds before the server considers the slot due.
      }, Math.max(0, examStartedAt + nextOffset + 3_000 - Date.now()));
    };
    void requestWebcamEvidence("SCHEDULED");
    scheduleNext();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [examSessionStatus, isPreviewMode, isSubmitting, webcamPolicy, webcamReady, examStartedAt, requestWebcamEvidence]);

  useEffect(() => () => {
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const video = webcamVideoRef.current;
    if (webcamReady && video && webcamStreamRef.current) {
      video.srcObject = webcamStreamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [webcamReady]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60),
      sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isTimeLow = timeLeft < 300;
  const answeredCount = questions.filter((q) => isAnswered(q, answers)).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const q = questions[current];

  if (isLoadingExam) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Đang tải bài thi...
      </div>
    );
  }

  if (webcamPolicy?.enabled && !webcamReady && !isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-primary"><Camera className="h-5 w-5" /><span className="font-semibold">Xác nhận webcam giám sát</span></div>
            <p className="text-sm text-muted-foreground">Bài thi lý thuyết này yêu cầu webcam. Hệ thống chỉ chụp tối đa 5 ảnh khi bạn không tương tác trong một khoảng ngẫu nhiên hoặc có sự kiện bảo mật; ảnh dùng để giảng viên xem xét và tự xóa sau 30 ngày.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <video ref={webcamVideoRef} muted playsInline className="w-full aspect-video rounded-md bg-black object-cover" />
            <Button onClick={() => void startWebcam()} disabled={isStartingWebcam} className="w-full gap-2"><Camera className="h-4 w-4" />{isStartingWebcam ? "Đang mở webcam…" : "Tôi đồng ý và bật webcam"}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (total === 0 || !q) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">
            Không tìm thấy câu hỏi cho bài thi này.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Vui lòng liên hệ giảng viên hoặc thử lại sau.
          </p>
          <BackToDashboardButton
            to="/student"
            variant="default"
            size="default"
            className="mt-4"
          />
        </div>
      </div>
    );
  }

  const setAnswer = (qId: number, val: unknown) =>
    setAnswers((prev) => {
      const next = { ...prev, [qId]: val };
      log("answer", JSON.stringify({ questionId: qId, value: val }));
      return next;
    });

  const handleFlag = () =>
    setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
  const handleClear = () =>
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });

  const goToPreview = () => {
    const params = new URLSearchParams(searchParams);
    params.set("mode", "preview");
    router.push(`/student/exam-taking?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const leavePreview = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("mode");
    router.push(`/student/exam-taking?${params.toString()}`);
  };

  const renderAnswerPreview = (question: Question) => {
    const answer = answers[question.id];
    if (!isAnswered(question, answers)) {
      return <span className="font-medium text-red-600 dark:text-red-300">Chưa trả lời</span>;
    }

    if (question.type === "single-choice") {
      const idx = Number(answer);
      const opt = question.options[idx];
      return <span>{opt ? `${String.fromCharCode(65 + idx)}. ${opt}` : "Đã trả lời"}</span>;
    }

    if (question.type === "multi-choice") {
      const indices = Array.isArray(answer) ? (answer as number[]) : [];
      const labels = indices
        .map((idx) => {
          const opt = question.options[idx];
          return opt ? `${String.fromCharCode(65 + idx)}. ${opt}` : null;
        })
        .filter(Boolean);
      return <span>{labels.join("; ")}</span>;
    }

    if (question.type === "true-false") {
      return <span>{answer ? "Đúng" : "Sai"}</span>;
    }

    if (question.type === "fill-blank") {
      const blanks = Array.isArray(answer) ? (answer as string[]) : [];
      return <span>{blanks.filter((v) => v?.trim()).join(" | ")}</span>;
    }

    if (question.type === "short-answer") {
      return <span>{String(answer)}</span>;
    }

    return <span>Đã trả lời</span>;
  };

  // ─── Dispatch to sub-renderers ────────────────────────────────
  const renderQuestion = (question: Question) => (
    <QuestionRenderer
      question={question}
      answers={answers}
      setAnswer={setAnswer}
      orderState={orderState}
      setOrderState={setOrderState}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {webcamPolicy?.enabled ? <video ref={webcamVideoRef} muted playsInline className="hidden" /> : null}
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-card/95 px-3 shadow-sm backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="truncate text-sm font-semibold">{examTitle}</span>
          {violationCount > 0 && (
            <StatusBadge status="critical" domain="severity">
              {violationCount} tín hiệu cần xem xét
            </StatusBadge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div
            aria-label="Thời gian còn lại"
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-sm font-semibold ${
              isTimeLow
                ? "bg-red-500/10 text-red-700 dark:text-red-300"
                : "bg-secondary text-foreground"
            }`}
          >
            <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={returnToExam}
            disabled={!canFullscreen}
            aria-label="Trở lại chế độ toàn màn hình"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ExamSecurityModal
        open={isSecurityBlocked}
        violationCount={violationCount}
        maxViolations={MAX_VIOLATIONS}
        isEscalated={isEscalated}
        countdownSeconds={fullscreenCountdown}
        lastViolation={lastViolation}
        canFullscreen={canFullscreen}
        onReturnToExam={returnToExam}
      />

      <div className="flex min-h-screen pt-16">
        {/* ── Navigator Sidebar ────────────────────────────────── */}
        <aside className={`fixed bottom-0 left-0 top-16 w-60 overflow-y-auto border-r bg-card p-4 ${isPreviewMode ? "hidden" : "hidden md:flex md:flex-col"}`}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
            Tiến độ
          </h3>
          <Progress
            value={(answeredCount / total) * 100}
            className="h-1.5 mb-1"
          />
          <p className="text-xs text-muted-foreground mb-3">
            Đã trả lời {answeredCount}/{total}
          </p>

          <div className="grid grid-cols-4 md:grid-cols-5 gap-1 mb-4">
            {questions.map((qItem, idx) => {
              const ans = isAnswered(qItem, answers);
              const fl = flagged[qItem.id];
              const cur = current === idx;
              return (
                <button
                  key={qItem.id}
                  onClick={() => setCurrent(idx)}
                  title={`Câu ${idx + 1}: ${typeLabel[qItem.type]}`}
                  className={[
                    "h-8 w-8 rounded text-xs font-medium border transition-all",
                    cur ? "ring-2 ring-primary ring-offset-1" : "",
                    fl ? "bg-yellow-100 border-yellow-300 text-yellow-700" : "",
                    ans && !fl
                      ? "bg-green-100 border-green-300 text-green-700"
                      : "",
                    !ans && !fl
                      ? "bg-secondary border-border text-muted-foreground"
                      : "",
                  ].join(" ")}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3 mb-4">
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-300 shrink-0" />{" "}
              Đã trả lời
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 shrink-0" />{" "}
              Đánh dấu xem lại
            </div>
            <div className="flex gap-2 items-center">
              <span className="w-3 h-3 rounded bg-secondary border shrink-0" />{" "}
              Chưa trả lời
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-center text-xs">
            <div className="rounded-md border bg-green-500/10 py-2 text-green-700 dark:text-green-300">
              <div className="font-semibold text-sm">{answeredCount}</div>
              <div>Đã trả lời</div>
            </div>
            <div className="rounded-md border bg-yellow-500/10 py-2 text-yellow-700 dark:text-yellow-300">
              <div className="font-semibold text-sm">{flaggedCount}</div>
              <div>Đánh dấu</div>
            </div>
            <div className="rounded-md border bg-red-500/10 py-2 text-red-700 dark:text-red-300">
              <div className="font-semibold text-sm">{total - answeredCount}</div>
              <div>Chưa trả lời</div>
            </div>
          </div>

          <div className="mt-auto">
            <Button
              className="w-full gap-2"
              onClick={isPreviewMode ? leavePreview : goToPreview}
            >
              <Send className="h-4 w-4" />
              {isPreviewMode ? "Quay lại câu hỏi" : "Kiểm tra trước khi nộp"}
            </Button>
          </div>
        </aside>

        {/* ── Main Question Area ────────────────────────────────── */}
        <main id="main-content" className={`${isPreviewMode ? "ml-0" : "md:ml-60"} flex min-w-0 flex-1 justify-center p-4 sm:p-6`}>
          <div className={`w-full ${isPreviewMode ? "max-w-7xl" : "max-w-3xl"}`}>
            {isPreviewMode ? (
              <Card className="overflow-hidden shadow-medium">
                <CardHeader className="border-b border-border bg-muted/30 pb-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-foreground">
                        Kiểm tra bài làm
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Xem lại các đáp án đã chọn trước khi nộp bài.
                      </p>
                    </div>
                    <Button variant="outline" onClick={leavePreview}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Quay lại câu hỏi
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-5 sm:p-6">
                  {questions.map((item, idx) => {
                    const answered = isAnswered(item, answers);
                    const isFlagged = Boolean(flagged[item.id]);
                    const displayTitle = item.title.trim() || `Câu ${idx + 1}`;
                    return (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border bg-muted/25 p-5 transition-colors hover:border-primary/30 hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="text-base font-semibold text-foreground">
                            Câu {idx + 1}. {displayTitle}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${typeBadgeColor[item.type]}`}
                            >
                              {typeLabel[item.type]}
                            </span>
                            {isFlagged && (
                              <StatusBadge status="flagged" domain="submission">
                                Đánh dấu xem lại
                              </StatusBadge>
                            )}
                            {!answered && (
                              <StatusBadge tone="warning">Chưa trả lời</StatusBadge>
                            )}
                          </div>
                        </div>
                        {item.type === "multi-choice" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-violet-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Chọn tất cả đáp án phù hợp
                          </div>
                        )}
                        <div className="mt-4 rounded-lg border border-border bg-card p-4">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            Câu trả lời của bạn
                          </p>
                          <p className="mt-2 text-base text-foreground">
                            {renderAnswerPreview(item)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
                    Vui lòng kiểm tra kỹ tất cả câu trả lời trước khi nộp bài.
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <Button variant="outline" onClick={leavePreview}>
                      Tiếp tục chỉnh sửa
                    </Button>
                    <Button variant="destructive" onClick={doSubmit} disabled={isSubmitting}>
                      {isSubmitting ? "Đang nộp bài..." : "Nộp bài"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground font-mono">
                        Q{current + 1} / {total}
                      </span>
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${typeBadgeColor[q.type]}`}
                      >
                        {typeLabel[q.type]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {q.points} điểm
                      </span>
                    </div>
                    {flagged[q.id] && (
                      <StatusBadge status="flagged" domain="submission">
                        Đánh dấu xem lại
                      </StatusBadge>
                    )}
                  </div>
                  <h2 className="text-lg font-semibold mt-2">
                    {q.title.trim() || `Câu ${current + 1}`}
                  </h2>
                </CardHeader>

                <CardContent>
                  {q.audioUrl && (
                    <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border">
                      <Volume2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm flex-1">
                        Có tệp âm thanh đính kèm
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isAudioPlaying}
                        onClick={() => {
                          audioRef.current?.pause();
                          audioRef.current = new Audio(q.audioUrl);
                          audioRef.current.play();
                          setIsAudioPlaying(true);
                          audioRef.current.onended = () =>
                            setIsAudioPlaying(false);
                        }}
                      >
                        {isAudioPlaying ? "Đang phát..." : "Phát âm thanh"}
                      </Button>
                    </div>
                  )}

                  {renderQuestion(q)}

                  <div className="flex items-center gap-2 mt-5">
                    <Button
                      variant={flagged[q.id] ? "destructive" : "outline"}
                      size="sm"
                      onClick={handleFlag}
                      className="gap-1.5"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      {flagged[q.id] ? "Bỏ đánh dấu" : "Đánh dấu xem lại"}
                    </Button>
                    {q.type !== "ordering" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        className="gap-1.5"
                      >
                        <X className="h-3.5 w-3.5" /> Xóa câu trả lời
                      </Button>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrent((c) => c - 1)}
                      disabled={current === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" /> Câu trước
                    </Button>
                    <Button
                      onClick={() =>
                        current === total - 1
                          ? goToPreview()
                          : setCurrent((c) => c + 1)
                      }
                      className="gap-2"
                    >
                      Câu tiếp <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

