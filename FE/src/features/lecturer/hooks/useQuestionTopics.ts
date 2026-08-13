import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { TopicOption } from "../question-editor-types";

export type TopicRelation = "DUPLICATE" | "SAME_CONCEPT" | "PARENT_OF" | "CHILD_OF" | "OVERLAP" | "RELATED" | "DISTINCT";
export type TopicSuggestion = TopicOption & { score: number; relation: TopicRelation; reason?: string; matchMethod?: "AI" | "LEXICAL" };

type Params = {
  courseId: string;
  selectedTopicId: string;
  onSelectTopic: (topicId: string) => void;
};

const normalize = (value: string) => String(value || "")
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9\s]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const relationLabel: Record<TopicRelation, string> = {
  DUPLICATE: "Trùng nội dung",
  SAME_CONCEPT: "Cùng khái niệm",
  PARENT_OF: "Topic cha",
  CHILD_OF: "Topic con",
  OVERLAP: "Có phần giao nhau",
  RELATED: "Có liên quan",
  DISTINCT: "Khác biệt",
};

export function useQuestionTopics({ courseId, selectedTopicId, onSelectTopic }: Params) {
  const [availableTopics, setAvailableTopics] = useState<TopicOption[]>([]);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [topicSearch, setTopicSearch] = useState("");
  const [topicSuggestions, setTopicSuggestions] = useState<TopicSuggestion[]>([]);
  const [checkingTopicSimilarity, setCheckingTopicSimilarity] = useState(false);
  const [topicCheckMessage, setTopicCheckMessage] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  useEffect(() => {
    const loadTopics = async () => {
      if (!courseId) {
        setAvailableTopics([]);
        return;
      }
      try {
        const response = await api.listQuestionTopics({ courseId });
        setAvailableTopics(response?.data || []);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
        setAvailableTopics([]);
      }
    };
    loadTopics();
  }, [courseId]);

  useEffect(() => {
    setTopicSuggestions([]);
    setTopicCheckMessage("");
  }, [newTopicName]);

  const closeTopicDialog = () => {
    setShowTopicDialog(false);
    setNewTopicName("");
    setTopicSearch("");
    setTopicSuggestions([]);
    setTopicCheckMessage("");
  };

  const selectTopic = (topicId: string) => {
    onSelectTopic(topicId);
    closeTopicDialog();
  };

  const createTopic = async () => {
    if (!newTopicName.trim() || !courseId) return;
    try {
      setCreatingTopic(true);
      const topic = await api.createQuestionTopic({
        name: newTopicName.trim(),
        code: newTopicName.trim().toUpperCase().replace(/\s+/g, "_"),
        courseId,
      });
      setAvailableTopics((current) => [...current, topic]);
      selectTopic(topic.id);
      toast.success("Đã tạo chủ đề mới.");
    } catch (error) {
      console.error("Failed to create topic:", error);
      toast.error("Không thể tạo chủ đề. Vui lòng thử lại.");
    } finally {
      setCreatingTopic(false);
    }
  };

  const checkSimilarTopics = async () => {
    const query = newTopicName.trim();
    if (!query) return;
    try {
      setCheckingTopicSimilarity(true);
      setTopicCheckMessage("");
      const response = await api.suggestSimilarTopics({
        courseId,
        topicName: query,
        language: "vi",
      });
      const ranked = (response?.matches || []).map((item: any): TopicSuggestion => {
        const relation = String(item.relation || "RELATED").toUpperCase() as TopicRelation;
        const matchingTopic = availableTopics.find((topic) =>
          normalize(topic.name) === normalize(item.name) || normalize(topic.code) === normalize(item.name));
        return {
          id: matchingTopic?.id || String(item.name || item.code || crypto.randomUUID()),
          code: matchingTopic?.code || String(item.code || item.name || ""),
          name: matchingTopic?.name || String(item.name || item.code || ""),
          score: Number(item.score ?? 0),
          relation,
          reason: `${relationLabel[relation] || relationLabel.RELATED}${item.reason ? ` — ${String(item.reason)}` : ""}`,
          matchMethod: item.matchMethod === "LEXICAL" ? "LEXICAL" : "AI",
        };
      }).filter((topic: TopicSuggestion) => topic.name).slice(0, 5);
      setTopicSuggestions(ranked);
      const message = ranked.length
        ? `Tìm thấy ${ranked.length} chủ đề tương tự.`
        : "Không tìm thấy chủ đề tương tự. Bạn có thể tạo chủ đề mới.";
      setTopicCheckMessage(message);
      if (ranked.length) toast.success(message);
      else toast.info(message);
    } catch (error) {
      console.error("Failed to check similar topics:", error);
      setTopicSuggestions([]);
      setTopicCheckMessage("Không thể kiểm tra bằng AI lúc này. Vui lòng thử lại.");
      toast.error("Không thể kiểm tra chủ đề tương tự.");
    } finally {
      setCheckingTopicSimilarity(false);
    }
  };

  const filteredTopics = useMemo(() => {
    const query = normalize(topicSearch);
    const seen = new Set<string>();
    return availableTopics.filter((topic) => {
      if (query && !normalize(topic.name).includes(query) && !normalize(topic.code).includes(query)) return false;
      const key = normalize(topic.name || topic.code);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [availableTopics, topicSearch]);

  return {
    availableTopics, showTopicDialog, setShowTopicDialog, newTopicName, setNewTopicName,
    topicSearch, setTopicSearch, topicSuggestions, checkingTopicSimilarity, topicCheckMessage,
    creatingTopic, filteredTopics, closeTopicDialog, selectTopic, createTopic, checkSimilarTopics,
    selectedTopicId,
  };
}
