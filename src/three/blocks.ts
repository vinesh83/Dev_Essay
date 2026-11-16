import * as THREE from "three";

// Block-world pieces: pixel-art block textures painted in code (original
// art), voxel islands with grass, dirt, and stone layers studded with ores,
// blocky trees, torches, and tappable ore blocks Dev can mine.

export type Ore = "coal" | "iron" | "gold" | "diamond" | "emerald";
export const ORE_COLOR: Record<Ore, string> = { coal: "#2b2b30", iron: "#d9a27c", gold: "#ffd54a", diamond: "#5ef2e6", emerald: "#3ddc6a" };

const B = 0.5; // block size

function rng(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function tex(draw: (px: (x: number, y: number, c: string) => void, r: () => number) => void, seed: number) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 16;
  const g = cv.getContext("2d")!;
  const r = rng(seed);
  draw((x, y, c) => {
    g.fillStyle = c;
    g.fillRect(x, y, 1, 1);
  }, r);
  const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const shade = (base: number, r: () => number, spread = 26) => {
  const v = Math.max(0, Math.min(255, base + Math.round((r() - 0.5) * spread)));
  return `rgb(${v},${v},${v})`;
};

const T: Record<string, THREE.Texture> = {};
function textures() {
  if (T.dirt) return T;
  T.dirt = tex((px, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, `hsl(25, 38%, ${28 + r() * 12}%)`); }, 7);
  T.stone = tex((px, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, shade(128, r, 34)); }, 9);
  for (const ore of Object.keys(ORE_COLOR) as Ore[]) {
    T[ore] = tex((px, r) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, shade(128, r, 34));
      const c = new THREE.Color(ORE_COLOR[ore]);
      for (let k = 0; k < 6; k++) {
        const cx = 2 + Math.floor(r() * 11);
        const cy = 2 + Math.floor(r() * 11);
        for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) if (r() < 0.85) px(cx + dx, cy + dy, `#${c.clone().offsetHSL(0, 0, (r() - 0.5) * 0.15).getHexString()}`);
      }
    }, 11 + ore.length);
  }
  T.log = tex((px, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, `hsl(28, 40%, ${(x % 4 === 0 ? 18 : 26) + r() * 8}%)`); }, 13);
  T.leaves = tex((px, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, r() < 0.12 ? "rgb(40,70,40)" : shade(190, r, 60)); }, 17);
  return T;
}

const mat = (map: THREE.Texture, color: THREE.ColorRepresentation = "#ffffff", extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ map, color, roughness: 0.95, ...extra });

/** A floating voxel island. The top face sits at y = 0. */
export function voxelIsland(grass: THREE.Color, unlocked: boolean, seed: number) {
  const t = textures();
  const dim = unlocked ? 1 : 0.45;
  const tint = (c: THREE.ColorRepresentation) => new THREE.Color(c).multiplyScalar(dim);
  const gc = (r: () => number) => `#${grass.clone().offsetHSL(0, 0, (r() - 0.5) * 0.12).getHexString()}`;
  const top = tex((px, r) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, gc(r)); }, 3 + seed);
  const side = tex((px, r) => {
    for (let y = 0; y < 16; y++)
      for (let x = 0; x < 16; x++) px(x, y, y < 3 + ((x * 7) % 3) ? gc(r) : `hsl(25, 38%, ${30 + r() * 10}%)`);
  }, 5 + seed);
  const sideM = mat(side, tint("#fff"));
  const grassMats = [sideM, sideM, mat(top, tint("#fff")), mat(t.dirt, tint("#fff")), sideM, sideM];
  const r = rng(seed * 97 + 1);
  const layers: { y: number; rad: number; kind: "grass" | "dirt" | "stone" }[] = [
    { y: -B / 2, rad: 2.95, kind: "grass" },
    { y: -B * 1.5, rad: 2.75, kind: "dirt" },
    { y: -B * 2.5, rad: 2.35, kind: "stone" },
    { y: -B * 3.5, rad: 1.9, kind: "stone" },
    { y: -B * 4.5, rad: 1.35, kind: "stone" },
    { y: -B * 5.5, rad: 0.8, kind: "stone" },
  ];
  const cells: Record<string, THREE.Vector3[]> = { grass: [], dirt: [], stone: [], coal: [], iron: [], gold: [], diamond: [], emerald: [] };
  for (const L of layers) {
    for (let x = -3; x <= 3; x += B)
      for (let z = -3; z <= 3; z += B) {
        const cx = x + B / 2;
        const cz = z + B / 2;
        const wobble = L.rad + (r() - 0.5) * 0.35;
        if (cx * cx + cz * cz > wobble * wobble) continue;
        let k: string = L.kind;
        if (k === "stone") {
          const q = r();
          k = q < 0.06 ? "coal" : q < 0.1 ? "iron" : q < 0.125 ? "gold" : q < 0.14 ? "diamond" : q < 0.15 ? "emerald" : "stone";
        }
        cells[k].push(new THREE.Vector3(cx, L.y, cz));
      }
  }
  const g = new THREE.Group();
  const box = new THREE.BoxGeometry(B, B, B);
  const m4 = new THREE.Matrix4();
  for (const [k, list] of Object.entries(cells)) {
    if (!list.length) continue;
    const material = k === "grass" ? grassMats : mat(t[k], tint("#fff"));
    const im = new THREE.InstancedMesh(box, material, list.length);
    list.forEach((p, i) => im.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)));
    im.castShadow = k === "grass";
    im.receiveShadow = k === "grass";
    g.add(im);
  }
  return g;
}

/** A blocky tree: log trunk and a leafy crown. */
export function voxelTree(leafColor: THREE.ColorRepresentation, h = 3) {
  const t = textures();
  const g = new THREE.Group();
  const s = 0.32;
  const log = mat(t.log);
  const leaves = mat(t.leaves, leafColor);
  const cube = new THREE.BoxGeometry(s, s, s);
  for (let i = 0; i < h; i++) {
    const m = new THREE.Mesh(cube, log);
    m.position.y = s / 2 + i * s;
    g.add(m);
  }
  for (let x = -1; x <= 1; x++)
    for (let z = -1; z <= 1; z++)
      for (let y = 0; y < 2; y++) {
        if (y === 1 && Math.abs(x) + Math.abs(z) === 2) continue;
        const m = new THREE.Mesh(cube, leaves);
        m.position.set(x * s, h * s + y * s, z * s);
        g.add(m);
      }
  const top = new THREE.Mesh(cube, leaves);
  top.position.y = h * s + 2 * s;
  g.add(top);
  g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
  return g;
}

/** A torch with a flickering flame. Returns the group and a flicker updater. */
export function torch() {
  const g = new THREE.Group();
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.4, 0.07), mat(textures().log));
  stick.position.y = 0.2;
  const flame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.1), new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffae00", emissiveIntensity: 2.5 }));
  flame.position.y = 0.45;
  const light = new THREE.PointLight("#ffb347", 1.6, 3.2, 1.6);
  light.position.y = 0.55;
  g.add(stick, flame, light);
  return {
    g,
    update(t: number) {
      const f = 0.85 + Math.sin(t * 13) * 0.08 + Math.sin(t * 29) * 0.05;
      light.intensity = 1.6 * f;
      flame.scale.y = f;
    },
  };
}

/** A small ore block sitting on the grass, ready to mine. */
export function oreBlock(ore: Ore) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.34, 0.34), mat(textures()[ore], "#fff", { emissive: ORE_COLOR[ore], emissiveIntensity: 0.12 }));
  m.position.y = 0.17;
  m.castShadow = true;
  m.userData.ore = ore;
  return m;
}

/** Little cube shards that burst out when a block breaks. */
export function shards(ore: Ore, at: THREE.Vector3) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.07, 0.07, 0.07);
  const mats = [new THREE.MeshStandardMaterial({ color: ORE_COLOR[ore], emissive: ORE_COLOR[ore], emissiveIntensity: 0.4 }), new THREE.MeshStandardMaterial({ color: "#8a8a90" })];
  const parts: { m: THREE.Mesh; v: THREE.Vector3 }[] = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.Mesh(geo, mats[i % 2]);
    m.position.copy(at);
    parts.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 2.4, 1.5 + Math.random() * 1.8, (Math.random() - 0.5) * 2.4) });
    g.add(m);
  }
  // XP orbs: small glowing green spheres that float up.
  const orbMat = new THREE.MeshStandardMaterial({ color: "#9dff6b", emissive: "#6bff3a", emissiveIntensity: 1.8 });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), orbMat);
    m.position.copy(at);
    parts.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 0.8, 2.2 + Math.random(), (Math.random() - 0.5) * 0.8) });
    g.add(m);
  }
  let age = 0;
  return {
    g,
    /** Returns false when finished. */
    update(dt: number) {
      age += dt;
      for (const p of parts) {
        p.v.y -= 6 * dt;
        p.m.position.addScaledVector(p.v, dt);
        p.m.rotation.x += dt * 5;
        p.m.scale.setScalar(Math.max(0, 1 - age / 1.1));
      }
      return age < 1.1;
    },
  };
}

/** Pixel-style tools Dev crafts. They replace the hero's held gear. */
export function voxelTool(id: string) {
  const g = new THREE.Group();
  const p = 0.07;
  const head = id.includes("diamond") ? ORE_COLOR.diamond : id.includes("gold") ? ORE_COLOR.gold : id.includes("emerald") ? ORE_COLOR.emerald : "#cfd3da";
  const headMat = new THREE.MeshStandardMaterial({ color: head, metalness: 0.4, roughness: 0.35, emissive: head, emissiveIntensity: id.includes("diamond") || id.includes("emerald") ? 0.25 : 0.05 });
  const wood = new THREE.MeshStandardMaterial({ color: "#7a4f2c", roughness: 0.9 });
  const cube = new THREE.BoxGeometry(p, p, p);
  const put = (x: number, y: number, m: THREE.Material) => {
    const c = new THREE.Mesh(cube, m);
    c.position.set(x * p, y * p, 0);
    g.add(c);
  };
  if (id.includes("pick")) {
    for (let y = 0; y < 10; y++) put(0, y, wood);
    for (let x = -4; x <= 4; x++) put(x, 10 - Math.floor(Math.abs(x) / 2.5), headMat);
  } else if (id.includes("axe")) {
    for (let y = 0; y < 10; y++) put(0, y, wood);
    for (let y = 6; y <= 10; y++) for (let x = 1; x <= (y === 6 || y === 10 ? 2 : 3); x++) put(x, y, headMat);
  } else {
    // sword
    for (let y = 0; y < 3; y++) put(0, y, wood);
    for (let x = -2; x <= 2; x++) put(x, 3, wood);
    for (let y = 4; y < 13; y++) put(0, y, headMat);
    for (let y = 5; y < 12; y++) put(y % 2 ? 1 : -1, y, headMat);
  }
  g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
  return g;
}
