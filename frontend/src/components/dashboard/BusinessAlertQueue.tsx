'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  CalendarCheck2,
  PackageOpen,
  Star,
  Wallet,
  Truck,
  FileText,
  Percent,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface BusinessAlert {
  key: string;
  label: string;
  count: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  link: string;
}

interface AlertQueue {
  alerts: BusinessAlert[];
  total: number;
  urgent: number;
  generatedAt: string;
}

const ALERT_META: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  'pending-orders': { icon: ShoppingBag, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
  'pending-bookings': { icon: CalendarCheck2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  'low-stock': { icon: PackageOpen, color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30' },
  'unanswered-reviews': { icon: Star, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  'active-debts': { icon: Wallet, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  'overdue-debts': { icon: Wallet, color: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  'active-deliveries': { icon: Truck, color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30' },
  'unpaid-invoices': { icon: FileText, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' },
  'expiring-promotions': { icon: Percent, color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/30' },
};

const SEVERITY_DOT: Record<string, string> = {
  CRITICAL: 'bg-red-500',
  HIGH: 'bg-amber-500',
  MEDIUM: 'bg-blue-400',
  LOW: 'bg-gray-300 dark:bg-gray-600',
};

export default function BusinessAlertQueue() {
  const { data, isLoading } = useQuery({
    queryKey: ['business', 'alert-queue'],
    queryFn: async () => {
      const res = await apiClient.get('/business/alert-queue');
      return res.data.data as AlertQueue;
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="h-48 rounded-xl bg-gray-50 dark:bg-gray-800/50 animate-pulse" />;
  }

  const alerts = data?.alerts || [];
  const urgent = data?.urgent || 0;

  return (
    <Card padding="lg" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            À traiter aujourd&apos;hui
          </h3>
        </div>
        {urgent > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
            {urgent} urgent{urgent > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tout est en ordre
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Aucune action requise pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const meta = ALERT_META[alert.key] || {
              icon: AlertTriangle,
              color: 'text-gray-600 bg-gray-50 dark:bg-gray-800',
            };
            const Icon = meta.icon;
            return (
              <Link
                key={alert.key}
                href={alert.link}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
              >
                <div className={cn('p-2 rounded-lg shrink-0', meta.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {alert.label}
                  </p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {alert.count} à traiter
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn('w-2 h-2 rounded-full', SEVERITY_DOT[alert.severity])} />
                  <ArrowRight className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 group-hover:text-brand transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
