export interface Question {
  id: string;
  content: string;
  type: string;
  course?: { id?: string; code: string; name: string } | null;
  courseId?: string | null;
  difficulty: number;
  points: number;
  options?: unknown;
  correctAnswer?: unknown;
  explanation?: string | null;
  createdAt: string;
  updatedAt: string;
  mediaType?: "image" | "audio" | null;
  mediaUrl?: string | null;
}

export interface QuestionDraftSummary {
  content?: string;
  course?: string;
  questionType?: string;
  savedAt?: string;
}

export const QUESTION_DRAFT_STORAGE_KEY = "question-draft";
export const NO_OPTIONS_TYPES = new Set(["ESSAY", "SHORT_ANSWER"]);

export const typeLabels: Record<string, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm", MULTI_SELECT: "Nhiều đáp án", TRUE_FALSE: "Đúng / Sai",
  SHORT_ANSWER: "Trả lời ngắn", ESSAY: "Tự luận", FILL_IN_BLANK: "Điền vào chỗ trống",
  MATCHING: "Ghép đôi", ORDERING: "Sắp xếp", FIND_ERROR: "Tìm lỗi sai",
};

// The 9 backend `type` values collapse into 7 real question-type categories in
// the editor/exam UI: MULTIPLE_CHOICE/MULTI_SELECT are both "choice" questions
// (single vs. multi-select is just an answer-count toggle) and SHORT_ANSWER/ESSAY
// are both free-text answers. Use this canonical grouping wherever "how many of
// the N question types are used" is reported, so the denominator matches what
// lecturers actually pick from (7), not the raw enum count (9).
const CANONICAL_TYPE_BY_RAW_TYPE: Record<string, string> = {
  MULTIPLE_CHOICE: "CHOICE", MULTI_SELECT: "CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  FILL_IN_BLANK: "FILL_IN_BLANK",
  MATCHING: "MATCHING",
  ORDERING: "ORDERING",
  FIND_ERROR: "FIND_ERROR",
  SHORT_ANSWER: "TEXT_ANSWER", ESSAY: "TEXT_ANSWER",
};

export const CANONICAL_QUESTION_TYPE_COUNT = new Set(
  Object.values(CANONICAL_TYPE_BY_RAW_TYPE),
).size;

export function canonicalQuestionType(type: string): string {
  return CANONICAL_TYPE_BY_RAW_TYPE[type] || type;
}

const safeParseJson = (value: unknown): unknown => {
  if (value == null || typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return value; }
};

export function normalizeOptions(options: unknown): { id: string; text: string }[] {
  const raw = safeParseJson(options);
  if (!raw) return [];
  if (Array.isArray(raw) && raw.every((value) => typeof value === "string")) {
    return raw.map((text, index) => ({ id: String.fromCharCode(65 + index), text }));
  }
  if (Array.isArray(raw) && raw.every((value) => typeof value === "object" && value !== null)) {
    return raw.map((item: any, index) => ({ id: item.id ?? String.fromCharCode(65 + index), text: item.text ?? item.label ?? JSON.stringify(item) }));
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return Object.entries(raw).map(([id, text]) => ({ id, text: String(text ?? "") }));
  }
  return typeof raw === "string" ? [{ id: "A", text: raw }] : [];
}

export function normalizeCorrectAnswer(correctAnswer: unknown): string[] {
  const raw = safeParseJson(correctAnswer);
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((value) => String(value ?? ""));
  if (typeof raw === "object") {
    const value = raw as Record<string, unknown>;
    if (value.optionId) return [String(value.optionId)];
    if (value.answer != null) {
      const ans = typeof value.answer === "object" ? JSON.stringify(value.answer) : String(value.answer);
      return ans.split(",").map((a) => a.trim());
    }
    const keys = Object.entries(value).filter(([, a]) => [true, "true", 1, "1"].includes(a as any)).map(([key]) => key);
    if (keys.length > 0) return keys;
    // Empty or unrecognized object → no answers to display
    return [];
  }
  return [String(raw)];
}

export function formatDateSafe(value?: string | Date | null): string {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

export const difficultyLabel = (difficulty: number) => {
  const value = Number.isFinite(difficulty) ? Math.round(difficulty) : 1;
  if (value <= 4) return { text: "Dễ", color: "text-green-600" };
  if (value === 5) return { text: "Trung bình", color: "text-yellow-600" };
  return { text: "Khó", color: "text-red-600" };
};
