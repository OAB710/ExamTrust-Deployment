"use client";

import { useEffect, useState } from "react";
import { DataPagination } from "@/components/common/DataPagination";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { HelpedTitle } from "@/components/common/ContextHelp";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  AlertTriangle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  MousePointerClick,
  Copy,
  Loader2,
} from "lucide-react";
import { IntegrityCaseDetail } from "@/components/admin/IntegrityCaseDetail";
import { ListPageHeader } from "@/components/common/list/ListPageHeader";
import { SearchBar } from "@/components/common/list/SearchBar";
import { FilterPanel } from "@/components/common/list/FilterPanel";
import { ActiveFilterChips } from "@/components/common/list/ActiveFilterChips";
import {
  FilterDefinition,
  FilterValues,
  TextFilterValue,
} from "@/components/common/list/filter-types";
import {
  getActiveFilterCount,
  getFilterChips,
} from "@/components/common/list/filter-utils";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export interface FlaggedSubmission {
  id: string;
  submissionId?: string;
  studentId: string;
  studentName: string;
  examId: string;
  examTitle: string;
  submittedAt: string;
  confidence: "High" | "Medium" | "Low";
  status: "pending" | "reviewed" | "dismissed" | "confirmed";
  reasons: IntegrityReason[];
  similarityScore?: number;
  timeAnomaly?: boolean;
  patternMatch?: string[];
}

export interface IntegrityReason {
  type: "similarity" | "timing" | "pattern" | "behavior";
  description: string;
  weight: number;
  evidence?: string;
}

type IntegrityStats = {
  totalFlagged: number;
  pendingReview: number;
  highConfidence: number;
  confirmedCases: number;
};

type IntegrityPatterns = {
  tabSwitch: number;
  mouseAnomaly: number;
  copyPaste: number;
  otherBehavior: number;
};

type IntegrityCasesResponse = {
  data?: FlaggedSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats?: IntegrityStats;
  patterns?: IntegrityPatterns;
};

const EMPTY_STATS: IntegrityStats = {
  totalFlagged: 0,
  pendingReview: 0,
  highConfidence: 0,
  confirmedCases: 0,
};

const EMPTY_PATTERNS: IntegrityPatterns = {
  tabSwitch: 0,
  mouseAnomaly: 0,
  copyPaste: 0,
  otherBehavior: 0,
};

const EMPTY_FILTERS: FilterValues = {
  confidence: "all",
  submittedAt: { from: undefined, to: undefined },
  timeAnomaly: undefined,
  examTitle: { value: "", operator: "contains" },
};

const INTEGRITY_ROWS_PER_VIEW = 10;

export default function IntegrityOverview({ lecturerScope = false }: { lecturerScope?: boolean }) {
  const { user } = useAuth();
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<FilterValues>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterValues>(EMPTY_FILTERS);
  const [selectedCase, setSelectedCase] = useState<FlaggedSubmission | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const [submissions, setSubmissions] = useState<FlaggedSubmission[]>([]);
  const [stats, setStats] = useState<IntegrityStats>(EMPTY_STATS);
  const [patterns, setPatterns] = useState<IntegrityPatterns>(EMPTY_PATTERNS);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    if (!lecturerScope && String(user?.role || '').toUpperCase() === 'LECTURER') router.replace('/lecturer/integrity');
  }, [lecturerScope, router, user?.role]);

  const reviewCase = async (status: 'REVIEWED' | 'DISMISSED' | 'CONFIRMED', notes: string) => {
    if (!selectedCase?.submissionId) return;
    setSavingReview(true);
    try {
      await api.reviewIntegrityCase(selectedCase.submissionId, { status, notes: notes || undefined });
      const nextStatus = status.toLowerCase() as FlaggedSubmission['status'];
      setSubmissions((items) => items.map((item) => item.id === selectedCase.id ? { ...item, status: nextStatus } : item));
      setSelectedCase(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save review result');
    } finally {
      setSavingReview(false);
    }
  };

  const integrityFilters: FilterDefinition[] = [
    {
      key: "confidence",
      label: "Confidence level",
      type: "select",
      allLabel: "All confidence levels",
      options: [
        { label: "Cao", value: "High" },
        { label: "Medium", value: "Medium" }, { label: "Low", value: "Low" },
      ],
    },
    {
      key: "examTitle",
      label: "Exam title",
      type: "text",
      placeholder: "Filter by exam title",
      operators: ["contains", "startsWith", "equals"],
      defaultOperator: "contains",
    },
    {
      key: "submittedAt",
      label: "Submission time",
      type: "date-range",
    },
    {
      key: "timeAnomaly",
      label: "Time anomaly",
      type: "boolean",
      trueLabel: "Signal detected", falseLabel: "No signal",
    },
  ];

  useEffect(() => {
    let mounted = true;

    const fetchCases = async () => {
      setLoading(true);
      setError(null);
      try {
        const examTitleFilter = appliedFilters.examTitle as
          | TextFilterValue
          | undefined;
        const submittedAtRange = appliedFilters.submittedAt as
          | { from?: string; to?: string }
          | undefined;
        const response = (await api.getIntegrityCases({
          page,
          limit: INTEGRITY_ROWS_PER_VIEW,
          search: appliedSearch || undefined,
          confidence: (appliedFilters.confidence as string | undefined) || "all",
          examTitle: examTitleFilter?.value?.trim() || undefined,
          submittedFrom: submittedAtRange?.from,
          submittedTo: submittedAtRange?.to,
          timeAnomaly: appliedFilters.timeAnomaly as boolean | undefined,
          status: activeTab,
        })) as IntegrityCasesResponse;

        if (!mounted) return;
        setSubmissions(Array.isArray(response.data) ? response.data : []);
        setStats(response.stats || EMPTY_STATS);
        setPatterns(response.patterns || EMPTY_PATTERNS);
        setTotalItems(response.pagination?.total || 0);
        setTotalPages(response.pagination?.totalPages || 1);
      } catch (err) {
        if (!mounted) return;
        setSubmissions([]);
        setStats(EMPTY_STATS);
        setPatterns(EMPTY_PATTERNS);
        setTotalItems(0);
        setTotalPages(1);
        setError(
          err instanceof Error ? err.message : "Unable to load cases requiring review",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCases();
    return () => {
      mounted = false;
    };
  }, [activeTab, appliedFilters, appliedSearch, page]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const INTEGRITY_ROW_HEIGHT = 64;
  const INTEGRITY_TABLE_HEADER_HEIGHT = 48;
  const INTEGRITY_TABLE_MIN_HEIGHT =
    INTEGRITY_ROWS_PER_VIEW * INTEGRITY_ROW_HEIGHT +
    INTEGRITY_TABLE_HEADER_HEIGHT;

  const activeFilterCount = getActiveFilterCount(
    appliedFilters,
    integrityFilters,
  );
  const activeFilterChips = getFilterChips(appliedFilters, integrityFilters);

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };
  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };
  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  };
  const removeFilter = (key: string) => {
    const nextFilters = {
      ...appliedFilters,
      [key]: EMPTY_FILTERS[key as keyof typeof EMPTY_FILTERS],
    };
    setAppliedFilters(nextFilters);
    setDraftFilters(nextFilters);
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const patternTotal = Math.max(
    1,
    patterns.tabSwitch +
      patterns.mouseAnomaly +
      patterns.copyPaste +
      patterns.otherBehavior,
  );

  const detectionPatterns = [
    {
      label: "Tab switches", description: "The student left or switched tabs during the exam session",
      value: patterns.tabSwitch,
      icon: Shield,
      className: "bg-warning/10 text-warning",
    },
    {
      label: "Pointer signals", description: "The pointer was inactive or showed unusual behavior",
      value: patterns.mouseAnomaly,
      icon: MousePointerClick,
      className: "bg-destructive/10 text-destructive",
    },
    {
      label: "Copy/paste events", description: "Clipboard interaction during the exam session",
      value: patterns.copyPaste,
      icon: Copy,
      className: "bg-info/10 text-info",
    },
    {
      label: "Other behavior signals", description: "Focus, full-screen, or monitoring events",
      value: patterns.otherBehavior,
      icon: TrendingUp,
      className: "bg-muted text-muted-foreground",
    },
  ];

  if (selectedCase) {
    return (
      <IntegrityCaseDetail
        submission={selectedCase}
        onBack={() => setSelectedCase(null)}
        onReview={reviewCase}
        isSaving={savingReview}
      />
    );
  }

  return (
    <DashboardLayout>
      <AdminPageShell>
        {lecturerScope ? <p className="mb-2 text-sm text-muted-foreground">Only signals from exams and courses you oversee are shown.</p> : null}
        <ListPageHeader title="Academic integrity" className="mb-4" />

        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={Shield}
            value={stats.totalFlagged}
            label="Total signals"
            iconWrapClassName="bg-warning/10"
            iconClassName="text-warning"
          />
          <AdminStatCard
            icon={Clock}
            value={stats.pendingReview}
            label="Pending review"
            iconWrapClassName="bg-info/10"
            iconClassName="text-info"
          />
          <AdminStatCard
            icon={AlertTriangle}
            value={stats.highConfidence}
            label="High-confidence signals"
            iconWrapClassName="bg-destructive/10"
            iconClassName="text-destructive"
          />
          <AdminStatCard
            icon={XCircle}
            value={stats.confirmedCases}
            label="Confirmed"
            iconWrapClassName="bg-destructive/10"
            iconClassName="text-destructive"
          />
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={runSearch}
              placeholder="Search by student or exam"
              className="flex-1"
            />
            <FilterPanel
              title="Integrity filters"
              description="Filter by confidence level, exam, submission date, and anomaly indicators."
              filters={integrityFilters}
              value={draftFilters}
              onValueChange={(key, nextValue) =>
                setDraftFilters((prev) => ({ ...prev, [key]: nextValue }))
              }
              onApply={applyFilters}
              onClear={clearFilters}
              activeCount={activeFilterCount}
            />
          </div>
          <ActiveFilterChips
            chips={activeFilterChips}
            onRemove={removeFilter}
            onClearAll={clearFilters}
          />
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs
              value={activeTab}
              onValueChange={(v) => {
                setActiveTab(v);
                setPage(1);
              }}
            >
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="pending">Pending review</TabsTrigger><TabsTrigger value="reviewed">Reviewed</TabsTrigger><TabsTrigger value="confirmed">Confirmed</TabsTrigger><TabsTrigger value="dismissed">Dismissed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                <div
                  className="overflow-hidden"
                  style={{ minHeight: INTEGRITY_TABLE_MIN_HEIGHT }}
                >
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead><TableHead>Exam</TableHead><TableHead>Submitted at</TableHead><TableHead>Confidence level</TableHead><TableHead>Status</TableHead><TableHead>Primary signals</TableHead><TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="py-10 text-center text-muted-foreground"
                            >
                              <div className="inline-flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading cases requiring review...
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="py-10 text-center text-destructive"
                            >
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : submissions.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={7}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No submissions with signals requiring review were found
                            </TableCell>
                          </TableRow>
                        ) : (
                          submissions.map((submission) => (
                            <TableRow key={submission.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {submission.studentName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {submission.studentId}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-foreground">
                                  {submission.examTitle}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground">
                                  {formatDate(submission.submittedAt)}
                                </p>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={submission.confidence}
                                  domain="confidence"
                                >
                                  {submission.confidence === "High" ? "High" : submission.confidence === "Medium" ? "Medium" : "Low"}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  status={submission.status}
                                  domain="integrity"
                                >
                                  {submission.status === "pending" ? "Pending review" : submission.status === "reviewed" ? "Reviewed" : submission.status === "confirmed" ? "Confirmed" : "Dismissed"}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <p className="text-sm text-muted-foreground max-w-xs truncate">
                                  {submission.reasons[0]?.description}
                                </p>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCase(submission)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={setPage}
              itemLabel="submissions requiring review"
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <HelpedTitle help={{
                  description: "A summary of common integrity-signal groups from exam-session data.",
                  usedBy: "Administrators and lecturers use it to identify which signal types occur most often.",
                  note: "This data supports review only; it is not a finding of misconduct.",
                }}>
                  Recorded signal groups
                </HelpedTitle>
              </CardTitle>
              <CardDescription>
                Common signal groups from exam-session data; this is not a finding of misconduct
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {detectionPatterns.map((pattern) => {
                const percentage = Math.round((pattern.value / patternTotal) * 100);
                return (
                  <div
                    key={pattern.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded flex items-center justify-center ${pattern.className}`}
                      >
                        <pattern.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pattern.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {pattern.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">
                      {percentage}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <HelpedTitle help={{
                  description: "Guidelines for reviewing academic-integrity evidence fairly.",
                  usedBy: "Use before confirming, dismissing, or escalating a case requiring review.",
                  note: "Always consider the exam, device, network, and lecturer-note context.",
                }}>
                  Review guidance
                </HelpedTitle>
              </CardTitle>
              <CardDescription>
                Principles for reviewing academic-integrity signals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">
                    Review all evidence before deciding
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Consider the full context, including exam conditions and the student's history
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">Document the basis for the decision</p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Add a note explaining why the case was confirmed or dismissed
                </p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">
                    Escalate unclear cases
                  </p>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Involve the academic committee in important or ambiguous cases
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPageShell>
    </DashboardLayout>
  );
}
