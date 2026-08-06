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
  SHORT_ANSWER: "Trả lời ngắn", ESSAY: "Tự luận", FILL_IN_BLANK: "Điền khuyết",
  MATCHING: "Ghép đôi", ORDERING: "Sắp xếp", FIND_ERROR: "Tìm lỗi sai",
};

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
    if (value.answer != null) return String(value.answer).split(",").map((answer) => answer.trim());
    return Object.entries(value).filter(([, answer]) => [true, "true", 1, "1"].includes(answer as any)).map(([key]) => key);
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
