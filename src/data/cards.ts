// Collectible creature cards. Dev finds them in treasure chests. Every card
// carries a writing tip, so collecting them reinforces the lessons.
// All names and creatures are original to this app.

export type Rarity = "common" | "rare" | "epic" | "legendary";

export type Card = {
  id: string;
  name: string;
  realm: string;
  rarity: Rarity;
  glyph: string;
  hue: number; // main color of the art
  tip: string;
};

export const RARITY: Record<Rarity, { label: string; weight: number; dupCoins: number; color: string }> = {
  common: { label: "Common", weight: 58, dupCoins: 5, color: "#9fb3c8" },
  rare: { label: "Rare", weight: 28, dupCoins: 12, color: "#4cc9f0" },
  epic: { label: "Epic", weight: 11, dupCoins: 25, color: "#c77dff" },
  legendary: { label: "Legendary", weight: 3, dupCoins: 60, color: "#ffd166" },
};

export const REALMS = [
  { id: "meadow", name: "Inkwell Meadow", level: 1, sky: ["#1b3a5c", "#3f7f6e"], ground: "#3c8d5a", accent: "#a6e3a1" },
  { id: "forest", name: "Whisperwood", level: 3, sky: ["#14283d", "#2c5d4a"], ground: "#24583a", accent: "#7bd389" },
  { id: "desert", name: "Sandscript Dunes", level: 5, sky: ["#3b2245", "#c96b3c"], ground: "#d39b55", accent: "#ffd29d" },
  { id: "peaks", name: "Thunderquill Peaks", level: 8, sky: ["#1a1f45", "#5b4b8a"], ground: "#5a5f7a", accent: "#b8c0ff" },
  { id: "sky", name: "Cloudpage Isles", level: 11, sky: ["#2a3f8f", "#88c5ff"], ground: "#e9f4ff", accent: "#ffffff" },
  { id: "castle", name: "Crystal Academy", level: 15, sky: ["#1b1238", "#6b4eff"], ground: "#3b2c7a", accent: "#ffd166" },
] as const;

export const CARDS: Card[] = [
  // Inkwell Meadow
  { id: "c01", name: "Puddle Newt", realm: "meadow", rarity: "common", glyph: "🦎", hue: 150, tip: "Start every sentence with a capital letter." },
  { id: "c02", name: "Comma Snail", realm: "meadow", rarity: "common", glyph: "🐌", hue: 40, tip: "Put a comma after First, Also, and For example." },
  { id: "c03", name: "Sprout Bunny", realm: "meadow", rarity: "common", glyph: "🐇", hue: 100, tip: "Plan before you write. Five minutes of planning saves twenty of fixing." },
  { id: "c04", name: "Dewdrop Sprite", realm: "meadow", rarity: "rare", glyph: "🧚", hue: 190, tip: "Read your opinion sentence out loud. Does it pick ONE side?" },
  { id: "c05", name: "Meadow Stag", realm: "meadow", rarity: "rare", glyph: "🦌", hue: 30, tip: "Each body paragraph gets one reason and one example." },
  { id: "c06", name: "Clover Golem", realm: "meadow", rarity: "epic", glyph: "🍀", hue: 120, tip: "A hook makes the reader care: try a question or a surprising fact." },
  // Whisperwood
  { id: "c07", name: "Hootle Owl", realm: "forest", rarity: "common", glyph: "🦉", hue: 35, tip: "Transitions are signposts: First, Another reason, Finally." },
  { id: "c08", name: "Mossback Toad", realm: "forest", rarity: "common", glyph: "🐸", hue: 110, tip: "don't, can't, it's: contractions need apostrophes." },
  { id: "c09", name: "Lantern Moth", realm: "forest", rarity: "common", glyph: "🦋", hue: 280, tip: "Swap 'good' for a sharper word: helpful, healthy, exciting." },
  { id: "c10", name: "Bramble Fox", realm: "forest", rarity: "rare", glyph: "🦊", hue: 20, tip: "After an example, explain it: 'This shows that…'" },
  { id: "c11", name: "Hollow Bear", realm: "forest", rarity: "rare", glyph: "🐻", hue: 25, tip: "If a sentence has three 'and's, split it into two sentences." },
  { id: "c12", name: "Elder Treant", realm: "forest", rarity: "epic", glyph: "🌳", hue: 95, tip: "Your conclusion restates your opinion in NEW words." },
  { id: "c13", name: "Moonpetal Wisp", realm: "forest", rarity: "legendary", glyph: "🌙", hue: 260, tip: "Great writers revise. Your first draft is the start, not the end." },
  // Sandscript Dunes
  { id: "c14", name: "Dune Scarab", realm: "desert", rarity: "common", glyph: "🪲", hue: 45, tip: "their = belongs to them. there = a place. they're = they are." },
  { id: "c15", name: "Sunny Lizard", realm: "desert", rarity: "common", glyph: "🦎", hue: 35, tip: "End every sentence with a period, question mark, or exclamation point." },
  { id: "c16", name: "Mirage Camel", realm: "desert", rarity: "common", glyph: "🐫", hue: 30, tip: "Use one ! at most. Periods sound confident." },
  { id: "c17", name: "Sandglass Fennec", realm: "desert", rarity: "rare", glyph: "⏳", hue: 40, tip: "Watch the clock: save 25 minutes for revising and proofreading." },
  { id: "c18", name: "Oasis Serpent", realm: "desert", rarity: "rare", glyph: "🐍", hue: 170, tip: "Use evidence from the article and say which paragraph it's from." },
  { id: "c19", name: "Pharaoh Cat", realm: "desert", rarity: "epic", glyph: "🐈", hue: 50, tip: "Answer the other side: 'Some people think… However…'" },
  // Thunderquill Peaks
  { id: "c20", name: "Pebble Ram", realm: "peaks", rarity: "common", glyph: "🐏", hue: 220, tip: "'a lot' is two words. Better yet, use 'many'." },
  { id: "c21", name: "Frost Hare", realm: "peaks", rarity: "common", glyph: "🐰", hue: 200, tip: "Proofread one sentence at a time, slowly." },
  { id: "c22", name: "Storm Eagle", realm: "peaks", rarity: "rare", glyph: "🦅", hue: 230, tip: "Strong verbs paint pictures: dashed, soared, discovered." },
  { id: "c23", name: "Crag Yeti", realm: "peaks", rarity: "rare", glyph: "🏔️", hue: 210, tip: "A personal story is great evidence: when, where, what happened." },
  { id: "c24", name: "Thunder Wyrm", realm: "peaks", rarity: "epic", glyph: "⚡", hue: 250, tip: "Your three reasons should be different, not the same idea three times." },
  { id: "c25", name: "Aurora Phoenix", realm: "peaks", rarity: "legendary", glyph: "🔥", hue: 15, tip: "Write like you're convincing a friend: clear, kind, and certain." },
  // Cloudpage Isles
  { id: "c26", name: "Puff Whale", realm: "sky", rarity: "common", glyph: "🐋", hue: 205, tip: "The word 'I' is always a capital." },
  { id: "c27", name: "Breeze Kite", realm: "sky", rarity: "common", glyph: "🪁", hue: 330, tip: "Names of people, places, and days get capitals." },
  { id: "c28", name: "Rainbow Koi", realm: "sky", rarity: "rare", glyph: "🐟", hue: 300, tip: "Vary sentence length: short ones punch, long ones explain." },
  { id: "c29", name: "Cloud Pegasus", realm: "sky", rarity: "epic", glyph: "🦄", hue: 290, tip: "End with a final thought that sticks: a wish, a warning, or a challenge." },
  { id: "c30", name: "Starlight Ray", realm: "sky", rarity: "epic", glyph: "🌠", hue: 50, tip: "Check every 'its': if you mean 'it is', write it's." },
  // Crystal Academy
  { id: "c31", name: "Quill Knight", realm: "castle", rarity: "rare", glyph: "🛡️", hue: 260, tip: "Unpack the prompt: circle the question words before you start." },
  { id: "c32", name: "Rune Golem", realm: "castle", rarity: "rare", glyph: "🗿", hue: 240, tip: "Pick the side you can prove best, not the one that sounds fancy." },
  { id: "c33", name: "Archive Dragon", realm: "castle", rarity: "epic", glyph: "🐉", hue: 140, tip: "Seven steps, every time: unpack, side, brainstorm, plan, draft, revise, proofread." },
  { id: "c34", name: "Crystal Griffin", realm: "castle", rarity: "legendary", glyph: "💎", hue: 190, tip: "Confident writers finish early and use the extra time to polish." },
  { id: "c35", name: "The Grand Scribe", realm: "castle", rarity: "legendary", glyph: "👑", hue: 45, tip: "You are ready. Plan it, write it, check it, own it." },
];

export const cardById = (id: string) => CARDS.find((c) => c.id === id);

const CHEST_RULES: Record<string, { count: number; min: Rarity }> = {
  wood: { count: 1, min: "common" },
  silver: { count: 2, min: "rare" },
  gold: { count: 3, min: "epic" },
};
const ORDER: Rarity[] = ["common", "rare", "epic", "legendary"];

function rollRarity(min: Rarity = "common"): Rarity {
  const pool = ORDER.slice(ORDER.indexOf(min));
  const total = pool.reduce((a, r) => a + RARITY[r].weight, 0);
  let x = Math.random() * total;
  for (const r of pool) {
    x -= RARITY[r].weight;
    if (x <= 0) return r;
  }
  return pool[pool.length - 1];
}

/** Pick cards for a chest. The first card is guaranteed at least the chest's minimum rarity. Unowned cards are favored. */
export function rollChest(tier: string, owned: Record<string, number>): Card[] {
  const rule = CHEST_RULES[tier] ?? CHEST_RULES.wood;
  const out: Card[] = [];
  for (let i = 0; i < rule.count; i++) {
    const rarity = rollRarity(i === 0 ? rule.min : "common");
    const pool = CARDS.filter((c) => c.rarity === rarity);
    const fresh = pool.filter((c) => !owned[c.id] && !out.includes(c));
    const list = fresh.length && Math.random() < 0.75 ? fresh : pool;
    out.push(list[Math.floor(Math.random() * list.length)]);
  }
  return out;
}
