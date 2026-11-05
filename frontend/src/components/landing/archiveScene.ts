import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  FogExp2,
  Group,
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
  Points,
  PointsMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Texture,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from "three";

export interface ArchiveOptions {
  records: string[];
  stamp: string;
  document: string;
  compact: boolean;
  onSlow: () => void;
}

export interface ArchiveScene {
  setProgress(progress: number): void;
  // Progresso em que cada um dos três passos fica no centro da tela.
  setBeats(beats: number[]): void;
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
const BEAT_Z = [-16, -23, -30];
const BEAT_WINDOW = 0.06;
const BEAT_DISTANCE = 3.3;
const SOURCE_SLOTS = [
  { level: 1.3, z: -22.5 },
  { level: 1.3, z: -23.3 },
  { level: 1.85, z: -22.9 },
  { level: 0.75, z: -23.3 },
];
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

function drawDocument(title: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 760;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fbf5e6";
  ctx.fillRect(0, 0, 560, 760);
  ctx.fillStyle = "#17130e";
  ctx.font = '800 50px "Archivo", "Switzer", sans-serif';
  const lines = wrapLines(ctx, title.toUpperCase(), 470);
  lines.forEach((line, index) => ctx.fillText(line, 44, 92 + index * 56));
  ctx.fillStyle = "#b8ad97";
  for (let index = 0; index < 11; index += 1) {
    ctx.fillRect(44, 150 + lines.length * 56 + index * 34, index % 4 === 3 ? 300 : 472, 12);
  }
  return canvas;
}

function drawInk(text: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 220;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(280, 110);
  ctx.rotate(-0.09);
  ctx.strokeStyle = ctx.fillStyle = "#c4241b";
  ctx.font = '800 76px "Archivo", "Switzer", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = ctx.measureText(text).width;
  ctx.lineWidth = 12;
  ctx.strokeRect(-width / 2 - 26, -58, width + 52, 116);
  ctx.fillText(text, 0, 4);
  return canvas;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function ease(current: number, target: number, rate: number): number {
  return current + (target - current) * rate;
}

export function createArchiveScene(
  canvas: HTMLCanvasElement,
  { records, stamp, document: documentTitle, compact, onSlow }: ArchiveOptions,
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
            (level === RECORD_LEVEL &&
              (recordSpots.some((spot) => spot.side === side && Math.abs(spot.z - z) < 0.3) ||
                (side === 1 && Math.abs(EMPTY_SLOT.z - z) < 0.3) ||
                (side === 1 && Math.abs(BEAT_Z[0] - z) < 0.3))) ||
            (side === -1 && SOURCE_SLOTS.some((spot) => spot.level === level && Math.abs(spot.z - z) < 0.3));
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

  // Passo 1: um registro novo entra na prateleira.
  const newLabel = new MeshStandardMaterial({ map: texture(drawRecordLabel(records[2] ?? "", stamp)), roughness: 0.75 });
  recordMaterials.push(newLabel);
  const newRecord = new Mesh(recordGeometry, [plain, newLabel, plain, plain, plain, plain]);
  scene.add(newRecord);

  // Passo 2: a busca puxa só os registros que sustentam o pedido.
  const sources = SOURCE_SLOTS.map((slot, index) => {
    const label = new MeshStandardMaterial({
      map: texture(drawRecordLabel(records[(index + 1) % records.length] ?? "", stamp)),
      roughness: 0.75,
    });
    recordMaterials.push(label);
    const mesh = new Mesh(recordGeometry, [label, plain, plain, plain, plain, plain]);
    mesh.position.set(-2, slot.level + 0.26, slot.z);
    scene.add(mesh);
    return mesh;
  });

  // Passo 3: o documento sobre o suporte recebe o carimbo.
  const standGeometry = new BoxGeometry(0.5, 0.66, 0.4);
  const stand = new Mesh(standGeometry, postMaterial);
  stand.position.set(compact ? 0.2 : 0.72, 0.33, BEAT_Z[2]);
  scene.add(stand);

  const documentGroup = new Group();
  documentGroup.position.set(compact ? 0.2 : 0.72, 1.12, BEAT_Z[2]);
  documentGroup.rotation.x = -0.72;
  documentGroup.scale.setScalar(1.35);
  scene.add(documentGroup);

  const sheetGeometry = new PlaneGeometry(0.62, 0.84);
  const sheetMaterial = new MeshStandardMaterial({
    map: texture(drawDocument(documentTitle)),
    roughness: 0.8,
    side: DoubleSide,
  });
  documentGroup.add(new Mesh(sheetGeometry, sheetMaterial));

  const deskGeometry = new BoxGeometry(0.74, 0.96, 0.04);
  const desk = new Mesh(deskGeometry, postMaterial);
  desk.position.z = -0.026;
  documentGroup.add(desk);

  const inkGeometry = new PlaneGeometry(0.54, 0.21);
  const inkMaterial = new MeshBasicMaterial({ map: texture(drawInk(stamp)), transparent: true, opacity: 0, fog: false });
  const ink = new Mesh(inkGeometry, inkMaterial);
  ink.position.set(0, -0.2, 0.004);
  documentGroup.add(ink);

  const baseGeometry = new CylinderGeometry(0.16, 0.16, 0.05, 32);
  const handleGeometry = new CylinderGeometry(0.05, 0.075, 0.26, 24);
  const knobGeometry = new CylinderGeometry(0.085, 0.085, 0.07, 24);
  const stampBaseMaterial = new MeshStandardMaterial({ color: 0xd92b21, roughness: 0.45 });
  const stampWoodMaterial = new MeshStandardMaterial({ color: 0x4a2c17, roughness: 0.5 });
  const stampTool = new Group();
  const toolBase = new Mesh(baseGeometry, stampBaseMaterial);
  const toolHandle = new Mesh(handleGeometry, stampWoodMaterial);
  toolHandle.position.y = 0.15;
  const toolKnob = new Mesh(knobGeometry, stampWoodMaterial);
  toolKnob.position.y = 0.3;
  stampTool.add(toolBase, toolHandle, toolKnob);
  stampTool.rotation.x = Math.PI / 2;
  documentGroup.add(stampTool);

  // Poeira no feixe de luz, que dá profundidade ao corredor.
  const dustCount = compact ? 320 : 800;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    dustPositions[index * 3] = (Math.random() - 0.5) * 2.8;
    dustPositions[index * 3 + 1] = 0.15 + Math.random() * 3;
    dustPositions[index * 3 + 2] = AISLE_END + Math.random() * (AISLE_START - AISLE_END);
  }
  const dustGeometry = new BufferGeometry();
  dustGeometry.setAttribute("position", new BufferAttribute(dustPositions, 3));
  const dustMaterial = new PointsMaterial({
    blending: AdditiveBlending,
    color: 0xfff0d2,
    depthWrite: false,
    opacity: 0.32,
    size: 0.014,
    transparent: true,
  });
  const dust = new Points(dustGeometry, dustMaterial);
  scene.add(dust);

  scene.add(new HemisphereLight(0xcfe0d0, 0x20150a, 0.2));
  const aisleLights = [0, 1, 2].map(() => {
    const light = new PointLight(0xfff0d2, 20, 9, 1.8);
    scene.add(light);
    return light;
  });
  const focus = new PointLight(0xff3a28, 0, 7, 1.6);
  scene.add(focus);
  const beatLight = new PointLight(0xffe4b0, 0, 6, 1.6);
  scene.add(beatLight);

  let targetProgress = 0;
  let progress = 0;
  let selected = -1;
  let beats: number[] = [];
  let anchors: [number, number][] = [[0, CAMERA_START], [1, CAMERA_END]];
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

  // A câmera percorre o corredor e quase para diante de cada passo.
  const cameraZ = (value: number) => {
    for (let index = 1; index < anchors.length; index += 1) {
      const [startAt, startZ] = anchors[index - 1];
      const [endAt, endZ] = anchors[index];
      if (value <= endAt) {
        const span = endAt - startAt;
        return startZ + (endZ - startZ) * (span > 0 ? (value - startAt) / span : 1);
      }
    }
    return CAMERA_END;
  };

  const beatProgress = (index: number) =>
    beats[index] === undefined ? 0 : clamp01((progress - beats[index] + BEAT_WINDOW) / (BEAT_WINDOW * 2));

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
    const z = cameraZ(progress);
    const nearDoor = Math.min(1, progress * 1.2);
    const swayX = Math.sin(progress * Math.PI * 3) * 0.16 * (1 - nearDoor * nearDoor);

    const active = selected >= 0 ? recordSpots[selected] : null;
    const attention = Math.max(0, 1 - progress * 5);
    const targetLook = (active ? 0 : 0.7) * attention;
    lookX = ease(lookX, targetLook, rate(3));

    camera.position.set(swayX + pointer.x * 0.1 * (1 - nearDoor), 1.5 + pointer.y * 0.05, z);
    const inBeat = Math.max(...[0, 1, 2].map((index) => Math.sin(beatProgress(index) * Math.PI)));
    // No celular a ficha ocupa a metade de baixo: a câmera abaixa e a cena sobe.
    camera.lookAt(swayX * 0.3 + lookX, 1.5 - (compact ? inBeat * 1.5 : 0), z - 6);

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

    const entering = smooth(beatProgress(0) * 1.3);
    newRecord.position.set(0.5 + 1.5 * entering, RECORD_LEVEL + 0.26, BEAT_Z[0]);
    newRecord.rotation.y = (1 - entering) * 1.3;

    const searching = beatProgress(1);
    sources.forEach((mesh, index) => {
      const pulled = smooth(searching * 1.7 - index * 0.22);
      mesh.position.x = -2 + pulled * 0.5;
    });

    const stamping = beatProgress(2);
    const down = smooth((stamping - 0.2) / 0.28);
    const up = smooth((stamping - 0.62) / 0.3);
    stampTool.position.set(up * 0.62, -0.2 + up * 0.3, 0.62 - down * 0.585 + up * 0.585);
    inkMaterial.opacity = stamping > 0.46 ? 1 : 0;

    const beatZ = stamping > 0 ? BEAT_Z[2] : searching > 0 ? BEAT_Z[1] : BEAT_Z[0];
    const beatSide = stamping > 0 ? 0.7 : searching > 0 ? -1.2 : 1.2;
    beatLight.position.set(beatSide, 1.9, beatZ + 0.9);
    beatLight.intensity = inBeat * 12;

    dust.position.y = Math.sin(now * 0.00012) * 0.12;
    dust.position.x = Math.cos(now * 0.00009) * 0.08;

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
    setBeats(next) {
      beats = next;
      anchors = [[0, CAMERA_START]];
      next.forEach((value, index) => {
        const stop = BEAT_Z[index] + BEAT_DISTANCE;
        anchors.push([value - BEAT_WINDOW, stop + 0.3], [value + BEAT_WINDOW, stop - 0.3]);
      });
      anchors.push([1, CAMERA_END]);
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
        standGeometry, deskGeometry, sheetGeometry, inkGeometry, baseGeometry, handleGeometry, knobGeometry, dustGeometry,
        boxGeometry, shelfGeometry, postGeometry, planeGeometry, ceiling.geometry, stripGeometry,
        door.geometry, wheelGeometry, spokeGeometry, recordGeometry,
      ];
      const materials: Material[] = [
        sheetMaterial, inkMaterial, stampBaseMaterial, stampWoodMaterial, dustMaterial,
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
