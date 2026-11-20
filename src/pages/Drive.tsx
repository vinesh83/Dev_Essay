import { useEffect, useRef, useState } from "react";
import { go } from "../App";
import { toast } from "../components/Toast";
import { REALMS } from "../data/cards";
import { CARS, carById } from "../data/cars";
import { sfx } from "../lib/sfx";
import { level, today, update, useStore } from "../lib/store";
import type { Drive as DriveWorld, DriveStatus, Key } from "../three/drive";

// Road Trip: drive a Garage car between the realm islands. A fun page, so
// the Daily Plan opens it at Free Explore time. Coins on the road pay a
// little, up to a daily cap, so driving never beats practice.

const COIN_CAP = 20;

export default function Drive({ arg }: { arg?: string }) {
  const s = useStore();
  const mine = CARS.filter((c) => s.owned.includes(c.id));
  const [carId, setCarId] = useState(arg && s.owned.includes(arg) ? arg : s.equipped.car && s.owned.includes(s.equipped.car) ? s.equipped.car : mine[0]?.id);
  const ref = useRef<HTMLCanvasElement>(null);
  const world = useRef<DriveWorld | null>(null);
  const [status, setStatus] = useState<DriveStatus>({ mph: 0, place: "" });
  const [failed, setFailed] = useState(false);
  const lv = level(s.xp);
  const got = s.driveCoins?.day === today() ? s.driveCoins.n : 0;

  useEffect(() => {
    const canvas = ref.current;
    const car = carId ? carById(carId) : undefined;
    if (!canvas || !car) return;
    let dead = false;
    let ro: ResizeObserver | null = null;
    const onVis = () => world.current?.setActive(!document.hidden);
    import("../three/drive")
      .then(({ createDrive }) => {
        if (dead) return;
        const w = createDrive(canvas, {
          carId: car.id,
          top: car.top,
          hp: car.hp,
          realms: REALMS.map((r) => ({ name: r.name, sky: r.sky, ground: r.ground, accent: r.accent, unlocked: lv >= r.level, level: r.level })),
          onStatus: setStatus,
          onCoin: () => {
            let paid = false;
            update((st) => {
              const d = today();
              const n = st.driveCoins?.day === d ? st.driveCoins.n : 0;
              if (n >= COIN_CAP) return;
              st.driveCoins = { day: d, n: n + 1 };
              st.coins += 1;
              paid = true;
            });
            if (paid) sfx.coin();
          },
          onGate: (r) => toast(`🔒 ${r.name} opens at hero level ${r.level}. Keep writing to get there!`),
          onSplash: () => toast("💦 Splash! Back to the island. Stay on the bridges!"),
          onJump: (s) => toast(s > 0.8 ? `🚀 HUGE jump! ${s.toFixed(1)} seconds of air!` : `🚀 Nice jump! ${s.toFixed(1)} seconds of air!`),
        });
        world.current = w;
        const fit = () => w.resize(canvas.clientWidth, canvas.clientHeight);
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(canvas);
        document.addEventListener("visibilitychange", onVis);
        canvas.focus();
      })
      .catch((err) => {
        console.warn("Road Trip unavailable:", err);
        setFailed(true);
      });
    return () => {
      dead = true;
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      world.current?.dispose();
      world.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carId, lv]);

  if (!mine.length)
    return (
      <div className="card center">
        <div style={{ fontSize: 56 }}>🛣️</div>
        <h1>Road Trip</h1>
        <p className="muted">You need a car first. Buy one in the Garage, then drive it across the islands.</p>
        <button className="btn big" onClick={() => go("garage")}>Go to the Garage ▶</button>
      </div>
    );

  const hold = (k: Key) => ({
    onPointerDown: (e: React.PointerEvent) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      world.current?.setKey(k, true);
    },
    onPointerUp: () => world.current?.setKey(k, false),
    onPointerCancel: () => world.current?.setKey(k, false),
    onPointerLeave: () => world.current?.setKey(k, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <div className="card drive-card">
      <div className="row drive-top">
        <h2 style={{ margin: 0 }}>🛣️ Road Trip</h2>
        <select className="field" value={carId} onChange={(e) => setCarId(e.target.value)} aria-label="Pick a car">
          {mine.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <span className="small muted">Arrow keys or WASD to drive. Hit the 🚀 ramps fast! Coins today: 🪙 {got}/{COIN_CAP}</span>
      </div>
      <div className="drive-stage">
        {failed ? (
          <div className="showroom fallback">This computer can't show the 3D road. Try the Garage instead.</div>
        ) : (
          <canvas ref={ref} className="drive-canvas" tabIndex={0} aria-label="Drive your car between the islands. Use the arrow keys." />
        )}
        <div className="drive-hud">
          <b>{status.place}</b>
          <span>{status.mph} mph</span>
        </div>
        <div className="drive-pad" aria-hidden>
          <div className="drive-steer">
            <button {...hold("left")}>◀</button>
            <button {...hold("right")}>▶</button>
          </div>
          <div className="drive-pedals">
            <button className="go" {...hold("up")}>▲</button>
            <button {...hold("down")}>▼</button>
          </div>
        </div>
      </div>
    </div>
  );
}
