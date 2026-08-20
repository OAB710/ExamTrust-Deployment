import { describe, expect, it } from "vitest";
import { formatManualAnswer } from "./manual-grading-formatters";

describe("formatManualAnswer", () => {
  it("renders structured matching without exposing JSON", () => {
    expect(formatManualAnswer("MATCHING", { 0: "Definition A", 1: "Definition B" }, { left: ["Term A", "Term B"], right: ["Definition B", "Definition A"] }))
      .toEqual(["Term A → Definition A", "Term B → Definition B"]);
  });

  it("supports legacy matching, ordering, and fill blank answers", () => {
    expect(formatManualAnswer("MATCHING", { 0: "2", 1: "1" }, ["A", "B", "1", "2"])).toEqual(["A → 2", "B → 1"]);
    expect(formatManualAnswer("ORDERING", ["Second", "First"])).toEqual(["1. Second", "2. First"]);
    expect(formatManualAnswer("FILL_IN_BLANK", ["primary", "foreign"])).toEqual(["Chỗ trống 1: primary", "Chỗ trống 2: foreign"]);
  });

  it("normalizes true/false answers to capitalized text regardless of storage shape", () => {
    const options = { A: "True", B: "False" };
    expect(formatManualAnswer("TRUE_FALSE", { answer: "A" }, options)).toEqual(["True"]);
    expect(formatManualAnswer("TRUE_FALSE", { answer: "B" }, options)).toEqual(["False"]);
    expect(formatManualAnswer("TRUE_FALSE", { answer: "true" })).toEqual(["True"]);
    expect(formatManualAnswer("TRUE_FALSE", { answer: false })).toEqual(["False"]);
    expect(formatManualAnswer("true_false", "true")).toEqual(["True"]);
  });

  it("renders the MATCHING correct-answer key from `pairs`, not the shuffled options list", () => {
    // This is the exact shape the question bank stores for the hidden grading
    // key: { pairs: [{left, right}] }. Before the fix, this branch always
    // zipped against `options.left` and printed "Chưa ghép" for every row
    // because the answer object has no numeric keys.
    const correctAnswer = {
      pairs: [
        { left: "1", right: "a" },
        { left: "2", right: "b" },
        { left: "3", right: "c" },
        { left: "4", right: "d" },
      ],
    };
    // options.right is shuffled at save time and must NOT be used to resolve
    // the correct answer.
    const options = { left: ["1", "2", "3", "4"], right: ["d", "b", "a", "c"] };
    expect(formatManualAnswer("MATCHING", correctAnswer, options)).toEqual([
      "1 → a",
      "2 → b",
      "3 → c",
      "4 → d",
    ]);
  });

  it("still resolves a submitted MATCHING answer index-keyed against options.left", () => {
    const options = { left: ["Term A", "Term B"], right: ["Definition B", "Definition A"] };
    const submitted = { "0": "Definition A", "1": "Definition B" };
    expect(formatManualAnswer("MATCHING", submitted, options)).toEqual([
      "Term A → Definition A",
      "Term B → Definition B",
    ]);
  });

  it("resolves FIND_ERROR correct-answer ids and submitted-answer letters to the same option text", () => {
    // Options are id-keyed, as persisted by question-editor-persistence.ts.
    // Ids are intentionally NOT already sorted/lettered to prove the fix
    // reconstructs the same Object.keys(options).sort() order exam-taking
    // uses to assign letters.
    const options = {
      "opt-c": "int c = 30;",
      "opt-a": "int a = 10;",
      "opt-b": "int b = 10",
      "opt-d": "int d = 40;",
    };
    // Sorted id order is opt-a, opt-b, opt-c, opt-d -> letters A, B, C, D.
    // correctAnswer.answers stores the raw id ("opt-b" = letter B).
    expect(formatManualAnswer("FIND_ERROR", { answers: ["opt-b"] }, options)).toEqual(["B. int b = 10"]);
    // The submitted answer stores the letter the student clicked, not the id.
    expect(formatManualAnswer("FIND_ERROR", { answers: ["B"] }, options)).toEqual(["B. int b = 10"]);
  });

  it("falls back to the raw code for FIND_ERROR when it matches neither an id nor a valid letter position", () => {
    const options = { "opt-a": "int a = 10;" };
    expect(formatManualAnswer("FIND_ERROR", { answers: ["Z"] }, options)).toEqual(["Z"]);
  });
});
