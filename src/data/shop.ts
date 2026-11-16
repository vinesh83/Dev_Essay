// The Quest Shop. Dev earns coins from practice and spends them on gear for
// his hero. All items are original and purely cosmetic.

export type Slot = "hat" | "gear" | "pet" | "cape" | "realm";

export type Item = { id: string; slot: Slot; name: string; icon: string; price: number; desc: string };

export const SLOTS: Record<Slot, string> = {
  hat: "Headgear",
  gear: "Tool",
  pet: "Companion",
  cape: "Cape",
  realm: "Realm",
};

export const ITEMS: Item[] = [
  { id: "hat_cap", slot: "hat", name: "Explorer Cap", icon: "🧢", price: 40, desc: "Every quest starts with a good hat." },
  { id: "hat_crown", slot: "hat", name: "Scholar Crown", icon: "👑", price: 300, desc: "For writers who scored 90+." },
  { id: "hat_wizard", slot: "hat", name: "Wordsmith Hat", icon: "🎩", price: 160, desc: "Pulls strong words out of thin air." },
  { id: "hat_helmet", slot: "hat", name: "Knight Helm", icon: "⛑️", price: 120, desc: "Protects against run-on sentences." },
  { id: "gear_pencil", slot: "gear", name: "Quill of Clarity", icon: "✒️", price: 60, desc: "Writes crisp, clear sentences." },
  { id: "gear_shield", slot: "gear", name: "Comma Shield", icon: "🛡️", price: 140, desc: "Blocks missing commas." },
  { id: "gear_sword", slot: "gear", name: "Blade of Reasons", icon: "🗡️", price: 220, desc: "Cuts through weak arguments." },
  { id: "gear_bow", slot: "gear", name: "Evidence Bow", icon: "🏹", price: 260, desc: "Every example hits the target." },
  { id: "gear_wand", slot: "gear", name: "Hook Wand", icon: "🪄", price: 350, desc: "Casts openings no reader can resist." },
  { id: "pet_fox", slot: "pet", name: "Swift Fox", icon: "🦊", price: 100, desc: "Fast like your fingers." },
  { id: "pet_owl", slot: "pet", name: "Wise Owl", icon: "🦉", price: 180, desc: "Knows every transition word." },
  { id: "pet_dragon", slot: "pet", name: "Tiny Dragon", icon: "🐉", price: 500, desc: "The rarest companion in the land." },
  { id: "pet_turtle", slot: "pet", name: "Steady Turtle", icon: "🐢", price: 70, desc: "Accuracy first, speed second." },
  { id: "cape_red", slot: "cape", name: "Ember Cape", icon: "🟥", price: 80, desc: "A cape the color of fire." },
  { id: "cape_blue", slot: "cape", name: "Tide Cape", icon: "🟦", price: 80, desc: "Calm and focused." },
  { id: "cape_gold", slot: "cape", name: "Champion Cape", icon: "🟨", price: 400, desc: "Only for true champions." },
  { id: "realm_forest", slot: "realm", name: "Whispering Forest", icon: "🌲", price: 120, desc: "A quiet place to write." },
  { id: "realm_sky", slot: "realm", name: "Sky Islands", icon: "☁️", price: 250, desc: "Floating islands above the clouds." },
  { id: "realm_volcano", slot: "realm", name: "Lava Peaks", icon: "🌋", price: 320, desc: "Hot ideas only." },
  { id: "realm_castle", slot: "realm", name: "Crystal Castle", icon: "🏰", price: 600, desc: "The final destination: TAG Academy!" },
];

export const REALM_BG: Record<string, string> = {
  realm_forest: "linear-gradient(160deg, #2f7d4f, #9bd27a)",
  realm_sky: "linear-gradient(160deg, #5db8ff, #e2f4ff)",
  realm_volcano: "linear-gradient(160deg, #6b1d1d, #ff8a3d)",
  realm_castle: "linear-gradient(160deg, #6b4eff, #c9b8ff)",
};
export const CAPE_COLOR: Record<string, string> = { cape_red: "#e0435c", cape_blue: "#1c9bd8", cape_gold: "#ffc23d" };

export const itemById = (id?: string) => ITEMS.find((i) => i.id === id);
