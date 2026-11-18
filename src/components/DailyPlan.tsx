import { useEffect, useState } from "react";
import { go, type Route } from "../App";
import { blockSecs, blocksFor, breakLeft, currentBlock, dayState, isWeekend, planMinutes, setPlan, settings, unlockToday, workMinutes, type Block, type BlockId } from "../lib/schedule";
import { useStore, type State } from "../lib/store";
import Hero from "./Hero";

// The Daily Plan track on Home, the calm break screen, and the "not yet"
// screen for fun pages during work time.

const mmss = (ms: number) => {
  const t = Math.ceil(ms / 1000);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

function status(s: State, b: Block, cur: Block | null): "done" | "now" | "later" | "open" {
  const d = dayState(s);
  if (b.id === "explore") return cur ? "later" : "open";
  if (d.done.includes(b.id)) return "done";
  return cur?.id === b.id ? "now" : "later";
}

export function PlanTrack() {
  const s = useStore();
  const blocks = blocksFor(s);
  const cur = currentBlock(s);
  const weekend = isWeekend();
  return (
    <div className="card plan-card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>{weekend ? "🏆 Weekend Training" : "🗓️ Today's Plan"}</h2>
        <span className="small muted">{planMinutes(s)} min · do the blocks in order</span>
      </div>
      <div className="plan-track">
        {blocks.map((b, i) => {
          const st = status(s, b, cur);
          const pct = st === "done" || st === "open" ? 100 : Math.min(100, (blockSecs(s, b.id) / (b.minutes * 60)) * 100);
          return (
            <div key={b.id} className={`plan-step ${st}`}>
              <div className="plan-icon">{st === "done" ? "✅" : st === "later" ? "🔒" : b.icon}</div>
              <b>{b.title}</b>
              <span className="small muted">{b.id === "mock" ? "until you turn it in" : `${b.minutes} min`}</span>
              {b.id !== "break" && b.id !== "explore" && b.id !== "mock" && (
                <div className="bar" style={{ height: 6 }}>
                  <div style={{ width: `${pct}%` }} />
                </div>
              )}
              {i < blocks.length - 1 && <span className="plan-arrow" aria-hidden>➜</span>}
            </div>
          );
        })}
      </div>
      {cur ? (
        <div className="row plan-now">
          <span>
            <b>Now: {cur.icon} {cur.title}.</b> {cur.detail}
          </span>
          {cur.id !== "break" && (
            <button className="btn big" onClick={() => go(cur.route as Route)}>
              Go ▶
            </button>
          )}
        </div>
      ) : (
        <div className="plan-now">
          <b>🎉 Work done for today! Free explore is open.</b> Take a Road Trip, or visit the Garage, Shop, Cards, or Craft.
        </div>
      )}
    </div>
  );
}

export function BreakScreen() {
  const s = useStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const left = breakLeft(s);
  const next = blocksFor(s).find((b) => b.id !== "break" && b.id !== "explore" && !dayState(s).done.includes(b.id));
  return (
    <div className="card break-screen">
      <h1>🌿 Break time</h1>
      <p className="muted">Great work! Stand up, stretch, drink some water, and look out a window. The next block starts by itself.</p>
      <div className="break-row">
        <div className="breathe" aria-hidden>
          <span>breathe</span>
        </div>
        <Hero s={s} size={150} />
      </div>
      <div className="break-clock">{mmss(left)}</div>
      {next && <p className="small muted">Up next: {next.icon} {next.title}</p>}
    </div>
  );
}

export function LockedScreen({ route }: { route: string }) {
  const s = useStore();
  const cur = currentBlock(s);
  if (!cur) return null;
  const left = Math.max(0, Math.ceil((cur.minutes * 60 - blockSecs(s, cur.id)) / 60));
  return (
    <div className="card center locked-screen">
      <div style={{ fontSize: 64 }}>🔒</div>
      <h1>Not yet!</h1>
      <p className="muted" style={{ maxWidth: 520, margin: "0 auto 14px" }}>
        {route === "typing" || route === "write" || route === "lessons" || route === "drills" || route === "mock" || route === "brainstorm"
          ? "Do the blocks in order. This one opens later in today's plan."
          : "Road Trip, the Garage, Shop, Cards, and Craft open at Free Explore time, after today's work."}
      </p>
      <p>
        <b>Now: {cur.icon} {cur.title}</b>
        {cur.id !== "mock" && <> · about {left} min left</>}
      </p>
      <button className="btn big" onClick={() => go(cur.route as Route)}>
        Go to {cur.title} ▶
      </button>
    </div>
  );
}

const LABEL: Record<BlockId, string> = { warmup: "Warm-up", typing: "Typing", break: "Break", writing: "Writing", mock: "Mock test", review: "Score review", explore: "Free explore" };

/** Parents page: block lengths, on/off, and a one-day unlock. */
export function PlanEditor() {
  const s = useStore();
  const p = settings(s);
  const d = dayState(s);
  const row = (kind: "weekday" | "weekend") => (
    <div>
      <h3 style={{ marginBottom: 6 }}>{kind === "weekday" ? "Weekdays" : "Saturday and Sunday mornings"}</h3>
      <div className="plan-edit">
        {(Object.keys(p[kind]) as BlockId[]).map((id) => (
          <label key={id}>
            {LABEL[id]}
            <input
              className="field"
              type="number"
              min={0}
              max={id === "mock" ? 120 : 60}
              value={p[kind][id] ?? 0}
              onChange={(e) => setPlan((pl) => void (pl[kind][id] = Math.max(0, Math.min(120, Number(e.target.value) || 0))))}
            />
          </label>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 4 }}>
        {workMinutes(s, kind === "weekend")} min of work + {p[kind].explore ?? 0} min free explore = {planMinutes(s, kind === "weekend")} min. The break doesn't count.
      </p>
    </div>
  );
  return (
    <div className="card">
      <h2>🗓️ Daily Plan</h2>
      <p className="muted small">
        Dev does the blocks in order. Each block unlocks when the one before it is done. Typing and writing count only active time (the clock pauses after 60 seconds idle). Road Trip, the Garage, Shop, Cards, and Craft open at Free Explore time. The mock test block ends when he turns the essay in. Set a block to 0 to skip it.
      </p>
      <label className="row" style={{ gap: 8, marginBottom: 12 }}>
        <input type="checkbox" checked={p.on} onChange={(e) => setPlan((pl) => void (pl.on = e.target.checked))} />
        <b>Plan is on</b> <span className="small muted">(off = everything open, 30-minute goal)</span>
      </label>
      <div className="grid two">
        {row("weekday")}
        {row("weekend")}
      </div>
      <div className="row" style={{ marginTop: 12 }}>
        <span className="small muted">Today: {d.done.length ? d.done.map((x) => LABEL[x]).join(", ") + " done" : "nothing done yet"}{d.unlocked ? " · unlocked by a parent" : ""}</span>
        <button className="btn ghost" onClick={() => unlockToday(!d.unlocked)}>
          {d.unlocked ? "🔒 Lock today again" : "🔓 Unlock everything today"}
        </button>
      </div>
    </div>
  );
}
