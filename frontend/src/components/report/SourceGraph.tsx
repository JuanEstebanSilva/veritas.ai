import React from 'react';
import { useCanvasScene, token, rgba, type Rgb } from '../../motion/canvas';
import { simTone } from './reportData';

/* ────────────────────────────────────────────────────────────────
   Fuentes en órbita (canvas con física propia).

   El documento está al centro; cada fuente coincidente es un nodo unido
   por un resorte cuya longitud baja con la similitud: cuanto más se
   parece, más cerca orbita, más grande es y más pulsos envía. Los nodos
   se repelen entre sí. Se pueden arrastrar (la red se reequilibra) y
   pulsar para ir a la fuente en la lista.
   ──────────────────────────────────────────────────────────────── */
export interface GraphSource { label: string; pct: number; }

interface Node { label: string; pct: number; doc: boolean; i: number; x: number; y: number; vx: number; vy: number; }

interface SourceGraphProps {
  sources: GraphSource[];
  onSelect: (i: number) => void;
  label: string;
}

export const SourceGraph: React.FC<SourceGraphProps> = ({ sources, onSelect, label }) => {
  const ref = useCanvasScene(({ wake }) => {
    const maxS = Math.max(1, ...sources.map((s) => s.pct));
    const doc: Node = { label: 'Tu documento', pct: 0, doc: true, i: -1, x: 0, y: 0, vx: 0, vy: 0 };
    const nodes: Node[] = [doc, ...sources.map((s, i) => ({ label: s.label, pct: s.pct, doc: false, i, x: 0, y: 0, vx: 0, vy: 0 }))];
    const pulses: { n: Node; t: number }[] = [];
    let W = 1, H = 1, u = 1, colors: Record<string, Rgb> = {}, drag: Node | null = null, last: [number, number] = [0, 0], downAt: [number, number] | null = null, placed = false;

    const radius = (n: Node) => (n.doc ? 22 : 7 + (n.pct / maxS) * 12) * u;
    const toneOf = (n: Node) => (n.doc ? colors.azure : colors[simTone(n.pct)]);
    const place = () => nodes.forEach((n, k) => {
      if (n.doc) { n.x = W / 2; n.y = H / 2; return; }
      const a = (k / (nodes.length - 1)) * Math.PI * 2 - Math.PI / 2;
      n.x = W / 2 + Math.cos(a) * W * 0.4; n.y = H / 2 + Math.sin(a) * H * 0.4; n.vx = n.vy = 0;
    });
    const physics = () => {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n === drag) continue;
        let fx = 0, fy = 0;
        if (n.doc) { fx += (W / 2 - n.x) * 0.03; fy += (H / 2 - n.y) * 0.03; }
        else {
          const dx = doc.x - n.x, dy = doc.y - n.y, dist = Math.hypot(dx, dy) || 1;
          const L = (70 + (1 - n.pct / maxS) * 110) * u;
          const f = (dist - L) * 0.014; fx += (dx / dist) * f; fy += (dy / dist) * f;
        }
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const m = nodes[j], dx = n.x - m.x, dy = n.y - m.y, d2 = dx * dx + dy * dy + 1, dist = Math.sqrt(d2);
          const f = Math.min(6 * u, (2600 * u * u) / d2); fx += (dx / dist) * f; fy += (dy / dist) * f;
        }
        n.vx = (n.vx + fx) * 0.86; n.vy = (n.vy + fy) * 0.86; n.x += n.vx; n.y += n.vy;
        const r = radius(n) + 10 * u;
        n.x = Math.max(r, Math.min(W - r, n.x)); n.y = Math.max(r, Math.min(H - r - 22 * u, n.y));
      }
    };
    const near = (x: number, y: number) => nodes.find((n) => Math.hypot(n.x - x, n.y - y) < radius(n) + 12 * u) || null;

    return {
      layout: (s) => {
        W = s.w; H = s.h; u = Math.max(0.7, Math.min(1.15, Math.min(W, H) / 400));
        colors = { azure: token('azure'), ai: token('ai'), mixed: token('mixed'), low: token('low'), hi: token('hi'), mid: token('mid') };
        if (!placed || s.reduced) { place(); placed = true; if (s.reduced) for (let i = 0; i < 400; i++) physics(); }
        const c = s.canvas;
        const at = (e: PointerEvent): [number, number] => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
        c.onpointerdown = (e) => {
          const [x, y] = at(e); drag = near(x, y);
          if (drag) { c.setPointerCapture(e.pointerId); last = [x, y]; downAt = [x, y]; c.style.cursor = 'grabbing'; wake(); }
        };
        c.onpointermove = (e) => {
          const [x, y] = at(e);
          if (!drag) { c.style.cursor = near(x, y) ? 'grab' : 'default'; return; }
          drag.vx = x - last[0]; drag.vy = y - last[1]; drag.x = x; drag.y = y; last = [x, y]; wake();
        };
        const drop = (e: PointerEvent) => {
          if (!drag) return;
          const [x, y] = at(e);
          // Sin desplazamiento: es un clic, no un arrastre
          if (downAt && Math.hypot(x - downAt[0], y - downAt[1]) < 5 && !drag.doc) onSelect(drag.i);
          drag = null; downAt = null; c.style.cursor = 'default'; wake();
        };
        c.onpointerup = drop; c.onpointercancel = drop;
      },
      frame: (s) => {
        const { ctx } = s;
        if (!s.reduced || drag) physics();
        if (!s.reduced) {
          for (const n of nodes) if (!n.doc && Math.random() < (n.pct / maxS) * 0.018) pulses.push({ n, t: 0 });
          for (let i = pulses.length - 1; i >= 0; i--) { pulses[i].t += 0.014; if (pulses[i].t >= 1) pulses.splice(i, 1); }
        }
        ctx.clearRect(0, 0, W, H);
        for (const n of nodes) {
          if (n.doc) continue;
          ctx.strokeStyle = rgba(toneOf(n), 0.45); ctx.lineWidth = (0.8 + (n.pct / maxS) * 2.2) * u;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(doc.x, doc.y); ctx.stroke();
        }
        for (const p of pulses) {
          ctx.fillStyle = rgba(toneOf(p.n));
          ctx.beginPath(); ctx.arc(p.n.x + (doc.x - p.n.x) * p.t, p.n.y + (doc.y - p.n.y) * p.t, 2.6 * u, 0, Math.PI * 2); ctx.fill();
        }
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (const n of nodes) {
          const r = radius(n);
          ctx.fillStyle = rgba(toneOf(n));
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
          if (n.doc) { ctx.strokeStyle = rgba(colors.azure, 0.3); ctx.lineWidth = 6 * u; ctx.beginPath(); ctx.arc(n.x, n.y, r + 7 * u, 0, Math.PI * 2); ctx.stroke(); }
          ctx.fillStyle = rgba(colors.hi); ctx.font = `600 ${Math.round(12.5 * u)}px Manrope, system-ui, sans-serif`;
          ctx.fillText(n.label, n.x, n.y + r + 6 * u);
          if (!n.doc) { ctx.fillStyle = rgba(colors.mid); ctx.font = `500 ${Math.round(11.5 * u)}px "JetBrains Mono", ui-monospace, monospace`; ctx.fillText(`${n.pct} %`, n.x, n.y + r + 22 * u); }
        }
        if (s.reduced) return !!drag;
        return true;
      },
    };
  }, [sources, onSelect]);

  return <canvas ref={ref} className="block w-full h-full touch-pan-y [@media(pointer:fine)]:touch-none" role="img" aria-label={label} />;
};
