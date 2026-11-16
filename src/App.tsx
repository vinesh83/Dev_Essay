import { useEffect, useState } from "react";
import { level, useStore, xpForLevel } from "./lib/store";
import Home from "./pages/Home";
import Typing from "./pages/Typing";
import Drills from "./pages/Drills";
import Write from "./pages/Write";
import Progress from "./pages/Progress";
import Shop from "./pages/Shop";
import Diagnostic from "./pages/Diagnostic";
import { Toaster } from "./components/Toast";

export type Route = "home" | "typing" | "drills" | "write" | "brainstorm" | "mock" | "progress" | "shop" | "diagnostic";

const NAV: [Route, string][] = [
  ["home", "🏠 Home"],
  ["typing", "⌨️ Typing"],
  ["drills", "🥋 Drills"],
  ["write", "✍️ Write"],
  ["shop", "🛒 Shop"],
  ["progress", "📈 Parents"],
];

function readHash(): { route: Route; arg?: string } {
  const [route, arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { route: (route as Route) || "home", arg };
}

export function go(route: Route, arg?: string) {
  location.hash = `/${route}${arg ? "/" + arg : ""}`;
}

export default function App() {
  const s = useStore();
  const [{ route, arg }, setRoute] = useState(readHash);
  useEffect(() => {
    const on = () => {
      setRoute(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const lv = level(s.xp);
  const pct = ((s.xp - xpForLevel(lv)) / (xpForLevel(lv + 1) - xpForLevel(lv))) * 100;
  const navRoute = route === "brainstorm" || route === "mock" ? "write" : route;

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => go("home")}>
          <span>🗺️</span> Writing Quest
        </button>
        <nav className="nav">
          {NAV.map(([r, label]) => (
            <button key={r} className={navRoute === r ? "on" : ""} onClick={() => go(r)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="hud">
          <span className="chip" title="Daily streak">🔥 {s.streak.count}</span>
          <span className="chip" title="Coins">🪙 {s.coins}</span>
          <span className="chip" title={`${s.xp} XP`} style={{ minWidth: 110 }}>
            Lv {lv}
            <div className="bar" style={{ height: 6, marginTop: 2 }}>
              <div style={{ width: `${pct}%` }} />
            </div>
          </span>
        </div>
      </header>
      {route === "home" && <Home />}
      {route === "typing" && <Typing />}
      {route === "drills" && <Drills key={arg ?? "mixed"} focus={arg} />}
      {route === "write" && <Write key={"w" + (arg ?? "")} mode="practice" promptId={arg} />}
      {route === "brainstorm" && <Write key={"p" + (arg ?? "")} mode="plan" promptId={arg} />}
      {route === "mock" && <Write key={"m" + (arg ?? "")} mode="mock" promptId={arg} />}
      {route === "progress" && <Progress />}
      {route === "shop" && <Shop />}
      {route === "diagnostic" && <Diagnostic />}
      <Toaster />
    </div>
  );
}
