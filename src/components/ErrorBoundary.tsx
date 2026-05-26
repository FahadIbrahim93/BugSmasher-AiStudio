import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-white p-8">
          <h1 className="text-4xl font-bold text-red-500 mb-4">System Failure</h1>
          <p className="text-zinc-400 mb-8 text-center max-w-md">
            The core encountered a critical error. Please reload the simulation.
          </p>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 w-full max-w-2xl overflow-auto text-sm font-mono text-red-400">
            {this.state.error?.message}
          </div>
          <button
            className="mt-8 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-zinc-200"
            onClick={() => window.location.reload()}
          >
            Reboot System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
