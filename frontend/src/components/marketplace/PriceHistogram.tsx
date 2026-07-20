'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/services/apiClient';

interface PriceBucket {
  label: string;
  min: number;
  max?: number;
  count: number;
}

interface PriceHistogramProps {
  type?: string;
  category?: string;
  currentMin?: number;
  currentMax?: number;
  onSelect: (min?: number, max?: number) => void;
}

export default function PriceHistogram({
  type,
  category,
  currentMin,
  currentMax,
  onSelect,
}: PriceHistogramProps) {
  const [buckets, setBuckets] = useState<PriceBucket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiClient
      .getPriceDistribution({ type, category })
      .then((res: any) => {
        if (!cancelled) {
          const data = res?.data;
          setBuckets(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type, category]);

  const safeBuckets = Array.isArray(buckets) ? buckets : [];
  const maxCount = Math.max(...safeBuckets.map((b) => b.count), 1);

  if (loading && !safeBuckets.length) {
    return (
      <div className="flex items-center justify-center py-3">
        <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-1.5 pt-1">
      {safeBuckets.map((b) => {
        const active =
          (currentMin === undefined || currentMin === b.min) &&
          (currentMax === undefined || currentMax === (b.max ?? Number.MAX_SAFE_INTEGER));
        const pct = (b.count / maxCount) * 100;
        return (
          <button
            key={b.label}
            onClick={() => {
              if (active) {
                onSelect(undefined, undefined);
              } else {
                onSelect(b.min, b.max);
              }
            }}
            className={cn(
              'w-full flex items-center gap-2 px-1 py-1 rounded text-xs transition-colors group',
              active ? 'bg-brand/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            )}
          >
            <div className="w-16 text-right shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
              {b.label}
            </div>
            <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-800 rounded-sm overflow-hidden relative">
              <div
                className={cn(
                  'h-full rounded-sm transition-all duration-300',
                  active ? 'bg-brand' : 'bg-brand/30 group-hover:bg-brand/50'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div
              className={cn(
                'w-8 text-right shrink-0 font-medium tabular-nums',
                active
                  ? 'text-brand'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400'
              )}
            >
              {b.count}
            </div>
          </button>
        );
      })}
    </div>
  );
}
