'use client';

import { useState } from 'react';
import {
  Code2, Search, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle,
  PauseCircle, Ban, Eye, X, Verified,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const VERIFICATION_STATUSES = ['ALL', 'VERIFIED', 'PENDING', 'REJECTED'];
const STATUSES = ['ALL', 'ACTIF', 'SUSPENDU', 'BLOQUÉ'];

const VERIFICATION_LABELS: Record<string, string> = {
  ALL: 'Tous',
  VERIFIED: 'Vérifié',
  PENDING: 'En attente',
  REJECTED: 'Rejeté',
};

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tous',
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  BLOQUÉ: 'Bloqué',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDU: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BLOQUÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const VERIF_STYLES: Record<string, string> = {
  VERIFIED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useAdminDevelopers(params?: any) {
  return useQuery({
    queryKey: ['admin', 'developers', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/developers', { params });
      return res.data.data;
    },
  });
}

function useAdminDeveloperStatusAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/developers/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'developers'] });
    },
  });
}

export default function AdminDevelopersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [search, setSearch] = useState('');
  const [verifFilter, setVerifFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (search) params.search = search;
  if (verifFilter !== 'ALL') params.verificationStatus = verifFilter;
  if (statusFilter !== 'ALL') params.status = statusFilter;

  const { data: developersData, isLoading } = useAdminDevelopers(params);
  const statusMutation = useAdminDeveloperStatusAction();

  const developers = Array.isArray(developersData) ? developersData : developersData?.developers ?? [];
  const totalPages = developersData?.totalPages ?? 1;

  const handleStatusAction = async (id: string, action: string, developerName: string) => {
    const actionLabels: Record<string, string> = {
      valider: 'valider',
      verifier: 'vérifier',
      suspendre: 'suspendre',
      bloquer: 'bloquer',
    };
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${actionLabels[action] || action} le développeur « ${developerName} » ?`
    );
    if (!confirmed) return;

    try {
      await statusMutation.mutateAsync({ id, action });
      setToast({ message: `Développeur ${actionLabels[action] || action} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action « ${actionLabels[action] || action} »`, type: 'error' });
    }
  };

  const applyFilters = () => { setPage(1); };

  const clearFilters = () => {
    setSearch('');
    setVerifFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  const hasActiveFilters = search || verifFilter !== 'ALL' || statusFilter !== 'ALL';

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des développeurs
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

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Gestion des développeurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les comptes développeurs, vérifications et statuts
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

          <select
            value={verifFilter}
            onChange={(e) => { setVerifFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            {VERIFICATION_STATUSES.map((v) => (
              <option key={v} value={v}>{VERIFICATION_LABELS[v]} vérification</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
              Effacer
            </Button>
          )}
        </div>
      </Card>

      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : developers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Modules publiés</th>
                  <th className="p-4 font-medium">Revenus</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {developers.map((d: any) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-sm font-bold text-purple-600 shrink-0">
                          {d.name?.[0]?.toUpperCase() || 'D'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {d.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{d.email || '-'}</td>
                    <td className="p-4 text-gray-500">{d.publishedModules ?? 0}</td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                      {d.revenue ? `${Number(d.revenue).toLocaleString()} FCFA` : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          STATUS_STYLES[d.status] || 'bg-gray-100 text-gray-600'
                        }`}>
                          {STATUS_LABELS[d.status] || d.status}
                        </span>
                        {d.verificationStatus && (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            VERIF_STYLES[d.verificationStatus] || 'bg-gray-100 text-gray-600'
                          }`}>
                            {VERIFICATION_LABELS[d.verificationStatus] || d.verificationStatus}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => window.location.href = `/dashboard/admin/developers/${d.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {d.status !== 'BLOQUÉ' && d.status !== 'SUSPENDU' && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(d.id, 'valider', d.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(d.id, 'verifier', d.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <Verified className="h-3.5 w-3.5 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(d.id, 'suspendre', d.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <PauseCircle className="h-3.5 w-3.5 text-amber-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(d.id, 'bloquer', d.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <Ban className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {(d.status === 'SUSPENDU' || d.status === 'BLOQUÉ') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleStatusAction(d.id, 'reactiver', d.name)}
                            isLoading={statusMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            Réactiver
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
            icon={<Code2 className="h-8 w-8" />}
            title="Aucun développeur"
            description={hasActiveFilters ? 'Aucun développeur ne correspond aux filtres.' : 'Aucun développeur trouvé.'}
          />
        )}
      </Card>

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
