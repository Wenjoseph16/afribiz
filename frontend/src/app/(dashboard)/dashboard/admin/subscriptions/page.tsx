'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  CreditCard, Search, XCircle, RotateCcw, DollarSign,
  Users, Code, Puzzle, Database,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

type SubscriptionTab = 'business' | 'developers' | 'modules' | 'datahub';

const typeLabel: Record<string, string> = {
  BUSINESS: 'Business',
  DEVELOPER: 'Développeur',
  MODULE: 'Module',
  DATAHUB: 'Data Hub',
};

const typeIcon: Record<string, any> = {
  BUSINESS: Users,
  DEVELOPER: Code,
  MODULE: Puzzle,
  DATAHUB: Database,
};

const statusLabel: Record<string, string> = {
  ACTIVE: 'Active',
  EXPIRED: 'Expirée',
  CANCELLED: 'Résiliée',
  TRIAL: 'Essai',
};

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  EXPIRED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  TRIAL: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

function useAdminSubscriptions(params?: { type?: string; page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: ['admin', 'subscriptions', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/subscriptions', { params });
      return res.data.data;
    },
  });
}

function useAdminSubscriptionStats() {
  return useQuery({
    queryKey: ['admin', 'subscriptions', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/subscriptions/stats');
      return res.data.data;
    },
  });
}

function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/subscriptions/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

function useRenewSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/subscriptions/${id}/renew`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
    },
  });
}

export default function AdminSubscriptionsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<SubscriptionTab>('business');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  const typeMap: Record<SubscriptionTab, string> = {
    business: 'BUSINESS',
    developers: 'DEVELOPER',
    modules: 'MODULE',
    datahub: 'DATAHUB',
  };

  const { data: subsData, isLoading } = useAdminSubscriptions({
    type: typeMap[activeTab],
    page,
    limit,
    search: search || undefined,
  });

  const { data: stats } = useAdminSubscriptionStats();
  const cancelMutation = useCancelSubscription();
  const renewMutation = useRenewSubscription();

  const subscriptions = Array.isArray(subsData)
    ? subsData
    : subsData?.subscriptions ?? subsData?.data ?? [];
  const total = subsData?.total ?? subsData?.count ?? subscriptions?.length ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const tabs = [
    { id: 'business' as SubscriptionTab, label: 'Business', icon: Users },
    { id: 'developers' as SubscriptionTab, label: 'Développeurs', icon: Code },
    { id: 'modules' as SubscriptionTab, label: 'Modules', icon: Puzzle },
    { id: 'datahub' as SubscriptionTab, label: 'Data Hub', icon: Database },
  ];

  if (!user?.roles?.includes('ADMIN')) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des abonnements
        </h1>
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="Accès réservé"
          description="Vous devez être administrateur pour accéder à cette page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gestion des abonnements
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les abonnements de la plateforme
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.active ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actives</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.expired ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expirées</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.cancelled ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Résiliées</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-50 dark:bg-brand-900/30 text-brand">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats?.revenue ? `${Number(stats.revenue).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Revenus abonnements</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un abonné..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <Loader className="py-12" />
      ) : subscriptions.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8" />}
          title="Aucun abonnement"
          description="Aucun abonnement trouvé pour ce type."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3 font-medium">Abonné</th>
                <th className="p-3 font-medium">Type</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Début</th>
                <th className="p-3 font-medium">Fin</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub: any) => (
                <tr key={sub.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {sub.subscriber?.name || sub.user?.name || sub.subscriberId?.slice(0, 8) || '-'}
                    </p>
                    {sub.subscriber?.email && (
                      <p className="text-[11px] text-gray-400">{sub.subscriber.email}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      {typeLabel[sub.type] || sub.type || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100 font-medium capitalize">
                    {sub.plan?.toLowerCase() || '-'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {sub.startDate ? new Date(sub.startDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {sub.endDate ? new Date(sub.endDate).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor[sub.status] || ''}`}>
                      {statusLabel[sub.status] || sub.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {sub.status === 'ACTIVE' && (
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => cancelMutation.mutate(sub.id)}
                          isLoading={cancelMutation.isPending}
                        >
                          <XCircle className="h-3 w-3" />
                          Résilier
                        </Button>
                      )}
                      {(sub.status === 'EXPIRED' || sub.status === 'CANCELLED') && (
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => renewMutation.mutate(sub.id)}
                          isLoading={renewMutation.isPending}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Renouveler
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
