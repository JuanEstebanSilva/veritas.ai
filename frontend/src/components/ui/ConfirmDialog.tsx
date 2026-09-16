import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from './Dialog';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` pinta la acción en el color de alerta. */
  tone?: 'danger' | 'default';
}

interface ConfirmContextType { confirm: (o: ConfirmOptions) => Promise<boolean>; }
const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

/**
 * Sustituto accesible de window.confirm: promesa que se resuelve con la
 * decisión del usuario. Un solo diálogo para toda la aplicación.
 */
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => {
    resolver.current?.(false);
    resolver.current = resolve;
    setOpts(o);
  }), []);

  const settle = (v: boolean) => { resolver.current?.(v); resolver.current = null; setOpts(null); };
  const value = useMemo(() => ({ confirm }), [confirm]);
  const danger = opts?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Dialog open={!!opts} onClose={() => settle(false)} size="sm" labelledBy="confirm-title">
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? 'bg-ai/10 text-ai' : 'bg-azure/10 text-azure'}`}>
              <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 id="confirm-title" className="text-[17px] font-semibold text-hi">{opts?.title}</h2>
              {opts?.description && <p className="text-[13.5px] leading-[1.6] text-mid">{opts.description}</p>}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => settle(false)} className="btn btn-quiet btn-sm">{opts?.cancelLabel || 'Cancelar'}</button>
            <button type="button" data-autofocus onClick={() => settle(true)} className={`btn btn-sm ${danger ? 'bg-ai text-[rgb(var(--on-accent))]' : 'btn-primary'}`}>
              {opts?.confirmLabel || 'Confirmar'}
            </button>
          </div>
        </div>
      </Dialog>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmContextType => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
};
