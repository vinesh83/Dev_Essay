import CardView from "../components/CardView";
import { ChestIcon } from "../components/ChestModal";
import { CARDS, REALMS } from "../data/cards";
import { level, useStore } from "../lib/store";
import { openChests } from "../App";

export default function Collection() {
  const s = useStore();
  const found = CARDS.filter((c) => s.collection[c.id]).length;
  const lv = level(s.xp);
  return (
    <>
      <div className="card">
        <div className="row" style={{ gap: 20 }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1>🃏 Creature Album</h1>
            <p>
              You've found <b>{found}</b> of <b>{CARDS.length}</b> creatures. Each one teaches a writing secret. Collect them all to become the Grand Scribe!
            </p>
            <div className="bar good" style={{ maxWidth: 420 }}>
              <div style={{ width: `${(found / CARDS.length) * 100}%` }} />
            </div>
          </div>
          <button className="chest-btn" onClick={openChests} disabled={!s.chests.length}>
            <ChestIcon tier={s.chests[0]?.tier ?? "wood"} size={96} shaking={s.chests.length > 0} />
            <span>{s.chests.length ? `${s.chests.length} chest${s.chests.length > 1 ? "s" : ""} to open!` : "No chests yet"}</span>
          </button>
        </div>
      </div>
      {REALMS.map((realm) => {
        const cards = CARDS.filter((c) => c.realm === realm.id);
        const have = cards.filter((c) => s.collection[c.id]).length;
        const unlocked = lv >= realm.level;
        return (
          <div className="card" key={realm.id}>
            <div className="row">
              <h2 style={{ margin: 0 }}>{realm.name}</h2>
              <span className="pill">{have}/{cards.length}</span>
              {!unlocked && <span className="pill warn">Reach level {realm.level} to travel here</span>}
            </div>
            <div className="album">
              {cards.map((c) => (
                <CardView key={c.id} card={c} count={s.collection[c.id]} locked={!s.collection[c.id]} />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
