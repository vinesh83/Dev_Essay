// Animated hands over a keyboard. The finger that owns the target key glows
// and reaches from its home key to the target and back, over and over, so
// Dev can see exactly which finger moves and where.

const P = 44; // key pitch
const ROWS: { keys: string; off: number }[] = [
  { keys: "qwertyuiop", off: 22 },
  { keys: "asdfghjkl;'", off: 33 },
  { keys: "zxcvbnm,./", off: 55 },
];

type FingerId = "lp" | "lr" | "lm" | "li" | "ri" | "rm" | "rr" | "rp";
const HOME: Record<FingerId, string> = { lp: "a", lr: "s", lm: "d", li: "f", ri: "j", rm: "k", rr: "l", rp: ";" };
const OWNER: Record<string, FingerId> = {};
(
  [
    ["lp", "qaz"], ["lr", "wsx"], ["lm", "edc"], ["li", "rfvtgb"],
    ["ri", "yhnujm"], ["rm", "ik,"], ["rr", "ol."], ["rp", "p;/'"],
  ] as [FingerId, string][]
).forEach(([f, ks]) => [...ks].forEach((k) => (OWNER[k] = f)));

const NAMES: Record<FingerId, string> = {
  lp: "left pinky", lr: "left ring finger", lm: "left middle finger", li: "left pointer finger",
  ri: "right pointer finger", rm: "right middle finger", rr: "right ring finger", rp: "right pinky",
};
const COLORS: Record<FingerId, string> = {
  lp: "#ff8fab", lr: "#ffb347", lm: "#ffe066", li: "#7bd389", ri: "#5ec8f2", rm: "#a594f9", rr: "#e599f7", rp: "#ff8fab",
};

function keyPos(k: string): { x: number; y: number } | null {
  for (let r = 0; r < ROWS.length; r++) {
    const i = ROWS[r].keys.indexOf(k);
    if (i >= 0) return { x: ROWS[r].off + i * P + 20, y: r * P + 20 };
  }
  return null;
}

export function describeReach(ch: string): string {
  const k = ch.toLowerCase();
  if (k === " ") return "Tap the space bar with your thumb. Your other fingers stay home.";
  const f = OWNER[k];
  if (!f) return "";
  const home = HOME[f];
  const shift = ch !== k ? ` Hold Shift with your ${f.startsWith("l") ? "right" : "left"} pinky first.` : "";
  if (k === home) return `This is a home key! Press it with your ${NAMES[f]} without moving your hand.${shift}`;
  const a = keyPos(home)!;
  const b = keyPos(k)!;
  const vert = b.y < a.y ? "up" : b.y > a.y ? "down" : "";
  const horiz = b.x - a.x > 30 ? "right" : b.x - a.x < -30 ? "left" : "";
  const dir = [vert, horiz].filter(Boolean).join(" and ") || "over";
  return `Your ${NAMES[f]} reaches ${dir} from ${home.toUpperCase()} to ${k.toUpperCase()}, then snaps back to ${home.toUpperCase()}.${shift}`;
}

export function homeKeyFor(ch: string): string {
  const f = OWNER[ch.toLowerCase()];
  return f ? HOME[f] : "";
}

export default function HandGuide({ target, size = 1 }: { target: string; size?: number }) {
  const k = target.toLowerCase();
  const active = OWNER[k];
  const isUpper = target !== k && /[a-z]/.test(k);
  const shiftFinger: FingerId | null = isUpper ? (active?.startsWith("l") ? "rp" : "lp") : null;
  const W = 560;
  const H = 300;

  const finger = (f: FingerId) => {
    const home = keyPos(HOME[f])!;
    const goal = f === active ? keyPos(k) : f === shiftFinger ? { x: f === "lp" ? 26 : 528, y: 2 * P + 20 } : null;
    const dx = goal ? goal.x - home.x : 0;
    const dy = goal ? goal.y - home.y : 0;
    const len = f === "lm" || f === "rm" ? 150 : f === "lp" || f === "rp" ? 125 : 140;
    const on = goal !== null;
    return (
      <g
        key={f}
        className={on ? "reach" : ""}
        style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` }}
      >
        <rect
          x={home.x - 15}
          y={home.y - 12}
          width={30}
          height={len}
          rx={15}
          fill={on ? COLORS[f] : "#f2c9a5"}
          stroke={on ? "#fff" : "#c98f6b"}
          strokeWidth={on ? 3 : 1.5}
          opacity={on ? 1 : 0.5}
        />
        <ellipse cx={home.x} cy={home.y - 2} rx={8} ry={6} fill="#fff" opacity={on ? 0.55 : 0.25} />
      </g>
    );
  };

  return (
    <svg viewBox={`-10 -10 ${W} ${H}`} style={{ width: "100%", maxWidth: 620 * size, display: "block", margin: "0 auto" }} role="img" aria-label={describeReach(target)}>
      <rect x={-10} y={-10} width={W} height={4 * P + 10} rx={16} fill="rgba(0,0,0,0.25)" />
      {ROWS.map((row, r) =>
        [...row.keys].map((key, i) => {
          const isTarget = key === k;
          const f = OWNER[key];
          return (
            <g key={key}>
              <rect x={row.off + i * P} y={r * P} width={40} height={40} rx={8} fill={isTarget ? "#ffd166" : "#2a2550"} stroke={f ? COLORS[f] : "#555"} strokeWidth={isTarget ? 3 : 1.5} className={isTarget ? "key-pulse" : ""} />
              <text x={row.off + i * P + 20} y={r * P + 26} textAnchor="middle" fontSize={16} fontWeight={800} fill={isTarget ? "#1d1b3a" : "#e8e6ff"} fontFamily="monospace">
                {key.toUpperCase()}
              </text>
              {(key === "f" || key === "j") && <rect x={row.off + i * P + 14} y={r * P + 32} width={12} height={2.5} rx={1} fill="#e8e6ff" />}
            </g>
          );
        }),
      )}
      <rect x={0} y={2 * P} width={50} height={40} rx={8} fill={shiftFinger === "lp" ? "#ffd166" : "#2a2550"} stroke="#ff8fab" strokeWidth={1.5} />
      <text x={25} y={2 * P + 25} textAnchor="middle" fontSize={11} fill={shiftFinger === "lp" ? "#1d1b3a" : "#e8e6ff"} fontWeight={800}>SHIFT</text>
      <rect x={496} y={2 * P} width={60} height={40} rx={8} fill={shiftFinger === "rp" ? "#ffd166" : "#2a2550"} stroke="#ff8fab" strokeWidth={1.5} />
      <text x={526} y={2 * P + 25} textAnchor="middle" fontSize={11} fill={shiftFinger === "rp" ? "#1d1b3a" : "#e8e6ff"} fontWeight={800}>SHIFT</text>
      <rect x={150} y={3 * P} width={250} height={40} rx={8} fill={k === " " ? "#ffd166" : "#2a2550"} stroke="#999" strokeWidth={1.5} className={k === " " ? "key-pulse" : ""} />
      {/* palms */}
      <rect x={40} y={3 * P + 4} width={175} height={100} rx={46} fill="#f2c9a5" stroke="#c98f6b" strokeWidth={1.5} opacity={0.55} />
      <rect x={300} y={3 * P + 4} width={175} height={100} rx={46} fill="#f2c9a5" stroke="#c98f6b" strokeWidth={1.5} opacity={0.55} />
      {/* thumbs */}
      <g className={k === " " ? "reach" : ""} style={{ ["--dx" as string]: "0px", ["--dy" as string]: "-10px" }}>
        <rect x={205} y={3 * P + 2} width={60} height={28} rx={14} fill={k === " " ? "#ffd166" : "#f2c9a5"} stroke="#c98f6b" strokeWidth={1.5} />
      </g>
      <rect x={290} y={3 * P + 2} width={60} height={28} rx={14} fill="#f2c9a5" stroke="#c98f6b" strokeWidth={1.5} />
      {(Object.keys(HOME) as FingerId[]).map(finger)}
    </svg>
  );
}
