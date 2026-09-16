import { useLayoutEffect, useRef } from 'react';
import { gsap, ScrollTrigger, canChoreograph } from './gsap';

export interface ScrollGroupOptions {
  /** Fija el elemento `[data-pin]` (o el primer hijo) mientras dura la sección. */
  pin?: boolean;
  /** Suavizado del scrub en segundos (0 = seguimiento directo). */
  scrub?: number;
  start?: string;
  end?: string;
  /** Recibe el progreso 0–1 en cada actualización (para cifras y texto). */
  onProgress?: (p: number) => void;
  /** Se ejecuta al alternar la sección (para cambiar el capítulo de fondo). */
  onToggle?: (active: boolean) => void;
  /** Valor de `--p` cuando no hay coreografía (estrecho o movimiento reducido). Por defecto 1: estado final. */
  staticValue?: number;
}

/**
 * Capítulo coreografiado por scroll, al estilo del motor de Apple:
 * la sección escribe su progreso en la variable CSS `--p` (0–1) y el CSS
 * deriva de ahí transformaciones y opacidades con calc()/clamp(). El JS no
 * toca colores, así que el cambio de tema es completo e instantáneo.
 *
 * En pantallas estrechas o con movimiento reducido no hay pin: `--p` se fija
 * en 1 y el contenido se muestra en su estado final, apilado.
 *
 *   const ref = useScrollGroup<HTMLElement>({ pin: true, scrub: 0.6 });
 *   <section ref={ref} data-scroll-group style={{ height: '320vh' }}>
 *     <div data-pin className="h-screen">…</div>
 *   </section>
 */
export function useScrollGroup<T extends HTMLElement>(opts: ScrollGroupOptions = {}) {
  const ref = useRef<T>(null);
  const optsRef = useRef(opts);
  optsRef.current = opts;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const { pin = false, scrub = 0.6, start = 'top top', end = 'bottom bottom', staticValue = 1 } = optsRef.current;

    if (!canChoreograph()) {
      el.style.setProperty('--p', String(staticValue));
      el.dataset.static = '1';
      optsRef.current.onProgress?.(staticValue);
      return () => { el.style.removeProperty('--p'); delete el.dataset.static; };
    }

    const pinEl = pin ? (el.querySelector<HTMLElement>('[data-pin]') ?? (el.firstElementChild as HTMLElement | null)) : undefined;
    const proxy = { p: 0 };
    let last = -1;
    const write = () => {
      const v = Math.round(proxy.p * 1000) / 1000;
      if (v === last) return;
      last = v;
      el.style.setProperty('--p', String(v));
      optsRef.current.onProgress?.(v);
    };

    const ctx = gsap.context(() => {
      // Un tween sin easing sobre el proxy: el scrub le da la inercia.
      const tween = gsap.to(proxy, { p: 1, ease: 'none', onUpdate: write, paused: true });
      ScrollTrigger.create({
        trigger: el,
        start, end,
        pin: pinEl || false,
        pinSpacing: true,
        anticipatePin: pinEl ? 1 : 0,
        scrub,
        animation: tween,
        onToggle: (self) => optsRef.current.onToggle?.(self.isActive),
        invalidateOnRefresh: true,
      });
    }, el);
    write();

    return () => { ctx.revert(); el.style.removeProperty('--p'); };
  }, []);

  return ref;
}

/** Fuerza un recálculo de todos los disparadores (tras cargar fuentes o datos). */
export const refreshScroll = () => ScrollTrigger.refresh();
