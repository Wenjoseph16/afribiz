'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">Une erreur inattendue est survenue</p>
          <p className="text-sm text-gray-400 mb-6">Notre équipe a été notifiée. Veuillez réessayer.</p>
          <button
            onClick={reset}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
