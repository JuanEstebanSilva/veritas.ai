import React, { useEffect, useState } from 'react';
import { CountUp } from '../../motion';

interface GaugeProps {
  /** 0–100 */
  value: number;
  /** Variable de color del sistema: 'human' | 'mixed' | 'ai' | 'azure' */
  tone: string;
  size?: number;
  suffix?: string;
  label?: string;
  className?: string;
}

/**
 * Arco de medida: el trazo crece hasta el valor con una transición CSS
 * (stroke-dashoffset). Los colores salen de los tokens, así que responde
 * al tema. Con movimiento reducido la transición global se anula.
 */
export const Gauge: React.FC<GaugeProps> = ({ value, tone, size = 132, suffix = '%', label, className = '' }) => {
  const r = 44, c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  const [armed, setArmed] = useState(false);
  useEffect(() => { const t = requestAnimationFrame(() => setArmed(true)); return () => cancelAnimationFrame(t); }, []);
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }} role="img" aria-label={`${label ? label + ': ' : ''}${Math.round(v)}${suffix}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgb(var(--hair) / var(--hair-a2))" strokeWidth="5" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={`rgb(var(--${tone}))`} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={armed ? c * (1 - v / 100) : c}
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1), stroke .45s' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`num leading-none text-[${size >= 120 ? 26 : 20}px] text-${tone}`} style={{ fontSize: size >= 120 ? 26 : 20 }}>
          <CountUp value={Math.round(v)} suffix={suffix} />
        </span>
      </div>
    </div>
  );
};
