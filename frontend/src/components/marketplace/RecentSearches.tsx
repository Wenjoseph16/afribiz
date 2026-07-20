'use client';

import { X, Search, Clock, Trash2 } from 'lucide-react';

interface RecentSearchesProps {
  searches: string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClear: () => void;
}

export default function RecentSearches({
  searches,
  onSelect,
  onRemove,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) return null;

  return (
    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          Recherches récentes
        </span>
        <button
          onClick={onClear}
          className="text-[10px] text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Effacer
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {searches.map((query) => (
          <div
            key={query}
            className="group flex items-center gap-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full pl-2.5 pr-1 py-1 cursor-pointer transition-colors"
          >
            <button
              onClick={() => onSelect(query)}
              className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
            >
              <Search className="h-3 w-3" />
              {query}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(query);
              }}
              className="p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
