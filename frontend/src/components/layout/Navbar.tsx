import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { PlagelioLogo } from '../brand';
import { sound } from '../../utils/soundEffects';
import { Sun, Moon, LogOut, Volume2, VolumeX, Menu, X } from 'lucide-react';

const linkBase =
  'relative text-[14px] font-medium transition-colors duration-240 ease-out after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-azure after:transition-transform after:duration-450 after:ease-out';
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'text-hi after:scale-x-100' : 'text-mid hover:text-hi'}`;

/**
 * Navegación superior. Altura constante (--nav-h) para que condensarse al
 * hacer scroll nunca mueva el contenido: sólo cambian fondo, filete y
 * desenfoque. Mantiene enlaces por rol, sonido, tema, cuota diaria y acceso
 * a Premium, perfil y cierre de sesión.
 */
export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isPremium, logout, openPremiumModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [soundActive, setSoundActive] = useState(sound.isEnabled());
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const stuckRef = useRef(false);

  // Umbral con histéresis (24 ↓ / 8 ↑) para que nunca parpadee cerca del límite.
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      const next = stuckRef.current ? y > 8 : y > 24;
      if (next !== stuckRef.current) { stuckRef.current = next; setStuck(next); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // Cierra el menú móvil al navegar y con Escape
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleToggleSound = () => setSoundActive(sound.toggle());
  const handleLogout = useCallback(() => {
    sound.playClick();
    setMenuOpen(false);
    // Ruta y sesión cambian en la misma transición: la ruta protegida no
    // llega a redirigir por su cuenta y no hay doble navegación.
    startTransition(() => {
      navigate('/login', { replace: true });
      logout();
    });
  }, [navigate, logout]);
  const click = () => sound.playClick();

  const links = isAuthenticated ? (
    <>
      <NavLink to="/dashboard" onClick={click} className={linkClass}>Panel</NavLink>
      <NavLink to="/analyzer" onClick={click} className={linkClass}>Analizar</NavLink>
      <NavLink to="/history" onClick={click} className={linkClass}>Historial</NavLink>
      {isAdmin && <NavLink to="/admin" onClick={click} className={linkClass}>Administración</NavLink>}
    </>
  ) : null;

  const quota = isAuthenticated && user ? (
    isPremium ? (
      <span className="hidden sm:inline-flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
        <span className="status-dot" style={{ color: 'rgb(var(--gold) / .18)', background: 'rgb(var(--gold))' }} />
        Vitalicio
      </span>
    ) : (
      <button
        type="button"
        onClick={() => { sound.playClick(); openPremiumModal(); }}
        title="Desbloquea análisis ilimitados por $2 USD"
        className="btn btn-ghost btn-sm gap-3"
      >
        <span className="num text-[13px]">{user.daily_analysis_count}<span className="text-low">/5</span></span>
        <span className="hidden lg:inline text-azure">Desbloquear</span>
      </button>
    )
  ) : null;

  return (
    <header
      className={`sticky top-0 z-40 w-full h-[var(--nav-h)] border-b transition-[background-color,border-color,backdrop-filter] duration-450 ease-out ${
        stuck || menuOpen ? 'bg-ground/75 backdrop-blur-xl hair' : 'border-transparent bg-transparent'
      }`}
    >
      <div className="wrap h-full flex items-center justify-between gap-6">
        <Link to="/" onClick={click} className="shrink-0 rounded-md" aria-label="Inicio de Plagelio">
          <PlagelioLogo variant="compact" size="md" />
        </Link>

        {links && <nav aria-label="Principal" className="hidden md:flex items-center gap-8">{links}</nav>}

        <div className="flex items-center gap-0.5 sm:gap-2">
          <button type="button" onClick={handleToggleSound} aria-label={soundActive ? 'Desactivar sonidos' : 'Activar sonidos'} aria-pressed={soundActive} title={soundActive ? 'Sonidos activos' : 'Sonidos silenciados'} className="btn-icon">
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button type="button" onClick={() => { sound.playToggle(); toggleTheme(); }} aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema claro / oscuro" className="btn-icon relative">
            <Sun className={`absolute w-4 h-4 transition-[opacity,transform] duration-450 ease-out ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
            <Moon className={`absolute w-4 h-4 transition-[opacity,transform] duration-450 ease-out ${theme === 'dark' ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
          </button>

          {quota}

          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-2 pl-3 ml-1 border-l hair">
              <div className="text-right leading-tight">
                <div className="text-[13px] font-semibold text-hi">{user.name}</div>
                <div className="text-[11px] text-low">{isAdmin ? 'Administrador' : isPremium ? 'Premium' : 'Estándar'}</div>
              </div>
              <button type="button" onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión" className="btn-icon hover:!text-ai hover:!bg-ai/10">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <Link to="/login" onClick={click} className="btn btn-quiet btn-sm px-3">Acceder</Link>
              <Link to="/register" onClick={click} className="btn btn-ghost btn-sm">Crear cuenta</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="md:hidden btn-icon text-mid"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Menú móvil: panel bajo la cabecera con velo que cierra al tocar */}
      <div
        id="mobile-menu"
        className={`md:hidden fixed inset-x-0 top-[var(--nav-h)] bottom-0 z-40 transition-[opacity,visibility] duration-240 ease-out ${menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div className="absolute inset-0 bg-ground/60" onClick={() => setMenuOpen(false)} />
        <div className={`relative border-t hair bg-ground/95 backdrop-blur-xl transition-transform duration-320 ease-drawer ${menuOpen ? 'translate-y-0' : '-translate-y-3'}`}>
          <div className="wrap py-5 flex flex-col gap-5">
            {links ? (
              <nav aria-label="Principal (móvil)" className="flex flex-col gap-4 text-[15px]">{links}</nav>
            ) : (
              <div className="flex flex-col gap-3">
                <Link to="/login" onClick={click} className="btn btn-ghost w-full">Acceder</Link>
                <Link to="/register" onClick={click} className="btn btn-primary w-full">Crear cuenta</Link>
              </div>
            )}
            {isAuthenticated && user && (
              <div className="flex items-center justify-between pt-4 border-t hair">
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-hi">{user.name} {user.last_name}</div>
                  <div className="text-[11px] text-low">{isAdmin ? 'Administrador' : isPremium ? 'Premium vitalicio' : `${user.daily_analysis_count}/5 análisis hoy`}</div>
                </div>
                <button type="button" onClick={handleLogout} className="btn btn-ghost btn-sm">
                  <LogOut className="w-4 h-4" /> Salir
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
