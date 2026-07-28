"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const copy: Record<string, { title: string; description: string; target: string; targetLabel: string }> = {
  submissions: { title: 'Submission activity', description: 'View and filter submissions in the selected time range.', target: '/admin/exams', targetLabel: 'Open exam management' },
  users: { title: 'User growth', description: 'The user list supports filtering and account administration.', target: '/admin/users', targetLabel: 'Open user management' },
  results: { title: 'Result distribution', description: 'Results are meaningful only when enough submissions are scored; use the exam page for per-exam analytics.', target: '/admin/exams', targetLabel: 'Open exam management' },
};
export default function AnalyticsReport({ type }: { type: string }) {
  const params = useSearchParams(); const meta = copy[type]; const query = params.toString();
  return <DashboardLayout><AdminPageShell><div className="space-y-1"><p className="text-sm text-muted-foreground">System overview / {meta.title}</p><h1 className="text-2xl font-semibold">{meta.title}</h1></div><Card><CardHeader><CardTitle>Data for selected filters</CardTitle><CardDescription>{meta.description}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Time range: {params.get('from') || 'last 30 days'} to {params.get('to') || 'present'} · Time zone: {params.get('timezone') || 'Asia/Ho_Chi_Minh'}</p><p className="text-sm text-muted-foreground">Detailed reports with server-side pagination and filtering open from their corresponding administration screen; the dashboard does not load data in bulk.</p><div className="flex gap-2"><Button asChild><Link href={`${meta.target}${query ? `?${query}` : ''}`}>{meta.targetLabel}</Link></Button><Button variant="outline" asChild><Link href={`/admin${query ? `?${query}` : ''}`}>Back to dashboard</Link></Button></div></CardContent></Card></AdminPageShell></DashboardLayout>;
}
