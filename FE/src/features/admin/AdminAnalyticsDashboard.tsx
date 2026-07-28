"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Shield, Users, FileCheck2 } from "lucide-react";
import api from "@/lib/api";

const iso = (date: Date) => date.toISOString();
const rangeFor = (days: number) => ({ from: iso(new Date(Date.now() - (days - 1) * 86400000)), to: iso(new Date()) });
const dateInput = (date: Date) => date.toISOString().slice(0, 10);

export default function AdminAnalyticsDashboard() {
  const params = useSearchParams(); const router = useRouter(); const pathname = usePathname();
  const initial = () => ({ from: params.get('from') || rangeFor(30).from, to: params.get('to') || rangeFor(30).to });
  const [preset, setPreset] = useState(() => params.get('preset') || '30'); const [range, setRange] = useState(initial); const [customFrom, setCustomFrom] = useState(() => dateInput(new Date(initial().from))); const [customTo, setCustomTo] = useState(() => dateInput(new Date(initial().to)));
  const [data, setData] = useState<any>(null); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = async (next = range) => { setLoading(true); setError(''); try { setData(await api.getAdminDashboardAnalytics(next.from, next.to)); } catch (e: any) { setError(e?.message || 'Unable to load dashboard analytics'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [range.from, range.to]);
  useEffect(() => { const next = new URLSearchParams({ from: range.from, to: range.to, preset, timezone: 'Asia/Ho_Chi_Minh' }); router.replace(`${pathname}?${next}`, { scroll: false }); }, [pathname, preset, range.from, range.to, router]);
  const detailHref = (path: string) => `${path}?${new URLSearchParams({ from: range.from, to: range.to, preset, timezone: 'Asia/Ho_Chi_Minh' })}`;
  const setDays = (days: number) => { const next = rangeFor(days); setPreset(String(days)); setRange(next); setCustomFrom(dateInput(new Date(next.from))); setCustomTo(dateInput(new Date(next.to))); };
  const setSemester = () => { const now = new Date(); const month = now.getMonth() + 1; const startMonth = month >= 8 ? 7 : month >= 6 ? 5 : 0; const start = new Date(now.getFullYear(), startMonth, 1); setPreset('semester'); setRange({ from: iso(start), to: iso(now) }); setCustomFrom(dateInput(start)); setCustomTo(dateInput(now)); };
  const applyCustom = () => { if (!customFrom || !customTo || customFrom > customTo) return setError('Invalid date range.'); setPreset('custom'); setRange({ from: new Date(`${customFrom}T00:00:00+07:00`).toISOString(), to: new Date(`${customTo}T23:59:59.999+07:00`).toISOString() }); };
  const charts = data?.series || { activity: [], integrity: [], users: [] }; const scoreReady = (data?.scoreDistribution?.sampleSize || 0) >= 10;
  return <DashboardLayout><AdminPageShell showBackButton={false}>
    <div><h1 className="text-2xl font-semibold">System administration</h1><p className="mt-1 text-muted-foreground">Operational, integrity, and outcome trends over time.</p></div>
    <Card><CardContent className="flex flex-wrap items-end gap-2 pt-5"><div className="flex flex-wrap gap-2">{[7,30,90].map((d) => <Button key={d} size="sm" variant={preset === String(d) ? 'default' : 'outline'} onClick={() => setDays(d)}>{d} days</Button>)}<Button size="sm" variant={preset === 'semester' ? 'default' : 'outline'} onClick={setSemester}>Current term</Button></div><div className="ml-auto flex flex-wrap items-end gap-2"><label className="text-xs">From<input className="ml-1 rounded border px-2 py-1" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></label><label className="text-xs">To<input className="ml-1 rounded border px-2 py-1" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></label><Button size="sm" variant="outline" onClick={applyCustom}>Apply</Button></div></CardContent></Card>
    {error ? <Card><CardContent className="py-8 text-destructive">{error}</CardContent></Card> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminStatCard icon={Users} value={data?.kpis?.newUsers ?? '—'} label="New users"/><AdminStatCard icon={Activity} value={data?.kpis?.activeExams ?? '—'} label="Ongoing exams"/><AdminStatCard icon={FileCheck2} value={data?.kpis?.completedSubmissions ?? '—'} label="Completed submissions"/><AdminStatCard icon={Shield} value={data?.kpis?.pendingReview ?? '—'} label="Events pending review"/></div>
    {loading ? <p className="py-10 text-center text-muted-foreground">Compiling data…</p> : <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Submission activity" href={detailHref('/admin/analytics/submissions')} description="Started and completed submissions, grouped by time period." data={charts.activity}><LineChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="started" name="Started" stroke="#0ea5e9"/><Line type="monotone" dataKey="completed" name="Completed" stroke="#10b981"/></LineChart></ChartCard>
      <ChartCard title="Integrity signals" href={detailHref('/admin/integrity')} description="Signals support review; they are not findings of misconduct." data={charts.integrity}><BarChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="signaled" name="Signals detected" fill="#f59e0b"/><Bar dataKey="reviewed" name="Reviewed" fill="#6366f1"/></BarChart></ChartCard>
      <ChartCard title="User growth" href={detailHref('/admin/analytics/users')} description="New accounts by role." data={charts.users}><BarChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar stackId="roles" dataKey="students" name="Students" fill="#0ea5e9"/><Bar stackId="roles" dataKey="lecturers" name="Lecturers" fill="#8b5cf6"/><Bar stackId="roles" dataKey="admins" name="Administrators" fill="#64748b"/></BarChart></ChartCard>
      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">Result distribution</CardTitle><Link className="text-sm text-primary underline-offset-4 hover:underline" href={detailHref('/admin/analytics/results')}>View details →</Link></div><CardDescription>Includes only official completed submissions on a 10-point scale.</CardDescription></CardHeader><CardContent className="h-72">{scoreReady ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.scoreDistribution.bands}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Submissions" fill="#14b8a6"/></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">Not enough reliable data ({data?.scoreDistribution?.sampleSize || 0}/10 scored submissions).</div>}</CardContent></Card>
    </div>}
  </AdminPageShell></DashboardLayout>;
}
function ChartCard({ title, description, data, children, href }: any) { return <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{title}</CardTitle><Link className="text-sm text-primary underline-offset-4 hover:underline" href={href}>View details →</Link></div><CardDescription>{description}</CardDescription></CardHeader><CardContent className="h-72">{data.length ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No data for the selected period.</div>}</CardContent></Card>; }
