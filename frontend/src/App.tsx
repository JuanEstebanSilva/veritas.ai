import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout';
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
  return (
    <div className="min-h-screen flex flex-col bg-ground text-hi transition-colors duration-600">
      <div className="grain" aria-hidden="true" />
      <Navbar />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
