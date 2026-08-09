import { describe, expect, it } from "vitest";
import { mapBackendToUiQuestion, normalizeSubmissionAnswer, isAnswered } from "./exam-taking-model";
import type { FillBlankQ } from "./exam-taking-model";

describe("exam-taking question contract", () => {
  it("maps every supported backend question type to a take-exam control", () => {
    const cases = [
      ["MULTIPLE_CHOICE", "single-choice"], ["MULTI_SELECT", "multi-choice"], ["TRUE_FALSE", "true-false"],
      ["SHORT_ANSWER", "short-answer"], ["ESSAY", "short-answer"], ["FILL_IN_BLANK", "fill-blank"],
      ["MATCHING", "matching"], ["ORDERING", "ordering"], ["FIND_ERROR", "find-error"],
    ];
    for (const [backendType, uiType] of cases) {
      const question = mapBackendToUiQuestion({ type: backendType, content: "Question", options: { left: ["A"], right: ["1"] } }, 0);
      expect(question.type).toBe(uiType);
    }
  });

  it("keeps matching and ordering payloads intact and normalizes selectable answers", () => {
    const matching = mapBackendToUiQuestion({ type: "MATCHING", content: "Match", options: { left: ["A"], right: ["1"] } }, 0);
    const ordering = mapBackendToUiQuestion({ type: "ORDERING", content: "Order", options: ["First", "Second"] }, 1);
    expect(normalizeSubmissionAnswer(matching, { 0: "1" })).toEqual({ 0: "1" });
    expect(normalizeSubmissionAnswer(ordering, ["Second", "First"])).toEqual(["Second", "First"]);
    const findError = mapBackendToUiQuestion({ type: "FIND_ERROR", content: "Find", options: { A: "line 1", B: "line 2" } }, 2);
    expect(normalizeSubmissionAnswer(findError, ["B", "A"])).toEqual({ answers: ["B", "A"] });
  });

  describe("fill-blank [[answer]] parser", () => {
    it("parses a single blank", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]] DEF",
      }, 0) as FillBlankQ;
      expect(q.type).toBe("fill-blank");
      expect(q.blanks).toBe(1);
      expect(q.template).toBe("ABC {{1}} DEF");
      expect(q.template).not.toContain("[[");
      expect(q.template).not.toContain("]]");
    });

    it("parses two blanks", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]] DEF [[two]] GHI",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(2);
      expect(q.template).toBe("ABC {{1}} DEF {{2}} GHI");
    });

    it("parses blank at start", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "[[one]] ABC",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(1);
      expect(q.template).toBe("{{1}} ABC");
    });

    it("parses blank at end", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]]",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(1);
      expect(q.template).toBe("ABC {{1}}");
    });

    it("parses Vietnamese unicode answers", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[một đáp án tiếng Việt]] XYZ",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(1);
      expect(q.template).toBe("ABC {{1}} XYZ");
    });

    it("parses two consecutive blanks", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]][[two]] DEF",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(2);
      expect(q.template).toBe("ABC {{1}}{{2}} DEF");
    });

    it("parses real-world logistic question", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "Trong quy trình logistic cảng biển đơn giản, sau khi hàng hóa được [[dỡ xuống bến]] từ tàu, nó được [[kiểm tra số lượng và chất lượng]] trước khi lưu kho.",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(2);
      expect(q.template).toBe(
        "Trong quy trình logistic cảng biển đơn giản, sau khi hàng hóa được {{1}} từ tàu, nó được {{2}} trước khi lưu kho."
      );
      expect(q.template).not.toContain("[[");
      expect(q.template).not.toContain("]]");
    });

    it("falls back to {{n}} format when no [[...]] found", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "Khóa {{1}} và khóa {{2}}",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(2);
      expect(q.template).toBe("Khóa {{1}} và khóa {{2}}");
    });

    it("appends {{1}} for legacy content with no placeholders", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "Điền vào chỗ trống",
      }, 0) as FillBlankQ;
      expect(q.blanks).toBe(1);
      expect(q.template).toBe("Điền vào chỗ trống {{1}}");
    });
  });

  describe("fill-blank answer state", () => {
    it("marks fill-blank as answered when at least one blank has text", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]] DEF [[two]] GHI",
      }, 0) as FillBlankQ;
      expect(isAnswered(q, { [q.id]: ["hello", ""] })).toBe(true);
    });

    it("marks fill-blank as unanswered when all blanks are empty", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]] DEF",
      }, 0) as FillBlankQ;
      expect(isAnswered(q, { [q.id]: [""] })).toBe(false);
      expect(isAnswered(q, { [q.id]: ["", ""] })).toBe(false);
    });

    it("preserves answer array order for submission", () => {
      const q = mapBackendToUiQuestion({
        type: "FILL_IN_BLANK",
        content: "ABC [[one]] DEF [[two]] GHI",
      }, 0) as FillBlankQ;
      const answer = ["dỡ xuống bến", "kiểm tra số lượng và chất lượng"];
      expect(normalizeSubmissionAnswer(q, answer)).toEqual(answer);
    });
  });
});
