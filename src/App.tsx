import { useCallback, useEffect, useState } from "react";
import ChestModal, { ChestIcon } from "./components/ChestModal";
import MusicControl from "./components/MusicControl";
import PracticeRing from "./components/PracticeRing";
import { music } from "./lib/music";
import { Toaster, toast } from "./components/Toast";
import { isCounting, usePracticeClock } from "./lib/session";
import { level, practiceToday, useStore, xpForLevel } from "./lib/store";
import Collection from "./pages/Collection";
import Diagnostic from "./pages/Diagnostic";
import Drills from "./pages/Drills";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import Progress from "./pages/Progress";
import Shop from "./pages/Shop";
import Typing from "./pages/Typing";
import Write from "./pages/Write";

export type Route = "home" | "typing" | "drills" | "write" | "brainstorm" | "mock" | "progress" | "shop" | "cards" | "diagnostic" | "lessons";

const NAV: [Route, string, string][] = [
  ["home", "🏠", "Home"],
  ["lessons", "🎓", "Learn"],
  ["typing", "⌨️", "Typing"],
  ["drills", "🥋", "Drills"],
  ["write", "✍️", "Write"],
  ["cards", "🃏", "Cards"],
  ["shop", "🛒", "Shop"],
  ["progress", "📈", "Parents"],
];

function readHash(): { route: Route; arg?: string } {
  const [route, arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { route: (route as Route) || "home", arg };
}

export function go(route: Route, arg?: string) {
  location.hash = `/${route}${arg ? "/" + arg : ""}`;
}

let showChests: () => void = () => {};
export const openChests = () => showChests();

export default function App() {
  const s = useStore();
  const [{ route, arg }, setRoute] = useState(readHash);
  const [chestOpen, setChestOpen] = useState(false);
  const [, setTick] = useState(0);
  showChests = () => setChestOpen(true);

  useEffect(() => music.resumeOnGesture(), []);

  useEffect(() => {
    const on = () => {
      setRoute(readHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => {
      window.removeEventListener("hashchange", on);
      clearInterval(t);
    };
  }, []);

  const onGoal = useCallback(() => toast(`🏆 ${s.dailyGoalMin} minutes done today! +30 coins and a Golden Chest!`), [s.dailyGoalMin]);
  usePracticeClock(route, onGoal);

  const lv = level(s.xp);
  const pct = ((s.xp - xpForLevel(lv)) / (xpForLevel(lv + 1) - xpForLevel(lv))) * 100;
  const navRoute = route === "brainstorm" || route === "mock" ? "write" : route;
  const secs = practiceToday(s);
  const live = isCounting(route);

  return (
    <div className="app">
      <header className="topbar">
        <button className="logo" onClick={() => go("home")}>
          <span className="logo-mark">✒️</span>
          <span>
            Writing Quest
            <small>Road to Crystal Academy</small>
          </span>
        </button>
        <div className="hud">
          <span className="chip timer-chip" title="Practice minutes today">
            <PracticeRing seconds={secs} goalMin={s.dailyGoalMin} size={34} active={live} />
            <span>
              {Math.floor(secs / 60)}/{s.dailyGoalMin} min
              <small>{live ? "timer running" : secs >= s.dailyGoalMin * 60 ? "goal done!" : "paused"}</small>
            </span>
          </span>
          {s.chests.length > 0 && (
            <button className="chip chest-chip" onClick={() => setChestOpen(true)} title="Open treasure">
              <ChestIcon tier={s.chests[0].tier} size={30} shaking /> {s.chests.length}
            </button>
          )}
          <MusicControl />
          <span className="chip" title="Daily streak">🔥 {s.streak.count}</span>
          <span className="chip gold" title="Coins">🪙 {s.coins}</span>
          <span className="chip" title={`${s.xp} XP`} style={{ minWidth: 96 }}>
            ⭐ Lv {lv}
            <div className="bar" style={{ height: 6, marginTop: 2 }}>
              <div style={{ width: `${pct}%` }} />
            </div>
          </span>
        </div>
        <nav className="nav">
          {NAV.map(([r, icon, label]) => (
            <button key={r} className={navRoute === r ? "on" : ""} onClick={() => go(r)}>
              <span aria-hidden>{icon}</span> {label}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {route === "home" && <Home />}
        {route === "typing" && <Typing />}
        {route === "drills" && <Drills key={arg ?? "mixed"} focus={arg} />}
        {route === "write" && <Write key={"w" + (arg ?? "")} mode="practice" promptId={arg} />}
        {route === "brainstorm" && <Write key={"p" + (arg ?? "")} mode="plan" promptId={arg} />}
        {route === "mock" && <Write key={"m" + (arg ?? "")} mode="mock" promptId={arg} />}
        {route === "progress" && <Progress />}
        {route === "shop" && <Shop />}
        {route === "cards" && <Collection />}
        {route === "diagnostic" && <Diagnostic />}
        {route === "lessons" && <Lessons key={arg ?? "hub"} id={arg} />}
      </main>
      {chestOpen && <ChestModal onClose={() => setChestOpen(false)} />}
      <Toaster />
    </div>
  );
}
