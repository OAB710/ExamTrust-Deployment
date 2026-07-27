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
  const load = async (next = range) => { setLoading(true); setError(''); try { setData(await api.getAdminDashboardAnalytics(next.from, next.to)); } catch (e: any) { setError(e?.message || 'Không thể tải phân tích dashboard'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [range.from, range.to]);
  useEffect(() => { const next = new URLSearchParams({ from: range.from, to: range.to, preset, timezone: 'Asia/Ho_Chi_Minh' }); router.replace(`${pathname}?${next}`, { scroll: false }); }, [pathname, preset, range.from, range.to, router]);
  const detailHref = (path: string) => `${path}?${new URLSearchParams({ from: range.from, to: range.to, preset, timezone: 'Asia/Ho_Chi_Minh' })}`;
  const setDays = (days: number) => { const next = rangeFor(days); setPreset(String(days)); setRange(next); setCustomFrom(dateInput(new Date(next.from))); setCustomTo(dateInput(new Date(next.to))); };
  const setSemester = () => { const now = new Date(); const month = now.getMonth() + 1; const startMonth = month >= 8 ? 7 : month >= 6 ? 5 : 0; const start = new Date(now.getFullYear(), startMonth, 1); setPreset('semester'); setRange({ from: iso(start), to: iso(now) }); setCustomFrom(dateInput(start)); setCustomTo(dateInput(now)); };
  const applyCustom = () => { if (!customFrom || !customTo || customFrom > customTo) return setError('Khoảng ngày không hợp lệ.'); setPreset('custom'); setRange({ from: new Date(`${customFrom}T00:00:00+07:00`).toISOString(), to: new Date(`${customTo}T23:59:59.999+07:00`).toISOString() }); };
  const charts = data?.series || { activity: [], integrity: [], users: [] }; const scoreReady = (data?.scoreDistribution?.sampleSize || 0) >= 10;
  return <DashboardLayout><AdminPageShell showBackButton={false}>
    <div><h1 className="text-2xl font-semibold">Quản trị hệ thống</h1><p className="mt-1 text-muted-foreground">Xu hướng vận hành, toàn vẹn và kết quả theo thời gian.</p></div>
    <Card><CardContent className="flex flex-wrap items-end gap-2 pt-5"><div className="flex flex-wrap gap-2">{[7,30,90].map((d) => <Button key={d} size="sm" variant={preset === String(d) ? 'default' : 'outline'} onClick={() => setDays(d)}>{d} ngày</Button>)}<Button size="sm" variant={preset === 'semester' ? 'default' : 'outline'} onClick={setSemester}>Học kỳ hiện tại</Button></div><div className="ml-auto flex flex-wrap items-end gap-2"><label className="text-xs">Từ ngày<input className="ml-1 rounded border px-2 py-1" type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></label><label className="text-xs">Đến ngày<input className="ml-1 rounded border px-2 py-1" type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></label><Button size="sm" variant="outline" onClick={applyCustom}>Áp dụng</Button></div></CardContent></Card>
    {error ? <Card><CardContent className="py-8 text-destructive">{error}</CardContent></Card> : null}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><AdminStatCard icon={Users} value={data?.kpis?.newUsers ?? '—'} label="Người dùng mới"/><AdminStatCard icon={Activity} value={data?.kpis?.activeExams ?? '—'} label="Bài thi đang diễn ra"/><AdminStatCard icon={FileCheck2} value={data?.kpis?.completedSubmissions ?? '—'} label="Lượt nộp hoàn tất"/><AdminStatCard icon={Shield} value={data?.kpis?.pendingReview ?? '—'} label="Tín hiệu chờ xem xét"/></div>
    {loading ? <p className="py-10 text-center text-muted-foreground">Đang tổng hợp dữ liệu…</p> : <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="Hoạt động nộp bài" href={detailHref('/admin/analytics/submissions')} description="Lượt bắt đầu và hoàn tất; bucket theo khoảng thời gian." data={charts.activity}><LineChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Line type="monotone" dataKey="started" name="Bắt đầu" stroke="#0ea5e9"/><Line type="monotone" dataKey="completed" name="Hoàn tất" stroke="#10b981"/></LineChart></ChartCard>
      <ChartCard title="Tín hiệu toàn vẹn" href={detailHref('/admin/integrity')} description="Tín hiệu hỗ trợ review, không phải kết luận gian lận." data={charts.integrity}><BarChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar dataKey="signaled" name="Có tín hiệu" fill="#f59e0b"/><Bar dataKey="reviewed" name="Đã review" fill="#6366f1"/></BarChart></ChartCard>
      <ChartCard title="Tăng trưởng người dùng" href={detailHref('/admin/analytics/users')} description="Tài khoản mới theo vai trò." data={charts.users}><BarChart><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="period"/><YAxis allowDecimals={false}/><Tooltip/><Legend/><Bar stackId="roles" dataKey="students" name="Sinh viên" fill="#0ea5e9"/><Bar stackId="roles" dataKey="lecturers" name="Giảng viên" fill="#8b5cf6"/><Bar stackId="roles" dataKey="admins" name="Quản trị viên" fill="#64748b"/></BarChart></ChartCard>
      <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">Phân bố kết quả</CardTitle><Link className="text-sm text-primary underline-offset-4 hover:underline" href={detailHref('/admin/analytics/results')}>Xem chi tiết →</Link></div><CardDescription>Chỉ gồm lượt hoàn tất chính thức trên thang 10.</CardDescription></CardHeader><CardContent className="h-72">{scoreReady ? <ResponsiveContainer width="100%" height="100%"><BarChart data={data.scoreDistribution.bands}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="label"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Lượt nộp" fill="#14b8a6"/></BarChart></ResponsiveContainer> : <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">Chưa đủ dữ liệu tin cậy ({data?.scoreDistribution?.sampleSize || 0}/10 lượt có điểm).</div>}</CardContent></Card>
    </div>}
  </AdminPageShell></DashboardLayout>;
}
function ChartCard({ title, description, data, children, href }: any) { return <Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-lg">{title}</CardTitle><Link className="text-sm text-primary underline-offset-4 hover:underline" href={href}>Xem chi tiết →</Link></div><CardDescription>{description}</CardDescription></CardHeader><CardContent className="h-72">{data.length ? <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chưa có dữ liệu trong khoảng đã chọn.</div>}</CardContent></Card>; }
