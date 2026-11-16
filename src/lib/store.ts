import { useSyncExternalStore } from "react";
import type { SkillId } from "../data/drills";
import type { StepId } from "../data/process";

// All progress lives in this browser (localStorage). No login needed.

export type RubricScore = {
  argument: number; // 0/5/10/15
  organization: number;
  evidence: number;
  expression: number;
  conventions: number; // 0/20/40
  total: number; // 0-100
  summary: string;
  glows: string[];
  grows: string[];
  skills: SkillId[]; // skills to practice next
  source: "ai" | "auto" | "parent";
  levelUp?: { original: string; better: string };
  note?: string;
};

export type Plan = {
  opinion: string;
  reasons: { reason: string; example: string }[];
  hook: string;
  ending: string;
};

export type Essay = {
  id: string;
  date: string; // ISO
  promptId: string;
  mode: "practice" | "mock" | "diagnostic";
  text: string;
  plan?: Plan;
  seconds: number;
  words: number;
  score?: RubricScore;
  steps?: StepId[]; // writing-process steps completed
};

export type DrillState = { box: number; due: number; seen: number; correct: number };

export type State = {
  version: 1;
  name: string;
  diagnosticDone: boolean;
  xp: number;
  streak: { count: number; lastDay: number };
  typing: {
    levelBest: Record<number, { wpm: number; acc: number }>;
    tests: { date: string; wpm: number; acc: number }[];
  };
  drills: Record<string, DrillState>;
  essays: Essay[];
  badges: string[];
  plansDone: number;
  coins: number;
  owned: string[];
  equipped: Record<string, string>; // slot -> item id
  keyStats: Record<string, { hits: number; misses: number }>;
  testDate: string; // YYYY-MM-DD
  missionDone: { day: number; ids: string[] };
  missionPlan: { day: number; tasks: { id: string; title: string; detail: string; route: string; minutes: number }[] };
  practice: Record<string, number>; // day number -> seconds of active practice
  dailyGoalMin: number;
  goalRewardDay: number; // last day the 30-minute chest was given
  chests: { id: string; tier: ChestTier; reason: string }[]; // unopened
  collection: Record<string, number>; // card id -> copies
};

export type ChestTier = "wood" | "silver" | "gold";

const KEY = "dev-writing-quest-v1";

const fresh = (): State => ({
  version: 1,
  name: "Dev",
  diagnosticDone: false,
  xp: 0,
  streak: { count: 0, lastDay: 0 },
  typing: { levelBest: {}, tests: [] },
  drills: {},
  essays: [],
  badges: [],
  plansDone: 0,
  coins: 0,
  owned: [],
  equipped: {},
  keyStats: {},
  testDate: "2027-01-30",
  missionDone: { day: 0, ids: [] },
  missionPlan: { day: 0, tasks: [] },
  practice: {},
  dailyGoalMin: 30,
  goalRewardDay: 0,
  chests: [],
  collection: {},
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    /* private mode or blocked storage: start fresh */
  }
  return fresh();
}

let state: State = typeof localStorage === "undefined" ? fresh() : load();
const listeners = new Set<() => void>();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function update(fn: (s: State) => void) {
  const next = structuredClone(state);
  fn(next);
  state = next;
  save();
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 86400000);

/** Award XP and coins, and keep the daily streak going. */
export function addXp(n: number, coins = n) {
  update((s) => {
    s.xp += n;
    s.coins += coins;
    const d = today();
    if (s.streak.lastDay !== d) {
      s.streak.count = s.streak.lastDay === d - 1 ? s.streak.count + 1 : 1;
      s.streak.lastDay = d;
    }
  });
  checkBadges();
}

/** Mark a daily task done. Finishing every task pays a 25-coin bonus. */
export function markMission(id: string): boolean {
  let bonus = false;
  update((s) => {
    const d = today();
    if (s.missionDone.day !== d) s.missionDone = { day: d, ids: [] };
    if (s.missionDone.ids.includes(id)) return;
    s.missionDone.ids.push(id);
    const plan = s.missionPlan.day === d ? s.missionPlan.tasks.map((t) => t.id) : [];
    if (plan.length && plan.every((t) => s.missionDone.ids.includes(t))) {
      s.coins += 25;
      s.xp += 25;
      bonus = true;
    }
  });
  return bonus;
}

export const missionIsDone = (s: State, id: string) => s.missionDone.day === today() && s.missionDone.ids.includes(id);

export const level = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1;
export const xpForLevel = (lv: number) => (lv - 1) * (lv - 1) * 50;

export const BADGES: Record<string, { name: string; icon: string; desc: string }> = {
  first_essay: { name: "First Draft", icon: "📝", desc: "Finished your first essay" },
  five_essays: { name: "Essay Machine", icon: "⚙️", desc: "Finished 5 essays" },
  mock: { name: "Test Ready", icon: "🎯", desc: "Finished a 90-minute mock test" },
  score80: { name: "Sharp Writer", icon: "✨", desc: "Scored 80+ on an essay" },
  score95: { name: "TAG Level", icon: "🏆", desc: "Scored 95+ on an essay" },
  wpm15: { name: "Quick Fingers", icon: "⌨️", desc: "Typed 15 words per minute" },
  wpm25: { name: "Lightning Keys", icon: "⚡", desc: "Typed 25 words per minute" },
  streak3: { name: "On a Roll", icon: "🔥", desc: "3-day streak" },
  streak7: { name: "Unstoppable", icon: "🚀", desc: "7-day streak" },
  planner: { name: "Master Planner", icon: "🗺️", desc: "Made 5 essay plans" },
  drills50: { name: "Drill Champ", icon: "🥋", desc: "Answered 50 drills correctly" },
};

export function checkBadges(): string[] {
  const s = state;
  const earned: string[] = [];
  const done = s.essays.filter((e) => e.score);
  const maxScore = Math.max(0, ...done.map((e) => e.score!.total));
  const maxWpm = Math.max(0, ...s.typing.tests.map((t) => t.wpm), ...Object.values(s.typing.levelBest).map((b) => b.wpm));
  const correct = Object.values(s.drills).reduce((a, d) => a + d.correct, 0);
  const rules: [string, boolean][] = [
    ["first_essay", s.essays.length >= 1],
    ["five_essays", s.essays.length >= 5],
    ["mock", s.essays.some((e) => e.mode === "mock")],
    ["score80", maxScore >= 80],
    ["score95", maxScore >= 95],
    ["wpm15", maxWpm >= 15],
    ["wpm25", maxWpm >= 25],
    ["streak3", s.streak.count >= 3],
    ["streak7", s.streak.count >= 7],
    ["planner", s.plansDone >= 5],
    ["drills50", correct >= 50],
  ];
  for (const [id, ok] of rules) if (ok && !s.badges.includes(id)) earned.push(id);
  if (earned.length) {
    state = { ...state, badges: [...state.badges, ...earned] };
    save();
  }
  return earned;
}

export function exportData(): string {
  return JSON.stringify(state, null, 2);
}

export function importData(json: string) {
  const parsed = JSON.parse(json);
  if (parsed?.version !== 1) throw new Error("Not a Writing Quest backup");
  state = { ...fresh(), ...parsed };
  save();
}

export function resetAll() {
  state = fresh();
  save();
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function giveChest(tier: ChestTier, reason: string) {
  update((s) => void s.chests.push({ id: uid(), tier, reason }));
}

export const practiceToday = (s: State) => s.practice[String(today())] ?? 0;
