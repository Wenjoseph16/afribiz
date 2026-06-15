'use client';

import { SlidersHorizontal, Grid3X3, List, ChevronDown, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import MapToggle from '@/components/marketplace/MapToggle';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Populaire' },
  { value: 'newest', label: 'Plus récent' },
  { value: 'rating', label: 'Mieux noté' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'distance', label: 'Le plus proche' },
];

interface SearchToolbarProps {
  totalResults: number;
  view: 'grid' | 'list';
  onViewChange: (view: 'grid' | 'list') => void;
  sort: string;
  onSortChange: (sort: string) => void;
  showMap: boolean;
  onMapToggle: () => void;
  onMobileFilterOpen: () => void;
  isSearching: boolean;
  hasLocation: boolean;
  showMobileSort: boolean;
  onMobileSortToggle: () => void;
  onMobileSortClose: () => void;
}

export default function SearchToolbar({
  totalResults,
  view,
  onViewChange,
  sort,
  onSortChange,
  showMap,
  onMapToggle,
  onMobileFilterOpen,
  isSearching,
  hasLocation,
  showMobileSort,
  onMobileSortToggle,
  onMobileSortClose,
}: SearchToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalResults}</span> résultat{totalResults !== 1 ? 's' : ''}
          {!isSearching && ' (tendance)'}
        </p>
        {hasLocation && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <MapPin className="h-3 w-3" /> Localisé
          </span>
        )}
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
          <button onClick={() => onViewChange('grid')} className={cn('p-1.5 rounded-md transition-colors', view === 'grid' && !showMap ? 'bg-brand text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300')}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => onViewChange('list')} className={cn('p-1.5 rounded-md transition-colors', view === 'list' && !showMap ? 'bg-brand text-white shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300')}>
            <List className="h-4 w-4" />
          </button>
          <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
          <MapToggle showMap={showMap} onToggle={onMapToggle} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={onMobileFilterOpen} className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <SlidersHorizontal className="h-4 w-4" /> Filtres
        </button>
        <div className="relative">
          <button onClick={onMobileSortToggle} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Tri : {SORT_OPTIONS.find((o) => o.value === sort)?.label} <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
          </button>
          {showMobileSort && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg z-30 py-1">
              {SORT_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => { onSortChange(opt.value); onMobileSortClose(); }}
                  className={cn('block w-full text-left px-4 py-2 text-sm transition-colors',
                    sort === opt.value ? 'text-brand font-medium bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')}>
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
