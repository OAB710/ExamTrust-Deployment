// ─── Question types ───────────────────────────────────────────────
export type QType =
  | "single-choice"
  | "multi-choice"
  | "true-false"
  | "fill-blank"
  | "matching"
  | "find-error"
  | "ordering"
  | "short-answer";

export interface BaseQ {
  id: number;
  type: QType;
  title: string;
  points: number;
  audioUrl?: string;
}

export interface SingleChoiceQ extends BaseQ {
  type: "single-choice";
  content: string;
  options: string[];
}
export interface MultiChoiceQ extends BaseQ {
  type: "multi-choice";
  content: string;
  options: string[];
}
export interface TrueFalseQ extends BaseQ {
  type: "true-false";
  content: string;
}
export interface FillBlankQ extends BaseQ {
  type: "fill-blank";
  template: string;
  blanks: number;
}
export interface MatchingQ extends BaseQ {
  type: "matching";
  content: string;
  left: string[];
  right: string[];
}
export interface FindErrorQ extends BaseQ {
  type: "find-error";
  content: string;
  segments: { label: string; code: string }[];
}
export interface OrderingQ extends BaseQ {
  type: "ordering";
  content: string;
  items: string[];
}
export interface ShortAnswerQ extends BaseQ {
  type: "short-answer";
  content: string;
  maxWords?: number;
}

export type Question =
  | SingleChoiceQ
  | MultiChoiceQ
  | TrueFalseQ
  | FillBlankQ
  | MatchingQ
  | FindErrorQ
  | OrderingQ
  | ShortAnswerQ;

// ─── Mock questions (10 questions, 8 different types) ─────────────
export const rawQuestions: Question[] = [
  {
    id: 1,
    type: "single-choice",
    title: "Algorithm Complexity",
    points: 2,
    content: "What is the worst-case time complexity of Merge Sort?",
    options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
  },
  {
    id: 2,
    type: "multi-choice",
    title: "Data Structures",
    points: 3,
    content:
      "Which of the following are valid implementations of a priority queue? (Select ALL that apply)",
    options: [
      "Binary Heap",
      "Sorted Array",
      "Unsorted Linked List",
      "Fibonacci Heap",
      "Hash Table",
    ],
  },
  {
    id: 3,
    type: "true-false",
    title: "Graph Theory",
    points: 1,
    content:
      "Dijkstra's algorithm can correctly compute shortest paths in a graph that contains negative-weight edges.",
  },
  {
    id: 4,
    type: "fill-blank",
    title: "Database Concepts",
    points: 2,
    template:
      "A {{1}} key uniquely identifies each record in a table. A {{2}} key in one table references the {{3}} key of another table, establishing a relationship between the two tables.",
    blanks: 3,
  },
  {
    id: 5,
    type: "matching",
    title: "Concept Matching — Sorting Algorithms",
    points: 4,
    content:
      "Match each sorting algorithm (left column) to its average-case time complexity (right column).",
    left: ["Bubble Sort", "Quick Sort", "Heap Sort", "Counting Sort"],
    right: ["O(n log n)", "O(n²)", "O(n + k)", "O(n log n)"],
  },
  {
    id: 6,
    type: "find-error",
    title: "Find the Error — Python Code",
    points: 3,
    content:
      "The following Python function is supposed to return the factorial of n. Click the segment that contains a logical or syntax error:",
    segments: [
      { label: "A", code: "def factorial(n):" },
      { label: "B", code: "    if n == 0:" },
      { label: "C", code: "        return 0   # base case" },
      { label: "D", code: "    return n * factorial(n - 1)" },
    ],
  },
  {
    id: 7,
    type: "ordering",
    title: "Correct Order — TCP Handshake",
    points: 3,
    content:
      "Arrange the following steps of the TCP three-way handshake in their correct sequential order:",
    items: [
      "Client sends ACK to server",
      "Server sends SYN-ACK to client",
      "Client sends SYN to server",
      "Connection established",
    ],
  },
  {
    id: 8,
    type: "short-answer",
    title: "Short Answer — CAP Theorem",
    points: 5,
    content:
      "Explain the CAP theorem and describe a real-world distributed system that demonstrates the trade-off between consistency and availability. Provide specific examples.",
    maxWords: 200,
  },
  {
    id: 9,
    type: "single-choice",
    title: "Operating Systems",
    points: 2,
    content: "Which page replacement algorithm suffers from Bélády's anomaly?",
    options: [
      "LRU (Least Recently Used)",
      "FIFO (First In First Out)",
      "Optimal Page Replacement",
      "Clock Algorithm",
    ],
  },
  {
    id: 10,
    type: "fill-blank",
    title: "SQL Syntax",
    points: 2,
    template:
      "To retrieve unique values from a column, you use the {{1}} keyword. To filter grouped results you use the {{2}} clause instead of {{3}}.",
    blanks: 3,
  },
];

export function parseOptions(options: any): string[] {
  if (Array.isArray(options)) {
    return options
      .map((v) => (typeof v === "string" ? v : String(v?.text ?? v)))
      .filter(Boolean);
  }
  if (options && typeof options === "object") {
    return Object.keys(options)
      .sort()
      .map((k) => String(options[k]))
      .filter(Boolean);
  }
  return ["Option A", "Option B", "Option C", "Option D"];
}

export function resolveQuestionTitle(q: any, index: number): string {
  const candidates = [
    q?.title,
    q?.name,
    q?.stem,
    q?.content,
    q?.questionText,
    q?.prompt,
  ];

  for (const candidate of candidates) {
    const value = String(candidate ?? "").trim();
    if (value && !/^Question\s+\d+$/i.test(value)) {
      return value;
    }
  }

  return `Question ${index + 1}`;
}

export function mapBackendToUiQuestion(q: any, index: number): Question {
  const type = String(q?.type || "").toUpperCase();
  const base = {
    id: index + 1,
    title: resolveQuestionTitle(q, index),
    points: Number(q?.points ?? 1),
    content: String(q?.content || ""),
  };

  if (type === "TRUE_FALSE") {
    return { ...base, type: "true-false" } as TrueFalseQ;
  }
  if (type === "MULTI_SELECT") {
    return {
      ...base,
      type: "multi-choice",
      options: parseOptions(q?.options),
    } as MultiChoiceQ;
  }
  if (type === "MULTIPLE_CHOICE") {
    return {
      ...base,
      type: "single-choice",
      options: parseOptions(q?.options),
    } as SingleChoiceQ;
  }
  if (type === "FIND_ERROR") {
    const codeLines = parseOptions(q?.options);
    return {
      ...base,
      type: "find-error",
      content: String(q?.content || "Tìm dòng chứa lỗi:"),
      segments: codeLines.map((code, idx) => ({
        label: String.fromCharCode(65 + idx),
        code,
      })),
    } as FindErrorQ;
  }
  if (type === "FILL_IN_BLANK") {
    const text = String(q?.content || "Điền vào chỗ trống");
    return {
      ...base,
      type: "fill-blank",
      template: text.includes("{{1}}") ? text : `${text} {{1}}`,
      blanks: 1,
    } as FillBlankQ;
  }
  if (type === "ORDERING") {
    return {
      ...base,
      type: "ordering",
      content: String(q?.content || "Sắp xếp theo đúng thứ tự"),
      items: parseOptions(q?.options),
    } as OrderingQ;
  }
  if (type === "MATCHING") {
    const rawOptions = q?.options;
    // Preferred shape (questions created/re-saved after this fix): options
    // is `{ left: string[], right: string[] }`, both student-facing and
    // answer-safe (the left→right key lives only in the hidden correctAnswer).
    const hasStructuredShape =
      rawOptions && typeof rawOptions === "object" && !Array.isArray(rawOptions) &&
      Array.isArray(rawOptions.left) && Array.isArray(rawOptions.right);
    const left = hasStructuredShape
      ? rawOptions.left.map((item: unknown) => String(item ?? "")).filter(Boolean)
      : [];
    const right = hasStructuredShape
      ? rawOptions.right.map((item: unknown) => String(item ?? "")).filter(Boolean)
      : [];

    if (left.length > 0 && right.length > 0) {
      return {
        ...base,
        type: "matching",
        content: String(q?.content || "Ghép các mục sau"),
        left,
        right,
      } as MatchingQ;
    }

    // Legacy fallback for questions saved before this fix, which crammed a
    // flat option list into `options` and split it down the middle.
    const flatOptions = parseOptions(rawOptions);
    const half = Math.max(1, Math.floor(flatOptions.length / 2));
    return {
      ...base,
      type: "matching",
      content: String(q?.content || "Ghép các mục sau"),
      left: flatOptions.slice(0, half),
      right: flatOptions.slice(half),
    } as MatchingQ;
  }

  return {
    ...base,
    type: "short-answer",
    content: String(q?.content || ""),
    maxWords: 200,
  } as ShortAnswerQ;
}

export function normalizeSubmissionAnswer(
  question: Question | undefined,
  answer: unknown,
): unknown {
  if (!question) return answer;

  if (question.type === "single-choice" && typeof answer === "number") {
    return { answer: String.fromCharCode(65 + answer) };
  }

  if (question.type === "multi-choice" && Array.isArray(answer)) {
    const labels = answer
      .map((idx) => Number(idx))
      .filter((idx) => !Number.isNaN(idx))
      .sort((a, b) => a - b)
      .map((idx) => String.fromCharCode(65 + idx));
    return { answer: labels.join(",") };
  }

  if (question.type === "true-false" && typeof answer === "boolean") {
    return { answer };
  }

  if (question.type === "find-error" && typeof answer === "string") {
    return { answer };
  }

  return answer;
}

export function shuffleArray<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

// ─── Answer helpers ───────────────────────────────────────────────
export type AnswerMap = Record<number, unknown>;

export function isAnswered(q: Question, answers: AnswerMap): boolean {
  const a = answers[q.id];
  if (q.type === "ordering") return true; // any arrangement counts
  if (a === undefined || a === null) return false;
  if (q.type === "multi-choice")
    return Array.isArray(a) && (a as number[]).length > 0;
  if (q.type === "fill-blank")
    return Array.isArray(a) && (a as string[]).some((v) => v.trim() !== "");
  if (q.type === "matching")
    return (
      typeof a === "object" && Object.values(a as object).some((v) => v !== "")
    );
  if (q.type === "short-answer")
    return typeof a === "string" && (a as string).trim().length > 0;
  return true;
}

export const EXAM_DURATION = 90 * 60;
export const MAX_VIOLATIONS = 3;
export const MOUSE_IDLE_THRESHOLD_MS = 45000;

export const typeBadgeColor: Record<QType, string> = {
  "single-choice": "bg-blue-100 text-blue-700",
  "multi-choice": "bg-violet-100 text-violet-700",
  "true-false": "bg-teal-100 text-teal-700",
  "fill-blank": "bg-orange-100 text-orange-700",
  matching: "bg-pink-100 text-pink-700",
  "find-error": "bg-red-100 text-red-700",
  ordering: "bg-amber-100 text-amber-700",
  "short-answer": "bg-green-100 text-green-700",
};

export const typeLabel: Record<QType, string> = {
  "single-choice": "Một đáp án",
  "multi-choice": "Nhiều đáp án",
  "true-false": "Đúng / Sai",
  "fill-blank": "Điền vào chỗ trống",
  matching: "Ghép cặp",
  "find-error": "Tìm lỗi",
  ordering: "Sắp xếp",
  "short-answer": "Trả lời ngắn",
};

