import { useState } from "react";
import { useStore, type LogEntry } from "../lib/store";

// Parents page: where Dev actually went, day by day. Built from the
// activity log (every screen opened, every block finished, every time the
// path sent him back).

const NAMES: Record<string, string> = { home: "Home", typing: "Typing", drills: "Drills", write: "Essay writing", brainstorm: "Brainstorm", mock: "Mock test", lessons: "Lessons", shop: "Shop", cards: "Cards", garage: "Garage", drive: "Road Trip", workshop: "Craft", progress: "Parents", diagnostic: "Starting check" };
const GAP = 10 * 60_000; // a screen left open longer than this counts as 10 minutes

const dayKey = (t: number) => new Date(t).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const time = (t: number) => new Date(t).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function summarize(log: LogEntry[]) {
  const days = new Map<string, { mins: Record<string, number>; blocked: number; events: LogEntry[] }>();
  const opens = log.filter((l) => l.e === "open");
  for (let i = 0; i < opens.length; i++) {
    const a = opens[i];
    const next = opens[i + 1];
    const k = dayKey(a.t);
    const d = days.get(k) ?? { mins: {}, blocked: 0, events: [] };
    const span = next && dayKey(next.t) === k ? Math.min(next.t - a.t, GAP) : 60_000;
    d.mins[a.r] = (d.mins[a.r] ?? 0) + span / 60_000;
    days.set(k, d);
  }
  for (const l of log) {
    if (l.e === "open") continue;
    const k = dayKey(l.t);
    const d = days.get(k) ?? { mins: {}, blocked: 0, events: [] };
    if (l.e === "blocked") d.blocked++;
    d.events.push(l);
    days.set(k, d);
  }
  return [...days.entries()].reverse();
}

export default function ActivityLog() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const days = summarize(s.log ?? []).slice(0, 14);
  return (
    <div className="card">
      <h2>🕵️ Activity log</h2>
      <p className="muted small">Where Dev spent time on this device, and every time the daily path sent him back to his current step. Started recording Nov 20, 2026.</p>
      {!days.length && <p className="muted">Nothing recorded yet.</p>}
      {days.map(([day, d]) => {
        const rows = Object.entries(d.mins).sort((a, b) => b[1] - a[1]);
        const total = rows.reduce((a, [, m]) => a + m, 0);
        return (
          <div key={day} style={{ borderTop: "1px solid var(--line)", padding: "8px 0" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <b>{day}</b>
              <span className="small muted">~{Math.round(total)} min open{d.blocked ? ` · tried to leave the path ${d.blocked}×` : ""}</span>
            </div>
            <div className="small">{rows.map(([r, m]) => `${NAMES[r] ?? r} ${Math.round(m)}m`).join(" · ")}</div>
            {d.events.length > 0 && (
              <button className="btn ghost small-btn" onClick={() => setOpen(open === day ? null : day)}>
                {open === day ? "Hide" : "Show"} {d.events.length} events
              </button>
            )}
            {open === day && (
              <ul className="small" style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {d.events.map((e, i) => (
                  <li key={i}>
                    {time(e.t)} · {e.e}
                    {e.x ? `: ${e.x}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
