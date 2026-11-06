import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  CircleGeometry,
  Color,
  CylinderGeometry,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  RepeatWrapping,
  Scene,
  SpotLight,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface VaultScene {
  // Cada tecla gira um dente da roda, como um segredo de cofre.
  tick(): void;
  deny(): void;
  // Resolve quando a porta terminou de abrir; a tela só muda depois disso.
  open(): Promise<void>;
  setPlate(text: string): void;
  resize(): void;
  dispose(): void;
}

const DOOR_RADIUS = 2.6;
const BOLTS = 16;
const SLOW_SAMPLES = 40;
const SLOW_FRAME = 0.1;
const OPEN_SECONDS = 1.7;

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function drawBrushed(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  for (let y = 0; y < 1024; y += 1) {
    const shade = 178 + Math.random() * 22;
    ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
    ctx.fillRect(0, y, 8, 1);
  }
  return canvas;
}

function drawWall(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, 512, 512);
  for (let index = 0; index < 5200; index += 1) {
    const shade = 80 + Math.random() * 100;
    ctx.fillStyle = `rgba(${shade},${shade},${shade},0.32)`;
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  return canvas;
}

function drawMark(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d")!;
  const unit = 256 / 32;
  ctx.fillStyle = "#d92b21";
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(7 * unit, 7 * unit, 4 * unit, 18 * unit);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4 * unit;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(14.5 * unit, 16.5 * unit);
  ctx.lineTo(19 * unit, 21 * unit);
  ctx.lineTo(27 * unit, 10 * unit);
  ctx.stroke();
  return canvas;
}

function drawPlate(canvas: HTMLCanvasElement, text: string) {
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#b8975f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#231a0d";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let size = 84;
  do {
    ctx.font = `800 ${size}px "Archivo", "Switzer", sans-serif`;
    size -= 4;
  } while (ctx.measureText(text).width > canvas.width - 90 && size > 28);
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 4);
}

// Perfil usinado da porta: degraus com chanfro curto para a luz riscar as arestas.
const DOOR_PROFILE: [number, number][] = [
  [0, 0.34], [0.56, 0.34], [0.59, 0.31], [0.63, 0.2], [1.26, 0.2], [1.29, 0.23], [1.62, 0.23],
  [1.65, 0.2], [1.68, 0.15], [2.24, 0.15], [2.27, 0.18], [2.3, 0.26], [2.5, 0.26], [2.54, 0.22],
  [2.6, 0.12], [2.6, -0.3],
];

const FRAME_PROFILE: [number, number][] = [
  [2.66, -0.4], [2.66, 0.2], [2.72, 0.28], [3.34, 0.28], [3.42, 0.2], [3.48, 0.02], [3.48, -0.4],
];

function lathe(profile: [number, number][]): LatheGeometry {
  const geometry = new LatheGeometry([...profile].reverse().map(([r, z]) => new Vector2(r, z)), 160);
  geometry.rotateX(Math.PI / 2);
  return geometry;
}

export function createVaultScene(canvas: HTMLCanvasElement, compact: boolean, plateText: string): VaultScene {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x08090a);
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = PCFSoftShadowMap;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  scene.environment = environment;
  scene.environmentIntensity = 0.5;

  const camera = new PerspectiveCamera(32, 1, 0.1, 60);

  const disposables: { dispose(): void }[] = [environment, pmrem];
  const keep = <T extends { dispose(): void }>(item: T): T => {
    disposables.push(item);
    return item;
  };

  const brushedCanvas = drawBrushed();
  const brushed = keep(new CanvasTexture(brushedCanvas));
  brushed.wrapS = brushed.wrapT = RepeatWrapping;
  brushed.repeat.set(24, 1);

  // Metal torneado: a anisotropia desenha o brilho em cone do aço usinado em círculos.
  const steel = keep(new MeshPhysicalMaterial({
    color: 0x5c6063,
    metalness: 1,
    roughness: 0.5,
    anisotropy: 0.85,
    roughnessMap: brushed,
  }));
  const darkSteel = keep(new MeshStandardMaterial({ color: 0x24272a, metalness: 1, roughness: 0.5 }));
  const chrome = keep(new MeshPhysicalMaterial({ color: 0xb4b7ba, metalness: 1, roughness: 0.2, clearcoat: 0.4 }));

  const wallTexture = keep(new CanvasTexture(drawWall()));
  wallTexture.wrapS = wallTexture.wrapT = RepeatWrapping;
  wallTexture.repeat.set(6, 4);
  const wall = new Mesh(
    keep(new PlaneGeometry(60, 40)),
    keep(new MeshStandardMaterial({ color: 0x0f1213, roughness: 0.95, bumpMap: wallTexture, bumpScale: 1.4, metalness: 0 })),
  );
  wall.position.z = -0.4;
  wall.receiveShadow = true;

  const rig = new Group();
  rig.add(wall);
  scene.add(rig);

  const frame = new Mesh(keep(lathe(FRAME_PROFILE)), darkSteel);
  frame.castShadow = true;
  frame.receiveShadow = true;
  rig.add(frame);

  // O brilho do arquivo atrás da porta aparece quando ela abre.
  const glowMaterial = keep(new MeshBasicMaterial({ color: 0x000000, toneMapped: false }));
  const glow = new Mesh(keep(new CircleGeometry(2.66, 96)), glowMaterial);
  glow.position.z = -0.35;
  rig.add(glow);

  const hinge = new Group();
  hinge.position.set(-DOOR_RADIUS - 0.08, 0, 0);
  rig.add(hinge);

  const door = new Group();
  door.position.x = DOOR_RADIUS + 0.08;
  hinge.add(door);

  const body = new Mesh(keep(lathe(DOOR_PROFILE)), steel);
  body.castShadow = true;
  body.receiveShadow = true;
  door.add(body);

  // Rebites do anel da porta e da moldura.
  const rivetGeometry = keep(new SphereGeometry(0.036, 12, 8));
  const placeRivets = (radius: number, count: number, z: number, parent: Object3D, material: MeshStandardMaterial) => {
    const rivets = new InstancedMesh(rivetGeometry, material, count);
    const matrix = new Matrix4();
    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      matrix.makeTranslation(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
      rivets.setMatrixAt(index, matrix);
    }
    keep(rivets);
    parent.add(rivets);
  };
  placeRivets(2.4, 56, 0.265, door, chrome);
  placeRivets(1.44, 36, 0.235, door, chrome);
  placeRivets(3.08, 64, 0.285, rig, chrome);

  // Trancas que recolhem no momento de abrir.
  const boltGeometry = keep(new CylinderGeometry(0.115, 0.115, 0.52, 28));
  const bolts = Array.from({ length: BOLTS }, (_, index) => {
    const angle = (index / BOLTS) * Math.PI * 2;
    const pivot = new Group();
    pivot.rotation.z = angle - Math.PI / 2;
    const bolt = new Mesh(boltGeometry, chrome);
    bolt.position.set(0, 2.5, 0.1);
    bolt.castShadow = true;
    pivot.add(bolt);
    door.add(pivot);
    return bolt;
  });

  // Roda de abertura e selo da marca no centro.
  const wheel = new Group();
  wheel.position.z = 0.34;
  door.add(wheel);

  const hub = new Mesh(keep(new CylinderGeometry(0.46, 0.5, 0.3, 64)), chrome);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.14;
  hub.castShadow = true;
  wheel.add(hub);

  const ring = new Mesh(keep(new TorusGeometry(1.02, 0.066, 24, 128)), chrome);
  ring.position.z = 0.42;
  ring.castShadow = true;
  wheel.add(ring);

  const spokeGeometry = keep(new CylinderGeometry(0.05, 0.05, 0.72, 16));
  [0, 1, 2].forEach((index) => {
    const pivot = new Group();
    pivot.rotation.z = (index / 3) * Math.PI * 2;
    const spoke = new Mesh(spokeGeometry, chrome);
    spoke.position.set(0, 0.68, 0.4);
    spoke.castShadow = true;
    pivot.add(spoke);
    wheel.add(pivot);
  });

  const markTexture = keep(new CanvasTexture(drawMark()));
  markTexture.colorSpace = SRGBColorSpace;
  const mark = new Mesh(
    keep(new CircleGeometry(0.3, 48)),
    keep(new MeshBasicMaterial({ map: markTexture, toneMapped: false })),
  );
  mark.position.z = 0.34 + 0.302;
  door.add(mark);

  // Placa de latão com o nome de quem está entrando ou se cadastrando.
  const plateCanvas = document.createElement("canvas");
  plateCanvas.width = 1024;
  plateCanvas.height = 180;
  drawPlate(plateCanvas, plateText);
  const plateTexture = keep(new CanvasTexture(plateCanvas));
  plateTexture.colorSpace = SRGBColorSpace;
  plateTexture.anisotropy = 4;
  const plateFace = keep(new MeshStandardMaterial({ map: plateTexture, metalness: 0.5, roughness: 0.5 }));
  const plateEdge = keep(new MeshStandardMaterial({ color: 0x8b6f42, metalness: 1, roughness: 0.4 }));
  const plate = new Mesh(keep(new BoxGeometry(1.5, 0.27, 0.03)), [
    plateEdge, plateEdge, plateEdge, plateEdge, plateFace, plateEdge,
  ]);
  plate.position.set(0, -1.92, 0.17);
  plate.castShadow = true;
  door.add(plate);

  // Luz principal rasante, um contorno frio e o alarme vermelho da recusa.
  const key = new SpotLight(0xfff0dc, 420, 44, 0.46, 0.9, 1.6);
  key.position.set(5, 7, 13);
  key.target = rig;
  key.castShadow = !compact;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004;
  scene.add(key, key.target);

  const rim = new SpotLight(0x8fb4d8, 90, 30, 0.6, 1, 1.6);
  rim.position.set(-9, -4, 6);
  rim.target = rig;
  scene.add(rim);

  const alarm = new PointLight(0xff2a1c, 0, 14, 1.5);
  alarm.position.set(0, 0, 3.4);
  rig.add(alarm);

  const warm = new PointLight(0xffd690, 0, 16, 1.2);
  warm.position.set(0, 0, 1.2);
  rig.add(warm);

  let wheelAngle = 0;
  let wheelTarget = 0;
  let denyLevel = 0;
  let openAt = 0;
  let openDone: (() => void) | null = null;
  let frameId = 0;
  let running = true;
  let lastFrame = performance.now();
  let sampled = 0;
  let sampledTime = 0;
  const pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
  const glowColor = new Color();
  const warmGlow = new Color(0xffe2a8);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.75));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const distance = compact ? 15 : 12.4;
    const viewHeight = 2 * distance * Math.tan((camera.fov * Math.PI) / 360);
    const viewWidth = viewHeight * camera.aspect;
    rig.position.x = compact ? 0 : -viewWidth * 0.2;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
  };

  const draw = (now: number) => {
    frameId = 0;
    if (!running) return;
    frameId = requestAnimationFrame(draw);

    const raw = (now - lastFrame) / 1000;
    const elapsed = Math.min(0.1, raw);
    lastFrame = now;
    if (sampled < SLOW_SAMPLES && raw < 1) {
      sampled += 1;
      sampledTime += raw;
      if (sampled === SLOW_SAMPLES && sampledTime / SLOW_SAMPLES > SLOW_FRAME) {
        renderer.render(scene, camera);
        running = false;
        openDone?.();
        openDone = null;
        return;
      }
    }

    const rate = (speed: number) => 1 - Math.exp(-elapsed * speed);
    pointer.smoothX += (pointer.x - pointer.smoothX) * rate(3);
    pointer.smoothY += (pointer.y - pointer.smoothY) * rate(3);

    const opening = openAt ? (now - openAt) / 1000 : 0;
    const spin = smooth(opening / 0.8);
    const retract = smooth((opening - 0.45) / 0.4);
    const swing = smooth((opening - 0.75) / 0.95);

    wheelAngle += (wheelTarget + spin * Math.PI * 3 - wheelAngle) * rate(9);
    wheel.rotation.z = -wheelAngle;
    bolts.forEach((bolt) => {
      bolt.position.y = 2.5 - retract * 0.42;
    });
    hinge.rotation.y = -swing * 1.75;

    glowColor.copy(warmGlow).multiplyScalar(smooth((opening - 0.8) / 0.7) * 1.15);
    glowMaterial.color.copy(glowColor);
    warm.intensity = swing * 90;

    denyLevel += (0 - denyLevel) * rate(4);
    alarm.intensity = denyLevel * 70;
    door.position.x = DOOR_RADIUS + 0.08 + Math.sin(now * 0.06) * denyLevel * 0.035;

    rig.rotation.y = 0.34 + pointer.smoothX * 0.05;
    rig.rotation.x = -0.05 + pointer.smoothY * 0.03;
    key.position.x = 5 + pointer.smoothX * 3;
    key.position.y = 7 + pointer.smoothY * 2;

    renderer.render(scene, camera);

    if (openDone && opening >= OPEN_SECONDS) {
      openDone();
      openDone = null;
    }
  };

  const handlePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (0.5 - event.clientY / window.innerHeight) * 2;
  };
  if (!compact) window.addEventListener("pointermove", handlePointer, { passive: true });

  resize();
  frameId = requestAnimationFrame(draw);

  return {
    tick() {
      wheelTarget += 0.2;
    },
    deny() {
      denyLevel = 1;
      wheelTarget -= 0.6;
    },
    open() {
      if (!running) return Promise.resolve();
      if (!openAt) openAt = performance.now();
      return new Promise((resolve) => {
        openDone = resolve;
        // Garante a saída mesmo se a aba ficar em segundo plano.
        window.setTimeout(resolve, (OPEN_SECONDS + 0.4) * 1000);
      });
    },
    setPlate(text) {
      drawPlate(plateCanvas, text);
      plateTexture.needsUpdate = true;
    },
    resize,
    dispose() {
      running = false;
      cancelAnimationFrame(frameId);
      window.removeEventListener("pointermove", handlePointer);
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
    },
  };
}
