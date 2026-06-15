'use client';

import { useState } from 'react';
import {
  Package, Search, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle,
  Ban, Eye, X, Star, Upload, Archive,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const STATUSES = ['ALL', 'DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];

const STATUS_LABELS: Record<string, string> = {
  ALL: 'Tous',
  DRAFT: 'Brouillon',
  PENDING_REVIEW: 'En revue',
  PUBLISHED: 'Publié',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
};

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ARCHIVED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

function useAdminModules(params?: any) {
  return useQuery({
    queryKey: ['admin', 'modules', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/modules', { params });
      return res.data.data;
    },
  });
}

function useAdminModuleAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/modules/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'modules'] });
    },
  });
}

export default function AdminModulesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (search) params.search = search;
  if (statusFilter !== 'ALL') params.status = statusFilter;

  const { data: modulesData, isLoading } = useAdminModules(params);
  const actionMutation = useAdminModuleAction();

  const modules = Array.isArray(modulesData) ? modulesData : modulesData?.modules ?? [];
  const totalPages = modulesData?.totalPages ?? 1;

  const handleAction = async (id: string, action: string, moduleName: string) => {
    const actionLabels: Record<string, string> = {
      valider: 'valider',
      refuser: 'refuser',
      publier: 'publier',
      archiver: 'archiver',
    };
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${actionLabels[action] || action} le module « ${moduleName} » ?`
    );
    if (!confirmed) return;

    try {
      await actionMutation.mutateAsync({ id, action });
      setToast({ message: `Module ${actionLabels[action] || action} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action « ${actionLabels[action] || action} »`, type: 'error' });
    }
  };

  const applyFilters = () => { setPage(1); };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'ALL';

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des modules
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
            Gestion des modules
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les modules marketplace, validations et publications
          </p>
        </div>
      </div>

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou développeur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>

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
        ) : modules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Développeur</th>
                  <th className="p-4 font-medium">Version</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Installations</th>
                  <th className="p-4 font-medium">Note</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m: any) => (
                  <tr key={m.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
                          {m.name?.[0]?.toUpperCase() || 'M'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {m.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{m.developer?.name || m.developerId || '-'}</td>
                    <td className="p-4 text-gray-500">v{m.version || '1.0.0'}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[m.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[m.status] || m.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">{m.installations ?? 0}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {m.rating?.toFixed(1) ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => window.location.href = `/dashboard/admin/modules/${m.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {m.status === 'PENDING_REVIEW' && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleAction(m.id, 'valider', m.name)}
                              isLoading={actionMutation.isPending}
                            >
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleAction(m.id, 'refuser', m.name)}
                              isLoading={actionMutation.isPending}
                            >
                              <XCircle className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </>
                        )}
                        {m.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(m.id, 'publier', m.name)}
                            isLoading={actionMutation.isPending}
                          >
                            <Upload className="h-3.5 w-3.5 text-blue-500" />
                            Publier
                          </Button>
                        )}
                        {m.status === 'PUBLISHED' && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleAction(m.id, 'archiver', m.name)}
                            isLoading={actionMutation.isPending}
                          >
                            <Archive className="h-3.5 w-3.5 text-gray-500" />
                            Archiver
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
            icon={<Package className="h-8 w-8" />}
            title="Aucun module"
            description={hasActiveFilters ? 'Aucun module ne correspond aux filtres.' : 'Aucun module trouvé.'}
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
