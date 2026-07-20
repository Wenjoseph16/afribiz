'use client';

import { ErrorState } from '@/components/ui/ErrorState';

export default function PageError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <ErrorState message={error.message} onRetry={reset} />
    </div>
  );
}
