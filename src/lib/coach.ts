import { DRILLS, SKILLS, type Drill, type SkillId, type RubricArea } from "../data/drills";
import { TYPING_LEVELS, TYPING_TARGET_ACCURACY, TYPING_TARGET_WPM } from "../data/typing";
import { LESSONS } from "../data/lessons";
import { PROMPTS, type Prompt } from "../data/prompts";
import { addXp, today, update, type State } from "./store";

// The adaptive coach. It decides what Dev practices next using:
//  - spaced repetition on drills (Leitner boxes: miss = back to box 0)
//  - skills flagged in his recent essays (AI or built-in feedback)
//  - his weakest rubric area across recent essays
//  - typing speed vs. the test-day target

const INTERVALS = [0, 1, 2, 4, 7, 14];
const SKILL_IDS = Object.keys(SKILLS) as SkillId[];

export function recordDrill(id: string, correct: boolean) {
  update((s) => {
    const d = s.drills[id] ?? { box: 0, due: 0, seen: 0, correct: 0 };
    d.seen += 1;
    if (correct) {
      d.correct += 1;
      d.box = Math.min(d.box + 1, INTERVALS.length - 1);
    } else {
      d.box = 0;
    }
    d.due = today() + INTERVALS[d.box];
    s.drills[id] = d;
  });
  if (correct) addXp(5);
}

/** 0 (needs work) to 1 (mastered) for each skill. */
export function skillMastery(s: State): Record<SkillId, number> {
  const out = {} as Record<SkillId, number>;
  for (const skill of SKILL_IDS) {
    const items = DRILLS.filter((d) => d.skill === skill);
    const drillScore = items.reduce((a, d) => a + (s.drills[d.id]?.box ?? 0), 0) / (items.length * 3);
    out[skill] = Math.min(1, drillScore);
  }
  // Each time a recent essay shows the problem, knock mastery down.
  const recent = s.essays.filter((e) => e.score).slice(-4);
  recent.forEach((e, i) => {
    const weight = 0.15 + i * 0.05; // newer essays count more
    for (const sk of e.score!.skills) if (out[sk] !== undefined) out[sk] = Math.max(0, out[sk] - weight);
  });
  return out;
}

export function areaAverages(s: State): Record<RubricArea, number | null> {
  const recent = s.essays.filter((e) => e.score && e.score.source !== "auto").slice(-3);
  const pool = recent.length ? recent : s.essays.filter((e) => e.score).slice(-3);
  if (!pool.length) return { argument: null, organization: null, evidence: null, expression: null, conventions: null };
  const avg = (k: RubricArea, max: number) => pool.reduce((a, e) => a + e.score![k], 0) / pool.length / max;
  return {
    argument: avg("argument", 15),
    organization: avg("organization", 15),
    evidence: avg("evidence", 15),
    expression: avg("expression", 15),
    conventions: avg("conventions", 40),
  };
}

export function weakestSkills(s: State, n = 3): SkillId[] {
  const m = skillMastery(s);
  const areas = areaAverages(s);
  const scored = SKILL_IDS.map((sk) => {
    const area = areas[SKILLS[sk].area];
    // Low rubric area pulls its skills forward. Conventions get a small boost
    // because they are worth 40 points.
    const bias = (area === null ? 0.5 : area) * 0.4 - (SKILLS[sk].area === "conventions" ? 0.05 : 0);
    return { sk, v: m[sk] * 0.6 + bias };
  });
  return scored.sort((a, b) => a.v - b.v).slice(0, n).map((x) => x.sk);
}

export function pickDrills(s: State, n = 6, focus?: SkillId): Drill[] {
  const d0 = today();
  const weak = focus ? [focus] : weakestSkills(s, 4);
  const rank = (d: Drill) => (weak.includes(d.skill) ? weak.indexOf(d.skill) : 10);
  const pool = focus ? DRILLS.filter((d) => d.skill === focus) : DRILLS;
  const due = pool.filter((d) => s.drills[d.id] && s.drills[d.id].due <= d0).sort((a, b) => rank(a) - rank(b));
  const unseen = pool.filter((d) => !s.drills[d.id]).sort((a, b) => rank(a) - rank(b) || Math.random() - 0.5);
  const picked: Drill[] = [];
  for (const d of [...due, ...unseen]) {
    if (picked.length >= n) break;
    if (!picked.includes(d)) picked.push(d);
  }
  // Everything mastered and not due? Review the lowest boxes anyway.
  if (picked.length < n) {
    const rest = pool.filter((d) => !picked.includes(d)).sort((a, b) => (s.drills[a.id]?.box ?? 0) - (s.drills[b.id]?.box ?? 0));
    picked.push(...rest.slice(0, n - picked.length));
  }
  return picked;
}

export function typingStats(s: State) {
  const best = Object.values(s.typing.levelBest);
  const recentTest = s.typing.tests[s.typing.tests.length - 1];
  const wpm = recentTest?.wpm ?? Math.max(0, ...best.map((b) => b.wpm));
  const acc = recentTest?.acc ?? Math.max(0, ...best.map((b) => b.acc));
  return { wpm, acc, onTarget: wpm >= TYPING_TARGET_WPM && acc >= TYPING_TARGET_ACCURACY };
}

/** A level is passed at 90%+ accuracy. Levels 7+ also need 12+ WPM. */
export function levelPassed(s: State, id: number) {
  const b = s.typing.levelBest[id];
  if (!b) return false;
  return b.acc >= 90 && (id < 7 || b.wpm >= 12);
}

export function currentTypingLevel(s: State) {
  return TYPING_LEVELS.find((l) => !levelPassed(s, l.id)) ?? TYPING_LEVELS[TYPING_LEVELS.length - 1];
}

export function nextPrompt(s: State, kind?: Prompt["kind"]): Prompt {
  const used = new Set(s.essays.map((e) => e.promptId));
  const pool = PROMPTS.filter((p) => !kind || p.kind === kind);
  const fresh = pool.filter((p) => !used.has(p.id));
  const list = fresh.length ? fresh : pool;
  return list[Math.floor(Math.random() * list.length)];
}

export type MissionTask = { id: string; title: string; detail: string; route: string; minutes: number };

/** Today's tasks. Fixed for the whole day once chosen. */
export function dailyMission(s: State): MissionTask[] {
  if (s.missionPlan.day === today() && s.missionPlan.tasks.length) return s.missionPlan.tasks;
  return buildMission(s);
}

/** Lock in today's tasks (call from an effect, not during render). */
export function lockMission(s: State) {
  if (s.missionPlan.day === today() && s.missionPlan.tasks.length) return;
  const tasks = buildMission(s);
  update((st) => void (st.missionPlan = { day: today(), tasks }));
}

function buildMission(s: State): MissionTask[] {
  const tasks: MissionTask[] = [];
  const t = typingStats(s);
  const lvl = currentTypingLevel(s);
  if (!t.onTarget || !levelPassed(s, TYPING_LEVELS.length)) {
    tasks.push({ id: "typing", title: `Typing: ${lvl.name}`, detail: `Level ${lvl.id}. Goal: ${TYPING_TARGET_WPM} WPM at ${TYPING_TARGET_ACCURACY}% accuracy.`, route: "typing", minutes: 10 });
  }
  const lesson = LESSONS.find((l) => !s.lessons?.[l.id]);
  if (lesson) {
    tasks.push({ id: "lesson", title: `Lesson: ${lesson.title}`, detail: `${lesson.icon} ${lesson.tagline}`, route: `lessons/${lesson.id}`, minutes: 8 });
  }
  const weak = weakestSkills(s, 2);
  tasks.push({ id: "drills", title: "Skill Drills", detail: `Focus: ${weak.map((w) => SKILLS[w].name).join(" and ")}`, route: "drills", minutes: 5 });

  const essaysThisWeek = s.essays.filter((e) => Date.now() - new Date(e.date).getTime() < 7 * 86400000);
  const hasMockThisWeek = essaysThisWeek.some((e) => e.mode === "mock");
  const dow = new Date().getDay();
  if ((dow === 6 || dow === 0) && !hasMockThisWeek && s.essays.length >= 2) {
    tasks.push({ id: "mock", title: "Mock Test", detail: "Real test conditions: 90 minutes, no spellcheck.", route: "mock", minutes: 90 });
  } else if (s.plansDone <= s.essays.length && s.essays.length % 2 === 1) {
    tasks.push({ id: "plan", title: "Brainstorm Sprint", detail: "Plan an essay in 10 minutes: opinion, 3 reasons, examples.", route: "brainstorm", minutes: 10 });
  } else {
    tasks.push({ id: "write", title: "Write an Essay", detail: "Plan, write, and get your score.", route: "write", minutes: 35 });
  }
  return tasks;
}
