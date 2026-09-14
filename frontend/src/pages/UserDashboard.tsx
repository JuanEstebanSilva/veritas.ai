import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisApi } from '../services/api';
import { sound } from '../utils/soundEffects';
import {
  FileSearch,
  Crown,
  History,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  AlertCircle,
  FileText,
  BarChart3,
  Scale,
  Sparkles,
  Zap,
  BookOpen,
  PieChart,
  Activity,
  Layers,
  Award,
  Lightbulb,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, isPremium, openPremiumModal } = useAuth();
  const navigate = useNavigate();

  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingHistory(true);
      const res = await analysisApi.getHistory();
      if (res.data?.analyses) {
        setAllAnalyses(res.data.analyses);
      }
      setLoadingHistory(false);
    };

    fetchRecent();
  }, []);

  const usedToday = user?.daily_analysis_count || 0;
  const availableToday = isPremium ? 'Ilimitados 🚀' : Math.max(0, 5 - usedToday);

  // ══════════════════════════════════════════════════════════════════
  // CÁLCULO DE ESTADÍSTICAS AVANZADAS DEL USUARIO
  // ══════════════════════════════════════════════════════════════════
  const totalAnalysesCount = allAnalyses.length || (user?.total_analyses || 0);

  // Promedio de Probabilidad IA
  const avgAiScore =
    allAnalyses.length > 0
      ? Math.round(
          allAnalyses.reduce((acc, curr) => acc + (curr.ai_score ?? curr.aiScore ?? 0), 0) /
            allAnalyses.length
        )
      : 0;

  // Promedio de Autenticidad Humana (inverso)
  const avgHumanScore = 100 - avgAiScore;

  // Promedio de Similitud
  const avgSimilarityScore =
    allAnalyses.length > 0
      ? Math.round(
          allAnalyses.reduce(
            (acc, curr) => acc + (curr.similarity_score ?? curr.similarityScore ?? 0),
            0
          ) / allAnalyses.length
        )
      : 0;

  // Distribución por nivel de autenticidad
  const highAuthenticity = allAnalyses.filter(
    (a) => (a.ai_score ?? a.aiScore ?? 0) < 30
  ).length;

  const moderateAi = allAnalyses.filter((a) => {
    const s = a.ai_score ?? a.aiScore ?? 0;
    return s >= 30 && s <= 65;
  }).length;

  const highAi = allAnalyses.filter(
    (a) => (a.ai_score ?? a.aiScore ?? 0) > 65
  ).length;

  // Documentos mejorados / optimizados
  const improvedDocs = allAnalyses.filter(
    (a) => a.improved_ai_score !== null && a.improved_ai_score !== undefined
  );
  const totalImprovedCount = improvedDocs.length;

  // Reducción promedio de IA con reescritura
  const avgReduction =
    improvedDocs.length > 0
      ? Math.round(
          improvedDocs.reduce((acc, curr) => {
            const orig = curr.ai_score ?? curr.aiScore ?? 0;
            const imp = curr.improved_ai_score ?? curr.improvedAiScore ?? 0;
            return acc + Math.max(0, orig - imp);
          }, 0) / improvedDocs.length
        )
      : 0;

  // Tipos de archivo
  const docxCount = allAnalyses.filter((a) => a.type === 'DOCX').length;
  const textCount = allAnalyses.filter((a) => a.type === 'TEXT').length;

  const recentAnalyses = allAnalyses.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* ── Encabezado Principal con Emojis y Estado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-semibold">
            {isPremium ? (
              <>
                <span className="text-amber-400">👑</span>
                <span className="text-slate-200">Licencia Vitalicia Premium Activa</span>
                <span className="text-emerald-400 font-bold">✨ Ilimitado</span>
              </>
            ) : (
              <>
                <span>⚖️</span>
                <span className="text-slate-300">Cuenta Estándar (5 análisis/día)</span>
                <span className="text-blue-400 font-bold">Gratis</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>Panel de Control Editorial</span>
            <span className="text-2xl sm:text-3xl">📊</span>
          </h1>
          <p className="text-sm text-slate-400 max-w-xl">
            ¡Hola, <strong className="text-white">👋 {user?.name || 'Investigador'} {user?.last_name || ''}</strong>! Aquí tienes el resumen estadístico de autenticidad, perplejidad y actividad documental de tus investigaciones.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <Link
            to="/analyzer"
            onClick={() => sound.playClick()}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>🔍</span>
            <span>Verificar Documento</span>
          </Link>
        </div>
      </div>

      {/* ── Tarjetas de Métricas Rápidas con Emojis ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Tarjeta 1: Uso Diario */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>📈</span>
              <span>Uso Diario</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-sm">
              ⚡
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-baseline gap-1.5">
            <span>{usedToday}</span>
            <span className="text-sm font-semibold text-slate-400">
              {isPremium ? 'análisis hoy' : '/ 5 hoy'}
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            {isPremium ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                ✨ Cupo ilimitado activo
              </span>
            ) : (
              <span>⏳ {Math.max(0, 5 - usedToday)} disponibles hoy</span>
            )}
          </div>
        </div>

        {/* Tarjeta 2: Disponibilidad */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>🎯</span>
              <span>Disponibilidad</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-sm">
              ✅
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {availableToday}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {isPremium ? '🌟 Sin restricciones de cuota' : '🔄 Reinicia a medianoche'}
          </div>
        </div>

        {/* Tarjeta 3: Membresía */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>💎</span>
              <span>Membresía</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-sm">
              👑
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
            <span>{isPremium ? 'Vitalicia' : 'Estándar'}</span>
            <span>{isPremium ? '⭐' : '🆓'}</span>
          </div>
          {isPremium ? (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
              <span>🔒 Activa para siempre</span>
            </div>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                openPremiumModal();
              }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 mt-1"
            >
              <span>Desbloquear ($2 USD)</span>
              <span>👉</span>
            </button>
          )}
        </div>

        {/* Tarjeta 4: Total de Documentos */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
              <span>📚</span>
              <span>Total Auditados</span>
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-sm">
              📑
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1 flex items-baseline gap-1.5">
            <span>{totalAnalysesCount}</span>
            <span className="text-xs font-bold text-slate-400">textos</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span>📝 {textCount} textos</span>
            <span>•</span>
            <span>📄 {docxCount} Word</span>
          </div>
        </div>
      </div>

      {/* ── SECCIÓN CENTRAL: ESTADÍSTICAS AVANZADAS DE AUTENTICIDAD & ESTILOMETRÍA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Métricas Detalladas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📊</span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Estadísticas Globales de Autenticidad
                  </h3>
                </div>
                <p className="text-xs text-slate-400">
                  Promedios consolidados basados en el análisis estilométrico de todos tus textos
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300">
                🎯 {totalAnalysesCount} muestras
              </span>
            </div>

            {/* Grid de 3 Métricas Promedio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Score Humano */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <span>🟢</span>
                  <span>Índice Humano</span>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalAnalysesCount > 0 ? `${avgHumanScore}%` : '—'}
                </div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  {avgHumanScore >= 70
                    ? '✨ Autenticidad sobresaliente'
                    : avgHumanScore >= 50
                    ? '👌 Nivel equilibrado'
                    : '⚠️ Asistencia de IA detectable'}
                </div>
              </div>

              {/* Score IA */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>Probabilidad IA</span>
                </div>
                <div className="text-3xl font-black text-rose-600 dark:text-rose-400">
                  {totalAnalysesCount > 0 ? `${avgAiScore}%` : '—'}
                </div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300">
                  Perplejidad y uniformidad media
                </div>
              </div>

              {/* Score Similitud */}
              <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <span>🔍</span>
                  <span>Similitud Promedio</span>
                </div>
                <div className="text-3xl font-black text-blue-600 dark:text-blue-400">
                  {totalAnalysesCount > 0 ? `${avgSimilarityScore}%` : '—'}
                </div>
                <div className="text-[11px] text-blue-800 dark:text-blue-300">
                  Cotejo con fuentes abiertas
                </div>
              </div>
            </div>

            {/* Barra de Distribución de Autenticidad */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span>📈</span>
                  <span>Distribución de Autenticidad en tus Documentos</span>
                </span>
                <span className="text-slate-400">
                  {totalAnalysesCount} auditorías evaluadas
                </span>
              </div>

              {/* Barra segmentada multicolor */}
              <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden p-0.5 gap-0.5">
                {totalAnalysesCount === 0 ? (
                  <div className="w-full h-full bg-slate-300 dark:bg-slate-700 rounded-full" />
                ) : (
                  <>
                    <div
                      style={{
                        width: `${(highAuthenticity / totalAnalysesCount) * 100}%`,
                      }}
                      className="bg-emerald-500 rounded-l-full transition-all duration-500"
                      title={`Alta autenticidad: ${highAuthenticity}`}
                    />
                    <div
                      style={{
                        width: `${(moderateAi / totalAnalysesCount) * 100}%`,
                      }}
                      className="bg-amber-400 transition-all duration-500"
                      title={`Revisión moderada: ${moderateAi}`}
                    />
                    <div
                      style={{
                        width: `${(highAi / totalAnalysesCount) * 100}%`,
                      }}
                      className="bg-rose-500 rounded-r-full transition-all duration-500"
                      title={`Alta asistencia IA: ${highAi}`}
                    />
                  </>
                )}
              </div>

              {/* Leyenda de Distribución con Emojis */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    🟢 Alta Autenticidad: <strong className="text-slate-900 dark:text-white">{highAuthenticity}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    🟡 Moderado: <strong className="text-slate-900 dark:text-white">{moderateAi}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-slate-600 dark:text-slate-400 truncate">
                    🔴 Alta Asistencia: <strong className="text-slate-900 dark:text-white">{highAi}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Métricas de Reescritura / Optimización */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
                  🪄
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Optimizaciones Estilométricas Realizadas
                  </h4>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {totalImprovedCount} textos mejorados con éxito
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Reducción Media IA</span>
                <span className="text-base font-black text-purple-600 dark:text-purple-400">
                  {avgReduction > 0 ? `-${avgReduction}% ⚡` : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha (1/3): Consejos y Tipos de Documentos */}
        <div className="space-y-6">
          {/* Card: Tipos de Documentos */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">📁</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Formatos Analizados
              </h4>
            </div>

            <div className="space-y-3">
              {/* Formato 1: Texto */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📝</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Texto Directo
                    </div>
                    <div className="text-[10px] text-slate-400">Copiar y pegar</div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {textCount}
                </span>
              </div>

              {/* Formato 2: Word */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📄</span>
                  <div>
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Archivos Word (.DOCX)
                    </div>
                    <div className="text-[10px] text-slate-400">Documentos formateados</div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {docxCount}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/analyzer"
                onClick={() => sound.playClick()}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>➕ Subir nuevo archivo</span>
              </Link>
            </div>
          </div>

          {/* Card: Consejos de Integridad Académica */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-50/90 to-blue-50/70 dark:from-indigo-950/40 dark:to-blue-950/30 border border-indigo-200/70 dark:border-indigo-900/50 space-y-3">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
              <span className="text-lg">💡</span>
              <h4 className="text-sm font-bold">Consejos de Integridad</h4>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✅</span>
                <span><strong>Variabilidad léxica:</strong> Alterna oraciones cortas con cláusulas complejas para elevar tu burstiness.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✅</span>
                <span><strong>Citas textuales:</strong> Usa comillas en citas directas; nuestro motor distingue citas de plagio.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5">✅</span>
                <span><strong>Reescritura ética:</strong> Aprovecha el humanizador para pulir clichés sintácticos predictivos.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Banner Promocional para Usuarios Gratuitos ── */}
      {!isPremium && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shrink-0 flex items-center justify-center text-xl shadow-md">
              👑
            </div>
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>¿Requieres auditar documentos extensos sin límite de cuota?</span>
                <span>🚀</span>
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Desbloquea análisis ilimitados de por vida por solo $2 USD (Pago único). Sin suscripciones ni mensualidades.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              openPremiumModal();
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] shrink-0 flex items-center gap-1.5"
          >
            <span>✨</span>
            <span>Obtener Licencia ($2 USD)</span>
          </button>
        </div>
      )}

      {/* ── Sección de Auditorías Recientes ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕒</span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Auditorías Documentales Recientes</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                {recentAnalyses.length} recientes
              </span>
            </h3>
          </div>

          <Link
            to="/history"
            onClick={() => sound.playClick()}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Ver historial completo</span>
            <span>👉</span>
          </Link>
        </div>

        {loadingHistory ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
            ⏳ Cargando historial de auditorías...
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-2xl">
              📝
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No tienes análisis registrados aún 🧐
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Pega un texto o sube un archivo Microsoft Word (.docx) para realizar tu primer análisis de autenticidad.
            </p>
            <Link
              to="/analyzer"
              onClick={() => sound.playClick()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors mt-2"
            >
              <span>🚀</span>
              <span>Realizar primer análisis</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentAnalyses.map((item: any) => {
              const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
              const humanScore = 100 - aiScore;
              const simScore = Math.round(item.similarity_score ?? item.similarityScore ?? 0);
              const isDocx = item.type === 'DOCX';

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    sound.playClick();
                    navigate(`/analyzer?id=${item.id}`);
                  }}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 shadow-sm flex items-center justify-between cursor-pointer transition-all group hover:scale-[1.005]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center justify-center text-lg">
                      {isDocx ? '📄' : '📝'}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                        <span>{item.title_or_filename || item.title || 'Documento sin título'}</span>
                        {item.improved_ai_score !== null && item.improved_ai_score !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold">
                            ⚡ Optimizado
                          </span>
                        )}
                      </h5>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span>📅 {new Date(item.created_at || item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{isDocx ? 'Microsoft Word' : 'Texto plano'}</span>
                        <span>•</span>
                        <span>🔍 Similitud: {simScore}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6">
                    {/* Probabilidad IA con Emoji Reactivo */}
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Probabilidad IA
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-black flex items-center justify-end gap-1 ${
                          aiScore >= 70
                            ? 'text-rose-600 dark:text-rose-400'
                            : aiScore >= 40
                            ? 'text-amber-500'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <span className="text-sm select-none">{aiScore >= 70 ? '🤖' : aiScore >= 40 ? '😐' : '😊'}</span>
                        <span>{aiScore}%</span>
                      </span>
                    </div>

                    {/* Índice Humano */}
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                        Índice Humano
                      </span>
                      <span
                        className={`text-xs sm:text-sm font-black flex items-center justify-end gap-1 ${
                          humanScore >= 70
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : humanScore >= 40
                            ? 'text-amber-500'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span className="text-sm select-none">{humanScore >= 70 ? '😊' : humanScore >= 40 ? '😐' : '🤖'}</span>
                        <span>{humanScore}%</span>
                      </span>
                    </div>

                    <span className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all text-sm">
                      👉
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
