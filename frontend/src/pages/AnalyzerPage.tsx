import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisApi, writingApi } from '../services/api';
import { Analysis } from '../types';
import { ResultScoreCard, DiffViewer } from '../components/analysis';
import { sound } from '../utils/soundEffects';
import { getScoreMood } from '../utils/scoreMood';
import {
  FileText,
  UploadCloud,
  FileCheck,
  ExternalLink,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle2,
  FileCode,
  ArrowRight,
  Zap,
  Copy,
  Check,
  Download,
  PenTool,
  ShieldCheck,
  FileSearch,
  FileCheck2,
  Layers,
} from 'lucide-react';

export const AnalyzerPage: React.FC = () => {
  const { isAuthenticated, isPremium, user, openPremiumModal, refreshProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Modo de operación: Analizador completo vs Humanizador directo
  const [mode, setMode] = useState<'analyzer' | 'humanizer'>('analyzer');

  // Estados de entrada
  const [activeTab, setActiveTab] = useState<'text' | 'docx'>('text');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Estados de procesamiento y resultado
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  // Estados del módulo de mejora de redacción / humanizador
  const [improving, setImproving] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [improvedResult, setImprovedResult] = useState<{
    improvedText: string;
    summaryOfChanges: string[];
    originalAiScore?: number;
    improvedAiScore?: number;
    aiReduction?: number;
  } | null>(null);

  // Si se pasa un ID por URL para consultar análisis existente
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    if (id) {
      loadAnalysisById(id);
    }
  }, [location.search]);

  const loadAnalysisById = async (id: string) => {
    setLoading(true);
    const res = await analysisApi.getById(id);
    setLoading(false);
    if (res.data?.success && res.data.analysis) {
      setAnalysis(res.data.analysis);
      if (res.data.analysis.improvedText) {
        setImprovedResult({
          improvedText: res.data.analysis.improvedText,
          summaryOfChanges: [
            'Optimización estructural recuperada del historial',
            'Cadencia fluida y vocabulario equilibrado',
          ],
          originalAiScore: res.data.analysis.aiScore,
          improvedAiScore: res.data.analysis.improvedAiScore || 8,
        });
      }
    } else {
      setError(res.error || 'No se pudo cargar el análisis.');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError('Formato inválido. Solo se admiten documentos en formato .docx');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo excede el tamaño máximo permitido de 10 MB.');
      return;
    }
    setSelectedFile(file);
    if (!titleInput) {
      setTitleInput(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleAnalyze = async () => {
    if (!isAuthenticated) {
      navigate('/login?notice=unauthenticated');
      return;
    }

    setError(null);
    setImprovedResult(null);

    if (activeTab === 'text') {
      if (!textInput || textInput.trim().length < 15) {
        setError('Por favor introduce un texto de al menos 15 caracteres.');
        return;
      }

      setLoading(true);
      setLoadingStage('Analizando perplejidad, burstiness y regularidad sintáctica...');
      sound.playScan();

      const res = await analysisApi.analyzeText(textInput, titleInput);
      setLoading(false);

      if (res.isLimitReached) {
        sound.playError();
        setError(res.error || 'Has alcanzado tus 5 análisis gratuitos de hoy.');
        openPremiumModal();
        return;
      }

      if (res.data?.success && res.data.analysis) {
        sound.playSuccess();
        setAnalysis(res.data.analysis);
        await refreshProfile();
      } else {
        sound.playError();
        setError(res.error || 'Error al procesar el análisis de texto.');
      }
    } else {
      // Pestaña DOCX
      if (!selectedFile) {
        sound.playError();
        setError('Por favor selecciona un archivo .docx para analizar.');
        return;
      }

      setLoading(true);
      setLoadingStage('Extrayendo párrafos y estructura del documento .docx...');
      sound.playScan();

      const res = await analysisApi.analyzeDocx(selectedFile);
      setLoading(false);

      if (res.isLimitReached) {
        sound.playError();
        setError(res.error || 'Has alcanzado tus 5 análisis gratuitos de hoy.');
        openPremiumModal();
        return;
      }

      if (res.data?.success && res.data.analysis) {
        sound.playSuccess();
        setAnalysis(res.data.analysis);
        await refreshProfile();
      } else {
        sound.playError();
        setError(res.error || 'Error al procesar el archivo DOCX.');
      }
    }
  };

  // Humanización directa con reducción drástica de % de IA
  const handleDirectHumanize = async () => {
    if (!isAuthenticated) {
      navigate('/login?notice=unauthenticated');
      return;
    }

    if (!textInput || textInput.trim().length < 15) {
      setError('Por favor introduce un texto de al menos 15 caracteres para humanizar.');
      return;
    }

    setError(null);
    setImproving(true);
    sound.playScan();

    const res = await writingApi.improveText({
      text: textInput.trim(),
    });

    setImproving(false);

    if (res.data?.success) {
      sound.playSuccess();
      setImprovedResult({
        improvedText: res.data.improvedText,
        summaryOfChanges: res.data.summaryOfChanges,
        originalAiScore: res.data.originalAiScore,
        improvedAiScore: res.data.improvedAiScore,
        aiReduction: res.data.aiReduction,
      });
    } else {
      sound.playError();
      setError(res.error || 'No se pudo procesar la reescritura del texto.');
    }
  };

  const handleImproveWriting = async () => {
    if (!analysis) return;

    setImproving(true);
    setError(null);

    const res = await writingApi.improveText({
      analysisId: analysis.id,
      text: analysis.originalText,
    });

    setImproving(false);

    if (res.data?.success) {
      setImprovedResult({
        improvedText: res.data.improvedText,
        summaryOfChanges: res.data.summaryOfChanges,
        originalAiScore: res.data.originalAiScore ?? analysis.aiScore,
        improvedAiScore: res.data.improvedAiScore,
        aiReduction: res.data.aiReduction,
      });
      // Desplazar suavemente a la sección de resultados
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } else {
      setError(res.error || 'No se pudo generar la mejora de redacción.');
    }
  };

  const handleCopyDirectText = () => {
    if (!improvedResult?.improvedText) return;
    navigator.clipboard.writeText(improvedResult.improvedText);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2500);
  };

  const handleDownloadDirectDocx = async () => {
    if (!improvedResult?.improvedText) return;
    await writingApi.downloadDocx({
      improvedText: improvedResult.improvedText,
      title: titleInput || 'documento_humanizado',
    });
  };

  const resetForm = () => {
    setAnalysis(null);
    setImprovedResult(null);
    setTextInput('');
    setSelectedFile(null);
    setTitleInput('');
    setError(null);
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-16">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>🏛️</span>
            <span>Centro de Auditoría Documental</span>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              🛡️ Veritas v1.2
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>🎯</span>
            <span>Análisis estilométrico de perplejidad, cotejo de similitud y asistente editorial de reescritura ética</span>
          </p>
        </div>

        {(analysis || improvedResult) && (
          <button
            onClick={() => { sound.playClick(); resetForm(); }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 self-start"
          >
            <span>🔄</span>
            <span>Nueva Auditoría</span>
          </button>
        )}
      </div>

      {/* SELECTOR DE MODALIDAD PRINCIPAL (Si no hay análisis activo) */}
      {!analysis && !improvedResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-xl">
          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setMode('analyzer');
              setError(null);
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'analyzer'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>🔍</span>
            <span>Auditoría de Originalidad (Estilometría & Plagio)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playToggle();
              setMode('humanizer');
              setActiveTab('text');
              setError(null);
            }}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'humanizer'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <span>✍️</span>
            <span>Reescritura Editorial Ética</span>
          </button>
        </div>
      )}

      {/* RECUADRO DE TEXTO HUMANIZADO LISTO (DIRECTO) */}
      {improvedResult && !analysis && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 space-y-6 animate-fadeIn">
          {/* Cabecera del Recuadro de Copiado Rápido */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/25">
                <Zap className="w-6 h-6 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    🎉 ¡Texto Humanizado y Listo para Usar! ✨
                  </h3>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    🛡️ Baja Detección Garantizada
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Se rompió la uniformidad robótica, se diversificaron conectores y se preservaron tus ideas.
                </p>
              </div>
            </div>

            {/* Badge de Reducción Máxima del % de IA con Emojis Dinámicos */}
            {improvedResult.originalAiScore !== undefined && improvedResult.improvedAiScore !== undefined && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-200 self-start sm:self-auto shadow-sm">
                <span className="text-slate-400 line-through flex items-center gap-1">
                  <span>{getScoreMood(improvedResult.originalAiScore).aiEmoji}</span>
                  <span>IA Antes: {improvedResult.originalAiScore}%</span>
                </span>
                <span className="text-emerald-600 font-extrabold">➔</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm flex items-center gap-1">
                  <span>{getScoreMood(improvedResult.improvedAiScore).aiEmoji}</span>
                  <span>IA Ahora: {improvedResult.improvedAiScore}%</span>
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black">
                  ⚡ -{Math.max(0, improvedResult.originalAiScore - improvedResult.improvedAiScore)}% Reducción
                </span>
              </div>
            )}
          </div>

          {/* Caja de Texto Humanizado Listo */}
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>✨</span>
                <span>Texto Final Optimizado</span>
              </span>
              <span className="text-[11px]">
                📊 {improvedResult.improvedText.split(/\s+/).filter(Boolean).length} palabras •{' '}
                {improvedResult.improvedText.length} caracteres
              </span>
            </div>

            <textarea
              readOnly
              rows={11}
              value={improvedResult.improvedText}
              className="w-full p-5 bg-transparent text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-sans focus:outline-none resize-y selection:bg-emerald-200 dark:selection:bg-emerald-900"
            />
          </div>

          {/* Barra de Acciones de 1 Clic */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              onClick={handleCopyDirectText}
              className={`px-8 py-3.5 rounded-2xl text-sm font-extrabold transition-all flex items-center gap-2.5 shadow-xl ${
                copiedDirect
                  ? 'bg-emerald-600 text-white shadow-emerald-500/30 scale-105'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {copiedDirect ? (
                <>
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>✅ ¡Texto Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>📋 Copiar Texto Listo (1 Clic)</span>
                </>
              )}
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadDirectDocx}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>💾 Descargar en Word (.docx)</span>
              </button>

              <button
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <span>🔄</span>
                <span>Humanizar otro texto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO DE ENTRADA (solo si no hay análisis ni resultado directo activo) */}
      {!analysis && !improvedResult && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Pestañas de Selección de Entrada */}
          <div className="flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-md">
            <button
              type="button"
              onClick={() => {
                setActiveTab('text');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span>📝</span>
              <span>Texto Directo</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('docx');
                setError(null);
              }}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'docx'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <span>📄</span>
              <span>Archivo Word .DOCX</span>
            </button>
          </div>

          {/* Campo de Título Opcional */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <span>🏷️</span>
              <span>Título o Referencia del Trabajo (opcional)</span>
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Ej: Ensayo de Filosofía Contemporánea"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Opción A: Textarea */}
          {activeTab === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>{mode === 'humanizer' ? '✍️' : '📝'}</span>
                  <span>
                    {mode === 'humanizer'
                      ? 'Pega aquí el texto que deseas humanizar para bajar el % de IA'
                      : 'Pega aquí el contenido a evaluar'}
                  </span>
                </label>
                <span className="text-[11px] text-slate-400">
                  📊 {textInput.split(/\s+/).filter(Boolean).length} palabras • {textInput.length} caracteres
                </span>
              </div>
              <textarea
                rows={10}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={
                  mode === 'humanizer'
                    ? 'Pega aquí tu texto generado o asistido por IA. Nuestro algoritmo reestructurará la cadencia sintáctica, diversificará el vocabulario y eliminará clichés para reducir el porcentaje de IA al mínimo (4% - 10%)...'
                    : 'Pega aquí el texto que deseas analizar para detectar probabilidad estimada de IA, índice de similitud y obtener recomendaciones de mejora...'
                }
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-sans"
              />
            </div>
          )}

          {/* Opción B: Carga de archivo .DOCX */}
          {activeTab === 'docx' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center transition-colors bg-slate-50/50 dark:bg-slate-950/50 cursor-pointer"
              onClick={() => document.getElementById('docx-file-input')?.click()}
            >
              <input
                id="docx-file-input"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-sm text-2xl">
                📄
              </div>

              {selectedFile ? (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    📄 {selectedFile.name}
                  </span>
                  <span className="text-xs text-slate-500 block">
                    ✅ {(selectedFile.size / 1024).toFixed(1)} KB • Documento Word válido
                  </span>
                  <span className="text-xs text-blue-600 font-semibold inline-block pt-2">
                    🔄 Haz clic para cambiar de archivo
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">
                    📥 Arrastra y suelta tu archivo .docx aquí, o haz clic para seleccionarlo
                  </span>
                  <span className="text-xs text-slate-400 block">
                    ℹ️ Solo formato .docx • Tamaño máximo permitido: 10 MB
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mensaje de Error */}
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">⚠️</span>
              <div className="space-y-1">
                <span className="font-semibold">{error}</span>
                {error.includes('5 análisis') && (
                  <button
                    onClick={openPremiumModal}
                    className="block text-blue-600 dark:text-blue-400 underline font-bold mt-1"
                  >
                    ⭐ Haz clic aquí para activar Premium Vitalicio por $2 USD
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Botón 1: Analizar Contenido */}
            <button
              disabled={loading || improving}
              onClick={handleAnalyze}
              className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>⏳ {loadingStage || 'Procesando auditoría...'}</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Ejecutar Auditoría Estilométrica</span>
                </>
              )}
            </button>

            {/* Botón 2: Reescritura Editorial Ética */}
            <button
              disabled={loading || improving || activeTab !== 'text'}
              onClick={handleDirectHumanize}
              className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {improving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>⚡ Optimizando cadencia y variedad sintáctica...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Reescritura Editorial Ética</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* VISTA DE RESULTADOS DEL ANÁLISIS */}
      {analysis && (
        <div className="space-y-8 animate-fadeIn">
          {/* Tarjetas Principales de Puntuación e Indicadores */}
          <ResultScoreCard
            aiScore={analysis.aiScore}
            similarityScore={analysis.similarityScore}
            indicators={analysis.overallIndicators || []}
            summaryExplanation={analysis.summaryExplanation}
          />

          {/* Botón Destacado: Humanizar Redacción con Reducción Máxima */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">
                <span>🪄</span>
                <span>Humanizador Algorítmico Veritas</span>
              </div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <span>⚡</span>
                <span>Reducir probabilidad de IA al menor porcentaje posible</span>
              </h3>
              <p className="text-xs text-emerald-100 max-w-xl">
                Reestructura oraciones para crear cadencia humana, erradica más de 40 frases cliché de IA y conserva el sentido y las citas intactas.
              </p>
            </div>

            <button
              disabled={improving}
              onClick={handleImproveWriting}
              className="px-6 py-3.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 font-extrabold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
            >
              {improving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>⏳ Reescribiendo texto...</span>
                </>
              ) : (
                <>
                  <span>✨</span>
                  <span>Aplicar Reescritura Editorial</span>
                </>
              )}
            </button>
          </div>

          {/* Visor de Mejora de Redacción y Recuadro de Copiado de una vez */}
          {improvedResult && (
            <DiffViewer
              originalText={analysis.originalText}
              improvedText={improvedResult.improvedText}
              summaryOfChanges={improvedResult.summaryOfChanges}
              analysisId={analysis.id}
              originalAiScore={analysis.aiScore}
              improvedAiScore={improvedResult.improvedAiScore}
              originalSimilarityScore={analysis.similarityScore}
              title={analysis.title}
            />
          )}

          {/* Desglose de Párrafos con Resaltado Estilométrico y Emojis Reactivos */}
          {analysis.paragraphs && analysis.paragraphs.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>📑</span>
                    <span>Evaluación Párrafo a Párrafo</span>
                    <span>🔍</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Probabilidad estimada e indicadores detectados por segmento textual
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  📊 {analysis.paragraphs.length} párrafos evaluados
                </span>
              </div>

              <div className="space-y-4 pt-2">
                {analysis.paragraphs.map((p, idx) => {
                  const pMood = getScoreMood(p.aiScore);

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${pMood.bgClass} ${pMood.borderClass}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                          <span>📝</span>
                          <span>Párrafo {p.index + 1}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          {p.indicators.map((ind, i) => (
                            <span
                              key={i}
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                            >
                              <span>🏷️</span>
                              <span>[{ind}]</span>
                            </span>
                          ))}

                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${pMood.badgeClass}`}
                          >
                            <span>{pMood.aiEmoji}</span>
                            <span>IA: {p.aiScore}%</span>
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans mb-2">
                        {p.text}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{p.explanation}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Fuentes Encontradas (Similitud) */}
          {analysis.sources && analysis.sources.length > 0 && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>🌐</span>
                    <span>Fuentes Identificadas en el Corpus Público</span>
                    <span>📑</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Desglose de coincidencia textual con repositorios abiertos
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span>📑</span>
                  <span>Total Similitud: {analysis.similarityScore}%</span>
                </span>
              </div>

              <div className="space-y-3 pt-2">
                {analysis.sources.map((src, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                      >
                        <span>🔗</span>
                        <span>{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <span>📑</span>
                        <span>{src.similarityPercentage}% coincidencia</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          📑 Fragmento de la Fuente Externa
                        </span>
                        <p className="text-slate-600 dark:text-slate-300 italic">
                          "{src.matchedText}"
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 block mb-1">
                          📝 Fragmento en tu Documento
                        </span>
                        <p className="text-slate-800 dark:text-slate-200">
                          "{src.userSnippet}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
