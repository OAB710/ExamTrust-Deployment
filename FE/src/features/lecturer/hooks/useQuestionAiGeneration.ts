import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { findMostSimilarQuestion, snapQuestionDifficulty } from "../question-editor-utils";
import type { CourseOption, QuestionOption } from "../question-editor-types";

type GeneratedQuestion = {
  content: string;
  explanation?: string;
  difficulty?: number;
  topic?: string;
  learningObjective?: string;
  options?: Record<string, string>;
  correctAnswer?: { answer?: string };
  points?: number;
  pairs?: Array<{ left?: string; right?: string }>;
  items?: string[];
};

type Params = {
  questionType: string;
  courseId: string;
  courses: CourseOption[];
  difficulty: number[];
  onContent: (value: string) => void;
  onExplanation: (value: string) => void;
  onDifficulty: (value: number[]) => void;
  onTopic: (value: string) => void;
  onLearningObjective: (value: string) => void;
  onOptions: (value: QuestionOption[]) => void;
  onEssayRubric: (value: string) => void;
};

const typeMap: Record<string, string> = {
  multiple_choice: "MULTIPLE_CHOICE", true_false: "TRUE_FALSE", essay: "ESSAY",
  fill_blank: "FILL_IN_BLANK", matching: "MATCHING", ordering: "ORDERING", find_error: "FIND_ERROR",
};

export function useQuestionAiGeneration(params: Params) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSimilarityWarning, setAiSimilarityWarning] = useState("");

  const applyGeneratedQuestion = (result: GeneratedQuestion) => {
    // Always overwrite content and explanation with AI result
    params.onContent(result.content || "");
    params.onExplanation(result.explanation || "");
    if (result.difficulty !== undefined && result.difficulty !== null) params.onDifficulty([snapQuestionDifficulty(Math.max(0, Math.min(1, result.difficulty)))]);
    if (result.topic) params.onTopic(result.topic);
    if (result.learningObjective) params.onLearningObjective(result.learningObjective);

    // Replace options for question types that use them
    if (["multiple_choice", "true_false", "find_error"].includes(params.questionType)) {
      if (result.options && typeof result.options === "object") {
        const correctIds = Array.isArray((result.correctAnswer as any)?.answers)
          ? (result.correctAnswer as any).answers.map(String)
          : String(result.correctAnswer?.answer || "").split(",");
        params.onOptions(Object.entries(result.options).map(([id, text]) => ({ id, text, isCorrect: correctIds.includes(id) })));
      } else {
        // No options in AI result → clear to defaults
        params.onOptions([]);
      }
    } else if (params.questionType === "essay") {
      params.onEssayRubric(result.correctAnswer?.answer || "");
    } else if (params.questionType === "matching") {
      if (Array.isArray(result.pairs)) {
        params.onOptions(result.pairs.map((pair, index) => ({ id: String.fromCharCode(65 + index), text: pair.left || "", match: pair.right || "", isCorrect: false })));
      } else {
        params.onOptions([]);
      }
    } else if (params.questionType === "ordering") {
      if (Array.isArray(result.items)) {
        params.onOptions(result.items.map((item, index) => ({ id: String.fromCharCode(65 + index), text: item || "", isCorrect: false })));
      } else {
        params.onOptions([]);
      }
    } else {
      // fill_blank: no options needed
      params.onOptions([]);
    }
  };

  const generate = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    if (!params.courseId) { setAiError("Hãy chọn học phần trước khi tạo câu hỏi bằng AI."); return; }
    setIsGenerating(true); setAiError(null); setAiSimilarityWarning("");
    try {
      const backendType = typeMap[params.questionType] || "MULTIPLE_CHOICE";
      const result = await api.aiGenerateQuestion({
        prompt: aiPrompt, questionType: backendType,
        difficulty: snapQuestionDifficulty(Math.max(0, Math.min(1, params.difficulty[0]))), language: "vi", useCase: "question_bank",
        context: { courseId: params.courseId, courseName: params.courses.find((course) => course.id === params.courseId)?.name, courseCode: params.courses.find((course) => course.id === params.courseId)?.code, questionType: backendType, source: "question_editor" },
      }) as GeneratedQuestion;
      const duplicate = await findMostSimilarQuestion({
        courseId: params.courseId,
        backendType,
        generatedText: `${result.content} ${result.options ? Object.values(result.options).join(" ") : ""}`,
      });
      if (duplicate && duplicate.similarity >= 0.8) {
        const message = `Câu hỏi AI tạo quá giống câu hỏi hiện có (${Math.round(duplicate.similarity * 100)}%). Hãy đổi yêu cầu hoặc tạo lại.`;
        setAiSimilarityWarning(message); toast.error(message); return;
      }
      applyGeneratedQuestion(result); setAiPrompt("");
    } catch (error: any) {
      const message = error?.message || "Không rõ lỗi";
      console.error("AI question generation failed:", error);
      setAiError(message); toast.error(`Tạo bằng AI thất bại: ${message}`);
    } finally { setIsGenerating(false); }
  };

  return { aiPrompt, setAiPrompt, isGenerating, aiError, aiSimilarityWarning, generate };
}
