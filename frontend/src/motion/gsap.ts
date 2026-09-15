import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Curva única del sistema: equivale a cubic-bezier(.16, 1, .3, 1). */
export const EASE = 'power4.out';

/** Cierto si el usuario ha pedido menos movimiento. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cierto por debajo del ancho en el que desactivamos pin y parallax. */
export const isNarrow = (): boolean => typeof window !== 'undefined' && window.innerWidth < 760;

export { gsap, ScrollTrigger };
