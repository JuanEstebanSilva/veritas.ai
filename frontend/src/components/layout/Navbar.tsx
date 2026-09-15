import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { VeritasLogo } from '../brand/VeritasLogo';
import { sound } from '../../utils/soundEffects';
import { Sun, Moon, LogOut, Volume2, VolumeX, Menu, X } from 'lucide-react';

const linkBase =
  'relative text-[14px] font-medium transition-colors duration-450 ease-out after:absolute after:left-0 after:-bottom-1.5 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-azure after:transition-transform after:duration-450 after:ease-out';
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'text-hi after:scale-x-100' : 'text-mid hover:text-hi'}`;

/**
 * Navegación superior. Se condensa al separarse del inicio de la página
 * (78 → 62px, gana fondo y filete). Mantiene: enlaces por rol, sonido, tema,
 * cuota diaria y acceso a Premium, perfil y cierre de sesión.
 */
export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, isPremium, logout, openPremiumModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [soundActive, setSoundActive] = useState(sound.isEnabled());
  const [stuck, setStuck] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Cierra el menú móvil al navegar
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  const handleToggleSound = () => setSoundActive(sound.toggle());
  const handleLogout = () => { sound.playClick(); logout(); navigate('/login'); };
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
      <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
        <span className="status-dot opacity-90" style={{ color: 'rgb(var(--gold) / .18)', background: 'rgb(var(--gold))' }} />
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
      className={`sticky top-0 z-40 w-full border-b transition-all duration-600 ease-out ${
        stuck ? 'bg-ground/75 backdrop-blur-2xl hair' : 'border-transparent bg-transparent'
      }`}
    >
      <div className={`wrap flex items-center justify-between gap-6 transition-all duration-600 ease-out ${stuck ? 'h-[62px]' : 'h-[78px]'}`}>
        <Link to="/" onClick={click} className="shrink-0" aria-label="Inicio de Veritas AI">
          <VeritasLogo variant="compact" size="md" />
        </Link>

        {links && <nav className="hidden md:flex items-center gap-8">{links}</nav>}

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={soundActive ? 'Desactivar sonidos' : 'Activar sonidos'}
            title={soundActive ? 'Sonidos activos' : 'Sonidos silenciados'}
            className="p-2 rounded-full text-low hover:text-hi hover:bg-hair transition-colors duration-450"
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => { sound.playToggle(); toggleTheme(); }}
            aria-label="Cambiar tema"
            title="Cambiar tema claro / oscuro"
            className="p-2 rounded-full text-low hover:text-hi hover:bg-hair transition-colors duration-450"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {quota}

          {isAuthenticated && user ? (
            <div className="hidden sm:flex items-center gap-3 pl-3 border-l hair">
              <div className="text-right leading-tight">
                <div className="text-[13px] font-semibold text-hi">{user.name}</div>
                <div className="text-[11px] text-low">{isAdmin ? 'Administrador' : isPremium ? 'Premium' : 'Estándar'}</div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="p-2 rounded-full text-low hover:text-ai hover:bg-ai/10 transition-colors duration-450"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login" onClick={click} className="btn btn-quiet btn-sm px-3">Acceder</Link>
              <Link to="/register" onClick={click} className="btn btn-ghost btn-sm">Crear cuenta</Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            className="md:hidden p-2 rounded-full text-mid hover:text-hi hover:bg-hair transition-colors duration-450"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t hair bg-ground/95 backdrop-blur-2xl animate-page-in">
          <div className="wrap py-5 flex flex-col gap-5">
            {links ? (
              <nav className="flex flex-col gap-4 text-[15px]">{links}</nav>
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
      )}
    </header>
  );
};
