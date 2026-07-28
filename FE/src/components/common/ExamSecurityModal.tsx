"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ViolationLog, ViolationType } from "../../hooks/use-exam-security";

const violationLabels: Record<ViolationType, string> = {
  fullscreen_exit: "Exited full-screen mode",
  tab_switch: "Switched tabs",
  blur: "Window lost focus",
  focus: "Window regained focus",
};

interface ExamSecurityModalProps {
  open: boolean;
  violationCount: number;
  maxViolations: number;
  isEscalated: boolean;
  countdownSeconds: number;
  lastViolation: ViolationLog | null;
  canFullscreen: boolean;
  onReturnToExam: () => void;
}

export function ExamSecurityModal({
  open,
  violationCount,
  maxViolations,
  isEscalated,
  countdownSeconds,
  lastViolation,
  canFullscreen,
  onReturnToExam,
}: ExamSecurityModalProps) {
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
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 id="exam-security-title" className="text-xl font-semibold mb-2">Return to full-screen mode</h2>
        <p className="text-muted-foreground mb-1">Your exam session is paused until full-screen mode is restored.</p>
        <p className="text-sm mb-2">
          Return to full-screen mode within <strong>{countdownSeconds} seconds</strong>, or your exam will be submitted automatically.
        </p>
        {reason && (
          <p className="text-muted-foreground text-sm mb-2">
            Recorded event: <strong>{reason}</strong>
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-4">
          Events requiring review: <strong>{violationCount}</strong> / {maxViolations}
        </p>
        {isEscalated && (
          <p className="text-red-600 text-sm mb-3">
            The session event threshold has been reached. Your exam will be submitted automatically.
          </p>
        )}
        {!canFullscreen && (
          <p className="text-red-600 text-sm mb-3">
            This browser does not support full-screen mode. Please switch to a supported browser.
          </p>
        )}
        <Button onClick={onReturnToExam} disabled={!canFullscreen}>
          Return to exam
        </Button>
      </div>
    </div>
  );
}

