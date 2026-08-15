"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Unit = "h" | "m" | "s";

const UNIT_SECONDS: Record<Unit, number> = { h: 3600, m: 60, s: 1 };
const UNIT_LABELS: Record<Unit, string> = { h: "Giờ", m: "Phút", s: "Giây" };

// A number input paired with a Giờ/Phút/Giây unit select, so any duration
// setting can be entered in whichever unit fits the exam without forcing a
// single hardcoded granularity. Value/onChange are always in seconds — the
// unit choice only affects how that number is displayed and typed in.
export function DurationInput({
  valueSeconds,
  onChangeSeconds,
  defaultUnit = "m",
  minSeconds = 0,
  placeholder,
  className,
}: {
  valueSeconds: number;
  onChangeSeconds: (seconds: number) => void;
  defaultUnit?: Unit;
  minSeconds?: number;
  placeholder?: string;
  className?: string;
}) {
  const [unit, setUnit] = useState<Unit>(defaultUnit);
  const displayValue = valueSeconds > 0 ? String(Math.round(valueSeconds / UNIT_SECONDS[unit])) : "";
  // The floor is always expressed in seconds (matches the backend's own
  // floor) — convert it to whatever unit is currently selected so switching
  // units can't bypass it (e.g. min=10s showing as "min=10" while the unit
  // is Giờ would silently demand 10 hours instead of 10 seconds).
  const minInUnit = Math.ceil(minSeconds / UNIT_SECONDS[unit]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Input
        type="number"
        min={minInUnit}
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          const raw = Number(e.target.value);
          onChangeSeconds(Number.isFinite(raw) && raw >= 0 ? raw * UNIT_SECONDS[unit] : 0);
        }}
        className="w-28"
      />
      <Select value={unit} onValueChange={(v) => setUnit(v as Unit)}>
        <SelectTrigger className="w-24" aria-label="Đơn vị thời gian">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(UNIT_LABELS) as Unit[]).map((u) => (
            <SelectItem key={u} value={u}>
              {UNIT_LABELS[u]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
