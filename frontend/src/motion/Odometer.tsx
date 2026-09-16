import React, { useMemo } from 'react';

interface OdometerProps {
  /** Valor entero a mostrar. */
  value: number;
  /** Número mínimo de dígitos (relleno por la izquierda con espacio). */
  digits?: number;
  className?: string;
  /** Duración de cada rodillo. */
  duration?: number;
}

/**
 * Cifra de rodillo: cada dígito es una columna 0–9 que se desplaza con
 * `transform` (barato y con transición CSS, así es interrumpible). Con
 * movimiento reducido la transición se anula desde el CSS global.
 */
export const Odometer: React.FC<OdometerProps> = ({ value, digits = 2, className = '', duration = 0.42 }) => {
  const str = useMemo(() => String(Math.max(0, Math.round(value))).padStart(digits, ' '), [value, digits]);
  const cols = str.split('');
  return (
    <span className={`num inline-flex overflow-hidden align-baseline leading-none ${className}`} aria-label={String(Math.round(value))} role="img">
      {cols.map((c, i) => {
        if (c === ' ') return <span key={i} className="inline-block" style={{ width: '.32em' }} aria-hidden="true" />;
        const d = Number(c);
        return (
          <span key={i} className="relative inline-block h-[1em] overflow-hidden" style={{ width: '.62em' }} aria-hidden="true">
            <span className="absolute left-0 top-0 flex flex-col" style={{ transform: `translateY(${-d}em)`, transition: `transform ${duration}s cubic-bezier(0.16, 1, 0.3, 1)` }}>
              {Array.from({ length: 10 }, (_, k) => (<span key={k} className="block h-[1em] leading-none text-center">{k}</span>))}
            </span>
          </span>
        );
      })}
    </span>
  );
};
