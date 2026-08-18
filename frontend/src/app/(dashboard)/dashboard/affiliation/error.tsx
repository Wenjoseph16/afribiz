'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Une erreur est survenue
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {error.message || 'Erreur inconnue'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand/90 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
