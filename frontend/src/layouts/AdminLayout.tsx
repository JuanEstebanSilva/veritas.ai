import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar, MobileTabBar } from '../components/layout';
import { ShellSkeleton, ConnectionError } from './AppLayout';

/** Área de administración: exige rol ADMIN además de sesión. */
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading, token, authError, loggedOut, refreshProfile } = useAuth();
  const location = useLocation();

  if (loading) return <ShellSkeleton />;
  if (!isAuthenticated) {
    if (token && authError) return <ConnectionError message={authError} onRetry={refreshProfile} />;
    return <Navigate to={loggedOut ? '/login' : '/login?notice=unauthenticated'} replace />;
  }
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative flex flex-1">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="glow" style={{ width: 900, height: 700, top: -380, right: -260, ['--glow-color' as string]: 'rgb(var(--gold) / .1)' }} />
      </div>
      <div className="wrap !max-w-[1440px] relative flex flex-1">
        <Sidebar />
        <main id="content" key={location.pathname} className="flex-1 min-w-0 py-8 pb-28 md:pb-8 md:pl-8 lg:pl-10 page-in">
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
};
