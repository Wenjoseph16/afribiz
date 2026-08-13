'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/Card';

export interface SummaryRow {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  muted?: boolean;
}

interface LiveSummaryProps {
  title?: string;
  rows: SummaryRow[];
  totalLabel?: string;
  total?: ReactNode;
  footer?: ReactNode;
  className?: string;
  sticky?: boolean;
  children?: ReactNode;
}

/**
 * FormKit — LiveSummary
 * Récapitulatif temps réel (devis, facture, checkout) :
 * les totaux se recalculent pendant la saisie, jamais de calcul mental.
 */
export function LiveSummary({
  title = 'Récapitulatif',
  rows,
  totalLabel = 'Total',
  total,
  footer,
  className,
  sticky = true,
  children,
}: LiveSummaryProps) {
  return (
    <Card padding="lg" className={cn(sticky && 'sticky top-24', className)}>
      {title && (
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">{title}</h2>
      )}

      {children}

      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex justify-between text-sm',
              row.highlight ? 'font-bold text-gray-900 dark:text-white' : '',
              row.muted ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            <span>{row.label}</span>
            <span className={cn('font-medium', row.highlight && 'text-brand')}>{row.value}</span>
          </div>
        ))}
      </div>

      {total !== undefined && (
        <div className="flex justify-between text-lg font-bold border-t border-gray-100 dark:border-gray-800 pt-3 mt-3">
          <span className="text-gray-900 dark:text-white">{totalLabel}</span>
          <span className="text-brand">{total}</span>
        </div>
      )}

      {footer && <div className="mt-5">{footer}</div>}
    </Card>
  );
}
