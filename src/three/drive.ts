import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeCar } from "./cars";
import { voxelIsland, voxelTree } from "./blocks";

// Road Trip: drive a Garage car across the realm islands. The islands sit
// in a zigzag over the sea, joined by wooden bridges. Bridges into locked
// realms end at a gate. Drive off an edge and the car splashes down, then
// comes back on the last island. Built light for a Chromebook: no shadow
// maps, low pixel ratio, and a quality drop if frames run slow.

export type DriveRealm = { name: string; sky: readonly [string, string]; ground: string; accent: string; unlocked: boolean; level: number };
export type DriveStatus = { mph: number; place: string };
export type DriveOpts = {
  carId: string;
  top: number; // car's top speed in mph, to scale the arcade speed
  hp: number;
  realms: DriveRealm[];
  onStatus?: (s: DriveStatus) => void;
  onCoin?: () => void;
  onGate?: (realm: DriveRealm) => void;
  onSplash?: () => void;
};
export type Drive = { resize: (w: number, h: number) => void; setKey: (k: Key, on: boolean) => void; setActive: (on: boolean) => void; dispose: () => void };
export type Key = "up" | "down" | "left" | "right";

const S = 4; // island scale
const R = 10.8; // drivable island radius
const HALF = 2.3; // half bridge width
const CAR = 0.6; // car scale (a real car is ~4.5 m long, so ~2.7 units)

type Bridge = { a: THREE.Vector3; b: THREE.Vector3; dir: THREE.Vector3; len: number; gate: number | null; to: number };

function label(text: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.font = "bold 54px system-ui, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.lineWidth = 10;
  g.strokeStyle = "rgba(10,8,30,0.85)";
  g.strokeText(text, 256, 64);
  g.fillStyle = color;
  g.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(12, 3, 1);
  return sp;
}

export function createDrive(canvas: HTMLCanvasElement, o: DriveOpts): Drive {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const first = o.realms[0];
  const top = new THREE.Color(first.sky[0]);
  const bottom = new THREE.Color(first.sky[1]);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(bottom.clone().lerp(top, 0.3), 45, 150);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: top }, bottom: { value: bottom } },
    vertexShader: "varying vec3 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }",
    fragmentShader:
      "uniform vec3 top;\nuniform vec3 bottom;\nvarying vec3 vP;\nvoid main(){\n  float h = normalize(vP).y;\n  gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.1, 0.5, h)), 1.0);\n  #include <colorspace_fragment>\n}",
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 12), skyMat);
  scene.add(sky);

  scene.add(new THREE.HemisphereLight(top.clone().lerp(new THREE.Color("#ffffff"), 0.6), new THREE.Color(first.ground), 1.7));
  const sun = new THREE.DirectionalLight("#fff1d6", 2.4);
  sun.position.set(40, 60, 30);
  scene.add(sun);
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  // Sea far below the islands.
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: "#1d5c8f", roughness: 0.25, metalness: 0.3 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -16;
  scene.add(sea);

  // Islands in a zigzag.
  const centers = o.realms.map((_, i) => new THREE.Vector3(i * 36, 0, i % 2 ? 13 : -13));
  const trees: { x: number; z: number; r: number }[] = [];
  const coins: { obj: THREE.Object3D; x: number; z: number; back: number }[] = [];
  const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.18, 20);
  const coinMat = new THREE.MeshStandardMaterial({ color: "#ffd54a", metalness: 0.3, roughness: 0.3, emissive: "#c98a00", emissiveIntensity: 0.55 });
  const addCoin = (x: number, z: number) => {
    const c = new THREE.Mesh(coinGeo, coinMat);
    c.rotation.z = Math.PI / 2;
    const holder = new THREE.Group();
    holder.add(c);
    holder.position.set(x, 1.1, z);
    scene.add(holder);
    coins.push({ obj: holder, x, z, back: 0 });
  };

  o.realms.forEach((r, i) => {
    const isl = new THREE.Group();
    isl.add(voxelIsland(new THREE.Color(r.ground).lerp(new THREE.Color(r.accent), 0.2), r.unlocked, i + 1));
    isl.scale.setScalar(S);
    isl.position.copy(centers[i]);
    scene.add(isl);
    const sign = label(r.unlocked ? r.name : `🔒 ${r.name}`, r.unlocked ? r.accent : "#c9c9d6");
    sign.position.set(centers[i].x, 9, centers[i].z);
    scene.add(sign);
    if (!r.unlocked) return;
    // Trees near the rim, out of the main driving line. They block the car.
    for (const [k, a] of [0.9, 2.6, 4.4].entries()) {
      const ang = a + i * 0.7;
      const tx = Math.cos(ang) * 8.6;
      const tz = Math.sin(ang) * 8.6;
      const t = voxelTree(new THREE.Color(r.accent).lerp(new THREE.Color("#3f9b4a"), 0.6), 3 + (k % 2));
      t.scale.setScalar(1.6);
      t.position.set(centers[i].x + tx, 0, centers[i].z + tz);
      scene.add(t);
      trees.push({ x: centers[i].x + tx, z: centers[i].z + tz, r: 1.0 });
    }
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2 + i;
      addCoin(centers[i].x + Math.cos(a) * 4.5, centers[i].z + Math.sin(a) * 4.5);
    }
  });

  // Bridges between neighbors. A bridge into a locked realm ends at a gate.
  const bridges: Bridge[] = [];
  const plank = new THREE.MeshStandardMaterial({ color: "#a0703f", roughness: 0.85 });
  const plankDark = new THREE.MeshStandardMaterial({ color: "#6b4524", roughness: 0.9 });
  const rope = new THREE.MeshStandardMaterial({ color: "#d9c08a", roughness: 0.9 });
  const gateMat = new THREE.MeshStandardMaterial({ color: "#e0453a", roughness: 0.5, emissive: "#5a0d08", emissiveIntensity: 0.5 });
  for (let i = 0; i < centers.length - 1; i++) {
    const a = centers[i];
    const b = centers[i + 1];
    const dir = b.clone().sub(a);
    const len = dir.length();
    dir.normalize();
    const open = o.realms[i].unlocked;
    if (!open) break; // nothing past a locked island
    const gate = o.realms[i + 1].unlocked ? null : len - R - 1.2;
    bridges.push({ a, b, dir, len, gate, to: i + 1 });
    const g = new THREE.Group();
    g.position.copy(a);
    g.rotation.y = Math.atan2(-dir.z, dir.x);
    const start = R - 1.5;
    const end = len - R + 1.5;
    const span = end - start;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(span, 0.35, HALF * 2), plank);
    deck.position.set(start + span / 2, -0.12, 0);
    g.add(deck);
    // plank seams
    for (let x = start + 0.8; x < end; x += 1.6) {
      const seam = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.36, HALF * 2 + 0.02), plankDark);
      seam.position.set(x, -0.11, 0);
      g.add(seam);
    }
    for (const side of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(span, 0.14, 0.14), rope);
      rail.position.set(start + span / 2, 1.0, side * (HALF + 0.1));
      g.add(rail);
      for (let x = start; x <= end + 0.01; x += span / 6) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.3, 0.3), plankDark);
        post.position.set(x, 0.45, side * (HALF + 0.1));
        g.add(post);
      }
    }
    if (gate !== null) {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.6, 0.5), plankDark);
        post.position.set(gate, 1.2, side * (HALF + 0.1));
        g.add(post);
      }
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, HALF * 2 + 0.8), gateMat);
      bar.position.set(gate, 1.4, 0);
      g.add(bar);
      const lock = label(`🔒 Level ${o.realms[i + 1].level}`, "#ffd166");
      lock.scale.set(7, 1.75, 1);
      lock.position.set(gate, 3.4, 0);
      g.add(lock);
    } else {
      for (let k = 1; k <= 3; k++) {
        const d = start + (span * k) / 4;
        const p = a.clone().addScaledVector(dir, d);
        addCoin(p.x, p.z);
      }
    }
    scene.add(g);
  }

  // Where may the car be?
  const onIsland = (x: number, z: number) => {
    for (let i = 0; i < centers.length; i++) {
      if (!o.realms[i].unlocked) continue;
      const dx = x - centers[i].x;
      const dz = z - centers[i].z;
      if (dx * dx + dz * dz < R * R) return i;
    }
    return -1;
  };
  const onBridge = (x: number, z: number) => {
    for (const br of bridges) {
      const px = x - br.a.x;
      const pz = z - br.a.z;
      const along = px * br.dir.x + pz * br.dir.z;
      const across = Math.abs(-px * br.dir.z + pz * br.dir.x);
      if (along > 0 && along < br.len && across < HALF) return { br, along };
    }
    return null;
  };

  // The car.
  const car = makeCar(o.carId);
  car.root.userData.env = env;
  car.root.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.isMesh) ([] as THREE.Material[]).concat(m.material).forEach((mm) => ((mm as THREE.MeshStandardMaterial).envMap = env));
  });
  car.root.scale.setScalar(CAR);
  scene.add(car.root);
  const blob = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: "#000", transparent: true, opacity: 0.35, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.scale.set(1.5, 0.75, 1);
  scene.add(blob);

  const vmax = THREE.MathUtils.clamp(14 + ((o.top - 150) / 110) * 9, 13, 24);
  const accel = THREE.MathUtils.clamp(7 + o.hp / 220, 8, 15);
  const pos = new THREE.Vector3();
  let heading = 0;
  let speed = 0;
  let vy = 0;
  let falling = false;
  let lastIsland = 0;
  const spawn = (i: number) => {
    const next = centers[Math.min(i + 1, centers.length - 1)];
    const from = centers[i];
    heading = i + 1 < centers.length ? Math.atan2(-(next.z - from.z), next.x - from.x) : Math.PI;
    pos.set(from.x - Math.cos(heading) * 3, 0, from.z + Math.sin(heading) * 3);
    speed = 0;
    vy = 0;
    falling = false;
  };
  spawn(0);

  const keys: Record<Key, boolean> = { up: false, down: false, left: false, right: false };
  const KEYMAP: Record<string, Key> = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
  const onKey = (on: boolean) => (e: KeyboardEvent) => {
    const k = KEYMAP[e.code];
    if (!k) return;
    keys[k] = on;
    e.preventDefault();
  };
  const kd = onKey(true);
  const ku = onKey(false);
  window.addEventListener("keydown", kd);
  window.addEventListener("keyup", ku);

  const camera = new THREE.PerspectiveCamera(55, 2, 0.3, 600);
  const camPos = new THREE.Vector3(pos.x - 9, 5, pos.z);
  const look = new THREE.Vector3();

  const clock = new THREE.Clock();
  let active = true;
  let raf = 0;
  let gateCool = 0;
  let statusT = 0;
  let frames = 0;
  let slow = 0;
  let downgraded = false;
  let vw = 1;
  let vh = 1;

  const tick = () => {
    raf = 0;
    if (!active) return;
    const raw = clock.getDelta();
    const dt = Math.min(raw, 0.05);
    const t = clock.elapsedTime;
    frames++;
    if (frames > 30 && !downgraded) {
      slow = slow * 0.95 + raw * 0.05;
      if (frames % 60 === 0 && slow > 1 / 28) {
        downgraded = true;
        renderer.setPixelRatio(0.8);
        renderer.setSize(vw, vh, false);
      }
    }

    if (!falling) {
      const thr = (keys.up ? 1 : 0) - (keys.down ? 1 : 0);
      if (thr > 0) speed += accel * dt * (speed < 0 ? 2.2 : 1);
      else if (thr < 0) speed -= accel * dt * (speed > 0 ? 2.2 : 0.6);
      else speed -= Math.sign(speed) * Math.min(Math.abs(speed), 5 * dt);
      speed = THREE.MathUtils.clamp(speed, -vmax * 0.35, vmax);
      const steer = (keys.left ? 1 : 0) - (keys.right ? 1 : 0);
      const grip = THREE.MathUtils.clamp(Math.abs(speed) / 4, 0, 1);
      heading += steer * 2.1 * dt * grip * Math.sign(speed || 1);

      let nx = pos.x + Math.cos(heading) * speed * dt;
      let nz = pos.z - Math.sin(heading) * speed * dt;
      // Bridge rails keep the car on the deck.
      for (const br of bridges) {
        const px = nx - br.a.x;
        const pz = nz - br.a.z;
        const along = px * br.dir.x + pz * br.dir.z;
        const across = -px * br.dir.z + pz * br.dir.x;
        const lim = HALF - 0.9;
        if (along > R - 0.5 && along < br.len - R + 0.5 && Math.abs(across) > lim && Math.abs(across) < HALF + 2) {
          const c = Math.sign(across) * lim;
          nx = br.a.x + br.dir.x * along - br.dir.z * c;
          nz = br.a.z + br.dir.z * along + br.dir.x * c;
          speed *= 0.97;
        }
      }
      const isl = onIsland(nx, nz);
      const br = isl < 0 ? onBridge(nx, nz) : null;
      if (br && br.br.gate !== null && br.along > br.br.gate - 1.3) {
        // locked gate: bounce back
        speed = -speed * 0.3;
        if (gateCool < t) {
          gateCool = t + 2.5;
          o.onGate?.(o.realms[br.br.to]);
        }
      } else {
        pos.x = nx;
        pos.z = nz;
        if (isl >= 0) lastIsland = isl;
        else if (!br) {
          falling = true;
          vy = 2;
        }
      }
      // trees push the car out
      for (const tr of trees) {
        const dx = pos.x - tr.x;
        const dz = pos.z - tr.z;
        const d = Math.hypot(dx, dz);
        const min = tr.r + 0.9;
        if (d < min && d > 0.001) {
          pos.x = tr.x + (dx / d) * min;
          pos.z = tr.z + (dz / d) * min;
          speed *= 0.5;
        }
      }
    } else {
      vy -= 22 * dt;
      pos.x += Math.cos(heading) * speed * dt;
      pos.z -= Math.sin(heading) * speed * dt;
      pos.y += vy * dt;
      if (pos.y < sea.position.y + 0.3) {
        o.onSplash?.();
        spawn(lastIsland);
      }
    }

    car.root.position.copy(pos);
    car.root.rotation.y = heading;
    car.root.rotation.z = falling ? Math.max(-0.6, car.root.rotation.z - dt * 0.8) : 0;
    car.update(t, speed * dt * 1.4);
    blob.visible = !falling;
    blob.position.set(pos.x, 0.03, pos.z);
    blob.rotation.z = heading;

    // coins
    for (const c of coins) {
      if (c.back > t) continue;
      if (!c.obj.visible) c.obj.visible = true;
      c.obj.rotation.y = t * 2.5;
      c.obj.position.y = 1.1 + Math.sin(t * 3 + c.x) * 0.15;
      if (!falling && Math.hypot(pos.x - c.x, pos.z - c.z) < 1.8) {
        c.obj.visible = false;
        c.back = t + 25;
        o.onCoin?.();
      }
    }

    // chase camera
    const back = speed < -0.5 ? -1 : 1;
    const want = new THREE.Vector3(pos.x - Math.cos(heading) * 7 * back, (falling ? 3 : pos.y) + 3.2, pos.z + Math.sin(heading) * 7 * back);
    camPos.lerp(want, 1 - Math.exp(-dt * 4));
    camera.position.copy(camPos);
    look.set(pos.x + Math.cos(heading) * 3, pos.y + 1, pos.z - Math.sin(heading) * 3);
    camera.lookAt(look);
    sky.position.copy(camera.position);

    if (t > statusT) {
      statusT = t + 0.25;
      const isl = onIsland(pos.x, pos.z);
      const place = falling ? "Splash!" : isl >= 0 ? o.realms[isl].name : "On the bridge";
      o.onStatus?.({ mph: Math.round(Math.abs(speed) * (o.top / vmax)), place });
    }

    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  const resize = (w: number, h: number) => {
    vw = w;
    vh = Math.max(1, h);
    renderer.setSize(w, vh, false);
    camera.aspect = w / vh;
    camera.updateProjectionMatrix();
  };
  const setActive = (on: boolean) => {
    if (on === active) return;
    active = on;
    if (on) {
      clock.getDelta();
      if (!raf) raf = requestAnimationFrame(tick);
    } else {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      (Object.keys(keys) as Key[]).forEach((k) => (keys[k] = false));
    }
  };
  raf = requestAnimationFrame(tick);

  return {
    resize,
    setActive,
    setKey: (k, on) => (keys[k] = on),
    dispose: () => {
      active = false;
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("keydown", kd);
      window.removeEventListener("keyup", ku);
      scene.traverse((x) => {
        const m = x as THREE.Mesh;
        if (m.isMesh || (x as THREE.Sprite).isSprite) {
          m.geometry?.dispose();
          ([] as THREE.Material[]).concat(m.material).forEach((mm) => {
            (mm as THREE.MeshStandardMaterial)?.map?.dispose();
            mm?.dispose();
          });
        }
      });
      env.dispose();
      pm.dispose();
      renderer.dispose();
    },
  };
}
