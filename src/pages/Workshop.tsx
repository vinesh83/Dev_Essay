import { go } from "../App";
import { toast } from "../components/Toast";
import { canAfford, craft, ORES, pickTier, RECIPES, recipeOpen, sell } from "../lib/mining";
import { daysToWeek } from "../data/season";
import { update, useStore } from "../lib/store";

// The Workshop: Dev's ore inventory, crafting table, and a trader who buys
// spare ore for coins. "Mine words, craft sentences."

export default function Workshop() {
  const s = useStore();
  const inv = s.ores ?? {};
  const waiting = s.oreNodes?.length ?? 0;
  const tier = pickTier();
  return (
    <>
      <div className="card workshop-hero">
        <div className="anvil" aria-hidden>⚒️</div>
        <div>
          <h1 style={{ margin: 0 }}>Workshop</h1>
          <p className="muted" style={{ margin: "4px 0 8px" }}>
            Mine words, craft sentences! Practice makes ore blocks pop up on your island. Tap them on the Home screen to mine them, then craft tools here.
          </p>
          <div className="row">
            {waiting > 0 ? (
              <button className="btn" onClick={() => go("home")}>⛏️ {waiting} ore block{waiting === 1 ? "" : "s"} waiting on your island!</button>
            ) : (
              <span className="small muted">No ore waiting. Finish lessons, drills, levels, and essays to find more. Bigger wins find more ore.</span>
            )}
            <span className="pill">Pickaxe luck: {["Basic", "Iron", "Gold", "Diamond"][tier]}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>🎒 Your ore</h2>
        <div className="ore-row">
          {ORES.map((o) => (
            <div key={o.id} className="ore-slot">
              <span className="ore-ico" style={{ ["--oc" as string]: o.color }} />
              <b>{inv[o.id] ?? 0}</b>
              <small>{o.name}</small>
              <button className="btn ghost small-btn" disabled={!inv[o.id]} onClick={() => { sell(o.id); toast(`Sold 1 ${o.name} for ${o.value} coins`); }}>Sell 🪙{o.value}</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>🛠️ Crafting table</h2>
        <div className="grid three">
          {RECIPES.map((r) => {
            const owned = s.owned.includes(r.id);
            const open = recipeOpen(r);
            const ok = canAfford(r);
            const on = s.equipped.gear === r.id;
            return (
              <div key={r.id} className={`card recipe ${owned ? "owned" : ""} ${open ? "" : "locked"}`}>
                <div className="recipe-icon">{r.id.includes("pick") ? "⛏️" : r.id.includes("axe") ? "🪓" : "🗡️"}</div>
                <b>{r.name}</b>
                <small className="muted">{r.desc}</small>
                <div className="cost">
                  {Object.entries(r.cost).map(([k, v]) => {
                    const o = ORES.find((x) => x.id === k)!;
                    const have = inv[o.id] ?? 0;
                    return (
                      <span key={k} className={`cost-chip ${have >= v! ? "ok" : ""}`}>
                        <span className="ore-ico small" style={{ ["--oc" as string]: o.color }} /> {Math.min(have, v!)}/{v} {o.name}
                      </span>
                    );
                  })}
                </div>
                {owned ? (
                  <button className="btn ghost small-btn" onClick={() => update((st) => { if (st.equipped.gear === r.id) delete st.equipped.gear; else st.equipped.gear = r.id; })}>
                    {on ? "✋ Put it away" : "🖐️ Hold it"}
                  </button>
                ) : !open ? (
                  <span className="pill warn">🔒 Unlocks in {daysToWeek(s, r.week!)} days</span>
                ) : (
                  <button className="btn small-btn" disabled={!ok} onClick={() => craft(r) && toast(`⚒️ You crafted the ${r.name}! Your hero is holding it now.`)}>
                    Craft it!
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
