'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, WifiOff } from 'lucide-react';

interface ErrorStateProps {
  is404?: boolean;
}

export function ErrorState({ is404 = true }: ErrorStateProps) {
  const Icon = is404 ? AlertTriangle : WifiOff;
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Icon className={`w-8 h-8 ${is404 ? 'text-red-500' : 'text-orange-500'}`} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {is404 ? 'Page introuvable' : 'Erreur réseau'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {is404
            ? "Ce commerce n'existe pas ou n'est plus disponible."
            : 'Impossible de charger les données. Vérifiez votre connexion et réessayez.'}
        </p>
        {!is404 && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-600 transition-colors mb-2"
          >
            Réessayer
          </button>
        )}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white rounded-xl font-medium hover:bg-brand-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
