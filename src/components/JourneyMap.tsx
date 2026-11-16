import { REALMS } from "../data/cards";
import { level, type State } from "../lib/store";

// Winding trail through the six realms. Each realm unlocks at a hero level.

const ICONS: Record<string, string> = { meadow: "🌼", forest: "🌲", desert: "🏜️", peaks: "⛰️", sky: "☁️", castle: "🏰" };

export default function JourneyMap({ s }: { s: State }) {
  const lv = level(s.xp);
  const pts = REALMS.map((_, i) => ({ x: 60 + i * 136, y: i % 2 ? 60 : 120 }));
  const path = pts.map((p, i) => (i === 0 ? `M${p.x} ${p.y}` : `S${p.x - 68} ${p.y} ${p.x} ${p.y}`)).join(" ");
  const curIdx = REALMS.reduce((a, r, i) => (lv >= r.level ? i : a), 0);
  return (
    <svg viewBox="0 0 800 200" style={{ width: "100%", height: "auto" }} role="img" aria-label="Journey map">
      <path d={path} fill="none" stroke="rgba(255,209,102,0.35)" strokeWidth="10" strokeLinecap="round" strokeDasharray="2 18" />
      {REALMS.map((r, i) => {
        const p = pts[i];
        const open = lv >= r.level;
        return (
          <g key={r.id} opacity={open ? 1 : 0.45}>
            <circle cx={p.x} cy={p.y} r={34} fill={open ? r.sky[1] : "#2a2550"} stroke={open ? "#ffd166" : "#5a5590"} strokeWidth="4" />
            <text x={p.x} y={p.y + 2} fontSize="30" textAnchor="middle" dominantBaseline="middle">
              {open ? ICONS[r.id] : "🔒"}
            </text>
            <text x={p.x} y={p.y + 52} fontSize="13" fontWeight="800" textAnchor="middle" fill="#f4efff">
              {r.name}
            </text>
            <text x={p.x} y={p.y + 67} fontSize="11" textAnchor="middle" fill="#b9b3e6">
              Level {r.level}
            </text>
            {i === curIdx && (
              <g className="bob">
                <circle cx={p.x + 28} cy={p.y - 30} r={15} fill="#c68a5c" stroke="#fff" strokeWidth="3" />
                <text x={p.x + 28} y={p.y - 29} fontSize="14" textAnchor="middle" dominantBaseline="middle">⭐</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
