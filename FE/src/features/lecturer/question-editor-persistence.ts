import type { QuestionOption } from "./question-editor-types";

export const editorTypeByBackendType: Record<string, string> = {
  MULTIPLE_CHOICE: "multiple_choice", MULTI_SELECT: "multiple_choice", SINGLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false", SHORT_ANSWER: "essay", ESSAY: "essay", FILL_IN_BLANK: "fill_blank",
  MATCHING: "matching", ORDERING: "ordering", FIND_ERROR: "find_error",
};

const backendTypeByEditorType: Record<string, string> = {
  multiple_choice: "MULTIPLE_CHOICE", true_false: "TRUE_FALSE", essay: "ESSAY", fill_blank: "FILL_IN_BLANK",
  matching: "MATCHING", ordering: "ORDERING", find_error: "FIND_ERROR",
};

export function toEditorQuestionType(type: string) {
  return editorTypeByBackendType[type] || type.toLowerCase();
}

export function toEditorDifficulty(value: unknown) {
  if (typeof value !== "number") return 0.5;
  return value > 1 ? Math.max(0, Math.min(1, value / 10)) : Math.max(0, Math.min(1, value));
}

type BuildPayloadParams = {
  questionType: string; multipleAnswers: boolean; content: string; explanation: string;
  difficulty: number[]; scoreCoefficient: string; tfAnswer: "true" | "false";
  essayRubric: string; options: QuestionOption[];
};

export function buildQuestionPayload(params: BuildPayloadParams) {
  const backendType = params.questionType === "multiple_choice" && params.multipleAnswers
    ? "MULTI_SELECT" : backendTypeByEditorType[params.questionType] || "MULTIPLE_CHOICE";
  const isOptionQuestion = params.questionType === "multiple_choice" || params.questionType === "find_error";
  const defaultPoints = Number.parseInt(params.scoreCoefficient, 10);
  return {
    type: backendType,
    content: params.content,
    explanation: params.explanation,
    difficulty: Math.max(1, Math.min(10, Math.round((params.difficulty[0] <= 1 ? params.difficulty[0] * 10 : params.difficulty[0])))),
    // `points` remains for legacy readers. Exam scoring uses assignedScore,
    // initialized from this bank-level suggestion when the question is added.
    points: defaultPoints,
    defaultPoints,
    options: isOptionQuestion
      ? params.options.filter((option) => option.text.trim()).reduce<Record<string, string>>((value, option) => ({ ...value, [option.id]: option.text }), {})
      : params.questionType === "true_false" ? { A: "True", B: "False" } : {},
    correctAnswer: isOptionQuestion
      ? { answer: params.options.filter((option) => option.isCorrect).map((option) => option.id).join(",") }
      : params.questionType === "true_false" ? { answer: params.tfAnswer === "true" ? "A" : "B" }
        : params.questionType === "matching" ? { pairs: params.options.filter((option) => option.text.trim() && option.match?.trim()).map((option) => ({ left: option.text, right: option.match })) }
          : params.questionType === "ordering" ? { items: params.options.filter((option) => option.text.trim()).map((option) => option.text) }
            : params.questionType === "essay" ? { answer: params.essayRubric } : {},
  };
}
