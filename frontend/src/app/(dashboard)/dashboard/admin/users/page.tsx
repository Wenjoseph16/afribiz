'use client';

import { useState } from 'react';
import {
  Users, Search, ChevronLeft, ChevronRight, Shield, UserX, UserCheck,
  Ban, Eye, SlidersHorizontal, X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { apiClient } from '@/services/apiClient';
import { useAuthStore } from '@/stores/authStore';

const ROLES = ['CLIENT', 'BUSINESS', 'DEVELOPER', 'ADMIN'];
const STATUSES = ['ACTIF', 'SUSPENDU', 'BLOQUÉ'];

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'Client',
  BUSINESS: 'Business',
  DEVELOPER: 'Développeur',
  ADMIN: 'Admin',
};

const STATUS_LABELS: Record<string, string> = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  BLOQUÉ: 'Bloqué',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIF: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  SUSPENDU: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BLOQUÉ: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function useAdminUsers(params?: any) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users', { params });
      return res.data.data;
    },
  });
}

function useAdminUserStatusAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiClient.put(`/admin/users/${id}/status`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const isAdmin = user?.roles?.includes('ADMIN');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const limit = 20;

  const params: any = { page, limit };
  if (search) params.search = search;
  if (roleFilter) params.role = roleFilter;
  if (statusFilter) params.status = statusFilter;

  const { data: usersData, isLoading } = useAdminUsers(params);
  const statusMutation = useAdminUserStatusAction();

  const users = Array.isArray(usersData) ? usersData : usersData?.users ?? [];
  const totalPages = usersData?.totalPages ?? 1;

  const handleStatusAction = async (id: string, action: string, userName: string) => {
    const actionLabels: Record<string, string> = {
      suspend: 'suspendre',
      reactivate: 'réactiver',
      block: 'bloquer',
    };
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir ${actionLabels[action] || action} l'utilisateur « ${userName} » ?`
    );
    if (!confirmed) return;

    try {
      await statusMutation.mutateAsync({ id, action });
      setToast({ message: `Utilisateur ${actionLabels[action] || action} avec succès`, type: 'success' });
    } catch {
      setToast({ message: `Erreur lors de l'action « ${actionLabels[action] || action} »`, type: 'error' });
    }
  };

  const applyFilters = () => {
    setPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(1);
  };

  const hasActiveFilters = search || roleFilter || statusFilter;

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
          Gestion des utilisateurs
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
      {/* Toast */}
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
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gérez les comptes, rôles et statuts des utilisateurs
          </p>
        </div>
      </div>

      {/* Filters */}
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
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les rôles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
          >
            <option value="">Tous les statuts</option>
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

      {/* Users Table */}
      <Card padding="none">
        {isLoading ? (
          <Loader className="py-20" />
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Nom</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Rôles</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Dernière connexion</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                          {u.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {u.name || 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">{u.email || '-'}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(u.roles) ? u.roles : []).map((role: string) => (
                          <span
                            key={role}
                            className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            {ROLE_LABELS[role] || role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[u.status] || 'bg-gray-100 text-gray-600'
                      }`}>
                        {STATUS_LABELS[u.status] || u.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => window.location.href = `/dashboard/admin/users/${u.id}`}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Voir
                        </Button>
                        {u.status === 'ACTIF' && (
                          <>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(u.id, 'suspend', u.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <UserX className="h-3.5 w-3.5 text-amber-500" />
                              Suspendre
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleStatusAction(u.id, 'block', u.name)}
                              isLoading={statusMutation.isPending}
                            >
                              <Ban className="h-3.5 w-3.5 text-red-500" />
                              Bloquer
                            </Button>
                          </>
                        )}
                        {(u.status === 'SUSPENDU' || u.status === 'BLOQUÉ') && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleStatusAction(u.id, 'reactivate', u.name)}
                            isLoading={statusMutation.isPending}
                          >
                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
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
            icon={<Users className="h-8 w-8" />}
            title="Aucun utilisateur"
            description={hasActiveFilters ? 'Aucun utilisateur ne correspond aux filtres.' : 'Aucun utilisateur trouvé.'}
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
