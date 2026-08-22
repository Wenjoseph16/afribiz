'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  count?: number;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** En-tête de section vitrine — pill eyebrow + titre XXL + compteur. */
export function SectionHeader({
  eyebrow,
  title,
  count,
  description,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-10 md:mb-14', className)}>
      <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-brand-50 text-brand-700 border border-brand-100 mb-4">
        {eyebrow}
      </span>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">{description}</p>
          ) : (
            typeof count === 'number' && (
              <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
                {count} {count > 1 ? 'disponibles' : 'disponible'}
              </p>
            )
          )}
        </div>
        {action}
      </div>
    </div>
  );
}

/** Compteur avec unité personnalisée (ex : "12 plats", "3 événements"). */
export function SectionCount({
  count,
  singular,
  plural,
}: {
  count: number;
  singular: string;
  plural?: string;
}) {
  return (
    <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
      {count} {count > 1 ? plural || `${singular}s` : singular}
    </p>
  );
}
