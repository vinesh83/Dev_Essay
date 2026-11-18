import { useEffect, useState } from "react";
import { sfx } from "../lib/sfx";
import { getState, useStore } from "../lib/store";
import { buyFreeze, FREEZE_PRICE, restoreStreak, litToday, MAX_FREEZES, nextMilestone, prevMilestone, setStreakListener, streakAlive, week, type Celebrate } from "../lib/streak";
import { toast } from "./Toast";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function WeekRow() {
  const s = useStore();
  return (
    <div className="streak-week">
      {week(s).map((w, i) => (
        <div key={w.day} className={`sw-day ${w.state}`}>
          <span className="sw-dot">{w.state === "lit" ? "🔥" : w.state === "frozen" ? "🧊" : w.state === "missed" ? "·" : ""}</span>
          <small>{DAYS[i]}</small>
        </div>
      ))}
    </div>
  );
}

/** Home: the flame, this week, the streak goal, and freezes. */
export function StreakCard() {
  const s = useStore();
  const n = streakAlive(s);
  const lit = litToday(s);
  const goal = nextMilestone(n);
  const from = prevMilestone(n);
  const freezes = s.freezes ?? 0;
  return (
    <div className={`card streak-card ${lit ? "lit" : "waiting"}`}>
      <div className="streak-main">
        <div className="streak-flame" aria-hidden>{lit ? "🔥" : "🕯️"}</div>
        <div>
          <div className="streak-num">{n} day{n === 1 ? "" : "s"}</div>
          <div className="streak-sub">{lit ? "Flame lit today! Come back tomorrow." : n ? "Finish today's plan to keep your streak!" : "Finish today's plan to start a streak!"}</div>
        </div>
      </div>
      <WeekRow />
      <div className="streak-goal">
        <span>🎯 Streak goal: <b>{goal} days</b></span>
        <div className="bar"><div style={{ width: `${Math.min(100, ((n - from) / (goal - from)) * 100)}%` }} /></div>
        <small className="muted">{goal - n} more day{goal - n === 1 ? "" : "s"} for a {goal >= 14 ? "gold" : "silver"} chest{goal % 7 === 0 ? " and a free freeze" : ""}. Best: {Math.max(s.streakBest ?? 0, n)}</small>
      </div>
      <div className="streak-freeze">
        <span>🧊 Streak freezes: <b>{freezes}/{MAX_FREEZES}</b> <small className="muted">(each one saves your streak on a missed day)</small></span>
        <button
          className="btn ghost small-btn"
          disabled={freezes >= MAX_FREEZES || s.coins < FREEZE_PRICE}
          onClick={() => {
            if (buyFreeze()) {
              sfx.coin();
              toast("🧊 Streak freeze ready! It will save your streak if you miss a day.");
            }
          }}
        >
          Buy one: 🪙 {FREEZE_PRICE}
        </button>
      </div>
    </div>
  );
}

/** The big moment when the flame lights. */
export function StreakCelebration() {
  const [c, setC] = useState<Celebrate | null>(null);
  useEffect(() => {
    setStreakListener((x) => {
      setC(x);
      sfx.fanfare();
    });
  }, []);
  if (!c) return null;
  return (
    <div className="streak-modal" role="dialog" aria-label="Streak extended">
      <div className="streak-modal-card">
        <div className="sm-flame">🔥</div>
        <div className="sm-num">{c.count}</div>
        <h2>{c.count === 1 ? "Streak started!" : "day streak!"}</h2>
        {c.froze && <p>🧊 A streak freeze saved {c.froze === 1 ? "a missed day" : `${c.froze} missed days`}.</p>}
        {c.milestone && <p className="sm-mile">🏆 {c.milestone}-day milestone!</p>}
        {c.perfect && <p className="sm-mile">🌟 Perfect week! Every day, Monday to Sunday.</p>}
        {c.reward && <p>You earned {c.reward}.</p>}
        <WeekRow />
        <p className="muted">{c.count === 1 ? "Do your plan again tomorrow to grow it." : `Come back tomorrow for day ${c.count + 1}!`}</p>
        <button className="btn big" onClick={() => setC(null)}>Keep going ▶</button>
      </div>
    </div>
  );
}

/** Parents page: bring back a streak lost to a sick day or a trip. */
export function StreakRestore() {
  const s = useStore();
  if (!s.lostStreak) return null;
  return (
    <div className="card">
      <h3>🔥 Lost streak</h3>
      <p className="small muted">
        The {s.lostStreak.count}-day streak broke. If the missed day had a good reason, like a sickness or a trip, you can bring it back.
      </p>
      <button
        className="btn"
        onClick={() => {
          if (restoreStreak()) toast(`🔥 Streak restored to ${getState().streak.count} days.`);
        }}
      >
        Restore the {s.lostStreak.count}-day streak
      </button>
    </div>
  );
}
