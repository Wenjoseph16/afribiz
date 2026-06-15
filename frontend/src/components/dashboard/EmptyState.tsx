'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20 px-4', className)}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 dark:from-brand-900/30 dark:to-emerald-900/20 border border-brand-100/50 dark:border-brand-800/30 flex items-center justify-center mb-5 text-brand/40 dark:text-brand-400/40 shadow-sm shadow-brand-100/50 dark:shadow-brand-900/20">
        {icon || <Inbox className="h-8 w-8" />}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div className="[&>a]:inline-block">{action}</div>}
    </div>
  );
}
