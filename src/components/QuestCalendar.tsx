import { useState } from "react";
import { activeEvents, daysToWeek, DROPS, seasonWeek, SURPRISES } from "../data/season";
import { sfx } from "../lib/sfx";
import { addXp, claimDrop, giveChest, practiceToday, today, update, useStore } from "../lib/store";
import { openChests } from "../App";
import { toast } from "./Toast";

const SURPRISE_SECS = 600;

export function EventBanner() {
  const ev = activeEvents();
  if (!ev.length) return null;
  return (
    <div className="event-banners">
      {ev.map((e) => (
        <div key={e.id} className={`event-banner ev-${e.id}`}>
          <span className="ev-icon">{e.icon}</span>
          <span><b>{e.name}</b> {e.desc}</span>
        </div>
      ))}
    </div>
  );
}

export default function QuestCalendar() {
  const s = useStore();
  const week = seasonWeek(s);
  const ready = DROPS.filter((d) => d.week <= week && !s.claimed?.includes(d.id));
  const next = DROPS.find((d) => d.week > week);
  const secs = practiceToday(s);
  const surpriseOpen = s.surpriseDay === today();
  const [gift, setGift] = useState<(typeof SURPRISES)[number] | null>(null);

  const claim = (id: string) => {
    const d = DROPS.find((x) => x.id === id)!;
    if (claimDrop(d.id, d.coins, d.chest, `Week ${d.week}: ${d.title}`)) {
      sfx.fanfare();
      toast(`${d.icon} ${d.title}! ${d.coins ? `+${d.coins} coins. ` : ""}${d.chest ? `A ${d.chest} chest is waiting.` : ""}${d.unlocks ? "New cars in the Garage!" : ""}`);
    }
  };

  const openSurprise = () => {
    const total = SURPRISES.reduce((n, x) => n + x.weight, 0);
    let r = Math.random() * total;
    const pick = SURPRISES.find((x) => (r -= x.weight) < 0) ?? SURPRISES[0];
    update((st) => void (st.surpriseDay = today()));
    if (pick.coins) addXp(0, pick.coins);
    if (pick.chest) giveChest(pick.chest, "today's surprise");
    sfx.fanfare();
    setGift(pick);
  };

  return (
    <div className="card quest-cal">
      <div className="row">
        <h2 style={{ margin: 0 }}>📅 Quest Calendar</h2>
        <span className="pill">Week {week}</span>
      </div>
      <EventBanner />
      <div className="grid two" style={{ marginTop: 10 }}>
        <div className="qc-box">
          <h3>🎁 Daily surprise</h3>
          {gift ? (
            <div className="surprise-open">
              <div className="surprise-icon">{gift.icon}</div>
              <b>{gift.text}</b>
              {gift.chest && <button className="btn small-btn" onClick={openChests}>Open it now</button>}
            </div>
          ) : surpriseOpen ? (
            <p className="small muted">You opened today's surprise. A new one appears tomorrow!</p>
          ) : secs >= SURPRISE_SECS ? (
            <button className="gift-btn" onClick={openSurprise}>
              <span className="gift-wiggle">🎁</span>
              <b>Tap to open!</b>
            </button>
          ) : (
            <>
              <div className="gift-locked">🎁</div>
              <p className="small">Practice {Math.ceil((SURPRISE_SECS - secs) / 60)} more minutes to unlock today's mystery gift. It could be a jackpot!</p>
              <div className="bar"><div style={{ width: `${(secs / SURPRISE_SECS) * 100}%` }} /></div>
            </>
          )}
        </div>
        <div className="qc-box">
          <h3>📦 Weekly drops</h3>
          {ready.map((d) => (
            <div key={d.id} className="drop ready">
              <span className="drop-icon">{d.icon}</span>
              <span><b>{d.title}</b><small>{d.desc}</small></span>
              <button className="btn small-btn" onClick={() => claim(d.id)}>Claim!</button>
            </div>
          ))}
          {next && (
            <div className="drop locked">
              <span className="drop-icon">❓</span>
              <span><b>Next drop in {daysToWeek(s, next.week)} day{daysToWeek(s, next.week) === 1 ? "" : "s"}</b><small>Hint: {next.icon} {next.title}</small></span>
            </div>
          )}
          {!ready.length && !next && <p className="small muted">You collected every drop. Champion!</p>}
        </div>
      </div>
    </div>
  );
}
