import React, { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { getScoreMood } from '../../utils/scoreMood';
import { hasFinePointer } from '../../motion';

/* ────────────────────────────────────────────────────────────────
   Mazo de informes recientes (Motion).

   La tarjeta de delante se arrastra. Si se suelta con fuerza o lejos,
   sale con la velocidad del gesto y entra por el fondo del mazo; si no,
   vuelve a su sitio con un resorte que hereda esa velocidad.
   Alternativas sin gesto: botones Anterior/Siguiente y flechas del
   teclado sobre la tarjeta. Con movimiento reducido no hay arrastre y
   los cambios son inmediatos.
   ──────────────────────────────────────────────────────────────── */
export interface DeckItem {
  id: string;
  title: string;
  type: 'TEXT' | 'DOCX' | string;
  aiScore: number;
  similarity: number;
  improvedAi: number | null;
  createdAt: string;
}

const SLOT = (pos: number) => ({ x: pos * 14, y: pos * -14, rotate: [-2.5, 2.5, 6][pos] ?? 6, scale: 1 - pos * 0.045 });
const SPRING = { type: 'spring', stiffness: 320, damping: 26 } as const;
const FLING_V = 650, FLING_X = 150;

type Values = { x: MotionValue<number>; y: MotionValue<number>; rotate: MotionValue<number>; scale: MotionValue<number> };

const Meter: React.FC<{ label: string; value: number; tone: string }> = ({ label, value, tone }) => (
  <div className="grid grid-cols-[76px_1fr_38px] items-center gap-3">
    <span className="text-[11.5px] text-low">{label}</span>
    <span className="h-[5px] rounded-full bg-hair overflow-hidden">
      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, value))}%`, background: `rgb(${tone})` }} />
    </span>
    <span className="num text-[12px] text-mid text-right">{Math.round(value)}%</span>
  </div>
);

interface CardProps {
  item: DeckItem;
  pos: number;
  /** Petición de salida (dirección) para la tarjeta de delante. */
  fling: number;
  reduced: boolean;
  onSentBack: () => void;
  onOpen: (id: string) => void;
  onStep: (dir: 1 | -1) => void;
}

const DeckCard: React.FC<CardProps> = ({ item, pos, fling, reduced, onSentBack, onOpen, onStep }) => {
  const s0 = SLOT(pos);
  const v: Values = { x: useMotionValue(s0.x), y: useMotionValue(s0.y), rotate: useMotionValue(s0.rotate), scale: useMotionValue(s0.scale) };
  const dragged = useRef(false);
  const front = pos === 0;
  const m = getScoreMood(item.aiScore);
  const date = new Date(item.createdAt);

  // Recolocación al cambiar de puesto
  useEffect(() => {
    const s = SLOT(pos);
    (Object.keys(s) as (keyof Values)[]).forEach((k) => { if (reduced) v[k].set(s[k]); else animate(v[k], s[k], SPRING); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos, reduced]);

  const sendBack = useCallback((dir: number, vx = 0) => {
    if (reduced) { onSentBack(); return; }
    animate(v.x, dir * 380, { type: 'spring', velocity: vx, stiffness: 120, damping: 20 });
    animate(v.rotate, dir * 22, { type: 'spring', velocity: vx * 0.05, stiffness: 120, damping: 20 });
    window.setTimeout(onSentBack, 240);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, onSentBack]);

  // Salida pedida desde los botones o el teclado
  useEffect(() => { if (front && fling) sendBack(fling); }, [fling, front, sendBack]);

  return (
    <motion.article
      drag={front && !reduced ? (hasFinePointer() ? true : 'x') : false}
      dragMomentum={false}
      style={{ ...v, zIndex: 10 - pos }}
      onPointerDown={() => { dragged.current = false; }}
      onDragStart={() => { dragged.current = true; animate(v.scale, 1.03, SPRING); }}
      onDrag={(_, info) => v.rotate.set(SLOT(0).rotate + info.offset.x * 0.06)}
      onDragEnd={(_, info) => {
        const vx = info.velocity.x, ox = info.offset.x;
        if (Math.abs(vx) > FLING_V || Math.abs(ox) > FLING_X) { sendBack(Math.sign(vx || ox) || 1, vx); return; }
        const s = SLOT(0);
        animate(v.x, s.x, { ...SPRING, velocity: vx });
        animate(v.y, s.y, { ...SPRING, velocity: info.velocity.y });
        animate(v.rotate, s.rotate, SPRING);
        animate(v.scale, 1, SPRING);
      }}
      onKeyDown={(e) => {
        if (!front) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); onStep(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); onStep(-1); }
      }}
      tabIndex={front ? 0 : -1}
      aria-hidden={!front}
      aria-roledescription="tarjeta"
      aria-label={front ? `${item.title}: ${item.aiScore}% de probabilidad de IA. Flechas para cambiar de informe.` : undefined}
      className={`absolute w-[min(320px,100%)] p-5 rounded-[20px] bg-surface border hair-2 shadow-panel flex flex-col gap-4 select-none outline-none focus-visible:ring-2 focus-visible:ring-azure/60 ${front && !reduced ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{item.type === 'DOCX' ? 'Documento .docx' : 'Texto'}</span>
        <time className="font-mono text-[11px] text-low" dateTime={item.createdAt}>{date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</time>
      </div>
      <div className="flex items-baseline gap-3">
        <span className={`num text-[44px] leading-[.9] ${m.textClass}`}>{item.aiScore}%</span>
        <span className="text-[12.5px] text-mid leading-tight">{m.shortStatus}</span>
      </div>
      <div className="flex flex-col gap-2">
        <Meter label="IA" value={item.aiScore} tone={m.cssVar} />
        <Meter label="Similitud" value={item.similarity} tone="var(--azure)" />
        {item.improvedAi !== null && <Meter label="Reescrito" value={item.improvedAi} tone={getScoreMood(item.improvedAi).cssVar} />}
      </div>
      <div className="flex items-end justify-between gap-3 pt-3 border-t hair">
        <span className="text-[13px] font-semibold text-hi line-clamp-2 min-w-0 [overflow-wrap:anywhere]">{item.title}</span>
        <button
          type="button"
          tabIndex={front ? 0 : -1}
          onClick={() => { if (!dragged.current) onOpen(item.id); }}
          className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] text-azure hover:text-hi transition-colors"
        >
          Abrir <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </motion.article>
  );
};

export const RecentDeck: React.FC<{ items: DeckItem[]; onOpen: (id: string) => void }> = ({ items, onOpen }) => {
  const reduced = !!useReducedMotion();
  const [order, setOrder] = useState(() => items.map((_, i) => i));
  const [fling, setFling] = useState(0);
  const busy = useRef(false);

  useEffect(() => { setOrder(items.map((_, i) => i)); }, [items]);

  const sentBack = useCallback(() => {
    setOrder((o) => [...o.slice(1), o[0]]);
    setFling(0);
    busy.current = false;
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    if (items.length < 2 || busy.current) return;
    if (dir === 1) { busy.current = true; setFling(-1); }
    else setOrder((o) => [o[o.length - 1], ...o.slice(0, -1)]);
  }, [items.length]);

  const current = items[order[0]];
  if (!current) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[310px] grid place-items-center" role="group" aria-roledescription="carrusel" aria-label="Informes recientes">
        {order.map((idx, pos) => (
          <DeckCard
            key={items[idx].id}
            item={items[idx]}
            pos={pos}
            fling={pos === 0 ? fling : 0}
            reduced={reduced}
            onSentBack={sentBack}
            onOpen={onOpen}
            onStep={step}
          />
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-low" aria-live="polite">
            {order[0] + 1} / {items.length}<span className="sr-only">: {current.title}</span>
          </span>
          <span className="text-[11.5px] text-low hidden sm:inline">{reduced ? 'Usa las flechas para cambiar.' : 'Arrastra y lanza la tarjeta.'}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => step(-1)} aria-label="Informe anterior" className="btn-icon h-9 w-9"><ChevronLeft className="w-4 h-4" strokeWidth={1.8} /></button>
            <button type="button" onClick={() => step(1)} aria-label="Informe siguiente" className="btn-icon h-9 w-9"><ChevronRight className="w-4 h-4" strokeWidth={1.8} /></button>
          </div>
        </div>
      )}
    </div>
  );
};
