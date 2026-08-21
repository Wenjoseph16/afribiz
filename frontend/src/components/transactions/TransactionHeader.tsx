'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  ShoppingBag,
  Calendar,
  Home,
  Ticket,
  RefreshCw,
  GraduationCap,
  PiggyBank,
  MessageCircle,
  Download,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
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

const TYPE_COLORS: Record<TransactionType, string> = {
  ORDER: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  BOOKING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  RENTAL: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  EVENT: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  SUBSCRIPTION: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
  TRAINING: 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400',
  LAYAWAY: 'bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400',
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

interface TransactionHeaderProps {
  transaction: TransactionSnapshot;
  onOpenChat?: () => void;
}

export function TransactionHeader({ transaction, onOpenChat }: TransactionHeaderProps) {
  const Icon = TYPE_ICONS[transaction.type];
  const colorClass = TYPE_COLORS[transaction.type];
  const variant = STATUS_VARIANTS[transaction.status] || 'default';

  const backHref =
    transaction.type === 'ORDER'
      ? '/dashboard/orders'
      : transaction.type === 'BOOKING'
        ? '/dashboard/bookings'
        : transaction.type === 'EVENT'
          ? '/dashboard/my-events'
          : transaction.type === 'SUBSCRIPTION'
            ? '/dashboard/my-subscriptions'
            : transaction.type === 'TRAINING'
              ? '/dashboard/my-trainings'
              : transaction.type === 'LAYAWAY'
                ? '/dashboard/my-layaway'
                : '/dashboard/my-rentals';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', colorClass)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                  {transaction.title}
                </h1>
                <Badge variant={variant}>{transaction.statusLabel}</Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{transaction.number}
                {transaction.business && <> · {transaction.business.name}</>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {transaction.progress !== undefined && transaction.progress > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500 dark:text-gray-400">Progression</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {transaction.progress}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                transaction.progress === 100 ? 'bg-emerald-500' : 'bg-brand'
              )}
              style={{ width: `${transaction.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="flex items-center gap-2">
        {onOpenChat && (
          <Button variant="secondary" size="sm" onClick={onOpenChat}>
            <MessageCircle className="h-4 w-4 mr-1.5" />
            Contacter
          </Button>
        )}
        {transaction.type === 'EVENT' && (transaction.meta?.qrCode as string) && (
          <Button variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Billet
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
