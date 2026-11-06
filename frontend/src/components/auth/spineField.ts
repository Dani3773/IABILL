export interface SpineField {
  // Cada tecla manda uma onda curta pelas lombadas.
  tick(): void;
  deny(): void;
  // Resolve quando a linha vermelha terminou de subir; a tela só muda depois disso.
  open(): Promise<void>;
  dispose(): void;
}

const SPACING = 7;
const INK = "243, 240, 232";
const RED = "217, 43, 33";
const WAVE_SPEED = 620;
const WAVE_WIDTH = 90;
const OPEN_SECONDS = 0.7;

interface Wave {
  start: number;
  red: boolean;
}

function smooth(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

// Lombadas de um arquivo vistas de longe: linhas finas, e só uma aprovada em vermelho.
export function createSpineField(canvas: HTMLCanvasElement, still: boolean): SpineField {
  const ctx = canvas.getContext("2d")!;
  let width = 0;
  let height = 0;
  let heights: number[] = [];
  let approved = 0;
  let frame = 0;
  let running = true;
  let openAt = 0;
  let openDone: (() => void) | null = null;
  const pointer = { x: -1000, strength: 0, target: 0 };
  const waves: Wave[] = [];

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio, 2);
    width = box.width;
    height = box.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.ceil(width / SPACING);
    if (heights.length !== count) {
      heights = Array.from({ length: count }, () => 0.18 + Math.random() * 0.2 + (Math.random() < 0.12 ? 0.14 : 0));
      approved = Math.round(count * 0.42);
    }
  };

  const draw = (now: number) => {
    ctx.clearRect(0, 0, width, height);
    pointer.strength += (pointer.target - pointer.strength) * 0.06;

    const opening = openAt ? smooth((now - openAt) / (OPEN_SECONDS * 1000)) : 0;
    const base = height;
    ctx.lineWidth = 1;

    for (let index = 0; index < heights.length; index += 1) {
      const x = index * SPACING + 0.5;
      const breath = still ? 0 : Math.sin(now * 0.00045 + index * 0.21) * 0.012;
      const near = Math.max(0, 1 - Math.abs(x - pointer.x) / 110);
      let lift = near * near * 0.07 * pointer.strength;
      let tint = 0;

      for (const wave of waves) {
        const front = ((now - wave.start) / 1000) * WAVE_SPEED;
        const distance = Math.abs(x - front);
        if (distance < WAVE_WIDTH) {
          const shape = 1 - distance / WAVE_WIDTH;
          lift += shape * shape * 0.05;
          if (wave.red) tint = Math.max(tint, shape);
        }
      }

      const isApproved = index === approved;
      const size = heights[index] + breath + lift;
      const top = isApproved
        ? base - height * (size + 0.2 + opening * (1 - size - 0.2))
        : base - height * size * (1 - opening * 0.25);

      ctx.strokeStyle = isApproved || tint > 0.2
        ? `rgba(${RED}, ${isApproved ? 1 : 0.35 + tint * 0.5})`
        : `rgba(${INK}, ${(0.24 + lift * 3) * (1 - opening * 0.6)})`;
      ctx.beginPath();
      ctx.moveTo(x, base);
      ctx.lineTo(x, top);
      ctx.stroke();
    }

    while (waves.length && ((now - waves[0].start) / 1000) * WAVE_SPEED > width + WAVE_WIDTH) waves.shift();
    if (openDone && now - openAt >= OPEN_SECONDS * 1000) {
      openDone();
      openDone = null;
    }
  };

  const loop = (now: number) => {
    if (!running) return;
    draw(now);
    frame = requestAnimationFrame(loop);
  };

  const handlePointer = (event: PointerEvent) => {
    const box = canvas.getBoundingClientRect();
    pointer.x = event.clientX - box.left;
    pointer.target = event.clientX < box.right ? 1 : 0;
  };

  resize();
  window.addEventListener("resize", resize);
  if (still) {
    draw(0);
  } else {
    window.addEventListener("pointermove", handlePointer, { passive: true });
    frame = requestAnimationFrame(loop);
  }

  return {
    tick() {
      if (!still && waves.length < 4) waves.push({ start: performance.now(), red: false });
    },
    deny() {
      if (!still) waves.push({ start: performance.now(), red: true });
    },
    open() {
      if (still) return Promise.resolve();
      if (!openAt) openAt = performance.now();
      return new Promise((resolve) => {
        openDone = resolve;
        // Garante a saída mesmo se a aba ficar em segundo plano.
        window.setTimeout(resolve, (OPEN_SECONDS + 0.2) * 1000);
      });
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointer);
    },
  };
}
