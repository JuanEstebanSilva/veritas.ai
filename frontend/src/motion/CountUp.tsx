import React, { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './gsap';

interface CountUpProps {
  value: number;
  decimals?: number;
  duration?: number;
  /** Sufijo pegado a la cifra, p. ej. "%" */
  suffix?: string;
  className?: string;
  /** Si es falso, muestra el valor final sin animar (útil hasta que haya datos). */
  animate?: boolean;
}

/**
 * Cifra que cuenta de 0 al valor cuando entra en pantalla. Escribe en el DOM
 * directamente para no re-renderizar el árbol en cada fotograma.
 */
export const CountUp: React.FC<CountUpProps> = ({
  value, decimals = 0, duration = 1.4, suffix = '', className = '', animate = true,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = (n: number) => n.toFixed(decimals) + suffix;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!animate || prefersReducedMotion()) { el.textContent = fmt(value); return; }

    const obj = { n: 0 };
    el.textContent = fmt(0);
    const tween = gsap.to(obj, {
      n: value, duration, ease: 'power3.out', paused: true,
      onUpdate: () => { el.textContent = fmt(obj.n); },
    });
    const st = ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => tween.play() });
    return () => { st.kill(); tween.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, duration, suffix, animate]);

  return <span ref={ref} className={`num ${className}`}>{fmt(animate ? 0 : value)}</span>;
};
