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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildQuestionPayload(params: BuildPayloadParams) {
  const backendType = params.questionType === "multiple_choice" && params.multipleAnswers
    ? "MULTI_SELECT" : backendTypeByEditorType[params.questionType] || "MULTIPLE_CHOICE";
  const isOptionQuestion = params.questionType === "multiple_choice" || params.questionType === "find_error";
  const defaultPoints = Number.parseInt(params.scoreCoefficient, 10);

  const matchingPairs = params.questionType === "matching"
    ? params.options
        .filter((option) => option.text.trim() && option.match?.trim())
        .map((option) => ({ left: option.text, right: option.match as string }))
    : [];
  const orderingItems = params.questionType === "ordering"
    ? params.options.filter((option) => option.text.trim()).map((option) => option.text)
    : [];

  return {
    type: backendType,
    content: params.content,
    explanation: params.explanation,
    difficulty: Math.max(1, Math.min(10, Math.round((params.difficulty[0] <= 1 ? params.difficulty[0] * 10 : params.difficulty[0])))),
    // `points` remains for legacy readers. Exam scoring uses assignedScore,
    // initialized from this bank-level suggestion when the question is added.
    points: defaultPoints,
    defaultPoints,
    // Matching/ordering must carry their student-facing material in `options`
    // too, not only in `correctAnswer`: the exam-taking screen builds what it
    // shows students from `options` alone (`correctAnswer` is the hidden
    // grading key, stripped before reaching the student).
    options: isOptionQuestion
      ? params.options.filter((option) => option.text.trim()).reduce<Record<string, string>>((value, option) => ({ ...value, [option.id]: option.text }), {})
      : params.questionType === "true_false" ? { A: "True", B: "False" }
        : params.questionType === "matching" ? {
            left: matchingPairs.map((pair) => pair.left),
            // Shuffled once here since the exam-taking screen doesn't
            // re-shuffle options at render time for real exams (only the
            // practice-mode fallback does) — an unshuffled 1:1 order would
            // trivially give the correct pairing away by position.
            right: shuffle(matchingPairs.map((pair) => pair.right)),
          }
          : params.questionType === "ordering" ? orderingItems : {},
    correctAnswer: params.questionType === "find_error"
      ? { answers: params.options.filter((option) => option.isCorrect && option.text.trim()).map((option) => option.id) }
      : isOptionQuestion
      ? { answer: params.options.filter((option) => option.isCorrect).map((option) => option.id).join(",") }
      : params.questionType === "true_false" ? { answer: params.tfAnswer === "true" ? "A" : "B" }
        : params.questionType === "matching" ? { pairs: matchingPairs }
          : params.questionType === "ordering" ? { items: orderingItems }
            : params.questionType === "essay" ? { answer: params.essayRubric } : {},
  };
}
