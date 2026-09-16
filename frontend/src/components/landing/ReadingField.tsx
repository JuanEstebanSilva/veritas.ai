import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../motion';

/* ────────────────────────────────────────────────────────────────
   Campo de lectura: una página en perspectiva cuyas líneas recorre un
   haz de luz. Al pasar, cada párrafo recibe el color de su veredicto.
   Canvas 2D: ~140 cuadriláteros por fotograma, sin filtros ni sombras.
   Se detiene fuera de pantalla, con la pestaña oculta y con movimiento
   reducido (entonces dibuja un solo fotograma). Los colores se leen de
   los tokens del tema, así que responde al cambio claro/oscuro.
   ──────────────────────────────────────────────────────────────── */

type Tone = 'human' | 'mixed' | 'ai';
interface Line { y: number; w: number; x0: number; tone: Tone; para: number; last: boolean; }

// Generador determinista para que la página sea siempre la misma
const rng = (seed: number) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

const buildPage = (): Line[] => {
  const r = rng(7);
  const tones: Tone[] = ['human', 'human', 'mixed', 'ai', 'ai', 'human', 'mixed', 'human', 'human', 'ai', 'human'];
  const lines: Line[] = [];
  let y = 0.06;
  tones.forEach((tone, p) => {
    const n = 3 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const w = last ? 0.35 + r() * 0.45 : 0.92 + r() * 0.08;
      lines.push({ y, w: w * 0.86, x0: 0.07, tone, para: p, last });
      y += 0.0215;
    }
    y += 0.02;
  });
  return lines;
};

const readVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace(/\s+/g, ',');

export const ReadingField: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const lines = buildPage();
    const pageH = lines[lines.length - 1].y + 0.06;
    const reduced = prefersReducedMotion();

    let colors = { hi: '244,245,248', human: '76,198,128', mixed: '219,158,22', ai: '251,130,122', azure: '64,190,253' };
    const readColors = () => { colors = { hi: readVar('--hi'), human: readVar('--human'), mixed: readVar('--mixed'), ai: readVar('--ai'), azure: readVar('--azure') }; };
    readColors();
    const mo = new MutationObserver(readColors);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(lastT);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Puntero: desplaza el punto de fuga (suavizado)
    let mx = 0, my = 0, tx = 0, ty = 0;
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => { tx = 0; ty = 0; };
    const parent = canvas.parentElement || canvas;
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
      parent.addEventListener('pointermove', onMove, { passive: true });
      parent.addEventListener('pointerleave', onLeave);
    }

    // Proyección: la página gira sobre X (se aleja hacia arriba) y un poco sobre Y con el puntero
    const project = (px: number, py: number, out: number[]) => {
      const ax = 0.98 + my * 0.05;            // inclinación
      const ay = mx * 0.16;                    // giro lateral
      const x = (px - 0.5) * 1.0;
      const y = (py - pageH * 0.5) * 1.0;
      // rotación X
      const y1 = y * Math.cos(ax), z1 = -y * Math.sin(ax);
      // rotación Y
      const x2 = x * Math.cos(ay) + z1 * Math.sin(ay), z2 = -x * Math.sin(ay) + z1 * Math.cos(ay);
      const f = 2.1;
      const s = f / (f - z2 * 0.9 + 1.15);
      out[0] = W * 0.5 + x2 * s * W * 1.34;
      out[1] = H * 0.55 + y1 * s * H * 1.02;
      return out;
    };
    const a: number[] = [0, 0], b: number[] = [0, 0], c: number[] = [0, 0], d: number[] = [0, 0];
    const quad = (x0: number, y0: number, x1: number, y1: number, fill: string) => {
      project(x0, y0, a); project(x1, y0, b); project(x1, y1, c); project(x0, y1, d);
      ctx.fillStyle = fill;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath(); ctx.fill();
    };

    const PERIOD = 11000; // ms por pasada del haz
    let lastT = 0;
    const draw = (t: number) => {
      lastT = t;
      mx += (tx - mx) * 0.06; my += (ty - my) * 0.06;
      ctx.clearRect(0, 0, W, H);
      const phase = reduced ? 0.42 : ((t % PERIOD) / PERIOD);
      const beamY = -0.08 + phase * (pageH + 0.16);
      const lh = 0.011;
      // Plano de la página, apenas insinuado
      quad(0.0, -0.02, 1.0, pageH + 0.02, `rgba(${colors.hi},0.022)`);
      for (const ln of lines) {
        const dy = beamY - ln.y;                     // >0: ya leída
        const toneRGB = colors[ln.tone];
        let base = 0.16;
        let tint = 0;
        if (dy > -0.06 && dy < 0.02) tint = 1 - Math.abs(dy + 0.02) / 0.06; // bajo el haz
        if (dy >= 0.02) tint = Math.max(0, 0.55 - dy * 0.9);                // se apaga despacio
        if (tint > 0.001) {
          quad(ln.x0, ln.y, ln.x0 + ln.w, ln.y + lh, `rgba(${toneRGB},${(0.12 + tint * 0.7).toFixed(3)})`);
        } else {
          quad(ln.x0, ln.y, ln.x0 + ln.w, ln.y + lh, `rgba(${colors.hi},${base.toFixed(3)})`);
        }
        if (ln.last && dy > 0.01) {
          const k = Math.min(1, dy * 30);
          quad(ln.x0 + ln.w + 0.03, ln.y + 0.001, ln.x0 + ln.w + 0.05, ln.y + lh - 0.001, `rgba(${toneRGB},${(0.85 * k).toFixed(3)})`);
        }
      }
      // El haz: bandas apiladas con alfa creciente hacia el borde de lectura
      if (!reduced || true) {
        for (let i = 0; i < 7; i++) {
          const y0 = beamY - 0.075 + i * 0.011;
          quad(0.02, y0, 0.98, y0 + 0.0115, `rgba(${colors.azure},${(0.012 + i * 0.016).toFixed(3)})`);
        }
        quad(0.02, beamY + 0.001, 0.98, beamY + 0.0035, `rgba(${colors.azure},0.55)`);
      }
    };

    let raf = 0, running = false, visible = true, hidden = document.hidden;
    const loop = (t: number) => { raf = 0; draw(t); if (running) raf = requestAnimationFrame(loop); };
    const update = () => {
      const should = visible && !hidden && !reduced;
      if (should && !running) { running = true; raf = requestAnimationFrame(loop); }
      if (!should && running) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; update(); }, { threshold: 0.02 });
    io.observe(canvas);
    const onVis = () => { hidden = document.hidden; update(); };
    document.addEventListener('visibilitychange', onVis);
    resize();
    update();

    return () => {
      running = false; if (raf) cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect(); mo.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      parent.removeEventListener('pointermove', onMove); parent.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
};
