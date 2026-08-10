'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Zap, Clock, Users, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfferCard({ offer }: { offer: any }) {
  const [claimed, setClaimed] = useState(false);
  const timeLeft = offer.endAt
    ? Math.max(0, Math.floor((new Date(offer.endAt).getTime() - Date.now()) / 1000))
    : 0;
  const hours = Math.floor(timeLeft / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const stockPercent = offer.quantity
    ? Math.min(100, Math.round((offer.soldCount / offer.quantity) * 100))
    : 0;

  return (
    <div className="group flex-shrink-0 w-56 sm:w-64 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 overflow-hidden">
        {offer.image ? (
          <Image
            src={offer.image}
            alt={offer.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-red-500/20">
            <Zap className="w-10 h-10 text-amber-500/40" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2.5 py-1 bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-bold rounded-lg shadow-lg">
            -{offer.discountPercent || 0}%
          </span>
        </div>
        {offer.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> À la une
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
          <p className="text-white text-sm font-semibold">
            {Number(offer.flashPrice ?? 0).toLocaleString('fr-FR')} F
          </p>
          {offer.originalPrice && (
            <p className="text-white/60 text-xs line-through">
              {Number(offer.originalPrice).toLocaleString('fr-FR')} F
            </p>
          )}
        </div>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
          {offer.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Clock className="w-3 h-3 text-red-500" />
          <span className="text-red-500 font-medium">
            {hours}h {mins}m
          </span>
          <span className="text-gray-300">|</span>
          <Users className="w-3 h-3" />
          <span>{offer.soldCount || 0} vendus</span>
        </div>
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              stockPercent > 80
                ? 'bg-red-500'
                : stockPercent > 50
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
            )}
            style={{ width: `${stockPercent}%` }}
          />
        </div>
        <p className="text-[11px] text-gray-400">
          {offer.quantity && offer.quantity - (offer.soldCount || 0)} restants
        </p>
        <button
          onClick={() => setClaimed(true)}
          disabled={claimed}
          className={cn(
            'w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200',
            claimed
              ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
              : 'bg-gradient-to-r from-brand-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-brand-500/20 active:scale-95'
          )}
        >
          {claimed ? '✅ Offre obtenue !' : "Je profite de l'offre"}
        </button>
      </div>
    </div>
  );
}
