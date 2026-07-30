import { useEffect } from "react";
import type { ReadonlyURLSearchParams } from "next/navigation";
import api from "@/lib/api";
import type { Question } from "../question-bank-utils";
import type { QuestionBankCourse } from "./useQuestionBankData";

type Params = {
  courses: QuestionBankCourse[]; questions: Question[]; searchParams: ReadonlyURLSearchParams;
  selectedCourse: string | null; setSelectedCourse: (value: string | null) => void;
  setPreviewQuestion: (value: Question | null) => void; setDetailQuestion: (value: Question | null) => void;
  setDetailLoading: (value: boolean) => void; setDetailError: (value: boolean) => void;
};

export function useQuestionBankRouteState(params: Params) {
  const { courses, questions, searchParams, selectedCourse, setSelectedCourse, setPreviewQuestion, setDetailQuestion, setDetailLoading, setDetailError } = params;
  useEffect(() => {
    const courseCode = searchParams.get("courseCode");
    const courseId = searchParams.get("courseId");
    const course = courses.find((item) => item.code === courseCode || item.id === courseId);
    if (course && selectedCourse !== course.code) setSelectedCourse(course.code);
  }, [courses, searchParams, selectedCourse, setSelectedCourse]);

  useEffect(() => {
    const questionId = searchParams.get("questionId");
    if (!questionId) return;
    let cancelled = false;
    const openQuestion = async () => {
      setDetailLoading(true); setDetailError(false);
      try {
        const detail = await api.getQuestionById(questionId) as Question;
        if (cancelled) return;
        if (detail.course?.code && selectedCourse !== detail.course.code) setSelectedCourse(detail.course.code);
        setPreviewQuestion(detail); setDetailQuestion(detail);
      } catch {
        if (cancelled) return;
        setPreviewQuestion(questions.find((question) => question.id === questionId) || null);
        setDetailQuestion(null); setDetailError(true);
      } finally { if (!cancelled) setDetailLoading(false); }
    };
    void openQuestion();
    return () => { cancelled = true; };
  }, [
    questions, searchParams, selectedCourse, setDetailError, setDetailLoading,
    setDetailQuestion, setPreviewQuestion, setSelectedCourse,
  ]);
}
