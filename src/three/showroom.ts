import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { makeCar, type Car } from "./cars";

// The Garage showroom: one car on a slowly turning platform under studio
// lights, with real reflections from a generated studio environment.
// Drag to spin it yourself.

export function createShowroom(canvas: HTMLCanvasElement, carId: string) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#14112b");
  scene.fog = new THREE.Fog("#14112b", 12, 24);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(6.2, 2.3, 6.2);
  camera.lookAt(0, 0.55, 0);

  const key = new THREE.SpotLight("#ffffff", 60, 20, 0.6, 0.5);
  key.position.set(3, 7, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, new THREE.HemisphereLight("#c9c4ff", "#1b1638", 0.6));
  const rim = new THREE.DirectionalLight("#8f78ff", 1.2);
  rim.position.set(-5, 3, -4);
  scene.add(rim);

  const turntable = new THREE.Group();
  turntable.rotation.y = Math.PI + 0.5; // start on a front three-quarter view
  scene.add(turntable);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.12, 64), new THREE.MeshStandardMaterial({ color: "#1f1b3d", metalness: 0.6, roughness: 0.35 }));
  disc.position.y = -0.06;
  disc.receiveShadow = true;
  turntable.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.03, 8, 96), new THREE.MeshStandardMaterial({ color: "#ffd166", emissive: "#ffb627", emissiveIntensity: 1.2 }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshStandardMaterial({ color: "#100d24", roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.12;
  floor.receiveShadow = true;
  scene.add(floor);

  let car: Car | null = null;
  const setCar = (id: string) => {
    if (car) turntable.remove(car.root);
    car = makeCar(id);
    turntable.add(car.root);
  };
  setCar(carId);

  let drag = false;
  let lastX = 0;
  let spin = 0.25;
  // Automated tests hold a fixed pose so screenshots compare cleanly.
  if (navigator.webdriver) {
    spin = 0;
    (window as unknown as { __pose: (r: number) => void }).__pose = (r) => (turntable.rotation.y = r);
  }
  const down = (e: PointerEvent) => { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); };
  const move = (e: PointerEvent) => { if (!drag) return; turntable.rotation.y += (e.clientX - lastX) * 0.01; lastX = e.clientX; spin = 0; };
  const up = () => { drag = false; spin = navigator.webdriver ? 0 : 0.25; };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(w < 500 ? 9.4 : 7.6);
    camera.updateProjectionMatrix();
  };
  resize();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!reduce) turntable.rotation.y += spin * dt;
    car?.update(clock.elapsedTime, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

  return {
    setCar,
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
