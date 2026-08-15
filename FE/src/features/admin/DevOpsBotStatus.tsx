"use client";

import { useEffect, useState } from "react";
import { Bot, RefreshCw, Loader2, ShieldAlert } from "lucide-react";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { HelpedTitle } from "@/components/common/ContextHelp";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import api from "@/lib/api";

type DevopsStatus = Awaited<ReturnType<typeof api.getAdminDevopsStatus>>;

function BotActiveIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
      </span>
      <span className="text-xs font-medium text-success">Bot đang hoạt động</span>
    </div>
  );
}

export default function DevOpsBotStatus() {
  const [status, setStatus] = useState<DevopsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAdminDevopsStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được trạng thái DevOps");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardLayout>
      <AdminPageShell>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              <HelpedTitle
                help={{
                  description: "Xem nhanh trạng thái hạ tầng: provider AI đang dùng và danh sách lệnh bot Zalo hỗ trợ.",
                  usedBy: "Admin dùng để kiểm tra hệ thống mà không cần vào GitHub Actions hay nhắn bot.",
                  note: "Trang chỉ hiển thị thông tin (read-only) — không có nút bấm để build/deploy/restart từ đây.",
                }}
              >
                DevOps &amp; Bot
              </HelpedTitle>
            </h1>
            <p className="text-sm text-muted-foreground">
              Provider AI và bot vận hành qua Zalo — chỉ xem, không thao tác.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Làm mới
          </Button>
        </div>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {loading && !status ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : status ? (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Provider AI đang dùng</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-3">
                <StatusBadge tone="info">{status.ai.provider}</StatusBadge>
                <span className="text-sm text-muted-foreground">{status.ai.model}</span>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-[360px_1fr]">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Quét để nhắn bot</CardTitle>
                    <BotActiveIndicator />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-2">
                  <img
                    src="/zalo-bot-qr.jpg"
                    alt="Mã QR quan tâm bot Zalo ExamTrust Assistant"
                    className="w-full max-w-[320px] rounded-lg border"
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Bot ExamTrust Assistant
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4 text-primary" />
                    Lệnh bot Zalo hỗ trợ
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Nhắn đúng những lệnh này cho bot "ExamTrust Assistant" trên Zalo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="divide-y rounded-lg border">
                    {status.botCommands.map((item) => (
                      <div key={item.command} className="flex flex-col gap-1 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {item.command}
                        </code>
                        <span className="text-xs text-muted-foreground">{item.description}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 rounded-lg border border-warning/25 bg-warning/10 p-3">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
                    <p className="text-xs text-muted-foreground">
                      Các lệnh này gây hiệu ứng thật (build, deploy...) và chỉ phản hồi tài khoản Zalo được cấp quyền.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </AdminPageShell>
    </DashboardLayout>
  );
}
