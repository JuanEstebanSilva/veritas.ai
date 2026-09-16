import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * El tema oscuro es el principal del sistema. Si el usuario no ha elegido,
 * se arranca en oscuro (index.html ya lo aplica antes de pintar para evitar
 * el destello); el conmutador del Navbar sigue permitiendo el claro.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('veritas_theme') as Theme | null;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* almacenamiento no disponible */ }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('veritas_theme', theme); } catch { /* sin almacenamiento */ }
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  return context;
};
