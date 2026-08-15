"use client";

import { AlertTriangle, Timer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LiveClock } from "./LiveClock";
import type { FirstViolationNotice, ViolationLog, ViolationType } from "../../hooks/use-exam-security";

const violationLabels: Record<ViolationType, string> = {
  fullscreen_exit: "Đã thoát toàn màn hình",
  tab_switch: "Đã chuyển tab",
};

interface ExamSecurityModalProps {
  open: boolean;
  violationCount: number;
  maxViolations: number;
  isEscalated: boolean;
  countdownSeconds: number;
  isFullscreenExitPending?: boolean;
  isFirstFullscreenWarning?: boolean;
  lastViolation: ViolationLog | null;
  canFullscreen: boolean;
  onReturnToExam: () => void;
  firstViolationNotice?: FirstViolationNotice | null;
  onDismissFirstViolationNotice?: () => void;
  examTimeLabel?: string;
  examTimeLow?: boolean;
}

export function ExamSecurityModal({
  open,
  violationCount,
  maxViolations,
  isEscalated,
  countdownSeconds,
  isFullscreenExitPending = false,
  isFirstFullscreenWarning = false,
  lastViolation,
  canFullscreen,
  onReturnToExam,
  firstViolationNotice = null,
  onDismissFirstViolationNotice,
  examTimeLabel,
  examTimeLow = false,
}: ExamSecurityModalProps) {
  // Fullscreen hides the OS clock, so any popup stacked over the exam still
  // needs to show both the real time and the exam countdown — otherwise a
  // student stuck on a security popup has no idea how much time is left.
  const clockRow = (
    <div className="mb-4 flex items-center justify-center gap-3 text-xs text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        Giờ hiện tại: <LiveClock />
      </span>
      {examTimeLabel && (
        <span className={`inline-flex items-center gap-1.5 font-mono font-semibold ${examTimeLow ? "text-red-600" : ""}`}>
          <Timer className="h-3.5 w-3.5" /> {examTimeLabel}
        </span>
      )}
    </div>
  );
  // The free first-violation notice (any signal type) is a full blocking
  // dialog rather than a toast — a toast is too easy to miss while focused on
  // answering questions. It's independent of `open`/the countdown flow below
  // (which only ever runs for a real, counted violation).
  if (!open && firstViolationNotice) {
    const noticeReason = violationLabels[firstViolationNotice.type];
    return (
      <div
        className="fixed inset-0 z-[120] bg-black flex items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exam-security-first-violation-title"
      >
        <div className="bg-card rounded-xl p-8 max-w-sm text-center border shadow-xl">
          {clockRow}
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-500" />
          <h2 id="exam-security-first-violation-title" className="text-xl font-semibold mb-2">
            Cảnh báo lần đầu
          </h2>
          <p className="text-muted-foreground mb-1">Hệ thống vừa ghi nhận 1 tín hiệu đáng chú ý trong bài thi.</p>
          <p className="text-sm mb-2">
            Tín hiệu ghi nhận: <strong>{noticeReason}</strong>. Đây là <strong>lần đầu tiên</strong> nên hệ thống <strong>chưa tính là vi phạm</strong>. Từ lần tiếp theo, mỗi tín hiệu sẽ được tính (tối đa {maxViolations} lần trước khi bài thi bị nộp tự động).
          </p>
          <Button onClick={onDismissFirstViolationNotice}>Đã hiểu, tiếp tục làm bài</Button>
        </div>
      </div>
    );
  }

  if (!open) return null;

  const reason = lastViolation ? violationLabels[lastViolation.type] : null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exam-security-title"
    >
      <div className="bg-card rounded-xl p-8 max-w-sm text-center border shadow-xl">
        {clockRow}
        <AlertTriangle className={`h-12 w-12 mx-auto mb-4 ${isFirstFullscreenWarning ? "text-amber-500" : "text-red-500"}`} />
        <h2 id="exam-security-title" className="text-xl font-semibold mb-2">
          {isFirstFullscreenWarning ? "Cảnh báo lần đầu" : "Cần trở lại toàn màn hình"}
        </h2>
        <p className="text-muted-foreground mb-1">Phiên thi tạm dừng cho đến khi chế độ toàn màn hình được khôi phục.</p>
        {isFirstFullscreenWarning ? (
          <p className="text-sm mb-2">
            Bạn vừa thoát chế độ toàn màn hình (F11, Esc hoặc chuyển ứng dụng). Đây là <strong>lần đầu tiên</strong> nên hệ thống <strong>chưa ghi nhận vi phạm</strong>. Từ lần thoát tiếp theo, mỗi lần sẽ được tính là 1 tín hiệu vi phạm (tối đa {maxViolations} lần trước khi bài thi bị nộp tự động).
          </p>
        ) : (
          <p className="text-sm mb-2">
            {isFullscreenExitPending
              ? <>Trở lại toàn màn hình trong <strong>{countdownSeconds} giây</strong> để tránh ghi nhận cảnh báo.</>
              : <>Trở lại toàn màn hình trong <strong>{countdownSeconds} giây</strong>, nếu không bài thi sẽ được tự động nộp.</>}
          </p>
        )}
        {reason && !isFirstFullscreenWarning && (
          <p className="text-muted-foreground text-sm mb-2">
            Tín hiệu ghi nhận: <strong>{reason}</strong>
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-4">
          Số tín hiệu cần xem xét: <strong>{violationCount}</strong> / {maxViolations}
        </p>
        {isEscalated && (
          <p className="text-red-600 text-sm mb-3">
            Đã đạt ngưỡng tín hiệu của phiên thi. Bài thi sẽ được nộp tự động.
          </p>
        )}
        {!canFullscreen && (
          <p className="text-red-600 text-sm mb-3">
            Trình duyệt này không hỗ trợ toàn màn hình. Vui lòng chuyển sang trình duyệt được hỗ trợ.
          </p>
        )}
        <Button onClick={onReturnToExam} disabled={!canFullscreen}>
          {isFirstFullscreenWarning ? "Đã hiểu, quay lại bài thi" : "Trở lại bài thi"}
        </Button>
      </div>
    </div>
  );
}

