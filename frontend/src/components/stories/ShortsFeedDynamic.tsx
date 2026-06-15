'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

interface ShortsFeedDynamicProps {
  businessId?: string;
}

export const ShortsFeedDynamic = dynamic(
  () => import('./ShortsFeed').then((mod) => ({ default: mod.ShortsFeed })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-48 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    ),
  }
);
