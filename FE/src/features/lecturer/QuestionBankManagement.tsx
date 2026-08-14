"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataPagination } from "@/components/common/DataPagination";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ContextHelp } from "@/components/common/ContextHelp";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Copy,
  ArrowLeft,
  BarChart3,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowUpDown,
  Database,
  Loader2,
  ChevronRight,
  FolderInput,
  ScanSearch,
  MoreHorizontal,
  Image,
  Music,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { unwrapPaginatedData } from "@/lib/api";
import {
  CANONICAL_QUESTION_TYPE_COUNT,
  canonicalQuestionType,
  difficultyLabel as getDifficultyLabel,
  formatDateSafe as formatQuestionDate,
  typeLabels as questionTypeLabels,
} from "./question-bank-utils";
import type { Question, QuestionDraftSummary } from "./question-bank-utils";
import { QuestionPreviewInfoCard as InfoCard, QuestionPreviewSection as Section } from "./components/QuestionPreviewSections";
import {
  courseFilterDefinitions,
  EMPTY_COURSE_FILTERS,
  EMPTY_QUESTION_FILTERS,
  filterAndSortQuestions,
  questionFilterDefinitions,
} from "./question-bank-filters";
import { useQuestionBankData } from "./hooks/useQuestionBankData";
import { useQuestionBankRouteState } from "./hooks/useQuestionBankRouteState";

const QUESTION_DRAFT_STORAGE_KEY = "question-draft";

// --- Utility helpers for preview modal ---

function safeParseJson(value: unknown): unknown {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeOptions(
  options: unknown,
): { id: string; text: string }[] {
  const raw = safeParseJson(options);
  if (!raw) return [];

  // Array of strings: ["A", "B", "C"]
  if (Array.isArray(raw) && raw.every((v) => typeof v === "string")) {
    return raw.map((text, i) => ({
      id: String.fromCharCode(65 + i),
      text,
    }));
  }

  // Array of objects: [{ id: "A", text: "..." }]
  if (Array.isArray(raw) && raw.every((v) => typeof v === "object" && v !== null)) {
    return raw.map((item: any, i) => ({
      id: item.id ?? String.fromCharCode(65 + i),
      text: item.text ?? item.label ?? JSON.stringify(item),
    }));
  }

  // Object: { "A": "Option A", "B": "Option B" }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return Object.entries(raw).map(([id, text]) => ({
      id,
      text: String(text ?? ""),
    }));
  }

  // Plain string
  if (typeof raw === "string") {
    return [{ id: "A", text: raw }];
  }

  return [];
}

function normalizeCorrectAnswer(
  correctAnswer: unknown,
): string[] {
  const raw = safeParseJson(correctAnswer);
  if (raw == null) return [];

  // Already an array
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v ?? ""));
  }

  // Object with optionId
    // Object with optionId
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.optionId) return [String(obj.optionId)];
    // Format: { answer: "B" } or { answer: "A,B,C" }
    if ("answer" in obj && obj.answer !== undefined && obj.answer !== null) {
      const ans = typeof obj.answer === "object" ? JSON.stringify(obj.answer) : String(obj.answer);
      return ans.includes(",") ? ans.split(",").map((s) => s.trim()) : [ans];
    }
    // Could be a key-value mapping like { "A": true }
    const keys = Object.entries(obj)
      .filter(([, v]) => v === true || v === "true" || v === 1 || v === "1")
      .map(([k]) => k);
    if (keys.length > 0) return keys;
    // Empty object or unrecognized object format (e.g. FILL_IN_BLANK with answers in content)
    return [];
  }

  // Boolean (True/False questions)
  if (typeof raw === "boolean") {
    return [raw ? "True" : "False"];
  }

  // Plain string
  return [String(raw)];
}

function formatDateSafe(value?: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

// Types that don't use options
const NO_OPTIONS_TYPES = new Set(["ESSAY", "SHORT_ANSWER"]);

function extractBlankAnswers(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const answers: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    answers.push(match[1].trim());
  }
  return answers;
}

function parseMatchingPairs(options: unknown): { left: string; right: string }[] {
  const raw = safeParseJson(options);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  const obj = raw as Record<string, unknown>;
  const left = Array.isArray(obj.left) ? obj.left.map(String) : [];
  const right = Array.isArray(obj.right) ? obj.right.map(String) : [];
  return left.map((l, i) => ({ left: l, right: right[i] || "" }));
}

function parseOrderingItems(options: unknown): string[] {
  const raw = safeParseJson(options);
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

function parseMatchingAnswers(correctAnswer: unknown): string[] {
  const raw = safeParseJson(correctAnswer);
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.pairs)) {
    return obj.pairs.map((p: any) => `${p.left || ""} → ${p.right || ""}`);
  }
  return [];
}

// --- Preview modal sub-components ---

export default function QuestionBankManagement() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = pathname.startsWith("/admin")
    ? "/admin"
    : "/lecturer";
  const questionEditorPath = `${basePath}/question-editor`;
  const { questions, setQuestions, courses, loading } = useQuestionBankData();
  const [courseSearchInput, setCourseSearchInput] = useState("");
  const [appliedCourseSearch, setAppliedCourseSearch] = useState("");
  const [questionSearchInput, setQuestionSearchInput] = useState("");
  const [appliedQuestionSearch, setAppliedQuestionSearch] = useState("");
  const [draftCourseFilters, setDraftCourseFilters] =
    useState<FilterValues>(EMPTY_COURSE_FILTERS);
  const [appliedCourseFilters, setAppliedCourseFilters] =
    useState<FilterValues>(EMPTY_COURSE_FILTERS);
  const [draftQuestionFilters, setDraftQuestionFilters] =
    useState<FilterValues>(EMPTY_QUESTION_FILTERS);
  const [appliedQuestionFilters, setAppliedQuestionFilters] =
    useState<FilterValues>(EMPTY_QUESTION_FILTERS);
  const [sortBy, setSortBy] = useState<"difficulty" | "points" | "updatedAt">("updatedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [detailQuestion, setDetailQuestion] = useState<Question | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] =
    useState<QuestionDraftSummary | null>(null);
  const [questionPage, setQuestionPage] = useState(1);
  const QUESTIONS_PER_PAGE = 12;
  const COURSES_PER_PAGE = 12;
  const [coursePage, setCoursePage] = useState(1);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [copySourceCourseId, setCopySourceCourseId] = useState<string>("");
  const [copyLoading, setCopyLoading] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [duplicateThresholdMin, setDuplicateThresholdMin] = useState(50);
  const [duplicateThresholdMax, setDuplicateThresholdMax] = useState(100);
  const [duplicatePairs, setDuplicatePairs] = useState<Array<{
    questionA: { id: string; type: string; content: string };
    questionB: { id: string; type: string; content: string };
    similarityPercent: number; matchMethod: 'EXACT' | 'TEXT' | 'AI'; reason: string;
  }>>([]);
  const [duplicateScanCount, setDuplicateScanCount] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [missingExplanationOnly, setMissingExplanationOnly] = useState(false);

  useQuestionBankRouteState({
    courses, questions, searchParams, selectedCourse, setSelectedCourse,
    setPreviewQuestion, setDetailQuestion, setDetailLoading, setDetailError,
  });

  useEffect(() => {
    try {
      const storedDraft = localStorage.getItem(QUESTION_DRAFT_STORAGE_KEY);
      setQuestionDraft(storedDraft ? JSON.parse(storedDraft) : null);
    } catch {
      setQuestionDraft(null);
    }
  }, []);

  useEffect(() => {
    // Use the stable generic API method so Fast Refresh does not retain an
    // older ApiClient prototype after this feature adds convenience methods.
    api.request<{ similarityThreshold: number }>('/questions/duplicate-preference')
      .then((preference) => setDuplicateThresholdMax(preference.similarityThreshold))
      .catch(() => undefined);
  }, []);

  const discardQuestionDraft = () => {
    localStorage.removeItem(QUESTION_DRAFT_STORAGE_KEY);
    setQuestionDraft(null);
  };

  const filteredBase = filterAndSortQuestions({
    questions,
    selectedCourse,
    search: appliedQuestionSearch,
    filters: appliedQuestionFilters,
    sortBy,
    sortDir,
  });
  const filtered = missingExplanationOnly
    ? filteredBase.filter((q) => !q.explanation || !q.explanation.trim())
    : filteredBase;

  // Course summary stats (based on the full course bank, not the current search/filter)
  const courseQuestions = selectedCourse
    ? questions.filter((q) => q.course?.code === selectedCourse)
    : [];
  const totalCourseQuestions = courseQuestions.length;
  const easyCount = courseQuestions.filter(
    (q) => getDifficultyLabel(q.difficulty || 1).text === "Dễ",
  ).length;
  const mediumCount = courseQuestions.filter(
    (q) => getDifficultyLabel(q.difficulty || 1).text === "Trung bình",
  ).length;
  const hardCount = courseQuestions.filter(
    (q) => getDifficultyLabel(q.difficulty || 1).text === "Khó",
  ).length;
  const totalPoints = courseQuestions.reduce((s, q) => s + (q.points || 0), 0);
  const avgPoints =
    totalCourseQuestions > 0 ? (totalPoints / totalCourseQuestions).toFixed(1) : "0";
  const distinctTypesUsed = new Set(
    courseQuestions.map((q) => canonicalQuestionType(q.type)),
  ).size;
  const missingExplanationCount = courseQuestions.filter(
    (q) => !q.explanation || !q.explanation.trim(),
  ).length;
  const withMediaCount = courseQuestions.filter((q) => !!q.mediaType).length;
  const difficultyPct = (count: number) =>
    totalCourseQuestions > 0 ? Math.round((count / totalCourseQuestions) * 100) : 0;

  const handleDelete = async (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleteLoading(true);
    try {
      await api.deleteQuestion(deleteTargetId);
      setQuestions((prev) => prev.filter((q) => q.id !== deleteTargetId));
      toast.success("Đã xóa câu hỏi");
    } catch (error) {
      console.error("Failed to delete question:", error);
      toast.error("Xóa câu hỏi thất bại");
    } finally {
      setDeleteLoading(false);
      setDeleteTargetId(null);
    }
  };

  const handleDuplicate = async (q: Question) => {
    try {
      const newQuestion = await api.saveQuestion({
        sourceQuestionId: q.id,
        type: q.type,
        content: `[Copy] ${q.content}`,
        difficulty: q.difficulty,
        points: q.points,
        courseId: q.course?.code
          ? courses.find((c) => c.code === q.course?.code)?.id
          : undefined,
      });
      setQuestions((prev) => [newQuestion, ...prev]);
    } catch (error) {
      console.error("Failed to duplicate question:", error);
    }
  };

  const handleCopyQuestionBank = async () => {
    const targetCourse = courses.find((c) => c.code === selectedCourse);
    if (!targetCourse || !copySourceCourseId) return;

    setCopyLoading(true);
    try {
      const result = await api.copyQuestionBank({
        sourceCourseId: copySourceCourseId,
        targetCourseId: targetCourse.id,
      });
      toast.success(
        `Đã sao chép ${result.copied} câu hỏi${
          result.skipped > 0 ? `, bỏ qua ${result.skipped} câu trùng` : ""
        }.`,
      );
      setCopyDialogOpen(false);
      setCopySourceCourseId("");

      const firstPage = await api.listQuestions({ page: 1, limit: 100 });
      const firstPageQuestions = unwrapPaginatedData<Question>(firstPage);
      const pages = Math.max(1, Number(firstPage?.pagination?.totalPages ?? 1));
      if (pages === 1) {
        setQuestions(firstPageQuestions);
      } else {
        const remainingPages = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            api.listQuestions({ page: i + 2, limit: 100 }),
          ),
        );
        setQuestions([
          ...firstPageQuestions,
          ...remainingPages.flatMap((response) =>
            unwrapPaginatedData<Question>(response),
          ),
        ]);
      }
    } catch (error) {
      console.warn("Failed to copy question bank:", (error as Error)?.message ?? error);
      toast.error("Sao chép ngân hàng câu hỏi thất bại. Vui lòng thử lại.");
    } finally {
      setCopyLoading(false);
    }
  };

  const handleDuplicateScan = async () => {
    const courseId = courses.find((course) => course.code === selectedCourse)?.id;
    if (!courseId) {
      toast.error("Vui lòng chọn học phần trước khi lọc câu trùng lặp.");
      return;
    }
    setDuplicateDialogOpen(true);
    setDuplicateLoading(true);
    try {
      const result = await api.request<{
        scannedQuestionCount: number;
        pairs: typeof duplicatePairs;
      }>('/questions/duplicate-check', { method: 'POST', body: { courseId } });
      setDuplicatePairs(result.pairs);
      setDuplicateScanCount(result.scannedQuestionCount);
    } catch (error) {
      console.warn("Failed to check duplicate questions", error);
      toast.error("Không thể quét câu hỏi trùng lặp. Vui lòng thử lại.");
    } finally {
      setDuplicateLoading(false);
    }
  };

  const saveDuplicateThreshold = async (min: number, max: number) => {
    const nextMin = Math.max(0, Math.min(100, min));
    const nextMax = Math.max(nextMin, Math.min(100, max));
    setDuplicateThresholdMin(nextMin);
    setDuplicateThresholdMax(nextMax);
    try {
      await api.request('/questions/duplicate-preference', {
        method: 'PATCH', body: { similarityThreshold: nextMax },
      });
    } catch {
      toast.error("Không thể lưu ngưỡng tương đồng.");
    }
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(col);
      setSortDir("desc");
    }
  };

  // Group questions by course
  const groupQuestionsByCourse = (questions: Question[]) => {
    return questions.reduce(
      (acc, question) => {
        const courseCode = question.course?.code || "Uncategorized";
        if (!acc[courseCode]) {
          acc[courseCode] = [];
        }
        acc[courseCode].push(question);
        return acc;
      },
      {} as Record<string, Question[]>,
    );
  };

  const gradientClasses = [
    "bg-gradient-to-br from-pink-400 to-pink-600",
    "bg-gradient-to-br from-purple-400 to-indigo-600",
    "bg-gradient-to-br from-blue-400 to-cyan-600",
    "bg-gradient-to-br from-green-400 to-emerald-600",
    "bg-gradient-to-br from-yellow-400 to-orange-600",
    "bg-gradient-to-br from-red-400 to-pink-600",
    "bg-gradient-to-br from-gray-400 to-gray-600",
  ];

  const getGradientClass = (index: number): string => {
    return gradientClasses[index % gradientClasses.length];
  };

  // Stats
  const avgDifficulty =
    questions.length > 0
      ? (
          questions.reduce((s, q) => s + (q.difficulty || 1), 0) /
          questions.length
        ).toFixed(1)
      : "0";

  const normalizedCourseSearch = appliedCourseSearch.trim().toLowerCase();
  const visibleCourses = courses.filter((course) => {
    const questionState = appliedCourseFilters.questionState as string | undefined;
    const difficultyValue = appliedCourseFilters.difficulty as string | undefined;

    const haystack = `${course.code} ${course.name} ${course.faculty || ""}`
      .toLowerCase()
      .trim();

    const searchMatched = !normalizedCourseSearch
      ? true
      : haystack.includes(normalizedCourseSearch);
    if (!searchMatched) return false;

    const courseQuestions = questions.filter((q) => q.course?.code === course.code);

    if (questionState === "hasQuestions" && courseQuestions.length === 0)
      return false;
    if (questionState === "noQuestions" && courseQuestions.length > 0)
      return false;

    if (!difficultyValue || difficultyValue === "all") return true;
    if (courseQuestions.length === 0) return false;

    const avgDiff =
      courseQuestions.reduce((sum, q) => sum + (q.difficulty || 1), 0) /
      courseQuestions.length;
    return getDifficultyLabel(avgDiff).text.toLowerCase() === difficultyValue;
  });

  const activeCourseFilterCount = getActiveFilterCount(
    appliedCourseFilters,
    courseFilterDefinitions,
  );
  const activeCourseFilterChips = getFilterChips(
    appliedCourseFilters,
    courseFilterDefinitions,
  );
  const activeQuestionFilterCount = getActiveFilterCount(
    appliedQuestionFilters,
    questionFilterDefinitions,
  );
  const activeQuestionFilterChips = getFilterChips(
    appliedQuestionFilters,
    questionFilterDefinitions,
  );

  const runCourseSearch = () => setAppliedCourseSearch(courseSearchInput.trim());
  const applyCourseFilters = () => setAppliedCourseFilters(draftCourseFilters);
  const clearCourseFilters = () => {
    setDraftCourseFilters(EMPTY_COURSE_FILTERS);
    setAppliedCourseFilters(EMPTY_COURSE_FILTERS);
    setCourseSearchInput("");
    setAppliedCourseSearch("");
  };
  const removeCourseFilter = (key: string) => {
    const nextFilters = {
      ...appliedCourseFilters,
      [key]: EMPTY_COURSE_FILTERS[key as keyof typeof EMPTY_COURSE_FILTERS],
    };
    setAppliedCourseFilters(nextFilters);
    setDraftCourseFilters(nextFilters);
  };

  const runQuestionSearch = () =>
    setAppliedQuestionSearch(questionSearchInput.trim());
  const applyQuestionFilters = () =>
    setAppliedQuestionFilters(draftQuestionFilters);
  const clearQuestionFilters = () => {
    setDraftQuestionFilters(EMPTY_QUESTION_FILTERS);
    setAppliedQuestionFilters(EMPTY_QUESTION_FILTERS);
    setQuestionSearchInput("");
    setAppliedQuestionSearch("");
  };
  const removeQuestionFilter = (key: string) => {
    const nextFilters = {
      ...appliedQuestionFilters,
      [key]:
        EMPTY_QUESTION_FILTERS[key as keyof typeof EMPTY_QUESTION_FILTERS],
    };
    setAppliedQuestionFilters(nextFilters);
    setDraftQuestionFilters(nextFilters);
  };

  useEffect(() => {
    setCoursePage(1);
  }, [appliedCourseSearch, appliedCourseFilters, questions.length]);

  useEffect(() => {
    setQuestionPage(1);
  }, [
    selectedCourse,
    appliedQuestionSearch,
    appliedQuestionFilters,
    sortBy,
    sortDir,
    missingExplanationOnly,
  ]);

  useEffect(() => {
    setMissingExplanationOnly(false);
  }, [selectedCourse]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminPageShell backTo={basePath}>
        {questionDraft ? (
          <div className="mb-5 rounded-xl border border-warning/30 bg-warning/10 p-4 text-warning">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold">Có bản nháp câu hỏi chưa lưu</p>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground">
                    {questionDraft.content?.trim() || "Bản nháp chưa có nội dung câu hỏi."}
                  </p>
                  {questionDraft.savedAt ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Lưu tự động lúc {formatDateSafe(questionDraft.savedAt)}
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `${questionEditorPath}?restoreDraft=1${
                        selectedCourse
                          ? `&courseCode=${encodeURIComponent(selectedCourse)}`
                          : ""
                      }`,
                    )
                  }
                >
                  Mở bản nháp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={discardQuestionDraft}
                >
                  Xóa bản nháp
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* COURSE SELECTION VIEW */}
        {!selectedCourse ? (
          <>
            <ListPageHeader
              title="Ngân hàng câu hỏi"
              className="mb-6"
              actions={
                <Button
                  className="gap-2"
                  onClick={() => router.push(questionEditorPath)}
                >
                  <Plus className="h-4 w-4" /> Câu hỏi mới
                </Button>
              }
            />

            {/* Stats Row */}
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-8">
              <AdminStatCard
                icon={Database}
                value={questions.length}
                label="Tổng số câu hỏi"
              />
              <AdminStatCard
                icon={CheckCircle2}
                value={courses.length}
                label="Khóa học"
                iconWrapClassName="bg-green-100"
                iconClassName="text-green-600"
              />
              <AdminStatCard
                icon={BarChart3}
                value={avgDifficulty}
                label="Độ khó TB"
                iconWrapClassName="bg-blue-100"
                iconClassName="text-blue-600"
              />
              <AdminStatCard
                icon={Tag}
                value={
                  Object.keys(questionTypeLabels).filter((t) =>
                    questions.some((q) => q.type === t),
                  ).length
                }
                label="Loại câu hỏi"
                iconWrapClassName="bg-purple-100"
                iconClassName="text-purple-600"
              />
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <SearchBar
                  value={courseSearchInput}
                  onChange={setCourseSearchInput}
                  onSearch={runCourseSearch}
                  placeholder="Tìm khóa học theo mã, tên hoặc khoa"
                  className="min-w-0 flex-1"
                />
                <FilterPanel
                  title="Bộ lọc khóa học"
                  description="Lọc khóa học theo trạng thái câu hỏi và độ khó trung bình."
                  filters={courseFilterDefinitions}
                  value={draftCourseFilters}
                  onValueChange={(key, nextValue) =>
                    setDraftCourseFilters((prev) => ({
                      ...prev,
                      [key]: nextValue,
                    }))
                  }
                  onApply={applyCourseFilters}
                  onClear={clearCourseFilters}
                  activeCount={activeCourseFilterCount}
                  className="shrink-0"
                />
              </div>
              <ActiveFilterChips
                chips={activeCourseFilterChips}
                onRemove={removeCourseFilter}
                onClearAll={clearCourseFilters}
              />
            </div>

            {/* Course row pagination */}
            {(() => {
              const courseTotalPages = Math.max(
                1,
                Math.ceil(visibleCourses.length / COURSES_PER_PAGE),
              );
              const paginatedCourses = visibleCourses.slice(
                (coursePage - 1) * COURSES_PER_PAGE,
                coursePage * COURSES_PER_PAGE,
              );
              return (
                <>
                  <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="hidden border-b bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(240px,1.35fr)_120px_140px_minmax(220px,1fr)_24px] md:items-center md:gap-4">
                      <span>Khóa học</span>
                      <span>Câu hỏi</span>
                      <span>Độ khó TB</span>
                      <span>Loại câu hỏi</span>
                      <span className="sr-only">Mở</span>
                    </div>
                    <div className="divide-y">
                    {paginatedCourses.map((course, index) => {
                      const courseQuestions = questions.filter(
                        (q) => q.course?.code === course.code,
                      );
                      const questionTypes = [
                        ...new Set(courseQuestions.map((q) => q.type)),
                      ];
                      const avgDiff =
                        courseQuestions.length > 0
                          ? courseQuestions.reduce(
                              (s, q) => s + (q.difficulty || 1),
                              0,
                            ) / courseQuestions.length
                          : 0;
                      const diffInfo = getDifficultyLabel(avgDiff);
                      return (
                        <button
                          type="button"
                          key={course.id}
                          className="group grid w-full gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[minmax(240px,1.35fr)_120px_140px_minmax(220px,1fr)_24px] md:items-center"
                          onClick={() => setSelectedCourse(course.code)}
                          aria-label={`Mở ngân hàng câu hỏi của ${course.code}`}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white shadow-sm ${getGradientClass((coursePage - 1) * COURSES_PER_PAGE + index)}`}
                            >
                              {course.code.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-foreground">
                                {course.name}
                              </p>
                              <p className="truncate text-sm text-muted-foreground">
                                {course.code}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 text-sm md:block">
                            <span className="text-muted-foreground md:hidden">
                              Câu hỏi
                            </span>
                            <span className="font-semibold tabular-nums text-foreground">
                              {courseQuestions.length}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 text-sm md:block">
                            <span className="text-muted-foreground md:hidden">
                              Độ khó TB
                            </span>
                            <span className={`font-medium ${diffInfo.color}`}>
                              {courseQuestions.length > 0 ? diffInfo.text : "—"}
                            </span>
                          </div>

                          <div className="flex min-w-0 items-start justify-between gap-3 md:block">
                            <span className="shrink-0 text-sm text-muted-foreground md:hidden">
                              Loại câu hỏi
                            </span>
                            <div className="flex flex-wrap justify-end gap-1.5 md:justify-start">
                              {questionTypes.length === 0 && (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                              {questionTypes.slice(0, 3).map((type) => (
                                <span
                                  key={type}
                                  className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground"
                                >
                                  {questionTypeLabels[type] || type}
                                </span>
                              ))}
                              {questionTypes.length > 3 && (
                                <span className="self-center text-xs text-muted-foreground">
                                  +{questionTypes.length - 3} loại khác
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="hidden h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground md:block" />
                        </button>
                      );
                    })}
                    </div>
                  </div>
                  <DataPagination
                    currentPage={coursePage}
                    totalPages={courseTotalPages}
                    totalItems={visibleCourses.length}
                    onPageChange={setCoursePage}
                    itemLabel="khóa học"
                    className="border-t-0 px-0 pt-2"
                    syncUrl={false}
                  />
                </>
              );
            })()}

            {courses.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Chưa có khóa học</p>
                <p className="text-sm">
                  Tạo khóa học trước để bắt đầu thêm câu hỏi.
                </p>
              </div>
            )}

            {courses.length > 0 && visibleCourses.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Không tìm thấy khóa học</p>
                <p className="text-sm">
                  Thử từ khóa khác cho mã hoặc tên khóa học.
                </p>
              </div>
            )}
          </>
        ) : (
          /* QUESTION LIST VIEW (after selecting a course) */
          <>
            <div className="flex items-start justify-between mb-6 flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setSelectedCourse(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground mb-0.5">
                    {selectedCourse} — Ngân hàng câu hỏi
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {courses.find((c) => c.code === selectedCourse)?.name || ""}{" "}
                    • {filtered.length} câu hỏi
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    const courseId = courses.find((course) => course.code === selectedCourse)?.id;
                    router.push(
                      `${basePath}/question-history?courseCode=${encodeURIComponent(selectedCourse)}${courseId ? `&courseId=${encodeURIComponent(courseId)}` : ""}`,
                    );
                  }}
                >
                  <BarChart3 className="h-4 w-4" /> Phân tích
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => setCopyDialogOpen(true)}
                >
                  <FolderInput className="h-4 w-4" /> Sao chép từ khóa học khác
                </Button>
                <Button variant="outline" className="gap-2" onClick={handleDuplicateScan}>
                  <ScanSearch className="h-4 w-4" /> Lọc câu trùng lặp
                </Button>
                <Button
                  className="gap-2"
                  onClick={() =>
                    router.push(
                      `${questionEditorPath}?courseCode=${selectedCourse}`,
                    )
                  }
                >
                  <Plus className="h-4 w-4" /> Câu hỏi mới
                </Button>
              </div>
            </div>

            {totalCourseQuestions > 0 && (
              <div className="grid gap-4 lg:grid-cols-3 mb-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">
                      Phân bố độ khó
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {totalCourseQuestions} câu hỏi trong ngân hàng
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-green-600">Dễ</span>
                        <span className="text-muted-foreground">
                          {easyCount} câu ({difficultyPct(easyCount)}%)
                        </span>
                      </div>
                      <Progress value={difficultyPct(easyCount)} className="h-1.5 [&>div]:bg-green-500" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-yellow-600">Trung bình</span>
                        <span className="text-muted-foreground">
                          {mediumCount} câu ({difficultyPct(mediumCount)}%)
                        </span>
                      </div>
                      <Progress value={difficultyPct(mediumCount)} className="h-1.5 [&>div]:bg-yellow-500" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-red-600">Khó</span>
                        <span className="text-muted-foreground">
                          {hardCount} câu ({difficultyPct(hardCount)}%)
                        </span>
                      </div>
                      <Progress value={difficultyPct(hardCount)} className="h-1.5 [&>div]:bg-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Trọng số</CardTitle>
                    <CardDescription className="text-xs">
                      Tổng quan trọng số trong ngân hàng câu hỏi
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tổng trọng số khả dụng</span>
                      <span className="font-semibold tabular-nums">{totalPoints}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trọng số TB / câu</span>
                      <span className="font-semibold tabular-nums">{avgPoints}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Loại câu hỏi đang dùng</span>
                      <span className="font-semibold tabular-nums">
                        {distinctTypesUsed}/{CANONICAL_QUESTION_TYPE_COUNT}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Chất lượng nội dung</CardTitle>
                    <CardDescription className="text-xs">
                      Chỉ số hỗ trợ rà soát trước khi ra đề — bấm để xem danh sách
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 pt-0 text-sm">
                    <div
                      role="button"
                      tabIndex={missingExplanationCount > 0 ? 0 : -1}
                      aria-disabled={missingExplanationCount === 0}
                      onClick={() => {
                        if (missingExplanationCount === 0) return;
                        setMissingExplanationOnly((v) => !v);
                      }}
                      onKeyDown={(e) => {
                        if (missingExplanationCount === 0) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setMissingExplanationOnly((v) => !v);
                        }
                      }}
                      className={`flex items-center justify-between rounded-md px-2 py-1 -mx-2 transition-colors ${
                        missingExplanationCount > 0
                          ? "cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          : ""
                      } ${missingExplanationOnly ? "bg-amber-50 dark:bg-amber-950/30 ring-1 ring-amber-300" : ""}`}
                    >
                      <span className="text-muted-foreground">
                        Chưa có giải thích
                        {missingExplanationOnly && (
                          <span className="ml-1 text-xs text-amber-600">(đang lọc)</span>
                        )}
                      </span>
                      <span
                        className={`font-semibold tabular-nums underline-offset-2 ${
                          missingExplanationCount > 0 ? "text-amber-600 underline" : ""
                        }`}
                      >
                        {missingExplanationCount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md px-2 py-1 -mx-2">
                      <span className="text-muted-foreground">Có kèm hình ảnh / âm thanh</span>
                      <span className="font-semibold tabular-nums">{withMediaCount}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {missingExplanationOnly && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                <span>
                  Đang lọc: {missingExplanationCount} câu chưa có giải thích
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                  onClick={() => setMissingExplanationOnly(false)}
                >
                  Xóa lọc
                </Button>
              </div>
            )}

            <div className="mb-6 space-y-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                <SearchBar
                  value={questionSearchInput}
                  onChange={setQuestionSearchInput}
                  onSearch={runQuestionSearch}
                  placeholder="Tìm câu hỏi hoặc ID..."
                  className="min-w-0 flex-1"
                />
                <FilterPanel
                  title="Bộ lọc câu hỏi"
                  description="Lọc theo loại, độ khó và trọng số."
                  filters={questionFilterDefinitions}
                  value={draftQuestionFilters}
                  onValueChange={(key, nextValue) =>
                    setDraftQuestionFilters((prev) => ({
                      ...prev,
                      [key]: nextValue,
                    }))
                  }
                  onApply={applyQuestionFilters}
                  onClear={clearQuestionFilters}
                  activeCount={activeQuestionFilterCount}
                  className="shrink-0"
                />
              </div>
              <ActiveFilterChips
                chips={activeQuestionFilterChips}
                onRemove={removeQuestionFilter}
                onClearAll={clearQuestionFilters}
              />
            </div>

            {(() => {
              const totalQuestionPages = Math.max(
                1,
                Math.ceil(filtered.length / QUESTIONS_PER_PAGE),
              );
              const displayedQuestions = filtered.slice(
                (questionPage - 1) * QUESTIONS_PER_PAGE,
                questionPage * QUESTIONS_PER_PAGE,
              );

              return (
                <>
                  {/* Question Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[180px] whitespace-nowrap">
                            <button
                              onClick={() => toggleSort("updatedAt")}
                              className="flex items-center gap-1 hover:text-foreground"
                            >
                              Cập nhật lúc
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          </TableHead>
                          <TableHead className="min-w-48">Nội dung</TableHead>
                          <TableHead className="w-36 whitespace-nowrap">Loại</TableHead>
                          <TableHead className="w-28 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => toggleSort("difficulty")}
                                className="flex items-center justify-center gap-1 hover:text-foreground"
                              >
                                Độ khó
                                <ArrowUpDown className="h-3 w-3" />
                              </button>
                              <ContextHelp content="Mức độ khó của câu hỏi, dùng để phân loại và hỗ trợ phân tích." />
                            </div>
                          </TableHead>
                          <TableHead className="w-32 text-center">Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedQuestions.map((question) => {
                          const diff = getDifficultyLabel(question.difficulty || 1);
                          return (
                            <TableRow key={question.id} className="hover:bg-muted/50">
                              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatQuestionDate(question.updatedAt)}
                              </TableCell>
                              <TableCell className="max-w-[360px] text-sm">
                                <span className="flex items-center gap-1.5">
                                  {question.mediaType === "image" ? (
                                    <Image className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Câu hỏi có hình ảnh đính kèm" />
                                  ) : question.mediaType === "audio" ? (
                                    <Music className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Câu hỏi có âm thanh đính kèm" />
                                  ) : null}
                                  <span className="block truncate" title={question.content}>{question.content}</span>
                                </span>
                              </TableCell>
                              <TableCell className="text-sm whitespace-nowrap">
                                {questionTypeLabels[question.type] || question.type}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`text-xs font-medium px-2 py-1 rounded ${diff.color}`}>
                                  {diff.text}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      className="gap-2 text-xs"
                                      onClick={async () => {
                                        setPreviewQuestion(question);
                                        setDetailLoading(true);
                                        setDetailError(false);
                                        try {
                                          const detail = await api.getQuestionById(question.id);
                                          setDetailQuestion(detail as Question);
                                        } catch {
                                          setDetailError(true);
                                          setDetailQuestion(null);
                                        } finally {
                                          setDetailLoading(false);
                                        }
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                      Xem
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-xs"
                                      onClick={() =>
                                        router.push(
                                          `${questionEditorPath}?id=${question.id}&courseCode=${selectedCourse}`,
                                        )
                                      }
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      Sửa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-xs"
                                      onClick={() => handleDuplicate(question)}
                                    >
                                      <Copy className="h-4 w-4" />
                                      Sao chép
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive text-xs"
                                      onClick={() => handleDelete(question.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Xóa
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {filtered.length === 0 && (
                    <div className="text-center py-16 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Không tìm thấy câu hỏi</p>
                      <p className="text-sm">
                        Tạo câu hỏi đầu tiên cho khóa học này.
                      </p>
                    </div>
                  )}

                  <DataPagination
                    currentPage={questionPage}
                    totalPages={totalQuestionPages}
                    totalItems={filtered.length}
                    onPageChange={setQuestionPage}
                    itemLabel="câu hỏi"
                    className="border-t-0 px-0 pt-2"
                    syncUrl={false}
                  />
                </>
              );
            })()}
          </>
        )}

        {/* Copy Question Bank Dialog */}
        <Dialog
          open={copyDialogOpen}
          onOpenChange={(open) => {
            setCopyDialogOpen(open);
            if (!open) setCopySourceCourseId("");
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sao chép ngân hàng câu hỏi</DialogTitle>
              <DialogDescription>
                Sao chép các câu hỏi đã publish từ một khóa học khác vào{" "}
                <strong>
                  {courses.find((c) => c.code === selectedCourse)?.name ||
                    selectedCourse}
                </strong>
                . Câu hỏi trùng nội dung sẽ được bỏ qua.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2">
              <Select
                value={copySourceCourseId}
                onValueChange={setCopySourceCourseId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn khóa học nguồn" />
                </SelectTrigger>
                <SelectContent>
                  {courses
                    .filter((c) => c.code !== selectedCourse)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCopyDialogOpen(false)}
                disabled={copyLoading}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCopyQuestionBank}
                disabled={!copySourceCourseId || copyLoading}
              >
                {copyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Sao chép"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Lọc các câu trùng lặp</DialogTitle>
              <DialogDescription>
                Đối chiếu {duplicateScanCount} câu hỏi cùng học phần. Kết quả chỉ là gợi ý để giảng viên xem xét.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-end gap-4 rounded-lg border bg-muted/30 p-4 flex-wrap">
              <div className="space-y-1">
                <label className="text-sm font-medium">Ngưỡng dưới (%)</label>
                <Input type="number" min={0} max={100} value={duplicateThresholdMin} onChange={(event) => {
                  const v = Number(event.target.value.replace(/[^0-9]/g, "")) || 0;
                  setDuplicateThresholdMin(Math.min(v, duplicateThresholdMax));
                }} onBlur={() => saveDuplicateThreshold(duplicateThresholdMin, duplicateThresholdMax)} className="w-24" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Ngưỡng trên (%)</label>
                <Input type="number" min={0} max={100} value={duplicateThresholdMax} onChange={(event) => {
                  const v = Number(event.target.value.replace(/[^0-9]/g, "")) || 0;
                  setDuplicateThresholdMax(Math.max(v, duplicateThresholdMin));
                }} onBlur={() => saveDuplicateThreshold(duplicateThresholdMin, duplicateThresholdMax)} className="w-24" />
              </div>
              <p className="pb-1 text-xs text-muted-foreground">Cài đặt được lưu theo tài khoản.</p>
            </div>
            {duplicateLoading ? (
              <div className="flex min-h-44 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Đang phân tích câu hỏi...</div>
            ) : (() => {
              const filteredPairs = duplicatePairs.filter((pair) =>
                pair.similarityPercent >= duplicateThresholdMin && pair.similarityPercent <= duplicateThresholdMax
              );
              return filteredPairs.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Không tìm thấy cặp câu hỏi nào trong khoảng {duplicateThresholdMin}%–{duplicateThresholdMax}%.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Hiển thị {filteredPairs.length} cặp trùng lặp ({duplicateThresholdMin}%–{duplicateThresholdMax}%)
                  </p>
                  {filteredPairs.map((pair) => (
                    <div key={`${pair.questionA.id}-${pair.questionB.id}`} className="rounded-lg border p-4">
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">Tương đồng {pair.similarityPercent}%</span>
                        <StatusBadge status={pair.matchMethod === 'AI' ? 'success' : pair.matchMethod === 'EXACT' ? 'info' : 'warning'}>
                          {pair.matchMethod === 'AI' ? 'AI xác nhận' : pair.matchMethod === 'EXACT' ? 'Trùng chính xác' : 'So khớp văn bản'}
                        </StatusBadge>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-md bg-muted/50 p-3 text-sm relative group">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Câu A</p>
                          <p className="pr-8">{pair.questionA.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(pair.questionA.id)}
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="rounded-md bg-muted/50 p-3 text-sm relative group">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">Câu B</p>
                          <p className="pr-8">{pair.questionB.content}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-7 w-7 p-0 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDelete(pair.questionB.id)}
                            title="Xóa câu hỏi này"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{pair.reason}</p>
                    </div>
                  ))}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog
          open={!!previewQuestion}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewQuestion(null);
              setDetailQuestion(null);
              setDetailError(false);
            }
          }}
        >
          <DialogContent
            hideCloseButton
            className="w-[950px] max-w-[95vw] max-h-[85vh] overflow-hidden p-0 gap-0"
          >
            <DialogTitle className="sr-only">Xem trước câu hỏi</DialogTitle>

            {detailLoading && (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {detailError && !detailLoading && (
              <div className="flex flex-col items-center justify-center h-64 gap-3 px-6">
                <AlertTriangle className="h-10 w-10 text-destructive" />
                <p className="text-lg font-medium">Không thể tải chi tiết câu hỏi</p>
                <p className="text-sm text-muted-foreground text-center">
                  Đã xảy ra lỗi khi tải đầy đủ dữ liệu câu hỏi.
                </p>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!previewQuestion) return;
                    setDetailLoading(true);
                    setDetailError(false);
                    try {
                      const detail = await api.getQuestionById(previewQuestion.id);
                      setDetailQuestion(detail as Question);
                    } catch {
                      setDetailError(true);
                      setDetailQuestion(null);
                    } finally {
                      setDetailLoading(false);
                    }
                  }}
                >
                  Thử lại
                </Button>
              </div>
            )}

            {!detailLoading && !detailError && detailQuestion && (() => {
              const q = detailQuestion;
              const diff = getDifficultyLabel(q.difficulty || 1);
              const typeLabel = questionTypeLabels[q.type] || q.type;
              const options = normalizeOptions(q.options);
              const matchingPairs = q.type === "MATCHING" ? parseMatchingPairs(q.options) : [];
              const orderingItems = q.type === "ORDERING" ? parseOrderingItems(q.options) : [];
              const correctAnswers = q.type === "FILL_IN_BLANK"
                ? extractBlankAnswers(q.content)
                : q.type === "MATCHING"
                  ? parseMatchingAnswers(q.correctAnswer)
                  : normalizeCorrectAnswer(q.correctAnswer);
              const hasOptions = !NO_OPTIONS_TYPES.has(q.type) && q.type !== "MATCHING" && q.type !== "ORDERING";

              return (
                <>
                  {/* Fixed Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold">Xem trước câu hỏi</h2>
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {typeLabel}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        setPreviewQuestion(null);
                        setDetailQuestion(null);
                        setDetailError(false);
                      }}
                    >
                      <span className="sr-only">Đóng</span>
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </Button>
                  </div>

                  {/* Scrollable Body */}
                  <div className="max-h-[calc(85vh-73px)] overflow-y-auto p-6 space-y-6">

                    {/* 1. Question Content */}
                    <Section title="Nội dung câu hỏi">
                      <p className="text-sm whitespace-pre-wrap break-words text-foreground">
                        {q.content}
                      </p>
                    </Section>

                    {/* 1b. Attached media */}
                    {q.mediaType === "image" && q.mediaUrl ? (
                      <Section title="Hình ảnh đính kèm">
                        <img
                          src={q.mediaUrl}
                          alt="Hình ảnh minh họa câu hỏi"
                          className="max-h-80 w-full rounded-md border object-contain"
                        />
                      </Section>
                    ) : q.mediaType === "audio" && q.mediaUrl ? (
                      <Section title="Âm thanh đính kèm">
                        <audio src={q.mediaUrl} controls className="w-full" />
                      </Section>
                    ) : null}

                    {/* 2. Answer Options / Matching Pairs / Ordering Items */}
                    {q.type === "MATCHING" ? (
                      <Section title="Các cặp ghép đôi">
                        {matchingPairs.length > 0 ? (
                          <div className="space-y-2">
                            {matchingPairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-lg border p-3 text-sm border-border bg-card">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                  {i + 1}
                                </span>
                                <span className="flex-1 font-medium">{pair.left}</span>
                                <svg className="h-4 w-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                <span className="flex-1 text-muted-foreground">{pair.right}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Chưa có cặp ghép đôi</p>
                        )}
                      </Section>
                    ) : q.type === "ORDERING" ? (
                      <Section title="Các phần tử cần sắp xếp">
                        {orderingItems.length > 0 ? (
                          <div className="space-y-2">
                            {orderingItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-lg border p-3 text-sm border-border bg-card">
                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-muted text-muted-foreground">
                                  {i + 1}
                                </span>
                                <span className="flex-1">{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Chưa có phần tử nào</p>
                        )}
                      </Section>
                    ) : hasOptions ? (
                      <Section title="Các lựa chọn">
                        {options.length > 0 ? (
                          <div className="space-y-2">
                            {options.map((opt) => {
                              const isCorrect = correctAnswers.some(
                                (ca) => ca.toUpperCase() === opt.id.toUpperCase() || ca === opt.text,
                              );
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
                                    isCorrect
                                      ? "border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-700"
                                      : "border-border bg-card"
                                  }`}
                                >
                                  <span
                                    className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                      isCorrect
                                        ? "bg-green-500 text-white"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isCorrect ? "✓" : opt.id}
                                  </span>
                                  <span className="flex-1 whitespace-pre-wrap break-words pt-0.5">
                                    {opt.text}
                                  </span>
                                  {isCorrect && (
                                    <span className="flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700">
                                      Đáp án đúng
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Loại câu hỏi này không dùng lựa chọn
                          </p>
                        )}
                      </Section>
                    ) : (
                      <Section title="Các lựa chọn">
                        <p className="text-sm text-muted-foreground italic">
                          Loại câu hỏi này không dùng lựa chọn
                        </p>
                      </Section>
                    )}

                    {/* 3. Correct Answer */}
                    <Section
                      title="Đáp án đúng"
                      className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                    >
                      {q.type === "MATCHING" ? (
                        matchingPairs.length > 0 ? (
                          <div className="space-y-1.5">
                            {matchingPairs.map((pair, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-medium">{pair.left}</span>
                                <span>→</span>
                                <span>{pair.right}</span>
                              </div>
                            ))}
                          </div>
                        ) : correctAnswers.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {correctAnswers.map((ans, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                {ans}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Chưa có đáp án đúng</p>
                        )
                      ) : q.type === "ORDERING" ? (
                        orderingItems.length > 0 ? (
                          <div className="space-y-1.5">
                            {orderingItems.map((item, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-green-800 dark:text-green-300">
                                <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="font-medium">{i + 1}.</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Thứ tự đúng được lưu trong đáp án</p>
                        )
                      ) : correctAnswers.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {correctAnswers.map((ans, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-700"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              {ans}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Chưa có đáp án đúng
                        </p>
                      )}
                    </Section>

                    {/* 4. Explanation */}
                    <Section title="Giải thích">
                      {q.explanation ? (
                        <p className="text-sm whitespace-pre-wrap break-words text-foreground">
                          {q.explanation}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          Chưa có giải thích
                        </p>
                      )}
                    </Section>

                    <Separator />

                    {/* 5. Difficulty, Points, Type */}
                    <div className="grid grid-cols-3 gap-4">
                      <InfoCard
                        label="Độ khó"
                        help="Mức độ khó của câu hỏi, dùng để phân loại và hỗ trợ phân tích."
                        value={diff.text}
                        valueClassName={diff.color}
                      />
                      <InfoCard
                        label="Trọng số"
                        value={String(q.points ?? 1)}
                      />
                      <InfoCard
                        label="Loại"
                        value={typeLabel}
                      />
                    </div>

                    {/* 6. Metadata */}
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium min-w-[100px]">Khóa học:</span>
                        <span>{q.course?.code || q.course?.name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium min-w-[100px]">Tạo lúc:</span>
                        <span>{formatDateSafe(q.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground font-medium min-w-[100px]">Cập nhật:</span>
                        <span>{formatDateSafe(q.updatedAt)}</span>
                      </div>
                    </div>

                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
                Câu hỏi sẽ bị xóa vĩnh viễn khỏi ngân hàng câu hỏi.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteLoading}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminPageShell>
    </DashboardLayout>
  );
}



