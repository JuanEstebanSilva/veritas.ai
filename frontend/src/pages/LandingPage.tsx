import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Bot,
  FileCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
  Search,
  Scale,
  Zap,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, openPremiumModal } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/analyzer');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="space-y-24 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Sección Hero */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-blue-500" />
          <span>Inspirado en Turnitin • Análisis Ético y Rigor Metodológico</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Detección Inteligente de IA,{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
            Similitud Textual
          </span>{' '}
          y Perfeccionamiento de Redacción.
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Veritas AI evalúa textos y documentos .DOCX para estimar probabilidades de generación por IA, indexar coincidencias con fuentes públicas y optimizar la fluidez manteniendo la autenticidad.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Analizar Contenido Ahora</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            to="/login"
            className="px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 análisis diarios gratis
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Soporte nativo para .DOCX
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Premium vitalicio por US$2
          </span>
        </div>
      </section>

      {/* Los 3 Pilares */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Detección Probabilística de IA
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Identifica regularidades sintácticas, perplejidad y burstiness mediante indicadores estilométricos precisos como <em>[Alta uniformidad]</em> o <em>[Patrones repetitivos]</em>. Con advertencias claras de probabilidad.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Índice de Similitud Riguroso
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Compara contra repositorios abiertos y fuentes académicas. Distingue estrictamente entre coincidencia incidental (citas legítimas o terminología técnica) y presunto plagio.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500/50 transition-colors">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Mejora y Humanización Ética
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Enriquece la redacción eliminando muletillas y variando cadencias sin alterar citas ni inventar datos. Descarga directa en <strong>documento_mejorado.docx</strong>.
          </p>
        </div>
      </section>

      {/* Tabla de Planes: Gratuito vs Premium Vitalicio */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Planes Transparentes y Accesibles
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sin suscripciones recurrentes ni costos ocultos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan Gratuito */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                Plan Gratuito
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-sm text-slate-500">/ día</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ideal para revisiones esporádicas y verificación de fragmentos breves.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>5 análisis por día</strong> (se reinicia automáticamente)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Análisis de texto pegado y documentos DOCX</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Detección de IA con indicadores detallados</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Asistente de mejora de redacción básica</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              className="w-full py-3 text-center rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block"
            >
              Comenzar Gratis
            </Link>
          </div>

          {/* Plan Premium Vitalicio */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-600/10 to-indigo-600/10 dark:from-blue-950/40 dark:to-indigo-950/40 border-2 border-blue-500 shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider">
              Oferta Especial
            </div>

            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                Premium Vitalicio
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$2</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  USD / Pago Único
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Desbloqueo de por vida. Sin renovación mensual ni cargos ocultos.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span><strong>Análisis ilimitados de por vida</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Procesamiento prioritario de documentos DOCX extensos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Descargas ilimitadas de <strong>documento_mejorado.docx</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Comparativas antes y después ilimitadas</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => (isAuthenticated ? openPremiumModal() : navigate('/register'))}
              className="w-full py-3.5 text-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 transition-all hover:scale-[1.01]"
            >
              Obtener Premium Vitalicio (US$2)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
