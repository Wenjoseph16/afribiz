'use client';

import Link from 'next/link';
import Image from 'next/image';
import { X, Clock, Star, MapPin, Eye, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecentlyViewedItem } from '@/hooks/useRecentlyViewed';

interface RecentlyViewedProps {
  items: RecentlyViewedItem[];
  onClear: () => void;
}

function getItemHref(item: RecentlyViewedItem): string {
  switch (item.type) {
    case 'event':
      return `/events/${item.slug}`;
    case 'module':
      return `/marketplace/${item.slug}`;
    case 'product':
    case 'service':
    case 'rental':
    case 'business':
    default:
      return `/business/${item.slug}`;
  }
}

export default function RecentlyViewed({ items, onClear }: RecentlyViewedProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Eye className="h-5 w-5 text-brand" />
          Récemment consultés
        </h2>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
        {items.map((item) => (
          <Link key={item.id} href={getItemHref(item)} className="flex-shrink-0 w-40 sm:w-44 group">
            <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md hover:border-brand/30 transition-all duration-200">
              {/* Image */}
              <div className="relative h-24 sm:h-28 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                {item.logo ? (
                  <Image
                    src={item.logo}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-brand">
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
                {/* Time badge */}
                <div className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5 text-white/80" />
                  <span className="text-[10px] text-white/90">{getTimeAgo(item.viewedAt)}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-2.5 space-y-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-brand transition-colors">
                  {item.name}
                </h3>
                {item.city && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {item.city}
                  </p>
                )}
                {item.rating !== undefined && item.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.rating.toFixed(1)}
                    </span>
                    {item.reviewCount !== undefined && item.reviewCount > 0 && (
                      <span className="text-[10px] text-gray-400">({item.reviewCount})</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  return `Il y a ${days}j`;
}
