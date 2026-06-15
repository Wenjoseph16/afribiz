'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play, Eye, Heart } from 'lucide-react';
import { useShorts } from '@/hooks/features/useShorts';

interface MediaShortsProps {
  businessId: string;
  businessSlug: string;
}

export function MediaShorts({ businessId }: MediaShortsProps) {
  const { data, isLoading } = useShorts({ businessId, limit: 8 });

  const shorts = data?.items || [];

  if (isLoading || shorts.length === 0) return null;

  return (
    <section id="section-media-shorts" className="scroll-mt-32">
      <div className="py-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Shorts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shorts.map((short: any) => (
            <Link
              key={short.id}
              href={`/shorts/${short.id}`}
              className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {short.thumbnailUrl ? (
                <Image src={short.thumbnailUrl} alt={short.title || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-500/20 to-purple-500/20">
                  <Play className="w-8 h-8 text-brand-500/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-sm rounded-full">
                <Play className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="absolute bottom-2 left-2 right-2">
                {short.title && (
                  <p className="text-white text-xs font-medium truncate">{short.title}</p>
                )}
                <div className="flex items-center gap-2 text-[10px] text-white/70 mt-0.5">
                  <Eye className="w-2.5 h-2.5" />
                  <span>{short.viewsCount || 0}</span>
                  <Heart className="w-2.5 h-2.5" />
                  <span>{short.likesCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
