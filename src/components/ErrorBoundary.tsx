import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('EARTH TRACE uncaught component error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020817] text-slate-200 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#061426]/90 border border-cyan-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold font-space text-white mb-2">Display Telemetry Interrupted</h2>
            <p className="text-xs text-slate-400 font-mono mb-6">
              An unexpected render anomaly occurred. Your observation workspace can be restored immediately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reload Workspace</span>
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-[#0a1628] hover:bg-[#12243f] text-cyan-300 border border-cyan-500/30 font-mono text-xs rounded-xl transition-colors flex items-center gap-2"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Mission Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
