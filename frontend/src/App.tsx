import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Page, ScrollToTop } from './components/layout';
import { ModalCheckout } from './components/checkout';
import { AppLayout, AdminLayout } from './layouts';

// Cada página se carga al visitarla: las librerías de animación de una ruta
// (three.js y anime.js en la landing, las visualizaciones del informe en el
// analizador) no viajan en la carga inicial de las demás.
const LandingPage = lazy(() => import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const UserDashboard = lazy(() => import('./pages/UserDashboard').then((m) => ({ default: m.UserDashboard })));
const AnalyzerPage = lazy(() => import('./pages/AnalyzerPage').then((m) => ({ default: m.AnalyzerPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

/** Mientras llega el código de la ruta: un hueco del alto de la página, sin parpadeos. */
const Lazy: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<div className="flex-1 min-h-[60vh]" aria-busy="true" />}>{children}</Suspense>
);

export const App: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-ground text-hi">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-primary btn-sm">Saltar al contenido</a>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Page key={location.pathname}><Lazy><LandingPage /></Lazy></Page>} />
        <Route path="/login" element={<Page key={location.pathname}><Lazy><LoginPage /></Lazy></Page>} />
        <Route path="/register" element={<Page key={location.pathname}><Lazy><RegisterPage /></Lazy></Page>} />

        <Route path="/dashboard" element={<AppLayout><Lazy><UserDashboard /></Lazy></AppLayout>} />
        <Route path="/analyzer" element={<AppLayout><Lazy><AnalyzerPage /></Lazy></AppLayout>} />
        <Route path="/history" element={<AppLayout><Lazy><HistoryPage /></Lazy></AppLayout>} />

        <Route path="/admin" element={<AdminLayout><Lazy><AdminDashboard /></Lazy></AdminLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ModalCheckout />
    </div>
  );
};
