import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

// Sports cars for the Garage. Each car is lofted from its own profile: a
// side line, a top-view width curve, a greenhouse, and the details people
// recognize (round 911 lamps, the Aventador's Y lights, the Mustang's
// tri-bar tails, the Chiron's horseshoe and C-line). No logos or badges.
// The Ferrari loads a real, credited 3D model (public/models/LICENSE.txt)
// and shows the lofted shape while it loads.

type P = [number, number][];
type Fn = (x: number) => number;

/** A smooth function of x through control points (Catmull-Rom, sampled). */
function fn(pts: P): Fn {
  if (pts.length === 1) return () => pts[0][1];
  const s = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y))).getPoints(Math.max(80, pts.length * 40));
  return (x: number) => {
    if (x <= s[0].x) return s[0].y;
    if (x >= s[s.length - 1].x) return s[s.length - 1].y;
    let lo = 0;
    let hi = s.length - 1;
    while (hi - lo > 1) {
      const m = (lo + hi) >> 1;
      if (s[m].x <= x) lo = m;
      else hi = m;
    }
    const t = (x - s[lo].x) / (s[hi].x - s[lo].x || 1);
    return s[lo].y + (s[hi].y - s[lo].y) * t;
  };
}

type Spec = {
  paint: string;
  accent: string;
  L: number;
  W: number;
  R: number;
  ride: number;
  wf: number;
  wr: number;
  top: P; // body top line from nose (x = 0) to tail (x = L)
  plan: P; // half width as a fraction of W / 2
  dip?: P; // how far the hood sits below the fenders
  sq?: number; // cross-section squareness (2 = round, 4 = boxy)
  glass: { a: number; b: number; roof: P; cw: number; rw: number };
  roofPaint?: [number, number] | false;
  rim: string;
  caliper: string;
  spokes: number;
  tone?: (x: number, y: number, zf: number) => string | null;
  extras: (k: Kit) => void;
};

type Rot = { rx?: number; ry?: number; rz?: number; mirror?: boolean };
type V3 = [number, number, number];

/** Helpers a car's detail function uses to place parts on its body. */
type Kit = {
  top: Fn;
  hw: Fn;
  surfY: (x: number, zf: number) => number;
  sideZ: (x: number, y: number) => number;
  roofY: (x: number, zf: number) => number;
  m: Record<"paint" | "accent" | "dark" | "chrome" | "head" | "tail" | "carbon" | "amber" | "blue", THREE.Material>;
  add: (o: THREE.Object3D) => void;
  el: (x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, o?: Rot) => void;
  bx: (x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, o?: Rot) => void;
  pipe: (x: number, y: number, z: number, r: number, mat?: THREE.Material, sides?: number, mirror?: boolean) => void;
  tube: (pts: V3[], r: number, mat: THREE.Material, mirror?: boolean) => void;
  band: (x0: number, x1: number, z0: number, z1: number, mat: THREE.Material, on?: "body" | "roof", lift?: number) => void;
  sideDecal: (x: number, y: number, sx: number, sy: number, mat: THREE.Material, depth?: number, rz?: number) => void;
  wing: (x: number, h: number, chord: number, span: number, mat: THREE.Material, swan?: boolean) => void;
};

const S = 72; // points around each cross-section
const NB = 4.5; // lower-half squareness

/* ------------------------------------------------------------------ */
/* Car specs                                                           */
/* ------------------------------------------------------------------ */

const midEngine = (o: Partial<Spec> & Pick<Spec, "paint" | "accent" | "extras">): Spec => ({
  L: 4.6, W: 1.96, R: 0.35, ride: 0.12, wf: 0.98, wr: 3.65,
  top: [[0, 0.44], [0.3, 0.6], [1.0, 0.74], [1.6, 0.83], [2.6, 0.91], [3.6, 0.98], [4.35, 0.99], [4.6, 0.88]],
  plan: [[0, 0.8], [0.5, 0.97], [1.2, 0.99], [2.4, 0.93], [3.5, 1], [4.4, 0.97], [4.6, 0.86]],
  dip: [[0, 0.01], [0.4, 0.05], [1.3, 0.05], [1.65, 0]],
  sq: 3,
  glass: { a: 1.6, b: 4.0, roof: [[1.6, 0.83], [2.15, 1.15], [2.55, 1.21], [2.95, 1.19], [3.55, 1.04], [4.0, 0.99]], cw: 0.84, rw: 0.6 },
  roofPaint: [2.25, 3.05],
  rim: "#c9ccd2", caliper: "#e0435c", spokes: 5,
  ...o,
});

const SPECS: Record<string, Spec> = {
  // Chevrolet Corvette Stingray (C8): cab-forward, big side intakes, quad pipes.
  car_vette: midEngine({
    paint: "#ff6a13", accent: "#15161a", L: 4.63, W: 1.93, wf: 0.95, wr: 3.65,
    top: [[0, 0.42], [0.25, 0.58], [0.9, 0.74], [1.55, 0.86], [2.6, 0.94], [3.6, 1.02], [4.35, 1.03], [4.63, 0.9]],
    plan: [[0, 0.76], [0.45, 0.95], [1.1, 1], [2.3, 0.94], [3.3, 1], [4.35, 0.97], [4.63, 0.84]],
    glass: { a: 1.55, b: 4.1, roof: [[1.55, 0.86], [2.1, 1.16], [2.5, 1.23], [2.9, 1.2], [3.5, 1.08], [4.1, 1.03]], cw: 0.84, rw: 0.6 },
    roofPaint: [2.2, 3.0], rim: "#17181c", caliper: "#e0435c", spokes: 10,
    extras: (k) => {
      const { el, bx, sideDecal, pipe, m, surfY, hw } = k;
      el(0.34, surfY(0.34, 0.74) - 0.01, hw(0.34) * 0.74, 0.34, 0.045, 0.14, m.head, { ry: -0.45 });
      el(0.3, surfY(0.3, 0.6) - 0.05, hw(0.3) * 0.6, 0.22, 0.025, 0.08, m.amber, { ry: -0.4 });
      el(0.1, 0.33, 0, 0.1, 0.12, 0.8, m.dark);
      el(0.16, 0.33, 0.58, 0.12, 0.15, 0.36, m.dark, { ry: 0.3 });
      sideDecal(2.95, 0.6, 0.62, 0.21, m.dark, 0.12, -0.12);
      sideDecal(3.35, 0.84, 0.36, 0.05, m.dark, 0.06, -0.05);
      for (let i = 0; i < 4; i++) bx(3.75 + i * 0.12, k.roofY(3.9, 0) + 0.01, 0, 0.05, 0.02, 0.6, m.dark);
      el(4.6, 0.86, hw(4.55) * 0.72, 0.06, 0.045, 0.3, m.tail, { ry: 0.15 });
      bx(4.58, 0.36, 0, 0.1, 0.12, 1.2, m.dark);
      for (const z of [0.42, 0.6]) pipe(4.62, 0.33, z, 0.05);
      k.wing(4.52, 0.05, 0.16, 1.5, m.paint);
    },
  }),

  // Porsche 911 Carrera S: frog-eye lamps on raised fenders, fastback, light bar.
  car_coupe: {
    paint: "#2fb4d6", accent: "#15161a", L: 4.52, W: 1.86, R: 0.34, ride: 0.12, wf: 0.85, wr: 3.32,
    top: [[0, 0.5], [0.3, 0.66], [0.9, 0.76], [1.45, 0.82], [2.4, 0.9], [3.3, 0.94], [3.8, 0.94], [4.3, 0.9], [4.52, 0.78]],
    plan: [[0, 0.78], [0.55, 0.96], [1.3, 0.93], [2.4, 0.92], [3.25, 1], [4.2, 0.98], [4.52, 0.84]],
    dip: [[0, 0.02], [0.3, 0.1], [1.05, 0.1], [1.45, 0.01]],
    sq: 2.7,
    glass: { a: 1.45, b: 4.3, roof: [[1.45, 0.82], [1.9, 1.12], [2.3, 1.28], [2.7, 1.27], [3.3, 1.14], [3.9, 0.99], [4.3, 0.91]], cw: 0.82, rw: 0.62 },
    roofPaint: [1.95, 3.0],
    rim: "#2a2d33", caliper: "#e0435c", spokes: 5,
    extras: (k) => {
      const { el, bx, band, m, surfY, hw, pipe } = k;
      // Frog-eye headlights sit up on the front fenders.
      el(0.3, surfY(0.3, 0.7) - 0.03, hw(0.3) * 0.7, 0.22, 0.14, 0.17, m.chrome, { rz: 0.35 });
      el(0.25, surfY(0.3, 0.7) - 0.035, hw(0.3) * 0.7, 0.18, 0.12, 0.15, m.head, { rz: 0.35 });
      el(0.06, 0.38, hw(0.1) * 0.6, 0.06, 0.05, 0.16, m.amber);
      el(0.1, 0.3, 0, 0.08, 0.08, 0.8, m.dark);
      // Engine lid in body color, with grille slats.
      band(3.55, 4.25, -0.5, 0.5, m.paint, "roof", 0.004);
      for (let i = 0; i < 5; i++) bx(3.75 + i * 0.08, k.roofY(3.9, 0) + 0.015, 0, 0.03, 0.015, 0.5, m.dark);
      // Full-width light bar.
      el(4.5, 0.83, 0, 0.04, 0.03, hw(4.5) * 1.7, m.tail);
      el(4.48, 0.82, hw(4.5) * 0.78, 0.06, 0.06, 0.16, m.tail);
      pipe(4.55, 0.33, 0.12, 0.06);
      k.wing(4.33, 0.03, 0.22, 1.2, m.paint);
    },
  },

  // Lamborghini Aventador: low wedge, one-line roof, Y lights, giant intakes.
  car_wedge: {
    paint: "#9be22a", accent: "#15161a", L: 4.8, W: 2.03, R: 0.36, ride: 0.11, wf: 1.05, wr: 3.78,
    top: [[0, 0.34], [0.45, 0.55], [1.0, 0.68], [1.6, 0.77], [2.6, 0.86], [3.4, 0.93], [4.4, 0.95], [4.8, 0.84]],
    plan: [[0, 0.72], [0.55, 0.96], [1.2, 1], [2.4, 0.9], [3.5, 1], [4.6, 0.98], [4.8, 0.9]],
    dip: [[0, 0], [0.4, 0.03], [1.3, 0.03], [1.6, 0]],
    sq: 4,
    glass: { a: 1.6, b: 4.3, roof: [[1.6, 0.77], [2.35, 1.08], [2.85, 1.13], [3.35, 1.07], [4.3, 0.95]], cw: 0.8, rw: 0.5 },
    roofPaint: [2.35, 3.25],
    rim: "#1b1c20", caliper: "#ffcc33", spokes: 6,
    extras: (k) => {
      const { el, bx, sideDecal, pipe, m, surfY, hw } = k;
      // Y-shaped headlights.
      const y = surfY(0.4, 0.74) - 0.01;
      el(0.42, y, hw(0.42) * 0.74, 0.32, 0.03, 0.08, m.head, { ry: -0.7 });
      el(0.5, y - 0.01, hw(0.5) * 0.62, 0.18, 0.025, 0.05, m.head, { ry: 0.5 });
      // Big triangular front intakes.
      el(0.16, 0.3, 0.55, 0.14, 0.15, 0.5, m.dark, { ry: 0.35 });
      el(0.1, 0.27, 0, 0.08, 0.06, 0.5, m.dark);
      // Side intakes and shoulder air boxes.
      sideDecal(2.95, 0.55, 0.8, 0.24, m.dark, 0.16, 0.18);
      sideDecal(3.25, 0.88, 0.46, 0.07, m.dark, 0.08, -0.1);
      // Engine louvres.
      for (let i = 0; i < 6; i++) bx(3.55 + i * 0.12, k.roofY(3.9, 0) + 0.01, 0, 0.05, 0.02, 0.62, m.dark);
      // Y tail lights, diffuser, hexagonal exhaust.
      el(4.76, 0.8, hw(4.75) * 0.78, 0.04, 0.03, 0.28, m.tail, { rx: 0.5 });
      el(4.76, 0.72, hw(4.75) * 0.72, 0.04, 0.12, 0.03, m.tail);
      bx(4.72, 0.3, 0, 0.18, 0.16, 1.4, m.carbon);
      pipe(4.82, 0.42, 0, 0.11, m.chrome, 6);
      k.wing(4.6, 0.04, 0.2, 1.6, m.dark);
    },
  },

  // Ferrari 458 Spider stand-in while the real model loads.
  car_rosso: midEngine({
    paint: "#c8101b", accent: "#15161a", caliper: "#ffcc33",
    extras: (k) => {
      const { el, sideDecal, pipe, m, surfY, hw } = k;
      el(0.4, surfY(0.4, 0.72) - 0.01, hw(0.4) * 0.72, 0.36, 0.05, 0.14, m.head, { ry: -0.55 });
      sideDecal(2.9, 0.55, 0.5, 0.18, m.dark, 0.1);
      for (const z of [-0.12, 0, 0.12]) pipe(4.62, 0.4, z, 0.055, m.chrome, 16, false);
      el(4.56, 0.85, hw(4.55) * 0.7, 0.06, 0.08, 0.08, m.tail);
    },
  }),

  // Ford Mustang Shelby GT500: long hood, big grille, stripes, tri-bar tails.
  car_muscle: {
    paint: "#1f5fd6", accent: "#ffffff", L: 4.82, W: 1.94, R: 0.37, ride: 0.13, wf: 0.95, wr: 3.68,
    top: [[0, 0.72], [0.18, 0.83], [0.7, 0.9], [1.95, 0.98], [2.9, 1.0], [4.0, 1.02], [4.62, 1.01], [4.82, 0.86]],
    plan: [[0, 0.86], [0.35, 0.97], [1.1, 0.99], [2.5, 0.95], [3.6, 1], [4.6, 0.97], [4.82, 0.9]],
    dip: [[0, 0], [0.4, 0.03], [1.8, 0.03], [2.0, 0]],
    sq: 3.6,
    glass: { a: 1.95, b: 4.45, roof: [[1.95, 0.98], [2.55, 1.34], [3.0, 1.39], [3.45, 1.34], [4.1, 1.09], [4.45, 1.02]], cw: 0.84, rw: 0.64 },
    roofPaint: [2.5, 3.5],
    rim: "#15161a", caliper: "#e0435c", spokes: 5,
    extras: (k) => {
      const { el, bx, band, m, surfY, hw, pipe } = k;
      // Le Mans stripes over hood, roof, and deck.
      for (const [z0, z1] of [[-0.32, -0.08], [0.08, 0.32]]) {
        band(0.05, 1.95, z0, z1, m.accent);
        band(2.0, 4.42, z0 * 0.8, z1 * 0.8, m.accent, "roof", 0.006);
        band(4.45, 4.8, z0, z1, m.accent);
      }
      // Hood heat extractor and the big grille.
      el(1.0, surfY(1.0, 0) + 0.005, 0, 0.42, 0.02, 0.28, m.dark);
      el(0.1, 0.52, 0, 0.1, 0.24, 1.15, m.dark);
      el(0.12, 0.3, 0, 0.1, 0.08, 1.2, m.dark);
      // Fang headlights.
      el(0.2, surfY(0.2, 0.74) - 0.04, hw(0.2) * 0.74, 0.2, 0.07, 0.26, m.head, { rz: -0.2 });
      el(0.16, surfY(0.2, 0.74) - 0.1, hw(0.16) * 0.74, 0.12, 0.015, 0.22, m.amber);
      // Tri-bar tail lights.
      for (const zf of [0.5, 0.63, 0.76]) bx(4.8, 0.86, hw(4.8) * zf, 0.04, 0.17, 0.07, m.tail);
      for (const z of [0.55, 0.7]) pipe(4.84, 0.34, z, 0.055);
      k.wing(4.7, 0.04, 0.2, 1.6, m.dark);
    },
  },

  // Subaru WRX STI: four-door sedan, hood scoop, tall wing, gold wheels.
  car_rally: {
    paint: "#1846a8", accent: "#ffd400", L: 4.6, W: 1.8, R: 0.37, ride: 0.2, wf: 0.95, wr: 3.6,
    top: [[0, 0.76], [0.2, 0.86], [0.8, 0.93], [1.45, 0.99], [2.5, 1.03], [3.6, 1.07], [4.4, 1.09], [4.6, 0.96]],
    plan: [[0, 0.86], [0.35, 0.97], [1.1, 1], [2.4, 0.97], [3.6, 1], [4.5, 0.95], [4.6, 0.88]],
    sq: 3.4,
    glass: { a: 1.45, b: 3.95, roof: [[1.45, 0.99], [2.05, 1.42], [2.4, 1.48], [3.1, 1.47], [3.5, 1.37], [3.95, 1.08]], cw: 0.86, rw: 0.7 },
    roofPaint: [2.15, 3.3],
    rim: "#d4a017", caliper: "#c9ccd2", spokes: 6,
    extras: (k) => {
      const { el, bx, m, surfY, hw, pipe, sideDecal } = k;
      // Hood scoop.
      const hy = surfY(0.95, 0);
      bx(0.95, hy + 0.04, 0, 0.5, 0.1, 0.55, m.paint, { rz: 0.06 });
      bx(0.71, hy + 0.05, 0, 0.02, 0.06, 0.48, m.dark);
      // Hawk-eye headlights and fog lamps.
      el(0.25, surfY(0.25, 0.72) - 0.03, hw(0.25) * 0.72, 0.24, 0.07, 0.28, m.head, { ry: -0.3 });
      el(0.1, 0.6, 0, 0.08, 0.12, 0.6, m.dark);
      el(0.12, 0.4, 0, 0.1, 0.14, 1.1, m.dark);
      el(0.14, 0.42, hw(0.14) * 0.78, 0.06, 0.06, 0.08, m.head);
      // Door seams for a four-door.
      for (const x of [1.95, 2.85, 3.55]) sideDecal(x, 0.75, 0.012, 0.3, m.dark, 0.01);
      // Boomerang tail lights, tall wing, quad pipes.
      el(4.57, 0.98, hw(4.55) * 0.75, 0.05, 0.08, 0.2, m.tail, { rx: 0.4 });
      k.wing(4.32, 0.27, 0.3, 1.6, m.paint);
      for (const z of [0.42, 0.55]) pipe(4.63, 0.4, z, 0.05);
    },
  },

  // Maserati GranTurismo: long elegant hood, oval grille, three fender vents.
  car_midnight: {
    paint: "#1d2b53", accent: "#c9ccd2", L: 4.96, W: 1.95, R: 0.37, ride: 0.12, wf: 1.0, wr: 3.95,
    top: [[0, 0.6], [0.2, 0.73], [0.9, 0.84], [2.0, 0.92], [3.0, 0.96], [4.2, 0.98], [4.76, 0.97], [4.96, 0.84]],
    plan: [[0, 0.8], [0.7, 0.98], [1.5, 0.97], [2.6, 0.94], [3.7, 1], [4.7, 0.96], [4.96, 0.85]],
    dip: [[0, 0.01], [0.5, 0.05], [1.7, 0.05], [2.0, 0]],
    sq: 2.9,
    glass: { a: 2.0, b: 4.55, roof: [[2.0, 0.92], [2.6, 1.27], [3.1, 1.34], [3.6, 1.3], [4.25, 1.06], [4.55, 0.98]], cw: 0.84, rw: 0.62 },
    roofPaint: [2.6, 3.7],
    rim: "#c9ccd2", caliper: "#1c9bd8", spokes: 10,
    extras: (k) => {
      const { el, bx, sideDecal, m, hw, surfY, pipe } = k;
      // Oval grille with chrome vertical bars.
      el(0.05, 0.42, 0, 0.06, 0.17, 0.44 * 2, m.dark);
      for (let i = -4; i <= 4; i++) bx(0.02, 0.42, i * 0.085, 0.03, 0.15 * Math.cos((i / 5) * 1.2), 0.012, m.chrome, { mirror: false });
      // Long almond headlights.
      el(0.4, surfY(0.4, 0.72) - 0.02, hw(0.4) * 0.72, 0.42, 0.06, 0.14, m.head, { ry: -0.35 });
      // Three side vents behind each front wheel.
      for (const x of [1.52, 1.62, 1.72]) sideDecal(x, 0.66, 0.025, 0.12, m.dark, 0.03, 0.4);
      sideDecal(2.9, 0.68, 1.8, 0.012, m.chrome, 0.01);
      el(4.9, 0.86, hw(4.9) * 0.72, 0.06, 0.05, 0.28, m.tail, { ry: 0.25 });
      for (const z of [0.42, 0.55]) pipe(4.98, 0.33, z, 0.05);
    },
  },

  // Toyota GR Supra: short wheelbase, double-bubble roof, ducktail, wide hips.
  car_tuner: {
    paint: "#e33b2e", accent: "#15161a", L: 4.38, W: 1.86, R: 0.35, ride: 0.12, wf: 0.9, wr: 3.38,
    top: [[0, 0.5], [0.25, 0.66], [0.8, 0.79], [1.65, 0.88], [2.4, 0.93], [3.3, 1.0], [3.9, 1.01], [4.22, 1.06], [4.38, 0.9]],
    plan: [[0, 0.8], [0.6, 0.98], [1.5, 0.92], [2.4, 0.89], [3.3, 1], [4.2, 0.95], [4.38, 0.82]],
    dip: [[0, 0.01], [0.35, 0.07], [1.3, 0.07], [1.65, 0]],
    sq: 2.8,
    glass: { a: 1.65, b: 3.9, roof: [[1.65, 0.88], [2.15, 1.21], [2.5, 1.29], [2.9, 1.27], [3.5, 1.08], [3.9, 1.01]], cw: 0.82, rw: 0.62 },
    roofPaint: false,
    rim: "#15161a", caliper: "#e0435c", spokes: 10,
    extras: (k) => {
      const { el, bx, band, m, hw, surfY, pipe, sideDecal } = k;
      // Double-bubble roof: two humps with a channel down the middle.
      band(2.15, 3.3, -0.44, -0.05, m.paint, "roof", 0.018);
      band(2.15, 3.3, 0.05, 0.44, m.paint, "roof", 0.018);
      // Big center intake and slanted headlights.
      el(0.06, 0.3, 0, 0.08, 0.13, 0.96, m.dark);
      el(0.12, 0.42, hw(0.12) * 0.72, 0.06, 0.12, 0.15, m.dark);
      el(0.34, surfY(0.34, 0.74) - 0.02, hw(0.34) * 0.74, 0.3, 0.05, 0.16, m.head, { ry: -0.5 });
      sideDecal(1.45, 0.62, 0.14, 0.05, m.dark, 0.04, 0.3);
      sideDecal(3.05, 0.56, 0.25, 0.06, m.dark, 0.05, 0.15);
      // Slim tail lights under the ducktail, twin round pipes.
      el(4.32, 0.93, hw(4.3) * 0.7, 0.05, 0.03, 0.28, m.tail, { ry: 0.2 });
      bx(4.33, 0.33, 0, 0.12, 0.12, 1.0, m.dark);
      pipe(4.42, 0.34, 0.2, 0.06);
    },
  },

  // Tesla Roadster (new): smooth nose with no grille, low targa body.
  car_roadster: {
    paint: "#b3121f", accent: "#15161a", L: 4.25, W: 1.98, R: 0.35, ride: 0.12, wf: 0.9, wr: 3.35,
    top: [[0, 0.44], [0.3, 0.62], [0.9, 0.74], [1.5, 0.82], [2.4, 0.88], [3.4, 0.95], [4.0, 0.97], [4.25, 0.87]],
    plan: [[0, 0.78], [0.5, 0.97], [1.5, 0.95], [2.4, 0.92], [3.3, 1], [4.1, 0.95], [4.25, 0.84]],
    dip: [[0, 0], [0.4, 0.04], [1.2, 0.04], [1.5, 0]],
    sq: 2.5,
    glass: { a: 1.5, b: 3.8, roof: [[1.5, 0.82], [2.0, 1.1], [2.4, 1.16], [2.8, 1.14], [3.4, 1.0], [3.8, 0.96]], cw: 0.82, rw: 0.6 },
    roofPaint: false,
    rim: "#2a2d33", caliper: "#c9ccd2", spokes: 6,
    extras: (k) => {
      const { el, m, hw, surfY, bx } = k;
      el(0.3, surfY(0.3, 0.76) - 0.02, hw(0.3) * 0.76, 0.3, 0.04, 0.13, m.head, { ry: -0.55 });
      el(0.1, 0.28, 0, 0.06, 0.05, 0.8, m.dark);
      el(4.2, 0.86, hw(4.2) * 0.62, 0.05, 0.025, 0.36, m.tail, { ry: 0.12 });
      bx(4.2, 0.32, 0, 0.12, 0.1, 1.2, m.carbon);
    },
  },

  // Tesla Model S Plaid: long fastback sedan, no grille, glass roof.
  car_models: {
    paint: "#f2f4f6", accent: "#15161a", L: 5.02, W: 1.96, R: 0.36, ride: 0.13, wf: 1.05, wr: 4.0,
    top: [[0, 0.6], [0.25, 0.73], [0.9, 0.85], [1.7, 0.92], [3.0, 0.96], [4.2, 1.0], [4.8, 1.02], [5.02, 0.9]],
    plan: [[0, 0.8], [0.6, 0.97], [1.5, 0.98], [3.0, 0.96], [4.0, 1], [4.85, 0.95], [5.02, 0.84]],
    dip: [[0, 0], [0.5, 0.03], [1.4, 0.03], [1.7, 0]],
    sq: 2.6,
    glass: { a: 1.7, b: 4.75, roof: [[1.7, 0.92], [2.4, 1.36], [2.9, 1.43], [3.5, 1.4], [4.2, 1.19], [4.75, 1.03]], cw: 0.85, rw: 0.66 },
    roofPaint: false,
    rim: "#2a2d33", caliper: "#e0435c", spokes: 5,
    extras: (k) => {
      const { el, m, hw, surfY, sideDecal } = k;
      el(0.3, surfY(0.3, 0.74) - 0.02, hw(0.3) * 0.74, 0.3, 0.05, 0.17, m.head, { ry: -0.4 });
      el(0.1, 0.32, 0, 0.06, 0.06, 0.9, m.dark);
      for (const x of [2.15, 3.15]) sideDecal(x, 0.8, 0.18, 0.015, m.chrome, 0.012);
      for (const x of [2.7, 3.6]) sideDecal(x, 0.66, 0.012, 0.3, m.dark, 0.01);
      el(4.96, 0.92, hw(4.95) * 0.74, 0.07, 0.04, 0.26, m.tail, { ry: 0.3 });
      k.wing(4.9, 0.025, 0.12, 1.4, m.carbon);
    },
  },

  // Rimac Nevera: smooth electric hypercar with a carbon lower body.
  car_volt: midEngine({
    paint: "#e9eef3", accent: "#22d3ee", L: 4.75, W: 1.99, wf: 0.98, wr: 3.72,
    top: [[0, 0.42], [0.3, 0.6], [1.0, 0.74], [1.6, 0.82], [2.6, 0.9], [3.6, 0.98], [4.42, 1.0], [4.75, 0.9]],
    glass: { a: 1.6, b: 4.2, roof: [[1.6, 0.82], [2.2, 1.15], [2.6, 1.21], [3.0, 1.18], [3.7, 1.02], [4.2, 0.99]], cw: 0.84, rw: 0.6 },
    roofPaint: false, rim: "#3a3f47", caliper: "#22d3ee", spokes: 10,
    tone: (_x, y) => (y < 0.42 ? "#1b1d22" : null),
    extras: (k) => {
      const { el, m, hw, surfY, sideDecal, bx } = k;
      el(0.38, surfY(0.38, 0.72) - 0.015, hw(0.38) * 0.72, 0.3, 0.04, 0.12, m.head, { ry: -0.3 });
      el(0.1, 0.36, 0, 0.04, 0.02, hw(0.1) * 1.44, m.blue);
      sideDecal(3.05, 0.62, 0.6, 0.16, m.dark, 0.1, 0.1);
      el(4.71, 0.86, 0, 0.04, 0.025, hw(4.7) * 1.76, m.tail);
      bx(4.68, 0.3, 0, 0.2, 0.14, 1.5, m.carbon);
      k.wing(4.6, 0.04, 0.24, 1.6, m.paint);
    },
  }),

  // Corvette C8.R race car: the C8 shape with a race kit.
  car_gt3: midEngine({
    paint: "#f5d300", accent: "#15161a", L: 4.7, W: 2.06, wf: 0.95, wr: 3.68, ride: 0.1,
    top: [[0, 0.4], [0.25, 0.57], [0.9, 0.74], [1.55, 0.86], [2.6, 0.94], [3.6, 1.02], [4.4, 1.03], [4.7, 0.9]],
    plan: [[0, 0.8], [0.45, 0.97], [1.1, 1], [2.3, 0.92], [3.3, 1], [4.4, 0.98], [4.7, 0.88]],
    glass: { a: 1.55, b: 4.1, roof: [[1.55, 0.86], [2.1, 1.16], [2.5, 1.23], [2.9, 1.2], [3.5, 1.08], [4.1, 1.03]], cw: 0.84, rw: 0.6 },
    roofPaint: [2.2, 3.0], rim: "#15161a", caliper: "#e0435c", spokes: 6,
    extras: (k) => {
      const { el, bx, band, sideDecal, m, surfY, hw, pipe } = k;
      band(0.3, 1.5, -0.25, 0.25, m.accent);
      el(0.34, surfY(0.34, 0.74) - 0.01, hw(0.34) * 0.74, 0.32, 0.045, 0.14, m.head, { ry: -0.45 });
      bx(0.12, 0.17, 0, 0.3, 0.025, 1.8, m.carbon);
      bx(0.2, 0.42, hw(0.2) + 0.03, 0.26, 0.02, 0.12, m.carbon, { rz: 0.2 });
      sideDecal(2.95, 0.6, 0.62, 0.21, m.dark, 0.12, -0.12);
      k.wing(4.5, 0.42, 0.36, 2.06, m.carbon);
      bx(4.62, 0.3, 0, 0.3, 0.16, 1.6, m.carbon);
      for (const z of [-0.08, 0.08]) pipe(4.7, 0.44, z, 0.06, m.chrome, 16, false);
      el(4.66, 0.88, hw(4.6) * 0.72, 0.06, 0.04, 0.3, m.tail, { ry: 0.15 });
    },
  }),

  // Bugatti Chiron: horseshoe grille, C-line, two-tone, quad lamps, center fin.
  car_arrow: midEngine({
    paint: "#1f55d6", accent: "#0b1a40", L: 4.54, W: 2.04, R: 0.37, wf: 0.98, wr: 3.7,
    top: [[0, 0.5], [0.25, 0.64], [1.0, 0.78], [1.55, 0.84], [2.6, 0.92], [3.6, 0.98], [4.3, 0.99], [4.54, 0.88]],
    plan: [[0, 0.8], [0.6, 0.98], [1.6, 0.97], [2.6, 0.92], [3.5, 1], [4.4, 0.98], [4.54, 0.9]],
    glass: { a: 1.55, b: 3.95, roof: [[1.55, 0.84], [2.1, 1.15], [2.5, 1.21], [2.9, 1.19], [3.5, 1.02], [3.95, 0.98]], cw: 0.84, rw: 0.58 },
    roofPaint: [2.2, 3.1], rim: "#c9ccd2", caliper: "#1f55d6", spokes: 10,
    tone: (x, y, zf) => {
      // Inside the C-line, and the rear of the top, wear the dark tone.
      const c = 2.25 + 0.95 * Math.sqrt(Math.max(0, 1 - ((y - 0.6) / 0.34) ** 2));
      if (zf > 0.62 && x > 1.65 && x < c && y > 0.27) return "#0b1a40";
      if (x > 3.3 && zf < 0.6 && y > 0.9) return "#0b1a40";
      return null;
    },
    extras: (k) => {
      const { el, bx, tube, m, hw, surfY, sideZ, pipe } = k;
      // Horseshoe grille.
      const hs: V3[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI * (i / 16);
        hs.push([0.02 + Math.sin(a) * 0.04, 0.24 + Math.sin(a) * 0.3, Math.cos(a) * 0.2]);
      }
      tube(hs, 0.025, m.chrome, false);
      el(0.06, 0.38, 0, 0.06, 0.3, 0.36, m.dark);
      // Quad headlights.
      for (let i = 0; i < 4; i++) el(0.22 + i * 0.07, surfY(0.3, 0.74) - 0.03 + i * 0.012, hw(0.3) * (0.82 - i * 0.04), 0.05, 0.04, 0.05, m.head);
      // The C-line in chrome.
      const cl: V3[] = [];
      for (let i = 0; i <= 20; i++) {
        const a = -Math.PI / 2 + Math.PI * (i / 20);
        const y = 0.6 + Math.sin(a) * 0.34;
        const x = 2.25 + Math.cos(a) * 0.95;
        cl.push([x, y, sideZ(x, y) + 0.012]);
      }
      tube(cl, 0.02, m.chrome, true);
      // Center fin down the roof.
      bx(3.25, k.roofY(3.2, 0) + 0.03, 0, 1.4, 0.06, 0.03, m.accent, { rz: -0.12 });
      // Full-width light bar, quad pipes, active wing.
      el(4.5, 0.84, 0, 0.04, 0.03, hw(4.5) * 1.84, m.tail);
      for (const z of [-0.18, -0.06, 0.06, 0.18]) pipe(4.55, 0.36, z, 0.05, m.chrome, 4, false);
      k.wing(4.25, 0.12, 0.34, 1.7, m.accent);
    },
  }),

  // Koenigsegg Jesko: giant swan-neck wing, roof scoop, front canards.
  car_crown: midEngine({
    paint: "#f3f4f1", accent: "#e8b923", L: 4.61, W: 2.03, R: 0.36, wf: 0.98, wr: 3.68, ride: 0.1,
    top: [[0, 0.4], [0.3, 0.58], [1.0, 0.72], [1.6, 0.8], [2.6, 0.9], [3.6, 1.0], [4.35, 1.02], [4.61, 0.92]],
    glass: { a: 1.6, b: 4.0, roof: [[1.6, 0.8], [2.2, 1.14], [2.6, 1.21], [3.0, 1.19], [3.6, 1.05], [4.0, 1.0]], cw: 0.84, rw: 0.58 },
    roofPaint: [2.2, 3.1], rim: "#15161a", caliper: "#e8b923", spokes: 10,
    tone: (_x, y) => (y < 0.38 ? "#1b1d22" : null),
    extras: (k) => {
      const { el, bx, m, hw, surfY, sideDecal, pipe } = k;
      el(0.36, surfY(0.36, 0.74) - 0.01, hw(0.36) * 0.74, 0.3, 0.035, 0.16, m.head, { ry: -0.25 });
      el(0.1, 0.3, 0, 0.1, 0.1, 1.2, m.dark);
      for (const y of [0.34, 0.42]) bx(0.16, y, hw(0.16) + 0.02, 0.22, 0.015, 0.1, m.carbon, { rz: 0.15 });
      bx(0.12, 0.15, 0, 0.28, 0.025, 1.8, m.carbon);
      // Roof scoop.
      bx(3.0, k.roofY(3.0, 0) + 0.05, 0, 0.55, 0.08, 0.3, m.paint, { rz: -0.1 });
      bx(2.74, k.roofY(2.8, 0) + 0.06, 0, 0.02, 0.06, 0.26, m.dark);
      sideDecal(3.05, 0.6, 0.5, 0.2, m.dark, 0.1, 0.12);
      el(4.57, 0.86, hw(4.55) * 0.72, 0.05, 0.03, 0.26, m.tail, { ry: 0.1 });
      bx(4.55, 0.3, 0, 0.26, 0.16, 1.6, m.carbon);
      for (const z of [-0.1, 0, 0.1]) pipe(4.6, 0.9, z, 0.045, m.chrome, 16, false);
      k.wing(4.58, 0.5, 0.36, 2.1, m.carbon, true);
    },
  }),

  // Audi R8 (Snow Edition): single-frame grille and the side blade.
  car_comet: midEngine({
    paint: "#f4f7fb", accent: "#6fc3ff", L: 4.43, W: 1.94, R: 0.35, wf: 0.95, wr: 3.6,
    top: [[0, 0.5], [0.25, 0.66], [1.0, 0.8], [1.6, 0.86], [2.6, 0.92], [3.6, 0.98], [4.2, 0.98], [4.43, 0.86]],
    plan: [[0, 0.8], [0.6, 0.97], [1.4, 0.98], [2.6, 0.94], [3.4, 1], [4.3, 0.97], [4.43, 0.86]],
    glass: { a: 1.6, b: 4.0, roof: [[1.6, 0.86], [2.2, 1.18], [2.6, 1.24], [3.0, 1.2], [3.6, 1.02], [4.0, 0.98]], cw: 0.84, rw: 0.6 },
    roofPaint: [2.2, 3.1], rim: "#e9edf2", caliper: "#3aa0ff", spokes: 10,
    tone: (x, y, zf) => {
      const b0 = 2.72 + (y - 0.3) * 0.25;
      return zf > 0.72 && x > b0 && x < b0 + 0.38 && y > 0.3 && y < 0.86 ? "#6fc3ff" : null;
    },
    extras: (k) => {
      const { el, m, hw, surfY, pipe } = k;
      // Single-frame hexagonal grille.
      const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.08, 6), m.dark);
      hex.rotation.set(0, Math.PI / 2, Math.PI / 2);
      hex.scale.set(0.62, 1, 1);
      hex.position.set(0.04, 0.4, 0);
      k.add(hex);
      el(0.3, surfY(0.3, 0.74) - 0.02, hw(0.3) * 0.74, 0.3, 0.045, 0.17, m.head, { ry: -0.5 });
      el(4.38, 0.86, hw(4.38) * 0.72, 0.05, 0.035, 0.3, m.tail, { ry: 0.15 });
      for (const z of [0.5, 0.62]) pipe(4.45, 0.35, z, 0.065);
    },
  }),
};

/** Every car id that has a 3D design. */
export const CAR_IDS = Object.keys(SPECS);

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

const ring = (n: number, j: number) => {
  const th = (j / S) * Math.PI * 2;
  const c = Math.cos(th);
  const s = Math.sin(th);
  return { cz: Math.sign(c) * Math.abs(c) ** (2 / n), s, sy: Math.abs(s) };
};

/** Station x values. Rings shrink to a point over `e` at each end. */
function stations(x0: number, x1: number, n: number, e: number) {
  const out: { x: number; k: number }[] = [];
  const C = 6;
  for (let i = 0; i < C; i++) {
    const f = i / C;
    out.push({ x: x0 + e * f, k: Math.sqrt(1 - (1 - f) ** 2) });
  }
  for (let i = 0; i <= n; i++) out.push({ x: x0 + e + ((x1 - x0 - 2 * e) * i) / n, k: 1 });
  for (let i = C - 1; i >= 0; i--) {
    const f = i / C;
    out.push({ x: x1 - e * f, k: Math.sqrt(1 - (1 - f) ** 2) });
  }
  return out;
}

function gridGeometry(rows: THREE.Vector3[][], closed: boolean, colors?: THREE.Color[][]) {
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const w = rows[0].length;
  rows.forEach((r, i) =>
    r.forEach((p, j) => {
      pos.push(p.x, p.y, p.z);
      if (colors) col.push(colors[i][j].r, colors[i][j].g, colors[i][j].b);
    }),
  );
  const cols = closed ? w : w - 1;
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * w + j;
      const b = i * w + ((j + 1) % w);
      const c = (i + 1) * w + j;
      const d = (i + 1) * w + ((j + 1) % w);
      // Rings run around +x, so closed lofts wind the other way to face out.
      if (closed) idx.push(a, c, b, b, c, d);
      else idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (colors) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const MATS: Record<string, THREE.Material> = {};
const mat = (key: string, make: () => THREE.Material) => (MATS[key] ??= make());
const std = (c: string, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, ...o });
const paintMat = (c: string) => mat("p" + c, () => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.5, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 }));

function wheel(s: Spec) {
  const g = new THREE.Group();
  const R = s.R;
  const tireMat = mat("tire", () => std("#121215", { roughness: 0.88 }));
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.28, 32), tireMat);
  tire.rotation.x = Math.PI / 2;
  g.add(tire);
  for (const z of [-0.14, 0.14]) {
    const wall = new THREE.Mesh(new THREE.TorusGeometry(R - 0.035, 0.035, 8, 32), tireMat);
    wall.position.z = z;
    g.add(wall);
  }
  const rimMat = mat("rim" + s.rim, () => std(s.rim, { metalness: 0.9, roughness: 0.22 }));
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.72, R * 0.72, 0.27, 28), mat("barrel", () => std("#1d1e22", { metalness: 0.6, roughness: 0.45 })));
  barrel.rotation.x = Math.PI / 2;
  g.add(barrel);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.6, R * 0.6, 0.02, 24), mat("disc", () => std("#8d9096", { metalness: 0.8, roughness: 0.4 })));
  disc.rotation.x = Math.PI / 2;
  g.add(disc);
  for (const side of [-1, 1]) {
    const face = new THREE.Group();
    face.position.z = side * 0.135;
    face.add(new THREE.Mesh(new THREE.TorusGeometry(R * 0.72, 0.022, 6, 32), rimMat));
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.15, R * 0.15, 0.04, 14), rimMat);
    hub.rotation.x = Math.PI / 2;
    face.add(hub);
    const n = s.spokes;
    for (let i = 0; i < n; i++) {
      const sp = new THREE.Mesh(new THREE.BoxGeometry(R * 0.62, n > 7 ? 0.035 : 0.07, 0.035), rimMat);
      const a = (i / n) * Math.PI * 2;
      sp.position.set(Math.cos(a) * R * 0.4, Math.sin(a) * R * 0.4, 0);
      sp.rotation.z = a;
      face.add(sp);
    }
    g.add(face);
  }
  const cal = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.24, 0.07), mat("cal" + s.caliper, () => std(s.caliper, { roughness: 0.4 })));
  cal.position.set(R * 0.38, R * 0.22, 0);
  cal.rotation.z = 0.5;
  const calHolder = new THREE.Group();
  calHolder.add(cal);
  return { wheel: g, caliper: calHolder };
}

/** Build the lofted body. Nose at x = 0, tail at x = L. */
function buildBody(s: Spec) {
  const body = new THREE.Group();
  const top = fn(s.top);
  const planF = fn(s.plan);
  const hw = (x: number) => (planF(x) * s.W) / 2;
  const dipF = s.dip ? fn(s.dip) : () => 0;
  const bot = s.ride + 0.1;
  const mid = (x: number) => bot + (top(x) - bot) * 0.42;
  const n = s.sq ?? 3;
  const archR = s.R + 0.06;
  const arch = (x: number) => {
    let y = bot;
    for (const w of [s.wf, s.wr]) {
      const dx = Math.abs(x - w);
      if (dx < archR) y = Math.max(y, s.R + Math.sqrt(archR * archR - dx * dx) * 0.98);
    }
    return Math.min(y, top(x) - 0.06);
  };
  const surfY = (x: number, zf: number) => {
    const a = Math.min(1, Math.abs(zf));
    const t = (1 - a ** n) ** (1 / n);
    return mid(x) + (top(x) - mid(x)) * t - dipF(x) * t * (1 - a * a) ** 2;
  };
  const sideZ = (x: number, y: number) => {
    const m = mid(x);
    if (y >= m) {
      const t = Math.min(1, (y - m) / (top(x) - m));
      return hw(x) * (1 - t ** n) ** (1 / n);
    }
    const t = Math.min(1, (m - y) / (m - bot));
    return hw(x) * (1 - t ** NB) ** (1 / NB);
  };

  const g = s.glass;
  const roofF = fn(g.roof);
  const glassB = (x: number) => top(x) - 0.025;
  const glassH = (x: number) => Math.max(0, roofF(x) - glassB(x));
  const roofY = (x: number, zf: number) => glassB(x) + glassH(x) * (1 - Math.min(1, Math.abs(zf)) ** 4) ** 0.25;

  // Body shell, colored per vertex for the wheel arches and two-tones.
  const paint = new THREE.Color(s.paint);
  const dark = new THREE.Color("#0b0b0d");
  const toneCache: Record<string, THREE.Color> = {};
  const rows: THREE.Vector3[][] = [];
  const colors: THREE.Color[][] = [];
  for (const st of stations(0, s.L, 150, 0.06)) {
    const x = st.x;
    const r: THREE.Vector3[] = [];
    const cr: THREE.Color[] = [];
    const t = top(x);
    const m = mid(x);
    const a = arch(x);
    const h = hw(x);
    const dp = dipF(x);
    for (let j = 0; j < S; j++) {
      const up = ring(n, j);
      let y: number;
      let zf: number;
      if (up.s >= 0) {
        const ys = up.sy ** (2 / n);
        zf = up.cz;
        y = m + (t - m) * ys - dp * ys * (1 - zf * zf) ** 2;
      } else {
        const lo = ring(NB, j);
        zf = lo.cz;
        y = m - (m - bot) * lo.sy ** (2 / NB);
      }
      let clipped = false;
      if (y < a && a > bot + 0.001) {
        y = a;
        clipped = true;
      }
      r.push(new THREE.Vector3(x, (y - m) * st.k + m, zf * h * st.k));
      let c = clipped ? dark : paint;
      const hex = !clipped && s.tone ? s.tone(x, y, Math.abs(zf)) : null;
      if (hex) c = toneCache[hex] ??= new THREE.Color(hex);
      cr.push(c);
    }
    rows.push(r);
    colors.push(cr);
  }
  const bodyMat = new THREE.MeshPhysicalMaterial({ color: "#ffffff", vertexColors: true, metalness: 0.5, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.05 });
  body.add(new THREE.Mesh(gridGeometry(rows, true, colors), bodyMat));

  // Greenhouse.
  const glassMat = mat("glass", () => new THREE.MeshPhysicalMaterial({ color: "#0c141f", metalness: 0.3, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0.92 }));
  const grows: THREE.Vector3[][] = [];
  for (const st of stations(g.a, g.b, 70, 0.04)) {
    const x = st.x;
    const yb = glassB(x);
    const H = glassH(x) * st.k;
    const hB = hw(x) * g.cw * (0.3 + 0.7 * st.k);
    const hT = hw(x) * g.rw * (0.3 + 0.7 * st.k);
    const r: THREE.Vector3[] = [];
    for (let j = 0; j < S; j++) {
      const u = ring(3, j);
      if (u.s >= 0) {
        const tt = Math.sqrt(u.sy);
        r.push(new THREE.Vector3(x, yb + H * tt, u.cz * (hB + (hT - hB) * tt)));
      } else r.push(new THREE.Vector3(x, yb - 0.02, u.cz * hB));
    }
    grows.push(r);
  }
  body.add(new THREE.Mesh(gridGeometry(grows, true), glassMat));

  // Underbody.
  const under = new THREE.Mesh(new THREE.BoxGeometry(s.L - 0.5, 0.1, s.W - 0.55), mat("under", () => std("#101013", { roughness: 0.9 })));
  under.position.set(s.L / 2, s.ride + 0.1, 0);
  body.add(under);

  const M: Kit["m"] = {
    paint: paintMat(s.paint),
    accent: paintMat(s.accent),
    dark: mat("dark", () => std("#0d0d10", { roughness: 0.6 })),
    chrome: mat("chrome", () => std("#e8eaee", { metalness: 1, roughness: 0.12 })),
    head: mat("head", () => std("#ffffff", { emissive: "#eaf4ff", emissiveIntensity: 1.8 })),
    tail: mat("tail", () => std("#ff1a2e", { emissive: "#ff1a2e", emissiveIntensity: 1.6 })),
    amber: mat("amber", () => std("#ffb020", { emissive: "#ff9a00", emissiveIntensity: 1.2 })),
    blue: mat("glow" + s.accent, () => std(s.accent, { emissive: s.accent, emissiveIntensity: 2 })),
    carbon: mat("carbon", () => std("#1a1b1f", { metalness: 0.4, roughness: 0.35 })),
  };
  const sphere = new THREE.SphereGeometry(0.5, 20, 14);
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const place = (geo: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, mm: THREE.Material, o: Rot = {}) => {
    const mirror = o.mirror ?? z !== 0;
    for (const side of mirror ? [1, -1] : [1]) {
      const me = new THREE.Mesh(geo, mm);
      me.position.set(x, y, z * side);
      me.scale.set(sx, sy, sz);
      me.rotation.set((o.rx ?? 0) * side, (o.ry ?? 0) * side, o.rz ?? 0);
      body.add(me);
    }
  };
  const band: Kit["band"] = (x0, x1, z0, z1, mm, on = "body", lift = 0.004) => {
    const brs: THREE.Vector3[][] = [];
    const N = 60;
    for (let i = 0; i <= N; i++) {
      const x = x0 + ((x1 - x0) * i) / N;
      const r: THREE.Vector3[] = [];
      for (let j = 0; j <= 8; j++) {
        const z = z0 + ((z1 - z0) * j) / 8;
        const y = on === "roof" ? roofY(x, z / (hw(x) * g.rw)) : surfY(x, z / hw(x));
        r.push(new THREE.Vector3(x, y + lift, z));
      }
      brs.push(r);
    }
    body.add(new THREE.Mesh(gridGeometry(brs, false), mm));
  };
  const tube: Kit["tube"] = (pts, r, mm, mirror = true) => {
    for (const side of mirror ? [1, -1] : [1]) {
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z * side)));
      body.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8, false), mm));
    }
  };
  const kit: Kit = {
    top, hw, surfY, sideZ, roofY, m: M, band, tube,
    add: (o) => body.add(o),
    el: (x, y, z, sx, sy, sz, mm, o) => place(sphere, x, y, z, sx, sy, sz, mm, o),
    bx: (x, y, z, sx, sy, sz, mm, o) => place(cube, x, y, z, sx, sy, sz, mm, o),
    pipe: (x, y, z, r, mm = M.chrome, sides = 16, mirror = true) => {
      const geo = new THREE.CylinderGeometry(r, r, 0.14, sides);
      const holeGeo = new THREE.CircleGeometry(r * 0.75, sides);
      for (const side of mirror && z !== 0 ? [1, -1] : [1]) {
        const p = new THREE.Mesh(geo, mm);
        p.rotation.z = Math.PI / 2;
        p.position.set(x, y, z * side);
        body.add(p);
        const hole = new THREE.Mesh(holeGeo, M.dark);
        hole.rotation.y = Math.PI / 2;
        hole.position.set(x + 0.071, y, z * side);
        body.add(hole);
      }
    },
    sideDecal: (x, y, sx, sy, mm, depth = 0.08, rz = 0) => place(sphere, x, y, sideZ(x, y) - depth * 0.35, sx, sy, depth, mm, { rz }),
    wing: (x, h, chord, span, mm, swan = false) => {
      const yb = top(x);
      const blade = new THREE.Mesh(new THREE.BoxGeometry(chord, 0.035, span), mm);
      blade.position.set(x, yb + h, 0);
      blade.rotation.z = -0.12;
      body.add(blade);
      if (h <= 0.08) return;
      for (const side of [1, -1]) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(chord * 1.3, 0.18, 0.02), mm);
        plate.position.set(x, yb + h - 0.03, (side * span) / 2);
        body.add(plate);
        if (swan) {
          const pts: V3[] = [[x - 0.35, yb - 0.01, 0.35], [x - 0.15, yb + h * 0.75, 0.38], [x + 0.02, yb + h + 0.06, 0.4], [x + 0.08, yb + h + 0.02, 0.4]];
          tube(pts.map(([a, b, c]) => [a, b, c * side] as V3), 0.022, M.carbon, false);
        } else {
          const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.03), M.carbon);
          st.position.set(x - 0.02, yb + h / 2, side * span * 0.28);
          body.add(st);
        }
      }
    },
  };

  if (s.roofPaint) {
    const zr = hw(2.6) * g.rw * 0.92;
    band(s.roofPaint[0], s.roofPaint[1], -zr, zr, M.paint, "roof", 0.003);
  }
  // Mirrors.
  const mx = g.a + 0.32;
  kit.el(mx, glassB(mx) + 0.07, hw(mx) * g.cw + 0.07, 0.16, 0.08, 0.13, M.paint);
  kit.bx(mx - 0.02, glassB(mx) + 0.04, hw(mx) * g.cw + 0.02, 0.06, 0.03, 0.08, M.dark);
  s.extras(kit);
  body.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return body;
}

/* ------------------------------------------------------------------ */
/* Real models                                                         */
/* ------------------------------------------------------------------ */

// Cars with a real, credited model file (public/models/LICENSE.txt).
// `turn` rotates the loaded model so its nose points to +x. `body` names
// paint materials to recolor (the Ferrari only; Sketchfab cars keep their
// own paint). `hide` drops extra decal meshes; `plain` swaps a texture that
// has logos painted in for a solid color. Anything matching BADGE is blacked out: no logos in the app.
type ModelInfo = { url: string; length: number; turn: number; body?: string[]; hide?: RegExp; plain?: Record<string, string> };
const MODELS: Record<string, ModelInfo> = {
  car_rosso: { url: "/models/cars/ferrari-458.glb", length: 4.53, body: ["Body_Color"], turn: -Math.PI / 2 },
  car_vette: { url: "/models/cars/car_vette.glb", length: 4.63, turn: Math.PI / 2 },
  car_coupe: { url: "/models/cars/car_coupe.glb", length: 4.57, turn: Math.PI / 2, hide: /PaletteMaterial001\b|W1Mtl|Usagemeral/ }, // side lettering, crest, plate
  car_wedge: { url: "/models/cars/car_wedge.glb", length: 4.94, turn: Math.PI / 2 },
  car_muscle: { url: "/models/cars/car_muscle.glb", length: 4.82, turn: Math.PI / 2 },
  car_rally: { url: "/models/cars/car_rally.glb", length: 4.47, turn: -Math.PI / 2 },
  car_midnight: { url: "/models/cars/car_midnight.glb", length: 4.91, turn: Math.PI },
  car_tuner: { url: "/models/cars/car_tuner.glb", length: 4.38, turn: -Math.PI / 2 },
  car_roadster: { url: "/models/cars/car_roadster.glb", length: 4.3, turn: Math.PI / 2 },
  car_volt: { url: "/models/cars/car_volt.glb", length: 4.75, turn: -Math.PI / 2, hide: /nevera|image_5/ }, // name lettering, logo,
  car_gt3: { url: "/models/cars/car_gt3.glb", length: 4.63, turn: -Math.PI / 2, plain: { c8rVehicle_Exterior_mm_ext1: "#f3c316", c8rVehicle_Exterior_mm_tyre1: "#1c1c1e" } }, // sponsor logos are painted into the livery
  car_arrow: { url: "/models/cars/car_arrow.glb", length: 4.54, turn: 0 },
  car_crown: { url: "/models/cars/car_crown.glb", length: 4.61, turn: -Math.PI / 2 },
  car_comet: { url: "/models/cars/car_comet.glb", length: 4.43, turn: Math.PI },
};
const BADGE = /badge|logo|emblem|decal|crest|lettering|script|license|plate|ferrari_yellow/i;
const HIDE = /shadow|ground|floor|backdrop|^plane/i;
const gltfCache: Record<string, Promise<THREE.Group>> = {};
let draco: DRACOLoader | null = null;

function loadModel(id: string, paintHex: string): Promise<THREE.Group> {
  const info = MODELS[id];
  gltfCache[id] ??= (async () => {
    draco ??= new DRACOLoader().setDecoderPath("/draco/");
    const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(info.url);
    const model = gltf.scene;
    const paint = new THREE.MeshPhysicalMaterial({ color: paintHex, metalness: 0.6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.04 });
    const glass = new THREE.MeshPhysicalMaterial({ color: "#0e1520", metalness: 0.2, roughness: 0.03, transparent: true, opacity: 0.6 });
    const badge = new THREE.MeshStandardMaterial({ color: "#1a1b1f", metalness: 0.6, roughness: 0.4 });
    const hide: THREE.Object3D[] = [];
    model.traverse((o) => {
      const me = o as THREE.Mesh;
      if (!me.isMesh) return;
      me.castShadow = true;
      const mats = ([] as THREE.Material[]).concat(me.material);
      const names = [me.name, me.parent?.name ?? "", ...mats.map((m) => m.name)].join(" ");
      const plain = info.plain?.[mats[0].name];
      if (HIDE.test(names) || info.hide?.test(names)) hide.push(me);
      else if (BADGE.test(names)) {
        // A see-through decal is dropped; a solid emblem is blacked out.
        if (mats[0].transparent) hide.push(me);
        else me.material = badge;
      } else if (plain) me.material = new THREE.MeshPhysicalMaterial({ color: plain, metalness: 0.4, roughness: 0.35, clearcoat: 1 });
      else if (info.body?.includes(mats[0].name)) me.material = paint;
      else if (mats[0].name === "Glass_Gray") me.material = glass;
    });
    hide.forEach((o) => o.removeFromParent());
    const wrap = new THREE.Group();
    wrap.add(model);
    model.rotation.y = info.turn;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model, true);
    const size = box.getSize(new THREE.Vector3());
    model.scale.setScalar(info.length / Math.max(size.x, size.z));
    model.updateMatrixWorld(true);
    const box2 = new THREE.Box3().setFromObject(model, true);
    const c = box2.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box2.min.y, -c.z);
    return wrap;
  })();
  return gltfCache[id].then((g) => g.clone(true));
}

export type Car = { root: THREE.Group; update: (t: number, speed: number) => void };

/**
 * Build a car centered on the origin, facing +x, wheels on y = 0. Set
 * root.userData.env to an environment map before a real model finishes
 * loading and the model picks it up too.
 */
export function makeCar(id: string): Car {
  const s = SPECS[id] ?? SPECS.car_wedge;
  const inner = new THREE.Group();
  inner.add(buildBody(s));

  const wheels: THREE.Object3D[] = [];
  for (const x of [s.wf, s.wr]) {
    for (const side of [-1, 1]) {
      const { wheel: w, caliper } = wheel(s);
      w.position.set(x, s.R, side * (s.W / 2 - 0.17));
      caliper.position.copy(w.position);
      caliper.position.z += side * -0.05;
      inner.add(w, caliper);
      wheels.push(w);
    }
  }
  inner.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });
  inner.children.forEach((ch) => (ch.position.x -= s.L / 2));
  inner.rotation.y = Math.PI; // the profile is drawn nose at x = 0; turn it to face +x
  const root = new THREE.Group();
  root.add(inner);

  let spin = (sp: number) => wheels.forEach((w) => (w.rotation.z -= sp));
  if (MODELS[id]) {
    loadModel(id, s.paint)
      .then((model) => {
        const env = root.userData.env as THREE.Texture | undefined;
        if (env)
          model.traverse((o) => {
            const me = o as THREE.Mesh;
            if (me.isMesh) ([] as THREE.Material[]).concat(me.material).forEach((mm) => ((mm as THREE.MeshStandardMaterial).envMap = env));
          });
        root.remove(inner);
        root.add(model);
        const real: THREE.Object3D[] = [];
        model.traverse((o) => {
          if (/^wheel_(fl|fr|rl|rr)$/.test(o.name)) real.push(o);
        });
        spin = (sp: number) => real.forEach((w) => (w.rotation.x -= sp));
      })
      .catch(() => {
        // Keep the lofted stand-in if the model can't load.
      });
  }
  return { root, update: (_t, speed) => spin(speed) };
}
