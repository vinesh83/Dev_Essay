export default function PracticeRing({ seconds, goalMin, size = 46, active }: { seconds: number; goalMin: number; size?: number; active?: boolean }) {
  const pct = Math.min(1, seconds / (goalMin * 60));
  const r = 18;
  const c = 2 * Math.PI * r;
  const done = pct >= 1;
  return (
    <svg viewBox="0 0 46 46" width={size} height={size} role="img" aria-label={`${Math.floor(seconds / 60)} of ${goalMin} minutes practiced today`} className={active && !done ? "ring-live" : ""}>
      <circle cx="23" cy="23" r={r} fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.12)" strokeWidth="5" />
      <circle cx="23" cy="23" r={r} fill="none" stroke={done ? "#7bd389" : "#ffd166"} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${pct * c} ${c}`} transform="rotate(-90 23 23)" />
      <text x="23" y="24" textAnchor="middle" dominantBaseline="middle" fontSize={done ? 16 : 12} fontWeight="800" fill="#fff">
        {done ? "✓" : Math.floor(seconds / 60)}
      </text>
    </svg>
  );
}
