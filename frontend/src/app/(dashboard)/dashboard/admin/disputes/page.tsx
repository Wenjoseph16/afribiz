'use client';

import { useState } from 'react';
import {
  Scale, AlertTriangle, DollarSign, Package, Code2, Hotel, Shield,
  Eye, Gavel, X, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

type DisputeTab = 'Tous' | 'Paiements' | 'Escrow' | 'Réservations' | 'Services' | 'Produits';

interface Dispute {
  id: string;
  type: string;
  partieA?: string;
  partieB?: string;
  montant?: number;
  status: string;
  createdAt: string;
}

const TABS: { id: DisputeTab; label: string; icon: any }[] = [
  { id: 'Tous', label: 'Tous', icon: Scale },
  { id: 'Paiements', label: 'Paiements', icon: DollarSign },
  { id: 'Escrow', label: 'Escrow', icon: AlertTriangle },
  { id: 'Réservations', label: 'Réservations', icon: Hotel },
  { id: 'Services', label: 'Services', icon: Code2 },
  { id: 'Produits', label: 'Produits', icon: Package },
];

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  RESOLVED: 'Résolu',
  CLOSED: 'Fermé',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  IN_PROGRESS: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  RESOLVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  CLOSED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const TYPE_LABELS: Record<string, string> = {
  PAYMENT: 'Paiement',
  ESCROW: 'Escrow',
  BOOKING: 'Réservation',
  SERVICE: 'Service',
  PRODUCT: 'Produit',
};

function useAdminDisputes(params?: any) {
  return useQuery({
    queryKey: ['admin', 'disputes', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/disputes', { params });
      return res.data.data;
    },
  });
}

function useAdminDisputeStats() {
  return useQuery({
    queryKey: ['admin', 'disputes', 'stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/disputes/stats');
      return res.data.data;
    },
  });
}

function useAdminDisputeAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/disputes/${id}/${action}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'disputes'] });
    },
  });
}

export default function AdminDisputesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [activeTab, setActiveTab] = useState<DisputeTab>('Tous');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (activeTab !== 'Tous') params.type = activeTab;

  const { data: disputesData, isLoading } = useAdminDisputes(params);
  const { data: stats } = useAdminDisputeStats();
  const actionMutation = useAdminDisputeAction();

  const disputes: Dispute[] = Array.isArray(disputesData)
    ? disputesData
    : disputesData?.disputes ?? [];
  const totalPages = disputesData?.totalPages ?? 1;

  const handleAction = async (id: string, action: string, label: string) => {
    const confirmed = window.confirm(`Confirmer l'action « ${label} » sur ce litige ?`);
    if (!confirmed) return;
    try {
      await actionMutation.mutateAsync({ id, action });
      setToast({ message: `Litige ${label.toLowerCase()} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de « ${label} »`, type: 'error' });
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des litiges
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
      {toast && (
        <div className={`p-3 rounded-xl text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">&times;</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gestion des litiges
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Médiation et résolution des conflits
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.open ?? '-'}</p>
              <p className="text-xs text-gray-500">Ouverts</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.inProgress ?? '-'}</p>
              <p className="text-xs text-gray-500">En cours</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.resolved ?? '-'}</p>
              <p className="text-xs text-gray-500">Résolus</p>
            </div>
          </div>
        </Card>
        <Card padding="md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats?.resolutionRate != null ? `${stats.resolutionRate}%` : '-'}
              </p>
              <p className="text-xs text-gray-500">Taux de résolution</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-px">
        {TABS.map((tab) => {
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

      {/* Disputes Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : disputes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Partie A</th>
                  <th className="p-4 font-medium">Partie B</th>
                  <th className="p-4 font-medium">Montant</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      {dispute.createdAt ? new Date(dispute.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {TYPE_LABELS[dispute.type] || dispute.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{dispute.partieA || '-'}</td>
                    <td className="p-4 text-gray-500">{dispute.partieB || '-'}</td>
                    <td className="p-4 text-gray-900 dark:text-gray-100 font-medium">
                      {dispute.montant != null ? `${Number(dispute.montant).toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[dispute.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[dispute.status] || dispute.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs">
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Button>
                        {(dispute.status === 'OPEN' || dispute.status === 'IN_PROGRESS') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(dispute.id, 'decide', 'Prendre décision')}
                            isLoading={actionMutation.isPending}
                          >
                            <Gavel className="h-3.5 w-3.5 text-amber-500" />
                            Décision
                          </Button>
                        )}
                        {dispute.status !== 'CLOSED' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(dispute.id, 'close', 'Clore')}
                            isLoading={actionMutation.isPending}
                          >
                            <X className="h-3.5 w-3.5 text-red-500" />
                            Clore
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<Scale className="h-8 w-8" />}
            title="Aucun litige"
            description="Aucun litige trouvé."
          />
        )}
      </Card>

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
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
