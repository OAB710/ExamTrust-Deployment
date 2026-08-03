import { useState } from "react";
import { toast } from "sonner";
import { api, unwrapPaginatedData } from "@/lib/api";
import { snapQuestionDifficulty } from "../question-editor-utils";
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

const normalize = (value: string) => String(value || "").toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const similarity = (left: string, right: string) => {
  const first = normalize(left), second = normalize(right);
  if (!first || !second) return 0;
  if (first === second) return 1;
  if (first.includes(second) || second.includes(first)) return 0.95;
  const firstTokens = new Set(first.split(" ")), secondTokens = new Set(second.split(" "));
  let shared = 0;
  firstTokens.forEach((token) => { if (secondTokens.has(token)) shared += 1; });
  return shared / Math.max(firstTokens.size, secondTokens.size);
};

export function useQuestionAiGeneration(params: Params) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSimilarityWarning, setAiSimilarityWarning] = useState("");

  const findSimilarQuestion = async (generated: GeneratedQuestion, backendType: string) => {
    const existing = unwrapPaginatedData(await api.listQuestions({ courseId: params.courseId || undefined, type: backendType, limit: 200 }));
    const generatedText = `${generated.content} ${generated.options ? Object.values(generated.options).join(" ") : ""}`;
    return (existing || []).reduce<{ similarity: number } | null>((best, item: any) => {
      const options = item?.options ? (Array.isArray(item.options) ? item.options.map((option: any) => String(option?.text ?? option ?? "")) : Object.values(item.options)).join(" ") : "";
      const score = similarity(generatedText, `${item?.content || item?.question || ""} ${options}`);
      return !best || score > best.similarity ? { similarity: score } : best;
    }, null);
  };

  const applyGeneratedQuestion = (result: GeneratedQuestion) => {
    params.onContent(result.content);
    if (result.explanation) params.onExplanation(result.explanation);
    if (result.difficulty !== undefined && result.difficulty !== null) params.onDifficulty([snapQuestionDifficulty(Math.max(0, Math.min(1, result.difficulty)))]);
    if (result.topic) params.onTopic(result.topic);
    if (result.learningObjective) params.onLearningObjective(result.learningObjective);
    if (result.options && ["multiple_choice", "true_false", "find_error"].includes(params.questionType)) {
      const correctIds = Array.isArray((result.correctAnswer as any)?.answers)
        ? (result.correctAnswer as any).answers.map(String)
        : String(result.correctAnswer?.answer || "").split(",");
      params.onOptions(Object.entries(result.options).map(([id, text]) => ({ id, text, isCorrect: correctIds.includes(id) })));
    }
    if (params.questionType === "essay" && result.correctAnswer?.answer) {
      params.onEssayRubric(result.correctAnswer.answer);
    }
    if (params.questionType === "matching" && Array.isArray(result.pairs)) {
      params.onOptions(result.pairs.map((pair, index) => ({ id: String.fromCharCode(65 + index), text: pair.left || "", match: pair.right || "", isCorrect: false })));
    }
    if (params.questionType === "ordering" && Array.isArray(result.items)) {
      params.onOptions(result.items.map((item, index) => ({ id: String.fromCharCode(65 + index), text: item || "", isCorrect: false })));
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
      const duplicate = await findSimilarQuestion(result, backendType);
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
