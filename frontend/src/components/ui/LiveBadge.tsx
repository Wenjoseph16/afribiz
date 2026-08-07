'use client';

import { cn } from '@/lib/utils';

type Tone = 'success' | 'danger' | 'warning' | 'muted' | 'brand';

const dotTones: Record<Tone, string> = {
  brand: 'bg-brand-500',
  success: 'bg-emerald-500',
  danger: 'bg-red-500',
  warning: 'bg-amber-500',
  muted: 'bg-gray-400',
};

const textTones: Record<Tone, string> = {
  brand: 'text-brand-700 dark:text-brand-300',
  success: 'text-emerald-700 dark:text-emerald-300',
  danger: 'text-red-700 dark:text-red-300',
  warning: 'text-amber-700 dark:text-amber-300',
  muted: 'text-gray-500 dark:text-gray-400',
};

interface LiveBadgeProps {
  tone?: Tone;
  label?: React.ReactNode;
  value?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

/**
 * Badge "temps réel" à point pulsant. Utilisé partout pour signaler un état
 * vivant (connexions en direct, santé de passerelle, risque actif, etc.).
 */
export function LiveBadge({
  tone = 'success',
  label,
  value,
  pulse = true,
  className,
}: LiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
        'bg-white/70 dark:bg-gray-800/70 border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              dotTones[tone]
            )}
          />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotTones[tone])} />
      </span>
      {label && <span className={cn('capitalize', textTones[tone])}>{label}</span>}
      {value !== undefined && (
        <span className="font-semibold text-gray-900 dark:text-gray-100">{value}</span>
      )}
    </span>
  );
}
