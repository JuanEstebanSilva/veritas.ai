import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../motion';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

/* ────────────────────────────────────────────────────────────────
   Huella dactilar hecha de líneas de texto. Al montarse se dibuja
   surco a surco (DrawSVG) y un haz la recorre: cada surco toma el
   color de su lectura (humano, mixto o IA). Cada texto deja una huella.
   ──────────────────────────────────────────────────────────────── */
type Tone = 'human' | 'mixed' | 'ai';
interface Ridge { d: string; tone: Tone; }

// Surcos deterministas: elipses concéntricas abiertas, con un núcleo en espiral
const buildRidges = (): Ridge[] => {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);
  const ridges: Ridge[] = [];
  const cx = 200, cy = 250;
  for (let i = 0; i < 17; i++) {
    const rx = 18 + i * 10.2, ry = 26 + i * 12.8;
    const gap = 0.35 + rnd() * 0.5;                         // apertura del surco (radianes)
    const start = -Math.PI / 2 + gap / 2 + (rnd() - 0.5) * 0.4;
    const end = start + Math.PI * 2 - gap;
    const pts: string[] = [];
    const steps = 46 + i * 3;
    for (let k = 0; k <= steps; k++) {
      const a = start + (end - start) * (k / steps);
      // ondulación leve: como una línea de texto, no un círculo perfecto
      const wob = Math.sin(a * 6 + i) * 1.6 + Math.sin(a * 13 + i * 2) * 0.8;
      const x = cx + Math.cos(a) * (rx + wob);
      const y = cy + Math.sin(a) * (ry + wob) * (a > 0 && a < Math.PI ? 1.06 : 0.98);
      pts.push(`${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    const r = rnd();
    const tone: Tone = i >= 6 && i <= 8 ? (r < 0.6 ? 'ai' : 'mixed') : i === 12 ? 'mixed' : 'human';
    ridges.push({ d: pts.join(' '), tone });
  }
  return ridges;
};

export const Fingerprint: React.FC<{ className?: string }> = ({ className = '' }) => {
  const ridges = useMemo(buildRidges, []);
  const root = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = root.current;
    if (!svg) return;
    const base = svg.querySelectorAll<SVGPathElement>('.fp-base');
    const read = svg.querySelectorAll<SVGPathElement>('.fp-read');
    const clip = svg.querySelector<SVGRectElement>('.fp-clip');
    const beam = svg.querySelector<SVGLineElement>('.fp-beam');
    if (prefersReducedMotion()) {
      gsap.set(clip, { attr: { height: 500 } });
      return;
    }
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.35 });
      tl.from(base, { drawSVG: '50% 50%', duration: 1.1, ease: 'power3.out', stagger: { each: 0.045, from: 'start' } })
        .set(read, { drawSVG: '0% 100%' })
        .fromTo(beam, { attr: { y1: 20, y2: 20 }, opacity: 0 }, { attr: { y1: 480, y2: 480 }, opacity: 1, duration: 2.1, ease: 'power1.inOut' }, '-=0.3')
        .fromTo(clip, { attr: { height: 0 } }, { attr: { height: 500 }, duration: 2.1, ease: 'power1.inOut' }, '<')
        .to(beam, { opacity: 0, duration: 0.35 });
    }, svg);
    return () => ctx.revert();
  }, []);

  return (
    <svg ref={root} viewBox="0 0 400 500" className={className} role="img" aria-label="Huella dactilar formada por líneas de texto que el escáner colorea según su lectura">
      <defs><clipPath id="fp-clip"><rect className="fp-clip" x="0" y="0" width="400" height="0" /></clipPath></defs>
      <g fill="none" strokeWidth="2.4" strokeLinecap="round">
        {ridges.map((r, i) => <path key={i} className="fp-base" d={r.d} stroke="rgb(var(--hair) / var(--hair-a2))" />)}
        <g clipPath="url(#fp-clip)">
          {ridges.map((r, i) => <path key={i} className="fp-read" d={r.d} stroke={`rgb(var(--${r.tone}))`} />)}
        </g>
      </g>
      <line className="fp-beam" x1="10" x2="390" y1="0" y2="0" stroke="rgb(var(--azure))" strokeWidth="1.5" opacity="0" />
    </svg>
  );
};
