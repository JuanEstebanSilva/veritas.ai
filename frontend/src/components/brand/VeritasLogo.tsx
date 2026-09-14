import React from "react";

interface VeritasLogoProps {
  variant?: "mark" | "compact" | "full";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  animate?: boolean;
}

/**
 * VeritasLogo — Escudo cristalino facetado con plumilla de pluma integrada.
 * Gradiente iridiscente: cian a azul a violeta a magenta.
 * Sin fondo — completamente transparente. Funciona sobre cualquier superficie.
 */
export const VeritasLogo: React.FC<VeritasLogoProps> = ({
  variant = "compact",
  size = "md",
  className = "",
  animate = false,
}) => {
  const sizeMap = {
    sm: { iconSize: 28, text: "text-sm",   sub: "text-[8px]",  badge: "text-[9px] px-1 py-0.5" },
    md: { iconSize: 36, text: "text-base", sub: "text-[9px]",  badge: "text-[10px] px-1.5 py-0.5" },
    lg: { iconSize: 52, text: "text-xl",   sub: "text-[11px]", badge: "text-xs px-2 py-0.5" },
    xl: { iconSize: 72, text: "text-3xl",  sub: "text-xs",     badge: "text-sm px-2.5 py-1" },
  };

  const s = sizeMap[size] || sizeMap.md;
  const uid = `vl-${size}-${variant}`;

  const LogoMark = (
    <svg
      width={s.iconSize}
      height={s.iconSize}
      viewBox="0 0 120 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-md transition-transform ${animate ? "hover:scale-105 hover:rotate-1" : ""}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`${uid}-g1`} x1="15" y1="5" x2="105" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#22D3EE" />
          <stop offset="35%"  stopColor="#818CF8" />
          <stop offset="70%"  stopColor="#A855F7" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <linearGradient id={`${uid}-g2`} x1="10" y1="10" x2="55" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient id={`${uid}-g3`} x1="110" y1="10" x2="65" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#D946EF" />
        </linearGradient>

        <linearGradient id={`${uid}-g4`} x1="60" y1="30" x2="60" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#E0F2FE" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#C4B5FD" stopOpacity="0.6" />
        </linearGradient>

        <linearGradient id={`${uid}-g5`} x1="60" y1="38" x2="60" y2="88" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#E0E7FF" stopOpacity="0.7" />
        </linearGradient>

        <linearGradient id={`${uid}-gshine`} x1="20" y1="5" x2="100" y2="55" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>

        <filter id={`${uid}-shadow`} x="-8%" y="-5%" width="116%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#7C3AED" floodOpacity="0.28" />
        </filter>
      </defs>

      <g filter={`url(#${uid}-shadow)`}>
        <path d="M60 4 L108 22 L108 62 C108 88 86 108 60 126 C34 108 12 88 12 62 L12 22 Z"
          fill={`url(#${uid}-g1)`} opacity="0.92" />
        <path d="M60 4 L108 22 L84 22 L60 12 Z"
          fill={`url(#${uid}-g2)`} opacity="0.7" />
        <path d="M12 22 L60 12 L60 4 L12 22 Z"
          fill="#22D3EE" opacity="0.55" />
        <path d="M108 22 L60 12 L60 4 L108 22 Z"
          fill="#A855F7" opacity="0.5" />
        <path d="M12 22 L108 22 L92 40 L28 40 Z"
          fill="white" opacity="0.12" />
        <path d="M60 12 L80 40 L60 126 L40 40 Z"
          fill={`url(#${uid}-g4)`} opacity="0.45" />
        <path d="M28 40 L60 12 L40 40 L26 72 Z"
          fill={`url(#${uid}-g2)`} opacity="0.35" />
        <path d="M92 40 L60 12 L80 40 L94 72 Z"
          fill={`url(#${uid}-g3)`} opacity="0.35" />

        <line x1="60" y1="12" x2="60" y2="126" stroke="white" strokeWidth="0.8" opacity="0.4" />
        <line x1="28" y1="40" x2="92" y2="40"   stroke="white" strokeWidth="0.7" opacity="0.3" />
        <line x1="60" y1="12" x2="28" y2="40"   stroke="white" strokeWidth="0.6" opacity="0.35" />
        <line x1="60" y1="12" x2="92" y2="40"   stroke="white" strokeWidth="0.6" opacity="0.35" />
        <line x1="28" y1="40" x2="26" y2="72"   stroke="white" strokeWidth="0.5" opacity="0.25" />
        <line x1="92" y1="40" x2="94" y2="72"   stroke="white" strokeWidth="0.5" opacity="0.25" />

        <path d="M60 4 L12 22 L28 40 L60 28 Z"
          fill={`url(#${uid}-gshine)`} opacity="0.6" />
      </g>

      <g opacity="0.95">
        <path d="M60 88 L47 56 L52 44 L60 76 Z"  fill={`url(#${uid}-g5)`} opacity="0.9" />
        <path d="M60 88 L73 56 L68 44 L60 76 Z"  fill={`url(#${uid}-g5)`} opacity="0.75" />
        <line x1="60" y1="45" x2="60" y2="88" stroke="white" strokeWidth="1.2" opacity="0.6" />
        <path d="M52 44 C52 38, 68 38, 68 44 L60 54 Z" fill="white" opacity="0.85" />
        <ellipse cx="60" cy="52" rx="2.5" ry="3.5" fill="transparent" stroke="white" strokeWidth="1" opacity="0.7" />
        <circle cx="60" cy="88" r="2" fill="white" opacity="0.9" />
      </g>

      <path
        d="M60 4 L108 22 L108 62 C108 88 86 108 60 126 C34 108 12 88 12 62 L12 22 Z"
        fill="none" stroke="white" strokeWidth="1.5" opacity="0.35"
      />
    </svg>
  );

  if (variant === "mark") {
    return <div className={`inline-flex items-center ${className}`}>{LogoMark}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {LogoMark}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-[0.12em] text-slate-900 dark:text-white ${s.text} font-sans`}>
            VERITAS
          </span>
          <span className={`font-black uppercase tracking-wider rounded-md bg-gradient-to-r from-cyan-500 to-purple-600 text-white ${s.badge}`}>
            AI
          </span>
        </div>
        {variant === "full" && (
          <span className={`mt-0.5 font-semibold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500 ${s.sub}`}>
            Integridad &amp; Verificacion
          </span>
        )}
      </div>
    </div>
  );
};
