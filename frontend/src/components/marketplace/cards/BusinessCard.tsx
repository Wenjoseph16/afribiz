'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import StarRating from './StarRating';
import Badge from './Badge';
import type { BusinessResult } from './types';

interface BusinessCardProps {
  item: BusinessResult;
  view?: 'grid' | 'list';
}

export default function BusinessCard({ item, view = 'grid' }: BusinessCardProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 dark:hover:border-brand/30 hover:shadow-card transition-all duration-200 group">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-2xl font-bold text-brand shrink-0 overflow-hidden">
          {item.logo ? <Image src={item.logo} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized /> : item.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
                {item.badges.map((b) => <Badge key={b} label={b} />)}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.category} • {item.city}{item.distance ? ` • ${item.distance}` : ''}</p>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <StarRating rating={item.rating} />
              <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 line-clamp-2">{item.description}</p>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-1.5 flex-wrap">
              {item.modules.map((m) => (
                <span key={m} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{m}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Link href={`/business/${item.slug || item.id}`} className="text-xs font-medium text-brand hover:text-brand-700 dark:hover:text-brand-400 px-3 py-1.5 rounded-lg border border-brand/20 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                Voir le business
              </Link>
              {item.modules.includes('Produits') && (
                <Link href={`/business/${item.slug || item.id}`} className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors inline-block">
                  Commander
                </Link>
              )}
              {item.modules.includes('Réservations') && (
                <Link href={`/business/${item.slug || item.id}`} className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-3 py-1.5 rounded-lg transition-colors inline-block">
                  Réserver
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 dark:hover:border-brand/30 hover:shadow-card transition-all duration-200 group overflow-hidden">
      <div className="p-5">
        <Link href={`/business/${item.slug || item.id}`}>
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/30 dark:to-brand-800/30 flex items-center justify-center text-xl font-bold text-brand overflow-hidden shrink-0">
              {item.logo ? <Image src={item.logo} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized /> : item.name[0]}
            </div>
            <div className="flex items-center gap-1">
              <StarRating rating={item.rating} />
              <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {item.badges.map((b) => <Badge key={b} label={b} />)}
          </div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{item.name}</h3>              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{item.category} • {item.city}{item.country ? `, ${item.country}` : ''}{item.distance ? ` • 📍${item.distance}` : ''}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{item.description}</p>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {item.modules.map((m) => (
              <span key={m} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">{m}</span>
            ))}
          </div>
        </Link>
        <div className="flex gap-2">
          <Link href={`/business/${item.slug || item.id}`} className="flex-1 text-center text-xs font-medium text-brand border border-brand/20 rounded-lg py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
            Voir le business
          </Link>
          {item.modules.includes('Produits') && (
            <Link href={`/business/${item.slug || item.id}`} className="flex-1 text-center text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors inline-block">
              Commander
            </Link>
          )}
          {item.modules.includes('Réservations') && (
            <Link href={`/business/${item.slug || item.id}`} className="flex-1 text-center text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors inline-block">
              Réserver
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
