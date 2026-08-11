'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bed, Users } from 'lucide-react';
import StarRating from './StarRating';
import { LayawayCardButton, LayawayBadge } from './LayawayCardButton';
import type { RoomResult } from './types';

interface RoomCardProps {
  item: RoomResult;
  view?: 'grid' | 'list';
}

export default function RoomCard({ item, view = 'grid' }: RoomCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/business/${item.businessSlug || item.id}`);
  };

  const price = item.promoPrice ?? item.pricePerNight;

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
            <Bed className="h-8 w-8 text-gray-300 dark:text-gray-600" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {item.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
              <span>{item.roomType || 'Chambre'}</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" /> {item.capacity || 2} pers.
              </span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.businessName}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                {price.toLocaleString()} FCFA
                <span className="text-xs font-normal text-gray-400"> / nuit</span>
              </span>
              {item.promoPrice !== undefined && (
                <span className="text-xs text-gray-400 line-through">
                  {item.pricePerNight.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/business/${item.businessSlug || item.id}`);
              }}
              className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
            >
              Réserver
            </button>
            {item.layawayOfferId && (
              <LayawayCardButton offerId={item.layawayOfferId} size="xs" />
            )}
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
          <Bed className="h-10 w-10 text-gray-300 dark:text-gray-600" />
        )}
        {item.layawayOfferId && <LayawayBadge className="absolute top-2 right-2" />}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
            {item.name}
          </h3>
          {item.rating > 0 && <StarRating rating={item.rating} size="sm" />}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-medium">
            {item.roomType || 'Chambre'}
          </span>
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" /> {item.capacity || 2}
          </span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
          {item.businessName}
        </p>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">
            {price.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-400">FCFA/nuit</span>
          </span>
          {item.promoPrice !== undefined && (
            <span className="text-xs text-gray-400 line-through">
              {item.pricePerNight.toLocaleString()}
            </span>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/business/${item.businessSlug || item.id}`);
            }}
            className="flex-1 text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors"
          >
            Réserver
          </button>
          {item.layawayOfferId && (
            <LayawayCardButton offerId={item.layawayOfferId} className="flex-1" />
          )}
        </div>
      </div>
    </div>
  );
}
