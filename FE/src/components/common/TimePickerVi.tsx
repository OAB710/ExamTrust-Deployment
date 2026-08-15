"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Native <input type="time"> renders AM/PM (or 24h) based on the browser/OS
// locale, not the page's `lang="vi"` — so Vietnamese users on an en-US
// Windows install still see "AM/PM" no matter what the app declares. This
// replaces it with an explicit SA (Sáng) / CH (Chiều) picker, storing/emitting
// the same "HH:mm" 24h string every caller already expects.
type Period = "SA" | "CH";

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function parse24(value: string): { hour24: number; minute: number } {
  const [h, m] = (value || "00:00").split(":");
  const hour24 = Number(h);
  const minute = Number(m);
  return {
    hour24: Number.isFinite(hour24) ? hour24 : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}

function to12(hour24: number): { hour12: number; period: Period } {
  const period: Period = hour24 < 12 ? "SA" : "CH";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, period };
}

function to24(hour12: number, period: Period): number {
  const base = hour12 % 12;
  return period === "CH" ? base + 12 : base;
}

export function TimePickerVi({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const { hour24, minute } = parse24(value);
  const { hour12, period } = to12(hour24);

  const emit = (nextHour12: number, nextMinute: number, nextPeriod: Period) => {
    const nextHour24 = to24(nextHour12, nextPeriod);
    onChange(`${String(nextHour24).padStart(2, "0")}:${String(nextMinute).padStart(2, "0")}`);
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Select value={String(hour12)} onValueChange={(v) => emit(Number(v), minute, period)}>
        <SelectTrigger className="w-[68px]" aria-label="Giờ">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS_12.map((h) => (
            <SelectItem key={h} value={String(h)}>
              {String(h).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-muted-foreground">:</span>
      <Select value={String(minute)} onValueChange={(v) => emit(hour12, Number(v), period)}>
        <SelectTrigger className="w-[68px]" aria-label="Phút">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={String(m)}>
              {String(m).padStart(2, "0")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={period} onValueChange={(v) => emit(hour12, minute, v as Period)}>
        <SelectTrigger className="w-[64px]" aria-label="Buổi">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="SA">SA</SelectItem>
          <SelectItem value="CH">CH</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
