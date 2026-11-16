import { gsap } from './gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';

gsap.registerPlugin(Physics2DPlugin);

/* ────────────────────────────────────────────────────────────────
   Caída con física de las fórmulas de IA (GSAP Physics2D).

   El cambio de palabra sigue al scroll (CSS, --k por celda). Cuando una
   celda cruza la mitad de su cambio hacia delante, una copia de la
   palabra antigua sale disparada hacia arriba y cae con gravedad y giro
   reales, fuera de la hoja; la original se oculta (clase .fell). Si se
   vuelve hacia atrás, la palabra reaparece en su sitio sin caer.
   La capa de caída es fija y sin eventos: no afecta al layout.
   ──────────────────────────────────────────────────────────────── */
export interface WordFall {
  /** k por celda (0–1), en el mismo orden que `cells`. */
  update: (ks: number[]) => void;
  dispose: () => void;
}

export function createWordFall(cells: HTMLElement[]): WordFall {
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:40;overflow:hidden';
  document.body.appendChild(layer);
  const fallen = cells.map(() => false);
  const live = new Set<gsap.core.Tween>();

  const drop = (cell: HTMLElement, i: number) => {
    const old = cell.querySelector<HTMLElement>('.diff-old');
    if (!old) return;
    const r = old.getBoundingClientRect();
    if (r.width < 1) return;
    const cs = getComputedStyle(old);
    const clone = document.createElement('span');
    clone.textContent = old.textContent;
    clone.style.cssText = `position:absolute;left:${r.left}px;top:${r.top}px;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing};color:rgb(var(--ai));background:rgb(var(--ai) / .14);border-radius:4px;padding:0 .08em;will-change:transform`;
    layer.appendChild(clone);
    const t = gsap.to(clone, {
      duration: 1.5,
      physics2D: { velocity: 260 + Math.random() * 160, angle: -100 + (i % 2 ? 22 : -22) + (Math.random() - 0.5) * 30, gravity: 1500 },
      rotation: (Math.random() - 0.5) * 90,
      opacity: 0,
      ease: 'none',
      onComplete: () => { clone.remove(); live.delete(t); },
    });
    live.add(t);
  };

  return {
    update: (ks) => {
      ks.forEach((k, i) => {
        const cell = cells[i];
        if (!cell) return;
        if (!fallen[i] && k >= 0.5) { fallen[i] = true; cell.classList.add('fell'); drop(cell, i); }
        else if (fallen[i] && k < 0.5) { fallen[i] = false; cell.classList.remove('fell'); }
      });
    },
    dispose: () => {
      live.forEach((t) => t.kill());
      layer.remove();
      cells.forEach((c) => c.classList.remove('fell'));
    },
  };
}
