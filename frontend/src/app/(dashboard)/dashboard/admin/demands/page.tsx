'use client';

import { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Zap,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Star,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { apiClient } from '@/services/apiClient';

const MODULE_TYPES = [
  'PRODUCTS',
  'SERVICES',
  'MENU',
  'ROOMS',
  'BOOKINGS',
  'ORDERS',
  'QUOTES_INVOICES',
  'DEBTS_PAYMENTS',
  'PROMOTIONS',
  'PLANNING',
  'EMPLOYEES',
  'PORTFOLIO',
  'SUBSCRIPTIONS',
  'DELIVERIES',
  'EVENTS',
  'RENTALS',
  'DOCUMENTS',
  'PARTNERS',
  'DISPUTES',
];
const MODULE_LABELS: Record<string, string> = {
  PRODUCTS: 'Produits',
  SERVICES: 'Services',
  MENU: 'Menu',
  ROOMS: 'Chambres',
  BOOKINGS: 'Réservations',
  ORDERS: 'Commandes',
  QUOTES_INVOICES: 'Devis & Factures',
  DEBTS_PAYMENTS: 'Créances',
  PROMOTIONS: 'Promotions',
  PLANNING: 'Planning',
  EMPLOYEES: 'Employés',
  PORTFOLIO: 'Portfolio',
  SUBSCRIPTIONS: 'Abonnements',
  DELIVERIES: 'Livraisons',
  EVENTS: 'Événements',
  RENTALS: 'Locations',
  DOCUMENTS: 'Documents',
  PARTNERS: 'Partenaires',
  DISPUTES: 'Litiges',
};
const STATUS_OPTIONS = ['OPEN', 'MATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Ouverte',
  MATCHED: 'Correspondance trouvée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};
const STATUS_VARIANTS: Record<string, 'default' | 'warning' | 'success' | 'info' | 'danger'> = {
  OPEN: 'info',
  MATCHED: 'success',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

export default function AdminDemandsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<any>(null);
  const [matchesModalOpen, setMatchesModalOpen] = useState(false);
  const [matchesData, setMatchesData] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  const filters: any = { page, limit: 15 };
  if (search) filters.search = search;
  if (statusFilter) filters.status = statusFilter;
  if (typeFilter) filters.moduleType = typeFilter;

  const {
    data: demands,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['admin', 'demands', filters],
    queryFn: async () => {
      try {
        const res = await apiClient.adminGetDemands(filters);
        return res.data.data || [];
      } catch (error) {
        console.warn('Erreur chargement demandes:', error);
        return [];
      }
    },
    retry: false,
  });
  const demandList = Array.isArray(demands) ? demands : (demands?.items ?? []);
  const totalPages =
    demands?.totalPages ?? Math.max(1, Math.ceil((demands?.total ?? demandList.length) / 15));

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.adminUpdateDemandStatus(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'demands'] }),
  });

  const autoMatchMutation = useMutation({
    mutationFn: (id: string) => apiClient.adminAutoMatchDemand(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'demands'] });
      setToast({ message: 'Matching effectué', type: 'success' });
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: ({ matchId, status }: { matchId: string; status: string }) =>
      apiClient.adminUpdateMatchStatus(matchId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'demands'] }),
  });

  const openDetails = (d: any) => {
    setSelectedDemand(d);
    setDetailsModalOpen(true);
  };

  const findAndShowMatches = async (d: any) => {
    setMatchesModalOpen(true);
    setLoadingMatches(true);
    try {
      const res = await apiClient.adminGetMatchesForDemand(d.id);
      setMatchesData(res.data.data || []);
    } catch {
      setMatchesData([]);
    }
    setLoadingMatches(false);
  };

  const handleAutoMatch = async (id: string) => {
    try {
      await autoMatchMutation.mutateAsync(id);
    } catch {
      setToast({ message: 'Erreur matching', type: 'error' });
    }
  };

  const handleMatchAction = async (matchId: string, status: string) => {
    try {
      await updateMatchMutation.mutateAsync({ matchId, status });
      setToast({
        message: `Match ${status === 'ACCEPTED' ? 'accepté' : 'rejeté'}`,
        type: 'success',
      });
    } catch {
      setToast({ message: 'Erreur', type: 'error' });
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
  };
  const hasActiveFilters = search || statusFilter || typeFilter;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {toast.message}
          <button onClick={() => setToast(null)} className="float-right ml-2 font-bold">
            &times;
          </button>
        </div>
      )}

      <PageHeader
        title="Demandes de modules"
        description="Gérez les demandes de modules des businesses et le matching avec les développeurs"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Demandes' },
        ]}
      />

      <Card padding="md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            />
          </div>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous les types' },
              ...MODULE_TYPES.map((t) => ({ value: t, label: MODULE_LABELS[t] || t })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tous les statuts' },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
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
        ) : demandList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-4 font-medium">Titre</th>
                  <th className="p-4 font-medium">Type de module</th>
                  <th className="p-4 font-medium">Business</th>
                  <th className="p-4 font-medium">Budget</th>
                  <th className="p-4 font-medium">Statut</th>
                  <th className="p-4 font-medium">Matchs</th>
                  <th className="p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {demandList.map((d: any) => (
                  <tr
                    key={d.id}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                      {d.title}
                    </td>
                    <td className="p-4">
                      <Badge variant="info" size="xs">
                        {MODULE_LABELS[d.moduleType] || d.moduleType}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">
                      {d.business?.name || d.businessId || '-'}
                    </td>
                    <td className="p-4 text-gray-500">
                      {d.budget
                        ? `${Number(d.budget).toLocaleString()} ${d.currency || 'FCFA'}`
                        : '-'}
                    </td>
                    <td className="p-4">
                      <Badge variant={STATUS_VARIANTS[d.status]} size="xs">
                        {STATUS_LABELS[d.status] || d.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-gray-500">{d._count?.matches ?? 0}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="xs" onClick={() => openDetails(d)}>
                          <Eye className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => findAndShowMatches(d)}
                          title="Voir les matchs"
                        >
                          <Users className="h-3.5 w-3.5 text-indigo-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleAutoMatch(d.id)}
                          isLoading={autoMatchMutation.isPending}
                          title="Matching automatique"
                        >
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
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
            title="Aucune demande"
            description={
              hasActiveFilters
                ? 'Aucune demande ne correspond aux filtres.'
                : 'Aucune demande de module pour le moment.'
            }
          />
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </button>
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={
                  'px-3 py-1.5 text-sm rounded-lg transition-colors ' +
                  (p === page
                    ? 'bg-brand text-white'
                    : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700')
                }
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        open={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false);
          setSelectedDemand(null);
        }}
        title={`Demande : ${selectedDemand?.title || ''}`}
        size="lg"
      >
        {selectedDemand && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Module</p>
                <Badge variant="info">
                  {MODULE_LABELS[selectedDemand.moduleType] || selectedDemand.moduleType}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Statut</p>
                <Badge variant={STATUS_VARIANTS[selectedDemand.status]}>
                  {STATUS_LABELS[selectedDemand.status]}
                </Badge>
              </div>
              {selectedDemand.budget && (
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-sm">
                    {Number(selectedDemand.budget).toLocaleString()}{' '}
                    {selectedDemand.currency || 'FCFA'}
                  </p>
                </div>
              )}
              {selectedDemand.deadline && (
                <div>
                  <p className="text-xs text-gray-500">Deadline</p>
                  <p className="text-sm">
                    {new Date(selectedDemand.deadline).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">Urgent</p>
                <p className="text-sm">{selectedDemand.isUrgent ? 'Oui' : 'Non'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Créée le</p>
                <p className="text-sm">
                  {new Date(selectedDemand.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
            {selectedDemand.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDemand.description}
                </p>
              </div>
            )}
            {selectedDemand.matches?.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">
                  Matchs ({selectedDemand.matches.length})
                </p>
                {selectedDemand.matches.map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 mb-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-sm font-bold text-indigo-600">
                        {m.developerId?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {m.developer?.companyName || m.developerId || 'Développeur'}
                        </p>
                        <p className="text-xs text-gray-500">{m.matchReasons?.join(', ') || ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-sm font-bold">{m.score}/100</span>
                      </div>
                      <Badge
                        variant={
                          m.status === 'ACCEPTED'
                            ? 'success'
                            : m.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                        }
                        size="xs"
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Matches Preview Modal */}
      <Modal
        open={matchesModalOpen}
        onClose={() => {
          setMatchesModalOpen(false);
          setMatchesData([]);
        }}
        title="Matchs disponibles"
        size="xl"
      >
        {loadingMatches ? (
          <Loader className="py-10" />
        ) : matchesData.length > 0 ? (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {matchesData.map((m: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-lg font-bold text-indigo-600">
                      {m.module?.name?.[0] || 'M'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {m.module?.name || 'Module'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {m.developer?.companyName || m.developerId || 'Développeur'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-600">{m.score}</p>
                      <p className="text-[10px] text-gray-400">Score</p>
                    </div>
                  </div>
                </div>
                {m.matchReasons?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.matchReasons.map((r: string, j: number) => (
                      <span
                        key={j}
                        className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="Aucun match trouvé"
            description="Aucun module développeur ne correspond à cette demande."
          />
        )}
      </Modal>
    </div>
  );
}
