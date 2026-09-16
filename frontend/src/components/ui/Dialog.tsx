import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Id del elemento que da nombre al diálogo. */
  labelledBy?: string;
  /** Nombre accesible directo cuando no hay un titular visible. */
  label?: string;
  /** Si es falso, ni Escape ni el fondo cierran (procesos que no deben interrumpirse). */
  dismissible?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Clases extra del panel. */
  className?: string;
  children: React.ReactNode;
}

const SIZES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lockCount = 0;
const lockScroll = () => {
  if (lockCount++ > 0) return;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.overflow = 'hidden';
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
};
const unlockScroll = () => {
  if (--lockCount > 0) return;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

/**
 * Diálogo modal accesible: portal, foco atrapado y devuelto, Escape y fondo
 * para cerrar, bloqueo del scroll de fondo (compensando la barra) y entrada
 * y salida con transiciones (interrumpibles). Los modales no se anclan a su
 * disparador, así que escalan desde el centro.
 */
export const Dialog: React.FC<DialogProps> = ({ open, onClose, labelledBy, label, dismissible = true, size = 'md', className = '', children }) => {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissRef = useRef(dismissible);
  dismissRef.current = dismissible;

  useLayoutEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(raf);
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), 220);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    lockScroll();
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') || panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissRef.current) { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); panel.focus(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panel)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      unlockScroll();
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-240 ease-out ${shown ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgb(var(--ground) / .72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget && dismissible) onClose(); }}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && dismissible) onClose(); }}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={label}
          tabIndex={-1}
          className={`relative w-full ${SIZES[size]} bg-surface rounded-[22px] border hair-2 shadow-panel outline-none transition-[opacity,transform] duration-240 ease-out ${shown ? 'opacity-100 scale-100' : 'opacity-0 scale-[.97]'} ${className}`}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
