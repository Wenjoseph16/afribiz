'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users,
  MessageCircle, Star, Clock,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface GrowthSummaryProps {
  stats: {
    revenueToday: number;
    revenueYesterday: number;
    revenueWeek: number;
    ordersToday: number;
    ordersPending: number;
    newMessages: number;
    unreadReviews: number;
    newCustomers: number;
    activeBookings: number;
  };
  businessName?: string;
}

export default function GrowthSummaryCard({ stats, businessName }: GrowthSummaryProps) {
  const revenueChange = useMemo(() => {
    if (stats.revenueYesterday === 0) return stats.revenueToday > 0 ? 100 : 0;
    return Math.round(((stats.revenueToday - stats.revenueYesterday) / stats.revenueYesterday) * 100);
  }, [stats.revenueToday, stats.revenueYesterday]);

  const totalPending = stats.ordersPending + stats.newMessages + stats.unreadReviews;

  const items = [
    {
      label: "Revenu aujourd'hui",
      value: `${stats.revenueToday.toLocaleString()} FCFA`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      trend: revenueChange !== 0 ? { value: `${revenueChange > 0 ? '+' : ''}${revenueChange}%`, positive: revenueChange > 0 } : undefined,
    },
    {
      label: 'Commandes en cours',
      value: stats.ordersPending.toString(),
      icon: ShoppingBag,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      link: '/dashboard/orders',
    },
    {
      label: 'Messages non lus',
      value: stats.newMessages.toString(),
      icon: MessageCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-900/20',
      link: '/dashboard/messages',
    },
    {
      label: 'Nouveaux clients (7j)',
      value: stats.newCustomers.toString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Avis en attente',
      value: stats.unreadReviews.toString(),
      icon: Star,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      link: '/dashboard/reviews',
    },
    {
      label: 'Réservations actives',
      value: stats.activeBookings.toString(),
      icon: Clock,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      link: '/dashboard/bookings',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
            {businessName || 'Business'} — Aujourd'hui
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {stats.revenueToday.toLocaleString()} FCFA
            <span className={cn('text-sm font-medium ml-2',
              revenueChange > 0 ? 'text-emerald-600' : revenueChange < 0 ? 'text-red-500' : 'text-gray-400'
            )}>
              {revenueChange > 0 && <TrendingUp className="inline h-3.5 w-3.5 mr-0.5" />}
              {revenueChange < 0 && <TrendingDown className="inline h-3.5 w-3.5 mr-0.5" />}
              {revenueChange !== 0 ? `${revenueChange > 0 ? '+' : ''}${revenueChange}% vs hier` : '—'}
            </span>
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">{totalPending} action{totalPending > 1 ? 's' : ''} en attente</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          const content = (
            <div className={cn('p-3 rounded-xl transition-colors', item.bg, item.link && 'hover:opacity-80 cursor-pointer')}>
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', item.color)} />
                <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase">{item.label}</span>
              </div>
              <p className={cn('text-lg font-bold mt-1', item.color)}>{item.value}</p>
              {item.trend && (
                <p className={cn('text-[10px] font-medium mt-0.5', item.trend.positive ? 'text-emerald-600' : 'text-red-500')}>
                  {item.trend.value}
                </p>
              )}
            </div>
          );
          return item.link ? <Link key={item.label} href={item.link}>{content}</Link> : <div key={item.label}>{content}</div>;
        })}
      </div>
    </div>
  );
}
