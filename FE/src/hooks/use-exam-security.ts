import { useCallback, useEffect, useRef, useState } from "react";

export type ViolationType = "fullscreen_exit" | "tab_switch";

export interface FirstViolationNotice {
  type: ViolationType;
  detail?: string;
}

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
  firstViolationAvailable: boolean;
  firstViolationNotice: FirstViolationNotice | null;
  dismissFirstViolationNotice: () => void;
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
  const [firstViolationNotice, setFirstViolationNotice] = useState<FirstViolationNotice | null>(null);

  const logsRef = useRef<ViolationLog[]>([]);
  const escalatedRef = useRef(false);
  const allowClearRef = useRef(false);
  const fullscreenRequestedAtRef = useRef<number | null>(initialFullscreenRequestedAt);
  const hasEnteredFullscreenOnceRef = useRef(false);
  const lastViolationAtRef = useRef<Partial<Record<ViolationType, number>>>({});
  const fullscreenExitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intentionalFullscreenExitRef = useRef(false);
  // The very first violation of the whole attempt — fullscreen_exit OR
  // tab_switch, whichever happens first — is a free warning only: toast to
  // the student, not persisted, not counted. From the second violation
  // onward (any type), everything is recorded normally. This one flag is
  // shared across both violation types, not per-type.
  const firstViolationUsedRef = useRef(false);
  // Mirrors firstViolationUsedRef into render-visible state — the ref alone
  // can't drive the caller's UI (e.g. deciding whether to preview a pending
  // fullscreen-exit as "will count as a violation" before its 15s grace even
  // resolves one way or the other).
  const [firstViolationAvailable, setFirstViolationAvailable] = useState(true);
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
      firstViolationUsedRef.current = true;
      setFirstViolationAvailable(false);
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
    (type: ViolationType, detail?: string, callOptions?: { silent?: boolean; keepUnblocked?: boolean }) => {
      if (!isTrackingActive()) return;
      const now = Date.now();
      const previousAt = lastViolationAtRef.current[type] || 0;
      if (now - previousAt < violationCooldownMs) return;
      lastViolationAtRef.current[type] = now;

      // First violation of the whole attempt (either type) — free pass: not
      // persisted, not counted, just a heads-up to the student. A blocking
      // modal is used instead of a toast — a toast is too easy to miss while
      // focused on answering questions. `silent` skips it for callers that
      // already show their own UI feedback for this exact moment (the
      // fullscreen "please return" modal), so the student isn't shown two
      // overlapping notices at once.
      if (!firstViolationUsedRef.current) {
        firstViolationUsedRef.current = true;
        setFirstViolationAvailable(false);
        if (!callOptions?.silent) {
          setFirstViolationNotice({ type, detail });
        }
        return;
      }

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
      // A violation that happens while the student is ALREADY back in
      // fullscreen (the "returned within the grace window, but the free
      // first pass was already used earlier" case) must not re-block them —
      // the caller just cleared isBlocked because they successfully
      // recovered; forcing it back to true here reopened the very modal that
      // was just dismissed, so "Trở lại bài thi" appeared to require two
      // clicks (1st click restored fullscreen, 2nd click was needed to
      // actually get past the modal this line re-triggered).
      if (!callOptions?.keepUnblocked) {
        setIsBlocked(true);
      }
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
      setIsFullscreenExitPending(false);
      setIsFirstFullscreenWarning(false);
      allowClearRef.current = false;
      return;
    }
    await requestFullscreen(true);
    // Don't rely solely on the async "fullscreenchange" event to close this
    // dialog — if it resolved successfully, clear the block immediately so
    // one click is enough; otherwise the student has to click a second time
    // once that event catches up. Clears isFullscreenExitPending too, not
    // just isBlocked — the modal can be open because of either flag (it's
    // shown whenever either is true), and leaving the other one set meant
    // entering fullscreen here still left a stale "please return" countdown
    // on screen until the fullscreenchange handler eventually caught up.
    if (document.fullscreenElement) {
      setIsBlocked(false);
      setIsFullscreenExitPending(false);
      setIsFirstFullscreenWarning(false);
      allowClearRef.current = false;
    }
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
    // When security is first enabled (e.g. after exam questions load),
    // respect the fullscreen grace period so the student has time to
    // re-enter fullscreen after navigating from ExamReadyCheck.
    const withinGrace = isWithinFullscreenGrace();
    setIsBlocked(!active && !withinGrace);
    if (active) {
      hasEnteredFullscreenOnceRef.current = true;
      // The fullscreen request has completed. Any later exit, even if it
      // happens immediately, is a real exit and must not be hidden by the
      // request grace period.
      fullscreenRequestedAtRef.current = null;
    }
  }, [enabled, isWithinFullscreenGrace]);

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
        allowClearRef.current = false;
        if (hadPendingExit && !firstViolationUsedRef.current) {
          // First violation of the whole attempt — show it as the SAME
          // blocking "cảnh báo lần đầu" modal the 15s-timeout branch below
          // uses (isFirstFullscreenWarning), instead of closing this pending
          // modal here and letting recordViolation pop a separate notice
          // right after for the same incident — that showed as two
          // back-to-back popups for a single fullscreen exit.
          setLastViolation({
            timestamp: Date.now(),
            type: "fullscreen_exit",
            detail: "Cảnh báo lần đầu — chưa tính vi phạm",
            clientEventId: createClientEventId(),
          });
          setIsFirstFullscreenWarning(true);
          setIsBlocked(true);
          recordViolation("fullscreen_exit", "Sinh viên rời rồi quay lại toàn màn hình nhanh (dùng cảnh báo miễn phí lần đầu)", { silent: true });
          return;
        }
        setIsBlocked(false);
        setIsFirstFullscreenWarning(false);
        if (hadPendingExit) {
          // Student already returned to fullscreen on their own — count the
          // violation but don't re-block them for it (keepUnblocked), and
          // skip the toast (silent) since there's no separate "you're back"
          // moment to narrate; the badge count updating is enough.
          recordViolation("fullscreen_exit", "Sinh viên rời rồi quay lại toàn màn hình nhanh", { silent: true, keepUnblocked: true });
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

      // The free first-violation pass is unconditional — recordViolation's
      // own early-return branch forgives it whether the student comes back
      // instantly or never comes back at all — so there is nothing to race
      // against here. Skip the "return within 15s or it counts" urgency
      // framing and show the calm, no-consequence notice immediately instead
      // of making the student sit through a countdown for an exit that was
      // never actually going to count.
      if (!firstViolationUsedRef.current) {
        setLastViolation({
          timestamp: Date.now(),
          type: "fullscreen_exit",
          detail: "Cảnh báo lần đầu — chưa tính vi phạm",
          clientEventId: createClientEventId(),
        });
        setIsFirstFullscreenWarning(true);
        setIsBlocked(true);
        recordViolation("fullscreen_exit", "Sinh viên thoát chế độ toàn màn hình lần đầu (dùng cảnh báo miễn phí lần đầu)", { silent: true });
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
          // The 15s grace timer and the resulting "please return to
          // fullscreen" block apply the same way regardless of whether this
          // is the free first violation or a real one — only whether it
          // gets persisted/counted differs, which recordViolation decides
          // via the shared firstViolationUsedRef. Peeked here (before
          // recordViolation flips it) only to pick the modal's text/color.
          const isFirst = !firstViolationUsedRef.current;
          const detail = isFirst
            ? "Cảnh báo lần đầu — chưa tính vi phạm"
            : "Sinh viên không quay lại chế độ toàn màn hình trong thời gian cho phép";
          setLastViolation({
            timestamp: Date.now(),
            type: "fullscreen_exit",
            detail,
            clientEventId: createClientEventId(),
          });
          setIsFirstFullscreenWarning(isFirst);
          setIsBlocked(true);
          // silent: this modal already tells the student what happened —
          // recordViolation's own toast would just be a redundant second
          // notice for the free-first case.
          recordViolation("fullscreen_exit", detail, { silent: true });
        }
      }, fullscreenExitGraceMs);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [clearPendingFullscreenExit, enabled, fullscreenExitGraceMs, isSubmitting, isTrackingActive, isWithinFullscreenGrace, reconcileSecurityState, recordViolation, sessionStatus]);

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
    let blurTimer: ReturnType<typeof setTimeout> | null = null;

    // Debounced: clicking the browser's own native screen-share indicator
    // bar (e.g. Chrome's "localhost is sharing your screen — Stop sharing /
    // Hide") also fires window.blur without the student ever leaving the
    // exam — focus returns to the page within a fraction of a second. A real
    // switch to another app/monitor keeps focus away noticeably longer, so
    // only record the violation if focus hasn't returned shortly after.
    const onWindowBlur = () => {
      if (!isTrackingActive() || isWithinFullscreenGrace()) return;
      if (!document.fullscreenElement) return;
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        blurTimer = null;
        // Re-check fullscreen state here, not just at blur-time above:
        // pressing F11 fires `window.blur` and `fullscreenchange` together
        // for the same physical action, and fullscreen has usually finished
        // exiting by the time this 800ms debounce elapses. Without this
        // check, that single F11 press recorded a *second*, separate
        // "tab_switch" violation on top of the one fullscreenchange's own
        // grace/warning flow already owns end-to-end — showing the "vi phạm
        // đã tính" block and then, right after it closed, an unrelated
        // "cảnh báo lần đầu" popup for whichever of the two happened to
        // claim the free first-violation pass.
        if (!document.fullscreenElement) return;
        recordViolation("tab_switch", "Cửa sổ mất focus khi vẫn ở chế độ toàn màn hình (có thể do chuyển sang màn hình/ứng dụng khác)");
      }, 800);
    };

    const onWindowFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
    };

    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    return () => {
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      if (blurTimer) clearTimeout(blurTimer);
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

  const dismissFirstViolationNotice = useCallback(() => {
    setFirstViolationNotice(null);
  }, []);

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
    firstViolationAvailable,
    firstViolationNotice,
    dismissFirstViolationNotice,
    returnToExam,
    exitFullscreenAfterConfirmation,
    getViolationLogs,
  };
}
