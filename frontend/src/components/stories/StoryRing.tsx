'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useActiveStories, type StoryGroup } from '@/hooks/features/useStories';
import { StoryViewerDynamic as StoryViewer } from './StoryViewerDynamic';

interface StoryRingProps {
  onStoryOpen?: (group: StoryGroup) => void;
  className?: string;
}

export function StoryRing({ onStoryOpen, className }: StoryRingProps) {
  const { data: groups, isLoading } = useActiveStories();
  const [viewerGroup, setViewerGroup] = useState<StoryGroup | null>(null);

  const handleGroupClick = useCallback((group: StoryGroup) => {
    setViewerGroup(group);
    onStoryOpen?.(group);
  }, [onStoryOpen]);

  if (isLoading) {
    return (
      <div className={cn('flex gap-3 overflow-x-auto pb-2 scrollbar-none', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-12 h-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!groups?.length) {
    return null;
  }

  return (
    <>
      <div className={cn('flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x snap-mandatory', className)}>
        {groups.map((group, idx) => (
          <button
            key={group.business.id}
            onClick={() => handleGroupClick(group)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer snap-start animate-fade-in-up"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className={cn(
              'relative w-16 h-16 rounded-full p-[3px] transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-active:scale-95',
              group.allViewed
                ? 'bg-gray-300/60 dark:bg-gray-600/60 ring-1 ring-white/10'
                : 'bg-gradient-to-br from-brand-400 via-purple-500 to-pink-500 shadow-lg shadow-brand-500/20'
            )}>
              {/* Pulse ring for unviewed stories */}
              {!group.allViewed && (
                <span className="absolute inset-0 rounded-full animate-ping bg-brand-400/30 opacity-75" />
              )}
              <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-white/20">
                {group.business.logo ? (
                  <Image
                    src={group.business.logo}
                    alt={group.business.name}
                    width={64}
                    height={64}
                    className="rounded-full object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center">
                    <span className="text-lg font-bold text-brand-600 dark:text-brand-400">
                      {group.business.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[72px] text-center leading-tight group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {group.business.name}
            </span>
          </button>
        ))}
      </div>

      {viewerGroup && (
        <StoryViewer
          groups={groups}
          initialGroup={viewerGroup}
          onClose={() => setViewerGroup(null)}
        />
      )}
    </>
  );
}
