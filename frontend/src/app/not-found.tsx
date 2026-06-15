import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 px-6">
      <div className="relative w-32 h-32 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 to-teal-400/20 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-center w-full h-full">
          <span className="text-7xl font-black text-gray-200 dark:text-gray-800 select-none">404</span>
        </div>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-2">
        Page introuvable
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        La page que vous recherchez n&apos;existe pas ou a été déplacée.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white font-medium rounded-xl transition-colors shadow-lg shadow-brand/25"
        >
          <Home className="h-4 w-4" />
          Accueil
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>
      </div>
    </div>
  );
}
