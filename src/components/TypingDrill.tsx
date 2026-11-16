import { useEffect, useRef, useState } from "react";
import HandGuide from "./HandGuide";

// Stop-on-error typing drill. The cursor waits until the right key is
// pressed, which trains accuracy before speed. A color-coded keyboard shows
// which finger owns the next key.

export type TypingResult = { wpm: number; acc: number; keys: Record<string, { hits: number; misses: number }> };

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
}: {
  lines: string[];
  onDone: (r: TypingResult) => void;
  timeLimit?: number; // seconds
  showKeyboard?: boolean;
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const [pos, setPos] = useState(0);
  const [errAt, setErrAt] = useState<number | null>(null);
  const [left, setLeft] = useState(timeLimit ?? 0);
  const stats = useRef({ start: 0, typed: 0, correct: 0, keys: {} as TypingResult["keys"], done: false });
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
    if (!st.start) st.start = Date.now();
    st.typed++;
    const want = line[pos];
    const k = (SHIFTED[want] ?? want).toLowerCase();
    const rec = (st.keys[k] ??= { hits: 0, misses: 0 });
    if (e.key === want) {
      st.correct++;
      rec.hits++;
      setErrAt(null);
      if (pos + 1 >= line.length) {
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
      <div className="type-line" aria-live="polite">
        {[...line].map((ch, i) => (
          <span key={i} className={i < pos ? "ok" : i === pos ? (errAt === i ? "err cur" : "cur") : "todo"}>
            {ch === " " && i === pos ? "␣" : ch}
          </span>
        ))}
      </div>
      <p className="small" style={{ marginTop: 10, minHeight: 24 }}>
        {next ? <>👉 {fingerFor(next)}</> : "Nice!"} {errAt !== null && <b style={{ color: "var(--bad)" }}> Oops, try that key again.</b>}
      </p>
      {showKeyboard && next && <HandGuide target={/[a-zA-Z]/.test(next) ? next : nextBase} size={0.9} />}
      <p className="small muted center" style={{ marginTop: 10 }}>
        Click here if typing stops working. Keep your eyes on the screen, not your hands!
      </p>
    </div>
  );
}
