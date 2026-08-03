"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, usePathname } from "next/navigation";
import { DataPagination } from "@/components/common/DataPagination";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SearchBar } from "@/components/common/list/SearchBar";
import { FilterPanel } from "@/components/common/list/FilterPanel";
import { SortButton, type SortOrder } from "@/components/common/list/SortButton";
import { ActiveFilterChips } from "@/components/common/list/ActiveFilterChips";
import { sortItems } from "@/components/common/list/sort-utils";
import {
  FilterDefinition,
  FilterValues,
} from "@/components/common/list/filter-types";
import {
  getActiveFilterCount,
  getFilterChips,
} from "@/components/common/list/filter-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  Eye,
  Globe,
  RefreshCw,
  QrCode,
  Monitor,
  Flag,
  BarChart3,
  CheckCircle2,
  XCircle,
  Activity,
  MousePointerClick,
  Camera,
  ImageOff,
  Sparkles,
} from "lucide-react";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import api, { API_BASE_URL, unwrapPaginatedData } from "@/lib/api";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface StudentSession {
  id: string; // submission id when available, otherwise enrollment id
  submissionId: string | null;
  userId: string;
  name: string;
  studentId: string;
  status:
    | "in_progress"
    | "submitted"
    | "not_joined"
    | "flagged"
    | "disconnected";
  progress: number;
  score: number | null;
  tabSwitches: number;
  mouseAnomalies: number;
  integrityEvents: number;
  startedAt: string | null;
  submittedAt: string | null;
  flagReason: string | null;
}

interface IntegrityAlert {
  id: string;
  submissionId: string | null;
  studentName: string;
  type:
    | "tab_switch"
    | "similarity"
    | "timing"
    | "mouse_pattern"
    | "fullscreen_exit";
  message: string;
  severity: "low" | "warning" | "critical";
  time: string;
}

interface EvidenceCapture {
  id: string;
  status: "REQUESTED" | "UPLOADED" | "ANALYZING" | "ANALYZED" | "FAILED" | "PURGED";
  trigger: "SCHEDULED" | "SUSPICIOUS_EVENT";
  triggerDetails?: unknown;
  scheduledSlot?: number | null;
  scheduledAt?: string | null;
  capturedAt?: string | null;
  createdAt: string;
  aiTags?: Array<{ tag?: string; confidence?: number; note?: string }> | null;
  aiProvider?: string | null;
  aiAnalyzedAt?: string | null;
  aiError?: string | null;
  reviewStatus?: "PENDING" | "REVIEWED" | "DISMISSED" | null;
  reviewerNote?: string | null;
  reviewedAt?: string | null;
}

type ExamOverview = {
  exam?: { totalPoints?: number };
  anomalies?: Array<{
    id: string;
    eventType: string;
    details?: string;
    timestamp: string;
    severity: "low" | "medium" | "high";
    student?: { fullName?: string } | null;
    submissionId?: string | null;
  }>;
};

const mapSubmissionStatus = (status?: string): StudentSession["status"] => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "IN_PROGRESS") return "in_progress";
  if (normalized === "SUBMITTED" || normalized === "GRADED") return "submitted";
  if (normalized === "FLAGGED") return "flagged";
  return "not_joined";
};

const mapEventTypeToAlertType = (
  eventType?: string,
): IntegrityAlert["type"] => {
  const event = String(eventType || "").toLowerCase();
  if (event.includes("fullscreen")) return "fullscreen_exit";
  if (event.includes("tab")) return "tab_switch";
  if (event.includes("mouse")) return "mouse_pattern";
  if (event.includes("timing")) return "timing";
  return "similarity";
};

const EMPTY_STUDENT_FILTERS: FilterValues = {
  status: "all",
  riskLevel: "all",
};

const getRiskLevel = (session: StudentSession): "clean" | "watch" | "high" => {
  if (session.status === "flagged" || session.integrityEvents >= 5) {
    return "high";
  }
  if (session.integrityEvents >= 2) {
    return "watch";
  }
  return "clean";
};

const STUDENTS_PER_PAGE = 10;

export default function ExamMonitor() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug : [];
  const routeId = (params as any)?.id;
  const id = Array.isArray(routeId) ? routeId[0] : routeId || slug[1];
  const pathname = usePathname();
  const basePath = pathname.startsWith("/admin")
    ? "/admin"
    : "/lecturer";
  const [students, setStudents] = useState<StudentSession[]>([]);
  const [alerts, setAlerts] = useState<IntegrityAlert[]>([]);
  const [examTitle, setExamTitle] = useState("Live Exam Monitor");
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resolvedAlertIds, setResolvedAlertIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<FilterValues>(
    EMPTY_STUDENT_FILTERS,
  );
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(
    EMPTY_STUDENT_FILTERS,
  );
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [page, setPage] = useState(1);
  const [showScoreDialog, setShowScoreDialog] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(
    new Date().toLocaleTimeString(),
  );
  const eventSourceRef = useRef<EventSource | null>(null);

  const [riskFlags, setRiskFlags] = useState<any[]>([]);
  const [riskDialogSubmission, setRiskDialogSubmission] = useState<{ id: string; name: string } | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [riskResult, setRiskResult] = useState<any | null>(null);
  const [riskFlag, setRiskFlag] = useState<any | null>(null);
  const [riskError, setRiskError] = useState<string | null>(null);
  const [riskEligibility, setRiskEligibility] = useState<any | null>(null);
  const [riskEligibilityLoading, setRiskEligibilityLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [evidenceDialogSubmission, setEvidenceDialogSubmission] = useState<{ id: string; name: string } | null>(null);
  const [evidenceCaptures, setEvidenceCaptures] = useState<EvidenceCapture[]>([]);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [evidenceImageUrls, setEvidenceImageUrls] = useState<Record<string, string>>({});
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceImageLoading, setEvidenceImageLoading] = useState(false);
  const [evidenceReviewLoading, setEvidenceReviewLoading] = useState(false);
  const [evidenceReviewNote, setEvidenceReviewNote] = useState("");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const riskFlagsBySubmission = useMemo(() => {
    const map = new Map<string, any>();
    for (const flag of riskFlags) {
      const submissionId = flag?.job?.submissionId;
      if (submissionId && !map.has(submissionId)) {
        map.set(submissionId, flag);
      }
    }
    return map;
  }, [riskFlags]);

  const loadRiskFlags = async () => {
    if (!id) return;
    try {
      const flags = await api.listExamRiskFlags(id);
      setRiskFlags(flags || []);
    } catch {
      // Non-blocking: risk flags are supplementary to the core monitor view.
    }
  };

  const loadMonitorData = async (silent = false) => {
    if (!id) return;

    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);

      const [examRes, submissionsRes, overviewRes] = await Promise.all([
        api.getExam(id),
        api.getExamSubmissions(id, 1, 200),
        api.getExamOverview(id),
      ]);

      setExamTitle(examRes?.title || "Live Exam Monitor");

      const overview = (overviewRes || {}) as ExamOverview;
      const submissions = unwrapPaginatedData<any>(submissionsRes);

      const courseId = examRes?.courseId;
      let enrollments: any[] = [];
      if (courseId) {
        enrollments = await api.getCourseEnrollments(courseId);
      }

      const submissionByStudentId = new Map<string, any>();
      for (const submission of submissions) {
        if (submission?.student?.id) {
          submissionByStudentId.set(submission.student.id, submission);
        }
      }

      const anomalyBySubmissionId = new Map<
        string,
        { tab: number; mouse: number; all: number }
      >();
      for (const anomaly of overview.anomalies || []) {
        if (!anomaly?.submissionId) continue;
        const current = anomalyBySubmissionId.get(anomaly.submissionId) || {
          tab: 0,
          mouse: 0,
          all: 0,
        };
        const event = String(anomaly.eventType || "").toLowerCase();
        current.all += 1;
        if (event.includes("tab")) current.tab += 1;
        if (event.includes("mouse")) current.mouse += 1;
        anomalyBySubmissionId.set(anomaly.submissionId, current);
      }

      const joinedRows: StudentSession[] = enrollments.map((enrollment) => {
        const student = enrollment.student;
        const submission = student?.id
          ? submissionByStudentId.get(student.id)
          : null;
        const anomalyCount = submission?.id
          ? anomalyBySubmissionId.get(submission.id)
          : undefined;
        const status = submission
          ? mapSubmissionStatus(submission.status)
          : "not_joined";

        return {
          id: submission?.id || enrollment.id,
          submissionId: submission?.id || null,
          userId: student?.id || "",
          name: student?.fullName || "Unknown student",
          studentId: student?.studentId || "-",
          status,
          progress:
            status === "submitted"
              ? 100
              : status === "in_progress"
                ? Math.max(
                    1,
                    Math.min(
                      99,
                      Number(submission?.answers?.length || 0) > 0
                        ? Math.round(
                            (Number(submission.answers.length) /
                              Math.max(1, Number(examRes?._count?.examQuestions || 1))) *
                              100,
                          )
                        : 1,
                    ),
                  )
                : 0,
          score: submission?.score ?? null,
          tabSwitches:
            anomalyCount?.tab || Number(submission?.proctoring?.tabSwitchCount || 0),
          mouseAnomalies:
            anomalyCount?.mouse || Number(submission?.proctoring?.mouseAnomalies || 0),
          integrityEvents:
            anomalyCount?.all ||
            Number(submission?.proctoring?.tabSwitchCount || 0) +
              Number(submission?.proctoring?.mouseAnomalies || 0),
          startedAt: submission?.startedAt
            ? new Date(submission.startedAt).toLocaleTimeString()
            : null,
          submittedAt: submission?.submittedAt
            ? new Date(submission.submittedAt).toLocaleTimeString()
            : null,
          flagReason: status === "flagged" ? "Lượt nộp bị gắn cờ" : null,
        };
      });

      setStudents(joinedRows);

      const mappedAlerts: IntegrityAlert[] = (overview.anomalies || []).map(
        (anomaly) => ({
          id: anomaly.id,
          submissionId: anomaly.submissionId || null,
          studentName: anomaly.student?.fullName || "Unknown student",
          type: mapEventTypeToAlertType(anomaly.eventType),
          message:
            anomaly.details ||
            anomaly.eventType ||
            "Suspicious activity detected",
          severity:
            anomaly.severity === "high"
              ? "critical"
              : anomaly.severity === "low"
                ? "low"
                : "warning",
          time: new Date(anomaly.timestamp).toLocaleTimeString(),
        }),
      );
      setAlerts(mappedAlerts);
      setLastRefresh(new Date().toLocaleTimeString());
      if (process.env.NODE_ENV !== "production") {
        console.debug("[exam-monitor] fetched", {
          examId: id,
          sessions: joinedRows.length,
          violations: mappedAlerts.length,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load monitor data");
    } finally {
      if (silent) {
        setIsRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadMonitorData(false);
    loadRiskFlags();
  }, [id]);

  const openRiskDialog = async (submissionId: string, studentName: string) => {
    setRiskDialogSubmission({ id: submissionId, name: studentName });
    setRiskError(null);
    setReviewNotes("");
    setRiskEligibility(null);
    setRiskEligibilityLoading(true);
    const existingFlag = riskFlagsBySubmission.get(submissionId);
    if (existingFlag) {
      setRiskFlag(existingFlag);
      setRiskResult(existingFlag.job?.output || null);
    } else {
      setRiskFlag(null);
      setRiskResult(null);
    }

    try {
      const eligibility = await api.getExamRiskAssessmentEligibility(submissionId);
      setRiskEligibility(eligibility);
      if (eligibility.existingAssessment?.status === "SUCCEEDED" && eligibility.existingAssessment.output) {
        setRiskResult(eligibility.existingAssessment.output);
      }
      if (eligibility.existingAssessment?.status === "FAILED" && eligibility.existingAssessment.errorMessage) {
        setRiskError(eligibility.existingAssessment.errorMessage);
      }
    } catch (err: any) {
      setRiskError(err?.message || "Không thể kiểm tra điều kiện đánh giá rủi ro.");
    } finally {
      setRiskEligibilityLoading(false);
    }
  };

  const closeRiskDialog = () => {
    setRiskDialogSubmission(null);
    setRiskResult(null);
    setRiskFlag(null);
    setRiskError(null);
    setRiskEligibility(null);
    setRiskEligibilityLoading(false);
  };

  const openEvidenceDialog = async (submissionId: string, studentName: string) => {
    setEvidenceDialogSubmission({ id: submissionId, name: studentName });
    setEvidenceCaptures([]);
    setSelectedEvidenceId(null);
    setEvidenceReviewNote("");
    setEvidenceError(null);
    setEvidenceLoading(true);
    try {
      const captures = (await api.getEvidenceCaptures(submissionId)) as EvidenceCapture[];
      setEvidenceCaptures(captures);
      const firstAvailable = captures.find((capture) => capture.status !== "REQUESTED" && capture.status !== "PURGED");
      setSelectedEvidenceId(firstAvailable?.id || captures[0]?.id || null);
    } catch (err: any) {
      setEvidenceError(err?.message || "Không thể tải bằng chứng camera.");
    } finally {
      setEvidenceLoading(false);
    }
  };

  const closeEvidenceDialog = () => {
    Object.values(evidenceImageUrls).forEach((url) => URL.revokeObjectURL(url));
    setEvidenceDialogSubmission(null);
    setEvidenceCaptures([]);
    setSelectedEvidenceId(null);
    setEvidenceImageUrls({});
    setEvidenceReviewNote("");
    setEvidenceError(null);
  };

  const selectedEvidence = evidenceCaptures.find((capture) => capture.id === selectedEvidenceId) || null;

  useEffect(() => {
    if (!evidenceDialogSubmission || !selectedEvidence || evidenceImageUrls[selectedEvidence.id]) return;
    if (selectedEvidence.status === "REQUESTED" || selectedEvidence.status === "PURGED") return;
    let active = true;
    setEvidenceImageLoading(true);
    api.getEvidenceImageUrl(evidenceDialogSubmission.id, selectedEvidence.id)
      .then((url) => {
        if (active) setEvidenceImageUrls((current) => ({ ...current, [selectedEvidence.id]: url }));
        else URL.revokeObjectURL(url);
      })
      .catch((err: any) => active && setEvidenceError(err?.message || "Không thể tải ảnh bằng chứng."))
      .finally(() => active && setEvidenceImageLoading(false));
    return () => { active = false; };
  }, [evidenceDialogSubmission, evidenceImageUrls, selectedEvidence]);

  const reviewEvidence = async (reviewStatus: "REVIEWED" | "DISMISSED") => {
    if (!evidenceDialogSubmission || !selectedEvidence) return;
    setEvidenceReviewLoading(true);
    try {
      const updated = await api.reviewEvidenceCapture(evidenceDialogSubmission.id, selectedEvidence.id, {
        reviewStatus,
        reviewerNote: evidenceReviewNote.trim() || undefined,
      });
      setEvidenceCaptures((current) => current.map((capture) => capture.id === updated.id ? { ...capture, ...updated } : capture));
      toast.success(reviewStatus === "REVIEWED" ? "Đã đánh dấu bằng chứng là đã rà soát." : "Đã bỏ qua bằng chứng này.");
    } catch (err: any) {
      toast.error(err?.message || "Không thể cập nhật trạng thái rà soát.");
    } finally {
      setEvidenceReviewLoading(false);
    }
  };

  const formatEvidenceTime = (value?: string | null) => value ? new Date(value).toLocaleString("vi-VN") : "Chưa có";

  const handleGenerateRisk = async () => {
    if (!riskDialogSubmission || !riskEligibility?.eligible) return;
    setRiskLoading(true);
    setRiskError(null);
    try {
      const job = await api.generateExamRiskAssessment(riskDialogSubmission.id);
      setRiskResult(job?.output || null);
      setRiskFlag(job?.flag || null);
      await loadRiskFlags();
    } catch (err: any) {
          setRiskError(err?.message || "Không thể tạo đánh giá dấu hiệu rủi ro.");
    } finally {
      setRiskLoading(false);
    }
  };

  const handleReviewFlag = async (status: "REVIEWED" | "DISMISSED" | "CONFIRMED") => {
    if (!riskFlag?.id) return;
    try {
      const updated = await api.reviewExamRiskFlag(riskFlag.id, {
        status,
        notes: reviewNotes.trim() || undefined,
      });
      setRiskFlag((prev: any) => ({ ...prev, ...updated }));
      await loadRiskFlags();
      toast.success(
        status === "CONFIRMED"
          ? "Marked as needing further investigation."
          : status === "DISMISSED"
            ? "Flag dismissed."
            : "Flag marked as reviewed.",
      );
    } catch (err: any) {
      toast.error(err?.message || "Failed to update flag review status.");
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadMonitorData(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, id]);

  useEffect(() => {
    if (!id) return;
    const token = api.getToken();
    if (!token) return;

    const streamUrl = `${API_BASE_URL}/submissions/exam/${encodeURIComponent(id)}/events?token=${encodeURIComponent(token)}`;
    const source = new EventSource(streamUrl);
    eventSourceRef.current = source;

    const onIntegrity = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data || "{}");
        const eventType = String(data?.eventType || "unknown");
        const alertType = mapEventTypeToAlertType(eventType);
        const mapped: IntegrityAlert = {
          id: String(data?.id || `${Date.now()}-${Math.random()}`),
          submissionId: data?.submissionId || null,
          studentName: data?.student?.fullName || "Unknown student",
          type: alertType,
          message: data?.details || eventType,
          severity:
            data?.severity === "high"
              ? "critical"
              : data?.severity === "low"
                ? "low"
                : "warning",
          time: data?.timestamp
            ? new Date(data.timestamp).toLocaleTimeString()
            : new Date().toLocaleTimeString(),
        };

        setAlerts((prev) => {
          if (prev.some((a) => a.id === mapped.id)) return prev;
          return [mapped, ...prev].slice(0, 100);
        });

        if (mapped.submissionId) {
          setStudents((prev) =>
            prev.map((s) => {
              if (s.submissionId !== mapped.submissionId) return s;
              const next = { ...s };
              if (alertType === "tab_switch") {
                next.tabSwitches += 1;
                next.integrityEvents += 1;
              }
              if (alertType === "mouse_pattern") {
                next.mouseAnomalies += 1;
                next.integrityEvents += 1;
              }
              return next;
            }),
          );
        }
      } catch (e) {
        console.error("Failed to parse realtime integrity event", e);
      }
    };

    source.addEventListener("integrity", onIntegrity as EventListener);
    source.onerror = () => {
      // keep existing polling as fallback; EventSource auto-reconnects
      console.warn(
        "Realtime stream disconnected, fallback polling is still active.",
      );
    };

    return () => {
      source.removeEventListener("integrity", onIntegrity as EventListener);
      source.close();
      if (eventSourceRef.current === source) {
        eventSourceRef.current = null;
      }
    };
  }, [id]);

  const studentFilterDefinitions: FilterDefinition[] = useMemo(
    () => [
      {
        key: "status",
        label: "Status",
        type: "select",
        allLabel: "All status",
        options: [
          { label: "In Progress", value: "in_progress" },
          { label: "Submitted", value: "submitted" },
          { label: "Flagged", value: "flagged" },
          { label: "Not Joined", value: "not_joined" },
          { label: "Disconnected", value: "disconnected" },
        ],
      },
      {
        key: "riskLevel",
        label: "Integrity risk",
        type: "select",
        allLabel: "All risk levels",
        options: [
          { label: "Clean", value: "clean" },
          { label: "Watch", value: "watch" },
          { label: "High", value: "high" },
        ],
      },
    ],
    [],
  );

  const normalizedSearch = appliedSearch.trim().toLowerCase();
  const sortedStudents = useMemo(() => {
    const statusValue = appliedFilters.status as string | undefined;
    const riskValue = appliedFilters.riskLevel as string | undefined;

    const filtered = students.filter((student) => {
      const matchSearch = !normalizedSearch
        ? true
        : [student.name, student.studentId]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch);
      const matchStatus =
        !statusValue || statusValue === "all" || student.status === statusValue;
      const matchRisk =
        !riskValue || riskValue === "all"
          ? true
          : getRiskLevel(student) === riskValue;

      return matchSearch && matchStatus && matchRisk;
    });

    return sortItems(filtered, sortField, sortOrder);
  }, [appliedFilters, normalizedSearch, sortField, sortOrder, students]);

  const totalPages = Math.max(
    1,
    Math.ceil(sortedStudents.length / STUDENTS_PER_PAGE),
  );

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const paginatedStudents = useMemo(() => {
    const start = (page - 1) * STUDENTS_PER_PAGE;
    return sortedStudents.slice(start, start + STUDENTS_PER_PAGE);
  }, [page, sortedStudents]);

  const runSearch = () => {
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_STUDENT_FILTERS);
    setAppliedFilters(EMPTY_STUDENT_FILTERS);
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  };

  const removeFilter = (key: string) => {
    const nextFilters = { ...appliedFilters, [key]: EMPTY_STUDENT_FILTERS[key] };
    setAppliedFilters(nextFilters);
    setDraftFilters(nextFilters);
    setPage(1);
  };

  const activeFilterCount = getActiveFilterCount(
    appliedFilters,
    studentFilterDefinitions,
  );
  const activeFilterChips = getFilterChips(
    appliedFilters,
    studentFilterDefinitions,
  );

  const studentSortOptions = [
    { field: "name", label: "Name" },
    { field: "studentId", label: "Student ID" },
    { field: "status", label: "Status" },
    { field: "progress", label: "Progress" },
    { field: "tabSwitches", label: "Tab Switches" },
    { field: "mouseAnomalies", label: "Mouse Anomalies" },
    { field: "integrityEvents", label: "Integrity Events" },
  ];

  const stats = {
    total: students.length,
    inProgress: students.filter((s) => s.status === "in_progress").length,
    submitted: students.filter((s) => s.status === "submitted").length,
    flagged: students.filter((s) => s.status === "flagged").length,
    notJoined: students.filter((s) => s.status === "not_joined").length,
    disconnected: students.filter((s) => s.status === "disconnected").length,
  };

  const unresolvedAlerts = useMemo(
    () => alerts.filter((a) => !resolvedAlertIds.has(a.id)),
    [alerts, resolvedAlertIds],
  );

  const resolveAlert = (alertId: string) => {
    setResolvedAlertIds((prev) => new Set(prev).add(alertId));
  };

  const flagStudent = async (submissionId: string, reason: string) => {
    if (!submissionId) return;
    try {
      await api.updateSubmissionStatus(submissionId, "FLAGGED");
      await loadMonitorData(true);
      setStudents((prev) =>
        prev.map((s) =>
          s.submissionId === submissionId
            ? { ...s, status: "flagged", flagReason: reason }
            : s,
        ),
      );
    } catch (err) {
      console.error("Failed to flag submission", err);
    }
  };

  // Score distribution chart
  const submittedScores = students
    .filter((s) => s.score !== null)
    .map((s) => s.score!);
  const chartData = {
    labels: ["0-50", "51-60", "61-70", "71-80", "81-90", "91-100"],
    datasets: [
      {
        label: "Students",
        data: [
          submittedScores.filter((s) => s <= 50).length,
          submittedScores.filter((s) => s > 50 && s <= 60).length,
          submittedScores.filter((s) => s > 60 && s <= 70).length,
          submittedScores.filter((s) => s > 70 && s <= 80).length,
          submittedScores.filter((s) => s > 80 && s <= 90).length,
          submittedScores.filter((s) => s > 90).length,
        ],
        backgroundColor: "rgba(37, 99, 235, 0.7)",
        borderRadius: 4,
      },
    ],
  };

  const statusIcon = (status: StudentSession["status"]) => {
    switch (status) {
      case "in_progress":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "submitted":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "not_joined":
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case "flagged":
        return <Flag className="h-4 w-4 text-red-600" />;
      case "disconnected":
        return <XCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <BackToDashboardButton to={basePath} className="mb-4 -ml-2" />

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              {examTitle}
              <span className="ml-3 text-sm font-normal text-muted-foreground">
                (Exam #{id})
              </span>
            </h1>
            <p className="text-muted-foreground">
              Real-time monitoring of student sessions, integrity alerts, and
              score distribution
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div
              className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-green-500 animate-pulse" : "bg-muted"}`}
            />
            <span>Last refresh: {lastRefresh}</span>
            <Loader2
              className={`h-4 w-4 animate-spin ${isRefreshing ? "opacity-100" : "opacity-0"}`}
              aria-hidden={!isRefreshing}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-1"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${autoRefresh ? "animate-spin" : ""}`}
              />
              {autoRefresh ? "Auto" : "Manual"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadMonitorData(true)}
              className="gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`${basePath}/exam/${id}/qr`} className="gap-1">
                <QrCode className="h-3.5 w-3.5" /> Show QR
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowScoreDialog(true)}
              className="gap-1"
            >
              <BarChart3 className="h-3.5 w-3.5" /> Score Distribution
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-4 border-red-200">
            <CardContent className="pt-4 text-sm text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card className="mb-4">
            <CardContent className="pt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading monitor
              data...
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-6 gap-3 mb-6">
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-semibold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Activity className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-blue-600">
                {stats.inProgress}
              </p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-green-600">
                {stats.submitted}
              </p>
              <p className="text-[10px] text-muted-foreground">Submitted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Flag className="h-5 w-5 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-red-600">
                {stats.flagged}
              </p>
              <p className="text-[10px] text-muted-foreground">Flagged</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Clock className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
              <p className="text-xl font-semibold">{stats.notJoined}</p>
              <p className="text-[10px] text-muted-foreground">Not Joined</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <XCircle className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-semibold text-yellow-600">
                {stats.disconnected}
              </p>
              <p className="text-[10px] text-muted-foreground">Disconnected</p>
            </CardContent>
          </Card>
        </div>

        {/* Integrity Alerts */}
        {unresolvedAlerts.length > 0 && (
          <Card className="mb-6 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                Integrity Alerts ({unresolvedAlerts.length} unresolved)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {unresolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "border-red-300 bg-red-50"
                      : alert.severity === "warning"
                        ? "border-yellow-300 bg-yellow-50"
                        : "border-blue-300 bg-blue-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {alert.type === "tab_switch" && <Eye className="h-4 w-4" />}
                    {alert.type === "similarity" && (
                      <Shield className="h-4 w-4" />
                    )}
                    {alert.type === "timing" && <Clock className="h-4 w-4" />}
                    {alert.type === "mouse_pattern" && (
                      <MousePointerClick className="h-4 w-4" />
                    )}
                    {alert.type === "fullscreen_exit" && (
                      <Monitor className="h-4 w-4" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{alert.studentName}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {alert.time}
                    </span>
                    <StatusBadge
                      status={alert.severity}
                      domain="severity"
                    >
                      {alert.severity}
                    </StatusBadge>
                    {alert.submissionId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEvidenceDialog(alert.submissionId as string, alert.studentName)}
                      >
                        <Camera className="mr-1 h-3.5 w-3.5" />
                        Xem camera
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Student Sessions</CardTitle>
                </div>
                <div className="flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
                  <SearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    onSearch={runSearch}
                    placeholder="Search student name or student ID"
                    className="flex-1"
                  />
                  <SortButton
                    options={studentSortOptions}
                    value={sortField}
                    order={sortOrder}
                    onSortChange={(field, order) => {
                      setSortField(field);
                      setSortOrder(order);
                      setPage(1);
                    }}
                  />
                  <FilterPanel
                    title="Student filters"
                    description="Filter sessions by status and integrity risk level."
                    filters={studentFilterDefinitions}
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
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Student</TableHead>
                    <TableHead className="w-[22%]">Progress</TableHead>
                    <TableHead className="w-[12%] text-center">Tab Sw.</TableHead>
                    <TableHead className="w-[14%]">Status</TableHead>
                    <TableHead className="w-[8%] text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        No student sessions match your current search or filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((s) => (
                      <TableRow
                        key={s.id}
                        className={s.status === "flagged" ? "bg-red-50/50" : ""}
                      >
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {s.studentId}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-28">
                            <div className="mb-0.5 flex justify-between text-xs">
                              <span>{s.progress}%</span>
                              {s.score !== null && (
                                <span className="font-medium">{s.score}pts</span>
                              )}
                            </div>
                            <Progress value={s.progress} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-sm font-medium ${s.tabSwitches > 2 ? "text-red-600" : "text-muted-foreground"}`}
                          >
                            {s.tabSwitches}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {statusIcon(s.status)}
                            <StatusBadge status={s.status} domain="session">
                              {s.status.replace("_", " ")}
                            </StatusBadge>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {s.status === "in_progress" && s.submissionId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 text-xs"
                                onClick={() =>
                                  flagStudent(
                                    s.submissionId,
                                    "Manually flagged by instructor",
                                  )
                                }
                              >
                                <Flag className="mr-1 h-3.5 w-3.5" /> Flag
                              </Button>
                            )}
                            {s.submissionId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => openEvidenceDialog(s.submissionId as string, s.name)}
                              >
                                <Camera className="mr-1 h-3.5 w-3.5" />
                                Bằng chứng camera
                              </Button>
                            )}
                            {s.submissionId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={() => openRiskDialog(s.submissionId as string, s.name)}
                              >
                                <Eye className="mr-1 h-3.5 w-3.5" />
                                {riskFlagsBySubmission.has(s.submissionId) ? (
                                  <StatusBadge
                                    domain="severity"
                                    status={riskFlagsBySubmission.get(s.submissionId)?.job?.output?.riskLevel || "low"}
                                    className="ml-1"
                                  />
                                ) : (
                                  "Đánh giá rủi ro"
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={sortedStudents.length}
              onPageChange={setPage}
              itemLabel="students"
            />
          </Card>
        </div>

        <Dialog open={!!evidenceDialogSubmission} onOpenChange={(open) => !open && closeEvidenceDialog()}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Bằng chứng camera: {evidenceDialogSubmission?.name}
              </DialogTitle>
              <DialogDescription>
                Ảnh được lưu để hỗ trợ giảng viên rà soát. Nhãn AI chỉ là tín hiệu tham khảo, không kết luận gian lận.
              </DialogDescription>
            </DialogHeader>

            {evidenceLoading ? (
              <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bằng chứng camera...
              </div>
            ) : evidenceError && evidenceCaptures.length === 0 ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{evidenceError}</div>
            ) : evidenceCaptures.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <ImageOff className="mx-auto h-7 w-7 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">Chưa có ảnh bằng chứng</p>
                <p className="mt-1 text-xs text-muted-foreground">Hệ thống chưa nhận được ảnh camera từ lượt làm bài này.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="space-y-2 md:max-h-[560px] md:overflow-y-auto md:pr-1">
                  {evidenceCaptures.map((capture, index) => {
                    const isSelected = selectedEvidenceId === capture.id;
                    return (
                      <button
                        key={capture.id}
                        type="button"
                        onClick={() => { setSelectedEvidenceId(capture.id); setEvidenceReviewNote(capture.reviewerNote || ""); setEvidenceError(null); }}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">Lần chụp {index + 1}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${capture.reviewStatus === "REVIEWED" ? "bg-emerald-100 text-emerald-700" : capture.reviewStatus === "DISMISSED" ? "bg-muted text-muted-foreground" : "bg-amber-100 text-amber-700"}`}>
                            {capture.reviewStatus === "REVIEWED" ? "Đã rà soát" : capture.reviewStatus === "DISMISSED" ? "Đã bỏ qua" : "Chờ rà soát"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatEvidenceTime(capture.capturedAt || capture.scheduledAt || capture.createdAt)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{capture.trigger === "SCHEDULED" ? "Chụp theo lịch" : "Chụp khi có tín hiệu"}</p>
                      </button>
                    );
                  })}
                </div>

                {selectedEvidence && (
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg border bg-muted/20">
                      {evidenceImageLoading && !evidenceImageUrls[selectedEvidence.id] ? (
                        <div className="flex aspect-video items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải ảnh...</div>
                      ) : evidenceImageUrls[selectedEvidence.id] ? (
                        <img src={evidenceImageUrls[selectedEvidence.id]} alt={`Ảnh camera của ${evidenceDialogSubmission?.name}`} className="aspect-video w-full object-contain bg-black" />
                      ) : (
                        <div className="flex aspect-video flex-col items-center justify-center gap-2 text-sm text-muted-foreground"><ImageOff className="h-6 w-6" /> Ảnh không còn khả dụng</div>
                      )}
                    </div>

                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Thời gian chụp</p><p className="mt-1 font-medium">{formatEvidenceTime(selectedEvidence.capturedAt)}</p></div>
                      <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Nguồn kích hoạt</p><p className="mt-1 font-medium">{selectedEvidence.trigger === "SCHEDULED" ? "Theo lịch" : "Sự kiện đáng chú ý"}</p></div>
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="h-4 w-4 text-primary" /> Nhãn phân tích AI</p>
                      {selectedEvidence.status === "ANALYZING" ? <p className="mt-2 text-sm text-muted-foreground">Đang phân tích ảnh...</p> : selectedEvidence.aiError ? <p className="mt-2 text-sm text-red-600">{selectedEvidence.aiError}</p> : Array.isArray(selectedEvidence.aiTags) && selectedEvidence.aiTags.length > 0 ? <div className="mt-2 space-y-2">{selectedEvidence.aiTags.map((tag, index) => <div key={`${tag.tag}-${index}`} className="rounded-md bg-muted/50 p-2 text-sm"><span className="font-medium">{tag.tag || "Tín hiệu"}</span>{typeof tag.confidence === "number" && <span className="ml-2 text-xs text-muted-foreground">{Math.round(tag.confidence * 100)}%</span>}{tag.note && <p className="mt-1 text-xs text-muted-foreground">{tag.note}</p>}</div>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Chưa có nhãn AI cho ảnh này.</p>}
                    </div>

                    <div className="rounded-lg border p-3">
                      <p className="text-sm font-medium">Trạng thái rà soát</p>
                      <p className="mt-1 text-xs text-muted-foreground">{selectedEvidence.reviewStatus === "REVIEWED" ? `Đã rà soát ${formatEvidenceTime(selectedEvidence.reviewedAt)}` : selectedEvidence.reviewStatus === "DISMISSED" ? "Đã bỏ qua" : "Chưa được rà soát"}</p>
                      <Textarea value={evidenceReviewNote} onChange={(event) => setEvidenceReviewNote(event.target.value)} placeholder="Ghi chú rà soát (không bắt buộc)..." className="mt-3 min-h-[72px] text-sm" />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={evidenceReviewLoading} onClick={() => reviewEvidence("REVIEWED")}>Đánh dấu đã rà soát</Button>
                        <Button size="sm" variant="outline" disabled={evidenceReviewLoading} onClick={() => reviewEvidence("DISMISSED")}>Bỏ qua</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showScoreDialog} onOpenChange={setShowScoreDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Score Distribution
              </DialogTitle>
              <DialogDescription>
                Distribution for submitted students in exam {id}. Submitted count: {stats.submitted}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
                <div className="h-[360px] w-full">
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { stepSize: 1 },
                          title: { display: true, text: "Students" },
                        },
                        x: {
                          title: { display: true, text: "Score Range" },
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {stats.submitted > 0 ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Average
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {Math.round(
                        submittedScores.reduce((a, b) => a + b, 0) /
                          submittedScores.length,
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Highest
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-green-600">
                      {Math.max(...submittedScores)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/70 p-3">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Lowest
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-red-600">
                      {Math.min(...submittedScores)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  Score distribution will appear once students submit their exams.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!riskDialogSubmission} onOpenChange={(open) => !open && closeRiskDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Đánh giá dấu hiệu rủi ro — {riskDialogSubmission?.name}
              </DialogTitle>
              <DialogDescription>
                Công cụ này tổng hợp dữ liệu giám sát của lượt làm bài để hỗ trợ giảng viên rà soát.
                Đây chỉ là chỉ báo rủi ro, không phải kết luận sinh viên gian lận.
              </DialogDescription>
            </DialogHeader>

            {!riskResult && !riskLoading && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Dữ liệu được xem xét</p>
                  <p className="mt-1 leading-6">
                    Đổi tab, mất focus, thoát fullscreen, thao tác chuột và thời gian trả lời quá nhanh.
                    Hệ thống chỉ dùng các tín hiệu đã ghi nhận trong lượt làm bài này.
                  </p>
                </div>
                {riskEligibilityLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra dữ liệu giám sát...
                  </div>
                ) : riskEligibility?.eligible ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Chưa có kết quả đánh giá cho lượt làm bài này.
                    </p>
                    <Button onClick={handleGenerateRisk} className="gap-2" disabled={!riskDialogSubmission}>
                      Phân tích dấu hiệu rủi ro
                    </Button>
                  </>
                ) : riskEligibility ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                    {riskEligibility.reason || "Chưa đủ dữ liệu để đánh giá dấu hiệu rủi ro."}
                  </div>
                ) : null}
                {riskError && <p className="text-sm text-red-600">{riskError}</p>}
              </div>
            )}

            {riskLoading && (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" /> Đang phân tích dữ liệu giám sát...
              </div>
            )}

            {riskResult && !riskLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <StatusBadge domain="severity" status={riskResult.riskLevel?.toLowerCase()}>
                    Rủi ro {riskResult.riskLevel}
                  </StatusBadge>
                  <span className="text-sm text-muted-foreground">Điểm rủi ro: {riskResult.riskScore}/100</span>
                  {riskFlag?.status && (
                    <StatusBadge
                      domain="integrity"
                      status={riskFlag.status === "OPEN" ? "pending" : riskFlag.status.toLowerCase()}
                    />
                  )}
                </div>

                <p className="text-sm">{riskResult.explanation}</p>

                {Array.isArray(riskResult.signals) && riskResult.signals.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tín hiệu được ghi nhận
                    </p>
                    {riskResult.signals.map((sig: any, idx: number) => (
                      <div key={idx} className="rounded-md border border-border bg-muted/30 p-2 text-sm">
                        <span className="font-medium">{sig.type}:</span> {sig.description}
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Xử lý của giảng viên
                  </p>
                  <Textarea
                    placeholder="Ghi chú rà soát (không bắt buộc)..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="text-sm min-h-[60px]"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!riskFlag?.id}
                      onClick={() => handleReviewFlag("REVIEWED")}
                    >
                      Đã rà soát
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!riskFlag?.id}
                      onClick={() => handleReviewFlag("DISMISSED")}
                    >
                      Bỏ qua cảnh báo
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={!riskFlag?.id}
                      onClick={() => handleReviewFlag("CONFIRMED")}
                    >
                      Cần điều tra thêm
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


