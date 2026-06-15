'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Flame, TrendingUp, Star, ChevronRight, Award, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import PremiumBusinessCard from './PremiumBusinessCard';
import type { PremiumBusiness } from './PremiumBusinessCard';

const TREND_TABS = [
  { id: 'today', label: "Aujourd'hui", icon: Clock },
  { id: 'week', label: 'Cette semaine', icon: Calendar },
  { id: 'month', label: 'Ce mois', icon: TrendingUp },
  { id: 'year', label: 'Cette année', icon: Award },
];

export function TrendingSection({ items, isLoading }: { items: PremiumBusiness[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-7 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-sm">
            <Flame className="h-4 w-4 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">🔥 Tendances à Lomé</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Les plus populaires en ce moment</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.slice(0, 4).map((item) => (
          <PremiumBusinessCard key={item.id} item={item} />
        ))}
      </div>

      {items.length > 4 && (
        <div className="mt-4 text-center">
          <Link href="/marketplace?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-700 dark:hover:text-brand-400 transition-colors">
            Voir toutes les tendances <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </section>
  );
}

export function TopBusinessSection({ items, isLoading }: { items: PremiumBusiness[]; isLoading: boolean }) {
  const [period, setPeriod] = useState('today');

  const sorted = useMemo(() => {
    const sorted = [...items].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    return sorted.slice(0, 5);
  }, [items]);

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
      </section>
    );
  }

  if (sorted.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-sm">
            <Award className="h-4 w-4 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">🏆 Top Business</h2>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
          {TREND_TABS.slice(0, 3).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id)}
              className={cn(
                'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                period === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {sorted.map((item, idx) => (
          <Link
            key={item.id}
            href={`/marketplace/${item.slug || item.id}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
          >
            <span className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
              idx === 0 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
              idx === 1 ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
              idx === 2 ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' :
              'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500',
            )}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-brand transition-colors truncate">{item.name}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-0.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {item.rating?.toFixed(1)}
                </span>
                {item.city && <span>• {item.city}</span>}
                {item.reviewCount && <span>• {item.reviewCount} avis</span>}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
