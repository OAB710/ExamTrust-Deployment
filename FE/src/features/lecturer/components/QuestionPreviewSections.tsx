import type { ReactNode } from "react";
import { ContextHelp } from "@/components/common/ContextHelp";

export function QuestionPreviewSection({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border p-4 space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function QuestionPreviewInfoCard({ label, help, value, valueClassName = "" }: { label: string; help?: ReactNode; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <p className="mb-1 inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        {label}{help ? <ContextHelp content={help} /> : null}
      </p>
      <p className={`text-lg font-semibold ${valueClassName}`}>{value}</p>
    </div>
  );
}
