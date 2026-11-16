import { useEffect, useRef, useState } from "react";
import { REALMS } from "../data/cards";
import { CAPE_COLOR, itemById } from "../data/shop";
import { level, type State } from "../lib/store";
import type { World } from "../three/world";

// Mounts the three.js world on a canvas over the painted backdrop. The 3D
// code loads in its own chunk. If WebGL is missing or anything fails, the
// painted scene and SVG hero simply stay in place.

function webgl(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function World3D({
  s,
  look,
  layout = "home",
  mood = "idle",
  onReady,
}: {
  s: State;
  look: { sky: readonly [string, string]; accent: string };
  layout?: "home" | "stage";
  mood?: "idle" | "cheer";
  onReady?: (ok: boolean) => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const lv = level(s.xp);
  const e = s.equipped;
  const key = [lv, e.hat, e.cape, e.pet, e.gear, e.realm, e.car, layout, mood].join("|");

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !webgl()) {
      onReady?.(false);
      return;
    }
    let world: World | null = null;
    let dead = false;
    let ro: ResizeObserver | null = null;
    let io: IntersectionObserver | null = null;
    let visible = true;
    const onVis = () => world?.setActive(visible && !document.hidden);
    const realms = REALMS.map((r) => ({ sky: r.sky, ground: r.ground, accent: r.accent, unlocked: lv >= r.level }));
    const current = Math.max(0, realms.reduce((best, r, i) => (r.unlocked ? i : best), 0));
    import("../three/world")
      .then(({ createWorld }) =>
        createWorld(canvas, {
          realms,
          current,
          sky: look.sky,
          accent: look.accent,
          hat: e.hat,
          cape: CAPE_COLOR[e.cape ?? ""],
          pet: itemById(e.pet)?.icon,
          gear: e.gear,
          car: e.car,
          layout,
          mood,
        }),
      )
      .then((w) => {
        if (dead) return w.dispose();
        world = w;
        const fit = () => w.resize(canvas.clientWidth, canvas.clientHeight);
        fit();
        ro = new ResizeObserver(fit);
        ro.observe(canvas);
        io = new IntersectionObserver(([en]) => {
          visible = en.isIntersecting;
          onVis();
        });
        io.observe(canvas);
        document.addEventListener("visibilitychange", onVis);
        setReady(true);
        onReady?.(true);
      })
      .catch((err) => {
        console.warn("3D world unavailable:", err);
        onReady?.(false);
      });
    return () => {
      dead = true;
      ro?.disconnect();
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      world?.dispose();
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <canvas ref={ref} className={`world3d ${ready ? "on" : ""}`} aria-label="Your hero in the 3D world. Drag to look around. Tap your hero to jump." />;
}
