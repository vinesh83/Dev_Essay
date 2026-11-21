import { useCallback, useEffect, useState } from "react";
import ChestModal, { ChestIcon } from "./components/ChestModal";
import MusicControl from "./components/MusicControl";
import { StreakCelebration } from "./components/Streak";
import { litToday, streakAlive } from "./lib/streak";
import PracticeRing from "./components/PracticeRing";
import { music } from "./lib/music";
import { coinMultiplier } from "./data/season";
import { setCoinMultiplier, setXpHook } from "./lib/store";
import { onXp } from "./lib/mining";
import { Toaster, toast } from "./components/Toast";
import { isCounting, usePracticeClock } from "./lib/session";
import { BreakScreen } from "./components/DailyPlan";
import PathBar from "./components/PathBar";
import ParentGate from "./components/ParentGate";
import { currentBlock, routeOpen, setPlanListener, settings, workMinutes } from "./lib/schedule";
import { logEvent, update } from "./lib/store";
import { level, practiceToday, useStore, xpForLevel } from "./lib/store";
import Collection from "./pages/Collection";
import Diagnostic from "./pages/Diagnostic";
import Drills from "./pages/Drills";
import Garage from "./pages/Garage";
import Home from "./pages/Home";
import Lessons from "./pages/Lessons";
import Progress from "./pages/Progress";
import Shop from "./pages/Shop";
import Typing from "./pages/Typing";
import Workshop from "./pages/Workshop";
import Drive from "./pages/Drive";
import Write from "./pages/Write";

setCoinMultiplier(coinMultiplier);
setXpHook(onXp);

export type Route = "home" | "typing" | "drills" | "write" | "brainstorm" | "mock" | "progress" | "shop" | "cards" | "diagnostic" | "lessons" | "garage" | "workshop" | "drive";

const NAV: [Route, string, string][] = [
  ["home", "🏠", "Home"],
  ["lessons", "🎓", "Learn"],
  ["typing", "⌨️", "Typing"],
  ["drills", "🥋", "Drills"],
  ["write", "✍️", "Write"],
  ["cards", "🃏", "Cards"],
  ["shop", "🛒", "Shop"],
  ["garage", "🏎️", "Garage"],
  ["drive", "🛣️", "Road Trip"],
  ["workshop", "⚒️", "Craft"],
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
let chestsAllowed = true;
export const openChests = () => chestsAllowed && showChests();

export default function App() {
  const s = useStore();
  const [{ route, arg }, setRoute] = useState(readHash);
  const [chestOpen, setChestOpen] = useState(false);
  const [, setTick] = useState(0);
  showChests = () => setChestOpen(true);

  useEffect(() => music.resumeOnGesture(), []);

  // The Daily Plan sets the daily goal, and moves Dev to the next block.
  const planOn = settings(s).on;
  const goalMin = workMinutes(s);
  useEffect(() => {
    const want = planOn ? goalMin : 30;
    if (s.dailyGoalMin !== want) update((st) => void (st.dailyGoalMin = want));
  }, [planOn, goalMin, s.dailyGoalMin]);
  useEffect(() => {
    setPlanListener((done, next) => {
      if (!next) return;
      if (next.id === "explore") toast(`✅ ${done.title} done! 🎮 Free explore is open. Great work today!`);
      else if (next.id === "break") toast(`✅ ${done.title} done! Time for a ${next.minutes}-minute break.`);
      else {
        toast(`✅ ${done.title} done! Next: ${next.icon} ${next.title}`);
        // Let the lesson's star screen show for a moment before moving on.
        if (done.id === "lesson") setTimeout(() => go(next.route as Route, next.arg), 3500);
        else go(next.route as Route, next.arg);
      }
    });
  }, []);

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

  const block = currentBlock(s);
  const onPath = !!block;
  chestsAllowed = !onPath;

  // Log every screen he opens, for the Parents page.
  useEffect(() => logEvent("open", arg, route), [route, arg]);

  // One path: while today's work remains, every screen except Home and
  // the Parents page sends him straight to the current step.
  const exempt = route === "home" || route === "progress" || route === "diagnostic";
  const offPath = !!block && block.id !== "break" && !exempt && (route !== block.route || (!!block.arg && arg !== block.arg));
  useEffect(() => {
    if (!offPath || !block) return;
    logEvent("blocked", `${route}${arg ? "/" + arg : ""} → ${block.title}`, route);
    toast(`🔒 Not yet! First: ${block.icon} ${block.title}`);
    go(block.route as Route, block.arg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offPath, route, arg]);

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
          {s.chests.length > 0 && !onPath && (
            <button className="chip chest-chip" onClick={() => setChestOpen(true)} title="Open treasure">
              <ChestIcon tier={s.chests[0].tier} size={30} shaking /> {s.chests.length}
            </button>
          )}
          <MusicControl />
          {onPath && (
            <button className="chip" onClick={() => go("progress")} title="Parents">
              👪
            </button>
          )}
          <span className="chip" title={litToday(s) ? "Streak lit today" : "Finish today's plan to light the streak"} style={litToday(s) ? undefined : { opacity: 0.6, filter: "grayscale(.7)" }}>🔥 {streakAlive(s)}</span>
          <span className="chip gold" title="Coins">🪙 {s.coins}</span>
          <span className="chip" title={`${s.xp} XP`} style={{ minWidth: 96 }}>
            ⭐ Lv {lv}
            <div className="bar" style={{ height: 6, marginTop: 2 }}>
              <div style={{ width: `${pct}%` }} />
            </div>
          </span>
        </div>
        {!onPath && (
          <nav className="nav">
            {NAV.map(([r, icon, label]) => (
              <button key={r} className={navRoute === r ? "on" : ""} onClick={() => go(r)}>
                <span aria-hidden>{routeOpen(s, r) ? icon : "🔒"}</span> {label}
              </button>
            ))}
          </nav>
        )}
      </header>
      {onPath && route !== "progress" && <PathBar route={route} />}
      <main>
        {block?.id === "break" && route !== "progress" ? (
          <BreakScreen />
        ) : offPath ? null : (
        <>
        {route === "home" && <Home />}
        {route === "typing" && <Typing />}
        {route === "drills" && <Drills key={arg ?? "mixed"} focus={arg} />}
        {route === "write" && <Write key={"w" + (arg ?? "")} mode="practice" promptId={arg} />}
        {route === "brainstorm" && <Write key={"p" + (arg ?? "")} mode="plan" promptId={arg} />}
        {route === "mock" && <Write key={"m" + (arg ?? "")} mode="mock" promptId={arg} />}
        {route === "progress" && (
          <ParentGate>
            <Progress />
          </ParentGate>
        )}
        {route === "shop" && <Shop />}
        {route === "cards" && <Collection />}
        {route === "diagnostic" && <Diagnostic />}
        {route === "garage" && <Garage />}
        {route === "workshop" && <Workshop />}
        {route === "drive" && <Drive arg={arg} />}
        {route === "lessons" && <Lessons key={arg ?? "hub"} id={arg} />}
        </>
        )}
      </main>
      {chestOpen && <ChestModal onClose={() => setChestOpen(false)} />}
      <StreakCelebration />
      <Toaster />
    </div>
  );
}
