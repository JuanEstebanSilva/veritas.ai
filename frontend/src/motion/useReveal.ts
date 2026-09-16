import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, prefersReducedMotion } from './gsap';

/**
 * Revela por lotes los descendientes marcados con `data-reveal` cuando entran
 * en pantalla. El estado base es visible: si el usuario pide menos movimiento
 * no se oculta nada.
 *
 *   const ref = useReveal<HTMLDivElement>();
 *   <section ref={ref}><h2 data-reveal>…</h2><p data-reveal>…</p></section>
 */
export function useReveal<T extends HTMLElement>(deps: ReadonlyArray<unknown> = []) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || prefersReducedMotion()) return;

    const items = root.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!items.length) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { opacity: 0, y: 28, filter: 'blur(8px)' });
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1, ease: EASE, stagger: 0.09, overwrite: true,
            clearProps: 'filter',
          }),
      });
    }, root);

    // Si el contenido cambia de altura tras montar (datos que llegan), recalcula.
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 250);
    return () => { window.clearTimeout(t); ctx.revert(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
