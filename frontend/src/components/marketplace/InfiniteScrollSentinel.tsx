'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface InfiniteScrollSentinelProps {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore?: () => void;
  onIntersect?: () => void;
}

export default function InfiniteScrollSentinel({
  hasMore,
  isLoading,
  onLoadMore,
  onIntersect,
}: InfiniteScrollSentinelProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onIntersect?.();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onIntersect]);

  if (!hasMore) return null;

  return (
    <div ref={sentinelRef} className="flex items-center justify-center py-8">
      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
        </div>
      ) : onLoadMore ? (
        <button
          onClick={onLoadMore}
          className="text-sm font-medium text-brand hover:text-brand-700 px-4 py-2 rounded-lg border border-brand/20 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
        >
          Charger plus de résultats
        </button>
      ) : null}
    </div>
  );
}
