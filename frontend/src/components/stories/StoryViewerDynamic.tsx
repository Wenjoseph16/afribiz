'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import type { StoryGroup } from '@/hooks/features/useStories';

interface StoryViewerDynamicProps {
  groups: StoryGroup[];
  initialGroup: StoryGroup;
  onClose: () => void;
}

export const StoryViewerDynamic = dynamic(
  () => import('./StoryViewer').then((mod) => ({ default: mod.StoryViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Skeleton className="h-full w-full max-w-md rounded-none" />
      </div>
    ),
  }
);
