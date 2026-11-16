import { beforeEach, describe, expect, it } from "vitest";
import { pickDrills, recordDrill, weakestSkills } from "../src/lib/coach";
import { getState, resetAll, update } from "../src/lib/store";
import { DRILLS } from "../src/data/drills";

beforeEach(() => resetAll());

describe("coach", () => {
  it("brings missed drills back first", () => {
    const d = DRILLS[0];
    recordDrill(d.id, false);
    expect(pickDrills(getState(), 6)[0].id).toBe(d.id);
  });

  it("pushes correct drills into later review", () => {
    const d = DRILLS[0];
    recordDrill(d.id, true);
    recordDrill(d.id, true);
    expect(getState().drills[d.id].box).toBe(2);
    expect(pickDrills(getState(), 6).map((x) => x.id)).not.toContain(d.id);
  });

  it("targets skills flagged in recent essays", () => {
    update((s) => {
      s.essays.push({
        id: "x", date: new Date().toISOString(), promptId: "recess", mode: "practice", text: "", seconds: 0, words: 0,
        score: { argument: 15, organization: 15, evidence: 15, expression: 15, conventions: 20, total: 80, summary: "", glows: [], grows: [], skills: ["apostrophes"], source: "ai" },
      });
    });
    expect(weakestSkills(getState(), 3)).toContain("apostrophes");
  });
});
