import {
  ACESFilmicToneMapping,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  FogExp2,
  HemisphereLight,
  InstancedMesh,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Texture,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

export interface ArchiveScene {
  setProgress(progress: number): void;
  // Índice do registro que sustenta a resposta; -1 acende a vaga vazia.
  show(record: number): void;
  resize(): void;
  setRunning(running: boolean): void;
  dispose(): void;
}

const GROUND = 0x0c1c16;
const SHELF_GREEN = 0x4f7a5c;
const AISLE_START = 7;
const AISLE_END = -36;
const BAY = 2;
const LEVELS = [0.2, 0.75, 1.3, 1.85, 2.4, 2.95];
const RECORD_LEVEL = 1.3;
const BOX_DEPTH = 0.66;
const RECORD_FIRST_Z = -5;
const RECORD_STEP = -2.4;
const EMPTY_SLOT = new Vector3(2, RECORD_LEVEL + 0.24, -6.2);
const CAMERA_START = 4;
const CAMERA_END = -35.2;
const RECORD_PULLED = new Vector3(0.16, 1.62, 0.8);
const SLOW_SAMPLES = 40;
const SLOW_FRAME = 0.1;

function drawKraft(size = 256): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#c39a63";
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 420; i += 1) {
    ctx.fillStyle = `rgba(${i % 2 ? "70,45,20" : "240,215,170"},0.05)`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 60, 1);
  }
  ctx.fillStyle = "rgba(245,240,228,0.92)";
  ctx.fillRect(size * 0.42, 0, size * 0.1, size);
  ctx.fillStyle = "rgba(250,246,235,0.95)";
  ctx.fillRect(size * 0.14, size * 0.2, size * 0.2, size * 0.14);
  ctx.fillStyle = "#3c3226";
  ctx.font = `700 ${size * 0.08}px sans-serif`;
  ctx.fillText("402", size * 0.16, size * 0.3);
  ctx.strokeStyle = "rgba(245,240,228,0.8)";
  ctx.lineWidth = size * 0.012;
  ctx.beginPath();
  ctx.moveTo(size * 0.47, size * 0.55);
  ctx.lineTo(size * 0.8, size * 0.72);
  ctx.moveTo(size * 0.47, size * 0.55);
  ctx.lineTo(size * 0.72, size * 0.34);
  ctx.stroke();
  return canvas;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawRecordLabel(text: string, stamp: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(drawKraft(), 0, 0, 640, 480);
  ctx.fillStyle = "#fbf5e6";
  ctx.fillRect(44, 44, 552, 392);
  ctx.fillStyle = "#17130e";
  ctx.font = '800 68px "Archivo", "Switzer", sans-serif';
  wrapLines(ctx, text.toUpperCase(), 500).forEach((line, index) => {
    ctx.fillText(line, 72, 128 + index * 74);
  });
  ctx.save();
  ctx.translate(90, 372);
  ctx.rotate(-0.07);
  ctx.strokeStyle = "#d92b21";
  ctx.lineWidth = 8;
  ctx.font = '800 44px "Archivo", "Switzer", sans-serif';
  const width = ctx.measureText(stamp).width;
  ctx.strokeRect(-18, -46, width + 36, 66);
  ctx.fillStyle = "#d92b21";
  ctx.fillText(stamp, 0, 0);
  ctx.restore();
  return canvas;
}

function ease(current: number, target: number, rate: number): number {
  return current + (target - current) * rate;
}

export function createArchiveScene(
  canvas: HTMLCanvasElement,
  records: string[],
  stamp: string,
  compact: boolean,
  onSlow: () => void,
): ArchiveScene {
  const renderer = new WebGLRenderer({ canvas, antialias: !compact, powerPreference: "high-performance" });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(GROUND);

  const scene = new Scene();
  scene.fog = new FogExp2(GROUND, 0.055);
  const camera = new PerspectiveCamera(58, 1, 0.1, 80);

  const textures: Texture[] = [];
  const texture = (source: HTMLCanvasElement) => {
    const created = new CanvasTexture(source);
    created.colorSpace = SRGBColorSpace;
    created.anisotropy = 4;
    textures.push(created);
    return created;
  };

  const bays: number[] = [];
  for (let z = AISLE_START; z > AISLE_END; z -= BAY) bays.push(z);

  const recordSpots = records.map((_, index) => ({
    side: index % 2 === 0 ? -1 : 1,
    z: RECORD_FIRST_Z + index * RECORD_STEP,
  }));

  // Caixas comuns. A vaga vazia e os registros aprovados ficam de fora.
  const boxes: Matrix4[] = [];
  const tints: Color[] = [];
  const matrix = new Matrix4();
  const perBay = 5;
  const boxLength = BAY / perBay;
  for (const bayZ of bays) {
    for (const side of [-1, 1]) {
      for (const level of LEVELS) {
        for (let slot = 0; slot < perBay; slot += 1) {
          const z = bayZ - boxLength * (slot + 0.5);
          const isReserved =
            level === RECORD_LEVEL &&
            (recordSpots.some((spot) => spot.side === side && Math.abs(spot.z - z) < 0.3) ||
              (side === 1 && Math.abs(EMPTY_SLOT.z - z) < 0.3));
          if (isReserved) continue;
          const height = 0.4 + Math.random() * 0.08;
          matrix.makeScale(1, height, 0.9);
          matrix.setPosition(side * (2 + (Math.random() - 0.5) * 0.05), level + height / 2 + 0.02, z);
          boxes.push(matrix.clone());
          const shade = 0.78 + Math.random() * 0.3;
          tints.push(new Color(shade, shade * 0.97, shade * 0.92));
        }
      }
    }
  }

  const boxGeometry = new BoxGeometry(BOX_DEPTH, 1, boxLength);
  const boxMaterial = new MeshStandardMaterial({ map: texture(drawKraft()), roughness: 0.9 });
  const boxMesh = new InstancedMesh(boxGeometry, boxMaterial, boxes.length);
  boxes.forEach((item, index) => {
    boxMesh.setMatrixAt(index, item);
    boxMesh.setColorAt(index, tints[index]);
  });
  scene.add(boxMesh);

  // Prateleiras e colunas verdes.
  const shelfGeometry = new BoxGeometry(0.84, 0.035, BAY);
  const shelfMaterial = new MeshStandardMaterial({ color: SHELF_GREEN, roughness: 0.55, metalness: 0.2 });
  const shelves = new InstancedMesh(shelfGeometry, shelfMaterial, bays.length * 2 * LEVELS.length);
  let shelfIndex = 0;
  for (const bayZ of bays) {
    for (const side of [-1, 1]) {
      for (const level of LEVELS) {
        matrix.makeTranslation(side * 2, level, bayZ - BAY / 2);
        shelves.setMatrixAt(shelfIndex, matrix);
        shelfIndex += 1;
      }
    }
  }
  scene.add(shelves);

  const postGeometry = new BoxGeometry(0.05, 3.4, 0.05);
  const postMaterial = new MeshStandardMaterial({ color: 0x20382c, roughness: 0.6 });
  const posts = new InstancedMesh(postGeometry, postMaterial, (bays.length + 1) * 2);
  let postIndex = 0;
  for (let index = 0; index <= bays.length; index += 1) {
    for (const side of [-1, 1]) {
      matrix.makeTranslation(side * 1.6, 1.7, AISLE_START - index * BAY);
      posts.setMatrixAt(postIndex, matrix);
      postIndex += 1;
    }
  }
  scene.add(posts);

  // Piso com as faixas do corredor e teto com as calhas de luz.
  const floorCanvas = document.createElement("canvas");
  floorCanvas.width = 64;
  floorCanvas.height = 256;
  const floorCtx = floorCanvas.getContext("2d")!;
  floorCtx.fillStyle = "#6f7f76";
  floorCtx.fillRect(0, 0, 64, 256);
  floorCtx.fillStyle = "#c9d2c8";
  floorCtx.fillRect(0, 0, 64, 7);
  const floorMap = texture(floorCanvas);
  floorMap.wrapS = floorMap.wrapT = RepeatWrapping;
  floorMap.repeat.set(1, 24);
  const planeGeometry = new PlaneGeometry(3.2, AISLE_START - AISLE_END);
  const floorMaterial = new MeshStandardMaterial({ map: floorMap, roughness: 0.32, metalness: 0.1 });
  const floor = new Mesh(planeGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, (AISLE_START + AISLE_END) / 2);
  scene.add(floor);

  const ceilingMaterial = new MeshStandardMaterial({ color: 0x18261f, roughness: 1 });
  const ceiling = new Mesh(new PlaneGeometry(6, AISLE_START - AISLE_END), ceilingMaterial);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 3.42, (AISLE_START + AISLE_END) / 2);
  scene.add(ceiling);

  const stripGeometry = new BoxGeometry(0.16, 0.03, 1.5);
  const stripMaterial = new MeshBasicMaterial({ color: 0xfff4dc });
  const strips = new InstancedMesh(stripGeometry, stripMaterial, Math.ceil((AISLE_START - AISLE_END) / 2.6));
  for (let index = 0; index < strips.count; index += 1) {
    matrix.makeTranslation(0, 3.38, AISLE_START - 1 - index * 2.6);
    strips.setMatrixAt(index, matrix);
  }
  scene.add(strips);

  // A porta amarela do fim do corredor, que vira a seção seguinte.
  const doorMaterial = new MeshBasicMaterial({ color: 0xf3c32b, fog: false, toneMapped: false });
  const door = new Mesh(new PlaneGeometry(3.3, 3.42), doorMaterial);
  door.position.set(0, 1.71, AISLE_END);
  scene.add(door);

  const wheelMaterial = new MeshStandardMaterial({ color: 0x17130e, roughness: 0.4, metalness: 0.5, fog: false });
  const wheelGeometry = new TorusGeometry(0.2, 0.022, 10, 36);
  const spokeGeometry = new CylinderGeometry(0.014, 0.014, 0.4, 8);
  const wheels = [-0.82, 0.82].flatMap((x) => {
    const parts: Mesh[] = [new Mesh(wheelGeometry, wheelMaterial)];
    for (const angle of [0, Math.PI / 1.5, -Math.PI / 1.5]) {
      const spoke = new Mesh(spokeGeometry, wheelMaterial);
      spoke.rotation.z = angle;
      parts.push(spoke);
    }
    parts.forEach((part) => part.position.set(x, 1.45, AISLE_END + 0.02));
    return parts;
  });
  scene.add(...wheels);

  // Registros aprovados: caixas com etiqueta, que saem da prateleira quando citados.
  const recordGeometry = new BoxGeometry(BOX_DEPTH, 0.48, 0.38);
  const plain = new MeshStandardMaterial({ map: boxMaterial.map, roughness: 0.9 });
  const recordMaterials: Material[] = [plain];
  const recordMeshes = records.map((record, index) => {
    const label = new MeshStandardMaterial({ map: texture(drawRecordLabel(record, stamp)), roughness: 0.75 });
    recordMaterials.push(label);
    const spot = recordSpots[index];
    const faces = spot.side === 1 ? [plain, label, plain, plain, plain, plain] : [label, plain, plain, plain, plain, plain];
    const mesh = new Mesh(recordGeometry, faces);
    mesh.position.set(spot.side * 2, RECORD_LEVEL + 0.26, spot.z);
    scene.add(mesh);
    return mesh;
  });

  scene.add(new HemisphereLight(0xcfe0d0, 0x20150a, 0.2));
  const aisleLights = [0, 1, 2].map(() => {
    const light = new PointLight(0xfff0d2, 20, 9, 1.8);
    scene.add(light);
    return light;
  });
  const focus = new PointLight(0xff3a28, 0, 7, 1.6);
  scene.add(focus);

  let targetProgress = 0;
  let progress = 0;
  let selected = -1;
  let focusLevel = 0;
  let lookX = 0;
  let running = true;
  let frame = 0;
  let lastFrame = performance.now();
  let sampled = 0;
  let sampledTime = 0;
  const pointer = { x: 0, y: 0 };
  const slides = recordMeshes.map(() => 0);
  const focusColor = new Color(0xff3a28);
  const approvedColor = new Color(0xffe4b0);
  const refusedColor = new Color(0xff2a1c);

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.25 : 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.fov = width < height ? 74 : 58;
    camera.updateProjectionMatrix();
  };

  const draw = () => {
    frame = 0;
    if (!running) return;
    frame = requestAnimationFrame(draw);

    // Suavização por tempo: mesma velocidade em 60 Hz, 120 Hz ou celular lento.
    const now = performance.now();
    const rawElapsed = (now - lastFrame) / 1000;
    const elapsed = Math.min(0.1, rawElapsed);
    lastFrame = now;

    // Aparelho sem fôlego: desiste do 3D e a página fica com a foto.
    if (sampled < SLOW_SAMPLES && rawElapsed < 1) {
      sampled += 1;
      sampledTime += rawElapsed;
      if (sampled === SLOW_SAMPLES && sampledTime / SLOW_SAMPLES > SLOW_FRAME) {
        onSlow();
        return;
      }
    }
    const rate = (speed: number) => 1 - Math.exp(-elapsed * speed);

    progress = ease(progress, targetProgress, rate(7));
    const z = CAMERA_START + (CAMERA_END - CAMERA_START) * progress;
    const nearDoor = Math.min(1, progress * 1.2);
    const swayX = Math.sin(progress * Math.PI * 3) * 0.16 * (1 - nearDoor * nearDoor);

    const active = selected >= 0 ? recordSpots[selected] : null;
    const attention = Math.max(0, 1 - progress * 5);
    const targetLook = (active ? 0 : 0.7) * attention;
    lookX = ease(lookX, targetLook, rate(3));

    camera.position.set(swayX + pointer.x * 0.1 * (1 - nearDoor), 1.5 + pointer.y * 0.05, z);
    camera.lookAt(swayX * 0.3 + lookX, 1.5, z - 6);

    aisleLights.forEach((light, index) => {
      light.position.set(0, 3, Math.max(AISLE_END + 1, z - 2 - index * 6));
    });

    recordMeshes.forEach((mesh, index) => {
      slides[index] = ease(slides[index], index === selected && attention > 0.15 ? 1 : 0, rate(5));
      const spot = recordSpots[index];
      mesh.position.x = spot.side * 2 + (RECORD_PULLED.x - spot.side * 2) * slides[index];
      mesh.position.y = RECORD_LEVEL + 0.26 + (RECORD_PULLED.y - RECORD_LEVEL - 0.26) * slides[index];
      mesh.position.z = spot.z + (RECORD_PULLED.z - spot.z) * slides[index];
      mesh.rotation.y = spot.side * slides[index] * (Math.PI / 2 - 0.12);
    });

    focusLevel = ease(focusLevel, attention > 0 ? 1 : 0, rate(5));
    if (active) {
      focus.position.set(RECORD_PULLED.x, RECORD_PULLED.y + 0.5, RECORD_PULLED.z + 0.9);
      focusColor.lerp(approvedColor, rate(6));
    } else {
      focus.position.set(EMPTY_SLOT.x - 0.9, EMPTY_SLOT.y, EMPTY_SLOT.z);
      focusColor.lerp(refusedColor, rate(6));
    }
    focus.color.copy(focusColor);
    focus.intensity = focusLevel * (active ? 9 : 14);

    renderer.render(scene, camera);
  };

  const handlePointer = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (0.5 - event.clientY / window.innerHeight) * 2;
  };
  if (!compact) window.addEventListener("pointermove", handlePointer, { passive: true });

  resize();
  frame = requestAnimationFrame(draw);

  return {
    setProgress(value) {
      targetProgress = value;
    },
    show(record) {
      selected = record;
    },
    resize,
    setRunning(value) {
      if (value === running) return;
      running = value;
      if (running && !frame) {
        lastFrame = performance.now();
        frame = requestAnimationFrame(draw);
      }
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", handlePointer);
      const geometries = [
        boxGeometry, shelfGeometry, postGeometry, planeGeometry, ceiling.geometry, stripGeometry,
        door.geometry, wheelGeometry, spokeGeometry, recordGeometry,
      ];
      const materials: Material[] = [
        boxMaterial, shelfMaterial, postMaterial, floorMaterial, ceilingMaterial, stripMaterial,
        doorMaterial, wheelMaterial, ...recordMaterials,
      ];
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((item) => item.dispose());
      boxMesh.dispose();
      shelves.dispose();
      posts.dispose();
      strips.dispose();
      renderer.dispose();
    },
  };
}
