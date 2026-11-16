import { useMemo, useState } from "react";
import { go } from "../App";
import { toast, toastBadges } from "../components/Toast";
import { SKILLS, type Drill, type SkillId } from "../data/drills";
import { pickDrills, recordDrill, skillMastery } from "../lib/coach";
import { checkBadges, getState, markMission, useStore } from "../lib/store";

const norm = (t: string) => t.trim().replace(/\s+/g, " ").replace(/[’‘]/g, "'");

export default function Drills({ focus }: { focus?: string }) {
  const s = useStore();
  const focusSkill = focus && focus in SKILLS ? (focus as SkillId) : undefined;
  const [session, setSession] = useState(0);
  const queue = useMemo(() => pickDrills(getState(), 6, focusSkill), [session, focusSkill]);
  const [i, setI] = useState(0);
  const [answer, setAnswer] = useState("");
  const [picked, setPicked] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [retry, setRetry] = useState<Drill[]>([]);
  const all = [...queue, ...retry];
  const d = all[i];
  const mastery = skillMastery(s);

  const check = (ok: boolean) => {
    setVerdict(ok);
    recordDrill(d.id, ok);
    if (ok) setScore((n) => n + 1);
    // Missed items come back once at the end of this session.
    else if (!retry.includes(d) && i < queue.length) setRetry((r) => [...r, d]);
  };

  const nextItem = () => {
    setI(i + 1);
    setAnswer("");
    setPicked(null);
    setVerdict(null);
    if (i + 1 >= all.length) {
      if (markMission("drills")) toast("🎉 Daily quest complete! +25 bonus coins");
      toastBadges(checkBadges());
    }
  };

  const restart = () => {
    setSession((n) => n + 1);
    setI(0);
    setScore(0);
    setRetry([]);
    setVerdict(null);
    setAnswer("");
    setPicked(null);
  };

  if (!d) {
    return (
      <div className="card center">
        <div className="confetti" style={{ fontSize: 48 }}>🥋</div>
        <h2>Training complete!</h2>
        <p>
          You got <b>{score}</b> right and earned <b>{score * 5}</b> coins.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <button className="btn" onClick={restart}>Another round</button>
          <button className="btn ghost" onClick={() => go("home")}>Back to quest</button>
        </div>
        <SkillTable mastery={mastery} />
      </div>
    );
  }

  const sk = SKILLS[d.skill];
  return (
    <>
      <div className="card">
        <div className="row">
          <span className="pill">{sk.name}</span>
          <span className="muted small">
            {i + 1} / {all.length}
          </span>
          <span className="spacer" />
          <span className="small muted">Correct: {score}</span>
        </div>
        <div className="bar" style={{ margin: "10px 0 16px" }}>
          <div style={{ width: `${(i / all.length) * 100}%` }} />
        </div>

        {d.type === "fix" ? (
          <>
            <h3>Fix this sentence. Type it correctly:</h3>
            <p style={{ fontSize: "1.2rem", fontFamily: "var(--mono)" }}>{d.prompt}</p>
            <input
              className="fix-input"
              value={answer}
              spellCheck={false}
              autoFocus
              disabled={verdict !== null}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && verdict === null && answer.trim()) check([d.answer, ...(d.alts ?? [])].map(norm).includes(norm(answer)));
                else if (e.key === "Enter" && verdict !== null) nextItem();
              }}
              placeholder="Type the fixed sentence and press Enter"
            />
            {verdict === null && (
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" disabled={!answer.trim()} onClick={() => check([d.answer, ...(d.alts ?? [])].map(norm).includes(norm(answer)))}>
                  Check
                </button>
                <span className="small muted">Hint: {d.hint}</span>
              </div>
            )}
            {verdict !== null && (
              <div className={`feedback ${verdict ? "right" : "wrong"}`}>
                {verdict ? "✅ Perfect! +5 coins" : <>❌ Almost. The fixed sentence is: <b>{d.answer}</b></>}
              </div>
            )}
          </>
        ) : (
          <>
            <h3>{d.prompt}</h3>
            {d.choices.map((c, ci) => (
              <button
                key={ci}
                className={`choice ${verdict !== null && ci === d.correct ? "right" : ""} ${verdict === false && ci === picked ? "wrong" : ""}`}
                disabled={verdict !== null}
                onClick={() => {
                  setPicked(ci);
                  check(ci === d.correct);
                }}
              >
                {c}
              </button>
            ))}
            {verdict !== null && <div className={`feedback ${verdict ? "right" : "wrong"}`}>{verdict ? "✅ Yes! +5 coins. " : "❌ Not quite. "}{d.why}</div>}
          </>
        )}

        {verdict === false && <div className="lesson">📘 <b>Remember:</b> {sk.lesson}</div>}
        {verdict !== null && (
          <div className="row" style={{ marginTop: 14 }}>
            <span className="spacer" />
            <button className="btn" onClick={nextItem} autoFocus={d.type === "choose"}>
              Next →
            </button>
          </div>
        )}
      </div>
      {focusSkill && <p className="small muted center">Focused training: {sk.name}. <a href="#/drills">Mixed training</a></p>}
    </>
  );
}

function SkillTable({ mastery }: { mastery: Record<SkillId, number> }) {
  return (
    <div style={{ textAlign: "left", marginTop: 20 }}>
      <h3>Skill mastery</h3>
      {(Object.keys(SKILLS) as SkillId[]).map((k) => {
        const v = Math.round(mastery[k] * 100);
        return (
          <div key={k} className="rubric-row" style={{ gridTemplateColumns: "160px 1fr 50px" }}>
            <a href={`#/drills/${k}`}>{SKILLS[k].name}</a>
            <div className={`bar ${v >= 70 ? "good" : v >= 35 ? "warn" : "bad"}`}>
              <div style={{ width: `${Math.max(v, 3)}%` }} />
            </div>
            <span className="small muted">{v}%</span>
          </div>
        );
      })}
    </div>
  );
}
