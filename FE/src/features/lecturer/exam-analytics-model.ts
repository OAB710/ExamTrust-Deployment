export type CourseTerm = "TERM_1" | "TERM_2" | "TERM_3" | (string & {});

export type AnalyticsCourseInfo = {
  id: string;
  code: string;
  name: string;
  academicYear: string | null;
  term: CourseTerm | null;
};

export type ExamOption = {
  id: string;
  title: string;
  status?: string;
  maxAttempts?: number | null;
  gradingStrategy?: string | null;
  settings?: any;
  endTime?: string | null;
  course?: AnalyticsCourseInfo;
  _count?: { submissions?: number };
};

/**
 * The exam list from GET /exams sorts by `updatedAt desc` — whichever exam a
 * lecturer last edited, not whichever has something worth analyzing. Ranks
 * exams with at least one submission first (most recently concluded first
 * within that group, since that's realistically what a lecturer is checking
 * in on right after grading closes), then exams with no data yet, so the
 * dropdown itself guides toward something worth looking at instead of just
 * mirroring "last touched".
 */
export function sortExamsForAnalytics(exams: ExamOption[]): ExamOption[] {
  const byRecency = (a: ExamOption, b: ExamOption) => {
    const aTime = a.endTime ? new Date(a.endTime).getTime() : -Infinity;
    const bTime = b.endTime ? new Date(b.endTime).getTime() : -Infinity;
    return bTime - aTime;
  };
  const withSubmissions = exams.filter((exam) => Number(exam._count?.submissions || 0) > 0).sort(byRecency);
  const withoutSubmissions = exams.filter((exam) => !(Number(exam._count?.submissions || 0) > 0)).sort(byRecency);
  return [...withSubmissions, ...withoutSubmissions];
}

export function pickDefaultAnalyticsExamId(exams: ExamOption[]): string {
  const sorted = sortExamsForAnalytics(exams);
  return sorted[0]?.id || "";
}

export type AiImprovementStatus =
  | "IDLE"
  | "QUEUED"
  | "GENERATING"
  | "READY_FOR_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "EXPIRED";

export type AiImprovementSummary = {
  id: string;
  status: AiImprovementStatus;
  rawStatus?: string;
  reviewStatus?: string;
  completedAt?: string | null;
  reviewedAt?: string | null;
  errorMessage?: string | null;
};

export type AiImprovementDetail = AiImprovementSummary & {
  originalSnapshot?: Record<string, any>;
  proposal?: Record<string, any>;
  finalApproved?: Record<string, any>;
  diagnosis?: {
    reason?: string;
    issues?: Array<{ type?: string; description?: string }>;
  };
  changes?: Array<{ field?: string; before?: string; after?: string; reason?: string }>;
  confidence?: number;
  warnings?: string[];
};

export type EditableOption = { id: string; text: string };
export type QuestionCourseInfo = {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  academicYear?: string | null;
  term?: string | null;
};
export type PreviewQuestion = {
  id: string;
  content?: string | null;
  type?: string | null;
  course?: QuestionCourseInfo | null;
  courseId?: string | null;
  difficulty?: number | null;
  points?: number | null;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type QuestionComparisonSnapshot = {
  type: string;
  content: string;
  course: QuestionCourseInfo | null;
  difficulty: number | null;
  points: number | null;
  options: EditableOption[];
  correctAnswerIds: string[];
  explanation: string;
  tags: string[];
  topics: string[];
};

export type ComparisonFieldKey =
  | "content"
  | "type"
  | "options"
  | "correctAnswer"
  | "explanation"
  | "difficulty"
  | "points"
  | "tags"
  | "topics";

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  MULTI_SELECT: "Nhiều đáp án",
  TRUE_FALSE: "Đúng / Sai",
  SHORT_ANSWER: "Trả lời ngắn",
  ESSAY: "Tự luận",
  FILL_IN_BLANK: "Điền vào chỗ trống",
  MATCHING: "Ghép đôi",
  ORDERING: "Sắp xếp",
  FIND_ERROR: "Tìm lỗi sai",
};

export function getCourseLabel(course?: QuestionCourseInfo | null) {
  if (!course) return "";
  const code = String(course.code || "").trim();
  const name = String(course.name || "").trim();
  if (code && name) return `${code} - ${name}`;
  return code || name;
}

// Bank questions store difficulty as an integer 1..10 (see QuestionEditor's
// Easy/Medium/Hard buttons: 0.3/0.5/0.7 slider values * 10 => ~3/5/7).
export function getDifficultyLabel(value?: number | null) {
  const normalized = Number.isFinite(Number(value)) ? Math.round(Number(value)) : 1;
  if (normalized <= 4) return { text: "Dễ", className: "text-emerald-600" };
  if (normalized === 5) return { text: "Trung bình", className: "text-amber-600" };
  return { text: "Khó", className: "text-rose-600" };
}

export function formatPreviewDate(value?: string | null) {
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

export const ISSUE_LABELS: Record<string, string> = {
  INCORRECT_ANSWER: "Sai đáp án",
  POOR_EXPLANATION: "Giải thích chưa rõ",
  AMBIGUOUS_QUESTION: "Câu hỏi mơ hồ",
  INVALID_OPTIONS: "Phương án chưa hợp lệ",
  POOR_CONTENT: "Nội dung chưa rõ",
};

export const safeJsonValue = (value: any) => {
  if (value == null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

export const normalizeEditableOptions = (value: any): EditableOption[] => {
  const raw = safeJsonValue(value);
  if (Array.isArray(raw)) {
    return raw.map((item, index) => {
      if (typeof item === "object" && item !== null) {
        return {
          id: String(item.id ?? item.key ?? String.fromCharCode(65 + index)),
          text: String(item.text ?? item.label ?? item.value ?? ""),
        };
      }
      return { id: String.fromCharCode(65 + index), text: String(item ?? "") };
    });
  }
  if (typeof raw === "object" && raw !== null) {
    return Object.entries(raw).map(([id, text]) => ({
      id,
      text: String(text ?? ""),
    }));
  }
  return [];
};

export const normalizeCorrectAnswerIds = (value: any): string[] => {
  const raw = safeJsonValue(value);
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((item) => String(item ?? ""));
  if (typeof raw === "object") {
    const obj = raw as Record<string, any>;
    if (obj.optionId) return [String(obj.optionId)];
    // Format: { answers: ["B", "C"] } — used by FIND_ERROR (see
    // question-editor-persistence.ts and submissions.service.ts's
    // findErrorLineSet, both of which read this plural array key).
    if (Array.isArray(obj.answers)) return obj.answers.map((item: any) => String(item ?? ""));
    if (obj.answer !== undefined && obj.answer !== null) {
      const answer = typeof obj.answer === "object" ? JSON.stringify(obj.answer) : String(obj.answer);
      return answer.includes(",") ? answer.split(",").map((item) => item.trim()) : [answer];
    }
    const checked = Object.entries(obj)
      .filter(([, value]) => value === true || value === "true" || value === 1 || value === "1")
      .map(([key]) => key);
    if (checked.length) return checked;
    // Empty or unrecognized object → no answers
    return [];
  }
  if (typeof raw === "boolean") return [raw ? "True" : "False"];
  return [String(raw)];
};

export const serializeOptions = (options: EditableOption[]) =>
  options.reduce<Record<string, string>>((acc, option) => {
    acc[option.id] = option.text;
    return acc;
  }, {});

export const serializeCorrectAnswer = (answers: string[]) => ({
  answer: answers.length > 1 ? answers.join(",") : answers[0] || "",
});

export const hasFieldChanged = (before: any, after: any) =>
  JSON.stringify(safeJsonValue(before) ?? "") !== JSON.stringify(safeJsonValue(after) ?? "");

export const COMPARISON_FIELDS: Array<{ key: ComparisonFieldKey; label: string }> = [
  { key: "content", label: "Nội dung câu hỏi" },
  { key: "type", label: "Loại câu hỏi" },
  { key: "options", label: "Phương án" },
  { key: "correctAnswer", label: "Đáp án đúng" },
  { key: "explanation", label: "Giải thích" },
  { key: "difficulty", label: "Độ khó" },
  { key: "points", label: "Trọng số" },
  { key: "tags", label: "Thẻ" },
  { key: "topics", label: "Chủ đề" },
];

export const normalizeStringList = (value: any): string[] => {
  const raw = safeJsonValue(value);
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (typeof item === "object" && item !== null) {
          return String(item.name ?? item.label ?? item.title ?? item.code ?? "").trim();
        }
        return String(item ?? "").trim();
      })
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }
  if (typeof raw === "object") {
    return Object.values(raw).map((item) => String(item ?? "").trim()).filter(Boolean);
  }
  return [];
};

export const buildComparisonSnapshot = (
  source?: Record<string, any> | null,
  fallbackCourse?: QuestionCourseInfo | null,
): QuestionComparisonSnapshot => {
  const snapshot = source || {};
  const nestedCourse =
    snapshot.course && typeof snapshot.course === "object" ? snapshot.course : null;
  const course: QuestionCourseInfo | null = {
    id: snapshot.courseId || nestedCourse?.id || fallbackCourse?.id || null,
    code: snapshot.courseCode || nestedCourse?.code || fallbackCourse?.code || null,
    name: snapshot.courseName || nestedCourse?.name || fallbackCourse?.name || null,
    academicYear:
      snapshot.courseAcademicYear ||
      snapshot.academicYear ||
      nestedCourse?.academicYear ||
      fallbackCourse?.academicYear ||
      null,
    term:
      snapshot.courseTerm ||
      snapshot.term ||
      nestedCourse?.term ||
      fallbackCourse?.term ||
      null,
  };

  return {
    type: String(snapshot.type || ""),
    content: String(snapshot.content || ""),
    course: getCourseLabel(course) ? course : fallbackCourse || null,
    difficulty:
      snapshot.difficulty == null || snapshot.difficulty === ""
        ? null
        : Number(snapshot.difficulty),
    points:
      snapshot.points == null || snapshot.points === ""
        ? null
        : Number(snapshot.points),
    options: normalizeEditableOptions(snapshot.options),
    correctAnswerIds: normalizeCorrectAnswerIds(snapshot.correctAnswer),
    explanation: String(snapshot.explanation || ""),
    tags: normalizeStringList(snapshot.tags ?? snapshot.tagNames ?? snapshot.labels ?? null),
    topics: normalizeStringList(
      snapshot.topicNames ??
        snapshot.topics ??
        snapshot.topicLabels ??
        snapshot.topicCodes ??
        null,
    ),
  };
};

export const getChangedComparisonFields = (
  before: QuestionComparisonSnapshot,
  after: QuestionComparisonSnapshot,
) =>
  COMPARISON_FIELDS.filter((field) => {
    switch (field.key) {
      case "content":
        return hasFieldChanged(before.content, after.content);
      case "type":
        return hasFieldChanged(before.type, after.type);
      case "options":
        return hasFieldChanged(serializeOptions(before.options), serializeOptions(after.options));
      case "correctAnswer":
        return hasFieldChanged(
          serializeCorrectAnswer(before.correctAnswerIds),
          serializeCorrectAnswer(after.correctAnswerIds),
        );
      case "explanation":
        return hasFieldChanged(before.explanation, after.explanation);
      case "difficulty":
        return hasFieldChanged(before.difficulty, after.difficulty);
      case "points":
        return hasFieldChanged(before.points, after.points);
      case "tags":
        return hasFieldChanged(before.tags, after.tags);
      case "topics":
        return hasFieldChanged(before.topics, after.topics);
      default:
        return false;
    }
  });

export const TERM_LABELS: Record<string, string> = {
  TERM_1: "H\u1ecdc k\u1ef3 1",
  TERM_2: "H\u1ecdc k\u1ef3 2",
  TERM_3: "H\u1ecdc k\u1ef3 3",
};

export const formatTerm = (term: string | null | undefined): string => {
  if (!term) return "Ch\u01b0a x\u00e1c \u0111\u1ecbnh h\u1ecdc k\u1ef3";
  return TERM_LABELS[term] || term;
};

export const formatAcademicYear = (year: string | null | undefined): string => {
  if (!year) return "Ch\u01b0a x\u00e1c \u0111\u1ecbnh n\u0103m h\u1ecdc";
  return year;
};

export const translateAiAnalysisText = (value?: string) => {
  if (!value) return "";
  return value
    .replace(/The question's current formulation lacks sufficient clarity regarding the application of WHERE and HAVING clauses when filtering aggregate results\./g, "Cách diễn đạt hiện tại chưa đủ rõ về việc sử dụng WHERE và HAVING khi lọc kết quả tổng hợp.")
    .replace(/The explanation is also too brief and doesn.t adequately illustrate the distinction\./g, "Phần giải thích còn quá ngắn và chưa làm rõ sự khác biệt.")
    .replace(/Question stem and explanation are not clear enough to differentiate between WHERE and HAVING clauses in the context of aggregate filtering\./g, "Đề bài và phần giải thích chưa đủ rõ để phân biệt WHERE và HAVING trong ngữ cảnh lọc dữ liệu tổng hợp.")
    .replace(/The 100% incorrect rate suggests students are struggling to identify the correct clause\./g, "Tỷ lệ sai 100% cho thấy sinh viên đang gặp khó khăn khi xác định mệnh đề đúng.");
};

export const translateMetricText = (value: string) =>
  value
    .replace(/% incorrect/g, "% sai")
    .replace(/Skip rate:/g, "T\u1ef7 l\u1ec7 b\u1ecf qua:")
    .replace(/Q(\d+)/g, "C\u00e2u $1")
    .replace(/Performance is strongest/g, "Hi\u1ec7u su\u1ea5t t\u1ed1t nh\u1ea5t")
    .replace(/but weakness concentrates in/g, "nh\u01b0ng \u0111i\u1ec3m y\u1ebfu t\u1eadp trung \u1edf")
    .replace(/Time pressure is highest on/g, "\u00c1p l\u1ef1c th\u1eddi gian cao nh\u1ea5t \u1edf")
    .replace(/Prioritize targeted timed practice/g, "\u01afu ti\u00ean luy\u1ec7n t\u1eadp c\u00f3 gi\u1edbi h\u1ea1n th\u1eddi gian")
    .replace(/before the next full test/g, "tr\u01b0\u1edbc b\u00e0i ki\u1ec3m tra \u0111\u1ea7y \u0111\u1ee7 ti\u1ebfp theo");

export type AttemptScope = "all" | "first" | "retakes" | "best" | "latest";

export type AttemptBreakdownItem = {
  attemptNo: number;
  submissionCount: number;
  avgScorePct: number;
  passRate: number;
};

export type AttemptStats = {
  maxAttempts: number | null;
  allowsMultipleAttempts: boolean;
  isUnlimited: boolean;
  totalUniqueStudents: number;
  studentsWithRetakes: number;
  retakeRate: number;
  avgAttemptsPerStudent: number;
  firstAttemptAvgScore: number;
  firstAttemptPassRate: number;
  retakeAttemptsAvgScore: number | null;
  retakeAttemptsPassRate: number | null;
  avgScoreImprovement: number | null;
  attemptBreakdown: AttemptBreakdownItem[];
};

export const getScopeForGradingStrategy = (strategy?: string | null): AttemptScope => {
  const s = String(strategy || "HIGHEST").toUpperCase();
  if (s === "FIRST_ATTEMPT") return "first";
  if (s === "LAST_ATTEMPT") return "latest";
  if (s === "AVERAGE") return "all";
  return "best"; // HIGHEST
};

export const getGradingStrategyLabel = (strategy?: string | null): string => {
  const s = String(strategy || "HIGHEST").toUpperCase();
  if (s === "FIRST_ATTEMPT") return "Lượt làm đầu tiên";
  if (s === "LAST_ATTEMPT") return "Lượt làm cuối cùng";
  if (s === "AVERAGE") return "Lấy điểm trung bình";
  return "Lấy điểm cao nhất";
};

export type IntelligencePayload = {
  exam: {
    id: string;
    title: string;
    courseId: string;
    maxAttempts?: number | null;
    gradingStrategy?: string | null;
    passingScore?: number | null;
    passingScorePct?: number | null;
  };
  gradingStrategy?: string | null;
  passingScorePct?: number | null;
  analyticsScope?: "OFFICIAL" | "PRACTICE";
  isUnlimited?: boolean;
  allowsMultipleAttempts?: boolean;
  attemptScope?: AttemptScope;
  attemptStats?: AttemptStats;
  kpis: {
    totalSubmissions: number;
    analyzedSubmissions?: number;
    completedSubmissions: number;
    completionRate: number;
    avgScorePct: number;
    passRate: number;
  };
  integritySignals?: {
    fastCompletions: Array<{
      submissionId: string;
      studentId: string;
      studentName: string;
      studentCode?: string | null;
      elapsedMinutes: number;
      allowedMinutes: number;
      completionRatio: number;
      scorePct: number;
      cohortMedianMinutes: number | null;
      severity: "REVIEW" | "HIGH";
      reasons: string[];
    }>;
    similarAnswerPairs: Array<{
      studentA: { submissionId: string; studentId: string; studentName: string; studentCode: string | null };
      studentB: { submissionId: string; studentId: string; studentName: string; studentCode: string | null };
      similarityScore: number;
      rareWrongMatches: number;
      comparableQuestions: number;
      evidence: Array<{
        questionIdentity: string;
        questionId: string;
        orderIndex: number | null;
        answer: string;
        answerCount: number;
        answerFrequency: number;
        weight: number;
      }>;
      severity: "REVIEW" | "HIGH";
    }>;
  };
  visualizations: {
    correctVsIncorrect: {
      correct: number;
      incorrect: number;
      skipped: number;
    };
    trendSeries: Array<{ date: string; avgScorePct: number }>;
  };
  mostIncorrectQuestions: Array<{
    questionId: string;
    orderIndex: number;
    questionText: string;
    incorrectRate: number;
    skipRate: number;
    flaggedCount: number;
    aiImprovement?: AiImprovementSummary | null;
    /**
     * Item-analysis signal, computed deterministically in code (not by AI):
     * set when one specific wrong option was picked by more students than
     * the keyed correct answer — the classic statistical signature of a
     * mis-keyed answer (lecturer marked the wrong option as correct), as
     * opposed to a question that's just genuinely hard.
     */
    possibleKeyError?: {
      mostPickedOptionLetter: string;
      mostPickedOptionRate: number;
      correctOptionLetter: string;
      correctOptionRate: number;
      sampleSize: number;
    } | null;
    /** Aggregate answer evidence for non-single-choice questions. It is
     * descriptive only and deliberately does not make a grading judgement. */
    answerPattern?: {
      kind: "FILL_IN_BLANK" | "ORDERING" | "MATCHING" | "TEXT";
      sampleSize: number;
      entries: Array<{ label: string; value: string; rate: number; count: number }>;
    } | null;
    action?: { path: string; params?: Record<string, string> };
  }>;
  weakestTopics: Array<{
    topicId?: string | null;
    topicName: string;
    incorrectRate: number;
    skipRate: number;
    action?: { path: string; params?: Record<string, string> };
  }>;
  slowestQuestionTypes: Array<{
    type: string;
    avgTimeSeconds: number;
    incorrectRate: number;
    action?: { path: string; params?: Record<string, string> };
  }>;
  mostFlaggedQuestions: Array<{
    questionId: string;
    orderIndex: number;
    flaggedCount: number;
    questionText: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  abnormalSkips: Array<{
    questionId: string;
    orderIndex: number;
    skipRate: number;
    questionText: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  aiSummary: string;
  aiRecommendations: Array<{
    title: string;
    detail: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
  creatorQualityAlerts: Array<{
    questionId: string;
    questionLabel: string;
    signal: string;
    suggestion: string;
    action?: { path: string; params?: Record<string, string> };
  }>;
};

export function toQuery(params?: Record<string, string>) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).length > 0) {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

