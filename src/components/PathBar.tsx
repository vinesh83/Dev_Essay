import { useEffect, useState } from "react";
import { go, type Route } from "../App";
import { blockSecs, blocksFor, currentBlock, dayState, secsToFreePlay, WORDS_PER_DAY, wordsToday } from "../lib/schedule";
import { isCounting, pendingSecs } from "../lib/session";
import { useStore } from "../lib/store";

// The one path for today, pinned under the header while work remains:
// a big countdown to free play, the steps in order, and what to do now.

const clock = (sec: number) => {
  const t = Math.max(0, Math.ceil(sec));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export default function PathBar({ route }: { route: string }) {
  const s = useStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const cur = currentBlock(s);
  if (!cur) return null;
  const d = dayState(s);
  const blocks = blocksFor(s).filter((b) => b.minutes > 0);
  const work = blocks.filter((b) => b.id !== "explore");
  const total = work.reduce((a, b) => a + b.minutes * 60, 0);
  const left = secsToFreePlay(s, pendingSecs());
  const pct = total ? Math.min(100, ((total - left) / total) * 100) : 0;
  const running = cur.id === "break" || (isCounting(route) && cur.routes.includes(route));
  const curLeft = Math.max(0, cur.minutes * 60 - blockSecs(s, cur.id) - pendingSecs());
  const needWords = cur.id === "writing" ? Math.max(0, WORDS_PER_DAY - wordsToday(s)) : 0;
  const onIt = route === cur.route;

  let status: string;
  if (cur.id === "break") status = "🌿 Break: the clock runs by itself.";
  else if (!onIt) status = `👉 Press GO to start ${cur.title.toLowerCase()}.`;
  else if (!running) status = "⏸️ Clock paused. Keep typing to make it move!";
  else if (cur.id === "lesson" || cur.id === "review") status = "🎓 Finish the lesson to move on.";
  else if (cur.id === "mock") status = "🎯 Turn in your test essay to move on.";
  else if (cur.id === "writing" && curLeft <= 0 && needWords > 0) status = `✍️ Time's up, but write ${needWords} more words of your essay first!`;
  else if (cur.id === "writing") status = `✍️ ${wordsToday(s)}/${WORDS_PER_DAY} new essay words today · turn in your essay to finish early`;
  else status = `⏱️ ${clock(curLeft)} left in ${cur.title.toLowerCase()}`;

  return (
    <div className={`pathbar ${running ? "running" : "paused"}`}>
      <div className="pathbar-clock">
        <span className="pathbar-label">🎮 Free play in</span>
        <span className="pathbar-time">{clock(left)}</span>
      </div>
      <div className="pathbar-mid">
        <div className="pathbar-steps">
          {blocks.map((b, i) => {
            const st = d.done.includes(b.id) ? "done" : b.id === cur.id ? "now" : "later";
            return (
              <span key={b.id} className={`pathbar-step ${st}`}>
                {st === "done" ? "✅" : b.id === "explore" ? "🎮" : b.icon} {i + 1}. {b.id === "explore" ? "Free play" : b.title.replace(/^Lesson: /, "Lesson: ")}
              </span>
            );
          })}
        </div>
        <div className="pathbar-bar">
          <div style={{ width: `${pct}%` }} />
        </div>
        <div className="pathbar-status">{status}</div>
      </div>
      {!onIt && cur.id !== "break" && (
        <button className="btn big go-pulse" onClick={() => go(cur.route as Route, cur.arg)}>
          GO ▶
        </button>
      )}
    </div>
  );
}
