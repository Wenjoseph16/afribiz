'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import StarRating from './StarRating';
import type { ServiceResult } from './types';

interface ServiceCardProps {
  item: ServiceResult;
  view?: 'grid' | 'list';
}

export default function ServiceCard({ item, view = 'grid' }: ServiceCardProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 group">
        <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {item.image ? <Image src={item.image} alt="" width={96} height={96} className="w-full h-full object-cover" unoptimized /> : <Clock className="h-8 w-8 text-gray-300 dark:text-gray-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.businessName} • {item.city}</p>
            </div>
            <div className="flex items-center gap-1">
              <StarRating rating={item.rating} />
              <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.price.toLocaleString()} FCFA</span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><Clock className="h-3 w-3" />{item.duration}</span>
          </div>
          <div className="flex gap-2 mt-3">
            <Link href={`/business/${item.businessSlug || item.id}`} className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-1.5 rounded-lg transition-colors inline-block">Réserver</Link>
            <Link href={`/business/${item.businessSlug || item.id}`} className="text-xs font-medium text-brand border border-brand/20 px-4 py-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors inline-block">Devis</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group">
      <div className="h-36 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
        {item.image ? <Image src={item.image} alt="" width={400} height={144} className="w-full h-full object-cover group-hover:scale-105 transition-transform" unoptimized /> : <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{item.name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{item.businessName} • {item.city}</p>
        <div className="flex items-center gap-1 mb-2">
          <StarRating rating={item.rating} size="xs" />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-gray-900 dark:text-gray-100">{item.price.toLocaleString()} FCFA</span>
          <span className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400"><Clock className="h-3 w-3" />{item.duration}</span>
        </div>
        <div className="flex gap-2">
          <Link href={`/business/${item.businessSlug || item.id}`} className="flex-1 text-xs font-medium text-white bg-brand rounded-lg py-2 hover:bg-brand-700 transition-colors inline-block text-center">Réserver</Link>
          <Link href={`/business/${item.businessSlug || item.id}`} className="flex-1 text-xs font-medium text-brand border border-brand/20 rounded-lg py-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors inline-block text-center">Devis</Link>
        </div>
      </div>
    </div>
  );
}
