import React, { useEffect, useRef } from 'react';
import { scroll } from 'motion';
import { useCanvasScene, token, type Rgb } from '../../motion/canvas';
import { getScoreMood } from '../../utils/scoreMood';

/* ────────────────────────────────────────────────────────────────
   Ciudad de párrafos (canvas isométrico).

   Cada edificio es un párrafo y su altura, la probabilidad de IA. Crecen
   en ola al entrar en pantalla con un resorte amortiguado; el scroll
   inclina la cámara (Motion scroll). Al pasar el cursor se ve el párrafo
   y al pulsar se abre su detalle. La lista de párrafos sigue disponible
   como alternativa accesible.
   ──────────────────────────────────────────────────────────────── */
export interface CityParagraph { index: number; aiScore: number; }

interface Building { p: CityParagraph; x: number; y: number; h: number; v: number; delay: number; hull?: [number, number][]; }

const VW = 640, VH = 440;

const inside = (pt: [number, number], poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

interface ParagraphCityProps {
  paragraphs: CityParagraph[];
  selected: number | null;
  onSelect: (index: number) => void;
  label: string;
}

export const ParagraphCity: React.FC<ParagraphCityProps> = ({ paragraphs, selected, onSelect, label }) => {
  const tipRef = useRef<HTMLDivElement>(null);
  const elev = useRef(0.5);
  const selRef = useRef(selected);
  selRef.current = selected;
  const wakeRef = useRef<() => void>(() => {});

  const ref = useCanvasScene(({ wake }) => {
    wakeRef.current = wake;
    const count = paragraphs.length;
    const N = Math.max(2, Math.ceil(Math.sqrt(count))), R = Math.max(1, Math.ceil(count / N));
    const CELL = Math.min(72, 254 / Math.max(N, R)), CX = CELL * 0.866, D = 0.78;
    const HMUL = Math.min(1.9, Math.max(1.25, (1.25 * CELL) / 42));
    const buildings: Building[] = paragraphs.map((p, i) => {
      const x = i % N, y = Math.floor(i / N);
      return { p, x, y, h: 0, v: 0, delay: (x + y) * 90 };
    }).sort((a, b) => a.x + a.y - (b.x + b.y));
    let colors: Record<string, Rgb> = {}, hover: Building | null = null, startAt: number | null = null, scale = 1;

    const P = (x: number, y: number, z: number): [number, number] => [
      VW / 2 + (x - y - (N - R) / 2) * CX,
      268 + (x + y - (N + R) / 2) * CELL * elev.current - z,
    ];
    const tone = (b: Building) => colors[getScoreMood(b.p.aiScore).tone];
    const shade = (c: Rgb, f: number) => `rgb(${Math.min(255, (c[0] * f) | 0)},${Math.min(255, (c[1] * f) | 0)},${Math.min(255, (c[2] * f) | 0)})`;

    return {
      layout: (s) => {
        colors = { ai: token('ai'), mixed: token('mixed'), human: token('human'), hi: token('hi'), low: token('low') };
        scale = s.w / VW;
        const c = s.canvas;
        const at = (e: PointerEvent): [number, number] => { const r = c.getBoundingClientRect(); return [((e.clientX - r.left) * VW) / r.width, ((e.clientY - r.top) * VW) / r.width]; };
        const hit = (pt: [number, number]) => { for (let i = buildings.length - 1; i >= 0; i--) { const h = buildings[i].hull; if (h && inside(pt, h)) return buildings[i]; } return null; };
        c.onpointermove = (e) => {
          const b = hit(at(e)), tip = tipRef.current;
          if (b !== hover) { hover = b; c.style.cursor = b ? 'pointer' : 'default'; wake(); }
          if (!tip) return;
          if (b) {
            const r = c.getBoundingClientRect();
            tip.textContent = `Párrafo ${b.p.index + 1} · IA ${Math.round(b.p.aiScore)} %`;
            tip.style.left = `${e.clientX - r.left}px`; tip.style.top = `${e.clientY - r.top}px`; tip.style.opacity = '1';
          } else tip.style.opacity = '0';
        };
        c.onpointerleave = () => { hover = null; if (tipRef.current) tipRef.current.style.opacity = '0'; wake(); };
        c.onclick = (e) => { const b = hit(at(e)); if (b) onSelect(b.p.index); };
      },
      frame: (s, t) => {
        const { ctx, canvas } = s;
        // La ola empieza cuando la ciudad ya se ve bien
        if (startAt === null && (s.reduced || canvas.getBoundingClientRect().top < window.innerHeight * 0.8)) startAt = t;
        let moving = startAt === null;
        for (const b of buildings) {
          const goal = startAt !== null && (s.reduced || t - startAt > b.delay) ? b.p.aiScore * HMUL : 0;
          if (s.reduced) { b.h = goal; b.v = 0; continue; }
          b.v += (goal - b.h) * 0.075 - b.v * 0.2;
          b.h += b.v;
          if (Math.abs(b.v) > 0.02 || Math.abs(goal - b.h) > 0.05 || (startAt !== null && t - startAt <= b.delay)) moving = true;
        }
        ctx.clearRect(0, 0, s.w, s.h);
        ctx.save();
        ctx.scale(scale, scale);
        const poly = (pts: [number, number][], fill: string) => { ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
        poly([P(0, 0, 0), P(N, 0, 0), P(N, R, 0), P(0, R, 0)], `rgba(${colors.low.join(',')},.1)`);
        const focus = hover || buildings.find((b) => b.p.index === selRef.current) || null;
        for (const b of buildings) {
          const c = tone(b), lift = focus === b ? 6 : 0, h = Math.max(1.5, b.h) + lift, k = hover && hover !== b ? 0.55 : 1;
          poly([P(b.x, b.y + D, 0), P(b.x + D, b.y + D, 0), P(b.x + D, b.y + D, h), P(b.x, b.y + D, h)], shade(c, 0.55 * k));
          poly([P(b.x + D, b.y, 0), P(b.x + D, b.y + D, 0), P(b.x + D, b.y + D, h), P(b.x + D, b.y, h)], shade(c, 0.8 * k));
          poly([P(b.x, b.y, h), P(b.x + D, b.y, h), P(b.x + D, b.y + D, h), P(b.x, b.y + D, h)], shade(c, 1.12 * k));
          b.hull = [P(b.x, b.y, h), P(b.x + D, b.y, h), P(b.x + D, b.y, 0), P(b.x + D, b.y + D, 0), P(b.x, b.y + D, 0), P(b.x, b.y + D, h)];
          // Número de párrafo sobre la azotea
          const [tx, ty] = P(b.x + D / 2, b.y + D / 2, h);
          ctx.fillStyle = `rgba(${colors.hi.join(',')},${focus === b ? 0.95 : 0.6 * k})`;
          ctx.font = `600 ${Math.round(Math.max(10, CELL * 0.22))}px Manrope, system-ui, sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(String(b.p.index + 1), tx, ty);
        }
        ctx.restore();
        return moving;
      },
    };
  }, [paragraphs, onSelect]);

  // El scroll inclina la cámara (Motion)
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return scroll((p: number) => { elev.current = 0.42 + p * 0.18; wakeRef.current(); }, { target: el, offset: ['start end', 'end start'] });
  }, [ref]);

  // Redibuja al cambiar la selección
  useEffect(() => { wakeRef.current(); }, [selected]);

  return (
    <div className="relative w-full" style={{ aspectRatio: `${VW} / ${VH}` }}>
      <canvas ref={ref} className="block w-full h-full touch-pan-y" role="img" aria-label={label} />
      <div ref={tipRef} aria-hidden="true" className="absolute pointer-events-none px-3 py-2 rounded-[10px] bg-surface border hair-2 shadow-panel text-[12.5px] text-hi whitespace-nowrap opacity-0 transition-opacity duration-150" style={{ transform: 'translate(-50%, calc(-100% - 14px))' }} />
    </div>
  );
};
