import { lazy, Suspense, useState } from "react";
import { go } from "../App";
import { toast } from "../components/Toast";
import { CARS, carById } from "../data/cars";
import { daysToWeek, ITEM_WEEK, itemArrived } from "../data/season";
import { sfx } from "../lib/sfx";
import { update, useStore } from "../lib/store";

const Showroom3D = lazy(() => import("../components/Showroom3D"));

export default function Garage() {
  const s = useStore();
  const [view, setView] = useState(s.equipped.car ?? CARS[0].id);
  const car = carById(view)!;
  const owned = s.owned.includes(car.id);
  const arrived = itemArrived(s, car.id);
  const ownedCount = CARS.filter((c) => s.owned.includes(c.id)).length;

  const buy = () => {
    if (s.coins < car.price) return toast(`You need ${car.price - s.coins} more coins. Keep training!`);
    update((st) => {
      st.coins -= car.price;
      st.owned.push(car.id);
      st.equipped.car = car.id;
    });
    sfx.fanfare();
    toast(`🏎️ The ${car.name} is yours! It's parked on your island now.`);
  };
  const drive = () =>
    update((st) => {
      if (st.equipped.car === car.id) delete st.equipped.car;
      else st.equipped.car = car.id;
    });

  return (
    <>
      <div className="card garage-hero">
        <div className="garage-stage">
          <Suspense fallback={<div className="showroom fallback">Opening the garage doors…</div>}>
            <Showroom3D carId={view} />
          </Suspense>
          <div className={`garage-tag r-${car.rarity}`}>{car.rarity.toUpperCase()}</div>
        </div>
        <div className="garage-info">
          <h1 style={{ margin: 0 }}>{car.name}</h1>
          <p className="muted" style={{ margin: "2px 0 10px" }}>{car.style}. {car.blurb}</p>
          <div className="car-stats">
            <div><b>{car.hp}</b><small>horsepower</small></div>
            <div><b>{car.top}</b><small>top mph</small></div>
            <div><b>{car.zero}s</b><small>0 to 60</small></div>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            {owned ? (
              <button className="btn" onClick={drive}>{s.equipped.car === car.id ? "🅿️ Park it in the garage" : "🔑 Drive it on my island"}</button>
            ) : arrived ? (
              <button className="btn big" disabled={s.coins < car.price} onClick={buy}>Buy for 🪙 {car.price}</button>
            ) : (
              <span className="pill warn">🔒 Arrives in {daysToWeek(s, ITEM_WEEK[car.id] ?? 1)} days{car.id === "car_comet" ? " (Snow Festival only)" : ""}</span>
            )}
            <span className="small muted">You have 🪙 {s.coins} · {ownedCount}/{CARS.length} cars</span>
          </div>
          <p className="small muted">Drag the car to spin it. Simplified 3D models built for this game. Stats are rounded.</p>
        </div>
      </div>
      <div className="grid three car-grid">
        {CARS.map((c) => {
          const here = itemArrived(s, c.id);
          const mine = s.owned.includes(c.id);
          return (
            <button key={c.id} className={`card car-card r-${c.rarity} ${view === c.id ? "on" : ""} ${here ? "" : "locked"}`} onClick={() => setView(c.id)}>
              <div className="car-swatch" aria-hidden>{here ? "🏎️" : "❓"}</div>
              <b>{here ? c.name : "Mystery car"}</b>
              <small className="muted">{here ? c.style : c.id === "car_comet" ? "Snow Festival special" : `Arrives in ${daysToWeek(s, ITEM_WEEK[c.id] ?? 1)} days`}</small>
              <span className="pill">{mine ? (s.equipped.car === c.id ? "🔑 Driving" : "✅ Owned") : here ? `🪙 ${c.price}` : "🔒"}</span>
            </button>
          );
        })}
      </div>
      <div className="center">
        <button className="btn ghost" onClick={() => go("shop")}>🛒 Back to the Shop</button>
      </div>
    </>
  );
}
