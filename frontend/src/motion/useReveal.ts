import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from './gsap';

/**
 * Revela los descendientes marcados con `data-reveal` cuando entran en
 * pantalla, con IntersectionObserver y transiciones CSS (ver index.css).
 * El estado previo sólo se oculta cuando hay JS (`html.js`), así que sin
 * script todo es visible. Cada elemento se revela una sola vez.
 *
 * Escalonado: los elementos que comparten `data-reveal-group` reciben `--i`
 * en orden de aparición; los demás se escalonan según el orden de entrada
 * en el mismo fotograma.
 *
 *   const ref = useReveal<HTMLDivElement>();
 *   <section ref={ref}><h2 data-reveal>…</h2><p data-reveal>…</p></section>
 *
 * `data-reveal="words"` parte el texto en palabras (spans .w) para revelar
 * palabra a palabra; se usa en frases cortas.
 */
export function useReveal<T extends HTMLElement>(deps: ReadonlyArray<unknown> = []) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!items.length) return;

    // Palabra a palabra: envolver una sola vez.
    items.forEach((el) => {
      if (el.dataset.reveal !== 'words' || el.dataset.split === '1') return;
      const text = el.textContent || '';
      el.textContent = '';
      text.split(/(\s+)/).forEach((tok, i, arr) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { el.appendChild(document.createTextNode(' ')); return; }
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = tok;
        s.style.setProperty('--i', String(Math.floor(i / 2)));
        el.appendChild(s);
        if (i === arr.length - 1) el.dataset.split = '1';
      });
      el.dataset.split = '1';
    });

    // Índices de escalonado por grupo
    const groups = new Map<string, number>();
    items.forEach((el) => {
      const g = el.dataset.revealGroup;
      if (!g) return;
      const n = groups.get(g) ?? 0;
      el.style.setProperty('--i', String(n));
      groups.set(g, n + 1);
    });

    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      items.forEach((el) => el.classList.add('is-in'));
      return;
    }

    let pending: HTMLElement[] = [];
    let raf = 0;
    const flush = () => {
      raf = 0;
      // Los que entran en el mismo fotograma sin grupo se escalonan entre sí
      let k = 0;
      pending.forEach((el) => {
        if (!el.dataset.revealGroup) el.style.setProperty('--i', String(k++));
        el.classList.add('is-in');
      });
      pending = [];
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        pending.push(e.target as HTMLElement);
      });
      if (pending.length && !raf) raf = requestAnimationFrame(flush);
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });

    items.forEach((el) => io.observe(el));
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
