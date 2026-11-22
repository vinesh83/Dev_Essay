import { CORE_DAYS, UNITS, isChampion } from "../data/curriculum";
import { todaysSession } from "../lib/schedule";
import { useStore } from "../lib/store";

// The Quest Curriculum map: six units, three days each, in order. Dev sees
// exactly where he is and what's next. No choices.

export default function CurriculumMap() {
  const s = useStore();
  const ses = todaysSession(s);
  const finished = (s.curriculumDay ?? 1) - 1; // days completed
  const round = Math.floor((ses.day - 1) / CORE_DAYS);
  const doneInRound = finished - round * CORE_DAYS;
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>🗺️ Quest Curriculum {isChampion(ses.day) && <span className="pill">🏆 Champion Round {round}</span>}</h2>
        <span className="small muted">Day {ses.day} · {finished} days done · finish a unit for a Golden Chest</span>
      </div>
      <div className="cur-map">
        {UNITS.map((u, i) => {
          const days = [0, 1, 2].map((k) => i * 3 + k);
          const state = ses.unit === i ? "now" : days.every((d) => d < doneInRound) ? "done" : "later";
          return (
            <div key={u.id} className={`cur-unit ${state}`}>
              <div className="cur-icon">{state === "done" ? "✅" : state === "later" ? "🔒" : u.icon}</div>
              <b>{u.name}</b>
              <div className="cur-dots">
                {days.map((d) => (
                  <span key={d} className={d < doneInRound ? "on" : ses.unit === i && d === ses.unit * 3 + ses.part - 1 ? "cur" : ""} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
