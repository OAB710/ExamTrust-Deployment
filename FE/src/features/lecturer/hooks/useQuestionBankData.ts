import { useCallback, useEffect, useRef, useState } from "react";
import api, { unwrapPaginatedData } from "@/lib/api";
import type { Question } from "../question-bank-utils";

export type QuestionBankCourse = { id: string; code: string; name: string; faculty?: string };

export function useQuestionBankData() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<QuestionBankCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const activeRef = useRef(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesData, firstPage] = await Promise.all([api.getCourses(), api.listQuestions({ page: 1, limit: 100 })]);
      const firstQuestions = unwrapPaginatedData<Question>(firstPage);
      const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages ?? 1));
      const remaining = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => api.listQuestions({ page: index + 2, limit: 100 })));
      if (!activeRef.current) return;
      setQuestions([...firstQuestions, ...remaining.flatMap((page) => unwrapPaginatedData<Question>(page))]);
      setCourses(unwrapPaginatedData<QuestionBankCourse>(coursesData));
    } catch (error) {
      console.error("Failed to fetch question-bank data:", error);
    } finally {
      if (activeRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    void load();
    return () => { activeRef.current = false; };
  }, [load]);

  return { questions, setQuestions, courses, setCourses, loading, refetch: load };
}
