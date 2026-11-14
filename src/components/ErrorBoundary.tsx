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
        <div className="min-h-screen bg-[#171B2B] text-[#F0EBDD] flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#353D55] border border-[#48516A] rounded-2xl p-6 text-center shadow-2xl">
            <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#F16C72]/15 border border-[#F16C72]/40 flex items-center justify-center text-[#F16C72]">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <h2 className="text-lg font-bold font-space text-[#F0EBDD] mb-2">Display Telemetry Interrupted</h2>
            <p className="text-xs text-[#B5BDCC] font-mono mb-6">
              An unexpected render anomaly occurred. Your observation workspace can be restored immediately.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#A6B7D4] hover:bg-[#B8C6DF] text-[#171B2B] font-mono font-bold text-xs rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Reload Workspace</span>
              </button>
              <a
                href="/"
                className="px-4 py-2 bg-[#232A3D] hover:bg-[#2B3349] text-[#F0EBDD] border border-[#48516A] font-mono text-xs rounded-xl transition-colors flex items-center gap-2"
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
