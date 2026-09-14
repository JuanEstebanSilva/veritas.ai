import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../utils/soundEffects';
import {
  LayoutDashboard,
  FileSearch,
  History,
  Crown,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, isAdmin, isPremium, openPremiumModal } = useAuth();

  const navClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
    }`;

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between p-4 border-r border-slate-200/90 dark:border-slate-800/90 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        {/* Navegación Principal */}
        <div className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Navegación
          </div>

          <NavLink to="/dashboard" onClick={() => sound.playClick()} className={navClasses}>
            <span className="text-base">📊</span>
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/analyzer" onClick={() => sound.playClick()} className={navClasses}>
            <span className="text-base">🔍</span>
            <span>Analizador de Textos</span>
          </NavLink>

          <NavLink to="/history" onClick={() => sound.playClick()} className={navClasses}>
            <span className="text-base">🕒</span>
            <span>Registro de Auditorías</span>
          </NavLink>
        </div>

        {/* Sección de Administrador (Solo si es ADMIN) */}
        {isAdmin && (
          <div className="space-y-1 pt-4 border-t border-slate-200/80 dark:border-slate-800">
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
              <span>🛡️</span>
              <span>Administración</span>
            </div>

            <NavLink
              to="/admin"
              onClick={() => sound.playClick()}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-600 text-white font-bold shadow-sm'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                }`
              }
            >
              <span className="text-base">👑</span>
              <span>Control de Usuarios</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* Tarjeta de Estado de Cuenta / Licencia */}
      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
        {isPremium ? (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-1">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
              Licencia Vitalicia Activa
            </div>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
              Análisis y descargas ilimitadas
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Cuota Diaria
              </span>
              <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                {user?.daily_analysis_count || 0}/5
              </span>
            </div>

            {/* Barra de progreso sobria */}
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(((user?.daily_analysis_count || 0) / 5) * 100, 100)}%` }}
              />
            </div>

            <button
              onClick={() => { sound.playClick(); openPremiumModal(); }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Obtener Vitalicio ($2 USD)</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 px-2 font-medium">
          <span>Veritas AI • v1.2</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Sistema Seguro</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
