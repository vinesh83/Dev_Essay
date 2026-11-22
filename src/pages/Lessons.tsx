import { useMemo, useState } from "react";
import { go } from "../App";
import Scene from "../components/Scene";
import { Coach } from "../components/Thinking";
import { toast, toastBadges } from "../components/Toast";
import { LESSONS, lessonById, type Exercise, type Lesson } from "../data/lessons";
import { sfx } from "../lib/sfx";
import { currentBlock, lessonFinished, todaysSession } from "../lib/schedule";
import { addXp, checkBadges, finishLesson, markMission, useStore, type State } from "../lib/store";
import { splitTransitions } from "../lib/structure";

// Writing School. A hub of lessons that unlock in order, and a lesson
// player that walks Dev through Learn -> See it -> Try it -> Done.

export const lessonUnlocked = (s: State, i: number) => i === 0 || !!s.lessons?.[LESSONS[i - 1].id];
export const nextLesson = (s: State) => LESSONS.find((l) => !s.lessons?.[l.id]);

export default function Lessons({ id }: { id?: string }) {
  const s = useStore();
  const lesson = lessonById(id);
  const idx = lesson ? LESSONS.indexOf(lesson) : -1;
  // The daily path may assign any lesson; outside the path they unlock in order.
  if (lesson && (lessonUnlocked(s, idx) || currentBlock(s)?.arg === lesson.id)) return <LessonPlayer key={lesson.id} lesson={lesson} />;

  const done = LESSONS.filter((l) => s.lessons?.[l.id]).length;
  return (
    <>
      <div className="card school-hero">
        <div className="school-cap" aria-hidden>🎓</div>
        <div>
          <h1 style={{ margin: 0 }}>Writing School</h1>
          <p className="muted" style={{ margin: "4px 0 10px" }}>Six short lessons with Professor Quill. Learn each move, see it, then try it yourself. Every lesson unlocks the next.</p>
          <div className="bar" style={{ maxWidth: 320 }}><div style={{ width: `${(done / LESSONS.length) * 100}%` }} /></div>
          <small className="muted">{done} of {LESSONS.length} lessons done</small>
        </div>
      </div>
      <div className="grid three lesson-grid">
        {LESSONS.map((l, i) => {
          const rec = s.lessons?.[l.id];
          const open = lessonUnlocked(s, i);
          return (
            <button key={l.id} className={`card lesson-card ${rec ? "done" : ""} ${open ? "" : "locked"}`} disabled={!open} onClick={() => go("lessons", l.id)}>
              <div className="lesson-num">Lesson {i + 1}</div>
              <div className="lesson-icon">{open ? l.icon : "🔒"}</div>
              <h3>{l.title}</h3>
              <p className="small muted">{l.tagline}</p>
              <div className="stars" aria-label={`${rec?.stars ?? 0} stars`}>
                {[1, 2, 3].map((n) => <span key={n} className={rec && rec.stars >= n ? "on" : ""}>★</span>)}
              </div>
              <span className="pill">{rec ? "Replay ▶" : open ? "Start ▶ +40 XP" : `Finish lesson ${i} first`}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- One lesson ---------------- */

type Phase = "learn" | "model" | "practice" | "done";

function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const s = useStore();
  // On the daily path there is no lesson menu. Days 2 and 3 of a unit are a
  // quick review: the labeled example, then the practice.
  const [onPath] = useState(() => !!currentBlock(s));
  const [review] = useState(() => onPath && todaysSession(s).part > 1 && !!s.lessons?.[lesson.id]);
  const [phase, setPhase] = useState<Phase>(review ? "model" : "learn");
  const [card, setCard] = useState(0);
  const [ex, setEx] = useState(0);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState<{ stars: number; first: boolean } | null>(null);

  const total = lesson.teach.length + 1 + lesson.practice.length;
  const at = phase === "learn" ? card : phase === "model" ? lesson.teach.length : phase === "practice" ? lesson.teach.length + 1 + ex : total;

  const finish = () => {
    const stars = misses <= 1 ? 3 : misses <= 3 ? 2 : 1;
    const first = finishLesson(lesson.id, stars);
    markMission("lesson");
    lessonFinished();
    toastBadges(checkBadges());
    sfx.fanfare();
    setResult({ stars, first });
    setPhase("done");
  };

  return (
    <>
      <div className="row" style={{ marginBottom: 10 }}>
        {onPath ? <b>{review ? "🔁 Quick review" : "🆕 New lesson"}</b> : <button className="btn ghost small-btn" onClick={() => go("lessons")}>← Writing School</button>}
        <span className="spacer" />
        <div className="lesson-phases">
          {(["learn", "model", "practice"] as Phase[]).map((p, i) => (
            <span key={p} className={`pill ${phase === p ? "" : "warn"}`} style={{ opacity: phase === p ? 1 : 0.6 }}>{["📖 Learn", "👀 See it", "✏️ Try it"][i]}</span>
          ))}
        </div>
      </div>
      <div className="bar lesson-bar"><div style={{ width: `${(at / total) * 100}%` }} /></div>

      <div className="writer">
        <div className="card">
          <h2>{lesson.icon} {lesson.title}</h2>

          {phase === "learn" && (
            <>
              <Coach>
                <b>{lesson.teach[card].title}</b>
                <p style={{ margin: "6px 0" }}>{lesson.teach[card].body}</p>
                {lesson.teach[card].examples && (
                  <ul className="teach-ex">
                    {lesson.teach[card].examples!.map((e) => <li key={e}>{e}</li>)}
                  </ul>
                )}
              </Coach>
              <div className="row">
                <span className="small muted">Card {card + 1} of {lesson.teach.length}</span>
                <span className="spacer" />
                {card > 0 && <button className="btn ghost" onClick={() => setCard(card - 1)}>← Back</button>}
                <button className="btn" onClick={() => (card < lesson.teach.length - 1 ? setCard(card + 1) : setPhase("model"))}>
                  {card < lesson.teach.length - 1 ? "Next →" : "Show me an example →"}
                </button>
              </div>
            </>
          )}

          {phase === "model" && (
            <>
              <h3>👀 {lesson.model.title}</h3>
              <ModelView lesson={lesson} />
              <p className="small muted">{lesson.model.note}</p>
              <div className="row">
                <button className="btn ghost" onClick={() => { setPhase("learn"); setCard(lesson.teach.length - 1); }}>← Back</button>
                <span className="spacer" />
                <button className="btn" onClick={() => setPhase("practice")}>I'm ready to try it →</button>
              </div>
            </>
          )}

          {phase === "practice" && (
            <ExerciseView
              key={ex}
              ex={lesson.practice[ex]}
              n={ex + 1}
              of={lesson.practice.length}
              onMiss={() => setMisses((m) => m + 1)}
              onNext={() => (ex < lesson.practice.length - 1 ? setEx(ex + 1) : finish())}
            />
          )}

          {phase === "done" && result && (
            <div className="center lesson-done">
              <div className="results-stage"><Scene s={s} height={200} three layout="stage" mood="cheer" label={false} /></div>
              <div className="big-stars">
                {[1, 2, 3].map((n) => <span key={n} className={result.stars >= n ? "on" : ""} style={{ animationDelay: `${n * 0.25}s` }}>★</span>)}
              </div>
              <h2>Lesson complete!</h2>
              <p>{result.first ? "+40 XP and +30 coins!" : "+10 XP and +5 coins for practicing again."} {result.stars < 3 && "Replay it any time to earn 3 stars."}</p>
              <p className="muted">🐾 Ellie is doing a happy spin for you!</p>
              {onPath ? (
                <p className="big-guide"><b>Next step is starting…</b></p>
              ) : (
              <div className="row" style={{ justifyContent: "center" }}>
                <button className="btn ghost" onClick={() => go("lessons")}>All lessons</button>
                {LESSONS[LESSONS.indexOf(lesson) + 1] ? (
                  <button className="btn" onClick={() => go("lessons", LESSONS[LESSONS.indexOf(lesson) + 1].id)}>Next lesson →</button>
                ) : (
                  <button className="btn" onClick={() => go("write")}>Use it in an essay ✍️</button>
                )}
              </div>
              )}
            </div>
          )}
        </div>

        <aside>
          <div className="card recipe-card">
            <h3>📋 The recipe</h3>
            <div className={`recipe-stack ${lesson.id === "burger" ? "burger-stack" : ""}`}>
              {lesson.recipe.map((r) => (
                <div key={r.label} className="recipe-layer">
                  <span className="rl-icon">{r.icon}</span>
                  <span><b>{r.label}</b><small>{r.detail}</small></span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function Marked({ text }: { text: string }) {
  return <>{splitTransitions(text).map((p, i) => (p.mark ? <mark key={i} className="trans-mark">{p.t}</mark> : <span key={i}>{p.t}</span>))}</>;
}

function ModelView({ lesson }: { lesson: Lesson }) {
  const [focus, setFocus] = useState<number | null>(null);
  const blocks = lesson.id === "burger";
  return (
    <>
      <div className="model-legend">
        {lesson.model.parts.map((p, i) => (
          <button key={i} className={`model-tag ${focus === i ? "on" : ""}`} style={{ borderColor: p.color, background: focus === i ? p.color : undefined }} onClick={() => setFocus(focus === i ? null : i)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className={`model-text ${blocks ? "blocks" : ""}`}>
        {lesson.model.parts.map((p, i) => {
          const style = { background: `${p.color}${focus === null || focus === i ? "40" : "12"}`, borderColor: p.color, opacity: focus === null || focus === i ? 1 : 0.45 };
          return blocks ? (
            <p key={i} className="model-part" style={style} onClick={() => setFocus(i)}>
              <span className="mp-label" style={{ background: p.color }}>{p.label}</span>
              <Marked text={p.text} />
            </p>
          ) : (
            <span key={i} className="model-part inline" style={style} onClick={() => setFocus(i)}>
              <Marked text={p.text} />{" "}
            </span>
          );
        })}
      </div>
    </>
  );
}

/* ---------------- Exercises ---------------- */

function shuffle<T>(xs: T[], seed: number) {
  const a = xs.map((x, i) => ({ x, k: Math.sin(seed * 97 + i * 31) }));
  a.sort((p, q) => p.k - q.k);
  const out = a.map((p) => p.x);
  return out.every((x, i) => x === xs[i]) ? [...out.slice(1), out[0]] : out;
}

function ExerciseView({ ex, n, of, onMiss, onNext }: { ex: Exercise; n: number; of: number; onMiss: () => void; onNext: () => void }) {
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState<number | null>(null);
  const [firstTry, setFirstTry] = useState(true);

  const right = () => {
    setSolved(true);
    sfx.right();
    if (firstTry) {
      addXp(5, 2);
      toast("⭐ First try! +5 XP, +2 coins");
    }
  };
  const miss = (i: number) => {
    setWrong(i);
    setFirstTry(false);
    onMiss();
    sfx.wrong();
    setTimeout(() => setWrong(null), 600);
  };

  return (
    <div className="exercise">
      <div className="small muted">Practice {n} of {of}</div>
      <h3>{ex.q}</h3>

      {ex.kind === "pick" && (
        <div className="ex-options">
          {ex.options.map((o, i) => (
            <button key={i} className={`choice ${solved && i === ex.answer ? "right" : ""} ${wrong === i ? "wrong shake" : ""}`} disabled={solved} onClick={() => (i === ex.answer ? right() : miss(i))}>
              {o}
            </button>
          ))}
        </div>
      )}

      {ex.kind === "find" && (
        <p className="find-text">
          {ex.sentences.map((t, i) => (
            <span key={i} className={`find-s ${solved && i === ex.answer ? "right" : ""} ${wrong === i ? "wrong shake" : ""}`} onClick={() => !solved && (i === ex.answer ? right() : miss(i))}>
              {t}{" "}
            </span>
          ))}
        </p>
      )}

      {ex.kind === "order" && <OrderEx ex={ex} solved={solved} onRight={right} onMiss={() => miss(-1)} />}

      {ex.kind === "write" && <WriteEx ex={ex} solved={solved} onRight={right} onStuck={() => { setFirstTry(false); onMiss(); }} />}

      {solved && (
        <div className="ex-feedback">
          <b>{firstTry ? "🎉 Perfect!" : "✅ You got it!"}</b> {"why" in ex ? ex.why : "Great writing. Compare it with the sample below if you like."}
          {ex.kind === "write" && <div className="demo" style={{ marginTop: 8 }}><div className="demo-tag">Sample</div><Marked text={ex.sample} /></div>}
          <div className="row" style={{ marginTop: 10 }}>
            <span className="spacer" />
            <button className="btn" onClick={onNext}>{n < of ? "Next →" : "Finish lesson 🏁"}</button>
          </div>
        </div>
      )}
      {!solved && wrong !== null && <p className="small" style={{ color: "#ffb3c0" }}>Not quite. Try again!</p>}
    </div>
  );
}

function OrderEx({ ex, solved, onRight, onMiss }: { ex: Extract<Exercise, { kind: "order" }>; solved: boolean; onRight: () => void; onMiss: () => void }) {
  const mixed = useMemo(() => shuffle(ex.items.map((_, i) => i), ex.items.length + ex.items[0].length), [ex]);
  const [built, setBuilt] = useState<number[]>([]);
  const [bad, setBad] = useState<number | null>(null);
  const tap = (i: number) => {
    if (solved || built.includes(i)) return;
    if (i === built.length) {
      const next = [...built, i];
      setBuilt(next);
      sfx.key(next.length * 5);
      if (next.length === ex.items.length) onRight();
    } else {
      setBad(i);
      onMiss();
      setTimeout(() => setBad(null), 600);
    }
  };
  return (
    <>
      <div className="order-built">
        {built.map((i, k) => (
          <div key={i} className="order-item placed"><span className="order-n">{k + 1}</span>{ex.items[i]}</div>
        ))}
        {!solved && <div className="order-slot">Tap what comes {built.length === 0 ? "first" : "next"} ⬇️</div>}
      </div>
      <div className="order-pool">
        {mixed.filter((i) => !built.includes(i)).map((i) => (
          <button key={i} className={`order-item ${bad === i ? "wrong shake" : ""}`} onClick={() => tap(i)}>{ex.items[i]}</button>
        ))}
      </div>
    </>
  );
}

const wc = (t: string) => (t.match(/[A-Za-z']+/g) ?? []).length;

function WriteEx({ ex, solved, onRight, onStuck }: { ex: Extract<Exercise, { kind: "write" }>; solved: boolean; onRight: () => void; onStuck: () => void }) {
  const [text, setText] = useState("");
  const [tried, setTried] = useState(0);
  const checks = ex.check(text);
  const okWords = wc(text) >= ex.minWords;
  const allOk = okWords && checks.every((c) => c.ok);
  const add = (s: string) => setText((t) => (t.trim() ? `${t.trimEnd()} ${s} ` : `${s} `));
  return (
    <>
      <div className="write-prompt">📝 {ex.prompt}</div>
      <div className="chips">
        {ex.starters.map((s) => <button key={s} type="button" className="chip" onClick={() => add(s)}>{s}</button>)}
      </div>
      <textarea className="essay-box para-box" value={text} disabled={solved} spellCheck={false} autoCorrect="off" autoCapitalize="off" onChange={(e) => setText(e.target.value)} placeholder="Type here. Use the word bank if you need it." />
      <div className="live-checks">
        <span className={`lc ${okWords ? "ok" : ""}`}>{okWords ? "✅" : "⬜"} {wc(text)}/{ex.minWords} words</span>
        {checks.map((c) => (
          <span key={c.label} className={`lc ${c.ok ? "ok" : ""}`} title={c.tip}>{c.ok ? "✅" : "⬜"} {c.label}</span>
        ))}
      </div>
      {!solved && (
        <div className="row" style={{ marginTop: 8 }}>
          {tried >= 1 && !allOk && (
            <button className="btn ghost small-btn" onClick={() => { onStuck(); onRight(); }}>😅 I'm stuck. Show me the sample.</button>
          )}
          <span className="spacer" />
          <button className="btn" disabled={!okWords} onClick={() => (allOk ? onRight() : (setTried(tried + 1), sfx.wrong()))}>Check my writing ✔</button>
        </div>
      )}
      {!solved && tried > 0 && !allOk && (
        <div className="hint">{checks.filter((c) => !c.ok).map((c) => <div key={c.label}>👉 {c.tip}</div>)}</div>
      )}
    </>
  );
}
