"use client";

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Users,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import type { FlaggedSubmission, IntegrityReason } from '@/features/admin/IntegrityOverview';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface IntegrityCaseDetailProps {
  submission: FlaggedSubmission;
  onBack: () => void;
  onReview: (status: 'REVIEWED' | 'DISMISSED' | 'CONFIRMED', notes: string) => Promise<void>;
  isSaving?: boolean;
}

type IntegrityTimelineEvent = {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  severity: 'normal' | 'warning' | 'critical';
  detail?: string;
};

export function IntegrityCaseDetail({ submission, onBack, onReview, isSaving = false }: IntegrityCaseDetailProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const [integrityEvents, setIntegrityEvents] = useState<IntegrityTimelineEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState('');

  const getConfidenceLabel = (confidence: FlaggedSubmission['confidence']) => ({
    High: 'Cao',
    Medium: 'Trung bình',
    Low: 'Thấp',
  }[confidence] ?? confidence);

  const getReasonLabel = (type: IntegrityReason['type']) => ({
    similarity: 'Phát hiện tương đồng',
    timing: 'Phát hiện bất thường thời gian',
    pattern: 'Phát hiện mẫu bất thường',
    behavior: 'Phát hiện hành vi',
  }[type] ?? 'Tín hiệu cần xem xét');

  const translateEvidence = (value: string) => ({
    'Integrity event recorded': 'Đã ghi nhận sự kiện toàn vẹn',
    'events recorded': 'sự kiện đã được ghi nhận',
    'Fullscreen exit detected': 'Đã thoát chế độ toàn màn hình',
    'Tab switch detected': 'Đã chuyển sang tab khác',
    'Window focus lost': 'Cửa sổ làm bài mất tiêu điểm',
    'Window focus returned': 'Cửa sổ làm bài lấy lại tiêu điểm',
    'Copy event detected': 'Đã ghi nhận thao tác sao chép',
    'Paste event detected': 'Đã ghi nhận thao tác dán',
    'Mouse anomaly recorded': 'Đã ghi nhận bất thường chuột',
    'Mouse idle anomaly recorded': 'Đã ghi nhận chuột không hoạt động bất thường',
    'Face not detected': 'Không phát hiện khuôn mặt',
  }[value] ?? value);

  const getSeverityPresentation = (severity: IntegrityTimelineEvent['severity']) => {
    if (severity === 'critical') {
      return {
        label: 'Nghiêm trọng',
        rowClassName: 'border border-destructive/25 bg-destructive/10',
        badgeClassName: 'bg-destructive/15 text-destructive',
      };
    }

    return {
      label: 'Cảnh báo',
      rowClassName: 'border border-warning/25 bg-warning/10',
      badgeClassName: 'bg-warning/15 text-warning',
    };
  };

  const formatEventTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));

  useEffect(() => {
    let active = true;

    const loadIntegrityEvents = async () => {
      if (!submission.submissionId) {
        setIntegrityEvents([]);
        return;
      }

      setEventsLoading(true);
      setEventsError('');
      try {
        const timeline = await api.getSubmissionTimeline(submission.submissionId);
        const events = Array.isArray(timeline?.events) ? timeline.events : [];
        if (active) {
          setIntegrityEvents(events.filter((event: IntegrityTimelineEvent) => event.severity !== 'normal'));
        }
      } catch (error) {
        if (active) {
          setIntegrityEvents([]);
          setEventsError(error instanceof Error ? error.message : 'Không thể tải chi tiết sự kiện.');
        }
      } finally {
        if (active) setEventsLoading(false);
      }
    };

    loadIntegrityEvents();
    return () => {
      active = false;
    };
  }, [submission.submissionId]);

  const getReasonIcon = (type: IntegrityReason['type']) => {
    switch (type) {
      case 'similarity':
        return <Users className="h-4 w-4" />;
      case 'timing':
        return <Clock className="h-4 w-4" />;
      case 'pattern':
        return <FileText className="h-4 w-4" />;
      case 'behavior':
        return <Activity className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getReasonColor = (type: IntegrityReason['type']) => {
    switch (type) {
      case 'similarity':
        return 'text-destructive bg-destructive/10';
      case 'timing':
        return 'text-warning bg-warning/10';
      case 'pattern':
        return 'text-info bg-info/10';
      case 'behavior':
        return 'text-muted-foreground bg-muted';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalWeight = submission.reasons.reduce((sum, r) => sum + r.weight, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  Rà soát vụ việc toàn vẹn
                </h1>
                <StatusBadge
                  status={submission.confidence}
                  domain="confidence"
                >
                  Độ tin cậy {getConfidenceLabel(submission.confidence)}
                </StatusBadge>
              </div>
              <p className="text-muted-foreground mt-1">
                Mã vụ việc: {submission.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem bài nộp
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student & Exam Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin bài nộp</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Sinh viên</p>
                      <p className="font-medium">{submission.studentName}</p>
                      <p className="text-sm text-muted-foreground">{submission.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Bài thi</p>
                      <p className="font-medium">{submission.examTitle}</p>
                      <p className="text-sm text-muted-foreground">{submission.examId}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Thời điểm nộp</p>
                      <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                    </div>
                    {submission.similarityScore !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Điểm tương đồng</p>
                        <div className="flex items-center gap-3 mt-1">
                          <Progress value={submission.similarityScore} className="h-2 flex-1" />
                          <span className="text-sm font-semibold text-destructive">
                            {submission.similarityScore}%
                          </span>
                        </div>
                      </div>
                    )}
                    {submission.patternMatch && submission.patternMatch.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tương đồng với</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {submission.patternMatch.map((match) => (
                            <StatusBadge key={match} variant="default">
                              {match}
                            </StatusBadge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detection Reasons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phân tích phát hiện</CardTitle>
                <CardDescription>
                  Giải thích do AI tạo cho các tín hiệu cần rà soát của bài nộp này
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {submission.reasons.map((reason, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded flex items-center justify-center ${getReasonColor(reason.type)}`}>
                          {getReasonIcon(reason.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground capitalize">
                            {getReasonLabel(reason.type)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {translateEvidence(reason.description)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Trọng số</p>
                        <p className="font-semibold">
                          {Math.round((reason.weight / totalWeight) * 100)}%
                        </p>
                      </div>
                    </div>
                    {reason.evidence && (
                      <>
                        <Separator />
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-xs text-muted-foreground uppercase font-medium mb-1">
                            Bằng chứng
                          </p>
                          <p className="text-sm text-foreground">{translateEvidence(reason.evidence)}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">Chi tiết sự kiện nghi vấn</p>
                      <p className="text-sm text-muted-foreground">
                        Hiển thị từng sự kiện đã được ghi nhận, phục vụ việc rà soát của giảng viên.
                      </p>
                    </div>
                    {!eventsLoading ? <span className="text-sm font-medium text-muted-foreground">{integrityEvents.length} sự kiện</span> : null}
                  </div>

                  {eventsLoading ? (
                    <p className="mt-4 text-sm text-muted-foreground">Đang tải chi tiết sự kiện...</p>
                  ) : eventsError ? (
                    <p className="mt-4 text-sm text-destructive">{eventsError}</p>
                  ) : integrityEvents.length ? (
                    <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
                      {integrityEvents.map((event) => {
                        const severity = getSeverityPresentation(event.severity);
                        return (
                        <div key={event.id} className={`rounded-md px-3 py-2 ${severity.rowClassName}`}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-medium text-foreground">{translateEvidence(event.description)}</p>
                            <div className="flex shrink-0 items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severity.badgeClassName}`}>{severity.label}</span>
                              <time className="text-xs text-muted-foreground">{formatEventTime(event.timestamp)}</time>
                            </div>
                          </div>
                          {event.detail ? <p className="mt-1 text-xs text-muted-foreground">{translateEvidence(event.detail)}</p> : null}
                        </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">Không có sự kiện nghi vấn chi tiết để hiển thị.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phạm vi bằng chứng</CardTitle>
                <CardDescription>Chỉ các tín hiệu đã được ghi nhận ở trên mới được dùng để hỗ trợ quyết định. API chưa cung cấp dòng thời gian chi tiết.</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Đánh giá rủi ro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full ${
                    submission.confidence === 'High' 
                      ? 'bg-destructive/10 text-destructive' 
                      : submission.confidence === 'Medium'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    <AlertTriangle className="h-10 w-10" />
                  </div>
                  <p className="mt-3 text-lg font-semibold">Mức tín hiệu {getConfidenceLabel(submission.confidence)}</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.reasons.length} tín hiệu phát hiện
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Điểm tương đồng</span>
                    <span className="font-medium">{submission.similarityScore ?? 'Chưa có dữ liệu'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tín hiệu thời gian</span>
                    <span className="font-medium">{submission.timeAnomaly ? 'Có tín hiệu' : 'Không ghi nhận'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mẫu hành vi</span>
                    <span className="font-medium">{submission.patternMatch?.length ? submission.patternMatch.length : 'Chưa có dữ liệu'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Review Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quyết định rà soát</CardTitle>
                <CardDescription>Ghi nhận đánh giá của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Ghi chú rà soát
                  </label>
                  <Textarea
                    placeholder="Thêm ghi chú về kết quả rà soát..."
                    className="mt-2"
                    rows={4}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Button className="w-full" variant="destructive" disabled={isSaving} onClick={() => onReview('CONFIRMED', reviewNotes)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Xác nhận cần xử lý
                  </Button>
                  <Button className="w-full" variant="outline" disabled={isSaving} onClick={() => onReview('DISMISSED', reviewNotes)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Loại trừ tín hiệu
                  </Button>
                  <Button className="w-full" variant="ghost" disabled={isSaving} onClick={() => onReview('REVIEWED', reviewNotes)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Đánh dấu đã xem xét
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Student History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lịch sử sinh viên</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Lịch sử tổng hợp chưa được cung cấp bởi API và không được suy diễn từ tín hiệu hiện tại.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


