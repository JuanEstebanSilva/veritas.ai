import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

/** Curva única de entrada del sistema: equivale a cubic-bezier(.16, 1, .3, 1). */
export const EASE = 'power4.out';

/** Curva de cambio en pantalla: equivale a cubic-bezier(.66, 0, .1, 1). */
export const EASE_IN_OUT = 'power3.inOut';

/** Cierto si el usuario ha pedido menos movimiento. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Cierto si hay puntero fino con hover real (ratón o trackpad). */
export const hasFinePointer = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Cierto por debajo del ancho en el que desactivamos pin y parallax. */
export const isNarrow = (): boolean => typeof window !== 'undefined' && window.innerWidth < 760;

/** Cierto si la página puede coreografiarse con el scroll (ni reducido ni estrecho). */
export const canChoreograph = (): boolean => !prefersReducedMotion() && !isNarrow();

/** Limita a [0, 1]. */
export const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Progreso local: 0 antes de `from`, 1 después de `to`, lineal entre ambos. */
export const span = (p: number, from: number, to: number): number => clamp01((p - from) / (to - from));

/** Salida suave para contadores. */
export const easeOut = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);

export { gsap, ScrollTrigger };
