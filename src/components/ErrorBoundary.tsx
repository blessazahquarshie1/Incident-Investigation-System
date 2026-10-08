import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled investigation system runtime error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-slate-900">
          <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-6 shadow-sm text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertOctagon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">System encountered an error</h2>
              <p className="mt-1 text-[14px] text-slate-600">
                An unexpected runtime error occurred in the analyst workbench.
              </p>
              {this.state.error && (
                <pre className="mt-3 overflow-x-auto rounded bg-slate-100 p-2 text-left font-mono text-[13px] text-red-700">
                  {this.state.error.message}
                </pre>
              )}
            </div>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-[14px] font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload page</span>
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
