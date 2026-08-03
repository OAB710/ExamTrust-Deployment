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
});
