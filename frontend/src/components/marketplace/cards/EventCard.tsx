'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar } from 'lucide-react';
import StarRating from './StarRating';
import type { EventResult } from './types';

interface EventCardProps {
  item: EventResult;
  view?: 'grid' | 'list';
}

export default function EventCard({ item, view = 'grid' }: EventCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/business/${item.businessSlug || item.id}`);
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
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/business/${item.businessSlug || item.id}`);
            }}
            className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
          >
            Participer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      <div className="h-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
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
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">
          {item.name}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {item.date} • {item.city}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.organizer}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/business/${item.businessSlug || item.id}`);
          }}
          className="w-full mt-3 text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors"
        >
          Participer - {item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit'}
        </button>
      </div>
    </div>
  );
}
