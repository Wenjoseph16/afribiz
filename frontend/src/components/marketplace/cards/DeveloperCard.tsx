'use client';

import Link from 'next/link';
import Image from 'next/image';
import StarRating from './StarRating';
import type { DeveloperResult } from './types';

interface DeveloperCardProps {
  item: DeveloperResult;
  view?: 'grid' | 'list';
}

export default function DeveloperCard({ item, view = 'grid' }: DeveloperCardProps) {
  if (view === 'list') {
    return (
      <div className="flex gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
          {item.photo ? <Image src={item.photo} alt="" width={64} height={64} className="w-full h-full object-cover" unoptimized /> : item.name[0]}
        </div>
        <div className="flex-1 min-w-0 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{item.company} • {item.city}</p>
            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {item.specialties.map((s) => (
                <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{s}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <StarRating rating={item.rating} />
                <span className="text-xs text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.moduleCount} modules</span>
            </div>
          </div>
          <Link href={`/developer/${item.id}`} className="text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-4 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
            Voir profil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand/20 hover:shadow-card transition-all duration-200 overflow-hidden group p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 flex items-center justify-center text-lg font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shrink-0">
          {item.photo ? <Image src={item.photo} alt="" width={48} height={48} className="w-full h-full object-cover" unoptimized /> : item.name[0]}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.company} • {item.city}</p>
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {item.specialties.map((s) => (
          <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{s}</span>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <StarRating rating={item.rating} size="xs" />
          <span className="text-[11px] text-gray-400 dark:text-gray-500">({item.reviewCount})</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">{item.moduleCount} modules</span>
      </div>
      <Link href={`/developer/${item.id}`} className="block text-center text-xs font-medium text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
        Voir profil
      </Link>
    </div>
  );
}
