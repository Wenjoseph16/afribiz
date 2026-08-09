'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, DollarSign, Users, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/utils/helpers';
import { ErrorState } from '@/components/ui/ErrorState';

interface AgingBucket {
  label: string;
  count: number;
  total: number;
  debts: Array<{
    id: string;
    remainingAmount: number;
    totalAmount: number;
    daysPastDue: number;
    dueDate: string;
    status: string;
    priority: string;
    clientName: string | null;
    clientPhone: string | null;
    notes: string | null;
  }>;
}

interface AgingData {
  buckets: {
    current: AgingBucket;
    warning: AgingBucket;
    late: AgingBucket;
    critical: AgingBucket;
  };
  totalActive: number;
  totalRemaining: number;
}

const BUCKET_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  current: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '🟢' },
  warning: { color: 'text-amber-600', bg: 'bg-amber-50', icon: '🟡' },
  late: { color: 'text-orange-600', bg: 'bg-orange-50', icon: '🟠' },
  critical: { color: 'text-red-600', bg: 'bg-red-50', icon: '🔴' },
};

export default function DebtAgingPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['debts', 'aging'],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/aging');
      return res.data.data as AgingData;
    },
  });

  const totalAtRisk = useMemo(() => {
    if (!data) return 0;
    return data.buckets.late.total + data.buckets.critical.total;
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-gray-500">Analyse des créances...</p>
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={(error as Error).message} onRetry={refetch} />;

  const bucketEntries = data ? Object.entries(data.buckets) : [];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Échéancier des créances"
        description="Analyse par ancienneté des dettes impayées — repérez les créances à risque avant qu'elles ne deviennent critiques."
        breadcrumbs={[
          { label: 'Finance', href: '/dashboard/finance' },
          { label: 'Dettes & Paiements', href: '/dashboard/debts-payments' },
          { label: 'Échéancier' },
        ]}
        gradient
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand/10">
              <Users className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Créances actives</p>
              <p className="text-xl font-bold">{data?.totalActive || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total dû</p>
              <p className="text-xl font-bold">{formatPrice(data?.totalRemaining || 0)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">À risque (60j+)</p>
              <p className="text-xl font-bold text-red-600">{formatPrice(totalAtRisk)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Jrs moyen retard</p>
              <p className="text-xl font-bold">
                {data
                  ? Math.round(
                      bucketEntries.reduce((s, [_, b]) => {
                        const avg =
                          b.debts.length > 0
                            ? b.debts.reduce((a, d) => a + d.daysPastDue, 0) / b.debts.length
                            : 0;
                        return s + avg;
                      }, 0) /
                        Math.max(bucketEntries.filter(([_, b]) => b.debts.length > 0).length, 1)
                    )
                  : 0}
                j
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Aging Buckets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {bucketEntries.map(([key, bucket]) => {
          const cfg = BUCKET_CONFIG[key as keyof typeof BUCKET_CONFIG];
          const pct =
            data && data.totalRemaining > 0
              ? Math.round((bucket.total / data.totalRemaining) * 100)
              : 0;
          return (
            <Card
              key={key}
              className={cn(
                'p-4 border-l-4',
                key === 'critical'
                  ? 'border-l-red-500'
                  : key === 'late'
                    ? 'border-l-orange-500'
                    : key === 'warning'
                      ? 'border-l-amber-500'
                      : 'border-l-emerald-500'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cfg?.icon}</span>
                  <h3 className="font-semibold text-gray-900">{bucket.label}</h3>
                </div>
                <Badge
                  variant={key === 'critical' ? 'danger' : key === 'late' ? 'warning' : 'default'}
                >
                  {bucket.count} dette{bucket.count > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Montant total</span>
                <span className={cn('font-bold text-lg', cfg?.color)}>
                  {formatPrice(bucket.total)}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    key === 'critical'
                      ? 'bg-red-500'
                      : key === 'late'
                        ? 'bg-orange-500'
                        : key === 'warning'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {bucket.debts.length > 0 && (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bucket.debts.slice(0, 10).map((d) => (
                    <Link
                      key={d.id}
                      href={`/dashboard/debts-payments/${d.id}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {d.clientName || 'Client'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {d.daysPastDue}j de retard · {formatPrice(d.remainingAmount)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          d.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : d.priority === 'HIGH'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                        )}
                      >
                        {d.priority}
                      </span>
                    </Link>
                  ))}
                  {bucket.debts.length > 10 && (
                    <p className="text-xs text-gray-400 text-center py-1">
                      +{bucket.debts.length - 10} autres
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
