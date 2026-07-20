'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <ErrorState
        title="Une erreur est survenue"
        message={error.message || 'Impossible de charger cette page du tableau de bord.'}
        onRetry={reset}
      />
    </div>
  );
}
