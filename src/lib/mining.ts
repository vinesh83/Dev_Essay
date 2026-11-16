import { toast } from "../components/Toast";
import { seasonWeek } from "../data/season";
import type { Ore } from "../three/blocks";
import { sfx } from "./sfx";
import { addXp, getState, update } from "./store";

// Mine words, craft sentences. Practice makes ore blocks pop up on Dev's
// island; he taps them to mine. Ore crafts tools that show up in 3D, and
// better pickaxes find rarer ore.

export const ORES: { id: Ore; name: string; color: string; value: number }[] = [
  { id: "coal", name: "Coal", color: "#2b2b30", value: 1 },
  { id: "iron", name: "Iron", color: "#d9a27c", value: 3 },
  { id: "gold", name: "Gold", color: "#ffd54a", value: 6 },
  { id: "diamond", name: "Diamond", color: "#5ef2e6", value: 15 },
  { id: "emerald", name: "Emerald", color: "#3ddc6a", value: 25 },
];

export type Recipe = { id: string; name: string; desc: string; cost: Partial<Record<Ore, number>>; week?: number; tier?: number };

export const RECIPES: Recipe[] = [
  { id: "craft_sword_iron", name: "Iron Sword", desc: "Your first crafted blade.", cost: { iron: 2, coal: 1 } },
  { id: "craft_pick_iron", name: "Iron Pickaxe", desc: "Finds ore more often. Iron and gold show up more.", cost: { iron: 3, coal: 2 }, tier: 1 },
  { id: "craft_axe_gold", name: "Golden Axe", desc: "Shiny and very fancy.", cost: { gold: 3, coal: 1 } },
  { id: "craft_pick_gold", name: "Gold Pickaxe", desc: "Even better luck. Diamonds appear more.", cost: { gold: 3, iron: 2 }, tier: 2 },
  { id: "craft_sword_diamond", name: "Diamond Sword", desc: "The sharpest sword in the land.", cost: { diamond: 2, emerald: 1 }, week: 6 },
  { id: "craft_pick_diamond", name: "Diamond Pickaxe", desc: "The best luck of all. Emeralds love it.", cost: { diamond: 3, gold: 2 }, week: 6, tier: 3 },
];

const MAX_NODES = 8;

export const pickTier = () => Math.max(0, ...RECIPES.filter((r) => r.tier && getState().owned.includes(r.id)).map((r) => r.tier!));

function rollOre(tier: number): Ore {
  const w = [45 - tier * 8, 28, 15 + tier * 3, 8 + tier * 3, 4 + tier * 2];
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < w.length; i++) if ((r -= w[i]) < 0) return ORES[i].id;
  return "coal";
}

let hinted = false;
/** Called after every XP award. Bigger rewards are more likely to reveal ore. */
export function onXp(n: number) {
  if (n < 5) return;
  const s = getState();
  if ((s.oreNodes?.length ?? 0) >= MAX_NODES) return;
  const tier = pickTier();
  if (Math.random() > Math.min(0.85, n / 30 + tier * 0.06)) return;
  const ore = rollOre(tier);
  update((st) => void (st.oreNodes = [...(st.oreNodes ?? []), ore]));
  if (!hinted || ore === "diamond" || ore === "emerald") {
    toast(`⛏️ ${ore === "diamond" || ore === "emerald" ? `Rare ${ore} block!` : "An ore block"} appeared on your island. Tap it on Home to mine it!`);
    hinted = true;
  }
}

export function mine(index: number) {
  const s = getState();
  const ore = s.oreNodes?.[index];
  if (!ore) return;
  update((st) => {
    st.oreNodes = (st.oreNodes ?? []).filter((_, i) => i !== index);
    st.ores = { ...(st.ores ?? {}), [ore]: (st.ores?.[ore] ?? 0) + 1 };
  });
  sfx.coin();
  addXp(2, 0);
  const o = ORES.find((x) => x.id === ore)!;
  toast(`⛏️ +1 ${o.name}!${ore === "diamond" || ore === "emerald" ? " WOW, super rare!" : ""}`);
}

export const canAfford = (r: Recipe) => Object.entries(r.cost).every(([k, v]) => (getState().ores?.[k as Ore] ?? 0) >= v!);
export const recipeOpen = (r: Recipe) => !r.week || seasonWeek(getState()) >= r.week;

export function craft(r: Recipe) {
  if (!canAfford(r) || !recipeOpen(r) || getState().owned.includes(r.id)) return false;
  update((st) => {
    const inv = { ...(st.ores ?? {}) };
    for (const [k, v] of Object.entries(r.cost)) inv[k as Ore] = (inv[k as Ore] ?? 0) - v!;
    st.ores = inv;
    st.owned.push(r.id);
    st.equipped.gear = r.id;
  });
  sfx.fanfare();
  addXp(20, 10);
  return true;
}

export function sell(ore: Ore) {
  const have = getState().ores?.[ore] ?? 0;
  if (!have) return;
  const o = ORES.find((x) => x.id === ore)!;
  update((st) => void (st.ores = { ...(st.ores ?? {}), [ore]: have - 1 }));
  addXp(0, o.value);
  sfx.coin();
}
