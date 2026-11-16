import { useLayoutEffect, useRef } from 'react';
import { animate, splitText, stagger } from 'animejs';
import { prefersReducedMotion } from './gsap';

/**
 * Entrada letra a letra de un titular, como en animejs.com: cada letra
 * llega desde la derecha con un leve escalonado. Al terminar se deshace la
 * división, así el DOM vuelve a ser texto normal (lectores de pantalla,
 * selección y búsqueda). Con movimiento reducido no hace nada.
 */
export function useSplitEntrance<T extends HTMLElement>(delay = 60) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const split = splitText(el, { words: { class: 'split-word' }, chars: { class: 'split-char' } });
    const anim = animate(split.chars, {
      x: ['.35em', 0],
      opacity: [0, 1],
      duration: 1000,
      delay: stagger(22, { start: delay, ease: 'outIn(2)' }),
      ease: 'outQuint',
      onComplete: () => split.revert(),
    });
    return () => { anim.pause(); split.revert(); };
  }, [delay]);

  return ref;
}
