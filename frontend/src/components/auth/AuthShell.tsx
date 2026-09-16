import React from 'react';
import { Link } from 'react-router-dom';
import { PlagelioLogo } from '../brand';
import { sound } from '../../utils/soundEffects';

interface AuthShellProps {
  tone: 'azure' | 'human';
  headline: React.ReactNode;
  lede: string;
  /** Bloque inferior del panel editorial (cifras, lista, aviso) */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/** Hoja pequeña con un haz que la recorre despacio: la marca, sin palabras. */
const QuietSheet: React.FC<{ tone: 'azure' | 'human' }> = ({ tone }) => {
  const lines = [100, 92, 97, 58, 0, 96, 100, 71, 0, 100, 94, 99, 100, 47, 0, 98, 88, 62];
  return (
    <div className="sheet relative w-[188px] h-[236px] overflow-hidden px-6 pt-7" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-[24%] animate-beam" style={{ animationDelay: '0s', animationDuration: '6.5s', background: `linear-gradient(180deg, rgb(var(--${tone}) / 0) 0%, rgb(var(--${tone}) / .10) 60%, rgb(var(--${tone}) / .45) 100%)` }} />
      <div className="h-[6px] w-[40%] rounded-sm mb-5" style={{ background: 'rgb(var(--ink) / .3)' }} />
      <div className="flex flex-col gap-[5px]">
        {lines.map((w, i) => (w === 0 ? <div key={i} className="h-[6px]" /> : <div key={i} className="h-[5px] rounded-sm sheet-line" style={{ width: `${w}%` }} />))}
      </div>
    </div>
  );
};

/**
 * Marco de las pantallas de acceso: panel editorial a la izquierda con la
 * atmósfera del sistema, panel de formulario a la derecha. En móvil sólo se
 * muestra el formulario.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ tone, headline, lede, aside, children }) => {
  const glow = tone === 'azure' ? 'rgb(var(--azure) / .18)' : 'rgb(var(--human) / .14)';
  const glow2 = tone === 'azure' ? 'rgb(var(--gold) / .08)' : 'rgb(var(--azure) / .12)';

  return (
    <div className="flex flex-1 min-h-[calc(100vh-var(--nav-h))]">
      <section className="relative hidden lg:flex flex-1 flex-col justify-between px-16 py-14 overflow-hidden">
        <div className="glow" style={{ width: 900, height: 820, top: -300, left: -240, ['--glow-color' as string]: glow }} aria-hidden="true" />
        <div className="glow" style={{ width: 620, height: 560, bottom: -260, left: 140, ['--glow-color' as string]: glow2 }} aria-hidden="true" />
        <div className="grain" aria-hidden="true" />

        <Link to="/" onClick={() => sound.playClick()} className="relative self-start animate-rise rounded-md" aria-label="Inicio">
          <PlagelioLogo variant="compact" size="md" />
        </Link>

        <div className="relative grid grid-cols-[1fr_auto] items-end gap-10 max-w-[760px]">
          <div className="flex flex-col gap-8 animate-rise" style={{ animationDelay: '.14s' }}>
            <h1 className="text-d-3 font-light">{headline}</h1>
            <p className="text-[16.5px] leading-[1.7] text-mid max-w-[460px]">{lede}</p>
          </div>
          <div className="animate-rise hidden xl:block" style={{ animationDelay: '.3s', transform: 'rotate(-4deg)' }}><QuietSheet tone={tone} /></div>
        </div>

        <div className="relative animate-rise" style={{ animationDelay: '.26s' }}>{aside}</div>
      </section>

      <section className="relative w-full lg:w-[576px] lg:shrink-0 lg:border-l hair flex items-center justify-center px-5 sm:px-12 lg:px-[72px] py-12"
        style={{ background: 'linear-gradient(180deg, rgb(var(--base)), rgb(var(--ground)))' }}>
        <div className="w-full max-w-[440px] flex flex-col gap-8 animate-rise" style={{ animationDelay: '.2s' }}>
          {children}
        </div>
      </section>
    </div>
  );
};
