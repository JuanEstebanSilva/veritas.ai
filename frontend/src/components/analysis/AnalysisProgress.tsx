import React from 'react';
import { Check, Loader2 } from 'lucide-react';

interface AnalysisProgressProps {
  /** Frase de la etapa en curso (texto del sistema, ya redactado). */
  stage: string;
  /** 'analyze' recorre las tres lecturas; 'rewrite' sólo la reescritura. */
  mode: 'analyze' | 'rewrite';
}

const STEPS = {
  analyze: ['Leyendo el documento párrafo a párrafo', 'Midiendo perplejidad y cadencia', 'Cotejando similitud con fuentes abiertas'],
  rewrite: ['Leyendo el texto', 'Rompiendo la cadencia uniforme', 'Sustituyendo fórmulas de IA sin tocar citas'],
};

/**
 * Estado de proceso con la forma del producto: una hoja que un haz recorre
 * en bucle mientras el servidor trabaja. Sólo anima `transform`; se anula
 * con movimiento reducido y muestra las etapas como lista.
 */
export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ stage, mode }) => {
  const lines = [100, 94, 97, 62, 0, 98, 100, 71, 0, 100, 96, 99, 100, 58, 0, 100, 89, 100, 95, 41];
  const tone = mode === 'rewrite' ? 'human' : 'azure';
  return (
    <div className="card p-7 sm:p-9 flex flex-col sm:flex-row items-center gap-8 sm:gap-10 animate-fadeIn" role="status" aria-live="polite" aria-busy="true">
      <div className="sheet relative w-[176px] h-[224px] shrink-0 overflow-hidden px-5 pt-6" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[26%] animate-beam" style={{ animationDelay: '0s', animationDuration: '2.8s', background: `linear-gradient(180deg, rgb(var(--${tone}) / 0) 0%, rgb(var(--${tone}) / .12) 60%, rgb(var(--${tone}) / .5) 100%)` }} />
        <div className="h-[6px] w-[42%] rounded-sm mb-4" style={{ background: 'rgb(var(--ink) / .3)' }} />
        <div className="flex flex-col gap-[5px]">
          {lines.map((w, i) => (w === 0 ? <div key={i} className="h-[5px]" /> : <div key={i} className="h-[5px] rounded-sm sheet-line" style={{ width: `${w}%` }} />))}
        </div>
      </div>
      <div className="flex flex-col gap-5 min-w-0 flex-1">
        <div className="flex flex-col gap-2">
          <span className={`eyebrow text-${tone}`}>{mode === 'rewrite' ? 'Reescribiendo' : 'Analizando'}</span>
          <h3 className="text-d-5 font-semibold">{stage}</h3>
        </div>
        <ul className="flex flex-col">
          {STEPS[mode].map((s, i) => (
            <li key={s} className={`flex items-center gap-3.5 py-3 border-b hair text-[13.5px] ${i === 0 ? 'border-t' : ''} ${i === 0 ? 'text-hi' : 'text-mid'}`}>
              {i === 0 ? <Loader2 className={`w-4 h-4 animate-spin text-${tone}`} /> : <Check className="w-4 h-4 text-low" strokeWidth={2} />}
              <span>{s}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-low">Suele tardar entre uno y tres segundos. No cierres la pestaña.</p>
      </div>
    </div>
  );
};
