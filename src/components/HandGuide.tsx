import { useEffect, useState } from "react";

// Animated hands over a keyboard. The finger that owns the target key glows
// and reaches from its home key to the target and back, over and over, so
// Dev can see exactly which finger moves and where.
//
// Capital letters are a two-finger move, so they play as four clear steps:
// (1) the opposite pinky holds Shift, (2) the letter finger presses the key
// while Shift stays down, (3) both let go, (4) everyone rests on home row.

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
  if (ch !== k) {
    const sh = f.startsWith("l") ? "right" : "left";
    return `Capital ${k.toUpperCase()} is a two-finger move! 1) Your ${sh} pinky holds down Shift. 2) Keep holding, and your ${NAMES[f]} presses ${k.toUpperCase()}. 3) Let go of both and go back home.`;
  }
  const shift = "";
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

export const CAP_STEPS = ["Hold Shift", "Press the letter", "Let go of both"];

/** Steps for a capital: 0 rest, 1 shift down, 2 letter down (shift held), 3 release. */
function useCapPhase(on: boolean) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    if (!on) return setPhase(0);
    const durs = [700, 900, 1100, 700];
    let p = 0;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      p = (p + 1) % 4;
      setPhase(p);
      t = setTimeout(tick, durs[p]);
    };
    t = setTimeout(tick, durs[0]);
    return () => clearTimeout(t);
  }, [on]);
  return phase;
}

export default function HandGuide({ target, size = 1 }: { target: string; size?: number }) {
  const k = target.toLowerCase();
  const active = OWNER[k];
  const isUpper = target !== k && /[a-z]/.test(k);
  const shiftFinger: FingerId | null = isUpper ? (active?.startsWith("l") ? "rp" : "lp") : null;
  const phase = useCapPhase(isUpper);
  const shiftDown = isUpper && (phase === 1 || phase === 2);
  const letterDown = isUpper && phase === 2;
  const W = 580;
  const H = 300;
  const shiftPos = (f: FingerId) => ({ x: f === "lp" ? 26 : 528, y: 2 * P + 20 });

  const finger = (f: FingerId) => {
    const home = keyPos(HOME[f])!;
    let goal: { x: number; y: number } | null = null;
    let moving = false;
    if (isUpper) {
      if (f === shiftFinger) { goal = shiftPos(f); moving = shiftDown; }
      if (f === active) { goal = keyPos(k); moving = letterDown; }
    } else if (f === active) {
      goal = keyPos(k);
    }
    const dx = goal ? goal.x - home.x : 0;
    const dy = goal ? goal.y - home.y : 0;
    const len = f === "lm" || f === "rm" ? 150 : f === "lp" || f === "rp" ? 125 : 140;
    const on = goal !== null;
    const style = isUpper
      ? { transform: moving ? `translate(${dx}px, ${dy}px)` : "translate(0, 0)", transition: "transform .35s ease-in-out" }
      : { ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px` };
    return (
      <g key={f} className={on && !isUpper ? "reach" : ""} style={style}>
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
        {isUpper && on && (
          <g>
            <circle cx={home.x} cy={home.y + 34} r={12} fill="#1d1b3a" stroke="#fff" strokeWidth={2} />
            <text x={home.x} y={home.y + 39} textAnchor="middle" fontSize={14} fontWeight={900} fill="#fff">{f === shiftFinger ? 1 : 2}</text>
          </g>
        )}
      </g>
    );
  };

  const shiftFill = (side: FingerId) => (shiftFinger === side ? (shiftDown ? "#ff8fab" : "#ffd166") : "#2a2550");
  const shiftLabel = (side: FingerId) => (shiftFinger === side && shiftDown ? "HOLD" : "SHIFT");
  const keyFill = (key: string) => (key !== k ? "#2a2550" : isUpper ? (letterDown ? "#5ef0b0" : "#ffd166") : "#ffd166");

  return (
    <div className="hand-guide">
      {isUpper && (
        <div className="cap-steps" aria-hidden>
          <span className="cap-badge">🤝 Two-finger move</span>
          {CAP_STEPS.map((t, i) => (
            <span key={t} className={`cap-step ${phase === i + 1 ? "on" : ""}`}><b>{i + 1}</b> {t}</span>
          ))}
          <span className="cap-screen" title="What shows on screen">
            {phase === 2 ? <b className="cap-pop">{k.toUpperCase()}</b> : <span className="muted">_</span>}
          </span>
        </div>
      )}
      <svg viewBox={`-10 -10 ${W} ${H}`} style={{ width: "100%", maxWidth: 620 * size, display: "block", margin: "0 auto" }} role="img" aria-label={describeReach(target)}>
        <rect x={-10} y={-10} width={W} height={4 * P + 10} rx={16} fill="rgba(0,0,0,0.25)" />
        {ROWS.map((row, r) =>
          [...row.keys].map((key, i) => {
            const isTarget = key === k;
            const f = OWNER[key];
            const pressed = isTarget && letterDown;
            return (
              <g key={key} transform={pressed ? "translate(0 3)" : undefined}>
                <rect x={row.off + i * P} y={r * P} width={40} height={40} rx={8} fill={keyFill(key)} stroke={f ? COLORS[f] : "#555"} strokeWidth={isTarget ? 3 : 1.5} className={isTarget && !isUpper ? "key-pulse" : ""} />
                <text x={row.off + i * P + 20} y={r * P + 26} textAnchor="middle" fontSize={16} fontWeight={800} fill={isTarget ? "#1d1b3a" : "#e8e6ff"} fontFamily="monospace">
                  {key.toUpperCase()}
                </text>
                {(key === "f" || key === "j") && <rect x={row.off + i * P + 14} y={r * P + 32} width={12} height={2.5} rx={1} fill="#e8e6ff" />}
              </g>
            );
          }),
        )}
        <g transform={shiftFinger === "lp" && shiftDown ? "translate(0 3)" : undefined}>
          <rect x={0} y={2 * P} width={50} height={40} rx={8} fill={shiftFill("lp")} stroke="#ff8fab" strokeWidth={shiftFinger === "lp" ? 3 : 1.5} />
          <text x={25} y={2 * P + 25} textAnchor="middle" fontSize={11} fill={shiftFinger === "lp" ? "#1d1b3a" : "#e8e6ff"} fontWeight={800}>{shiftLabel("lp")}</text>
        </g>
        <g transform={shiftFinger === "rp" && shiftDown ? "translate(0 3)" : undefined}>
          <rect x={496} y={2 * P} width={60} height={40} rx={8} fill={shiftFill("rp")} stroke="#ff8fab" strokeWidth={shiftFinger === "rp" ? 3 : 1.5} />
          <text x={526} y={2 * P + 25} textAnchor="middle" fontSize={11} fill={shiftFinger === "rp" ? "#1d1b3a" : "#e8e6ff"} fontWeight={800}>{shiftLabel("rp")}</text>
        </g>
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
    </div>
  );
}
