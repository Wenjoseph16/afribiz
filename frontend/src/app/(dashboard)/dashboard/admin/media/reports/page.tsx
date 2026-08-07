'use client';

import { useState, useMemo } from 'react';
import {
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Clock,
  ShieldCheck,
  ShieldX,
  User,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Modal } from '@/components/ui/Modal';
import { Drawer } from '@/components/ui/Drawer';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { useToast } from '@/components/ui/ToastProvider';
import { apiClient } from '@/services/apiClient';

const CONTENT_TYPES = ['STORY', 'SHORT', 'LIVE', 'OFFER', 'AD'];
const REPORT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'];

const CONTENT_TYPE_LABELS: Record<string, string> = {
  STORY: 'Story',
  SHORT: 'Short',
  LIVE: 'Live',
  OFFER: 'Offre',
  AD: 'Publicité',
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  STORY: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  SHORT: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  LIVE: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  OFFER: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  AD: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  FLAGGED: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé',
  REJECTED: 'Rejeté',
  FLAGGED: 'Signalé',
};

const STATUS_BADGE: Record<string, 'warning' | 'success' | 'danger' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  FLAGGED: 'default',
};

function reporterName(r: {
  reportedBy?: { firstName?: string; lastName?: string; name?: string } | null;
  reporter?: { name?: string } | null;
}) {
  const rep = r.reportedBy || r.reporter || null;
  if (!rep) return 'Anonyme';
  if ('name' in rep && rep.name) return rep.name;
  const first = (rep as { firstName?: string }).firstName || '';
  const last = (rep as { lastName?: string }).lastName || '';
  return first || last ? `${first} ${last}`.trim() : 'Anonyme';
}

function useReports() {
  return useQuery({
    queryKey: ['admin', 'moderation'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/moderation/items');
      return res.data.data;
    },
  });
}

export default function AdminReportsPage() {
  const qc = useQueryClient();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [detailDrawer, setDetailDrawer] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<any>(null);

  const { data: reports, isLoading, isError, refetch, isFetching } = useReports();
  const list = Array.isArray(reports) ? reports : [];

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/moderation/approve/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'stats'] });
      setDetailDrawer(null);
      notify({
        title: 'Signalement approuvé',
        description: 'Le contenu reste visible et le créateur a été notifié.',
        variant: 'success',
      });
    },
    onError: () =>
      notify({
        title: 'Erreur',
        description: "Impossible d'approuver ce signalement.",
        variant: 'error',
      }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/admin/moderation/reject/${id}`, { reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'stats'] });
      setShowRejectModal(null);
      setRejectReason('');
      notify({
        title: 'Signalement rejeté',
        description: 'Le contenu a été retiré et le créateur notifié.',
        variant: 'success',
      });
    },
    onError: () => notify({ title: 'Erreur', description: 'Échec du rejet.', variant: 'error' }),
  });

  const flagMutation = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/moderation/flag/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'moderation'] });
      qc.invalidateQueries({ queryKey: ['admin', 'moderation', 'stats'] });
      setDetailDrawer(null);
      notify({
        title: 'Contenu signalé',
        description: 'Transmis pour examen par un supérieur.',
        variant: 'info',
      });
    },
    onError: () =>
      notify({ title: 'Erreur', description: 'Échec du signalement.', variant: 'error' }),
  });

  const filtered = useMemo(() => {
    let result = list;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r: any) =>
          reporterName(r).toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.contentId?.toLowerCase().includes(q)
      );
    }
    if (typeFilter) result = result.filter((r: any) => r.contentType === typeFilter);
    if (statusFilter) result = result.filter((r: any) => r.status === statusFilter);
    return result;
  }, [list, search, typeFilter, statusFilter]);

  const stats = useMemo(
    () => ({
      pending: list.filter((r: any) => r.status === 'PENDING').length,
      approved: list.filter((r: any) => r.status === 'APPROVED').length,
      rejected: list.filter((r: any) => r.status === 'REJECTED').length,
      flagged: list.filter((r: any) => r.status === 'FLAGGED').length,
    }),
    [list]
  );

  const handleApprove = async (id: string) => {
    await approveMutation.mutateAsync(id);
  };

  const handleReject = async () => {
    if (!showRejectModal) return;
    await rejectMutation.mutateAsync({ id: showRejectModal.id, reason: rejectReason });
  };

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
  };

  const hasFilters = search || typeFilter || statusFilter;

  const renderActions = (r: any) =>
    r.status === 'PENDING' && (
      <>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => handleApprove(r.id)}
          isLoading={approveMutation.isPending}
          title="Approuver"
        >
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          Approuver
        </Button>
        <Button variant="ghost" size="xs" onClick={() => setShowRejectModal(r)} title="Rejeter">
          <XCircle className="h-3.5 w-3.5 text-red-500" />
          Rejeter
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={() => flagMutation.mutate(r.id)}
          isLoading={flagMutation.isPending}
          title="Escalader"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          Flag
        </Button>
      </>
    );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Modération des contenus"
        description="File de signalements et modération des contenus multimédias"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Admin', href: '/dashboard/admin' },
          { label: 'Média' },
          { label: 'Signalements' },
        ]}
      />

      {isLoading ? (
        <Loader className="py-20" />
      ) : isError ? (
        <Card padding="none">
          <ErrorState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="Impossible de charger les signalements"
            message="Le service de modération est injoignable. Vérifiez votre connexion ou réessayez."
            onRetry={() => refetch()}
          />
        </Card>
      ) : (
        <>
          {/* KPI header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              icon={<Clock className="h-5 w-5" />}
              iconBg="bg-amber-50 dark:bg-amber-900/30"
              iconColor="text-amber-600 dark:text-amber-400"
              label="En attente"
              value={stats.pending}
            />
            <StatsCard
              icon={<ShieldCheck className="h-5 w-5" />}
              iconBg="bg-emerald-50 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              label="Approuvés"
              value={stats.approved}
            />
            <StatsCard
              icon={<ShieldX className="h-5 w-5" />}
              iconBg="bg-red-50 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
              label="Rejetés"
              value={stats.rejected}
            />
            <StatsCard
              icon={<Flag className="h-5 w-5" />}
              iconBg="bg-gray-50 dark:bg-gray-800"
              iconColor="text-gray-600 dark:text-gray-400"
              label="Signalés (escalade)"
              value={stats.flagged}
            />
          </div>

          {/* Filters */}
          <Card padding="md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="">Tous les types</option>
                {CONTENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {CONTENT_TYPE_LABELS[t] || t}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="">Tous les statuts</option>
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s] || s}
                  </option>
                ))}
              </select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} disabled={isFetching}>
                  <Filter className="h-4 w-4" />
                  Effacer
                </Button>
              )}
            </div>
          </Card>

          {/* Table */}
          <Card padding="none">
            {filtered.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="p-4 font-medium">Signaleur</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">Contenu ID</th>
                      <th className="p-4 font-medium">Raison</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Statut</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r: any) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-4 font-semibold text-gray-900 dark:text-gray-100">
                          {reporterName(r)}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${CONTENT_TYPE_COLORS[r.contentType] || 'bg-gray-100 text-gray-600'}`}
                          >
                            {CONTENT_TYPE_LABELS[r.contentType] || r.contentType}
                          </span>
                        </td>
                        <td className="p-4 text-gray-500 text-xs font-mono">{r.contentId}</td>
                        <td className="p-4 text-gray-500 max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-4 text-gray-500 text-xs">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : '-'}
                        </td>
                        <td className="p-4">
                          <Badge variant={STATUS_BADGE[r.status] || 'default'} size="xs" dot>
                            {STATUS_LABELS[r.status] || r.status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="xs" onClick={() => setDetailDrawer(r)}>
                              <Eye className="h-3.5 w-3.5" />
                              Détails
                            </Button>
                            {renderActions(r)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={<Flag className="h-8 w-8" />}
                title="Aucun signalement"
                description={
                  hasFilters
                    ? 'Aucun signalement ne correspond aux filtres.'
                    : 'Aucun signalement à modérer.'
                }
              />
            )}
          </Card>
        </>
      )}

      {/* Detail Drawer */}
      <Drawer
        isOpen={!!detailDrawer}
        onClose={() => setDetailDrawer(null)}
        icon={<Flag className="h-5 w-5" />}
        title="Détails du signalement"
        subtitle={detailDrawer?.contentId}
        footer={
          detailDrawer?.status === 'PENDING' ? (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailDrawer(null);
                  setShowRejectModal(detailDrawer);
                }}
              >
                <XCircle className="h-4 w-4" />
                Rejeter
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApprove(detailDrawer.id)}
                isLoading={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4" />
                Approuver
              </Button>
            </div>
          ) : undefined
        }
      >
        {detailDrawer && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand shrink-0">
                  <User className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Signaleur
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {reporterName(detailDrawer)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Type
                </p>
                <Badge
                  variant={
                    detailDrawer.contentType === 'STORY'
                      ? 'purple'
                      : detailDrawer.contentType === 'SHORT'
                        ? 'info'
                        : detailDrawer.contentType === 'LIVE'
                          ? 'danger'
                          : detailDrawer.contentType === 'OFFER'
                            ? 'success'
                            : 'warning'
                  }
                  size="sm"
                >
                  {CONTENT_TYPE_LABELS[detailDrawer.contentType] || detailDrawer.contentType}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Contenu ID
                </p>
                <p className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {detailDrawer.contentId}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Date
                </p>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {detailDrawer.createdAt
                    ? new Date(detailDrawer.createdAt).toLocaleString('fr-FR')
                    : '-'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Raison
              </p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{detailDrawer.reason}</p>
            </div>
            {detailDrawer.description && (
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                  {detailDrawer.description}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                Statut
              </p>
              <Badge variant={STATUS_BADGE[detailDrawer.status] || 'default'} size="sm" dot>
                {STATUS_LABELS[detailDrawer.status] || detailDrawer.status}
              </Badge>
            </div>
          </div>
        )}
      </Drawer>

      {/* Reject with reason Modal */}
      <Modal
        open={!!showRejectModal}
        onClose={() => {
          setShowRejectModal(null);
          setRejectReason('');
        }}
        title="Rejeter le signalement"
        description="Ajoutez un motif de rejet"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Motif du rejet
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="Expliquez pourquoi ce signalement est rejeté..."
              className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all duration-200"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowRejectModal(null);
                setRejectReason('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              isLoading={rejectMutation.isPending}
              disabled={!rejectReason.trim()}
            >
              <XCircle className="h-4 w-4" />
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
