import React from 'react';

/* ────────────────────────────────────────────────────────────────
   La hoja: un documento de papel dibujado con líneas. Cada párrafo lleva
   su veredicto y el umbral (--at) en el que el haz lo alcanza. Toda la
   coreografía es CSS derivada de --p (ver landing.css); aquí sólo hay
   estructura y datos.
   ──────────────────────────────────────────────────────────────── */
export type Tone = 'human' | 'mixed' | 'ai';
export interface Para { tone: Tone; score: number; lines: number[]; }

export const PARAS: Para[] = [
  { tone: 'human', score: 8,  lines: [100, 94, 97, 62] },
  { tone: 'human', score: 12, lines: [98, 100, 71] },
  { tone: 'mixed', score: 46, lines: [100, 96, 99, 100, 58] },
  { tone: 'ai',    score: 87, lines: [100, 100, 100, 100, 84] },
  { tone: 'ai',    score: 91, lines: [100, 99, 100, 76] },
  { tone: 'mixed', score: 52, lines: [97, 100, 66] },
  { tone: 'human', score: 9,  lines: [100, 89, 100, 95, 41] },
  { tone: 'human', score: 6,  lines: [96, 100, 73] },
  { tone: 'human', score: 11, lines: [100, 98, 100, 54] },
];

const totalLines = PARAS.reduce((n, p) => n + p.lines.length, 0);

export const Sheet: React.FC<{ showBeam?: boolean; className?: string }> = ({ showBeam = true, className = '' }) => {
  let cursor = 0;
  return (
    <div className={`sheet relative overflow-hidden ${className}`} aria-label="Documento de muestra con nueve párrafos y su veredicto" role="img">
      {showBeam && <div className="sheet-beam" aria-hidden="true" />}
      <div className="flex items-center justify-between mb-[7%] px-[9%] pt-[8%]">
        <div className="h-[8px] w-[44%] rounded-sm" style={{ background: 'rgb(var(--ink) / .32)' }} />
        <span className="font-mono text-[10px]" style={{ color: 'rgb(var(--ink) / .5)' }}>.docx</span>
      </div>
      <div className="flex flex-col gap-[3.6%] px-[9%] pb-[8%]">
        {PARAS.map((p, i) => {
          // Umbral del párrafo: posición del centro del párrafo en la hoja (0–1)
          const start = cursor; cursor += p.lines.length;
          const at = (start + p.lines.length / 2) / totalLines;
          return (
            <div key={i} className="sheet-para relative flex flex-col gap-[6px] pr-14" style={{ ['--tone' as string]: `var(--${p.tone})`, ['--at' as string]: at.toFixed(3) }}>
              {p.lines.map((w, j) => (
                <div key={j} className="relative h-[6px] rounded-sm sheet-line" style={{ width: `${w}%` }}>
                  <span className="sheet-lit absolute inset-0 rounded-sm" />
                </div>
              ))}
              <span className={`sheet-score absolute right-0 top-0 num text-[11px] font-medium`}>{p.score}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
