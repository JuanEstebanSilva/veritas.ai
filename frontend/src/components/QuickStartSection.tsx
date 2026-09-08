import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Terminal,
  Copy,
  Check,
  Shield,
  User,
  Key,
  Mail,
  Database,
  Play,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Server,
  Laptop,
  Flame,
  ArrowRight,
} from 'lucide-react';

export const QuickStartSection: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const backendCommands = `cd backend
npm install
npx prisma db push
npm run seed
npm run dev`;

  const frontendCommands = `cd frontend
npm install
npm run dev`;

  const testCommands = `cd backend
npm test`;

  return (
    <section id="guia-inicio" className="scroll-mt-20 space-y-12">
      {/* Encabezado Principal */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
          <BookOpen className="w-4 h-4 text-emerald-500" />
          <span>Guía de Inicio Rápido & Puesta en Marcha</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Paso a Paso para Correr el Aplicativo
        </h2>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          Sigue esta guía secuencial para inicializar la base de datos, levantar los servidores de Backend y Frontend, y acceder con los roles predeterminados.
        </p>
      </div>

      {/* 1. Breve Explicación del Proyecto */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/60 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              ¿Qué es Veritas AI? (En Breve)
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
              Plataforma inspirada en Turnitin, Grammarly y QuillBot
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <strong>Veritas AI</strong> es una solución integral que evalúa la autenticidad académica y profesional de textos y archivos <strong>.DOCX</strong>.
          Implementa detección estilométrica de inteligencia artificial basada en <em>perplejidad</em> y <em>burstiness</em> (variabilidad léxica y uniformidad sintáctica),
          calcula índices rigurosos de similitud distinguiendo citas legítimas de coincidencias no atribuidas, y cuenta con un asistente ético de mejora de redacción que genera documentos descargables en formato nativo.
        </p>

        <div className="flex flex-wrap gap-2 pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Detección de IA por Estilometría
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" /> Similitud & Citas Académicas
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Procesamiento DOCX Nativo
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" /> 5 Análisis Diarios Gratis / Premium $2
          </span>
        </div>
      </div>

      {/* 2. Credenciales Predeterminadas (ADMIN y USUARIO DEMO) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              Credenciales Predeterminadas para Pruebas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generadas de forma automática al ejecutar el comando de seed en el backend.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta ADMIN */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-900/60 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Rol Administrador
                  </h4>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    Acceso Total & Gestión
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-extrabold uppercase">
                ADMIN
              </span>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo:
                </span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-800 dark:text-slate-200">admin@veritas.ai</strong>
                  <button
                    onClick={() => copyToClipboard('admin@veritas.ai', 'admin-email')}
                    title="Copiar correo"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {copiedKey === 'admin-email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Clave:
                </span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-800 dark:text-slate-200">Admin123!Secure*</strong>
                  <button
                    onClick={() => copyToClipboard('Admin123!Secure*', 'admin-pass')}
                    title="Copiar contraseña"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {copiedKey === 'admin-pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Privilegios:</strong> Panel exclusivo con métricas del sistema, auditoría de transacciones y gestión completa (CRUD) de usuarios.
            </p>

            <Link
              to="/login?demo=admin"
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
            >
              <span>Iniciar Sesión como Administrador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Tarjeta USUARIO DEMO */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-200 dark:border-blue-900/60 shadow-md space-y-4 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white">
                    Rol Usuario Regular (Demo)
                  </h4>
                  <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                    5 Análisis Diarios Gratis
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-[11px] font-extrabold uppercase">
                USER
              </span>
            </div>

            <div className="space-y-2.5 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-mono">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Correo:
                </span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-800 dark:text-slate-200">usuario@veritas.ai</strong>
                  <button
                    onClick={() => copyToClipboard('usuario@veritas.ai', 'user-email')}
                    title="Copiar correo"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {copiedKey === 'user-email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Clave:
                </span>
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-800 dark:text-slate-200">User123!Secure*</strong>
                  <button
                    onClick={() => copyToClipboard('User123!Secure*', 'user-pass')}
                    title="Copiar contraseña"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    {copiedKey === 'user-pass' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>Privilegios:</strong> 5 análisis diarios gratuitos con contador en tiempo real y opción de simular pase Premium Vitalicio por US$2.
            </p>

            <Link
              to="/login?demo=user"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.01]"
            >
              <span>Iniciar Sesión como Usuario Demo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Los 3 Pasos de Ejecución */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          Instrucciones de Ejecución Paso a Paso
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PASO 1: Backend */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-blue-500/20">
                  1
                </span>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  <Server className="w-3.5 h-3.5" /> Backend & DB
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Configurar y Levantar Backend
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Asegúrate de tener PostgreSQL activo en el puerto 5432. Luego ejecuta en una terminal:
              </p>

              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                  {backendCommands}
                </pre>
                <button
                  onClick={() => copyToClipboard(backendCommands, 'cmd-backend')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copiar comandos"
                >
                  {copiedKey === 'cmd-backend' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              API REST corriendo en: <span className="font-mono text-blue-600 dark:text-blue-400">http://localhost:5000</span>
            </div>
          </div>

          {/* PASO 2: Frontend */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                  2
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  <Laptop className="w-3.5 h-3.5" /> Frontend App
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Levantar Interfaz de Usuario
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Abre una <strong>segunda terminal</strong> en la raíz del proyecto y ejecuta:
              </p>

              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                  {frontendCommands}
                </pre>
                <button
                  onClick={() => copyToClipboard(frontendCommands, 'cmd-frontend')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copiar comandos"
                >
                  {copiedKey === 'cmd-frontend' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Web App disponible en: <span className="font-mono text-indigo-600 dark:text-indigo-400">http://localhost:5173</span>
            </div>
          </div>

          {/* PASO 3: Tests */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                  3
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> 21 Tests Jest
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Validar Suite de Pruebas
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                Para verificar autenticación, límites 429, roles y pagos:
              </p>

              <div className="relative group">
                <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                  {testCommands}
                </pre>
                <button
                  onClick={() => copyToClipboard(testCommands, 'cmd-tests')}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Copiar comandos"
                >
                  {copiedKey === 'cmd-tests' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
              Resultado esperado: <span className="font-semibold text-emerald-600">21 tests pasados (100%)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
