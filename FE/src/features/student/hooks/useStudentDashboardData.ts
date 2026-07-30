import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { ExamHistoryItem, StudentCourse, UpcomingExam } from "../student-dashboard-types";

const completedStatuses = new Set(["SUBMITTED", "GRADED", "FLAGGED", "FINALIZED"]);
const timestamp = (submission: any) => new Date(submission?.submittedAt || submission?.startedAt || submission?.createdAt || 0).getTime();

export function useStudentDashboardData() {
  const [upcomingExams, setUpcomingExams] = useState<UpcomingExam[]>([]);
  const [examHistory, setExamHistory] = useState<ExamHistoryItem[]>([]);
  const [recentCourses, setRecentCourses] = useState<StudentCourse[]>([]);
  const [latestCompletedSubmissionByExamId, setLatestCompletedSubmissionByExamId] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [exams, submissions, courses] = await Promise.all([api.getAvailableExams(), api.getMySubmissions(), api.getMyRecentCourses()]);
        const submissionList = Array.isArray(submissions) ? submissions : [];
        const latest = new Map<string, any>(), latestCompleted = new Map<string, any>();
        submissionList.forEach((submission: any) => {
          const examId = submission?.examId;
          if (!examId) return;
          if (!latest.has(examId) || timestamp(submission) >= timestamp(latest.get(examId))) latest.set(examId, submission);
          if (completedStatuses.has(String(submission?.status || "").toUpperCase()) && (!latestCompleted.has(examId) || timestamp(submission) >= timestamp(latestCompleted.get(examId)))) latestCompleted.set(examId, submission);
        });
        setRecentCourses(Array.isArray(courses) ? courses as StudentCourse[] : []);
        setLatestCompletedSubmissionByExamId(latestCompleted);
        const now = new Date();
        setUpcomingExams((Array.isArray(exams) ? exams : []).filter((exam: any) => exam?.status === "PUBLISHED" && exam?.endTime && new Date(exam.endTime) > now).map((exam: any) => ({ ...exam, mySubmissionStatus: latest.get(exam.id)?.status ?? null, mySubmissionAttemptNo: latest.get(exam.id)?.attemptNo ?? null, maxAttempts: typeof exam?.maxAttempts === "number" ? exam.maxAttempts : typeof exam?.settings?.maxAttempts === "number" ? exam.settings.maxAttempts : null })));
        setExamHistory(submissionList.filter((submission: any) => submission.status === "GRADED" || submission.status === "SUBMITTED"));
      } catch (error) { console.error("Error fetching student dashboard data:", error); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  return { upcomingExams, examHistory, recentCourses, latestCompletedSubmissionByExamId, loading };
}
