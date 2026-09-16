import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisApi, writingApi } from '../services/api';
import { Analysis } from '../types';
import { ResultScoreCard, DiffViewer, AnalysisProgress } from '../components/analysis';
import { useToast } from '../components/ui';
import { sound } from '../utils/soundEffects';
import { getScoreMood } from '../utils/scoreMood';
import { CountUp } from '../motion';
import { UploadCloud, FileText, ExternalLink, AlertCircle, Loader2, RefreshCw, Copy, Check, Download, ArrowRight, Sparkles, X } from 'lucide-react';

export const AnalyzerPage: React.FC = () => {
  const { isAuthenticated, openPremiumModal, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // Modo de operación: analizador completo vs reescritura directa
  const [mode, setMode] = useState<'analyzer' | 'humanizer'>('analyzer');

  // Estados de entrada
  const [activeTab, setActiveTab] = useState<'text' | 'docx'>('text');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // Procesamiento y resultado
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Reescritura
  const [improving, setImproving] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [improvedResult, setImprovedResult] = useState<{
    improvedText: string; summaryOfChanges: string[];
    originalAiScore?: number; improvedAiScore?: number; aiReduction?: number;
  } | null>(null);


  // Carga de un análisis existente por URL (?id=)
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('id');
    if (id) loadAnalysisById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const loadAnalysisById = async (id: string) => {
    setLoading(true);
    setLoadingStage('Recuperando el informe del historial…');
    setError(null);
    const res = await analysisApi.getById(id);
    setLoading(false);
    if (res.data?.success && res.data.analysis) {
      setAnalysis(res.data.analysis);
      if (res.data.analysis.improvedText) {
        setImprovedResult({
          improvedText: res.data.analysis.improvedText,
          summaryOfChanges: ['Optimización estructural recuperada del historial', 'Cadencia fluida y vocabulario equilibrado'],
          originalAiScore: res.data.analysis.aiScore,
          improvedAiScore: res.data.analysis.improvedAiScore || 8,
        });
      }
    } else {
      setError(res.error || 'No se pudo cargar el análisis.');
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.docx')) { sound.playError(); setError('Formato inválido. Solo se admiten documentos en formato .docx'); return; }
    if (file.size > 10 * 1024 * 1024) { sound.playError(); setError('El archivo excede el tamaño máximo permitido de 10 MB.'); return; }
    setSelectedFile(file);
    if (!titleInput) setTitleInput(file.name.replace(/\.[^/.]+$/, ''));
  };
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) validateAndSetFile(e.target.files[0]);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!isAuthenticated) { navigate('/login?notice=unauthenticated'); return; }
    setError(null);
    setImprovedResult(null);

    if (activeTab === 'text') {
      if (!textInput || textInput.trim().length < 15) { sound.playError(); setError('Por favor introduce un texto de al menos 15 caracteres.'); return; }
      setLoading(true);
      setLoadingStage('Midiendo perplejidad, burstiness y regularidad sintáctica');
      sound.playScan();
      const res = await analysisApi.analyzeText(textInput, titleInput);
      setLoading(false);
      if (res.isLimitReached) { sound.playError(); setError(res.error || 'Has alcanzado tus 5 análisis gratuitos de hoy.'); openPremiumModal(); return; }
      if (res.data?.success && res.data.analysis) { sound.playSuccess(); setAnalysis(res.data.analysis); await refreshProfile(); }
      else { sound.playError(); setError(res.error || 'Error al procesar el análisis de texto.'); }
    } else {
      if (!selectedFile) { sound.playError(); setError('Por favor selecciona un archivo .docx para analizar.'); return; }
      setLoading(true);
      setLoadingStage('Extrayendo párrafos y estructura del documento .docx');
      sound.playScan();
      const res = await analysisApi.analyzeDocx(selectedFile);
      setLoading(false);
      if (res.isLimitReached) { sound.playError(); setError(res.error || 'Has alcanzado tus 5 análisis gratuitos de hoy.'); openPremiumModal(); return; }
      if (res.data?.success && res.data.analysis) { sound.playSuccess(); setAnalysis(res.data.analysis); await refreshProfile(); }
      else { sound.playError(); setError(res.error || 'Error al procesar el archivo DOCX.'); }
    }
  };

  // Reescritura directa sin análisis previo
  const handleDirectHumanize = async () => {
    if (!isAuthenticated) { navigate('/login?notice=unauthenticated'); return; }
    if (!textInput || textInput.trim().length < 15) { sound.playError(); setError('Por favor introduce un texto de al menos 15 caracteres para reescribir.'); return; }
    setError(null);
    setImproving(true);
    sound.playScan();
    const res = await writingApi.improveText({ text: textInput.trim() });
    setImproving(false);
    if (res.data?.success) {
      sound.playSuccess();
      setImprovedResult({
        improvedText: res.data.improvedText, summaryOfChanges: res.data.summaryOfChanges,
        originalAiScore: res.data.originalAiScore, improvedAiScore: res.data.improvedAiScore, aiReduction: res.data.aiReduction,
      });
    } else { sound.playError(); setError(res.error || 'No se pudo procesar la reescritura del texto.'); }
  };

  const handleImproveWriting = async () => {
    if (!analysis) return;
    setImproving(true);
    setError(null);
    sound.playScan();
    const res = await writingApi.improveText({ analysisId: analysis.id, text: analysis.originalText });
    setImproving(false);
    if (res.data?.success) {
      sound.playSuccess();
      setImprovedResult({
        improvedText: res.data.improvedText, summaryOfChanges: res.data.summaryOfChanges,
        originalAiScore: res.data.originalAiScore ?? analysis.aiScore, improvedAiScore: res.data.improvedAiScore, aiReduction: res.data.aiReduction,
      });
    } else { sound.playError(); setError(res.error || 'No se pudo generar la mejora de redacción.'); toast.show({ title: 'No se pudo reescribir', description: res.error, tone: 'ai' }); }
  };

  const handleCopyDirectText = async () => {
    if (!improvedResult?.improvedText) return;
    try {
      await navigator.clipboard.writeText(improvedResult.improvedText);
      setCopiedDirect(true);
      toast.show({ title: 'Texto copiado al portapapeles', tone: 'human', duration: 2200 });
      setTimeout(() => setCopiedDirect(false), 2500);
    } catch { toast.show({ title: 'No se pudo copiar', description: 'Selecciona el texto y cópialo manualmente.', tone: 'ai' }); }
  };
  const handleDownloadDirectDocx = async () => {
    if (!improvedResult?.improvedText) return;
    const res = await writingApi.downloadDocx({ improvedText: improvedResult.improvedText, title: titleInput || 'documento_humanizado' });
    if (res.error) toast.show({ title: 'No se pudo descargar el documento', description: res.error, tone: 'ai' });
  };
  const resetForm = () => {
    setAnalysis(null); setImprovedResult(null); setTextInput(''); setSelectedFile(null); setTitleInput(''); setError(null);
    if (location.search) navigate('/analyzer', { replace: true });
  };

  const wordCount = textInput.split(/\s+/).filter(Boolean).length;
  const showForm = !analysis && !improvedResult;
  const busy = loading || improving;

  const ModeTab: React.FC<{
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    accentTone: 'azure' | 'human';
  }> = ({ active, onClick, icon, title, accentTone }) => (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`group relative flex items-center gap-2.5 h-11 px-5 rounded-full text-[13.5px] font-semibold transition-all duration-200 ease-out select-none ${
        active
          ? 'bg-white dark:bg-surface-2 text-hi shadow-[0_2px_12px_-2px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
          : 'text-mid hover:text-hi hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
      } active:scale-[0.98]`}
    >
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors duration-200 ${
          active
            ? accentTone === 'azure'
              ? 'bg-azure/10 text-azure'
              : 'bg-human/10 text-human'
            : 'text-low group-hover:text-mid'
        }`}
      >
        {icon}
      </span>
      <span>{title}</span>
      {active && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            accentTone === 'azure'
              ? 'bg-azure shadow-[0_0_6px_rgba(var(--azure),0.8)]'
              : 'bg-human shadow-[0_0_6px_rgba(var(--human),0.8)]'
          }`}
        />
      )}
    </button>
  );

  return (
    <div className="max-w-[1040px] flex flex-col gap-8 pb-16">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-d-4 font-light">
            {mode === 'humanizer' && showForm ? (
              <>Humaniza <span className="serif text-human">tu texto.</span></>
            ) : (
              <>Verifica plagio <span className="serif text-azure">y originalidad.</span></>
            )}
          </h1>
          <p className="text-[14px] text-low max-w-[560px]">
            {mode === 'humanizer' && showForm
              ? 'Elimina la huella de IA, transforma la cadencia y obtén una redacción 100% orgánica y humana.'
              : 'Cotejo contra fuentes académicas para certificar que no haya plagio, junto a métricas estilométricas de IA.'}
          </p>
        </div>
        {(analysis || improvedResult) && (
          <button type="button" onClick={() => { sound.playClick(); resetForm(); }} className="btn btn-ghost btn-sm">
            <RefreshCw className="w-4 h-4" strokeWidth={1.7} /> Nuevo análisis
          </button>
        )}
      </div>

      {/* Selector de modo */}
      {showForm && !busy && (
        <div
          className="inline-flex items-center self-start p-1.5 rounded-full border border-line/80 dark:border-white/10 bg-surface/90 dark:bg-surface/50 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] gap-1"
          role="tablist"
          aria-label="Modo de operación"
        >
          <ModeTab
            active={mode === 'analyzer'}
            onClick={() => {
              sound.playToggle();
              setMode('analyzer');
              setError(null);
            }}
            icon={<ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.2} />}
            title="Detector de Plagio & IA"
            accentTone="azure"
          />
          <ModeTab
            active={mode === 'humanizer'}
            onClick={() => {
              sound.playToggle();
              setMode('humanizer');
              setActiveTab('text');
              setError(null);
            }}
            icon={<Sparkles className="w-3.5 h-3.5" strokeWidth={2.2} />}
            title="Humanizador de Texto"
            accentTone="human"
          />
        </div>
      )}

      {/* Proceso en curso */}
      {busy && showForm && (
        <AnalysisProgress
          stage={loading ? (loadingStage || 'Verificando plagio y métricas de IA') : 'Humanizando texto y erradicando huella de IA'}
          mode={loading ? 'analyze' : 'rewrite'}
        />
      )}

      {/* Resultado directo de humanización */}
      {improvedResult && !analysis && (
        <div className="card p-7 sm:p-9 flex flex-col gap-7 page-in">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex flex-col gap-2">
              <span className="eyebrow text-human">Texto Humanizado</span>
              <h3 className="text-d-5 font-semibold">Texto humanizado listo para usar</h3>
              <p className="text-[13px] text-low">Cadencia orgánica, eliminación de clichés de IA y tus ideas intactas.</p>
            </div>
            {improvedResult.originalAiScore !== undefined && improvedResult.improvedAiScore !== undefined && (
              <div className="flex items-center gap-4">
                <span className="flex flex-col items-end gap-0.5">
                  <span className={`num text-[30px] leading-none opacity-60 line-through decoration-1 ${getScoreMood(improvedResult.originalAiScore).textClass}`}>{improvedResult.originalAiScore}%</span>
                  <span className="eyebrow">antes</span>
                </span>
                <ArrowRight className="w-4 h-4 text-low" strokeWidth={2} />
                <span className="flex flex-col items-end gap-0.5">
                  <span className={`text-[30px] leading-none ${getScoreMood(improvedResult.improvedAiScore).textClass}`}><CountUp value={improvedResult.improvedAiScore} suffix="%" /></span>
                  <span className="eyebrow">ahora</span>
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border hair bg-ground/60 overflow-hidden">
            <div className="flex items-center justify-between px-5 h-10 border-b hair">
              <label htmlFor="improved-direct" className="text-[12px] font-semibold text-mid">Texto final humanizado</label>
              <span className="font-mono text-[11px] text-low">{improvedResult.improvedText.split(/\s+/).filter(Boolean).length} palabras · {improvedResult.improvedText.length} caracteres</span>
            </div>
            <textarea id="improved-direct" readOnly rows={11} value={improvedResult.improvedText}
              className="w-full p-5 bg-transparent text-hi text-[14.5px] leading-[1.75] outline-none resize-y" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={handleCopyDirectText} className={`btn ${copiedDirect ? 'bg-human text-[rgb(var(--on-accent))]' : 'btn-primary'}`}>
              {copiedDirect ? (<><Check className="w-4 h-4" strokeWidth={2.5} /> Copiado</>) : (<><Copy className="w-4 h-4" strokeWidth={1.8} /> Copiar texto humanizado</>)}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={handleDownloadDirectDocx} className="btn btn-ghost btn-sm"><Download className="w-4 h-4" strokeWidth={1.7} /> Word (.docx) humanizado</button>
              <button type="button" onClick={resetForm} className="btn btn-quiet btn-sm">Humanizar otro texto</button>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && !busy && (
        <div className="card p-7 sm:p-9 flex flex-col gap-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div
              className="inline-flex items-center p-1 rounded-full border border-line/70 dark:border-white/10 bg-surface-2/70 dark:bg-surface/60 backdrop-blur-sm gap-1"
              role="tablist"
              aria-label="Origen del texto"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'text'}
                onClick={() => {
                  sound.playToggle();
                  setActiveTab('text');
                  setError(null);
                }}
                className={`flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-all duration-200 ${
                  activeTab === 'text'
                    ? 'bg-white dark:bg-surface-2 text-hi shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
                    : 'text-mid hover:text-hi hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${activeTab === 'text' ? 'text-azure' : 'text-low'}`} strokeWidth={1.8} />
                Texto directo
              </button>
              {mode === 'analyzer' && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'docx'}
                  onClick={() => {
                    sound.playToggle();
                    setActiveTab('docx');
                    setError(null);
                  }}
                  className={`flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-all duration-200 ${
                    activeTab === 'docx'
                      ? 'bg-white dark:bg-surface-2 text-hi shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
                      : 'text-mid hover:text-hi hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                  }`}
                >
                  <UploadCloud className={`w-3.5 h-3.5 ${activeTab === 'docx' ? 'text-azure' : 'text-low'}`} strokeWidth={1.8} />
                  Documento .docx
                </button>
              )}
            </div>
            {activeTab === 'text' && <span className="font-mono text-[11px] text-low" aria-live="polite">{wordCount} palabras · {textInput.length} caracteres</span>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="analysis-title" className="field-label">Título o referencia <span className="text-low font-normal">(opcional)</span></label>
            <input id="analysis-title" type="text" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} placeholder="Ensayo o documento académico" className="field" />
          </div>

          {activeTab === 'text' && (
            <div className="flex flex-col gap-2">
              <label htmlFor="analysis-text" className="field-label">{mode === 'humanizer' ? 'Texto a humanizar' : 'Texto a evaluar'}</label>
              <textarea id="analysis-text" rows={11} value={textInput} onChange={(e) => { setTextInput(e.target.value); if (error) setError(null); }}
                placeholder={mode === 'humanizer'
                  ? 'Pega el texto aquí. Eliminaremos patrones y clichés de IA para devolver cadencia natural y riqueza léxica, respetando tus citas y datos.'
                  : 'Pega el texto aquí. Verificaremos que no haya plagio de fuentes públicas y calcularemos la probabilidad de IA con desglose párrafo a párrafo.'}
                className="field h-auto py-4 leading-[1.7] resize-y" />
            </div>
          )}

          {activeTab === 'docx' && (
            <div
              role="button"
              tabIndex={0}
              aria-label={selectedFile ? `Archivo seleccionado: ${selectedFile.name}. Pulsa para cambiarlo.` : 'Elegir un archivo .docx'}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInput.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.current?.click(); } }}
              className={`relative rounded-2xl border border-dashed p-10 text-center cursor-pointer transition-[border-color,background-color] duration-240 ease-out ${
                dragging ? 'border-azure/60 bg-azure/5' : selectedFile ? 'border-human/40 bg-human/5' : 'hair-2 hover:bg-hair'
              }`}
            >
              <input ref={fileInput} id="docx-file-input" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} className="hidden" tabIndex={-1} />
              <div className="flex flex-col items-center gap-3">
                {selectedFile ? <FileText className="w-8 h-8 text-human" strokeWidth={1.4} /> : <UploadCloud className={`w-8 h-8 text-azure transition-transform duration-240 ${dragging ? '-translate-y-1' : ''}`} strokeWidth={1.4} />}
                {selectedFile ? (
                  <>
                    <span className="text-[14px] font-semibold text-hi break-all">{selectedFile.name}</span>
                    <span className="font-mono text-[11.5px] text-low">{(selectedFile.size / 1024).toFixed(1)} KB · documento Word válido</span>
                    <span className="text-[12px] text-azure pt-1">Haz clic para cambiar de archivo</span>
                  </>
                ) : (
                  <>
                    <span className="text-[14px] font-semibold text-hi">Arrastra tu archivo .docx aquí, o haz clic para elegirlo</span>
                    <span className="text-[12px] text-low">Solo .docx · máximo 10 MB</span>
                  </>
                )}
              </div>
              {selectedFile && (
                <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} aria-label="Quitar archivo" className="btn-icon absolute top-2 right-2"><X className="w-4 h-4" /></button>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 py-4 border-y border-ai/30 text-[13px] text-ai animate-fadeIn" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold">{error}</span>
                {error.includes('5 análisis') && (
                  <button type="button" onClick={openPremiumModal} className="self-start text-azure hover:text-hi transition-colors font-semibold">
                    Activar la licencia vitalicia por $2
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {mode === 'analyzer' ? (
              <button type="button" disabled={busy} onClick={handleAnalyze} className="btn btn-primary min-w-[200px]">
                <ShieldCheck className="w-4 h-4" strokeWidth={2} /> Verificar plagio e IA <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            ) : (
              <button type="button" disabled={busy || activeTab !== 'text'} onClick={handleDirectHumanize} className="btn btn-primary min-w-[200px] bg-human hover:bg-human/90">
                <Sparkles className="w-4 h-4" strokeWidth={2} /> Humanizar texto <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error al recuperar un informe */}
      {!showForm && error && !analysis && (
        <div className="flex items-start gap-3 py-4 border-y border-ai/30 text-[13px] text-ai" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} /><span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Resultados del análisis */}
      {analysis && (
        <div className="flex flex-col gap-7 page-in">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-d-5 font-semibold break-words">{analysis.title}</h2>
            <span className="font-mono text-[11.5px] text-low">{analysis.type === 'DOCX' ? 'documento .docx' : 'texto'} · {new Date(analysis.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>

          <ResultScoreCard aiScore={analysis.aiScore} similarityScore={analysis.similarityScore} indicators={analysis.overallIndicators || []} summaryExplanation={analysis.summaryExplanation} />

          {error && (
            <div className="flex items-start gap-3 py-4 border-y border-ai/30 text-[13px] text-ai" role="alert">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.8} /><span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Llamada al Humanizador */}
          {!improvedResult && (improving ? (
            <AnalysisProgress stage="Humanizando texto y erradicando huella de IA..." mode="rewrite" />
          ) : (
            <div className="relative overflow-hidden rounded-[20px] border border-human/30 p-7 sm:p-8 flex flex-wrap items-center justify-between gap-6"
              style={{ background: 'linear-gradient(165deg, rgb(var(--human) / .09), rgb(var(--human) / .015) 60%)' }}>
              <div className="flex flex-col gap-2 max-w-[560px]">
                <span className="eyebrow text-human">Humanizador de IA</span>
                <h3 className="text-d-5 font-semibold">Humaniza este texto para <span className="serif">cero detección.</span></h3>
                <p className="text-[13.5px] leading-[1.65] text-mid">Rompe la cadencia uniforme, sustituye más de 130 fórmulas de IA y conserva citas, cifras y sentido original.</p>
              </div>
              <button type="button" disabled={improving} onClick={handleImproveWriting} className="btn btn-primary bg-human hover:bg-human/90 shrink-0">
                <Sparkles className="w-4 h-4" strokeWidth={2} /> Humanizar este texto <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          ))}

          {improvedResult && (
            <DiffViewer originalText={analysis.originalText} improvedText={improvedResult.improvedText} summaryOfChanges={improvedResult.summaryOfChanges}
              analysisId={analysis.id} originalAiScore={analysis.aiScore} improvedAiScore={improvedResult.improvedAiScore} originalSimilarityScore={analysis.similarityScore} title={analysis.title} />
          )}

          {/* Desglose por párrafo */}
          {analysis.paragraphs && analysis.paragraphs.length > 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3 pt-4">
                <h3 className="text-d-5 font-light">No un número. <span className="serif">Un argumento.</span></h3>
                <span className="font-mono text-[11.5px] text-low">{analysis.paragraphs.length} párrafos</span>
              </div>
              <ol className="flex flex-col gap-3">
                {analysis.paragraphs.map((p, idx) => {
                  const m = getScoreMood(p.aiScore);
                  return (
                    <li key={idx} className="card px-6 py-6 flex flex-col sm:flex-row gap-5 sm:gap-7">
                      <div className="flex sm:flex-col items-baseline sm:items-center gap-2 sm:w-[76px] shrink-0">
                        <span className={`num text-[28px] leading-none ${m.textClass}`}>{Math.round(p.aiScore)}%</span>
                        <span className="eyebrow">{m.tone === 'ai' ? 'IA' : m.tone === 'mixed' ? 'Mixto' : 'Humano'}</span>
                      </div>
                      <div className="flex flex-col gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-low">Párrafo {p.index + 1}</span>
                          <span className="h-[3px] flex-1 max-w-[120px] rounded-full bg-hair overflow-hidden" aria-hidden="true"><span className={`block h-full ${m.barClass}`} style={{ width: `${Math.round(p.aiScore)}%` }} /></span>
                        </div>
                        <p className="text-[14px] leading-[1.75] text-mid">{p.text}</p>
                        {p.indicators.length > 0 && (
                          <div className="flex items-baseline gap-3">
                            <span className={`h-px w-[16px] shrink-0 relative -top-1 ${m.barClass}`} />
                            <span className={`text-[12.5px] font-semibold leading-[1.6] ${m.textClass}`}>{p.indicators.join('  ·  ')}</span>
                          </div>
                        )}
                        <p className="text-[12.5px] leading-[1.6] text-low italic">{p.explanation}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Fuentes */}
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3 pt-4">
                <h3 className="text-d-5 font-light">Fuentes <span className="serif">cotejadas.</span></h3>
                <span className="num text-[13px] text-azure">{analysis.similarityScore}% total</span>
              </div>
              <ul className="flex flex-col">
                {analysis.sources.map((src, i) => (
                  <li key={i} className={`py-6 border-b hair flex flex-col gap-4 ${i === 0 ? 'border-t' : ''}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <a href={src.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[13.5px] font-semibold text-hi hover:text-azure transition-colors rounded-md">
                        {src.title} <ExternalLink className="w-3.5 h-3.5 text-low" strokeWidth={1.8} />
                      </a>
                      <span className="num text-[13px] text-azure">{src.similarityPercentage}%</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <span className="eyebrow">Fuente externa</span>
                        <p className="serif text-[16px] leading-[1.55] text-mid">{src.matchedText}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className="eyebrow">En tu documento</span>
                        <p className="serif text-[16px] leading-[1.55] text-hi">{src.userSnippet}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {loading && !analysis && !showForm && (
        <div className="flex items-center gap-3 text-[13px] text-mid" role="status"><Loader2 className="w-4 h-4 animate-spin text-azure" /> {loadingStage || 'Cargando…'}</div>
      )}
    </div>
  );
};
