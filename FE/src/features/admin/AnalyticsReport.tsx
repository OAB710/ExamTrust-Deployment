"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const copy: Record<string, { title: string; description: string; target: string; targetLabel: string }> = {
  submissions: { title: 'Hoạt động nộp bài', description: 'Xem và lọc danh sách lượt làm bài trong khoảng thời gian đã chọn.', target: '/admin/exams', targetLabel: 'Mở quản lý bài thi' },
  users: { title: 'Tăng trưởng người dùng', description: 'Danh sách người dùng hỗ trợ lọc và quản trị tài khoản.', target: '/admin/users', targetLabel: 'Mở quản lý người dùng' },
  results: { title: 'Phân bố kết quả', description: 'Kết quả chỉ có ý nghĩa khi số bài có điểm đủ lớn; dùng trang bài thi để xem phân tích theo kỳ thi.', target: '/admin/exams', targetLabel: 'Mở quản lý bài thi' },
};
export default function AnalyticsReport({ type }: { type: string }) {
  const params = useSearchParams(); const meta = copy[type]; const query = params.toString();
  return <DashboardLayout><AdminPageShell><div className="space-y-1"><p className="text-sm text-muted-foreground">Tổng quan hệ thống / {meta.title}</p><h1 className="text-2xl font-semibold">{meta.title}</h1></div><Card><CardHeader><CardTitle>Dữ liệu theo bộ lọc đã chọn</CardTitle><CardDescription>{meta.description}</CardDescription></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">Khoảng thời gian: {params.get('from') || '30 ngày gần nhất'} đến {params.get('to') || 'hiện tại'} · Múi giờ: {params.get('timezone') || 'Asia/Ho_Chi_Minh'}</p><p className="text-sm text-muted-foreground">Báo cáo chi tiết có pagination/filter server-side sẽ được mở từ màn quản trị tương ứng; không tải hàng loạt dữ liệu trên dashboard.</p><div className="flex gap-2"><Button asChild><Link href={`${meta.target}${query ? `?${query}` : ''}`}>{meta.targetLabel}</Link></Button><Button variant="outline" asChild><Link href={`/admin${query ? `?${query}` : ''}`}>Quay lại tổng quan</Link></Button></div></CardContent></Card></AdminPageShell></DashboardLayout>;
}
