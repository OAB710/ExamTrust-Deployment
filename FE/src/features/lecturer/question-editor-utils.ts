import { api, unwrapPaginatedData } from "@/lib/api";
import type { QuestionOption } from "./question-editor-types";

export const QUESTION_DRAFT_STORAGE_KEY = "question-draft";
export const DEFAULT_QUESTION_OPTIONS: QuestionOption[] = [
  { id: "A", text: "", isCorrect: true },
  { id: "B", text: "", isCorrect: false },
  { id: "C", text: "", isCorrect: false },
  { id: "D", text: "", isCorrect: false },
];

export function snapQuestionDifficulty(value: number) {
  return [0.3, 0.5, 0.7].reduce((previous, current) =>
    Math.abs(current - value) < Math.abs(previous - value) ? current : previous,
  );
}

export const normalizeQuestionText = (value: string) => String(value || "").toLowerCase().normalize("NFD")
  .replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export const questionTextSimilarity = (left: string, right: string) => {
  const first = normalizeQuestionText(left), second = normalizeQuestionText(right);
  if (!first || !second) return 0;
  if (first === second) return 1;
  if (first.includes(second) || second.includes(first)) return 0.95;
  const firstTokens = new Set(first.split(" ")), secondTokens = new Set(second.split(" "));
  let shared = 0;
  firstTokens.forEach((token) => { if (secondTokens.has(token)) shared += 1; });
  return shared / Math.max(firstTokens.size, secondTokens.size);
};

/**
 * Shared by the question-bank AI generator and the CreateExam manual-tab AI
 * assistant so both surfaces warn on the same near-duplicate threshold (0.8)
 * instead of drifting apart.
 */
export async function findMostSimilarQuestion(params: {
  courseId?: string;
  backendType: string;
  generatedText: string;
}): Promise<{ similarity: number } | null> {
  const existing = unwrapPaginatedData(
    await api.listQuestions({ courseId: params.courseId || undefined, type: params.backendType, limit: 200 }),
  );
  return (existing || []).reduce<{ similarity: number } | null>((best, item: any) => {
    const options = item?.options
      ? (Array.isArray(item.options) ? item.options.map((option: any) => String(option?.text ?? option ?? "")) : Object.values(item.options)).join(" ")
      : "";
    const score = questionTextSimilarity(params.generatedText, `${item?.content || item?.question || ""} ${options}`);
    return !best || score > best.similarity ? { similarity: score } : best;
  }, null);
}
