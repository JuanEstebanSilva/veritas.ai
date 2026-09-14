import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { VeritasLogo } from '../brand/VeritasLogo';
import { sound } from '../../utils/soundEffects';
import {
  Sun,
  Moon,
  LogOut,
  Crown,
  LayoutDashboard,
  FileSearch,
  History,
  ShieldAlert,
  FileCheck,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isPremium, logout, openPremiumModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [soundActive, setSoundActive] = useState(sound.isEnabled());

  const handleToggleSound = () => {
    const newState = sound.toggle();
    setSoundActive(newState);
  };

  const handleLogout = () => {
    sound.playClick();
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Institucional Veritas AI */}
        <Link
          to="/"
          onClick={() => sound.playClick()}
          className="flex items-center gap-2 group focus:outline-none"
        >
          <VeritasLogo variant="compact" size="md" animate />
          <span className="hidden md:inline-flex items-center ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            Integridad Académica
          </span>
        </Link>

        {/* Enlaces Principales de Navegación */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <Link
              to="/dashboard"
              onClick={() => sound.playClick()}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/dashboard')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>📊</span>
              <span>Dashboard</span>
            </Link>

            <Link
              to="/analyzer"
              onClick={() => sound.playClick()}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/analyzer')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>🔍</span>
              <span>Analizar</span>
            </Link>

            <Link
              to="/history"
              onClick={() => sound.playClick()}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                isActive('/history')
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>🕒</span>
              <span>Historial</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => sound.playClick()}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  isActive('/admin')
                    ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold'
                    : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <span>🛡️</span>
                <span>Admin</span>
              </Link>
            )}
          </nav>
        )}

        {/* Controles de Sonido, Tema y Perfil */}
        <div className="flex items-center gap-2.5">
          {/* Botón de Silencio / Sonidos Táctiles */}
          <button
            onClick={handleToggleSound}
            aria-label={soundActive ? 'Desactivar sonidos' : 'Activar sonidos'}
            title={soundActive ? 'Sonidos activos (clic para silenciar)' : 'Sonidos silenciados (clic para activar)'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {soundActive ? <Volume2 className="w-4 h-4 text-blue-600 dark:text-blue-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Botón de Tema (Claro / Oscuro) */}
          <button
            onClick={() => { sound.playToggle(); toggleTheme(); }}
            aria-label="Cambiar tema"
            title="Cambiar tema claro / oscuro"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Badge de Estado Premium o Límite Diario */}
              {isPremium ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                  <span>👑</span>
                  <span>Vitalicio</span>
                </div>
              ) : (
                <button
                  onClick={() => { sound.playClick(); openPremiumModal(); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-all"
                  title="Haz clic para desbloquear análisis ilimitados por $2 USD"
                >
                  <span>⚡</span>
                  <span>{user.daily_analysis_count}/5 hoy</span>
                  <span className="hidden lg:inline font-bold underline ml-1 text-blue-800 dark:text-blue-200">
                    Desbloquear ($2) ✨
                  </span>
                </button>
              )}

              {/* Perfil & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
                    <span>{user.name}</span>
                    <span>{isPremium ? '⭐' : '👤'}</span>
                  </div>
                  <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {isAdmin ? '🛡️ Admin' : isPremium ? '👑 Premium' : '⚖️ Estándar'}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            /* Botones para usuarios no autenticados */
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                onClick={() => sound.playClick()}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                <span>🔑</span>
                <span>Iniciar sesión</span>
              </Link>
              <Link
                to="/register"
                onClick={() => sound.playClick()}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
              >
                <span>✨</span>
                <span>Crear cuenta</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
