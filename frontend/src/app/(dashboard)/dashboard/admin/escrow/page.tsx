'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import {
  Shield, CheckCircle, RotateCcw, Scale, Search, DollarSign,
  Lock, Unlock, Gavel,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useAuthStore } from '@/stores/authStore';

type EscrowTab = 'active' | 'completed' | 'disputed' | 'refunded';

const statusLabel: Record<string, string> = {
  ACTIVE: 'Actif',
  COMPLETED: 'Terminé',
  DISPUTED: 'Litigieux',
  REFUNDED: 'Remboursé',
  CANCELLED: 'Annulé',
};

const statusColor: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  COMPLETED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DISPUTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  REFUNDED: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

function useAdminEscrows(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin', 'escrow', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/escrow', { params });
      return res.data.data;
    },
  });
}

function useAdminEscrowStats() {
  return useQuery({
    queryKey: ['admin', 'escrow', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/escrow/stats');
      return res.data.data;
    },
  });
}

function useReleaseEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/escrow/${id}/release`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escrow'] });
    },
  });
}

function useRefundEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/escrow/${id}/refund`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escrow'] });
    },
  });
}

function useArbitrateEscrow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'release' | 'refund' }) =>
      apiClient.post(`/admin/escrow/${id}/arbitrate`, { decision }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'escrow'] });
    },
  });
}

export default function AdminEscrowPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<EscrowTab>('active');
  const [page, setPage] = useState(1);
  const limit = 10;

  const statusMap: Record<EscrowTab, string | undefined> = {
    active: 'ACTIVE',
    completed: 'COMPLETED',
    disputed: 'DISPUTED',
    refunded: 'REFUNDED',
  };

  const { data: escrowData, isLoading } = useAdminEscrows({
    status: statusMap[activeTab],
    page,
    limit,
  });

  const { data: stats } = useAdminEscrowStats();
  const releaseMutation = useReleaseEscrow();
  const refundMutation = useRefundEscrow();
  const arbitrateMutation = useArbitrateEscrow();

  const escrows = Array.isArray(escrowData)
    ? escrowData
    : escrowData?.escrows ?? escrowData?.data ?? [];
  const total = escrowData?.total ?? escrowData?.count ?? escrows?.length ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const tabs = [
    { id: 'active' as EscrowTab, label: 'Actifs' },
    { id: 'completed' as EscrowTab, label: 'Terminés' },
    { id: 'disputed' as EscrowTab, label: 'Litigieux' },
    { id: 'refunded' as EscrowTab, label: 'Remboursés' },
  ];

  if (!user?.roles?.includes('ADMIN')) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion séquestre
        </h1>
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
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
            Gestion séquestre
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les transactions séquestrées de la plateforme
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <Unlock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.active ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actifs</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.completed ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Terminés</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600">
              <Gavel className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.disputed ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Litigieux</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{stats?.refunded ?? '-'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Remboursés</p>
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
                {stats?.totalAmount ? `${Number(stats.totalAmount).toLocaleString()} FCFA` : '-'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Montant total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <Loader className="py-12" />
      ) : escrows.length === 0 ? (
        <EmptyState
          icon={<Shield className="h-8 w-8" />}
          title="Aucune transaction séquestre"
          description="Aucune transaction trouvée pour ce filtre."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Transaction</th>
                <th className="p-3 font-medium">Vendeur</th>
                <th className="p-3 font-medium">Acheteur</th>
                <th className="p-3 font-medium">Montant</th>
                <th className="p-3 font-medium">Statut</th>
                <th className="p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {escrows.map((escrow: any) => (
                <tr key={escrow.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="p-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {escrow.createdAt ? new Date(escrow.createdAt).toLocaleString('fr-FR') : '-'}
                  </td>
                  <td className="p-3">
                    <span className="text-xs font-mono font-medium text-gray-900 dark:text-gray-100">
                      {escrow.reference || escrow.id?.slice(0, 12) || '-'}
                    </span>
                    {escrow.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{escrow.description}</p>
                    )}
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {escrow.seller?.name || escrow.sellerId?.slice(0, 8) || '-'}
                  </td>
                  <td className="p-3 text-gray-900 dark:text-gray-100">
                    {escrow.buyer?.name || escrow.buyerId?.slice(0, 8) || '-'}
                  </td>
                  <td className="p-3 font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {escrow.amount ? `${Number(escrow.amount).toLocaleString()} FCFA` : '-'}
                  </td>
                  <td className="p-3">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColor[escrow.status] || ''}`}>
                      {statusLabel[escrow.status] || escrow.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      {escrow.status === 'ACTIVE' && (
                        <>
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => releaseMutation.mutate(escrow.id)}
                            isLoading={releaseMutation.isPending}
                          >
                            <Unlock className="h-3 w-3" />
                            Libérer
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => refundMutation.mutate(escrow.id)}
                            isLoading={refundMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Rembourser
                          </Button>
                        </>
                      )}
                      {escrow.status === 'DISPUTED' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => arbitrateMutation.mutate({ id: escrow.id, decision: 'release' })}
                            isLoading={arbitrateMutation.isPending}
                          >
                            <Unlock className="h-3 w-3" />
                            Libérer
                          </Button>
                          <Button
                            variant="secondary"
                            size="xs"
                            onClick={() => arbitrateMutation.mutate({ id: escrow.id, decision: 'refund' })}
                            isLoading={arbitrateMutation.isPending}
                          >
                            <RotateCcw className="h-3 w-3" />
                            Rembourser
                          </Button>
                          <span className="text-[10px] text-gray-400 italic ml-1">(Arbitrage)</span>
                        </div>
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
