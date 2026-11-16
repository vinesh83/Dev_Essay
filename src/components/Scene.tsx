import type { ReactNode } from "react";
import { REALMS } from "../data/cards";
import { level, type State } from "../lib/store";

// A painted backdrop: sky, stars, moon, the far-off Crystal Academy, and
// rolling hills in the colors of Dev's current realm.

const SHOP_REALMS: Record<string, { sky: readonly [string, string]; ground: string; accent: string }> = {
  realm_forest: { sky: ["#10263a", "#2c6a4c"], ground: "#1f5a35", accent: "#9be59b" },
  realm_sky: { sky: ["#2a3f8f", "#8fd0ff"], ground: "#dfefff", accent: "#ffffff" },
  realm_volcano: { sky: ["#2a0f1a", "#c2452d"], ground: "#4a2020", accent: "#ff8a3d" },
  realm_castle: { sky: ["#1b1238", "#6b4eff"], ground: "#3b2c7a", accent: "#ffd166" },
};

export function currentRealm(s: State) {
  const lv = level(s.xp);
  return [...REALMS].reverse().find((r) => lv >= r.level) ?? REALMS[0];
}

export default function Scene({ s, height = 220, children }: { s: State; height?: number; children?: ReactNode }) {
  const realm = currentRealm(s);
  const look = SHOP_REALMS[s.equipped.realm ?? ""] ?? realm;
  const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97) % 800, y: (i * 53) % 120, r: (i % 3) * 0.5 + 0.6 }));
  return (
    <div className="scene" style={{ height }}>
      <svg viewBox="0 0 800 260" preserveAspectRatio="xMidYMax slice" className="scene-bg" aria-hidden>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={look.sky[0]} />
            <stop offset="1" stopColor={look.sky[1]} />
          </linearGradient>
          <radialGradient id="moonGlow">
            <stop offset="0" stopColor="#fff7d6" stopOpacity="0.9" />
            <stop offset="1" stopColor="#fff7d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="800" height="260" fill="url(#sky)" />
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#fff" className={i % 4 === 0 ? "twinkle" : ""} opacity={0.8} />
        ))}
        <circle cx="660" cy="56" r="60" fill="url(#moonGlow)" />
        <circle cx="660" cy="56" r="22" fill="#fff7d6" />
        {/* distant academy */}
        <g opacity="0.55" fill="#0d0a24">
          <rect x="520" y="120" width="70" height="60" />
          <rect x="510" y="96" width="16" height="84" />
          <rect x="584" y="96" width="16" height="84" />
          <path d="M506 96 L518 74 L530 96 Z" />
          <path d="M580 96 L592 74 L604 96 Z" />
          <rect x="545" y="88" width="20" height="40" />
          <path d="M541 88 L555 58 L569 88 Z" />
          <circle cx="555" cy="52" r="4" fill="#ffd166" className="twinkle" />
        </g>
        <path d="M0 190 Q120 140 240 175 T480 165 T800 170 L800 260 L0 260 Z" fill={look.ground} opacity="0.55" />
        <path d="M0 215 Q160 175 330 205 T620 195 T800 205 L800 260 L0 260 Z" fill={look.ground} />
        <path d="M0 215 Q160 175 330 205 T620 195 T800 205" fill="none" stroke={look.accent} strokeOpacity="0.4" strokeWidth="2" />
      </svg>
      <div className="scene-content">{children}</div>
      <div className="scene-label">📍 {realm.name}</div>
    </div>
  );
}
