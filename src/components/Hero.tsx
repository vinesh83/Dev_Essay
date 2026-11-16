import { CAPE_COLOR, REALM_BG, itemById } from "../data/shop";
import type { State } from "../lib/store";

export default function Hero({ s, size = 180 }: { s: State; size?: number }) {
  const e = s.equipped;
  const hat = itemById(e.hat);
  const gear = itemById(e.gear);
  const pet = itemById(e.pet);
  const bg = REALM_BG[e.realm ?? ""] ?? "linear-gradient(160deg, var(--brand-soft), var(--bg))";
  const cape = CAPE_COLOR[e.cape ?? ""];
  const f = size / 180;
  return (
    <div
      aria-label="Your hero"
      style={{ width: size, height: size, borderRadius: 24 * f, background: bg, position: "relative", overflow: "hidden", flexShrink: 0, border: "1px solid var(--line)" }}
    >
      {cape && <div style={{ position: "absolute", left: 50 * f, top: 78 * f, width: 80 * f, height: 80 * f, background: cape, borderRadius: `${30 * f}px ${30 * f}px ${10 * f}px ${10 * f}px` }} />}
      <div style={{ position: "absolute", left: 0, right: 0, top: 50 * f, textAlign: "center", fontSize: 84 * f, lineHeight: 1 }}>🧒🏽</div>
      {hat && <div style={{ position: "absolute", left: 0, right: 0, top: 6 * f, textAlign: "center", fontSize: 54 * f }}>{hat.icon}</div>}
      {gear && <div style={{ position: "absolute", right: 14 * f, top: 88 * f, fontSize: 44 * f }}>{gear.icon}</div>}
      {pet && <div style={{ position: "absolute", left: 10 * f, bottom: 8 * f, fontSize: 44 * f }}>{pet.icon}</div>}
    </div>
  );
}
