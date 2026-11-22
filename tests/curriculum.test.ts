import { describe, expect, it } from "vitest";
import { CORE_DAYS, UNITS, sessionFor } from "../src/data/curriculum";
import { LESSONS } from "../src/data/lessons";

describe("Quest Curriculum", () => {
  it("runs each unit for three days, in order", () => {
    expect(sessionFor(1)).toMatchObject({ unit: 0, part: 1 });
    expect(sessionFor(3)).toMatchObject({ unit: 0, part: 3 });
    expect(sessionFor(4)).toMatchObject({ unit: 1, part: 1 });
    expect(sessionFor(CORE_DAYS)).toMatchObject({ unit: UNITS.length - 1, part: 3 });
  });
  it("repeats as Champion Rounds after the core days", () => {
    expect(sessionFor(CORE_DAYS + 1)).toMatchObject({ unit: 0, part: 1, day: CORE_DAYS + 1 });
  });
  it("points every unit at a real lesson", () => {
    for (const u of UNITS) expect(LESSONS.some((l) => l.id === u.lessonId)).toBe(true);
  });
});
