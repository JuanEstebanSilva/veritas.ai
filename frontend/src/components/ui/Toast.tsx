import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Check, AlertCircle, Info, X, type LucideIcon } from 'lucide-react';

export type ToastTone = 'human' | 'ai' | 'azure' | 'gold';
export interface ToastOptions { title: string; description?: string; tone?: ToastTone; duration?: number; }
interface ToastItem extends ToastOptions { id: number; leaving?: boolean; }

interface ToastContextType { show: (t: ToastOptions) => void; }
const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TONE: Record<ToastTone, { text: string; Icon: LucideIcon }> = {
  human: { text: 'text-human', Icon: Check },
  ai: { text: 'text-ai', Icon: AlertCircle },
  azure: { text: 'text-azure', Icon: Info },
  gold: { text: 'text-gold', Icon: Info },
};

/**
 * Avisos transitorios en la parte inferior. Entran y salen con transiciones
 * (no keyframes), así que si se disparan dos seguidos no se reinician.
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, number>());
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 240);
    const t = timers.current.get(id); if (t) { window.clearTimeout(t); timers.current.delete(id); }
  }, []);

  const show = useCallback((opts: ToastOptions) => {
    const id = ++seq.current;
    setItems((prev) => [...prev.slice(-2), { id, tone: 'azure', duration: 3400, ...opts }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), opts.duration ?? 3400));
  }, [dismiss]);

  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+16px)] z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => {
          const tone = TONE[t.tone || 'azure'];
          return (
            <div key={t.id}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border hair-2 bg-surface px-4 py-3.5 shadow-panel transition-[opacity,transform] duration-240 ease-out ${t.leaving ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
              style={{ animation: 'toastIn .32s cubic-bezier(.16,1,.3,1)' }}>
              <tone.Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone.text}`} strokeWidth={2.2} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[13.5px] font-semibold text-hi">{t.title}</span>
                {t.description && <span className="text-[12.5px] leading-[1.5] text-mid">{t.description}</span>}
              </div>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Cerrar aviso" className="btn-icon -mr-2 -mt-1.5 h-8 w-8"><X className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(10px) scale(.98); } to { opacity: 1; transform: none; } } @media (prefers-reduced-motion: reduce) { @keyframes toastIn { from { opacity: 0; } to { opacity: 1; } } }`}</style>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};
