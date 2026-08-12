import { useCallback, useEffect, useRef, useState } from "react";

export type ViolationType = "fullscreen_exit" | "tab_switch";

export interface ViolationLog {
  timestamp: number;
  type: ViolationType;
  detail?: string;
  clientEventId: string;
}

export interface ExamSecurityState {
  fullscreenExitCount: number;
  tabSwitchCount?: number;
  firstFullscreenWarningUsed: boolean;
  navigationAttemptCount?: number;
}

interface UseExamSecurityOptions {
  enabled?: boolean;
  maxViolations?: number;
  sessionStatus?: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "DISCONNECTED" | string;
  isSubmitting?: boolean;
  fullscreenGraceMs?: number;
  fullscreenExitGraceMs?: number;
  initialFullscreenRequestedAt?: number | null;
  initialSecurityState?: Partial<ExamSecurityState> | null;
  violationCooldownMs?: number;
  onViolation?: (log: ViolationLog, totalCount: number) => void | Promise<ExamSecurityState | void>;
  onFullscreenWarning?: (log: ViolationLog) => void | Promise<ExamSecurityState | void>;
  onEscalate?: (totalCount: number, logs: ViolationLog[]) => void;
}

interface UseExamSecurityResult {
  isFullscreen: boolean;
  isBlocked: boolean;
  isEscalated: boolean;
  violationCount: number;
  violationCounts: Record<ViolationType, number>;
  lastViolation: ViolationLog | null;
  maxViolations: number;
  canFullscreen: boolean;
  isFullscreenExitPending: boolean;
  isFirstFullscreenWarning: boolean;
  returnToExam: () => Promise<void>;
  exitFullscreenAfterConfirmation: () => Promise<void>;
  getViolationLogs: () => ViolationLog[];
}

const emptyCounts: Record<ViolationType, number> = {
  fullscreen_exit: 0,
  tab_switch: 0,
};

const DEFAULT_FULLSCREEN_GRACE_MS = 10_000;
const DEFAULT_FULLSCREEN_EXIT_GRACE_MS = 15_000;
const DEFAULT_VIOLATION_COOLDOWN_MS = 3000;

function createClientEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `integrity-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function useExamSecurity(options: UseExamSecurityOptions = {}): UseExamSecurityResult {
  const {
    enabled = true,
    maxViolations = 3,
    sessionStatus = "IN_PROGRESS",
    isSubmitting = false,
    fullscreenGraceMs = DEFAULT_FULLSCREEN_GRACE_MS,
    fullscreenExitGraceMs = DEFAULT_FULLSCREEN_EXIT_GRACE_MS,
    initialFullscreenRequestedAt = null,
    initialSecurityState = null,
    violationCooldownMs = DEFAULT_VIOLATION_COOLDOWN_MS,
    onViolation,
    onFullscreenWarning,
    onEscalate,
  } = options;

  const canFullscreen =
    typeof document !== "undefined" &&
    typeof document.documentElement?.requestFullscreen === "function";
  const initialFullscreenExitCount = initialSecurityState?.fullscreenExitCount;
  const initialFirstFullscreenWarningUsed = initialSecurityState?.firstFullscreenWarningUsed;
  const initialTabSwitchCount = initialSecurityState?.tabSwitchCount;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return Boolean(document.fullscreenElement);
  });
  const [isBlocked, setIsBlocked] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return enabled && !document.fullscreenElement;
  });
  const [isEscalated, setIsEscalated] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [violationCounts, setViolationCounts] = useState<Record<ViolationType, number>>(emptyCounts);
  const [lastViolation, setLastViolation] = useState<ViolationLog | null>(null);
  const [isFullscreenExitPending, setIsFullscreenExitPending] = useState(false);
  const [isFirstFullscreenWarning, setIsFirstFullscreenWarning] = useState(false);

  const logsRef = useRef<ViolationLog[]>([]);
  const escalatedRef = useRef(false);
  const allowClearRef = useRef(false);
  const fullscreenRequestedAtRef = useRef<number | null>(initialFullscreenRequestedAt);
  const hasEnteredFullscreenOnceRef = useRef(false);
  const lastViolationAtRef = useRef<Partial<Record<ViolationType, number>>>({});
  const fullscreenExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalFullscreenExitRef = useRef(false);
  // Involuntary fullscreen exits (F11 / Esc / OS gesture) can't be told apart
  // from each other by the browser, and many are muscle-memory presses
  // rather than deliberate cheating attempts. The very first one per exam
  // attempt is a warning only and does not count toward violationCount; the
  // in-app "exit fullscreen" button is excluded since it already shows its
  // own confirmation dialog before the exit happens.
  const firstFullscreenWarningUsedRef = useRef(false);
  const persistedFullscreenExitCountRef = useRef(0);
  const persistedTabSwitchCountRef = useRef(0);
  const pageLeavingRef = useRef(false);

  useEffect(() => {
    const markPageLeaving = () => {
      pageLeavingRef.current = true;
    };
    window.addEventListener("beforeunload", markPageLeaving, { capture: true });
    window.addEventListener("pagehide", markPageLeaving, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", markPageLeaving, { capture: true });
      window.removeEventListener("pagehide", markPageLeaving, { capture: true });
    };
  }, []);

  const reconcileSecurityState = useCallback((state?: Partial<ExamSecurityState> | void) => {
    if (!state) return;
    const serverCount = Math.max(0, Number(state.fullscreenExitCount || 0));
    if (serverCount > persistedFullscreenExitCountRef.current) {
      persistedFullscreenExitCountRef.current = serverCount;
    }
    const serverTabSwitchCount = Math.max(0, Number(state.tabSwitchCount || 0));
    if (serverTabSwitchCount > persistedTabSwitchCountRef.current) {
      persistedTabSwitchCountRef.current = serverTabSwitchCount;
    }
    const totalPersistedViolations = persistedFullscreenExitCountRef.current + persistedTabSwitchCountRef.current;
    if (serverCount > 0 || serverTabSwitchCount > 0) {
      setViolationCounts((previous) => {
        const nextFullscreenExit = Math.max(previous.fullscreen_exit, persistedFullscreenExitCountRef.current);
        const nextTabSwitch = Math.max(previous.tab_switch, persistedTabSwitchCountRef.current);
        if (nextFullscreenExit === previous.fullscreen_exit && nextTabSwitch === previous.tab_switch) {
          return previous;
        }
        return { ...previous, fullscreen_exit: nextFullscreenExit, tab_switch: nextTabSwitch };
      });
      setViolationCount((previous) => Math.max(previous, totalPersistedViolations));
      if (totalPersistedViolations >= maxViolations && !escalatedRef.current) {
        escalatedRef.current = true;
        setIsEscalated(true);
        onEscalate?.(totalPersistedViolations, logsRef.current.slice());
      }
    }
    if (state.firstFullscreenWarningUsed) {
      firstFullscreenWarningUsedRef.current = true;
    }
  }, [maxViolations, onEscalate]);

  const clearPendingFullscreenExit = useCallback(() => {
    if (fullscreenExitTimerRef.current) {
      clearTimeout(fullscreenExitTimerRef.current);
      fullscreenExitTimerRef.current = null;
    }
    setIsFullscreenExitPending(false);
  }, []);

  const isTrackingActive = useCallback(() => {
    return enabled && !isSubmitting && String(sessionStatus).toUpperCase() === "IN_PROGRESS";
  }, [enabled, isSubmitting, sessionStatus]);

  const isWithinFullscreenGrace = useCallback(() => {
    const requestedAt = fullscreenRequestedAtRef.current;
    return Boolean(requestedAt && Date.now() - requestedAt < fullscreenGraceMs);
  }, [fullscreenGraceMs]);

  useEffect(() => {
    if (initialFullscreenRequestedAt) {
      fullscreenRequestedAtRef.current = initialFullscreenRequestedAt;
    }
  }, [initialFullscreenRequestedAt]);

  useEffect(() => {
    reconcileSecurityState({
      fullscreenExitCount: initialFullscreenExitCount || 0,
      firstFullscreenWarningUsed: Boolean(initialFirstFullscreenWarningUsed),
      tabSwitchCount: initialTabSwitchCount || 0,
    });
  }, [initialFirstFullscreenWarningUsed, initialFullscreenExitCount, initialTabSwitchCount, reconcileSecurityState]);

  const recordViolation = useCallback(
    (type: ViolationType, detail?: string) => {
      if (!isTrackingActive()) return;
      const now = Date.now();
      const previousAt = lastViolationAtRef.current[type] || 0;
      if (now - previousAt < violationCooldownMs) return;
      lastViolationAtRef.current[type] = now;

      const entry: ViolationLog = {
        timestamp: now,
        type,
        detail,
        clientEventId: createClientEventId(),
      };

      allowClearRef.current = false;
      logsRef.current.push(entry);
      setLastViolation(entry);
      setViolationCounts((prev) => ({ ...prev, [type]: prev[type] + 1 }));
      setViolationCount((prev) => {
        const next = prev + 1;
        if (!escalatedRef.current && next >= maxViolations) {
          escalatedRef.current = true;
          setIsEscalated(true);
          onEscalate?.(next, logsRef.current.slice());
        }
        return next;
      });
      setIsBlocked(true);
      void Promise.resolve(onViolation?.(entry, logsRef.current.length))
        .then((state) => reconcileSecurityState(state))
        .catch(() => undefined);
    },
    [isTrackingActive, maxViolations, onEscalate, onViolation, reconcileSecurityState, violationCooldownMs],
  );

  const requestFullscreen = useCallback(async (allowClear = false) => {
    if (!enabled || !canFullscreen) return;
    fullscreenRequestedAtRef.current = Date.now();
    if (allowClear) {
      allowClearRef.current = true;
    }
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[exam-security] requestFullscreen ignored", error);
      }
      // Browser policy failures are not student violations.
    }
  }, [canFullscreen, enabled]);

  const returnToExam = useCallback(async () => {
    if (document.fullscreenElement) {
      setIsBlocked(false);
      allowClearRef.current = false;
      return;
    }
    await requestFullscreen(true);
  }, [requestFullscreen]);

  const exitFullscreenAfterConfirmation = useCallback(async () => {
    if (!document.fullscreenElement) return;
    intentionalFullscreenExitRef.current = true;
    try {
      await document.exitFullscreen();
    } catch (error) {
      intentionalFullscreenExitRef.current = false;
      if (process.env.NODE_ENV !== "production") {
        console.debug("[exam-security] exitFullscreen ignored", error);
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsBlocked(false);
      return;
    }
    const active = Boolean(document.fullscreenElement);
    setIsFullscreen(active);
    setIsBlocked(!active);
    if (active) {
      hasEnteredFullscreenOnceRef.current = true;
      // The fullscreen request has completed. Any later exit, even if it
      // happens immediately, is a real exit and must not be hidden by the
      // request grace period.
      fullscreenRequestedAtRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (active) {
        // A pending exit (the 15s "please come back" timer from an earlier
        // involuntary exit) being cancelled here because the student returned
        // in time must NOT be a free pass every time — only the very first
        // exit of the attempt is forgiven. Without this check a student could
        // repeatedly tap out of fullscreen and back in under the grace window
        // forever without ever accumulating a single recorded violation.
        const hadPendingExit = fullscreenExitTimerRef.current !== null;
        clearPendingFullscreenExit();
        hasEnteredFullscreenOnceRef.current = true;
        // Clear the grace window as soon as fullscreen is restored. Keeping
        // it would suppress a subsequent Escape/fullscreen exit for 5 seconds.
        fullscreenRequestedAtRef.current = null;
        setIsBlocked(false);
        setIsFirstFullscreenWarning(false);
        allowClearRef.current = false;
        if (hadPendingExit) {
          if (firstFullscreenWarningUsedRef.current) {
            recordViolation(
              "fullscreen_exit",
              "Sinh viên rời rồi quay lại toàn màn hình nhanh (đã dùng cảnh báo miễn phí lần đầu)",
            );
          } else {
            firstFullscreenWarningUsedRef.current = true;
            const warning: ViolationLog = {
              timestamp: Date.now(),
              type: "fullscreen_exit",
              detail: "Cảnh báo lần đầu (quay lại nhanh) — chưa tính vi phạm",
              clientEventId: createClientEventId(),
            };
            void Promise.resolve(onFullscreenWarning?.(warning))
              .then((state) => reconcileSecurityState(state))
              .catch(() => undefined);
          }
        }
        return;
      }

      // A browser unload often forces fullscreen off. It is not a completed
      // fullscreen violation and must not arm an auto-submit countdown.
      if (pageLeavingRef.current) return;

      const withinGracePeriod = isWithinFullscreenGrace();
      if (
        !isTrackingActive() ||
        withinGracePeriod ||
        !hasEnteredFullscreenOnceRef.current
      ) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[exam-security] fullscreen exit ignored", {
            withinGracePeriod,
            hasEnteredFullscreenOnce: hasEnteredFullscreenOnceRef.current,
            sessionStatus,
            isSubmitting,
          });
        }
        setIsBlocked(false);
        return;
      }
      if (intentionalFullscreenExitRef.current) {
        intentionalFullscreenExitRef.current = false;
        recordViolation("fullscreen_exit", "Sinh viên đã xác nhận thoát chế độ toàn màn hình");
        return;
      }

      setLastViolation({
        timestamp: Date.now(),
        type: "fullscreen_exit",
        detail: "Đang chờ quay lại chế độ toàn màn hình",
        clientEventId: createClientEventId(),
      });
      setIsBlocked(false);
      setIsFullscreenExitPending(true);
      if (fullscreenExitTimerRef.current) clearTimeout(fullscreenExitTimerRef.current);
      fullscreenExitTimerRef.current = setTimeout(() => {
        fullscreenExitTimerRef.current = null;
        setIsFullscreenExitPending(false);
        if (!document.fullscreenElement) {
          if (!firstFullscreenWarningUsedRef.current) {
            // First unreturned exit this attempt: warn, block until they go
            // back to fullscreen, but do not spend one of maxViolations.
            firstFullscreenWarningUsedRef.current = true;
            const warning: ViolationLog = {
              timestamp: Date.now(),
              type: "fullscreen_exit",
              detail: "Cảnh báo lần đầu — chưa tính vi phạm",
              clientEventId: createClientEventId(),
            };
            setLastViolation({
              timestamp: warning.timestamp,
              type: warning.type,
              detail: warning.detail,
              clientEventId: warning.clientEventId,
            });
            setIsFirstFullscreenWarning(true);
            setIsBlocked(true);
            void Promise.resolve(onFullscreenWarning?.(warning))
              .then((state) => reconcileSecurityState(state))
              .catch(() => undefined);
            return;
          }
          recordViolation("fullscreen_exit", "Sinh viên không quay lại chế độ toàn màn hình trong thời gian cho phép");
        }
      }, fullscreenExitGraceMs);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [clearPendingFullscreenExit, enabled, fullscreenExitGraceMs, isSubmitting, isTrackingActive, isWithinFullscreenGrace, onFullscreenWarning, reconcileSecurityState, recordViolation, sessionStatus]);

  useEffect(() => () => {
    if (fullscreenExitTimerRef.current) clearTimeout(fullscreenExitTimerRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (!isTrackingActive() || isWithinFullscreenGrace()) return;
      if (!document.hidden) return;
      if (!document.fullscreenElement) {
        // Fullscreen and visibility commonly drop together for the exact
        // same physical action (e.g. on Windows, toggling fullscreen via F11
        // can blip document.hidden during the OS-level transition). When
        // both drop at once, this is a single fullscreen-exit event — the
        // fullscreenchange listener above already owns that case end-to-end
        // (15s grace to return, first-exit warning, then violation). Firing
        // an independent, un-lenient tab_switch violation here as well would
        // race ahead of that 15s grace (visibilitychange is immediate) and
        // mislabel an F11 press as "chuyển tab" while also bypassing the
        // first-exit warning entirely. Only treat this as a genuine tab
        // switch when fullscreen is still active (student left the exam's
        // foreground without ever leaving fullscreen — e.g. Alt-Tab to
        // another fullscreen-capable surface).
        return;
      }
      recordViolation("tab_switch", "Trang bị ẩn (chuyển tab hoặc ứng dụng khác)");
    };

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, isTrackingActive, isWithinFullscreenGrace, recordViolation]);

  // document.hidden (Page Visibility API, used above) only flips when the tab
  // is switched, minimized, or fully occluded — it does NOT reliably change
  // when the fullscreen window simply loses OS-level input focus while
  // remaining visible and unminimized, which is exactly what happens on a
  // multi-monitor setup: the exam stays fullscreen on one display while the
  // student clicks into another app/window on a second display. That case
  // was previously undetectable. `window.blur` fires whenever the OS moves
  // input focus away, regardless of visibility/occlusion/monitor, so it
  // catches this gap. Only counted while still fullscreen (same rationale as
  // the visibilitychange handler above: an involuntary fullscreen exit is
  // owned end-to-end by the fullscreenchange handler's grace/warning flow).
  useEffect(() => {
    if (!enabled) return;

    const onWindowBlur = () => {
      if (!isTrackingActive() || isWithinFullscreenGrace()) return;
      if (!document.fullscreenElement) return;
      recordViolation("tab_switch", "Cửa sổ mất focus khi vẫn ở chế độ toàn màn hình (có thể do chuyển sang màn hình/ứng dụng khác)");
    };

    window.addEventListener("blur", onWindowBlur);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
    };
  }, [enabled, isTrackingActive, isWithinFullscreenGrace, recordViolation]);

  useEffect(() => {
    if (!enabled) return;
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [enabled]);

  const getViolationLogs = useCallback(() => logsRef.current.slice(), []);

  return {
    isFullscreen,
    isBlocked,
    isEscalated,
    violationCount,
    violationCounts,
    lastViolation,
    maxViolations,
    canFullscreen,
    isFullscreenExitPending,
    isFirstFullscreenWarning,
    returnToExam,
    exitFullscreenAfterConfirmation,
    getViolationLogs,
  };
}
