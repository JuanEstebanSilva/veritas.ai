import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar, Page, ScrollToTop } from './components/layout';
import { ModalCheckout } from './components/checkout';
import { AppLayout, AdminLayout } from './layouts';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/UserDashboard';
import { AnalyzerPage } from './pages/AnalyzerPage';
import { HistoryPage } from './pages/HistoryPage';
import { AdminDashboard } from './pages/AdminDashboard';

export const App: React.FC = () => {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-ground text-hi">
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 btn btn-primary btn-sm">Saltar al contenido</a>
      <ScrollToTop />
      <Navbar />

      <Routes>
        <Route path="/" element={<Page key={location.pathname}><LandingPage /></Page>} />
        <Route path="/login" element={<Page key={location.pathname}><LoginPage /></Page>} />
        <Route path="/register" element={<Page key={location.pathname}><RegisterPage /></Page>} />

        <Route path="/dashboard" element={<AppLayout><UserDashboard /></AppLayout>} />
        <Route path="/analyzer" element={<AppLayout><AnalyzerPage /></AppLayout>} />
        <Route path="/history" element={<AppLayout><HistoryPage /></AppLayout>} />

        <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ModalCheckout />
    </div>
  );
};
