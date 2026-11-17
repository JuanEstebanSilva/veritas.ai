import { useEffect, useRef } from 'react';
import { hasFinePointer, prefersReducedMotion } from './gsap';

/**
 * Parallax de puntero: escribe `--mx` y `--my` (−1…1, suavizados) en el
 * contenedor. Los hijos se desplazan con
 * `transform: translate3d(calc(var(--mx) * 12px), calc(var(--my) * 8px), 0)`.
 * Sólo con puntero fino y sin movimiento reducido; se detiene fuera de vista.
 */
export function usePointerParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasFinePointer() || prefersReducedMotion()) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0, visible = true;
    const tick = () => {
      raf = 0;
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty('--mx', cx.toFixed(4));
      el.style.setProperty('--my', cy.toFixed(4));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => { tx = 0; ty = 0; if (!raf) raf = requestAnimationFrame(tick); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) onLeave(); });
    io.observe(el);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    return () => {
      io.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
      el.style.removeProperty('--mx'); el.style.removeProperty('--my');
    };
  }, []);

  return ref;
}
