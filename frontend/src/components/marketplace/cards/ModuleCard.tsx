'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';
import StarRating from './StarRating';
import type { ModuleResult } from './types';

interface ModuleCardProps {
  item: ModuleResult;
  view?: 'grid' | 'list';
}

export default function ModuleCard({ item, view = 'grid' }: ModuleCardProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center text-xl font-bold text-purple-600 dark:text-purple-400 overflow-hidden shrink-0">
          {item.logo ? <Image src={item.logo} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized /> : <Package className="h-6 w-6 text-purple-500 dark:text-purple-400" />}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.developer} • v{item.version}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <StarRating rating={item.rating} />
                <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.installCount} installations</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit'}</span>
            <Link href={`/business/${item.businessSlug || item.id}`} className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-1.5 rounded-lg transition-colors inline-block">
              Installer
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/business/${item.businessSlug || item.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 flex items-center justify-center overflow-hidden shrink-0">
            {item.logo ? <Image src={item.logo} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized /> : <Package className="h-5 w-5 text-purple-500 dark:text-purple-400" />}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.developer} • v{item.version}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <StarRating rating={item.rating} size="xs" />
            <span className="text-[11px] text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{item.installCount} installs</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.price > 0 ? `${item.price.toLocaleString()} FCFA` : 'Gratuit'}</span>
        </div>
      </div>
    </Link>
  );
}
