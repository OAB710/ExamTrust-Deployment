"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchBar } from "@/components/common/list/SearchBar";
import { FilterPanel } from "@/components/common/list/FilterPanel";
import { ActiveFilterChips } from "@/components/common/list/ActiveFilterChips";
import { FilterDefinition, FilterValues } from "@/components/common/list/filter-types";
import { getActiveFilterCount, getFilterChips } from "@/components/common/list/filter-utils";
import { typeLabels as questionTypeLabels } from "./question-bank-utils";
import { api } from "@/lib/api";
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Loader2, Minus, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

const EMPTY_HISTORY_FILTERS: FilterValues = {
  type: "all",
  trend: "all",
  withAttempts: undefined,
  aiGenerated: undefined,
};

const historyFilterDefinitions: FilterDefinition[] = [
  {
    key: "type",
    label: "Loại câu hỏi",
    type: "select",
    allLabel: "Tất cả loại",
    options: Object.entries(questionTypeLabels).map(([value, label]) => ({ value, label })),
  },
  {
    key: "trend",
    label: "Xu hướng",
    type: "select",
    allLabel: "Tất cả xu hướng",
    options: [
      { value: "improving", label: "Cải thiện" },
      { value: "stable", label: "Ổn định" },
      { value: "degrading", label: "Cần xem xét" },
    ],
  },
  {
    key: "withAttempts",
    label: "Lượt làm",
    type: "boolean",
    trueLabel: "Đã có lượt làm",
    falseLabel: "Chưa có lượt làm",
  },
  {
    key: "aiGenerated",
    label: "Hỗ trợ AI",
    type: "boolean",
    trueLabel: "Có hỗ trợ AI",
    falseLabel: "Không có hỗ trợ AI",
  },
];

type QuestionMetric = {
  versionId: string;
  versionNo: number;
  exam: string;
  date: string;
  attempts: number;
  correctRate: number | null;
  difficulty: number | null;
  discrimination: number | null;
  reliability: number | null;
};

type QuestionHistoryRow = {
  id: string;
  content: string;
  course: string;
  type: string;
  status: string;
  metrics: QuestionMetric[];
  versions: Array<{ id: string; versionNo: number; stem: string; aiGenerated: boolean; createdAt: string }>;
  trend: "stable" | "improving" | "degrading";
  recommendation: string | null;
};

export default function QuestionHistoryAnalysis() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const basePath = pathname.startsWith("/admin") ? "/admin" : "/lecturer";
  const questionBankPath = `${basePath}/question-bank`;
  const questionEditorPath = `${basePath}/question-editor`;
  const [rows, setRows] = useState<QuestionHistoryRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionHistoryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [draftFilters, setDraftFilters] = useState<FilterValues>(EMPTY_HISTORY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(EMPTY_HISTORY_FILTERS);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const payload = await api.getQuestionHistory({
          courseId: searchParams.get("courseId") || undefined,
        });
        const data = Array.isArray(payload?.data) ? payload.data : [];
        if (!active) return;
        setRows(data);
        setStats(payload?.stats || null);
        setSelectedQuestion(data[0] || null);
      } catch (err: any) {
        if (active) setError(err.message || "Không thể tải lịch sử câu hỏi");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [searchParams]);

  const filteredRows = useMemo(() => {
    const search = appliedSearch.trim().toLowerCase();
    const type = appliedFilters.type as string | undefined;
    const trend = appliedFilters.trend as string | undefined;
    const withAttempts = appliedFilters.withAttempts as boolean | undefined;
    const aiGenerated = appliedFilters.aiGenerated as boolean | undefined;

    return rows.filter((row) => {
      const matchesSearch =
        !search || row.content.toLowerCase().includes(search) || row.id.toLowerCase().includes(search);
      const matchesType = !type || type === "all" || row.type === type;
      const matchesTrend = !trend || trend === "all" || row.trend === trend;
      const rowHasAttempts = row.metrics.some((metric) => metric.attempts > 0);
      const matchesAttempts = withAttempts === undefined || rowHasAttempts === withAttempts;
      const rowHasAi = row.versions.some((version) => version.aiGenerated);
      const matchesAi = aiGenerated === undefined || rowHasAi === aiGenerated;
      return matchesSearch && matchesType && matchesTrend && matchesAttempts && matchesAi;
    });
  }, [rows, appliedSearch, appliedFilters]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedQuestion(null);
      return;
    }
    if (!selectedQuestion || !filteredRows.some((row) => row.id === selectedQuestion.id)) {
      setSelectedQuestion(filteredRows[0]);
    }
  }, [filteredRows, selectedQuestion]);

  const runSearch = () => setAppliedSearch(searchInput.trim());
  const applyFilters = () => setAppliedFilters(draftFilters);
  const clearFilters = () => {
    setDraftFilters(EMPTY_HISTORY_FILTERS);
    setAppliedFilters(EMPTY_HISTORY_FILTERS);
    setSearchInput("");
    setAppliedSearch("");
  };
  const removeFilter = (key: string) => {
    const nextFilters = {
      ...appliedFilters,
      [key]: EMPTY_HISTORY_FILTERS[key as keyof typeof EMPTY_HISTORY_FILTERS],
    };
    setAppliedFilters(nextFilters);
    setDraftFilters(nextFilters);
  };
  const activeFilterCount = getActiveFilterCount(appliedFilters, historyFilterDefinitions);
  const activeFilterChips = getFilterChips(appliedFilters, historyFilterDefinitions);

  const chartMetrics = useMemo(
    () => (selectedQuestion?.metrics.length ? selectedQuestion.metrics : []),
    [selectedQuestion],
  );

  const lineData = useMemo(
    () => ({
      labels: chartMetrics.map((metric) => metric.exam),
      datasets: [
        {
          label: "Chỉ số độ khó",
          data: chartMetrics.map((metric) => metric.difficulty ?? 0),
          borderColor: "rgb(239, 68, 68)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Chỉ số phân biệt",
          data: chartMetrics.map((metric) => metric.discrimination ?? 0),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          fill: true,
          tension: 0.3,
        },
        {
          label: "Độ tin cậy ước tính",
          data: chartMetrics.map((metric) => metric.reliability ?? 0),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    }),
    [chartMetrics],
  );

  const barData = useMemo(
    () => ({
      labels: chartMetrics.map((metric) => metric.exam),
      datasets: [
        {
          label: "Tỷ lệ trả lời đúng",
          data: chartMetrics.map((metric) => Math.round((metric.correctRate ?? 0) * 100)),
          backgroundColor: chartMetrics.map((metric) => {
            const value = metric.correctRate ?? 0;
            return value > 0.5 ? "rgba(34, 197, 94, 0.7)" : value > 0.3 ? "rgba(234, 179, 8, 0.7)" : "rgba(239, 68, 68, 0.7)";
          }),
          borderRadius: 4,
        },
      ],
    }),
    [chartMetrics],
  );

  const trendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "degrading":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };
  const trendLabel = (trend: string) => ({
    improving: "Cải thiện",
    degrading: "Suy giảm",
    stable: "Ổn định",
  }[trend] || "Chưa xác định");

  const latestMetric = (row: QuestionHistoryRow) => row.metrics[row.metrics.length - 1];
  const firstMetric = (row: QuestionHistoryRow) => row.metrics.find((metric) => metric.attempts > 0) || row.metrics[0];
  const currentMetric = selectedQuestion ? latestMetric(selectedQuestion) : undefined;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4 gap-2 text-muted-foreground" onClick={() => router.push(questionBankPath)}>
          <ArrowLeft className="h-4 w-4" /> Quay lại ngân hàng câu hỏi
        </Button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            Lịch sử phiên bản & phân tích chất lượng câu hỏi
          </h1>
          <p className="text-muted-foreground">
            Phân tích từ phiên bản câu hỏi, bài nộp và thống kê chất lượng đã lưu.
          </p>
        </div>

        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
              Đang tải lịch sử câu hỏi...
            </CardContent>
          </Card>
        )}

        {!loading && error && (
          <Card className="border-red-200">
            <CardContent className="py-8 text-center text-red-600">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && rows.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              Chưa có lịch sử câu hỏi. Hãy xuất bản câu hỏi có phiên bản và thu thập bài nộp.
            </CardContent>
          </Card>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-semibold">{stats?.totalQuestions ?? rows.length}</p>
                <p className="text-xs text-muted-foreground">Câu hỏi</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-semibold">{stats?.withAttempts ?? 0}</p>
                <p className="text-xs text-muted-foreground">Đã có lượt làm</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-semibold text-red-600">{stats?.degrading ?? 0}</p>
                <p className="text-xs text-muted-foreground">Cần xem xét</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-semibold text-blue-600">{stats?.aiGenerated ?? 0}</p>
                <p className="text-xs text-muted-foreground">Có hỗ trợ AI</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="mb-6 space-y-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <SearchBar
                value={searchInput}
                onChange={setSearchInput}
                onSearch={runSearch}
                placeholder="Tìm câu hỏi hoặc ID..."
                className="min-w-0 flex-1"
              />
              <FilterPanel
                title="Bộ lọc câu hỏi"
                description="Lọc theo loại, xu hướng, lượt làm và hỗ trợ AI."
                filters={historyFilterDefinitions}
                value={draftFilters}
                onValueChange={(key, nextValue) =>
                  setDraftFilters((prev) => ({ ...prev, [key]: nextValue }))
                }
                onApply={applyFilters}
                onClear={clearFilters}
                activeCount={activeFilterCount}
                className="shrink-0"
              />
            </div>
            <ActiveFilterChips
              chips={activeFilterChips}
              onRemove={removeFilter}
              onClearAll={clearFilters}
            />
          </div>
        )}

        {!loading && !error && rows.length > 0 && (filteredRows.length === 0 || !selectedQuestion) && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              Không có câu hỏi phù hợp với bộ lọc hiện tại.
            </CardContent>
          </Card>
        )}

        {!loading && !error && rows.length > 0 && filteredRows.length > 0 && selectedQuestion && (
          <>
            <Tabs defaultValue="trends">
              <TabsList className="mb-4">
                <TabsTrigger value="trends">Xu hướng chỉ số</TabsTrigger>
                <TabsTrigger value="drift">Biến động độ khó</TabsTrigger>
                <TabsTrigger value="history">Lịch sử phiên bản</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Câu hỏi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 max-h-[620px] overflow-y-auto">
                      {filteredRows.map((row) => (
                        <button
                          key={row.id}
                          onClick={() => setSelectedQuestion(row)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            selectedQuestion.id === row.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-xs text-muted-foreground">{row.id.slice(0, 8)}</span>
                            <div className="flex items-center gap-1">
                              {trendIcon(row.trend)}
                              <StatusBadge variant={row.trend === "improving" ? "success" : row.trend === "degrading" ? "destructive" : "default"}>
                                {trendLabel(row.trend)}
                              </StatusBadge>
                            </div>
                          </div>
                          <p className="text-xs line-clamp-2">{row.content}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {row.course} · {row.versions.length} phiên bản
                          </p>
                        </button>
                      ))}
                    </CardContent>
                  </Card>

                  <div className="col-span-2 space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Xu hướng chỉ số</CardTitle>
                        <CardDescription className="line-clamp-1">{selectedQuestion.content}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {chartMetrics.some((metric) => metric.attempts > 0) ? (
                          <Line data={lineData} options={{ responsive: true, scales: { y: { min: 0, max: 1 } }, plugins: { legend: { position: "bottom" } } }} />
                        ) : (
                          <div className="py-12 text-center text-muted-foreground">Câu hỏi này chưa có lượt làm hoàn tất.</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Tỷ lệ trả lời đúng (%)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {chartMetrics.some((metric) => metric.attempts > 0) ? (
                          <Bar data={barData} options={{ responsive: true, scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }} />
                        ) : (
                          <div className="py-8 text-center text-muted-foreground">Đang chờ dữ liệu bài nộp.</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-primary/15 bg-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Cách đọc các chỉ số</CardTitle>
                        <CardDescription>Các giá trị đều nằm trong khoảng từ 0 đến 1.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-3 text-sm md:grid-cols-3">
                        <div>
                          <p className="font-medium">Chỉ số độ khó (p)</p>
                          <p className="mt-1 text-muted-foreground">p = số lượt đúng / tổng lượt làm. p càng cao thì câu càng dễ; khoảng 0,30–0,80 thường hữu ích để phân loại.</p>
                          <p className="mt-1 font-medium">Hiện tại: {currentMetric?.difficulty !== null && currentMetric?.difficulty !== undefined ? currentMetric.difficulty.toFixed(2) : "Chưa đủ dữ liệu"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Chỉ số phân biệt (D)</p>
                          <p className="mt-1 text-muted-foreground">D đo mức độ câu hỏi tách được nhóm làm tốt và nhóm làm yếu. D ≥ 0,30 là tốt; D thấp cần xem lại cách diễn đạt hoặc đáp án nhiễu.</p>
                          <p className="mt-1 font-medium">Hiện tại: {currentMetric?.discrimination !== null && currentMetric?.discrimination !== undefined ? currentMetric.discrimination.toFixed(2) : "Chưa đủ dữ liệu"}</p>
                        </div>
                        <div>
                          <p className="font-medium">Độ tin cậy ước tính</p>
                          <p className="mt-1 text-muted-foreground">Chỉ số tham khảo được suy ra từ độ phân biệt, chỉ hiển thị khi có ít nhất 10 lượt làm. Giá trị cao hơn cho thấy kết quả ổn định hơn.</p>
                          <p className="mt-1 font-medium">Hiện tại: {currentMetric?.reliability !== null && currentMetric?.reliability !== undefined ? currentMetric.reliability.toFixed(2) : "Chưa đủ dữ liệu"}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {selectedQuestion.recommendation && (
                      <Card className="border-yellow-200 bg-yellow-50/50">
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-yellow-800">Khuyến nghị</p>
                              <p className="text-sm text-yellow-700">{selectedQuestion.recommendation}</p>
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" className="gap-1 text-xs">
                                  <RefreshCw className="h-3 w-3" /> Tạo phiên bản mới
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => router.push(`${questionEditorPath}?id=${selectedQuestion.id}`)}>
                                  Sửa câu hỏi <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="drift">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tổng quan biến động độ khó</CardTitle>
                    <CardDescription>Thay đổi độ khó và độ phân biệt dựa trên thống kê bài nộp thực tế.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">ID</TableHead>
                          <TableHead>Câu hỏi</TableHead>
                          <TableHead className="w-20">Khóa học</TableHead>
                          <TableHead className="w-28">Độ khó ban đầu</TableHead>
                          <TableHead className="w-28">Độ khó hiện tại</TableHead>
                          <TableHead className="w-20">Lượt làm</TableHead>
                          <TableHead className="w-24">Xu hướng</TableHead>
                          <TableHead className="w-28">Độ phân biệt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRows.map((row) => {
                          const initial = firstMetric(row);
                          const current = latestMetric(row);
                          const initialDiff = initial?.difficulty ?? 0;
                          const currentDiff = current?.difficulty ?? 0;
                          return (
                            <TableRow key={row.id}>
                              <TableCell className="font-mono text-xs">{row.id.slice(0, 8)}</TableCell>
                              <TableCell><p className="text-sm line-clamp-1">{row.content}</p></TableCell>
                              <TableCell className="font-mono text-xs">{row.course}</TableCell>
                              <TableCell>
                                <span className="text-sm">{initial?.attempts ? initialDiff.toFixed(2) : "Chưa có dữ liệu"}</span>
                                <Progress value={initialDiff * 100} className="h-1 mt-1" />
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">{current?.attempts ? currentDiff.toFixed(2) : "Chưa có dữ liệu"}</span>
                                <Progress value={currentDiff * 100} className="h-1 mt-1" />
                              </TableCell>
                              <TableCell>{row.metrics.reduce((sum, metric) => sum + metric.attempts, 0)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {trendIcon(row.trend)}
                                  <StatusBadge variant={row.trend === "improving" ? "success" : row.trend === "degrading" ? "destructive" : "default"}>
                                  {trendLabel(row.trend)}
                                  </StatusBadge>
                                </div>
                              </TableCell>
                              <TableCell>{current?.discrimination !== null && current?.discrimination !== undefined ? current.discrimination.toFixed(2) : "Chưa có dữ liệu"}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lịch sử phiên bản</CardTitle>
                    <CardDescription>Các phiên bản câu hỏi cố định, dùng để lưu trữ đề thi theo đúng thời điểm gốc.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedQuestion.versions.map((version, index) => (
                      <div key={version.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`h-3 w-3 rounded-full ${version.aiGenerated ? "bg-blue-500" : index === 0 ? "bg-green-500" : "bg-muted-foreground"}`} />
                          {index < selectedQuestion.versions.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">v{version.versionNo}</span>
                              <span className="text-sm font-medium">{version.aiGenerated ? "Phiên bản có hỗ trợ AI" : index === 0 ? "Phiên bản đầu tiên" : "Phiên bản thủ công"}</span>
                              {version.aiGenerated && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(version.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{version.stem}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
