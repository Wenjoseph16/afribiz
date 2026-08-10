'use client';

import { useMemo } from 'react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import {
  Shield,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

const ESCROW_STATUS: Record<
  string,
  { label: string; variant: 'warning' | 'success' | 'danger' | 'info'; color: string }
> = {
  PENDING: { label: 'En attente', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  HELD: { label: 'Bloqué', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  RELEASED: { label: 'Libéré', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  REFUNDED: { label: 'Remboursé', variant: 'danger', color: 'bg-red-100 text-red-700' },
  DISPUTED: { label: 'Litige', variant: 'danger', color: 'bg-rose-100 text-rose-700' },
};

export default function EscrowPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['payments', 'escrow'],
    queryFn: async () => {
      const res = await apiClient.get('/payments/escrow/client', { params: { limit: 50 } });
      return res.data.data;
    },
  });

  const escrows = useMemo(() => {
    const raw = Array.isArray(data) ? data : data?.escrows || data?.data || [];
    return raw;
  }, [data]);

  const stats = useMemo(
    () => ({
      total: escrows.length,
      held: escrows.filter((e: any) => e.status === 'HELD').length,
      released: escrows.filter((e: any) => e.status === 'RELEASED').length,
      disputed: escrows.filter((e: any) => e.status === 'DISPUTED').length,
      totalAmount: escrows.reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
    }),
    [escrows]
  );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Escrow"
        description="Transactions sécurisées sous séquestre"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Paiements', href: '/dashboard/payments' },
          { label: 'Escrow' },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand/10">
              <Shield className="w-4 h-4 text-brand" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Total</p>
              <p className="text-sm font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-100">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Bloqués</p>
              <p className="text-sm font-bold">{stats.held}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Libérés</p>
              <p className="text-sm font-bold">{stats.released}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-100">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500">Litiges</p>
              <p className="text-sm font-bold">{stats.disputed}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* List */}
      {escrows.length === 0 ? (
        <Card className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucune transaction
          </h3>
          <p className="text-sm text-gray-500">Les transactions sécurisées apparaîtront ici.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {escrows.map((escrow: any) => {
            const s = ESCROW_STATUS[escrow.status] || ESCROW_STATUS.PENDING;
            return (
              <Card key={escrow.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${s.color}`}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {escrow.reference || `#${escrow.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(escrow.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice(Number(escrow.amount || 0))}
                    </p>
                    <Badge variant={s.variant} size="xs">
                      {s.label}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
