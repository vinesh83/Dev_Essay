import { useState } from "react";
import HandGuide, { describeReach, homeKeyFor } from "../components/HandGuide";
import TypingDrill, { type TypingResult } from "../components/TypingDrill";
import { toast, toastBadges } from "../components/Toast";
import { TYPING_LEVELS, TYPING_TARGET_ACCURACY, TYPING_TARGET_WPM, TYPING_TEST_TEXT } from "../data/typing";
import { currentTypingLevel, levelPassed } from "../lib/coach";
import { addXp, checkBadges, getState, giveChest, markMission, update, useStore, type State } from "../lib/store";

const WORDS =
  `because believe opinion reason example important people should would could think friend school reading writing learn healthy garden recess students teacher family quiet every however finally another conclusion strong evidence explain better world jump quick zebra puzzle oxygen vexing wax quiz jazz kayak yellow happy lucky village vivid brave brown dozen fuzzy exact next box mix wizard frozen queen quack squid equal fox six taxi relax zoo zip buzz lazy size prize jam joke juice enjoy king kite bake keep van very give move wave vote yes yard play story yummy`.split(
    " ",
  );

/** Keys Dev misses most, worst first. */
export function weakKeys(s: State, n = 4): string[] {
  return Object.entries(s.keyStats)
    .filter(([k, v]) => /[a-z]/.test(k) && v.hits + v.misses >= 5)
    .map(([k, v]) => ({ k, rate: v.misses / (v.hits + v.misses) }))
    .filter((x) => x.rate > 0.04)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, n)
    .map((x) => x.k);
}

function weakLines(keys: string[]): string[] {
  const pool = WORDS.filter((w) => keys.some((k) => w.includes(k)));
  const pick = () => pool[Math.floor(Math.random() * pool.length)];
  return Array.from({ length: 4 }, () => Array.from({ length: 6 }, pick).join(" "));
}

/** Lines that drill one letter: home-key bounces, then real words. */
export function letterLines(ch: string): string[] {
  const h = homeKeyFor(ch) || ch;
  const bounce = ch === h ? `${h}${h}${h} ` : `${h}${ch}${h} `;
  const words = WORDS.filter((w) => w.includes(ch));
  const pick = () => words[Math.floor(Math.random() * words.length)] ?? ch;
  return [
    bounce.repeat(5).trim(),
    `${ch}${ch} ${h}${ch} ${ch}${h} `.repeat(3).trim(),
    Array.from({ length: 5 }, pick).join(" "),
    Array.from({ length: 5 }, pick).join(" "),
  ];
}

const LETTER_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];

type Mode = { kind: "level"; id: number } | { kind: "weak"; keys: string[] } | { kind: "test" } | { kind: "letter"; ch: string; watching: boolean };

export default function Typing() {
  const s = useStore();
  const [mode, setMode] = useState<Mode | null>(null);
  const [result, setResult] = useState<(TypingResult & { label: string; passed?: boolean }) | null>(null);
  const [run, setRun] = useState(0);
  const cur = currentTypingLevel(s);
  const weak = weakKeys(s);

  const saveKeys = (r: TypingResult) =>
    update((st) => {
      for (const [k, v] of Object.entries(r.keys)) {
        const rec = (st.keyStats[k] ??= { hits: 0, misses: 0 });
        rec.hits += v.hits;
        rec.misses += v.misses;
      }
    });

  const done = (r: TypingResult) => {
    saveKeys(r);
    if (!mode) return;
    if (mode.kind === "level") {
      const id = mode.id;
      update((st) => {
        const prev = st.typing.levelBest[id];
        if (!prev || r.acc > prev.acc || (r.acc === prev.acc && r.wpm > prev.wpm)) st.typing.levelBest[id] = { wpm: r.wpm, acc: r.acc };
      });
      const lvl = TYPING_LEVELS.find((l) => l.id === id)!;
      const passed = r.acc >= 90 && (id < 7 || r.wpm >= 12);
      const firstPass = passed && !getState().badges.includes(`lvl${id}`);
      if (firstPass) {
        update((st) => void st.badges.push(`lvl${id}`)); // private marker, not shown as a badge
        giveChest("wood", `passing typing level ${id}`);
      }
      addXp(passed ? 20 : 8, passed ? 20 : 8);
      setResult({ ...r, label: lvl.name, passed });
    } else if (mode.kind === "test") {
      update((st) => void st.typing.tests.push({ date: new Date().toISOString(), wpm: r.wpm, acc: r.acc }));
      addXp(15);
      setResult({ ...r, label: "1-minute speed test" });
    } else if (mode.kind === "letter") {
      addXp(10);
      setResult({ ...r, label: `Letter Lab: ${mode.ch.toUpperCase()}` });
    } else {
      addXp(12);
      setResult({ ...r, label: `Weak keys: ${mode.keys.join(" ").toUpperCase()}` });
    }
    if (markMission("typing")) toast("🎉 Daily quest complete! +25 bonus coins");
    toastBadges(checkBadges());
  };

  const start = (m: Mode) => {
    setResult(null);
    setMode(m);
    setRun((n) => n + 1);
  };

  if (mode?.kind === "letter" && mode.watching && !result) {
    return (
      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>🔤 Letter Lab: {mode.ch.toUpperCase()}</h2>
          <span className="spacer" />
          <button className="btn ghost" onClick={() => setMode(null)}>Back</button>
        </div>
        <p style={{ fontSize: "1.15rem", marginTop: 10 }}>{describeReach(mode.ch)}</p>
        <HandGuide target={mode.ch} />
        <p className="muted small center">Watch the glowing finger. Try the reach on your own keyboard 3 times, then practice.</p>
        <div className="center">
          <button className="btn big" onClick={() => start({ kind: "letter", ch: mode.ch, watching: false })}>I'm ready, let's practice ▶</button>
        </div>
      </div>
    );
  }

  if (mode && !result) {
    const lines =
      mode.kind === "level"
        ? TYPING_LEVELS.find((l) => l.id === mode.id)!.lines
        : mode.kind === "weak"
          ? weakLines(mode.keys)
          : mode.kind === "letter"
            ? letterLines(mode.ch)
            : [TYPING_TEST_TEXT, TYPING_TEST_TEXT];
    const tip = mode.kind === "level" ? TYPING_LEVELS.find((l) => l.id === mode.id)!.tip : mode.kind === "test" ? "Type as far as you can in one minute. Accuracy counts!" : mode.kind === "letter" ? describeReach(mode.ch) : "These words use the keys you miss most. Slow and correct beats fast and wrong.";
    return (
      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>{mode.kind === "level" ? `Level ${mode.id}` : mode.kind === "test" ? "Speed Test" : mode.kind === "letter" ? `Letter Lab: ${mode.ch.toUpperCase()}` : "Weak-Key Training"}</h2>
          <span className="spacer" />
          <button className="btn ghost" onClick={() => setMode(null)}>
            Back
          </button>
        </div>
        <p className="muted">{tip}</p>
        <TypingDrill key={run} lines={lines} onDone={done} timeLimit={mode.kind === "test" ? 60 : undefined} />
      </div>
    );
  }

  return (
    <>
      {result && (
        <div className="card center">
          <div className="confetti" style={{ fontSize: 48 }}>
            {result.passed === false ? "💪" : "⭐"}
          </div>
          <h2>{result.label}</h2>
          <div className="row" style={{ justifyContent: "center", gap: 24, fontSize: "1.3rem" }}>
            <div>
              <b>{result.wpm}</b> <span className="muted small">WPM</span>
            </div>
            <div>
              <b>{result.acc}%</b> <span className="muted small">accuracy</span>
            </div>
          </div>
          {result.passed === true && <p className="pill good" style={{ marginTop: 10 }}>Level passed!</p>}
          {result.passed === false && <p className="muted">To pass: 90% accuracy{mode?.kind === "level" && mode.id >= 7 ? " and 12+ WPM" : ""}. Slow down and use the right fingers.</p>}
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            {mode && <button className="btn ghost" onClick={() => start(mode)}>Try again</button>}
            <button className="btn" onClick={() => start({ kind: "level", id: currentTypingLevel(s).id })}>
              Next: Level {currentTypingLevel(s).id}
            </button>
          </div>
        </div>
      )}
      <div className="card">
        <div className="row">
          <h2 style={{ margin: 0 }}>Typing Dojo</h2>
          <span className="spacer" />
          <button className="btn ghost" onClick={() => start({ kind: "test" })}>⏱️ 1-min speed test</button>
          <button className="btn" onClick={() => start({ kind: "level", id: cur.id })}>
            Continue: Level {cur.id}
          </button>
        </div>
        <p className="muted" style={{ marginTop: 8 }}>
          Goal for test day: {TYPING_TARGET_WPM} words per minute at {TYPING_TARGET_ACCURACY}% accuracy, using the right fingers. Fingers rest on the home row (A S D F, J K L ;) and always come back home.
        </p>
        <div className="levels">
          {TYPING_LEVELS.map((l) => {
            const b = s.typing.levelBest[l.id];
            const passed = levelPassed(s, l.id);
            return (
              <button key={l.id} className={`level-btn ${passed ? "passed" : ""} ${l.id === cur.id ? "current" : ""}`} onClick={() => start({ kind: "level", id: l.id })}>
                <div className="small muted">Level {l.id} {passed ? "✅" : ""}</div>
                <b>{l.name}</b>
                <div className="small muted">{b ? `${b.wpm} WPM · ${b.acc}%` : "Not tried"}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="card">
        <h2>🔤 Letter Lab</h2>
        <p className="muted">Pick any letter. Animated hands show which finger presses it and how it reaches, then you practice just that letter. Colors show your accuracy on each key.</p>
        <div className="letter-grid">
          {LETTER_ROWS.map((row, r) => (
            <div key={r} className="kb-row" style={{ paddingLeft: r * 22 }}>
              {[...row].map((k) => {
                const st = s.keyStats[k];
                const n = st ? st.hits + st.misses : 0;
                const acc = n ? st!.hits / n : null;
                const cls = acc === null ? "" : acc >= 0.95 ? "lk-good" : acc >= 0.85 ? "lk-warn" : "lk-bad";
                return (
                  <button key={k} className={`letter-key ${cls}`} onClick={() => start({ kind: "letter", ch: k, watching: true })} title={acc === null ? "Not practiced yet" : `${Math.round(acc * 100)}% accurate`}>
                    {k.toUpperCase()}
                    {acc !== null && <small>{Math.round(acc * 100)}%</small>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h2>Weak-Key Training</h2>
        {weak.length ? (
          <>
            <p>
              You miss these keys most: <b style={{ fontFamily: "var(--mono)", fontSize: "1.2rem" }}>{weak.join(" ").toUpperCase()}</b>. Practice words packed with them.
            </p>
            <div className="row">
              <button className="btn" onClick={() => start({ kind: "weak", keys: weak })}>
                Train weak keys
              </button>
              {weak.map((k) => (
                <button key={k} className="btn ghost" onClick={() => start({ kind: "letter", ch: k, watching: true })}>
                  Watch how: {k.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="muted">Finish a few levels and the dojo will find the keys you miss most.</p>
        )}
      </div>
    </>
  );
}
