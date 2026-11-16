import { RARITY, REALMS, type Card } from "../data/cards";

export default function CardView({ card, count, locked, big }: { card: Card; count?: number; locked?: boolean; big?: boolean }) {
  const r = RARITY[card.rarity];
  const realm = REALMS.find((x) => x.id === card.realm);
  const w = big ? 220 : 150;
  return (
    <div className={`tcg ${card.rarity} ${locked ? "locked" : ""}`} style={{ width: w, ["--rc" as string]: r.color }}>
      <svg viewBox="0 0 150 120" className="tcg-art" aria-hidden>
        <defs>
          <radialGradient id={`g${card.id}`} cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor={`hsl(${card.hue} 80% 70%)`} />
            <stop offset="1" stopColor={`hsl(${card.hue} 60% 22%)`} />
          </radialGradient>
        </defs>
        <rect width="150" height="120" fill={`url(#g${card.id})`} />
        {[...Array(6)].map((_, i) => (
          <circle key={i} cx={(i * 47) % 150} cy={(i * 31) % 70 + 10} r={i % 2 ? 1.5 : 2.5} fill="#fff" opacity="0.7" />
        ))}
        <ellipse cx="75" cy="104" rx="42" ry="8" fill="rgba(0,0,0,0.3)" />
        <text x="75" y="66" fontSize="58" textAnchor="middle" dominantBaseline="middle" className={locked ? "" : "bob"}>
          {locked ? "❔" : card.glyph}
        </text>
      </svg>
      <div className="tcg-body">
        <div className="tcg-name">{locked ? "???" : card.name}</div>
        <div className="tcg-meta">
          <span style={{ color: r.color }}>{"◆".repeat(["common", "rare", "epic", "legendary"].indexOf(card.rarity) + 1)} {r.label}</span>
          {count && count > 1 ? <span className="pill">×{count}</span> : null}
        </div>
        {!locked && <div className="tcg-tip">“{card.tip}”</div>}
        {locked && <div className="tcg-tip">Found in {realm?.name ?? "the realm"} chests.</div>}
      </div>
    </div>
  );
}
