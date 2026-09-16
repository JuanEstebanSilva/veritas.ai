import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { sound } from '../../utils/soundEffects';
import { LayoutDashboard, FileSearch, History, ShieldCheck, Users } from 'lucide-react';

const item = ({ isActive }: { isActive: boolean }) =>
  `group relative flex items-center gap-3 h-11 pl-4 pr-3 rounded-xl text-[14px] font-medium transition-[color,background-color] duration-240 ease-out ${
    isActive ? 'text-hi bg-hair' : 'text-mid hover:text-hi hover:bg-hair'
  }`;

const Bar: React.FC<{ active: boolean; tone?: 'azure' | 'gold' }> = ({ active, tone = 'azure' }) => (
  <span
    aria-hidden="true"
    className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-full transition-[opacity,transform] duration-450 ease-out ${
      active ? (tone === 'gold' ? 'bg-gold' : 'bg-azure') + ' opacity-100 scale-y-100' : 'opacity-0 scale-y-50'
    }`}
  />
);

/**
 * Barra lateral del área autenticada. Mantiene navegación, sección de
 * administración por rol, cuota diaria con acceso a Premium y estado de licencia.
 */
export const Sidebar: React.FC = () => {
  const { user, isAdmin, isPremium, openPremiumModal } = useAuth();
  const used = user?.daily_analysis_count || 0;
  const pct = Math.min(used / 5, 1);
  const click = () => sound.playClick();

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col justify-between py-6 pr-6 border-r hair min-h-[calc(100vh-var(--nav-h))]" aria-label="Secciones">
      <div className="flex flex-col gap-8">
        <nav className="flex flex-col gap-1" aria-label="Navegación">
          <span className="eyebrow px-4 pb-3">Navegación</span>
          <NavLink to="/dashboard" onClick={click} className={item}>
            {({ isActive }) => (<><Bar active={isActive} /><LayoutDashboard className="w-4 h-4" strokeWidth={1.6} /><span>Panel</span></>)}
          </NavLink>
          <NavLink to="/analyzer" onClick={click} className={item}>
            {({ isActive }) => (<><Bar active={isActive} /><FileSearch className="w-4 h-4" strokeWidth={1.6} /><span>Analizador</span></>)}
          </NavLink>
          <NavLink to="/history" onClick={click} className={item}>
            {({ isActive }) => (<><Bar active={isActive} /><History className="w-4 h-4" strokeWidth={1.6} /><span>Historial</span></>)}
          </NavLink>
        </nav>

        {isAdmin && (
          <nav className="flex flex-col gap-1 pt-6 border-t hair" aria-label="Administración">
            <span className="eyebrow px-4 pb-3 text-gold">Administración</span>
            <NavLink to="/admin" onClick={click} className={item}>
              {({ isActive }) => (<><Bar active={isActive} tone="gold" /><Users className="w-4 h-4" strokeWidth={1.6} /><span>Usuarios y métricas</span></>)}
            </NavLink>
          </nav>
        )}
      </div>

      <div className="flex flex-col gap-5 pt-6 border-t hair">
        {isPremium ? (
          <div className="flex items-start gap-3 px-1">
            <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" strokeWidth={1.6} />
            <div className="flex flex-col gap-1">
              <span className="text-[13px] font-semibold text-hi">Licencia vitalicia</span>
              <span className="text-[12px] text-low leading-relaxed">Análisis y descargas sin límite</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-1">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Cuota de hoy</span>
              <span className="num text-[13px] text-hi">{used}<span className="text-low">/5</span></span>
            </div>
            <div className="h-[3px] rounded-full bg-hair overflow-hidden" role="progressbar" aria-valuenow={used} aria-valuemin={0} aria-valuemax={5} aria-label="Análisis usados hoy">
              <div className="h-full w-full rounded-full bg-azure origin-left transition-transform duration-900 ease-out" style={{ transform: `scaleX(${pct})` }} />
            </div>
            <button type="button" onClick={() => { sound.playClick(); openPremiumModal(); }} className="btn btn-primary btn-sm w-full">
              Licencia vitalicia · $2
            </button>
          </div>
        )}

        <div className="flex items-center justify-between px-1 text-[11px] text-low">
          <span className="font-mono">v1.2</span>
          <span className="inline-flex items-center gap-2">
            <span className="h-[5px] w-[5px] rounded-full bg-human" />
            Sistema seguro
          </span>
        </div>
      </div>
    </aside>
  );
};

/** Barra inferior para móvil: las mismas secciones, al alcance del pulgar. */
export const MobileTabBar: React.FC = () => {
  const { isAdmin } = useAuth();
  const click = () => sound.playClick();
  const tab = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10.5px] font-semibold tracking-[0.02em] transition-colors duration-240 ${isActive ? 'text-azure' : 'text-low'}`;
  return (
    <nav aria-label="Secciones" className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t hair bg-ground/90 backdrop-blur-xl" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-stretch h-14">
        <NavLink to="/dashboard" onClick={click} className={tab}><LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={1.7} />Panel</NavLink>
        <NavLink to="/analyzer" onClick={click} className={tab}><FileSearch className="w-[18px] h-[18px]" strokeWidth={1.7} />Analizar</NavLink>
        <NavLink to="/history" onClick={click} className={tab}><History className="w-[18px] h-[18px]" strokeWidth={1.7} />Historial</NavLink>
        {isAdmin && <NavLink to="/admin" onClick={click} className={tab}><Users className="w-[18px] h-[18px]" strokeWidth={1.7} />Admin</NavLink>}
      </div>
    </nav>
  );
};
