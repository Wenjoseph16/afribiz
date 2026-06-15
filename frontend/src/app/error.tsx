'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white via-amber-50/20 to-red-50/20 dark:from-gray-950 dark:via-amber-950/10 dark:to-red-950/10 z-50">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-red-500/5 dark:bg-red-800/10 animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-300/5 dark:bg-amber-800/10 animate-pulse" style={{ animationDuration: '6s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-6 max-w-md text-center px-6">
        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-50 to-amber-50 dark:from-red-900/20 dark:to-amber-900/20 flex items-center justify-center border border-red-100 dark:border-red-800/30 shadow-lg shadow-red-500/10">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Error text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Oups ! Une erreur est survenue
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Désolé, quelque chose s&apos;est mal passé. Notre équipe a été notifiée automatiquement.
            Vous pouvez réessayer ou revenir à l&apos;accueil.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={reset}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-brand/20 hover:shadow-xl hover:shadow-brand/30 hover:from-brand-600 hover:to-emerald-500 transition-all duration-200 active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            Réessayer
          </button>
          <a
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm"
          >
            <Home className="w-4 h-4" />
            Retour à l&apos;accueil
          </a>
        </div>

        {/* Error details */}
        {error.digest && (
          <p className="text-xs text-gray-400 dark:text-gray-600 font-mono">
            Erreur #{error.digest}
          </p>
        )}

        {/* Support */}
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mt-2">
          <Mail className="w-3 h-3" />
          <span>Support : support@afribiz.com</span>
        </div>
      </div>
    </div>
  );
}
