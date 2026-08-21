'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, Clock, Layers } from 'lucide-react';
import StarRating from './StarRating';
import { LayawayCardButton, LayawayBadge } from './LayawayCardButton';
import type { TrainingResult } from './types';

interface TrainingCardProps {
  item: TrainingResult;
  view?: 'grid' | 'list';
}

export default function TrainingCard({ item, view = 'grid' }: TrainingCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/business/${item.businessSlug || item.id}`);
  };

  const priceLabel = item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit';

  if (view === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 cursor-pointer"
      >
        <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-brand to-brand-700 flex items-center justify-center shrink-0">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-0.5">
              {item.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {item.duration}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Layers className="h-3 w-3" /> {item.lessons} leçons
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.businessName}</p>
            <span className="inline-block text-base font-bold text-gray-900 dark:text-gray-100 mt-2">
              {priceLabel}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/book/${item.businessSlug || item.id}`);
              }}
              className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
            >
              S'inscrire
            </button>
            {item.layawayOfferId && <LayawayCardButton offerId={item.layawayOfferId} size="xs" />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      <div className="h-36 bg-gradient-to-br from-brand to-brand-700 flex flex-col items-center justify-center gap-1.5 relative">
        <BookOpen className="h-10 w-10 text-white/90" />
        <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-medium">
          {item.category || 'Formation'}
        </span>
        {item.layawayOfferId && <LayawayBadge className="absolute top-2 right-2" />}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {item.name}
          </h3>
          {item.rating > 0 && <StarRating rating={item.rating} size="sm" />}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3 mt-1">
          {item.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {item.duration}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" /> {item.lessons} leçons
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
          {item.businessName}
        </p>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">{priceLabel}</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/book/${item.businessSlug || item.id}`);
            }}
            className="flex-1 text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors"
          >
            S'inscrire
          </button>
          {item.layawayOfferId && (
            <LayawayCardButton offerId={item.layawayOfferId} className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
