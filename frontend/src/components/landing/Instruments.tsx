import React from 'react';

/* ────────────────────────────────────────────────────────────────
   Tres instrumentos dibujados en SVG, uno por lectura. Cada uno se
   anima con la variable --k (0–1) que le llega del capítulo (CSS).
   ──────────────────────────────────────────────────────────────── */

/** Estilometría: cadencia de longitudes de oración. La humana es irregular. */
export const CadenceInstrument: React.FC = () => {
  const human = [42, 18, 61, 27, 74, 12, 55, 38, 66, 21, 49, 33, 70, 16, 58, 44];
  return (
    <svg viewBox="0 0 320 150" className="w-full h-auto" aria-hidden="true">
      <line x1="0" y1="118" x2="320" y2="118" stroke="rgb(var(--hair) / var(--hair-a2))" strokeWidth="1" />
      {human.map((h, i) => (
        <rect key={i} x={10 + i * 19} y={118 - h} width="11" height={h} rx="2" fill="rgb(var(--azure))"
          className="inst-bar" style={{ ['--i' as string]: i, transformOrigin: `${15 + i * 19}px 118px` }} />
      ))}
      <line x1="10" y1="76" x2="310" y2="76" stroke="rgb(var(--gold))" strokeWidth="1" strokeDasharray="3 4" className="inst-fade" />
      <text x="310" y="70" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--gold))" className="inst-fade">media 42</text>
      <text x="10" y="142" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--low))">longitud de oración · σ 7.9</text>
      <text x="310" y="142" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--human))" className="inst-fade">burstiness 0.78</text>
    </svg>
  );
};

/** Similitud: dos columnas cotejadas; dos fragmentos coinciden y se enlazan. */
export const SimilarityInstrument: React.FC = () => {
  const left = [88, 96, 70, 92, 84, 60, 94, 78];
  const right = [90, 74, 96, 66, 88, 92, 58, 80];
  return (
    <svg viewBox="0 0 320 150" className="w-full h-auto" aria-hidden="true">
      <text x="10" y="14" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--low))">documento</text>
      <text x="310" y="14" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--low))">fuente abierta</text>
      {left.map((w, i) => (
        <rect key={'l' + i} x="10" y={26 + i * 14} width={w * 1.2} height="6" rx="2" fill={i === 2 || i === 5 ? 'rgb(var(--gold))' : 'rgb(var(--hair) / var(--hair-a2))'}
          className={i === 2 || i === 5 ? 'inst-match' : ''} style={{ ['--i' as string]: i }} />
      ))}
      {right.map((w, i) => (
        <rect key={'r' + i} x={310 - w * 1.2} y={26 + i * 14} width={w * 1.2} height="6" rx="2" fill={i === 1 || i === 5 ? 'rgb(var(--gold))' : 'rgb(var(--hair) / var(--hair-a2))'}
          className={i === 1 || i === 5 ? 'inst-match' : ''} style={{ ['--i' as string]: i }} />
      ))}
      <path d="M 96 57 C 160 57, 160 43, 221 43" fill="none" stroke="rgb(var(--gold))" strokeWidth="1.2" className="inst-link" pathLength={1} />
      <path d="M 82 99 C 160 99, 160 99, 200 99" fill="none" stroke="rgb(var(--gold))" strokeWidth="1.2" className="inst-link" pathLength={1} style={{ ['--i' as string]: 1 }} />
      <text x="160" y="142" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--gold))" className="inst-fade">2 coincidencias · 1 cita atribuida · 11 %</text>
    </svg>
  );
};

/** Reescritura: líneas uniformes (IA) que se vuelven irregulares (humanas). */
export const RewriteInstrument: React.FC = () => {
  const before = [100, 100, 100, 100, 100, 62];
  const after = [96, 58, 100, 73, 88, 41];
  return (
    <svg viewBox="0 0 320 150" className="w-full h-auto" aria-hidden="true">
      <text x="10" y="14" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--low))">cadencia</text>
      <text x="310" y="14" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--ai))" className="inst-old">87 % IA</text>
      <text x="310" y="14" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--human))" className="inst-new">9 % IA</text>
      {before.map((w, i) => (
        <g key={i} style={{ ['--i' as string]: i, ['--w0' as string]: w / 100, ['--w1' as string]: after[i] / 100 }}>
          <rect x="10" y={30 + i * 17} width="300" height="7" rx="2" fill="rgb(var(--ai))" className="inst-line-old" style={{ transformOrigin: '10px 0' }} />
          <rect x="10" y={30 + i * 17} width="300" height="7" rx="2" fill="rgb(var(--human))" className="inst-line-new" style={{ transformOrigin: '10px 0' }} />
        </g>
      ))}
      <text x="10" y="142" fontFamily="JetBrains Mono, monospace" fontSize="9" fill="rgb(var(--low))">citas y cifras intactas</text>
    </svg>
  );
};
