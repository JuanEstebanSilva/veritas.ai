import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Shield,
  Sparkles,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Crown,
  LayoutDashboard,
  FileSearch,
  History,
  ShieldAlert,
  Terminal,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isPremium, logout, openPremiumModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Marca */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                Veritas AI
              </span>
              <span className="hidden sm:inline-block ml-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                Turnitin Style
              </span>
            </div>
          </Link>

          {/* Botón Acceso Rápido a Guía de Inicio */}
          <a
            href="/#guia-inicio"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300/70 dark:border-emerald-800/80 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Cómo Correr</span>
          </a>
        </div>

        {/* Enlaces Principales de Navegación */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isActive('/dashboard')
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>

            <Link
              to="/analyzer"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isActive('/analyzer')
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              Analizar Contenido
            </Link>

            <Link
              to="/history"
              className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isActive('/history')
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              Historial
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isActive('/admin')
                    ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 font-semibold'
                    : 'text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                Panel Admin
              </Link>
            )}
          </nav>
        )}

        {/* Acciones de Usuario y Tema */}
        <div className="flex items-center gap-3">
          {/* Botón de Tema (Claro / Oscuro) */}
          <button
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {isAuthenticated && user ? (
            <>
              {/* Badge de Estado Premium o Límite Diario */}
              {isPremium ? (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Premium Vitalicio</span>
                </div>
              ) : (
                <button
                  onClick={openPremiumModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-medium transition-all group"
                  title="Haz clic para desbloquear análisis ilimitados por $2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform" />
                  <span>
                    {user.daily_analysis_count}/5 hoy
                  </span>
                  <span className="hidden lg:inline text-blue-600 font-semibold underline ml-1">
                    Obtener Premium ($2)
                  </span>
                </button>
              )}

              {/* Perfil & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {user.name} {user.last_name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isAdmin ? 'Administrador' : isPremium ? 'Usuario Premium' : 'Usuario Gratuito'}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Cerrar sesión"
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
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
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                Crear cuenta
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
