import React, { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from './gsap';

interface CountUpProps {
  value: number;
  decimals?: number;
  duration?: number;
  /** Sufijo pegado a la cifra, p. ej. "%" */
  suffix?: string;
  prefix?: string;
  className?: string;
  /** Si es falso, muestra el valor final sin animar (útil hasta que haya datos). */
  animate?: boolean;
  /** Si es cierto, espera a entrar en pantalla para contar. */
  inView?: boolean;
}

/**
 * Cifra que cuenta de 0 al valor en cuanto se monta (o cuando cambia el valor).
 * Escribe en el DOM directamente para no re-renderizar el árbol en cada fotograma.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value, decimals = 0, duration = 1.2, suffix = '', prefix = '', className = '', animate = true, inView = false,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => prefix + n.toFixed(decimals) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!animate || prefersReducedMotion()) { el.textContent = fmt(value); return; }
    const obj = { n: 0 };
    let tween: gsap.core.Tween | null = null;
    const run = () => { tween = gsap.to(obj, { n: value, duration, ease: 'power3.out', onUpdate: () => { el.textContent = fmt(obj.n); } }); };
    if (!inView || typeof IntersectionObserver === 'undefined') { run(); return () => { tween?.kill(); }; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run(); } }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); tween?.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, duration, suffix, prefix, animate, inView]);

  return <span ref={ref} className={`num ${className}`}>{fmt(animate ? 0 : value)}</span>;
};
