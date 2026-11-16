import { useEffect, useRef } from "react";
import { giveChest, getState, today, update } from "./store";

// Daily practice clock. It counts a second only when Dev is on a practice
// screen, the tab is visible, and he pressed a key or clicked in the last
// 60 seconds. Hitting the daily goal (30 min) earns a gold treasure chest.

const PRACTICE_ROUTES = new Set(["typing", "drills", "write", "brainstorm", "mock", "diagnostic"]);
const IDLE_MS = 60_000;

let lastInput = Date.now();
export const markActive = () => (lastInput = Date.now());

export function isCounting(route: string) {
  return PRACTICE_ROUTES.has(route) && document.visibilityState === "visible" && Date.now() - lastInput < IDLE_MS;
}

export function usePracticeClock(route: string, onGoal: () => void) {
  const pending = useRef(0);
  useEffect(() => {
    const on = () => markActive();
    window.addEventListener("keydown", on, true);
    window.addEventListener("pointerdown", on, true);
    window.addEventListener("input", on, true);
    return () => {
      window.removeEventListener("keydown", on, true);
      window.removeEventListener("pointerdown", on, true);
      window.removeEventListener("input", on, true);
    };
  }, []);

  useEffect(() => {
    const flush = () => {
      if (!pending.current) return;
      const add = pending.current;
      pending.current = 0;
      const day = String(today());
      let hitGoal = false;
      update((s) => {
        const before = s.practice[day] ?? 0;
        s.practice[day] = before + add;
        const goal = s.dailyGoalMin * 60;
        if (before < goal && before + add >= goal && s.goalRewardDay !== today()) {
          s.goalRewardDay = today();
          s.coins += 30;
          s.xp += 30;
          hitGoal = true;
        }
      });
      if (hitGoal) {
        giveChest("gold", `${getState().dailyGoalMin} minutes of practice today`);
        onGoal();
      }
    };
    const tick = setInterval(() => {
      if (isCounting(route)) pending.current += 1;
      if (pending.current >= 5) flush();
    }, 1000);
    return () => {
      clearInterval(tick);
      flush();
    };
  }, [route, onGoal]);
}
