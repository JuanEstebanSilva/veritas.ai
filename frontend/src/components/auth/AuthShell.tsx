import React from 'react';
import { Link } from 'react-router-dom';
import { VeritasLogo } from '../brand/VeritasLogo';
import { sound } from '../../utils/soundEffects';

interface AuthShellProps {
  tone: 'azure' | 'human';
  headline: React.ReactNode;
  lede: string;
  /** Bloque inferior del panel editorial (cifras, lista, aviso) */
  aside?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Marco de las pantallas de acceso: panel editorial a la izquierda con la
 * atmósfera del sistema, panel de formulario a la derecha. En móvil sólo se
 * muestra el formulario.
 */
export const AuthShell: React.FC<AuthShellProps> = ({ tone, headline, lede, aside, children }) => {
  const glow = tone === 'azure' ? 'rgb(var(--azure) / .17)' : 'rgb(var(--human) / .13)';
  const glow2 = tone === 'azure' ? 'rgb(var(--gold) / .07)' : 'rgb(var(--azure) / .11)';

  return (
    <div className="flex flex-1 min-h-[calc(100vh-78px)]">
      <section className="relative hidden lg:flex flex-1 flex-col justify-between px-16 py-14 overflow-hidden">
        <div className="glow animate-breathe" style={{ width: 820, height: 760, top: -280, left: -220, background: glow }} aria-hidden="true" />
        <div className="glow" style={{ width: 580, height: 520, bottom: -240, left: 120, background: glow2 }} aria-hidden="true" />

        <Link to="/" onClick={() => sound.playClick()} className="relative self-start animate-rise" aria-label="Inicio">
          <VeritasLogo variant="compact" size="md" />
        </Link>

        <div className="relative flex flex-col gap-8 max-w-[580px] animate-rise" style={{ animationDelay: '.14s' }}>
          <h1 className="text-d-3 font-light">{headline}</h1>
          <p className="text-[16.5px] leading-[1.7] text-mid max-w-[460px]">{lede}</p>
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
