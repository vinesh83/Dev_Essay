import { describe, expect, it } from "vitest";
import { autoHelp, helpLevel, planComplete, toNextLevel } from "../src/lib/scaffold";
import type { Plan, State } from "../src/lib/store";

const good: Plan = {
  opinion: "I believe x",
  hook: "h",
  ending: "e",
  side: 0,
  pros: [{ text: "a" }, { text: "b" }, { text: "c" }],
  cons: [{ text: "d" }, { text: "e" }],
  reasons: [0, 1, 2].map(() => ({ reason: "r", example: "ex", explain: "this shows" })),
};
const st = (n: number, extra: Partial<State> = {}) =>
  ({ essays: Array.from({ length: n }, () => ({ plan: good, score: { total: 70 } })), ...extra }) as unknown as State;

describe("training wheels", () => {
  it("needs both sides, a side, and explained examples", () => {
    expect(planComplete(good)).toBe(true);
    expect(planComplete({ ...good, cons: [{ text: "d" }] })).toBe(false);
    expect(planComplete({ ...good, side: undefined })).toBe(false);
    expect(planComplete({ ...good, reasons: good.reasons.map((r) => ({ ...r, explain: "" })) })).toBe(false);
  });
  it("fades help after 3 and 6 complete plans", () => {
    expect(autoHelp(st(0))).toBe(1);
    expect(toNextLevel(st(1))).toBe(2);
    expect(autoHelp(st(3))).toBe(2);
    expect(autoHelp(st(6))).toBe(3);
    expect(toNextLevel(st(6))).toBe(null);
  });
  it("lets a parent pin the level", () => {
    expect(helpLevel(st(6, { helpOverride: 1 }))).toBe(1);
  });
});
