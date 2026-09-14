import React from 'react';
import { Bot, FileCheck, Info, AlertTriangle } from 'lucide-react';
import { getScoreMood } from '../../utils/scoreMood';

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
  const mood = getScoreMood(aiScore);
  const humanScore = Math.max(0, 100 - Math.round(aiScore));

  const getSimilarityColor = (score: number) => {
    if (score >= 40) {
      return {
        bar: 'bg-gradient-to-r from-indigo-500 to-purple-600',
        text: 'text-indigo-700 dark:text-indigo-300',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
        emoji: '⚠️',
        label: 'Coincidencia Significativa',
      };
    }
    if (score >= 20) {
      return {
        bar: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        text: 'text-blue-700 dark:text-blue-300',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
        emoji: '📑',
        label: 'Coincidencia Moderada',
      };
    }
    return {
      bar: 'bg-gradient-to-r from-teal-500 to-emerald-500',
      text: 'text-teal-700 dark:text-teal-300',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      emoji: '✨',
      label: 'Fuentes Legítimas / Original',
    };
  };

  const simStyle = getSimilarityColor(similarityScore);

  return (
    <div className="space-y-6">
      {/* Tarjetas Principales de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tarjeta IA con Emoji Reactivo */}
        <div className={`p-6 rounded-3xl border ${mood.bgClass} ${mood.borderClass} shadow-sm transition-all`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm text-base">
                {mood.aiEmoji}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Detección de IA Estimada
              </span>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border ${mood.badgeClass}`}>
              <span>{mood.aiEmoji}</span>
              <span>{mood.status}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl select-none" title={mood.shortStatus}>
                {mood.aiEmoji}
              </span>
              <div>
                <span className={`text-5xl font-extrabold tracking-tight ${mood.textClass}`}>
                  {aiScore}%
                </span>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  probabilidad calculada de IA
                </span>
              </div>
            </div>

            {/* Micro-Tarjeta de Autenticidad Humana */}
            <div className="text-right p-2.5 sm:p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Índice Humano
              </span>
              <div className="text-base sm:text-lg font-black flex items-center justify-end gap-1.5 text-slate-800 dark:text-slate-100">
                <span>{humanScore >= 70 ? '😊' : humanScore >= 40 ? '😐' : '🤖'}</span>
                <span>{humanScore}%</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso animada */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${mood.barGradient}`}
              style={{ width: `${aiScore}%` }}
            />
          </div>

          {/* Advertencia Legal */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-amber-500 text-sm shrink-0">⚠️</span>
            <span>
              <strong>Aviso de Probabilidad:</strong> Este resultado es una estimación estadística basada en métricas estilométricas y puede contener falsos positivos o falsos negativos.
            </span>
          </div>
        </div>

        {/* Tarjeta Similitud */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-sm text-base">
                📑
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Índice de Similitud
              </span>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${simStyle.badge}`}>
              <span>{simStyle.emoji}</span>
              <span>{simStyle.label}</span>
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl select-none">
                {simStyle.emoji}
              </span>
              <div>
                <span className={`text-5xl font-extrabold tracking-tight ${simStyle.text}`}>
                  {similarityScore}%
                </span>
                <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                  coincidencia con corpus público
                </span>
              </div>
            </div>

            {/* Micro-Tarjeta de Originalidad */}
            <div className="text-right p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Originalidad
              </span>
              <div className="text-base sm:text-lg font-black flex items-center justify-end gap-1 text-slate-800 dark:text-slate-100">
                <span>{similarityScore < 20 ? '🛡️' : '⚖️'}</span>
                <span>{Math.max(0, 100 - similarityScore)}%</span>
              </div>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${simStyle.bar}`}
              style={{ width: `${similarityScore}%` }}
            />
          </div>

          {/* Aclaración sobre Plagio */}
          <div className="mt-4 flex items-start gap-2 text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
            <span className="text-blue-500 text-sm shrink-0">ℹ️</span>
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
              <span>🏷️</span>
              <span>Indicadores Estilométricos Detectados</span>
            </h4>
            <span className="text-[11px] text-slate-400">🔍 Factores de influencia identificados</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {indicators.map((tag, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-1"
              >
                <span>🏷️</span>
                <span>[{tag}]</span>
              </span>
            ))}
          </div>

          {summaryExplanation && (
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pt-1 flex items-start gap-2">
              <span className="text-sm shrink-0">💡</span>
              <span>{summaryExplanation}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
