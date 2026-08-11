import { useState } from "react";
import { api } from "@/lib/api";
import type { EditableQuestion } from "../question-editor-types";

export function useQuestionPersistence() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async (questionId: string): Promise<EditableQuestion> => {
    setLoading(true);
    try { return await api.getQuestionById(questionId); }
    finally { setLoading(false); }
  };

  const save = async ({ questionId, courseId, topicId, payload }: {
    questionId?: string | null;
    courseId: string;
    topicId: string;
    payload: {
      content: string;
      media?: { mediaUrl: string; mediaType: "image" | "audio"; mediaKey: string; mediaSizeBytes: number } | null;
      [key: string]: any;
    };
  }) => {
    setSaving(true);
    try {
      if (questionId) return await api.saveQuestion({ sourceQuestionId: questionId, courseId: courseId || undefined, topicId, ...payload });
      return await api.saveQuestion({ courseId: courseId || undefined, topicId: topicId || undefined, ...payload });
    } finally { setSaving(false); }
  };

  return { loading, saving, load, save };
}
