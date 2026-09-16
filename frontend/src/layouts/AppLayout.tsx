import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, MobileTabBar } from '../components/layout';
import { Skeleton } from '../components/ui';
import { WifiOff, RefreshCw } from 'lucide-react';

/** Esqueleto del área autenticada mientras se verifica la sesión. */
export const ShellSkeleton: React.FC = () => (
  <div className="wrap !max-w-[1440px] relative flex flex-1" aria-busy="true" aria-label="Verificando sesión">
    <div className="hidden md:flex w-64 shrink-0 flex-col gap-3 py-8 pr-6 border-r hair">
      <Skeleton className="h-3 w-24 mb-3" /><Skeleton className="h-11 w-full rounded-xl" /><Skeleton className="h-11 w-full rounded-xl" /><Skeleton className="h-11 w-full rounded-xl" />
    </div>
    <div className="flex-1 min-w-0 py-8 md:pl-8 lg:pl-10 flex flex-col gap-8">
      <div className="flex flex-col gap-3"><Skeleton className="h-3 w-16" /><Skeleton className="h-10 w-[52%] max-w-md" /><Skeleton className="h-3.5 w-[36%] max-w-xs" /></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      <Skeleton className="h-64 rounded-[20px]" />
    </div>
  </div>
);

/** Estado de sesión guardada que no pudo verificarse (red o servidor). */
export const ConnectionError: React.FC<{ message: string | null; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-1 items-center justify-center p-6">
    <div className="card max-w-md w-full p-8 flex flex-col items-center text-center gap-5">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mixed/10 text-mixed"><WifiOff className="h-5 w-5" strokeWidth={1.6} /></span>
      <div className="flex flex-col gap-2">
        <h2 className="text-d-5 font-semibold">No se pudo verificar <span className="serif">tu sesión.</span></h2>
        <p className="text-[13.5px] leading-[1.6] text-mid">{message || 'El servidor no respondió.'} Tu sesión sigue guardada; vuelve a intentarlo cuando haya conexión.</p>
      </div>
      <button type="button" onClick={onRetry} className="btn btn-primary btn-sm"><RefreshCw className="h-4 w-4" strokeWidth={1.8} /> Reintentar</button>
    </div>
  </div>
);

/** Área autenticada: barra lateral + contenido, con entrada animada por ruta. */
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, token, authError, loggedOut, refreshProfile } = useAuth();
  const location = useLocation();

  if (loading) return <ShellSkeleton />;
  if (!isAuthenticated) {
    if (token && authError) return <ConnectionError message={authError} onRetry={refreshProfile} />;
    return <Navigate to={loggedOut ? '/login' : '/login?notice=unauthenticated'} replace />;
  }

  return (
    <div className="relative flex flex-1">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="glow" style={{ width: 900, height: 700, top: -380, left: -260, ['--glow-color' as string]: 'rgb(var(--azure) / .12)' }} />
      </div>
      <div className="wrap !max-w-[1440px] relative flex flex-1 gap-0">
        <Sidebar />
        <main id="content" key={location.pathname} className="flex-1 min-w-0 py-8 pb-28 md:pb-8 md:pl-8 lg:pl-10 page-in">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
};
