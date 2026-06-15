'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  items: DropdownItem[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
}

export function Dropdown({ items, value, onChange, placeholder = 'Sélectionner...', className, triggerClassName, menuClassName, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center justify-between w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand',
          triggerClassName
        )}
      >
        <span className={cn('truncate', !selected && 'text-gray-400 dark:text-gray-500')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full min-w-[10rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-dropdown py-1 animate-scale-in',
            align === 'right' ? 'right-0' : 'left-0',
            menuClassName
          )}
        >
          {items.map((item) => (
            <button
              key={item.value}
              onClick={() => { onChange(item.value); setOpen(false); }}
              disabled={item.disabled}
              className={cn(
                'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm transition-colors',
                value === item.value
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand dark:text-brand-400 font-medium'
                  : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50',
                item.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
