import React from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render-time crashes anywhere below it so a single faulty
 * component cannot white-screen the whole storefront.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-[#0C0C0E] text-white flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg bg-[#141416] border border-[#27272A] rounded-lg p-8 shadow-2xl space-y-6 text-center">

          <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-900/50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg font-bold tracking-widest uppercase text-white">
              Something went wrong
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              An unexpected error occurred while loading this page. The rest of the store is
              still working — you can retry or head back to the storefront.
            </p>
          </div>

          {this.state.error && (
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-md">
              <span className="block text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
                Error detail
              </span>
              <code className="block text-[11px] font-mono text-red-400 break-words text-left">
                {this.state.error.message}
              </code>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReset}
              className="flex-1 py-3 bg-white text-black font-semibold text-xs tracking-widest uppercase rounded-md hover:bg-zinc-200 transition-all flex items-center justify-center space-x-2"
            >
              <RotateCw className="w-4 h-4" />
              <span>Retry</span>
            </button>

            <button
              onClick={this.handleHome}
              className="flex-1 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-semibold text-xs tracking-widest uppercase rounded-md transition-all flex items-center justify-center space-x-2"
            >
              <Home className="w-4 h-4" />
              <span>Storefront</span>
            </button>
          </div>

        </div>
      </div>
    );
  }
}
