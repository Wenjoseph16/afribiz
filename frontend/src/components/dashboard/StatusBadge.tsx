'use client';

import { cn } from '@/lib/utils';

type StatusVariant =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded'
  | 'dispute'
  | 'paid'
  | 'unpaid'
  | 'partial';

const statusConfig: Record<StatusVariant, { label: string; classes: string; dot: string }> = {
  pending:    { label: 'En attente',  classes: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  confirmed:  { label: 'Confirmé',    classes: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  preparing:  { label: 'En préparation', classes: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500' },
  shipped:    { label: 'Expédié',     classes: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  delivered:  { label: 'Livré',       classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  cancelled:  { label: 'Annulé',      classes: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  refunded:   { label: 'Remboursé',   classes: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  dispute:    { label: 'Litige',      classes: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  paid:       { label: 'Payé',        classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  unpaid:     { label: 'Impayé',      classes: 'bg-gray-50 text-gray-700 border-gray-200', dot: 'bg-gray-500' },
  partial:    { label: 'Partiel',     classes: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
};

interface StatusBadgeProps {
  variant: StatusVariant;
  className?: string;
}

export function StatusBadge({ variant, className }: StatusBadgeProps) {
  const config = statusConfig[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.classes,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
