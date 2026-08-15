"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ContextHelp, HelpedTitle } from "@/components/common/ContextHelp";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { DurationInput } from "@/components/common/DurationInput";
import { TimePickerVi } from "@/components/common/TimePickerVi";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import api, { unwrapPaginatedData } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Shield,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Check,
  Plus,
  FileText,
  Settings,
  Eye,
  Sparkles,
  Wand2,
  AlertCircle,
  Upload,
  FileCheck,
  FileSearch,
  Database,
  Loader2,
  Trash2,
  Image,
  Music,
  Camera,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { BackToDashboardButton } from "@/components/common/BackToDashboardButton";
import { useQuestionAnswerState } from "./hooks/useQuestionAnswerState";
import { useQuestionTopics } from "./hooks/useQuestionTopics";
import { FillBlankGuide, QuestionAnswerEditor } from "./components/QuestionAnswerEditor";
import { QuestionTopicDialog } from "./components/QuestionTopicDialog";
import { buildQuestionPayload } from "./question-editor-persistence";
import { findMostSimilarQuestion } from "./question-editor-utils";
import {
  MEDIA_ACCEPT,
  MEDIA_MAX_BYTES,
  releaseMediaUpload,
  uploadMediaFile,
  validateMediaFile,
  type MediaAttachment,
} from "./question-editor-media";
import {
  getNumericInputError,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/lib/number-input";
import {
  COURSE_TERM_OPTIONS,
  formatCourseTerm,
  getAcademicYearOptions,
  type CourseTerm,
} from "@/lib/course-term";
import { cn } from "@/lib/utils";
import {
  MAX_ATTEMPT_OPTIONS,
  QUESTION_TYPE_OPTIONS,
  REVIEW_PHASE_META,
  STEPS,
  WHOLE_COURSE_LABEL,
  buildReviewSettingsPayload,
  createDefaultForm,
  createDefaultReviewSettingsDraft,
  difficultyLabelFromValue,
  difficultyLabelViFromValue,
  difficultyOptionToBankValue,
  difficultyOptionToValue,
  getDefaultExamWindow,
  mapQuestionTypeToAiApi,
  mapQuestionTypeToDb,
  normalizeDifficultyForQuestion,
  pad2,
  reviewPhaseSummary,
  toDateInputValue,
  toTimeInputValue,
  type BankQuestionOption,
  type BankTopic,
  type CourseOption,
  type ExamForm,
  type QuestionSourceMode,
  type ReviewSettingsDraft,
  type Step,
} from "./create-exam-model";

export default function CreateExam() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("info");
  const [form, setForm] = useState<ExamForm>(() => createDefaultForm());
  const [isCreating, setIsCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [isStandardizing, setIsStandardizing] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const docFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedQuestions, setAiGeneratedQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [bankTopics, setBankTopics] = useState<BankTopic[]>([]);
  const [isLoadingBankTopics, setIsLoadingBankTopics] = useState(false);
  const [numberErrors, setNumberErrors] = useState<Record<string, string>>({});
  const [reviewSettingsDraft, setReviewSettingsDraft] = useState<ReviewSettingsDraft>(() => createDefaultReviewSettingsDraft());
  const [questionSourceMode, setQuestionSourceMode] = useState<QuestionSourceMode>("manual");
  const [selectedBankTopicId, setSelectedBankTopicId] = useState("");
  const [bankQuestions, setBankQuestions] = useState<BankQuestionOption[]>([]);
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<string[]>([]);
  const [isLoadingBankQuestions, setIsLoadingBankQuestions] = useState(false);
  const [manualQuestionContent, setManualQuestionContent] = useState("");
  const [manualQuestionType, setManualQuestionType] = useState("multiple_choice");
  const {
    options: manualOptions,
    setOptions: setManualOptions,
    multipleAnswers: manualMultipleAnswers,
    setMultipleAnswers: setManualMultipleAnswers,
    pinnedOptions: manualPinnedOptions,
    setPinnedOptions: setManualPinnedOptions,
    tfAnswer: manualTrueFalseAnswer,
    setTfAnswer: setManualTrueFalseAnswer,
    essayRubric: manualEssayRubric,
    setEssayRubric: setManualEssayRubric,
    addOption: addManualOption,
    removeOption: removeManualOption,
    updateOption: updateManualOption,
    updateOptionMatch: updateManualOptionMatch,
    moveOption: moveManualOption,
    toggleCorrectOption: toggleManualCorrectOption,
    togglePinnedOption: toggleManualPinnedOption,
    resetAnswer: resetManualAnswer,
  } = useQuestionAnswerState();
  const [manualExplanation, setManualExplanation] = useState("");
  const [manualDifficulty, setManualDifficulty] = useState("medium");
  const [manualTopicId, setManualTopicId] = useState("");
  const [manualHasMedia, setManualHasMedia] = useState(false);
  const [manualMediaType, setManualMediaType] = useState<"image" | "audio">("image");
  const [manualMediaAttachment, setManualMediaAttachment] = useState<MediaAttachment | null>(null);
  const [manualMediaUploading, setManualMediaUploading] = useState(false);
  const manualMediaFileInputRef = useRef<HTMLInputElement | null>(null);
  const manualTopics = useQuestionTopics({
    courseId: form.course,
    selectedTopicId: manualTopicId,
    onSelectTopic: setManualTopicId,
  });
  const [manualLearningObjective, setManualLearningObjective] = useState("");
  const [manualAiPrompt, setManualAiPrompt] = useState("");
  const [isManualAiGenerating, setIsManualAiGenerating] = useState(false);
  const [manualAiSimilarityWarning, setManualAiSimilarityWarning] = useState("");
  const [courseComboboxOpen, setCourseComboboxOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const skipNextCourseFocusRef = useRef(false);
  const [courseAcademicYearFilter, setCourseAcademicYearFilter] = useState("all");
  const [courseTermFilter, setCourseTermFilter] = useState<CourseTerm | "all">("all");
  const isSingleAttempt = form.maxAttempts === "1";
  const hasUnlimitedAttempts = form.maxAttempts === "unlimited";
  const proctoringForcedOff = hasUnlimitedAttempts || form.unlimitedTime;
  const effectiveProctoring = form.requiresProctoring && !proctoringForcedOff;

  useEffect(() => {
    if (proctoringForcedOff && form.requiresProctoring) {
      setForm((current) => ({ ...current, requiresProctoring: false }));
    }
  }, [form.requiresProctoring, proctoringForcedOff]);

  useEffect(() => {
    if (isSingleAttempt && form.allowLateSubmission) {
      setForm((current) =>
        current.allowLateSubmission
          ? { ...current, allowLateSubmission: false }
          : current,
      );
    }
  }, [form.allowLateSubmission, isSingleAttempt]);

  const set = (key: keyof ExamForm, val: string | boolean) =>
    setForm((f) => ({ ...f, [key]: val }));

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.course),
    [courses, form.course],
  );

  const selectedCourseLabel = selectedCourse
    ? `${selectedCourse.code} - ${selectedCourse.name}`
    : "";

  const filteredCourses = useMemo(() => {
    const query = courseSearch.trim().toLowerCase();

    return courses.filter((course) =>
      (!query ||
        `${course.code} ${course.name}`.toLowerCase().includes(query)) &&
      (courseAcademicYearFilter === "all" ||
        course.academicYear === courseAcademicYearFilter) &&
      (courseTermFilter === "all" || course.term === courseTermFilter),
    );
  }, [courseAcademicYearFilter, courseSearch, courseTermFilter, courses]);

  const courseAcademicYearOptions = useMemo(() => {
    const years = new Set(getAcademicYearOptions());
    courses.forEach((course) => {
      if (course.academicYear) years.add(course.academicYear);
    });

    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [courses]);

  const resetCourseFilters = () => {
    setCourseSearch("");
    setCourseAcademicYearFilter("all");
    setCourseTermFilter("all");
  };

  const bankSelectionWarning = useMemo(() => {
    const selectedTopics = bankTopics.filter((topic) => topic.selected);
    if (selectedTopics.length === 0) return "";

    const typeFilter =
      form.questionType === "mixed" || form.questionType === "custom"
        ? undefined
        : mapQuestionTypeToDb(form.questionType);

    for (const topic of selectedTopics) {
      const requested = Math.max(0, Number(topic.requestedCount || 0));
      const available = typeFilter
        ? Number(topic.availableByType?.[typeFilter] || 0)
        : Number(topic.count || 0);

      if (requested > available) {
        const label = typeFilter ? `loại ${typeFilter}` : "trong chủ đề này";
        return `Chủ đề "${topic.topic}" chỉ có ${available} câu hỏi ${label}, nhưng bạn yêu cầu ${requested} câu.`;
      }
    }

    return "";
  }, [bankTopics, form.questionType]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        // GET /courses already scopes STUDENT/LECTURER requests to their own
        // courses server-side; only the ADMIN branch falls back to the
        // system-wide, paginated list (default limit 20). Pass a generous
        // limit so an admin's course picker isn't silently truncated.
        const data = unwrapPaginatedData(await api.getCourses({ limit: 200 }));
        const mappedCourses = data.map((course: any) => ({
          id: course.id,
          code: course.code,
          name: course.name,
          academicYear: course.academicYear,
          term: course.term,
        }));
        setCourses(mappedCourses);

        const requestedCourseId = new URLSearchParams(
          window.location.search,
        ).get("courseId");
        if (
          requestedCourseId &&
          mappedCourses.some((course: CourseOption) => course.id === requestedCourseId)
        ) {
          setForm((current) =>
            current.course ? current : { ...current, course: requestedCourseId },
          );
        }
      } catch (error) {
        console.error("Failed to load courses for exam creation:", error);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    let active = true;

    const loadBankTopics = async () => {
      if (!form.course) {
        setBankTopics([]);
        return;
      }

      setBankTopics([]);
      setIsLoadingBankTopics(true);
      try {
        const normalizeType = (value: string) => String(value || "").trim().toUpperCase();
        const limit = 100;

        const loadQuestionsForTopic = async (topicId?: string) => {
          let page = 1;
          let totalPages = 1;
          const questions: any[] = [];

          while (page <= totalPages) {
            const response: any = await api.listQuestions({
              courseId: form.course,
              topicId,
              page,
              limit,
            });
            const items = Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response)
                ? response
                : [];

            totalPages = Number(response?.pagination?.totalPages || response?.totalPages || 1);
            questions.push(...items);
            page += 1;
          }

          return questions;
        };

        const topicsResponse = await api.listQuestionTopics({
          courseId: form.course,
          limit: 100,
        });
        const topicsData = Array.isArray(topicsResponse?.data)
          ? topicsResponse.data
          : Array.isArray(topicsResponse)
            ? topicsResponse
            : [];

        if (topicsData.length === 0) {
          const questions = await loadQuestionsForTopic();
          const readyQuestions = questions.filter((question: any) => Boolean(question?.latestVersion?.id));
          const typeCounts = readyQuestions.reduce((acc: Record<string, number>, question: any) => {
            const type = normalizeType(question.type);
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});

          if (!active) return;

          setBankTopics([
            {
              topicId: "",
              topic: WHOLE_COURSE_LABEL,
              count: readyQuestions.length,
              selected: false,
              requestedCount: "0",
              availableByType: typeCounts,
            },
          ]);
          return;
        }

        const nextTopics = await Promise.all(
          topicsData.map(async (topic: any) => {
            const questions = await loadQuestionsForTopic(topic.id);
            const readyQuestions = questions.filter((question: any) => Boolean(question?.latestVersion?.id));
            const typeCounts = readyQuestions.reduce((acc: Record<string, number>, question: any) => {
              const type = normalizeType(question.type);
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {});

            return {
              topicId: topic.id,
              topic: topic.name,
              count: readyQuestions.length,
              selected: false,
              requestedCount: "0",
              availableByType: typeCounts,
            };
          }),
        );

        if (!active) return;

        setBankTopics(
          nextTopics.sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic)),
        );
      } catch (error) {
        console.error("Failed to load question bank topics:", error);
        if (active) setBankTopics([]);
      } finally {
        if (active) setIsLoadingBankTopics(false);
      }
    };

    loadBankTopics();

    return () => {
      active = false;
    };
  }, [form.course]);

  useEffect(() => {
    let active = true;

    const loadSelectableQuestions = async () => {
      if (questionSourceMode !== "bank-select" || !form.course || !selectedBankTopicId) {
        setBankQuestions([]);
        return;
      }

      setIsLoadingBankQuestions(true);
      try {
        const response: any = await api.listQuestions({
          courseId: form.course,
          topicId: selectedBankTopicId === "__all__" ? undefined : selectedBankTopicId,
          page: 1,
          limit: 100,
        });
        const questions = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        if (active) {
          setBankQuestions(
            questions.map((question: any) => ({
              id: String(question.id),
              type: String(question.type || "UNKNOWN"),
              content: String(question.content || question.stem || "Untitled question"),
              difficulty: Number(question.difficulty || 0) || undefined,
              isVersionReady: Boolean(question?.latestVersion?.id),
              mediaType: question.mediaType === "image" || question.mediaType === "audio" ? question.mediaType : undefined,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load selectable questions:", error);
        if (active) setBankQuestions([]);
      } finally {
        if (active) setIsLoadingBankQuestions(false);
      }
    };

    loadSelectableQuestions();
    return () => {
      active = false;
    };
  }, [form.course, questionSourceMode, selectedBankTopicId]);

  const filteredBankQuestions = useMemo(() => {
    return bankQuestions.filter((question) => {
      const matchesType =
        form.questionType === "mixed" ||
        form.questionType === "custom" ||
        question.type === mapQuestionTypeToDb(form.questionType);
      const matchesDifficulty =
        form.bankDifficulty === "mixed" ||
        difficultyLabelFromValue(question.difficulty).toLowerCase() === form.bankDifficulty;
      return matchesType && matchesDifficulty;
    });
  }, [bankQuestions, form.bankDifficulty, form.questionType]);

  const versionReadyBankQuestions = filteredBankQuestions.filter((question) => question.isVersionReady);
  const isAllFilteredBankQuestionsSelected =
    versionReadyBankQuestions.length > 0 &&
    versionReadyBankQuestions.every((question) => selectedBankQuestionIds.includes(question.id));

  const toggleSelectAllBankQuestions = () => {
    const filteredIds = versionReadyBankQuestions.map((question) => question.id);
    setSelectedBankQuestionIds((ids) =>
      isAllFilteredBankQuestionsSelected
        ? ids.filter((id) => !filteredIds.includes(id))
        : [...new Set([...ids, ...filteredIds])],
    );
  };

  const randomQuestionCount = useMemo(
    () =>
      bankTopics.reduce(
        (total, topic) =>
          total + (topic.selected ? Math.max(0, Number(topic.requestedCount || 0)) : 0),
        0,
      ),
    [bankTopics],
  );
  const composedQuestionCount =
    aiGeneratedQuestions.length + selectedBankQuestionIds.length + randomQuestionCount;

  // Manual entry's questions are never persisted until "addManualQuestion"
  // stages them (and the exam-create submit later saves them for real), so —
  // unlike the question bank editor — there is no "already saved" attachment
  // to protect: any attachment can always be released immediately on
  // replace/remove/toggle-off.
  const handleManualMediaFile = async (file: File | null | undefined) => {
    if (!file) return;
    const effectiveType = manualMediaAttachment?.mediaType ?? manualMediaType;
    const validationError = validateMediaFile(file, effectiveType);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const previous = manualMediaAttachment;
    setManualMediaUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, effectiveType);
      setManualMediaAttachment(uploaded);
      if (previous && previous.mediaKey !== uploaded.mediaKey) {
        releaseMediaUpload(previous);
      }
      toast.success("Đã tải lên tệp đính kèm.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải tệp lên. Vui lòng thử lại.");
    } finally {
      setManualMediaUploading(false);
    }
  };

  const handleManualMediaToggle = (checked: boolean) => {
    setManualHasMedia(checked);
    if (!checked && manualMediaAttachment) {
      releaseMediaUpload(manualMediaAttachment);
      setManualMediaAttachment(null);
    }
  };

  const handleManualMediaTypeChange = (type: "image" | "audio") => {
    if (manualMediaAttachment) return;
    setManualMediaType(type);
  };

  const handleManualRemoveMediaAttachment = () => {
    if (manualMediaAttachment) {
      releaseMediaUpload(manualMediaAttachment);
      setManualMediaAttachment(null);
    }
    if (manualMediaFileInputRef.current) manualMediaFileInputRef.current.value = "";
  };

  const addManualQuestion = () => {
    if (!manualQuestionContent.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi.");
      return;
    }

    const filledOptions = manualOptions.filter((option) => option.text.trim());
    if (
      ["multiple_choice", "matching", "ordering", "find_error"].includes(manualQuestionType) &&
      filledOptions.length < 2
    ) {
      toast.error("Cần ít nhất hai lựa chọn hoặc mục.");
      return;
    }
    if (
      ["multiple_choice", "find_error"].includes(manualQuestionType) &&
      !filledOptions.some((option) => option.isCorrect)
    ) {
      toast.error(
        manualQuestionType === "find_error"
          ? "Vui lòng chọn dòng chứa lỗi."
          : "Vui lòng chọn ít nhất một đáp án đúng.",
      );
      return;
    }
    if (manualQuestionType === "essay" && !manualEssayRubric.trim()) {
      toast.error("Câu hỏi tự luận cần có tiêu chí chấm điểm.");
      return;
    }

    // Fill-in-the-blank has no equivalent branch in buildQuestionPayload (the
    // shared builder used by the question bank editor), so its answer is
    // still derived here from the [[...]] markers in the question content.
    // Every other type is built the exact same way the question bank editor
    // builds it, so a manually-added exam question is never out of sync with
    // one created via /lecturer/question-editor.
    const { type: backendType, options, correctAnswer } =
      manualQuestionType === "fill_blank"
        ? {
            type: "FILL_IN_BLANK",
            options: undefined as Record<string, string> | undefined,
            correctAnswer: {
              answers: Array.from(
                manualQuestionContent.matchAll(/\[\[(.*?)\]\]/g),
                (match) => match[1],
              ),
            },
          }
        : buildQuestionPayload({
            questionType: manualQuestionType,
            multipleAnswers: manualMultipleAnswers,
            content: manualQuestionContent,
            explanation: manualExplanation,
            difficulty: [difficultyOptionToValue(manualDifficulty)],
            scoreCoefficient: "1",
            tfAnswer: manualTrueFalseAnswer,
            essayRubric: manualEssayRubric,
            options: manualOptions,
          });

    setAiGeneratedQuestions((questions) => [
      ...questions,
      {
        type: backendType,
        content: manualQuestionContent.trim(),
        options,
        correctAnswer,
        explanation: manualExplanation.trim() || undefined,
        difficulty: difficultyOptionToValue(manualDifficulty),
        points: 1,
        topicId: manualTopicId || undefined,
        learningObjective: manualLearningObjective.trim() || undefined,
        media: manualHasMedia ? manualMediaAttachment : null,
      },
    ]);
    setManualQuestionContent("");
    setManualExplanation("");
    resetManualAnswer();
    // The attachment now belongs to the staged question above — clear the
    // form's media state without releasing the R2 object out from under it.
    setManualHasMedia(false);
    setManualMediaAttachment(null);
    if (manualMediaFileInputRef.current) manualMediaFileInputRef.current.value = "";
  };

  const applyGeneratedQuestionToManualForm = (question: any) => {
    const type = String(question?.type || "").toUpperCase();
    const nextType =
      type === "TRUE_FALSE"
        ? "true_false"
        : type === "FILL_IN_BLANK"
          ? "fill_blank"
          : type === "MATCHING"
            ? "matching"
            : type === "ORDERING"
              ? "ordering"
              : type === "FIND_ERROR"
                ? "find_error"
                : type === "ESSAY" || type === "SHORT_ANSWER"
                  ? "essay"
                  : "multiple_choice";

    setManualQuestionType(nextType);
    setManualQuestionContent(String(question?.content || ""));
    setManualExplanation(String(question?.explanation || ""));
    setManualDifficulty(difficultyLabelFromValue(question?.difficulty).toLowerCase());

    if (nextType === "true_false") {
      setManualTrueFalseAnswer(question?.correctAnswer?.answer === false ? "false" : "true");
    } else if (nextType === "essay") {
      setManualEssayRubric(String(question?.correctAnswer?.answer || question?.explanation || ""));
    } else if (nextType === "matching" && Array.isArray(question?.pairs)) {
      setManualOptions(
        question.pairs.map((pair: any, index: number) => ({
          id: String.fromCharCode(65 + index),
          text: String(pair?.left || ""),
          match: String(pair?.right || ""),
          isCorrect: false,
        })),
      );
    } else if (nextType === "ordering" && Array.isArray(question?.items)) {
      setManualOptions(
        question.items.map((item: any, index: number) => ({
          id: String.fromCharCode(65 + index),
          text: String(item || ""),
          isCorrect: false,
        })),
      );
    } else if (question?.options && typeof question.options === "object") {
      const selectedAnswers = Array.isArray(question?.correctAnswer?.answers)
        ? question.correctAnswer.answers.map(String)
        : String(question?.correctAnswer?.answer || "").split(",");
      setManualOptions(
        Object.entries(question.options).map(([id, text]) => ({
          id,
          text: String(text || ""),
          isCorrect: selectedAnswers.includes(id),
        })),
      );
      setManualMultipleAnswers(selectedAnswers.length > 1);
    }
  };

  const handleManualAiGenerate = async () => {
    if (!manualAiPrompt.trim()) return;
    setIsManualAiGenerating(true);
    setManualAiSimilarityWarning("");
    try {
      // Uses the same single-question generator (and prompt, which has proper
      // MATCHING/ORDERING/FILL_IN_BLANK instructions) as /lecturer/question-editor,
      // instead of the batch exam-questions generator whose prompt only covers
      // MULTIPLE_CHOICE/TRUE_FALSE/SHORT_ANSWER/ESSAY.
      const backendType = mapQuestionTypeToAiApi(
        manualQuestionType === "multiple_choice"
          ? "multiple-choice"
          : manualQuestionType === "true_false"
            ? "true-false"
            : manualQuestionType === "fill_blank"
              ? "fill-blank"
              : manualQuestionType === "find_error"
                ? "find-error"
                : manualQuestionType === "essay"
                  ? "short-answer"
                  : manualQuestionType,
      );
      const generated = await api.aiGenerateQuestion({
        prompt: manualAiPrompt,
        questionType: backendType,
        difficulty: difficultyOptionToValue(manualDifficulty),
        language: "vi",
        courseName: courses.find((course) => course.id === form.course)?.name,
        useCase: "question_bank",
        context: {
          courseId: form.course,
          courseName: courses.find((course) => course.id === form.course)?.name,
          courseCode: courses.find((course) => course.id === form.course)?.code,
          examTitle: form.title,
          source: "create_exam_manual_ai",
        },
      });
      if (!generated?.content) throw new Error("AI không trả về câu hỏi.");

      // Mirrors the near-duplicate guard in /lecturer/question-editor
      // (useQuestionAiGeneration.generate) so a manually-created exam
      // question gets the same duplicate warning as the question bank.
      const duplicate = await findMostSimilarQuestion({
        courseId: form.course,
        backendType,
        generatedText: `${generated.content} ${generated.options ? Object.values(generated.options).join(" ") : ""}`,
      });
      if (duplicate && duplicate.similarity >= 0.8) {
        const message = `Câu hỏi AI tạo quá giống câu hỏi hiện có (${Math.round(duplicate.similarity * 100)}%). Hãy đổi yêu cầu hoặc tạo lại.`;
        setManualAiSimilarityWarning(message);
        toast.error(message);
        return;
      }

      applyGeneratedQuestionToManualForm(generated);
      toast.success("AI đã tạo bản nháp câu hỏi. Hãy xem lại trước khi thêm.");
    } catch (error: any) {
      console.error("Manual AI generation failed:", error);
      toast.error(error.message || "Tạo nội dung bằng AI thất bại.");
    } finally {
      setIsManualAiGenerating(false);
    }
  };

  const stepIdx = STEPS.findIndex((s) => s.key === step);
  const canNext = (): boolean => {
    if (step === "info") return form.title.trim() !== "" && form.course !== "";
    if (step === "settings")
      return (
        (form.unlimitedTime || form.duration !== "") && form.startDate !== "" && form.endDate !== ""
      );
    return true;
  };

  const handleCreate = async () => {
    const startTime = form.startDate
      ? new Date(`${form.startDate}T${form.startTime || "00:00"}`).toISOString()
      : undefined;
    const endTime = form.endDate
      ? new Date(`${form.endDate}T${form.endTime || "23:59"}`).toISOString()
      : undefined;

    try {
      const durationError = form.unlimitedTime ? "" : getNumericInputError(form.duration, { min: 5, integer: true });
      const passingScoreError = getNumericInputError(form.passingScore, {
        min: 0,
        max: 100,
        integer: true,
      });
      const questionCountError = getNumericInputError(form.questionCount, {
        min: 1,
        integer: true,
      });
      const selectedQuestionsWithoutVersion = bankQuestions.filter(
        (question) => selectedBankQuestionIds.includes(question.id) && !question.isVersionReady,
      );

      if (selectedQuestionsWithoutVersion.length > 0) {
        toast.error("Có câu hỏi chưa được chuẩn hóa phiên bản. Vui lòng bỏ chọn chúng trước khi tạo đề.");
        return;
      }

        if (randomQuestionCount > 0 && bankSelectionWarning) {
          setNumberErrors((prev) => ({ ...prev, questionCount: bankSelectionWarning }));
          toast.error(bankSelectionWarning);
          return;
        }

      if (composedQuestionCount === 0) {
        toast.error("Vui lòng thêm ít nhất một câu hỏi từ bất kỳ nguồn nào.");
        return;
      }

      const nextErrors = {
        duration: durationError || "",
        passingScore: passingScoreError || "",
        questionCount: questionCountError || "",
      };
      setNumberErrors(nextErrors);

      const firstError = Object.values(nextErrors).find(Boolean);
      if (firstError) {
        toast.error(firstError);
        return;
      }

      const parsedReviewSettings = reviewSettingsDraft.enabled
        ? buildReviewSettingsPayload(reviewSettingsDraft)
        : null;
      const effectiveQuestionCount = composedQuestionCount;

      setIsCreating(true);
      let questionIds: string[] | undefined;

      if (aiGeneratedQuestions.length > 0) {
        const createdQuestions = await Promise.all(
          aiGeneratedQuestions.map((q) =>
            api.saveQuestion({
              type: mapQuestionTypeToDb(q.type),
              content: q.content,
              options: q.options || undefined,
              correctAnswer: q.correctAnswer || undefined,
              explanation: q.explanation || undefined,
              difficulty: normalizeDifficultyForQuestion(q.difficulty),
              points: Math.max(1, Number(q.points) || 1),
              defaultPoints: Math.max(1, Number(q.points) || 1),
              courseId: form.course,
              topicId: q.topicId || undefined,
              learningObjective: q.learningObjective || undefined,
              media: q.media || undefined,
            }),
          ),
        );

        questionIds = [
          ...selectedBankQuestionIds,
          ...createdQuestions
          .map((item: any) => item.id)
          .filter(Boolean),
        ];
      } else if (selectedBankQuestionIds.length > 0) {
        questionIds = selectedBankQuestionIds;
      }

      await api.createExam({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        courseId: form.course,
        duration: parseNumericInput(form.duration, { min: 5, integer: true }) || 60,
        timeLimitMinutes: form.unlimitedTime ? null : parseNumericInput(form.duration, { min: 5, integer: true }),
        passingScore: parseNumericInput(form.passingScore, {
          min: 0,
          max: 100,
          integer: true,
        })!,
        startTime,
        endTime,
        maxAttempts:
          form.maxAttempts === "unlimited"
            ? null
            : parseNumericInput(form.maxAttempts, { min: 1, integer: true }),
        gradingStrategy: form.gradingStrategy,
        reviewSettings: parsedReviewSettings,
        questionSelectionConfig: {
          sourceMethod: "composite",
          selectionMode: "composite",
          sources: {
            manualCount: aiGeneratedQuestions.length,
            selectedBankCount: selectedBankQuestionIds.length,
            randomTopicCount: randomQuestionCount,
          },
          randomizePerStudent: randomQuestionCount > 0,
          shuffleQuestions: form.shuffleQuestions,
          questionType: form.questionType,
          requestedQuestionCount: randomQuestionCount,
          totalComposedQuestionCount: effectiveQuestionCount,
          bankDifficulty: difficultyOptionToBankValue(form.bankDifficulty),
          topicAllocations:
            randomQuestionCount > 0
              ? bankTopics
                  .filter((topic) => topic.selected && Number(topic.requestedCount || 0) > 0)
                  .filter((topic) => topic.topicId)
                  .map((topic) => ({
                    topicId: topic.topicId,
                    topic: topic.topic,
                    count: parseNumericInput(topic.requestedCount, { min: 1, integer: true }) || 0,
                  }))
              : undefined,
        },
        questionIds,
        settings: {
          maxAttempts: form.maxAttempts === "unlimited" ? null : parseNumericInput(form.maxAttempts, {
            min: 1,
            integer: true,
          }),
          timeLimitMinutes: form.unlimitedTime ? null : parseNumericInput(form.duration, { min: 5, integer: true }),
          requiresProctoring: effectiveProctoring,
          proctoringEnabled: effectiveProctoring,
          webcamEvidencePolicy: {
            enabled: effectiveProctoring && form.webcamEvidenceEnabled,
            examProfile: "THEORY",
            scheduledCaptureIntervalSeconds: form.webcamEvidenceScheduledIntervalSeconds
              ? parseNumericInput(form.webcamEvidenceScheduledIntervalSeconds, { min: 1, integer: true })
              : null,
            eventCooldownMs: (parseNumericInput(form.webcamEvidenceCooldownSeconds, { min: 1, integer: true }) || 60) * 1000,
            eventCaptureLimits: {
              tab_switch: parseNumericInput(form.webcamEvidenceLimitTabSwitch, { min: 1, integer: true }) || 3,
              fullscreen_exit: parseNumericInput(form.webcamEvidenceLimitFullscreenExit, { min: 1, integer: true }) || 3,
              paste_external: parseNumericInput(form.webcamEvidenceLimitPasteExternal, { min: 1, integer: true }) || 3,
              mouse_idle: parseNumericInput(form.webcamEvidenceLimitMouseIdle, { min: 1, integer: true }) || 3,
            },
            mouseIdleThresholdMs: (parseNumericInput(form.webcamEvidenceMouseIdleThresholdSeconds, { min: 10, integer: true }) || 60) * 1000,
            screenCaptureEnabled: form.screenCaptureEnabled,
            requireFullScreenCapture: form.screenCaptureEnabled,
            retentionDays: 30,
            consentVersion: "webcam-evidence-v1",
          },
          devicePolicy: effectiveProctoring ? "DESKTOP_ONLY" : "ANY",
          allowLateSubmission: form.allowLateSubmission,
          shuffleQuestions: form.shuffleQuestions,
          showResultImmediately: form.showResultImmediately,
          sourceMethod: randomQuestionCount > 0 ? "bank" : "composite",
          selectionMode: "composite",
          randomizePerStudent: randomQuestionCount > 0,
          questionType: form.questionType,
          bankDifficulty: difficultyOptionToBankValue(form.bankDifficulty),
          requestedQuestionCount: randomQuestionCount,
          totalComposedQuestionCount: effectiveQuestionCount,
          randomRequestedQuestionCount: randomQuestionCount,
          topicAllocations:
            randomQuestionCount > 0
              ? bankTopics
                  .filter((topic) => topic.selected && Number(topic.requestedCount || 0) > 0)
                  .filter((topic) => topic.topicId)
                  .map((topic) => ({
                    topicId: topic.topicId,
                    topic: topic.topic,
                    count: parseNumericInput(topic.requestedCount, { min: 1, integer: true }) || 0,
                  }))
              : undefined,
          aiGenerationMode: form.aiGenerationMode,
          aiPrompt: form.aiPrompt || undefined,
          aiDifficulty: difficultyOptionToValue(form.aiDifficulty),
          aiReviewRequired: form.aiReviewRequired,
        },
      });

      setCreated(true);
    } catch (error: any) {
      console.error("Failed to create exam:", error);
      toast.error(error.message || "Không thể tạo bài thi");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!form.aiPrompt.trim()) return;
    const questionCountError = getNumericInputError(form.questionCount, {
      min: 1,
      integer: true,
    });
    if (questionCountError) {
      setNumberErrors((prev) => ({ ...prev, questionCount: questionCountError }));
      toast.error(questionCountError);
      return;
    }

    setIsAiGenerating(true);
    try {
      const result = await api.aiGenerateExamQuestions({
        prompt: form.aiPrompt,
        questionCount:
          parseNumericInput(form.questionCount, {
            min: 1,
            integer: true,
          }) || 20,
        difficulty: difficultyOptionToValue(form.aiDifficulty),
        questionType: mapQuestionTypeToAiApi(form.questionType),
        language: "en",
        courseName: courses.find((course) => course.id === form.course)?.name,
        useCase: "exam",
        context: {
          courseId: form.course,
          courseName: courses.find((course) => course.id === form.course)?.name,
          courseCode: courses.find((course) => course.id === form.course)?.code,
          examTitle: form.title,
          source: "create_exam_bank_ai",
        },
      });
      setAiGeneratedQuestions(result.questions);
      toast.success(
        `Đã tạo thành công ${result.questions.length} câu hỏi! Hãy xem lại ở bước xem trước.`,
      );
    } catch (error: any) {
      console.error("AI generation failed:", error);
      toast.error(
        "Tạo nội dung bằng AI thất bại: " + (error.message || "Lỗi không xác định"),
      );
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleImportExtract = async () => {
    if (!docFile) {
      toast.error("Vui lòng chọn tài liệu trước.");
      return;
    }

    const fileName = docFile.name.toLowerCase();
    const isTextLike = /\.(txt|md|csv|json)$/i.test(fileName);
    const isDocx = /\.docx$/i.test(fileName);
    const isDoc = /\.doc$/i.test(fileName);

    try {
      setIsStandardizing(true);

      let rawText = "";

      if (isTextLike) {
        rawText = await docFile.text();
      } else if (isDocx) {
        const mammoth = await import("mammoth/mammoth.browser");
        const arrayBuffer = await docFile.arrayBuffer();
        const extracted = await mammoth.extractRawText({ arrayBuffer });
        rawText = extracted.value || "";
      } else if (isDoc) {
        throw new Error(
          "Chưa hỗ trợ định dạng .doc cũ. Vui lòng lưu lại dưới dạng .docx và thử lại.",
        );
      } else {
        throw new Error(
          "Định dạng tệp không được hỗ trợ. Vui lòng dùng .txt, .md, .csv, .json hoặc .docx.",
        );
      }

      const normalized = rawText.replace(/\s+/g, " ").trim();

      if (!normalized) {
        throw new Error("Tệp đã chọn đang trống.");
      }

      const prompt = [
        `Extract key concepts from the following course material and generate exam questions.`,
        `Document: ${docFile.name}`,
        `Material:`,
        normalized.slice(0, 8000),
      ].join("\n\n");

      const result = await api.aiGenerateExamQuestions({
        prompt,
        questionCount:
          parseNumericInput(form.questionCount, {
            min: 1,
            integer: true,
          }) || 20,
        difficulty: difficultyOptionToValue(form.aiDifficulty),
        questionType: mapQuestionTypeToAiApi(form.questionType),
        language: "en",
        courseName: courses.find((course) => course.id === form.course)?.name,
        useCase: "exam",
        context: {
          courseId: form.course,
          courseName: courses.find((course) => course.id === form.course)?.name,
          courseCode: courses.find((course) => course.id === form.course)?.code,
          examTitle: form.title,
          source: "create_exam_doc_ai",
        },
      });

      setAiGeneratedQuestions(result.questions || []);
      toast.success(
        `Đã trích xuất và tạo ${result.questions?.length || 0} câu hỏi từ tài liệu.`,
      );
    } catch (error: any) {
      console.error("Import extraction failed:", error);
      toast.error("Trích xuất AI thất bại: " + (error.message || "Lỗi không xác định"));
    } finally {
      setIsStandardizing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Success screen ──────────────────────────────────────────────
  if (created) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">Đã tạo bài thi!</h2>
            <p className="text-muted-foreground">
              <strong>"{form.title}"</strong> has been saved and is ready to be
              configured.
            </p>
          </div>
          <div className="flex gap-3">
            <BackToDashboardButton
              to="/lecturer"
              variant="outline"
              size="default"
            />
            <Button onClick={() => router.push("/lecturer/exams")}>
              <Plus className="h-4 w-4 mr-2" /> Add Questions
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className={`mx-auto space-y-6 px-3 sm:px-0 transition-[max-width] duration-300 ${
          step === "questions" ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Tạo bài thi mới</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Thiết lập bài thi mới trong 4 bước
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = i < stepIdx;
            const active = s.key === step;
            return (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : done
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-4 w-4" /> : s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <Card>
          {step === "info" && (
            <>
              <CardHeader>
                <CardTitle>Thông tin cơ bản</CardTitle>
                <CardDescription>
                  Nhập tên bài thi, học phần và mô tả ngắn.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    Tên bài thi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Ví dụ: Kiểm tra giữa kỳ – Hệ quản trị cơ sở dữ liệu"
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="space-y-1">
                      <Label
                        htmlFor="course-academic-year-filter"
                        className="text-sm"
                      >
                        Năm học
                      </Label>
                      <Select
                        value={courseAcademicYearFilter}
                        onValueChange={setCourseAcademicYearFilter}
                      >
                        <SelectTrigger
                          id="course-academic-year-filter"
                          className="h-11 rounded-xl"
                        >
                          <SelectValue placeholder="Năm học" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả năm học</SelectItem>
                          {courseAcademicYearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="course-term-filter" className="text-sm">
                        Học kỳ
                      </Label>
                      <Select
                        value={courseTermFilter}
                        onValueChange={(value) =>
                          setCourseTermFilter(value as CourseTerm | "all")
                        }
                      >
                        <SelectTrigger
                          id="course-term-filter"
                          className="h-11 rounded-xl"
                        >
                          <SelectValue placeholder="Học kỳ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tất cả học kỳ</SelectItem>
                          {COURSE_TERM_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="self-end"
                      onClick={resetCourseFilters}
                    >
                      Đặt lại
                    </Button>
                  </div>
                  <Label htmlFor="course" className="mt-4 block">
                    Học phần <span className="text-red-500">*</span>
                  </Label>
                  <Popover
                    open={courseComboboxOpen}
                    onOpenChange={(open) => {
                      setCourseComboboxOpen(open);
                      if (open) setCourseSearch("");
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Input
                        id="course"
                        role="combobox"
                        aria-expanded={courseComboboxOpen}
                        disabled={courses.length === 0}
                        value={
                          courseComboboxOpen ? courseSearch : selectedCourseLabel
                        }
                        onChange={(event) => {
                          setCourseSearch(event.target.value);
                          setCourseComboboxOpen(true);
                        }}
                          onFocus={() => {
                            if (skipNextCourseFocusRef.current) {
                              skipNextCourseFocusRef.current = false;
                              return;
                            }
                            setCourseComboboxOpen(true);
                          }}
                        placeholder="Tìm theo mã hoặc tên học phần..."
                        className="mt-1 h-12 rounded-xl text-base"
                      />
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      className="w-[--radix-popover-trigger-width] p-0"
                    >
                      <Command>
                        <CommandList className="max-h-80">
                          {filteredCourses.length === 0 ? (
                            <CommandEmpty>
                              Không tìm thấy học phần theo bộ lọc đã chọn.
                            </CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {filteredCourses.map((course) => {
                                const label = `${course.code} - ${course.name}`;

                                return (
                                  <CommandItem
                                    key={course.id}
                                    value={label}
                                    onSelect={() => {
                                      set("course", course.id);
                                      setCourseSearch("");
                                      skipNextCourseFocusRef.current = true;
                                      setCourseComboboxOpen(false);
                                    }}
                                    className="items-start gap-3 py-3"
                                  >
                                    <Check
                                      className={cn(
                                        "mt-0.5 h-4 w-4 shrink-0",
                                        form.course === course.id
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    <span className="min-w-0 flex-1">
                                      <span className="flex min-w-0 items-center gap-2">
                                        <span className="truncate font-medium">
                                          {course.code}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="shrink-0"
                                        >
                                          {formatCourseTerm(
                                            course.academicYear,
                                            course.term,
                                          )}
                                        </Badge>
                                      </span>
                                      <span className="block truncate text-xs text-muted-foreground">
                                        {course.name}
                                      </span>
                                    </span>
                                  </CommandItem>
                                );
                              })}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {courses.length === 0 ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Chưa có học phần nào.
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="desc">Mô tả</Label>
                  <Textarea
                    id="desc"
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    placeholder="Mô tả ngắn phạm vi và mục tiêu của bài thi…"
                    className="mt-1 resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === "settings" && (
            <>
              <CardHeader>
                <CardTitle>Cài đặt bài thi</CardTitle>
                <CardDescription>
                  Cấu hình thời gian, cách tính điểm và quyền truy cập.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Thời lượng (phút)</Label>
                    <Input
                      type="number"
                      value={form.duration}
                      disabled={form.unlimitedTime}
                      onChange={(e) =>
                        set(
                          "duration",
                          sanitizeNumericInput(e.target.value, { min: 5 }),
                        )
                      }
                      min={5}
                      onBlur={(e) =>
                        setNumberErrors((prev) => ({
                          ...prev,
                          duration:
                            getNumericInputError(e.target.value, {
                              min: 5,
                              integer: true,
                            }) || "",
                        }))
                      }
                      className="mt-1"
                    />
                    {numberErrors.duration ? (
                      <p className="mt-1 text-xs text-destructive">
                        {numberErrors.duration}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Switch checked={form.unlimitedTime} onCheckedChange={(v) => set("unlimitedTime", v)} />
                      <span>Không giới hạn thời gian</span>
                    </div>
                  </div>
                  <div>
                    <Label>Điểm đạt (%)</Label>
                    <Input
                      type="number"
                      value={form.passingScore}
                      onChange={(e) =>
                        set(
                          "passingScore",
                          sanitizeNumericInput(e.target.value, {
                            min: 0,
                            max: 100,
                          }),
                        )
                      }
                      min={0}
                      max={100}
                      onBlur={(e) =>
                        setNumberErrors((prev) => ({
                          ...prev,
                          passingScore:
                            getNumericInputError(e.target.value, {
                              min: 0,
                              max: 100,
                              integer: true,
                            }) || "",
                        }))
                      }
                      className="mt-1"
                    />
                    {numberErrors.passingScore ? (
                      <p className="mt-1 text-xs text-destructive">
                        {numberErrors.passingScore}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <Label>Số lần làm tối đa</Label>
                    <Select
                      value={form.maxAttempts}
                      onValueChange={(v) => set("maxAttempts", v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unlimited">Không giới hạn</SelectItem>
                        {MAX_ATTEMPT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Chọn giá trị từ 1 đến 10. Chọn 1 sẽ khóa nộp muộn.
                    </p>
                  </div>
                  <div>
                    <Label>Cách tính điểm</Label>
                    <Select
                      value={form.gradingStrategy}
                      onValueChange={(v) =>
                        set("gradingStrategy", v as ExamForm["gradingStrategy"])
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGHEST">Lấy điểm cao nhất</SelectItem>
                        <SelectItem value="AVERAGE">Lấy điểm trung bình</SelectItem>
                        <SelectItem value="FIRST_ATTEMPT">Lượt làm đầu tiên</SelectItem>
                        <SelectItem value="LAST_ATTEMPT">Lượt làm cuối cùng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-medium">Khung giờ thi</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>
                      Ngày bắt đầu <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.startDate}
                      onChange={(e) => set("startDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Giờ bắt đầu</Label>
                    <TimePickerVi value={form.startTime} onChange={(v) => set("startTime", v)} className="mt-1" />
                  </div>
                  <div>
                    <Label>
                      Ngày kết thúc <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={form.endDate}
                      onChange={(e) => set("endDate", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Giờ kết thúc</Label>
                    <TimePickerVi value={form.endTime} onChange={(v) => set("endTime", v)} className="mt-1" />
                  </div>
                </div>

                <Separator />
                <p className="text-sm font-medium">Tùy chọn</p>
                <div className="space-y-4">
                  {(
                    [
                      {
                        key: "requiresProctoring",
                        label: "Bật giám sát AI",
                        desc: "Theo dõi hoạt động của sinh viên trong bài thi",
                        icon: <Shield className="h-4 w-4 text-primary" />,
                      },
                      {
                        key: "allowLateSubmission",
                        label: "Cho phép nộp bài muộn",
                        desc: "Sinh viên có thể nộp bài sau thời gian kết thúc",
                        icon: <FileCheck className="h-4 w-4 text-primary" />,
                      },
                      {
                        key: "shuffleQuestions",
                        label: "Xáo trộn câu hỏi",
                        desc: "Ngẫu nhiên thứ tự câu hỏi cho từng sinh viên",
                        icon: <Users className="h-4 w-4 text-primary" />,
                      },
                      {
                        key: "showResultImmediately",
                        label: "Hiển thị kết quả ngay",
                        desc: "Sinh viên xem điểm ngay sau khi nộp bài",
                        icon: <Eye className="h-4 w-4 text-primary" />,
                      },
                    ] as const
                  ).map(({ key, label, desc, icon }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between border rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        {icon}
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">
                            {desc}
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={form[key] as boolean}
                        onCheckedChange={(v) => set(key, v)}
                        disabled={(key === "allowLateSubmission" && isSingleAttempt) || (key === "requiresProctoring" && proctoringForcedOff)}
                      />
                    </div>
                  ))}
                </div>
                {isSingleAttempt ? (
                  <p className="text-xs text-muted-foreground">
                    Không thể nộp muộn vì số lượt làm tối đa được đặt là 1.
                  </p>
                ) : null}
                {proctoringForcedOff ? <p className="text-xs text-muted-foreground">Giám sát AI được tự động tắt vì bài kiểm tra không giới hạn thời gian hoặc lượt làm.</p> : null}

                {effectiveProctoring ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label className="text-sm font-medium">Ghi nhận bằng chứng giám sát trong khi thi</Label>
                        <p className="text-xs text-muted-foreground mt-1">Khi bật, sinh viên phải cấp webcam trước khi vào bài. Ảnh tự xóa sau 30 ngày.</p>
                      </div>
                      <Switch checked={form.webcamEvidenceEnabled} onCheckedChange={(v) => set("webcamEvidenceEnabled", v)} aria-label="Bật bằng chứng webcam" />
                    </div>

                    {form.webcamEvidenceEnabled ? (
                      <div className="space-y-3 border-t border-amber-200 pt-3">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Giới hạn chuyển tab</Label>
                            <Input
                              type="number"
                              min={1}
                              value={form.webcamEvidenceLimitTabSwitch}
                              onChange={(e) => set("webcamEvidenceLimitTabSwitch", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giới hạn thoát fullscreen</Label>
                            <Input
                              type="number"
                              min={1}
                              value={form.webcamEvidenceLimitFullscreenExit}
                              onChange={(e) => set("webcamEvidenceLimitFullscreenExit", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giới hạn dán nội dung ngoài</Label>
                            <Input
                              type="number"
                              min={1}
                              value={form.webcamEvidenceLimitPasteExternal}
                              onChange={(e) => set("webcamEvidenceLimitPasteExternal", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giới hạn ngồi im</Label>
                            <Input
                              type="number"
                              min={1}
                              value={form.webcamEvidenceLimitMouseIdle}
                              onChange={(e) => set("webcamEvidenceLimitMouseIdle", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Ngưỡng không thao tác</Label>
                            <DurationInput
                              defaultUnit="s"
                              minSeconds={1}
                              valueSeconds={Number(form.webcamEvidenceMouseIdleThresholdSeconds) || 0}
                              onChangeSeconds={(seconds) => set("webcamEvidenceMouseIdleThresholdSeconds", String(seconds))}
                            />
                            <p className="text-xs text-muted-foreground">Không di chuột/gõ phím quá thời gian sẽ ghi nhận.</p>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Cooldown giữa 2 lần chụp theo sự kiện</Label>
                            <DurationInput
                              defaultUnit="s"
                              minSeconds={1}
                              valueSeconds={Number(form.webcamEvidenceCooldownSeconds) || 0}
                              onChangeSeconds={(seconds) => set("webcamEvidenceCooldownSeconds", String(seconds))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Chụp định kỳ mỗi</Label>
                          <DurationInput
                            defaultUnit="m"
                            minSeconds={1}
                            placeholder="Mặc định"
                            valueSeconds={Number(form.webcamEvidenceScheduledIntervalSeconds) || 0}
                            onChangeSeconds={(seconds) => set("webcamEvidenceScheduledIntervalSeconds", String(seconds))}
                          />
                          <p className="text-xs text-muted-foreground">
                            Để trống: hệ thống tự chụp 5 mốc theo % thời gian làm bài (0%, 25%, 50%, 75%, 100%). Nhập giá trị để chụp đều đặn theo chu kỳ cố định — ảnh cuối luôn được thêm đúng lúc kết thúc bài thi kể cả khi không tròn chu kỳ.
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-3 rounded-md border border-amber-200 bg-white/60 p-2">
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4 text-muted-foreground" />
                            <Monitor className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label className="text-sm font-medium">Bật chụp màn hình song song</Label>
                              <p className="text-xs text-muted-foreground">Mỗi lần chụp bằng chứng sẽ lấy đồng thời 1 ảnh webcam và 1 ảnh toàn bộ màn hình.</p>
                            </div>
                          </div>
                          <Switch checked={form.screenCaptureEnabled} onCheckedChange={(v) => set("screenCaptureEnabled", v)} aria-label="Bật chụp màn hình song song" />
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          Đây là phiên bản thử nghiệm nên số lần chụp bằng chứng được giới hạn thấp để tiết kiệm chi phí lưu trữ và phân tích AI.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Separator />
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Label className="text-base font-semibold">
                        Cài đặt xem lại và phản hồi
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Các thiết lập xem lại theo giai đoạn được lưu trong trường JSON hiện có, nên dữ liệu cũ vẫn được giữ nguyên.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">Bật cấu hình xem lại</p>
                        <p className="text-xs text-muted-foreground">
                          Lưu quy tắc xem lại theo giai đoạn cho bài thi này.
                        </p>
                      </div>
                      <Switch
                        checked={reviewSettingsDraft.enabled}
                        onCheckedChange={(checked) =>
                          setReviewSettingsDraft((draft) => ({
                            ...draft,
                            enabled: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {REVIEW_PHASE_META.map((phase) => {
                      const config = reviewSettingsDraft.phases[phase.key];
                      const isActive = reviewSettingsDraft.enabled;

                      return (
                        <Card
                          key={phase.key}
                          className={!isActive ? "border-dashed bg-muted/30" : ""}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <CardTitle className="text-base">{phase.title}</CardTitle>
                                <CardDescription className="text-xs mt-1">
                                  {phase.description}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {([
                              {
                                key: "showScore",
                                label: "Hiển thị điểm",
                                desc: "Cho phép sinh viên xem điểm số.",
                              },
                              {
                                key: "showAnswers",
                                label: "Hiển thị đáp án",
                                desc: "Cho phép sinh viên xem đáp án hoặc đáp án mẫu.",
                              },
                              {
                                key: "showFeedback",
                                label: "Hiển thị phản hồi",
                                desc: "Hiển thị nhận xét và giải thích của giảng viên.",
                              },
                            ] as const).map((item) => (
                              <div
                                key={item.key}
                                className="flex items-center justify-between gap-3 rounded-lg border p-3"
                              >
                                <div>
                                  <p className="text-sm font-medium">{item.label}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.desc}
                                  </p>
                                </div>
                                <Switch
                                  checked={Boolean(config[item.key])}
                                  disabled={!isActive}
                                  onCheckedChange={(checked) =>
                                    setReviewSettingsDraft((draft) => ({
                                      ...draft,
                                      phases: {
                                        ...draft.phases,
                                        [phase.key]: {
                                          ...draft.phases[phase.key],
                                          [item.key]: checked,
                                        },
                                      },
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                </div>
              </CardContent>
            </>
          )}

          {step === "questions" && (
            <>
              <CardHeader>
                <CardTitle>Nguồn câu hỏi</CardTitle>
                <CardDescription>
                  Kết hợp câu hỏi từ nhiều nguồn. Đổi tab không làm mất câu hỏi đã thêm.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!questionSourceMode ? (
                  <button
                    type="button"
                    onClick={() => setQuestionSourceMode("choose")}
                    className="group flex min-h-56 w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-primary/35 bg-primary/[0.03] transition hover:border-primary hover:bg-primary/[0.07]"
                  >
                    <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-105">
                      <Plus className="h-10 w-10" />
                    </span>
                    <span className="text-lg font-semibold">Thêm nguồn câu hỏi</span>
                    <span className="max-w-md text-sm text-muted-foreground">
                      Enter questions, select exact bank questions, or randomize from topic pools.
                    </span>
                  </button>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-1 rounded-xl bg-muted p-1 md:grid-cols-3">
                      {([
                        ["manual", "Nhập trực tiếp", "Soạn câu hỏi cố định cho bài thi này.", FileText],
                        ["bank-select", "Chọn từ ngân hàng", "Chọn chủ đề, lọc rồi đánh dấu câu hỏi cần dùng.", Database],
                        ["bank-random", "Ngẫu nhiên theo chủ đề", "Đặt số lượng theo chủ đề cho từng lượt thi ngẫu nhiên.", Sparkles],
                      ] as const).map(([key, title, description, Icon]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setQuestionSourceMode(key);
                            set("sourceMethod", key === "manual" ? "import" : "bank");
                          }}
                          className={`rounded-lg px-4 py-3 text-left transition ${
                            questionSourceMode === key
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            <Icon className="h-4 w-4" />
                            {title}
                            {key === "manual" && aiGeneratedQuestions.length > 0 && <Badge>{aiGeneratedQuestions.length}</Badge>}
                            {key === "bank-select" && selectedBankQuestionIds.length > 0 && <Badge>{selectedBankQuestionIds.length}</Badge>}
                            {key === "bank-random" && randomQuestionCount > 0 && <Badge>{randomQuestionCount}</Badge>}
                          </span>
                          <span className="mt-1 block text-xs">{description}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Tổng số câu hỏi</p>
                        <p className="text-2xl font-bold">{composedQuestionCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Nhập trực tiếp</p>
                        <p className="text-lg font-semibold">{aiGeneratedQuestions.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Chọn từ ngân hàng</p>
                        <p className="text-lg font-semibold">{selectedBankQuestionIds.length}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Ngẫu nhiên theo chủ đề</p>
                        <p className="text-lg font-semibold">{randomQuestionCount}</p>
                      </div>
                    </div>

                    {questionSourceMode === "manual" && (
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-primary" />
                                <CardTitle className="text-base text-primary">Trợ lý AI</CardTitle>
                              </div>
                              <CardDescription>Tạo bản nháp, sau đó xem lại và chỉnh sửa trước khi thêm vào bài thi.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex flex-col gap-2 sm:flex-row">
                                <Input
                                  value={manualAiPrompt}
                                  onChange={(event) => setManualAiPrompt(event.target.value)}
                                  placeholder="Ví dụ: Lập chỉ mục cơ sở dữ liệu, cô lập giao dịch..."
                                  className="bg-background"
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") handleManualAiGenerate();
                                  }}
                                />
                                <Button
                                  type="button"
                                  onClick={handleManualAiGenerate}
                                  disabled={isManualAiGenerating || !manualAiPrompt.trim() || !form.course}
                                  className="gap-2"
                                >
                                  {isManualAiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                  Tạo
                                </Button>
                              </div>
                              {!form.course && (
                                <p className="text-xs text-amber-600">Chọn học phần ở phần Thông tin cơ bản để bật tạo câu hỏi bằng AI.</p>
                              )}
                              {manualAiSimilarityWarning && (
                                <p className="text-xs text-red-600 font-medium">{manualAiSimilarityWarning}</p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">
                                <HelpedTitle help={{
                                  description: "Xác định dạng trả lời của câu hỏi được thêm thủ công vào đề.",
                                  usedBy: "Giảng viên chọn trước khi nhập nội dung để hệ thống hiển thị đúng vùng đáp án, ghép đôi, sắp xếp hoặc tự luận.",
                                  note: "Khi đổi dạng câu hỏi, hãy kiểm tra lại đáp án và giải thích trước khi thêm vào đề.",
                                }}>
                                  Loại câu hỏi
                                </HelpedTitle>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Select
                                value={manualQuestionType}
                                onValueChange={(value) => {
                                  setManualQuestionType(value);
                                  setManualPinnedOptions(new Set());
                                }}
                              >
                                <SelectTrigger className="w-full sm:w-[280px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="multiple_choice">Trắc nghiệm nhiều lựa chọn</SelectItem>
                                  <SelectItem value="true_false">Đúng / Sai</SelectItem>
                                  <SelectItem value="fill_blank">Điền vào chỗ trống</SelectItem>
                                  <SelectItem value="matching">Ghép đôi</SelectItem>
                                  <SelectItem value="ordering">Sắp xếp theo thứ tự</SelectItem>
                                  <SelectItem value="find_error">Tìm lỗi sai</SelectItem>
                                  <SelectItem value="essay">Trả lời ngắn / Tự luận</SelectItem>
                                </SelectContent>
                              </Select>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Nội dung câu hỏi</CardTitle>
                              <CardDescription>Nhập nội dung hiển thị cho sinh viên.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {manualQuestionType === "fill_blank" && <FillBlankGuide />}
                              <Textarea
                                className="min-h-32 text-base"
                                value={manualQuestionContent}
                                onChange={(event) => setManualQuestionContent(event.target.value)}
                                placeholder="Nhập nội dung câu hỏi tại đây..."
                              />

                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={manualHasMedia}
                                    onCheckedChange={handleManualMediaToggle}
                                  />
                                  <Label>Đính kèm phương tiện</Label>
                                </div>
                                {manualHasMedia && (() => {
                                  const lockedType = manualMediaAttachment?.mediaType ?? manualMediaType;
                                  return (
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant={lockedType === "image" ? "default" : "outline"}
                                        size="sm"
                                        disabled={!!manualMediaAttachment}
                                        onClick={() => handleManualMediaTypeChange("image")}
                                        className="gap-1"
                                      >
                                        <Image className="h-3.5 w-3.5" /> Ảnh
                                      </Button>
                                      <Button
                                        type="button"
                                        variant={lockedType === "audio" ? "default" : "outline"}
                                        size="sm"
                                        disabled={!!manualMediaAttachment}
                                        onClick={() => handleManualMediaTypeChange("audio")}
                                        className="gap-1"
                                      >
                                        <Music className="h-3.5 w-3.5" /> Âm thanh
                                      </Button>
                                      {manualMediaAttachment && (
                                        <p className="self-center text-[10px] text-muted-foreground">
                                          Xoá tệp để đổi loại đính kèm
                                        </p>
                                      )}
                                    </div>
                                  );
                                })()}
                              </div>

                              {manualHasMedia && (
                                <div
                                  className="rounded-lg border-2 border-dashed border-muted p-6 text-center"
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) => {
                                    event.preventDefault();
                                    void handleManualMediaFile(event.dataTransfer.files?.[0]);
                                  }}
                                >
                                  <input
                                    ref={manualMediaFileInputRef}
                                    type="file"
                                    accept={MEDIA_ACCEPT[manualMediaAttachment?.mediaType ?? manualMediaType]}
                                    className="hidden"
                                    onChange={(event) => {
                                      void handleManualMediaFile(event.target.files?.[0]);
                                      event.target.value = "";
                                    }}
                                  />
                                  {manualMediaAttachment ? (
                                    <div className="space-y-2">
                                      {manualMediaAttachment.mediaType === "image" ? (
                                        <img
                                          src={manualMediaAttachment.mediaUrl}
                                          alt="Xem trước tệp đính kèm"
                                          className="mx-auto max-h-32 rounded-md object-contain"
                                        />
                                      ) : (
                                        <audio src={manualMediaAttachment.mediaUrl} controls className="mx-auto" />
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {(manualMediaAttachment.mediaSizeBytes / 1024).toFixed(0)} KB
                                      </p>
                                      <div className="flex justify-center gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          disabled={manualMediaUploading}
                                          onClick={() => manualMediaFileInputRef.current?.click()}
                                        >
                                          Chọn tệp khác
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleManualRemoveMediaAttachment}>
                                          Xoá
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-sm text-muted-foreground">
                                        Kéo thả {manualMediaType === "image" ? "một hình ảnh" : "một tệp âm thanh"} vào đây, hoặc nhấn để chọn tệp
                                      </p>
                                      <p className="mt-1 text-[11px] text-muted-foreground">
                                        {manualMediaType === "image"
                                          ? `Tối đa ${MEDIA_MAX_BYTES.image / (1024 * 1024)}MB, PNG/JPEG/WEBP`
                                          : `Tối đa ${MEDIA_MAX_BYTES.audio / (1024 * 1024)}MB, MP3/WAV`}
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="mt-2"
                                        disabled={manualMediaUploading}
                                        onClick={() => manualMediaFileInputRef.current?.click()}
                                      >
                                        {manualMediaUploading ? (
                                          <>
                                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Đang tải lên...
                                          </>
                                        ) : (
                                          "Chọn tệp"
                                        )}
                                      </Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          <QuestionAnswerEditor
                            questionType={manualQuestionType}
                            options={manualOptions}
                            multipleAnswers={manualMultipleAnswers}
                            tfAnswer={manualTrueFalseAnswer}
                            essayRubric={manualEssayRubric}
                            pinnedOptions={manualPinnedOptions}
                            onMultipleAnswersChange={setManualMultipleAnswers}
                            onTfAnswerChange={setManualTrueFalseAnswer}
                            onEssayRubricChange={setManualEssayRubric}
                            onAddOption={addManualOption}
                            onRemoveOption={removeManualOption}
                            onUpdateOption={updateManualOption}
                            onReplaceOptions={setManualOptions}
                            onUpdateMatch={updateManualOptionMatch}
                            onMoveOption={moveManualOption}
                            onToggleCorrect={toggleManualCorrectOption}
                            onTogglePinned={toggleManualPinnedOption}
                          />

                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Giải thích (không bắt buộc)</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Textarea
                                value={manualExplanation}
                                onChange={(event) => setManualExplanation(event.target.value)}
                                placeholder="Giải thích vì sao đáp án này đúng..."
                              />
                            </CardContent>
                          </Card>
                        </div>

                        <div className="grid items-stretch gap-4 md:grid-cols-[1fr_1fr_auto]">
                          <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm">Học phần</CardTitle></CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm font-medium">
                                {courses.find((course) => course.id === form.course)?.name || "Chọn học phần ở phần Thông tin cơ bản"}
                              </p>
                              <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-1.5">
                                  <Label className="text-xs text-muted-foreground">Chủ đề</Label>
                                  <ContextHelp content={{
                                    description: "Gắn câu hỏi vào chủ đề kiến thức trong khóa học.",
                                    usedBy: "Dùng khi tạo câu hỏi thủ công, lọc ngân hàng câu hỏi và phân tích điểm yếu theo chủ đề.",
                                    note: "Chủ đề càng rõ thì việc sinh đề và thống kê sau bài thi càng chính xác.",
                                  }} />
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => manualTopics.setShowTopicDialog(true)}
                                  disabled={!form.course}
                                  className="w-full justify-start text-left font-normal"
                                >
                                  {manualTopicId
                                    ? manualTopics.availableTopics.find((t) => t.id === manualTopicId)?.name || "Chủ đề không xác định"
                                    : "Chọn hoặc tạo chủ đề..."}
                                </Button>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Mục tiêu học tập</Label>
                                <Input
                                  value={manualLearningObjective}
                                  onChange={(event) => setManualLearningObjective(event.target.value)}
                                  placeholder="Ví dụ: Áp dụng thuật toán Dijkstra"
                                />
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-sm"><HelpedTitle help={{
                              description: "Mức độ khó dự kiến của câu hỏi thủ công.",
                              usedBy: "Dùng để cân bằng đề và hỗ trợ phân tích chất lượng câu hỏi sau khi có bài làm.",
                              note: "Độ khó là nhãn ban đầu, có thể khác với độ khó thực tế khi sinh viên làm bài.",
                            }}>Độ khó</HelpedTitle></CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                              {(["easy", "medium", "hard"] as const).map((difficulty) => (
                                <Button
                                  key={difficulty}
                                  type="button"
                                  variant={manualDifficulty === difficulty ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setManualDifficulty(difficulty)}
                                  className="capitalize"
                                >
                                  {difficulty === "easy" ? "Dễ" : difficulty === "medium" ? "Trung bình" : "Khó"}
                                </Button>
                              ))}
                            </CardContent>
                          </Card>
                          <Button type="button" className="h-full min-h-20 px-8" onClick={addManualQuestion}>
                            <Plus className="mr-2 h-4 w-4" /> Thêm vào bài thi
                          </Button>
                        </div>

                        {aiGeneratedQuestions.length > 0 && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Questions added ({aiGeneratedQuestions.length})</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {aiGeneratedQuestions.map((question, index) => (
                                <div key={`${question.content}-${index}`} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                                  <div>
                                    <p className="text-sm font-medium">Q{index + 1}. {question.content}</p>
                                    <p className="text-xs text-muted-foreground">{question.type}</p>
                                  </div>
                                  <Button type="button" variant="ghost" size="sm" onClick={() => setAiGeneratedQuestions((questions) => questions.filter((_, itemIndex) => itemIndex !== index))}>
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}

                    {questionSourceMode === "bank-select" && (
                      <div className="space-y-4 rounded-xl border p-5">
                        <div>
                          <div className="inline-flex items-center gap-1.5">
                            <Label>Chọn chủ đề trước</Label>
                            <ContextHelp content={{
                              description: "Chọn chủ đề để giới hạn danh sách câu hỏi theo nhóm kiến thức cần đưa vào đề.",
                              usedBy: "Dùng khi lấy câu hỏi từ ngân hàng thay vì tạo mới.",
                              note: "Chọn đúng chủ đề giúp đề thi bám sát phạm vi ôn tập và mục tiêu đánh giá.",
                            }} />
                          </div>
                          <Select value={selectedBankTopicId} onValueChange={setSelectedBankTopicId}>
                            <SelectTrigger className="mt-1"><SelectValue placeholder="Chọn chủ đề" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__all__">Tất cả câu hỏi trong học phần</SelectItem>
                              {bankTopics.filter((topic) => topic.topicId).map((topic) => (
                                <SelectItem key={topic.topicId} value={topic.topicId}>{topic.topic} ({topic.count})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedBankTopicId && (
                          <>
                            <div className="grid gap-4 md:grid-cols-2">
                              <div>
                                <div className="inline-flex items-center gap-1.5">
                                  <Label>Loại câu hỏi</Label>
                                  <ContextHelp content={{
                                    description: "Lọc ngân hàng theo dạng câu hỏi như trắc nghiệm, đúng/sai hoặc tự luận.",
                                    usedBy: "Dùng khi muốn đề thi có đúng cấu trúc câu hỏi đã thiết kế.",
                                    note: "Nếu chọn quá hẹp, số câu khả dụng có thể không đủ cho đề.",
                                  }} />
                                </div>
                                <Select value={form.questionType} onValueChange={(value) => set("questionType", value)}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    {QUESTION_TYPE_OPTIONS.filter((type) => type.value !== "custom").map((type) => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <div className="inline-flex items-center gap-1.5">
                                  <Label>Độ khó</Label>
                                  <ContextHelp content={{
                                    description: "Lọc câu hỏi theo mức độ khó đã gắn trong ngân hàng.",
                                    usedBy: "Dùng để cân bằng đề hoặc tạo đề theo một mức độ cụ thể.",
                                    note: "Số lượng câu mỗi mức phụ thuộc vào dữ liệu ngân hàng hiện có.",
                                  }} />
                                </div>
                                <Select value={form.bankDifficulty} onValueChange={(value) => set("bankDifficulty", value)}>
                                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mixed">Trộn tất cả mức độ</SelectItem>
                                    <SelectItem value="easy">Dễ</SelectItem>
                                    <SelectItem value="medium">Trung bình</SelectItem>
                                    <SelectItem value="hard">Khó</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            {!isLoadingBankQuestions && filteredBankQuestions.length > 0 && (
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">{versionReadyBankQuestions.length} câu hỏi sẵn sàng{filteredBankQuestions.length > versionReadyBankQuestions.length ? ` · ${filteredBankQuestions.length - versionReadyBankQuestions.length} câu cần chuẩn hóa phiên bản` : ""}</p>
                                <Button type="button" variant="outline" size="sm" onClick={toggleSelectAllBankQuestions}>
                                  {isAllFilteredBankQuestionsSelected ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                                </Button>
                              </div>
                            )}
                            <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                              {isLoadingBankQuestions ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">Đang tải câu hỏi...</p>
                              ) : filteredBankQuestions.map((question) => {
                                const checked = selectedBankQuestionIds.includes(question.id);
                                return (
                                  <label key={question.id} className={`flex items-start gap-3 rounded-lg border p-3 ${question.isVersionReady ? "cursor-pointer" : "cursor-not-allowed opacity-60"} ${checked ? "border-primary bg-primary/5" : ""}`}>
                                    <Checkbox
                                      checked={checked}
                                      disabled={!question.isVersionReady}
                                      onCheckedChange={(value) => setSelectedBankQuestionIds((ids) => value && question.isVersionReady ? [...new Set([...ids, question.id])] : ids.filter((id) => id !== question.id))}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <p className="flex items-center gap-1.5 text-sm font-medium">
                                        {question.mediaType === "image" ? (
                                          <Image className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Câu hỏi có hình ảnh đính kèm" />
                                        ) : question.mediaType === "audio" ? (
                                          <Music className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Câu hỏi có âm thanh đính kèm" />
                                        ) : null}
                                        <span className="min-w-0 truncate">{question.content}</span>
                                      </p>
                                      <div className="mt-2 flex gap-2">
                                        <Badge variant="outline">{question.type}</Badge>
                                        <Badge variant="outline">{difficultyLabelViFromValue(question.difficulty)}</Badge>
                                        {!question.isVersionReady ? <Badge variant="destructive">Cần chuẩn hóa phiên bản</Badge> : null}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                            <p className="text-sm font-medium">{selectedBankQuestionIds.length} câu hỏi đã chọn</p>
                          </>
                        )}
                      </div>
                    )}

                    {questionSourceMode === "bank-random" && (
                      <div className="space-y-4 rounded-xl border p-5">
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                          Số lượng câu hỏi theo mỗi chủ đề sẽ được lưu làm chính sách trộn ngẫu nhiên cho từng lượt thi của sinh viên.
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="inline-flex items-center gap-1.5">
                              <Label>Loại câu hỏi</Label>
                              <ContextHelp content="Phân loại cách trả lời của câu hỏi, dùng khi tạo đề và phân tích kết quả." />
                            </div>
                            <Select value={form.questionType} onValueChange={(value) => set("questionType", value)}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent>{QUESTION_TYPE_OPTIONS.filter((type) => type.value !== "custom").map((type) => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div>
                            <div className="inline-flex items-center gap-1.5">
                              <Label>Độ khó</Label>
                              <ContextHelp content="Mức độ khó của câu hỏi, dùng để phân loại và hỗ trợ phân tích." />
                            </div>
                            <Select value={form.bankDifficulty} onValueChange={(value) => set("bankDifficulty", value)}>
                              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                              <SelectContent><SelectItem value="mixed">Trộn tất cả mức độ</SelectItem><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
                            </Select>
                          </div>
                        </div>
                        <p className="text-sm font-medium">
                          Số câu hỏi ngẫu nhiên: {randomQuestionCount} câu
                        </p>
                        <div className="space-y-2">
                          {bankTopics.map((topic) => (
                            <label key={topic.topicId || topic.topic} className={`flex items-center gap-3 rounded-lg border p-3 ${topic.selected ? "border-primary bg-primary/5" : ""}`}>
                              <Checkbox checked={topic.selected} onCheckedChange={(value) => setBankTopics((topics) => topics.map((item) => item.topicId === topic.topicId ? { ...item, selected: Boolean(value), requestedCount: value ? (item.requestedCount === "0" ? "1" : item.requestedCount) : "0" } : item))} />
                              <div className="flex-1"><p className="text-sm font-medium">{topic.topic}</p><p className="text-xs text-muted-foreground">{topic.count} câu khả dụng</p></div>
                              <Input className="w-24" type="number" min={0} value={topic.requestedCount} onChange={(event) => setBankTopics((topics) => topics.map((item) => item.topicId === topic.topicId ? { ...item, requestedCount: sanitizeNumericInput(event.target.value, { min: 0 }), selected: Number(event.target.value || 0) > 0 } : item))} />
                            </label>
                          ))}
                        </div>
                        {bankSelectionWarning && <p className="text-xs font-medium text-amber-600">{bankSelectionWarning}</p>}
                      </div>
                    )}
                  </div>
                )}

                <Tabs
                  value={form.sourceMethod}
                  onValueChange={(v) => set("sourceMethod", v as any)}
                  className="hidden"
                >
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-4">
                    <TabsTrigger value="bank" className="gap-2">
                      <Database className="h-4 w-4" /> Bank
                    </TabsTrigger>
                    <TabsTrigger value="import" className="gap-2">
                      <Upload className="h-4 w-4" /> Import
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2">
                      <Sparkles className="h-4 w-4" /> AI Gen
                    </TabsTrigger>
                  </TabsList>

                  {/* --- TAB: QUESTION BANK --- */}
                  <TabsContent
                    value="bank"
                    className="space-y-5 animate-in fade-in duration-300"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label>Số lượng câu hỏi</Label>
                        <Input
                          type="number"
                          value={form.questionCount}
                          onChange={(e) =>
                            set(
                              "questionCount",
                              sanitizeNumericInput(e.target.value, { min: 1 }),
                            )
                          }
                          min={1}
                          onBlur={(e) =>
                            setNumberErrors((prev) => ({
                              ...prev,
                              questionCount:
                                getNumericInputError(e.target.value, {
                                  min: 1,
                                  integer: true,
                                }) || "",
                            }))
                          }
                          className="mt-1"
                        />
                        {numberErrors.questionCount ? (
                          <p className="mt-1 text-xs text-destructive">
                            {numberErrors.questionCount}
                          </p>
                        ) : null}
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5">
                          <Label>Phân bổ dạng câu hỏi</Label>
                          <ContextHelp content="Phân bổ dạng câu hỏi trong đề, dùng để kiểm soát cấu trúc đề thi." />
                        </div>
                        <Select
                          value={form.questionType}
                          onValueChange={(v) => set("questionType", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUESTION_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5">
                          <Label>Độ khó</Label>
                          <ContextHelp content="Mức độ khó của câu hỏi, dùng để phân loại và hỗ trợ phân tích." />
                        </div>
                        <Select
                          value={form.bankDifficulty}
                          onValueChange={(v) => set("bankDifficulty", v)}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mixed">
                              Mixed (all levels)
                            </SelectItem>
                            <SelectItem value="easy">Dễ</SelectItem>
                            <SelectItem value="medium">Trung bình</SelectItem>
                            <SelectItem value="hard">Khó</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {form.questionType === "custom" && (
                      <div className="p-4 border rounded-lg bg-secondary/10 space-y-3">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                          Select Types to Include
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            "Single Choice",
                            "Multiple Choice",
                            "True / False",
                            "Fill in the Blank",
                            "Matching",
                            "Ordering",
                            "Essay",
                          ].map((t) => (
                            <label
                              key={t}
                              className="flex items-center gap-2 text-sm p-2 border rounded hover:bg-card cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                defaultChecked
                                className="accent-primary"
                              />
                              {t}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-muted-foreground">
                      Topics to include
                      <ContextHelp content="Các chủ đề được đưa vào đề, giúp đề thi bám sát phạm vi kiến thức mong muốn." />
                    </p>
                    {!form.course && (
                      <p className="text-sm text-muted-foreground">
                        Select a course to load available topics.
                      </p>
                    )}

                    {form.course && isLoadingBankTopics && (
                      <p className="text-sm text-muted-foreground">
                        Loading topics...
                      </p>
                    )}

                    {form.course &&
                      !isLoadingBankTopics &&
                      bankTopics.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No topics found for this course yet.
                        </p>
                      )}

                    {bankTopics.length > 0 && (
                      <div className="space-y-2">
                        {bankTopics.map((bank) => (
                          <label
                            key={bank.topicId}
                            className={`flex items-center gap-3 border rounded-lg px-4 py-3 cursor-pointer transition-all
                          ${bank.selected ? "border-primary bg-primary/5" : "border-border"}`}
                          >
                            <input
                              type="checkbox"
                              checked={bank.selected}
                              onChange={() =>
                                setBankTopics((prev) =>
                                  prev.map((item) =>
                                    item.topicId === bank.topicId
                                      ? {
                                          ...item,
                                          selected: !item.selected,
                                          requestedCount: !item.selected
                                            ? item.requestedCount === "0"
                                              ? "1"
                                              : item.requestedCount
                                            : "0",
                                        }
                                      : item,
                                  ),
                                )
                              }
                              className="accent-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{bank.topic}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {bank.count} available total
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex flex-col items-end gap-1">
                                <Input
                                  type="number"
                                  min={0}
                                  value={bank.requestedCount}
                                  onChange={(e) =>
                                    setBankTopics((prev) =>
                                      prev.map((item) =>
                                        item.topicId === bank.topicId
                                          ? {
                                              ...item,
                                              requestedCount: sanitizeNumericInput(e.target.value, { min: 0 }),
                                              selected: Number(e.target.value || 0) > 0 || item.selected,
                                            }
                                          : item,
                                      ),
                                    )
                                  }
                                  className="w-20 h-9 text-sm text-right"
                                />
                                <span className="text-[10px] text-muted-foreground">
                                  {form.questionType === "mixed" || form.questionType === "custom"
                                    ? `${bank.count} available`
                                    : `${Number(bank.availableByType?.[mapQuestionTypeToDb(form.questionType)] || 0)} available for this type`}
                                </span>
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}

                    {bankSelectionWarning && (
                      <p className="text-xs text-amber-600 font-medium">
                        {bankSelectionWarning}
                      </p>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={() => router.push("/lecturer/question-bank")}
                    >
                      <Plus className="h-4 w-4" /> Go to Question Bank
                    </Button>
                  </TabsContent>

                  {/* --- TAB: IMPORT DOC --- */}
                  <TabsContent
                    value="import"
                    className="space-y-5 animate-in fade-in duration-300"
                  >
                    <input
                      ref={docFileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const selected = e.target.files?.[0] || null;
                        setDocFile(selected);
                      }}
                    />
                    <div className="p-8 border-2 border-dashed rounded-xl bg-secondary/5 flex flex-col items-center justify-center text-center space-y-4">
                      {!docFile ? (
                        <>
                          <div className="p-4 rounded-full bg-blue-100 text-blue-600">
                            <Upload className="h-10 w-10" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              Upload your document
                            </p>
                            <p className="text-sm text-muted-foreground max-w-xs">
                              AI will extract questions from your Word, PDF, or
                              Plain Text files.
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-background cursor-pointer"
                            onClick={() => docFileInputRef.current?.click()}
                          >
                            <FileSearch className="h-4 w-4 mr-2" /> Browse Files
                          </Button>
                        </>
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="flex items-center justify-between p-4 border rounded-xl bg-blue-50/50 border-blue-200 w-full">
                            <div className="flex items-center gap-4 text-left">
                              <div className="h-12 w-12 rounded bg-blue-600 flex items-center justify-center text-white">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="font-bold text-base text-blue-700">
                                  {docFile.name}
                                </p>
                                <p className="text-xs text-blue-600 opacity-80">
                                  Selected file • {formatFileSize(docFile.size)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setDocFile(null);
                                if (docFileInputRef.current)
                                  docFileInputRef.current.value = "";
                              }}
                            >
                              <Plus className="h-5 w-5 rotate-45" />
                            </Button>
                          </div>
                          <Button
                            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 py-6 text-base"
                            onClick={handleImportExtract}
                            disabled={isStandardizing}
                          >
                            {isStandardizing ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <Wand2 className="h-5 w-5" />
                            )}
                            Start AI Extraction
                          </Button>
                        </div>
                      )}
                    </div>

                    {isStandardizing && (
                      <div className="space-y-2 p-4 border rounded-lg bg-blue-50/30 animate-in slide-in-from-top-4">
                        <div className="flex justify-between text-[11px] text-blue-700 font-bold uppercase tracking-wider">
                          <span>AI Agent: Extracting and generating...</span>
                          <span>Đang xử lý</span>
                        </div>
                        <Progress value={65} className="h-2 bg-blue-100" />
                      </div>
                    )}

                    {aiGeneratedQuestions.length > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          ✓ {aiGeneratedQuestions.length} questions extracted
                        </p>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {aiGeneratedQuestions.map((q, i) => (
                            <div
                              key={i}
                              className="text-xs bg-white p-2 rounded border"
                            >
                              <span className="font-medium text-muted-foreground">
                                Q{i + 1}.
                              </span>{" "}
                              <span className="line-clamp-2">{q.content}</span>
                              <div className="flex gap-2 mt-1">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4"
                                >
                                  {q.type}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-4"
                                >
                                  Độ khó:{" "}
                                  {difficultyLabelViFromValue(q.difficulty)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* --- TAB: AI GENERATION --- */}
                  <TabsContent
                    value="ai"
                    className="space-y-5 animate-in fade-in duration-300"
                  >
                    <div className="p-6 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="ai-prompt"
                          className="text-base font-bold"
                        >
                          What is the focus of this exam?
                        </Label>
                        <Textarea
                          id="ai-prompt"
                          placeholder="Ví dụ: Kiểm tra giữa kỳ môn Mạng máy tính. Tập trung vào các lớp OSI, sự khác biệt TCP/UDP và chia mạng con."
                          value={form.aiPrompt}
                          onChange={(e) => set("aiPrompt", e.target.value)}
                          rows={4}
                          className="bg-background text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Số lượng câu hỏi</Label>
                          <Input
                            type="number"
                            min={1}
                            value={form.questionCount}
                            onChange={(e) =>
                              set(
                                "questionCount",
                                sanitizeNumericInput(e.target.value, { min: 1 }),
                              )
                            }
                            onBlur={(e) =>
                              setNumberErrors((prev) => ({
                                ...prev,
                                questionCount:
                                  getNumericInputError(e.target.value, {
                                    min: 1,
                                    integer: true,
                                  }) || "",
                              }))
                            }
                          />
                          {numberErrors.questionCount ? (
                            <p className="mt-1 text-xs text-destructive">
                              {numberErrors.questionCount}
                            </p>
                          ) : null}
                        </div>
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-1.5">
                            <Label>Phân bổ dạng câu hỏi</Label>
                            <ContextHelp content="Phân bổ dạng câu hỏi trong đề, dùng để kiểm soát cấu trúc đề thi." />
                          </div>
                          <Select
                            value={form.questionType}
                            onValueChange={(v) => set("questionType", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUESTION_TYPE_OPTIONS.filter(
                                (type) => type.value !== "custom",
                              ).map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Độ khó</Label>
                          <Select
                            value={form.aiDifficulty}
                            onValueChange={(v) => set("aiDifficulty", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="easy">Dễ</SelectItem>
                              <SelectItem value="medium">Trung bình</SelectItem>
                              <SelectItem value="hard">Khó</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-amber-900">
                            Mandatory Teacher Review
                          </p>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Questions generated by AI will be placed in a
                            pending state until you approve each one for
                            accuracy and integrity.
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full py-6 text-base gap-2 shadow-lg shadow-primary/20"
                        onClick={handleAiGenerate}
                        disabled={isAiGenerating || !form.aiPrompt.trim()}
                      >
                        {isAiGenerating ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />{" "}
                            Generating Questions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" /> Generate Complete
                            Exam
                          </>
                        )}
                      </Button>

                      {aiGeneratedQuestions.length > 0 && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">
                            ✓ {aiGeneratedQuestions.length} questions generated
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {aiGeneratedQuestions.map((q, i) => (
                              <div
                                key={i}
                                className="text-xs bg-white p-2 rounded border"
                              >
                                <span className="font-medium text-muted-foreground">
                                  Q{i + 1}.
                                </span>{" "}
                                <span className="line-clamp-2">
                                  {q.content}
                                </span>
                                <div className="flex gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-4"
                                  >
                                    {q.type}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] h-4"
                                  >
                                    Độ khó:{" "}
                                    {difficultyLabelViFromValue(q.difficulty)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          )}

          {step === "preview" && (
            <>
              <CardHeader>
                <CardTitle>Xem trước bài thi</CardTitle>
                <CardDescription>
                  Kiểm tra toàn bộ cài đặt trước khi tạo bài thi.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                {[
                  { label: "Tiêu đề", value: form.title || "—" },
                  {
                    label: "Khóa học",
                    value: courses.find((course) => course.id === form.course)
                      ?.code
                      ? `${courses.find((course) => course.id === form.course)?.code} - ${courses.find((course) => course.id === form.course)?.name}`
                      : "—",
                  },
                  { label: "Mô tả", value: form.description || "—" },
                  { label: "Thời lượng", value: `${form.duration} phút` },
                  {
                    label: "Số lần làm tối đa (1-10)",
                    value: form.maxAttempts || "1",
                  },
                  {
                    label: "Cách tính điểm",
                    value: form.gradingStrategy,
                  },
                  { label: "Điểm đạt", value: `${form.passingScore}%` },
                  {
                    label: "Khung giờ thi",
                    value: `${form.startDate} ${form.startTime} → ${form.endDate} ${form.endTime}`,
                  },
                  {
                    label: "Câu hỏi",
                    value: `${composedQuestionCount} câu (${aiGeneratedQuestions.length} trực tiếp + ${selectedBankQuestionIds.length} đã chọn + ${randomQuestionCount} ngẫu nhiên)`,
                  },
                  {
                    label: "Giám sát AI",
                    value: form.requiresProctoring ? "Đã bật" : "Đã tắt",
                  },
                  {
                    label: "Nộp muộn",
                    value: isSingleAttempt
                      ? "Bị khóa khi số lần làm tối đa = 1"
                      : form.allowLateSubmission
                        ? "Cho phép"
                        : "Không cho phép",
                  },
                  {
                    label: "Xáo trộn",
                    value: form.shuffleQuestions ? "Có" : "Không",
                  },
                  {
                    label: "Cài đặt xem lại",
                    value: reviewSettingsDraft.enabled ? "Theo giai đoạn" : "Mặc định",
                  },
                  {
                    label: "Hiển thị kết quả",
                    value: form.showResultImmediately
                      ? "Ngay lập tức"
                      : "Sau khi xem lại",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-3">
                    <span className="text-muted-foreground w-36 shrink-0">
                      {label}
                    </span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </CardContent>
            </>
          )}
        </Card>

        {/* Navigation buttons */}
        <div className="flex justify-between pb-8">
          <Button
            variant="outline"
            onClick={() => {
              if (stepIdx === 0) router.push("/lecturer/exams");
              else setStep(STEPS[stepIdx - 1].key);
            }}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {stepIdx === 0 ? "Hủy" : "Quay lại"}
          </Button>

          {step !== "preview" ? (
            <Button
              onClick={() => setStep(STEPS[stepIdx + 1].key)}
              disabled={!canNext()}
              className="gap-2"
            >
              Tiếp tục <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating}
              className="gap-2"
            >
              {isCreating ? (
                "Đang tạo…"
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Tạo bài thi
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <QuestionTopicDialog
        open={manualTopics.showTopicDialog}
        selectedTopicId={manualTopicId}
        newTopicName={manualTopics.newTopicName}
        topicDescription={manualTopics.topicDescription}
        topicSearch={manualTopics.topicSearch}
        topics={manualTopics.filteredTopics}
        suggestions={manualTopics.topicSuggestions}
        checkingSimilarity={manualTopics.checkingTopicSimilarity}
        creatingTopic={manualTopics.creatingTopic}
        checkMessage={manualTopics.topicCheckMessage}
        onNewTopicNameChange={manualTopics.setNewTopicName}
        onTopicDescriptionChange={manualTopics.setTopicDescription}
        onTopicSearchChange={manualTopics.setTopicSearch}
        onClose={manualTopics.closeTopicDialog}
        onSelect={manualTopics.selectTopic}
        onCreate={manualTopics.createTopic}
        onCheckSimilarity={manualTopics.checkSimilarTopics}
      />
    </DashboardLayout>
  );
}



