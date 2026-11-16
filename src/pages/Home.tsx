import { useEffect } from "react";
import { go, type Route } from "../App";
import Hero from "../components/Hero";
import { SKILLS } from "../data/drills";
import { STEPS } from "../data/process";
import { dailyMission, lockMission, typingStats, weakestSkills } from "../lib/coach";
import { missionIsDone, useStore } from "../lib/store";

const ICON: Record<string, string> = { typing: "⌨️", drills: "🥋", write: "✍️", plan: "💡", mock: "🎯" };

export default function Home() {
  const s = useStore();
  const tasks = dailyMission(s);
  useEffect(() => {
    if (s.diagnosticDone) lockMission(s);
  }, [s]);
  const doneCount = tasks.filter((t) => missionIsDone(s, t.id)).length;
  const days = Math.ceil((new Date(s.testDate + "T09:00:00").getTime() - Date.now()) / 86400000);
  const t = typingStats(s);
  const scored = s.essays.filter((e) => e.score);
  const best = Math.max(0, ...scored.map((e) => e.score!.total));

  if (!s.diagnosticDone) {
    return (
      <div className="card center" style={{ padding: 36 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <Hero s={s} size={160} />
        </div>
        <h1>Welcome to Writing Quest, {s.name}!</h1>
        <p className="muted" style={{ maxWidth: 560, margin: "0 auto 20px" }}>
          Your quest: write an essay so strong it opens the gates of TAG Academy. First, a quick starting check so the game knows your powers. It takes about 30 minutes: a 1-minute typing test and one short essay.
        </p>
        <button className="btn big" onClick={() => go("diagnostic")}>
          Start my quest ⚔️
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <div className="row" style={{ gap: 20, alignItems: "flex-start" }}>
          <Hero s={s} size={140} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1>Hi {s.name}! Today's quest</h1>
            <p className="muted">
              {days > 0 ? `${days} days until test day.` : "Test day is here. You've got this!"} Finish all {tasks.length} tasks for a 25-coin bonus.
            </p>
            <div className="bar good" style={{ maxWidth: 360 }}>
              <div style={{ width: `${(doneCount / tasks.length) * 100}%` }} />
            </div>
            <p className="small muted" style={{ marginTop: 4 }}>
              {doneCount} of {tasks.length} done
            </p>
          </div>
        </div>
      </div>

      <div className="grid three">
        {tasks.map((task) => {
          const done = missionIsDone(s, task.id);
          return (
            <button key={task.id} className={`card mission ${done ? "done" : ""}`} onClick={() => go(task.route as Route)}>
              <div className="icon">{done ? "✅" : ICON[task.id]}</div>
              <div>
                <h3 style={{ marginBottom: 2 }}>{task.title}</h3>
                <div className="small muted">{task.detail}</div>
                <div className="small muted">~{task.minutes} min</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid two">
        <div className="card">
          <h2>Your powers</h2>
          <p>
            ⌨️ Typing: <b>{t.wpm} WPM</b> at <b>{t.acc}%</b> accuracy <span className="muted small">(goal: 20 WPM, 95%)</span>
          </p>
          <p>
            📝 Best essay: <b>{best}</b> / 100 <span className="muted small">({scored.length} essays scored)</span>
          </p>
          <p style={{ marginBottom: 6 }}>🎯 Training focus:</p>
          <div className="row">
            {weakestSkills(s, 3).map((sk) => (
              <button key={sk} className="pill" style={{ border: 0, cursor: "pointer" }} onClick={() => go("drills", sk)}>
                {SKILLS[sk].name}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>The 7-step essay path</h2>
          <p className="small muted">Use these steps every single time. On test day you'll do them without thinking.</p>
          <ol style={{ margin: 0, paddingLeft: 20 }}>
            {STEPS.map((st) => (
              <li key={st.id}>
                {st.icon} <b>{st.name}</b> <span className="muted small">({st.minutes} min)</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
