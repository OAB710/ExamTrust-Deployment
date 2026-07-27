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
import { useState } from 'react';

interface IntegrityCaseDetailProps {
  submission: FlaggedSubmission;
  onBack: () => void;
  onReview: (status: 'REVIEWED' | 'DISMISSED' | 'CONFIRMED', notes: string) => Promise<void>;
  isSaving?: boolean;
}

export function IntegrityCaseDetail({ submission, onBack, onReview, isSaving = false }: IntegrityCaseDetailProps) {
  const [reviewNotes, setReviewNotes] = useState('');

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
    return new Date(dateString).toLocaleDateString('en-US', {
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
                  Integrity Case Review
                </h1>
                <StatusBadge
                  status={submission.confidence}
                  domain="confidence"
                >
                  {submission.confidence} Confidence
                </StatusBadge>
              </div>
              <p className="text-muted-foreground mt-1">
                Case ID: {submission.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Submission
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student & Exam Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-medium">{submission.studentName}</p>
                      <p className="text-sm text-muted-foreground">{submission.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Exam</p>
                      <p className="font-medium">{submission.examTitle}</p>
                      <p className="text-sm text-muted-foreground">{submission.examId}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Submitted</p>
                      <p className="font-medium">{formatDate(submission.submittedAt)}</p>
                    </div>
                    {submission.similarityScore !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Similarity Score</p>
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
                        <p className="text-sm text-muted-foreground">Matched With</p>
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
                <CardTitle className="text-lg">Detection Analysis</CardTitle>
                <CardDescription>
                  AI-generated explanations for flagging this submission
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
                            {reason.type} Detection
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reason.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Weight</p>
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
                            Evidence
                          </p>
                          <p className="text-sm text-foreground">{reason.evidence}</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Phạm vi evidence</CardTitle>
                <CardDescription>Chỉ các tín hiệu đã được ghi nhận ở trên mới được dùng để hỗ trợ quyết định. Timeline chi tiết chưa được API cung cấp.</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Assessment</CardTitle>
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
                  <p className="mt-3 text-lg font-semibold">Mức tín hiệu {submission.confidence}</p>
                  <p className="text-sm text-muted-foreground">
                    {submission.reasons.length} detection signals
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
                <CardTitle className="text-lg">Review Decision</CardTitle>
                <CardDescription>Document your assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">
                    Review Notes
                  </label>
                  <Textarea
                    placeholder="Add notes about your review..."
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
                <CardTitle className="text-lg">Student History</CardTitle>
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


