'use client';

import { cn } from '@/lib/utils';
import type { TransactionType } from '@/types/transactions';

const TYPE_PROGRESS_COLORS: Record<TransactionType, { bar: string; bg: string }> = {
  ORDER: { bar: 'bg-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
  BOOKING: { bar: 'bg-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
  RENTAL: { bar: 'bg-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  EVENT: { bar: 'bg-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/20' },
  SUBSCRIPTION: { bar: 'bg-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/20' },
  TRAINING: { bar: 'bg-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/20' },
  LAYAWAY: { bar: 'bg-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/20' },
};

interface TransactionProgressProps {
  type: TransactionType;
  progress: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TransactionProgress({
  type,
  progress,
  label,
  showPercentage = true,
  size = 'md',
}: TransactionProgressProps) {
  const colors = TYPE_PROGRESS_COLORS[type];
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          {label && <span className="text-gray-500 dark:text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="font-medium text-gray-700 dark:text-gray-300">{clampedProgress}%</span>
          )}
        </div>
      )}
      <div className={cn('rounded-full overflow-hidden', heights[size], colors.bg)}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            clampedProgress === 100 ? 'bg-emerald-500' : colors.bar
          )}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}
