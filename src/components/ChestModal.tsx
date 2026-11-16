import { useState } from "react";
import { RARITY, rollChest, type Card } from "../data/cards";
import { update, useStore } from "../lib/store";
import CardView from "./CardView";

const CHEST_ART: Record<string, { label: string; body: string; trim: string }> = {
  wood: { label: "Wooden Chest", body: "#8b5a2b", trim: "#c9a36a" },
  silver: { label: "Silver Chest", body: "#6c7a96", trim: "#dfe6f2" },
  gold: { label: "Golden Chest", body: "#b8860b", trim: "#ffe08a" },
};

export function ChestIcon({ tier, size = 90, shaking }: { tier: string; size?: number; shaking?: boolean }) {
  const a = CHEST_ART[tier] ?? CHEST_ART.wood;
  return (
    <svg viewBox="0 0 100 90" width={size} height={size * 0.9} className={shaking ? "shake" : ""} aria-label={a.label}>
      <ellipse cx="50" cy="84" rx="40" ry="5" fill="rgba(0,0,0,0.35)" />
      <rect x="12" y="38" width="76" height="44" rx="6" fill={a.body} stroke="#2b1a10" strokeWidth="2.5" />
      <path d="M12 40 Q12 12 50 12 Q88 12 88 40 Z" fill={a.body} stroke="#2b1a10" strokeWidth="2.5" />
      <rect x="12" y="36" width="76" height="8" fill={a.trim} stroke="#2b1a10" strokeWidth="2" />
      <rect x="22" y="14" width="8" height="68" fill={a.trim} opacity="0.85" />
      <rect x="70" y="14" width="8" height="68" fill={a.trim} opacity="0.85" />
      <rect x="42" y="40" width="16" height="18" rx="3" fill={a.trim} stroke="#2b1a10" strokeWidth="2" />
      <circle cx="50" cy="49" r="3" fill="#2b1a10" />
    </svg>
  );
}

export default function ChestModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [opening, setOpening] = useState(false);
  const [reveal, setReveal] = useState<{ cards: Card[]; dupCoins: number } | null>(null);
  const chest = s.chests[0];

  const open = () => {
    if (!chest) return;
    setOpening(true);
    setTimeout(() => {
      const cards = rollChest(chest.tier, s.collection);
      let dupCoins = 0;
      update((st) => {
        st.chests = st.chests.filter((c) => c.id !== chest.id);
        for (const c of cards) {
          if (st.collection[c.id]) dupCoins += RARITY[c.rarity].dupCoins;
          st.collection[c.id] = (st.collection[c.id] ?? 0) + 1;
        }
        st.coins += dupCoins;
      });
      setReveal({ cards, dupCoins });
      setOpening(false);
    }, 1100);
  };

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {reveal ? (
          <>
            <h2 className="center">✨ You found {reveal.cards.length > 1 ? `${reveal.cards.length} creatures` : "a creature"}!</h2>
            <div className="row" style={{ justifyContent: "center", gap: 14 }}>
              {reveal.cards.map((c, i) => (
                <div key={i} className="card-pop" style={{ animationDelay: `${i * 0.25}s` }}>
                  <CardView card={c} big count={s.collection[c.id]} />
                  {s.collection[c.id] > 1 && <p className="small center muted">Duplicate: +{RARITY[c.rarity].dupCoins} coins</p>}
                </div>
              ))}
            </div>
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              {s.chests.length > 0 && (
                <button className="btn" onClick={() => setReveal(null)}>
                  Open next chest ({s.chests.length})
                </button>
              )}
              <button className="btn ghost" onClick={onClose}>Done</button>
            </div>
          </>
        ) : chest ? (
          <div className="center">
            <h2>{CHEST_ART[chest.tier].label}</h2>
            <p className="muted">Earned for: {chest.reason}</p>
            <div className={opening ? "burst" : ""} style={{ display: "inline-block", margin: "10px 0 16px" }}>
              <ChestIcon tier={chest.tier} size={170} shaking={opening} />
            </div>
            <div>
              <button className="btn big" disabled={opening} onClick={open}>
                {opening ? "Opening…" : "Open it!"}
              </button>
            </div>
          </div>
        ) : (
          <div className="center">
            <h2>No chests right now</h2>
            <p className="muted">Practice 30 minutes, finish essays, and pass typing levels to earn chests.</p>
            <button className="btn" onClick={onClose}>OK</button>
          </div>
        )}
      </div>
    </div>
  );
}
