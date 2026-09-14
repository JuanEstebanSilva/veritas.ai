import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VeritasLogo } from '../components/brand';
import { sound } from '../utils/soundEffects';
import {
  ShieldCheck,
  FileCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
  Search,
  Scale,
  PenTool,
  BarChart3,
  Award,
  Layers,
  BookOpen,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, openPremiumModal } = useAuth();
  const navigate = useNavigate();

  const handleStart = () => {
    sound.playClick();
    if (isAuthenticated) {
      navigate('/analyzer');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="space-y-28 py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Sección Hero Editorial */}
      <section className="text-center space-y-8 max-w-4xl mx-auto pt-6">
        {/* Badge Institucional */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 text-xs font-bold tracking-wide shadow-sm">
          <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Protocolo de Integridad Académica & Análisis Estilométrico</span>
        </div>

        {/* Logo destacado */}
        <div className="flex justify-center py-2">
          <VeritasLogo variant="full" size="xl" />
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          Auditoría de Autenticidad,{' '}
          <span className="text-blue-600 dark:text-blue-400 underline decoration-blue-500/30 underline-offset-8">
            Detección Estilométrica
          </span>{' '}
          y Verificación Documental.
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
          Plataforma de rigor metodológico inspirada en estándares editoriales como Turnitin y Grammarly. Evalúa perplejidad, uniformidad sintáctica y coincidencias bibliográficas en textos y documentos nativos <strong className="text-slate-900 dark:text-white font-bold">.DOCX</strong>.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={handleStart}
            className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 hover:scale-[1.015] active:scale-[0.985]"
          >
            <span>Iniciar Verificación Documental</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <Link
            to="/login"
            onClick={() => sound.playClick()}
            className="px-8 py-4 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Acceder al Sistema
          </Link>
        </div>

        {/* Sellos de Confianza Institucional */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-3">
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 5 análisis diarios sin costo
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Cifrado de documentos Word (.docx)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Sin almacenamiento de propiedad intelectual
          </span>
        </div>
      </section>

      {/* Muestra de Reporte de Auditoría (Mockup Editorial) */}
      <section className="max-w-5xl mx-auto rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider uppercase text-blue-600 dark:text-blue-400">
                Informe de Originalidad
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                Autenticidad Verificada
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Ensayo_Metodologia_Investigacion_2026.docx
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-black text-slate-900 dark:text-white">96.4%</div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Índice Humano</div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-200 dark:border-emerald-800">
              A+
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Perplejidad Lingüística</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">82.4 / 100</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Variabilidad de vocabulario alta y natural</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Burstiness (Cadencia)</span>
            <div className="text-xl font-black text-slate-900 dark:text-white">Elevada (0.78)</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Longitud de oraciones orgánica y heterogénea</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Citas Legítimas</span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">14 fuentes APA 7</div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Referencias cotejadas en repositorios abiertos</p>
          </div>
        </div>
      </section>

      {/* Los 3 Pilares Metodológicos */}
      <section className="space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Tres Pilares de Rigor Académico
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Una suite completa para investigadores, docentes, redactores y profesionales del texto.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pilar 1 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Análisis Estilométrico Probabilístico
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Detecta regularidades sintácticas, patrones de perplejidad y burstiness mediante algoritmos estadísticos rigurosos, identificando párrafos uniformes propios de modelos de lenguaje sin emitir veredictos binarios engañosos.
            </p>
          </div>

          {/* Pilar 2 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Cotejo Indexado de Similitud
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Compara contra repositorios abiertos y literatura académica. Separa estrictamente la coincidencia incidental (citas legítimas, fórmulas o terminología técnica estándar) de presunto plagio sin atribución.
            </p>
          </div>

          {/* Pilar 3 */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-blue-500 transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PenTool className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Reescritura Editorial Ética
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
              Asistente de edición de estilo que optimiza la cadencia de párrafos, elimina muletillas y aumenta la riqueza léxica sin distorsionar citas ni alterar el rigor de las fuentes. Descarga directa en Word (.docx).
            </p>
          </div>
        </div>
      </section>

      {/* Planes Transparentes */}
      <section className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Tarifas Claras y Sin Suscripciones
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Pagas una sola vez por acceso vitalicio o usas la cuota diaria sin costo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Plan Gratuito */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                Uso Estándar
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-sm text-slate-500">/ permanente</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Ideal para consultas esporádicas y verificación de textos académicos cortos.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>5 análisis por día</strong> con reinicio automático a las 00:00 UTC</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Soporte para texto plano y archivos .docx</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Métricas de perplejidad y similitud</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Sugerencias básicas de edición</span>
                </li>
              </ul>
            </div>

            <Link
              to="/register"
              onClick={() => sound.playClick()}
              className="w-full py-3.5 text-center rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors block"
            >
              Comenzar sin Costo
            </Link>
          </div>

          {/* Plan Premium Vitalicio */}
          <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-2xl flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase tracking-wider">
              Pago Único
            </div>

            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold">
                Licencia Vitalicia
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-white">$2</span>
                <span className="text-sm font-semibold text-slate-400">
                  USD / De por vida
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Desbloqueo permanente sin cobros recurrentes ni suscripciones ocultas.
              </p>

              <ul className="space-y-3 text-xs text-slate-200 pt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>Análisis ilimitados para siempre</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Procesamiento prioritario de tesis y documentos DOCX extensos</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Descargas ilimitadas de <strong>documento_mejorado.docx</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Garantía de reembolso de 30 días</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                if (isAuthenticated) {
                  openPremiumModal();
                } else {
                  navigate('/register');
                }
              }}
              className="w-full py-3.5 text-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md transition-all hover:scale-[1.01]"
            >
              Adquirir Licencia Vitalicia ($2 USD)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
