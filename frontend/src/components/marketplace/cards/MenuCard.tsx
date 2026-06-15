'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ShoppingBag } from 'lucide-react';
import type { MenuResult } from './types';

interface MenuCardProps {
  item: MenuResult;
  view?: 'grid' | 'list';
}

export default function MenuCard({ item, view = 'grid' }: MenuCardProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200">
        <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
          {item.image ? <Image src={item.image} alt="" width={80} height={80} className="w-full h-full object-cover" unoptimized /> : <ShoppingBag className="h-8 w-8 text-gray-300 dark:text-gray-600" />}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.restaurant}</p>
            <span className="text-base font-bold text-gray-900 dark:text-gray-100 mt-1 block">{item.price.toLocaleString()} FCFA</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn('text-xs font-medium', item.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
              {item.available ? 'Disponible' : 'Indisponible'}
            </span>
            <Link href={`/business/${item.businessSlug || item.id}`} className="text-xs font-medium text-white bg-brand hover:bg-brand-700 px-4 py-1.5 rounded-lg transition-colors inline-block">
              Commander
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/business/${item.businessSlug || item.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group">
        <div className="h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
          {item.image ? <Image src={item.image} alt="" width={400} height={128} className="w-full h-full object-cover group-hover:scale-105 transition-transform" unoptimized /> : <ShoppingBag className="h-10 w-10 text-gray-300 dark:text-gray-600" />}
        </div>
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-0.5">{item.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{item.restaurant}</p>
          <span className={cn('text-xs font-medium', item.available ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
            {item.available ? 'Disponible' : 'Indisponible'}
          </span>
          <div className="flex items-center justify-between mt-2">
            <span className="text-base font-bold text-gray-900 dark:text-gray-100">{item.price.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
