import { addXp, getState, giveChest, today, update, type State } from "./store";

// The Daily Plan: a fixed order of timed blocks. Each work block stays
// locked until the one before it is done, and fun screens (shop, garage,
// cards, crafting) open only at Free Explore time. A parent can change
// block lengths, turn the plan off, or unlock a day on the Parents page.

export type BlockId = "warmup" | "typing" | "break" | "writing" | "mock" | "review" | "explore";

export type Block = {
  id: BlockId;
  icon: string;
  title: string;
  detail: string;
  minutes: number;
  route: string; // where "Go" takes him
  routes: string[]; // screens where time counts toward this block
};

export type Lengths = Partial<Record<BlockId, number>>;
export type PlanSettings = { on: boolean; weekday: Lengths; weekend: Lengths };
export type PlanDay = { day: number; secs: Partial<Record<BlockId, number>>; done: BlockId[]; breakEnd?: number; unlocked?: boolean; bonus?: boolean };

export const DEFAULT_PLAN: PlanSettings = {
  on: true,
  weekday: { warmup: 5, typing: 10, break: 5, writing: 20, explore: 10 },
  weekend: { warmup: 10, break: 5, mock: 90, review: 15, explore: 10 },
};

/** Screens that are pure fun. They open at Free Explore time. */
export const FUN_ROUTES = new Set(["shop", "garage", "cards", "workshop"]);
const WRITING_ROUTES = ["lessons", "write", "brainstorm", "drills", "mock"];

export const isWeekend = (d = new Date()) => d.getDay() === 0 || d.getDay() === 6;
export const settings = (s: State): PlanSettings => ({ ...DEFAULT_PLAN, ...s.plan, weekday: { ...DEFAULT_PLAN.weekday, ...s.plan?.weekday }, weekend: { ...DEFAULT_PLAN.weekend, ...s.plan?.weekend } });

export function blocksFor(s: State, weekend = isWeekend()): Block[] {
  const len = weekend ? settings(s).weekend : settings(s).weekday;
  const m = (id: BlockId) => len[id] ?? 0;
  const timedDay = today() % 2 === 0;
  const list: Block[] = weekend
    ? [
        { id: "warmup", icon: "🔥", title: "Typing warm-up", detail: "Home-row check, then Letter Lab and capitals.", minutes: m("warmup"), route: "typing", routes: ["typing"] },
        { id: "break", icon: "🌿", title: "Break", detail: "Stretch, get water, rest your eyes.", minutes: m("break"), route: "home", routes: [] },
        { id: "mock", icon: "🎯", title: "Full mock test", detail: "One essay, test rules, just like test day.", minutes: m("mock"), route: "mock", routes: ["mock"] },
        { id: "review", icon: "🔍", title: "Score review and fix-up", detail: "Read your score, then rewrite one paragraph to fix one thing.", minutes: m("review"), route: "write", routes: WRITING_ROUTES },
        { id: "explore", icon: "🎮", title: "Free explore + weekend chest", detail: "Garage, shop, cards, crafting: your choice!", minutes: m("explore"), route: "garage", routes: [] },
      ]
    : [
        { id: "warmup", icon: "🔥", title: "Warm-up", detail: "Home-row check and finger drills.", minutes: m("warmup"), route: "typing", routes: ["typing"] },
        { id: "typing", icon: "⌨️", title: "Typing", detail: "Letter Lab on your weakest letters, plus capitals.", minutes: m("typing"), route: "typing", routes: ["typing"] },
        { id: "break", icon: "🌿", title: "Break", detail: "Stretch, get water, rest your eyes.", minutes: m("break"), route: "home", routes: [] },
        timedDay
          ? { id: "writing", icon: "✍️", title: "Writing: full essay", detail: "Plan and write a whole essay. Try to beat each step's test-day time.", minutes: m("writing"), route: "write", routes: WRITING_ROUTES }
          : { id: "writing", icon: "✍️", title: "Writing: lesson + paragraph", detail: "One Writing School lesson, then plan or write a paragraph.", minutes: m("writing"), route: "lessons", routes: WRITING_ROUTES },
        { id: "explore", icon: "🎮", title: "Free explore", detail: "Garage, shop, cards, crafting: your choice!", minutes: m("explore"), route: "garage", routes: [] },
      ];
  return list.filter((b) => b.minutes > 0);
}

/** Minutes of focused work (not the break or free time). */
export const workMinutes = (s: State, weekend = isWeekend()) => blocksFor(s, weekend).filter((b) => b.id !== "break" && b.id !== "explore").reduce((a, b) => a + b.minutes, 0);
export const planMinutes = (s: State, weekend = isWeekend()) => blocksFor(s, weekend).filter((b) => b.id !== "break").reduce((a, b) => a + b.minutes, 0);

export const dayState = (s: State): PlanDay => (s.planDay?.day === today() ? s.planDay : { day: today(), secs: {}, done: [] });

/** The block Dev is on now, or null when the plan is finished or off. */
export function currentBlock(s: State): Block | null {
  if (!settings(s).on || !s.diagnosticDone) return null;
  const d = dayState(s);
  if (d.unlocked) return null;
  return blocksFor(s).find((b) => b.id !== "explore" && !d.done.includes(b.id)) ?? null;
}

/** May Dev open this screen right now? */
export function routeOpen(s: State, route: string): boolean {
  const b = currentBlock(s);
  if (!b) return true;
  if (route === "home" || route === "progress" || route === "diagnostic") return true;
  if (b.id === "break") return false;
  return b.routes.includes(route);
}

export const blockSecs = (s: State, id: BlockId) => dayState(s).secs[id] ?? 0;

let onDone: (b: Block, next: Block | null) => void = () => {};
export const setPlanListener = (f: typeof onDone) => (onDone = f);

function finish(id: BlockId) {
  const s0 = getState();
  if (dayState(s0).done.includes(id)) return;
  update((s) => {
    const d = dayState(s);
    s.planDay = { ...d, done: [...d.done, id] };
    const list = blocksFor(s);
    const next = list.find((b) => b.id !== "explore" && !s.planDay!.done.includes(b.id));
    if (next?.id === "break") s.planDay.breakEnd = Date.now() + next.minutes * 60_000;
  });
  const s = getState();
  const list = blocksFor(s);
  const block = list.find((b) => b.id === id)!;
  const next = currentBlock(s);
  if (id !== "break") addXp(10, 10);
  if (!next) {
    const weekend = isWeekend();
    if (!dayState(s).bonus) {
      update((st) => void (st.planDay = { ...dayState(st), bonus: true }));
      giveChest(weekend ? "gold" : "silver", weekend ? "finishing weekend training" : "finishing today's plan");
    }
  }
  onDone(block, next ?? list.find((b) => b.id === "explore") ?? null);
}

/** Add active seconds on a screen to the current block. */
export function addPlanSeconds(route: string, secs: number) {
  const s = getState();
  const b = currentBlock(s);
  if (!b || b.id === "break" || !b.routes.includes(route)) return;
  const have = blockSecs(s, b.id) + secs;
  update((st) => {
    const d = dayState(st);
    st.planDay = { ...d, secs: { ...d.secs, [b.id]: have } };
  });
  // The mock test block ends when the essay is turned in, not on a timer.
  if (b.id !== "mock" && have >= b.minutes * 60) finish(b.id);
}

/** The break runs on the wall clock, whatever screen he's on. */
export function tickBreak() {
  const s = getState();
  const b = currentBlock(s);
  if (b?.id !== "break") return;
  const d = dayState(s);
  if (!d.breakEnd) update((st) => void (st.planDay = { ...dayState(st), breakEnd: Date.now() + b.minutes * 60_000 }));
  else if (Date.now() >= d.breakEnd) finish("break");
}

export const breakLeft = (s: State) => Math.max(0, (dayState(s).breakEnd ?? Date.now()) - Date.now());

/** A mock test was turned in. */
export function mockTurnedIn() {
  const b = currentBlock(getState());
  if (b?.id === "mock") finish("mock");
}

/** Parent controls. */
export function unlockToday(on = true) {
  update((s) => void (s.planDay = { ...dayState(s), unlocked: on }));
}
export function setPlan(fn: (p: PlanSettings) => void) {
  update((s) => {
    const p = settings(s);
    fn(p);
    s.plan = p;
  });
}
