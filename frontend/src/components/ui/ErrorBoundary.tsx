'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  // eslint-disable-next-line no-unused-vars
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
      return (
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mb-3">
            <span className="text-red-500 text-lg font-bold">!</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Une erreur est survenue dans cette section.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
