import { useState } from "react";
import { DEFAULT_QUESTION_OPTIONS } from "../question-editor-utils";
import type {
  EditableQuestion,
  QuestionDraft,
  QuestionOption,
} from "../question-editor-types";

export type EditorQuestionType =
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "find_error"
  | "ordering"
  | "essay";

const cloneDefaultOptions = (): QuestionOption[] =>
  DEFAULT_QUESTION_OPTIONS.map((option) => ({ ...option }));

const isAnswerObject = (
  value: EditableQuestion["correctAnswer"],
): value is Exclude<EditableQuestion["correctAnswer"], string | number | boolean | null> =>
  typeof value === "object" && value !== null;

export function useQuestionAnswerState() {
  const [options, setOptions] = useState<QuestionOption[]>(cloneDefaultOptions);
  const [multipleAnswers, setMultipleAnswers] = useState(false);
  const [pinnedOptions, setPinnedOptions] = useState<Set<string>>(new Set());
  const [tfAnswer, setTfAnswer] = useState<"true" | "false">("true");
  const [essayRubric, setEssayRubric] = useState("");
  const [essayMaxScore, setEssayMaxScore] = useState("10");
  const [essayMaxScoreError, setEssayMaxScoreError] = useState("");

  const restoreDraftAnswer = (draft: QuestionDraft) => {
    if (draft.options) setOptions(draft.options);
    if (draft.multipleAnswers !== undefined) setMultipleAnswers(draft.multipleAnswers);
    if (draft.tfAnswer) setTfAnswer(draft.tfAnswer);
    if (draft.essayRubric) setEssayRubric(draft.essayRubric);
    if (draft.essayMaxScore) setEssayMaxScore(draft.essayMaxScore);
  };

  const populateAnswer = (question: EditableQuestion) => {
    const correctAnswer = question.correctAnswer;
    if (
      question.type === "MULTIPLE_CHOICE" ||
      question.type === "MULTI_SELECT" ||
      question.type === "SINGLE_CHOICE" ||
      question.type === "FIND_ERROR"
    ) {
      let populatedOptions: QuestionOption[] = [];
      if (Array.isArray(question.options)) {
        populatedOptions = question.options.map((option: any, index) => ({
          id: String.fromCharCode(65 + index),
          text: String(option?.text ?? option ?? ""),
          isCorrect: false,
        }));
      } else if (question.options && typeof question.options === "object") {
        populatedOptions = Object.entries(question.options).map(([id, text]) => ({
          id,
          text: String(text ?? ""),
          isCorrect: false,
        }));
      }

      if (isAnswerObject(correctAnswer) && "answer" in correctAnswer) {
        const selected = String(correctAnswer.answer ?? "").split(",");
        populatedOptions = populatedOptions.map((option) => ({
          ...option,
          isCorrect: selected.includes(option.id),
        }));
      } else if (typeof correctAnswer === "number" && populatedOptions[correctAnswer]) {
        populatedOptions[correctAnswer].isCorrect = true;
      }

      if (populatedOptions.length) setOptions(populatedOptions);
      setMultipleAnswers(question.type === "MULTI_SELECT");
      return;
    }

    if (question.type === "TRUE_FALSE") {
      const answer = isAnswerObject(correctAnswer) ? correctAnswer.answer : correctAnswer;
      setTfAnswer(answer === true || answer === "A" || String(answer).toLowerCase() === "true" ? "true" : "false");
      return;
    }

    if (question.type === "MATCHING") {
      const pairs = isAnswerObject(correctAnswer) ? correctAnswer.pairs : undefined;
      if (Array.isArray(pairs)) {
        setOptions(pairs.map((pair: any, index) => ({
          id: String.fromCharCode(65 + index),
          text: String(pair?.left ?? ""),
          match: String(pair?.right ?? ""),
          isCorrect: false,
        })));
      }
      return;
    }

    if (question.type === "ORDERING") {
      const items = isAnswerObject(correctAnswer) ? correctAnswer.items : undefined;
      if (Array.isArray(items)) {
        setOptions(items.map((item, index) => ({
          id: String.fromCharCode(65 + index),
          text: String(item ?? ""),
          isCorrect: false,
        })));
      }
      return;
    }

    if (question.type === "ESSAY" || question.type === "SHORT_ANSWER") {
      const answer = isAnswerObject(correctAnswer) ? correctAnswer.answer : undefined;
      setEssayRubric(typeof answer === "string" ? answer : "");
      setEssayMaxScore(String(question.points || 10));
    }
  };

  const validateAnswer = (questionType: string): string[] => {
    const errors: string[] = [];
    if (questionType === "multiple_choice" || questionType === "find_error") {
      const filledOptions = options.filter((option) => option.text.trim());
      if (filledOptions.length < 2) {
        errors.push(questionType === "find_error" ? "At least 2 lines of code are required" : "At least 2 answer options are required");
      }
      const correctOptions = filledOptions.filter((option) => option.isCorrect);
      if (!correctOptions.length) {
        errors.push(questionType === "find_error" ? "Please mark which line contains the error" : "Please select at least one correct answer");
      }
      if (questionType === "multiple_choice" && !multipleAnswers && correctOptions.length > 1) {
        errors.push("Only one answer can be correct when 'Allow Multiple Answers' is disabled");
      }
    }
    if (questionType === "essay" && !essayRubric.trim()) errors.push("Grading rubric is required for essay questions");
    if (questionType === "matching" && options.filter((option) => option.text.trim() && option.match?.trim()).length < 2) {
      errors.push("At least 2 complete matching pairs (both sides filled) are required");
    }
    if (questionType === "ordering" && options.filter((option) => option.text.trim()).length < 2) {
      errors.push("At least 2 sequence items are required");
    }
    return errors;
  };

  const addOption = () => setOptions((current) => [
    ...current,
    { id: String.fromCharCode(65 + current.length), text: "", isCorrect: false },
  ]);
  const removeOption = (id: string) => setOptions((current) => current.length <= 2 ? current : current.filter((option) => option.id !== id));
  const updateOption = (id: string, text: string) => setOptions((current) => current.map((option) => option.id === id ? { ...option, text } : option));
  const updateOptionMatch = (id: string, match: string) => setOptions((current) => current.map((option) => option.id === id ? { ...option, match } : option));
  const moveOption = (id: string, direction: "up" | "down") => setOptions((current) => {
    const index = current.findIndex((option) => option.id === id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return current;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  });
  const toggleCorrectOption = (id: string) => setOptions((current) => multipleAnswers
    ? current.map((option) => option.id === id ? { ...option, isCorrect: !option.isCorrect } : option)
    : current.map((option) => ({ ...option, isCorrect: option.id === id })));
  const togglePinnedOption = (id: string) => setPinnedOptions((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const resetAnswer = () => {
    setOptions(cloneDefaultOptions());
    setMultipleAnswers(false);
    setPinnedOptions(new Set());
    setTfAnswer("true");
    setEssayRubric("");
    setEssayMaxScore("10");
    setEssayMaxScoreError("");
  };

  return {
    options, setOptions, multipleAnswers, setMultipleAnswers, pinnedOptions, setPinnedOptions,
    tfAnswer, setTfAnswer, essayRubric, setEssayRubric, essayMaxScore, setEssayMaxScore,
    essayMaxScoreError, setEssayMaxScoreError, restoreDraftAnswer, populateAnswer, validateAnswer,
    addOption, removeOption, updateOption, updateOptionMatch, moveOption, toggleCorrectOption,
    togglePinnedOption, resetAnswer,
  };
}
