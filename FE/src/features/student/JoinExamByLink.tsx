"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Link2, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';

export default function JoinExamByLink() {
  const { token: routeToken } = useParams();
  const token = Array.isArray(routeToken) ? routeToken[0] : routeToken;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [linkInfo, setLinkInfo] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const validate = useCallback(async () => {
    if (!token) {
      setError('Thiếu mã token');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const info = await api.validateExamLink(token);
      setLinkInfo(info);
    } catch (err: any) {
      setError(err?.message || 'Liên kết không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    validate();
  }, [validate]);

  const handleJoin = async () => {
    if (!token) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await api.joinExamByLink(token, { password });
      const joinUrl = res?.joinUrl || (linkInfo?.joinUrl as string);
      if (!joinUrl) {
        throw new Error('Không có URL tham gia');
      }
      router.push(joinUrl);
    } catch (err: any) {
      if (String(err?.message || '').toLowerCase().includes('unauthorized')) {
        setError('Vui lòng đăng nhập để tiếp tục.');
      } else {
        setError(err?.message || 'Không thể tham gia bài thi bằng liên kết này');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !linkInfo && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-4 w-4" /> Tham gia bài thi
            </CardTitle>
            <Button variant="outline" size="sm" onClick={validate} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Làm mới
            </Button>
          </div>
          <CardDescription>
            {linkInfo?.examTitle || 'Liên kết truy cập bài thi'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!linkInfo ? (
            <p className="text-sm text-muted-foreground">Liên kết không khả dụng.</p>
          ) : (
            <>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Khóa học: {linkInfo?.course?.code ? `${linkInfo.course.code} - ${linkInfo.course.name}` : linkInfo?.course?.name || '-'}</p>
                <p>Đã dùng: {linkInfo?.usedCount ?? 0}/{linkInfo?.maxUses ?? '∞'}</p>
                <p>Hết hạn: {linkInfo?.expiresAt ? new Date(linkInfo.expiresAt).toLocaleString() : 'Không hết hạn'}</p>
              </div>

              {linkInfo.requiresPassword && (
                <div className="space-y-2">
                  <Label>Mật khẩu</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu liên kết" />
                </div>
              )}

              <Button className="w-full gap-2" disabled={submitting} onClick={handleJoin}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Tham gia bài thi
              </Button>

              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">Đăng nhập</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
