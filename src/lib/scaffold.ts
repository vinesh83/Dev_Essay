import type { Essay, Plan, State } from "./store";

// Training wheels. Dev starts with full help on every thinking step. Each
// essay with a complete plan (reasons on both sides, a side picked, and an
// example plus explanation under every reason) moves him toward Solo, which
// looks like the real test. A parent can pin a level on the Parents page.

export type Help = 1 | 2 | 3;

export const HELP_INFO: Record<Help, { name: string; icon: string; desc: string }> = {
  1: { name: "Training Wheels", icon: "🚲", desc: "The coach walks you through every step, with examples and sentence starters." },
  2: { name: "Coach Nearby", icon: "🧭", desc: "You plan on your own. The coach helps only when you ask." },
  3: { name: "Solo Hero", icon: "🦅", desc: "Plan fast like test day: a quick T-chart and outline, then write." },
};

const STEP_UP: Record<Help, number> = { 1: 3, 2: 6, 3: Infinity }; // complete plans needed to leave this level

export function planComplete(p?: Plan): boolean {
  if (!p) return false;
  return (
    (p.pros?.filter((x) => x.text.trim()).length ?? 0) >= 3 &&
    (p.cons?.filter((x) => x.text.trim()).length ?? 0) >= 2 &&
    p.side !== undefined &&
    p.reasons.length >= 3 &&
    p.reasons.every((r) => r.reason.trim() && r.example.trim() && (r.explain ?? "").trim())
  );
}

const counts = (e: Essay) => planComplete(e.plan) && (!e.score || e.score.total >= 50);

export function completePlans(s: State): number {
  return s.essays.filter(counts).length + (s.plansDoneComplete ?? 0);
}

export function autoHelp(s: State): Help {
  const n = completePlans(s);
  return n < STEP_UP[1] ? 1 : n < STEP_UP[2] ? 2 : 3;
}

export function helpLevel(s: State): Help {
  return s.helpOverride ? s.helpOverride : autoHelp(s);
}

/** How many more complete plans until the next level, or null at the top or when pinned. */
export function toNextLevel(s: State): number | null {
  if (s.helpOverride) return null;
  const lvl = autoHelp(s);
  return lvl === 3 ? null : STEP_UP[lvl] - completePlans(s);
}
