'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

interface HybridPaymentSectionDynamicProps {
  orderId: string;
  orderTotal?: number;
}

export const HybridPaymentSectionDynamic = dynamic(
  () => import('./HybridPaymentSection').then((mod) => ({ default: mod.HybridPaymentSection })),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    ),
  }
);
