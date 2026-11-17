import * as THREE from "three";

// Procedural sports cars. No model files, no logos, no brands: each car is
// an original design built from a side profile (extruded and beveled for
// smooth curves), a tinted glass cabin, real wheels with rims and brake
// calipers, glowing lights, and glossy clear-coat paint.

export type CarSpec = {
  paint: string;
  accent?: string; // stripes / two-tone
  L: number; // length
  W: number; // width
  nose: number; // nose height
  belt: number; // height where the glass starts
  tail: number; // tail height
  roof: number; // roof height
  ws: number; // windshield base (x from the front)
  roofA: number; // roof start x
  roofB: number; // roof end x
  rear: number; // rear glass base x
  wf: number; // front wheel x
  wr: number; // rear wheel x
  R: number; // wheel radius
  ride: number; // ground clearance
  wing?: "lip" | "duck" | "big" | "gt";
  stripes?: boolean;
  round?: boolean; // round headlights (classic)
  lightbar?: boolean; // full-width light bar (electric)
  rim?: string;
  caliper?: string;
  number?: number; // race number
  scoop?: boolean;
};

const base = { W: 1.95, R: 0.36, ride: 0.14, rim: "#c9ccd2", caliper: "#e0435c" };

export const CAR_SPECS: Record<string, CarSpec> = {
  car_roadster: { ...base, paint: "#c8102e", L: 4.3, nose: 0.52, belt: 0.82, tail: 0.92, roof: 1.08, ws: 1.35, roofA: 2.05, roofB: 2.55, rear: 3.5, wf: 0.9, wr: 3.45, wing: "lip", rim: "#2a2d33", caliper: "#c9ccd2" },
  car_models: { ...base, paint: "#f2f4f6", L: 5.0, W: 2.0, nose: 0.62, belt: 0.92, tail: 0.98, roof: 1.42, ws: 1.6, roofA: 2.3, roofB: 3.55, rear: 4.5, wf: 1.0, wr: 3.95, wing: "lip", rim: "#2a2d33", caliper: "#e0435c" },
  car_vette: { ...base, paint: "#ff6a13", accent: "#16171c", L: 4.6, nose: 0.58, belt: 0.86, tail: 0.98, roof: 1.16, ws: 1.45, roofA: 2.15, roofB: 2.7, rear: 3.7, wf: 0.95, wr: 3.65, wing: "duck", rim: "#16171c", caliper: "#e0435c", scoop: true },
  car_wedge: { ...base, paint: "#9be22a", L: 4.6, nose: 0.55, belt: 0.82, tail: 0.95, roof: 1.12, ws: 1.35, roofA: 2.25, roofB: 2.85, rear: 3.75, wf: 0.95, wr: 3.7, wing: "lip", caliper: "#ffcc33", scoop: true },
  car_rosso: { ...base, paint: "#d8141e", L: 4.5, nose: 0.6, belt: 0.86, tail: 0.98, roof: 1.18, ws: 1.4, roofA: 2.15, roofB: 2.7, rear: 3.6, wf: 0.95, wr: 3.6, wing: "duck", caliper: "#ffcc33" },
  car_coupe: { ...base, paint: "#b9bcc4", L: 4.4, nose: 0.62, belt: 0.86, tail: 0.86, roof: 1.3, ws: 1.5, roofA: 2.1, roofB: 2.6, rear: 4.1, wf: 0.85, wr: 3.55, round: true, wing: "duck", rim: "#2b2b30" },
  car_muscle: { ...base, paint: "#1f5fd6", accent: "#ffffff", L: 4.8, W: 2.0, nose: 0.85, belt: 0.98, tail: 0.95, roof: 1.36, ws: 1.9, roofA: 2.5, roofB: 3.15, rear: 3.9, wf: 1.0, wr: 3.85, R: 0.38, stripes: true, wing: "lip", scoop: true, rim: "#1b1b1f" },
  car_rally: { ...base, paint: "#1846a8", accent: "#ffd400", L: 4.3, nose: 0.75, belt: 1.02, tail: 1.0, roof: 1.5, ws: 1.35, roofA: 1.95, roofB: 3.3, rear: 3.9, wf: 0.85, wr: 3.45, R: 0.4, ride: 0.3, stripes: true, wing: "big", rim: "#ffd400", number: 7 },
  car_midnight: { ...base, paint: "#1d2b53", accent: "#c9ccd2", L: 4.9, nose: 0.66, belt: 0.92, tail: 0.94, roof: 1.28, ws: 1.7, roofA: 2.45, roofB: 3.1, rear: 4.1, wf: 1.05, wr: 3.9, wing: "duck", rim: "#c9ccd2", caliper: "#1c9bd8" },
  car_tuner: { ...base, paint: "#3d5a80", accent: "#16171c", L: 4.4, nose: 0.66, belt: 0.9, tail: 0.9, roof: 1.3, ws: 1.55, roofA: 2.15, roofB: 2.85, rear: 3.75, wf: 0.9, wr: 3.55, wing: "big", rim: "#16171c", stripes: true },
  car_volt: { ...base, paint: "#eef2f6", accent: "#22d3ee", L: 4.7, nose: 0.55, belt: 0.84, tail: 0.95, roof: 1.12, ws: 1.35, roofA: 2.2, roofB: 2.9, rear: 3.8, wf: 0.95, wr: 3.75, lightbar: true, wing: "lip", rim: "#3a3f47", caliper: "#22d3ee" },
  car_gt3: { ...base, paint: "#f5d300", accent: "#16171c", L: 4.7, W: 2.05, nose: 0.55, belt: 0.86, tail: 0.95, roof: 1.18, ws: 1.5, roofA: 2.2, roofB: 2.85, rear: 3.8, wf: 0.95, wr: 3.75, wing: "gt", stripes: true, rim: "#16171c", number: 3, scoop: true },
  car_arrow: { ...base, paint: "#1846c8", accent: "#0b1a40", L: 4.6, W: 2.05, nose: 0.6, belt: 0.86, tail: 0.98, roof: 1.18, ws: 1.45, roofA: 2.2, roofB: 2.8, rear: 3.75, wf: 0.98, wr: 3.65, R: 0.38, wing: "big", rim: "#c9ccd2" },
  car_crown: { ...base, paint: "#e8b923", accent: "#16171c", L: 4.7, W: 2.05, nose: 0.55, belt: 0.84, tail: 0.98, roof: 1.12, ws: 1.35, roofA: 2.2, roofB: 2.85, rear: 3.8, wf: 0.95, wr: 3.75, R: 0.38, wing: "gt", rim: "#16171c", caliper: "#16171c", scoop: true },
  car_comet: { ...base, paint: "#9fd8ff", accent: "#ffffff", L: 4.6, nose: 0.55, belt: 0.84, tail: 0.96, roof: 1.14, ws: 1.4, roofA: 2.2, roofB: 2.85, rear: 3.75, wf: 0.95, wr: 3.7, lightbar: true, wing: "duck", rim: "#ffffff", caliper: "#3aa0ff" },
};

let paintCache: Record<string, THREE.MeshPhysicalMaterial> = {};
const paint = (c: string) =>
  (paintCache[c] ??= new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.55, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06 }));
const std = (c: THREE.ColorRepresentation, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, ...o });
const glass = () => new THREE.MeshPhysicalMaterial({ color: "#0d1622", metalness: 0.2, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.88 });

function extrude(shape: THREE.Shape, depth: number, bevel: number) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5, curveSegments: 18, steps: 1 });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  return g;
}

/** The body side profile, with wheel arches cut out. x = 0 is the nose. */
function bodyShape(c: CarSpec) {
  const s = new THREE.Shape();
  const g = c.ride;
  const arch = c.R + 0.07;
  s.moveTo(0.05, g + 0.1);
  s.quadraticCurveTo(-0.04, c.nose * 0.75, 0.12, c.nose);
  s.quadraticCurveTo(c.ws * 0.6, c.nose + (c.belt - c.nose) * 0.55, c.ws, c.belt);
  s.lineTo(c.rear, c.belt + (c.tail - c.belt) * 0.6);
  s.quadraticCurveTo(c.L - 0.12, c.tail + 0.02, c.L, c.tail - 0.05);
  s.quadraticCurveTo(c.L + 0.05, (c.tail + g) / 2, c.L - 0.05, g + 0.1);
  s.lineTo(c.wr + arch, g + 0.1);
  s.absarc(c.wr, c.R, arch, 0, Math.PI, false);
  s.lineTo(c.wf + arch, g + 0.1);
  s.absarc(c.wf, c.R, arch, 0, Math.PI, false);
  s.lineTo(0.05, g + 0.1);
  return s;
}

function cabinShape(c: CarSpec) {
  const s = new THREE.Shape();
  s.moveTo(c.ws, c.belt - 0.02);
  s.quadraticCurveTo(c.ws + (c.roofA - c.ws) * 0.55, c.roof - 0.02, c.roofA, c.roof);
  s.lineTo(c.roofB, c.roof);
  s.quadraticCurveTo(c.roofB + (c.rear - c.roofB) * 0.45, c.roof - 0.04, c.rear, c.belt + (c.tail - c.belt) * 0.6 - 0.02);
  s.lineTo(c.ws, c.belt - 0.02);
  return s;
}

function wheel(c: CarSpec) {
  const g = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.CylinderGeometry(c.R, c.R, 0.3, 28), std("#111114", { roughness: 0.85 }));
  tire.rotation.x = Math.PI / 2;
  g.add(tire);
  const rimMat = std(c.rim ?? "#c9ccd2", { metalness: 0.9, roughness: 0.25 });
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(c.R * 0.7, c.R * 0.7, 0.31, 24), std("#222226", { metalness: 0.6, roughness: 0.4 }));
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(c.R * 0.16, c.R * 0.16, 0.34, 12), rimMat);
  hub.rotation.x = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < 5; i++) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(c.R * 1.3, 0.07, 0.05), rimMat);
    spoke.rotation.z = (i / 5) * Math.PI;
    spoke.position.z = 0.15;
    g.add(spoke);
    const back = spoke.clone();
    back.position.z = -0.15;
    g.add(back);
  }
  const lip = new THREE.Mesh(new THREE.TorusGeometry(c.R * 0.7, 0.025, 6, 28), rimMat);
  lip.position.z = 0.155;
  g.add(lip);
  const lip2 = lip.clone();
  lip2.position.z = -0.155;
  g.add(lip2);
  const cal = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.08), std(c.caliper ?? "#e0435c", { roughness: 0.4 }));
  cal.position.set(c.R * 0.35, c.R * 0.25, 0);
  const calHolder = new THREE.Group(); // calipers don't spin
  calHolder.add(cal);
  return { wheel: g, caliper: calHolder };
}

function numberTex(n: number) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const x = cv.getContext("2d")!;
  x.fillStyle = "#fff";
  x.beginPath();
  x.arc(64, 64, 58, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = "#111";
  x.font = "bold 72px sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText(String(n), 64, 70);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export type Car = { root: THREE.Group; update: (t: number, speed: number) => void };

/** Build a car centered on the origin, facing +x, wheels on y = 0. */
export function makeCar(id: string): Car {
  const c = CAR_SPECS[id] ?? CAR_SPECS.car_wedge;
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const bw = c.W - 0.22;
  const p = paint(c.paint);

  const shell = new THREE.Mesh(extrude(bodyShape(c), bw - 0.16, 0.08), p);
  shell.castShadow = true;
  shell.receiveShadow = true;
  body.add(shell);

  const cab = new THREE.Mesh(extrude(cabinShape(c), bw * 0.72, 0.06), glass());
  cab.castShadow = true;
  body.add(cab);
  // Roof panel in body color (or the accent on two-tones).
  const roofW = (c.roofB - c.roofA) * 0.95;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.05, bw * 0.66), c.accent && !c.stripes ? paint(c.accent) : p);
  roof.position.set((c.roofA + c.roofB) / 2, c.roof + 0.05, 0);
  body.add(roof);

  // Dark underbody and side skirts.
  const under = new THREE.Mesh(new THREE.BoxGeometry(c.L - 0.4, 0.12, bw - 0.1), std("#141418", { roughness: 0.9 }));
  under.position.set(c.L / 2, c.ride + 0.12, 0);
  body.add(under);

  if (c.stripes && c.accent) {
    const sm = paint(c.accent);
    for (const z of [-0.18, 0.18]) {
      const hood = new THREE.Mesh(new THREE.BoxGeometry(c.ws - 0.2, 0.012, 0.18), sm);
      const ang = Math.atan2(c.belt - c.nose, c.ws);
      hood.position.set(c.ws / 2 + 0.08, (c.nose + c.belt) / 2 + 0.11, z);
      hood.rotation.z = ang;
      body.add(hood);
      const top = new THREE.Mesh(new THREE.BoxGeometry(roofW, 0.012, 0.18), sm);
      top.position.set((c.roofA + c.roofB) / 2, c.roof + 0.1, z);
      body.add(top);
    }
  }

  if (c.scoop) {
    const sc = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.5), std("#0e0f13", { roughness: 0.6 }));
    sc.position.set(c.ws * 0.62, c.nose + (c.belt - c.nose) * 0.62 + 0.06, 0);
    sc.rotation.z = Math.atan2(c.belt - c.nose, c.ws);
    body.add(sc);
  }

  // Headlights.
  const head = std("#ffffff", { emissive: "#eaf4ff", emissiveIntensity: 1.6 });
  if (c.round) {
    for (const z of [-bw / 2 + 0.3, bw / 2 - 0.3]) {
      const h = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), head);
      h.position.set(0.18, c.nose - 0.05, z);
      h.rotation.y = -Math.PI / 2 + (z > 0 ? -0.5 : 0.5);
      body.add(h);
    }
  } else {
    for (const z of [-bw / 2 + 0.28, bw / 2 - 0.28]) {
      const h = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.38), head);
      h.position.set(0.16, c.nose - 0.06, z);
      h.rotation.z = -0.35;
      body.add(h);
    }
  }
  if (c.lightbar) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.035, bw - 0.1), std(c.accent ?? "#fff", { emissive: c.accent ?? "#fff", emissiveIntensity: 2 }));
    bar.position.set(0.06, c.nose - 0.12, 0);
    body.add(bar);
  }
  // Tail lights.
  const tailMat = std("#ff1a2e", { emissive: "#ff1a2e", emissiveIntensity: 1.4 });
  if (c.lightbar) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, bw - 0.1), tailMat);
    bar.position.set(c.L + 0.02, c.tail - 0.14, 0);
    body.add(bar);
  } else {
    for (const z of [-bw / 2 + 0.25, bw / 2 - 0.25]) {
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.36), tailMat);
      t.position.set(c.L + 0.02, c.tail - 0.14, z);
      body.add(t);
    }
  }
  // Grille / intake.
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.14, bw * 0.55), std("#0b0b0e", { roughness: 0.7 }));
  grille.position.set(0.04, c.ride + 0.28, 0);
  body.add(grille);
  // Exhausts.
  for (const z of c.wing === "gt" || c.wing === "big" ? [-0.2, 0.2] : [-0.32, 0.32]) {
    const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.14, 12), std("#9aa0a8", { metalness: 1, roughness: 0.2 }));
    ex.rotation.z = Math.PI / 2;
    ex.position.set(c.L + 0.04, c.ride + 0.22, z);
    body.add(ex);
  }
  // Mirrors.
  for (const z of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.14), p);
    m.position.set(c.ws + 0.25, c.belt + 0.08, z * (bw / 2 + 0.02));
    body.add(m);
  }

  // Wings.
  if (c.wing && c.wing !== "lip") {
    const wm = c.accent && c.wing !== "duck" ? paint(c.accent) : p;
    if (c.wing === "duck") {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, bw - 0.1), wm);
      d.position.set(c.L - 0.15, c.tail + 0.04, 0);
      d.rotation.z = 0.25;
      body.add(d);
    } else {
      const h = c.wing === "gt" ? 0.42 : 0.3;
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, c.W + (c.wing === "gt" ? 0.1 : 0)), wm);
      wing.position.set(c.L - 0.25, c.tail + h, 0);
      wing.rotation.z = 0.12;
      body.add(wing);
      for (const z of [-0.45, 0.45]) {
        const st = new THREE.Mesh(new THREE.BoxGeometry(0.1, h, 0.04), std("#16171c"));
        st.position.set(c.L - 0.25, c.tail + h / 2, z);
        body.add(st);
      }
      for (const z of [-1, 1]) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.02), wm);
        plate.position.set(c.L - 0.25, c.tail + h, z * (c.W / 2 + (c.wing === "gt" ? 0.05 : 0)));
        body.add(plate);
      }
    }
  } else if (c.wing === "lip") {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, bw - 0.2), std("#16171c"));
    lip.position.set(c.L - 0.06, c.tail + 0.02, 0);
    body.add(lip);
  }
  // Front splitter.
  const split = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, bw), std("#16171c"));
  split.position.set(0.1, c.ride + 0.06, 0);
  body.add(split);

  if (c.number) {
    const tex = numberTex(c.number);
    for (const z of [-1, 1]) {
      const d = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5 }));
      d.position.set((c.wf + c.wr) / 2, (c.ride + c.belt) / 2 + 0.08, z * (bw / 2 + 0.01));
      d.rotation.y = z > 0 ? 0 : Math.PI;
      body.add(d);
    }
  }

  // Wheels.
  const wheels: THREE.Group[] = [];
  for (const x of [c.wf, c.wr]) {
    for (const z of [-1, 1]) {
      const { wheel: w, caliper } = wheel(c);
      w.position.set(x, c.R, z * (c.W / 2 - 0.16));
      caliper.position.copy(w.position);
      caliper.position.z += z * -0.06;
      root.add(w, caliper);
      wheels.push(w);
    }
  }
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  // Center the car: nose at +x.
  root.children.forEach((ch) => ch.position.x -= c.L / 2);
  const flip = new THREE.Group();
  root.rotation.y = Math.PI; // so the nose points to +x (profile was drawn nose at x=0)
  flip.add(root);

  const update = (_t: number, speed: number) => {
    for (const w of wheels) w.rotation.z -= speed;
  };
  return { root: flip, update };
}
