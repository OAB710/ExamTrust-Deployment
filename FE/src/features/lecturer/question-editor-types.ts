export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  match?: string;
}

export type CorrectAnswerPayload =
  | string
  | number
  | boolean
  | {
      answer?: string | boolean;
      items?: unknown[];
      pairs?: Array<{ left?: string; right?: string }>;
      [key: string]: unknown;
    }
  | null;

export interface EditableQuestion {
  id: string;
  type: string;
  content: string;
  options?: unknown;
  correctAnswer?: CorrectAnswerPayload;
  explanation?: string;
  difficulty: number;
  points: number;
  defaultPoints?: number;
  course?: { id: string; code: string; name: string };
  topic?: { id: string; code: string; name: string } | null;
  learningObjectives?: string;
}

export type CourseOption = { id: string; code: string; name: string };
export type TopicOption = CourseOption;
export type QuestionDraft = Partial<{
  content: string; explanation: string; course: string; topic: string; difficulty: number[];
  questionType: string; options: QuestionOption[]; multipleAnswers: boolean; tfAnswer: "true" | "false";
  essayRubric: string; scoreCoefficient: string; learningObjective: string; hasMedia: boolean; mediaType: "image" | "audio";
}>;
