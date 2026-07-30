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
