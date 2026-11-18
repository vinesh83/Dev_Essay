import { getState, giveChest, today, update, type State } from "./store";

// The daily streak, built on the habits that keep kids coming back to
// language apps: the flame lights only when today's work is done, a
// streak freeze covers a missed day, milestones pay out, a streak goal
// gives a target, a perfect week earns a big chest, and lighting the
// flame gets a big celebration. A parent can restore a streak after a
// sick day.

export const MILESTONES = [3, 7, 14, 21, 30, 50, 75, 100, 150, 200, 365];
export const MAX_FREEZES = 2;
export const FREEZE_PRICE = 40;

export type Celebrate = { count: number; milestone?: number; froze?: number; perfect?: boolean; reward?: string };

export const nextMilestone = (n: number) => MILESTONES.find((m) => m > n) ?? n + 100;
export const prevMilestone = (n: number) => [...MILESTONES].reverse().find((m) => m <= n) ?? 0;

/** Is the streak still alive today (lit today, or lit yesterday and waiting)? */
export function streakAlive(s: State): number {
  const d = today();
  const last = s.streak.lastDay;
  if (last === d || last === d - 1) return s.streak.count;
  // missed days that freezes will cover when today is finished
  const gap = d - last - 1;
  return gap <= (s.freezes ?? 0) ? s.streak.count : 0;
}

export const litToday = (s: State) => s.streak.lastDay === today();

/** The last 7 days, oldest first, for the calendar row. */
export function week(s: State): { day: number; state: "lit" | "frozen" | "missed" | "today" | "future" }[] {
  const d = today();
  const lit = new Set(s.streakDays ?? []);
  const frozen = new Set(s.frozenDays ?? []);
  // Start on Monday of this week.
  const dow = (new Date().getDay() + 6) % 7; // 0 = Monday
  return Array.from({ length: 7 }, (_, i) => {
    const day = d - dow + i;
    if (lit.has(day)) return { day, state: "lit" as const };
    if (frozen.has(day)) return { day, state: "frozen" as const };
    if (day === d) return { day, state: "today" as const };
    if (day > d) return { day, state: "future" as const };
    return { day, state: "missed" as const };
  });
}

let onCelebrate: (c: Celebrate) => void = () => {};
export const setStreakListener = (f: typeof onCelebrate) => (onCelebrate = f);

/** Today's work is done: light the flame (once a day). */
export function lightStreak() {
  const s0 = getState();
  const d = today();
  if (s0.streak.lastDay === d) return;
  let c: Celebrate = { count: 1 };
  update((s) => {
    const last = s.streak.lastDay;
    const gap = last ? d - last - 1 : 0;
    let froze = 0;
    if (last && gap > 0 && gap <= (s.freezes ?? 0)) {
      froze = gap;
      s.freezes = (s.freezes ?? 0) - gap;
      s.frozenDays = [...(s.frozenDays ?? []), ...Array.from({ length: gap }, (_, i) => last + 1 + i)].slice(-60);
    }
    const kept = last && (gap === 0 || froze === gap);
    if (!kept && s.streak.count >= 3) s.lostStreak = { count: s.streak.count, day: d };
    s.streak.count = kept ? s.streak.count + 1 : 1;
    s.streak.lastDay = d;
    s.streakBest = Math.max(s.streakBest ?? 0, s.streak.count);
    s.streakDays = [...(s.streakDays ?? []), d].slice(-60);
    c = { count: s.streak.count, froze: froze || undefined };
  });
  const s = getState();
  const n = s.streak.count;
  const rewards: string[] = [];
  if (MILESTONES.includes(n) && !(s.milestones ?? []).includes(n)) {
    update((st) => {
      st.milestones = [...(st.milestones ?? []), n];
      st.coins += n >= 30 ? 100 : n >= 7 ? 50 : 20;
      if (n % 7 === 0 && (st.freezes ?? 0) < MAX_FREEZES) st.freezes = (st.freezes ?? 0) + 1;
    });
    giveChest(n >= 14 ? "gold" : "silver", `a ${n}-day streak`);
    c.milestone = n;
    rewards.push(`+${n >= 30 ? 100 : n >= 7 ? 50 : 20} coins`, `a ${n >= 14 ? "gold" : "silver"} chest`);
    if (n % 7 === 0) rewards.push("a free streak freeze");
  }
  // Perfect week: Monday through Sunday all lit (freezes don't count).
  if (new Date().getDay() === 0) {
    const lit = new Set(getState().streakDays ?? []);
    if (Array.from({ length: 7 }, (_, i) => d - i).every((x) => lit.has(x))) {
      giveChest("gold", "a perfect week");
      c.perfect = true;
      rewards.push("a perfect-week gold chest");
    }
  }
  if (rewards.length) c.reward = rewards.join(", ");
  onCelebrate(c);
}

export function buyFreeze(): boolean {
  const s = getState();
  if ((s.freezes ?? 0) >= MAX_FREEZES || s.coins < FREEZE_PRICE) return false;
  update((st) => {
    st.coins -= FREEZE_PRICE;
    st.freezes = (st.freezes ?? 0) + 1;
  });
  return true;
}

/** Parents page: bring back a streak lost to a sick day or a trip. */
export function restoreStreak() {
  const s = getState();
  if (!s.lostStreak) return false;
  const lost = s.lostStreak.count;
  update((st) => {
    st.streak.count = lost + st.streak.count;
    st.streakBest = Math.max(st.streakBest ?? 0, st.streak.count);
    delete st.lostStreak;
  });
  return true;
}
