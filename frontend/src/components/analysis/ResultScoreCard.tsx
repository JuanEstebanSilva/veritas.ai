import React from 'react';
import { Info } from 'lucide-react';
import { getScoreMood } from '../../utils/scoreMood';
import { CountUp } from '../../motion';
import { Gauge } from './Gauge';

interface ResultScoreCardProps {
  aiScore: number;
  similarityScore: number;
  indicators?: string[];
  summaryExplanation?: string;
}

const similarityLabel = (score: number) =>
  score >= 35 ? 'Similitud alta · Posible plagio' : score >= 18 ? 'Coincidencia moderada' : 'Fuentes legítimas / Citas';

/** Las dos cifras del informe: probabilidad de IA e índice de similitud, como arcos. */
export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  aiScore, similarityScore, indicators = [], summaryExplanation,
}) => {
  const mood = getScoreMood(aiScore);
  const humanScore = Math.max(0, 100 - Math.round(aiScore));
  const originality = Math.max(0, 100 - similarityScore);
  const isHighPlagiarism = similarityScore >= 35;
  const isModeratePlagiarism = similarityScore >= 18;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Probabilidad de IA */}
        <div className="card p-6 sm:p-7 flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="eyebrow">Probabilidad de IA</span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${mood.textClass}`}>
              <span className="status-dot" style={{ color: `rgb(${mood.cssVar} / .18)`, background: `rgb(${mood.cssVar})` }} />
              {mood.shortStatus}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Gauge value={Math.round(aiScore)} tone={mood.tone} label="Probabilidad de IA" />
            <div className="flex flex-col gap-4 min-w-0">
              <p className="text-[13px] leading-[1.55] text-mid">{mood.description}</p>
              <div className="flex flex-col gap-0.5">
                <span className="num text-[22px] leading-none text-hi"><CountUp value={humanScore} suffix="%" /></span>
                <span className="eyebrow">Índice humano</span>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2.5 pt-4 border-t hair text-[12px] leading-[1.6] text-low">
            <Info className="w-3.5 h-3.5 shrink-0 mt-[3px] text-gold" strokeWidth={1.8} />
            <span>Estimación estadística basada en métricas estilométricas. Puede contener falsos positivos o falsos negativos.</span>
          </p>
        </div>

        {/* Índice de similitud */}
        <div className={`card p-6 sm:p-7 flex flex-col gap-6 transition-all ${isHighPlagiarism ? 'ring-2 ring-red-500/40 dark:ring-red-500/30' : ''}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="eyebrow">Índice de similitud</span>
            <span className={`inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
              isHighPlagiarism ? 'text-red-500 dark:text-red-400' : isModeratePlagiarism ? 'text-amber-500 dark:text-amber-400' : 'text-azure'
            }`}>
              <span
                className="status-dot"
                style={{
                  color: isHighPlagiarism ? 'rgba(239, 68, 68, 0.2)' : isModeratePlagiarism ? 'rgba(245, 158, 11, 0.2)' : 'rgb(var(--azure) / .18)',
                  background: isHighPlagiarism ? '#ef4444' : isModeratePlagiarism ? '#f59e0b' : 'rgb(var(--azure))',
                }}
              />
              {similarityLabel(similarityScore)}
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Gauge value={Math.round(similarityScore)} tone={isHighPlagiarism ? 'ai' : 'azure'} label="Índice de similitud" />
            <div className="flex flex-col gap-4 min-w-0">
              <p className="text-[13px] leading-[1.55] text-mid">
                {isHighPlagiarism ? 'Atención: fragmentos con coincidencia directa detectada.' : 'Solapamiento con el corpus público cotejado.'}
              </p>
              <div className="flex flex-col gap-0.5">
                <span className="num text-[22px] leading-none text-hi"><CountUp value={originality} suffix="%" /></span>
                <span className="eyebrow">Originalidad</span>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-2.5 pt-4 border-t hair text-[12px] leading-[1.6] text-low">
            <Info className={`w-3.5 h-3.5 shrink-0 mt-[3px] ${isHighPlagiarism ? 'text-red-500' : 'text-azure'}`} strokeWidth={1.8} />
            <span>
              {isHighPlagiarism
                ? 'Se identificaron fragmentos con similitud significativa. Revisa las citas APA 7 generadas abajo para atribuir la autoría.'
                : 'Mide solapamiento textual. Las coincidencias con citas legítimas, nombres propios o terminología técnica no constituyen plagio.'}
            </span>
          </p>
        </div>
      </div>

      {indicators.length > 0 && (
        <div className="card px-6 sm:px-7 py-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="eyebrow">Indicadores estilométricos detectados</span>
            <span className="text-[11.5px] text-low">{indicators.length} factores</span>
          </div>
          <div className="flex items-baseline gap-3.5">
            <span className={`h-px w-[18px] shrink-0 relative -top-1 ${mood.barClass}`} />
            <span className={`text-[13px] font-semibold leading-[1.7] ${mood.textClass}`}>{indicators.join('  ·  ')}</span>
          </div>
          {summaryExplanation && <p className="text-[13px] leading-[1.7] text-mid pt-3 border-t hair">{summaryExplanation}</p>}
        </div>
      )}
    </div>
  );
};
