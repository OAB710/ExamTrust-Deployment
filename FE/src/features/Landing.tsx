"use client";

import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  FileClock,
  Fingerprint,
  GraduationCap,
  Laptop,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

const capabilityGroups = [
  {
    icon: Fingerprint,
    title: "Individualized exams",
    description:
      "Each submission has its own question and answer order, saved as an immutable version when it begins.",
    className: "md:col-span-7 md:row-span-2 bg-primary text-primary-foreground",
    iconClassName: "bg-primary-foreground/12 text-primary-foreground",
  },
  {
    icon: FileClock,
    title: "Preserve question history",
    description: "Older exams always refer to the exact question versions they used.",
    className: "md:col-span-5 bg-card",
  },
  {
    icon: ShieldCheck,
    title: "Signals for human review",
    description: "The system records anomalies but does not automatically determine misconduct.",
    className: "md:col-span-5 bg-accent/70",
  },
  {
    icon: Sparkles,
    title: "Lecturer-reviewed AI",
    description: "AI-proposed questions must be reviewed and approved by a lecturer before use.",
    className: "md:col-span-5 bg-card",
  },
  {
    icon: BarChart3,
    title: "Explainable analytics",
    description: "Track difficulty, outcomes, and question quality over time.",
    className: "md:col-span-7 bg-secondary/70",
  },
];

const operatingPrinciples = [
  {
    icon: BookOpenCheck,
    title: "Prepare",
    description: "Lecturers build exams from a versioned question bank with clear rule configuration.",
  },
  {
    icon: Laptop,
    title: "Deliver",
    description: "Students take exams in a focused interface with autosave and connection-recovery support.",
  },
  {
    icon: BarChart3,
    title: "Review",
    description: "Results, events, and integrity signals are presented to support lecturer decisions.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />

      <main id="main-content">
        <section className="page-surface overflow-hidden pb-16 pt-10 sm:pt-14 lg:pb-24 lg:pt-16">
          <div className="container grid items-center gap-10 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-14">
            <div className="relative z-10 max-w-2xl">
              <p className="mb-5 text-sm font-semibold text-primary">Verifiable academic assessment</p>
              <h1 className="max-w-[13ch] text-4xl font-semibold leading-[1.08] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
                Every exam is clear from creation through grading
              </h1>
              <p className="mt-6 max-w-[56ch] text-base leading-7 text-muted-foreground sm:text-lg">
                Individualized exams, immutable history, and integrity signals for fair lecturer review.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="group">
                  <Link href="/login">
                    Sign in
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#nang-luc">Explore the platform</Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/5 blur-3xl" aria-hidden="true" />
              <div className="overflow-hidden rounded-2xl border border-border/80 bg-card p-2 shadow-heavy">
                <Image
                  src="/examtrust-hero.png"
                  alt="Exam records saved by version for review and comparison"
                  width={1456}
                  height={1118}
                  priority
                  className="aspect-[4/3] w-full rounded-xl object-cover"
                  sizes="(max-width: 1024px) 100vw, 56vw"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="nang-luc" className="py-20 sm:py-24">
          <div className="container">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">A platform for trustworthy exams</h2>
              <p className="mt-4 max-w-[60ch] text-base leading-7 text-muted-foreground">
                Every capability serves one goal: preserve evidence, reduce manual work, and support responsible decisions.
              </p>
            </div>

            <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-12">
              {capabilityGroups.map((capability) => (
                <article
                  key={capability.title}
                  className={`flex min-h-52 flex-col justify-between rounded-2xl border border-border/70 p-6 shadow-soft sm:p-7 ${capability.className}`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground ${capability.iconClassName ?? ""}`}>
                    <capability.icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="mt-10 max-w-lg">
                    <h3 className="text-xl font-semibold tracking-[-0.025em]">{capability.title}</h3>
                    <p className={`mt-3 text-sm leading-6 ${capability.className.includes("bg-primary") ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      {capability.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-card py-20 sm:py-24">
          <div className="container grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted shadow-medium">
              <Image
                src="/examtrust-exam-experience.png"
                alt="Student focused on an exam on a computer in a library"
                width={1536}
                height={1024}
                className="aspect-[3/2] w-full object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Focus on the exam, not the tools</h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                The exam interface prioritizes questions, time remaining, save status, and recovery guidance when the connection is interrupted.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-secondary/70 p-5">
                  <WifiOff className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold">Ready for unstable networks</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Answers are saved and synchronized again through the system's existing mechanisms.</p>
                </div>
                <div className="rounded-xl bg-accent/70 p-5">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-semibold">Limited monitoring</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Events are recorded transparently for lecturer review in context.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-24">
          <div className="container">
            <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">One workflow for three roles</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {operatingPrinciples.map((principle, index) => (
                <article key={principle.title} className="border-t border-primary/40 pt-6">
                  <div className="flex items-center gap-3">
                    <span className="data-number text-sm font-semibold text-primary">0{index + 1}</span>
                    <principle.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{principle.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{principle.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="pb-20 sm:pb-24">
          <div className="container">
            <div className="grid items-center gap-8 rounded-2xl bg-primary px-6 py-10 text-primary-foreground sm:px-10 lg:grid-cols-[1fr_auto] lg:px-14 lg:py-12">
              <div>
                <h2 className="text-3xl font-semibold text-primary-foreground tracking-[-0.04em]">Start with your role</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-primary-foreground/78 sm:text-base">
                  Access the available demo data to experience the student, lecturer, or administrator workflow.
                </p>
              </div>
              <Button asChild size="lg" variant="secondary" className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 lg:w-auto">
                <Link href="/login">Open sign-in page</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/80 py-8">
        <div className="container flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
            </span>
            ExamTrust
          </Link>
          <nav aria-label="Footer links" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="#nang-luc" className="hover:text-foreground">Capabilities</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© 2026 ExamTrust</p>
        </div>
      </footer>
    </div>
  );
}
