import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
import { makeEllie } from "./ellie";

// A real-time 3D world: floating islands for each realm, Dev's hero with his
// gear, Ellie the Sheepadoodle, coins, clouds, sparkles, and the Crystal Academy far
// away. Built to run on a Chromebook: low-poly models, one shadow light,
// capped pixel ratio, and no rendering while the canvas is off-screen.

export type WorldOpts = {
  realms: { sky: readonly [string, string]; ground: string; accent: string; unlocked: boolean }[];
  current: number; // index of Dev's realm
  sky: readonly [string, string];
  accent: string;
  hat?: string;
  cape?: string; // hex color
  pet?: string; // emoji
  gear?: string;
  layout: "home" | "stage";
  mood: "idle" | "cheer";
};

export type World = { resize: (w: number, h: number) => void; setActive: (on: boolean) => void; cheer: () => void; dispose: () => void };

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();
const load = (name: string) => {
  if (!cache.has(name)) cache.set(name, loader.loadAsync(`/models/${name}.glb`));
  return cache.get(name)!;
};

function normalize(obj: THREE.Object3D, size: number, axis: "x" | "y" = "y") {
  const box = new THREE.Box3().setFromObject(obj);
  const dim = box.getSize(new THREE.Vector3());
  const s = size / (axis === "y" ? dim.y : Math.max(dim.x, dim.z));
  obj.scale.multiplyScalar(s);
  return s;
}

function shadows(obj: THREE.Object3D, cast = true, receive = true) {
  obj.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = cast;
      o.receiveShadow = receive;
    }
  });
}

function dotTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.3, "rgba(255,240,200,0.8)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function emojiSprite(emoji: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,0.55)");
  grad.addColorStop(0.7, "rgba(160,200,255,0.25)");
  grad.addColorStop(1, "rgba(160,200,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  g.font = "72px serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(emoji, 64, 70);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  sp.scale.set(0.9, 0.9, 0.9);
  return sp;
}

/* ---------- procedural pieces ---------- */

const std = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, flatShading: true, ...extra });

function islandRock(radius: number, color: THREE.Color) {
  const g = new THREE.ConeGeometry(radius, radius * 1.5, 7, 3);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < radius * 0.7) {
      pos.setX(i, pos.getX(i) * (0.85 + Math.random() * 0.3));
      pos.setZ(i, pos.getZ(i) * (0.85 + Math.random() * 0.3));
    }
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, std(color.clone().multiplyScalar(0.55)));
  m.rotation.x = Math.PI;
  m.castShadow = true;
  return m;
}

function castle(accent: string) {
  const g = new THREE.Group();
  const stone = std("#d9d4f5");
  const roof = std("#6b4eff");
  const keep = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 2.2), stone);
  keep.position.y = 1.1;
  g.add(keep);
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 3, 8), stone);
    t.position.set(x, 1.5, z);
    const r = new THREE.Mesh(new THREE.ConeGeometry(0.62, 1.2, 8), roof);
    r.position.set(x, 3.6, z);
    g.add(t, r);
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 2, 8), stone);
  spire.position.y = 3.2;
  const spireRoof = new THREE.Mesh(new THREE.ConeGeometry(0.75, 1.6, 8), roof);
  spireRoof.position.y = 5;
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.45), new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.4, roughness: 0.2 }));
  crystal.position.y = 6.3;
  crystal.name = "spin";
  const glow = new THREE.PointLight(accent, 6, 10);
  glow.position.y = 6.3;
  g.add(spire, spireRoof, crystal, glow);
  shadows(g);
  return g;
}

function lockCrystal() {
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.7),
    new THREE.MeshStandardMaterial({ color: "#9d8cff", emissive: "#4b36c9", emissiveIntensity: 0.8, transparent: true, opacity: 0.85, roughness: 0.15 }),
  );
  m.name = "spin";
  return m;
}

function hatMesh(id: string) {
  const g = new THREE.Group();
  if (id === "hat_cap") {
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), std("#2f8fdc"));
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 12, 1, false, -Math.PI / 2, Math.PI), std("#1f6fb0"));
    brim.position.set(0, 0.02, 0.3);
    brim.scale.z = 1.4;
    g.add(top, brim);
  } else if (id === "hat_crown") {
    const gold = std("#ffcc33", { metalness: 0.6, roughness: 0.3, emissive: "#664400", emissiveIntensity: 0.3 });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 12, 1, true), gold);
    band.position.y = 0.12;
    g.add(band);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 5), gold);
      sp.position.set(Math.sin(a) * 0.42, 0.38, Math.cos(a) * 0.42);
      g.add(sp);
    }
  } else if (id === "hat_wizard") {
    const purple = std("#5b3fd6");
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.45, 1.3, 10), purple);
    cone.position.y = 0.65;
    cone.rotation.z = 0.15;
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.06, 16), purple);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), std("#ffd166", { emissive: "#ffd166", emissiveIntensity: 1 }));
    star.position.set(0.2, 0.6, 0.35);
    g.add(cone, brim, star);
  } else if (id === "hat_helmet") {
    const steel = std("#c8d0e0", { metalness: 0.7, roughness: 0.3 });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel);
    const plume = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), std("#e0435c"));
    plume.position.y = 0.7;
    plume.rotation.x = -0.4;
    g.add(dome, plume);
  }
  shadows(g, true, false);
  return g;
}

function gearMesh(id: string) {
  const g = new THREE.Group();
  const wood = std("#8a5a33");
  const steel = std("#d6dbe8", { metalness: 0.7, roughness: 0.25 });
  if (id === "gear_sword") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.9, 0.02), steel);
    blade.position.y = 0.55;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 0.08), std("#ffcc33", { metalness: 0.5 }));
    g.add(blade, guard);
  } else if (id === "gear_shield") {
    const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.06, 6), std("#2f8fdc"));
    sh.rotation.x = Math.PI / 2;
    const boss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), std("#ffcc33", { metalness: 0.5 }));
    boss.position.z = 0.05;
    g.add(sh, boss);
  } else if (id === "gear_wand") {
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), wood);
    stick.position.y = 0.35;
    const tip = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffd166", emissiveIntensity: 1.5 }));
    tip.position.y = 0.75;
    g.add(stick, tip);
  } else if (id === "gear_bow") {
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.035, 6, 16, Math.PI), wood);
    bow.rotation.z = -Math.PI / 2;
    g.add(bow);
  } else {
    // quill
    const feather = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 6), std("#ffffff"));
    feather.position.y = 0.35;
    g.add(feather);
  }
  shadows(g, true, false);
  return g;
}

function capeMesh(color: string) {
  const geo = new THREE.PlaneGeometry(0.8, 1, 6, 8);
  geo.translate(0, -0.5, 0);
  const mat = std(color, { side: THREE.DoubleSide, flatShading: false });
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.userData.base = Float32Array.from(geo.attributes.position.array as Float32Array);
  return m;
}

/* ---------- the world ---------- */

export async function createWorld(canvas: HTMLCanvasElement, o: WorldOpts): Promise<World> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const top = new THREE.Color(o.sky[0]);
  const bottom = new THREE.Color(o.sky[1]);
  scene.fog = new THREE.Fog(bottom.clone().lerp(top, 0.25), 18, 60);

  // Sky dome with a vertical gradient.
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: { top: { value: top }, bottom: { value: bottom } },
    vertexShader: "varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vP,1.0); }",
    fragmentShader:
      "uniform vec3 top;\nuniform vec3 bottom;\nvarying vec3 vP;\nvoid main(){\n  float h = normalize(vP).y;\n  gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.15, 0.6, h)), 1.0);\n  #include <colorspace_fragment>\n}",
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(90, 24, 16), skyMat));

  // Stars when the sky is dark.
  const dark = top.r * 0.3 + top.g * 0.59 + top.b * 0.11 < 0.35;
  const dot = dotTexture();
  if (dark) {
    const n = 400;
    const pts = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = Math.random() * Math.PI * 2;
      const ph = Math.random() * Math.PI * 0.42;
      pts.set([Math.cos(th) * Math.sin(ph) * 85, Math.cos(ph) * 85 - 5, Math.sin(th) * Math.sin(ph) * 85], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 0.9, map: dot, transparent: true, depthWrite: false, fog: false, color: "#fff7e0" })));
  }

  // Light.
  scene.add(new THREE.HemisphereLight(top.clone().lerp(new THREE.Color("#ffffff"), 0.6), new THREE.Color(o.realms[o.current].ground), 1.6));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.6);
  sun.position.set(6, 12, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(o.accent, 1.2);
  rim.position.set(-6, 4, -8);
  scene.add(rim);

  const [grass, coin, cloud, flag, character] = await Promise.all(["grass", "coin", "cloud", "flag", "character"].map(load));

  const spinners: THREE.Object3D[] = [];
  const bobbers: { obj: THREE.Object3D; base: number; phase: number }[] = [];

  // Islands along a winding path; Dev's realm sits at the center.
  const islands: THREE.Group[] = [];
  o.realms.forEach((r, i) => {
    const d = i - o.current;
    const isl = new THREE.Group();
    const col = new THREE.Color(r.ground).lerp(new THREE.Color(r.accent), 0.2);
    const grassCol = r.unlocked ? col : col.clone().lerp(new THREE.Color("#2a2550"), 0.6);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.75, 0.45, 10), std(grassCol));
    top.position.y = -0.225; // walkable surface at y = 0
    top.receiveShadow = true;
    top.castShadow = true;
    const dirt = new THREE.Mesh(new THREE.CylinderGeometry(2.78, 2.5, 0.7, 10), std(new THREE.Color("#7a5236").lerp(grassCol, 0.15)));
    dirt.position.y = -0.8;
    dirt.castShadow = true;
    isl.add(top, dirt);
    const rock = islandRock(2.5, new THREE.Color("#6b5a7a").lerp(new THREE.Color(r.ground), 0.3));
    rock.position.y = -1.15 - 1.85;
    isl.add(rock);
    if (r.unlocked) {
      for (let k = 0; k < 5; k++) {
        const t = grass.scene.clone(true);
        normalize(t, 0.32);
        const a = k * 1.6 + i + 2.2;
        t.position.set(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.1 - 0.3);
        shadows(t, false, true);
        isl.add(t);
      }
    } else {
      const lc = lockCrystal();
      lc.position.y = 1.4;
      spinners.push(lc);
      isl.add(lc);
    }
    if (i === o.realms.length - 1) {
      const c = castle(o.accent);
      c.scale.setScalar(0.9);
      c.position.set(0, 0, -0.4);
      isl.add(c);
    }
    isl.position.set(d * 7.5, d * 0.9 + Math.sin(i * 1.3) * 0.6, -Math.abs(d) * 5 - (d > 0 ? d * 2 : 0));
    bobbers.push({ obj: isl, base: isl.position.y, phase: i * 1.1 });
    islands.push(isl);
    scene.add(isl);
  });
  const home = islands[o.current];

  // Flag and coins.
  const fl = flag.scene.clone(true);
  normalize(fl, 1.6);
  fl.position.set(1.9, 0, -1.3);
  shadows(fl);
  home.add(fl);
  for (let k = 0; k < 3; k++) {
    const c = coin.scene.clone(true);
    normalize(c, 0.45);
    c.position.set(-0.2 + k * 0.75, 1.6 + (k % 2) * 0.35, -1.6);
    shadows(c, true, false);
    spinners.push(c);
    home.add(c);
  }

  // Clouds.
  const clouds: THREE.Object3D[] = [];
  for (let k = 0; k < 7; k++) {
    const c = cloud.scene.clone(true);
    normalize(c, 2.5 + Math.random() * 2, "x");
    c.position.set(-25 + k * 8 + Math.random() * 3, 4 + Math.random() * 5, -10 - Math.random() * 18);
    c.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) ((m as THREE.Mesh).material as THREE.MeshStandardMaterial).fog = true;
    });
    clouds.push(c);
    scene.add(c);
  }

  // Hero.
  const hero = cloneSkinned(character.scene);
  normalize(hero, 1.5);
  hero.rotation.y = 0.35;
  shadows(hero);
  home.add(hero);
  const heroMixer = new THREE.AnimationMixer(hero);
  const heroClip = (n: string) => heroMixer.clipAction(THREE.AnimationClip.findByName(character.animations, n));
  const hIdle = heroClip("idle");
  const hJump = heroClip("jump");
  hJump.setLoop(THREE.LoopOnce, 1);
  hJump.clampWhenFinished = false;
  hIdle.play();
  heroMixer.addEventListener("finished", () => hIdle.reset().fadeIn(0.2).play());

  // Gear on the hero.
  scene.updateMatrixWorld(true);
  const torso = hero.getObjectByName("torso") ?? hero;
  const antenna = hero.getObjectByName("antenna");
  if (antenna && o.hat) antenna.removeFromParent();
  const tBox = new THREE.Box3().setFromObject(torso);
  const heroScale = hero.scale.x;
  const toLocal = (v: THREE.Vector3) => torso.worldToLocal(v.clone());
  const headW = Math.min(tBox.max.x - tBox.min.x, tBox.max.z - tBox.min.z);
  if (o.hat) {
    const hat = hatMesh(o.hat);
    hat.scale.setScalar((headW * 0.85) / heroScale);
    const at = toLocal(new THREE.Vector3((tBox.min.x + tBox.max.x) / 2, tBox.max.y - 0.03, (tBox.min.z + tBox.max.z) / 2));
    hat.position.copy(at);
    torso.add(hat);
  }
  let cape: THREE.Mesh | null = null;
  if (o.cape) {
    cape = capeMesh(o.cape);
    cape.scale.setScalar((headW * 1.1) / heroScale);
    const at = toLocal(new THREE.Vector3((tBox.min.x + tBox.max.x) / 2, tBox.min.y + (tBox.max.y - tBox.min.y) * 0.45, tBox.min.z - 0.02));
    cape.position.copy(at);
    torso.add(cape);
  }
  if (o.gear) {
    const arm = hero.getObjectByName("arm-right") ?? torso;
    const gm = gearMesh(o.gear);
    gm.scale.setScalar((headW * 0.9) / heroScale);
    const aBox = new THREE.Box3().setFromObject(arm);
    gm.position.copy(arm.worldToLocal(new THREE.Vector3(aBox.min.x, aBox.min.y + 0.05, (aBox.min.z + aBox.max.z) / 2 + 0.05)));
    arm.add(gm);
  }

  // Ellie, Dev's faithful companion.
  const ellie = makeEllie();
  ellie.root.position.set(-0.8, 0, 0.85);
  ellie.root.rotation.y = 0.35;
  home.add(ellie.root);

  // Pet orb.
  let pet: THREE.Sprite | null = null;
  if (o.pet) {
    pet = emojiSprite(o.pet);
    pet.position.set(0.95, 1.5, 0.5);
    home.add(pet);
  }

  // Sparkles around the home island.
  const sparkN = 70;
  const sp = new Float32Array(sparkN * 3);
  const seeds = Array.from({ length: sparkN }, () => [Math.random() * Math.PI * 2, 1.5 + Math.random() * 2.5, Math.random() * 3, 0.2 + Math.random() * 0.6]);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const sparkMat = new THREE.PointsMaterial({ size: 0.16, map: dot, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, color: o.accent });
  const sparks = new THREE.Points(sparkGeo, sparkMat);
  home.add(sparks);

  // Camera and framing.
  const camera = new THREE.PerspectiveCamera(40, 2, 0.1, 200);
  const target = new THREE.Vector3();
  let yaw = 0;
  let dragYaw = 0;
  let vw = 1;
  let vh = 1;
  const frame = () => {
    const aspect = camera.aspect;
    const stage = o.layout === "stage";
    const wide = !stage && aspect > 1.3;
    const dist = stage ? 4.6 : wide ? 5.2 : 6.4;
    target.set(home.position.x, home.position.y + 0.8, home.position.z);
    const a = yaw + dragYaw + (wide ? -0.25 : 0);
    camera.position.set(target.x + Math.sin(a) * dist, target.y + (stage ? 0.9 : 1.3), target.z + Math.cos(a) * dist);
    camera.lookAt(target);
    // Slide the picture so the hero sits where the page leaves room for him:
    // the left edge on wide screens, the top on phones.
    if (wide) camera.setViewOffset(vw, vh, vw * 0.33, 0, vw, vh);
    else if (!stage) camera.setViewOffset(vw, vh, 0, vh * 0.18, vw, vh);
    else camera.clearViewOffset();
  };

  // Cheer: hero jumps, Ellie does zoomies, sparkles burst.
  let cheerUntil = 0;
  const cheer = () => {
    cheerUntil = clock.elapsedTime + 4;
    hJump.reset().play();
    ellie.trick("zoomies", clock.elapsedTime);
  };

  // Pointer: drag to look around, tap the hero to jump.
  let down: { x: number; yaw: number } | null = null;
  const ray = new THREE.Raycaster();
  const onDown = (e: PointerEvent) => (down = { x: e.clientX, yaw: dragYaw });
  const onMove = (e: PointerEvent) => {
    if (down) dragYaw = THREE.MathUtils.clamp(down.yaw - (e.clientX - down.x) / 250, -0.9, 0.9);
  };
  const onUp = (e: PointerEvent) => {
    if (down && Math.abs(e.clientX - down.x) < 5) {
      const r = canvas.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
      if (ray.intersectObject(ellie.root, true).length) {
        ellie.trick(Math.random() < 0.5 ? "spin" : "hop", clock.elapsedTime);
      } else if (ray.intersectObject(hero, true).length) {
        hJump.reset().play();
        ellie.trick("hop", clock.elapsedTime);
      }
    }
    down = null;
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  const clock = new THREE.Clock();
  let active = true;
  let raf = 0;
  let nextIdleTrick = 4;
  // Adaptive quality: if the first seconds run slow, drop resolution and
  // shadows so the Chromebook stays smooth.
  let frames = 0;
  let slowTime = 0;
  let downgraded = 0;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const tick = () => {
    raf = 0;
    if (!active) return;
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.05) * (reduceMotion ? 0.3 : 1);
    const t = clock.elapsedTime;
    frames++;
    if (frames > 20 && downgraded < 2) {
      slowTime = slowTime * 0.95 + rawDt * 0.05;
      if (frames % 60 === 0 && slowTime > 1 / 30) {
        downgraded++;
        if (downgraded === 1) {
          renderer.setPixelRatio(1);
          renderer.setSize(vw, vh, false);
        } else {
          renderer.shadowMap.enabled = false;
          scene.traverse((x) => {
            const m = x as THREE.Mesh;
            if (m.isMesh) ([] as THREE.Material[]).concat(m.material).forEach((mm) => (mm.needsUpdate = true));
          });
        }
      }
    }
    heroMixer.update(dt);
    ellie.update(t, dt);
    for (const s of spinners) s.rotation.y += dt * 1.6;
    for (const b of bobbers) b.obj.position.y = b.base + Math.sin(t * 0.8 + b.phase) * 0.15;
    for (const c of clouds) {
      c.position.x += dt * 0.35;
      if (c.position.x > 30) c.position.x = -30;
    }
    home.traverse((x) => {
      if (x.name === "spin") x.rotation.y += dt;
    });
    if (pet) pet.position.y = 1.5 + Math.sin(t * 2) * 0.12;
    if (cape) {
      const pos = cape.geometry.attributes.position as THREE.BufferAttribute;
      const base = cape.userData.base as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        const y = base[i * 3 + 1];
        pos.setZ(i, base[i * 3 + 2] - Math.abs(y) * 0.25 - Math.sin(t * 3 + y * 4 + base[i * 3]) * 0.05 * Math.abs(y));
      }
      pos.needsUpdate = true;
    }
    // sparkles drift upward in rings
    const boost = t < cheerUntil ? 2.2 : 1;
    for (let i = 0; i < sparkN; i++) {
      const [a0, r, h0, sp0] = seeds[i];
      const a = a0 + t * sp0 * 0.3;
      const h = (h0 + t * sp0 * boost) % 3.5;
      sp.set([Math.cos(a) * r * (t < cheerUntil ? 0.8 : 1), h, Math.sin(a) * r], i * 3);
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkMat.size = t < cheerUntil ? 0.26 : 0.16;
    if (t > nextIdleTrick) {
      nextIdleTrick = t + 6 + Math.random() * 5;
      if (Math.random() < 0.5) hJump.reset().play();
      else ellie.trick((["tilt", "hop", "spin"] as const)[Math.floor(Math.random() * 3)], t);
    }
    yaw = Math.sin(t * 0.12) * 0.25;
    frame();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  const resize = (w: number, h: number) => {
    renderer.setSize(w, h, false);
    vw = w;
    vh = Math.max(h, 1);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    frame();
    if (!raf && active) renderer.render(scene, camera);
  };
  const setActive = (on: boolean) => {
    if (on === active) return;
    active = on;
    if (on) {
      clock.getDelta();
      if (!raf) raf = requestAnimationFrame(tick);
    } else if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };

  if (o.mood === "cheer") setTimeout(cheer, 400);
  raf = requestAnimationFrame(tick);

  return {
    resize,
    setActive,
    cheer,
    dispose: () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.isMesh || (x as THREE.Points).isPoints) {
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : [m.material];
          mats.forEach((mm) => mm?.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
