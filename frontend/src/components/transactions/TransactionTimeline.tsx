'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimelineEvent } from '@/types/transactions';

interface TransactionTimelineProps {
  events: TimelineEvent[];
  compact?: boolean;
}

export function TransactionTimeline({ events, compact = false }: TransactionTimelineProps) {
  if (!events.length) return null;

  return (
    <div className="relative">
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const isCurrent = event.isCurrent;

        return (
          <div key={event.id} className="flex gap-3 relative">
            {/* Vertical line */}
            {!isLast && (
              <div className="absolute left-[11px] top-6 w-0.5 h-full bg-gray-200 dark:bg-gray-700" />
            )}

            {/* Icon */}
            <div className="relative z-10 shrink-0 mt-0.5">
              {isCurrent ? (
                <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                  <Circle className="h-3 w-3 text-white fill-current" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className={cn('pb-6', isLast && 'pb-0')}>
              <p
                className={cn(
                  'text-sm font-medium',
                  isCurrent
                    ? 'text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {event.label}
              </p>
              {!compact && event.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {event.description}
                </p>
              )}
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(event.timestamp).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
