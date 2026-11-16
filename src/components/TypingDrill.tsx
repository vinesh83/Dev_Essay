import { useEffect, useRef, useState } from "react";
import { sfx } from "../lib/sfx";
import { addXp } from "../lib/store";
import HandGuide from "./HandGuide";

// Stop-on-error typing drill. The cursor waits until the right key is
// pressed, which trains accuracy before speed. A color-coded keyboard shows
// which finger owns the next key.

export type TypingResult = { wpm: number; acc: number; keys: Record<string, { hits: number; misses: number }>; bestCombo?: number; points?: number; bonusCoins?: number };

// Instant rewards. Points and combos come only from correct keys, so care
// pays more than speed. A miss resets the combo, never the points.
const MILESTONES: [number, number, string][] = [
  [10, 1, "Nice combo!"], [25, 2, "Hot streak!"], [50, 3, "On fire!"], [75, 4, "Unstoppable!"],
  [100, 6, "LEGENDARY!"], [150, 8, "Super legendary!"], [200, 10, "Keyboard master!"],
];
const tier = (c: number) => (c >= 100 ? "t4" : c >= 50 ? "t3" : c >= 25 ? "t2" : c >= 10 ? "t1" : "t0");
type Pop = { id: number; text: string; big?: boolean; dx: number };

const FINGER: Record<string, [string, string]> = {};
const assign = (keys: string, cls: string, name: string) => [...keys].forEach((k) => (FINGER[k] = [cls, name]));
assign("`1qaz", "f-lp", "left pinky");
assign("2wsx", "f-lr", "left ring finger");
assign("3edc", "f-lm", "left middle finger");
assign("45rtfgvb", "f-li", "left pointer finger");
assign("67yuhjnm", "f-ri", "right pointer finger");
assign("8ik,", "f-rm", "right middle finger");
assign("9ol.", "f-rr", "right ring finger");
assign("0-=p[]\\;'/", "f-rp", "right pinky");
assign(" ", "f-th", "thumb");

const HOME_SEQ = "asdfjkl;";
const HOME_FINGER = ["left pinky", "left ring", "left middle", "left pointer", "right pointer", "right middle", "right ring", "right pinky"];
const FCLASS = ["f-lp", "f-lr", "f-lm", "f-li", "f-ri", "f-rm", "f-rr", "f-rp"];

const LEFT = new Set("`12345qwertasdfgzxcvb");
const SHIFTED: Record<string, string> = { "?": "/", ":": ";", '"': "'", "!": "1", "<": ",", ">": "." };

export function fingerFor(ch: string): string {
  if (ch === " ") return "Space bar: either thumb.";
  const base = SHIFTED[ch] ?? ch.toLowerCase();
  const f = FINGER[base]?.[1];
  if (!f) return "";
  const upper = ch !== base;
  return upper ? `Shift with your ${LEFT.has(base) ? "right" : "left"} pinky, then ${f}.` : `Use your ${f}.`;
}

export default function TypingDrill({
  lines,
  onDone,
  timeLimit,
  showKeyboard = true,
  homeCheck = true,
}: {
  lines: string[];
  onDone: (r: TypingResult) => void;
  timeLimit?: number; // seconds
  showKeyboard?: boolean;
  homeCheck?: boolean; // make Dev press a s d f j k l ; before starting
}) {
  const [homeOk, setHomeOk] = useState(!homeCheck);
  const [homeProg, setHomeProg] = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [errAt, setErrAt] = useState<number | null>(null);
  const [left, setLeft] = useState(timeLimit ?? 0);
  const stats = useRef({ start: 0, typed: 0, correct: 0, keys: {} as TypingResult["keys"], done: false, combo: 0, best: 0, points: 0, coins: 0, lineMiss: false });
  const [combo, setCombo] = useState(0);
  const [points, setPoints] = useState(0);
  const [pops, setPops] = useState<Pop[]>([]);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const popId = useRef(0);
  const pop = (text: string, big = false) => {
    const id = ++popId.current;
    setPops((ps) => [...ps.slice(-5), { id, text, big, dx: Math.round((Math.random() - 0.5) * 60) }]);
    setTimeout(() => setPops((ps) => ps.filter((p) => p.id !== id)), 900);
  };
  const shout = (text: string) => {
    const id = ++popId.current;
    setBanner({ id, text });
    setTimeout(() => setBanner((b) => (b?.id === id ? null : b)), 1400);
  };
  const reward = (coins: number, text: string) => {
    stats.current.coins += coins;
    addXp(coins, coins);
    sfx.coin();
    shout(text);
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const line = lines[lineIdx] ?? "";
  const next = line[pos];

  const finish = () => {
    const st = stats.current;
    if (st.done) return;
    st.done = true;
    const minutes = Math.max((Date.now() - st.start) / 60000, 1 / 60);
    onDone({
      wpm: Math.min(200, Math.round(st.correct / 5 / minutes)),
      acc: st.typed ? Math.round((st.correct / st.typed) * 100) : 0,
      keys: st.keys,
      bestCombo: st.best,
      points: st.points,
      bonusCoins: st.coins,
    });
  };

  useEffect(() => {
    if (!timeLimit) return;
    const t = setInterval(() => {
      if (!stats.current.start) return;
      const remaining = timeLimit - Math.floor((Date.now() - stats.current.start) / 1000);
      setLeft(Math.max(0, remaining));
      if (remaining <= 0) finish();
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLimit]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const st = stats.current;
    if (st.done || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    if (!homeOk) {
      if (e.key === " ") return;
      if (e.key.toLowerCase() === HOME_SEQ[homeProg]) {
        sfx.key(homeProg * 5);
        if (homeProg + 1 >= HOME_SEQ.length) {
          setHomeOk(true);
          sfx.right();
        } else setHomeProg(homeProg + 1);
      } else sfx.miss();
      return;
    }
    if (!st.start) st.start = Date.now();
    st.typed++;
    const want = line[pos];
    const k = (SHIFTED[want] ?? want).toLowerCase();
    const rec = (st.keys[k] ??= { hits: 0, misses: 0 });
    if (e.key === want) {
      st.correct++;
      rec.hits++;
      setErrAt(null);
      st.combo++;
      st.best = Math.max(st.best, st.combo);
      const mult = 1 + Math.floor(st.combo / 25);
      st.points += mult;
      setCombo(st.combo);
      setPoints(st.points);
      sfx.key(st.combo);
      pop(`+${mult}`);
      const m = MILESTONES.find(([n]) => n === st.combo) ?? (st.combo > 200 && st.combo % 50 === 0 ? [st.combo, 10, "Keyboard master!"] : null);
      if (m) {
        reward(m[1], `🔥 ${m[0]} combo! ${m[2]} +${m[1]} 🪙`);
        sfx.combo(MILESTONES.findIndex(([n]) => n === m[0]) + 1);
      }
      if (pos + 1 >= line.length) {
        if (!st.lineMiss && line.length >= 8) {
          reward(2, "✨ Perfect line! +2 🪙");
          pop("PERFECT!", true);
        }
        st.lineMiss = false;
        if (lineIdx + 1 >= lines.length) {
          setPos(pos + 1);
          finish();
        } else {
          setLineIdx(lineIdx + 1);
          setPos(0);
        }
      } else setPos(pos + 1);
    } else {
      rec.misses++;
      setErrAt(pos);
      st.lineMiss = true;
      if (st.combo >= 10) pop("combo lost", true);
      st.combo = 0;
      setCombo(0);
      sfx.miss();
    }
  };

  const nextBase = next ? (SHIFTED[next] ?? next).toLowerCase() : "";

  return (
    <div onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        className="hidden-input"
        onKeyDown={onKey}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        aria-label="Type here"
      />
      <div className="row" style={{ marginBottom: 8 }}>
        <span className="muted small">
          Line {Math.min(lineIdx + 1, lines.length)} of {lines.length}
        </span>
        <span className="spacer" />
        {timeLimit ? <span className={`timer ${left <= 10 ? "low" : ""}`}>{stats.current.start ? left : timeLimit}s</span> : null}
      </div>
      <div className="combo-hud">
        <div className={`combo ${tier(combo)}`} aria-live="off">
          <span className="combo-flame" aria-hidden>{combo >= 10 ? "🔥" : "✨"}</span>
          <span><b>{combo}</b><small>combo</small></span>
          <span className="combo-mult">x{1 + Math.floor(combo / 25)}</span>
          <div className="combo-bar"><div style={{ width: `${((combo % 25) / 25) * 100}%` }} /></div>
          {pops.map((p) => (
            <span key={p.id} className={`pop ${p.big ? "big" : ""}`} style={{ ["--dx" as string]: `${p.dx}px` }}>{p.text}</span>
          ))}
        </div>
        <div className="points"><b>{points}</b><small>points</small></div>
        {banner && <div key={banner.id} className="combo-banner">{banner.text}</div>}
      </div>
      {!homeOk ? (
        <div className="home-check">
          <h3>🖐️ Fingers on the home row!</h3>
          <p className="small">Put your fingers on their home keys. Feel the bumps on <b>F</b> and <b>J</b>. Then press each home key once, in order, to start.</p>
          <div className="home-keys">
            {[...HOME_SEQ].map((k, i) => (
              <span key={k} className={`home-key ${FCLASS[i]} ${i < homeProg ? "done" : i === homeProg ? "now" : ""}`}>
                <b>{k.toUpperCase()}</b>
                <small>{HOME_FINGER[i]}</small>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="type-line" aria-live="polite">
          {[...line].map((ch, i) => (
            <span key={i} className={`${i < pos ? "ok" : i === pos ? (errAt === i ? "err cur" : "cur") : "todo"} ${FINGER[(SHIFTED[ch] ?? ch).toLowerCase()]?.[0] ?? ""}`}>
              {ch === " " && i === pos ? "␣" : ch}
            </span>
          ))}
        </div>
      )}
      <p className="finger-say" style={{ marginTop: 10, minHeight: 30 }}>
        {homeOk && next ? (
          <span className={`finger-pill ${FINGER[nextBase]?.[0] ?? ""}`}>👉 {fingerFor(next)}</span>
        ) : homeOk ? "Nice!" : null}{" "}
        {errAt !== null && <b style={{ color: "var(--bad)" }}> Oops, try that key again.</b>}
      </p>
      {showKeyboard && (homeOk ? next : HOME_SEQ[homeProg]) && <HandGuide target={homeOk ? (/[a-zA-Z]/.test(next!) ? next! : nextBase) : HOME_SEQ[homeProg]} size={0.9} />}
      <p className="small muted center" style={{ marginTop: 10 }}>
        Click here if typing stops working. Keep your eyes on the screen, not your hands!
      </p>
    </div>
  );
}
