'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, Smartphone, Banknote, Plus, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { apiClient } from '@/services/apiClient';

const methodIcons: Record<string, any> = {
  card: CreditCard,
  mobile_money: Smartphone,
  bank: Banknote,
  cash: Banknote,
};

export default function HybridPaymentsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['hybrid-payment-methods'],
    queryFn: async () => {
      try {
        const res = await apiClient.getHybridPaymentMethods();
        return res.data.data || { methods: [] };
      } catch {
        return { methods: [] };
      }
    },
    retry: false,
  });

  if (error)
    return (
      <ErrorState message={(error as any)?.message || 'Erreur de chargement'} onRetry={refetch} />
    );
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;

  const methods = Array.isArray(data) ? data : (data?.methods ?? []);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Paiements hybrides"
        description="Gérez vos méthodes de paiement combinées"
        breadcrumbs={[{ label: 'Paiements hybrides' }]}
      />

      <Card title="Moyens de paiement" titleIcon={<CreditCard className="h-4 w-4" />}>
        {methods.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-10 w-10" />}
            title="Aucune méthode"
            description="Ajoutez des moyens de paiement pour vos commandes"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {methods.map((m: any) => {
              const Icon = methodIcons[m.type] || CreditCard;
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">{m.name || m.type}</p>
                      <p className="text-xs text-gray-500">{m.details || m.type}</p>
                    </div>
                  </div>
                  {m.active ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
