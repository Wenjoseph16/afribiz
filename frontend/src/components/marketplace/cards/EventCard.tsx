'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import StarRating from './StarRating';
import { LayawayCardButton, LayawayBadge } from './LayawayCardButton';
import type { EventResult } from './types';

interface EventCardProps {
  item: EventResult;
  view?: 'grid' | 'list';
}

export default function EventCard({ item, view = 'grid' }: EventCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/events/${item.businessSlug || item.id}/${item.id}`);
  };

  if (view === 'list') {
    return (
      <div
        onClick={handleCardClick}
        className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 cursor-pointer"
      >
        <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              width={96}
              height={96}
              className="w-full h-full object-cover"
            />
          ) : (
            <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" /> {item.date} • {item.city}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.organizer}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {item.availableSeats} places
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/events/${item.businessSlug || item.id}/${item.id}`);
              }}
              className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
            >
              Participer
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
      <div className="h-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden relative">
        {item.image ? (
          <Image
            src={item.image}
            alt=""
            width={400}
            height={144}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <Calendar className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        )}
        {item.layawayOfferId && <LayawayBadge className="absolute top-2 right-2" />}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {item.date} • {item.city}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.organizer}</p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/events/${item.businessSlug || item.id}/${item.id}`);
            }}
            className="flex-1 text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors"
          >
            Participer - {item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit'}
          </button>
          {item.layawayOfferId && (
            <LayawayCardButton offerId={item.layawayOfferId} className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
