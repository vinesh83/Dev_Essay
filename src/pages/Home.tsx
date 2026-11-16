import { useEffect } from "react";
import { go, openChests, type Route } from "../App";
import { ChestIcon } from "../components/ChestModal";
import Hero from "../components/Hero";
import JourneyMap from "../components/JourneyMap";
import PracticeRing from "../components/PracticeRing";
import QuestCalendar from "../components/QuestCalendar";
import Scene from "../components/Scene";
import { CARDS } from "../data/cards";
import { SKILLS } from "../data/drills";
import { STEPS } from "../data/process";
import { dailyMission, lockMission, typingStats, weakestSkills } from "../lib/coach";
import { missionIsDone, practiceToday, useStore } from "../lib/store";

const ICON: Record<string, string> = { typing: "⌨️", drills: "🥋", write: "✍️", plan: "💡", mock: "🎯", lesson: "🎓" };

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
  const secs = practiceToday(s);
  const goal = s.dailyGoalMin * 60;
  const minsLeft = Math.max(0, Math.ceil((goal - secs) / 60));
  const nextTask = tasks.find((x) => !missionIsDone(s, x.id));
  const found = CARDS.filter((c) => s.collection[c.id]).length;

  if (!s.diagnosticDone) {
    return (
      <>
        <Scene s={s} height={340} three>
          <Hero s={s} size={220} />
        </Scene>
        <div className="card center" style={{ padding: 30 }}>
          <h1>Welcome to Writing Quest, {s.name}!</h1>
          <p className="muted" style={{ maxWidth: 580, margin: "0 auto 20px" }}>
            Far beyond the hills stands the Crystal Academy. Its gates open only for writers who can plan, write, and polish a mighty essay. Your quest starts with a quick check of your powers: a 1-minute typing test and one short essay.
          </p>
          <button className="btn big" onClick={() => go("diagnostic")}>
            Begin the quest ⚔️
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Scene s={s} height={340} three>
        <Hero s={s} size={190} />
        <div className="scene-panel">
          <h1 style={{ marginBottom: 4 }}>Hi {s.name}!</h1>
          <p style={{ margin: 0 }}>{days > 0 ? `${days} days until test day` : "Test day is here. You've got this!"}</p>
          <div className="row" style={{ marginTop: 12, gap: 12 }}>
            <PracticeRing seconds={secs} goalMin={s.dailyGoalMin} size={64} />
            <div>
              <b>{secs >= goal ? "Daily training complete! 🏆" : `${minsLeft} minutes left today`}</b>
              <div className="small muted">Practice {s.dailyGoalMin} min a day to earn a Golden Chest.</div>
            </div>
          </div>
          {secs < goal && (
            <button className="btn big" style={{ marginTop: 14 }} onClick={() => go((nextTask?.route ?? "typing") as Route)}>
              {secs > 0 ? "Keep training ▶" : "Start today's training ▶"}
            </button>
          )}
        </div>
      </Scene>

      <h2 className="section-title">Today's Quests <span className="muted small">({doneCount}/{tasks.length} done · finish all for +25 coins)</span></h2>
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
      {doneCount === tasks.length && secs < goal && (
        <div className="card">
          <h3>⚡ Bonus round: {minsLeft} minutes to your daily goal</h3>
          <div className="row">
            <button className="btn ghost" onClick={() => go("typing")}>🔤 Letter Lab</button>
            <button className="btn ghost" onClick={() => go("drills")}>🥋 More drills</button>
            <button className="btn ghost" onClick={() => go("brainstorm")}>💡 Brainstorm sprint</button>
          </div>
        </div>
      )}

      <QuestCalendar />

      <div className="card">
        <h2>🗺️ Your Journey</h2>
        <JourneyMap s={s} />
      </div>

      <div className="grid two">
        <div className="card">
          <h2>⚔️ Your Powers</h2>
          <p>
            ⌨️ Typing: <b>{t.wpm} WPM</b> at <b>{t.acc}%</b> <span className="muted small">(goal: 20 WPM, 95%)</span>
          </p>
          <p>
            📝 Best essay: <b>{best}</b> / 100 <span className="muted small">({scored.length} scored)</span>
          </p>
          <p style={{ marginBottom: 6 }}>🎯 Train these next:</p>
          <div className="row">
            {weakestSkills(s, 3).map((sk) => (
              <button key={sk} className="pill" style={{ border: 0, cursor: "pointer" }} onClick={() => go("drills", sk)}>
                {SKILLS[sk].name}
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <h2>💎 Treasure</h2>
          <div className="row" style={{ gap: 16 }}>
            <button className="chest-btn" onClick={openChests} disabled={!s.chests.length}>
              <ChestIcon tier={s.chests[0]?.tier ?? "wood"} size={84} shaking={s.chests.length > 0} />
              <span>{s.chests.length ? `Open ${s.chests.length}!` : "No chests"}</span>
            </button>
            <div>
              <p style={{ margin: 0 }}>
                Creatures found: <b>{found}/{CARDS.length}</b>
              </p>
              <p className="small muted">Chests come from finishing essays, typing levels, drills, and your daily 30 minutes.</p>
              <button className="btn ghost" onClick={() => go("cards")}>See album</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>📜 The 7-Step Essay Path</h2>
        <div className="steps-track">
          {STEPS.map((st, i) => (
            <div key={st.id} className="step-stone">
              <div className="step-num">{i + 1}</div>
              <div className="step-icon">{st.icon}</div>
              <b>{st.name}</b>
              <span className="small muted">{st.minutes} min</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
