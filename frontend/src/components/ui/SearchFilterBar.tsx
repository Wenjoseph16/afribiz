'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface Filter {
  label: string;
  options: FilterOption[];
  active: string;
  onChange: (value: string) => void;
}

interface SearchFilterBarProps {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: Filter[];
  onClear?: () => void;
  className?: string;
  debounceMs?: number;
}

export function SearchFilterBar({
  searchPlaceholder = 'Rechercher...',
  searchValue,
  onSearchChange,
  filters,
  onClear,
  className,
  debounceMs = 300,
}: SearchFilterBarProps) {
  const [localValue, setLocalValue] = useState(searchValue);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(searchValue);
  }, [searchValue]);

  const handleChange = useCallback(
    (val: string) => {
      setLocalValue(val);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearchChange(val), debounceMs);
    },
    [onSearchChange, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasFilters = filters && filters.length > 0;

  return (
    <div className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-3', className)}>
      <div className="relative flex-1 w-full sm:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
        />
        {localValue && (
          <button
            onClick={() => {
              setLocalValue('');
              onSearchChange('');
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hasFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map((filter, i) => (
            <div key={i} className="flex items-center">
              {filter.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => filter.onChange(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-all first:rounded-l-lg last:rounded-r-lg border',
                    opt.value === filter.active
                      ? 'bg-brand text-white border-brand shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span
                      className={cn(
                        'ml-1.5 px-1 py-0.5 rounded text-[10px]',
                        opt.value === filter.active ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                      )}
                    >
                      {opt.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
