import React, { useEffect, useRef } from 'react';
import { createTimeline, splitText, stagger } from 'animejs';
import { prefersReducedMotion } from '../../motion';

/* ────────────────────────────────────────────────────────────────
   Palabra que rota, con la coreografía de animejs.com: las letras
   salen comprimiéndose hacia la izquierda, entra la palabra nueva
   letra a letra y el punto final se desliza detrás de ella.

   La palabra la escribe anime.js directamente en el DOM (React no la
   vuelve a renderizar). Un texto oculto para lectores de pantalla
   anuncia todas las palabras una sola vez, sin repetir cada cambio.
   ──────────────────────────────────────────────────────────────── */
interface RotatingWordProps {
  words: string[];
  /** Pausa con la palabra completa antes de cambiar (ms). */
  hold?: number;
  className?: string;
}

export const RotatingWord: React.FC<RotatingWordProps> = ({ words, hold = 1800, className = '' }) => {
  const wordRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const word = wordRef.current, dot = dotRef.current;
    if (!word || !dot || words.length < 2 || prefersReducedMotion()) return;

    let i = 0, alive = true, visible = true;
    let split: ReturnType<typeof splitText> | null = null;
    let tl: ReturnType<typeof createTimeline> | null = null;
    let timer = 0;
    const chars = (text?: string) => {
      split?.revert();
      if (text !== undefined) word.textContent = text;
      split = splitText(word, { words: { class: 'split-word' }, chars: { class: 'split-char' } });
      return split.chars;
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.1 });
    io.observe(word);

    const cycle = () => {
      if (!alive) return;
      if (!visible || document.hidden) { timer = window.setTimeout(cycle, 600); return; }
      const out = chars();
      tl = createTimeline({
        onComplete: () => {
          if (!alive) return;
          i = (i + 1) % words.length;
          const inn = chars(words[i]);
          tl = createTimeline({ onComplete: () => { split?.revert(); split = null; timer = window.setTimeout(cycle, hold); } })
            .add(inn, { opacity: [0, 1], scaleX: [0, 1], x: [10, 0], duration: 160, delay: stagger(26, { from: 'first', ease: 'in(3)', start: 90 }) }, 0)
            .add(dot, { x: [-word.offsetWidth, 0], scaleX: [8, 1], duration: inn.length * 26 + 90, ease: 'out(3)' }, 0);
        },
      })
        .add(out, { opacity: [1, 0], scaleX: [1, 0], x: [0, -8], duration: 140, delay: stagger(20, { from: 'last' }) }, 0)
        .add(dot, { x: [0, -word.offsetWidth], scaleX: [1, 8], duration: out.length * 20 + 100, ease: 'in(3)' }, 0);
    };
    timer = window.setTimeout(cycle, hold);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      tl?.pause();
      split?.revert();
      io.disconnect();
      word.textContent = words[0];
      dot.style.transform = '';
    };
  }, [words, hold]);

  return (
    <span className={`rot-wrap ${className}`}>
      <span className="sr-only">{words.join(', ')}.</span>
      <span ref={wordRef} className="rot-word" aria-hidden="true">{words[0]}</span>
      <span ref={dotRef} className="rot-dot" aria-hidden="true">.</span>
    </span>
  );
};
