import { describe, expect, it } from "vitest";
import { mapBackendToUiQuestion, normalizeSubmissionAnswer } from "./exam-taking-model";

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
});
