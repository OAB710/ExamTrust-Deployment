import type { FilterDefinition, FilterValues } from "@/components/common/list/filter-types";
import { difficultyLabel, typeLabels, type Question } from "./question-bank-utils";

export const EMPTY_COURSE_FILTERS: FilterValues = { questionState: "all", difficulty: "all" };
export const EMPTY_QUESTION_FILTERS: FilterValues = { type: "all", difficulty: "all", topicId: "all", points: { min: undefined, max: undefined } };

const difficultyOptions = [
  { label: "Dễ", value: "easy" },
  { label: "Trung bình", value: "medium" },
  { label: "Khó", value: "hard" },
];

export const courseFilterDefinitions: FilterDefinition[] = [
  { key: "questionState", label: "Trạng thái câu hỏi", type: "select", allLabel: "Tất cả khóa học", options: [{ label: "Có câu hỏi", value: "hasQuestions" }, { label: "Không có câu hỏi", value: "noQuestions" }] },
  { key: "difficulty", label: "Độ khó", type: "select", allLabel: "Tất cả độ khó", options: difficultyOptions },
];

export const questionFilterDefinitions: FilterDefinition[] = [
  { key: "type", label: "Loại câu hỏi", type: "select", allLabel: "Tất cả loại", options: Object.entries(typeLabels).map(([value, label]) => ({ value, label })) },
  { key: "difficulty", label: "Độ khó", type: "select", allLabel: "Tất cả độ khó", options: difficultyOptions },
  { key: "points", label: "Trọng số", type: "number-range", min: 0, max: 20, step: 1 },
];

export function buildQuestionFilterDefinitions(
  topics: { id: string; name: string }[],
): FilterDefinition[] {
  return [
    ...questionFilterDefinitions,
    {
      key: "topicId",
      label: "Chủ đề",
      type: "select",
      allLabel: "Tất cả chủ đề",
      options: topics.map((topic) => ({ value: topic.id, label: topic.name })),
    },
  ];
}

type SortBy = "difficulty" | "points" | "updatedAt";
type SortDirection = "asc" | "desc";

export function filterAndSortQuestions(params: {
  questions: Question[]; selectedCourse: string | null; search: string; filters: FilterValues; sortBy: SortBy; sortDir: SortDirection;
}): Question[] {
  const search = params.search.trim().toLowerCase();
  const type = params.filters.type as string | undefined;
  const difficulty = params.filters.difficulty as string | undefined;
  const topicId = params.filters.topicId as string | undefined;
  const points = params.filters.points as { min?: number; max?: number } | undefined;
  const multiplier = params.sortDir === "asc" ? 1 : -1;

  return params.questions.filter((question) => {
    const matchesSearch = question.content.toLowerCase().includes(search) || question.id.toLowerCase().includes(search);
    const matchesCourse = !params.selectedCourse || question.course?.code === params.selectedCourse;
    const matchesType = !type || type === "all" || question.type === type;
    const matchesDifficulty = !difficulty || difficulty === "all" || difficultyLabel(question.difficulty || 1).text.toLowerCase() === difficulty;
    const matchesTopic = !topicId || topicId === "all" || question.topic?.id === topicId;
    const score = question.points || 0;
    const matchesPoints = !points || ((points.min === undefined || score >= points.min) && (points.max === undefined || score <= points.max));
    return matchesSearch && matchesCourse && matchesType && matchesDifficulty && matchesTopic && matchesPoints;
  }).sort((a, b) => {
    if (params.sortBy === "difficulty") return ((a.difficulty || 1) - (b.difficulty || 1)) * multiplier;
    if (params.sortBy === "points") return ((a.points || 1) - (b.points || 1)) * multiplier;
    return ((a.updatedAt ? new Date(a.updatedAt).getTime() : 0) - (b.updatedAt ? new Date(b.updatedAt).getTime() : 0)) * multiplier;
  });
}
