import { useEffect, useState } from "react";
import { ScoreRing } from "../components/Results";
import { toast } from "../components/Toast";
import { SKILLS, type SkillId } from "../data/drills";
import { promptById } from "../data/prompts";
import { STEPS } from "../data/process";
import { areaAverages, skillMastery, typingStats } from "../lib/coach";
import { isAiEnabled } from "../lib/grade";
import { exportData, importData, resetAll, today, update, useStore, type Essay } from "../lib/store";

function LineChart({ points, max, target, label }: { points: number[]; max: number; target?: number; label: string }) {
  const W = 520, H = 160, P = 28;
  if (points.length === 0) return <p className="muted small">No data yet.</p>;
  const x = (i: number) => P + (points.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (points.length - 1));
  const y = (v: number) => H - P - (v / max) * (H - 2 * P);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }} role="img" aria-label={label}>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P} x2={W - P} y1={y(max * f)} y2={y(max * f)} stroke="var(--line)" />
          <text x={4} y={y(max * f) + 4} fontSize="11" fill="var(--muted)">{Math.round(max * f)}</text>
        </g>
      ))}
      {target !== undefined && (
        <>
          <line x1={P} x2={W - P} y1={y(target)} y2={y(target)} stroke="var(--good)" strokeDasharray="5 4" />
          <text x={W - P} y={y(target) - 4} fontSize="11" textAnchor="end" fill="var(--good)">goal {target}</text>
        </>
      )}
      <polyline fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinejoin="round" points={points.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
      {points.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r="4.5" fill="var(--brand)">
          <title>{v}</title>
        </circle>
      ))}
    </svg>
  );
}

const AREA_NAMES = { argument: "Opinion", organization: "Organization", evidence: "Evidence", expression: "Word Choice", conventions: "Conventions" } as const;

export default function Progress() {
  const s = useStore();
  const [ai, setAi] = useState<boolean | null>(null);
  const [open, setOpen] = useState<Essay | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => void isAiEnabled().then(setAi), []);

  const scored = s.essays.filter((e) => e.score);
  const areas = areaAverages(s);
  const mastery = skillMastery(s);
  const t = typingStats(s);
  const withSteps = s.essays.filter((e) => e.steps);
  const fullProcess = withSteps.filter((e) => e.steps!.length === STEPS.length).length;
  const typingPoints = [...s.typing.tests.map((x) => x.wpm)];
  const totalMinutes = Math.round(s.essays.reduce((a, e) => a + e.seconds, 0) / 60);
  const d0 = today();
  const days14 = Array.from({ length: 14 }, (_, i) => d0 - 13 + i).map((d) => ({ d, min: Math.round((s.practice[String(d)] ?? 0) / 60) }));
  const goalDays = days14.filter((x) => x.min >= s.dailyGoalMin).length;

  return (
    <>
      <div className="card">
        <h1>📈 Parent Dashboard</h1>
        <p className="muted">Everything is saved in this browser on this device. Use Backup to move it to another computer.</p>
        <div className="grid three">
          <div><div className="muted small">Essays written</div><h2>{s.essays.length}</h2></div>
          <div><div className="muted small">Latest score</div><h2>{scored.length ? scored[scored.length - 1].score!.total : "–"} / 100</h2></div>
          <div><div className="muted small">Typing</div><h2>{t.wpm} WPM · {t.acc}%</h2></div>
          <div><div className="muted small">Full 7-step process</div><h2>{withSteps.length ? `${fullProcess}/${withSteps.length}` : "–"}</h2></div>
          <div><div className="muted small">Writing time</div><h2>{totalMinutes} min</h2></div>
          <div><div className="muted small">Grading</div><h2 style={{ fontSize: "1rem", marginTop: 8 }}>{ai === null ? "Checking…" : ai ? "✅ AI rubric grading on" : "⚠️ Built-in estimate (add API key)"}</h2></div>
        </div>
      </div>

      <div className="card">
        <h2>Daily practice (last 14 days)</h2>
        <p className="muted small">Goal: {s.dailyGoalMin} minutes a day. Met on {goalDays} of 14 days. Only active practice counts. The clock pauses after 60 seconds of no typing or clicking.</p>
        <div className="minutes-chart" role="img" aria-label={`Minutes practiced per day. Goal met on ${goalDays} of the last 14 days.`}>
          {days14.map(({ d, min }) => {
            const date = new Date(d * 86400000);
            const h = Math.min(100, (min / Math.max(s.dailyGoalMin, 1)) * 80);
            return (
              <div key={d} className="mc-col" title={`${min} min`}>
                <span className="small">{min || ""}</span>
                <div className={`mc-bar ${min >= s.dailyGoalMin ? "met" : ""}`} style={{ height: `${Math.max(h, 2)}%` }} />
                <span className="small muted">{date.toLocaleDateString(undefined, { weekday: "narrow", timeZone: "UTC" })}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Essay scores</h2>
          <LineChart points={scored.map((e) => e.score!.total)} max={100} target={90} label="Essay scores over time" />
        </div>
        <div className="card">
          <h2>Typing speed (WPM)</h2>
          <LineChart points={typingPoints} max={Math.max(30, ...typingPoints)} target={20} label="Typing speed over time" />
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Rubric areas (last 3 essays)</h2>
          {(Object.keys(AREA_NAMES) as (keyof typeof AREA_NAMES)[]).map((k) => {
            const v = areas[k];
            const pct = v === null ? 0 : Math.round(v * 100);
            return (
              <div key={k} className="rubric-row">
                <b>{AREA_NAMES[k]}{k === "conventions" ? " (40)" : " (15)"}</b>
                <div className={`bar ${pct >= 85 ? "good" : pct >= 50 ? "warn" : "bad"}`}><div style={{ width: `${Math.max(pct, 3)}%` }} /></div>
                <span>{v === null ? "–" : `${pct}%`}</span>
              </div>
            );
          })}
          <h3 style={{ marginTop: 18 }}>Process habits</h3>
          {STEPS.map((st) => {
            const n = withSteps.filter((e) => e.steps!.includes(st.id)).length;
            const pct = withSteps.length ? Math.round((n / withSteps.length) * 100) : 0;
            return (
              <div key={st.id} className="rubric-row">
                <span>{st.icon} {st.name}</span>
                <div className={`bar ${pct >= 90 ? "good" : pct >= 50 ? "warn" : "bad"}`}><div style={{ width: `${Math.max(pct, 3)}%` }} /></div>
                <span>{withSteps.length ? `${pct}%` : "–"}</span>
              </div>
            );
          })}
        </div>
        <div className="card">
          <h2>Skill mastery</h2>
          <p className="small muted">From drill results (spaced repetition) and problems spotted in recent essays.</p>
          {(Object.keys(SKILLS) as SkillId[]).map((k) => {
            const v = Math.round(mastery[k] * 100);
            return (
              <div key={k} className="rubric-row">
                <span>{SKILLS[k].name}</span>
                <div className={`bar ${v >= 70 ? "good" : v >= 35 ? "warn" : "bad"}`}><div style={{ width: `${Math.max(v, 3)}%` }} /></div>
                <span className="small">{v}%</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h2>Essay history</h2>
        {s.essays.length === 0 ? (
          <p className="muted">No essays yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr><th>Date</th><th>Prompt</th><th>Type</th><th>Words</th><th>Time</th><th>Score</th><th></th></tr>
              </thead>
              <tbody>
                {[...s.essays].reverse().map((e) => (
                  <tr key={e.id}>
                    <td>{new Date(e.date).toLocaleDateString()}</td>
                    <td>{promptById(e.promptId)?.title ?? e.promptId}</td>
                    <td>{e.mode}</td>
                    <td>{e.words}</td>
                    <td>{Math.round(e.seconds / 60)}m</td>
                    <td>{e.score ? `${e.score.total} ${e.score.source === "auto" ? "(est.)" : e.score.source === "parent" ? "(you)" : ""}` : "–"}</td>
                    <td><button className="btn ghost" style={{ padding: "4px 10px" }} onClick={() => setOpen(e)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <EssayView essay={open} onClose={() => setOpen(null)} />}

      <div className="card">
        <h2>Settings</h2>
        <div className="grid two">
          <label>
            Child's name
            <input className="field" value={s.name} onChange={(e) => update((st) => void (st.name = e.target.value))} />
          </label>
          <label>
            Test date
            <input className="field" type="date" value={s.testDate} onChange={(e) => update((st) => void (st.testDate = e.target.value))} />
          </label>
          <label>
            Daily practice goal (minutes)
            <select className="field" value={s.dailyGoalMin} onChange={(e) => update((st) => void (st.dailyGoalMin = Number(e.target.value)))}>
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>{m} minutes</option>
              ))}
            </select>
          </label>
        </div>
        <div className="row" style={{ marginTop: 14 }}>
          <button
            className="btn ghost"
            onClick={() => {
              const blob = new Blob([exportData()], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `writing-quest-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
            }}
          >
            ⬇️ Backup progress
          </button>
          <label className="btn ghost">
            ⬆️ Restore backup
            <input
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  importData(await f.text());
                  toast("Progress restored!");
                } catch (err) {
                  toast(`Could not restore: ${(err as Error).message}`);
                }
              }}
            />
          </label>
          <span className="spacer" />
          <button
            className="btn"
            style={{ background: "var(--bad)" }}
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 4000);
                return;
              }
              resetAll();
              toast("All progress erased.");
            }}
          >
            {confirmReset ? "Click again to erase everything" : "Reset all progress"}
          </button>
        </div>
      </div>
    </>
  );
}

function EssayView({ essay, onClose }: { essay: Essay; onClose: () => void }) {
  const sc = essay.score;
  const [edit, setEdit] = useState(() => ({
    argument: sc?.argument ?? 0,
    organization: sc?.organization ?? 0,
    evidence: sc?.evidence ?? 0,
    expression: sc?.expression ?? 0,
    conventions: sc?.conventions ?? 0,
  }));
  const save = () => {
    update((s) => {
      const e = s.essays.find((x) => x.id === essay.id);
      if (!e) return;
      const total = edit.argument + edit.organization + edit.evidence + edit.expression + edit.conventions;
      e.score = { ...(e.score ?? { summary: "", glows: [], grows: [], skills: [] }), ...edit, total, source: "parent" } as Essay["score"];
    });
    toast("Score saved.");
    onClose();
  };
  const sel = (k: keyof typeof edit, opts: number[]) => (
    <select className="field" value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: Number(e.target.value) })}>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
  return (
    <div className="card">
      <div className="row">
        <h2 style={{ margin: 0 }}>{promptById(essay.promptId)?.title}</h2>
        <span className="spacer" />
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>
      <p className="small muted">{promptById(essay.promptId)?.question}</p>
      <div className="writer">
        <div>
          <div className="passage" style={{ whiteSpace: "pre-wrap", maxHeight: 500 }}>{essay.text}</div>
          {sc && (
            <>
              <p style={{ marginTop: 12 }}>{sc.summary}</p>
              {sc.grows.map((g, i) => <div key={i} className="grow">{g}</div>)}
            </>
          )}
        </div>
        <div>
          {sc && <ScoreRing total={sc.total} />}
          <h3>Score it yourself</h3>
          <p className="small muted">Override the score using the Sudie rubric.</p>
          {(["argument", "organization", "evidence", "expression"] as const).map((k) => (
            <label key={k} className="small" style={{ display: "block", marginBottom: 6 }}>
              {AREA_NAMES[k]} {sel(k, [0, 5, 10, 15])}
            </label>
          ))}
          <label className="small" style={{ display: "block", marginBottom: 6 }}>Conventions {sel("conventions", [0, 20, 40])}</label>
          <button className="btn" onClick={save}>Save score</button>
        </div>
      </div>
    </div>
  );
}
