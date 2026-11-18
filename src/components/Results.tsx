import { go } from "../App";
import { SKILLS } from "../data/drills";
import { STEPS, type StepId } from "../data/process";
import { lessonById } from "../data/lessons";
import { fixLesson } from "../lib/schedule";
import { useStore, type RubricScore } from "../lib/store";
import Scene from "./Scene";

const ROWS: { key: keyof RubricScore; name: string; max: number; levels: Record<number, string> }[] = [
  { key: "argument", name: "Opinion", max: 15, levels: { 15: "Clear and focused the whole way.", 10: "Stated, but not fully developed.", 5: "Present, but not developed.", 0: "Hard to find." } },
  { key: "organization", name: "Organization", max: 15, levels: { 15: "Strong intro, body, and conclusion.", 10: "Structure is there but uneven.", 5: "Intro or conclusion missing.", 0: "No clear structure." } },
  { key: "evidence", name: "Evidence", max: 15, levels: { 15: "Specific, well-chosen examples.", 10: "Some support, could be more specific.", 5: "Not enough support.", 0: "No support yet." } },
  { key: "expression", name: "Word Choice", max: 15, levels: { 15: "Precise, purposeful words.", 10: "Basic, general words.", 5: "Vague or limited words.", 0: "Hard to understand." } },
  { key: "conventions", name: "Conventions", max: 40, levels: { 40: "Few errors. Clean writing!", 20: "Several errors, still readable.", 0: "Many errors get in the way." } },
];

export function ScoreRing({ total }: { total: number }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const color = total >= 85 ? "var(--good)" : total >= 60 ? "var(--warn)" : "var(--bad)";
  return (
    <svg className="score-ring" viewBox="0 0 150 150" role="img" aria-label={`Score ${total} out of 100`}>
      <circle cx="75" cy="75" r={r} fill="none" stroke="var(--brand-soft)" strokeWidth="14" />
      <circle cx="75" cy="75" r={r} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" strokeDasharray={`${(total / 100) * c} ${c}`} transform="rotate(-90 75 75)" />
      <text x="75" y="82" textAnchor="middle" fontSize="38" fontWeight="800" fill="currentColor">{total}</text>
      <text x="75" y="104" textAnchor="middle" fontSize="13" fill="var(--muted)">out of 100</text>
    </svg>
  );
}

export default function Results({ score, coins, steps, onAgain }: { score: RubricScore; coins: number; steps?: StepId[]; onAgain: () => void }) {
  const s = useStore();
  return (
    <>
      <div className="card">
        <div className="row" style={{ gap: 24 }}>
          <ScoreRing total={score.total} />
          <div className="results-stage">
            <Scene s={s} height={200} three layout="stage" mood="cheer" label={false} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1>{score.total >= 90 ? "Legendary! 🏆" : score.total >= 75 ? "Great work! ⭐" : score.total >= 50 ? "Good progress! 💪" : "Every quest starts here! 🗺️"}</h1>
            <p>{score.summary}</p>
            <p className="pill good">+{coins} coins</p>
            <p className="small muted">🐾 Ellie is doing happy zoomies!</p>
            {score.source === "auto" && <p className="small muted">{score.note ?? "Built-in estimate. AI grading gives a more accurate score."}</p>}
            {score.source === "ai" && <p className="small muted">Scored with the Sudie TAG rubric by the AI coach.</p>}
          </div>
        </div>
      </div>
      <div className="grid two">
        <div className="card">
          <h2>Rubric</h2>
          {ROWS.map((row) => {
            const v = score[row.key] as number;
            return (
              <div key={row.key}>
                <div className="rubric-row">
                  <b>{row.name}</b>
                  <div className={`bar ${v === row.max ? "good" : v > 0 ? "warn" : "bad"}`}>
                    <div style={{ width: `${Math.max(3, (v / row.max) * 100)}%` }} />
                  </div>
                  <span>
                    {v}/{row.max}
                  </span>
                </div>
                <p className="small muted" style={{ marginTop: -6 }}>{row.levels[v] ?? ""}</p>
              </div>
            );
          })}
          {steps && (
            <>
              <h3 style={{ marginTop: 16 }}>Process steps</h3>
              <div className="row">
                {STEPS.map((st) => (
                  <span key={st.id} className={`pill ${steps.includes(st.id) ? "good" : "bad"}`} title={st.name}>
                    {st.icon} {steps.includes(st.id) ? "✓" : "✗"}
                  </span>
                ))}
              </div>
              {steps.length < STEPS.length && <p className="small muted" style={{ marginTop: 6 }}>Skipped steps cost points on test day. Next time do all seven!</p>}
            </>
          )}
        </div>
        <div className="card">
          <h2>🌟 Glows</h2>
          {score.glows.map((g, i) => (
            <div key={i} className="glow">{g}</div>
          ))}
          {score.grows.length > 0 && <h2 style={{ marginTop: 16 }}>🌱 Grows</h2>}
          {score.grows.map((g, i) => (
            <div key={i} className="grow">{g}</div>
          ))}
          {score.levelUp && (
            <>
              <h2 style={{ marginTop: 16 }}>⬆️ Level-up sentence</h2>
              <div className="levelup">
                <p className="strike" style={{ margin: 0 }}>{score.levelUp.original}</p>
                <p style={{ margin: "6px 0 0", fontWeight: 700 }}>{score.levelUp.better}</p>
              </div>
            </>
          )}
        </div>
      </div>
      {(() => {
        const fix = fixLesson(score);
        const l = lessonById(fix.id);
        if (!l) return null;
        return (
          <div className="card fixit">
            <div className="fixit-icon">🎓</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: 0 }}>Fix-it lesson: {l.title}</h2>
              <p style={{ margin: "4px 0 0" }}>{fix.why} This short lesson shows you how. It is your next lesson in the Daily Plan too.</p>
            </div>
            <button className="btn big" onClick={() => go("lessons", l.id)}>Start the fix-it lesson ▶</button>
          </div>
        );
      })()}
      <div className="card">
        <h2>Train next</h2>
        <div className="row">
          {score.skills.length === 0 && <span className="muted">No weak spots found. Try a 90-minute mock test to push yourself!</span>}
          {score.skills.slice(0, 4).map((sk) => (
            <button key={sk} className="btn ghost" onClick={() => go("drills", sk)}>
              🥋 {SKILLS[sk]?.name ?? sk}
            </button>
          ))}
          <span className="spacer" />
          <button className="btn" onClick={onAgain}>Write another</button>
        </div>
      </div>
    </>
  );
}
