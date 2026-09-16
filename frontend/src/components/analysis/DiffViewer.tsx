import React, { useState } from 'react';
import { writingApi, analysisApi } from '../../services/api';
import { getScoreMood } from '../../utils/scoreMood';
import { Copy, Check, Download, FileText, RefreshCw, ArrowRight } from 'lucide-react';

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

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** Original frente a reescritura, con copia, descargas y reanálisis. */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalText, improvedText, summaryOfChanges = [], analysisId,
  originalAiScore, improvedAiScore, originalSimilarityScore, title,
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
    try { await writingApi.downloadDocx({ improvedText, title, analysisId }); } finally { setDownloadingDocx(false); }
  };
  const handleDownloadTxt = async () => {
    setDownloadingTxt(true);
    try { await writingApi.downloadTxt({ improvedText, title }); } finally { setDownloadingTxt(false); }
  };
  const handleReanalyze = async () => {
    if (!analysisId) return;
    setReanalyzing(true);
    try {
      const res = await analysisApi.reanalyzeImproved(analysisId);
      if (res.data?.comparison) setComparison(res.data.comparison);
    } finally { setReanalyzing(false); }
  };

  const aiBefore = comparison?.original.aiScore ?? originalAiScore;
  const aiAfter = comparison?.improved.aiScore ?? improvedAiScore;
  const reduction = aiBefore !== undefined && aiAfter !== undefined ? Math.max(0, aiBefore - aiAfter) : null;
  const moodBefore = aiBefore !== undefined ? getScoreMood(aiBefore) : null;
  const moodAfter = aiAfter !== undefined ? getScoreMood(aiAfter) : null;

  return (
    <div className="flex flex-col gap-5 animate-page-in">
      {/* Reescritura lista */}
      <div className="card p-7 flex flex-col gap-6 border-l-2 border-l-human">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex flex-col gap-1.5">
            <span className="eyebrow text-human">Reescritura lista</span>
            <h3 className="text-d-5 font-semibold">Texto optimizado para usar</h3>
            <p className="text-[13px] text-low">Léxico variado, cadencia natural y citas intactas.</p>
          </div>

          {reduction !== null && reduction > 0 && moodBefore && moodAfter && (
            <div className="flex items-center gap-4 py-2">
              <span className="flex flex-col items-end gap-0.5">
                <span className={`num text-[26px] leading-none line-through decoration-1 opacity-60 ${moodBefore.textClass}`}>{aiBefore}%</span>
                <span className="eyebrow">antes</span>
              </span>
              <ArrowRight className="w-4 h-4 text-low" strokeWidth={2} />
              <span className="flex flex-col items-end gap-0.5">
                <span className={`num text-[26px] leading-none ${moodAfter.textClass}`}>{aiAfter}%</span>
                <span className="eyebrow">ahora</span>
              </span>
              <span className="num text-[13px] font-medium text-human pl-3 border-l hair">−{reduction} pts</span>
            </div>
          )}
        </div>

        <div className="rounded-xl border hair bg-ground/60 overflow-hidden">
          <div className="flex items-center justify-between px-5 h-10 border-b hair">
            <span className="text-[12px] font-semibold text-mid">Contenido final</span>
            <span className="font-mono text-[11px] text-low">{words(improvedText)} palabras · {improvedText.length} caracteres</span>
          </div>
          <div className="p-5 max-h-[300px] overflow-y-auto text-[14.5px] leading-[1.75] text-hi whitespace-pre-wrap">{improvedText}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={handleCopy} className={`btn ${copied ? 'bg-human text-[rgb(var(--on-accent))]' : 'btn-primary'}`}>
            {copied ? (<><Check className="w-4 h-4" strokeWidth={2.5} /> Copiado</>) : (<><Copy className="w-4 h-4" strokeWidth={1.8} /> Copiar texto</>)}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" disabled={downloadingTxt} onClick={handleDownloadTxt} className="btn btn-ghost btn-sm">
              <FileText className="w-4 h-4" strokeWidth={1.7} /> .txt
            </button>
            <button type="button" disabled={downloadingDocx} onClick={handleDownloadDocx} className="btn btn-ghost btn-sm">
              <Download className="w-4 h-4" strokeWidth={1.7} /> {downloadingDocx ? 'Generando…' : 'Word (.docx)'}
            </button>
            {analysisId && (
              <button type="button" disabled={reanalyzing} onClick={handleReanalyze} className="btn btn-ghost btn-sm text-azure">
                <RefreshCw className={`w-4 h-4 ${reanalyzing ? 'animate-spin' : ''}`} strokeWidth={1.7} /> Re-analizar
              </button>
            )}
          </div>
        </div>
      </div>

      {summaryOfChanges.length > 0 && (
        <div className="card px-7 py-6 flex flex-col gap-4">
          <span className="eyebrow">Cambios aplicados</span>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5 text-[13px] leading-[1.6] text-mid">
            {summaryOfChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-3"><Check className="w-3.5 h-3.5 text-human shrink-0 mt-1" strokeWidth={2.4} /><span>{change}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 h-12 border-b hair">
            <span className="flex items-center gap-3 text-[12px] font-semibold text-mid">
              Texto original
              {aiBefore !== undefined && moodBefore && <span className={`num text-[12px] ${moodBefore.textClass}`}>IA {aiBefore}%</span>}
            </span>
            <span className="font-mono text-[11px] text-low">{words(originalText)} palabras</span>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto text-[14px] leading-[1.75] text-mid whitespace-pre-wrap">{originalText}</div>
        </div>
        <div className="card overflow-hidden flex flex-col border-l-2 border-l-human">
          <div className="flex items-center justify-between px-6 h-12 border-b hair">
            <span className="flex items-center gap-3 text-[12px] font-semibold text-human">
              Versión reescrita
              {aiAfter !== undefined && moodAfter && <span className={`num text-[12px] ${moodAfter.textClass}`}>IA {aiAfter}%</span>}
            </span>
            <span className="font-mono text-[11px] text-low">{words(improvedText)} palabras</span>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto text-[14px] leading-[1.75] text-hi whitespace-pre-wrap">{improvedText}</div>
        </div>
      </div>
    </div>
  );
};
