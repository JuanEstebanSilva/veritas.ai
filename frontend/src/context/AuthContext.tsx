import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { User } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  /** Cierto mientras se comprueba una sesión guardada. */
  loading: boolean;
  /** Mensaje si la sesión guardada no pudo verificarse por un fallo de red o del servidor. */
  authError: string | null;
  /** Cierto justo después de que el usuario cierre sesión a propósito (evita el aviso de «debes iniciar sesión»). */
  loggedOut: boolean;
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
const TOKEN_KEY = 'plagelio_token';
const LEGACY_TOKEN_KEY = 'veritas_token';

const readToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  // Sólo hay algo que comprobar si existe un token guardado.
  const [loading, setLoading] = useState<boolean>(() => !!readToken());
  const [authError, setAuthError] = useState<string | null>(null);
  const [loggedOut, setLoggedOut] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState<boolean>(false);
  const requestId = useRef(0);

  /** Limpia la sesión. `byUser` distingue el cierre voluntario de un token caducado. */
  const clearSession = useCallback((byUser: boolean) => {
    requestId.current += 1;
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);
    } catch { /* sin almacenamiento */ }
    setToken(null);
    setUser(null);
    setAuthError(null);
    setLoading(false);
    setLoggedOut(byUser);
    setIsPremiumModalOpen(false);
  }, []);
  const logout = useCallback(() => clearSession(true), [clearSession]);

  const refreshProfile = useCallback(async () => {
    const current = readToken();
    if (!current) { setUser(null); setLoading(false); return; }
    const id = ++requestId.current;
    setAuthError(null);
    const res = await authApi.getProfile();
    if (id !== requestId.current) return; // respuesta obsoleta (hubo logout o un login posterior)
    if (res.data?.success && res.data.user) {
      setUser(res.data.user);
    } else if (res.status === 401 || res.status === 403) {
      // Token inválido o caducado: se cierra la sesión y el login lo avisa.
      clearSession(false);
      return;
    } else {
      // Fallo de red o del servidor: se conserva el token y se informa.
      setAuthError(res.error || 'No se pudo verificar la sesión.');
    }
    setLoading(false);
  }, [clearSession]);

  useEffect(() => { refreshProfile(); }, [token, refreshProfile]);

  const persist = (t: string, u: User) => {
    try { localStorage.setItem(TOKEN_KEY, t); } catch { /* sin almacenamiento */ }
    requestId.current += 1;
    setUser(u);
    setAuthError(null);
    setLoggedOut(false);
    setLoading(false);
    setToken(t);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    if (res.data?.success && res.data.token) {
      persist(res.data.token, res.data.user);
      return { success: true, user: res.data.user };
    }
    return { success: false, message: res.error || 'Error al iniciar sesión.' };
  }, []);

  const register = useCallback(async (data: { name: string; last_name: string; email: string; password: string; confirm_password: string }) => {
    const res = await authApi.register(data);
    if (res.data?.success && res.data.token) {
      persist(res.data.token, res.data.user);
      return { success: true };
    }
    return { success: false, message: res.error || 'Error al registrar usuario.' };
  }, []);

  const openPremiumModal = useCallback(() => setIsPremiumModalOpen(true), []);
  const closePremiumModal = useCallback(() => setIsPremiumModalOpen(false), []);

  const value = useMemo<AuthContextType>(() => ({
    user, token, loading, authError, loggedOut, isPremiumModalOpen, openPremiumModal, closePremiumModal,
    login, register, logout, refreshProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isPremium: !!user?.is_premium,
  }), [user, token, loading, authError, loggedOut, isPremiumModalOpen, openPremiumModal, closePremiumModal, login, register, logout, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  return context;
};
