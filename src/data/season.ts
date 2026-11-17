import { today, type ChestTier, type State } from "../lib/store";

// The Quest Calendar keeps the app fresh for months. Every week since Dev
// started unlocks a new drop (cars, gear, chests, Ellie tricks), and real
// dates bring limited-time events. Rewards always come from practice.

export type Drop = { week: number; id: string; icon: string; title: string; desc: string; coins?: number; chest?: ChestTier; unlocks?: string[] };

export const DROPS: Drop[] = [
  { week: 1, id: "w1", icon: "🎓", title: "Writing School opens", desc: "Six lessons with Professor Quill, plus a welcome chest.", chest: "silver" },
  { week: 1, id: "w1b", icon: "🏎️", title: "The Garage opens", desc: "A Corvette, a Porsche 911, and a Lamborghini arrive in the Garage.", unlocks: ["car_vette", "car_coupe", "car_wedge"] },
  { week: 2, id: "w2", icon: "⛏️", title: "Mining Update + Tesla Roadster", desc: "Ores appear on your island, and the new Tesla Roadster arrives!", coins: 30, unlocks: ["car_roadster"] },
  { week: 3, id: "w3", icon: "💪", title: "Muscle Week", desc: "A Ferrari 488 and a Mustang Shelby GT500 roll in.", unlocks: ["car_rosso", "car_muscle"] },
  { week: 4, id: "w4", icon: "🐾", title: "Ellie learns Zoomies+", desc: "Ellie gets faster zoomies, a Subaru rally car arrives, and a gold chest for you.", chest: "gold", unlocks: ["car_rally"] },
  { week: 5, id: "w5", icon: "🌙", title: "Italy Meets Japan", desc: "A Maserati GranTurismo and a Toyota Supra.", unlocks: ["car_midnight", "car_tuner"] },
  { week: 6, id: "w6", icon: "💎", title: "Diamond Tier", desc: "Diamond tools can be crafted now. +50 coins to get started.", coins: 50 },
  { week: 7, id: "w7", icon: "⚡", title: "Electric Week", desc: "The Tesla Model S Plaid and the Rimac Nevera: silent and lightning fast.", unlocks: ["car_models", "car_volt"] },
  { week: 8, id: "w8", icon: "🏁", title: "Race Week", desc: "The Corvette C8.R race car, with a giant wing.", unlocks: ["car_gt3"] },
  { week: 9, id: "w9", icon: "🚀", title: "Hypercar Week", desc: "The Bugatti Chiron arrives.", unlocks: ["car_arrow"], chest: "gold" },
  { week: 10, id: "w10", icon: "👑", title: "The Golden Jesko", desc: "A gold Koenigsegg Jesko for true champions.", unlocks: ["car_crown"] },
  { week: 11, id: "w11", icon: "🏆", title: "Champion Week", desc: "Test day is close. A champion chest for your hard work.", chest: "gold", coins: 100 },
];

export type GameEvent = { id: string; icon: string; name: string; desc: string; coinMult: number; until: string };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Events that are live right now (based on the calendar date). */
export function activeEvents(now = new Date()): GameEvent[] {
  const d = iso(now);
  const y = now.getFullYear();
  const out: GameEvent[] = [];
  const range = (a: string, b: string) => d >= a && d <= b;
  if (range(`${y}-11-21`, `${y}-11-30`)) out.push({ id: "harvest", icon: "🦃", name: "Harvest Festival", desc: "Coins are worth 50% more all week!", coinMult: 1.5, until: `${y}-11-30` });
  if (range(`${y}-12-14`, `${y}-12-31`) || range(`${y}-01-01`, `${y}-01-04`)) out.push({ id: "snow", icon: "❄️", name: "Snow Festival", desc: "Snow falls on your island, and an ice-blue Audi R8 is in the Garage!", coinMult: 1.25, until: now.getMonth() === 11 ? `${y + 1}-01-04` : `${y}-01-04` });
  if (range(`${y}-12-31`, `${y}-12-31`) || range(`${y}-01-01`, `${y}-01-01`)) out.push({ id: "newyear", icon: "🎆", name: "New Year Fireworks", desc: "Double coins to start the year strong!", coinMult: 2, until: `${y}-01-01` });
  if (range(`${y}-01-05`, `${y}-02-06`)) out.push({ id: "camp", icon: "🏕️", name: "Test Training Camp", desc: "Mock tests pay double. You are almost ready!", coinMult: 1, until: `${y}-02-06` });
  // Every other weekend: Double Coin Weekend.
  const dow = now.getDay();
  const weekNo = Math.floor(today() / 7);
  if ((dow === 0 || dow === 6) && weekNo % 2 === 0) out.push({ id: "weekend", icon: "🎉", name: "Double Coin Weekend", desc: "Every coin you earn counts twice!", coinMult: 2, until: "Sunday" });
  return out;
}

export const coinMultiplier = () => activeEvents().reduce((m, e) => Math.max(m, e.coinMult), 1);

export const seasonWeek = (s: State) => Math.floor((today() - (s.startDay ?? today())) / 7) + 1;
export const daysToWeek = (s: State, week: number) => Math.max(0, (s.startDay ?? today()) + (week - 1) * 7 - today());

/** Items gated by the calendar: id -> week it arrives. */
export const ITEM_WEEK: Record<string, number> = Object.fromEntries(DROPS.flatMap((d) => (d.unlocks ?? []).map((id) => [id, d.week])));

export function itemArrived(s: State, id: string) {
  if (id === "car_comet") return activeEvents().some((e) => e.id === "snow") || s.owned.includes(id);
  const w = ITEM_WEEK[id];
  return !w || seasonWeek(s) >= w;
}

/** Daily surprise: one mystery gift after 10 minutes of practice. */
export const SURPRISES: { icon: string; text: string; coins?: number; chest?: ChestTier; weight: number }[] = [
  { icon: "🪙", text: "A pouch of 15 coins!", coins: 15, weight: 30 },
  { icon: "💰", text: "A bag of 30 coins!", coins: 30, weight: 18 },
  { icon: "📦", text: "A wooden chest!", chest: "wood", weight: 25 },
  { icon: "🎁", text: "A silver chest!", chest: "silver", weight: 15 },
  { icon: "👑", text: "A GOLD chest! Super lucky!", chest: "gold", weight: 5 },
  { icon: "💎", text: "A treasure hoard: 75 coins!", coins: 75, weight: 4 },
  { icon: "🌟", text: "JACKPOT! 150 coins!", coins: 150, weight: 1 },
];
