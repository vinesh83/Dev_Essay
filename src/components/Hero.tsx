import { CAPE_COLOR, itemById } from "../data/shop";
import type { State } from "../lib/store";

// Dev's hero, drawn in SVG. Gear from the shop shows up on him.

function Hat({ id }: { id?: string }) {
  switch (id) {
    case "hat_cap":
      return (
        <g>
          <path d="M70 62 Q100 30 130 62 Z" fill="#2f80ed" />
          <rect x="66" y="58" width="68" height="8" rx="4" fill="#1c5fc4" />
          <path d="M128 62 L150 66 L128 68 Z" fill="#1c5fc4" />
        </g>
      );
    case "hat_crown":
      return (
        <g>
          <path d="M70 60 L74 34 L88 50 L100 28 L112 50 L126 34 L130 60 Z" fill="#ffd166" stroke="#c99a1f" strokeWidth="2" />
          <circle cx="100" cy="46" r="4" fill="#e0435c" />
          <circle cx="82" cy="52" r="3" fill="#4cc9f0" />
          <circle cx="118" cy="52" r="3" fill="#4cc9f0" />
        </g>
      );
    case "hat_wizard":
      return (
        <g>
          <path d="M66 62 Q100 54 134 62 L104 6 Z" fill="#6b4eff" stroke="#4a33c9" strokeWidth="2" />
          <ellipse cx="100" cy="62" rx="40" ry="7" fill="#4a33c9" />
          <text x="98" y="44" fontSize="14" textAnchor="middle">⭐</text>
        </g>
      );
    case "hat_helmet":
      return (
        <g>
          <path d="M68 66 Q68 26 100 26 Q132 26 132 66 Z" fill="#c0c7d6" stroke="#8a93a8" strokeWidth="2" />
          <rect x="97" y="22" width="6" height="40" fill="#e0435c" />
          <path d="M96 20 Q100 4 112 12 Q104 14 103 22 Z" fill="#e0435c" />
        </g>
      );
    default:
      return null;
  }
}

export default function Hero({ s, size = 180, scene = true }: { s: State; size?: number; scene?: boolean }) {
  const e = s.equipped;
  const gear = itemById(e.gear);
  const pet = itemById(e.pet);
  const cape = CAPE_COLOR[e.cape ?? ""];
  return (
    <svg className="svg-hero" viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Your hero" style={{ flexShrink: 0, overflow: "visible" }}>
      {scene && <ellipse cx="100" cy="188" rx="70" ry="10" fill="rgba(0,0,0,0.35)" />}
      {/* cape */}
      {cape && <path d="M72 92 Q60 150 58 182 L142 182 Q140 150 128 92 Z" fill={cape} stroke="rgba(0,0,0,0.25)" strokeWidth="2" />}
      {/* legs */}
      <rect x="82" y="148" width="14" height="34" rx="6" fill="#3b3a63" />
      <rect x="104" y="148" width="14" height="34" rx="6" fill="#3b3a63" />
      <rect x="78" y="176" width="22" height="10" rx="5" fill="#5a3a22" />
      <rect x="100" y="176" width="22" height="10" rx="5" fill="#5a3a22" />
      {/* body / tunic */}
      <path d="M74 98 Q100 88 126 98 L132 152 Q100 160 68 152 Z" fill="#1fa58a" stroke="#137a66" strokeWidth="2" />
      <rect x="70" y="132" width="60" height="8" rx="3" fill="#5a3a22" />
      <rect x="95" y="131" width="10" height="10" rx="2" fill="#ffd166" />
      {/* arms */}
      <rect x="56" y="100" width="16" height="44" rx="8" fill="#1fa58a" transform="rotate(12 64 100)" />
      <rect x="128" y="100" width="16" height="44" rx="8" fill="#1fa58a" transform="rotate(-12 136 100)" />
      <circle cx="58" cy="144" r="8" fill="#b97a4f" />
      <circle cx="142" cy="144" r="8" fill="#b97a4f" />
      {/* neck + head */}
      <rect x="93" y="84" width="14" height="14" fill="#b97a4f" />
      <circle cx="100" cy="66" r="28" fill="#c68a5c" />
      <path d="M72 64 Q74 34 100 36 Q128 34 128 62 Q118 50 104 52 Q90 46 72 64 Z" fill="#2b1a10" />
      <circle cx="90" cy="70" r="3.6" fill="#1d1b3a" />
      <circle cx="110" cy="70" r="3.6" fill="#1d1b3a" />
      <circle cx="91" cy="69" r="1.2" fill="#fff" />
      <circle cx="111" cy="69" r="1.2" fill="#fff" />
      <path d="M90 80 Q100 88 110 80" stroke="#1d1b3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="84" cy="78" r="4" fill="#e88b7a" opacity="0.5" />
      <circle cx="116" cy="78" r="4" fill="#e88b7a" opacity="0.5" />
      <Hat id={e.hat} />
      {gear && (
        <text x="156" y="146" fontSize="40" textAnchor="middle" dominantBaseline="middle">
          {gear.icon}
        </text>
      )}
      {pet && (
        <text x="30" y="170" fontSize="42" textAnchor="middle" dominantBaseline="middle" className="bob">
          {pet.icon}
        </text>
      )}
    </svg>
  );
}
