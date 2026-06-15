'use client';

import { cn } from '@/lib/utils';
import {
  ShoppingBag, Utensils, Sparkles, Car, Building2, PartyPopper,
  BookOpen, Hand, Puzzle, Palette, Bed,
} from 'lucide-react';

const CATEGORIES = [
  { id: 'products', label: 'Produits', icon: ShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800' },
  { id: 'restaurants', label: 'Restaurants', icon: Utensils, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800' },
  { id: 'beauty', label: 'Beauté', icon: Sparkles, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/30 border-pink-100 dark:border-pink-800' },
  { id: 'rentals', label: 'Location', icon: Car, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800' },
  { id: 'hotels', label: 'Hôtels', icon: Bed, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-800' },
  { id: 'events', label: 'Événements', icon: PartyPopper, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800' },
  { id: 'training', label: 'Formation', icon: BookOpen, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800' },
  { id: 'services', label: 'Services', icon: Hand, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800' },
  { id: 'modules', label: 'Modules', icon: Puzzle, color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800' },
  { id: 'portfolio', label: 'Portfolio', icon: Palette, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800' },
  { id: 'business', label: 'Business', icon: Building2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800' },
];

export default function QuickCategories({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Parcourir par catégorie</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(isActive ? '' : cat.id)}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200',
                isActive
                  ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20 scale-105'
                  : `${cat.bg} ${cat.color} hover:shadow-sm hover:scale-105`,
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {cat.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
