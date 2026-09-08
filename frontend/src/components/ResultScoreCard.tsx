import React from 'react';
import { Bot, FileCheck, Info, AlertTriangle } from 'lucide-react';

interface ResultScoreCardProps {
  aiScore: number;
  similarityScore: number;
  indicators?: string[];
  summaryExplanation?: string;
}

export const ResultScoreCard: React.FC<ResultScoreCardProps> = ({
  aiScore,
  similarityScore,
  indicators = [],
  summaryExplanation,
}) => {
  // Configuración dinámica de colores según probabilidad de IA
  const getAiColor = (score: number) => {
    if (score >= 70) {
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        border: 'border-rose-200 dark:border-rose-900',
        text: 'text-rose-700 dark:text-rose-300',
        bar: 'bg-gradient-to-r from-rose-500 to-red-600',
        badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
        status: 'Alta probabilidad de contenido generado por IA',
      };
    }
    if (score >= 40) {
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-900',
        text: 'text-amber-700 dark:text-amber-300',
        bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        status: 'Patrones mixtos (posible asistencia o edición por IA)',
      };
    }
    return {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-900',
      text: 'text-emerald-700 dark:text-emerald-300',
      bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
      status: 'Probabilidad predominantemente humana / orgánica',
    };
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 40) {
      return {
        bar: 'bg-gradient-to-r from-indigo-500 to-purple-600',
        text: 'text-indigo-700 dark:text-indigo-300',
      };
    }
    return {
      bar: 'bg-gradient-to-r from-blue-500 to-cyan-500',
      text: 'text-blue-700 dark:text-blue-300',
    };
  };

  const aiStyle = getAiColor(aiScore);
  const simStyle = getSimilarityColor(similarityScore);

  return (
    <div className="space-y-6">
      {/* Tarjetas Principales de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tarjeta IA */}
        <div className={`p-6 rounded-3xl border ${aiStyle.bg} ${aiStyle.border} shadow-sm transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detección de IA Estimada
              </span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${aiStyle.badge}`}>
              {aiStyle.status}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-5xl font-extrabold tracking-tight ${aiStyle.text}`}>
              {aiScore}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              probabilidad calculada
            </span>
          </div>

          {/* Barra de progreso animada */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${aiStyle.bar}`}
              style={{ width: `${aiScore}%` }}
            />
          </div>

          {/* Advertencia Legal Obligatoria */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Aviso de Probabilidad:</strong> Este resultado es una estimación estadística basada en métricas estilométricas y puede contener falsos positivos o falsos negativos.
            </span>
          </div>
        </div>

        {/* Tarjeta Similitud */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Índice de Similitud
              </span>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Fuentes Públicas
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-5xl font-extrabold tracking-tight ${simStyle.text}`}>
              {similarityScore}%
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              coincidencia con corpus
            </span>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${simStyle.bar}`}
              style={{ width: `${similarityScore}%` }}
            />
          </div>

          {/* Aclaración sobre Plagio */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <span>
              <strong>Diferenciación de Plagio:</strong> El índice mide solapamiento textual. Coincidencias con citas legítimas, nombres propios o terminología técnica no constituyen plagio.
            </span>
          </div>
        </div>
      </div>

      {/* Indicadores Detectados */}
      {indicators.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>Indicadores Estilométricos Detectados</span>
            </h4>
            <span className="text-[11px] text-slate-400">Factores de influencia identificados</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {indicators.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                [{tag}]
              </span>
            ))}
          </div>

          {summaryExplanation && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
              {summaryExplanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
