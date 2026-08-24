import type { ReactNode } from "react";
import { BookOpen, Eye, FileText, Settings } from "lucide-react";
import type { CourseTerm } from "@/lib/course-term";

// ─── Steps ───────────────────────────────────────────────────────
export type Step = "info" | "settings" | "questions" | "preview";
export const STEPS: { key: Step; label: string; icon: ReactNode }[] = [
  { key: "info", label: "Thông tin cơ bản", icon: <FileText className="h-4 w-4" /> },
  {
    key: "settings",
    label: "Cài đặt",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    key: "questions",
    label: "Câu hỏi",
    icon: <BookOpen className="h-4 w-4" />,
  },
  { key: "preview", label: "Xem trước", icon: <Eye className="h-4 w-4" /> },
];

export interface ExamForm {
  title: string;
  course: string;
  description: string;
  duration: string;
  unlimitedTime: boolean;
  maxAttempts: string;
  gradingStrategy: "HIGHEST" | "AVERAGE" | "FIRST_ATTEMPT" | "LAST_ATTEMPT";
  passingScore: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  requiresProctoring: boolean;
  webcamEvidenceEnabled: boolean;
  webcamEvidenceMouseIdleThresholdSeconds: string;
  webcamEvidenceCooldownSeconds: string;
  webcamEvidenceScheduledIntervalSeconds: string;
  screenCaptureEnabled: boolean;
  allowLateSubmission: boolean;
  shuffleQuestions: boolean;
  showResultImmediately: boolean;
  questionType: string;
  bankDifficulty: string;
  questionCount: string;
  sourceMethod: "bank" | "import" | "ai";
  aiGenerationMode: boolean;
  aiPrompt: string;
  aiDifficulty: string;
  aiReviewRequired: boolean;
}

// Điểm, đúng/sai và đáp án đúng KHÔNG còn cho giảng viên tùy chọn theo giai
// đoạn nữa: trong lúc thi luôn ẩn cả 3 (tránh sinh viên trao đổi chéo suy ra
// đáp án khi đề thi mở theo khung giờ dài), và sau khi công bố kết quả luôn
// hiện đầy đủ cả 3 (sinh viên cần thấy kết quả thật của mình). Phần duy nhất
// giảng viên còn quyền quyết định là "showFeedback" — nhưng nó gộp 2 nguồn
// khác nhau ở BE: trong lúc thi chỉ có thể là Question.explanation (giải
// thích đáp án viết sẵn từ lúc tạo câu hỏi, giống nhau cho mọi sinh viên —
// chưa chấm bài thì chưa có nhận xét cá nhân); sau khi có kết quả thì gồm cả
// giải thích đó (câu tự động chấm) VÀ SubmissionAnswer.feedback (nhận xét
// riêng giảng viên viết khi chấm tay câu tự luận). feedbackDuring/feedbackAfter
// bật/tắt việc hiện thứ đó ở mỗi giai đoạn — không phải 2 loại nội dung khác nhau.
export type ReviewSettingsDraft = {
  feedbackDuring: boolean;
  feedbackAfter: boolean;
  // Independent of "công bố kết quả" (resultsPublishedAt) and of the score
  // reveal rules above — this gates whether the student can ever open the
  // per-question breakdown (question content, their own answer, correct
  // answer, explanation/feedback) at all. Off means only the score summary
  // cards on /student/grading show; the question-by-question review never
  // appears, published or not.
  allowSubmissionReview: boolean;
};

export const createDefaultReviewSettingsDraft = (): ReviewSettingsDraft => ({
  feedbackDuring: false,
  feedbackAfter: true,
  allowSubmissionReview: true,
});

// Exams saved before this simplification stored a full during/after phase
// matrix (showScore/showAnswers/showCorrectness/showFeedback). Reading them
// back only recovers the "showFeedback" bit of each phase — the rest is now
// fixed by policy rather than per-exam config. An exam that was never
// customized (reviewSettings.enabled falsy/missing) defaults to "after"
// feedback visible, matching the old implicit default. allowSubmissionReview
// is newer still than that simplification, so it defaults to true (on)
// regardless of isCustomized — an older exam predating the field should keep
// behaving exactly as it always did (review always available).
export const normalizeReviewSettingsDraft = (raw: any): ReviewSettingsDraft => {
  const isCustomized = Boolean(raw?.enabled);
  return {
    feedbackDuring: isCustomized ? Boolean(raw?.phases?.during?.showFeedback) : false,
    feedbackAfter: isCustomized ? Boolean(raw?.phases?.after?.showFeedback) : true,
    allowSubmissionReview: raw?.allowSubmissionReview ?? true,
  };
};

export const buildReviewSettingsPayload = (draft: ReviewSettingsDraft) => ({
  type: "phase-based",
  enabled: true,
  allowSubmissionReview: draft.allowSubmissionReview,
  phases: {
    during: {
      showCorrectness: false,
      showScore: false,
      showAnswers: false,
      showFeedback: draft.feedbackDuring,
    },
    after: {
      showCorrectness: true,
      showScore: true,
      showAnswers: true,
      showFeedback: draft.feedbackAfter,
    },
  },
});

export const pad2 = (value: number) => String(value).padStart(2, "0");

export const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
};

export const toTimeInputValue = (date: Date) =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;

export const getDefaultExamWindow = () => {
  const now = new Date();

  // Round forward to the next hour (e.g. 09:15 -> 10:00, 09:00 -> 10:00).
  const start = new Date(now);
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);

  // End time defaults to one hour after the rounded start time.
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  return {
    startDate: toDateInputValue(start),
    startTime: toTimeInputValue(start),
    endDate: toDateInputValue(end),
    endTime: toTimeInputValue(end),
  };
};

export const createDefaultForm = (): ExamForm => {
  const examWindow = getDefaultExamWindow();

  return {
    title: "",
    course: "",
    description: "",
    duration: "60",
    unlimitedTime: false,
    maxAttempts: "1",
    gradingStrategy: "HIGHEST",
    passingScore: "50",
    startDate: examWindow.startDate,
    startTime: examWindow.startTime,
    endDate: examWindow.endDate,
    endTime: examWindow.endTime,
    requiresProctoring: true,
    webcamEvidenceEnabled: false,
    webcamEvidenceMouseIdleThresholdSeconds: "60",
    webcamEvidenceCooldownSeconds: "60",
    webcamEvidenceScheduledIntervalSeconds: "",
    screenCaptureEnabled: false,
    allowLateSubmission: false,
    shuffleQuestions: true,
    showResultImmediately: false,
    questionType: "mixed",
    bankDifficulty: "mixed",
    questionCount: "20",
    sourceMethod: "bank",
    aiGenerationMode: false,
    aiPrompt: "",
    aiDifficulty: "medium",
    aiReviewRequired: true,
  };
};

export const getCurrentCourseTerm = (date = new Date()): CourseTerm => {
  const month = date.getMonth() + 1;
  if (month >= 8) return "TERM_1";
  if (month >= 6) return "SUMMER";
  return "TERM_2";
};

export interface CourseOption {
  id: string;
  code: string;
  name: string;
  academicYear?: string | null;
  term?: CourseTerm | null;
}

export interface BankTopic {
  topicId: string;
  topic: string;
  count: number;
  selected: boolean;
  requestedCount: string;
  availableByType: Record<string, number>;
}

export type QuestionSourceMode = "choose" | "manual" | "bank-select" | "bank-random";

export interface BankQuestionOption {
  id: string;
  type: string;
  content: string;
  difficulty?: number;
  isVersionReady: boolean;
  mediaType?: "image" | "audio";
}

export interface ManualQuestionOption {
  id: string;
  text: string;
  match?: string;
  isCorrect: boolean;
}

export const createDefaultManualOptions = (): ManualQuestionOption[] => [
  { id: "A", text: "", isCorrect: true },
  { id: "B", text: "", isCorrect: false },
  { id: "C", text: "", isCorrect: false },
  { id: "D", text: "", isCorrect: false },
];

export const QUESTION_TYPE_OPTIONS = [
  { value: "mixed", label: "Trộn tất cả các loại" },
  { value: "single-choice", label: "Chỉ một lựa chọn" },
  { value: "multiple-choice", label: "Chỉ trắc nghiệm nhiều lựa chọn" },
  { value: "true-false", label: "Chỉ Đúng / Sai" },
  { value: "fill-blank", label: "Chỉ điền vào chỗ trống" },
  { value: "matching", label: "Chỉ ghép đôi" },
  { value: "ordering", label: "Chỉ sắp xếp theo thứ tự" },
  { value: "find-error", label: "Chỉ tìm lỗi sai" },
  { value: "short-answer", label: "Chỉ trả lời ngắn / tự luận" },
  { value: "custom", label: "Tùy chỉnh (Khác)" },
] as const;

export const GRADING_STRATEGY_OPTIONS = [
  { value: "HIGHEST", label: "Lấy điểm cao nhất" },
  { value: "AVERAGE", label: "Lấy điểm trung bình" },
  { value: "FIRST_ATTEMPT", label: "Lượt làm đầu tiên" },
  { value: "LAST_ATTEMPT", label: "Lượt làm cuối cùng" },
] as const;

export const getGradingStrategyLabel = (value: string) =>
  GRADING_STRATEGY_OPTIONS.find((option) => option.value === value)?.label || value;

export const difficultyOptionToValue = (option: string): number => {
  if (option === "easy") return 0.3;
  if (option === "hard") return 0.7;
  return 0.5;
};

export const difficultyOptionToBankValue = (option: string): string => {
  if (option === "mixed") return "mixed";
  return String(difficultyOptionToValue(option));
};

// Bank questions store difficulty as an integer 1..10 (see QuestionEditor's
// Easy/Medium/Hard buttons: 0.3/0.5/0.7 slider values * 10 => ~3/5/7).
export const difficultyLabelFromValue = (
  value: unknown,
): "Easy" | "Medium" | "Hard" => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "Medium";
  if (n <= 4) return "Easy";
  if (n <= 5) return "Medium";
  return "Hard";
};

const DIFFICULTY_LABEL_VI: Record<"Easy" | "Medium" | "Hard", string> = {
  Easy: "Dễ",
  Medium: "Trung bình",
  Hard: "Khó",
};

// Vietnamese display text for a difficulty badge. difficultyLabelFromValue's
// own return value stays in English since it also doubles as an internal
// matching key (e.g. compared against form.bankDifficulty / manualDifficulty).
export const difficultyLabelViFromValue = (value: unknown) =>
  DIFFICULTY_LABEL_VI[difficultyLabelFromValue(value)];

export const mapQuestionTypeToAiApi = (value: string) => {
  const map: Record<string, string> = {
    mixed: "MIXED",
    custom: "MIXED",
    "single-choice": "MULTIPLE_CHOICE",
    "multiple-choice": "MULTIPLE_CHOICE",
    "true-false": "TRUE_FALSE",
    "fill-blank": "FILL_IN_BLANK",
    matching: "MATCHING",
    ordering: "ORDERING",
    "find-error": "FIND_ERROR",
    "short-answer": "SHORT_ANSWER",
  };
  return map[value] || "MIXED";
};

export const mapQuestionTypeToDb = (value: string) => {
  const map: Record<string, string> = {
    MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
    MULTI_SELECT: "MULTI_SELECT",
    TRUE_FALSE: "TRUE_FALSE",
    SHORT_ANSWER: "SHORT_ANSWER",
    ESSAY: "ESSAY",
    FILL_IN_BLANK: "FILL_IN_BLANK",
    MATCHING: "MATCHING",
    ORDERING: "ORDERING",
    FIND_ERROR: "FIND_ERROR",
    "single-choice": "MULTIPLE_CHOICE",
    "multiple-choice": "MULTIPLE_CHOICE",
    "true-false": "TRUE_FALSE",
    "short-answer": "SHORT_ANSWER",
    "fill-blank": "FILL_IN_BLANK",
    "find-error": "FIND_ERROR",
    mixed: "MULTIPLE_CHOICE",
    custom: "MULTIPLE_CHOICE",
  };

  const normalized = String(value || "").trim();
  return map[normalized] || map[normalized.toUpperCase()] || "MULTIPLE_CHOICE";
};

// Tags removed from question model

export const WHOLE_COURSE_LABEL = "Tất cả câu hỏi trong học phần";

export const normalizeDifficultyForQuestion = (value: unknown) => {
  const n = Number(value);
  if (Number.isNaN(n)) return 5;
  if (n <= 1) return Math.max(1, Math.min(10, Math.round(n * 9 + 1)));
  return Math.max(1, Math.min(10, Math.round(n)));
};
