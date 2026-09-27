import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in SVG Alight Motion Converter:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full bg-[#090d16] text-slate-100 p-6 font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full p-6 bg-[#0f172a] border border-rose-900/60 rounded-xl shadow-2xl text-center flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/70 border border-rose-800 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-base font-semibold text-white">
                Terjadi Kendala pada Pratinjau
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aplikasi mendeteksi error saat memproses dokumen visual.
              </p>
            </div>

            <div className="w-full p-3 bg-slate-950 rounded-lg text-left font-mono text-[11px] text-rose-300 max-h-36 overflow-y-auto break-all border border-slate-800">
              {this.state.error?.message || 'Unknown render error occurred.'}
            </div>

            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 rounded-lg shadow-md transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Ulang Aplikasi & Reset</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
