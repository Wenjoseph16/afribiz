'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { DollarSign, AlertTriangle, CheckCircle2, Clock, Loader } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { formatPrice } from '@/utils/helpers';

export default function DebtsPage() {
  const {
    data: debtsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', 'debts'],
    queryFn: async () => {
      const res = await apiClient.get('/business/finance/debts?limit=50');
      return res.data.data;
    },
  });

  const debts = useMemo(() => {
    const raw = Array.isArray(debtsData) ? debtsData : debtsData?.debts || debtsData?.data || [];
    return raw;
  }, [debtsData]);

  const totalDue = useMemo(
    () =>
      debts.reduce((sum: number, d: any) => sum + Number(d.remainingAmount || d.amount || 0), 0),
    [debts]
  );

  const statusLabel = (status: string) => {
    const map: Record<
      string,
      { label: string; variant: 'warning' | 'success' | 'danger' | 'info' }
    > = {
      PENDING: { label: 'En attente', variant: 'warning' },
      PARTIAL: { label: 'Partiel', variant: 'info' },
      PAID: { label: 'Payé', variant: 'success' },
      OVERDUE: { label: 'En retard', variant: 'danger' },
      CANCELLED: { label: 'Annulé', variant: 'danger' },
    };
    return map[status] || { label: status, variant: 'default' as const };
  };

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Dettes"
        description="Consultez le solde de vos commandes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Commandes', href: '/dashboard/orders' },
          { label: 'Dettes' },
        ]}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-100">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total dû</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatPrice(totalDue)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-100">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Nombre de dettes</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{debts.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Debts list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader className="h-8 w-8 animate-spin text-brand" />
        </div>
      ) : debts.length === 0 ? (
        <Card className="text-center py-12">
          <DollarSign className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Aucune dette
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Toutes vos commandes sont soldées. Vous n&apos;avez aucune dette en cours.
          </p>
          <Link href="/dashboard/orders">
            <Button>Voir mes commandes</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {debts.map((debt: any) => {
            const s = statusLabel(debt.status);
            return (
              <Card key={debt.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        debt.status === 'OVERDUE'
                          ? 'bg-red-100'
                          : debt.status === 'PAID'
                            ? 'bg-emerald-100'
                            : 'bg-amber-100'
                      }`}
                    >
                      {debt.status === 'PAID' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : debt.status === 'OVERDUE' ? (
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {debt.reference || debt.description || `#${debt.id.slice(0, 8)}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {debt.dueDate
                          ? `Échéance: ${new Date(debt.dueDate).toLocaleDateString('fr-FR')}`
                          : new Date(debt.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatPrice(Number(debt.remainingAmount || debt.amount || 0))}
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
