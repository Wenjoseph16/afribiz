'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Sunrise,
  ShoppingBag,
  CalendarCheck2,
  MessageCircle,
  ListTodo,
  Clock,
  Percent,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface GrowthBrief {
  id: string;
  type: string;
  date: string;
  metrics: {
    ordersToday: number;
    ordersPending: number;
    bookingsToday: number;
    bookingsPending: number;
    paymentsPending: number;
    paymentsTotal: number;
    tasksDue: number;
    tasksHighPriority: number;
    unreadMessages: number;
    eventsToday: number;
    activePromotions: number;
  };
  advice: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    action?: string;
    link?: string;
  }[];
  quickActions: { label: string; icon: string; link: string }[];
}

const PRIORITY_STYLE: Record<string, string> = {
  high: 'border-l-red-500',
  medium: 'border-l-amber-500',
  low: 'border-l-emerald-500',
};

export default function BusinessMorningBrief() {
  const { data: brief, isLoading } = useQuery({
    queryKey: ['growth', 'brief'],
    queryFn: async () => {
      const res = await apiClient.get('/growth/brief');
      return res.data.data as GrowthBrief;
    },
    refetchInterval: 300_000,
  });

  if (isLoading) {
    return <div className="h-40 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />;
  }

  if (!brief) return null;

  // metrics est un Json nullable en base — toujours protéger l'accès
  const m = brief.metrics || {};
  const metrics = [
    { icon: ShoppingBag, label: 'Commandes du jour', value: m.ordersToday, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
    { icon: CalendarCheck2, label: 'Réservations du jour', value: m.bookingsToday, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
    { icon: MessageCircle, label: 'Messages non lus', value: m.unreadMessages, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30' },
    { icon: ListTodo, label: 'Tâches en retard', value: m.tasksDue, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
    { icon: Clock, label: 'Paiements en attente', value: m.paymentsPending, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
    { icon: Percent, label: 'Promos actives', value: m.activePromotions, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30' },
  ];

  const topAdvice = (brief.advice || []).slice(0, 3);

  return (
    <Card padding="lg" className="bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-950/20 dark:via-gray-900 dark:to-orange-950/20 border-amber-100 dark:border-amber-900/40">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
          <Sunrise className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
            Brief du matin
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {brief.date
              ? new Date(brief.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : "Votre journée en un coup d'œil"}
          </p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {metrics.map((mt) => {
          const Icon = mt.icon;
          return (
            <div
              key={mt.label}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white/60 dark:bg-gray-800/40"
            >
              <div className={cn('p-1.5 rounded-lg', mt.color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{mt.value}</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center leading-tight">
                {mt.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Advice */}
      {topAdvice.length > 0 && (
        <div className="mt-4 space-y-2">
          {topAdvice.map((a, i) => (
            <div
              key={i}
              className={cn(
                'flex items-start gap-2.5 p-3 rounded-r-xl bg-white/70 dark:bg-gray-800/50 border-l-4 pl-3',
                PRIORITY_STYLE[a.priority] || PRIORITY_STYLE.low
              )}
            >
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{a.message}</p>
                {a.action && a.link && (
                  <Link
                    href={a.link}
                    className="inline-flex items-center gap-1 mt-1.5 text-xs font-semibold text-brand hover:text-brand-700"
                  >
                    {a.action}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick actions */}
      {brief.quickActions && brief.quickActions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-amber-100 dark:border-amber-900/40">
          <div className="flex flex-wrap gap-2">
            {brief.quickActions.map((qa, i) => (
              <Link
                key={i}
                href={qa.link}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white/70 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-full hover:border-brand/40 hover:text-brand transition-colors"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                {qa.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
