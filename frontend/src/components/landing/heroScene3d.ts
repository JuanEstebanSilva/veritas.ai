import * as THREE from 'three';
import { animate, stagger } from 'animejs';

// Los valores por función (target, índice) son válidos en anime.js 4, pero sus tipos no los
// infieren bien dentro de fotogramas clave: se declaran los parámetros con este tipo.
type AnimeParams = Parameters<typeof animate>[1];
import { token } from '../../motion/canvas';

/* ────────────────────────────────────────────────────────────────
   Escena 3D del héroe, con la técnica de animejs.com: three.js dibuja
   y anime.js anima objetos JS normales (x, y, z, escala y color de
   cada bloque); en cada fotograma se copian a una InstancedMesh.

   192 bloques recorren cuatro capítulos:
     documento → escaneo (cada línea toma su veredicto) → ciudad de
     párrafos (altura = puntuación) → sello de Plagelio.

   Este módulo se importa con import() dinámico: three.js no entra en
   el paquete inicial de la página.
   ──────────────────────────────────────────────────────────────── */

export type HeroChapter = 'documento' | 'escaneo' | 'ciudad' | 'sello';
export const CHAPTERS: HeroChapter[] = ['documento', 'escaneo', 'ciudad', 'sello'];

export interface HeroSceneApi {
  goto: (chapter: HeroChapter, first?: boolean) => void;
  /** Recalcula colores tras un cambio de tema. */
  retheme: () => void;
  dispose: () => void;
}

const COLS = 16, ROWS = 12, N = COLS * ROWS;
type Tone = 'human' | 'mixed' | 'ai';
interface Cell { c: number; r: number; ink: boolean; tone: Tone; h: number; cityTone: Tone; sc: number; sr: number; inShield: boolean; check: boolean; }
interface Proxy { x: number; y: number; z: number; sx: number; sy: number; sz: number; r: number; g: number; b: number; }
interface Target { x: number; y: number; z: number; sx: number; sy: number; sz: number; col: [number, number, number]; }

// Datos deterministas: las mismas líneas, veredictos y alturas en cada visita.
const buildCells = (): Cell[] => {
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
  const PARAS: [number, number, Tone][] = [[1, 2, 'human'], [4, 5, 'ai'], [7, 8, 'mixed'], [10, 10, 'human']];
  const cells: Cell[] = [];
  for (let i = 0; i < N; i++) {
    const c = i % COLS, r = (i / COLS) | 0;
    const par = PARAS.find(([a, b]) => r >= a && r <= b);
    const ink = !!par && c > 0 && c < COLS - 1 && rnd() > 0.17 && !(r === par[1] && c > 11);
    let tone: Tone = par ? par[2] : 'human';
    if (ink && rnd() < 0.12) tone = tone === 'ai' ? 'mixed' : 'ai';
    const h = 0.35 + 5.2 * Math.abs(Math.sin(c * 0.55 + r * 0.35) * Math.cos(r * 0.8 - c * 0.22));
    const cityTone: Tone = h > 3.4 ? 'ai' : h > 1.8 ? 'mixed' : 'human';
    // Sello: escudo dibujado en una rejilla de 12 × 16 (192 celdas, una por bloque)
    const sc = i % 12, sr = (i / 12) | 0, u = (sc - 5.5) / 6, w = sr / 15;
    const half = w < 0.5 ? 0.95 : 0.95 * Math.sqrt(Math.max(0, 1 - Math.pow((w - 0.5) / 0.53, 2)));
    const inShield = Math.abs(u) <= half + 0.02;
    const seg = (ax: number, ay: number, bx: number, by: number) => {
      const vx = bx - ax, vy = by - ay;
      const t = Math.max(0, Math.min(1, ((u - ax) * vx + (w - ay) * vy) / (vx * vx + vy * vy)));
      return Math.hypot(u - (ax + vx * t), w - (ay + vy * t));
    };
    const check = inShield && Math.min(seg(-0.45, 0.47, -0.1, 0.7), seg(-0.1, 0.7, 0.48, 0.25)) < 0.105;
    cells.push({ c, r, ink, tone, h, cityTone, sc, sr, inShield, check });
  }
  return cells;
};

export function createHeroScene(canvas: HTMLCanvasElement, opts: { reduced: boolean; onReady?: () => void }): HeroSceneApi {
  const { reduced } = opts;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const V = 7.9;
  const camera = new THREE.OrthographicCamera(-V, V, V, -V, 0.1, 200);
  camera.position.set(14, 12.5, 14);
  camera.lookAt(0, 2.2, 0);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x2a3340, 1.25);
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(7, 16, 4);
  scene.add(hemi, sun);
  const group = new THREE.Group();
  scene.add(group);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 });
  const mesh = new THREE.InstancedMesh(geometry, material, N);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);

  const cells = buildCells();
  // Los bloques llegan desde arriba, dispersos, en la primera escena
  const P: Proxy[] = cells.map(() => ({
    x: (Math.random() - 0.5) * 30, y: 10 + Math.random() * 10, z: (Math.random() - 0.5) * 30,
    sx: 0, sy: 0, sz: 0, r: 0.25, g: 0.75, b: 1,
  }));

  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const sync = () => {
    for (let i = 0; i < N; i++) {
      const p = P[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.set(Math.max(p.sx, 1e-4), Math.max(p.sy, 1e-4), Math.max(p.sz, 1e-4));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      col.setRGB(Math.min(1, Math.max(0, p.r)), Math.min(1, Math.max(0, p.g)), Math.min(1, Math.max(0, p.b)), THREE.SRGBColorSpace);
      mesh.setColorAt(i, col);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };

  // El papel es papel en los dos temas (como .sheet); la tinta y los veredictos salen de los tokens.
  const tone01 = (name: string): [number, number, number] => { const [r, g, b] = token(name); return [r / 255, g / 255, b / 255]; };
  const PAPER: [number, number, number] = [0.95, 0.95, 0.93];
  const INK: [number, number, number] = [0.42, 0.44, 0.48];
  const WHITE: [number, number, number] = [1, 1, 1];

  const STATES: Record<HeroChapter, (k: Cell) => Target> = {
    documento: (k) => ({ x: k.c - 7.5, y: 0.1, z: k.r - 5.5, sx: 0.92, sy: 0.2, sz: 0.92, col: k.ink ? INK : PAPER }),
    escaneo: (k) => ({ x: k.c - 7.5, y: 0.1, z: k.r - 5.5, sx: 0.92, sy: 0.2, sz: 0.92, col: k.ink ? tone01(k.tone) : PAPER }),
    ciudad: (k) => ({ x: k.c - 7.5, y: k.h / 2, z: k.r - 5.5, sx: 0.76, sy: k.h, sz: 0.76, col: tone01(k.cityTone) }),
    sello: (k) => (k.inShield
      ? { x: (k.sc - 5.5) * 0.66, y: (15 - k.sr) * 0.66 + 0.4, z: 0, sx: 0.6, sy: 0.6, sz: 0.6, col: k.check ? WHITE : tone01('azure') }
      : { x: (k.sc - 5.5) * 0.66, y: 14 + ((k.c * 13 + k.r * 7) % 40) / 10, z: ((k.c * 5 + k.r * 3) % 12) / 2 - 3, sx: 0, sy: 0, sz: 0, col: tone01('azure') }),
  };

  const view = { ry: 0 };
  let current: HeroChapter = 'documento';
  let running: { revert?: () => void; cancel?: () => void; pause?: () => void }[] = [];

  const goto = (name: HeroChapter, first = false) => {
    current = name;
    const T = cells.map((k) => STATES[name](k));
    running.forEach((a) => a.pause?.());
    running = [];
    if (reduced) {
      P.forEach((p, i) => Object.assign(p, { x: T[i].x, y: T[i].y, z: T[i].z, sx: T[i].sx, sy: T[i].sy, sz: T[i].sz, r: T[i].col[0], g: T[i].col[1], b: T[i].col[2] }));
      view.ry = name === 'sello' ? Math.PI / 4 : 0;
      render();
      return;
    }
    const geo = name === 'ciudad' ? 'outElastic(1, .7)' : 'inOutQuart';
    const at = (key: keyof Target) => (_: unknown, i: number) => T[i][key] as number;
    const c = (j: number) => (_: unknown, i: number) => T[i].col[j];
    const base = {
      x: { to: at('x'), ease: geo }, z: { to: at('z'), ease: geo },
      sx: { to: at('sx'), ease: geo }, sy: { to: at('sy'), ease: geo }, sz: { to: at('sz'), ease: geo },
      r: { to: c(0), ease: 'out(2)' }, g: { to: c(1), ease: 'out(2)' }, b: { to: c(2), ease: 'out(2)' },
      duration: first ? 1100 : 900,
    };
    if (name === 'escaneo') {
      // La ola recorre las filas: cada bloque sube y cae ya con su veredicto
      running.push(animate(P, {
        ...base,
        y: [{ to: (_: unknown, i: number) => T[i].y + 1.3, duration: 260, ease: 'out(3)' }, { to: at('y'), duration: 560, ease: 'outBounce' }],
        delay: stagger(55, { grid: [COLS, ROWS], from: 'first', axis: 'y' }),
      } as unknown as AnimeParams));
    } else {
      running.push(animate(P, { ...base, y: { to: at('y'), ease: geo }, delay: stagger(first ? 9 : 14, { grid: [COLS, ROWS], from: 'center' }) } as unknown as AnimeParams));
    }
    running.push(animate(view, { ry: name === 'sello' ? Math.PI / 4 : 0, duration: 1300, ease: 'inOutQuart' }));
  };

  // Tamaño: cámara ortográfica que conserva el encuadre en cualquier proporción
  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    const a = w / h;
    if (a >= 1) { camera.left = -V * a; camera.right = V * a; camera.top = V; camera.bottom = -V; }
    else { camera.left = -V; camera.right = V; camera.top = V / a; camera.bottom = -V / a; }
    camera.updateProjectionMatrix();
    if (reduced) render();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Puntero: la escena se inclina un poco (solo con ratón y sin movimiento reducido)
  const ptr = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  const stageEl = canvas.parentElement || canvas;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const onMove = (e: PointerEvent) => { const b = stageEl.getBoundingClientRect(); ptr.x = (e.clientX - b.left) / b.width - 0.5; ptr.y = (e.clientY - b.top) / b.height - 0.5; };
  const onLeave = () => { ptr.x = 0; ptr.y = 0; };
  if (fine && !reduced) {
    stageEl.addEventListener('pointermove', onMove, { passive: true });
    stageEl.addEventListener('pointerleave', onLeave);
  }

  let visible = true, raf = 0, disposed = false, readySent = false;
  const render = () => {
    cur.x += (ptr.x - cur.x) * 0.06;
    cur.y += (ptr.y - cur.y) * 0.06;
    group.rotation.y = view.ry + cur.x * 0.5;
    group.rotation.x = cur.y * 0.12;
    sync();
    renderer.render(scene, camera);
    if (!readySent) { readySent = true; opts.onReady?.(); }
  };
  const frame = (t: number) => {
    raf = 0;
    if (disposed) return;
    if (visible && !document.hidden) {
      group.position.y = current === 'sello' ? Math.sin(t / 700) * 0.18 : 0;
      render();
    }
    raf = requestAnimationFrame(frame);
  };
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.02 });
  io.observe(canvas);

  resize();
  if (reduced) render(); else raf = requestAnimationFrame(frame);

  return {
    goto,
    retheme: () => goto(current),
    dispose: () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      running.forEach((a) => a.pause?.());
      ro.disconnect(); io.disconnect();
      stageEl.removeEventListener('pointermove', onMove);
      stageEl.removeEventListener('pointerleave', onLeave);
      geometry.dispose(); material.dispose(); mesh.dispose(); renderer.dispose();
    },
  };
}
