'use client';

import { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormField } from './FormField';

export interface ChoiceCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: string; // petit badge (ex: "Populaire")
}

interface ChoiceCardProps {
  options: ChoiceCardOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string;
  help?: string;
  required?: boolean;
  columns?: 1 | 2 | 3 | 4;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * FormKit — ChoiceCard
 * Sélecteur à cartes visuelles (livraison/retrait, mode de paiement, type de prix…).
 * Alternative moderne aux radios : icône + libellé + description, état sélectionné clair.
 */
export function ChoiceCard({
  options,
  value,
  onChange,
  label,
  error,
  help,
  required,
  columns = 2,
  size = 'md',
  className,
}: ChoiceCardProps) {
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  };

  return (
    <FormField label={label} error={error} help={help} required={required} className={className}>
      <div role="radiogroup" className={cn('grid gap-2.5', gridCols[columns])}>
        {options.map((opt) => {
          const selected = opt.value === value;
          const disabled = !!opt.disabled;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => !disabled && onChange?.(opt.value)}
              className={cn(
                'relative flex items-start gap-3 rounded-xl border-2 text-left transition-all duration-200',
                size === 'sm' ? 'p-3' : 'p-4',
                selected
                  ? 'border-brand bg-brand/5 ring-4 ring-brand/10'
                  : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {opt.icon && (
                <div
                  className={cn(
                    'shrink-0 rounded-lg p-2 transition-colors',
                    selected ? 'bg-brand text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                  )}
                >
                  {opt.icon}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'font-bold text-gray-900 dark:text-white',
                      size === 'sm' ? 'text-xs' : 'text-sm'
                    )}
                  >
                    {opt.label}
                  </p>
                  {opt.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-wide">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {opt.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {opt.description}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors mt-0.5',
                  selected ? 'border-brand bg-brand' : 'border-gray-300 dark:border-gray-600'
                )}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
              </span>
            </button>
          );
        })}
      </div>
    </FormField>
  );
}
