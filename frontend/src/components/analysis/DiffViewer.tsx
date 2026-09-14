import React, { useState } from 'react';
import { writingApi, analysisApi } from '../../services/api';
import { getScoreMood } from '../../utils/scoreMood';
import {
  Copy,
  Check,
  Download,
  FileText,
  FileDown,
  Sparkles,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DiffViewerProps {
  originalText: string;
  improvedText: string;
  summaryOfChanges?: string[];
  analysisId?: string;
  originalAiScore?: number;
  improvedAiScore?: number;
  originalSimilarityScore?: number;
  title?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText,
  improvedText,
  summaryOfChanges = [],
  analysisId,
  originalAiScore,
  improvedAiScore,
  originalSimilarityScore,
  title,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingTxt, setDownloadingTxt] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [comparison, setComparison] = useState<{
    original: { aiScore: number; similarityScore: number };
    improved: { aiScore: number; similarityScore: number };
    notice: string;
  } | null>(
    originalAiScore !== undefined && improvedAiScore !== undefined
      ? {
          original: { aiScore: originalAiScore, similarityScore: originalSimilarityScore || 0 },
          improved: { aiScore: improvedAiScore, similarityScore: originalSimilarityScore || 0 },
          notice: 'La probabilidad de IA ha sido reducida al menor nivel posible conservando el significado.',
        }
      : null
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(improvedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    try {
      await writingApi.downloadDocx({
        improvedText,
        title,
        analysisId,
      });
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadTxt = async () => {
    setDownloadingTxt(true);
    try {
      await writingApi.downloadTxt({
        improvedText,
        title,
      });
    } finally {
      setDownloadingTxt(false);
    }
  };

  const handleReanalyze = async () => {
    if (!analysisId) return;
    setReanalyzing(true);
    try {
      const res = await analysisApi.reanalyzeImproved(analysisId);
      if (res.data?.comparison) {
        setComparison(res.data.comparison);
      }
    } finally {
      setReanalyzing(false);
    }
  };

  const effectiveAiOriginal = comparison?.original.aiScore ?? originalAiScore;
  const effectiveAiImproved = comparison?.improved.aiScore ?? improvedAiScore;
  const reductionAmount =
    effectiveAiOriginal !== undefined && effectiveAiImproved !== undefined
      ? Math.max(0, effectiveAiOriginal - effectiveAiImproved)
      : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ============================================================ */}
      {/* RECUADRO DESTACADO: COPIAR DE UNA VEZ EL TEXTO LISTO         */}
      {/* ============================================================ */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-500/40 shadow-xl shadow-emerald-500/10 space-y-4">
        {/* Cabecera del Recuadro de Copiado Rápido */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Zap className="w-5 h-5 fill-emerald-500 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>🎉</span>
                  <span>Texto Humanizado Listo para Usar</span>
                  <span>✨</span>
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  🛡️ 100% Optimizado
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Léxico variado, cadencia natural humana y citas intactas
              </p>
            </div>
          </div>

          {/* Badge de Reducción Máxima del % de IA con Emojis Dinámicos */}
          {reductionAmount !== null && reductionAmount > 0 && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300/80 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 self-start sm:self-auto shadow-sm">
              <span className="text-slate-400 line-through flex items-center gap-1">
                <span>{effectiveAiOriginal !== undefined ? getScoreMood(effectiveAiOriginal).aiEmoji : '🤖'}</span>
                <span>IA: {effectiveAiOriginal}%</span>
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">➔</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                <span>{effectiveAiImproved !== undefined ? getScoreMood(effectiveAiImproved).aiEmoji : '😊'}</span>
                <span>IA: {effectiveAiImproved}%</span>
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black">
                ⚡ -{reductionAmount}%
              </span>
            </div>
          )}
        </div>

        {/* Caja de Texto Humanizado Listo */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <span>✨</span>
              <span>Contenido Humanizado Final</span>
            </span>
            <span>
              📊 {improvedText.split(/\s+/).filter(Boolean).length} palabras • {improvedText.length} caracteres
            </span>
          </div>

          <div className="p-4 sm:p-5 max-h-[300px] overflow-y-auto text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap selection:bg-emerald-200 dark:selection:bg-emerald-900">
            {improvedText}
          </div>
        </div>

        {/* Barra de Acciones con Botón Principal "Copiar de una vez" */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Botón Gigante de Copiar */}
          <button
            onClick={handleCopy}
            className={`px-6 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 shadow-lg ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-105'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>✅ ¡Texto Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>📋 Copiar Texto Listo (1 Clic)</span>
              </>
            )}
          </button>

          {/* Acciones Secundarias: Descargas y Reanálisis */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              disabled={downloadingTxt}
              onClick={handleDownloadTxt}
              className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>📄</span>
              <span>Descargar .TXT</span>
            </button>

            <button
              disabled={downloadingDocx}
              onClick={handleDownloadDocx}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingDocx ? '⏳ Generando...' : '💾 Descargar Word (.docx)'}</span>
            </button>

            {analysisId && (
              <button
                disabled={reanalyzing}
                onClick={handleReanalyze}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-900 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reanalyzing ? 'animate-spin' : ''}`} />
                <span>🔄 Re-analizar para verificar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resumen de Cambios Realizados */}
      {summaryOfChanges.length > 0 && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-2">
            <span>✨</span>
            <span>Optimizaciones y Mejoras Aplicadas</span>
          </h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
            {summaryOfChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Visor de Dos Columnas: Original vs Mejorado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Columna Izquierda: Original */}
        <div className="flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span>📄</span>
              <span>Texto Original</span>
              {effectiveAiOriginal !== undefined && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black flex items-center gap-1 border border-slate-200 dark:border-slate-700">
                  <span>{getScoreMood(effectiveAiOriginal).aiEmoji}</span>
                  <span>IA: {effectiveAiOriginal}%</span>
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400">
              📊 {originalText.split(/\s+/).filter(Boolean).length} palabras
            </span>
          </div>

          <div className="p-5 overflow-y-auto max-h-[500px] text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-sans whitespace-pre-wrap">
            {originalText}
          </div>
        </div>

        {/* Columna Derecha: Mejorada */}
        <div className="flex flex-col rounded-3xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/50 flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <span>✨</span>
              <span>Versión Humanizada</span>
              {effectiveAiImproved !== undefined && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                  <span>{getScoreMood(effectiveAiImproved).aiEmoji}</span>
                  <span>IA: {effectiveAiImproved}%</span>
                </span>
              )}
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              📊 {improvedText.split(/\s+/).filter(Boolean).length} palabras
            </span>
          </div>

          <div className="p-5 overflow-y-auto max-h-[500px] text-sm leading-relaxed text-slate-800 dark:text-slate-200 font-sans whitespace-pre-wrap selection:bg-emerald-200 dark:selection:bg-emerald-900">
            {improvedText}
          </div>
        </div>
      </div>
    </div>
  );
};
