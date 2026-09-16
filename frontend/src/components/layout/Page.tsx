import React, { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Contenedor de página pública con entrada suave al montarse. */
export const Page: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div id="content" className={`page-in flex flex-1 flex-col ${className}`}>{children}</div>
);

/**
 * Al cambiar de ruta, vuelve arriba de forma instantánea (sin scroll suave,
 * que aquí se percibiría como un temblor) y devuelve el foco al contenido.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};
