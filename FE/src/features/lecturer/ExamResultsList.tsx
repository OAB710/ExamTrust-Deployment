"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Activity, AlertTriangle, ClipboardCheck, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { DataPagination } from "@/components/common/DataPagination";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import api, { API_BASE_URL, unwrapPaginatedData } from "@/lib/api";

type ExamOverview = {
  exam: {
    id: string;
    title: string;
    totalPoints?: number;
  };
  analyticsScope?: "OFFICIAL" | "PRACTICE";
  isUnlimited?: boolean;
  summary: {
    totalSubmissions: number;
    analyzedSubmissions?: number;
    inProgress: number;
    completed: number;
    avgScorePct: number;
    highestScorePct: number;
    lowestScorePct: number;
  };
  scoreDistribution: Array<{ key: string; count: number }>;
  anomalies: Array<{
    id: string;
    eventType: string;
    details?: string;
    timestamp: string;
    severity: "low" | "medium" | "high";
    student?: { fullName?: string; studentId?: string } | null;
  }>;
  updatedAt: string;
};

function formatTimeSpent(start?: string | null, end?: string | null) {
  if (!start || !end) return "-";
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.round(diffMs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h} giờ ${m} phút`;
  return `${m} phút`;
}

function getEventTypeLabel(eventType?: string) {
  const labels: Record<string, string> = {
    tab_switch: "Chuyển tab", window_blur: "Mất tiêu điểm cửa sổ",
    focus_lost: "Mất tiêu điểm", fullscreen_exit: "Thoát chế độ toàn màn hình",
  };
  return labels[String(eventType || "").toLowerCase()] || "Sự kiện giám sát";
}

function getAnomalyDescription(eventType?: string, details?: string) {
  const event = String(eventType || "").toLowerCase();
  const detailText = String(details || "");
  const detectedCount = detailText.match(/detected\s+(\d+)\s+(mouse anomalies|tab switches)/i);

  if (detectedCount) {
    const [, count, kind] = detectedCount;
    return kind.toLowerCase().includes("mouse")
      ? `Hệ thống ghi nhận ${count} tương tác chuột cần được đối chiếu.`
      : `Hệ thống ghi nhận ${count} lần chuyển tab trong phiên thi.`;
  }

  if (event === "tab_switch" || /"kind"\s*:\s*"tab_switch"/i.test(detailText)) {
    return "Hệ thống ghi nhận sinh viên đã chuyển sang một tab hoặc cửa sổ khác.";
  }
  if (event === "window_blur" || /"kind"\s*:\s*"window_blur"/i.test(detailText)) {
    return "Hệ thống ghi nhận cửa sổ làm bài tạm thời mất tiêu điểm.";
  }
  if (event === "fullscreen_exit") {
    return "Hệ thống ghi nhận sinh viên đã thoát chế độ toàn màn hình.";
  }
  if (event.includes("mouse")) {
    return "Hệ thống ghi nhận tương tác chuột cần được đối chiếu.";
  }
  return "Hệ thống đã lưu sự kiện này để giảng viên đối chiếu khi cần.";
}

export default function ExamResultsList() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug : [];
  const routeId = params?.id;
  const examId = Array.isArray(routeId) ? routeId[0] : routeId || slug[1];
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/lecturer";

  const [examTitle, setExamTitle] = useState("Kết quả bài thi");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [overview, setOverview] = useState<ExamOverview | null>(null);
  const [manualStatus, setManualStatus] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let mounted = true;

    const fetchData = async (silent = false) => {
      if (!examId) {
        setLoading(false);
        return;
      }

      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [examRes, subsRes, overviewRes, manualStatusRes] = await Promise.all([
          api.getExam(examId),
          api.getExamSubmissions(examId, page, ITEMS_PER_PAGE),
          api.getExamOverview(examId),
          api.getExamManualGradingStatus(examId).catch(() => null),
        ]);

        if (!mounted) return;

        setExamTitle(examRes?.title || "Kết quả bài thi");
        setSubmissions(unwrapPaginatedData(subsRes));
        setTotalPages(subsRes?.totalPages ?? 1);
        setOverview(overviewRes || null);
        setManualStatus(manualStatusRes || null);
      } catch (err) {
        console.error("Không thể tải kết quả bài thi", err);
      } finally {
        if (!mounted) return;
        if (silent) {
          setIsRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    };

    fetchData();
    const intervalId = window.setInterval(() => fetchData(true), 10000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [examId, page]);

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    const name = s.student?.fullName || "";
    const sid = s.student?.studentId || "";
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      sid.toLowerCase().includes(search.toLowerCase())
    );
  });
  const manualBySubmission = new Map(
    (manualStatus?.submissions || []).map((row: any) => [row.submissionId, row]),
  );

  const handleExport = async (format = "csv") => {
    if (!examId) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(
        `${API_BASE_URL}/submissions/exam/${examId}/export`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) throw new Error("Xuất dữ liệu không thành công");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${examTitle.replace(/\s+/g, "_") || "exam"}-results.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Không thể xuất dữ liệu", err);
    }
  };

  const handlePublishResults = async () => {
    if (!examId) return;
    try {
      setIsPublishing(true);
      const nextStatus = await api.publishExamResults(examId);
      setManualStatus(nextStatus);
      const subsRes = await api.getExamSubmissions(examId, page, ITEMS_PER_PAGE);
      setSubmissions(unwrapPaginatedData(subsRes));
      toast.success("Đã công bố kết quả cho sinh viên.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể công bố kết quả.");
    } finally {
      setIsPublishing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-5 rounded-3xl bg-gradient-to-b from-slate-50/90 via-background to-background px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/90 p-5 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
              Phân tích bài thi
            </div>
            {overview?.analyticsScope ? (
              <StatusBadge
                status={overview.analyticsScope === "OFFICIAL" ? "published" : "available"}
                domain="exam"
              >
                {overview.analyticsScope === "OFFICIAL" ? "Phân tích chính thức" : "Phân tích bài luyện tập"}
              </StatusBadge>
            ) : null}
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Danh sách kết quả sinh viên — {examTitle}
            </h1>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
              {isRefreshing
                ? "Đang cập nhật dữ liệu..."
                : `Cập nhật lần cuối: ${overview?.updatedAt ? new Date(overview.updatedAt).toLocaleTimeString("vi-VN") : "Chưa có dữ liệu"}`}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button onClick={() => handleExport("csv")} className="shadow-sm">
              Xuất CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport("pdf")}
              className="border-slate-300 bg-background/80 shadow-sm"
            >
              Xuất PDF
            </Button>
          </div>
        </div>

        {manualStatus?.hasManualGrading ? (
          <Card
            className={
              manualStatus.manualPending > 0
                ? "border-amber-200 bg-amber-50/70 shadow-[0_16px_40px_-30px_rgba(180,83,9,0.45)]"
                : "border-emerald-200 bg-emerald-50/70 shadow-[0_16px_40px_-30px_rgba(5,150,105,0.35)]"
            }
          >
            <CardContent className="flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={
                    manualStatus.manualPending > 0
                      ? "rounded-xl bg-amber-100 p-2 text-amber-700"
                      : "rounded-xl bg-emerald-100 p-2 text-emerald-700"
                  }
                >
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    className={
                      manualStatus.manualPending > 0
                        ? "font-semibold text-amber-950"
                        : "font-semibold text-emerald-950"
                    }
                  >
                    {manualStatus.manualPending > 0
                      ? "Cần chấm thủ công"
                      : manualStatus.published
                        ? "Đã công bố kết quả"
                        : "Đã hoàn tất chấm thủ công"}
                  </h2>
                  <p
                    className={
                      manualStatus.manualPending > 0
                        ? "mt-1 text-sm text-amber-800"
                        : "mt-1 text-sm text-emerald-800"
                    }
                  >
                    Đã chấm {manualStatus.manualGraded}/{manualStatus.manualTotal} câu trả lời tự luận.
                    {manualStatus.published
                      ? " Kết quả đã được công bố cho sinh viên."
                      : manualStatus.manualPending > 0
                      ? ` Còn ${manualStatus.manualPending} câu cần nhập điểm và nhận xét.`
                      : " Tất cả câu tự luận đã sẵn sàng để công bố."}
                  </p>
                </div>
              </div>
              <Button
                onClick={handlePublishResults}
                disabled={!manualStatus.canPublish || isPublishing}
                className="gap-2 shadow-sm"
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Công bố kết quả
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          <Card className="border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
            <CardContent className="pt-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold tracking-tight">Phân bố điểm (trực tiếp)</h2>
                  <p className="text-xs text-muted-foreground">
                    Tổng quan nhanh về sự phân bố điểm của lớp.
                  </p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-muted-foreground">
                  Trung bình:{" "}
                  <span className="font-semibold text-foreground">
                    {overview?.summary?.avgScorePct ?? 0}%
                  </span>{" "}
                  | Cao nhất:{" "}
                  <span className="font-semibold text-foreground">
                    {overview?.summary?.highestScorePct ?? 0}%
                  </span>
                </div>
              </div>

              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overview?.scoreDistribution || []}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="hsl(var(--border))"
                      opacity={0.65}
                    />
                    <XAxis
                      dataKey="key"
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--background))",
                        boxShadow: "0 16px 30px -20px rgba(15, 23, 42, 0.45)",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <p className="text-muted-foreground">Đã hoàn thành</p>
                  <p className="mt-1 font-semibold text-emerald-700">
                    {overview?.summary?.completed ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
                  <p className="text-muted-foreground">Đang làm bài</p>
                  <p className="mt-1 font-semibold text-amber-700">
                    {overview?.summary?.inProgress ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                  <p className="text-muted-foreground">Tổng số</p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {overview?.summary?.totalSubmissions ?? 0}
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        <Card className="border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
            <CardContent className="pt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-full bg-amber-100 p-1.5 text-amber-700">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold tracking-tight">Dữ liệu giám sát cần xem xét</h2>
                  <p className="text-xs text-muted-foreground">
                    Chỉ là tín hiệu tham khảo, không phải kết luận gian lận tự động.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {(overview?.anomalies?.length || 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Chưa có dữ liệu giám sát cần xem xét.
                  </p>
                ) : (
                  overview?.anomalies?.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-background to-slate-50/70 p-3 shadow-sm"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">
                          {item.student?.fullName || "Không xác định sinh viên"}
                        </p>
                        <StatusBadge domain="severity" status={item.severity} />
                      </div>
                      <p className="text-sm font-medium text-slate-700">{getEventTypeLabel(item.eventType)}</p>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        {getAnomalyDescription(item.eventType, item.details)}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString("vi-VN")}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
        </Card>

        <Card className="overflow-hidden border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <CardContent className="p-0">
            <div className="border-b border-slate-200/80 bg-slate-50/70 px-5 py-4">
              <div className="relative max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên hoặc mã sinh viên"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-0 bg-background/90 pl-9 shadow-sm"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table className="border-separate border-spacing-0">
                <TableHeader className="bg-slate-50/80">
                  <TableRow className="border-b border-slate-200">
                    <TableHead className="bg-slate-50/80 font-semibold text-slate-600">
                      Tên sinh viên
                    </TableHead>
                    <TableHead className="bg-slate-50/80 font-semibold text-slate-600">
                      ID
                    </TableHead>
                    <TableHead className="bg-slate-50/80 font-semibold text-slate-600">
                      Điểm
                    </TableHead>
                    <TableHead className="bg-slate-50/80 font-semibold text-slate-600">
                      Thời gian làm bài
                    </TableHead>
                    <TableHead className="bg-slate-50/80 font-semibold text-slate-600">
                      Trạng thái
                    </TableHead>
                    <TableHead className="bg-slate-50/80 text-right font-semibold text-slate-600">
                      Chấm thủ công
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Chưa có lượt nộp bài nào cho kỳ thi này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((s) => {
                      const manualRow = manualBySubmission.get(s.id) as any;
                      const isManualCompleted = Boolean(manualRow?.completed);
                      const isPublished = Boolean(manualStatus?.published);
                      return (
                      <TableRow key={s.id} className="transition-colors hover:bg-slate-50/80">
                        <TableCell className="py-4">
                          <a
                            className="font-medium text-primary underline-offset-4 hover:underline"
                            onClick={() => router.push(`${basePath}/exam/${examId}/monitor`)}
                          >
                            {s.student?.fullName || "—"}
                          </a>
                        </TableCell>
                        <TableCell className="py-4 text-muted-foreground">
                          {s.student?.studentId || s.student?.id}
                        </TableCell>
                        <TableCell className="py-4 font-medium text-foreground">
                          {s.score != null
                            ? `${s.score}/${overview?.exam?.totalPoints ?? "-"}`
                            : "-"}
                        </TableCell>
                        <TableCell className="py-4 text-muted-foreground">
                          {formatTimeSpent(s.startedAt, s.submittedAt)}
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge domain="submission" status={s.status} />
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          {manualRow?.manualTotal > 0 ? (
                            <Button
                              size="sm"
                              variant={isManualCompleted ? "outline" : "default"}
                              className={
                                isManualCompleted
                                  ? "border-emerald-600 bg-emerald-600 text-white shadow-sm hover:border-emerald-700 hover:bg-emerald-700"
                                  : "shadow-sm"
                              }
                              onClick={() =>
                                router.push(`${basePath}/exam/${examId}/submissions/${s.id}/manual-grading`)
                              }
                            >
                              {isManualCompleted
                                ? isPublished
                                  ? "Xem điểm"
                                  : "Đã chấm - sửa lại"
                                : `Chấm còn ${manualRow.manualPending}/${manualRow.manualTotal}`}
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Chỉ chấm tự động</span>
                          )}
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <DataPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={submissions.length}
          onPageChange={setPage}
          itemLabel="lượt nộp"
          className="border-t-0 px-0"
        />
      </div>
    </DashboardLayout>
  );
}



