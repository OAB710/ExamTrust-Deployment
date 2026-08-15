"use client";

import { GraduationCap, Network, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ThemeToggle } from "@/components/common/ThemeToggle";
import { Button } from "@/components/ui/button";

// Shared chrome for /login and /register — same watermark background + header,
// each page supplies its own <main>.
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-gradient-to-br from-accent/50 via-background to-background">
      {/* Watermark texture — connected-node dot grid + faded academic/security icons. CSS + icons only, no image asset. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(hsl(var(--primary) / 0.18) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(circle at 30% 20%, black, transparent 75%)",
            WebkitMaskImage: "radial-gradient(circle at 30% 20%, black, transparent 75%)",
          }}
        />
        <GraduationCap className="absolute -right-8 top-16 h-56 w-56 rotate-12 text-primary/[0.07]" />
        <ShieldCheck className="absolute -left-12 bottom-16 h-64 w-64 -rotate-12 text-primary/[0.06]" />
        <Network className="absolute bottom-0 right-1/4 h-44 w-44 -rotate-6 text-primary/[0.06]" />
      </div>

      <header className="relative shrink-0 border-b border-border/70 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <img src="/examtrust-mark.svg" alt="" width={32} height={32} className="h-8 w-8" />
            ExamTrust
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle compact />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">Trang chủ</Link>
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
