'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

interface LivePlayerDynamicProps {
  live: any;
  onClose?: () => void;
  compact?: boolean;
}

export const LivePlayerDynamic = dynamic(
  () => import('./LivePlayer').then((mod) => ({ default: mod.LivePlayer })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </div>
    ),
  }
);
