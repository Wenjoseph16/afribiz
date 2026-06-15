'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'xs' }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5',
            i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'
          )}
        />
      ))}
    </div>
  );
}
