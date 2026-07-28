"use client";

import Link from "next/link";

import { Header } from "@/components/layout/Header";

export default function Privacy() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <Header />
      <main id="main-content" className="container py-14 sm:py-20">
        <article className="mx-auto max-w-3xl rounded-2xl border border-border/80 bg-card p-6 shadow-soft sm:p-10">
          <h1 className="text-3xl font-semibold tracking-[-0.04em]">Privacy and data retention</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            ExamTrust records only the monitoring data needed to support exam integrity and auditing. Data is retained for a limited period, then anonymized or deleted under the institution's policy.
          </p>

          <div className="mt-9 space-y-8">
            <section>
              <h2 className="text-xl font-semibold">Recorded data</h2>
              <ul className="mt-3 list-disc space-y-2 pl-6 text-muted-foreground">
                <li>IP address and inferred location metadata for auditing or whitelist checks.</li>
                <li>Browser and device information.</li>
                <li>Tab-switch, focus, and integrity events during an exam session.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Retention period</h2>
              <p className="mt-3 text-muted-foreground">Data is retained for 90 days by default. After that, IP addresses are anonymized or deleted.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Your rights</h2>
              <p className="mt-3 text-muted-foreground">Students may request data deletion or send questions to privacy@example.com.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold">Operational information</h2>
              <p className="mt-3 text-muted-foreground">
                Administrators can view details in the dashboard. Operations staff can consult the{" "}
                <Link href="/admin/system-policy" className="font-medium text-primary hover:underline">system policy</Link>
                {" "}and the project's internal retention documentation.
              </p>
            </section>
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <Link href="/" className="font-medium text-primary hover:underline">Back to home</Link>
          </div>
        </article>
      </main>
    </div>
  );
}
