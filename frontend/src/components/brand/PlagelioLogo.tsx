import React from 'react';

export interface PlagelioLogoProps {
  variant?: 'mark' | 'compact' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Color del escudo; por defecto el acento azure del tema. */
  tone?: 'azure' | 'muted';
}

/**
 * PlagelioLogo — escudo de trazo con plumilla y el logotipo PLAGELIO.
 * Diseñado para una perfecta legibilidad e integración con el sistema tipográfico.
 */
export const PlagelioLogo: React.FC<PlagelioLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  tone = 'azure',
}) => {
  const s = {
    sm: { icon: 22, word: 'text-[13px]', sub: 'text-[10px]' },
    md: { icon: 26, word: 'text-[15px]', sub: 'text-[10px]' },
    lg: { icon: 36, word: 'text-[19px]', sub: 'text-[11px]' },
    xl: { icon: 52, word: 'text-[26px]', sub: 'text-xs' },
  }[size];

  const stroke = tone === 'azure' ? 'rgb(var(--azure))' : 'rgb(var(--low))';
  const nib = tone === 'azure' ? 'rgb(var(--hi))' : 'rgb(var(--low))';
  const nibShade = tone === 'azure' ? 'rgb(var(--mid))' : 'rgb(var(--line))';

  const Mark = (
    <svg
      width={s.icon}
      height={Math.round((s.icon * 130) / 120)}
      viewBox="0 0 120 130"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M60 4 L108 22 L108 62 C108 88 86 108 60 126 C34 108 12 88 12 62 L12 22 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M60 86 L49 56 L54 45 L60 74 Z" fill={nib} />
      <path d="M60 86 L71 56 L66 45 L60 74 Z" fill={nibShade} />
      <path d="M54 45 C54 39, 66 39, 66 45 L60 54 Z" fill={nib} />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={`inline-flex items-center ${className}`}>{Mark}</span>;
  }

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {Mark}
      <span className="flex flex-col leading-none">
        <span className="flex items-baseline gap-[1px]">
          <span className={`font-extrabold tracking-[0.14em] text-hi ${s.word}`}>PLAGELIO</span>
        </span>
        {variant === 'full' && (
          <span className={`mt-1.5 eyebrow ${s.sub}`}>Integridad &amp; verificación</span>
        )}
      </span>
    </span>
  );
};
