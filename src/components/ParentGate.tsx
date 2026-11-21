import { useEffect, useState, type ReactNode } from "react";

// The Parents page holds the plan settings and "unlock today", so it sits
// behind a parent PIN (PARENT_PIN on Vercel). The server checks it; the
// browser remembers a correct PIN until the tab closes.

const KEY = "dwq-parent-ok";

export default function ParentGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState(() => {
    try {
      return sessionStorage.getItem(KEY) === "1";
    } catch {
      return false;
    }
  });
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const pass = () => {
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOk(true);
  };
  useEffect(() => {
    if (ok) return;
    fetch("/api/parent")
      .then((r) => r.json())
      .then((j) => !j.required && pass())
      .catch(() => {});
  }, [ok]);
  if (ok) return <>{children}</>;
  const check = async () => {
    setErr("");
    const r = await fetch("/api/parent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) }).catch(() => null);
    if (r?.ok) pass();
    else setErr("That's not the parent PIN.");
    setPin("");
  };
  return (
    <div className="card center" style={{ maxWidth: 420, margin: "40px auto" }}>
      <div style={{ fontSize: 56 }}>🔐</div>
      <h1>Parents only</h1>
      <p className="muted">Enter the parent PIN.</p>
      <input className="field" type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && check()} style={{ textAlign: "center", fontSize: "1.4rem", maxWidth: 200 }} />
      <div style={{ marginTop: 12 }}>
        <button className="btn big" onClick={check} disabled={!pin}>Open</button>
      </div>
      {err && <p className="small" style={{ color: "var(--bad, #e66)" }}>{err}</p>}
    </div>
  );
}
