export type CourseExamSubmission = {
  id?: string;
  examId?: string;
  status?: string | null;
  score?: number | null;
  attemptNo?: number | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  createdAt?: string | null;
};

export type CourseExamForAction = {
  id: string;
  title?: string;
  status?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  maxAttempts?: number | null;
  settings?: {
    maxAttempts?: number | null;
  } | null;
  latestSubmission?: CourseExamSubmission | null;
};

export type CourseExamAction = {
  label: string;
  href: string;
  actionType:
    | "continue_attempt"
    | "start_exam"
    | "view_schedule"
    | "view_results"
    | "view_submitted"
    | "view_exams"
    | "view_course"
    | "grading"
    | "expired";
  summary: string;
  disabled?: boolean;
};

export type ExamDisplayState =
  | "draft"
  | "unscheduled"
  | "upcoming"
  | "open"
  | "in_progress"
  | "submitted"
  | "graded"
  | "grading"
  | "expired";

const COMPLETED_STATUSES = new Set(["SUBMITTED", "GRADED", "FLAGGED", "FINALIZED"]);
const GRADED_STATUSES = new Set(["GRADED", "FLAGGED", "FINALIZED"]);

function normalizeStatus(value?: string | null) {
  return String(value || "").toUpperCase();
}

function timestamp(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function latestSubmissionForExam(
  exam: CourseExamForAction,
  submissions: CourseExamSubmission[] = [],
) {
  if (exam.latestSubmission) return exam.latestSubmission;

  return submissions
    .filter((submission) => submission.examId === exam.id)
    .sort((a, b) => {
      const aTime = timestamp(a.submittedAt) ?? timestamp(a.startedAt) ?? timestamp(a.createdAt) ?? 0;
      const bTime = timestamp(b.submittedAt) ?? timestamp(b.startedAt) ?? timestamp(b.createdAt) ?? 0;
      return bTime - aTime;
    })[0] ?? null;
}

export function getExamDisplayState(
  exam: CourseExamForAction,
  submission?: CourseExamSubmission | null,
  now = new Date(),
): ExamDisplayState {
  const submissionStatus = normalizeStatus(submission?.status);
  const examStatus = normalizeStatus(exam.status);

  if (submissionStatus === "IN_PROGRESS") return "in_progress";
  if (GRADED_STATUSES.has(submissionStatus)) return "graded";
  if (submissionStatus === "SUBMITTED") {
    return typeof submission?.score === "number" ? "submitted" : "grading";
  }
  if (COMPLETED_STATUSES.has(submissionStatus)) return "submitted";

  if (!["PUBLISHED", "ONGOING", "COMPLETED"].includes(examStatus)) return "draft";

  const nowTime = now.getTime();
  const startTime = timestamp(exam.startTime);
  const endTime = timestamp(exam.endTime);

  if (!startTime && !endTime) return "unscheduled";
  if (startTime && startTime > nowTime) return "upcoming";
  if (endTime && endTime < nowTime) return "expired";

  return "open";
}

export function getExamStateLabel(state: ExamDisplayState) {
  const labels: Record<ExamDisplayState, string> = {
    draft: "Chưa công bố",
    unscheduled: "Chưa lên lịch",
    upcoming: "Sắp diễn ra",
    open: "Đang mở",
    in_progress: "Đang làm",
    submitted: "Đã hoàn thành",
    graded: "Đã có kết quả",
    grading: "Đang chấm điểm",
    expired: "Đã hết hạn",
  };

  return labels[state];
}

export function getExamAction(
  exam: CourseExamForAction,
  courseId: string,
  submissions: CourseExamSubmission[] = [],
  now = new Date(),
): CourseExamAction {
  const submission = latestSubmissionForExam(exam, submissions);
  const state = getExamDisplayState(exam, submission, now);
  const detailHref = `/student/exams/${exam.id}`;
  const resultHref = submission?.id
    ? `/student/grading?examId=${exam.id}&submissionId=${submission.id}`
    : `/student/grading?examId=${exam.id}`;

  if (state === "in_progress") {
    return {
      label: "Tiếp tục làm bài",
      href: `/student/exam-ready?examId=${exam.id}`,
      actionType: "continue_attempt",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "open") {
    return {
      label: "Làm bài thi",
      href: `/student/exam-ready?examId=${exam.id}`,
      actionType: "start_exam",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "upcoming") {
    return {
      label: "Xem lịch thi",
      href: detailHref,
      actionType: "view_schedule",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "graded") {
    return {
      label: "Xem kết quả",
      href: resultHref,
      actionType: "view_results",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "submitted") {
    return {
      label: "Xem bài đã nộp",
      href: resultHref,
      actionType: "view_submitted",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "grading") {
    return {
      label: "Đang chấm điểm",
      href: resultHref,
      actionType: "grading",
      summary: getExamStateLabel(state),
      disabled: true,
    };
  }

  if (state === "expired") {
    return {
      label: "Đã hết hạn",
      href: detailHref,
      actionType: "expired",
      summary: getExamStateLabel(state),
      disabled: true,
    };
  }

  return {
    label: "Chi tiết",
    href: `/student/courses/${courseId}`,
    actionType: "view_exams",
    summary: getExamStateLabel(state),
  };
}

export function getCourseExamAction(
  course: { id: string },
  exams: CourseExamForAction[] = [],
  submissions: CourseExamSubmission[] = [],
  now = new Date(),
): CourseExamAction {
  const visibleExams = exams.filter((exam) =>
    ["PUBLISHED", "ONGOING", "COMPLETED"].includes(normalizeStatus(exam.status)),
  );

  if (visibleExams.length === 0) {
    return {
      label: "Xem khóa học",
      href: `/student/courses/${course.id}`,
      actionType: "view_course",
      summary: "Chưa có bài thi",
    };
  }

  const rows = visibleExams.map((exam) => {
    const submission = latestSubmissionForExam(exam, submissions);
    const state = getExamDisplayState(exam, submission, now);
    return { exam, submission, state };
  });

  const completedCount = rows.filter((row) =>
    ["submitted", "graded", "grading"].includes(row.state),
  ).length;
  const inProgress = rows.find((row) => row.state === "in_progress");
  const openRows = rows.filter((row) => row.state === "open");
  const upcomingRows = rows.filter((row) => row.state === "upcoming");
  const unscheduledRows = rows.filter((row) => row.state === "unscheduled");

  const summaryParts: string[] = [];
  if (completedCount === visibleExams.length) {
    summaryParts.push("Đã hoàn thành tất cả bài thi");
  } else if (completedCount > 0) {
    summaryParts.push(`Đã hoàn thành ${completedCount}/${visibleExams.length} bài thi`);
  }
  if (openRows.length > 0) summaryParts.push(`${openRows.length} bài thi đang mở`);
  if (upcomingRows.length > 0) summaryParts.push(`${upcomingRows.length} bài thi sắp diễn ra`);
  if (summaryParts.length === 0 && unscheduledRows.length > 0) summaryParts.push("Có bài thi chưa lên lịch");
  if (summaryParts.length === 0) summaryParts.push("Xem danh sách bài thi");

  const summary = summaryParts.join(" • ");

  if (inProgress) {
    return {
      ...getExamAction(inProgress.exam, course.id, submissions, now),
      summary,
    };
  }

  if (openRows.length > 0) {
    const allHaveEndTime = openRows.every((row) => Boolean(timestamp(row.exam.endTime)));
    if (openRows.length === 1 || allHaveEndTime) {
      const selected = [...openRows].sort(
        (a, b) => (timestamp(a.exam.endTime) ?? Number.MAX_SAFE_INTEGER) - (timestamp(b.exam.endTime) ?? Number.MAX_SAFE_INTEGER),
      )[0];
      return {
        ...getExamAction(selected.exam, course.id, submissions, now),
        summary,
      };
    }

    return {
      label: "Xem bài thi",
      href: `/student/courses/${course.id}`,
      actionType: "view_exams",
      summary,
    };
  }

  if (upcomingRows.length > 0) {
    const selected = [...upcomingRows].sort(
      (a, b) => (timestamp(a.exam.startTime) ?? Number.MAX_SAFE_INTEGER) - (timestamp(b.exam.startTime) ?? Number.MAX_SAFE_INTEGER),
    )[0];
    return {
      label: "Xem lịch thi",
      href: selected ? `/student/exams/${selected.exam.id}` : `/student/courses/${course.id}`,
      actionType: "view_schedule",
      summary,
    };
  }

  if (completedCount === visibleExams.length) {
    return {
      label: "Xem kết quả",
      href: "/student/results",
      actionType: "view_results",
      summary,
    };
  }

  return {
    label: "Xem bài thi",
    href: `/student/courses/${course.id}`,
    actionType: "view_exams",
    summary,
  };
}
