import { describe, expect, it } from "vitest";
import { getCurrentAcademicTerm } from "./course-term";

describe("getCurrentAcademicTerm", () => {
  it.each([
    [new Date(2026, 7, 3), { academicYear: "2026-2027", term: "TERM_1" }],
    [new Date(2026, 11, 31), { academicYear: "2026-2027", term: "TERM_1" }],
    [new Date(2027, 0, 1), { academicYear: "2026-2027", term: "TERM_2" }],
    [new Date(2027, 5, 1), { academicYear: "2026-2027", term: "SUMMER" }],
  ])("maps %s to the correct academic term", (date, expected) => {
    expect(getCurrentAcademicTerm(date)).toEqual(expected);
  });
});
