'use client';

import { useState, useEffect, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { FormField } from './FormField';

interface MoneyInputProps {
  label?: string;
  error?: string;
  help?: string;
  hint?: string;
  required?: boolean;
  currency?: string;
  value?: number | string | null;
  onChange?: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  className?: string;
  id?: string;
}

/** Formate 12345 → "12 345" */
export function formatMoney(value: number): string {
  if (!isFinite(value)) return '';
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Décode "12 345" → 12345 (ignorer tout sauf chiffres) */
export function parseMoney(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? parseInt(digits, 10) : 0;
}

/**
 * FormKit — MoneyInput
 * Saisie montant en FCFA : formatage automatique (séparateur de milliers),
 * devise affichée à droite, sortie numérique propre.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(
  (
    {
      label,
      error,
      help,
      hint,
      required,
      currency = 'FCFA',
      value,
      onChange,
      placeholder,
      disabled,
      min,
      max,
      className,
      id,
    },
    ref
  ) => {
    const [display, setDisplay] = useState<string>(
      value !== undefined && value !== null ? formatMoney(Number(value)) : ''
    );

    useEffect(() => {
      if (value === undefined || value === null) {
        setDisplay('');
        return;
      }
      setDisplay(formatMoney(Number(value)));
    }, [value]);

    const handleChange = (raw: string) => {
      setDisplay(raw);
      const num = parseMoney(raw);
      let final = num;
      if (min !== undefined && final < min) final = min;
      if (max !== undefined && final > max) final = max;
      onChange?.(final);
    };

    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <FormField
        label={label}
        htmlFor={inputId}
        error={error}
        help={help}
        hint={hint}
        required={required}
      >
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            inputMode="numeric"
            autoComplete="off"
            value={display}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder={placeholder || '0'}
            disabled={disabled}
            className={cn(
              'w-full px-4 py-2.5 rounded-xl border-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 transition-all duration-200 focus-ring',
              error
                ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-200 dark:border-gray-700 focus:border-brand focus:ring-brand/20',
              disabled && 'bg-gray-50 dark:bg-gray-800/50 cursor-not-allowed opacity-60',
              currency && 'pr-16',
              className
            )}
          />
          {currency && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 dark:text-gray-500 pointer-events-none uppercase">
              {currency}
            </span>
          )}
        </div>
      </FormField>
    );
  }
);

MoneyInput.displayName = 'MoneyInput';
