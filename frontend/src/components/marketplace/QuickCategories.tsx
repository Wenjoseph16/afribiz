'use client';

import { cn } from '@/lib/utils';
import {
  ShoppingBag,
  Utensils,
  Sparkles,
  Car,
  Building2,
  PartyPopper,
  BookOpen,
  Hand,
  Puzzle,
  Palette,
  Bed,
  ChevronRight,
} from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  hoverGradient: string;
  count?: number;
}

const CATEGORIES: Category[] = [
  {
    id: 'PRODUCT',
    label: 'Produits',
    icon: ShoppingBag,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800',
    hoverGradient: 'hover:from-blue-500 hover:to-blue-600 hover:text-white hover:border-blue-500',
  },
  {
    id: 'RESTAURANT',
    label: 'Restaurants',
    icon: Utensils,
    color: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-900/30 border-orange-100 dark:border-orange-800',
    hoverGradient:
      'hover:from-orange-500 hover:to-orange-600 hover:text-white hover:border-orange-500',
  },
  {
    id: 'SALON_BEAUTE',
    label: 'Beauté',
    icon: Sparkles,
    color: 'text-pink-600 dark:text-pink-400',
    bg: 'bg-pink-50 dark:bg-pink-900/30 border-pink-100 dark:border-pink-800',
    hoverGradient: 'hover:from-pink-500 hover:to-pink-600 hover:text-white hover:border-pink-500',
  },
  {
    id: 'RENTAL',
    label: 'Location',
    icon: Car,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-100 dark:border-indigo-800',
    hoverGradient:
      'hover:from-indigo-500 hover:to-indigo-600 hover:text-white hover:border-indigo-500',
  },
  {
    id: 'HOTEL',
    label: 'Hôtels',
    icon: Bed,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/30 border-teal-100 dark:border-teal-800',
    hoverGradient: 'hover:from-teal-500 hover:to-teal-600 hover:text-white hover:border-teal-500',
  },
  {
    id: 'EVENT',
    label: 'Événements',
    icon: PartyPopper,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/30 border-red-100 dark:border-red-800',
    hoverGradient: 'hover:from-red-500 hover:to-red-600 hover:text-white hover:border-red-500',
  },
  {
    id: 'TRAINING',
    label: 'Formation',
    icon: BookOpen,
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800',
    hoverGradient: 'hover:from-cyan-500 hover:to-cyan-600 hover:text-white hover:border-cyan-500',
  },
  {
    id: 'SERVICE',
    label: 'Services',
    icon: Hand,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800',
    hoverGradient:
      'hover:from-purple-500 hover:to-purple-600 hover:text-white hover:border-purple-500',
  },
  {
    id: 'MODULE',
    label: 'Modules',
    icon: Puzzle,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/30 border-violet-100 dark:border-violet-800',
    hoverGradient:
      'hover:from-violet-500 hover:to-violet-600 hover:text-white hover:border-violet-500',
  },
  {
    id: 'PORTFOLIO',
    label: 'Portfolio',
    icon: Palette,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/30 border-rose-100 dark:border-rose-800',
    hoverGradient: 'hover:from-rose-500 hover:to-rose-600 hover:text-white hover:border-rose-500',
  },
  {
    id: 'BUSINESS',
    label: 'Business',
    icon: Building2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800',
    hoverGradient:
      'hover:from-emerald-500 hover:to-emerald-600 hover:text-white hover:border-emerald-500',
  },
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-1 h-6 rounded-full bg-brand" />
          Parcourir par catégorie
        </h2>
        <button
          onClick={() => onSelect('')}
          className="text-xs text-gray-400 hover:text-brand flex items-center gap-0.5 transition-colors"
        >
          Tout voir
          <ChevronRight className="h-3 w-3" />
        </button>
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
                'group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-300 overflow-hidden',
                'hover:shadow-md hover:-translate-y-0.5 active:scale-95',
                isActive
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20 scale-105'
                  : `${cat.bg} ${cat.color} ${cat.hoverGradient} dark:hover:brightness-110`
              )}
            >
              {/* Hover gradient overlay */}
              {!isActive && (
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
              )}
              <div className="relative z-10 flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-8deg]" />
                <span className="relative">
                  {cat.label}
                  {/* Active indicator dot */}
                  {isActive && (
                    <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
