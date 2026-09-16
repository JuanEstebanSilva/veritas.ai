import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Veritas AI — error no capturado:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-ground text-hi">
          <div className="w-full max-w-md card p-8 flex flex-col items-center text-center gap-6">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-ai/10 text-ai">
              <AlertCircle className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div className="flex flex-col gap-2">
              <h2 className="text-d-5 font-semibold">Algo se rompió <span className="serif">al pintar la página.</span></h2>
              <p className="text-[13px] leading-[1.6] text-low font-mono break-words">{this.state.error?.message || 'Error desconocido al renderizar la interfaz.'}</p>
            </div>
            <button type="button" onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }} className="btn btn-primary w-full">
              <RefreshCw className="h-4 w-4" strokeWidth={1.8} /> Recargar la aplicación
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
