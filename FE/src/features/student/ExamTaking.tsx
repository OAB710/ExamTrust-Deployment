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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Monitor,
  Info,
} from "lucide-react";

import { api } from "@/lib/api";
import { ExamSecurityModal } from "../../components/common/ExamSecurityModal";
import {
  useExamSecurity,
  type ExamSecurityState,
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

type DuringReviewFeedback = {
  questionId: string;
  unavailable?: boolean;
  pointsAwarded?: number;
  maxPoints?: number;
  isCorrect?: boolean;
  correctAnswer?: unknown;
  explanation?: string;
};

type PendingIntegrityEvent = {
  type: string;
  details: string;
  ts: number;
  clientEventId: string;
};

function createIntegrityEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `integrity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Main component ───────────────────────────────────────────────
export default function ExamTaking() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams.get("examId") || undefined;
  const isPreviewMode = searchParams.get("mode") === "preview";
  // URL-based handoff: ExamReadyCheck passes the submissionId so this page
  // can verify the attempt with the backend instead of trusting localStorage alone.
  const urlSubmissionId = searchParams.get("submissionId") || undefined;
  // The URL is not a security policy. Resolve proctoring from the persisted
  // exam configuration before enabling/turning off any exam safeguards.
  const [proctoringEnabled, setProctoringEnabled] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState("Phiên thi");
  const [isLoadingExam, setIsLoadingExam] = useState(true);

  const [orderState, setOrderState] = useState<Record<number, string[]>>({});

  const total = questions.length;
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [submissionDeadlineAt, setSubmissionDeadlineAt] = useState<number | null>(null);
  const [showDeadlineNotice, setShowDeadlineNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreenCountdown, setFullscreenCountdown] = useState(15);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const doSubmitRef = useRef<any>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [examSessionStatus, setExamSessionStatus] = useState<
    "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED"
  >("NOT_STARTED");
  const [fullscreenRequestedAt, setFullscreenRequestedAt] = useState<number | null>(null);
  const [webcamPolicy, setWebcamPolicy] = useState<any>(null);
  const [webcamPolicyResolved, setWebcamPolicyResolved] = useState(false);
  const [examStartedAt, setExamStartedAt] = useState<number | null>(null);
  const [webcamReady, setWebcamReady] = useState(false);
  const [isStartingWebcam, setIsStartingWebcam] = useState(false);
  const [cameraRecoveryDeadline, setCameraRecoveryDeadline] = useState<number | null>(null);
  const [cameraRecoverySeconds, setCameraRecoverySeconds] = useState(0);
  const [cameraRecoveryExpired, setCameraRecoveryExpired] = useState(false);
  const [screenShareReady, setScreenShareReady] = useState(false);
  const [isStartingScreenShare, setIsStartingScreenShare] = useState(false);
  const [screenShareRecoveryDeadline, setScreenShareRecoveryDeadline] = useState<number | null>(null);
  const [screenShareRecoverySeconds, setScreenShareRecoverySeconds] = useState(0);
  const [screenShareRecoveryExpired, setScreenShareRecoveryExpired] = useState(false);
  const [showFullscreenExitConfirm, setShowFullscreenExitConfirm] = useState(false);
  const [showNavigationGuard, setShowNavigationGuard] = useState(false);
  const [securityState, setSecurityState] = useState<ExamSecurityState | null>(null);
  const [duringReviewFeedback, setDuringReviewFeedback] = useState<
    Record<string, DuringReviewFeedback>
  >({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const logRef = useRef<{ type: string; ts: number; detail?: string }[]>([]);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const evidenceCaptureInFlightRef = useRef(false);
  const cameraIssueActiveRef = useRef(false);
  const screenIssueActiveRef = useRef(false);
  const lastActivityAtRef = useRef(Date.now());
  const idleCaptureArmedRef = useRef(false);
  const copiedTextRef = useRef<Set<string>>(new Set());
  const autosaveSequenceRef = useRef(new Map<string, number>());
  const autosaveTimeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const hydratedSubmissionRef = useRef(false);
  const pendingIntegrityEventsRef = useRef(new Map<string, PendingIntegrityEvent>());
  const pageUnloadRecordedRef = useRef(false);
  const deadlineAutoSubmitRef = useRef(false);

  useEffect(() => {
    if (!examId || isPreviewMode) return;

    // `PerformanceNavigationTiming.type` describes how the CURRENT DOCUMENT was
    // loaded, not how this specific page was reached — client-side router.push
    // navigations (like the one ExamReadyCheck just did) never create a new
    // navigation entry, so this stays "reload" for the rest of the browser tab's
    // life after any earlier full-page refresh (even one on a completely
    // different page). Checking it BEFORE urlSubmissionId below made a stale
    // "reload" from minutes/pages earlier bounce a just-started attempt straight
    // back to exam-ready — before the student ever saw the exam — leaving an
    // orphaned IN_PROGRESS submission server-side (surfacing next time as
    // "Tiếp tục lượt N" instead of a fresh start). A fresh submissionId in the
    // URL is the authoritative signal that this navigation came from
    // ExamReadyCheck's own user gesture, so it must always win over this guard.
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "reload" && !urlSubmissionId) {
      // A browser reload cannot restore fullscreen without a user gesture.
      // Return through the ready gate so webcam/fullscreen policies are applied
      // again before the existing attempt is resumed.
      router.replace(`/student/exam-ready?examId=${encodeURIComponent(examId)}`);
      return;
    }

    // ── Priority 1: URL-based handoff (most reliable) ──
    // ExamReadyCheck passes submissionId in the URL. This is the authoritative
    // signal that a submission was just created/resumed. Verify with backend.
    if (urlSubmissionId) {
      setSubmissionId(urlSubmissionId);
      setExamSessionStatus("IN_PROGRESS");
      hydratedSubmissionRef.current = true;
      void api.getMySubmissionById(urlSubmissionId)
        .then((submission) => {
          if (submission?.securityState) setSecurityState(submission.securityState);
          const serverDeadlineAt = new Date(submission?.deadline || "").getTime();
          if (Number.isFinite(serverDeadlineAt)) setSubmissionDeadlineAt(serverDeadlineAt);
          const startedAt = new Date(submission?.startedAt || Date.now()).getTime();
          if (startedAt > 0) setExamStartedAt(startedAt);
          // Sync verified state to localStorage so refreshes still work
          try {
            localStorage.setItem("currentSubmissionId", urlSubmissionId);
            localStorage.setItem("currentSubmissionExamId", examId);
            if (startedAt > 0) localStorage.setItem("currentSubmissionStartedAt", String(startedAt));
            if (submission?.deadline) localStorage.setItem("currentSubmissionDeadline", String(submission.deadline));
          } catch {}
        })
        .catch((error) => {
          console.warn("URL submission verification failed, falling back to localStorage:", error);
          // Don't redirect on transient errors — the submission was just
          // created by ExamReadyCheck and is already in localStorage.
          // Only redirect if we can't find ANY submission evidence.
          const storedSubmissionId = localStorage.getItem("currentSubmissionId");
          const storedExamId = localStorage.getItem("currentSubmissionExamId");
          if (!storedSubmissionId || storedExamId !== examId) {
            setSubmissionId(null);
            setExamSessionStatus("NOT_STARTED");
            hydratedSubmissionRef.current = false;
            router.replace(`/student/exam-ready?examId=${encodeURIComponent(examId)}`);
          }
        });
      // Restore webcam policy & grace period from localStorage (cached from ExamReadyCheck)
      try {
        const storedPolicyRaw = localStorage.getItem("currentSubmissionWebcamPolicy");
        const storedPolicy = storedPolicyRaw ? JSON.parse(storedPolicyRaw) : null;
        if (storedPolicy?.enabled) setWebcamPolicy(storedPolicy);
      } catch {}
      const graceStartedAt = Number(localStorage.getItem("examFullscreenGraceStartedAt") || 0);
      if (graceStartedAt > 0 && Date.now() - graceStartedAt < 10000) {
        setFullscreenRequestedAt(graceStartedAt);
      }
      localStorage.removeItem("examFullscreenGraceStartedAt");
      return; // URL handoff handled — skip localStorage fallback
    }

    // ── Priority 2: localStorage (fallback for page refreshes) ──
    const storedSubmissionId = localStorage.getItem("currentSubmissionId");
    const storedExamId = localStorage.getItem("currentSubmissionExamId");
    if (storedSubmissionId && storedExamId === examId) {
      const storedStartedAt = Number(localStorage.getItem("currentSubmissionStartedAt") || 0);
      if (storedStartedAt > 0) setExamStartedAt(storedStartedAt);
      const storedDeadlineAt = new Date(localStorage.getItem("currentSubmissionDeadline") || "").getTime();
      if (Number.isFinite(storedDeadlineAt)) setSubmissionDeadlineAt(storedDeadlineAt);
      setSubmissionId(storedSubmissionId);
      setExamSessionStatus("IN_PROGRESS");
      hydratedSubmissionRef.current = true;
      void api.getMySubmissionById(storedSubmissionId)
        .then((submission) => {
          if (submission?.securityState) setSecurityState(submission.securityState);
          const serverDeadlineAt = new Date(submission?.deadline || "").getTime();
          if (Number.isFinite(serverDeadlineAt)) setSubmissionDeadlineAt(serverDeadlineAt);
        })
        .catch((error) => console.warn("Could not restore exam security state:", error));
      try {
        const storedPolicyRaw = localStorage.getItem("currentSubmissionWebcamPolicy");
        const storedPolicy = storedPolicyRaw ? JSON.parse(storedPolicyRaw) : null;
        if (storedPolicy?.enabled) setWebcamPolicy(storedPolicy);
      } catch {}
    }
    const graceStartedAt = Number(localStorage.getItem("examFullscreenGraceStartedAt") || 0);
    if (graceStartedAt > 0 && Date.now() - graceStartedAt < 10000) {
      setFullscreenRequestedAt(graceStartedAt);
    }
    localStorage.removeItem("examFullscreenGraceStartedAt");
  }, [examId, isPreviewMode, router, urlSubmissionId]);

  useEffect(() => {
    const storedSubmissionId = localStorage.getItem("currentSubmissionId");
    const storedExamId = localStorage.getItem("currentSubmissionExamId");
    const hasValidSubmission = storedSubmissionId && storedExamId === examId;
    // The URL handoff (submissionId in query params) is the authoritative signal.
    // Do NOT redirect if it's present — the init useEffect above will verify it.
    if (!examId || isPreviewMode || isLoadingExam || !webcamPolicyResolved || hasValidSubmission || hydratedSubmissionRef.current || urlSubmissionId) return;
    // A direct URL must not bypass the final user gesture that requests
    // fullscreen. New attempts always begin from ExamReadyCheck.
    router.replace(`/student/exam-ready?examId=${encodeURIComponent(examId)}`);
  }, [examId, isLoadingExam, isPreviewMode, router, webcamPolicyResolved, urlSubmissionId]);
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
          setWebcamPolicyResolved(true);
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
        const configuredPolicy = exam?.settings?.webcamEvidencePolicy?.enabled
          ? exam.settings.webcamEvidencePolicy
          : null;
        const settings = exam?.settings || {};
        const configuredAttempts = exam?.maxAttempts ?? settings.maxAttempts ?? null;
        const configuredTimeLimit = exam?.timeLimitMinutes ?? settings.timeLimitMinutes ?? exam?.duration ?? null;
        const configuredProctoring = settings.proctoringEnabled === undefined
          ? Boolean(settings.requiresProctoring)
          : Boolean(settings.proctoringEnabled);
        setProctoringEnabled(configuredProctoring && configuredAttempts !== null && configuredTimeLimit !== null);
        setWebcamPolicy((current: any) => current?.scheduledCaptureOffsetsMs?.length ? current : configuredPolicy);
        setQuestions(mapped.length > 0 ? mapped : []);
      } catch (err) {
        console.error("Failed to load exam questions:", err);
        if (!mounted) return;
        setQuestions([]);
      } finally {
        if (mounted) {
          setIsLoadingExam(false);
          setWebcamPolicyResolved(true);
        }
      }
    };

    loadExam();
    return () => {
      mounted = false;
    };
  }, [examId]);

  useEffect(() => {
    const init: Record<number, string[]> = {};
    const orderingQuestions = questions.filter((q): q is OrderingQ => q.type === "ordering");
    orderingQuestions.forEach((q) => {
      init[q.id] = shuffleArray(q.items);
    });
    setOrderState(init);
    // Ordering answers are only ever recorded via drag/reorder interactions
    // (see OrderingRenderer's setAnswer calls). Seed the shown shuffled order
    // as the initial answer too, so a student who never touches an ordering
    // question still submits the arrangement they were actually shown.
    if (orderingQuestions.length > 0) {
      setAnswers((prev) => {
        const next = { ...prev };
        orderingQuestions.forEach((q) => {
          if (next[q.id] === undefined) next[q.id] = init[q.id];
        });
        return next;
      });
    }
  }, [questions]);

  const log = useCallback((type: string, detail?: string) => {
    logRef.current.push({ type, ts: Date.now(), detail });
  }, []);

  const persistIntegrityEvent = useCallback(async (type: string, detail?: string, clientEventId = createIntegrityEventId()) => {
    const event: PendingIntegrityEvent = {
      type,
      details: detail ?? `Integrity event: ${type}`,
      ts: Date.now(),
      clientEventId,
    };
    log(type, detail);
    const activeSubmissionId = submissionId || localStorage.getItem("currentSubmissionId");
    if (!activeSubmissionId) return undefined;
    pendingIntegrityEventsRef.current.set(event.clientEventId, event);
    try {
      const response = await api.sendExamLogs(activeSubmissionId, [event]);
      if (response?.securityState) setSecurityState(response.securityState);
      pendingIntegrityEventsRef.current.delete(event.clientEventId);
      return response?.securityState as ExamSecurityState | undefined;
    } catch (error) {
      // Retain the exact event for pagehide/retry. The server deduplicates it
      // by clientEventId, so this cannot inflate the violation count.
      console.error("sendExamLogs failed", error);
      return undefined;
    }
  }, [log, submissionId]);

  useEffect(() => {
    if (isPreviewMode) return;
    const flushPendingIntegrityEvents = () => {
      if (examSessionStatus !== "IN_PROGRESS") return;
      const activeSubmissionId = submissionId || localStorage.getItem("currentSubmissionId");
      if (!activeSubmissionId) return;
      if (!pageUnloadRecordedRef.current) {
        pageUnloadRecordedRef.current = true;
        const clientEventId = createIntegrityEventId();
        pendingIntegrityEventsRef.current.set(clientEventId, {
          type: "page_reload",
          details: "Sinh viên đã tải lại hoặc rời trang trong khi lượt làm bài còn đang diễn ra",
          ts: Date.now(),
          clientEventId,
        });
      }
      const pending = Array.from(pendingIntegrityEventsRef.current.values()).slice(0, 20);
      if (pending.length > 0) api.sendExamLogsKeepalive(activeSubmissionId, pending);
    };
    window.addEventListener("pagehide", flushPendingIntegrityEvents);
    return () => window.removeEventListener("pagehide", flushPendingIntegrityEvents);
  }, [examSessionStatus, isPreviewMode, submissionId]);

  useEffect(() => () => {
    autosaveTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    autosaveTimeoutsRef.current.clear();
  }, []);

  const saveAnswerForReview = useCallback((question: Question & { questionId?: string }, value: unknown) => {
    if (isPreviewMode || !submissionId || !question.questionId) return;

    const questionId = String(question.questionId);
    const sequence = (autosaveSequenceRef.current.get(questionId) || 0) + 1;
    autosaveSequenceRef.current.set(questionId, sequence);
    const currentTimeout = autosaveTimeoutsRef.current.get(questionId);
    if (currentTimeout) clearTimeout(currentTimeout);

    autosaveTimeoutsRef.current.set(questionId, setTimeout(() => {
      void api.autosaveExamAnswers(submissionId, {
        answers: [{
          questionId,
          sequence,
          answer: normalizeSubmissionAnswer(question, value),
        }],
      }).then((response: { reviewFeedback?: DuringReviewFeedback[] }) => {
        const feedback = response?.reviewFeedback?.[0];
        if (!feedback) return;
        setDuringReviewFeedback((current) => ({ ...current, [feedback.questionId]: feedback }));
      }).catch((error) => {
        console.warn("Could not save answer for review feedback:", error);
      });
    }, 600));
  }, [isPreviewMode, submissionId]);

  const markActivity = useCallback(() => {
    lastActivityAtRef.current = Date.now();
    idleCaptureArmedRef.current = false;
  }, []);

  const handleWebcamUnavailable = useCallback((detail: string) => {
    if (
      !webcamPolicy?.enabled ||
      isPreviewMode ||
      examSessionStatus !== "IN_PROGRESS" ||
      cameraIssueActiveRef.current
    ) return;
    cameraIssueActiveRef.current = true;
    setWebcamReady(false);
    setCameraRecoveryExpired(false);
    setCameraRecoveryDeadline(Date.now() + 15_000);
    setCameraRecoverySeconds(15);
    persistIntegrityEvent("camera_stream_ended", detail);
  }, [examSessionStatus, isPreviewMode, persistIntegrityEvent, webcamPolicy]);

  const startWebcam = useCallback(async () => {
    if (!webcamPolicy?.enabled) return;
    setIsStartingWebcam(true);
    try {
      webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
      webcamStreamRef.current = stream;
      if (webcamVideoRef.current) {
        webcamVideoRef.current.srcObject = stream;
        await webcamVideoRef.current.play();
      }
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => handleWebcamUnavailable("Webcam stream ended during the exam"));
        track.addEventListener("mute", () => handleWebcamUnavailable("Webcam stream was muted during the exam"));
      });
      stream.addEventListener("inactive", () => handleWebcamUnavailable("Webcam stream became inactive during the exam"));
      setWebcamReady(true);
      if (cameraIssueActiveRef.current) {
        cameraIssueActiveRef.current = false;
        setCameraRecoveryDeadline(null);
        setCameraRecoverySeconds(0);
        setCameraRecoveryExpired(false);
        persistIntegrityEvent("camera_restored", "Sinh viên đã khôi phục webcam giám sát");
      }
    } catch {
      log("webcam_permission_denied", "Student did not grant usable webcam permission");
      toast.error("Bài thi này yêu cầu bạn cấp quyền webcam trước khi bắt đầu.");
    } finally {
      setIsStartingWebcam(false);
    }
  }, [cameraIssueActiveRef, handleWebcamUnavailable, log, persistIntegrityEvent, webcamPolicy]);

  // Server-side, `screenCaptureEnabled` only takes effect once `enabled` is
  // also on (see normalizePolicy in proctoring-evidence.service.ts) — mirror
  // that gating here so the client never asks for a screen share the server
  // would otherwise ignore.
  const screenCaptureRequired = Boolean(webcamPolicy?.enabled) && Boolean(webcamPolicy?.screenCaptureEnabled);

  const handleScreenShareUnavailable = useCallback((detail: string) => {
    if (
      !screenCaptureRequired ||
      isPreviewMode ||
      examSessionStatus !== "IN_PROGRESS" ||
      screenIssueActiveRef.current
    ) return;
    screenIssueActiveRef.current = true;
    setScreenShareReady(false);
    setScreenShareRecoveryExpired(false);
    setScreenShareRecoveryDeadline(Date.now() + 15_000);
    setScreenShareRecoverySeconds(15);
    persistIntegrityEvent("screen_share_ended", detail);
  }, [examSessionStatus, isPreviewMode, persistIntegrityEvent, screenCaptureRequired]);

  const startScreenShare = useCallback(async () => {
    if (!screenCaptureRequired) return;
    setIsStartingScreenShare(true);
    try {
      screenStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const [track] = stream.getVideoTracks();
      if (track?.getSettings().displaySurface !== "monitor") {
        stream.getTracks().forEach((t) => t.stop());
        toast.error('Bài thi yêu cầu chia sẻ "Toàn bộ màn hình" — không chọn cửa sổ hoặc tab. Vui lòng chọn lại.');
        return;
      }
      screenStreamRef.current = stream;
      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = stream;
        await screenVideoRef.current.play();
      }
      track.addEventListener("ended", () => handleScreenShareUnavailable("Screen share stream ended during the exam"));
      stream.addEventListener("inactive", () => handleScreenShareUnavailable("Screen share stream became inactive during the exam"));
      setScreenShareReady(true);
      if (screenIssueActiveRef.current) {
        screenIssueActiveRef.current = false;
        setScreenShareRecoveryDeadline(null);
        setScreenShareRecoverySeconds(0);
        setScreenShareRecoveryExpired(false);
        persistIntegrityEvent("screen_share_restored", "Sinh viên đã khôi phục chia sẻ toàn bộ màn hình");
      }
    } catch {
      log("screen_share_permission_denied", "Student did not grant a valid full-screen share");
      toast.error("Bài thi này yêu cầu bạn chia sẻ toàn bộ màn hình trước khi bắt đầu.");
    } finally {
      setIsStartingScreenShare(false);
    }
  }, [handleScreenShareUnavailable, log, persistIntegrityEvent, screenCaptureRequired]);

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

      // Screen frame rides along on the same trigger, using the paired
      // permit the server hands back when screenCaptureEnabled — skipped
      // silently if the share isn't (or is no longer) live, same as any
      // other best-effort evidence capture failure.
      const screenVideo = screenVideoRef.current;
      if (permit.screen && screenShareReady && screenVideo && screenVideo.videoWidth >= 1) {
        try {
          const screenCanvas = document.createElement("canvas");
          const screenRatio = Math.min(1, 960 / screenVideo.videoWidth);
          screenCanvas.width = Math.max(1, Math.floor(screenVideo.videoWidth * screenRatio));
          screenCanvas.height = Math.max(1, Math.floor(screenVideo.videoHeight * screenRatio));
          const screenContext = screenCanvas.getContext("2d");
          if (screenContext) {
            screenContext.drawImage(screenVideo, 0, 0, screenCanvas.width, screenCanvas.height);
            await api.finalizeEvidenceCapture(activeSubmissionId, permit.screen.captureId, { nonce: permit.screen.nonce, imageDataUrl: screenCanvas.toDataURL("image/jpeg", 0.6) });
          }
        } catch (error) {
          console.warn("Screen evidence capture was skipped:", error);
        }
      }
    } catch (error) {
      console.warn("Webcam evidence capture was skipped:", error);
    } finally {
      evidenceCaptureInFlightRef.current = false;
    }
  }, [screenShareReady, submissionId, webcamPolicy, webcamReady]);

  useEffect(() => {
    if (!cameraRecoveryDeadline) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cameraRecoveryDeadline - Date.now()) / 1000));
      setCameraRecoverySeconds(remaining);
      if (remaining > 0) return;
      window.clearInterval(timer);
      setCameraRecoveryDeadline(null);
      if (!cameraRecoveryExpired && cameraIssueActiveRef.current) {
        setCameraRecoveryExpired(true);
        persistIntegrityEvent("camera_recovery_timeout", "Webcam không được khôi phục trong 15 giây");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [cameraRecoveryDeadline, cameraRecoveryExpired, persistIntegrityEvent]);

  useEffect(() => {
    if (!screenShareRecoveryDeadline) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((screenShareRecoveryDeadline - Date.now()) / 1000));
      setScreenShareRecoverySeconds(remaining);
      if (remaining > 0) return;
      window.clearInterval(timer);
      setScreenShareRecoveryDeadline(null);
      if (!screenShareRecoveryExpired && screenIssueActiveRef.current) {
        setScreenShareRecoveryExpired(true);
        persistIntegrityEvent("screen_share_recovery_timeout", "Chia sẻ màn hình không được khôi phục trong 15 giây");
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [screenShareRecoveryDeadline, screenShareRecoveryExpired, persistIntegrityEvent]);

  useEffect(() => {
    if (
      isPreviewMode ||
      examSessionStatus !== "IN_PROGRESS" ||
      isSubmitting ||
      !webcamPolicy?.enabled ||
      !webcamReady
    ) return;

    const onActivity = () => markActivity();
    window.addEventListener("pointermove", onActivity, { passive: true });
    window.addEventListener("pointerdown", onActivity, { passive: true });
    window.addEventListener("keydown", onActivity);

    const timer = window.setInterval(() => {
      if (idleCaptureArmedRef.current || Date.now() - lastActivityAtRef.current < 60_000) return;
      idleCaptureArmedRef.current = true;
      persistIntegrityEvent("mouse_idle", "Không có tương tác chuột, bàn phím hoặc trả lời trong 1 phút");
      void requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: ["mouse_idle"] });
    }, 5_000);

    return () => {
      window.removeEventListener("pointermove", onActivity);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.clearInterval(timer);
    };
  }, [examSessionStatus, isPreviewMode, isSubmitting, markActivity, persistIntegrityEvent, requestWebcamEvidence, webcamPolicy, webcamReady]);

  // Copy/paste tracking: if a student pastes content that was never copied
  // during this exam session, they likely pasted it from an external source
  // (e.g. notes, another tab, a document). Record the full pasted content as
  // evidence via the existing `paste` integrity event type.
  useEffect(() => {
    if (
      isPreviewMode ||
      examSessionStatus !== "IN_PROGRESS" ||
      isSubmitting ||
      !proctoringEnabled
    ) return;

    const onCopy = () => {
      const selected = (window.getSelection()?.toString() || "").trim();
      if (selected) copiedTextRef.current.add(selected);
    };

    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text/plain") || "";
      const trimmed = text.trim();
      if (!trimmed) return;
      // Only flag pasted content that was NOT copied within this session.
      if (!copiedTextRef.current.has(trimmed)) {
        persistIntegrityEvent(
          "paste",
          `Dán nội dung từ ngoài bài thi (không sao chép trong phiên thi): ${trimmed}`,
        );
        void requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: ["paste_external"] });
      }
      // Bound the set so it cannot grow unboundedly.
      if (copiedTextRef.current.size > 200) {
        copiedTextRef.current.clear();
      }
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
    };
  }, [isPreviewMode, examSessionStatus, isSubmitting, proctoringEnabled, persistIntegrityEvent, requestWebcamEvidence]);

  useEffect(() => {
    log("exam_start");
  }, [log]);

  // Timer with auto-submit
  const doSubmit = useCallback(async (options: { deadlineReached?: boolean } = {}) => {
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
          const startedDeadlineAt = new Date(started.deadline || "").getTime();
          if (Number.isFinite(startedDeadlineAt)) {
            setSubmissionDeadlineAt(startedDeadlineAt);
            localStorage.setItem("currentSubmissionDeadline", String(started.deadline));
          }
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
      const submitResult = await api.submitExam(activeSubmissionId, payloadAnswers, logs);
      setExamSessionStatus("SUBMITTED");

      // Clear active submission markers after successful submit.
      try {
        localStorage.removeItem("currentSubmissionId");
        localStorage.removeItem("currentSubmissionExamId");
        localStorage.removeItem("currentSubmissionStartedAt");
        localStorage.removeItem("currentSubmissionDeadline");
        localStorage.removeItem("currentSubmissionWebcamPolicy");
      } catch {}

      if (options.deadlineReached || submitResult?.autoSubmitted) {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        toast.success("Đã tới hạn khóa bài thi, bài đã được nộp tự động.");
        setShowDeadlineNotice(true);
        return;
      }
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
  doSubmitRef.current = doSubmit;

  useEffect(() => {
    deadlineAutoSubmitRef.current = false;
  }, [submissionDeadlineAt]);

  useEffect(() => {
    if (!submissionId || isPreviewMode || examSessionStatus !== "IN_PROGRESS") return;

    const syncServerDeadline = () => {
      void api.getMySubmissionById(submissionId)
        .then((submission) => {
          const serverDeadlineAt = new Date(submission?.deadline || "").getTime();
          if (Number.isFinite(serverDeadlineAt)) {
            setSubmissionDeadlineAt(serverDeadlineAt);
            localStorage.setItem("currentSubmissionDeadline", String(submission.deadline));
          }
        })
        .catch(() => undefined);
    };

    syncServerDeadline();
    const interval = window.setInterval(syncServerDeadline, 15_000);
    return () => window.clearInterval(interval);
  }, [examSessionStatus, isPreviewMode, submissionId]);

  const handleViolation = useCallback(
    (entry: ViolationLog) => {
      if (!proctoringEnabled) return undefined;
      void requestWebcamEvidence("SUSPICIOUS_EVENT", { signals: [entry.type] });
      return persistIntegrityEvent(entry.type, entry.detail, entry.clientEventId);
    },
    [persistIntegrityEvent, proctoringEnabled, requestWebcamEvidence],
  );

  const handleFirstFullscreenWarning = useCallback(
    (entry: ViolationLog) => {
      if (!proctoringEnabled) return undefined;
      return persistIntegrityEvent("fullscreen_exit_warning", entry.detail, entry.clientEventId);
    },
    [persistIntegrityEvent, proctoringEnabled],
  );

  // Must be a stable reference: an inline arrow here would give
  // useExamSecurity's onEscalate a new identity every render, which (via its
  // reconcileSecurityState dependency) re-fires an effect that re-derives
  // violationCounts into a brand-new object every time — an infinite
  // render loop (React error #185 / "Maximum update depth exceeded").
  const handleEscalate = useCallback(() => {
    if (isSubmitting) return;
    log("violation_escalation", `Reached ${MAX_VIOLATIONS} violations`);
    doSubmitRef.current();
  }, [isSubmitting, log]);

  const {
    isBlocked: isSecurityBlocked,
    violationCount,
    isEscalated,
    lastViolation,
    returnToExam,
    canFullscreen,
    isFullscreenExitPending,
    isFirstFullscreenWarning,
    exitFullscreenAfterConfirmation,
  } = useExamSecurity({
    // Preview still enforces fullscreen when explicitly requested, but it is a
    // safe rehearsal: no proctoring events are persisted and it cannot submit.
    enabled: proctoringEnabled && !isLoadingExam && (isPreviewMode || examSessionStatus === "IN_PROGRESS"),
    maxViolations: MAX_VIOLATIONS,
    sessionStatus: isPreviewMode ? "IN_PROGRESS" : examSessionStatus,
    isSubmitting,
    initialFullscreenRequestedAt: fullscreenRequestedAt,
    initialSecurityState: securityState,
    onViolation: isPreviewMode ? undefined : handleViolation,
    onFullscreenWarning: isPreviewMode ? undefined : handleFirstFullscreenWarning,
    onEscalate: isPreviewMode ? undefined : handleEscalate,
  });

  useEffect(() => {
    if (
      isPreviewMode ||
      !proctoringEnabled ||
      examSessionStatus !== "IN_PROGRESS" ||
      !submissionId
    ) return;

    let restoringHistory = false;
    window.history.pushState({ examNavigationGuard: submissionId }, "", window.location.href);

    const onPopState = () => {
      if (restoringHistory) {
        restoringHistory = false;
        return;
      }
      // popstate cannot be cancelled. Move forward synchronously before Next
      // commits the route change, preserving the active recovery timer/state.
      restoringHistory = true;
      window.history.go(1);
      window.setTimeout(() => { restoringHistory = false; }, 0);
      void persistIntegrityEvent(
        "navigation_attempt",
        "Sinh viên đã dùng nút Quay lại của trình duyệt khi lượt làm bài còn đang diễn ra",
      );
      setShowNavigationGuard(true);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [examSessionStatus, isPreviewMode, persistIntegrityEvent, proctoringEnabled, submissionId]);

  useEffect(() => {
    const isFullscreenRecoveryActive = isSecurityBlocked || isFullscreenExitPending;
    if (isPreviewMode || !isFullscreenRecoveryActive || isSubmitting) {
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
        if (isSecurityBlocked) doSubmitRef.current();
      }
    }, 200);

    return () => window.clearInterval(id);
  }, [isPreviewMode, isSecurityBlocked, isFullscreenExitPending, isSubmitting]);

  useEffect(() => {
    if (isPreviewMode) return;

    const updateTimer = () => {
      if (submissionDeadlineAt) {
        const remaining = Math.max(0, Math.ceil((submissionDeadlineAt - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0 && !deadlineAutoSubmitRef.current) {
          deadlineAutoSubmitRef.current = true;
          void doSubmitRef.current({ deadlineReached: true });
        }
        return;
      }

      setTimeLeft((currentTime) => {
        if (currentTime <= 1) {
          void doSubmitRef.current();
          return 0;
        }
        return currentTime - 1;
      });
    };

    updateTimer();
    const id = window.setInterval(updateTimer, submissionDeadlineAt ? 250 : 1000);
    return () => window.clearInterval(id);
  }, [isPreviewMode, submissionDeadlineAt]);

  useEffect(() => () => {
    webcamStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    const video = webcamVideoRef.current;
    if (webcamReady && video && webcamStreamRef.current) {
      video.srcObject = webcamStreamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [webcamReady]);

  useEffect(() => {
    const video = screenVideoRef.current;
    if (screenShareReady && video && screenStreamRef.current) {
      video.srcObject = screenStreamRef.current;
      void video.play().catch(() => undefined);
    }
  }, [screenShareReady]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60),
      sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const isRecoveringWebcam = webcamPolicy?.enabled && examSessionStatus === "IN_PROGRESS";
  const isRecoveringScreenShare = screenCaptureRequired && examSessionStatus === "IN_PROGRESS";
  const displayedViolationCount = violationCount + (isFullscreenExitPending ? 1 : 0);

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
            <p className="text-sm text-muted-foreground">
              {isRecoveringWebcam
                ? cameraRecoveryDeadline
                  ? `Webcam đang không khả dụng. Hãy bật lại trong ${cameraRecoverySeconds} giây để tránh ghi nhận cảnh báo.`
                  : cameraRecoveryExpired
                    ? "Webcam chưa được khôi phục. Bài làm được giữ khóa cho đến khi bạn bật lại camera."
                    : "Bạn cần bật lại webcam trước khi tiếp tục làm bài."
                : "Bài thi này yêu cầu webcam trước khi bắt đầu. Hệ thống chỉ chụp ảnh khi không có tương tác trong 1 phút; ảnh phục vụ giảng viên rà soát và tự xóa sau 30 ngày."}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <video ref={webcamVideoRef} muted playsInline className="w-full aspect-video rounded-md bg-black object-cover" />
            <Button onClick={() => void startWebcam()} disabled={isStartingWebcam} className="w-full gap-2"><Camera className="h-4 w-4" />{isStartingWebcam ? "Đang mở webcam…" : isRecoveringWebcam ? "Bật lại webcam để tiếp tục" : "Tôi đồng ý và bật webcam"}</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (screenCaptureRequired && !screenShareReady && !isPreviewMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="space-y-3">
            <div className="flex items-center gap-2 text-primary"><Monitor className="h-5 w-5" /><span className="font-semibold">Xác nhận chia sẻ màn hình</span></div>
            <p className="text-sm text-muted-foreground">
              {isRecoveringScreenShare
                ? screenShareRecoveryDeadline
                  ? `Chia sẻ màn hình đang không khả dụng. Hãy chia sẻ lại toàn bộ màn hình trong ${screenShareRecoverySeconds} giây để tránh ghi nhận cảnh báo.`
                  : screenShareRecoveryExpired
                    ? "Chia sẻ màn hình chưa được khôi phục. Bài làm được giữ khóa cho đến khi bạn chia sẻ lại."
                    : "Bạn cần chia sẻ lại toàn bộ màn hình trước khi tiếp tục làm bài."
                : 'Bài thi này yêu cầu chia sẻ toàn bộ màn hình trước khi bắt đầu, song song với webcam. Khi được hỏi, hãy chọn đúng mục "Toàn bộ màn hình" ("Entire screen"), không chọn cửa sổ hay tab.'}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <video ref={screenVideoRef} muted playsInline className="w-full aspect-video rounded-md bg-black object-contain" />
            <Button onClick={() => void startScreenShare()} disabled={isStartingScreenShare} className="w-full gap-2"><Monitor className="h-4 w-4" />{isStartingScreenShare ? "Đang mở chia sẻ màn hình…" : isRecoveringScreenShare ? "Chia sẻ lại để tiếp tục" : "Chia sẻ toàn bộ màn hình"}</Button>
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

  const setAnswer = (qId: number, val: unknown) => {
    markActivity();
    const question = questions.find((item) => item.id === qId) as (Question & { questionId?: string }) | undefined;
    setAnswers((prev) => {
      const next = { ...prev, [qId]: val };
      log("answer", JSON.stringify({ questionId: qId, value: val }));
      return next;
    });
    if (question) saveAnswerForReview(question, val);
  };

  const handleFlag = () =>
    setFlagged((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
  const handleClear = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[q.id];
      return next;
    });
    const questionId = (q as Question & { questionId?: string }).questionId;
    if (questionId) {
      setDuringReviewFeedback((current) => {
        const next = { ...current };
        delete next[String(questionId)];
        return next;
      });
    }
  };

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

    if (question.type === "find-error") {
      const selected = Array.isArray(answer) ? answer.map(String) : typeof answer === "string" ? [answer] : [];
      const lineNumbers = selected.map((label) => question.segments.findIndex((segment) => segment.label === label) + 1).filter((line) => line > 0);
      return <span>Dòng {lineNumbers.join(", ")}</span>;
    }

    if (question.type === "matching") {
      const pairs = answer as Record<string, string> | undefined;
      if (pairs && typeof pairs === "object") {
        return <span>{Object.entries(pairs).map(([k, v]) => `${k} → ${v}`).join("; ")}</span>;
      }
      return <span>Đã trả lời</span>;
    }

    if (question.type === "ordering") {
      const items = Array.isArray(answer) ? (answer as string[]) : [];
      return <span>{items.map((item, i) => `${i + 1}. ${item}`).join("; ")}</span>;
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

  const formatReviewAnswer = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(formatReviewAnswer).filter(Boolean).join(", ");
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      if (typeof record.text === "string") return record.text;
      if (typeof record.answer === "string") return record.answer;
      return Object.values(record).map(formatReviewAnswer).filter(Boolean).join(", ");
    }
    return String(value);
  };

  const currentReviewFeedback = (q as Question & { questionId?: string }).questionId
    ? duringReviewFeedback[String((q as Question & { questionId?: string }).questionId)]
    : undefined;

  const hasReviewContent = (fb: DuringReviewFeedback | undefined): boolean => {
    if (!fb) return false;
    // `unavailable` just means "this question type can't be auto-graded"
    // (e.g. essay) — surfacing that mid-attempt, while the student hasn't
    // even submitted yet, reads as a premature/confusing "grading" message
    // with no actionable content. Say nothing instead; there is nothing to
    // show until an instructor actually grades it post-submission.
    if (fb.unavailable) return false;
    return (
      typeof fb.pointsAwarded === "number" ||
      typeof fb.isCorrect === "boolean" ||
      fb.correctAnswer !== undefined ||
      (typeof fb.explanation === "string" && fb.explanation.length > 0)
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {webcamPolicy?.enabled ? <video ref={webcamVideoRef} muted playsInline className="hidden" /> : null}
      {screenCaptureRequired ? <video ref={screenVideoRef} muted playsInline className="hidden" /> : null}
      {/* ── Top Bar ─────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b bg-card/95 px-3 shadow-sm backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="truncate text-sm font-semibold">{examTitle}</span>
          {displayedViolationCount > 0 && (
            <StatusBadge status="critical" domain="severity">
              {displayedViolationCount} tín hiệu cần xem xét
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFullscreenExitConfirm(true)}
            disabled={!canFullscreen}
            aria-label="Thoát chế độ toàn màn hình"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ExamSecurityModal
        open={isSecurityBlocked || isFullscreenExitPending}
        violationCount={displayedViolationCount}
        maxViolations={MAX_VIOLATIONS}
        isEscalated={isEscalated}
        countdownSeconds={fullscreenCountdown}
        isFullscreenExitPending={isFullscreenExitPending}
        isFirstFullscreenWarning={isFirstFullscreenWarning}
        lastViolation={lastViolation}
        canFullscreen={canFullscreen}
        onReturnToExam={returnToExam}
      />

      <Dialog
        open={showDeadlineNotice}
        onOpenChange={(open) => {
          setShowDeadlineNotice(open);
          if (!open) {
            router.push(
              examId
                ? `/student/grading?examId=${encodeURIComponent(examId)}`
                : "/student/grading",
            );
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Đã tới hạn khóa bài thi, bài đã được nộp tự động</DialogTitle>
            <DialogDescription>
              Bài đã được nộp tự động từ các câu trả lời đã lưu trên hệ thống.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() =>
                router.push(
                  examId
                    ? `/student/grading?examId=${encodeURIComponent(examId)}`
                    : "/student/grading",
                )
              }
            >
              Xem kết quả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNavigationGuard} onOpenChange={setShowNavigationGuard}>
        <DialogContent className="sm:max-w-md" onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Phiên làm bài vẫn đang diễn ra</DialogTitle>
            <DialogDescription>
              Hệ thống đã giữ bạn ở lại bài thi để không làm mất dữ liệu và số lần cảnh báo hiện có. Thao tác quay lại đã được ghi nhận để giảng viên xem xét khi cần.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Số tín hiệu toàn màn hình đã ghi nhận: <strong>{violationCount} / {MAX_VIOLATIONS}</strong>.
          </p>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowNavigationGuard(false);
                void returnToExam();
              }}
            >
              Quay lại toàn màn hình
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFullscreenExitConfirm} onOpenChange={setShowFullscreenExitConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thoát chế độ toàn màn hình?</DialogTitle>
            <DialogDescription>
              Nếu xác nhận, hệ thống sẽ ghi nhận sự kiện này trong nhật ký giám sát của bài thi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFullscreenExitConfirm(false)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowFullscreenExitConfirm(false);
                void exitFullscreenAfterConfirmation();
              }}
            >
              Xác nhận thoát
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                          <p className="mt-2 text-base text-foreground break-words">
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
                    <Button variant="destructive" onClick={() => void doSubmit()} disabled={isSubmitting}>
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

                  {hasReviewContent(currentReviewFeedback) && (
                    <div
                      className={`mt-4 rounded-lg border p-3 text-sm ${
                        currentReviewFeedback!.unavailable
                          ? "border-amber-200 bg-amber-50 text-amber-900"
                          : "border-blue-200 bg-blue-50 text-slate-800"
                      }`}
                    >
                      {currentReviewFeedback!.unavailable ? (
                        <div className="flex items-start gap-2">
                          <Info className="mt-0.5 h-4 w-4 shrink-0" />
                          <p>Câu này cần giảng viên chấm; phản hồi chưa khả dụng.</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {typeof currentReviewFeedback!.pointsAwarded === "number" && (
                            <p>
                              <span className="font-medium">Điểm câu này:</span>{" "}
                              {currentReviewFeedback!.pointsAwarded}
                              {typeof currentReviewFeedback!.maxPoints === "number"
                                ? `/${currentReviewFeedback!.maxPoints}`
                                : ""}
                            </p>
                          )}
                          {typeof currentReviewFeedback!.isCorrect === "boolean" && (
                            <p className={currentReviewFeedback!.isCorrect ? "text-emerald-700" : "text-red-700"}>
                              {currentReviewFeedback!.isCorrect ? "Trả lời đúng." : "Trả lời chưa đúng."}
                            </p>
                          )}
                          {currentReviewFeedback!.correctAnswer !== undefined && (
                            <p>
                              <span className="font-medium">Đáp án đúng:</span>{" "}
                              {formatReviewAnswer(currentReviewFeedback!.correctAnswer)}
                            </p>
                          )}
                          {currentReviewFeedback!.explanation && (
                            <p>
                              <span className="font-medium">Giải thích:</span>{" "}
                              {currentReviewFeedback!.explanation}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

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

