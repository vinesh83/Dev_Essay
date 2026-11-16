import { describe, expect, it } from "vitest";
import { analyze, estimateScore } from "../src/lib/analyze";

const strong = `Imagine sitting still for six hours straight. Your legs bounce and your mind wanders. I believe recess should be longer because it helps kids focus, stay healthy, and make friends.

First, recess helps students focus. For example, after recess my class finishes math faster because our brains had a break. This shows that a short rest makes learning easier.

Another reason is that recess keeps kids healthy. Doctors say kids need an hour of activity every day. When I run around at recess, I feel stronger and happier.

Finally, recess helps kids make friends. Last year I met my best friend Sam while we played tag. Without recess, we might never have talked.

In conclusion, longer recess would help students focus, stay healthy, and build friendships. Let's give kids the break they need to do their best.`;

const weak = `i think recess is good and fun and we play and then we eat and then we go back and its fun i dont want it to end because its really good and fun and nice`;

describe("analyze", () => {
  it("finds structure in a strong essay", () => {
    const a = analyze(strong);
    expect(a.hasOpinion).toBe(true);
    expect(a.hasConclusion).toBe(true);
    expect(a.paragraphs).toBe(5);
    expect(a.transitions).toEqual(expect.arrayContaining(["first", "for example", "finally", "in conclusion"]));
  });

  it("flags convention problems in a weak essay", () => {
    const skills = analyze(weak).issues.map((i) => i.skill);
    expect(skills).toEqual(expect.arrayContaining(["capitals", "apostrophes", "runons", "endmarks"]));
  });
});

describe("estimateScore", () => {
  it("rates a strong essay high and a weak one low", () => {
    const hi = estimateScore(strong);
    const lo = estimateScore(weak);
    expect(hi.total).toBeGreaterThanOrEqual(85);
    expect(lo.total).toBeLessThan(50);
    expect(lo.skills.length).toBeGreaterThan(0);
  });

  it("only uses rubric point values", () => {
    for (const t of [strong, weak, "too short"]) {
      const s = estimateScore(t);
      for (const k of ["argument", "organization", "evidence", "expression"] as const) expect([0, 5, 10, 15]).toContain(s[k]);
      expect([0, 20, 40]).toContain(s.conventions);
    }
  });
});
