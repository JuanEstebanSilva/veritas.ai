import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useIsPresent } from 'motion/react';

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
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

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
 * para cerrar y bloqueo del scroll de fondo (compensando la barra).
 *
 * Entrada y salida con Motion (AnimatePresence): el panel entra con un
 * resorte y sale con una curva corta; la salida es interrumpible y el
 * contenido se conserva mientras dura. Los modales no se anclan a su
 * disparador, así que escalan desde el centro. Con movimiento reducido
 * (MotionConfig en la raíz) sólo cambia la opacidad.
 */
export const Dialog: React.FC<DialogProps> = (props) =>
  createPortal(<AnimatePresence>{props.open && <DialogLayer key="dialog" {...props} />}</AnimatePresence>, document.body);

const DialogLayer: React.FC<DialogProps> = ({ onClose, labelledBy, label, dismissible = true, size = 'md', className = '', children }) => {
  const isPresent = useIsPresent();
  const panelRef = useRef<HTMLDivElement>(null);
  // El disparador se captura en el primer render, antes de mover el foco
  // (un efecto se repite en StrictMode y vería el foco ya dentro del panel).
  const restoreRef = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissRef = useRef(dismissible);
  dismissRef.current = dismissible;
  const presentRef = useRef(isPresent);
  presentRef.current = isPresent;

  // Bloqueo de scroll durante toda la vida de la capa (incluida la salida)
  useEffect(() => { lockScroll(); return unlockScroll; }, []);

  // Foco: al abrir entra en el panel; al empezar a cerrar vuelve al disparador
  useEffect(() => {
    if (!isPresent) { restoreRef.current?.focus?.({ preventScroll: true }); return; }
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>('[data-autofocus]') || panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first || panel)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (!presentRef.current) return;
      if (e.key === 'Escape' && dismissRef.current) { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) { e.preventDefault(); panel.focus(); return; }
      const firstEl = items[0], lastEl = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstEl || document.activeElement === panel)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPresent]);

  const backdropClose = (e: React.MouseEvent) => { if (e.target === e.currentTarget && dismissible && presentRef.current) onClose(); };

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgb(var(--ground) / .72)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)', pointerEvents: isPresent ? 'auto' : 'none' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.24, ease: EASE_OUT } }}
      exit={{ opacity: 0, transition: { duration: 0.18, ease: EASE_OUT } }}
      onMouseDown={backdropClose}
    >
      <div className="flex min-h-full items-center justify-center p-3 sm:p-6" onMouseDown={backdropClose}>
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-label={label}
          tabIndex={-1}
          className={`relative w-full ${SIZES[size]} bg-surface rounded-[22px] border hair-2 shadow-panel outline-none ${className}`}
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8, opacity: { duration: 0.2, ease: EASE_OUT } } }}
          exit={{ opacity: 0, scale: 0.98, y: 6, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }}
        >
          {children}
        </motion.div>
      </div>
    </motion.div>
  );
};
