import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileSearch,
  History,
  Crown,
  ShieldAlert,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isPremium, openPremiumModal } = useAuth();

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between p-4 border-r border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navegación Principal */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Menú Principal
          </div>

          <NavLink to="/dashboard" className={navClasses}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/analyzer" className={navClasses}>
            <FileSearch className="w-4 h-4" />
            <span>Analizar Contenido</span>
          </NavLink>

          <NavLink to="/history" className={navClasses}>
            <History className="w-4 h-4" />
            <span>Historial de Análisis</span>
          </NavLink>
        </div>

        {/* Sección de Administrador (Solo si es ADMIN) */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Gestión Administrativa
            </div>

            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Panel de Usuarios</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Tarjeta de Estado de Cuenta / Upgrade Premium */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {isPremium ? (
          <div className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-center">
            <Crown className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Membresía Premium Vitalicia
            </div>
            <p className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-0.5">
              Análisis ilimitados activados
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Uso Gratuito Diario
              </span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                {user?.daily_analysis_count || 0}/5
              </span>
            </div>

            {/* Barra de progreso de uso */}
            <div className="w-full bg-blue-200/60 dark:bg-blue-900/60 rounded-full h-2 mb-3 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-400 h-full rounded-full transition-all"
                style={{ width: `${Math.min(((user?.daily_analysis_count || 0) / 5) * 100, 100)}%` }}
              />
            </div>

            <button
              onClick={openPremiumModal}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
              <span>Desbloquear Todo ($2)</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-2">
          <span>Veritas AI v1.0</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En línea
          </span>
        </div>
      </div>
    </aside>
  );
};
