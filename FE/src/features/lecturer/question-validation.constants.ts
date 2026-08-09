// ─── Content length limits shared across the question editor ─────
// Frontend and backend MUST stay in sync (BE: question-validation.ts)

export const QUESTION_LIMITS = {
  /** Nội dung câu hỏi */
  content: 2000,
  /** Mỗi đáp án / option */
  option: 1000,
  /** Giải thích */
  explanation: 4000,
  /** Nội dung theo dòng (Find Error / Ordering) */
  lineContent: {
    /** Số dòng không rỗng tối thiểu */
    minLines: 2,
    /** Số dòng không rỗng tối đa */
    maxLines: 50,
    /** Số ký tự tối đa trên mỗi dòng */
    maxCharsPerLine: 500,
    /** Tổng số ký tự tối đa */
    maxTotalLength: 10000,
  },
} as const;

/** Ngưỡng % để chuyển counter sang trạng thái cảnh báo */
export const WARNING_THRESHOLD = 0.8;
