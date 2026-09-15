import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from '../components/layout';
import { Loader2 } from 'lucide-react';

/** Área de administración: exige rol ADMIN además de sesión. */
export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-azure" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login?notice=unauthenticated" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative flex flex-1">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="glow" style={{ width: 900, height: 700, top: -380, right: -260, background: 'rgb(var(--gold) / .08)' }} />
      </div>
      <div className="wrap !max-w-[1440px] relative flex flex-1">
        <Sidebar />
        <main key={location.pathname} className="flex-1 min-w-0 py-8 md:pl-8 lg:pl-10 animate-page-in">
          {children}
        </main>
      </div>
    </div>
  );
};
