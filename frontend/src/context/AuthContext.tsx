import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isPremiumModalOpen: boolean;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  register: (data: { name: string; last_name: string; email: string; password: string; confirm_password: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('veritas_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);

  const refreshProfile = async () => {
    if (!localStorage.getItem('veritas_token')) {
      setUser(null);
      setLoading(false);
      return;
    }
    const res = await authApi.getProfile();
    if (res.data?.success && res.data.user) {
      setUser(res.data.user);
    } else {
      // Si el token es inválido o expiró
      logout();
    }
    setLoading(false);
  };

  useEffect(() => {
    refreshProfile();
  }, [token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await authApi.login({ email, password });
    setLoading(false);

    if (res.data?.success && res.data.token) {
      localStorage.setItem('veritas_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }

    return {
      success: false,
      message: res.error || 'Error al iniciar sesión.',
    };
  };

  const register = async (data: {
    name: string;
    last_name: string;
    email: string;
    password: string;
    confirm_password: string;
  }) => {
    setLoading(true);
    const res = await authApi.register(data);
    setLoading(false);

    if (res.data?.success && res.data.token) {
      localStorage.setItem('veritas_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return { success: true };
    }

    return {
      success: false,
      message: res.error || 'Error al registrar usuario.',
    };
  };

  const logout = () => {
    localStorage.removeItem('veritas_token');
    setToken(null);
    setUser(null);
  };

  const openPremiumModal = () => setIsPremiumModalOpen(true);
  const closePremiumModal = () => setIsPremiumModalOpen(false);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isPremium = !!user?.is_premium;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isPremiumModalOpen,
        openPremiumModal,
        closePremiumModal,
        login,
        register,
        logout,
        refreshProfile,
        isAuthenticated,
        isAdmin,
        isPremium,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
