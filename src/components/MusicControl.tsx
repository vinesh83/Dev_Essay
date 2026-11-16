import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { music, STATIONS } from "../lib/music";
import { sfx } from "../lib/sfx";

/** Header button for the focus music: on/off, station, and volume. */
export default function MusicControl() {
  const p = useSyncExternalStore(music.subscribe, music.get);
  const sfxOn = useSyncExternalStore(sfx.subscribe, sfx.get);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div className="music" ref={box}>
      <button className={"chip music-chip" + (p.on ? " on" : "")} onClick={() => setOpen((o) => !o)} title="Focus music" aria-expanded={open}>
        {p.on ? "🎵" : "🔇"} <span className="music-eq" aria-hidden><i /><i /><i /></span>
      </button>
      {open && (
        <div className="music-pop" role="dialog" aria-label="Focus music">
          <div className="music-head">
            <b>Focus music</b>
            <button className={"btn small-btn" + (p.on ? "" : " primary")} onClick={() => music.toggle()}>
              {p.on ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>
          <div className="stations">
            {STATIONS.map((st) => (
              <button key={st.id} className={"station" + (p.station === st.id && p.on ? " on" : "")} onClick={() => music.setStation(st.id)}>
                <span className="st-icon">{st.icon}</span>
                <span>
                  <b>{st.name}</b>
                  <small>{st.desc}</small>
                </span>
              </button>
            ))}
          </div>
          <label className="vol">
            🔈
            <input type="range" min={0} max={1} step={0.05} value={p.vol} onChange={(e) => music.setVolume(+e.target.value)} aria-label="Volume" />
            🔊
          </label>
          <label className="row small" style={{ gap: 8 }}>
            <input type="checkbox" checked={sfxOn} onChange={() => sfx.toggle()} /> 🔔 Reward sounds (combos, coins, correct answers)
          </label>
          <small className="muted">Calm music with no words helps your brain focus. All of it is made right here in the app.</small>
        </div>
      )}
    </div>
  );
}
