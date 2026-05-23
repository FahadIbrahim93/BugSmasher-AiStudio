import React from 'react'

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }

  handleReset = () => { this.setState({ hasError: false, error: null }); window.location.reload() }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
          <div className="flex flex-col items-center max-w-md w-full p-10 space-y-6 text-center">
            <div className="text-2xl font-mono text-red-400/80 tracking-[0.3em]">SYSTEM CRASH</div>
            <div className="border border-red-900/30 w-full p-4 bg-red-950/20">
              <div className="text-[10px] text-red-400/40 font-mono tracking-wider mb-2">FATAL ERROR</div>
              <div className="text-xs text-red-300/60 font-mono break-all">
                {this.state.error?.message ?? 'Unknown error'}
              </div>
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-4 border border-red-900/40 hover:border-red-500/60 text-red-400/70 hover:text-red-300 font-mono text-sm tracking-[0.3em] transition-all"
            >
              REBOOT SYSTEM
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
