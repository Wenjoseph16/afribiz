'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

interface MapBusiness {
  id: string;
  name: string;
  slug?: string;
  latitude: number;
  longitude: number;
  logo?: string;
  rating?: number;
  type?: string;
  city?: string;
}

interface MarketMapDynamicProps {
  businesses: MapBusiness[];
  onBusinessClick: (slug: string) => void;
}

export const MarketMapDynamic = dynamic(
  () => import('./MarketMap').then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-[400px] w-full rounded-xl" />
    ),
  }
);
