'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: Record<string, unknown>) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: Record<string, unknown>) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    console.error('Section error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const isDev = process.env.NODE_ENV === 'development';

      return (
        <div className="p-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <span className="text-red-500 text-lg font-bold">!</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Une erreur est survenue dans cette section.
          </p>
          {isDev && this.state.error && (
            <details className="mt-4 text-left max-w-xl mx-auto">
              <summary className="text-xs text-red-500 cursor-pointer hover:text-red-400 font-medium">
                Voir les détails de l'erreur
              </summary>
              <pre className="mt-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-lg text-xs text-red-700 dark:text-red-300 overflow-auto max-h-48 whitespace-pre-wrap font-mono">
                {this.state.error.name}: {this.state.error.message}
                {'\n'}
                {this.state.error.stack}
              </pre>
            </details>
          )}
          {!isDev && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Notre équipe a été notifiée automatiquement.
            </p>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
