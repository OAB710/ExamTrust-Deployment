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
    draft: "Not published",
    unscheduled: "Not scheduled",
    upcoming: "Upcoming",
    open: "Open",
    in_progress: "In progress",
    submitted: "Completed",
    graded: "Results available",
    grading: "Grading in progress",
    expired: "Expired",
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
      label: "Continue exam",
      href: `/student/exam-ready?examId=${exam.id}`,
      actionType: "continue_attempt",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "open") {
    return {
      label: "Take exam",
      href: `/student/exam-ready?examId=${exam.id}`,
      actionType: "start_exam",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "upcoming") {
    return {
      label: "View schedule",
      href: detailHref,
      actionType: "view_schedule",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "graded") {
    return {
      label: "View results",
      href: resultHref,
      actionType: "view_results",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "submitted") {
    return {
      label: "View submission",
      href: resultHref,
      actionType: "view_submitted",
      summary: getExamStateLabel(state),
    };
  }

  if (state === "grading") {
    return {
      label: "Grading in progress",
      href: resultHref,
      actionType: "grading",
      summary: getExamStateLabel(state),
      disabled: true,
    };
  }

  if (state === "expired") {
    return {
      label: "Expired",
      href: detailHref,
      actionType: "expired",
      summary: getExamStateLabel(state),
      disabled: true,
    };
  }

  return {
    label: "View details",
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
      label: "View course",
      href: `/student/courses/${course.id}`,
      actionType: "view_course",
      summary: "No exams yet",
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
    summaryParts.push("All exams completed");
  } else if (completedCount > 0) {
    summaryParts.push(`${completedCount}/${visibleExams.length} exams completed`);
  }
  if (openRows.length > 0) summaryParts.push(`${openRows.length} open exams`);
  if (upcomingRows.length > 0) summaryParts.push(`${upcomingRows.length} upcoming exams`);
  if (summaryParts.length === 0 && unscheduledRows.length > 0) summaryParts.push("Exams have not been scheduled");
  if (summaryParts.length === 0) summaryParts.push("View exam list");

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
      label: "View exams",
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
      label: "View schedule",
      href: selected ? `/student/exams/${selected.exam.id}` : `/student/courses/${course.id}`,
      actionType: "view_schedule",
      summary,
    };
  }

  if (completedCount === visibleExams.length) {
    return {
      label: "View results",
      href: "/student/results",
      actionType: "view_results",
      summary,
    };
  }

  return {
    label: "View exams",
    href: `/student/courses/${course.id}`,
    actionType: "view_exams",
    summary,
  };
}
