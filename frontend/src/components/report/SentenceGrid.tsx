import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, morphTo, stagger } from 'animejs';
import { token, rgba } from '../../motion/canvas';
import { prefersReducedMotion } from '../../motion';
import { getScoreMood } from '../../utils/scoreMood';
import type { MatchedSource } from '../../types';
import { domainOf, type SentenceInfo } from './reportData';

/* ────────────────────────────────────────────────────────────────
   El documento, oración por oración (anime.js).

   Cada bloque es una oración. Tres lecturas sobre la misma cuadrícula:
   similitud, IA y (si existe) versión humanizada. Al cambiar de lectura
   la onda nace en la oración seleccionada (stagger en rejilla) y el
   sello cambia de forma (morphTo). Las flechas recorren la cuadrícula.
   ──────────────────────────────────────────────────────────────── */
type Reading = 'sim' | 'ia' | 'hum';
type AnimeParams = Parameters<typeof animate>[1];
const TEXT: Record<string, string> = { ai: 'text-ai', mixed: 'text-mixed', human: 'text-human', azure: 'text-azure' };

const SHAPES: Record<Reading, string> = {
  sim: 'M32 6 L54 15 L54 31 C54 45 44 54 32 58 C20 54 10 45 10 31 L10 15 Z',
  ia: 'M32 7 L58 53 L6 53 Z',
  hum: 'M32 6 C46 6 58 18 58 32 C58 46 46 58 32 58 C18 58 6 46 6 32 C6 18 18 6 32 6 Z',
};

interface SentenceGridProps {
  sentences: SentenceInfo[];
  sources: MatchedSource[];
  aiScore: number;
  similarityScore: number;
  improvedAiScore?: number | null;
}

export const SentenceGrid: React.FC<SentenceGridProps> = ({ sentences, sources, aiScore, similarityScore, improvedAiScore }) => {
  const hasHum = sentences.some((s) => s.rewritten !== null);
  const [reading, setReading] = useState<Reading>('ia');
  const [sel, setSel] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  const shapeRef = useRef<SVGPathElement>(null);
  const targets = useRef<Partial<Record<Reading, SVGPathElement | null>>>({});
  const first = useRef(true);

  const n = sentences.length;
  const cols = Math.max(8, Math.min(18, Math.ceil(Math.sqrt(n * 3))));
  const rows = Math.ceil(n / cols);
  const rewritten = sentences.filter((s) => s.rewritten).length;
  const matched = sentences.filter((s) => s.sim > 0).length;
  const heavy = sentences.filter((s) => s.ai >= 70).length;

  // Valor (0–1) y tono de cada oración según la lectura
  const valueOf = useCallback((s: SentenceInfo, r: Reading) =>
    r === 'ia' ? s.ai / 100 : r === 'sim' ? (s.sim ? 0.45 + s.sim / 100 : 0) : s.rewritten ? 1 : 0.15, []);
  const toneOf = useCallback((s: SentenceInfo, r: Reading) =>
    r === 'ia' ? getScoreMood(s.ai).tone : r === 'sim' ? (s.sim >= 35 ? 'ai' : s.sim >= 18 ? 'mixed' : s.sim > 0 ? 'azure' : '') : s.rewritten ? 'human' : '', []);

  const badge = useMemo(() => ({
    ia: { num: `${aiScore}%`, label: 'Probabilidad de IA', tone: getScoreMood(aiScore).tone as string,
      note: heavy ? `${heavy} de ${n} oraciones están en párrafos con un 70 % o más. Cada oración hereda la puntuación de su párrafo.` : 'Ningún párrafo supera el 70 %. Cada oración hereda la puntuación de su párrafo.' },
    sim: { num: `${similarityScore}%`, label: 'Similitud cotejada', tone: 'azure',
      note: matched ? `${matched} de ${n} oraciones contienen un fragmento que coincide con una fuente abierta. El color indica cuánto.` : 'Ninguna oración coincide con los fragmentos detectados en fuentes abiertas.' },
    hum: { num: improvedAiScore != null ? `${improvedAiScore}%` : '—', label: 'IA tras humanizar', tone: 'human',
      note: `${rewritten} de ${n} oraciones cambian en la versión humanizada; el resto, incluidas citas y cifras, se conserva tal cual.` },
  }), [aiScore, similarityScore, improvedAiScore, heavy, matched, rewritten, n]);

  const apply = useCallback((r: Reading, origin: number | 'center', instant: boolean) => {
    const grid = gridRef.current, shape = shapeRef.current;
    if (!grid || !shape) return;
    const blocks = Array.from(grid.children) as HTMLElement[];
    const neutral = rgba(token('low'), 0.28);
    const color = (i: number) => { const t = toneOf(sentences[i], r); return t ? rgba(token(t)) : neutral; };
    const size = (i: number) => 0.5 + valueOf(sentences[i], r) * 0.5;
    shape.style.fill = rgba(token(badge[r].tone));
    if (instant || prefersReducedMotion()) {
      blocks.forEach((b, i) => { b.style.backgroundColor = color(i); b.style.transform = `scale(${size(i)})`; b.style.borderRadius = '4px'; });
      shape.setAttribute('d', SHAPES[r]);
      return;
    }
    animate(blocks, {
      backgroundColor: (_: unknown, i: number) => color(i),
      scale: [
        { to: (_: unknown, i: number) => 0.22 + valueOf(sentences[i], r) * 0.2, duration: 220 },
        { to: (_: unknown, i: number) => size(i), duration: 650, ease: 'outElastic(1, .55)' },
      ],
      borderRadius: [{ to: '50%', duration: 220 }, { to: '4px', duration: 500 }],
      delay: stagger(24, { grid: [cols, rows], from: origin }),
    } as unknown as AnimeParams);
    const target = targets.current[r];
    if (target) animate(shape, { d: morphTo(target), duration: 700, ease: 'inOutQuart' } as unknown as AnimeParams);
  }, [sentences, cols, rows, badge, toneOf, valueOf]);

  // Estado inicial sin animar; primera onda al entrar en pantalla
  useEffect(() => {
    apply(reading, 'center', true);
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && first.current) { first.current = false; apply(reading, 'center', false); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(grid);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences]);

  const choose = (r: Reading) => { if (r === reading) return; setReading(r); apply(r, sel, false); };

  // Si desaparece la versión humanizada, vuelve a IA
  useEffect(() => { if (!hasHum && reading === 'hum') choose('ia'); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hasHum]);

  const focusBlock = (i: number) => {
    const b = gridRef.current?.children[i] as HTMLElement | undefined;
    b?.focus();
  };
  const pick = (i: number) => {
    setSel(i);
    const b = gridRef.current?.children[i] as HTMLElement | undefined;
    if (b && !prefersReducedMotion()) {
      // Pulso que se propaga desde la oración elegida
      const blocks = Array.from(gridRef.current!.children) as HTMLElement[];
      animate(blocks, {
        translateY: [{ to: -4, duration: 140 }, { to: 0, duration: 420, ease: 'outElastic(1, .6)' }],
        delay: stagger(18, { grid: [cols, rows], from: i }),
      } as unknown as AnimeParams);
    }
  };
  const onKey = (e: React.KeyboardEvent) => {
    const move: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols, Home: -n, End: n };
    if (!(e.key in move)) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(n - 1, sel + move[e.key]));
    setSel(next); focusBlock(next);
  };

  const s = sentences[sel];
  const readings: [Reading, string][] = [['ia', 'IA'], ['sim', 'Similitud'], ...(hasHum ? [['hum', 'Humanizado'] as [Reading, string]] : [])];
  const b = badge[reading];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <div
          ref={gridRef}
          role="grid"
          aria-label={`${n} oraciones del documento. Flechas para recorrerlas.`}
          onKeyDown={onKey}
          className="grid gap-[clamp(3px,.6vw,7px)] w-full"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 44 }}
        >
          {sentences.map((x, i) => (
            <button
              key={i}
              type="button"
              role="gridcell"
              tabIndex={i === sel ? 0 : -1}
              aria-selected={i === sel}
              aria-label={`Oración ${i + 1}, párrafo ${x.paragraph + 1}`}
              onClick={() => pick(i)}
              onFocus={() => setSel(i)}
              className={`aspect-square rounded-[4px] outline-none cursor-pointer will-change-transform ${i === sel ? 'ring-2 ring-hi/80 ring-offset-2 ring-offset-[rgb(var(--ground))]' : ''} focus-visible:ring-2 focus-visible:ring-azure`}
            />
          ))}
        </div>
        <p className="text-[12px] text-low">Cada bloque es una oración; su tamaño, cuánto pesa en la lectura elegida. Pulsa uno para ver su texto.</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="inline-flex self-start p-1 rounded-full border hair bg-hair/40" role="group" aria-label="Lectura de la cuadrícula">
          {readings.map(([r, label]) => (
            <button key={r} type="button" aria-pressed={reading === r} onClick={() => choose(r)}
              className={`h-9 px-4 rounded-full text-[13px] font-semibold transition-colors ${reading === r ? 'bg-surface text-hi shadow-xs' : 'text-mid hover:text-hi'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" aria-hidden="true">
            <path ref={shapeRef} d={SHAPES.ia} />
            {(Object.keys(SHAPES) as Reading[]).map((r) => <path key={r} ref={(el) => { targets.current[r] = el; }} d={SHAPES[r]} visibility="hidden" />)}
          </svg>
          <div className="flex flex-col gap-1.5">
            <span className={`num text-[34px] leading-none ${TEXT[b.tone]}`}>{b.num}</span>
            <span className="eyebrow">{b.label}</span>
          </div>
        </div>
        <p className="text-[13.5px] leading-[1.65] text-mid" aria-live="polite">{b.note}</p>

        {s && (
          <div className="flex flex-col gap-2 pt-5 border-t hair" aria-live="polite">
            <span className="font-mono text-[11px] text-low">Oración {sel + 1} · párrafo {s.paragraph + 1} · {s.words} palabras</span>
            <p className="serif text-[16px] leading-[1.55] text-hi line-clamp-4">«{s.text}»</p>
            <span className="text-[12.5px] text-mid">
              IA del párrafo <span className={`num ${getScoreMood(s.ai).textClass}`}>{s.ai}%</span>
              {s.source !== null && <> · coincide con <span className="text-hi">{domainOf(sources[s.source].url)}</span> (<span className="num">{s.sim}%</span>)</>}
              {s.rewritten !== null && <> · {s.rewritten ? <span className="text-human">reescrita</span> : 'se conserva'}</>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
