import Hero from "../components/Hero";
import Scene from "../components/Scene";
import { toast } from "../components/Toast";
import { ITEMS, SLOTS, type Slot } from "../data/shop";
import { BADGES, update, useStore } from "../lib/store";

export default function Shop() {
  const s = useStore();

  const buy = (id: string, price: number, slot: Slot) => {
    if (s.coins < price) return toast(`You need ${price - s.coins} more coins. Keep training!`);
    update((st) => {
      st.coins -= price;
      st.owned.push(id);
      st.equipped[slot] = id;
    });
    toast("🛍️ Bought and equipped!");
  };
  const equip = (id: string, slot: Slot) =>
    update((st) => {
      if (st.equipped[slot] === id) delete st.equipped[slot];
      else st.equipped[slot] = id;
    });

  return (
    <>
      <div className="card">
        <div className="row" style={{ gap: 20 }}>
          <div style={{ width: 300, maxWidth: "100%", flexShrink: 0 }}>
            <Scene s={s} height={280} three layout="stage" label={false}>
              <Hero s={s} size={180} />
            </Scene>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <h1>Quest Shop</h1>
            <p>
              You have <b>🪙 {s.coins} coins</b>. Earn more from drills (5 each), typing levels (up to 20), essay steps (5 each), essays (up to 40), and mock tests (up to 70).
            </p>
            <p className="small muted">Tip: The rarest items need high essay scores to afford. Write well, get rich!</p>
          </div>
        </div>
      </div>
      {(Object.keys(SLOTS) as Slot[]).map((slot) => (
        <div className="card" key={slot}>
          <h2>{SLOTS[slot]}</h2>
          <div className="grid three">
            {ITEMS.filter((i) => i.slot === slot)
              .sort((a, b) => a.price - b.price)
              .map((item) => {
                const owned = s.owned.includes(item.id);
                const on = s.equipped[slot] === item.id;
                return (
                  <div key={item.id} className="badge" style={{ textAlign: "left", border: on ? "2px solid var(--brand)" : "2px solid transparent" }}>
                    <div className="row">
                      <span style={{ fontSize: 36 }}>{item.icon}</span>
                      <div>
                        <b>{item.name}</b>
                        <div className="small muted">{item.desc}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8 }}>
                      {owned ? (
                        <button className={`btn ${on ? "ghost" : ""}`} onClick={() => equip(item.id, slot)}>
                          {on ? "Unequip" : "Equip"}
                        </button>
                      ) : (
                        <button className="btn" disabled={s.coins < item.price} onClick={() => buy(item.id, item.price, slot)}>
                          🪙 {item.price}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
      <div className="card">
        <h2>Badges</h2>
        <div className="grid three">
          {Object.entries(BADGES).map(([id, b]) => (
            <div key={id} className={`badge ${s.badges.includes(id) ? "" : "locked"}`}>
              <div className="b-icon">{b.icon}</div>
              <b>{b.name}</b>
              <div className="small muted">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
