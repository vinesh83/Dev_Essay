import * as THREE from "three";

// Ellie the Sheepadoodle, Dev's faithful companion. Built from hundreds of
// small fluff puffs so she looks curly and soft: mostly white, with black
// ears, a patch around one eye, and a grey saddle. She breathes, wags, tilts
// her head, hops, and spins. All motion is procedural, no model file needed.

type Trick = "hop" | "spin" | "tilt" | "zoomies";

const WHITE = new THREE.Color("#f6f2ea");
const CREAM = new THREE.Color("#e9e1d2");
const BLACK = new THREE.Color("#2a2a30");
const GREY = new THREE.Color("#6d6c74");

function rand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Puffs scattered over an ellipsoid surface, as one instanced mesh. */
function fluff(
  center: THREE.Vector3,
  radii: THREE.Vector3,
  count: number,
  size: [number, number],
  colorAt: (p: THREE.Vector3) => THREE.Color,
  seed: number,
  filter?: (p: THREE.Vector3) => boolean,
) {
  const r = rand(seed);
  const geo = new THREE.IcosahedronGeometry(1, 1);
  const mat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: false });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 6; tries++) {
    const u = r() * 2 - 1;
    const th = r() * Math.PI * 2;
    const k = Math.sqrt(1 - u * u);
    const local = new THREE.Vector3(k * Math.cos(th), u, k * Math.sin(th));
    if (filter && !filter(local)) continue;
    const p = new THREE.Vector3(local.x * radii.x, local.y * radii.y, local.z * radii.z).add(center);
    const sz = size[0] + r() * (size[1] - size[0]);
    q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
    s.set(sz, sz * (0.85 + r() * 0.3), sz);
    m.compose(p, q, s);
    mesh.setMatrixAt(n, m);
    const c = colorAt(local).clone().offsetHSL(0, 0, (r() - 0.5) * 0.06);
    mesh.setColorAt(n, c);
    n++;
  }
  mesh.count = n;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function solid(radii: THREE.Vector3, color: THREE.Color, pos: THREE.Vector3) {
  const g = new THREE.SphereGeometry(1, 16, 12);
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 1 }));
  mesh.scale.copy(radii);
  mesh.position.copy(pos);
  mesh.castShadow = true;
  return mesh;
}

export function makeEllie() {
  const root = new THREE.Group(); // position/rotation set by the world
  const body = new THREE.Group(); // hops and spins
  root.add(body);
  root.name = "ellie";

  // Torso with a grey saddle on the back.
  const torsoC = new THREE.Vector3(0, 0.42, 0);
  const torsoR = new THREE.Vector3(0.2, 0.19, 0.34);
  body.add(solid(torsoR.clone().multiplyScalar(0.92), WHITE, torsoC));
  body.add(fluff(torsoC, torsoR, 150, [0.06, 0.095], (p) => (p.y > 0.45 && p.z < 0.3 && p.z > -0.7 ? GREY : p.y < -0.3 ? CREAM : WHITE), 7));

  // Legs.
  const legs: THREE.Group[] = [];
  for (const [x, z] of [[-0.11, 0.2], [0.11, 0.2], [-0.11, -0.2], [0.11, -0.2]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.3, z);
    const c = new THREE.Vector3(0, -0.15, 0);
    const rr = new THREE.Vector3(0.065, 0.16, 0.065);
    leg.add(solid(rr.clone().multiplyScalar(0.85), WHITE, c));
    leg.add(fluff(c, rr, 26, [0.04, 0.06], (p) => (p.y < -0.6 ? CREAM : WHITE), 11 + legs.length));
    body.add(leg);
    legs.push(leg);
  }

  // Head: a pivot at the neck so she can tilt and look around.
  const neck = new THREE.Group();
  neck.position.set(0, 0.58, 0.28);
  body.add(neck);
  const headC = new THREE.Vector3(0, 0.12, 0.08);
  const headR = new THREE.Vector3(0.2, 0.19, 0.18);
  neck.add(solid(headR.clone().multiplyScalar(0.9), WHITE, headC));
  // Black patch around her left eye.
  neck.add(fluff(headC, headR, 110, [0.05, 0.075], (p) => (p.x > 0.25 && p.y > -0.1 && p.z > 0.2 ? BLACK : WHITE), 21));
  // Topknot.
  neck.add(fluff(new THREE.Vector3(0, 0.27, 0.06), new THREE.Vector3(0.1, 0.06, 0.09), 22, [0.04, 0.06], () => WHITE, 23));
  // Muzzle, nose, mouth.
  const muzC = new THREE.Vector3(0, 0.06, 0.27);
  const muzR = new THREE.Vector3(0.09, 0.075, 0.08);
  neck.add(solid(muzR.clone().multiplyScalar(0.9), WHITE, muzC));
  neck.add(fluff(muzC, muzR, 34, [0.03, 0.045], () => WHITE, 25, (p) => p.z > -0.3));
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), new THREE.MeshStandardMaterial({ color: "#151518", roughness: 0.3 }));
  nose.position.set(0, 0.09, 0.355);
  nose.scale.set(1.2, 0.85, 0.9);
  neck.add(nose);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), new THREE.MeshStandardMaterial({ color: "#ff7a95", roughness: 0.6 }));
  tongue.position.set(0, -0.0, 0.32);
  tongue.scale.set(0.8, 0.35, 1);
  neck.add(tongue);
  // Eyes: dark and shiny.
  for (const x of [-0.065, 0.065]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 8), new THREE.MeshStandardMaterial({ color: "#0d0d10", roughness: 0.15, metalness: 0.1 }));
    eye.position.set(x * 1.15, 0.17, 0.255);
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), new THREE.MeshBasicMaterial({ color: "#ffffff" }));
    glint.position.set(0.008, 0.01, 0.022);
    eye.add(glint);
    neck.add(eye);
  }
  // Floppy black ears on pivots.
  const ears: THREE.Group[] = [];
  for (const side of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(side * 0.18, 0.22, 0.04);
    const ec = new THREE.Vector3(side * 0.03, -0.12, 0);
    const er = new THREE.Vector3(0.05, 0.13, 0.08);
    ear.add(solid(er.clone().multiplyScalar(0.85), BLACK, ec));
    ear.add(fluff(ec, er, 30, [0.035, 0.05], () => BLACK, 31 + side));
    ear.rotation.z = side * 0.25;
    neck.add(ear);
    ears.push(ear);
  }
  // Collar with a gold tag.
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.022, 8, 20), new THREE.MeshStandardMaterial({ color: "#e0435c", roughness: 0.5 }));
  collar.position.set(0, -0.02, 0.02);
  collar.rotation.x = Math.PI / 2 + 0.35;
  neck.add(collar);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 12), new THREE.MeshStandardMaterial({ color: "#ffcc33", metalness: 0.8, roughness: 0.25 }));
  tag.position.set(0, -0.09, 0.14);
  tag.rotation.x = Math.PI / 2;
  neck.add(tag);

  // Tail: a fluffy pom on a pivot.
  const tail = new THREE.Group();
  tail.position.set(0, 0.52, -0.32);
  const tc = new THREE.Vector3(0, 0.1, -0.06);
  tail.add(fluff(tc, new THREE.Vector3(0.07, 0.11, 0.07), 26, [0.04, 0.06], () => WHITE, 41));
  tail.rotation.x = -0.6;
  body.add(tail);

  // Hearts that float up when she is happy.
  const hearts: { s: THREE.Sprite; t0: number }[] = [];
  const heartTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.font = "48px serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("💖", 32, 36);
    return new THREE.CanvasTexture(c);
  })();

  let trick: { name: Trick; t0: number; dur: number } | null = null;
  let wagBoost = 0;

  const doTrick = (name: Trick, now: number) => {
    trick = { name, t0: now, dur: name === "spin" ? 0.9 : name === "zoomies" ? 2.2 : name === "tilt" ? 1.4 : 0.55 };
    wagBoost = 2.5;
    if (name !== "tilt") {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, depthWrite: false }));
      s.scale.setScalar(0.22);
      s.position.set((Math.random() - 0.5) * 0.2, 1.0, 0.2);
      root.add(s);
      hearts.push({ s, t0: now });
    }
  };

  const update = (t: number, dt: number) => {
    wagBoost = Math.max(0, wagBoost - dt * 0.8);
    // Breathing and a happy wag.
    body.scale.set(1, 1 + Math.sin(t * 3) * 0.012, 1);
    tail.rotation.z = Math.sin(t * (12 + wagBoost * 6)) * (0.45 + wagBoost * 0.15);
    for (const [i, ear] of ears.entries()) ear.rotation.x = Math.sin(t * 2 + i) * 0.06;
    tongue.position.y = -0.005 + Math.sin(t * 6) * 0.004;

    body.position.y = 0;
    body.rotation.y = 0;
    neck.rotation.set(0, Math.sin(t * 0.6) * 0.25, 0);
    legs.forEach((l) => (l.rotation.x = 0));

    if (trick) {
      const k = (t - trick.t0) / trick.dur;
      if (k >= 1) trick = null;
      else if (trick.name === "hop") {
        body.position.y = Math.sin(k * Math.PI) * 0.28;
        legs.forEach((l, i) => (l.rotation.x = (i < 2 ? -1 : 1) * Math.sin(k * Math.PI) * 0.5));
      } else if (trick.name === "spin") {
        body.rotation.y = k * Math.PI * 2;
        body.position.y = Math.sin(k * Math.PI) * 0.12;
      } else if (trick.name === "tilt") {
        neck.rotation.z = Math.sin(k * Math.PI) * 0.45;
        ears.forEach((e, i) => (e.rotation.z = (i ? 1 : -1) * (0.25 + Math.sin(k * Math.PI) * 0.3)));
      } else if (trick.name === "zoomies") {
        body.rotation.y = k * Math.PI * 4;
        body.position.y = Math.abs(Math.sin(k * Math.PI * 6)) * 0.15;
        legs.forEach((l, i) => (l.rotation.x = Math.sin(k * 40 + i * 1.6) * 0.6));
      }
    }
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i];
      const a = t - h.t0;
      h.s.position.y = 1.0 + a * 0.5;
      (h.s.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - a / 1.4);
      if (a > 1.4) {
        root.remove(h.s);
        h.s.material.dispose();
        hearts.splice(i, 1);
      }
    }
  };

  return { root, update, trick: doTrick };
}
