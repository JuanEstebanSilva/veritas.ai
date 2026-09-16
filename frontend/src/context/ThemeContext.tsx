import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const STORAGE_KEY = 'veritas_theme';
const META_COLOR: Record<Theme, string> = { dark: '#06070a', light: '#f7f7f9' };

const readStored = (): Theme => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* almacenamiento no disponible */ }
  return 'dark';
};

let themingTimer = 0;

/**
 * Aplica el tema al documento. `animate` añade durante medio segundo la clase
 * `theming`, que transiciona colores en todo el árbol (ver index.css), para
 * que el cambio se sienta como un fundido y no como un corte.
 */
const applyTheme = (theme: Theme, animate: boolean) => {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theming');
    window.clearTimeout(themingTimer);
    themingTimer = window.setTimeout(() => root.classList.remove('theming'), 520);
  }
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = META_COLOR[theme];
};

/**
 * El tema oscuro es el principal del sistema. Si el usuario no ha elegido,
 * se arranca en oscuro (index.html ya lo aplica antes de pintar para evitar
 * el destello); el conmutador del Navbar sigue permitiendo el claro.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(readStored);

  // Primer montaje: sin animación (index.html ya pintó el tema correcto).
  useEffect(() => { applyTheme(theme, false); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setTheme = useCallback((t: Theme) => {
    setThemeState((prev) => {
      if (prev === t) return prev;
      applyTheme(t, true);
      try { localStorage.setItem(STORAGE_KEY, t); } catch { /* sin almacenamiento */ }
      return t;
    });
  }, []);

  const toggleTheme = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  // Sincroniza el tema entre pestañas.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      if (e.newValue === 'light' || e.newValue === 'dark') { applyTheme(e.newValue, true); setThemeState(e.newValue); }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme, setTheme }), [theme, toggleTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  return context;
};
