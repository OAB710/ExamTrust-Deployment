"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

// Fullscreen mode hides the OS taskbar clock, so the exam UI (and any modal
// stacked on top of it) needs its own visible wall-clock time — otherwise a
// student in fullscreen has no way to tell what time it actually is.
export function LiveClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    // Displayed precision is minutes, not seconds — a 30s tick is plenty to
    // keep it current without a pointless per-second re-render.
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      {now ? now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"}
    </span>
  );
}
