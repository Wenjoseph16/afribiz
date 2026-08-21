'use client';

import Link from 'next/link';
import {
  ShoppingBag,
  Calendar,
  Home,
  Ticket,
  RefreshCw,
  GraduationCap,
  PiggyBank,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { TransactionSnapshot, TransactionType } from '@/types/transactions';

const TYPE_ICONS: Record<TransactionType, LucideIcon> = {
  ORDER: ShoppingBag,
  BOOKING: Calendar,
  RENTAL: Home,
  EVENT: Ticket,
  SUBSCRIPTION: RefreshCw,
  TRAINING: GraduationCap,
  LAYAWAY: PiggyBank,
};

const TYPE_COLORS: Record<TransactionType, { bg: string; text: string; ring: string }> = {
  ORDER: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'ring-emerald-500/20',
  },
  BOOKING: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/20',
  },
  RENTAL: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-600 dark:text-purple-400',
    ring: 'ring-purple-500/20',
  },
  EVENT: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/20',
  },
  SUBSCRIPTION: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400',
    ring: 'ring-indigo-500/20',
  },
  TRAINING: {
    bg: 'bg-violet-100 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-400',
    ring: 'ring-violet-500/20',
  },
  LAYAWAY: {
    bg: 'bg-teal-100 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-400',
    ring: 'ring-teal-500/20',
  },
};

const STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  ACCEPTED: 'success',
  PREPARING: 'info',
  READY: 'success',
  DELIVERING: 'info',
  DELIVERED: 'success',
  COMPLETED: 'default',
  CANCELLED: 'danger',
  REFUSED: 'danger',
  ACTIVE: 'success',
  IN_PROGRESS: 'info',
  REGISTERED: 'info',
  ATTENDED: 'success',
  NOT_STARTED: 'warning',
  EXPIRED: 'danger',
  RENEWED: 'success',
  OVERDUE: 'danger',
  RETURNED: 'default',
  NO_SHOW: 'danger',
  RESCHEDULED: 'warning',
  PAUSE: 'warning',
  REFUNDED: 'default',
  SHIPPED: 'info',
};

interface TransactionCardProps {
  transaction: TransactionSnapshot;
  compact?: boolean;
}

export function TransactionCard({ transaction, compact = false }: TransactionCardProps) {
  const Icon = TYPE_ICONS[transaction.type];
  const colors = TYPE_COLORS[transaction.type];
  const variant = STATUS_VARIANTS[transaction.status] || 'default';

  const href =
    transaction.type === 'ORDER'
      ? `/dashboard/orders/${transaction.id}`
      : transaction.type === 'BOOKING'
        ? `/dashboard/bookings/${transaction.id}`
        : transaction.type === 'EVENT'
          ? `/dashboard/my-events/${transaction.id}`
          : transaction.type === 'SUBSCRIPTION'
            ? `/dashboard/my-subscriptions/${transaction.id}`
            : transaction.type === 'TRAINING'
              ? `/dashboard/my-trainings/${transaction.id}`
              : transaction.type === 'LAYAWAY'
                ? `/dashboard/my-layaway/${transaction.id}`
                : `/dashboard/my-rentals/${transaction.id}`;

  return (
    <Link href={href}>
      <Card
        className={cn(
          'group p-4 hover:shadow-md hover:ring-1 transition-all duration-200 cursor-pointer',
          colors.ring
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-xl shrink-0', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {transaction.title}
                  </h3>
                  <Badge variant={variant} size="xs">
                    {transaction.statusLabel}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  #{transaction.number}
                  {transaction.business && <> · {transaction.business.name}</>}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 shrink-0 transition-colors" />
            </div>

            {transaction.progress !== undefined && transaction.progress > 0 && (
              <div className="mt-2.5">
                <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      transaction.progress === 100
                        ? 'bg-emerald-500'
                        : transaction.progress > 0
                          ? 'bg-brand'
                          : 'bg-gray-300'
                    )}
                    style={{ width: `${transaction.progress}%` }}
                  />
                </div>
              </div>
            )}

            {!compact && (
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>
                  {transaction.amount > 0 && (
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {transaction.amount.toLocaleString('fr-FR')} {transaction.currency}
                    </span>
                  )}
                </span>
                <span>
                  {new Date(transaction.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
