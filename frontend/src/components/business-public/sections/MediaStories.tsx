'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { useBusinessStories } from '@/hooks/features/useStories';
import { StoryViewerDynamic as StoryViewer } from '@/components/stories/StoryViewerDynamic';

interface MediaStoriesProps {
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessLogo?: string | null;
}

export function MediaStories({ businessId, businessName, businessSlug, businessLogo }: MediaStoriesProps) {
  const { data: stories, isLoading } = useBusinessStories(businessId);
  const [viewingStory, setViewingStory] = useState<any>(null);

  if (isLoading || !stories?.length) return null;

  const storyGroup = {
    business: { id: businessId, name: businessName, slug: businessSlug, logo: businessLogo || null, type: '' },
    stories: stories,
    allViewed: false,
  };

  return (
    <section id="section-media-stories" className="scroll-mt-32">
      <div className="py-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Stories</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
          {stories.map((story: any, idx: number) => (
            <button
              key={story.id}
              onClick={() => setViewingStory(storyGroup)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer snap-start"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="relative w-16 h-16 rounded-full p-[3px] bg-gradient-to-br from-brand-400 via-purple-500 to-pink-500 shadow-lg shadow-brand-500/20 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-active:scale-95">
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white dark:bg-gray-800 ring-1 ring-white/20">
                  {story.mediaUrl && story.mediaType === 'IMAGE' ? (
                    <Image
                      src={story.mediaUrl}
                      alt=""
                      width={64}
                      height={64}
                      className="rounded-full object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center">
                      <Play className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                    </div>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[72px] text-center leading-tight">
                {story.type || 'Story'}
              </span>
            </button>
          ))}
        </div>
        {viewingStory && (
          <StoryViewer
            groups={[storyGroup]}
            initialGroup={storyGroup}
            onClose={() => setViewingStory(null)}
          />
        )}
      </div>
    </section>
  );
}
