import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to external service if needed (e.g., Sentry)
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-800 text-center mb-2">
              Something went wrong
            </h1>

            <p className="text-slate-600 text-center mb-6">
              We encountered an unexpected error. Please refresh the page to continue.
            </p>

            {this.state.error && (
              <details className="mb-6 text-sm">
                <summary className="cursor-pointer text-slate-500 hover:text-slate-700 mb-2">
                  Error details
                </summary>
                <pre className="bg-slate-100 p-3 rounded overflow-auto text-xs text-red-600">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-[#531B93] to-[#2563EB] text-white py-3 rounded-lg font-semibold hover:from-[#3d1470] hover:to-[#1d4ed8] transition-all shadow-md"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
