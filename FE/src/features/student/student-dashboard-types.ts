import type { CourseExamForAction } from "@/lib/course-exam-action";
import type { CourseTerm } from "@/lib/course-term";

export interface UpcomingExam {
  id: string;
  title: string;
  course: { code: string; name: string };
  duration: number;
  startTime: string;
  endTime: string;
  status: string;
  mySubmissionStatus?: string | null;
  mySubmissionAttemptNo?: number | null;
  maxAttempts?: number | null;
  settings?: { maxAttempts?: number | null };
}

export interface ExamHistoryItem {
  id: string;
  examId: string;
  exam: { title: string; course: { code: string }; totalPoints: number; passingScore?: number | null };
  score: number | null;
  status: string;
  submittedAt: string | null;
  attemptNo?: number | null;
}

export type StudentCourse = {
  id: string; code?: string; name?: string; description?: string; academicYear?: string;
  term?: CourseTerm; credits?: number; lastAccessed?: string; exams?: CourseExamForAction[];
  lecturer?: { id?: string; fullName?: string; email?: string };
};

export const safeLabel = (value?: string | null) => value || "Chưa cập nhật";

export const formatLatestActivityVi = (value?: string | null) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour12: false,
  }).format(date);
};
