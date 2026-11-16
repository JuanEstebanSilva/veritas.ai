import React, { useEffect, useRef } from 'react';
import { useCanvasScene, token, rgba, type Rgb } from '../../motion/canvas';

/* ────────────────────────────────────────────────────────────────
   Veredicto hecho de partículas. Cada partícula tiene su resorte
   (rigidez 0.05, amortiguación 0.84): forma el texto, se aparta del
   puntero y vuelve a su sitio. Al cambiar de veredicto, las mismas
   partículas viajan a las posiciones del texto nuevo.
   ──────────────────────────────────────────────────────────────── */
export interface Verdict { text: string; tone: 'human' | 'mixed' | 'ai' | 'azure'; }

interface Particle { x: number; y: number; vx: number; vy: number; tx: number; ty: number; on: boolean; a: number; }

const SPRING = 0.05, DAMP = 0.84, REPEL = 80;

interface ParticleVerdictProps {
  verdicts: Verdict[];
  /** Milisegundos entre veredictos (0 = no avanza solo). */
  interval?: number;
  className?: string;
  label: string;
}

export const ParticleVerdict: React.FC<ParticleVerdictProps> = ({ verdicts, interval = 3800, className = '', label }) => {
  const api = useRef<{ next: () => void; burst: () => void } | null>(null);

  const ref = useCanvasScene(({ wake }) => {
    let parts: Particle[] = [];
    let index = 0, colors: Record<string, Rgb> = {}, pointer = { x: -1e4, y: -1e4 };
    let W = 1, H = 1, dotSize = 2, settled = 0;

    // Muestrea el texto en un canvas auxiliar y devuelve puntos en la rejilla
    const sample = (text: string) => {
      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.round(W)); off.height = Math.max(1, Math.round(H));
      const o = off.getContext('2d')!;
      let size = H * 0.62;
      o.font = `600 ${size}px Manrope, system-ui, sans-serif`;
      while (o.measureText(text).width > W * 0.92 && size > 12) { size -= 2; o.font = `600 ${size}px Manrope, system-ui, sans-serif`; }
      o.textAlign = 'center'; o.textBaseline = 'middle'; o.fillStyle = '#000';
      o.fillText(text, W / 2, H / 2 + size * 0.04);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const step = Math.max(3, Math.round(size / 26));
      dotSize = Math.max(1.4, step * 0.42);
      const pts: [number, number][] = [];
      for (let y = 0; y < off.height; y += step) for (let x = 0; x < off.width; x += step) if (data[(y * off.width + x) * 4 + 3] > 128) pts.push([x, y]);
      return pts;
    };

    const assign = (reduced: boolean) => {
      const pts = sample(verdicts[index].text);
      // Reutiliza las partículas: sobran → se apagan; faltan → nacen en el centro
      while (parts.length < pts.length) parts.push({ x: W / 2 + (Math.random() - 0.5) * W, y: H / 2 + (Math.random() - 0.5) * H, vx: 0, vy: 0, tx: 0, ty: 0, on: true, a: 0 });
      const order = pts.map((p, i) => ({ p, k: (i * 7919) % pts.length })).sort((a, b) => a.k - b.k).map((o) => o.p);
      parts.forEach((pt, i) => {
        if (i < order.length) { pt.tx = order[i][0]; pt.ty = order[i][1]; pt.on = true; }
        else { pt.on = false; pt.tx = pt.x + (Math.random() - 0.5) * 60; pt.ty = pt.y + 30 + Math.random() * 40; }
        if (reduced) { pt.x = pt.tx; pt.y = pt.ty; pt.vx = pt.vy = 0; pt.a = pt.on ? 1 : 0; }
      });
      settled = 0;
    };

    const readColors = () => { colors = { human: token('human'), mixed: token('mixed'), ai: token('ai'), azure: token('azure'), low: token('low') }; };

    api.current = {
      next: () => { index = (index + 1) % verdicts.length; assign(false); wake(); },
      burst: () => { parts.forEach((p) => { const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 10; p.vx += Math.cos(a) * v; p.vy += Math.sin(a) * v; }); settled = 0; wake(); },
    };

    return {
      layout: (s) => {
        W = s.w; H = s.h; readColors();
        assign(s.reduced);
        const c = s.canvas;
        c.onpointermove = (e) => { const r = c.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; settled = 0; wake(); };
        c.onpointerleave = () => { pointer = { x: -1e4, y: -1e4 }; wake(); };
      },
      frame: (s) => {
        const { ctx } = s;
        ctx.clearRect(0, 0, W, H);
        const tone = colors[verdicts[index].tone] || colors.azure;
        let energy = 0;
        for (const p of parts) {
          if (!s.reduced) {
            const dx = p.x - pointer.x, dy = p.y - pointer.y, d2 = dx * dx + dy * dy;
            if (d2 < REPEL * REPEL) { const d = Math.sqrt(d2) || 1, f = (REPEL - d) / REPEL * 2.6; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
            p.vx = (p.vx + (p.tx - p.x) * SPRING) * DAMP;
            p.vy = (p.vy + (p.ty - p.y) * SPRING) * DAMP;
            p.x += p.vx; p.y += p.vy;
            energy += Math.abs(p.vx) + Math.abs(p.vy);
          }
          // Las que sobran se desvanecen; las que entran aparecen
          p.a += ((p.on ? 1 : 0) - p.a) * (s.reduced ? 1 : 0.08);
          if (p.a < 0.02) continue;
          ctx.fillStyle = rgba(tone, 0.92 * p.a);
          ctx.fillRect(p.x - dotSize / 2, p.y - dotSize / 2, dotSize, dotSize);
        }
        // Duerme cuando todo está quieto y el puntero no está encima
        if (s.reduced) return false;
        const fading = parts.some((p) => !p.on && p.a > 0.02);
        settled = energy < parts.length * 0.02 && !fading ? settled + 1 : 0;
        return settled < 30;
      },
    };
  }, [verdicts]);

  // Avance automático mientras se ve
  useEffect(() => {
    const el = ref.current;
    if (!el || !interval || verdicts.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 });
    io.observe(el);
    const t = window.setInterval(() => { if (visible && !document.hidden) api.current?.next(); }, interval);
    return () => { window.clearInterval(t); io.disconnect(); };
  }, [interval, verdicts.length, ref]);

  return <canvas ref={ref} className={`block w-full h-full touch-pan-y ${className}`} role="img" aria-label={label} />;
};
