import { useCallback, useEffect, useRef, useState } from "react";

export type ViolationType = "fullscreen_exit" | "tab_switch";

export interface ViolationLog {
  timestamp: number;
  type: ViolationType;
  detail?: string;
}

interface UseExamSecurityOptions {
  enabled?: boolean;
  maxViolations?: number;
  sessionStatus?: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "DISCONNECTED" | string;
  isSubmitting?: boolean;
  fullscreenGraceMs?: number;
  fullscreenExitGraceMs?: number;
  initialFullscreenRequestedAt?: number | null;
  violationCooldownMs?: number;
  onViolation?: (log: ViolationLog, totalCount: number) => void;
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

const DEFAULT_FULLSCREEN_GRACE_MS = 5000;
const DEFAULT_FULLSCREEN_EXIT_GRACE_MS = 15_000;
const DEFAULT_VIOLATION_COOLDOWN_MS = 3000;

export function useExamSecurity(options: UseExamSecurityOptions = {}): UseExamSecurityResult {
  const {
    enabled = true,
    maxViolations = 3,
    sessionStatus = "IN_PROGRESS",
    isSubmitting = false,
    fullscreenGraceMs = DEFAULT_FULLSCREEN_GRACE_MS,
    fullscreenExitGraceMs = DEFAULT_FULLSCREEN_EXIT_GRACE_MS,
    initialFullscreenRequestedAt = null,
    violationCooldownMs = DEFAULT_VIOLATION_COOLDOWN_MS,
    onViolation,
    onEscalate,
  } = options;

  const canFullscreen =
    typeof document !== "undefined" &&
    typeof document.documentElement?.requestFullscreen === "function";

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
      onViolation?.(entry, logsRef.current.length);
    },
    [isTrackingActive, maxViolations, onEscalate, onViolation, violationCooldownMs],
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
        clearPendingFullscreenExit();
        hasEnteredFullscreenOnceRef.current = true;
        // Clear the grace window as soon as fullscreen is restored. Keeping
        // it would suppress a subsequent Escape/fullscreen exit for 5 seconds.
        fullscreenRequestedAtRef.current = null;
        setIsBlocked(false);
        setIsFirstFullscreenWarning(false);
        allowClearRef.current = false;
        return;
      }

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
            setLastViolation({
              timestamp: Date.now(),
              type: "fullscreen_exit",
              detail: "Cảnh báo lần đầu — chưa tính vi phạm",
            });
            setIsFirstFullscreenWarning(true);
            setIsBlocked(true);
            return;
          }
          recordViolation("fullscreen_exit", "Sinh viên không quay lại chế độ toàn màn hình trong thời gian cho phép");
        }
      }, fullscreenExitGraceMs);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [clearPendingFullscreenExit, enabled, fullscreenExitGraceMs, isSubmitting, isTrackingActive, isWithinFullscreenGrace, recordViolation, sessionStatus]);

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
