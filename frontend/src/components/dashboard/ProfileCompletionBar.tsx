'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProfileCompletionBarProps {
  percentage: number;
  className?: string;
}

export function ProfileCompletionBar({ percentage, className }: ProfileCompletionBarProps) {
  const isComplete = percentage >= 100;
  const isLow = percentage < 50;

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className={cn('h-5 w-5', isLow ? 'text-red-500' : 'text-amber-500')} />
            )}
            <span className="text-sm font-semibold text-gray-900">
              {isComplete ? 'Profil complété' : 'Profil incomplet'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {isComplete
              ? 'Vous avez accès à toutes les fonctionnalités.'
              : 'Complétez votre profil pour accéder à toutes les fonctionnalités.'}
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isComplete ? 'bg-emerald-500' : isLow ? 'bg-red-400' : 'bg-amber-400'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 shrink-0">{percentage}%</span>
          </div>
        </div>
        {!isComplete && (
          <Link
            href="/dashboard/profile"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 shrink-0 pt-1"
          >
            Compléter →
          </Link>
        )}
      </div>
    </div>
  );
}
