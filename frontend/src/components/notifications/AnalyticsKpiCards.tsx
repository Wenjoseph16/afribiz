'use client';

import { Bell, CheckCheck, Mail, Activity, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

interface KpiData {
  total?: number;
  read?: number;
  unread?: number;
  readRate?: number;
  last30Days?: number;
  trend?: number;
  deliverySuccessRate?: number;
}

export function AnalyticsKpiCards({ summary }: { summary: KpiData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <StatsCard
        icon={<Bell className="h-5 w-5" />}
        iconBg="bg-brand-50 dark:bg-brand-900/30"
        iconColor="text-brand"
        label="Total notifications"
        value={summary.total?.toLocaleString() || '0'}
        trend={
          summary.last30Days && summary.last30Days > 0
            ? { value: `${summary.last30Days} ce mois`, positive: true }
            : undefined
        }
      />
      <StatsCard
        icon={<CheckCheck className="h-5 w-5" />}
        iconBg="bg-emerald-50 dark:bg-emerald-900/30"
        iconColor="text-emerald-600"
        label="Lues"
        value={summary.read?.toLocaleString() || '0'}
        trend={
          summary.readRate
            ? { value: `${summary.readRate}% de lecture`, positive: summary.readRate > 50 }
            : undefined
        }
      />
      <StatsCard
        icon={<Mail className="h-5 w-5" />}
        iconBg="bg-amber-50 dark:bg-amber-900/30"
        iconColor="text-amber-600"
        label="Non lues"
        value={summary.unread?.toLocaleString() || '0'}
      />
      <StatsCard
        icon={<Activity className="h-5 w-5" />}
        iconBg="bg-blue-50 dark:bg-blue-900/30"
        iconColor="text-blue-600"
        label="Tendance"
        value={
          summary.trend !== undefined ? `${summary.trend > 0 ? '+' : ''}${summary.trend}%` : 'N/A'
        }
        trend={
          summary.trend !== undefined
            ? {
                value: summary.trend > 0 ? 'En hausse' : 'En baisse',
                positive: (summary.trend || 0) > 0,
              }
            : undefined
        }
      />
      <StatsCard
        icon={<TrendingUp className="h-5 w-5" />}
        iconBg="bg-purple-50 dark:bg-purple-900/30"
        iconColor="text-purple-600"
        label="Livraison"
        value={`${summary.deliverySuccessRate || 100}%`}
        trend={{ value: 'Taux de succès', positive: (summary.deliverySuccessRate || 100) >= 90 }}
      />
    </div>
  );
}
