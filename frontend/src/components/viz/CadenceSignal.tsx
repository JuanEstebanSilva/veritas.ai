import React from 'react';
import { useCanvasScene, token, rgba, seeded, type Rgb } from '../../motion/canvas';

/* ────────────────────────────────────────────────────────────────
   Cadencia: cada barra es una oración y su altura, el número de
   palabras. La escritura humana alterna frases largas y cortas; la
   generada mantiene un ritmo plano.

   - mode="live": dos carriles de ejemplo (humano y generado) que se
     desplazan solos; la σ se calcula con lo que está en pantalla.
   - mode="data": los carriles que se pasen (oraciones reales del
     documento), estáticos, con una entrada escalonada; σ y media reales.
   ──────────────────────────────────────────────────────────────── */
export interface CadenceLane { label: string; values: number[]; tone: 'human' | 'ai' | 'azure' | 'mixed'; }

const sd = (a: number[]) => {
  if (!a.length) return 0;
  const m = a.reduce((s, x) => s + x, 0) / a.length;
  return Math.sqrt(a.reduce((s, x) => s + (x - m) * (x - m), 0) / a.length);
};
const fmt = (v: number, d = 1) => v.toFixed(d).replace('.', ',');

interface CadenceSignalProps {
  mode: 'live' | 'data';
  lanes?: CadenceLane[];
  className?: string;
  label: string;
}

export const CadenceSignal: React.FC<CadenceSignalProps> = ({ mode, lanes = [], className = '', label }) => {
  const ref = useCanvasScene(() => {
    const rnd = seeded(11);
    let hv = 18;
    const genHuman = () => { hv += (rnd() - 0.5) * 16; if (rnd() < 0.16) hv = 4 + rnd() * 7; if (rnd() < 0.14) hv = 30 + rnd() * 12; hv = Math.max(4, Math.min(42, hv)); return hv; };
    const genAi = () => 20 + (rnd() - 0.5) * 4.5;
    const live: CadenceLane[] = [
      { label: 'Texto humano', values: [], tone: 'human' },
      { label: 'Texto generado', values: [], tone: 'ai' },
    ];
    const data = mode === 'data' ? lanes : live;
    const SLOT = mode === 'live' ? 14 : 0;
    let W = 1, H = 1, off = 0, colors: Record<string, Rgb> = {}, grow = mode === 'data' ? 0 : 1;

    const fill = () => {
      const need = Math.ceil(W / SLOT) + 3;
      while (live[0].values.length < need) { live[0].values.push(genHuman()); live[1].values.push(genAi()); }
    };

    const lane = (ctx: CanvasRenderingContext2D, ln: CadenceLane, y0: number, h: number, slotW: number, offset: number, maxV: number) => {
      const band = 26, bh0 = h - band, tone = colors[ln.tone];
      ctx.strokeStyle = rgba(colors.hair, 0.6); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, y0 + h + 0.5); ctx.lineTo(W, y0 + h + 0.5); ctx.stroke();
      const n = mode === 'live' ? ln.values.length : ln.values.length;
      const tops: [number, number][] = [];
      ctx.fillStyle = rgba(tone, 0.72);
      for (let i = 0; i < n; i++) {
        const k = mode === 'data' ? Math.max(0, Math.min(1, grow * 1.6 - (i / Math.max(1, n)) * 0.6)) : 1;
        const x = i * slotW - offset, bh = Math.max(1, (ln.values[i] / maxV) * bh0 * k);
        if (x > W || x + slotW < 0) continue;
        ctx.beginPath(); ctx.roundRect(x + slotW * 0.2, y0 + h - bh, Math.max(1.5, slotW * 0.6), bh, 2); ctx.fill();
        tops.push([x + slotW / 2, y0 + h - bh]);
      }
      ctx.strokeStyle = rgba(tone); ctx.lineWidth = 1.5; ctx.beginPath();
      tops.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke();
      const shown = mode === 'live' ? ln.values.slice(0, Math.ceil(W / slotW)) : ln.values;
      ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      ctx.fillStyle = rgba(colors.hi); ctx.font = '700 12.5px Manrope, system-ui, sans-serif';
      ctx.fillText(ln.label, 2, y0 + 2);
      const lx = 2 + ctx.measureText(ln.label).width + 12;
      ctx.fillStyle = rgba(tone); ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
      const mean = shown.reduce((s, x) => s + x, 0) / Math.max(1, shown.length);
      // En anchos estrechos se acorta la lectura en lugar de cortarla
      const room = W - lx - 4;
      const text = [`σ ${fmt(sd(shown))} · media ${fmt(mean)} palabras`, `σ ${fmt(sd(shown))} · media ${fmt(mean)}`, `σ ${fmt(sd(shown))}`]
        .find((t) => ctx.measureText(t).width <= room) ?? '';
      ctx.fillText(text, lx, y0 + 3);
    };

    return {
      layout: (s) => {
        W = s.w; H = s.h;
        colors = { human: token('human'), ai: token('ai'), azure: token('azure'), mixed: token('mixed'), hi: token('hi'), hair: token('low') };
        if (mode === 'live') fill();
        if (s.reduced) grow = 1;
      },
      frame: (s, _t, dt) => {
        const { ctx } = s;
        ctx.clearRect(0, 0, W, H);
        const gap = 14, laneH = (H - gap * (data.length - 1)) / Math.max(1, data.length);
        const maxV = mode === 'live' ? 44 : Math.max(10, ...data.flatMap((l) => l.values)) * 1.08;
        const longest = Math.max(1, ...data.map((l) => l.values.length));
        const slotW = mode === 'live' ? SLOT : Math.max(3, Math.min(28, W / longest));
        data.forEach((ln, i) => lane(ctx, ln, i * (laneH + gap), laneH, slotW, mode === 'live' ? off : 0, maxV));
        if (s.reduced) return false;
        if (mode === 'live') {
          off += dt * 0.045;
          while (off >= SLOT) { off -= SLOT; live.forEach((l) => l.values.shift()); fill(); }
          return true;
        }
        grow = Math.min(1, grow + dt / 1100);
        return grow < 1;
      },
    };
  }, [mode, lanes]);

  return <canvas ref={ref} className={`block w-full h-full ${className}`} role="img" aria-label={label} />;
};
