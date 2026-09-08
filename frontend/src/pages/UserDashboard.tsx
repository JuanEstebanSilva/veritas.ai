import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisApi } from '../services/api';
import {
  FileSearch,
  Sparkles,
  Crown,
  History,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  Bot,
  FileCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, isPremium, openPremiumModal } = useAuth();
  const navigate = useNavigate();

  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoadingHistory(true);
      const res = await analysisApi.getHistory();
      if (res.data?.analyses) {
        setRecentAnalyses(res.data.analyses.slice(0, 5));
      }
      setLoadingHistory(false);
    };

    fetchRecent();
  }, []);

  const usedToday = user?.daily_analysis_count || 0;
  const availableToday = isPremium ? 'Ilimitados' : Math.max(0, 5 - usedToday);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto">
      {/* Encabezado Principal de Bienvenida */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-xl shadow-blue-500/15">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            {isPremium ? (
              <>
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Membresía Premium Vitalicia</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Plan Básico Gratuito</span>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Hola, {user?.name} {user?.last_name}
          </h1>
          <p className="text-sm text-blue-100 max-w-xl">
            Bienvenido al panel de control de Veritas AI. Verifica la originalidad de tus textos, detecta patrones probabilísticos de IA y mejora la fluidez de tus escritos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/analyzer"
            className="px-6 py-3.5 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <FileSearch className="w-4 h-4" />
            <span>Nuevo Análisis</span>
          </Link>
        </div>
      </div>

      {/* Tarjetas de Métricas de Uso */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Análisis Realizados Hoy */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Uso Hoy</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
            {usedToday}{' '}
            <span className="text-sm font-semibold text-slate-400">
              {isPremium ? 'análisis' : '/ 5 diarios'}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            {isPremium ? 'Sin límite diario' : `${5 - usedToday} restantes antes de requerir recarga`}
          </div>
        </div>

        {/* Análisis Disponibles */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Disponibles</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mb-1">
            {availableToday}
          </div>
          <div className="text-xs text-slate-500">
            {isPremium ? 'Análisis ilimitados activados' : 'Se reinicia a las 00:00 h'}
          </div>
        </div>

        {/* Estado Premium */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Membresía</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">
            {isPremium ? 'Premium Vitalicio' : 'Gratuito'}
          </div>
          {isPremium ? (
            <div className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              Activo de por vida
            </div>
          ) : (
            <button
              onClick={openPremiumModal}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
            >
              Desbloquear Premium ($2 USD) →
            </button>
          )}
        </div>

        {/* Total Histórico */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Histórico Total</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">
            {user?.total_analyses || recentAnalyses.length}
          </div>
          <div className="text-xs text-slate-500">Documentos procesados</div>
        </div>
      </div>

      {/* Banner Promocional para Usuarios Gratuitos */}
      {!isPremium && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                ¿Necesitas analizar más documentos sin interrupciones?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Obtén análisis ilimitados de por vida por solo $2 USD (Pago único). Sin suscripciones mensuales.
              </p>
            </div>
          </div>

          <button
            onClick={openPremiumModal}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105 shrink-0"
          >
            Adquirir Premium ($2)
          </button>
        </div>
      )}

      {/* Sección de Análisis Recientes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Análisis Recientes</span>
          </h3>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Ver historial completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingHistory ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Cargando historial de análisis...
          </div>
        ) : recentAnalyses.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
              <FileSearch className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Aún no has realizado ningún análisis
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Pega un texto o sube un archivo .DOCX para calcular la probabilidad de IA y el índice de similitud.
            </p>
            <Link
              to="/analyzer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-colors mt-2"
            >
              Comenzar primer análisis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => navigate(`/analyzer?id=${analysis.id}`)}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer space-y-4 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {analysis.title_or_filename || analysis.title}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                    {analysis.type}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40">
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block">
                      Probabilidad IA
                    </span>
                    <span className="text-lg font-extrabold text-rose-700 dark:text-rose-300">
                      {analysis.ai_score || analysis.aiScore}%
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">
                      Similitud
                    </span>
                    <span className="text-lg font-extrabold text-blue-700 dark:text-blue-300">
                      {analysis.similarity_score || analysis.similarityScore}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    {new Date(analysis.created_at || analysis.createdAt).toLocaleDateString('es-ES')}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">
                    Ver informe →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
